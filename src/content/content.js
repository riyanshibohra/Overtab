// Overtab Content Script
// Handles text selection, tooltips, voice commands, and image interactions

let tooltip = null;
let currentSelectedText = '';
let isProcessing = false;
let tooltipEnabled = true;

// Safely access storage
try {
  chrome.storage.local.get(['tooltipEnabled']).then((result) => {
    tooltipEnabled = result.tooltipEnabled !== false;
  }).catch(() => {
    tooltipEnabled = true;
  });
} catch (e) {
  tooltipEnabled = true;
}

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
    <div class="translate-dropdown">
      <button class="overtab-tooltip-btn translate-main-btn">
        <span class="tooltip-btn-icon">🌐</span>
        <span class="tooltip-btn-text">Translate</span>
      </button>
      <div class="translate-lang-menu" style="display: none;">
        <button class="lang-option" data-action="translate" data-lang="es">🇪🇸 Spanish</button>
        <button class="lang-option" data-action="translate" data-lang="fr">🇫🇷 French</button>
        <button class="lang-option" data-action="translate" data-lang="de">🇩🇪 German</button>
        <button class="lang-option" data-action="translate" data-lang="it">🇮🇹 Italian</button>
        <button class="lang-option" data-action="translate" data-lang="ja">🇯🇵 Japanese</button>
        <button class="lang-option" data-action="translate" data-lang="hi">🇮🇳 Hindi</button>
      </div>
    </div>
    <button class="overtab-tooltip-btn" data-action="proofread">
      <span class="tooltip-btn-icon">✅</span>
      <span class="tooltip-btn-text">Proofread</span>
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
  
  // Event listeners for Explain and Simplify buttons
  tooltip.querySelectorAll('.overtab-tooltip-btn:not(.translate-main-btn)').forEach(button => {
    button.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      handleAction(action);
    });
  });
  
  // Translate dropdown toggle
  const translateBtn = tooltip.querySelector('.translate-main-btn');
  const langMenu = tooltip.querySelector('.translate-lang-menu');
  
  if (translateBtn && langMenu) {
    translateBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isVisible = langMenu.style.display === 'block';
      langMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Language option click
    tooltip.querySelectorAll('.lang-option').forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const lang = this.getAttribute('data-lang');
        handleAction('translate', lang);
      });
    });
  }
}

function removeTooltip() {
  if (tooltip && tooltip.parentNode) {
    tooltip.parentNode.removeChild(tooltip);
  }
  tooltip = null;
}

// Handle tooltip button clicks
async function handleAction(action, language = null) {
  if (isProcessing) return;
  
  isProcessing = true;
  const text = currentSelectedText;
  
  removeTooltip();
  
  // Set pending action so sidebar shows loading immediately
  try {
    chrome.storage.session.set({ pendingAction: action });
  } catch (e) {
    console.log('⚠️ Storage access limited, sidebar will show default loading');
  }
  
  chrome.runtime.sendMessage({ action: 'openSidebar' });
  
  // Small delay to ensure sidebar is ready
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: 'showLoading', actionType: action, sourceText: text });
  }, 100);
  
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
      // Use selected language or default to Spanish
      const targetLang = language || 'es';
      
      result = await translateText(text, targetLang);
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: text,
        resultType: 'translation',
        result: result,
        targetLanguage: targetLang
      });
    } else if (action === 'proofread') {
      result = await proofreadText(text);
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: text,
        resultType: 'proofread',
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

// Ensure we capture the exact image the user right-clicked
document.addEventListener('contextmenu', function(event) {
  if (event.target && event.target.tagName === 'IMG') {
    hoveredImage = event.target;
  }
}, true);

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
  // Set pending action so sidebar shows loading immediately
  try {
    chrome.storage.session.set({ pendingAction: 'explain' });
  } catch (e) {
    console.log('⚠️ Storage access limited, sidebar will show default loading');
  }
  
  chrome.runtime.sendMessage({ action: 'openSidebar' });
  
  // Small delay to ensure sidebar is ready
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'showLoading',
      actionType: 'explain',
      sourceText: 'Current Page'
    });
  }, 100);
  
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

// Find best-matching <img> element for a given URL (handles srcset/currentSrc)
function findImageElementByUrl(targetUrl) {
  try {
    // Prefer the currently hovered <img> if it matches or if no URL provided
    if (hoveredImage) {
      const hSrc = hoveredImage.currentSrc || hoveredImage.src || '';
      if (!targetUrl || hSrc === targetUrl) return hoveredImage;
    }
    const allImages = Array.from(document.images);
    const normalizedTarget = decodeURI(targetUrl);
    // Prefer exact currentSrc match, then src, then suffix match
    const exactCurrent = allImages.find(img => decodeURI(img.currentSrc || '') === normalizedTarget);
    if (exactCurrent) return exactCurrent;
    const exactSrc = allImages.find(img => decodeURI(img.src || '') === normalizedTarget);
    if (exactSrc) return exactSrc;
    // Fallback: match on filename/suffix
    const suffixMatch = allImages.find(img =>
      (img.currentSrc && normalizedTarget.endsWith(decodeURI(new URL(img.currentSrc, location.href).pathname))) ||
      (img.src && normalizedTarget.endsWith(decodeURI(new URL(img.src, location.href).pathname)))
    );
    return suffixMatch || null;
  } catch (_) {
    return null;
  }
}

// Collect captions/labels around the image to avoid hallucinations
function collectImageContext(imgEl, imageUrl) {
  if (!imgEl) return { alt: '', title: '', ariaLabel: '', caption: '', describedBy: '', nearby: '', linkLabel: '', heading: '', fileNameHint: '', metaOgAlt: '' };
  const getText = el => (el ? (el.innerText || el.textContent || '').trim() : '');
  const alt = (imgEl.getAttribute('alt') || '').trim();
  const title = (imgEl.getAttribute('title') || '').trim();
  const ariaLabel = (imgEl.getAttribute('aria-label') || '').trim();
  const longdesc = (imgEl.getAttribute('longdesc') || '').trim();

  // figcaption within a <figure>
  let caption = '';
  const figure = imgEl.closest('figure');
  if (figure) {
    const fc = figure.querySelector('figcaption');
    caption = getText(fc);
  }
  // Common site-specific caption containers (Wikipedia, news sites, galleries)
  if (!caption) {
    const wikiThumb = imgEl.closest('div.thumb');
    if (wikiThumb) {
      caption = getText(wikiThumb.querySelector('.thumbcaption')) || caption;
    }
  }
  if (!caption) {
    const galleryText = imgEl.closest('.gallery') || imgEl.closest('.gallerybox');
    if (galleryText) caption = getText(galleryText.querySelector('.gallerytext')) || caption;
  }
  if (!caption) {
    const mediaCaption = imgEl.closest('[class*="caption"],[data-caption]');
    caption = (mediaCaption && (getText(mediaCaption.querySelector('[class*="caption"]')) || mediaCaption.getAttribute('data-caption'))) || caption;
  }

  // aria-describedby points to caption-like text
  let describedBy = '';
  const describedId = imgEl.getAttribute('aria-describedby');
  if (describedId) {
    const descEl = document.getElementById(describedId);
    describedBy = getText(descEl);
  }

  // Nearby paragraph text (same container)
  let nearby = '';
  const container = imgEl.closest('figure, .image, .img, .thumb, .gallery, .photo, article, section, div');
  if (container) {
    const p = container.querySelector('p, .caption, .credit, .subtext');
    nearby = getText(p);
  }

  // Anchor/link context
  let linkLabel = '';
  const a = imgEl.closest('a');
  if (a) {
    linkLabel = (a.getAttribute('title') || a.getAttribute('aria-label') || getText(a)).trim();
  }

  // Nearest heading in ancestors
  let heading = '';
  const headingEl = imgEl.closest('section, article, div, main, body')?.querySelector('h1, h2, h3, h4');
  heading = getText(headingEl);

  // File name hint from URL
  let fileNameHint = '';
  try {
    const u = new URL(imageUrl, location.href);
    const base = decodeURI(u.pathname.split('/').pop() || '')
      .replace(/\.[a-zA-Z0-9]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    fileNameHint = base;
  } catch (_) {}

  // Meta Open Graph alt
  let metaOgAlt = '';
  const ogAlt = document.querySelector('meta[property="og:image:alt"], meta[name="og:image:alt"]');
  if (ogAlt && ogAlt.getAttribute('content')) metaOgAlt = ogAlt.getAttribute('content').trim();

  return { alt, title, ariaLabel, caption, describedBy, nearby, linkLabel, heading, fileNameHint, metaOgAlt, longdesc };
}

// Handle image description (context-driven, no vision)
async function handleDescribeImage(imageUrl) {
  try {
    const imgEl = findImageElementByUrl(imageUrl);
    const ctx = collectImageContext(imgEl, imageUrl);

    const fields = [ctx.caption, ctx.alt, ctx.ariaLabel, ctx.title, ctx.describedBy, ctx.nearby, ctx.linkLabel, ctx.heading, ctx.metaOgAlt, ctx.fileNameHint, ctx.longdesc];
    const hasContext = fields.some(v => (v || '').replace(/[\s_\-.,:;|/\\]/g, '').length >= 4);

    // If truly no context, short-circuit without prompting
    if (!hasContext) {
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: `Image: ${imageUrl}`,
        resultType: 'explanation',
        result: 'Not enough page context to describe this image.'
      });
      return;
    }

    // Synthesize context intelligently
    const parts = [];
    if (ctx.caption) parts.push(ctx.caption);
    else if (ctx.alt) parts.push(ctx.alt);
    else if (ctx.ariaLabel) parts.push(ctx.ariaLabel);
    
    if (ctx.nearby && ctx.nearby !== ctx.caption) parts.push(ctx.nearby);
    if (ctx.heading && !parts.some(p => p.includes(ctx.heading))) parts.push(`Section: ${ctx.heading}`);
    if (ctx.fileNameHint && ctx.fileNameHint.length > 3) parts.push(`(${ctx.fileNameHint})`);
    
    const synthesized = parts.join(' • ');
    const pageContext = `Page: "${document.title}"`;

    const prompt = `Based on this context about an image, write 3-4 natural, helpful bullet points describing what it shows. Use **bold** only for key terms (numbers, chart types, important nouns). Be conversational.

Example style:
- Shows a **bar chart** tracking median home prices from 1963 to 2023
- Clear **upward trend** with steady growth over 60 years  
- Recent peak around **$570K** in 2024

${pageContext}
Image context: ${synthesized}

Write the description now:`;

    let result = await promptAI(prompt);
    // Clean up the result
    result = result
      .split('\n')
      .filter(l => {
        const lower = l.toLowerCase();
        return !/not enough page context/i.test(l) &&
               !/caption\s+(shows|is)/i.test(l) &&
               !/alt\s+(text|is)/i.test(l) &&
               !/filename/i.test(lower) &&
               l.trim().length > 0;
      })
      .join('\n')
      .trim();
    
    if (!result) {
      result = 'Not enough page context to describe this image.';
    }
    
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
