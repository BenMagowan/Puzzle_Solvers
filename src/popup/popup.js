document.addEventListener('DOMContentLoaded', () => {
    // const settings = ['zipSolver', 'mini-sudokuSolver', 'tangoSolver', 'queensSolver', 'autoSolver', 'persistentOverlay'];
    const settings = ['zipSolver', 'mini-sudokuSolver', 'tangoSolver', 'queensSolver'];
    const clearCacheButton = document.getElementById('clearCache');
    const encoder = new TextEncoder();

    const formatBytes = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes.toFixed(0)} B`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    };

    const cacheEntriesOnly = (data) => Object.entries(data).filter(([key]) => !settings.includes(key));

    const calculateCacheBytes = (entries) => entries.reduce((total, [key, value]) => {
        const keyBytes = encoder.encode(key).length;
        const valueBytes = encoder.encode(JSON.stringify(value)).length;
        return total + keyBytes + valueBytes;
    }, 0);

    const updateCacheButton = () => {
        if (!clearCacheButton) return;
        chrome.storage.local.get(null, (data) => {
            const bytes = calculateCacheBytes(cacheEntriesOnly(data));
            clearCacheButton.textContent = bytes ? `Clear Cache (${formatBytes(bytes)})` : 'Clear Cache';
        });
    };

    // Load saved settings
    chrome.storage.local.get(settings, (data) => {
        settings.forEach(setting => {
            document.getElementById(setting).checked = data[setting];
        });

        // Enable transitions after settings are loaded
        setTimeout(() => {
            document.querySelectorAll('.slider').forEach(slider => {
                slider.classList.add('loaded');
            });
        }, 50);

        updateCacheButton();
    });

    // Add change listener for auto-save
    settings.forEach(setting => {
        document.getElementById(setting).addEventListener('change', () => {
            const newValue = document.getElementById(setting).checked;
            chrome.storage.local.set({ [setting]: newValue });
            console.log(`Setting ${setting} to ${newValue}`);

            // Send message to background script to reinitialize
            console.log('Sending reinitialize message');
            chrome.runtime.sendMessage({ type: 'reinitialize' });
        });
    });

    // Clear cache button functionality
    clearCacheButton.addEventListener('click', () => {
        // Get current settings from the DOM before clearing storage
        const currentSettings = {};
        settings.forEach(setting => {
            currentSettings[setting] = document.getElementById(setting).checked;
        });

        chrome.storage.local.clear(() => {
            // Re-save current settings
            chrome.storage.local.set(currentSettings, () => {
                console.log('Cache cleared, settings preserved');
                updateCacheButton();

                // Show temporary feedback
                clearCacheButton.textContent = 'Cache Cleared!';
                clearCacheButton.style.backgroundColor = '#34a853';

                setTimeout(() => {
                    clearCacheButton.style.backgroundColor = '';
                    updateCacheButton();
                }, 1000);
            });
        });
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;
        const cacheChanged = Object.keys(changes).some(key => !settings.includes(key));
        if (cacheChanged) updateCacheButton();
    });

    updateCacheButton();
});
