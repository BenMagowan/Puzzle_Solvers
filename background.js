import * as queensSolver from './puzzles/queensSolver.js';
import * as zipSolver from './puzzles/zipSolver.js';
import * as tangoSolver from './puzzles/tangoSolver.js';

const LINKEDIN_GAMES_URL = 'https://www.linkedin.com/games/';

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({ text: 'ON' });
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
        await removeOverlay(tab.id);
    }
}

async function initialiseExtension(tab) {
    const puzzleType = tab.url.split(LINKEDIN_GAMES_URL)[1].slice(0, -1);
    console.log('Solving...', puzzleType);

    const gridData = await getGridData(tab.id, puzzleType);
    if (!gridData) {
        console.log('No grid found');
        return;
    } else {
        console.log('Grid data:', gridData);
    }

    const solution = findSolution(gridData, puzzleType);
    if (!solution) {
        console.log('No solution found');
        return;
    } else {
        console.log('Solution:', solution);
    }

    await displayOverlay(tab.id, solution, puzzleType);
}

async function getGridData(tabId, puzzleType) {
    switch (puzzleType) {
        case 'queens':
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: () => {
                    const queensGrid = document.getElementById("queens-grid");
                    if (!queensGrid) return null;

                    const cells = queensGrid.querySelectorAll(".queens-cell-with-border");

                    var colorString = [];
                    cells.forEach(cell => {
                        const colorClass = Array.from(cell.classList).find(cls => cls.startsWith("cell-color-"));
                        if (colorClass) {
                            const colorNumber = colorClass.split("cell-color-")[1].trim();
                            colorString.push(colorNumber);
                        }
                    });
                    return colorString;
                }
            });
            const queensGrid = results[0].result;
            const queens = new Array(queensGrid.length).fill('.');

            return [queensGrid, queens];
        case 'zip':
            const zipGrid = [
                6, 0, 0, 0, 0, 5,
                0, 0, 0, 0, 0, 0,
                0, 7, 1, 8, 2, 0,
                0, 0, 0, 0, 0, 0,
                3, 0, 0, 0, 0, 4,
                0, 0, 0, 0, 0, 0
            ]

            const walls = [
            ];

            const path = zipGrid.map(value => value === 1 ? 1 : 0);

            return [zipGrid, walls, path];
        case 'tango':
            const tangoResults = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: () => {
                    const tangoGridElement = document.querySelector(".lotka-grid");
                    if (!tangoGridElement) return null;

                    const cells = tangoGridElement.querySelectorAll(".lotka-cell");

                    var tangoGrid = [];
                    var sameType = [];
                    var oppositeType = [];

                    cells.forEach((cell, index) => {
                        const svgElements = cell.querySelectorAll('svg');
                        const cellContent = Array.from(svgElements).map(svgElement => svgElement.getAttribute('aria-label'));
                        // check if the cell class contains lotka-cell--locked
                        if (cell.classList.contains('lotka-cell--locked')) {
                            if (cellContent.includes('Sun')) {
                                tangoGrid.push(1);
                            } else if (cellContent.includes('Moon')) {
                                tangoGrid.push(2);
                            }
                        } else {
                            tangoGrid.push(0);
                        }

                        if (cellContent.includes('Equal')) {
                            sameType.push([index, index + 1]);
                        } else if (cellContent.includes('Cross')) {
                            oppositeType.push([index, index + 1]);
                        }

                    });

                    return [tangoGrid, sameType, oppositeType];
                }
            });
            const tangoGrid = tangoResults[0].result[0];
            var sameType = tangoResults[0].result[1];
            var oppositeType = tangoResults[0].result[2];

            sameType = sameType.concat(sameType.map(([a, b]) => [b, a]));
            oppositeType = oppositeType.concat(oppositeType.map(([a, b]) => [b, a]));

            return [tangoGrid, sameType, oppositeType];
        default:
            console.log('Unknown puzzle type');
            return null;
    }
}

function findSolution(gridData, puzzleType) {
    switch (puzzleType) {
        case 'queens':
            const queensGrid = gridData[0];
            const queens = gridData[1];

            if (!queensSolver.solve(queensGrid, queens)) return null;

            queensSolver.display(queensGrid, queens);

            return queens;
        case 'zip':
            const zipGrid = gridData[0];
            const walls = gridData[1];
            const path = gridData[2];

            if (!zipSolver.solve(zipGrid, path, walls)) return null;

            zipSolver.display(path, walls);

            return path;
        case 'tango':
            const tangoGrid = gridData[0];
            const sameType = gridData[1];
            const oppositeType = gridData[2];

            if (!tangoSolver.solve(tangoGrid, sameType, oppositeType)) return null;

            tangoSolver.display(tangoGrid, sameType, oppositeType);

            return tangoGrid;
        default:
            console.log('Unknown puzzle type');
            return null;
    }
}

async function removeOverlay(tabId) {
    await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
            document.querySelectorAll('.cell-overlay').forEach(el => el.remove());
            if (window.gridObserver) {
                window.gridObserver.disconnect();
                delete window.gridObserver;
            }
        }
    });
}

async function displayOverlay(tabId, solution, puzzleType) {
    await chrome.scripting.executeScript({
        target: { tabId },
        args: [solution, puzzleType],
        function: (solution, puzzleType) => {
            var grid = null;
            // Get current grid state
            switch (puzzleType) {
                case 'queens':
                    var grid = document.getElementById("queens-grid");
                    break;
                case 'zip':
                    var grid = document.querySelector(".trail-grid");
                    break;
                case 'tango':
                    var grid = document.querySelector(".lotka-grid");
                    break;
            }

            if (!grid) {
                console.log('No grid found');
                if (window.gridObserver) {
                    window.gridObserver.disconnect();
                    delete window.gridObserver;
                }
            }

            document.querySelectorAll('.cell-overlay').forEach(el => el.remove());
            if (window.gridObserver) {
                window.gridObserver.disconnect();
                delete window.gridObserver;
            }

            // Create mutation observer
            const observer = new MutationObserver(() => {
                chrome.runtime.sendMessage({ type: 'updateGrid' });
            });

            // Start observing grid changes
            observer.observe(grid, {
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'aria-label']
            });

            window.gridObserver = observer;

            // Create visual overlays
            switch (puzzleType) {
                case 'queens':
                    grid.querySelectorAll(".queens-cell-with-border").forEach((cell, index) => {
                        const overlay = createOverlayElement(cell, solution[index]);
                        cell.appendChild(overlay);
                    });
                    break;
                case 'zip':
                    grid.querySelectorAll(".trail-cell").forEach((cell, index) => {
                        const overlay = createOverlayElement(cell, solution[index]);
                        cell.appendChild(overlay);
                    });
                    break;
                case 'tango':
                    grid.querySelectorAll(".lotka-cell").forEach((cell, index) => {
                        const overlay = createOverlayElement(cell, solution[index]);
                        cell.appendChild(overlay);
                    });
                    break;
            }

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
                    zIndex: '100',
                    pointerEvents: 'none'
                });

                // Color logic
                switch (puzzleType) {
                    case 'queens':
                        const isQueenCell = cell.getAttribute('aria-label').startsWith('Queen');
                        const isCorrectPosition = solutionState === 'Q';

                        if (isQueenCell) {
                            overlay.style.backgroundColor = isCorrectPosition
                                ? 'rgba(0, 0, 0, 0)'        // Correct position - transparent
                                : 'rgba(255, 0, 0, 0.75)';  // Incorrect position - red
                        } else if (isCorrectPosition) {
                            overlay.style.backgroundColor = 'rgba(0, 255, 0, 0.75)'; // Suggested position - green
                        }
                        break;
                    case 'zip':
                        // gradient from green to red to blue from 0 to 36
                        // 0, 255, 0 -> 255, 0, 0 -> 0, 0, 255
                        const greenValue = Math.max(Math.min(255 - solutionState * 14.2, 255), 0);
                        const redValue = Math.max(Math.min(255 - Math.abs(255 - solutionState * 14.2), 255), 0);
                        const blueValue = Math.max(Math.min(solutionState * 14.2 - 255, 255), 0);
                        overlay.style.backgroundColor = `rgba(${redValue}, ${greenValue}, ${blueValue}, 0.75)`; // Suggested position - green
                        break;
                    case 'tango':
                        // Check aria-label of the cells child div with class lotka-cell-content
                        const cellState = cell.querySelector('svg').getAttribute('aria-label');

                        // 0: empty, 1: sun, 2: moon
                        if (cellState !== 'Sun' && solutionState === 1) {
                            overlay.style.backgroundColor = 'rgba(255, 255, 0, 0.75)';  // Sun - yellow
                        } else if (cellState !== 'Moon' && solutionState === 2) {
                            overlay.style.backgroundColor = 'rgba(0, 0, 255, 0.75)';    // Moon - blue
                        } else {
                            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';         // Empty - transparent
                        }
                }

                return overlay;
            }
        }
    });
}

// When the grid is updated
chrome.runtime.onMessage.addListener(async (request, sender) => {
    if (request.type === 'updateGrid') {
        await initialiseExtension(sender.tab);
    }
});

// When the user clicks on the extension action
chrome.action.onClicked.addListener(toggleSolution);

// When the tab is updated
chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active && tab.url) {
        console.log('Tab updated', tab.url);
        if (!tab.url.startsWith(LINKEDIN_GAMES_URL)) return;

        const curState = await chrome.action.getBadgeText({ tabId: tab.id });
        if (curState === 'ON') {
            await initialiseExtension(tab);
        } else {
            await removeOverlay(tab.id);
        }
    }
});
