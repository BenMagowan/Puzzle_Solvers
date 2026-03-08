function display(grid, walls) {
    const N = Math.sqrt(grid.length);
    const CELL_WIDTH = 3;
    const wallSet = new Set(walls.map(pair => JSON.stringify(pair.sort())));

    function hasVerticalWall(r, c) {
        const idx = r * N + c;
        const idxRight = r * N + (c + 1);
        return wallSet.has(JSON.stringify([idx, idxRight].sort()));
    }

    function hasHorizontalWall(r, c) {
        const idx = r * N + c;
        const idxBelow = (r + 1) * N + c;
        return wallSet.has(JSON.stringify([idx, idxBelow].sort()));
    }

    function displayBorder(top = true) {
        const left = top ? '┌' : '└';
        const right = top ? '┐' : '┘';
        let line = left;
        for (let c = 0; c < N - 1; c++) {
            line += '─'.repeat(CELL_WIDTH + 1);
        }
        line += '─'.repeat(CELL_WIDTH) + right;
        console.log(line);
    }

    displayBorder(true);

    for (let r = 0; r < N; r++) {
        let rowLine = '│';
        for (let c = 0; c < N; c++) {
            const idx = r * N + c;
            const cellText = grid[idx] !== 0 ? grid[idx].toString() : ' ';
            rowLine += cellText.padStart(Math.floor(CELL_WIDTH / 2) + 1).padEnd(CELL_WIDTH);
            if (c < N - 1) {
                rowLine += hasVerticalWall(r, c) ? '│' : ' ';
            } else {
                rowLine += '│';
            }
        }
        console.log(rowLine);

        if (r < N - 1) {
            let sepLine = '│';
            for (let c = 0; c < N; c++) {
                sepLine += hasHorizontalWall(r, c) ? '─'.repeat(CELL_WIDTH) : ' '.repeat(CELL_WIDTH);
                if (c < N - 1) {
                    sepLine += hasVerticalWall(r, c) ? '│' : ' ';
                } else {
                    sepLine += '│';
                }
            }
            console.log(sepLine);
        }
    }

    displayBorder(false);
}

function solve(grid, path, walls) {
    function findEmptyCells(path, walls, N) {
        const end = path.indexOf(Math.max(...path));
        const emptyCells = [];

        if (end - N >= 0 && path[end - N] === 0 && !walls.some(coord => coord[0] === end && coord[1] === end - N)) {
            emptyCells.push(end - N);
        }
        if (end + N < N * N && path[end + N] === 0 && !walls.some(coord => coord[0] === end && coord[1] === end + N)) {
            emptyCells.push(end + N);
        }
        if (end % N > 0 && path[end - 1] === 0 && !walls.some(coord => coord[0] === end && coord[1] === end - 1)) {
            emptyCells.push(end - 1);
        }
        if (end % N < N - 1 && path[end + 1] === 0 && !walls.some(coord => coord[0] === end && coord[1] === end + 1)) {
            emptyCells.push(end + 1);
        }

        return emptyCells;
    }

    function isValid(grid, path) {
        const locations = grid.map((val, idx) => val !== 0 ? idx : -1).filter(idx => idx !== -1);
        locations.sort((a, b) => grid[a] - grid[b]);

        for (let i = 0; i < locations.length - 1; i++) {
            if (path[locations[i + 1]] !== 0) {
                if (path[locations[i]] > path[locations[i + 1]]) {
                    return false;
                }
                if (path[locations[i]] === 0 && path[locations[i + 1]] !== 0) {
                    return false;
                }
            }
        }

        return true;
    }

    const N = Math.sqrt(grid.length);
    const nextNum = Math.max(...path) + 1;

    if (nextNum > N * N) {
        return true;
    }

    const emptyCells = findEmptyCells(path, walls, N);

    if (emptyCells.length === 0) {
        return false;
    }

    for (const emptyCell of emptyCells) {
        if (isValid(grid, path)) {
            path[emptyCell] = nextNum;

            // Changed recursive call to pass walls parameter
            if (solve(grid, path, walls)) {
                return true;
            }

            path[emptyCell] = 0;
        }
    }

    return false;
}

export { solve, display };