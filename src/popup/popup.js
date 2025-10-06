// ============================================
// Overtab Popup JavaScript - Phase 2
// ============================================

// Wait for the popup HTML to fully load before running code
document.addEventListener('DOMContentLoaded', function() {
  
  // Get references to our three buttons
  const explainPageBtn = document.getElementById('explain-page-btn');
  const voiceCommandBtn = document.getElementById('voice-command-btn');
  const historyBtn = document.getElementById('history-btn');
  const tooltipToggle = document.getElementById('tooltip-toggle');

  // ============================================
  // Load saved tooltip state WITHOUT flicker
  // ============================================
  chrome.storage.local.get(['tooltipEnabled'], (result) => {
    const isEnabled = result.tooltipEnabled !== false; // Default to true
    
    // Only change if different from default (checked=true in HTML)
    if (!isEnabled) {
      tooltipToggle.checked = false;
    }
    
    // Show the toggle now that state is set (prevents flicker)
    document.querySelector('.feature-toggle').classList.add('loaded');
  });

  // ============================================
  // Handle Tooltip Toggle
  // ============================================
  tooltipToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    
    // Save state
    chrome.storage.local.set({ tooltipEnabled: isEnabled });
    
    // Send message to all tabs to update state
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleTooltip',
          enabled: isEnabled
        }).catch(() => {}); // Ignore errors for tabs without content script
      });
    });
  });

  // ============================================
  // Button 1: Explain Page
  // ============================================
  explainPageBtn.addEventListener('click', async function() {
    console.log('Explain Page button clicked');
    
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
      
      // Close popup AFTER success
      window.close();
      
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
    
    try {
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // MUST open sidebar HERE (during user gesture) - Chrome requirement!
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('✅ Sidebar opened from user click');
      
      // Small delay for sidebar to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Close popup
      window.close();
      
      // NOW start voice capture (sidebar already open)
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
  