// Send a message to the background script to access storage
chrome.runtime.sendMessage({ type: 'getStorageData' }, response => {
    // Handle the storage data here
    console.log('Storage data:', response);
});

// If you need to set storage data
chrome.runtime.sendMessage({ 
    type: 'setStorageData', 
    data: { key: 'value' } 
}, response => {
    console.log('Storage set response:', response);
}); 