// Mini Sudoku solver
console.log('[MINISUDOKU] Script loaded');

function extractGrid() {
    const miniSudokuGridElement = document.querySelector('.sudoku-grid');
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
    return miniSudokuGrid;
}

function solve(grid) {
    function findEmpty(grid) {
        for (let i = 0; i < grid.length; i++) {
            if (grid[i] === ".") {
                return i;
            }
        }
        return -1;
    }

    function isValid(grid, pos, num) {
        const row = Math.floor(pos / 6);
        const col = pos % 6;

        // Check row and column
        for (let i = 0; i < 6; i++) {
            if (grid[row * 6 + i] === num) {
                return false;
            }
            if (grid[i * 6 + col] === num) {
                return false;
            }
        }

        // Check 3x2 grid
        const startRow = row - (row % 2);
        const startCol = col - (col % 3);

        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[(startRow + i) * 6 + (startCol + j)] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    const pos = findEmpty(grid);

    if (pos === -1) {
        return true;
    }

    for (let num = 1; num <= 6; num++) {
        const numStr = num.toString();
        if (isValid(grid, pos, numStr)) {
            grid[pos] = numStr;

            if (solve(grid)) {
                return true;
            }

            grid[pos] = ".";
        }
    }

    return false;
}

function overlay(solution) {
    console.log('[MINISUDOKU] Solution:', solution);
    const sudokuCells = document.querySelectorAll('.sudoku-cell');
    sudokuCells.forEach((cell, index) => {
        if (!cell.classList.contains('sudoku-cell-prefilled')) {
            cell.textContent = solution[index];
            cell.style.color = '#2196F3';
        }
    });
}

function init() {
    console.log('[MINISUDOKU] Initializing solver');
    const grid = extractGrid();
    if (!grid) {
        console.error('[MINISUDOKU] Failed to extract grid');
        return;
    }
    console.log('[MINISUDOKU] Extracted grid:', grid);

    const solution = [...grid];
    if (!solve(solution)) {
        console.error('[MINISUDOKU] No solution found');
        return;
    }
    console.log('[MINISUDOKU] Solution found:', solution);
    overlay(solution);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 1000);
}
