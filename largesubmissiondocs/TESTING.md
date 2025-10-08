# Testing Instructions for Judges

This document provides comprehensive instructions for testing the Overtab Chrome Extension for the Google Chrome Built-in AI Challenge 2025.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Testing Each Feature](#testing-each-feature)
- [Troubleshooting](#troubleshooting)
- [Expected Results](#expected-results)

## Prerequisites

### Required Software
- **Chrome Canary** version 128 or higher
- Active internet connection (only for initial setup and model download)

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: At least 4GB available (8GB+ recommended for optimal performance)
- **Storage**: ~3GB for Gemini Nano model download

## Setup Instructions

### Step 1: Install Chrome Canary

If you don't have Chrome Canary installed:
1. Visit https://www.google.com/chrome/canary/
2. Download and install for your operating system
3. Launch Chrome Canary

### Step 2: Enable Chrome Built-in AI APIs

**Important**: You must enable all the following flags for the extension to work properly.

1. Open Chrome Canary and navigate to the following URLs, setting each flag as specified:

   | Flag URL | Setting |
   |----------|---------|
   | `chrome://flags/#optimization-guide-on-device-model` | **Enabled BypassPerfRequirement** |
   | `chrome://flags/#prompt-api-for-gemini-nano` | **Enabled** |
   | `chrome://flags/#summarization-api-for-gemini-nano` | **Enabled** |
   | `chrome://flags/#rewriter-api-for-gemini-nano` | **Enabled** |
   | `chrome://flags/#translation-api` | **Enabled** |
   | `chrome://flags/#language-detection-api` | **Enabled** |

2. After setting all flags, click **"Relaunch"** at the bottom of the page

### Step 3: Verify Gemini Nano Model Download

1. After relaunch, open DevTools (Press `F12` or `Cmd+Option+I` on Mac)
2. Go to the **Console** tab
3. Run the following command:
   ```javascript
   await LanguageModel.availability()
   ```
4. **Expected Output**: `"readily"` or `"available"`
   
   If you see `"after-download"`, wait 5-10 minutes for the model to download, then check again.

### Step 4: Load the Extension

1. Clone or download the Overtab repository
2. Navigate to `chrome://extensions/` in Chrome Canary
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `Overtab` folder
6. Verify the extension appears with the Overtab icon

✅ **Setup Complete!** You're now ready to test all features.

---

## Testing Each Feature

### Test 1: Text Explanation Feature (Prompt API + Summarizer API)

**Objective**: Verify that the extension can explain highlighted text using Chrome's Prompt API.

#### Steps:
1. Navigate to any article (suggested: https://en.wikipedia.org/wiki/Artificial_intelligence)
2. **Highlight any paragraph** of text (5+ sentences recommended)
3. A tooltip should appear above the selection with buttons: **Explain**, **Simplify**, **Translate**, **Proofread**
4. Click the **"💡 Explain"** button
5. A sidebar panel should open on the right
6. After 1-3 seconds, you should see:
   - A brief summary
   - 3-5 key bullet points explaining the text

#### What to Verify:
- ✅ Tooltip appears immediately after text selection
- ✅ Sidebar opens smoothly
- ✅ Loading state shows while processing
- ✅ Explanation is relevant and well-formatted
- ✅ Console shows: `🔵 [EXPLAIN] Success` (open DevTools to check)

#### Screenshots to Capture:
- Tooltip appearing on text selection
- Sidebar showing explanation results

---

### Test 2: Text Simplification Feature (Rewriter API + Prompt API)

**Objective**: Verify that complex text can be simplified into plain language.

#### Steps:
1. Navigate to a technical article (suggested: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
2. **Highlight a complex paragraph** with technical jargon
3. Click the **"✨ Simplify"** button on the tooltip
4. Sidebar opens and shows simplified version

#### What to Verify:
- ✅ Simplified text uses basic, easy-to-understand language
- ✅ Technical terms are explained or replaced
- ✅ Meaning is preserved but more accessible
- ✅ Console shows: `🟢 [SIMPLIFY] Success`

---

### Test 3: Translation Feature (Translator API)

**Objective**: Test on-device translation to multiple languages.

#### Steps:
1. Navigate to any English webpage
2. **Highlight a sentence or paragraph** (3-5 sentences)
3. Click the **"🌐 Translate"** button on the tooltip
4. A dropdown menu appears with language options:
   - 🇪🇸 Spanish
   - 🇫🇷 French
   - 🇩🇪 German
   - 🇮🇹 Italian
   - 🇯🇵 Japanese
   - 🇮🇳 Hindi
5. Click **"🇪🇸 Spanish"**
6. Sidebar shows the translated text

#### What to Verify:
- ✅ Translation is accurate and natural
- ✅ Translation speed is fast (1-2 seconds)
- ✅ Console shows: `🟣 [TRANSLATE] Success` with timing
- ✅ If first-time language use, model downloads automatically

#### Test Multiple Languages:
Repeat with at least 2 other languages to demonstrate multi-language support.

---

### Test 4: Proofreading Feature (Proofreader API)

**Objective**: Verify grammar and spelling correction.

#### Steps:
1. Navigate to any webpage with an editable text field (or use a webpage with text)
2. **Highlight text with intentional errors**, such as:
   > "Thiss is an exampl of text with speling mistakes and grammer errors."
3. Click the **"✅ Proofread"** button
4. Sidebar shows corrected version

#### What to Verify:
- ✅ Spelling errors are corrected
- ✅ Grammar mistakes are fixed
- ✅ Original meaning is preserved
- ✅ Console shows: `✅ [PROOFREAD] Success`

---

### Test 5: Voice Q&A Feature (Prompt API + Web Speech API)

**Objective**: Test voice-powered question answering about page content.

#### Steps:
1. Navigate to an article (suggested: https://en.wikipedia.org/wiki/Google_Chrome)
2. Click the **Overtab extension icon** in the toolbar
3. Click **"Ask About Page"** button
4. **Allow microphone access** when prompted (first time only)
5. A blue indicator appears: "🎤 Listening..."
6. **Speak a question** related to the page, such as:
   - "What is Google Chrome?"
   - "When was Chrome released?"
   - "What are the main features?"
7. After you stop speaking, the sidebar opens
8. AI-powered answer appears based on page content

#### What to Verify:
- ✅ Microphone permission requested
- ✅ Listening indicator appears
- ✅ Voice is transcribed correctly
- ✅ Answer is relevant to both the question AND the page content
- ✅ Console shows: `🟠 [PROMPT] Success`

#### Test Questions to Try:
- "What is this page about?"
- "Summarize the key points"
- "What are the benefits mentioned?"

---

### Test 6: Image Description Feature (Prompt API + Context Extraction)

**Objective**: Test context-aware image description.

#### Steps:
1. Navigate to a page with images (suggested: https://en.wikipedia.org/wiki/Mount_Everest)
2. **Right-click on any image**
3. Select **"Describe with Overtab"** from the context menu
4. Sidebar opens with image description

#### What to Verify:
- ✅ Description uses context from alt text, captions, and surrounding text
- ✅ Description is accurate and helpful
- ✅ No hallucinations (description based on page context, not vision)
- ✅ Formatted as bullet points

#### Test Multiple Image Types:
- Photos with captions
- Charts/graphs
- Diagrams
- Images without alt text

---

### Test 7: Multi-API Workflow

**Objective**: Test that multiple features work in sequence without issues.

#### Steps:
1. Highlight text and **Explain** it
2. Highlight different text and **Translate** it to Spanish
3. Highlight more text and **Simplify** it
4. Use **Voice Q&A** to ask a question
5. **Right-click an image** and describe it

#### What to Verify:
- ✅ All features work consecutively
- ✅ No memory leaks or slowdowns
- ✅ Each result displays correctly in sidebar
- ✅ Console shows proper cleanup: `session.destroy()` calls

---

### Test 8: Privacy & On-Device Processing

**Objective**: Verify that all processing happens on-device.

#### Steps:
1. Open **DevTools** → **Network** tab
2. Use various Overtab features (Explain, Translate, etc.)
3. Monitor network activity

#### What to Verify:
- ✅ No network requests to external AI services
- ✅ No data sent to Google servers (except initial model download)
- ✅ All processing happens locally
- ✅ Works even with internet disconnected (after model download)

---

### Test 9: Error Handling & Demo Mode

**Objective**: Test fallback behavior when APIs are unavailable.

#### Steps:
1. Open DevTools Console
2. Test with AI APIs disabled or unavailable
3. Features should show demo mode messages

#### What to Verify:
- ✅ Graceful error messages
- ✅ Demo mode activates when APIs unavailable
- ✅ No crashes or blank screens
- ✅ Clear instructions for enabling APIs

---

### Test 10: User Experience & Performance

**Objective**: Evaluate overall UX and performance.

#### Test Areas:

**Tooltip Behavior:**
- ✅ Appears only on text selection (not accidental clicks)
- ✅ Positioned near selection without overlapping
- ✅ Disappears when clicking outside
- ✅ Closes with ESC key

**Sidebar UI:**
- ✅ Clean, readable design
- ✅ Loading states are clear
- ✅ Results are well-formatted
- ✅ Scrollable for long content

**Performance:**
- ✅ Fast response times (1-3 seconds typical)
- ✅ No lag or stuttering
- ✅ Console shows timing logs
- ✅ Efficient resource usage

**Accessibility:**
- ✅ Keyboard navigation works
- ✅ Voice commands accessible
- ✅ Clear visual indicators

---

## Expected Results

### Performance Benchmarks

Based on Chrome's Built-in AI APIs:

| Feature | Expected Response Time | API Used |
|---------|----------------------|----------|
| Explain | 1-3 seconds | Prompt API / Summarizer |
| Simplify | 1-3 seconds | Rewriter API / Prompt API |
| Translate | 0.5-2 seconds | Translator API (28x faster!) |
| Proofread | 1-2 seconds | Proofreader API |
| Voice Q&A | 2-4 seconds | Prompt API |
| Image Description | 1-3 seconds | Prompt API |

### Console Output Examples

When everything works correctly, you should see logs like:

```
🤖 Overtab AI Status: {
  summarizer: true,
  rewriter: true,
  translator: true,
  prompt: true,
  languageModel: true
}

🔵 [EXPLAIN] Starting... (text length: 234 chars)
🔵 [EXPLAIN] LanguageModel availability: readily
⏱️ [EXPLAIN] Success: 1847ms

🟣 [TRANSLATE] Starting with Translator API... (en → es)
🟣 [TRANSLATE] Translator API availability: readily
⏱️ [TRANSLATE] Success: 658ms
```

---

## Troubleshooting

### Issue: "AI API not available"

**Solution:**
1. Verify all flags are enabled correctly
2. Restart Chrome Canary completely
3. Check DevTools console: `await LanguageModel.availability()`
4. Wait for Gemini Nano model download (5-10 minutes)

### Issue: Tooltip doesn't appear

**Solution:**
1. Make sure extension is enabled in `chrome://extensions`
2. Check that you're highlighting at least 3 characters
3. Reload the webpage
4. Check console for errors

### Issue: Translation is slow or fails

**Solution:**
1. First translation may trigger language pack download
2. Wait a few minutes for download to complete
3. Subsequent translations will be instant

### Issue: Voice recognition not working

**Solution:**
1. Grant microphone permissions in browser settings
2. Test microphone in browser: visit `chrome://settings/content/microphone`
3. Ensure you're speaking clearly in English
4. Try refreshing the page

### Issue: Sidebar doesn't open

**Solution:**
1. Check extension permissions include `sidePanel`
2. Reload extension from `chrome://extensions`
3. Check background service worker is running

---

## Testing Checklist

Use this checklist to ensure all features are tested:

- [ ] ✅ Text Explanation (Prompt API)
- [ ] ✅ Text Simplification (Rewriter API)
- [ ] ✅ Translation to Spanish
- [ ] ✅ Translation to French
- [ ] ✅ Translation to another language
- [ ] ✅ Proofreading text
- [ ] ✅ Voice Q&A
- [ ] ✅ Image Description
- [ ] ✅ Multi-API workflow
- [ ] ✅ Privacy verification (no network requests)
- [ ] ✅ Error handling
- [ ] ✅ UI/UX quality
- [ ] ✅ Performance (response times)
- [ ] ✅ Console logs verification

---

## Feedback & Questions

If you encounter any issues during testing or have questions:

1. Check the console logs for detailed error messages
2. Verify all setup steps were completed
3. Review the troubleshooting section above

**For judges**: All features should work smoothly when AI APIs are properly enabled. The extension demonstrates comprehensive integration of 5 Chrome Built-in AI APIs with excellent UX and privacy-first design.

Thank you for testing Overtab! 🚀

