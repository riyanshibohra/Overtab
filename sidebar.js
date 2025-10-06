// ============================================
// Overtab Sidebar JavaScript - Phase 6
// ============================================

console.log('Overtab sidebar loaded');

// ============================================
// Tab Switching
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  
  const tabs = document.querySelectorAll('.sidebar-tab');
  const tabContents = document.querySelectorAll('.sidebar-tab-content');
  
  // Handle tab clicks
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      // Add active to clicked tab
      this.classList.add('active');
      document.getElementById(targetTab + '-tab').classList.add('active');
      
      console.log('Switched to tab:', targetTab);
    });
  });
  
  // ============================================
  // Close Button (X in header)
  // ============================================
  
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', function() {
    // Close the sidebar
    window.close();
  });
  
  // ============================================
  // Clear History Button
  // ============================================
  
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  clearHistoryBtn.addEventListener('click', async function() {
    if (confirm('Clear all history?')) {
      await clearHistoryStorage();
      loadHistory();
    }
  });
  
  // Load history when page loads
  loadHistory();
  
  // ============================================
  // Phase 11: Copy buttons
  // ============================================
  
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('copy-btn')) {
      const contentType = event.target.getAttribute('data-content');
      const contentElement = document.getElementById(`${contentType}-content`);
      const text = contentElement.textContent;
      
      // Copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Copied to clipboard!');
        // Brief animation on button
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
  
  console.log('Sidebar initialized');
  
  // ============================================
  // Listen for messages from content script
  // ============================================
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Sidebar received message:', message);
    
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

// ============================================
// Helper Functions
// ============================================

// Show different states
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

// Clear current result
function clearCurrentResult() {
  showEmptyState();
  console.log('Result cleared');
}

// Clear history
async function clearHistoryStorage() {
  await clearHistory(); // From storage-manager.js
  console.log('History cleared');
}

// Display AI result
async function displayAIResult(sourceText, resultType, result) {
  // Set source text
  document.getElementById('result-source-text').textContent = sourceText;
  
  // Hide all sections first
  document.getElementById('explanation-section').classList.add('hidden');
  document.getElementById('simplified-section').classList.add('hidden');
  document.getElementById('translation-section').classList.add('hidden');
  
  // Show the appropriate section
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
  
  // Switch to Result tab
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-tab-content').forEach(tc => tc.classList.remove('active'));
  document.querySelector('.sidebar-tab[data-tab="result"]').classList.add('active');
  document.getElementById('result-tab').classList.add('active');
  
  // Save to history
  await saveToHistory(sourceText, resultType, result);
  
  // Reload history display
  loadHistory();
}

// Show error message
function showError(errorMessage) {
  // Use the empty state to show error
  const emptyState = document.getElementById('empty-state');
  emptyState.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <h2>Error</h2>
    <p>${errorMessage}</p>
  `;
  showEmptyState();
}

// ============================================
// Phase 9: History Functions
// ============================================

// Load and display history
async function loadHistory() {
  const history = await getHistory();
  const historyList = document.getElementById('history-list');
  const historyEmptyState = document.getElementById('history-empty-state');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  
  if (history.length === 0) {
    // Show empty state
    historyList.classList.add('hidden');
    historyEmptyState.classList.remove('hidden');
    clearHistoryBtn.classList.add('hidden');
  } else {
    // Show history items
    historyList.classList.remove('hidden');
    historyEmptyState.classList.add('hidden');
    clearHistoryBtn.classList.remove('hidden');
    
    // Build history HTML
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
    
    // Add click handlers to history items
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

// Helper: Get icon for result type
function getIconForType(type) {
  const icons = {
    explanation: '💡',
    simplified: '✨',
    translation: '🌐'
  };
  return icons[type] || '📄';
}

// Helper: Capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// Phase 11: Toast Notification System
// ============================================

function showToast(message, duration = 2000) {
  // Remove existing toast if any
  const existing = document.getElementById('overtab-toast');
  if (existing) existing.remove();
  
  // Create toast
  const toast = document.createElement('div');
  toast.id = 'overtab-toast';
  toast.className = 'overtab-toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
