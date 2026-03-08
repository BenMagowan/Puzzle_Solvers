/**
 * Shared logging utility for LinkedIn Puzzle Solver.
 * Works in both content-script and service-worker contexts.
 *
 * Usage:  PuzzleLogger.log('QUEENS', 'Grid found', gridData);
 */
const PuzzleLogger = (() => {
    const PREFIX = 'PuzzleSolver';

    const ts = () => new Date().toISOString().slice(11, 23);

    const fmt = (level, tag) =>
        '[' + ts() + '][' + PREFIX + '][' + tag + '][' + level + ']';

    /** Best-effort relay to the service worker so all logs are visible in one place. */
    const relay = (level, tag, firstArg, rest) => {
        try {
            if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    type: 'log',
                    level: level,
                    tag: tag,
                    message: typeof firstArg === 'object' ? JSON.stringify(firstArg) : String(firstArg),
                    args: rest.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
                }).catch(function () { });
            }
        } catch (_) { /* service worker may not be listening */ }
    };

    return {
        log: function (tag) {
            var args = Array.prototype.slice.call(arguments, 1);
            console.log.apply(console, [fmt('INFO', tag)].concat(args));
            relay('info', tag, args[0], args.slice(1));
        },
        error: function (tag) {
            var args = Array.prototype.slice.call(arguments, 1);
            console.error.apply(console, [fmt('ERROR', tag)].concat(args));
            relay('error', tag, args[0], args.slice(1));
        },
        warn: function (tag) {
            var args = Array.prototype.slice.call(arguments, 1);
            console.warn.apply(console, [fmt('WARN', tag)].concat(args));
            relay('warn', tag, args[0], args.slice(1));
        },
        debug: function (tag) {
            var args = Array.prototype.slice.call(arguments, 1);
            console.debug.apply(console, [fmt('DEBUG', tag)].concat(args));
            relay('debug', tag, args[0], args.slice(1));
        }
    };
})();
