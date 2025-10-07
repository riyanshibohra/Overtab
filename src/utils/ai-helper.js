// Overtab AI Helper
// Chrome Built-in AI APIs with demo mode fallback

// Performance logger
function logTiming(label, startTime) {
  console.log(`⏱️ ${label}: ${Date.now() - startTime}ms`);
}

async function checkAIAvailability() {
  const status = {
    summarizer: false,
    rewriter: false,
    translator: false,
    prompt: false,
    languageModel: false
  };
  
  try {
    // New API format: LanguageModel, Summarizer, etc. (capital letters)
    // Check LanguageModel (Prompt API)
    if (typeof LanguageModel !== 'undefined') {
      const availability = await LanguageModel.availability();
      status.prompt = availability === 'readily';
      status.languageModel = availability === 'readily';
    }
    
    // Check Summarizer
    if (typeof Summarizer !== 'undefined') {
      const availability = await Summarizer.availability();
      status.summarizer = availability === 'readily';
    }
    
    // Check Rewriter
    if (typeof Rewriter !== 'undefined') {
      const availability = await Rewriter.availability();
      status.rewriter = availability === 'readily';
    }
    
    // Check Translator
    if (typeof Translator !== 'undefined') {
      const availability = await Translator.availability();
      status.translator = availability === 'readily';
    }
  } catch (error) {
    console.error('Error checking AI availability:', error);
  }
  
  console.log('🤖 Overtab AI Status:', status);
  return status;
}

// LanguageModel API - Explain text (with better formatting)
async function explainText(text) {
  const startTime = Date.now();
  console.log('🔵 [EXPLAIN] Starting... (text length:', text.length, 'chars)');
  
  try {
    // Try LanguageModel first for better formatted output
    if (typeof LanguageModel !== 'undefined') {
      const availability = await LanguageModel.availability();
      console.log('🔵 [EXPLAIN] LanguageModel availability:', availability);
      
      if (availability === 'readily' || availability === 'available') {
        try {
          const session = await LanguageModel.create();
          const prompt = `Explain the following text clearly and concisely. Start with a brief 1-sentence summary, then provide 3-5 key points as bullet points:

"${text}"

Format your response as:
Summary: [one sentence]

Key points:
* [point 1]
* [point 2]
* [point 3]`;
          
          const result = await session.prompt(prompt);
          session.destroy();
          logTiming('[EXPLAIN] Success', startTime);
          return result;
        } catch (err) {
          console.error('🔴 [EXPLAIN] LanguageModel error:', err.message);
          // Fallback to Summarizer
        }
      }
    }
    
    // Fallback to Summarizer
    if (typeof Summarizer !== 'undefined') {
      const availability = await Summarizer.availability();
      console.log('🔵 [EXPLAIN] Summarizer availability (fallback):', availability);
      
      if (availability === 'readily' || availability === 'available') {
        try {
          const summarizer = await Summarizer.create();
          const result = await summarizer.summarize(text);
          summarizer.destroy();
          logTiming('[EXPLAIN] Success (Summarizer)', startTime);
          return result;
        } catch (err) {
          console.error('🔴 [EXPLAIN] Error:', err.message);
          throw err;
        }
      }
    }
    
    console.log('🟡 [EXPLAIN] Using demo mode');
    await simulateDelay();
    
    const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
    return `📝 DEMO MODE - Explanation:\n\nThe selected text discusses: "${preview}"\n\nKey points:\n• This is a demonstration of the Explanation feature\n• In production, this would use Chrome's Summarizer API with Gemini Nano\n• The AI would provide intelligent key points and summaries\n• All processing happens on-device for privacy\n\n✨ Real AI will be used when Chrome Built-in AI APIs become available in your browser.`;
    
  } catch (error) {
    console.error('Explain error:', error);
    throw error;
  }
}

// Rewriter API - Simplify text
async function simplifyText(text) {
  const startTime = Date.now();
  console.log('🟢 [SIMPLIFY] Starting... (text length:', text.length, 'chars)');
  
  try {
    // Use LanguageModel for better control over simplification
    if (typeof LanguageModel !== 'undefined') {
      const availability = await LanguageModel.availability();
      console.log('🟢 [SIMPLIFY] LanguageModel availability:', availability);
      
      if (availability === 'readily' || availability === 'available') {
        try {
          const session = await LanguageModel.create();
          const prompt = `Simplify the following text into very simple, easy-to-understand language. Use basic words that a 10-year-old would understand. Break down complex concepts into clear, short sentences. Avoid jargon and technical terms.

"${text}"

Provide a simplified version that is:
- Written in plain, everyday language
- Shorter and more direct
- Easy for anyone to understand
- Free of complicated words`;
          
          const result = await session.prompt(prompt);
          session.destroy();
          logTiming('[SIMPLIFY] Success', startTime);
          return result;
        } catch (err) {
          console.error('🔴 [SIMPLIFY] LanguageModel error:', err.message);
          // Fallback to Rewriter
        }
      }
    }
    
    // Fallback to Rewriter API
    if (typeof Rewriter !== 'undefined') {
      const availability = await Rewriter.availability();
      console.log('🟢 [SIMPLIFY] Rewriter availability (fallback):', availability);
      
      if (availability === 'readily' || availability === 'available') {
        try {
          const rewriter = await Rewriter.create();
          const result = await rewriter.rewrite(text);
          rewriter.destroy();
          logTiming('[SIMPLIFY] Success (Rewriter)', startTime);
          return result;
        } catch (err) {
          console.error('🔴 [SIMPLIFY] Error:', err.message);
          throw err;
        }
      }
    }
    
    console.log('🟡 [SIMPLIFY] Using demo mode');
    await simulateDelay();
    
    const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
    return `✨ DEMO MODE - Simplified (Explained like you're 10):\n\n"${preview}"\n\nIn simple words:\nImagine this is like explaining something to a 10-year-old! The AI would break down complex ideas into easy-to-understand language, using simple words and familiar examples.\n\n📚 Key idea: Takes hard-to-understand text and makes it super clear and simple!\n\n✨ Real AI will provide actual simplified explanations when Chrome Built-in AI APIs become available.`;
    
  } catch (error) {
    console.error('Simplify error:', error);
    throw error;
  }
}

// Translator API - Translate text
// Supported languages: Spanish, French, German, Italian, Japanese, Hindi
async function translateText(text, targetLanguage = 'es') {
  const startTime = Date.now();
  console.log('🟣 [TRANSLATE] Starting... (en →', targetLanguage, ')');
  
  const languageNames = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'hi': 'Hindi'
  };
  
  try {
    // Analyze original format
    const lines = text.split('\n');
    const hasBullets = text.match(/^[\*\-•]\s/m);
    const hasMultipleLines = lines.length > 1;
    const isShortPhrase = text.trim().split(/\s+/).length <= 5 && !hasMultipleLines;
    
    // Use LanguageModel for format-preserving translation
    if (typeof LanguageModel !== 'undefined') {
      const availability = await LanguageModel.availability();
      console.log('🟣 [TRANSLATE] LanguageModel availability:', availability);
      
      if (availability === 'readily' || availability === 'available') {
        try {
          const session = await LanguageModel.create();
          
          let instructions = '';
          if (isShortPhrase) {
            instructions = 'Translate ONLY the text itself. Do NOT add bullet points, explanations, or extra formatting. Just provide the direct translation.';
          } else if (hasBullets) {
            instructions = 'Translate each bullet point. Keep the same bullet markers (*, -, •) and line structure. Do NOT add introductory text.';
          } else if (hasMultipleLines) {
            instructions = 'Translate each line/paragraph. Preserve the line breaks and paragraph structure. Do NOT convert to bullet points.';
          } else {
            instructions = 'Translate the paragraph. Keep it as a flowing paragraph, do NOT convert to bullet points.';
          }
          
          const prompt = `Translate this English text to ${languageNames[targetLanguage]}:

${text}

${instructions}

Provide ONLY the translation, nothing else.`;
          
          const result = await session.prompt(prompt);
          session.destroy();
          logTiming('[TRANSLATE] Success', startTime);
          return result.trim();
        } catch (err) {
          console.error('🔴 [TRANSLATE] LanguageModel error:', err.message);
          // Fallback to Translator API
        }
      }
    }
    
    // Fallback to Translator API
    if (typeof Translator !== 'undefined') {
      const availability = await Translator.availability({
        sourceLanguage: 'en',
        targetLanguage: targetLanguage
      });
      console.log('🟣 [TRANSLATE] Translator availability (fallback):', availability);
      
      if (availability === 'readily' || availability === 'available') {
        const translator = await Translator.create({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage
        });
        const result = await translator.translate(text);
        translator.destroy();
        logTiming('[TRANSLATE] Success (Translator)', startTime);
        return result;
      } else if (availability === 'after-download' || availability === 'downloadable') {
        console.log('🟡 [TRANSLATE] Downloading language pack for', targetLanguage, '...');
        const translator = await Translator.create({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage
        });
        const result = await translator.translate(text);
        translator.destroy();
        logTiming('[TRANSLATE] Success (after download)', startTime);
        return result;
      } else {
        console.error('🔴 [TRANSLATE] Not supported:', availability);
        throw new Error(`Translation to ${targetLanguage} not supported`);
      }
    }
    
    console.log('🟡 [TRANSLATE] Using demo mode');
    await simulateDelay();
    
    return `🌐 DEMO MODE - Translation to ${languageNames[targetLanguage] || targetLanguage}:\n\n[This is where the translated text would appear]\n\nOriginal text: "${text.substring(0, 50)}..."\n\nIn production, this would use Chrome's Translation API with Gemini Nano to provide accurate on-device translation while maintaining your privacy.\n\n✨ Real AI translation will be used when Chrome Built-in AI APIs become available.`;
    
  } catch (error) {
    console.error('Translate error:', error);
    throw error;
  }
}

// Simulate AI processing delay
function simulateDelay() {
  const delay = 500 + Math.random() * 1000;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Prompt API - General queries  
async function promptAI(prompt) {
  const startTime = Date.now();
  console.log('🟠 [PROMPT] Starting... (prompt length:', prompt.length, 'chars)');
  
  try {
    if (typeof LanguageModel !== 'undefined') {
      const availability = await LanguageModel.availability();
      console.log('🟠 [PROMPT] LanguageModel availability:', availability);
      
      if (availability === 'readily' || availability === 'available') {
        try {
          const session = await LanguageModel.create({
            temperature: 0.7,
            topK: 40
          });
          const result = await session.prompt(prompt);
          session.destroy();
          logTiming('[PROMPT] Success', startTime);
          return result;
        } catch (err) {
          console.error('🔴 [PROMPT] Error:', err.message);
          throw err;
        }
      }
    }
    
    console.log('🟡 [PROMPT] Using demo mode');
    await simulateDelay();
    
    if (prompt.toLowerCase().includes('describe this image')) {
      return `🖼️ DEMO MODE - Image Description:\n\nThis is a demonstration of the image description feature. In production, this would use Chrome's Prompt API with Gemini Nano to analyze the image content and provide detailed descriptions.\n\n✨ Real AI image analysis will be available when Chrome Built-in AI APIs support multimodal inputs.`;
    }
    
    return `🤖 DEMO MODE - AI Response:\n\nYour question: "${prompt}"\n\nThis is a demonstration of the Prompt API feature. In production, this would process your question using Gemini Nano and provide intelligent, context-aware answers while maintaining your privacy.\n\n✨ Real AI responses will be available when Chrome Built-in AI APIs become available in your browser.`;
    
  } catch (error) {
    console.error('Prompt AI error:', error);
    throw error;
  }
}
