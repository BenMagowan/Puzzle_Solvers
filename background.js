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
    chrome.action.setBadgeText({
        text: 'OFF'
    });
});

const games = 'https://www.linkedin.com/games/';

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url.startsWith(games)) {
        // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
        const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
        // Next state will always be the opposite
        const nextState = prevState === 'ON' ? 'OFF' : 'ON';

        // Set the action badge to the next state
        await chrome.action.setBadgeText({
            tabId: tab.id,
            text: nextState
        });

        if (nextState === 'ON') {
            console.log('Showing solution');
            // Get the grid
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
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

            const colorString = results[0].result;
            if (colorString) {
                // Prepare GRID and QUEENS using the color string and default queen string
                let GRIDFromPage = colorString.split('');
                let QUEENSFromPage = new Array(GRIDFromPage.length).fill('.');
                console.log("GRIDFromPage: ", GRIDFromPage);
                console.log("QUEENSFromPage: ", QUEENSFromPage);
                display(GRIDFromPage, QUEENSFromPage);
                if (solve(GRIDFromPage, QUEENSFromPage)) {
                    console.log("Puzzle solved!");
                    // Display overlay
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        args: [QUEENSFromPage],
                        function: (queens) => {
                            const queensGrid = document.getElementById("queens-grid");
                            if (!queensGrid) return null;
                            const cells = queensGrid.querySelectorAll(".queens-cell-with-border");

                            // Remove any existing overlays first
                            document.querySelectorAll('.queen-overlay').forEach(overlay => overlay.remove());

                            cells.forEach((cell, index) => {
                                if (queens[index] === 'Q') {
                                    // Create overlay for queen positions
                                    const overlay = document.createElement('div');
                                    overlay.classList.add('queen-overlay');
                                    Object.assign(overlay.style, {
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'rgba(255, 0, 0, 0.75)',
                                        zIndex: 100
                                    });

                                    cell.style.position = 'relative';
                                    cell.appendChild(overlay);
                                }
                            });
                        }
                    })
                } else {
                    console.log("No solution found for puzzle.");
                }
            } else {
                console.log("Element #queens-grid not found or has no div elements.");
            }
        } else if (nextState === 'OFF') {
            console.log('Hiding solution');
            // Remove overlay
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const queensGrid = document.getElementById("queens-grid");
                    if (!queensGrid) return null;
                    const cells = queensGrid.querySelectorAll(".queens-cell-with-border");

                    // Remove any existing overlays first
                    document.querySelectorAll('.queen-overlay').forEach(overlay => overlay.remove());
                }
            })
        }
    }
});
