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

// Demo function to test display (we'll use this in Phase 7)
function displayResult(source, explanation, simplified, translation) {
  // Set source text
  document.getElementById('result-source-text').textContent = source;
  
  // Show/hide sections based on what we have
  if (explanation) {
    document.getElementById('explanation-content').textContent = explanation;
    document.getElementById('explanation-section').classList.remove('hidden');
  }
  
  if (simplified) {
    document.getElementById('simplified-content').textContent = simplified;
    document.getElementById('simplified-section').classList.remove('hidden');
  }
  
  if (translation) {
    document.getElementById('translation-content').textContent = translation;
    document.getElementById('translation-section').classList.remove('hidden');
  }
  
  showResultDisplay();
}
