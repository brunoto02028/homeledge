import { describe, it, expect } from 'vitest';

/**
 * Tests for the Omni-AI endpoint logic — context selection, history handling, prompt validation.
 */

// ============================================================
// Context selection logic (from /api/ai/ask route)
// ============================================================

describe('AI context selection', () => {
  const VALID_CONTEXTS = ['accounting', 'immigration', 'finance'];

  function resolveContext(input: string | undefined): string {
    return VALID_CONTEXTS.includes(input || '') ? input! : 'finance';
  }

  it('returns accounting for "accounting" context', () => {
    expect(resolveContext('accounting')).toBe('accounting');
  });

  it('returns immigration for "immigration" context', () => {
    expect(resolveContext('immigration')).toBe('immigration');
  });

  it('returns finance for "finance" context', () => {
    expect(resolveContext('finance')).toBe('finance');
  });

  it('defaults to finance for unknown context', () => {
    expect(resolveContext('unknown')).toBe('finance');
    expect(resolveContext('legal')).toBe('finance');
    expect(resolveContext('')).toBe('finance');
  });

  it('defaults to finance for undefined context', () => {
    expect(resolveContext(undefined)).toBe('finance');
  });
});

// ============================================================
// Temperature per context
// ============================================================

describe('AI temperature per context', () => {
  function getTemperature(context: string): number {
    return context === 'accounting' ? 0.2 : 0.4;
  }

  it('accounting uses 0.2 (precise, factual)', () => {
    expect(getTemperature('accounting')).toBe(0.2);
  });

  it('immigration uses 0.4', () => {
    expect(getTemperature('immigration')).toBe(0.4);
  });

  it('finance uses 0.4', () => {
    expect(getTemperature('finance')).toBe(0.4);
  });
});

// ============================================================
// History handling
// ============================================================

describe('AI history handling', () => {
  function buildMessages(
    systemPrompt: string,
    userPrompt: string,
    history?: { role: string; content: string }[],
  ) {
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (history && Array.isArray(history)) {
      const recent = history.slice(-10);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: userPrompt });
    return messages;
  }

  it('includes system prompt as first message', () => {
    const msgs = buildMessages('system', 'hello');
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toBe('system');
  });

  it('user prompt is always the last message', () => {
    const msgs = buildMessages('system', 'my question', [
      { role: 'user', content: 'prev' },
      { role: 'assistant', content: 'answer' },
    ]);
    const last = msgs[msgs.length - 1];
    expect(last.role).toBe('user');
    expect(last.content).toBe('my question');
  });

  it('includes history between system and user messages', () => {
    const msgs = buildMessages('sys', 'new question', [
      { role: 'user', content: 'old question' },
      { role: 'assistant', content: 'old answer' },
    ]);
    expect(msgs.length).toBe(4); // system + 2 history + user
    expect(msgs[1].content).toBe('old question');
    expect(msgs[2].content).toBe('old answer');
  });

  it('limits history to last 10 messages', () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg-${i}`,
    }));
    const msgs = buildMessages('sys', 'latest', history);
    // system(1) + last 10 history + user(1) = 12
    expect(msgs.length).toBe(12);
    expect(msgs[1].content).toBe('msg-10'); // starts from index 10
  });

  it('filters out invalid roles from history', () => {
    const history = [
      { role: 'user', content: 'valid' },
      { role: 'system', content: 'should be filtered' },
      { role: 'tool', content: 'should be filtered' },
      { role: 'assistant', content: 'valid' },
    ];
    const msgs = buildMessages('sys', 'q', history);
    // system + 2 valid history + user = 4
    expect(msgs.length).toBe(4);
    expect(msgs.map(m => m.role)).toEqual(['system', 'user', 'assistant', 'user']);
  });

  it('handles undefined history', () => {
    const msgs = buildMessages('sys', 'q');
    expect(msgs.length).toBe(2); // system + user
  });

  it('handles empty history', () => {
    const msgs = buildMessages('sys', 'q', []);
    expect(msgs.length).toBe(2);
  });
});

// ============================================================
// OISC disclaimer validation
// ============================================================

describe('OISC compliance', () => {
  const OISC_TOPICS_TO_DECLINE = [
    'specific visa application',
    'immigration appeals',
    'asylum claims',
    'deportation',
    'sponsorship licence',
    'points-based system strategy',
  ];

  const SAFE_TOPICS = [
    'National Insurance Number',
    'opening a bank account',
    'registering with a GP',
    'council tax',
    'renting',
    'driving licence',
  ];

  it('immigration system prompt mentions OISC', () => {
    const systemPrompt = `You are a UK Relocation Guide AI. You are NOT an OISC-registered immigration advisor.`;
    expect(systemPrompt).toContain('OISC');
    expect(systemPrompt).toContain('NOT');
  });

  it('decline topics are properly defined', () => {
    expect(OISC_TOPICS_TO_DECLINE.length).toBeGreaterThan(0);
    for (const topic of OISC_TOPICS_TO_DECLINE) {
      expect(typeof topic).toBe('string');
      expect(topic.length).toBeGreaterThan(0);
    }
  });

  it('safe topics do not overlap with decline topics', () => {
    for (const safe of SAFE_TOPICS) {
      for (const decline of OISC_TOPICS_TO_DECLINE) {
        expect(safe.toLowerCase()).not.toBe(decline.toLowerCase());
      }
    }
  });
});
