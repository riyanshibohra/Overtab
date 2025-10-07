// Overtab Storage Manager
// Handles history storage and retrieval

const MAX_HISTORY_ITEMS = 10;

async function saveToHistory(sourceText, resultType, result) {
  try {
    const data = await chrome.storage.local.get(['history']);
    let history = data.history || [];
    
    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      sourceText: sourceText,
      resultType: resultType,
      result: result,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    
    history.unshift(historyItem);
    
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    await chrome.storage.local.set({ history: history });
    
    console.log('Saved to history:', historyItem);
    return historyItem;
    
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

async function getHistory() {
  try {
    const data = await chrome.storage.local.get(['history']);
    return data.history || [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}

async function clearHistory() {
  try {
    await chrome.storage.local.set({ history: [] });
    console.log('History cleared');
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

async function getHistoryItem(id) {
  try {
    const history = await getHistory();
    return history.find(item => item.id === id);
  } catch (error) {
    console.error('Error getting history item:', error);
    return null;
  }
}
