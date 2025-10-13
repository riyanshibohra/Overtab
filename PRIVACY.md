# Privacy Policy for Overtab

**Last Updated: October 12, 2025**

## Overview

Overtab is a privacy-first AI reading assistant built for the Google Chrome Built-in AI Challenge. We help you understand web content using on-device AI. We are committed to protecting your privacy and being completely transparent about how our extension works.

## ⚠️ About the "Read and Change All Your Data" Warning

When you install Overtab, Chrome shows a warning: **"This extension can read and change all your data on all websites."**

**Here's the truth:**
- ✅ Our content scripts run on all websites to detect when you select text or right-click images
- ✅ They ONLY listen for your interactions (text selection, clicks) - they do NOT read or collect page content
- ✅ They do NOT track your browsing, scrape data, or send information to our servers (we don't have servers)
- ✅ AI processing only happens when YOU explicitly trigger it (highlight text, right-click, click extension icon)
- ✅ The warning is required because our scripts need to work on any website you visit for the tooltip and context menu features

**What our scripts actually do:**
1. Detect when you highlight text → show tooltip with AI action buttons
2. Detect when you right-click an image → add "Describe with Overtab" to context menu
3. Handle visual indicators for voice commands
4. Pass your selected text to the extension for AI processing ONLY when you request it

**What our scripts do NOT do:**
- ❌ Do NOT read page content automatically
- ❌ Do NOT track which websites you visit
- ❌ Do NOT collect or transmit data without your explicit action
- ❌ Do NOT modify webpage content
- ❌ Do NOT inject ads or scripts from third parties

## Data Collection and Storage

### What We Collect
**We do NOT collect, transmit, or store any personal data on external servers. We don't have servers.**

**Website Content Access:**
- We ONLY access webpage content when YOU explicitly:
  - Highlight text and click an AI action (Explain, Simplify, Translate, Proofread)
  - Right-click an image and select "Describe with Overtab"
  - Click the extension icon and choose "Explain Page" or "Voice Command"
- The content is processed immediately and NOT stored anywhere
- We do NOT track which websites you visit or what you read

**Data Processing:**
All data processing happens either:
1. **On your device** using Chrome's built-in Gemini Nano AI (completely offline, private)
2. **Directly to OpenAI** using your own API key (if you choose to provide one)

### Local Storage Only
The extension stores the following data **locally on your device only**:
- **User Preferences**: Your settings (AI provider choice, tooltip enabled/disabled)
- **OpenAI API Key** (optional): If you provide one, it's encrypted with AES-GCM and stored locally
- **History**: Your recent AI interactions (max 10 items, can be cleared anytime, never transmitted)
- **Session Data**: Temporary data during your browsing session (cleared when you close Chrome)

**None of this data is transmitted to our servers. We don't have any servers.**

## How Your Data is Used

### On-Device AI (Gemini Nano)
When using Chrome's built-in Gemini Nano:
- All text processing happens **entirely on your device**
- No data leaves your browser
- No internet connection required for AI processing
- Complete privacy

### OpenAI Integration (Optional)
If you choose to provide your own OpenAI API key:
- Your API key is **encrypted** before storage using AES-GCM encryption
- The key is stored **locally** in Chrome's secure storage
- When you use AI features, text is sent **directly from your browser to OpenAI's API**
- We act as a pass-through; we never see or store your API requests
- OpenAI's privacy policy applies to data sent to their API: https://openai.com/policies/privacy-policy

## Permissions Explained

### Chrome Permissions We Request:

**`activeTab`** - Gives temporary access to the current webpage when you click the extension icon. Used for "Explain Page" and "Voice Command" features to read the page text you want analyzed. Access is only granted when YOU click the extension, not automatically.

**`scripting`** - Allows us to inject scripts into webpages when you click the extension icon and select "Explain Page" or "Voice Command". Works together with activeTab to read page content only during explicit user actions.

**`storage`** - Saves your preferences locally on your device: AI provider choice, tooltip settings, encrypted OpenAI API key (if provided), and recent explanation history (max 10 items). All data stays on your device.

**`contextMenus`** - Adds "Describe with Overtab" to the right-click menu when you click on images. This is how you trigger AI image descriptions.

**`sidePanel`** - Displays AI results in a sidebar panel without interrupting your browsing. Shows explanations, translations, chat, and other AI outputs while keeping the original page visible.

### Content Scripts (Why the Extension Works on All Websites)

Our extension includes content scripts that run on all websites (`content_scripts` with `<all_urls>` pattern in manifest). These scripts are necessary for core features:

**What they enable:**
- Text selection tooltips (Explain, Simplify, Translate, Proofread buttons appear when you highlight text)
- Image interaction (detect when you hover over or right-click images)
- Voice command visual interface

**What they actually do:**
- Listen for text selection events (mouseup, selection change)
- Listen for image hover and right-click events
- Display tooltip UI elements
- Send YOUR selected text to the extension for processing ONLY when you click an action button

**What they do NOT do:**
- They do NOT automatically read page content
- They do NOT track which websites you visit
- They do NOT make network requests
- They do NOT collect or transmit data without your explicit action
- They do NOT modify page content (except showing the tooltip UI)

## Third-Party Services

### Chrome Built-in AI (Gemini Nano)
- Provided by Google Chrome
- Runs entirely on your device
- Subject to Google Chrome's privacy policy
- No data sent to external servers

### OpenAI (Optional)
- Only used if you provide your own API key
- Data sent directly from your browser to OpenAI
- Subject to OpenAI's privacy policy
- We don't intercept or store any API communications

## Data Retention

- **History**: Stored locally, limited to 10 recent items, can be cleared anytime from settings
- **Preferences**: Stored until you uninstall the extension or clear Chrome's extension data
- **API Key**: Stored until you remove it or uninstall the extension

## Your Control

You have complete control over your data:
- **Clear History**: One-click history clearing in extension settings
- **Remove API Key**: Delete your OpenAI key anytime from settings
- **Disable Features**: Turn off tooltips or any feature you don't want
- **Uninstall**: Removes all local data immediately

## Children's Privacy

Overtab does not knowingly collect any information from children under 13. The extension is designed for general audiences and processes data only as described above.

## Changes to Privacy Policy

We may update this privacy policy from time to time. We will notify users of any material changes by updating the "Last Updated" date and, if applicable, through the extension update notes.

## Contact

For privacy concerns or questions:
- **GitHub Issues**: https://github.com/riyanshibohra/Overtab
- **Email**: riyanshibohraa@gmail.com

## Open Source

Overtab is open source. You can review our entire codebase to verify our privacy claims:
- **GitHub Repository**: https://github.com/riyanshibohra/Overtab

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

---

## Summary: Why You Can Trust Overtab

✅ **No servers** - We literally don't have servers to send your data to  
✅ **No tracking** - We don't know what websites you visit or what you read  
✅ **No data collection** - We only process text/images YOU explicitly select  
✅ **Open source** - You can verify everything in our code on GitHub  
✅ **On-device AI** - Primary processing happens on your device with Gemini Nano  
✅ **Your API key** - If using OpenAI, it's YOUR key, YOUR data, YOUR control  
✅ **Local storage only** - Everything stays on your device  
✅ **Clear purpose** - Built for the Google Chrome Built-in AI Challenge to help you understand web content  

**The "read and change all your data" warning exists because our scripts need to detect text selection and image clicks on any website you visit. But detection ≠ collection. We detect your actions, we don't collect your data.**

You're in control. Every AI action requires your explicit click or selection. Nothing happens automatically.

