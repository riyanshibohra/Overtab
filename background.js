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
    
    // For now, just show an alert (we'll add real functionality in Phase 8)
    // Note: We need to send a message to the content script to show the alert
    chrome.tabs.sendMessage(tab.id, {
      action: 'showAlert',
      message: '🖼️ Image description coming soon!\n\nThis will use the Prompt API to describe the image.'
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
  
  // No need to return true since we're not sending a response
});
