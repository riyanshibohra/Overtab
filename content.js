// ============================================
// Overtab Content Script - Phase 4
// ============================================
// This runs on every webpage and handles:
// - Text selection detection
// - Showing tooltip with action buttons

console.log('Overtab content script loaded on:', window.location.href);

let tooltip = null;  // Will hold our tooltip element
let currentSelectedText = '';  // Store the current selection
let isProcessing = false;  // Prevent multiple simultaneous requests

// ============================================
// Phase 4: Detect when user highlights text
// ============================================

document.addEventListener('mouseup', function(event) {
  // Small delay to ensure selection is complete
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // Only show tooltip if user selected some text (at least 3 characters)
    if (selectedText.length > 2) {
      console.log('User selected text:', selectedText);
      currentSelectedText = selectedText;
      
      // Get the position of the selected text (not mouse!)
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        showTooltip(rect);
      }
    } else {
      // Remove tooltip if no text selected
      removeTooltip();
    }
  }, 10);
});

// Also remove tooltip when clicking elsewhere
document.addEventListener('mousedown', function(event) {
  // If clicking outside the tooltip, remove it
  if (tooltip && !tooltip.contains(event.target)) {
    removeTooltip();
  }
});

// ============================================
// Phase 11: Close tooltip with ESC key
// ============================================

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && tooltip) {
    removeTooltip();
  }
});

// ============================================
// Create and show the tooltip
// ============================================

function showTooltip(selectionRect) {
  // Don't recreate if already exists
  if (tooltip) return;
  
  // Create tooltip element
  tooltip = document.createElement('div');
  tooltip.className = 'overtab-tooltip';
  
  // Create the three action buttons with modern design
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
  
  // Add to page
  document.body.appendChild(tooltip);
  
  // Position it relative to the SELECTED TEXT (not mouse!)
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Center horizontally above the selection
  let left = selectionRect.left + (selectionRect.width / 2) - (tooltipRect.width / 2);
  let top = selectionRect.top - tooltipRect.height - 10;
  
  // Keep in viewport horizontally
  left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
  
  // If not enough space above, show below
  if (top < 10) {
    top = selectionRect.bottom + 10;
  }
  
  tooltip.style.position = 'fixed';
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  
  // Add click handlers
  tooltip.querySelectorAll('.overtab-tooltip-btn').forEach(button => {
    button.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      handleAction(action);
    });
  });
}

// ============================================
// Remove the tooltip
// ============================================

function removeTooltip() {
  if (tooltip && tooltip.parentNode) {
    tooltip.parentNode.removeChild(tooltip);
  }
  tooltip = null;
}

// ============================================
// Handle button clicks
// ============================================

async function handleAction(action) {
  // Prevent multiple simultaneous requests
  if (isProcessing) {
    console.log('Already processing a request, please wait...');
    return;
  }
  
  isProcessing = true;
  const text = currentSelectedText;
  
  // Remove tooltip
  removeTooltip();
  
  // Open sidebar and show loading
  chrome.runtime.sendMessage({ 
    action: 'openSidebar'
  });
  
  chrome.runtime.sendMessage({
    action: 'showLoading',
    sourceText: text
  });
  
  try {
    let result;
    
    // Call appropriate AI function
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
      result = await translateText(text, 'es'); // Translate to Spanish for now
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: text,
        resultType: 'translation',
        result: result
      });
    }
    
    console.log(`${action} completed:`, result);
    
  } catch (error) {
    console.error(`Error in ${action}:`, error);
    
    // Show error
    chrome.runtime.sendMessage({
      action: 'showError',
      error: error.message || 'AI API not available. Make sure you have Chrome Canary with AI features enabled.'
    });
  } finally {
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessing = false;
    }, 500);
  }
}

// ============================================
// Phase 5: Image Hover Detection
// ============================================

let hoveredImage = null;  // Track currently hovered image

// Add hover listeners to all images on the page
document.addEventListener('mouseover', function(event) {
  // Check if hovering over an image
  if (event.target.tagName === 'IMG') {
    hoveredImage = event.target;
    // Add visual indicator class
    event.target.classList.add('overtab-image-hover');
  }
});

// Remove hover effect when mouse leaves
document.addEventListener('mouseout', function(event) {
  if (event.target.tagName === 'IMG') {
    event.target.classList.remove('overtab-image-hover');
    if (hoveredImage === event.target) {
      hoveredImage = null;
    }
  }
});

// ============================================
// Listen for messages from background script
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  // If background wants to show an alert
  if (message.action === 'showAlert') {
    alert(message.message);
  }
  
  // Handle "Explain Page" from popup
  if (message.action === 'explainPage') {
    handleExplainPage(message.text);
  }
  
  // Handle "Voice Command" from popup
  if (message.action === 'startVoiceCapture') {
    startVoiceCapture();
  }
  
  // Handle "Describe Image" from context menu
  if (message.action === 'describeImage') {
    handleDescribeImage(message.imageUrl);
  }
  
  // No need to return true since we're not sending a response
});

// ============================================
// Handle "Explain Page" feature
// ============================================

async function handleExplainPage(pageText) {
  // Open sidebar and show loading
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
    
    console.log('Page explanation completed');
    
  } catch (error) {
    console.error('Error explaining page:', error);
    
    chrome.runtime.sendMessage({
      action: 'showError',
      error: error.message || 'AI API not available. Make sure you have Chrome Canary with AI features enabled.'
    });
  }
}

// ============================================
// Phase 8: Voice Command
// ============================================

function startVoiceCapture() {
  // Check if Web Speech API is available
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('❌ Voice recognition not supported in this browser.');
    return;
  }
  
  // Get page context (title and some text for context)
  const pageTitle = document.title;
  const pageText = document.body.innerText.substring(0, 1000); // First 1000 chars for context
  
  // Create recognition object
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  // Show visual indicator
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
  
  // Handle result
  recognition.onresult = async function(event) {
    const transcript = event.results[0][0].transcript;
    console.log('Voice question:', transcript);
    
    // Remove indicator
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    
    // Sidebar is already open from the button click!
    // Just show loading state
    console.log('Showing loading in sidebar...');
    
    chrome.runtime.sendMessage({
      action: 'showLoading',
      sourceText: `Q: "${transcript}"`
    });
    
    try {
      // Create context-aware prompt
      const contextPrompt = `Page: "${pageTitle}"
      
Context: ${pageText}

Question: ${transcript}

Answer the question based on the page content above.`;
      
      const result = await promptAI(contextPrompt);
      
      // Send result to sidebar
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: `Q: "${transcript}"`,
        resultType: 'explanation',
        result: result
      });
      
      console.log('Voice Q&A completed');
      
    } catch (error) {
      console.error('Error processing voice question:', error);
      chrome.runtime.sendMessage({
        action: 'showError',
        error: error.message || 'Error processing voice question. Try again!'
      });
    }
  };
  
  // Handle errors
  recognition.onerror = function(event) {
    console.error('Voice recognition error:', event.error);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    alert('❌ Voice recognition error: ' + event.error);
  };
  
  // Handle end
  recognition.onend = function() {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  };
  
  // Start listening
  try {
    recognition.start();
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }
}

// ============================================
// Phase 8: Image Description
// ============================================

async function handleDescribeImage(imageUrl) {
  console.log('Describing image:', imageUrl);
  
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
