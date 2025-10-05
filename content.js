// ============================================
// Overtab Content Script - Phase 4
// ============================================
// This runs on every webpage and handles:
// - Text selection detection
// - Showing tooltip with action buttons

console.log('Overtab content script loaded on:', window.location.href);

let tooltip = null;  // Will hold our tooltip element
let currentSelectedText = '';  // Store the current selection

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
      
      // Show tooltip near the mouse
      showTooltip(event.clientX, event.clientY);
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
// Create and show the tooltip
// ============================================

function showTooltip(x, y) {
  // Remove old tooltip first
  removeTooltip();
  
  // Create tooltip element
  tooltip = document.createElement('div');
  tooltip.className = 'overtab-tooltip';
  
  // Create the three action buttons
  tooltip.innerHTML = `
    <button class="overtab-tooltip-btn" data-action="explain">
      💡 Explain
    </button>
    <button class="overtab-tooltip-btn" data-action="simplify">
      ✨ Simplify
    </button>
    <button class="overtab-tooltip-btn" data-action="translate">
      🌐 Translate
    </button>
  `;
  
  // Add to page
  document.body.appendChild(tooltip);
  
  // Position it
  const rect = tooltip.getBoundingClientRect();
  let left = x - (rect.width / 2);
  let top = y - rect.height - 15;
  
  // Keep in viewport
  left = Math.max(10, Math.min(left, window.innerWidth - rect.width - 10));
  top = Math.max(10, top);
  
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

function handleAction(action) {
  const text = currentSelectedText;
  const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
  
  const messages = {
    explain: `💡 Explain feature coming soon!\n\nSelected text: "${preview}"`,
    simplify: `✨ Simplify feature coming soon!\n\nSelected text: "${preview}"`,
    translate: `🌐 Translate feature coming soon!\n\nSelected text: "${preview}"`
  };
  
  alert(messages[action]);
  removeTooltip();
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
  
  // No need to return true since we're not sending a response
});
