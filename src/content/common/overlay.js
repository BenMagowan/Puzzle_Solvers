/**
 * Overlay functions for LinkedIn puzzle content scripts.
 * Applies visual hints directly to the DOM.
 */

/**
 * Apply the Queens solution overlay to the grid cells.
 *
 * - Green overlay + border  = "place a queen here"
 * - Green border only       = "this queen is in the correct spot"
 * - Red overlay + border    = "this queen is in the wrong spot"
 *
 * @param {{ cells: Element[], colors: string[], size: number }} gridData
 * @param {string[]} solution  Flat array of '.' or 'Q'
 */
function applyQueensOverlay(gridData, solution) {
    if (!gridData || !solution) return;

    // Clear previous overlays
    removeQueensOverlay();

    gridData.cells.forEach(function (cell, index) {
        // The overlay is absolutely positioned inside the cell
        if (getComputedStyle(cell).position === 'static') {
            cell.style.position = 'relative';
        }

        var label = (cell.getAttribute('aria-label') || '').toLowerCase();
        var hasQueen = label.startsWith('queen');
        var shouldBeQueen = solution[index] === 'Q';

        if (!shouldBeQueen && !hasQueen) return;

        var overlay = document.createElement('div');
        overlay.className = 'puzzle-solver-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '100';
        overlay.style.pointerEvents = 'none';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '1.5em';
        overlay.style.borderRadius = '4px';
        overlay.style.boxSizing = 'border-box';

        if (hasQueen && shouldBeQueen) {
            overlay.style.border = '3px solid rgba(0, 200, 0, 0.9)';
        } else if (hasQueen && !shouldBeQueen) {
            overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
            overlay.style.border = '3px solid rgba(255, 0, 0, 0.9)';
        } else if (shouldBeQueen) {
            overlay.style.backgroundColor = 'rgba(0, 255, 0, 0.6)';
            overlay.style.border = '3px solid rgba(0, 200, 0, 0.9)';
        }

        cell.appendChild(overlay);
    });
}

/**
 * Remove all previously-applied puzzle overlays.
 */
function removeQueensOverlay() {
    document.querySelectorAll('.puzzle-solver-overlay').forEach(function (el) {
        el.remove();
    });
}
