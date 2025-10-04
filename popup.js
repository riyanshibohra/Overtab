// ============================================
// Overtab Popup JavaScript - Phase 2
// ============================================

// Wait for the popup HTML to fully load before running code
document.addEventListener('DOMContentLoaded', function() {
  
  // Get references to our three buttons
  const explainPageBtn = document.getElementById('explain-page-btn');
  const voiceCommandBtn = document.getElementById('voice-command-btn');
  const historyBtn = document.getElementById('history-btn');

  // ============================================
  // Button 1: Explain Page
  // ============================================
  explainPageBtn.addEventListener('click', function() {
    console.log('Explain Page button clicked');
    
    // For now, just show a message (we'll add real functionality in Phase 7)
    alert('📄 Explain Page feature coming soon!\n\nThis will use the Summarizer API to explain the current page.');
  });

  // ============================================
  // Button 2: Voice Command
  // ============================================
  voiceCommandBtn.addEventListener('click', function() {
    console.log('Voice Command button clicked');
    
    // For now, just show a message (we'll add real functionality in Phase 8)
    alert('🎤 Voice Command feature coming soon!\n\nThis will capture your voice and use the Prompt API to respond.');
  });

  // ============================================
  // Button 3: History
  // ============================================
  historyBtn.addEventListener('click', function() {
    console.log('History button clicked');
    
    // For now, just show a message (we'll add real functionality in Phase 9)
    alert('📜 History feature coming soon!\n\nThis will open the sidebar showing your recent explanations.');
  });

  // Log that the popup has loaded successfully
  console.log('Overtab popup loaded successfully!');
});
  