// Overtab Background Service Worker
importScripts('../utils/ai-helper.js');

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: 'describe-image',
    title: 'Describe with Overtab',
    contexts: ['image']
  });
  
  // Open popup automatically on first install
  if (details.reason === 'install') {
    chrome.action.openPopup().catch(() => {
      chrome.windows.create({
        url: chrome.runtime.getURL('src/popup/popup.html'),
        type: 'popup',
        width: 400,
        height: 600
      });
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'describe-image') {
    chrome.storage.session.set({ pendingAction: 'describe' }, () => {
      chrome.sidePanel.open({ tabId: tab.id });
      
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'showLoading',
          actionType: 'describe',
          sourceText: 'Image'
        });
      }, 100);
      
      chrome.tabs.sendMessage(tab.id, {
        action: 'describeImage',
        imageUrl: info.srcUrl
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidebar') {
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
  
  // Handle AI processing requests from content scripts
  if (message.action === 'processAI') {
    (async () => {
      try {
        let result;
        const { aiFunction, text, targetLanguage } = message;
        
        switch (aiFunction) {
          case 'explain':
            result = await explainText(text);
            break;
          case 'simplify':
            result = await simplifyText(text);
            break;
          case 'translate':
            result = await translateText(text, targetLanguage);
            break;
          case 'proofread':
            result = await proofreadText(text);
            break;
          case 'prompt':
            result = await promptAI(text);
            break;
          default:
            throw new Error(`Unknown AI function: ${aiFunction}`);
        }
        
        sendResponse({ success: true, result });
      } catch (error) {
        console.error('[Background] AI processing error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
  
  // Forward messages to sidebar
  if (message.action === 'showLoading' || 
      message.action === 'showResult' || 
      message.action === 'showError') {
    chrome.runtime.sendMessage(message);
  }
});
