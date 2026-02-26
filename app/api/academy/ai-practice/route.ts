import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';

// POST - Generate AI practice questions for a module
export async function POST(request: Request) {
  try {
    await requireUserId();
    const { moduleId, topic, difficulty, count = 10 } = await request.json();

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
    }

    const mod = await (prisma as any).examModule.findUnique({
      where: { id: moduleId },
      select: {
        id: true, title: true, code: true, description: true,
        topicsCovered: true, learningOutcomes: true, passMarkPercent: true,
      },
    });

    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const questionCount = Math.min(Math.max(count, 1), 20);
    const topicFilter = topic ? `\nFocus specifically on the topic: "${topic}"` : '';
    const diffFilter = difficulty ? `\nDifficulty level: ${difficulty} (easy = recall/definitions, medium = application/calculation, hard = analysis/multi-step)` : '\nMix of easy, medium, and hard questions.';

    const prompt = `You are an expert UK accounting examiner creating exam-standard multiple-choice questions.

MODULE: ${mod.title} (${mod.code})
DESCRIPTION: ${mod.description || ''}
TOPICS COVERED: ${(mod.topicsCovered || []).join(', ')}
LEARNING OUTCOMES: ${(mod.learningOutcomes || []).join('; ')}
${topicFilter}${diffFilter}

Generate exactly ${questionCount} high-quality multiple-choice questions. Requirements:
- Each question has EXACTLY 4 options (A, B, C, D), with EXACTLY 1 correct answer
- Use realistic UK-specific examples (£ currency, VAT at 20%, UK tax rates, HMRC terminology)
- Include numerical/calculation questions where appropriate (show specific amounts)
- Explanations should be educational — explain WHY the correct answer is right AND why each wrong answer is wrong
- Cover different topics from the module to give broad practice
- Match the style of real AAT/ACCA professional exams
- The aiExplanation should be a detailed teaching explanation (2-4 sentences minimum)

Return ONLY a valid JSON array (no markdown, no backticks) in this exact format:
[
  {
    "questionText": "The full question text",
    "topic": "Topic name from the module's topics",
    "difficulty": "easy|medium|hard",
    "aiExplanation": "Detailed explanation of the concept being tested and why the correct answer is right",
    "options": [
      { "text": "Option A text", "correct": false, "explanation": "Why this option is incorrect" },
      { "text": "Option B text", "correct": true, "explanation": "Why this is the correct answer" },
      { "text": "Option C text", "correct": false, "explanation": "Why this option is incorrect" },
      { "text": "Option D text", "correct": false, "explanation": "Why this option is incorrect" }
    ]
  }
]`;

    const result = await callAI(
      [{ role: 'user', content: prompt }],
      { maxTokens: 8000, temperature: 0.7 }
    );

    let content = (result.content || '').trim();
    // Strip markdown code fences if present
    if (content.startsWith('```')) {
      content = content.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    let questions: any[];
    try {
      questions = JSON.parse(content);
    } catch {
      console.error('[AI Practice] Failed to parse AI response:', content.substring(0, 500));
      return NextResponse.json({ error: 'AI generated invalid format. Please try again.' }, { status: 500 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions generated. Please try again.' }, { status: 500 });
    }

    // Normalize questions to match the exam-client format
    const normalized = questions.map((q: any, idx: number) => ({
      id: `ai-${Date.now()}-${idx}`,
      questionText: q.questionText,
      topic: q.topic || topic || 'General',
      difficulty: q.difficulty || 'medium',
      aiExplanation: q.aiExplanation || '',
      scenario: null,
      sortOrder: idx + 1,
      options: (q.options || []).map((opt: any, oi: number) => ({
        id: `ai-opt-${Date.now()}-${idx}-${oi}`,
        optionText: opt.text,
        isCorrect: opt.correct === true,
        explanation: opt.explanation || '',
        sortOrder: oi + 1,
      })),
    }));

    return NextResponse.json({
      module: {
        id: mod.id,
        title: mod.title,
        code: mod.code,
        passMarkPercent: mod.passMarkPercent,
        timeLimitMinutes: null,
        totalQuestions: normalized.length,
      },
      questions: normalized,
      mode: 'ai-practice',
      provider: result.provider,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[AI Practice] Error:', error);
    return NextResponse.json({ error: 'Failed to generate practice questions' }, { status: 500 });
  }
}
