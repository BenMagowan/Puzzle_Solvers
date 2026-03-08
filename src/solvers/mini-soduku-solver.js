export const miniSudokuSolver = {
    // Scrape the grid data from the DOM
    extractGrid: () => {
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
        return [miniSudokuGrid];
    },

    // Solve the puzzle with backtracking
    solve: (grid) => {
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
    },

    overlay: (solution) => {
        console.log('Overlaying solution on the page:', solution);
    }
}


function display(grid) {
    for (let i = 0; i < 6; i++) {
        if (i % 2 === 0 && i !== 0) {
            console.log("─".repeat(6) + "┼" + "─".repeat(7));
        }
        let row = "";
        for (let j = 0; j < 6; j++) {
            if (j % 3 === 0 && j !== 0) {
                row += "│ ";
            }
            row += grid[i * 6 + j] + " ";
        }
        console.log(row);
    }
}
