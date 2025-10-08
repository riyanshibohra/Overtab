// Overtab AI Helper
// Chrome Built-in AI APIs with OpenAI fallback

// Performance logger
function logTiming(label, startTime) {
  console.log(`⏱️ ${label}: ${Date.now() - startTime}ms`);
}

// --- Minimal crypto helpers (AES-GCM + PBKDF2) ---
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveAesKey(passcode, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptTextWithPasscode(plaintext, passcode) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await deriveAesKey(passcode, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, textEncoder.encode(plaintext));
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv.buffer),
    salt: toBase64(salt.buffer)
  };
}

async function decryptTextWithPasscode(encObj, passcode) {
  const iv = new Uint8Array(fromBase64(encObj.iv));
  const salt = new Uint8Array(fromBase64(encObj.salt));
  const aesKey = await deriveAesKey(passcode, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, fromBase64(encObj.ciphertext));
  return textDecoder.decode(decrypted);
}

// OpenAI API Helper Functions
async function getOpenAISettings() {
  try {
    const settings = await chrome.storage.local.get(['openaiApiKey', 'openaiKeyEncrypted', 'openaiModel', 'openaiTemperature']);
    const session = await chrome.storage.session.get(['encryptionPasscode']);
    let apiKey = settings.openaiApiKey || null;
    if (!apiKey && settings.openaiKeyEncrypted && session.encryptionPasscode) {
      try {
        apiKey = await decryptTextWithPasscode(settings.openaiKeyEncrypted, session.encryptionPasscode);
      } catch (e) {
        console.error('Error decrypting OpenAI key:', e);
      }
    }
    return {
      apiKey,
      model: settings.openaiModel || 'gpt-4o-mini',
      temperature: settings.openaiTemperature !== undefined ? settings.openaiTemperature : 0.7
    };
  } catch (error) {
    console.error('Error getting OpenAI settings:', error);
    return { apiKey: null, model: 'gpt-4o-mini', temperature: 0.7 };
  }
}

async function shouldUseOpenAI() {
  try {
    const prefs = await chrome.storage.local.get(['fallbackPreference', 'openaiApiKey', 'openaiKeyEncrypted']);
    const fallback = prefs.fallbackPreference || 'openai-first';
    
    if (fallback === 'demo-only') {
      return false; // Skip OpenAI, go straight to demo
    }
    
    if (fallback === 'fail') {
      return false; // Skip OpenAI, will throw error
    }
    
    return !!(prefs.openaiApiKey || prefs.openaiKeyEncrypted); // Use if any key exists
  } catch (error) {
    return false;
  }
}

async function callOpenAI(systemPrompt, userPrompt, maxTokens = 500) {
  const settings = await getOpenAISettings();
  
  if (!settings.apiKey) {
    throw new Error('OpenAI API key not configured. Please add your API key in settings.');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: settings.temperature,
        max_tokens: maxTokens
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
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
          const session = await LanguageModel.create({
            language: 'en'
          });
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
        }
      }
    }
    
    // Try OpenAI fallback
    if (await shouldUseOpenAI()) {
      try {
        console.log('🟢 [EXPLAIN] Trying OpenAI fallback');
        const result = await callOpenAI(
          'You are a helpful AI assistant that explains text clearly and concisely.',
          `Explain the following text. Start with a brief 1-sentence summary, then provide 3-5 key points as bullet points:\n\n"${text.substring(0, 3000)}"`,
          600
        );
        logTiming('[EXPLAIN] Success (OpenAI)', startTime);
        return result;
      } catch (err) {
        console.error('🔴 [EXPLAIN] OpenAI error:', err.message);
      }
    }
    
    console.log('[EXPLAIN] Using demo mode');
    await simulateDelay();
    return demoResponse('explain', { text });
    
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
          const session = await LanguageModel.create({
            language: 'en'
          });
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
        }
      }
    }
    
    // Try OpenAI fallback
    if (await shouldUseOpenAI()) {
      try {
        console.log('🟢 [SIMPLIFY] Trying OpenAI fallback');
        const result = await callOpenAI(
          'You are a helpful AI assistant that simplifies complex text into easy-to-understand language.',
          `Simplify the following text into very simple, easy-to-understand language. Use basic words that a 10-year-old would understand:\n\n"${text.substring(0, 3000)}"`,
          600
        );
        logTiming('[SIMPLIFY] Success (OpenAI)', startTime);
        return result;
      } catch (err) {
        console.error('🔴 [SIMPLIFY] OpenAI error:', err.message);
      }
    }
    
    console.log('[SIMPLIFY] Using demo mode');
    await simulateDelay();
    return demoResponse('simplify', { text });
    
  } catch (error) {
    console.error('Simplify error:', error);
    throw error;
  }
}

// Translator API - Translate text (SPECIALIZED API - 28x faster than LanguageModel!)
// Supported languages: Spanish, French, German, Italian, Japanese, Hindi
async function translateText(text, targetLanguage = 'es') {
  const startTime = Date.now();
  console.log('🟣 [TRANSLATE] Starting with Translator API... (en →', targetLanguage, ')');
  
  const languageNames = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'hi': 'Hindi'
  };
  
  try {
    // Use Translator API (specialized and optimized for translation)
    if (typeof Translator !== 'undefined') {
      const availability = await Translator.availability({
        sourceLanguage: 'en',
        targetLanguage: targetLanguage
      });
      console.log('🟣 [TRANSLATE] Translator API availability:', availability);
      
      // Handle all availability states
      if (availability === 'readily' || availability === 'available') {
        console.log('✅ [TRANSLATE] Translator ready, translating...');
        const translator = await Translator.create({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage
        });
        const result = await translator.translate(text);
        translator.destroy();
        logTiming('[TRANSLATE] Success', startTime);
        return result;
      } 
      else if (availability === 'after-download' || availability === 'downloadable') {
        console.log('📥 [TRANSLATE] Downloading language pack for', languageNames[targetLanguage], '...');
        // Creating the translator will trigger the download
        const translator = await Translator.create({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage
        });
        const result = await translator.translate(text);
        translator.destroy();
        logTiming('[TRANSLATE] Success (after download)', startTime);
        return result;
      } 
      else {
        console.error('🔴 [TRANSLATE] Language not supported:', availability);
        throw new Error(`Translation to ${languageNames[targetLanguage]} is not supported`);
      }
    }
    
    // Try OpenAI fallback
    if (await shouldUseOpenAI()) {
      try {
        console.log('🟢 [TRANSLATE] Trying OpenAI fallback');
        const result = await callOpenAI(
          `You are a professional translator that translates English to ${languageNames[targetLanguage]}.`,
          `Translate the following text to ${languageNames[targetLanguage]}. Only provide the translation, no explanations:\n\n"${text.substring(0, 3000)}"`,
          800
        );
        logTiming('[TRANSLATE] Success (OpenAI)', startTime);
        return result;
      } catch (err) {
        console.error('🔴 [TRANSLATE] OpenAI error:', err.message);
      }
    }
    
    // Demo mode fallback (only if API not available)
    console.log('[TRANSLATE] Using demo mode (API not available)');
    await simulateDelay();
    return demoResponse('translate', { languageName: languageNames[targetLanguage] });
    
  } catch (error) {
    console.error('🔴 [TRANSLATE] Error:', error);
    throw error;
  }
}

// Proofreader API - Grammar and spelling corrections (SPECIALIZED API)
async function proofreadText(text) {
  const startTime = Date.now();
  console.log('✅ [PROOFREAD] Starting... (text length:', text.length, 'chars)');
  
  try {
    // Use Proofreader API (specialized for grammar checking)
    if (typeof Proofreader !== 'undefined') {
      const availability = await Proofreader.availability();
      console.log('✅ [PROOFREAD] Proofreader API availability:', availability);
      
      if (availability === 'readily' || availability === 'available') {
        console.log('✅ [PROOFREAD] Proofreader ready, checking grammar...');
        const proofreader = await Proofreader.create();
        const result = await proofreader.proofread(text);
        proofreader.destroy();
        logTiming('[PROOFREAD] Success', startTime);
        
        // Return the corrected text from the API response
        return result.correctedInput || text;
      } else {
        console.error('🔴 [PROOFREAD] API not available:', availability);
        throw new Error('Proofreader API is not available');
      }
    }
    
    // Try OpenAI fallback
    if (await shouldUseOpenAI()) {
      try {
        console.log('🟢 [PROOFREAD] Trying OpenAI fallback');
        const result = await callOpenAI(
          'You are a professional proofreader and grammar checker.',
          `Proofread and correct the following text for grammar, spelling, and punctuation errors. Only provide the corrected text, no explanations:\n\n"${text.substring(0, 3000)}"`,
          800
        );
        logTiming('[PROOFREAD] Success (OpenAI)', startTime);
        return result;
      } catch (err) {
        console.error('🔴 [PROOFREAD] OpenAI error:', err.message);
      }
    }
    
    // Demo mode fallback
    console.log('[PROOFREAD] Using demo mode (API not available)');
    await simulateDelay();
    return demoResponse('proofread', { text });
    
  } catch (error) {
    console.error('🔴 [PROOFREAD] Error:', error);
    throw error;
  }
}

// Simulate AI processing delay
function simulateDelay() {
  const delay = 500 + Math.random() * 1000;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Unified, minimal demo responses (kept intentionally short and straightforward)
function demoResponse(type, params = {}) {
  switch (type) {
    case 'explain': {
      const preview = (params.text || '').trim().slice(0, 120);
      const summary = preview || 'Summary of your text.';
      return `Demo mode: Example explanation\nSummary: ${summary}\n- Key point 1\n- Key point 2\n- Key point 3`;
    }
    case 'simplify': {
      const preview = (params.text || '').trim().slice(0, 120);
      return `Demo mode: Example simplified version\n${preview}`;
    }
    case 'translate': {
      const language = params.languageName || 'Target Language';
      return `Demo mode: Example translation to ${language}. Enable AI in Settings for real translation.`;
    }
    case 'proofread': {
      const preview = (params.text || '').trim().slice(0, 120);
      return `Demo mode: Example corrected text\n${preview}`;
    }
    case 'image': {
      return 'Demo mode: Example image description. Enable AI in Settings for real analysis.';
    }
    case 'prompt':
    default: {
      const q = (params.prompt || '').trim().slice(0, 120);
      return q
        ? `Demo mode: Example answer for: "${q}". Enable AI in Settings for real answers.`
        : 'Demo mode: Example answer. Enable AI in Settings for real answers.';
    }
  }
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
            language: 'en',
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
    
    // Try OpenAI fallback
    if (await shouldUseOpenAI()) {
      try {
        console.log('🟢 [PROMPT] Trying OpenAI fallback');
        const result = await callOpenAI(
          'You are a helpful AI assistant that provides clear and accurate answers to questions.',
          prompt,
          600
        );
        logTiming('[PROMPT] Success (OpenAI)', startTime);
        return result;
      } catch (err) {
        console.error('🔴 [PROMPT] OpenAI error:', err.message);
      }
    }
    
    console.log('[PROMPT] Using demo mode');
    await simulateDelay();
    
    if (prompt.toLowerCase().includes('describe this image')) {
      return demoResponse('image');
    }
    
    return demoResponse('prompt', { prompt });
    
  } catch (error) {
    console.error('Prompt AI error:', error);
    throw error;
  }
}
