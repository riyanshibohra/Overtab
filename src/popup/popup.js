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
  historyBtn.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Set flag to open history tab
      await chrome.storage.session.set({ openTab: 'history' });
      
      // Open sidebar
      await chrome.sidePanel.open({ tabId: tab.id });
      
      window.close();
    } catch (error) {
      console.error('Error opening history:', error);
    }
  });

  // Settings Modal Logic
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings');
  const saveSettingsBtn = document.getElementById('save-settings');
  const testApiBtn = document.getElementById('test-api-key');
  const clearApiBtn = document.getElementById('clear-api-key');
  
  const apiKeyInput = document.getElementById('openai-api-key');
  const modelSelect = document.getElementById('openai-model');
  const temperatureSlider = document.getElementById('openai-temperature');
  const tempValue = document.getElementById('temp-value');
  const geminiStatus = document.getElementById('gemini-status');
  const apiTestResult = document.getElementById('api-test-result');
  const fallbackPreference = document.getElementById('fallback-preference');
  const primaryProvider = document.getElementById('primary-provider');

  // Open settings
  settingsBtn.addEventListener('click', async function() {
    settingsModal.classList.remove('hidden');
    await loadSettings();
    await checkGeminiStatus();
  });

  // Close settings
  closeSettingsBtn.addEventListener('click', function() {
    settingsModal.classList.add('hidden');
  });

  // Close modal when clicking outside
  settingsModal.addEventListener('click', function(e) {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  // Temperature slider
  temperatureSlider.addEventListener('input', function() {
    tempValue.textContent = this.value;
  });

  // Load settings
  async function loadSettings() {
    const settings = await chrome.storage.local.get(['openaiApiKey', 'openaiModel', 'openaiTemperature', 'fallbackPreference', 'primaryProvider']);
    
    if (settings.openaiApiKey) {
      apiKeyInput.value = settings.openaiApiKey;
    }
    
    if (settings.openaiModel) {
      modelSelect.value = settings.openaiModel;
    }
    
    if (settings.openaiTemperature !== undefined) {
      temperatureSlider.value = settings.openaiTemperature;
      tempValue.textContent = settings.openaiTemperature;
    }

    if (settings.fallbackPreference) {
      fallbackPreference.value = settings.fallbackPreference;
    }

    if (settings.primaryProvider) {
      primaryProvider.value = settings.primaryProvider;
    }
  }

  // Save settings
  saveSettingsBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const temperature = parseFloat(temperatureSlider.value);
    const fallback = fallbackPreference.value;
    const primary = primaryProvider.value;
    
    await chrome.storage.local.set({
      openaiApiKey: apiKey,
      openaiModel: model,
      openaiTemperature: temperature,
      fallbackPreference: fallback,
      primaryProvider: primary
    });
    
    // Show success message
    saveSettingsBtn.textContent = '✓ Saved!';
    setTimeout(() => {
      saveSettingsBtn.textContent = 'Save Settings';
      settingsModal.classList.add('hidden');
    }, 1000);
  });

  // Clear API key
  clearApiBtn.addEventListener('click', async function() {
    if (confirm('Are you sure you want to clear your API key? This cannot be undone.')) {
      apiKeyInput.value = '';
      await chrome.storage.local.remove('openaiApiKey');
      apiTestResult.textContent = '✓ API key cleared';
      apiTestResult.className = 'api-test-result success';
      
      setTimeout(() => {
        apiTestResult.textContent = '';
      }, 3000);
    }
  });

  // Test API key
  testApiBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      apiTestResult.textContent = '❌ Please enter an API key';
      apiTestResult.className = 'api-test-result error';
      return;
    }
    
    testApiBtn.disabled = true;
    testApiBtn.textContent = 'Testing...';
    apiTestResult.textContent = '';
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{role: 'user', content: 'Say hello'}],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        apiTestResult.textContent = '✓ API key is valid!';
        apiTestResult.className = 'api-test-result success';
      } else {
        const error = await response.json();
        apiTestResult.textContent = `❌ ${error.error?.message || 'Invalid API key'}`;
        apiTestResult.className = 'api-test-result error';
      }
    } catch (error) {
      apiTestResult.textContent = '❌ Network error';
      apiTestResult.className = 'api-test-result error';
    } finally {
      testApiBtn.disabled = false;
      testApiBtn.textContent = 'Test API Key';
    }
  });

  // Check Gemini Nano status
  async function checkGeminiStatus() {
    try {
      if (typeof LanguageModel !== 'undefined') {
        const availability = await LanguageModel.availability();
        
        if (availability === 'readily') {
          geminiStatus.textContent = '✓ Gemini Nano is available and ready';
          geminiStatus.style.color = '#0f9d58';
          document.getElementById('ai-status-text').textContent = 'Powered by Gemini Nano';
          document.getElementById('ai-status-label').textContent = 'On-Device AI';
        } else {
          geminiStatus.textContent = `⚠️ Gemini Nano status: ${availability}`;
          geminiStatus.style.color = '#f29900';
          
          const hasApiKey = await chrome.storage.local.get(['openaiApiKey']);
          if (hasApiKey.openaiApiKey) {
            document.getElementById('ai-status-text').textContent = 'Using OpenAI API';
            document.getElementById('ai-status-label').textContent = 'Cloud AI';
          }
        }
      } else {
        geminiStatus.textContent = '❌ Gemini Nano not available';
        geminiStatus.style.color = '#d93025';
        
        const hasApiKey = await chrome.storage.local.get(['openaiApiKey']);
        if (hasApiKey.openaiApiKey) {
          document.getElementById('ai-status-text').textContent = 'Using OpenAI API';
          document.getElementById('ai-status-label').textContent = 'Cloud AI';
        } else {
          document.getElementById('ai-status-text').textContent = 'No AI available';
          document.getElementById('ai-status-label').textContent = 'Configure API';
        }
      }
    } catch (error) {
      geminiStatus.textContent = '❌ Error checking status';
      geminiStatus.style.color = '#d93025';
    }
  }

  // Check status on load
  checkGeminiStatus();

});
  