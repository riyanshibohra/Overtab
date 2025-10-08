// Overtab Sidebar Script

// Chat state management
let chatSession = null;
let chatContext = {
  sourceText: '',
  resultType: '',
  result: ''
};
let chatHistory = [];

document.addEventListener('DOMContentLoaded', function() {
  
  // Check session storage for initial state
  chrome.storage.session.get(['pendingAction', 'openTab'], (result) => {
    // Switch to specific tab if requested (like History)
    if (result.openTab) {
      const targetTab = result.openTab;
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sidebar-tab-content').forEach(tc => tc.classList.remove('active'));
      
      const tabButton = document.querySelector(`.sidebar-tab[data-tab="${targetTab}"]`);
      const tabContent = document.getElementById(`${targetTab}-tab`);
      
      if (tabButton && tabContent) {
        tabButton.classList.add('active');
        tabContent.classList.add('active');
      }
      
      // Show empty state for history tab
      showEmptyState();
      chrome.storage.session.remove(['openTab']);
    } 
    // If there's a pending action, update loading message
    else if (result.pendingAction) {
      showLoadingState(result.pendingAction);
      chrome.storage.session.remove(['pendingAction']);
      
      // Safety timeout: if no result after 30 seconds, show error
      setTimeout(() => {
        const loadingVisible = !document.getElementById('loading-state').classList.contains('hidden');
        if (loadingVisible) {
          console.warn('⚠️ Loading timeout');
          showError('Request timed out. Please try again.');
        }
      }, 30000);
    }
    // No pending action: keep showing "Ready to assist..." until action triggered
    // Don't timeout to empty - just stay ready!
  });
  
  const tabs = document.querySelectorAll('.sidebar-tab');
  const tabContents = document.querySelectorAll('.sidebar-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(targetTab + '-tab').classList.add('active');
    });
  });
  
  // Close button
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', function() {
    window.close();
  });
  
  // Clear history button
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  clearHistoryBtn.addEventListener('click', async function() {
    if (confirm('Clear all history?')) {
      await clearHistoryStorage();
      loadHistory();
    }
  });
  
  loadHistory();
  
  // Links tab - Generate Links button
  const generateLinksBtn = document.getElementById('generate-links-btn');
  if (generateLinksBtn) {
    generateLinksBtn.addEventListener('click', async function() {
      await generateSimilarLinksForPage();
    });
  }
  
  // Links tab - Refresh Links button
  const refreshLinksBtn = document.getElementById('refresh-links-btn');
  if (refreshLinksBtn) {
    refreshLinksBtn.addEventListener('click', async function() {
      await generateSimilarLinksForPage();
    });
  }
  
  // Source toggle
  const sourceToggle = document.getElementById('source-toggle');
  if (sourceToggle) {
    sourceToggle.addEventListener('click', function() {
      const sourceContent = document.getElementById('source-content');
      const toggleIcon = this.querySelector('.toggle-icon');
      
      if (sourceContent.classList.contains('collapsed')) {
        sourceContent.classList.remove('collapsed');
        toggleIcon.textContent = '▼';
      } else {
        sourceContent.classList.add('collapsed');
        toggleIcon.textContent = '▶';
      }
    });
  }
  
  // Copy buttons
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('copy-btn')) {
      const contentType = event.target.getAttribute('data-content');
      const contentElement = document.getElementById(`${contentType}-content`);
      const text = contentElement.textContent;
      
      navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Copied to clipboard!');
        event.target.textContent = '✓';
        setTimeout(() => {
          event.target.textContent = '📋';
        }, 1000);
      }).catch(err => {
        console.error('Copy failed:', err);
        showToast('❌ Copy failed');
      });
    }
  });
  
  // Continue conversation button
  const continueConversationBtn = document.getElementById('continue-conversation-btn');
  if (continueConversationBtn) {
    continueConversationBtn.addEventListener('click', function() {
      initializeChat();
      switchToTab('chat');
    });
  }
  
  // Chat input handling
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  
  if (chatInput) {
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Send on Enter (Shift+Enter for new line)
    chatInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
      }
    });
  }
  
  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendChatMessage);
  }
  
  // Chat action buttons
  const chatClearBtn = document.getElementById('chat-clear-btn');
  const chatNewBtn = document.getElementById('chat-new-btn');
  
  if (chatClearBtn) {
    chatClearBtn.addEventListener('click', function() {
      if (confirm('Clear this conversation?')) {
        clearChat();
      }
    });
  }
  
  if (chatNewBtn) {
    chatNewBtn.addEventListener('click', function() {
      if (confirm('Start a new conversation? Current context will be cleared.')) {
        resetChat();
      }
    });
  }
  
  // Listen for messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action === 'showLoading') {
      showLoadingState(message.actionType);
    }
    
    if (message.action === 'showResult') {
      displayAIResult(message.sourceText, message.resultType, message.result);
    }
    
    if (message.action === 'showError') {
      showError(message.error);
    }
  });
});

// State management functions
function showLoadingState(actionType = 'explain') {
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('result-display').classList.add('hidden');
  
  // Update loading message based on action
  const loadingMsg = document.getElementById('loading-message');
  const messages = {
    'explain': 'Analyzing text...',
    'simplify': 'Simplifying...',
    'translate': 'Translating...',
    'proofread': 'Checking grammar...',
    'describe': 'Analyzing image...'
  };
  
  if (loadingMsg) {
    loadingMsg.textContent = messages[actionType] || 'Processing...';
  }
}

function showEmptyState() {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('empty-state').classList.remove('hidden');
  document.getElementById('result-display').classList.add('hidden');
}

function showResultDisplay() {
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('result-display').classList.remove('hidden');
}

function showEmptyState() {
  document.getElementById('empty-state').classList.remove('hidden');
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('result-display').classList.add('hidden');
}

function clearCurrentResult() {
  showEmptyState();
}

async function clearHistoryStorage() {
  await clearHistory();
}

// Format AI result text with proper structure
function formatAIResult(text) {
  if (!text) return '';
  
  // Remove markdown headers (##, ###, etc.) - replace with plain text
  text = text.replace(/^#+\s+/gm, '');
  
  // Split into lines first (before any replacements)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const formatted = lines.map(line => {
    // Check for bullet points BEFORE processing markdown
    const isBullet = line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ');
    const isNumbered = /^\d+\.\s/.test(line);
    
    // Convert **bold** to <strong> in the line
    let processed = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle list items
    if (isBullet) {
      // Remove bullet marker
      processed = processed.replace(/^[\*\-•]\s+/, '');
      return `<li>${processed}</li>`;
    } else if (isNumbered) {
      // Remove number
      processed = processed.replace(/^\d+\.\s+/, '');
      return `<li>${processed}</li>`;
    } else {
      // Regular paragraph
      return `<p>${processed}</p>`;
    }
  });
  
  // Wrap consecutive <li> in <ul>
  let result = '';
  let inList = false;
  
  for (const item of formatted) {
    if (item.startsWith('<li>')) {
      if (!inList) {
        result += '<ul>';
        inList = true;
      }
      result += item;
    } else {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      result += item;
    }
  }
  
  if (inList) result += '</ul>';
  
  return result;
}

// Display AI result
async function displayAIResult(sourceText, resultType, result) {
  document.getElementById('result-source-text').textContent = sourceText;
  
  // Store context for chat
  chatContext = { sourceText, resultType, result };
  
  document.getElementById('explanation-section').classList.add('hidden');
  document.getElementById('simplified-section').classList.add('hidden');
  document.getElementById('translation-section').classList.add('hidden');
  document.getElementById('proofread-section').classList.add('hidden');
  
  if (resultType === 'explanation') {
    const formattedResult = formatAIResult(result);
    document.getElementById('explanation-content').innerHTML = formattedResult;
    document.getElementById('explanation-section').classList.remove('hidden');
  } else if (resultType === 'simplified') {
    const formattedResult = formatAIResult(result);
    document.getElementById('simplified-content').innerHTML = formattedResult;
    document.getElementById('simplified-section').classList.remove('hidden');
  } else if (resultType === 'translation') {
    // For translations: preserve exact formatting without auto-formatting
    // Just escape HTML and convert line breaks
    const translationHTML = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    document.getElementById('translation-content').innerHTML = translationHTML;
    document.getElementById('translation-section').classList.remove('hidden');
  } else if (resultType === 'proofread') {
    // For proofreading: show corrected text with basic formatting
    const proofreadHTML = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    document.getElementById('proofread-content').innerHTML = proofreadHTML;
    document.getElementById('proofread-section').classList.remove('hidden');
  }
  
  showResultDisplay();
  
  // Show "Continue conversation" button
  document.getElementById('continue-conversation-container').classList.remove('hidden');
  
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-tab-content').forEach(tc => tc.classList.remove('active'));
  document.querySelector('.sidebar-tab[data-tab="result"]').classList.add('active');
  document.getElementById('result-tab').classList.add('active');
  
  await saveToHistory(sourceText, resultType, result);
  loadHistory();
}

function showError(errorMessage) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('result-display').classList.add('hidden');
  
  const emptyState = document.getElementById('empty-state');
  emptyState.classList.remove('hidden');
  emptyState.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <h2>Error</h2>
    <p>${errorMessage}</p>
  `;
}

// History functions
async function loadHistory() {
  const history = await getHistory();
  const historyList = document.getElementById('history-list');
  const historyEmptyState = document.getElementById('history-empty-state');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  
  if (history.length === 0) {
    historyList.classList.add('hidden');
    historyEmptyState.classList.remove('hidden');
    clearHistoryBtn.classList.add('hidden');
  } else {
    historyList.classList.remove('hidden');
    historyEmptyState.classList.add('hidden');
    clearHistoryBtn.classList.remove('hidden');
    
    historyList.innerHTML = history.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item-header">
          <span class="history-item-icon">${getIconForType(item.resultType)}</span>
          <span class="history-item-type">${capitalizeFirst(item.resultType)}</span>
          <span class="history-item-time">${item.time}</span>
        </div>
        <div class="history-item-source">
          ${item.sourceText.substring(0, 60)}${item.sourceText.length > 60 ? '...' : ''}
        </div>
      </div>
    `).join('');
    
    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const historyItem = await getHistoryItem(id);
        if (historyItem) {
          displayAIResult(historyItem.sourceText, historyItem.resultType, historyItem.result);
        }
      });
    });
  }
}

function getIconForType(type) {
  const icons = {
    explanation: '💡',
    simplified: '✨',
    translation: '🌐'
  };
  return icons[type] || '📄';
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Toast notifications
function showToast(message, duration = 2000) {
  const existing = document.getElementById('overtab-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'overtab-toast';
  toast.className = 'overtab-toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Chat functionality
function switchToTab(tabName) {
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-tab-content').forEach(tc => tc.classList.remove('active'));
  
  const tabButton = document.querySelector(`.sidebar-tab[data-tab="${tabName}"]`);
  const tabContent = document.getElementById(`${tabName}-tab`);
  
  if (tabButton && tabContent) {
    tabButton.classList.add('active');
    tabContent.classList.add('active');
  }
}

async function initializeChat() {
  console.log('💬 Initializing chat with context:', chatContext);
  
  // Show chat interface
  document.getElementById('chat-empty-state').classList.add('hidden');
  document.getElementById('chat-messages-container').classList.remove('hidden');
  document.getElementById('chat-input-container').classList.remove('hidden');
  
  // If this is first time opening chat with this context, add context message
  if (chatHistory.length === 0 && chatContext.result) {
    const contextMessage = createContextMessage();
    addMessageToChat('system', contextMessage);
    
    // Create AI session with initial context (only for Gemini Nano)
    // OpenAI doesn't need a persistent session - it's stateless
    try {
      const prefs = await chrome.storage.local.get(['primaryProvider', 'openaiApiKey', 'openaiKeyEncrypted']);
      const isPrimaryOpenAI = prefs.primaryProvider === 'openai' && (prefs.openaiApiKey || prefs.openaiKeyEncrypted);
      
      if (!isPrimaryOpenAI && typeof LanguageModel !== 'undefined') {
        const availability = await LanguageModel.availability();
        if (availability === 'readily' || availability === 'available') {
          chatSession = await LanguageModel.create({
            language: 'en',
            temperature: 0.8,
            topK: 40
          });
          console.log('✅ Gemini Nano chat session created');
        }
      } else if (isPrimaryOpenAI) {
        console.log('✅ Using OpenAI for chat (no session needed)');
      }
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  }
  
  // Focus input
  document.getElementById('chat-input').focus();
}

function createContextMessage() {
  const actionLabels = {
    'explanation': 'explained',
    'simplified': 'simplified',
    'translation': 'translated',
    'proofread': 'proofread'
  };
  
  const action = actionLabels[chatContext.resultType] || 'analyzed';
  const preview = chatContext.sourceText.substring(0, 80);
  
  return `I've ${action} the following text for you:\n\n"${preview}${chatContext.sourceText.length > 80 ? '...' : ''}"\n\nFeel free to ask me follow-up questions, request clarifications, or explore related topics!`;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addMessageToChat('user', message);
  input.value = '';
  input.style.height = 'auto';
  
  // Disable input while processing
  input.disabled = true;
  document.getElementById('chat-send-btn').disabled = true;
  
  // Add loading indicator
  const loadingId = addMessageToChat('assistant', '...');
  
  try {
    // Extract topic/subject from context for reference
    const contextTopic = chatContext.sourceText.substring(0, 150).replace(/\n/g, ' ');
    
    // Build conversation context - EXTREMELY directive to use knowledge base
    const systemPrompt = `You are an expert AI assistant with extensive knowledge. The user is asking about topics related to: "${contextTopic}..."

YOUR ROLE:
- Provide detailed, factual information from your training data and knowledge base
- NEVER say "the text doesn't provide" or "I don't have information" - you DO have information!
- When asked about historical events, people, or topics - share what you KNOW from your training
- Give comprehensive answers with specific facts, dates, names, and details from your knowledge
- Think of yourself as an encyclopedia, not just a text summarizer

RESPONSE STYLE:
- Be informative and educational
- Include specific details and facts
- Maximum 2-3 sentences OR 3 detailed bullet points
- Use your full knowledge - don't be limited by the reference text above`;

    // Build full prompt with history
    let fullPrompt = systemPrompt + '\n\n';
    
    // Add recent chat history (last 5 exchanges)
    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.text}\n\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `Assistant: ${msg.text}\n\n`;
      }
    });
    
    fullPrompt += `User: ${message}\n\nAssistant:`;
    
    // Get AI response
    let response;
    const prefs = await chrome.storage.local.get(['primaryProvider', 'fallbackPreference', 'openaiApiKey', 'openaiKeyEncrypted', 'openaiModel', 'openaiTemperature']);
    const isPrimaryOpenAI = prefs.primaryProvider === 'openai' && (prefs.openaiApiKey || prefs.openaiKeyEncrypted);
    
    // Get the actual API key (might be encrypted)
    let openaiApiKey = prefs.openaiApiKey || null;
    if (!openaiApiKey && prefs.openaiKeyEncrypted) {
      try {
        const session = await chrome.storage.session.get(['encryptionPasscode']);
        if (session.encryptionPasscode) {
          openaiApiKey = await decryptTextWithPasscode(prefs.openaiKeyEncrypted, session.encryptionPasscode);
          console.log('💬 [CHAT] Successfully decrypted OpenAI API key');
        } else {
          console.warn('💬 [CHAT] OpenAI key is locked - passcode not available');
        }
      } catch (err) {
        console.error('💬 [CHAT] Error decrypting OpenAI key:', err);
      }
    }
    
    // If OpenAI is primary but key is not available, show helpful error
    if (isPrimaryOpenAI && !openaiApiKey) {
      removeMessage(loadingId);
      addMessageToChat('assistant', '🔒 OpenAI API key is locked. Please unlock it in the settings or use the extension popup to unlock.');
      input.disabled = false;
      document.getElementById('chat-send-btn').disabled = false;
      input.focus();
      return;
    }
    
    // Try OpenAI first if it's the primary provider
    if (isPrimaryOpenAI && !response && openaiApiKey) {
      try {
        console.log('💬 [CHAT] Using OpenAI (Primary Provider)');
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: prefs.openaiModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...chatHistory.slice(-10).map(h => ({ role: h.role, content: h.text })),
              { role: 'user', content: message }
            ],
            temperature: prefs.openaiTemperature || 0.8,
            max_tokens: 500
          })
        });
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          response = data.choices[0].message.content;
        } else {
          console.error('OpenAI primary failed, trying Gemini Nano');
        }
      } catch (err) {
        console.error('OpenAI primary error:', err);
      }
    }
    
    // Try Gemini Nano if not using OpenAI primary or if primary failed
    if (!response && chatSession) {
      try {
        // IMPORTANT: Use fullPrompt (with context + history) instead of just message
        response = await chatSession.prompt(fullPrompt);
      } catch (err) {
        console.error('Chat session error:', err);
      }
    }
    
    if (!response && typeof LanguageModel !== 'undefined') {
      try {
        const availability = await LanguageModel.availability();
        if (availability === 'readily' || availability === 'available') {
          const tempSession = await LanguageModel.create({
            language: 'en',
            temperature: 0.8,
            topK: 40
          });
          response = await tempSession.prompt(fullPrompt);
          tempSession.destroy();
        }
      } catch (err) {
        console.log('Gemini Nano failed:', err);
      }
    }
    
    // Try OpenAI as fallback if Gemini Nano failed and fallback is allowed
    if (!response && !isPrimaryOpenAI && prefs.fallbackPreference === 'try-other' && openaiApiKey) {
      try {
        console.log('💬 [CHAT] Using OpenAI (Fallback Provider)');
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: prefs.openaiModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...chatHistory.slice(-10).map(h => ({ role: h.role, content: h.text })),
              { role: 'user', content: message }
            ],
            temperature: prefs.openaiTemperature || 0.8,
            max_tokens: 500
          })
        });
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          response = data.choices[0].message.content;
        }
      } catch (err) {
        console.error('OpenAI fallback error:', err);
      }
    }
    
    // If still no response, throw error
    if (!response) {
      throw new Error('No AI available. Please configure OpenAI API in settings or enable Gemini Nano.');
    }
    
    // Remove loading indicator and add real response
    removeMessage(loadingId);
    addMessageToChat('assistant', response);
    
    // Store in history
    chatHistory.push({ role: 'user', text: message });
    chatHistory.push({ role: 'assistant', text: response });
    
  } catch (error) {
    console.error('Chat error:', error);
    removeMessage(loadingId);
    addMessageToChat('assistant', '❌ Sorry, I encountered an error. Please try again or start a new conversation.');
  } finally {
    input.disabled = false;
    document.getElementById('chat-send-btn').disabled = false;
    input.focus();
  }
}

function addMessageToChat(role, text) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageId = 'msg-' + Date.now();
  
  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = `chat-message chat-message-${role}`;
  
  if (role === 'system') {
    messageDiv.innerHTML = `
      <div class="chat-message-content chat-message-system">
        <div class="chat-system-icon">💬</div>
        <div class="chat-system-text">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
      </div>
    `;
  } else if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="chat-message-content">
        <div class="chat-message-avatar">👤</div>
        <div class="chat-message-text">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
      </div>
    `;
  } else if (role === 'assistant') {
    const formattedText = text === '...' ? '<div class="chat-loading-dots"><span></span><span></span><span></span></div>' : formatAIResult(text);
    messageDiv.innerHTML = `
      <div class="chat-message-content">
        <div class="chat-message-avatar">🤖</div>
        <div class="chat-message-text">${formattedText}</div>
      </div>
    `;
  }
  
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageId;
}

function removeMessage(messageId) {
  const message = document.getElementById(messageId);
  if (message) {
    message.remove();
  }
}

function clearChat() {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = '';
  chatHistory = [];
  
  // Re-add context message
  if (chatContext.result) {
    const contextMessage = createContextMessage();
    addMessageToChat('system', contextMessage);
  }
  
  showToast('💬 Conversation cleared');
}

function resetChat() {
  // Clear everything
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = '';
  chatHistory = [];
  
  // Destroy session
  if (chatSession) {
    try {
      chatSession.destroy();
    } catch (e) {
      console.log('Session already destroyed');
    }
    chatSession = null;
  }
  
  // Clear context
  chatContext = { sourceText: '', resultType: '', result: '' };
  
  // Show empty state
  document.getElementById('chat-empty-state').classList.remove('hidden');
  document.getElementById('chat-messages-container').classList.add('hidden');
  document.getElementById('chat-input-container').classList.add('hidden');
  
  showToast('✨ Chat reset');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update AI status badge in sidebar with appropriate icon and text
async function updateSidebarAIStatus() {
  const prefs = await chrome.storage.local.get(['primaryProvider', 'openaiApiKey', 'openaiKeyEncrypted']);
  const statusIcon = document.getElementById('sidebar-ai-icon');
  const statusText = document.getElementById('sidebar-status-text');
  const statusLabel = document.getElementById('sidebar-status-label');
  
  if (!statusIcon || !statusText || !statusLabel) return;
  
  // Check if user has chosen OpenAI as primary
  if (prefs.primaryProvider === 'openai' && (prefs.openaiApiKey || prefs.openaiKeyEncrypted)) {
    statusIcon.src = '../../icons/openai-logo.png';
    statusIcon.alt = 'OpenAI';
    statusText.textContent = 'Using OpenAI API';
    statusLabel.textContent = 'CLOUD AI';
    statusLabel.style.background = '#e3f2fd';
    statusLabel.style.color = '#1976d2';
  } else {
    // Default to Gemini Nano
    statusIcon.src = '../../icons/gemini-logo.png';
    statusIcon.alt = 'Gemini';
    statusText.textContent = 'Powered by Gemini Nano';
    statusLabel.textContent = 'ON-DEVICE';
    statusLabel.style.background = '#e6f4ea';
    statusLabel.style.color = '#34a853';
  }
}

// Similar Links functionality
async function generateSimilarLinksForPage() {
  try {
    // Show loading state
    showLinksLoadingState();
    
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('Could not get current tab information');
    }
    
    // Extract page metadata
    const pageTitle = tab.title || 'Current Page';
    const pageUrl = tab.url || '';
    
    // Get page description from meta tags if available
    let pageDescription = '';
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const metaDesc = document.querySelector('meta[name="description"]');
          const metaOgDesc = document.querySelector('meta[property="og:description"]');
          return metaDesc?.content || metaOgDesc?.content || '';
        }
      });
      pageDescription = result?.result || '';
    } catch (err) {
      console.log('Could not extract page description:', err);
    }
    
    console.log('🔗 Generating links for:', { pageTitle, pageDescription, pageUrl });
    
    // Generate similar links using AI (function from ai-helper.js)
    const aiResponse = await generateSimilarLinks(pageTitle, pageDescription, pageUrl);
    
    console.log('🔗 AI Response:', aiResponse);
    
    // Parse the response
    const links = parseSimilarLinksResponse(aiResponse);
    
    if (links.length === 0) {
      throw new Error('No links were generated. Please try again.');
    }
    
    // Display the links
    displaySimilarLinks(links, pageTitle);
    
  } catch (error) {
    console.error('Error generating similar links:', error);
    showLinksError(error.message || 'Failed to generate links. Please try again.');
  }
}

function parseSimilarLinksResponse(response) {
  const links = [];
  const lines = response.split('\n').filter(line => line.trim().length > 0);
  
  for (const line of lines) {
    // Skip demo mode prefix if present
    if (line.startsWith('Demo mode:')) continue;
    
    // Try to parse the line as TITLE|||URL|||DESCRIPTION
    const parts = line.split('|||');
    if (parts.length === 3) {
      const title = parts[0].trim().replace(/^\d+\.\s*/, ''); // Remove numbering if present
      const url = parts[1].trim();
      const description = parts[2].trim();
      
      // Validate URL
      if (url.startsWith('http://') || url.startsWith('https://')) {
        links.push({ title, url, description });
      }
    } else {
      // Try to parse markdown-style links or other formats
      // Format: [Title](URL) - Description
      const markdownMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)\s*-?\s*(.*)/);
      if (markdownMatch) {
        const title = markdownMatch[1].trim().replace(/^\d+\.\s*/, '');
        const url = markdownMatch[2].trim();
        const description = markdownMatch[3].trim() || 'No description available';
        
        if (url.startsWith('http://') || url.startsWith('https://')) {
          links.push({ title, url, description });
        }
      }
    }
  }
  
  return links;
}

function showLinksLoadingState() {
  document.getElementById('links-empty-state').classList.add('hidden');
  document.getElementById('links-loading-state').classList.remove('hidden');
  document.getElementById('links-display').classList.add('hidden');
}

function showLinksEmptyState() {
  document.getElementById('links-empty-state').classList.remove('hidden');
  document.getElementById('links-loading-state').classList.add('hidden');
  document.getElementById('links-display').classList.add('hidden');
}

function displaySimilarLinks(links, pageTitle) {
  // Update page title context
  document.getElementById('links-page-title').textContent = pageTitle;
  
  // Generate links HTML
  const linksList = document.getElementById('links-list');
  linksList.innerHTML = links.map((link, index) => `
    <div class="link-item">
      <div class="link-number">${index + 1}</div>
      <div class="link-content">
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-title">
          ${escapeHtml(link.title)}
          <svg class="link-external-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10 6.5V10H2V2H5.5M7 2H10M10 2V5M10 2L5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
        <p class="link-description">${escapeHtml(link.description)}</p>
      </div>
    </div>
  `).join('');
  
  // Show the display
  document.getElementById('links-empty-state').classList.add('hidden');
  document.getElementById('links-loading-state').classList.add('hidden');
  document.getElementById('links-display').classList.remove('hidden');
}

function showLinksError(message) {
  const emptyState = document.getElementById('links-empty-state');
  emptyState.classList.remove('hidden');
  document.getElementById('links-loading-state').classList.add('hidden');
  document.getElementById('links-display').classList.add('hidden');
  
  emptyState.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <h2>Error</h2>
    <p>${escapeHtml(message)}</p>
    <button id="generate-links-btn" class="generate-links-btn">
      🔄 Try Again
    </button>
  `;
  
  // Re-attach event listener
  const retryBtn = document.getElementById('generate-links-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', async function() {
      await generateSimilarLinksForPage();
    });
  }
}

// Initialize status badge on load
updateSidebarAIStatus();

// Listen for storage changes and update badge in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    // If primaryProvider or openaiApiKey changed, update the badge immediately
    if (changes.primaryProvider || changes.openaiApiKey) {
      updateSidebarAIStatus();
    }
  }
});
