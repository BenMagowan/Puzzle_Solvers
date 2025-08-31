document.addEventListener('DOMContentLoaded', () => {
    const settings = ['zipSolver', 'mini-sudokuSolver', 'tangoSolver', 'queensSolver'];

    // Load saved settings
    chrome.storage.local.get(settings, (data) => {
        settings.forEach(setting => {
            document.getElementById(setting).checked = data[setting];
        });
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
});
