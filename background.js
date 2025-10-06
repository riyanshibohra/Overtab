// ============================================
// Overtab Background Service Worker - Phase 3
// ============================================
// This runs in the background and handles:
// - Context menus (right-click options)
// - Opening the sidebar
// - Communication between different parts

console.log('Overtab background service worker started');

// ============================================
// Setup: Create right-click menu for images
// ============================================

// This runs once when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Overtab installed/updated');
  
  // Create a right-click menu item that appears on images
  chrome.contextMenus.create({
    id: 'describe-image',
    title: 'Describe with Overtab',
    contexts: ['image']  // Only show this menu on images
  });
});

// ============================================
// Handle: When someone clicks the context menu
// ============================================

chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Check if they clicked "Describe with Overtab"
  if (info.menuItemId === 'describe-image') {
    console.log('User wants to describe image:', info.srcUrl);
    
    // Open sidebar
    chrome.sidePanel.open({ tabId: tab.id });
    
    // Send loading message
    chrome.runtime.sendMessage({
      action: 'showLoading',
      sourceText: 'Image'
    });
    
    // Send image URL to be described
    chrome.tabs.sendMessage(tab.id, {
      action: 'describeImage',
      imageUrl: info.srcUrl
    });
  }
});

// ============================================
// Handle: Messages from other parts of extension
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  // If someone wants to open the sidebar
  if (message.action === 'openSidebar') {
    // Get the current tab and open the sidebar
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  }
  
  // Forward AI result messages to sidebar
  if (message.action === 'showLoading' || 
      message.action === 'showResult' || 
      message.action === 'showError') {
    // Send message to sidebar
    // Note: Sidebar will be listening for these messages
    chrome.runtime.sendMessage(message);
  }
  
  // No need to return true since we're not sending a response
});
