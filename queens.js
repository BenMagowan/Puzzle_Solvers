function display(GRID, QUEENS) {
    const N = 8;
    const CELL_WIDTH = 3; // adjust as needed for spacing

    // ...existing code: create rows arrays...
    const rows = [];
    const queenPositions = [];
    for (let i = 0; i < N; i++) {
        rows.push(GRID.slice(i * N, (i + 1) * N));
        queenPositions.push(QUEENS.slice(i * N, (i + 1) * N));
    }

    function getCorner(i, row, previousRow) {
        if (previousRow === null) {
            if (i === 0) return "┌";
            return row[i] !== row[i - 1] ? "┬" : "─";
        }
        if (i === 0) return "│";

        let topLeft = previousRow[i - 1], topRight = previousRow[i];
        let bottomLeft = row[i - 1], bottomRight = row[i];

        if (topLeft === bottomLeft && topLeft === topRight && topRight === bottomRight) return " ";
        if (topLeft === topRight && topRight === bottomLeft) return "┌";
        if (topLeft === topRight && topRight === bottomRight) return "┐";
        if (bottomLeft === bottomRight && bottomLeft === topLeft) return "└";
        if (bottomLeft === bottomRight && bottomLeft === topRight) return "┘";
        if (topLeft === bottomLeft && topRight !== bottomRight) return "├";
        if (topRight === bottomRight && topLeft !== bottomLeft) return "┤";
        if (bottomLeft === bottomRight && topLeft !== topRight) return "┴";
        if (topLeft === topRight && bottomLeft !== bottomRight) return "┬";
        if (topLeft === bottomLeft && topRight === bottomRight) return "│";
        if (topLeft === topRight && bottomLeft === bottomRight) return "─";
        return "┼";
    }

    function printBorder(row, previousRow) {
        let border = "";
        for (let i = 0; i < N; i++) {
            let corner = getCorner(i, row, previousRow);
            if (previousRow === null || previousRow[i] !== row[i]) {
                border += corner + "─".repeat(CELL_WIDTH);
            } else {
                border += corner + " ".repeat(CELL_WIDTH);
            }
        }
        if (previousRow === null) {
            border += "┐";
        } else if (row[N - 1] !== previousRow[N - 1]) {
            border += "┤";
        } else {
            border += "│";
        }
        console.log(border);
    }

    function printContent(row, queenRow) {
        let line = "│";
        for (let i = 0; i < N; i++) {
            line += queenRow[i] === 'Q' ? "Q".padStart(Math.floor((CELL_WIDTH + 1) / 2)).padEnd(CELL_WIDTH) : " ".repeat(CELL_WIDTH);
            if (i < N - 1) line += row[i] !== row[i + 1] ? "│" : " ";
        }
        line += "│";
        console.log(line);
    }

    function printFinalBorder(lastRow) {
        let line = "└" + "─".repeat(CELL_WIDTH);
        for (let i = 1; i < N; i++) {
            if (lastRow[i - 1] === lastRow[i]) {
                line += "─".repeat(CELL_WIDTH + 1);
            } else {
                line += "┴" + "─".repeat(CELL_WIDTH);
            }
        }
        console.log(line + "┘");
    }

    function printGrid(rows, queenPositions) {
        let previousRow = null;
        for (let j = 0; j < rows.length; j++) {
            printBorder(rows[j], previousRow);
            printContent(rows[j], queenPositions[j]);
            previousRow = rows[j];
        }
        printFinalBorder(rows[rows.length - 1]);
    }

    printGrid(rows, queenPositions);
}

function findEmptyColour(GRID, QUEENS) {
    const colours = Array.from(new Set(GRID));
    colours.sort((a, b) => GRID.filter(c => c === a).length - GRID.filter(c => c === b).length);
    for (let colour of colours) {
        let found = true;
        for (let i = 0; i < GRID.length; i++) {
            if (GRID[i] === colour && QUEENS[i] === 'Q') {
                found = false;
                break;
            }
        }
        if (found) return colour;
    }
    return null;
}

function isValid(GRID, QUEENS, i, colour) {
    const N = 8;
    if (GRID[i] !== colour) return false;

    for (let j = 0; j < GRID.length; j++) {
        if (QUEENS[j] === 'Q' && GRID[j] === GRID[i]) return false;
    }

    // Check row
    const rowStart = i - (i % N);
    if (QUEENS.slice(rowStart, rowStart + N).includes('Q')) return false;

    // Check column
    for (let j = i % N; j < GRID.length; j += N) {
        if (QUEENS[j] === 'Q') return false;
    }

    // Check 3x3 neighbourhood
    const row = Math.floor(i / N), col = i % N;
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < N && c >= 0 && c < N && QUEENS[r * N + c] === 'Q') {
                return false;
            }
        }
    }
    return true;
}

function solve(GRID, QUEENS) {
    const colour = findEmptyColour(GRID, QUEENS);
    if (colour === null) return true;

    for (let i = 0; i < GRID.length; i++) {
        if (isValid(GRID, QUEENS, i, colour)) {
            QUEENS[i] = 'Q';
            if (solve(GRID, QUEENS)) return true;
            QUEENS[i] = '.'; // backtrack
        }
    }
    return false;
}

// ...existing code: initialize GRID and QUEENS...
let GRID = '1111222213334242113444441134545413335456177758561717555611177666'.split('');
let QUEENS = '................................................................'.split('');

// Main execution
display(GRID, QUEENS);
let startTime = Date.now();
if (solve(GRID, QUEENS)) {
    console.log("Solution found in " + ((Date.now() - startTime) / 1000).toFixed(2) + " seconds");
    display(GRID, QUEENS);
} else {
    console.log("No solution found");
}

export { solve, display };
