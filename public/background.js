// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getStorageData') {
        try {
            // Access storage from background script
            chrome.storage.local.get(null, data => {
                if (chrome.runtime.lastError) {
                    sendResponse({ error: chrome.runtime.lastError.message });
                } else {
                    sendResponse(data);
                }
            });
        } catch (error) {
            sendResponse({ error: error.message });
        }
        return true; // Will respond asynchronously
    }
    
    if (request.type === 'setStorageData') {
        try {
            // Set storage data
            chrome.storage.local.set(request.data, () => {
                if (chrome.runtime.lastError) {
                    sendResponse({ error: chrome.runtime.lastError.message });
                } else {
                    sendResponse({ success: true });
                }
            });
        } catch (error) {
            sendResponse({ error: error.message });
        }
        return true; // Will respond asynchronously
    }
}); 