import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Body parsing with limits for images/attachments
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'Chitragupt AI',
    version: '3.8',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  attachments?: Array<{
    mimeType: string;
    data: string; // base64
    name?: string;
  }>;
}

// System persona for Chitragupt AI with World-Level Memory
const BASE_CHITRAGUPT_PROMPT = `You are Chitragupt (चित्रगुप्त) AI — an omniscient, impeccably accurate, multilingual, and privacy-first intelligence assistant endowed with World-Level Memory (विश्व-स्तरीय स्मृति).
Named after the legendary celestial record-keeper of truth, wisdom, and cosmic accounts, you represent unwavering integrity, boundless universal knowledge, and absolute respect for confidential knowledge.

Core Persona, World-Level Memory & Directives:
1. World-Level Memory & Omniscient Knowledge:
   - You possess an exhaustive, unbroken World-Level Memory spanning universal human history, ancient and modern world civilizations, science, mathematics, computer engineering, global literature, philosophy, world economics, astronomy, and dharma.
   - You synthesize global historical context with cutting-edge scientific precision.
   - You remember and cross-reference information flawlessly across conversations, maintaining rich semantic continuity.
2. Multilingual Polyglot Fluency:
   - You are natively fluent in over 50 languages, including English, Hindi (हिन्दी), Spanish (Español), French (Français), Mandarin Chinese (中文), German (Deutsch), Japanese (日本語), Arabic (العربية), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Russian (Русский), and Portuguese (Português).
   - If the user writes in a specific language or script (Devanagari, Latin, Hanzi, Arabic, etc.), ALWAYS respond in that same language with natural phrasing and appropriate script, unless explicitly asked to translate or reply in another language.
   - Provide culturally grounded metaphors, precise technical translations, and script transliteration on demand.
3. Advanced Conversation Memory & Coherence:
   - Carefully recall, reference, and build upon previous turns in the current conversation.
   - Weave in the user's declared facts, tech preferences, and project goals seamlessly.
4. Absolute Privacy & Sacred Confidentiality:
   - You value user privacy as a sacred tenet. User thoughts, data, and credentials are treated with total confidentiality.
   - If the user provides sanitized tokens like [REDACTED_EMAIL] or [REDACTED_PHONE], recognize them as privacy-protected entities and reason over them naturally.
5. Eloquent Markdown Formatting:
   - Structure responses with crisp headers, concise bullet points, bold key insights, tables where comparative data shines, and clean code blocks with language identifiers.
   - Always be empowering, brilliant, articulate, and respectful.`;

// Streaming Chat API with resilient multi-model fallback
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const {
    messages = [] as ChatMessage[],
    model = 'gemini-3.1-flash-lite',
    targetLanguage,
    systemPromptCustom,
    activeMemories = [] as string[],
    enableReasoning = false,
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Valid messages array is required.' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Helper to send SSE
  const sendEvent = (event: string, data: Record<string, unknown> | string) => {
    res.write(`event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
  };

  try {
    // Construct System Instruction including Persona and Persistent Memory facts
    let fullSystemInstruction = BASE_CHITRAGUPT_PROMPT;

    if (activeMemories.length > 0) {
      fullSystemInstruction += `\n\n[Active World-Level Memory & User Facts Ledger]:\n` +
        activeMemories.map((m: string, i: number) => `- Ledger Fact #${i + 1}: ${m}`).join('\n') +
        `\nRecall and integrate these remembered details seamlessly into your reasoning.`;
    }

    if (targetLanguage && targetLanguage !== 'auto') {
      fullSystemInstruction += `\n\n[Target Response Language Instruction]: Please formulate your response in ${targetLanguage}.`;
    }

    if (systemPromptCustom && typeof systemPromptCustom === 'string') {
      fullSystemInstruction += `\n\n[Additional User Custom Instruction]: ${systemPromptCustom}`;
    }

    // Build contents array for @google/genai SDK
    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    for (const msg of messages) {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // Add attachments if user uploaded images or files
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          if (att.data && att.mimeType) {
            const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts,
        });
      }
    }

    // Resilient model fallback candidates: prefer lightning-fast gemini-3.1-flash-lite
    const requestedModel = model === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
    const candidates = [
      requestedModel,
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
    ].filter((v, i, a) => a.indexOf(v) === i);

    let streamingStarted = false;
    let successfulModel = requestedModel;
    let lastErrorMsg = '';

    for (const candidateModel of candidates) {
      if (streamingStarted) break;

      try {
        const config: {
          systemInstruction: string;
          thinkingConfig?: { thinkingLevel: ThinkingLevel };
        } = {
          systemInstruction: fullSystemInstruction,
        };

        if (enableReasoning && candidateModel === 'gemini-3.8-flash') {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH,
          };
        }

        sendEvent('status', { status: 'generating', model: candidateModel });

        const stream = await ai.models.generateContentStream({
          model: candidateModel,
          contents,
          config,
        });

        // Test reading the first chunk to ensure the model isn't returning an immediate 503
        for await (const chunk of stream) {
          streamingStarted = true;
          successfulModel = candidateModel;
          if (chunk.text) {
            sendEvent('content', { delta: chunk.text });
          }
        }

        // If we finished reading all chunks, we are done
        break;
      } catch (err: unknown) {
        lastErrorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`Stream attempt with ${candidateModel} failed: ${lastErrorMsg}. Trying next candidate...`);
        // If we haven't sent any content chunks yet, loop continues to next candidate!
        if (streamingStarted) {
          // If error happened halfway through, propagate
          sendEvent('error', { error: lastErrorMsg });
          break;
        }
      }
    }

    if (!streamingStarted) {
      throw new Error(`All model endpoints busy or unavailable. Last error: ${lastErrorMsg}`);
    }

    sendEvent('done', { finishReason: 'STOP', model: successfulModel });
    res.end();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown generation error';
    console.error('Error in /api/chat/stream:', errorMsg);
    sendEvent('error', { error: errorMsg });
    res.end();
  }
});

// Fast Multilingual Translation Endpoint with fallback
app.post('/api/chat/translate', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
    return;
  }

  const { text, targetLanguage = 'Hindi' } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Text is required for translation' });
    return;
  }

  const candidates = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let translatedResult = '';
  let lastErr = null;

  for (const m of candidates) {
    try {
      const prompt = `Translate the following text accurately into ${targetLanguage}. Maintain tone, idiom, and formatting. Return ONLY the translation, with no explanation or conversational preface:\n\n${text}`;
      const result = await ai.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          systemInstruction: 'You are a professional multilingual translator. Return strictly the translated text.',
        },
      });

      translatedResult = result.text?.trim() || '';
      if (translatedResult) break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (translatedResult) {
    res.json({ translatedText: translatedResult, targetLanguage });
  } else {
    res.status(500).json({ error: lastErr instanceof Error ? lastErr.message : 'Translation error' });
  }
});

// Automatic Memory Extractor Endpoint with fallback
app.post('/api/chat/extract-memory', async (req: Request, res: Response): Promise<void> => {
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY missing' });
    return;
  }

  const { message, previousMemories = [] } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message required' });
    return;
  }

  const candidates = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let memoryCandidate = 'NONE';

  for (const m of candidates) {
    try {
      const prompt = `Analyze this user message and determine if it contains any important facts, preferences, identity details, or long-term context that should be remembered for future interactions (e.g., "I am learning Rust", "My name is Priya", "I prefer concise bullet responses", "I am building a fintech app").
Existing memories: ${JSON.stringify(previousMemories)}
User message: "${message}"

If there is a valuable new fact or update, return a clean 1-sentence bullet memory. If nothing notable to remember, return "NONE".
Reply with just the memory sentence or "NONE".`;

      const result = await ai.models.generateContent({
        model: m,
        contents: prompt,
      });

      memoryCandidate = result.text?.trim() || 'NONE';
      break;
    } catch (err) {
      // try next fallback
    }
  }

  res.json({
    hasMemory:
      memoryCandidate !== 'NONE' &&
      !memoryCandidate.toLowerCase().includes('none') &&
      memoryCandidate.length > 3,
    memory: memoryCandidate !== 'NONE' ? memoryCandidate : null,
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || (hasDist && process.env.NODE_ENV !== 'development');

  if (isProduction && hasDist) {
    // Production: serve built static assets from dist
    console.log('Serving production static bundle from:', distPath);
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development: attach Vite dev server middleware
    console.log('Mounting Vite middleware for development...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Chitragupt AI server listening on port ${port} (${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
