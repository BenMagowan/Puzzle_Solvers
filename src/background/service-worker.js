/**
 * LinkedIn Puzzle Solver — Service Worker
 *
 * Responsibilities:
 *   - Centralised logging (all content-script logs are relayed here)
 *   - Default settings on first install
 *   - Tab / navigation tracking for debugging
 *   - Message handling from popup and content scripts
 *
 * Declared as "type": "module" in manifest.json.
 */

// ─────────────────────────── Logging ───────────────────────────

const log = (() => {
    const fmt = (level, tag) => {
        const ts = new Date().toISOString().slice(11, 23);
        return '[' + ts + '][PuzzleSolver][' + tag + '][' + level + ']';
    };
    return {
        info: (tag, ...a) => console.log(fmt('INFO', tag), ...a),
        warn: (tag, ...a) => console.warn(fmt('WARN', tag), ...a),
        error: (tag, ...a) => console.error(fmt('ERROR', tag), ...a),
        debug: (tag, ...a) => console.debug(fmt('DEBUG', tag), ...a),
    };
})();

const SW = 'SW';

// ───────────────────────── Lifecycle ───────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
    log.info(SW, 'Extension installed / updated — reason: ' + details.reason);

    // Set default settings (all solvers ON)
    const keys = ['queensSolver', 'tangoSolver', 'zipSolver', 'mini-sudokuSolver'];
    chrome.storage.local.get(keys, (data) => {
        const defaults = {};
        keys.forEach(k => {
            if (data[k] === undefined) defaults[k] = true;
        });
        if (Object.keys(defaults).length) {
            chrome.storage.local.set(defaults, () => {
                log.info(SW, 'Default settings applied:', defaults);
            });
        }
    });
});

chrome.runtime.onStartup.addListener(() => {
    log.info(SW, 'Browser startup — service worker activated');
});

// ──────────────────────── Messages ────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, _sendResponse) => {
    const tabId = sender.tab ? sender.tab.id : 'popup';
    const tabUrl = sender.tab ? sender.tab.url : '';

    switch (msg.type) {

        // ── Content-script relayed log ──
        case 'log': {
            const fn = log[msg.level] || log.info;
            fn(msg.tag || 'CONTENT', '[tab:' + tabId + ']', msg.message, ...(msg.args || []));
            break;
        }

        // ── Puzzle solved ──
        case 'puzzleSolved':
            log.info(SW,
                'Puzzle SOLVED: ' + msg.puzzle +
                ' (' + msg.gridSize + 'x' + msg.gridSize + ')' +
                ' — tab ' + tabId);
            break;

        // ── Puzzle error ──
        case 'puzzleError':
            log.error(SW,
                'Puzzle ERROR (' + msg.puzzle + '): ' + msg.error +
                ' — tab ' + tabId + ' ' + tabUrl);
            break;

        // ── Settings changed via popup (legacy fallback) ──
        case 'reinitialize':
            log.info(SW, 'Reinitialize request (legacy) — reloading game tabs');
            reinitializeGameTabs();
            break;

        default:
            log.warn(SW, 'Unknown message type: ' + msg.type, msg);
    }

    return false; // synchronous
});

// ──────────────────── Navigation tracking ─────────────────────

chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId !== 0) return;
    const match = details.url.match(/games\/([^/?#]+)/);
    const puzzle = match ? match[1] : '?';
    log.info(SW, 'Game page loaded: ' + puzzle + ' — tab ' + details.tabId);
}, {
    url: [{ hostSuffix: 'linkedin.com', pathPrefix: '/games/' }]
});

// ──────────────────── Settings tracking ───────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, change] of Object.entries(changes)) {
        log.info(SW,
            'Setting changed: ' + key +
            '  ' + JSON.stringify(change.oldValue) +
            ' -> ' + JSON.stringify(change.newValue));
    }
});

// ──────────────────── Ready ───────────────────────────────────

log.info(SW, 'Service worker loaded and ready');
