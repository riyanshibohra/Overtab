// Overtab Background Service Worker
// Handles context menus, sidebar management, and inter-component communication

console.log('Overtab service worker initialized');

// Create context menu for image descriptions
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'describe-image',
    title: 'Describe with Overtab',
    contexts: ['image']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'describe-image') {
    chrome.sidePanel.open({ tabId: tab.id });
    
    chrome.runtime.sendMessage({
      action: 'showLoading',
      sourceText: 'Image'
    });
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'describeImage',
      imageUrl: info.srcUrl
    });
  }
});

// Handle messages between components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.action === 'openSidebar') {
    // Use sender's tab if available, otherwise get active tab
    if (sender.tab && sender.tab.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => {
          sendResponse({ success: true });
          
          if (message.showLoading) {
            setTimeout(() => {
              chrome.runtime.sendMessage({
                action: 'showLoading',
                sourceText: message.sourceText
              });
            }, 300);
          }
        })
        .catch(err => {
          console.error('Error opening sidebar:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.sidePanel.open({ tabId: tabs[0].id })
            .then(() => sendResponse({ success: true }))
            .catch(err => {
              console.error('Error opening sidebar:', err);
              sendResponse({ success: false, error: err.message });
            });
        } else {
          sendResponse({ success: false, error: 'No active tab' });
        }
      });
      return true;
    }
  }
  
  // Forward result messages to sidebar
  if (message.action === 'showLoading' || 
      message.action === 'showResult' || 
      message.action === 'showError') {
    chrome.runtime.sendMessage(message);
  }
});
