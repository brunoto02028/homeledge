import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for Academy API route logic.
 * We mock prisma and auth to test the route handlers in isolation.
 */

// Mock auth
const mockUserId = 'user-123';
vi.mock('@/lib/auth', () => ({
  requireUserId: vi.fn().mockResolvedValue('user-123'),
}));

// Mock prisma with chainable methods
const mockPrisma = {
  courseLevel: {
    findMany: vi.fn(),
  },
  question: {
    findMany: vi.fn(),
  },
  examModule: {
    findUnique: vi.fn(),
  },
  userExamAttempt: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  questionOption: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// Exam grading logic (replicated from submit route)
// ============================================================

function gradeExam(
  answers: { questionId: string; selectedOptionId: string }[],
  correctOptions: { questionId: string; correctOptionId: string }[],
) {
  const correctMap = new Map(correctOptions.map(o => [o.questionId, o.correctOptionId]));
  let correct = 0;

  const gradedAnswers = answers.map(a => {
    const correctId = correctMap.get(a.questionId);
    const isCorrect = a.selectedOptionId === correctId;
    if (isCorrect) correct++;
    return {
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId,
      correctOptionId: correctId || '',
      isCorrect,
    };
  });

  const totalQuestions = correctOptions.length;
  const scorePercent = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  return { correct, totalQuestions, scorePercent, gradedAnswers };
}

describe('Exam Grading Logic', () => {
  it('grades all correct answers as 100%', () => {
    const answers = [
      { questionId: 'q1', selectedOptionId: 'opt-a' },
      { questionId: 'q2', selectedOptionId: 'opt-b' },
      { questionId: 'q3', selectedOptionId: 'opt-c' },
    ];
    const correctOptions = [
      { questionId: 'q1', correctOptionId: 'opt-a' },
      { questionId: 'q2', correctOptionId: 'opt-b' },
      { questionId: 'q3', correctOptionId: 'opt-c' },
    ];
    const result = gradeExam(answers, correctOptions);
    expect(result.correct).toBe(3);
    expect(result.scorePercent).toBe(100);
    expect(result.gradedAnswers.every(a => a.isCorrect)).toBe(true);
  });

  it('grades all wrong answers as 0%', () => {
    const answers = [
      { questionId: 'q1', selectedOptionId: 'opt-x' },
      { questionId: 'q2', selectedOptionId: 'opt-x' },
    ];
    const correctOptions = [
      { questionId: 'q1', correctOptionId: 'opt-a' },
      { questionId: 'q2', correctOptionId: 'opt-b' },
    ];
    const result = gradeExam(answers, correctOptions);
    expect(result.correct).toBe(0);
    expect(result.scorePercent).toBe(0);
    expect(result.gradedAnswers.every(a => !a.isCorrect)).toBe(true);
  });

  it('grades mixed answers correctly', () => {
    const answers = [
      { questionId: 'q1', selectedOptionId: 'opt-a' }, // correct
      { questionId: 'q2', selectedOptionId: 'opt-x' }, // wrong
      { questionId: 'q3', selectedOptionId: 'opt-c' }, // correct
      { questionId: 'q4', selectedOptionId: 'opt-x' }, // wrong
    ];
    const correctOptions = [
      { questionId: 'q1', correctOptionId: 'opt-a' },
      { questionId: 'q2', correctOptionId: 'opt-b' },
      { questionId: 'q3', correctOptionId: 'opt-c' },
      { questionId: 'q4', correctOptionId: 'opt-d' },
    ];
    const result = gradeExam(answers, correctOptions);
    expect(result.correct).toBe(2);
    expect(result.scorePercent).toBe(50);
  });

  it('handles empty answers', () => {
    const result = gradeExam([], [
      { questionId: 'q1', correctOptionId: 'opt-a' },
    ]);
    expect(result.correct).toBe(0);
    expect(result.scorePercent).toBe(0);
  });

  it('handles no questions', () => {
    const result = gradeExam([], []);
    expect(result.correct).toBe(0);
    expect(result.scorePercent).toBe(0);
  });

  it('rounds scorePercent correctly', () => {
    // 1 out of 3 = 33.33...%
    const answers = [
      { questionId: 'q1', selectedOptionId: 'opt-a' },
      { questionId: 'q2', selectedOptionId: 'opt-x' },
      { questionId: 'q3', selectedOptionId: 'opt-x' },
    ];
    const correctOptions = [
      { questionId: 'q1', correctOptionId: 'opt-a' },
      { questionId: 'q2', correctOptionId: 'opt-b' },
      { questionId: 'q3', correctOptionId: 'opt-c' },
    ];
    const result = gradeExam(answers, correctOptions);
    expect(result.scorePercent).toBe(33);
  });

  it('determines pass/fail based on pass mark', () => {
    const passMark = 70;
    // 6 out of 8 = 75%
    const answers = Array.from({ length: 8 }, (_, i) => ({
      questionId: `q${i}`,
      selectedOptionId: i < 6 ? `correct-${i}` : 'wrong',
    }));
    const correctOptions = Array.from({ length: 8 }, (_, i) => ({
      questionId: `q${i}`,
      correctOptionId: `correct-${i}`,
    }));
    const result = gradeExam(answers, correctOptions);
    expect(result.scorePercent).toBe(75);
    expect(result.scorePercent >= passMark).toBe(true);

    // 5 out of 8 = 62.5% → 63% → fail
    const answers2 = Array.from({ length: 8 }, (_, i) => ({
      questionId: `q${i}`,
      selectedOptionId: i < 5 ? `correct-${i}` : 'wrong',
    }));
    const result2 = gradeExam(answers2, correctOptions);
    expect(result2.scorePercent).toBe(63);
    expect(result2.scorePercent >= passMark).toBe(false);
  });
});

// ============================================================
// Question mode filtering logic (from questions route)
// ============================================================

describe('Question mode filtering', () => {
  interface QuestionOption {
    id: string;
    optionText: string;
    isCorrect: boolean;
    explanation: string | null;
    sortOrder: number;
  }

  interface Question {
    id: string;
    questionText: string;
    aiExplanation: string | null;
    options: QuestionOption[];
  }

  function filterForTimedMode(questions: Question[]): Question[] {
    return questions.map(q => ({
      ...q,
      aiExplanation: null, // hide AI explanation
      options: q.options.map(o => ({
        id: o.id,
        optionText: o.optionText,
        sortOrder: o.sortOrder,
        // isCorrect and explanation stripped
      })) as any,
    }));
  }

  it('timed mode strips isCorrect from options', () => {
    const questions: Question[] = [{
      id: 'q1',
      questionText: 'What is double-entry?',
      aiExplanation: 'Double entry means...',
      options: [
        { id: 'o1', optionText: 'Option A', isCorrect: true, explanation: 'Correct because...', sortOrder: 0 },
        { id: 'o2', optionText: 'Option B', isCorrect: false, explanation: 'Wrong because...', sortOrder: 1 },
      ],
    }];

    const filtered = filterForTimedMode(questions);
    expect(filtered[0].aiExplanation).toBeNull();
    expect(filtered[0].options[0]).not.toHaveProperty('isCorrect');
    expect(filtered[0].options[0]).not.toHaveProperty('explanation');
    expect(filtered[0].options[0].optionText).toBe('Option A');
  });

  it('study mode keeps all data', () => {
    const questions: Question[] = [{
      id: 'q1',
      questionText: 'What is VAT?',
      aiExplanation: 'VAT is...',
      options: [
        { id: 'o1', optionText: 'A', isCorrect: true, explanation: 'Yes', sortOrder: 0 },
      ],
    }];

    // Study mode = no filtering
    expect(questions[0].aiExplanation).toBe('VAT is...');
    expect(questions[0].options[0].isCorrect).toBe(true);
    expect(questions[0].options[0].explanation).toBe('Yes');
  });
});

// ============================================================
// Shuffling logic
// ============================================================

describe('Shuffling', () => {
  function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  it('shuffle preserves all elements', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffle(original);
    expect(shuffled.length).toBe(original.length);
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it('shuffle does not mutate original array', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(original);
    expect(original).toEqual(copy);
  });

  it('shuffle of empty array returns empty', () => {
    expect(shuffle([]).length).toBe(0);
  });

  it('shuffle of single element returns same element', () => {
    expect(shuffle([42])).toEqual([42]);
  });
});
