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
    return historyItem;
    
  } catch (error) {
    // Silent fail
  }
}

async function getHistory() {
  try {
    const data = await chrome.storage.local.get(['history']);
    return data.history || [];
  } catch (error) {
    return [];
  }
}

async function clearHistory() {
  try {
    await chrome.storage.local.set({ history: [] });
  } catch (error) {
    // Silent fail
  }
}

async function getHistoryItem(id) {
  try {
    const history = await getHistory();
    return history.find(item => item.id === id);
  } catch (error) {
    return null;
  }
}
