/**
 * Multi-AI Router — chooses the best AI provider/model per task type.
 *
 * Task routing:
 *   FAST tasks (categorisation, classification, extraction) → Claude Haiku
 *   SMART tasks (chat, analysis, advice, reports) → Claude Sonnet
 *   CREATIVE tasks (marketing copy, social posts, blog) → Claude Sonnet/Opus
 *   FALLBACK → Gemini → Abacus (existing providers)
 */

import { callClaude, type ClaudeModel, type ClaudeMessage } from '@/lib/claude';
import { callAI } from '@/lib/ai-client';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type AITask =
  | 'categorise'        // Fast: classify a transaction into a category
  | 'extract'           // Fast: extract structured data from text/document
  | 'classify'          // Fast: short classification/decision
  | 'chat'              // Smart: conversational assistant
  | 'analyse'           // Smart: financial analysis, insights
  | 'tax_advice'        // Smart: HMRC/tax guidance
  | 'life_events'       // Smart: life event guidance
  | 'report_summary'    // Smart: summarise financial report
  | 'marketing_copy'    // Creative: ad copy, landing page text
  | 'social_post'       // Creative: LinkedIn/Instagram/X posts
  | 'blog_article'      // Creative: long-form blog content
  | 'email_campaign'    // Creative: email marketing sequences
  | 'lead_score'        // Fast: score/analyse a lead
  | 'campaign_insight'; // Smart: analyse campaign performance

interface RouterOptions {
  maxTokens?: number;
  temperature?: number;
  forceFallback?: boolean; // force Gemini/Abacus instead of Claude
}

interface RouterResponse {
  content: string;
  provider: string;
  model?: string;
  task: AITask;
}

const TASK_CONFIG: Record<AITask, { model: ClaudeModel; maxTokens: number; temperature: number }> = {
  categorise:       { model: 'claude-haiku-4-5',   maxTokens: 512,  temperature: 0.1 },
  extract:          { model: 'claude-haiku-4-5',   maxTokens: 1024, temperature: 0.1 },
  classify:         { model: 'claude-haiku-4-5',   maxTokens: 256,  temperature: 0.0 },
  lead_score:       { model: 'claude-haiku-4-5',   maxTokens: 512,  temperature: 0.2 },
  chat:             { model: 'claude-sonnet-4-5',  maxTokens: 4096, temperature: 0.7 },
  analyse:          { model: 'claude-sonnet-4-5',  maxTokens: 4096, temperature: 0.4 },
  tax_advice:       { model: 'claude-sonnet-4-5',  maxTokens: 4096, temperature: 0.2 },
  life_events:      { model: 'claude-sonnet-4-5',  maxTokens: 4096, temperature: 0.5 },
  report_summary:   { model: 'claude-sonnet-4-5',  maxTokens: 2048, temperature: 0.3 },
  campaign_insight: { model: 'claude-sonnet-4-5',  maxTokens: 2048, temperature: 0.4 },
  email_campaign:   { model: 'claude-sonnet-4-5',  maxTokens: 4096, temperature: 0.6 },
  marketing_copy:   { model: 'claude-sonnet-4-5',  maxTokens: 4096, temperature: 0.8 },
  social_post:      { model: 'claude-sonnet-4-5',  maxTokens: 1024, temperature: 0.9 },
  blog_article:     { model: 'claude-opus-4-5',    maxTokens: 8192, temperature: 0.7 },
};

export async function routeAI(
  task: AITask,
  messages: ClaudeMessage[],
  options?: RouterOptions
): Promise<RouterResponse> {
  const config = TASK_CONFIG[task];

  // If Claude unavailable or forceFallback, use existing providers
  if (options?.forceFallback || !process.env.ANTHROPIC_API_KEY) {
    const legacyMessages: ChatMessage[] = messages.map(m => ({ role: m.role, content: m.content }));
    const res = await callAI(legacyMessages, { maxTokens: options?.maxTokens || config.maxTokens });
    return { content: res.content, provider: res.provider, task };
  }

  try {
    const res = await callClaude(messages, {
      model: config.model,
      maxTokens: options?.maxTokens || config.maxTokens,
      temperature: options?.temperature ?? config.temperature,
    });
    return { content: res.content, provider: 'claude', model: res.model, task };
  } catch (claudeError) {
    console.warn(`[AI Router] Claude failed for task "${task}", falling back:`, (claudeError as Error).message);
    const legacyMessages: ChatMessage[] = messages.map(m => ({ role: m.role, content: m.content }));
    const res = await callAI(legacyMessages, { maxTokens: options?.maxTokens || config.maxTokens });
    return { content: res.content, provider: res.provider, task };
  }
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export async function aiCategorise(system: string, userMsg: string): Promise<string> {
  const res = await routeAI('categorise', [
    { role: 'system', content: system },
    { role: 'user', content: userMsg },
  ]);
  return res.content;
}

export async function aiExtract(system: string, userMsg: string): Promise<string> {
  const res = await routeAI('extract', [
    { role: 'system', content: system },
    { role: 'user', content: userMsg },
  ]);
  return res.content;
}

export async function aiChat(messages: ClaudeMessage[], maxTokens?: number): Promise<string> {
  const res = await routeAI('chat', messages, { maxTokens });
  return res.content;
}

export async function aiAnalyse(system: string, userMsg: string): Promise<string> {
  const res = await routeAI('analyse', [
    { role: 'system', content: system },
    { role: 'user', content: userMsg },
  ]);
  return res.content;
}

export async function aiMarketing(task: 'social_post' | 'blog_article' | 'email_campaign' | 'marketing_copy', system: string, userMsg: string): Promise<string> {
  const res = await routeAI(task, [
    { role: 'system', content: system },
    { role: 'user', content: userMsg },
  ]);
  return res.content;
}
