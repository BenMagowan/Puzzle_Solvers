// Zip solver
console.log('[ZIP] Script loaded');

function extractGrid() {
    // TODO: Implement grid extraction for Zip puzzle
    return null;
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

            if (solve(grid, path, walls)) {
                return true;
            }

            path[emptyCell] = 0;
        }
    }

    return false;
}

function overlay(solution) {
    console.log('[ZIP] Solution:', solution);
    // TODO: Implement overlay for Zip puzzle
}

function init() {
    console.log('[ZIP] Initializing solver');
    const data = extractGrid();
    if (!data) {
        console.error('[ZIP] Failed to extract grid');
        return;
    }
    
    const { grid, path, walls } = data;
    if (!solve(grid, path, walls)) {
        console.error('[ZIP] No solution found');
        return;
    }
    console.log('[ZIP] Solution found:', path);
    overlay(path);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 1000);
}
