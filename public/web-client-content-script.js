// Send a message to the background script to access storage
try {
    chrome.runtime.sendMessage({ type: 'getStorageData' }, response => {
        // Check if chrome runtime error occurred
        if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError.message);
            return;
        }
        // Handle the storage data here
        console.log('Storage data:', response);
    });

    // If you need to set storage data
    chrome.runtime.sendMessage({ 
        type: 'setStorageData', 
        data: { key: 'value' } 
    }, response => {
        // Check if chrome runtime error occurred
        if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError.message);
            return;
        }
        console.log('Storage set response:', response);
    });
} catch (error) {
    console.error('Error accessing chrome runtime:', error);
} 