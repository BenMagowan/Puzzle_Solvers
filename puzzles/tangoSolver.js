// 0 = empty, 1 = sun, 2 = moon
let grid = [
    0, 0, 0, 0, 0, 0,
    2, 0, 0, 0, 0, 0,
    1, 0, 0, 2, 0, 0,
    0, 0, 2, 0, 0, 0,
    0, 0, 0, 0, 0, 2,
    0, 0, 0, 0, 0, 0
];

const sameTypePairs = [
    [7, 8],
    [22, 23],
    [27, 28]
];
const sameType = sameTypePairs.concat(sameTypePairs.map(([a, b]) => [b, a]));

const oppositeTypePairs = [
    [12, 13]
];
const oppositeType = oppositeTypePairs.concat(oppositeTypePairs.map(([a, b]) => [b, a]));

function pairInList(list, a, b) {
    return list.some(pair => pair[0] === a && pair[1] === b);
}

function display(grid, sameType, oppositeType) {
    const N = 6;
    const CELL_WIDTH = 3;
    let topBorder = '┌' + (("─".repeat(CELL_WIDTH) + "┬").repeat(N - 1)) + "─".repeat(CELL_WIDTH) + '┐';
    console.log(topBorder);

    for (let i = 0; i < N; i++) {
        let rowStr = '│';
        for (let j = 0; j < N; j++) {
            let cellIndex = i * N + j;
            let symbol = ' ';
            if (grid[cellIndex] === 1) {
                symbol = '☀';
            } else if (grid[cellIndex] === 2) {
                symbol = '☽';
            }
            // Determine vertical divider between cell j and j+1.
            let divider = '│';
            if (j < N - 1) {
                let currentIndex = cellIndex;
                let nextIndex = cellIndex + 1;
                if (pairInList(sameType, currentIndex, nextIndex)) {
                    divider = '=';
                } else if (pairInList(oppositeType, currentIndex, nextIndex)) {
                    divider = 'x';
                }
            }
            // Pad cell content to CELL_WIDTH (here fixed as 3: one space, symbol, one space)
            rowStr += ' ' + symbol + ' ' + divider;
        }
        console.log(rowStr);

        // Print horizontal separator between rows (except after the last row)
        if (i !== N - 1) {
            let sep = '├';
            for (let j = 0; j < N; j++) {
                let currentIndex = i * N + j;
                let belowIndex = (i + 1) * N + j;
                let sepDivider = '─';
                if (pairInList(sameType, currentIndex, belowIndex)) {
                    sepDivider = '=';
                } else if (pairInList(oppositeType, currentIndex, belowIndex)) {
                    sepDivider = 'x';
                }
                // Build separator cell: left border, then the divider character repeated with padding.
                sep += "─" + sepDivider + "─" + (j === N - 1 ? "┤" : "┼");
            }
            console.log(sep);
        }
    }

    let bottomBorder = '└' + (("─".repeat(CELL_WIDTH) + "┴").repeat(N - 1)) + "─".repeat(CELL_WIDTH) + '┘';
    console.log(bottomBorder);
}

function findEmpty(grid) {
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] === 0) {
            return i;
        }
    }
    return -1;
}

function isValid(grid, sameType, oppositeType) {
    const N = 6;
    // Check rows for three consecutive same non-zero values
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N - 2; j++) {
            let a = grid[i * N + j];
            let b = grid[i * N + j + 1];
            let c = grid[i * N + j + 2];
            if (a !== 0 && a === b && b === c) {
                return false;
            }
        }
    }
    // Check columns for three consecutive same non-zero values
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N - 2; j++) {
            let a = grid[j * N + i];
            let b = grid[(j + 1) * N + i];
            let c = grid[(j + 2) * N + i];
            if (a !== 0 && a === b && b === c) {
                return false;
            }
        }
    }
    // Check same type pairs
    for (const [a, b] of sameType) {
        if (grid[a] !== 0 && grid[b] !== 0 && grid[a] !== grid[b]) {
            return false;
        }
    }
    // Check opposite type pairs
    for (const [a, b] of oppositeType) {
        if (grid[a] !== 0 && grid[b] !== 0 && grid[a] === grid[b]) {
            return false;
        }
    }

    // Check if more then 3 suns or moon in a row
    for (let i = 0; i < N; i++) {
        const row = grid.slice(i * N, i * N + N);
        const countSun = row.filter(cell => cell === 1).length;
        const countMoon = row.filter(cell => cell === 2).length;
        if (countSun > 3 || countMoon > 3) {
            return false;
        }
    }

    // Check if more then 3 suns or moon in a column
    for (let i = 0; i < N; i++) {
        const column = grid.filter((_, idx) => idx % N === i);
        const countSun = column.filter(cell => cell === 1).length;
        const countMoon = column.filter(cell => cell === 2).length;
        if (countSun > 3 || countMoon > 3) {
            return false;
        }
    }

    return true;
}

function solve(grid, sameType, oppositeType) {
    const pos = findEmpty(grid);
    if (pos === -1) {
        return true;
    }

    for (let num = 1; num <= 2; num++) {
        grid[pos] = num;
        if (isValid(grid, sameType, oppositeType)) {
            if (solve(grid, sameType, oppositeType)) {
                return true;
            }
        }
        grid[pos] = 0;
    }
    return false;
}

// Display the initial grid
display(grid, sameType, oppositeType);

const startTime = Date.now();
if (solve(grid, sameType, oppositeType)) {
    console.log(`Solution found in ${(Date.now() - startTime) / 1000} seconds`);
    display(grid, sameType, oppositeType);
} else {
    console.log('No solution found!');
}

export { solve, display };