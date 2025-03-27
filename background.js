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
    }

    const solution = findSolution(gridData, puzzleType);
    if (!solution) {
        console.log('No solution found');
        return;
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
        case 'zip':
            const zipGrid = [
                0, 0, 0, 0, 0, 0,
                0, 1, 0, 0, 0, 0,
                0, 4, 0, 0, 0, 0,
                0, 0, 0, 0, 3, 0,
                0, 0, 0, 0, 2, 0,
                0, 0, 0, 0, 0, 0
            ]

            const walls = [
                [6, 7],
                [12, 13],
                [18, 19],
                [24, 25],
                [10, 11],
                [16, 17],
                [22, 23],
                [28, 29]
            ];

            return [zipGrid, walls];
        default:
            console.log('Unknown puzzle type');
            return null;
    }
}

function findSolution(gridData, puzzleType) {
    switch (puzzleType) {
        case 'queens':
            const queensGrid = gridData.split('');
            const queens = new Array(queensGrid.length).fill('.');

            if (!queensSolver.solve(queensGrid, queens)) return null;

            queensSolver.display(queensGrid, queens);

            return queens;
        case 'zip':
            const zipGrid = gridData[0];
            const walls = gridData[1];

            const path = zipGrid.map(value => value === 1 ? 1 : 0);

            if (!zipSolver.solve(zipGrid, path, walls)) return null;

            zipSolver.display(path, walls);

            return path;
        default:
            console.log('Unknown puzzle type');
            return null;
    }
}

async function displayOverlay(tabId, solution, puzzleType) {
    await chrome.scripting.executeScript({
        target: { tabId },
        args: [solution, puzzleType],
        function: (solution, puzzleType) => {
            // Cleanup previous state
            document.querySelectorAll('.cell-overlay').forEach(el => el.remove());
            if (window.gridObserver) {
                window.gridObserver.disconnect();
                delete window.gridObserver;
            }

            // Create mutation observer
            const observer = new MutationObserver(() => {
                // Debounce rapid mutations
                clearTimeout(window.queenUpdateTimeout);
                window.queenUpdateTimeout = setTimeout(() => {
                    chrome.runtime.sendMessage({ type: 'updateGrid' });
                }, 100);
            });

            var grid = null;
            // Get current grid state
            switch (puzzleType) {
                case 'queens':
                    var grid = document.getElementById("queens-grid");
                    break;
                case 'zip':
                    var grid = document.querySelector(".trail-grid");
                    break;
            }

            if (!grid) return;

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
                    zIndex: '1000',
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
                        const greenValue = 255 - (255 / 36) * solutionState;
                        const redValue = Math.min(255, Math.max(0, (255 / 36) * solutionState * 2));
                        overlay.style.backgroundColor = `rgba(${redValue}, ${greenValue}, 0, 0.75)`; // Suggested position - green
                        break;
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
