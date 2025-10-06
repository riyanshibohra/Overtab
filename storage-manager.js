// ============================================
// Overtab Storage Manager - Phase 9
// ============================================
// Handles saving and retrieving history

const MAX_HISTORY_ITEMS = 10;

// ============================================
// Save a result to history
// ============================================

async function saveToHistory(sourceText, resultType, result) {
  try {
    // Get existing history
    const data = await chrome.storage.local.get(['history']);
    let history = data.history || [];
    
    // Create new history item
    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      sourceText: sourceText,
      resultType: resultType,
      result: result,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    
    // Add to beginning of array
    history.unshift(historyItem);
    
    // Keep only last 10 items
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // Save back to storage
    await chrome.storage.local.set({ history: history });
    
    console.log('Saved to history:', historyItem);
    return historyItem;
    
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

// ============================================
// Get all history items
// ============================================

async function getHistory() {
  try {
    const data = await chrome.storage.local.get(['history']);
    return data.history || [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}

// ============================================
// Clear all history
// ============================================

async function clearHistory() {
  try {
    await chrome.storage.local.set({ history: [] });
    console.log('History cleared');
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

// ============================================
// Get a single history item by ID
// ============================================

async function getHistoryItem(id) {
  try {
    const history = await getHistory();
    return history.find(item => item.id === id);
  } catch (error) {
    console.error('Error getting history item:', error);
    return null;
  }
}
