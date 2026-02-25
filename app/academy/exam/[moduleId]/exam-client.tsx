'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, Clock, CheckCircle2, XCircle, ArrowLeft, ArrowRight,
  Play, BookOpen, AlertTriangle, Trophy, RotateCcw, Sparkles,
  Send, Bot, ChevronDown, ChevronUp, Shield,
} from 'lucide-react';

interface Option {
  id: string;
  optionText: string;
  sortOrder: number;
  isCorrect?: boolean;
  explanation?: string;
}
interface Question {
  id: string;
  questionText: string;
  scenario: string | null;
  aiExplanation: string | null;
  topic: string | null;
  difficulty: string | null;
  options: Option[];
}
interface ModuleInfo {
  id: string;
  title: string;
  code: string | null;
  passMarkPercent: number;
  timeLimitMinutes: number;
  totalQuestions: number;
}
interface GradedAnswer {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
}
interface Results {
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  passed: boolean;
  passMarkPercent: number;
  gradedAnswers: GradedAnswer[];
}

type ExamPhase = 'loading' | 'ready' | 'active' | 'results';

export function ExamClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const moduleId = params.moduleId as string;
  const mode = (searchParams.get('mode') || 'study') as 'timed' | 'study';

  const [phase, setPhase] = useState<ExamPhase>('loading');
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Timer for timed mode
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Study mode: reveal per question
  const [revealedQuestions, setRevealedQuestions] = useState<Set<string>>(new Set());

  // AI tutor
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  // Anti-cheat: detect tab switches in timed mode
  const tabSwitchCount = useRef(0);
  useEffect(() => {
    if (mode !== 'timed' || phase !== 'active') return;
    const handler = () => {
      if (document.hidden) {
        tabSwitchCount.current++;
        if (tabSwitchCount.current >= 3) {
          toast({ title: 'Warning: Multiple tab switches detected', description: 'Your exam may be flagged for review.', variant: 'destructive' });
        }
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [mode, phase, toast]);

  // Load questions
  useEffect(() => {
    loadQuestions();
  }, [moduleId, mode]);

  const loadQuestions = async () => {
    setPhase('loading');
    try {
      const res = await fetch(`/api/academy/modules/${moduleId}/questions?mode=${mode}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setModuleInfo(data.module);
      setQuestions(data.questions || []);

      if (data.questions.length === 0) {
        toast({ title: 'No questions available for this module yet', variant: 'destructive' });
        return;
      }
      setPhase('ready');
    } catch {
      toast({ title: 'Failed to load exam', variant: 'destructive' });
    }
  };

  // Start exam
  const startExam = async () => {
    try {
      const res = await fetch('/api/academy/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, mode }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAttemptId(data.attempt.id);
      setAnswers({});
      setCurrentIdx(0);
      setRevealedQuestions(new Set());
      setResults(null);
      startTimeRef.current = Date.now();

      if (mode === 'timed' && moduleInfo?.timeLimitMinutes) {
        setTimeLeft(moduleInfo.timeLimitMinutes * 60);
      }

      setPhase('active');
    } catch {
      toast({ title: 'Failed to start exam', variant: 'destructive' });
    }
  };

  // Timer countdown
  useEffect(() => {
    if (mode !== 'timed' || phase !== 'active' || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, phase]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Select answer
  const selectAnswer = (questionId: string, optionId: string) => {
    if (phase !== 'active') return;
    // In study mode with revealed, don't allow changing
    if (mode === 'study' && revealedQuestions.has(questionId)) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  // Reveal answer in study mode
  const revealAnswer = (questionId: string) => {
    setRevealedQuestions(prev => new Set(prev).add(questionId));
  };

  // Submit exam
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting) return;
    if (!autoSubmit && mode === 'timed') {
      const unanswered = questions.length - Object.keys(answers).length;
      if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) return;
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const answerArray = questions.map(q => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] || null,
      })).filter(a => a.selectedOptionId);

      const res = await fetch('/api/academy/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers: answerArray, timeSpentSeconds: timeSpent }),
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setResults(data.results);
      setPhase('results');
    } catch {
      toast({ title: 'Failed to submit exam', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, mode, questions, answers, attemptId, toast]);

  // Ask AI tutor
  const askAiTutor = async (prompt?: string) => {
    const q = prompt || aiQuestion;
    if (!q.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const currentQ = questions[currentIdx];
      const fullPrompt = currentQ
        ? `Context: The student is working on the question "${currentQ.questionText}" from module "${moduleInfo?.title}". Their question: ${q}`
        : q;

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: fullPrompt, context: 'accounting' }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAiAnswer(data.answer || 'No answer received');
    } catch {
      toast({ title: 'AI tutor unavailable', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // ==================== LOADING ====================
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ==================== READY (pre-exam screen) ====================
  if (phase === 'ready') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/academy')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Academy
        </Button>

        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className={`inline-flex h-16 w-16 rounded-full items-center justify-center ${mode === 'timed' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
              {mode === 'timed' ? <Clock className="h-8 w-8 text-red-500" /> : <BookOpen className="h-8 w-8 text-blue-500" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{moduleInfo?.title}</h1>
              <p className="text-muted-foreground mt-1">{moduleInfo?.code}</p>
            </div>

            <Badge className={mode === 'timed' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'}>
              {mode === 'timed' ? 'Timed Exam Mode' : 'Study Mode'}
            </Badge>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-muted-foreground">Questions</p>
                <p className="font-bold text-lg">{questions.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-muted-foreground">Pass Mark</p>
                <p className="font-bold text-lg">{moduleInfo?.passMarkPercent || 70}%</p>
              </div>
              {mode === 'timed' && moduleInfo?.timeLimitMinutes && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 col-span-2">
                  <p className="text-muted-foreground">Time Limit</p>
                  <p className="font-bold text-lg">{moduleInfo.timeLimitMinutes} minutes</p>
                </div>
              )}
            </div>

            {mode === 'timed' && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-sm">
                <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> Exam Rules
                </div>
                <ul className="mt-2 text-left space-y-1 text-amber-700/80 dark:text-amber-400/80">
                  <li>- Answers cannot be seen until submission</li>
                  <li>- Timer auto-submits when time runs out</li>
                  <li>- Tab switching is monitored</li>
                  <li>- You can navigate between questions freely</li>
                </ul>
              </div>
            )}

            {mode === 'study' && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-sm text-left">
                <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-400">
                  <BookOpen className="h-4 w-4" /> Study Mode Features
                </div>
                <ul className="mt-2 space-y-1 text-blue-700/80 dark:text-blue-400/80">
                  <li>- Reveal correct answer after each question</li>
                  <li>- See detailed explanations for every option</li>
                  <li>- AI tutor available to explain concepts</li>
                  <li>- No time pressure — learn at your pace</li>
                </ul>
              </div>
            )}

            <Button size="lg" onClick={startExam} className="w-full">
              <Play className="h-5 w-5 mr-2" /> Start {mode === 'timed' ? 'Exam' : 'Practice'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== RESULTS ====================
  if (phase === 'results' && results) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className={`inline-flex h-20 w-20 rounded-full items-center justify-center ${results.passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {results.passed ? <Trophy className="h-10 w-10 text-green-500" /> : <XCircle className="h-10 w-10 text-red-500" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{results.passed ? 'Congratulations!' : 'Keep Practising!'}</h1>
              <p className="text-muted-foreground mt-1">{moduleInfo?.title}</p>
            </div>

            <div className="text-6xl font-bold" style={{ color: results.passed ? '#22c55e' : '#ef4444' }}>
              {results.scorePercent}%
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-muted-foreground">Correct</p>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">{results.correctAnswers}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-muted-foreground">Total</p>
                <p className="font-bold text-lg">{results.totalQuestions}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-muted-foreground">Pass Mark</p>
                <p className="font-bold text-lg">{results.passMarkPercent}%</p>
              </div>
            </div>

            {results.passed && (
              <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 text-base px-6 py-2">
                <CheckCircle2 className="h-5 w-5 mr-2" /> PASSED
              </Badge>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => router.push('/academy')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Academy
              </Button>
              <Button onClick={() => { setPhase('ready'); setResults(null); }}>
                <RotateCcw className="h-4 w-4 mr-1" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Question Review</h3>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const graded = results.gradedAnswers.find(g => g.questionId === q.id);
                const selectedOpt = q.options.find(o => o.id === graded?.selectedOptionId);
                return (
                  <div key={q.id} className={`p-4 rounded-xl border ${graded?.isCorrect ? 'border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/10' : 'border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10'}`}>
                    <div className="flex items-start gap-2">
                      {graded?.isCorrect
                        ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        : <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium">Q{idx + 1}: {q.questionText}</p>
                        {selectedOpt && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            Your answer: {selectedOpt.optionText}
                          </p>
                        )}
                        {!graded?.isCorrect && q.aiExplanation && (
                          <p className="text-xs mt-2 p-2 rounded bg-white/50 dark:bg-slate-800/50 border">{q.aiExplanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== ACTIVE EXAM ====================
  if (!currentQuestion) {
    return (
      <div className="p-6 text-center">
        <p>No questions loaded.</p>
        <Button className="mt-4" onClick={() => router.push('/academy')}>Back to Academy</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{moduleInfo?.code}</Badge>
          <Badge className={mode === 'timed' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'}>
            {mode === 'timed' ? 'Timed' : 'Study'}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {mode === 'timed' && (
            <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
              <Clock className="h-5 w-5" /> {formatTime(timeLeft)}
            </div>
          )}
          <span className="text-sm text-muted-foreground">{answeredCount}/{questions.length} answered</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Q{currentIdx + 1} / {questions.length}</Badge>
              {currentQuestion.topic && <Badge variant="secondary" className="text-xs">{currentQuestion.topic}</Badge>}
              {currentQuestion.difficulty && (
                <Badge className={
                  currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                  currentQuestion.difficulty === 'hard' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                  'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }>{currentQuestion.difficulty}</Badge>
              )}
            </div>
          </div>

          {currentQuestion.scenario && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border text-sm italic">
              {currentQuestion.scenario}
            </div>
          )}

          <h2 className="text-lg font-semibold leading-relaxed">{currentQuestion.questionText}</h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = answers[currentQuestion.id] === opt.id;
              const isRevealed = mode === 'study' && revealedQuestions.has(currentQuestion.id);
              const isCorrect = isRevealed && opt.isCorrect;
              const isWrong = isRevealed && isSelected && !opt.isCorrect;
              const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

              return (
                <button
                  key={opt.id}
                  onClick={() => selectAnswer(currentQuestion.id, opt.id)}
                  disabled={isRevealed}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                    isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    isSelected ? 'border-primary bg-primary/5' :
                    'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex h-7 w-7 rounded-full items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isCorrect ? 'bg-green-500 text-white' :
                      isWrong ? 'bg-red-500 text-white' :
                      isSelected ? 'bg-primary text-primary-foreground' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : isWrong ? <XCircle className="h-4 w-4" /> : letters[i]}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">{opt.optionText}</p>
                      {isRevealed && opt.explanation && (
                        <p className="text-xs mt-2 text-muted-foreground italic">{opt.explanation}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Study mode: reveal + AI explanation */}
          {mode === 'study' && (
            <div className="flex flex-wrap gap-3 pt-2">
              {!revealedQuestions.has(currentQuestion.id) && answers[currentQuestion.id] && (
                <Button size="sm" variant="outline" onClick={() => revealAnswer(currentQuestion.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Reveal Answer
                </Button>
              )}
              {revealedQuestions.has(currentQuestion.id) && currentQuestion.aiExplanation && (
                <div className="w-full p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">AI Explanation</span>
                  </div>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{currentQuestion.aiExplanation}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(prev => prev - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        {/* Question dots */}
        <div className="hidden md:flex flex-wrap gap-1 justify-center max-w-md">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={`h-3 w-3 rounded-full transition-all ${
                i === currentIdx ? 'bg-primary scale-125' :
                answers[q.id] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              title={`Q${i + 1}`}
            />
          ))}
        </div>

        {currentIdx < questions.length - 1 ? (
          <Button onClick={() => setCurrentIdx(prev => prev + 1)}>
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => handleSubmit()} disabled={submitting} className="bg-green-600 hover:bg-green-700">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Submit Exam
          </Button>
        )}
      </div>

      {/* AI Tutor panel (study mode) */}
      {mode === 'study' && (
        <Card>
          <CardContent className="p-4">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowAi(!showAi)}
            >
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-sm">AI Tutor</span>
              </div>
              {showAi ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAi && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !aiLoading && askAiTutor()}
                    placeholder="Ask about this question or any accounting concept..."
                    className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                  <Button size="sm" onClick={() => askAiTutor()} disabled={aiLoading || !aiQuestion.trim()}>
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {['Explain this concept', 'Show me a worked example', 'What are common mistakes here?'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setAiQuestion(s); askAiTutor(s); }}
                      className="text-xs px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/40"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {aiAnswer && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border text-sm leading-relaxed whitespace-pre-wrap">
                    {aiAnswer}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
