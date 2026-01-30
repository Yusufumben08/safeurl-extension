// Background service worker for the extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('URL Safety Checker extension installed');
    
    // Create context menu
    chrome.contextMenus.create({
        id: 'scanUrl',
        title: 'Scan URL Safety',
        contexts: ['link']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'scanUrl') {
        // Open popup with the link URL
        chrome.storage.local.set({ urlToScan: info.linkUrl });
        chrome.action.openPopup();
    }
});
