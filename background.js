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

import * as queensSolver from './puzzles/queensSolver.js';
import * as zipSolver from './puzzles/zipSolver.js';

const LINKEDIN_GAMES_URL = 'https://www.linkedin.com/games/';

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({ text: 'OFF' });
});

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
    const puzzleType = tab.url.split(LINKEDIN_GAMES_URL)[1].slice(0, -1);
    console.log('Solving...', puzzleType);

    switch (puzzleType) {
        case 'queens':
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
            await updateQueensOverlay(tab.id, solution);
            return;
        case 'zip':
            // Get zip grid data
            // const zipGridData = await getZipGridData(tab.id);
            // if (!zipGridData) {
            //     console.log('No zip grid found');
            //     return;
            // }

            // Solve the zip problem
            // const solution = calculateZipSolution(zipGridData);
            // if (!solution) {
            //     console.log('No solution found');
            //     return;
            // }

            const zipSolution = [
                3, 2, 33, 32, 25, 24,
                4, 1, 34, 31, 26, 23,
                5, 36, 35, 30, 27, 22,
                6, 11, 12, 29, 28, 21,
                7, 10, 13, 16, 17, 20,
                8, 9, 14, 15, 18, 19
            ]

            // Display the overlay
            await updateZipGameOverlay(tab.id, zipSolution);
            return;
        case 'tango':
            console.log('Tango puzzle not supported yet');
            return;
        case 'pinpoint':
            console.log('Pinpoint puzzle not supported yet');
            return;
        case 'crossclimb':
            console.log('Crossclimb puzzle not supported yet');
            return;
        default:
            console.log('Unknown puzzle type');
            return;
    }
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



    if (!queensSolver.solve(grid, queens)) return null;

    queensSolver.display(grid, queens);

    return queens;
}

async function updateQueensOverlay(tabId, solution) {
    await chrome.scripting.executeScript({
        target: { tabId },
        args: [solution],
        function: (solution) => {
            // Cleanup previous state
            const cleanup = () => {
                document.querySelectorAll('.cell-overlay').forEach(el => el.remove());
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
                    chrome.runtime.sendMessage({ type: 'updateGrid' });
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
                overlay.className = 'cell-overlay';

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

async function updateZipGameOverlay(tabId, solution) {
    await chrome.scripting.executeScript({
        target: { tabId },
        args: [solution],
        function: (solution) => {
            // Cleanup previous state
            document.querySelectorAll('.cell-overlay').forEach(el => el.remove());

            // Get current grid state class name contains "trail-grid"
            const grid = document.querySelector(".trail-grid");
            console.log(grid);
            if (!grid) return;

            // Create visual overlays
            grid.querySelectorAll(".trail-cell").forEach((cell, index) => {
                const overlay = createOverlayElement(cell, solution[index]);
                cell.appendChild(overlay);
            });

            /**
             * Creates a single overlay element
             */
            function createOverlayElement(cell, solutionState) {
                const overlay = document.createElement('div');
                overlay.className = 'cell-overlay';

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

                const greenValue = 255 - (255 / 36) * solutionState;
                const redValue = Math.min(255, Math.max(0, (255 / 36) * solutionState * 2));
                overlay.style.backgroundColor = `rgba(${redValue}, ${greenValue}, 0, 0.75)`; // Suggested position - green

                return overlay;
            }
        }
    });
}

async function removeOverlay(tabId) {
    await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
            document.querySelectorAll('.cell-overlay').forEach(el => el.remove());
            if (window.queenObserver) {
                window.queenObserver.disconnect();
                delete window.queenObserver;
            }
        }
    });
}

chrome.runtime.onMessage.addListener(async (request, sender) => {
    if (request.type === 'updateGrid') {
        await initialiseExtension(sender.tab);
    }
});

// When the user clicks on the extension action
chrome.action.onClicked.addListener(toggleSolution);
