# Overtab: Smarter Tabs, Locally Powered 🚀

**Your intelligent Chrome companion powered by Gemini Nano - Making the web accessible, understandable, and multilingual for everyone.**

[![Chrome Built-in AI Challenge 2025](https://img.shields.io/badge/Google%20Chrome-Built--in%20AI%20Challenge%202025-4285F4?logo=google-chrome)](https://googlechromeai2025.devpost.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 The Problem We're Solving

In today's information-rich internet, users face three major challenges:
1. **Information Overload**: Complex technical content, academic articles, and jargon-heavy websites are difficult to understand
2. **Language Barriers**: Non-English speakers struggle with English-only content, limiting access to global information
3. **Privacy Concerns**: Cloud-based AI tools require sending sensitive data to external servers

**Overtab solves these problems** by bringing powerful AI capabilities directly into your browser - **no internet required, no data sent to the cloud, completely private and instant.**

## ✨ Features

### 🎯 Smart Text Selection Tooltip
Highlight any text on any webpage to instantly:
- **💡 Explain** - Get clear, concise explanations with key points
- **✨ Simplify** - Convert complex text into simple language anyone can understand
- **🌐 Translate** - Translate to 6 languages (Spanish, French, German, Italian, Japanese, Hindi)
- **✅ Proofread** - Fix grammar and spelling errors automatically

### 🎤 Voice-Powered Q&A
- Click the extension icon and use voice commands to ask questions about the current page
- Get intelligent, context-aware answers based on page content
- Perfect for hands-free browsing or accessibility needs

### 🖼️ Image Context Understanding
- Right-click any image and select "Describe with Overtab"
- Get detailed descriptions based on surrounding page context
- Helps understand charts, diagrams, and visual content

### 🔒 Privacy-First Design
- **100% on-device processing** using Chrome's built-in Gemini Nano
- Zero data sent to external servers
- Instant results without internet dependency

## 🤖 Chrome Built-in AI APIs Used

Overtab showcases **5 different Chrome AI APIs**:

1. **Prompt API** (LanguageModel) - Powers general explanations and voice Q&A
2. **Summarizer API** - Generates concise summaries and key points
3. **Rewriter API** - Simplifies complex text into plain language
4. **Translator API** - Fast on-device translation to 6 languages
5. **Proofreader API** - Grammar and spelling correction

## 📦 Installation for Judges

### Prerequisites
You'll need **Chrome Canary version 128 or higher** with experimental AI features enabled.

### Step 1: Enable Chrome Built-in AI APIs

1. Download and install [Chrome Canary](https://www.google.com/chrome/canary/)
2. Open `chrome://flags/#optimization-guide-on-device-model` and set to **Enabled BypassPerfRequirement**
3. Open `chrome://flags/#prompt-api-for-gemini-nano` and set to **Enabled**
4. Open `chrome://flags/#summarization-api-for-gemini-nano` and set to **Enabled**
5. Open `chrome://flags/#rewriter-api-for-gemini-nano` and set to **Enabled**
6. Open `chrome://flags/#translation-api` and set to **Enabled**
7. Open `chrome://flags/#language-detection-api` and set to **Enabled**
8. Relaunch Chrome Canary
9. Open DevTools Console and verify by running:
   ```javascript
   await LanguageModel.availability() // Should return "readily"
   ```

### Step 2: Install the Extension

1. Clone this repository:
   ```bash
   git clone https://github.com/[your-username]/Overtab.git
   cd Overtab
   ```

2. Open `chrome://extensions` in Chrome Canary

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **"Load unpacked"** and select the `Overtab` folder

5. The Overtab icon should appear in your extensions toolbar

### Step 3: Test the Extension

See [TESTING.md](./TESTING.md) for comprehensive testing instructions.

## 🎬 Demo Video

**[Watch the 3-minute demo video here]** → [YouTube/Vimeo Link]

The video demonstrates:
- Text explanation and simplification features
- Multi-language translation
- Voice-powered Q&A
- Image description capabilities
- Privacy-first on-device processing

## 🚀 Usage

### Text Selection Features
1. Navigate to any webpage
2. **Highlight any text** with your mouse
3. A tooltip will appear with options:
   - **💡 Explain** - Get detailed explanations
   - **✨ Simplify** - Make text easier to understand
   - **🌐 Translate** - Choose from 6 languages
   - **✅ Proofread** - Fix grammar/spelling
4. Results appear in a sidebar panel

### Voice Q&A
1. Click the **Overtab extension icon**
2. Select **"Ask About Page"**
3. Speak your question when prompted
4. Get AI-powered answers based on page context

### Image Description
1. Right-click any image on a webpage
2. Select **"Describe with Overtab"**
3. View context-aware description in sidebar

## 🏗️ Technical Architecture

```
Overtab Extension
│
├── Content Scripts (content.js)
│   ├── Text selection detection
│   ├── Tooltip UI management
│   ├── Voice recognition integration
│   └── Image context extraction
│
├── Background Service Worker (background.js)
│   ├── Context menu management
│   ├── Sidebar panel control
│   └── Message routing
│
├── AI Helper Module (ai-helper.js)
│   ├── LanguageModel (Prompt API)
│   ├── Summarizer API
│   ├── Rewriter API
│   ├── Translator API
│   └── Proofreader API
│
└── Sidebar UI (sidebar.js)
    ├── Results display
    ├── Loading states
    └── Error handling
```

### API Integration Details

**Prompt API (LanguageModel)**
- Used for: Explanations, voice Q&A, image descriptions
- Configuration: `temperature: 0.7, topK: 40`
- Provides structured, formatted responses

**Summarizer API**
- Used for: Quick summaries and key points extraction
- Fallback for explanation feature

**Rewriter API**
- Used for: Text simplification
- Fallback for making content accessible

**Translator API**
- Used for: On-device translation (28x faster than Prompt API)
- Supports: Spanish, French, German, Italian, Japanese, Hindi
- Handles language pack downloads automatically

**Proofreader API**
- Used for: Grammar and spelling correction
- Returns corrected text automatically

## 🎯 Judging Criteria Alignment

### Functionality (Scalability & API Usage)
- **Scalable**: Works on any webpage, any text selection, any language
- **Multi-API**: Uses 5 different Chrome AI APIs effectively
- **Global Reach**: Supports 6+ languages, accessible to diverse audiences

### Purpose (Problem Solving)
- **Real Problem**: Addresses information accessibility, language barriers, and privacy concerns
- **Compelling Solution**: Instant, private, on-device AI assistance
- **Repeat Usage**: Users return for every browsing session

### Content (Creativity & Visual Quality)
- **Creative Approach**: Unique combination of text tooltips + voice + image understanding
- **Modern UI**: Clean, intuitive tooltip and sidebar design
- **Visual Polish**: Smooth animations and professional styling

### User Experience (Ease of Use)
- **Intuitive**: Simple highlight → select action workflow
- **Non-Intrusive**: Tooltip only appears when needed
- **Fast**: Near-instant results with on-device processing
- **Accessible**: Voice commands for hands-free interaction

### Technical Execution (AI API Showcase)
- **Comprehensive**: Demonstrates 5 different AI APIs
- **Proper Integration**: Each API used for its optimal purpose
- **Error Handling**: Graceful fallbacks and demo mode
- **Performance**: Optimized with session management and cleanup

## 🌍 Impact & Use Cases

### Students
- Simplify complex academic papers
- Translate research from other languages
- Quick explanations of technical terms

### Non-Native English Speakers
- Break language barriers instantly
- Understand English content in native language
- Learn while browsing

### Professionals
- Proofread emails and documents
- Understand technical documentation
- Quick summaries of long articles

### Accessibility
- Voice-powered navigation
- Simplified content for cognitive accessibility
- Image descriptions for visual understanding

## 🔒 Privacy & Security

- **Zero cloud processing**: All AI runs locally on your device
- **No data collection**: We don't store or transmit any user data
- **No tracking**: No analytics or third-party services
- **Open source**: Full transparency - review our code

## 📋 Requirements

- **Chrome Canary** v128 or higher
- **Built-in AI APIs** enabled (see installation instructions)
- **Gemini Nano model** downloaded (happens automatically)
- Demo mode available if AI features aren't accessible yet

## 🛠️ Development

### Project Structure
```
Overtab/
├── manifest.json           # Extension configuration
├── icons/                  # Extension icons
├── src/
│   ├── background/
│   │   └── background.js   # Service worker
│   ├── content/
│   │   ├── content.js      # Content script logic
│   │   └── content-styles.css
│   ├── popup/
│   │   ├── popup.html      # Extension popup
│   │   ├── popup.js
│   │   └── toggle-styles.css
│   ├── sidebar/
│   │   ├── sidebar.html    # Results sidebar
│   │   └── sidebar.js
│   ├── styles/
│   │   └── styles.css
│   └── utils/
│       ├── ai-helper.js    # AI API integration
│       └── storage-manager.js
├── LICENSE                 # MIT License
├── README.md              # This file
└── TESTING.md             # Testing instructions
```

### Local Development
1. Make changes to the source files
2. Go to `chrome://extensions`
3. Click the refresh icon on the Overtab extension
4. Test your changes

## 🏆 Built for Google Chrome Built-in AI Challenge 2025

This project was created for the [Google Chrome Built-in AI Challenge 2025](https://googlechromeai2025.devpost.com/), showcasing the power of Chrome's built-in AI APIs powered by Gemini Nano.

**Track**: Chrome Extensions - Most Helpful / Best Multimodal AI Application

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

Copyright (c) 2025 Riyanshi Bohra

## 👩‍💻 Author

**Riyanshi Bohra**
- GitHub: [@[your-username]](https://github.com/[your-username])
- Built with ❤️ for the Chrome Built-in AI Challenge

## 🙏 Acknowledgments

- Google Chrome team for the amazing Built-in AI APIs
- Chrome AI Challenge organizers
- Gemini Nano for powering the on-device AI

---

**Experience the future of private, instant, on-device AI assistance. Try Overtab today!** 🚀
