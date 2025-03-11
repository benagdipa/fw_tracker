// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getStorageData') {
        // Access storage from background script
        chrome.storage.local.get(null, data => {
            sendResponse(data);
        });
        return true; // Will respond asynchronously
    }
    
    if (request.type === 'setStorageData') {
        // Set storage data
        chrome.storage.local.set(request.data, () => {
            sendResponse({ success: true });
        });
        return true; // Will respond asynchronously
    }
}); 