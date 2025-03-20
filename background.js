// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { solve, display } from './queens.js';

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({ text: 'OFF' });
});

const LINKEDIN_GAMES_URL = 'https://www.linkedin.com/games/';

async function toggleSolution(tab) {
    if (!tab.url.startsWith(LINKEDIN_GAMES_URL)) return;

    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === 'ON' ? 'OFF' : 'ON';

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
        tabId: tab.id,
        text: nextState
    });

    if (nextState === 'ON') {
        await initialiseExtension(tab);
    } else if (nextState === 'OFF') {
        await cleanupExtension(tab);
    }
}

async function initialiseExtension(tab) {
    console.log('Displaying solution');

    // Get queens grid data
    const queensGridData = await getQueensGridData(tab.id);
    if (!queensGridData) {
        console.log('No queens grid found');
        return;
    }

    // Solve the queens problem
    const solution = calculateSolution(queensGridData);
    if (!solution) {
        console.log('No solution found');
        return;
    }

    // Display the overlay
    await updateGameOverlay(tab.id, solution);
}

async function cleanupExtension(tab) {
    console.log('Cleaning up extension');
    await removeOverlay(tab.id);
}

async function getQueensGridData(tabId) {
    const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            const queensGrid = document.getElementById("queens-grid");
            if (!queensGrid) return null;

            const cells = queensGrid.querySelectorAll(".queens-cell-with-border");

            let colorString = "";
            cells.forEach(cell => {
                const colorClass = Array.from(cell.classList).find(cls => cls.startsWith("cell-color-"));
                if (colorClass) {
                    const colorNumber = colorClass.split("cell-color-")[1].trim();
                    colorString += colorNumber;
                }
            });
            return colorString;
        }
    });
    return results[0].result;
}

function calculateSolution(queensGridData) {
    const grid = queensGridData.split('');
    const queens = new Array(grid.length).fill('.');



    if (!solve(grid, queens)) return null;

    display(grid, queens);

    return queens;
}

async function updateGameOverlay(tabId, solution) {
    await chrome.scripting.executeScript({
        target: { tabId },
        args: [solution],
        function: (solution) => {
            // Cleanup previous state
            const cleanup = () => {
                document.querySelectorAll('.queen-overlay').forEach(el => el.remove());
                if (window.queenObserver) {
                    window.queenObserver.disconnect();
                    delete window.queenObserver;
                }
            };

            cleanup();

            // Get current grid state
            const grid = document.getElementById("queens-grid");
            if (!grid) return;

            // Create mutation observer
            const observer = new MutationObserver(() => {
                // Debounce rapid mutations
                clearTimeout(window.queenUpdateTimeout);
                window.queenUpdateTimeout = setTimeout(() => {
                    chrome.runtime.sendMessage({ type: 'gridUpdate' });
                }, 100);
            });

            // Start observing grid changes
            observer.observe(grid, {
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'aria-label']
            });

            window.queenObserver = observer;

            // Create visual overlays
            grid.querySelectorAll(".queens-cell-with-border").forEach((cell, index) => {
                const overlay = createOverlayElement(cell, solution[index]);
                cell.appendChild(overlay);
            });

            /**
             * Creates a single overlay element
             */
            function createOverlayElement(cell, solutionState) {
                const overlay = document.createElement('div');
                overlay.className = 'queen-overlay';

                // Position styling
                Object.assign(overlay.style, {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    zIndex: '1000',
                    pointerEvents: 'none'
                });

                // Color logic
                const isQueenCell = cell.getAttribute('aria-label').startsWith('Queen');
                const isCorrectPosition = solutionState === 'Q';

                if (isQueenCell) {
                    overlay.style.backgroundColor = isCorrectPosition
                        ? 'rgba(0, 0, 0, 0)'  // Correct position - transparent
                        : 'rgba(255, 0, 0, 0.75)'; // Incorrect position - red
                } else if (isCorrectPosition) {
                    overlay.style.backgroundColor = 'rgba(0, 255, 0, 0.75)'; // Suggested position - green
                }

                return overlay;
            }
        }
    });
}

async function removeOverlay(tabId) {
    await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
            document.querySelectorAll('.queen-overlay').forEach(el => el.remove());
            if (window.queenObserver) {
                window.queenObserver.disconnect();
                delete window.queenObserver;
            }
        }
    });
}

chrome.runtime.onMessage.addListener(async (request, sender) => {
    if (request.type === 'gridUpdate') {
        const tabId = sender.tab.id;
        const colorString = await getQueensGridData(tabId);
        const solution = calculateSolution(colorString);
        if (solution) await updateGameOverlay(tabId, solution);
    }
});

// When the user clicks on the extension action
chrome.action.onClicked.addListener(toggleSolution);
