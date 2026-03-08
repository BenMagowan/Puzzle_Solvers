// Queens solver
console.log('[QUEENS] Script loaded');

function extractGrid() {
    // TODO: Implement grid extraction for Queens puzzle
    return null;
}

function solve(grid, queens) {
    function findEmptyColour(grid, queens) {
        const colours = Array.from(new Set(grid));
        colours.sort((a, b) => grid.filter(c => c === a).length - grid.filter(c => c === b).length);
        for (let colour of colours) {
            let found = true;
            for (let i = 0; i < grid.length; i++) {
                if (grid[i] === colour && queens[i] === 'Q') {
                    found = false;
                    break;
                }
            }
            if (found) return colour;
        }
        return null;
    }

    function isValid(grid, queens, i, colour) {
        const N = Math.sqrt(grid.length);
        if (grid[i] !== colour) return false;

        for (let j = 0; j < grid.length; j++) {
            if (queens[j] === 'Q' && grid[j] === grid[i]) return false;
        }

        // Check row
        const rowStart = i - (i % N);
        if (queens.slice(rowStart, rowStart + N).includes('Q')) return false;

        // Check column
        for (let j = i % N; j < grid.length; j += N) {
            if (queens[j] === 'Q') return false;
        }

        // Check 3x3 neighbourhood
        const row = Math.floor(i / N), col = i % N;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < N && c >= 0 && c < N && queens[r * N + c] === 'Q') {
                    return false;
                }
            }
        }
        return true;
    }

    const colour = findEmptyColour(grid, queens);
    if (colour === null) return true;

    for (let i = 0; i < grid.length; i++) {
        if (isValid(grid, queens, i, colour)) {
            queens[i] = 'Q';
            if (solve(grid, queens)) return true;
            queens[i] = '.';
        }
    }
    return false;
}

function overlay(solution) {
    console.log('[QUEENS] Solution:', solution);
    // TODO: Implement overlay for Queens puzzle
}

function init() {
    console.log('[QUEENS] Initializing solver');
    const grid = extractGrid();
    if (!grid) {
        console.error('[QUEENS] Failed to extract grid');
        return;
    }
    
    const queens = new Array(grid.length).fill('.');
    if (!solve(grid, queens)) {
        console.error('[QUEENS] No solution found');
        return;
    }
    console.log('[QUEENS] Solution found:', queens);
    overlay(queens);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 1000);
}
