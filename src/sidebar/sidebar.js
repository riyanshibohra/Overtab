// Overtab Sidebar Script

document.addEventListener('DOMContentLoaded', function() {
  
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
      showLoadingState();
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
function showEmptyState() {
  document.getElementById('empty-state').classList.remove('hidden');
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('result-display').classList.add('hidden');
}

function showLoadingState() {
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('result-display').classList.add('hidden');
}

function showResultDisplay() {
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('result-display').classList.remove('hidden');
}

function clearCurrentResult() {
  showEmptyState();
}

async function clearHistoryStorage() {
  await clearHistory();
}

// Display AI result
async function displayAIResult(sourceText, resultType, result) {
  document.getElementById('result-source-text').textContent = sourceText;
  
  document.getElementById('explanation-section').classList.add('hidden');
  document.getElementById('simplified-section').classList.add('hidden');
  document.getElementById('translation-section').classList.add('hidden');
  
  if (resultType === 'explanation') {
    document.getElementById('explanation-content').textContent = result;
    document.getElementById('explanation-section').classList.remove('hidden');
  } else if (resultType === 'simplified') {
    document.getElementById('simplified-content').textContent = result;
    document.getElementById('simplified-section').classList.remove('hidden');
  } else if (resultType === 'translation') {
    document.getElementById('translation-content').textContent = result;
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
  const emptyState = document.getElementById('empty-state');
  emptyState.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <h2>Error</h2>
    <p>${errorMessage}</p>
  `;
  showEmptyState();
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
