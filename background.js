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
  console.log('🔔 Background received message:', message);
  console.log('📤 Sender:', sender);
  
  // If someone wants to open the sidebar
  if (message.action === 'openSidebar') {
    console.log('🚀 Opening sidebar...');
    
    // Use the sender's tab ID if available (from content script)
    if (sender.tab && sender.tab.id) {
      console.log('📱 Opening sidebar for tab:', sender.tab.id);
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => {
          console.log('✅ Sidebar opened successfully!');
          sendResponse({ success: true });
          
          // If loading should be shown, send it after a delay
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
          console.error('❌ Error opening sidebar:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true; // Keep message channel open for async response
    } else {
      // Fallback: Get the current active tab
      console.log('🔍 No sender tab, using active tab...');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          console.log('📱 Opening sidebar for active tab:', tabs[0].id);
          chrome.sidePanel.open({ tabId: tabs[0].id })
            .then(() => {
              console.log('✅ Sidebar opened successfully!');
              sendResponse({ success: true });
            })
            .catch(err => {
              console.error('❌ Error opening sidebar:', err);
              sendResponse({ success: false, error: err.message });
            });
        } else {
          console.error('❌ No active tab found');
          sendResponse({ success: false, error: 'No active tab' });
        }
      });
      return true; // Keep message channel open for async response
    }
  }
  
  // Forward AI result messages to sidebar
  if (message.action === 'showLoading' || 
      message.action === 'showResult' || 
      message.action === 'showError') {
    console.log('📨 Forwarding message to sidebar:', message.action);
    // Send message to sidebar
    chrome.runtime.sendMessage(message);
  }
});
