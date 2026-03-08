export function solve(grid) {
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
