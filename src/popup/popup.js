// Overtab Popup Script

document.addEventListener('DOMContentLoaded', function() {
  
  const explainPageBtn = document.getElementById('explain-page-btn');
  const voiceCommandBtn = document.getElementById('voice-command-btn');
  const historyBtn = document.getElementById('history-btn');
  const tooltipToggle = document.getElementById('tooltip-toggle');

  // Load tooltip state without flicker
  chrome.storage.local.get(['tooltipEnabled'], (result) => {
    const isEnabled = result.tooltipEnabled !== false;
    
    if (!isEnabled) {
      tooltipToggle.checked = false;
    }
    
    document.querySelector('.feature-toggle').classList.add('loaded');
  });

  // Handle tooltip toggle
  tooltipToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    
    chrome.storage.local.set({ tooltipEnabled: isEnabled });
    
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleTooltip',
          enabled: isEnabled
        }).catch(() => {});
      });
    });
  });

  // Explain Page button
  explainPageBtn.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const bodyText = document.body.innerText;
          return bodyText.substring(0, 5000);
        }
      });
      
      const pageText = results[0].result;
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'explainPage',
        text: pageText
      });
      
      window.close();
      
    } catch (error) {
      console.error('Error explaining page:', error);
      alert('Error: ' + error.message);
    }
  });

  // Voice command button
  voiceCommandBtn.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Open sidebar (must be during user gesture)
      await chrome.sidePanel.open({ tabId: tab.id });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      window.close();
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'startVoiceCapture'
      });
      
    } catch (error) {
      console.error('Error starting voice command:', error);
      alert('Error: ' + error.message);
    }
  });

  // History button
  historyBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'openSidebar' });
    window.close();
  });

});
  