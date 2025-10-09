// Overtab Content Script
let tooltip = null;
let currentSelectedText = '';
let isProcessing = false;
let tooltipEnabled = true;

try {
  chrome.storage.local.get(['tooltipEnabled']).then((result) => {
    tooltipEnabled = result.tooltipEnabled !== false;
  }).catch(() => {
    tooltipEnabled = true;
  });
} catch (e) {
  tooltipEnabled = true;
}

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

document.addEventListener('mousedown', function(event) {
  if (tooltip && !tooltip.contains(event.target)) {
    removeTooltip();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && tooltip) {
    removeTooltip();
  }
});

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
  
  tooltip.querySelectorAll('.overtab-tooltip-btn:not(.translate-main-btn)').forEach(button => {
    button.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      handleAction(action);
    });
  });
  
  const translateBtn = tooltip.querySelector('.translate-main-btn');
  const langMenu = tooltip.querySelector('.translate-lang-menu');
  
  if (translateBtn && langMenu) {
    translateBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isVisible = langMenu.style.display === 'block';
      langMenu.style.display = isVisible ? 'none' : 'block';
    });
    
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

async function handleAction(action, language = null) {
  if (isProcessing) return;
  
  isProcessing = true;
  const text = currentSelectedText;
  
  removeTooltip();
  
  try {
    chrome.storage.session.set({ pendingAction: action });
  } catch (e) {
    // Storage access limited
  }
  
  chrome.runtime.sendMessage({ action: 'openSidebar' });
  
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: 'showLoading', actionType: action, sourceText: text });
  }, 100);
  
  try {
    let result;
    
    if (action === 'explain') {
      const response = await chrome.runtime.sendMessage({
        action: 'processAI',
        aiFunction: 'explain',
        text: text
      });
      
      if (response.success) {
        result = response.result;
        chrome.runtime.sendMessage({
          action: 'showResult',
          sourceText: text,
          resultType: 'explanation',
          result: result
        });
      } else {
        throw new Error(response.error || 'AI processing failed');
      }
    } else if (action === 'simplify') {
      const response = await chrome.runtime.sendMessage({
        action: 'processAI',
        aiFunction: 'simplify',
        text: text
      });
      
      if (response.success) {
        result = response.result;
        chrome.runtime.sendMessage({
          action: 'showResult',
          sourceText: text,
          resultType: 'simplified',
          result: result
        });
      } else {
        throw new Error(response.error || 'AI processing failed');
      }
    } else if (action === 'translate') {
      const targetLang = language || 'es';
      
      const response = await chrome.runtime.sendMessage({
        action: 'processAI',
        aiFunction: 'translate',
        text: text,
        targetLanguage: targetLang
      });
      
      if (response.success) {
        result = response.result;
        chrome.runtime.sendMessage({
          action: 'showResult',
          sourceText: text,
          resultType: 'translation',
          result: result,
          targetLanguage: targetLang
        });
      } else {
        throw new Error(response.error || 'AI processing failed');
      }
    } else if (action === 'proofread') {
      const response = await chrome.runtime.sendMessage({
        action: 'processAI',
        aiFunction: 'proofread',
        text: text
      });
      
      if (response.success) {
        result = response.result;
        chrome.runtime.sendMessage({
          action: 'showResult',
          sourceText: text,
          resultType: 'proofread',
          result: result
        });
      } else {
        throw new Error(response.error || 'AI processing failed');
      }
    }
    
  } catch (error) {
    chrome.runtime.sendMessage({
      action: 'showError',
      error: error.message || 'AI API not available.'
    });
  } finally {
    setTimeout(() => { isProcessing = false; }, 500);
  }
}

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

// Capture the exact image the user right-clicked
document.addEventListener('contextmenu', function(event) {
  if (event.target && event.target.tagName === 'IMG') {
    hoveredImage = event.target;
  }
}, true);

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

async function handleExplainPage(pageText) {
  try {
    chrome.storage.session.set({ pendingAction: 'explain' });
  } catch (e) {
    // Storage access limited
  }
  
  chrome.runtime.sendMessage({ action: 'openSidebar' });
  
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'showLoading',
      actionType: 'explain',
      sourceText: 'Current Page'
    });
  }, 100);
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'processAI',
      aiFunction: 'explain',
      text: pageText
    });
    
    if (!response.success) {
      throw new Error(response.error || 'AI processing failed');
    }
    
    const result = response.result;
    
    chrome.runtime.sendMessage({
      action: 'showResult',
      sourceText: 'Current Page',
      resultType: 'explanation',
      result: result
    });
    
  } catch (error) {
    chrome.runtime.sendMessage({
      action: 'showError',
      error: error.message || 'AI API not available.'
    });
  }
}

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
      
      const response = await chrome.runtime.sendMessage({
        action: 'processAI',
        aiFunction: 'prompt',
        text: contextPrompt
      });
      
      if (!response.success) {
        throw new Error(response.error || 'AI processing failed');
      }
      
      const result = response.result;
      
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: `Q: "${transcript}"`,
        resultType: 'explanation',
        result: result
      });
      
    } catch (error) {
      chrome.runtime.sendMessage({
        action: 'showError',
        error: error.message || 'Error processing voice question. Try again!'
      });
    }
  };
  
  recognition.onerror = function(event) {
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
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }
}

// Find best-matching image element for a given URL (handles srcset/currentSrc)
function findImageElementByUrl(targetUrl) {
  try {
    if (hoveredImage) {
      const hSrc = hoveredImage.currentSrc || hoveredImage.src || '';
      if (!targetUrl || hSrc === targetUrl) return hoveredImage;
    }
    const allImages = Array.from(document.images);
    const normalizedTarget = decodeURI(targetUrl);
    
    const exactCurrent = allImages.find(img => decodeURI(img.currentSrc || '') === normalizedTarget);
    if (exactCurrent) return exactCurrent;
    
    const exactSrc = allImages.find(img => decodeURI(img.src || '') === normalizedTarget);
    if (exactSrc) return exactSrc;
    
    const suffixMatch = allImages.find(img =>
      (img.currentSrc && normalizedTarget.endsWith(decodeURI(new URL(img.currentSrc, location.href).pathname))) ||
      (img.src && normalizedTarget.endsWith(decodeURI(new URL(img.src, location.href).pathname)))
    );
    return suffixMatch || null;
  } catch (_) {
    return null;
  }
}

// Collect captions and context around the image
function collectImageContext(imgEl, imageUrl) {
  if (!imgEl) return { alt: '', title: '', ariaLabel: '', caption: '', describedBy: '', nearby: '', linkLabel: '', heading: '', fileNameHint: '', metaOgAlt: '' };
  
  const getText = el => (el ? (el.innerText || el.textContent || '').trim() : '');
  const alt = (imgEl.getAttribute('alt') || '').trim();
  const title = (imgEl.getAttribute('title') || '').trim();
  const ariaLabel = (imgEl.getAttribute('aria-label') || '').trim();
  const longdesc = (imgEl.getAttribute('longdesc') || '').trim();

  let caption = '';
  const figure = imgEl.closest('figure');
  if (figure) {
    const fc = figure.querySelector('figcaption');
    caption = getText(fc);
  }
  
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

  let describedBy = '';
  const describedId = imgEl.getAttribute('aria-describedby');
  if (describedId) {
    const descEl = document.getElementById(describedId);
    describedBy = getText(descEl);
  }

  let nearby = '';
  const container = imgEl.closest('figure, .image, .img, .thumb, .gallery, .photo, article, section, div');
  if (container) {
    const p = container.querySelector('p, .caption, .credit, .subtext');
    nearby = getText(p);
  }

  let linkLabel = '';
  const a = imgEl.closest('a');
  if (a) {
    linkLabel = (a.getAttribute('title') || a.getAttribute('aria-label') || getText(a)).trim();
  }

  let heading = '';
  const headingEl = imgEl.closest('section, article, div, main, body')?.querySelector('h1, h2, h3, h4');
  heading = getText(headingEl);

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

  let metaOgAlt = '';
  const ogAlt = document.querySelector('meta[property="og:image:alt"], meta[name="og:image:alt"]');
  if (ogAlt && ogAlt.getAttribute('content')) metaOgAlt = ogAlt.getAttribute('content').trim();

  return { alt, title, ariaLabel, caption, describedBy, nearby, linkLabel, heading, fileNameHint, metaOgAlt, longdesc };
}

// Handle image description using page context
async function handleDescribeImage(imageUrl) {
  try {
    const imgEl = findImageElementByUrl(imageUrl);
    const ctx = collectImageContext(imgEl, imageUrl);

    const fields = [ctx.caption, ctx.alt, ctx.ariaLabel, ctx.title, ctx.describedBy, ctx.nearby, ctx.linkLabel, ctx.heading, ctx.metaOgAlt, ctx.fileNameHint, ctx.longdesc];
    const hasContext = fields.some(v => (v || '').replace(/[\s_\-.,:;|/\\]/g, '').length >= 4);

    if (!hasContext) {
      chrome.runtime.sendMessage({
        action: 'showResult',
        sourceText: `Image: ${imageUrl}`,
        resultType: 'explanation',
        result: 'Not enough page context to describe this image.'
      });
      return;
    }

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

    const response = await chrome.runtime.sendMessage({
      action: 'processAI',
      aiFunction: 'prompt',
      text: prompt
    });
    
    if (!response.success) {
      throw new Error(response.error || 'AI processing failed');
    }
    
    let result = response.result;
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
    chrome.runtime.sendMessage({
      action: 'showError',
      error: error.message || 'Error describing image'
    });
  }
}