/**
 * Settings helper for LinkedIn Puzzle Solver.
 * Loaded as a content script (non-module).
 */

/**
 * Check whether a particular solver is enabled in chrome.storage.
 * Defaults to true if the key has never been set.
 *
 * @param {string} solverKey  e.g. 'queensSolver'
 * @returns {Promise<boolean>}
 */
function getSolverEnabled(solverKey) {
    return new Promise(function (resolve) {
        try {
            chrome.storage.local.get(solverKey, function (data) {
                resolve(data[solverKey] !== false);
            });
        } catch (_) {
            resolve(true);
        }
    });
}
