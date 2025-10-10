# Privacy Policy for Overtab

**Last Updated: October 9, 2025**

## Overview

Overtab is a privacy-first AI reading assistant that helps you understand web content. We are committed to protecting your privacy and being transparent about how our extension works.

## Data Collection and Storage

### What We Collect
**We do NOT collect, transmit, or store any personal data on external servers.**

All data processing happens either:
1. **On your device** using Chrome's built-in Gemini Nano AI
2. **Through your own API key** if you choose to use OpenAI

### Local Storage Only
The extension stores the following data **locally on your device only**:
- **User Preferences**: Your settings choices (AI provider, tooltip enabled/disabled, language preferences)
- **OpenAI API Key** (if provided): Encrypted and stored locally in your browser using Chrome's secure storage API
- **History**: Your recent explanations, translations, and AI interactions (stored locally, can be cleared anytime)
- **Session Data**: Temporary data during your browsing session

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

### Why We Need These Permissions:

**`activeTab`** - To read and analyze the webpage content you're currently viewing when you explicitly trigger an action (highlight text, right-click, etc.)

**`scripting`** - To inject our content scripts that enable text selection and context menu features

**`storage`** - To save your preferences, encrypted API key, and local history on your device

**`contextMenus`** - To add "Overtab AI" options to your right-click menu for easy access

**`sidePanel`** - To display AI results in a sidebar without interrupting your browsing

**`<all_urls>`** - To work on any webpage you visit. This is essential because:
- You may want to use AI assistance on any website
- The extension needs to analyze content from any page you're reading
- Context menus and text selection must work universally
- **We do NOT use this to track your browsing or collect data**

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

**Summary**: Overtab is privacy-first by design. We don't collect your data, we don't track you, and we don't have servers. Your data stays on your device or goes directly to services you choose (OpenAI) using your own API key.

