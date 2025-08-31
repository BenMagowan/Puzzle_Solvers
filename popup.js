document.addEventListener('DOMContentLoaded', () => {
    const settings = ['zipSolver', 'mini-sudokuSolver', 'tangoSolver', 'queensSolver'];

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
    document.getElementById('clearCache').addEventListener('click', () => {
        // Get current settings from the DOM before clearing storage
        const currentSettings = {};
        settings.forEach(setting => {
            currentSettings[setting] = document.getElementById(setting).checked;
        });

        chrome.storage.local.clear(() => {
            // Re-save current settings
            chrome.storage.local.set(currentSettings, () => {
                console.log('Cache cleared, settings preserved');

                // Show temporary feedback
                const button = document.getElementById('clearCache');
                const originalText = button.textContent;
                button.textContent = 'Cache Cleared!';
                button.style.backgroundColor = '#34a853';

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = '';
                }, 2000);
            });
        });
    });
});
