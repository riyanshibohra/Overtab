// Overtab Sidebar Script

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
      
      chrome.storage.session.remove(['openTab']);
    } 
    // If there's a pending action, show active loading
    else if (result.pendingAction) {
      showLoadingState(result.pendingAction);
      chrome.storage.session.remove(['pendingAction']);
    }
    // Default: empty state is already showing (no spinner)
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
    'describe': 'Analyzing image...'
  };
  
  if (loadingMsg) {
    loadingMsg.textContent = messages[actionType] || 'Processing...';
  }
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
  
  // First, handle markdown formatting in the entire text
  // Convert **bold** to <strong>bold</strong>
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert bullet points: * or • to proper HTML
  let formatted = text
    .split('\n')
    .map(line => {
      line = line.trim();
      
      // Skip if empty
      if (line.length === 0) return '';
      
      // Bullet points (but not markdown bold which uses **)
      if ((line.startsWith('*') && !line.startsWith('**')) || line.startsWith('•') || line.startsWith('-')) {
        let content = line.substring(1).trim();
        // Remove any remaining single * that might be markdown artifacts
        content = content.replace(/^\*+/, '').trim();
        return `<li>${content}</li>`;
      }
      // Numbered lists
      else if (/^\d+\./.test(line)) {
        return `<li>${line.replace(/^\d+\.\s*/, '')}</li>`;
      }
      // Regular paragraphs
      else {
        return `<p>${line}</p>`;
      }
    })
    .filter(line => line.length > 0);
  
  // Wrap consecutive <li> in <ul>
  let result = '';
  let inList = false;
  
  for (const line of formatted) {
    if (line.startsWith('<li>')) {
      if (!inList) {
        result += '<ul>';
        inList = true;
      }
      result += line;
    } else {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      result += line;
    }
  }
  
  if (inList) result += '</ul>';
  
  return result;
}

// Display AI result
async function displayAIResult(sourceText, resultType, result) {
  document.getElementById('result-source-text').textContent = sourceText;
  
  document.getElementById('explanation-section').classList.add('hidden');
  document.getElementById('simplified-section').classList.add('hidden');
  document.getElementById('translation-section').classList.add('hidden');
  
  const formattedResult = formatAIResult(result);
  
  if (resultType === 'explanation') {
    document.getElementById('explanation-content').innerHTML = formattedResult;
    document.getElementById('explanation-section').classList.remove('hidden');
  } else if (resultType === 'simplified') {
    document.getElementById('simplified-content').innerHTML = formattedResult;
    document.getElementById('simplified-section').classList.remove('hidden');
  } else if (resultType === 'translation') {
    document.getElementById('translation-content').innerHTML = formattedResult;
    document.getElementById('translation-section').classList.remove('hidden');
  }
  
  showResultDisplay();
  
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
