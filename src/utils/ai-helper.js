// ============================================
// Overtab AI Helper - Phase 7
// ============================================
// Helper functions for Chrome Built-in AI APIs
// (Summarizer, Rewriter, Translator, Prompt)

// ============================================
// Check if AI APIs are available
// ============================================

async function checkAIAvailability() {
  const status = {
    summarizer: false,
    rewriter: false,
    translator: false,
    prompt: false
  };
  
  try {
    // Check Summarizer API
    if (window.ai && window.ai.summarizer) {
      const summarizerStatus = await window.ai.summarizer.capabilities();
      status.summarizer = summarizerStatus.available === 'readily';
    }
    
    // Check Rewriter API
    if (window.ai && window.ai.rewriter) {
      const rewriterStatus = await window.ai.rewriter.capabilities();
      status.rewriter = rewriterStatus.available === 'readily';
    }
    
    // Check Translator API
    if (window.ai && window.ai.translator) {
      status.translator = true; // Will check language pairs when needed
    }
    
    // Check Prompt API
    if (window.ai && window.ai.languageModel) {
      const promptStatus = await window.ai.languageModel.capabilities();
      status.prompt = promptStatus.available === 'readily';
    }
  } catch (error) {
    console.error('Error checking AI availability:', error);
  }
  
  return status;
}

// ============================================
// Summarizer API - For "Explain"
// ============================================

async function explainText(text) {
  try {
    // Check if real AI is available
    if (window.ai && window.ai.summarizer) {
      const capabilities = await window.ai.summarizer.capabilities();
      if (capabilities.available === 'readily') {
        // Use real API
        const summarizer = await window.ai.summarizer.create({
          type: 'key-points',
          length: 'medium',
          format: 'plain-text'
        });
        const result = await summarizer.summarize(text);
        summarizer.destroy();
        return result;
      }
    }
    
    // Fallback: Use demo mode
    console.log('Using demo mode for explanation');
    await simulateDelay();
    
    const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
    return `📝 DEMO MODE - Explanation:\n\nThe selected text discusses: "${preview}"\n\nKey points:\n• This is a demonstration of the Explanation feature\n• In production, this would use Chrome's Summarizer API with Gemini Nano\n• The AI would provide intelligent key points and summaries\n• All processing happens on-device for privacy\n\n✨ Real AI will be used when Chrome Built-in AI APIs become available in your browser.`;
    
  } catch (error) {
    console.error('Explain error:', error);
    throw error;
  }
}

// ============================================
// Rewriter API - For "Simplify"
// ============================================

async function simplifyText(text) {
  try {
    // Check if real AI is available
    if (window.ai && window.ai.rewriter) {
      const capabilities = await window.ai.rewriter.capabilities();
      if (capabilities.available === 'readily') {
        // Use real API
        const rewriter = await window.ai.rewriter.create({
          tone: 'casual',
          format: 'plain-text',
          length: 'shorter'
        });
        const result = await rewriter.rewrite(text);
        rewriter.destroy();
        return result;
      }
    }
    
    // Fallback: Use demo mode
    console.log('Using demo mode for simplification');
    await simulateDelay();
    
    const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
    return `✨ DEMO MODE - Simplified (Explained like you're 10):\n\n"${preview}"\n\nIn simple words:\nImagine this is like explaining something to a 10-year-old! The AI would break down complex ideas into easy-to-understand language, using simple words and familiar examples.\n\n📚 Key idea: Takes hard-to-understand text and makes it super clear and simple!\n\n✨ Real AI will provide actual simplified explanations when Chrome Built-in AI APIs become available.`;
    
  } catch (error) {
    console.error('Simplify error:', error);
    throw error;
  }
}

// ============================================
// Translator API - For "Translate"
// ============================================

async function translateText(text, targetLanguage = 'es') {
  try {
    // Check if real AI is available
    if (window.ai && window.ai.translator) {
      const sourceLanguage = 'en';
      const canTranslate = await window.ai.translator.canTranslate({
        sourceLanguage,
        targetLanguage
      });
      
      if (canTranslate === 'readily') {
        // Use real API
        const translator = await window.ai.translator.create({
          sourceLanguage,
          targetLanguage
        });
        const result = await translator.translate(text);
        translator.destroy();
        return result;
      }
    }
    
    // Fallback: Use demo mode
    console.log('Using demo mode for translation');
    await simulateDelay();
    
    const languageNames = {
      'es': 'Spanish (Español)',
      'fr': 'French (Français)',
      'de': 'German (Deutsch)',
      'it': 'Italian (Italiano)',
      'ja': 'Japanese (日本語)'
    };
    
    return `🌐 DEMO MODE - Translation to ${languageNames[targetLanguage] || targetLanguage}:\n\n[This is where the translated text would appear]\n\nOriginal text: "${text.substring(0, 50)}..."\n\nIn production, this would use Chrome's Translation API with Gemini Nano to provide accurate on-device translation while maintaining your privacy.\n\n✨ Real AI translation will be used when Chrome Built-in AI APIs become available.`;
    
  } catch (error) {
    console.error('Translate error:', error);
    throw error;
  }
}

// ============================================
// Helper: Simulate AI processing delay
// ============================================

function simulateDelay() {
  // Simulate realistic AI processing time (500-1500ms)
  const delay = 500 + Math.random() * 1000;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ============================================
// Prompt API - For general queries and images
// ============================================

async function promptAI(prompt) {
  try {
    // Check if real AI is available
    if (window.ai && window.ai.languageModel) {
      const capabilities = await window.ai.languageModel.capabilities();
      if (capabilities.available === 'readily') {
        // Use real API
        const session = await window.ai.languageModel.create({
          temperature: 0.7,
          topK: 3
        });
        const result = await session.prompt(prompt);
        session.destroy();
        return result;
      }
    }
    
    // Fallback: Use demo mode
    console.log('Using demo mode for Prompt API');
    await simulateDelay();
    
    // Check if it's an image description request
    if (prompt.toLowerCase().includes('describe this image')) {
      return `🖼️ DEMO MODE - Image Description:\n\nThis is a demonstration of the image description feature. In production, this would:\n\n• Use Chrome's Prompt API with Gemini Nano\n• Analyze the image content\n• Provide detailed descriptions of what's visible\n• Identify objects, scenes, text, and context\n• All processing happens on-device for privacy\n\nExample description: "The image appears to show [subject]. The scene includes [details]. The overall composition suggests [context]."\n\n✨ Real AI image analysis will be available when Chrome Built-in AI APIs support multimodal inputs.`;
    }
    
    // For voice/text queries
    return `🤖 DEMO MODE - AI Response:\n\nYour question: "${prompt}"\n\nThis is a demonstration of the Prompt API feature. In production, this would:\n\n• Process your question using Gemini Nano\n• Provide intelligent, context-aware answers\n• Support follow-up questions\n• Work completely offline and on-device\n• Maintain your privacy (no data sent to servers)\n\nExample response: "Based on your question, here's what I can tell you... [intelligent answer would appear here]"\n\n✨ Real AI responses will be available when Chrome Built-in AI APIs become available in your browser.`;
    
  } catch (error) {
    console.error('Prompt AI error:', error);
    throw error;
  }
}
