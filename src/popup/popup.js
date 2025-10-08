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
  const encryptionPasscodeInput = document.getElementById('encryption-passcode');
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
    const settings = await chrome.storage.local.get(['openaiApiKey', 'openaiKeyEncrypted', 'openaiModel', 'openaiTemperature', 'fallbackPreference', 'primaryProvider']);
    const session = await chrome.storage.session.get(['encryptionPasscode']);
    
    if (settings.openaiApiKey) {
      apiKeyInput.value = settings.openaiApiKey;
    } else if (settings.openaiKeyEncrypted) {
      apiKeyInput.placeholder = 'Encrypted (enter passcode to use)';
    }

    if (session.encryptionPasscode) {
      encryptionPasscodeInput.value = session.encryptionPasscode;
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
    const passcode = encryptionPasscodeInput.value.trim();
    const model = modelSelect.value;
    const temperature = parseFloat(temperatureSlider.value);
    const fallback = fallbackPreference.value;
    const primary = primaryProvider.value;
    
    // Determine storage: plaintext or encrypted
    const existing = await chrome.storage.local.get(['openaiApiKey', 'openaiKeyEncrypted']);
    const toSet = {
      openaiModel: model,
      openaiTemperature: temperature,
      fallbackPreference: fallback,
      primaryProvider: primary
    };
    
    // If user provided passcode and apiKey, store encrypted and keep passcode in session
    if (passcode && apiKey) {
      try {
        const enc = await encryptTextWithPasscode(apiKey, passcode);
        toSet.openaiApiKey = '';
        toSet.openaiKeyEncrypted = enc;
        await chrome.storage.session.set({ encryptionPasscode: passcode });
      } catch (e) {
        alert('Failed to encrypt with passcode. Key will be saved unencrypted.');
        toSet.openaiApiKey = apiKey;
        toSet.openaiKeyEncrypted = null;
      }
    } else if (apiKey) {
      // Plaintext save (no passcode)
      toSet.openaiApiKey = apiKey;
      toSet.openaiKeyEncrypted = null;
      if (!passcode) await chrome.storage.session.remove('encryptionPasscode');
    } else {
      // No new key provided
      if (existing.openaiKeyEncrypted) {
        // Preserve existing encrypted key; optionally set session passcode
        toSet.openaiApiKey = existing.openaiApiKey || '';
        toSet.openaiKeyEncrypted = existing.openaiKeyEncrypted;
        if (passcode) {
          await chrome.storage.session.set({ encryptionPasscode: passcode });
        } else {
          await chrome.storage.session.remove('encryptionPasscode');
        }
      } else {
        // Preserve existing plaintext key (if any)
        toSet.openaiApiKey = existing.openaiApiKey || '';
        toSet.openaiKeyEncrypted = null;
        if (!passcode) await chrome.storage.session.remove('encryptionPasscode');
      }
    }

    await chrome.storage.local.set(toSet);
    
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
      await chrome.storage.local.remove(['openaiApiKey', 'openaiKeyEncrypted']);
      await chrome.storage.session.remove('encryptionPasscode');
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

  // Update AI status badge with appropriate icon and text
  async function updateAIStatusBadge() {
    const prefs = await chrome.storage.local.get(['primaryProvider', 'openaiApiKey', 'openaiKeyEncrypted']);
    const statusIcon = document.querySelector('.status-indicator img');
    const statusText = document.getElementById('ai-status-text');
    const statusLabel = document.getElementById('ai-status-label');
    
    // Check if user has chosen OpenAI as primary
    if (prefs.primaryProvider === 'openai' && (prefs.openaiApiKey || prefs.openaiKeyEncrypted)) {
      statusIcon.src = '../../icons/openai-logo.png';
      statusIcon.alt = 'OpenAI';
      statusText.textContent = 'Using OpenAI API';
      statusLabel.textContent = 'CLOUD AI';
      statusLabel.style.background = '#e3f2fd';
      statusLabel.style.color = '#1976d2';
    } else {
      // Default to Gemini Nano or show it if available
      statusIcon.src = '../../icons/gemini-logo.png';
      statusIcon.alt = 'Gemini';
      statusText.textContent = 'Powered by Gemini Nano';
      statusLabel.textContent = 'ON-DEVICE';
      statusLabel.style.background = '#e6f4ea';
      statusLabel.style.color = '#34a853';
    }
  }

  // Check Gemini Nano status
  async function checkGeminiStatus() {
    try {
      if (typeof LanguageModel !== 'undefined') {
        const availability = await LanguageModel.availability();
        
        if (availability === 'readily' || availability === 'available') {
          geminiStatus.textContent = '✓ Gemini Nano is available!';
          geminiStatus.style.color = '#0f9d58';
        } else {
          geminiStatus.textContent = `⚠️ Gemini Nano status: ${availability}`;
          geminiStatus.style.color = '#f29900';
        }
      } else {
        geminiStatus.textContent = '❌ Gemini Nano not available';
        geminiStatus.style.color = '#d93025';
      }
      a
      // Update the badge based on settings
      await updateAIStatusBadge();
    } catch (error) {
      geminiStatus.textContent = '❌ Error checking status';
      geminiStatus.style.color = '#d93025';
    }
  }

  // Check status on load
  checkGeminiStatus();

  // Listen for storage changes and update badge in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // If primaryProvider or openaiApiKey changed, update the badge immediately
      if (changes.primaryProvider || changes.openaiApiKey) {
        updateAIStatusBadge();
      }
    }
  });

});
  