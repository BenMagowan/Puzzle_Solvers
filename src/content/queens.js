/**
 * Queens puzzle — content script entry point.
 *
 * Loaded after: logger.js, dom-utils.js, grid-reader.js, overlay.js,
 * queens-solver.js  (all share the same content-script global scope).
 */
(function () {
    var TAG = 'QUEENS';

    function init() {
        PuzzleLogger.log(TAG, 'Content script loaded on ' + location.href);

        // ── Check whether the solver is enabled in settings ──
        getSolverEnabled('queensSolver').then(function (enabled) {
            if (!enabled) {
                PuzzleLogger.log(TAG, 'Solver is disabled in settings, exiting');
                return;
            }
            findAndSolve();
        });
    }

    function findAndSolve() {
        PuzzleLogger.log(TAG, 'Waiting for grid element...');

        waitForElement('[data-testid="interactive-grid"]', 20000)
            .then(function () {
                PuzzleLogger.log(TAG, 'Grid element found');
                // Give React a moment to finish rendering cell contents
                return delay(600);
            })
            .then(function () {
                var gridData = extractQueensGrid();
                if (!gridData) {
                    PuzzleLogger.error(TAG, 'Failed to extract grid data from DOM');
                    notifyServiceWorker('puzzleError', { error: 'grid extraction failed' });
                    return;
                }

                var uniqueColours = [];
                var seen = {};
                gridData.colors.forEach(function (c) {
                    if (!seen[c]) { seen[c] = true; uniqueColours.push(c); }
                });

                PuzzleLogger.log(TAG,
                    'Grid: ' + gridData.size + 'x' + gridData.size +
                    ', ' + uniqueColours.length + ' colours: ' + uniqueColours.join(', '));

                // ── Solve ──
                var queens = [];
                for (var i = 0; i < gridData.colors.length; i++) queens.push('.');

                var solved = solveQueens(gridData.colors, queens);

                if (!solved) {
                    PuzzleLogger.error(TAG, 'No valid solution found');
                    notifyServiceWorker('puzzleError', { error: 'no solution' });
                    return;
                }

                PuzzleLogger.log(TAG, 'Solution found');
                PuzzleLogger.debug(TAG, 'Solution: ' + queens.join(''));

                // ── Apply visual overlay ──
                applyQueensOverlay(gridData, queens);
                PuzzleLogger.log(TAG, 'Overlay applied');

                // ── Watch for DOM changes so overlay stays in sync ──
                setupGridObserver(queens);

                // ── Tell the service worker ──
                notifyServiceWorker('puzzleSolved', {
                    gridSize: gridData.size,
                    solution: queens
                });
            })
            .catch(function (err) {
                PuzzleLogger.error(TAG, 'Error: ' + err.message);
                notifyServiceWorker('puzzleError', { error: err.message });
            });
    }

    // ── Observer: re-apply overlay when user interacts with the grid ──
    function setupGridObserver(queens) {
        var gridEl = document.querySelector('[data-testid="interactive-grid"]');
        if (!gridEl) return;

        if (window._queensObserver) {
            window._queensObserver.disconnect();
        }

        var timer;
        var observer = new MutationObserver(function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                var fresh = extractQueensGrid();
                if (fresh) applyQueensOverlay(fresh, queens);
            }, 250);
        });

        observer.observe(gridEl, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class', 'aria-label']
        });

        window._queensObserver = observer;
        PuzzleLogger.debug(TAG, 'Grid MutationObserver started');
    }

    // ── Helper: send structured message to service worker ──
    function notifyServiceWorker(type, data) {
        try {
            var msg = { type: type, puzzle: 'queens' };
            if (data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) msg[key] = data[key];
                }
            }
            chrome.runtime.sendMessage(msg).catch(function () { });
        } catch (_) { /* ignore */ }
    }

    // ── Kick off ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 300);
    }
})();
