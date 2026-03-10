import Anthropic from '@anthropic-ai/sdk';

const AI_TIMEOUT_MS = 120_000;

export type ClaudeModel = 'claude-haiku-4-5' | 'claude-sonnet-4-5' | 'claude-opus-4-5';

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  provider: 'claude';
  model: ClaudeModel;
  usage?: { input_tokens: number; output_tokens: number };
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return new Anthropic({ apiKey });
}

export async function callClaude(
  messages: ClaudeMessage[],
  options?: {
    model?: ClaudeModel;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ClaudeResponse> {
  const client = getClient();
  const model: ClaudeModel = options?.model || 'claude-sonnet-4-5';

  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    console.log('[Claude] Calling API model:', model, 'maxTokens:', options?.maxTokens || 4096);

    const response = await client.messages.create(
      {
        model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: chatMessages,
      },
      { signal: controller.signal as any }
    );

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    console.log('[Claude] Success model:', model, 'response length:', content.length);

    return {
      content,
      provider: 'claude',
      model,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function callClaudeHaiku(
  messages: ClaudeMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ClaudeResponse> {
  return callClaude(messages, { ...options, model: 'claude-haiku-4-5' });
}

export async function callClaudeSonnet(
  messages: ClaudeMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ClaudeResponse> {
  return callClaude(messages, { ...options, model: 'claude-sonnet-4-5' });
}

export async function callClaudeOpus(
  messages: ClaudeMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ClaudeResponse> {
  return callClaude(messages, { ...options, model: 'claude-opus-4-5' });
}
