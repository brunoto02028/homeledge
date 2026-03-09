// ═══════════════════════════════════════════════════════════════════════════════
// LIFE IN THE UK TEST — Complete Question Bank
// Based on "Life in the United Kingdom: A Guide for New Residents" (3rd edition)
// Format: 24 questions per mock test, 45 minutes, pass mark 75% (18/24)
// ═══════════════════════════════════════════════════════════════════════════════

export interface CitizenshipQuestion {
  id: string;
  theme: string;
  themeId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
}

export const THEMES: QuizTheme[] = [
  { id: 'values', name: 'Values & Principles', description: 'British values, democracy, rule of law, tolerance', icon: '⚖️', questionCount: 0 },
  { id: 'history', name: 'History of the UK', description: 'From the Stone Age to modern Britain', icon: '🏰', questionCount: 0 },
  { id: 'government', name: 'Government & Politics', description: 'Parliament, elections, devolution, monarchy', icon: '🏛️', questionCount: 0 },
  { id: 'law', name: 'Laws & Responsibilities', description: 'Rights, duties, human rights, criminal law', icon: '📜', questionCount: 0 },
  { id: 'everyday', name: 'Everyday Life', description: 'NHS, education, housing, employment, money', icon: '🏠', questionCount: 0 },
  { id: 'culture', name: 'Arts, Culture & Sports', description: 'Literature, music, sports, traditions, festivals', icon: '🎭', questionCount: 0 },
  { id: 'geography', name: 'Geography & Environment', description: 'UK nations, cities, landmarks, environment', icon: '🗺️', questionCount: 0 },
];

// We import questions from separate theme files to keep this manageable
import { VALUES_QUESTIONS } from './citizenship/values';
import { HISTORY_QUESTIONS } from './citizenship/history';
import { GOVERNMENT_QUESTIONS } from './citizenship/government';
import { LAW_QUESTIONS } from './citizenship/law';
import { EVERYDAY_QUESTIONS } from './citizenship/everyday';
import { CULTURE_QUESTIONS } from './citizenship/culture';
import { GEOGRAPHY_QUESTIONS } from './citizenship/geography';

export const ALL_QUESTIONS: CitizenshipQuestion[] = [
  ...VALUES_QUESTIONS,
  ...HISTORY_QUESTIONS,
  ...GOVERNMENT_QUESTIONS,
  ...LAW_QUESTIONS,
  ...EVERYDAY_QUESTIONS,
  ...CULTURE_QUESTIONS,
  ...GEOGRAPHY_QUESTIONS,
];

// Update theme counts
THEMES.forEach(t => { t.questionCount = ALL_QUESTIONS.filter(q => q.themeId === t.id).length; });

/** Get questions for a specific theme */
export function getThemeQuestions(themeId: string): CitizenshipQuestion[] {
  return ALL_QUESTIONS.filter(q => q.themeId === themeId);
}

/** Generate a mock test: 24 random questions distributed across themes */
export function generateMockTest(): CitizenshipQuestion[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 24);
}

/** Grade a test: returns score, pass/fail, and per-question results */
export function gradeTest(questions: CitizenshipQuestion[], answers: number[]): {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  results: Array<{ question: CitizenshipQuestion; userAnswer: number; correct: boolean }>;
} {
  const results = questions.map((q, i) => ({
    question: q,
    userAnswer: answers[i] ?? -1,
    correct: answers[i] === q.correctIndex,
  }));
  const score = results.filter(r => r.correct).length;
  const percentage = Math.round((score / questions.length) * 100);
  return { score, total: questions.length, percentage, passed: percentage >= 75, results };
}
