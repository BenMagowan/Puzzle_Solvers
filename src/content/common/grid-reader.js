/**
 * Grid reading functions for LinkedIn puzzle content scripts.
 * Runs with direct DOM access (no chrome.scripting needed).
 */

/**
 * Read the Queens colour grid from the current page.
 *
 * Parses each cell's aria-label to extract colour, row, and column,
 * then returns a sorted flat array plus references to the DOM elements.
 *
 * @returns {{ colors: string[], cells: Element[], size: number } | null}
 */
function extractQueensGrid() {
    var gridEl = document.querySelector('[data-testid="interactive-grid"]');
    if (!gridEl) {
        PuzzleLogger.debug('GRID', 'Grid container [data-testid="interactive-grid"] not found');
        return null;
    }

    // Match any cell whose aria-label mentions both "row" and "column"
    var cellEls = gridEl.querySelectorAll('[aria-label*="row"][aria-label*="column"]');
    if (!cellEls.length) {
        PuzzleLogger.debug('GRID', 'No cells with row/column aria-labels found');
        return null;
    }

    var cellData = [];
    cellEls.forEach(function (cell) {
        var label = cell.getAttribute('aria-label') || '';
        var colorMatch = label.match(/of color\s+(.+?),/i);
        var posMatch = label.match(/row\s+(\d+),\s*column\s+(\d+)/i);
        if (posMatch) {
            cellData.push({
                color: colorMatch ? colorMatch[1].trim() : 'unknown',
                row: parseInt(posMatch[1], 10),
                col: parseInt(posMatch[2], 10),
                element: cell
            });
        }
    });

    if (!cellData.length) {
        PuzzleLogger.debug('GRID', 'Could not parse any cell positions from aria-labels');
        return null;
    }

    // Sort in row-major order
    cellData.sort(function (a, b) {
        return a.row - b.row || a.col - b.col;
    });

    var size = Math.max.apply(null, cellData.map(function (c) { return c.row; }));

    PuzzleLogger.debug('GRID',
        'Parsed ' + cellData.length + ' cells, grid size ' + size + 'x' + size);

    return {
        colors: cellData.map(function (c) { return c.color; }),
        cells: cellData.map(function (c) { return c.element; }),
        size: size
    };
}
