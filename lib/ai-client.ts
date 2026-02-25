// Unified AI Client - Gemini primary, Abacus AI fallback

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  provider: 'gemini' | 'abacus';
  usage?: any;
}

const AI_TIMEOUT_MS = 90_000; // 90 seconds

// Gemini API call
async function callGemini(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: options?.maxTokens || 4000,
      temperature: options?.temperature ?? 0.7,
    },
  };

  if (systemMsg) {
    body.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    console.log('[Gemini] Calling API (maxTokens:', options?.maxTokens || 4000, ')');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('[Gemini] API error:', response.status, err.substring(0, 500));
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[Gemini] Success, response length:', content.length);

    return {
      content,
      provider: 'gemini',
      usage: result.usageMetadata,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Abacus AI call (existing fallback)
async function callAbacus(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number; model?: string }): Promise<AIResponse> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) throw new Error('ABACUSAI_API_KEY not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    console.log('[Abacus] Calling API (model:', options?.model || 'gpt-4.1-mini', ')');
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        model: options?.model || 'gpt-4.1-mini',
        max_tokens: options?.maxTokens || 4000,
        temperature: options?.temperature ?? 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      // Check if it's a Cloudflare HTML error page
      const isHtml = err.trim().startsWith('<!') || err.trim().startsWith('<html');
      console.error('[Abacus] API error:', response.status, isHtml ? '(Cloudflare HTML error page)' : err.substring(0, 500));
      throw new Error(`Abacus API error: ${response.status}${isHtml ? ' (gateway timeout)' : ''}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    console.log('[Abacus] Success, response length:', content.length);

    return {
      content,
      provider: 'abacus',
      usage: result.usage,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Main AI function: tries Gemini first, falls back to Abacus
export async function callAI(
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number; preferAbacus?: boolean }
): Promise<AIResponse> {
  // If explicitly preferring Abacus (e.g. for vision tasks)
  if (options?.preferAbacus) {
    try {
      return await callAbacus(messages, options);
    } catch (abacusError) {
      console.log('[AI] Abacus failed, trying Gemini:', (abacusError as Error).message);
      return await callGemini(messages, options);
    }
  }

  // Default: Gemini first, Abacus fallback
  try {
    return await callGemini(messages, options);
  } catch (geminiError) {
    console.log('[AI] Gemini failed, falling back to Abacus:', (geminiError as Error).message);
    try {
      return await callAbacus(messages, options);
    } catch (abacusError) {
      console.error('[AI] Both providers failed');
      throw new Error('All AI providers unavailable');
    }
  }
}
