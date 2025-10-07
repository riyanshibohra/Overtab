// Overtab Content Script
// Handles text selection, tooltips, voice commands, and image interactions

let tooltip = null;
let currentSelectedText = '';
let isProcessing = false;
let tooltipEnabled = true;

chrome.storage.local.get(['tooltipEnabled'], (result) => {
  tooltipEnabled = result.tooltipEnabled !== false;
});

// Detect text selection
document.addEventListener('mouseup', function(event) {
  setTimeout(() => {
    if (!tooltipEnabled) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 2) {
      currentSelectedText = selectedText;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        showTooltip(rect);
      }
    } else {
      removeTooltip();
    }
  }, 10);
});

// Remove tooltip on click outside
document.addEventListener('mousedown', function(event) {
  if (tooltip && !tooltip.contains(event.target)) {
    removeTooltip();
  }
});

// Close tooltip with ESC key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && tooltip) {
    removeTooltip();
  }
});

// Create and show tooltip
function showTooltip(selectionRect) {
  if (tooltip) return;
  
  tooltip = document.createElement('div');
  tooltip.className = 'overtab-tooltip';
  
  tooltip.innerHTML = `
    <button class="overtab-tooltip-btn" data-action="explain">
      <span class="tooltip-btn-icon">💡</span>
      <span class="tooltip-btn-text">Explain</span>
    </button>
    <button class="overtab-tooltip-btn" data-action="simplify">
      <span class="tooltip-btn-icon">✨</span>
      <span class="tooltip-btn-text">Simplify</span>
    </button>
    <button class="overtab-tooltip-btn" data-action="translate">
      <span class="tooltip-btn-icon">🌐</span>
      <span class="tooltip-btn-text">Translate</span>
    </button>
  `;
  
  document.body.appendChild(tooltip);
  
  // Position relative to selected text
  const tooltipRect = tooltip.getBoundingClientRect();
  let left = selectionRect.left + (selectionRect.width / 2) - (tooltipRect.width / 2);
  let top = selectionRect.top - tooltipRect.height - 10;
  
  left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
  
  if (top < 10) {
    top = selectionRect.bottom + 10;
  }
  
  tooltip.style.position = 'fixed';
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  
  tooltip.querySelectorAll('.overtab-tooltip-btn').forEach(button => {
    button.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      handleAction(action);
    });
  });
}

function removeTooltip() {
  if (tooltip && tooltip.parentNode) {
    tooltip.parentNode.removeChild(tooltip);
  }
  tooltip = null;
}

// Handle tooltip button clicks
async function handleAction(action) {
  if (isProcessing) return;
  
  isProcessing = true;
  const text = currentSelectedText;
  
  removeTooltip();
  
  chrome.runtime.sendMessage({ action: 'openSidebar' });
  chrome.runtime.sendMessage({ action: 'showLoading', sourceText: text });
  
  try {
    let result;
    
    if (action === 'explain') {
      result = await explainText(text);
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: text,
        resultType: 'explanation',
        result: result
      });
    } else if (action === 'simplify') {
      result = await simplifyText(text);
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: text,
        resultType: 'simplified',
        result: result
      });
    } else if (action === 'translate') {
      result = await translateText(text, 'es');
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: text,
        resultType: 'translation',
        result: result
      });
    }
    
  } catch (error) {
    console.error(`Error in ${action}:`, error);
    chrome.runtime.sendMessage({
      action: 'showError',
      error: error.message || 'AI API not available.'
    });
  } finally {
    setTimeout(() => { isProcessing = false; }, 500);
  }
}

// Image hover detection
let hoveredImage = null;

document.addEventListener('mouseover', function(event) {
  if (event.target.tagName === 'IMG') {
    hoveredImage = event.target;
    event.target.classList.add('overtab-image-hover');
  }
});

document.addEventListener('mouseout', function(event) {
  if (event.target.tagName === 'IMG') {
    event.target.classList.remove('overtab-image-hover');
    if (hoveredImage === event.target) {
      hoveredImage = null;
    }
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.action === 'showAlert') {
    alert(message.message);
  }
  
  if (message.action === 'explainPage') {
    handleExplainPage(message.text);
  }
  
  if (message.action === 'startVoiceCapture') {
    startVoiceCapture();
  }
  
  if (message.action === 'describeImage') {
    handleDescribeImage(message.imageUrl);
  }
  
  if (message.action === 'toggleTooltip') {
    tooltipEnabled = message.enabled;
    if (!tooltipEnabled) removeTooltip();
  }
});

// Handle "Explain Page" feature
async function handleExplainPage(pageText) {
  chrome.runtime.sendMessage({ action: 'openSidebar' });
  chrome.runtime.sendMessage({
    action: 'showLoading',
    sourceText: 'Current Page'
  });
  
  try {
    const result = await explainText(pageText);
    
    chrome.runtime.sendMessage({
      action: 'showResult',
      sourceText: 'Current Page',
      resultType: 'explanation',
      result: result
    });
    
  } catch (error) {
    console.error('Error explaining page:', error);
    chrome.runtime.sendMessage({
      action: 'showError',
      error: error.message || 'AI API not available.'
    });
  }
}

// Voice command capture
function startVoiceCapture() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Voice recognition not supported.');
    return;
  }
  
  const pageTitle = document.title;
  const pageText = document.body.innerText.substring(0, 1000);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  const indicator = document.createElement('div');
  indicator.id = 'overtab-voice-indicator';
  indicator.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; z-index: 9999999; 
                background: white; padding: 20px 28px; border-radius: 12px; 
                box-shadow: 0 4px 16px rgba(0,0,0,0.15); border: 2px solid #1a73e8;">
      <div style="font-size: 18px; font-weight: 600; color: #1a73e8; margin-bottom: 8px;">
        🎤 Listening...
      </div>
      <div style="font-size: 14px; color: #5f6368; margin-bottom: 4px;">
        Ask a question about this page
      </div>
      <div style="font-size: 12px; color: #80868b; font-style: italic;">
        "${pageTitle.substring(0, 40)}${pageTitle.length > 40 ? '...' : ''}"
      </div>
    </div>
  `;
  document.body.appendChild(indicator);
  
  recognition.onresult = async function(event) {
    const transcript = event.results[0][0].transcript;
    
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    
    chrome.runtime.sendMessage({
      action: 'showLoading',
      sourceText: `Q: "${transcript}"`
    });
    
    try {
      const contextPrompt = `Page: "${pageTitle}"
      
Context: ${pageText}

Question: ${transcript}

Answer the question based on the page content above.`;
      
      const result = await promptAI(contextPrompt);
      
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: `Q: "${transcript}"`,
        resultType: 'explanation',
        result: result
      });
      
    } catch (error) {
      console.error('Error processing voice question:', error);
      chrome.runtime.sendMessage({
        action: 'showError',
        error: error.message || 'Error processing voice question. Try again!'
      });
    }
  };
  
  recognition.onerror = function(event) {
    console.error('Voice recognition error:', event.error);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    alert('Voice recognition error: ' + event.error);
  };
  
  recognition.onend = function() {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  };
  
  try {
    recognition.start();
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }
}

// Handle image description
async function handleDescribeImage(imageUrl) {
  try {
    const result = await promptAI(`Describe this image: ${imageUrl}`);
    
    chrome.runtime.sendMessage({
      action: 'showResult',
      sourceText: `Image: ${imageUrl}`,
      resultType: 'explanation',
      result: result
    });
    
  } catch (error) {
    console.error('Error describing image:', error);
    chrome.runtime.sendMessage({
      action: 'showError',
      error: error.message || 'Error describing image'
    });
  }
}
