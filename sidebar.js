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
  // Clear Button (in header)
  // ============================================
  
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', function() {
    clearCurrentResult();
  });
  
  // ============================================
  // Clear History Button
  // ============================================
  
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  clearHistoryBtn.addEventListener('click', function() {
    if (confirm('Clear all history?')) {
      clearHistory();
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
function clearHistory() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  historyList.classList.add('hidden');
  
  document.getElementById('history-empty-state').classList.remove('hidden');
  document.getElementById('clear-history-btn').classList.add('hidden');
  
  console.log('History cleared');
}

// Display AI result
function displayAIResult(sourceText, resultType, result) {
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
