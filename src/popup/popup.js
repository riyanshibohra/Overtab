// Overtab Popup Script

document.addEventListener('DOMContentLoaded', function() {
  
  const explainPageBtn = document.getElementById('explain-page-btn');
  const voiceCommandBtn = document.getElementById('voice-command-btn');
  const historyBtn = document.getElementById('history-btn');
  const tooltipToggle = document.getElementById('tooltip-toggle');
  
  // Mark body as loaded immediately to prevent flash
  document.body.classList.add('loaded');
  
  // Check for first-time install and unlock status
  checkWelcomeAndUnlockStatus();

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
    const passcodeHint = document.querySelector('#encryption-passcode + .input-hint');
    
    // Handle API Key field display
    if (settings.openaiApiKey) {
      // Plaintext key stored
      apiKeyInput.value = settings.openaiApiKey;
      apiKeyInput.placeholder = 'sk-...';
      apiKeyInput.readOnly = false;
    } else if (settings.openaiKeyEncrypted) {
      // Encrypted key
      if (session.encryptionPasscode) {
        // Passcode in session - key is unlocked and ready to use
        apiKeyInput.value = '';
        apiKeyInput.placeholder = '✓ Encrypted & Unlocked (ready to use)';
        apiKeyInput.style.color = '#0f9d58';
        apiKeyInput.readOnly = true;
      } else {
        // No passcode in session - needs unlock
        apiKeyInput.value = '';
        apiKeyInput.placeholder = '🔒 Encrypted (enter passcode below to unlock)';
        apiKeyInput.style.color = '#e65100';
        apiKeyInput.readOnly = true;
      }
    }

    // Handle Passcode field display and hint
    if (session.encryptionPasscode) {
      encryptionPasscodeInput.value = session.encryptionPasscode;
      encryptionPasscodeInput.readOnly = true;
      passcodeHint.textContent = '✓ Your API key is unlocked and ready to use this session';
      passcodeHint.style.color = '#0f9d58';
    } else if (settings.openaiKeyEncrypted) {
      encryptionPasscodeInput.value = '';
      encryptionPasscodeInput.readOnly = false;
      passcodeHint.textContent = '🔑 Enter your passcode to unlock the encrypted API key';
      passcodeHint.style.color = '#e65100';
    } else {
      encryptionPasscodeInput.readOnly = false;
      passcodeHint.textContent = 'We encrypt your API key with this passcode. You\'ll re-enter it after restart.';
      passcodeHint.style.color = '#5f6368';
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
    let primary = primaryProvider.value;
    
    // Smart default: if saving OpenAI key and Gemini Nano is not available, set OpenAI as primary
    if (apiKey || passcode) {
      // Check if Gemini is available
      let geminiAvailable = false;
      try {
        if (typeof LanguageModel !== 'undefined') {
          const availability = await LanguageModel.availability();
          geminiAvailable = (availability === 'readily' || availability === 'available');
        }
      } catch (e) {}
      
      // If Gemini not available OR no primary set, default to OpenAI
      if (!geminiAvailable || !primary) {
        primary = 'openai';
        primaryProvider.value = 'openai';
        console.log('✅ Auto-selected OpenAI as primary provider');
      }
    }
    
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
    
    // Reset input styling
    apiKeyInput.style.color = '';
    
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
      apiKeyInput.placeholder = 'sk-...';
      apiKeyInput.style.color = '';
      encryptionPasscodeInput.value = '';
      
      const passcodeHint = document.querySelector('#encryption-passcode + .input-hint');
      passcodeHint.textContent = 'We encrypt your API key with this passcode. You\'ll re-enter it after restart.';
      passcodeHint.style.color = '#5f6368';
      
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
    const hasOpenAIKey = !!(prefs.openaiApiKey || prefs.openaiKeyEncrypted);

    // If user prefers OpenAI and key is present
    if (prefs.primaryProvider === 'openai' && hasOpenAIKey) {
      statusIcon.src = '../../icons/openai-logo.png';
      statusIcon.alt = 'OpenAI';
      statusText.textContent = 'Using OpenAI API';
      statusLabel.textContent = 'CLOUD AI';
      statusLabel.style.background = '#e3f2fd';
      statusLabel.style.color = '#1976d2';
      return;
    }

    // Check Gemini availability
    let geminiAvailable = false;
    try {
      if (typeof LanguageModel !== 'undefined') {
        const availability = await LanguageModel.availability();
        geminiAvailable = (availability === 'readily' || availability === 'available');
      }
    } catch (e) {
      console.error('Error checking Gemini:', e);
    }

    if (geminiAvailable) {
      statusIcon.src = '../../icons/gemini-logo.png';
      statusIcon.alt = 'Gemini';
      statusText.textContent = 'Powered by Gemini Nano';
      statusLabel.textContent = 'ON-DEVICE';
      statusLabel.style.background = '#e6f4ea';
      statusLabel.style.color = '#34a853';
    } else if (hasOpenAIKey) {
      statusIcon.src = '../../icons/openai-logo.png';
      statusIcon.alt = 'OpenAI';
      statusText.textContent = 'OpenAI API Ready';
      statusLabel.textContent = 'CLOUD AI';
      statusLabel.style.background = '#e3f2fd';
      statusLabel.style.color = '#1976d2';
    } else {
      // First-time user / no providers configured
      statusIcon.src = '';
      statusIcon.alt = '';
      statusIcon.style.display = 'none';
      statusText.textContent = 'Ready to get started?';
      statusLabel.textContent = '';
      statusLabel.style.background = 'transparent';
      statusLabel.style.color = 'inherit';
      statusLabel.style.display = 'none';
    }
  }

  // Check Gemini Nano status
  async function checkGeminiStatus() {
    const geminiOption = primaryProvider.querySelector('option[value="gemini-nano"]');
    let isGeminiAvailable = false;
    
    try {
      if (typeof LanguageModel !== 'undefined') {
        const availability = await LanguageModel.availability();
        
        if (availability === 'readily' || availability === 'available') {
          geminiStatus.textContent = '✓ Gemini Nano is available and ready';
          geminiStatus.style.color = '#0f9d58';
          isGeminiAvailable = true;
          
          // Enable Gemini option
          geminiOption.disabled = false;
          geminiOption.textContent = 'Gemini Nano (On-Device, Private)';
        } else {
          geminiStatus.textContent = `⚠️ Gemini Nano status: ${availability}`;
          geminiStatus.style.color = '#f29900';
          
          // Disable Gemini option
          geminiOption.disabled = true;
          geminiOption.textContent = `Gemini Nano (Not Available - ${availability})`;
        }
      } else {
        geminiStatus.textContent = '❌ Gemini Nano not available';
        geminiStatus.style.color = '#d93025';
        
        // Disable Gemini option
        geminiOption.disabled = true;
        geminiOption.textContent = 'Gemini Nano (Not Available)';
      }
      
      // If Gemini is not available and currently selected, switch to OpenAI
      if (!isGeminiAvailable && primaryProvider.value === 'gemini-nano') {
        primaryProvider.value = 'openai';
      }
      
      // Update the badge based on settings
      await updateAIStatusBadge();
    } catch (error) {
      geminiStatus.textContent = '❌ Error checking status';
      geminiStatus.style.color = '#d93025';
      
      // Disable Gemini option on error
      geminiOption.disabled = true;
      geminiOption.textContent = 'Gemini Nano (Error)';
    }
  }

  // Check if API key needs unlocking and show inline unlock button
  async function checkUnlockStatus() {
    const settings = await chrome.storage.local.get(['openaiKeyEncrypted', 'primaryProvider']);
    const session = await chrome.storage.session.get(['encryptionPasscode']);
    const unlockBtn = document.getElementById('unlock-btn');
    const statusBadge = document.getElementById('status-badge-container');
    
    const isPrimaryOpenAI = settings.primaryProvider === 'openai';
    const isKeyLocked = settings.openaiKeyEncrypted && !session.encryptionPasscode;
    
    if (isPrimaryOpenAI && isKeyLocked) {
      // Encrypted but locked - show unlock button and highlight badge
      unlockBtn.classList.remove('hidden');
      statusBadge.classList.add('locked');
    } else {
      unlockBtn.classList.add('hidden');
      statusBadge.classList.remove('locked');
    }
  }

  // Unlock button - open modal
  const unlockBtn = document.getElementById('unlock-btn');
  const unlockModal = document.getElementById('unlock-modal');
  const unlockPasscodeInput = document.getElementById('unlock-passcode-input');
  const unlockSubmitBtn = document.getElementById('unlock-submit-btn');
  const unlockCancelBtn = document.getElementById('unlock-cancel-btn');
  const unlockError = document.getElementById('unlock-error');

  unlockBtn.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent status badge click from firing
    unlockModal.classList.remove('hidden');
    unlockPasscodeInput.value = '';
    unlockError.textContent = '';
    setTimeout(() => unlockPasscodeInput.focus(), 100);
  });

  unlockCancelBtn.addEventListener('click', function() {
    unlockModal.classList.add('hidden');
  });

  // Submit passcode to unlock
  unlockSubmitBtn.addEventListener('click', async function() {
    const passcode = unlockPasscodeInput.value.trim();
    
    if (!passcode) {
      unlockError.textContent = 'Please enter your passcode';
      return;
    }
    
    unlockSubmitBtn.disabled = true;
    unlockSubmitBtn.textContent = 'Unlocking...';
    unlockError.textContent = '';
    
    try {
      // Try to decrypt the key with this passcode
      const settings = await chrome.storage.local.get(['openaiKeyEncrypted']);
      if (!settings.openaiKeyEncrypted) {
        unlockError.textContent = 'No encrypted key found';
        return;
      }
      
      // Attempt decryption
      await decryptTextWithPasscode(settings.openaiKeyEncrypted, passcode);
      
      // Success! Save passcode to session
      await chrome.storage.session.set({ encryptionPasscode: passcode });
      
      // Close modal, hide unlock button, and update badge
      unlockModal.classList.add('hidden');
      await checkUnlockStatus();
      await updateAIStatusBadge();
      
      // Remove locked state from badge
      const statusBadge = document.getElementById('status-badge-container');
      statusBadge.classList.remove('locked');
      
      // Show success briefly
      unlockSubmitBtn.textContent = '✓ Unlocked!';
      setTimeout(() => {
        unlockSubmitBtn.textContent = 'Unlock';
      }, 1500);
      
    } catch (error) {
      unlockError.textContent = '❌ Incorrect passcode';
      unlockPasscodeInput.value = '';
      unlockPasscodeInput.focus();
    } finally {
      unlockSubmitBtn.disabled = false;
      unlockSubmitBtn.textContent = 'Unlock';
    }
  });

  // Allow Enter key to submit
  unlockPasscodeInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      unlockSubmitBtn.click();
    }
  });

  // Check status on load
  checkGeminiStatus();
  checkUnlockStatus();

  // Listen for storage changes and update badge in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // If primaryProvider or openaiApiKey changed, update the badge immediately
      if (changes.primaryProvider || changes.openaiApiKey || changes.openaiKeyEncrypted) {
        updateAIStatusBadge();
      }
    }
  });

  // Make status badge clickable to open settings (helpful for first-time setup)
  const statusBadge = document.querySelector('.status-badge');
  if (statusBadge) {
    statusBadge.style.cursor = 'pointer';
    statusBadge.addEventListener('click', async function() {
      settingsModal.classList.remove('hidden');
      await loadSettings();
      await checkGeminiStatus();
    });
  }

});

// Check for first-time welcome and unlock status
async function checkWelcomeAndUnlockStatus() {
  const welcomeMessage = document.getElementById('welcome-message');
  const welcomeSetupBtn = document.getElementById('welcome-setup-btn');
  
  // Check if this is first time opening the extension
  chrome.storage.local.get(['hasSeenWelcome', 'primaryProvider', 'openaiApiKey', 'openaiKeyEncrypted', 'hasSeenLockNotification'], async (result) => {
    const hasSeenWelcome = result.hasSeenWelcome || false;
    const hasPrimaryProvider = result.primaryProvider || false;
    const hasSeenLockNotification = result.hasSeenLockNotification || false;
    
    // Show welcome message if first time AND no provider configured
    if (!hasSeenWelcome && !hasPrimaryProvider) {
      // Show fullscreen welcome overlay (it covers everything with absolute positioning)
      welcomeMessage.classList.remove('hidden');
      
      // Mark as seen after showing
      chrome.storage.local.set({ hasSeenWelcome: true });
    }
    
    // Check if OpenAI key is locked (encrypted but not in session)
    if (result.primaryProvider === 'openai' && result.openaiKeyEncrypted && !result.openaiApiKey) {
      // Check if passcode is in session
      const session = await chrome.storage.session.get(['encryptionPasscode', 'shownLockAlert']);
      
      // Show alert only once per session
      if (!session.encryptionPasscode && !session.shownLockAlert) {
        // Small delay to let UI render
        setTimeout(() => {
          const shouldUnlock = confirm('🔒 Your OpenAI API key is locked.\n\nWould you like to unlock it now?');
          
          if (shouldUnlock) {
            // Open the unlock modal directly
            const unlockModal = document.getElementById('unlock-modal');
            if (unlockModal) {
              unlockModal.classList.remove('hidden');
              // Focus the passcode input
              const passcodeInput = document.getElementById('unlock-passcode-input');
              if (passcodeInput) {
                setTimeout(() => passcodeInput.focus(), 100);
              }
            }
          }
          
          // Mark as shown for this session
          chrome.storage.session.set({ shownLockAlert: true });
        }, 300);
      }
    }
  });
  
  // Welcome setup button - opens settings
  if (welcomeSetupBtn) {
    welcomeSetupBtn.addEventListener('click', function() {
      // Hide welcome overlay
      welcomeMessage.classList.add('hidden');
      
      // Open settings modal
      const settingsModal = document.getElementById('settings-modal');
      if (settingsModal) {
        settingsModal.classList.remove('hidden');
        // Trigger settings load if function exists
        if (typeof loadSettings === 'function') {
          loadSettings();
        }
        if (typeof checkGeminiStatus === 'function') {
          checkGeminiStatus();
        }
      }
    });
  }
  
}
