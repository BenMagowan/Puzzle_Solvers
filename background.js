import * as queensSolver from './puzzles/queensSolver.js';
import * as zipSolver from './puzzles/zipSolver.js';
import * as tangoSolver from './puzzles/tangoSolver.js';
import * as miniSudokuSolver from './puzzles/miniSudokuSolver.js';

const LINKEDIN_GAMES_URL = 'https://www.linkedin.com/games/';

const Logger = {
    debug: (message, ...args) => {
        console.log(`[DEBUG] ${message}`, ...args);
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error);
        // Optionally send to analytics
    },
    info: (message, ...args) => {
        console.log(`[INFO] ${message}`, ...args);
    }
};

// On extension installation
chrome.runtime.onInstalled.addListener(() => {
    Logger.info('Extension installed');
    const defaultSettings = {
        'zipSolver': true,
        'mini-sudokuSolver': true,
        'tangoSolver': true,
        'queensSolver': true,
        'autoSolver': false,
        'persistentOverlay': false
    };
    chrome.storage.local.set(defaultSettings);
});

async function initialiseExtension(tab) {
    try {
        const puzzleType = tab.url.split(LINKEDIN_GAMES_URL)[1].split('/')[0];
        if (!['zip', 'mini-sudoku', 'tango', 'queens'].includes(puzzleType)) {
            Logger.info('Unsupported puzzle type:', puzzleType);
            await removeOverlay(tab.id);
            return;
        }

        const cachedResult = await chrome.storage.local.get(puzzleType + 'Solver');
        const solverEnabled = cachedResult[puzzleType + 'Solver'];

        if (!solverEnabled) {
            Logger.info('Solver disabled for puzzle type:', puzzleType);
            await removeOverlay(tab.id);
            return;
        } else {
            Logger.info('Solving puzzle type:', puzzleType);
        }

        const gridData = await getGridData(tab.id, puzzleType);
        Logger.debug('Grid data:', gridData);
        if (!gridData) {
            Logger.info('No grid found');
            await removeOverlay(tab.id);
            return;
        } else {
            Logger.info('Grid data found');
        }

        const solution = await findSolution(gridData, puzzleType);
        if (!solution) {
            Logger.info('No solution found');
            await removeOverlay(tab.id);
            return;
        } else {
            Logger.info('Solution found');
        }

        await displayOverlay(tab.id, solution, puzzleType);
    } catch (error) {
        Logger.error('Extension initialisation failed:', error);
        await removeOverlay(tab.id);
    }

}

async function getGridData(tabId, puzzleType) {
    const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        args: [puzzleType],
        function: async (puzzleType) => {
            function waitForElement(selector, timeout = 5000) {
                return new Promise((resolve, reject) => {
                    const existing = document.querySelector(selector);
                    if (existing) return resolve(existing);

                    const observer = new MutationObserver(() => {
                        const el = document.querySelector(selector);
                        if (el) {
                            observer.disconnect();
                            clearTimeout(timer);
                            resolve(el);
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    const timer = setTimeout(() => {
                        observer.disconnect();
                        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
                    }, timeout);
                });
            }

            switch (puzzleType) {
                case 'queens':
                    const queensGrid = document.getElementById("queens-grid");
                    if (!queensGrid) return null;

                    const queensCells = queensGrid.querySelectorAll(".queens-cell-with-border");

                    var colorString = [];
                    queensCells.forEach(cell => {
                        const colorClass = Array.from(cell.classList).find(cls => cls.startsWith("cell-color-"));
                        if (colorClass) {
                            const colorNumber = colorClass.split("cell-color-")[1].trim();
                            colorString.push(colorNumber);
                        }
                    });

                    const queens = new Array(colorString.length).fill('.');

                    return [colorString, queens];
                case 'zip':
                    // Was trail-grid
                    const zipGridElement = await waitForElement('[data-testid="interactive-grid"]');

                    // Was trail-cell
                    const zipCells = zipGridElement.querySelectorAll('[data-cell-idx]');

                    var zipGrid = [];
                    var walls = [];
                    const zipN = Math.sqrt(zipCells.length);
                    // Loop through each cell
                    zipCells.forEach((cell, index) => {
                        // Loop though each child of the cell
                        cell.querySelectorAll('div').forEach(child => {
                            const className = child.getAttribute('class');
                            // Was trail-cell-wall--right
                            if (className.includes('trail-cell-wall--right')) {
                                walls.push([index, index + 1]);
                            }
                            // Was trail-cell-wall--down
                            if (className.includes('trail-cell-wall--down')) {
                                walls.push([index, index + zipN]);
                            }
                            // Was trail-cell-content 
                            if (child.getAttribute('data-cell-content') === "true") {
                                zipGrid.push(Number(child.textContent.trim()));
                            }
                        });

                        // If the cell is empty, add a 0 to the grid
                        if (zipGrid.length < index + 1) {
                            zipGrid.push(0);
                        }
                    });

                    var path = zipGrid.map(value => value === 1 ? 1 : 0);

                    walls = walls.concat(walls.map(([a, b]) => [b, a]));
                    return [zipGrid, walls, path];
                case 'tango':
                    const tangoGridElement = document.querySelector(".lotka-grid");
                    if (!tangoGridElement) return null;

                    const tangoCells = tangoGridElement.querySelectorAll(".lotka-cell");

                    var tangoGrid = [];
                    var sameType = [];
                    var oppositeType = [];
                    const tangoN = Math.sqrt(tangoCells.length);

                    tangoCells.forEach((cell, index) => {
                        const svgElements = cell.querySelectorAll('svg');

                        // loop through the svg elements and get the aria-label
                        svgElements.forEach(svgElement => {
                            const ariaLabel = svgElement.getAttribute('aria-label');
                            if (ariaLabel) {
                                // Definetly a better way to do this
                                if (cell.classList.contains('lotka-cell--locked')) {
                                    if (ariaLabel === 'Sun' || ariaLabel === 'Gold moon') {
                                        tangoGrid.push(1);
                                    } else if (ariaLabel === 'Moon' || ariaLabel === 'Blue moon') {
                                        tangoGrid.push(2);
                                    } else if (ariaLabel === 'Empty') {
                                        tangoGrid.push(0);
                                    }
                                } else if (ariaLabel === 'Sun' || ariaLabel === 'Gold moon') {
                                    tangoGrid.push(0);
                                } else if (ariaLabel === 'Moon' || ariaLabel === 'Blue moon') {
                                    tangoGrid.push(0);
                                } else if (ariaLabel === 'Empty') {
                                    tangoGrid.push(0);
                                }

                                const parentClass = svgElement.parentElement.classList;
                                if (parentClass.contains('lotka-cell-edge--right')) {
                                    if (ariaLabel === 'Equal') {
                                        sameType.push([index, index + 1]);
                                    } else if (ariaLabel === 'Cross') {
                                        oppositeType.push([index, index + 1]);
                                    }
                                }
                                if (parentClass.contains('lotka-cell-edge--down')) {
                                    // Hardcoded for 6x6 grid
                                    if (ariaLabel === 'Equal') {
                                        sameType.push([index, index + tangoN]);
                                    } else if (ariaLabel === 'Cross') {
                                        oppositeType.push([index, index + tangoN]);
                                    }
                                }
                            }
                        }
                        );
                    });
                    sameType = sameType.concat(sameType.map(([a, b]) => [b, a]));
                    oppositeType = oppositeType.concat(oppositeType.map(([a, b]) => [b, a]));

                    return [tangoGrid, sameType, oppositeType];
                case 'mini-sudoku':
                    const miniSudokuGridElement = document.querySelector('.sudoku-board');
                    console.log(miniSudokuGridElement);
                    if (!miniSudokuGridElement) return null;
                    const sudokuCells = miniSudokuGridElement.querySelectorAll(".sudoku-cell");
                    var miniSudokuGrid = [];
                    sudokuCells.forEach(cell => {
                        if (cell.classList.contains('sudoku-cell-prefilled')) {
                            miniSudokuGrid.push(cell.textContent.trim());
                        } else {
                            miniSudokuGrid.push(".");
                        }
                    });
                    return [miniSudokuGrid];
                default:
                    console.log('Unknown puzzle type');
                    return null;
            }
        }

    });
    return results[0].result;
}

async function findSolution(gridData, puzzleType) {
    // Check if the puzzle has already been solved
    const cacheKey = `${puzzleType}-${JSON.stringify(gridData)}`;

    const cachedResult = await chrome.storage.local.get(cacheKey);

    if (cachedResult[cacheKey]) {
        console.log('Using cached result');
        return cachedResult[cacheKey];
    }

    // Solve the puzzle
    let solution = null;

    switch (puzzleType) {
        case 'queens':
            const queensGrid = gridData[0];
            const queens = gridData[1];

            if (!queensSolver.solve(queensGrid, queens)) return null;
            queensSolver.display(queensGrid, queens);
            solution = queens;
            break;

        case 'zip':
            const zipGrid = gridData[0];
            const walls = gridData[1];
            const path = gridData[2];

            if (!zipSolver.solve(zipGrid, path, walls)) return null;
            zipSolver.display(path, walls);
            solution = path;
            break;

        case 'tango':
            const tangoGrid = gridData[0];
            const sameType = gridData[1];
            const oppositeType = gridData[2];

            if (!tangoSolver.solve(tangoGrid, sameType, oppositeType)) return null;
            tangoSolver.display(tangoGrid, sameType, oppositeType);
            solution = tangoGrid;
            break;

        case 'mini-sudoku':
            const miniSudokuGrid = gridData[0];

            if (!miniSudokuSolver.solve(miniSudokuGrid)) return null;
            miniSudokuSolver.display(miniSudokuGrid);
            solution = miniSudokuGrid;
            break;

        default:
            console.log('Unknown puzzle type');
            return null;
    }

    // Cache the result
    await chrome.storage.local.set({ [cacheKey]: solution });

    return solution;
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
        function: async (solution, puzzleType) => {
            var grid = null;

            function waitForElement(selector, timeout = 5000) {
                return new Promise((resolve, reject) => {
                    const existing = document.querySelector(selector);
                    if (existing) return resolve(existing);

                    const observer = new MutationObserver(() => {
                        const el = document.querySelector(selector);
                        if (el) {
                            observer.disconnect();
                            clearTimeout(timer);
                            resolve(el);
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    const timer = setTimeout(() => {
                        observer.disconnect();
                        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
                    }, timeout);
                });
            }

            // Get current grid state
            switch (puzzleType) {
                case 'queens':
                    var grid = document.getElementById("queens-grid");
                    break;
                case 'zip':
                    var grid = await waitForElement('[data-testid="interactive-grid"]');
                    break;
                case 'tango':
                    var grid = document.querySelector(".lotka-grid");
                    break;
                case 'mini-sudoku':
                    var grid = document.querySelector(".sudoku-board");
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
                if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ type: 'updateGrid' });
                } else {
                    console.error('chrome.runtime.sendMessage is not available');
                }
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
                    grid.querySelectorAll('[data-cell-idx]').forEach((cell, index) => {
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
                case 'mini-sudoku':
                    grid.querySelectorAll(".sudoku-cell").forEach((cell, index) => {
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
                        // Dont like this solution - potential fix - update solutionState 
                        // If one of the children has data-testid="filled-cell"
                        if (cell.querySelector('[data-testid="filled-cell"]')) {
                            overlay.style.backgroudColor = 'rgba(0, 0, 0, 0)'; // Non-path - transparent
                        } else {
                            overlay.style.backgroundColor = `rgba(${redValue}, ${greenValue}, ${blueValue}, 0.75)`; // Path - gradient
                        }
                        break;
                    case 'tango':
                        // Check aria-label of the cells child div with class lotka-cell-content
                        const cellState = cell.querySelector('svg').getAttribute('aria-label');

                        // 0: empty, 1: sun, 2: moon
                        if (cellState !== 'Sun' && cellState !== 'Gold moon' && solutionState === 1) {
                            overlay.style.backgroundColor = 'rgba(255, 179, 30, 0.75)';  // Sun - yellow
                        } else if (cellState !== 'Moon' && cellState !== 'Blue moon' && solutionState === 2) {
                            overlay.style.backgroundColor = 'rgba(76, 140, 230, 0.75)';    // Moon - blue
                        } else {
                            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';         // Empty - transparent
                        }
                        break;
                    case 'mini-sudoku':
                        const cellText = cell.textContent.trim();
                        overlay.className = 'cell-overlay sudoku-cell-content';

                        if (cellText === solutionState) {
                            // Cell is correct
                            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';        // Correct position - transparent
                        } else if (cellText === "") {
                            // If the cell is empty and should be filled
                            overlay.style.backgroundColor = 'rgba(0, 255, 0, 0.75)'; // Suggested position - green
                            overlay.textContent = solutionState; // Show solution
                        } else {
                            // Cell is filled but incorrect
                            overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.75)';  // Incorrect position - red
                            overlay.textContent = solutionState; // Show solution
                        }
                        break;
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
    } else if (request.type === 'reinitialize') {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].url && tabs[0].url.startsWith(LINKEDIN_GAMES_URL)) {
            await initialiseExtension(tabs[0]);
        }
    }
});

// When the tab is updated
chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active && tab.url) {
        console.log('Tab updated', tab.url);

        if (!tab.url.startsWith(LINKEDIN_GAMES_URL)) return;

        await initialiseExtension(tab);
    }
});
