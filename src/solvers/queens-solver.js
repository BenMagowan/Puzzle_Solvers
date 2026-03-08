/**
 * Queens puzzle solver
 *
 * Places exactly one queen per colour region on an NxN grid such that
 * no two queens share a row, column, or are adjacent (king-move).
 *
 * Loaded as a content script (non-module) — exposes a global function.
 *
 * @param {string[]} grid    Flat array of colour strings (length N*N)
 * @param {string[]} queens  Flat array pre-filled with '.' (mutated in-place)
 * @returns {boolean} true if a valid placement was found
 */
function solveQueens(grid, queens) {

    /**
     * Pick the next colour that has no queen yet, preferring colours with
     * fewer candidate cells (most-constrained-first heuristic).
     */
    function findEmptyColour(grid, queens) {
        var seen = {};
        for (var k = 0; k < grid.length; k++) {
            if (!seen[grid[k]]) seen[grid[k]] = 0;
            seen[grid[k]]++;
        }
        var colours = Object.keys(seen);
        colours.sort(function (a, b) { return seen[a] - seen[b]; });

        for (var ci = 0; ci < colours.length; ci++) {
            var colour = colours[ci];
            var hasQueen = false;
            for (var i = 0; i < grid.length; i++) {
                if (grid[i] === colour && queens[i] === 'Q') { hasQueen = true; break; }
            }
            if (!hasQueen) return colour;
        }
        return null;
    }

    /**
     * Check whether placing a queen at index i for the given colour is legal.
     */
    function isValid(grid, queens, i, colour) {
        var N = Math.sqrt(grid.length);

        // Must be the right colour
        if (grid[i] !== colour) return false;

        // Only one queen per colour region
        for (var j = 0; j < grid.length; j++) {
            if (queens[j] === 'Q' && grid[j] === grid[i]) return false;
        }

        // Only one queen per row
        var rowStart = i - (i % N);
        if (queens.slice(rowStart, rowStart + N).indexOf('Q') !== -1) return false;

        // Only one queen per column
        for (var c = i % N; c < grid.length; c += N) {
            if (queens[c] === 'Q') return false;
        }

        // No queen in any of the 8 surrounding cells (king-move adjacency)
        var row = Math.floor(i / N);
        var col = i % N;
        for (var r = row - 1; r <= row + 1; r++) {
            for (var cc = col - 1; cc <= col + 1; cc++) {
                if (r >= 0 && r < N && cc >= 0 && cc < N && queens[r * N + cc] === 'Q') {
                    return false;
                }
            }
        }
        return true;
    }

    // ── Recursive backtracker ──
    var colour = findEmptyColour(grid, queens);
    if (colour === null) return true; // all colours placed

    for (var i = 0; i < grid.length; i++) {
        if (isValid(grid, queens, i, colour)) {
            queens[i] = 'Q';
            if (solveQueens(grid, queens)) return true;
            queens[i] = '.'; // backtrack
        }
    }
    return false;
}
