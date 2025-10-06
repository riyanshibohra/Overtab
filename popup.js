// ============================================
// Overtab Popup JavaScript - Phase 2
// ============================================

// Wait for the popup HTML to fully load before running code
document.addEventListener('DOMContentLoaded', function() {
  
  // Get references to our three buttons
  const explainPageBtn = document.getElementById('explain-page-btn');
  const voiceCommandBtn = document.getElementById('voice-command-btn');
  const historyBtn = document.getElementById('history-btn');

  // ============================================
  // Button 1: Explain Page
  // ============================================
  explainPageBtn.addEventListener('click', async function() {
    console.log('Explain Page button clicked');
    
    // Close popup
    window.close();
    
    try {
      // Get the current page content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject script to get page text
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Get main text content from the page
          const bodyText = document.body.innerText;
          // Limit to first 5000 characters to avoid API limits
          return bodyText.substring(0, 5000);
        }
      });
      
      const pageText = results[0].result;
      
      // Send to content script to process
      await chrome.tabs.sendMessage(tab.id, {
        action: 'explainPage',
        text: pageText
      });
      
    } catch (error) {
      console.error('Error explaining page:', error);
      alert('Error: ' + error.message);
    }
  });

  // ============================================
  // Button 2: Voice Command
  // ============================================
  voiceCommandBtn.addEventListener('click', async function() {
    console.log('Voice Command button clicked');
    
    // Close popup
    window.close();
    
    try {
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to start voice capture
      await chrome.tabs.sendMessage(tab.id, {
        action: 'startVoiceCapture'
      });
      
    } catch (error) {
      console.error('Error starting voice command:', error);
      alert('Error: ' + error.message);
    }
  });

  // ============================================
  // Button 3: History
  // ============================================
  historyBtn.addEventListener('click', function() {
    console.log('History button clicked');
    
    // Send message to background script to open the sidebar
    chrome.runtime.sendMessage({ action: 'openSidebar' });
    
    // Close the popup
    window.close();
  });

  // Log that the popup has loaded successfully
  console.log('Overtab popup loaded successfully!');
});
  