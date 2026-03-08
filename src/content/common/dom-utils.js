/**
 * DOM utility functions shared across all content scripts.
 */

/**
 * Wait for an element matching `selector` to appear in the DOM.
 * Uses a MutationObserver internally, so it works even when LinkedIn
 * renders the grid after the initial page load.
 *
 * @param {string} selector  CSS selector
 * @param {number} [timeout=15000]  Max wait in ms
 * @returns {Promise<Element>}
 */
function waitForElement(selector, timeout) {
    if (timeout === undefined) timeout = 15000;

    return new Promise(function (resolve, reject) {
        var existing = document.querySelector(selector);
        if (existing) return resolve(existing);

        var observer = new MutationObserver(function () {
            var el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(function () {
            observer.disconnect();
            reject(new Error('waitForElement: timeout waiting for ' + selector));
        }, timeout);
    });
}

/**
 * Small async delay helper.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
