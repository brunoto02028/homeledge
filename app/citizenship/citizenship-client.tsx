'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap, BookOpen, ClipboardCheck, TrendingUp, MapPin,
  ChevronRight, ChevronLeft, CheckCircle2, XCircle, Clock, Award,
  RotateCcw, Flag, FileText, ExternalLink, Timer, Eye,
  Users, Baby, UserCheck, Shield, Heart, AlertTriangle, Globe,
  Landmark, Plane, Scale, Home, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  ALL_QUESTIONS, THEMES, generateMockTest, gradeTest,
  getThemeQuestions,
  type CitizenshipQuestion,
} from '@/lib/citizenship-questions';

type Tab = 'mock' | 'study' | 'guide' | 'progress';

interface Attempt {
  id: string;
  mode: string;
  themeId: string | null;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  duration: number | null;
  createdAt: string;
}

export function CitizenshipClient() {
  const [tab, setTab] = useState<Tab>('mock');
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<CitizenshipQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [quizMode, setQuizMode] = useState<'mock' | 'theme'>('mock');
  const [quizThemeId, setQuizThemeId] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResult, setQuizResult] = useState<ReturnType<typeof gradeTest> | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const startTimeRef = useRef<number>(0);

  // Study mode
  const [studyThemeId, setStudyThemeId] = useState<string | null>(null);

  // Guide language
  const [guideLang, setGuideLang] = useState<'en' | 'pt'>('en');
  const [expandedGuideSection, setExpandedGuideSection] = useState<string | null>(null);
  const toggleGuideSection = (id: string) => setExpandedGuideSection(prev => prev === id ? null : id);

  // Review mode (see all answers)
  const [reviewActive, setReviewActive] = useState(false);
  const [reviewThemeId, setReviewThemeId] = useState<string | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<CitizenshipQuestion[]>([]);

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await fetch('/api/citizenship/progress');
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);

  const startQuiz = (mode: 'mock' | 'theme', themeId?: string) => {
    const questions = mode === 'mock'
      ? generateMockTest()
      : getThemeQuestions(themeId || '');
    if (questions.length === 0) return;
    setQuizQuestions(questions);
    setQuizAnswers(new Array(questions.length).fill(-1));
    setCurrentQ(0);
    setQuizMode(mode);
    setQuizThemeId(themeId || null);
    setQuizFinished(false);
    setQuizResult(null);
    setShowExplanation(false);
    setQuizActive(true);
    startTimeRef.current = Date.now();
  };

  const selectAnswer = (idx: number) => {
    if (quizFinished) return;
    const newAnswers = [...quizAnswers];
    newAnswers[currentQ] = idx;
    setQuizAnswers(newAnswers);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const prevQuestion = () => {
    setShowExplanation(false);
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const finishQuiz = async () => {
    const result = gradeTest(quizQuestions, quizAnswers);
    setQuizResult(result);
    setQuizFinished(true);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      await fetch('/api/citizenship/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: quizMode,
          themeId: quizThemeId,
          score: result.score,
          total: result.total,
          percentage: result.percentage,
          passed: result.passed,
          answers: result.results.map(r => ({
            questionId: r.question.id,
            userAnswer: r.userAnswer,
            correct: r.correct,
          })),
          duration,
        }),
      });
      fetchAttempts();
    } catch { /* ignore */ }
  };

  const exitQuiz = () => {
    setQuizActive(false);
    setQuizFinished(false);
    setQuizResult(null);
  };

  const startReview = (themeId: string) => {
    const questions = getThemeQuestions(themeId);
    if (questions.length === 0) return;
    setReviewQuestions(questions);
    setReviewThemeId(themeId);
    setReviewActive(true);
  };

  const exitReview = () => {
    setReviewActive(false);
    setReviewThemeId(null);
    setReviewQuestions([]);
  };

  const answeredCount = quizAnswers.filter(a => a !== -1).length;
  const totalQuestions = ALL_QUESTIONS.length;
  const mockAttempts = attempts.filter(a => a.mode === 'mock');
  const bestScore = mockAttempts.length > 0 ? Math.max(...mockAttempts.map(a => a.percentage)) : 0;
  const avgScore = mockAttempts.length > 0 ? Math.round(mockAttempts.reduce((s, a) => s + a.percentage, 0) / mockAttempts.length) : 0;

  // ── Quiz View ──
  if (quizActive) {
    const q = quizQuestions[currentQ];
    const userAnswer = quizAnswers[currentQ];
    const isCorrect = userAnswer === q?.correctIndex;

    if (quizFinished && quizResult) {
      return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          <Card className="border-2" style={{ borderColor: quizResult.passed ? '#22c55e' : '#ef4444' }}>
            <CardHeader className="text-center pb-2">
              <div className="text-6xl mb-4">{quizResult.passed ? '🎉' : '📚'}</div>
              <CardTitle className="text-2xl">
                {quizResult.passed ? 'Congratulations! You Passed!' : 'Keep Studying!'}
              </CardTitle>
              <CardDescription>
                {quizMode === 'mock' ? 'Mock Test' : `Study: ${THEMES.find(t => t.id === quizThemeId)?.name || ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-3xl font-bold">{quizResult.score}/{quizResult.total}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-3xl font-bold">{quizResult.percentage}%</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-3xl font-bold">{quizMode === 'mock' ? '75%' : '—'}</div>
                  <div className="text-sm text-muted-foreground">Pass Mark</div>
                </div>
              </div>

              <Progress value={quizResult.percentage} className="h-3" />

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                <h3 className="font-semibold text-lg">Review Answers</h3>
                {quizResult.results.map((r, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${r.correct ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <div className="flex items-start gap-2">
                      {r.correct ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{i + 1}. {r.question.question}</p>
                        {!r.correct && (
                          <p className="text-xs text-green-400 mt-1">✓ {r.question.options[r.question.correctIndex]}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{r.question.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={exitQuiz} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back to Menu
                </Button>
                <Button onClick={() => startQuiz(quizMode, quizThemeId || undefined)} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" /> Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        {/* Progress bar */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{quizMode === 'mock' ? 'Mock Test' : THEMES.find(t => t.id === quizThemeId)?.name}</span>
          <span>{answeredCount}/{quizQuestions.length} answered</span>
        </div>
        <Progress value={(answeredCount / quizQuestions.length) * 100} className="h-2" />

        {/* Question */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Question {currentQ + 1} of {quizQuestions.length}</Badge>
              <Badge variant="secondary">{q.theme}</Badge>
            </div>
            <CardTitle className="text-lg mt-3 leading-relaxed">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.options.map((opt, i) => {
              let cls = 'w-full text-left p-4 rounded-lg border transition-all ';
              if (showExplanation && userAnswer !== -1) {
                if (i === q.correctIndex) cls += 'border-green-500 bg-green-500/10 text-green-300';
                else if (i === userAnswer && !isCorrect) cls += 'border-red-500 bg-red-500/10 text-red-300';
                else cls += 'border-border/50 opacity-50';
              } else if (userAnswer === i) {
                cls += 'border-primary bg-primary/10';
              } else {
                cls += 'border-border hover:border-primary/50 hover:bg-muted/50';
              }

              return (
                <button key={i} className={cls} onClick={() => selectAnswer(i)} disabled={showExplanation}>
                  <span className="font-mono text-xs mr-3 opacity-60">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}

            {showExplanation && (
              <div className="mt-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm font-medium flex items-center gap-2 mb-1">
                  {isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                <p className="text-sm text-muted-foreground">{q.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={prevQuestion} disabled={currentQ === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button variant="ghost" onClick={exitQuiz} size="sm" className="text-muted-foreground">Exit</Button>
          {currentQ < quizQuestions.length - 1 ? (
            <Button onClick={nextQuestion}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={finishQuiz} disabled={answeredCount < quizQuestions.length} className="bg-green-600 hover:bg-green-700">
              <Flag className="h-4 w-4 mr-1" /> Finish
            </Button>
          )}
        </div>

        {/* Question grid */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {quizQuestions.map((_, i) => (
            <button
              key={i}
              onClick={() => { setShowExplanation(false); setCurrentQ(i); }}
              className={`w-8 h-8 rounded text-xs font-medium transition-all ${
                i === currentQ ? 'ring-2 ring-primary' : ''
              } ${
                quizAnswers[i] !== -1
                  ? (showExplanation || quizFinished)
                    ? quizAnswers[i] === quizQuestions[i].correctIndex
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                    : 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Review View (see all answers) ──
  if (reviewActive) {
    const theme = THEMES.find(t => t.id === reviewThemeId);
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              {theme?.icon} {theme?.name} — Review Mode
            </h2>
            <p className="text-sm text-muted-foreground">{reviewQuestions.length} questions with answers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exitReview}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => { exitReview(); startQuiz('theme', reviewThemeId || ''); }}>
              <ClipboardCheck className="h-4 w-4 mr-1" /> Take Quiz
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {reviewQuestions.map((q, i) => (
            <Card key={q.id} className="border-border/50">
              <CardContent className="pt-4 pb-3 space-y-2">
                <p className="font-medium text-sm">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {q.question}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`px-3 py-2 rounded text-sm ${
                        oi === q.correctIndex
                          ? 'bg-green-500/15 border border-green-500/40 text-green-300 font-medium'
                          : 'bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <span className="font-mono text-xs mr-2 opacity-60">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                      {oi === q.correctIndex && <CheckCircle2 className="h-3.5 w-3.5 inline ml-2 text-green-500" />}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground bg-blue-500/5 p-2 rounded border border-blue-500/10">
                  💡 {q.explanation}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-2 justify-center pt-4">
          <Button variant="outline" onClick={exitReview}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Topics
          </Button>
          <Button onClick={() => { exitReview(); startQuiz('theme', reviewThemeId || ''); }}>
            <ClipboardCheck className="h-4 w-4 mr-1" /> Test Yourself
          </Button>
        </div>
      </div>
    );
  }

  // ── Tab Navigation ──
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'mock', label: 'Mock Test', icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: 'study', label: 'Study by Topic', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'guide', label: 'Application Guide', icon: <MapPin className="h-4 w-4" /> },
    { id: 'progress', label: 'My Progress', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <GraduationCap className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Life in the UK Test</h1>
          <p className="text-sm text-muted-foreground">
            {totalQuestions} questions • 7 themes • Practice for your citizenship test
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-2xl font-bold">{totalQuestions}</div>
          <div className="text-xs text-muted-foreground">Total Questions</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold">{mockAttempts.length}</div>
          <div className="text-xs text-muted-foreground">Tests Taken</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-amber-400">{bestScore}%</div>
          <div className="text-xs text-muted-foreground">Best Score</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold">{avgScore}%</div>
          <div className="text-xs text-muted-foreground">Average Score</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'mock' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-amber-500" />
                Official Format Mock Test
              </CardTitle>
              <CardDescription>
                24 random questions • 45 minutes • Pass mark: 75% (18/24)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Timer className="h-4 w-4 text-amber-500" />
                  <span>45 minutes allowed</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>24 questions from all topics</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Award className="h-4 w-4 text-green-500" />
                  <span>Need 18/24 (75%) to pass</span>
                </div>
              </div>
              <Button onClick={() => startQuiz('mock')} size="lg" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                <ClipboardCheck className="h-5 w-5 mr-2" /> Start Mock Test
              </Button>
            </CardContent>
          </Card>

          {mockAttempts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Mock Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockAttempts.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        {a.passed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                        <div>
                          <div className="font-medium text-sm">{a.score}/{a.total} — {a.percentage}%</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString('en-GB')}
                            {a.duration && ` • ${Math.floor(a.duration / 60)}m ${a.duration % 60}s`}
                          </div>
                        </div>
                      </div>
                      <Badge variant={a.passed ? 'default' : 'destructive'}>{a.passed ? 'PASSED' : 'FAILED'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'study' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {THEMES.map(theme => {
            const themeAttempts = attempts.filter(a => a.mode === 'theme' && a.themeId === theme.id);
            const best = themeAttempts.length > 0 ? Math.max(...themeAttempts.map(a => a.percentage)) : 0;
            return (
              <Card key={theme.id} className="hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{theme.icon}</span> {theme.name}
                    </CardTitle>
                    {best > 0 && <Badge variant={best >= 75 ? 'default' : 'secondary'}>{best}%</Badge>}
                  </div>
                  <CardDescription className="text-xs">{theme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{theme.questionCount} questions</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startReview(theme.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Review
                      </Button>
                      <Button size="sm" onClick={() => startQuiz('theme', theme.id)}>
                        Quiz <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  {best > 0 && <Progress value={best} className="h-1.5 mt-2" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'guide' && (
        <div className="space-y-4">
          {/* Language toggle */}
          <div className="flex justify-end">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button className={`px-3 py-1 rounded text-xs font-medium transition-all ${guideLang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setGuideLang('en')}>🇬🇧 English</button>
              <button className={`px-3 py-1 rounded text-xs font-medium transition-all ${guideLang === 'pt' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setGuideLang('pt')}>🇧🇷 Português</button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* COMPREHENSIVE GUIDE: Age Groups, All Routes, Exemptions   */}
          {/* ══════════════════════════════════════════════════════════ */}

          {/* Age-Based Pathways */}
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                {guideLang === 'en' ? 'Citizenship by Age Group — Who Are You?' : 'Cidadania por Faixa Etária — Quem é Você?'}
              </CardTitle>
              <CardDescription>
                {guideLang === 'en'
                  ? 'UK citizenship rules vary significantly by age. Tap your age group to see exactly what applies to you.'
                  : 'As regras de cidadania britânica variam significativamente por idade. Toque na sua faixa etária para ver exatamente o que se aplica a você.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(guideLang === 'en' ? [
                { id: 'child', icon: Baby, color: 'border-pink-500/30 bg-pink-500/5', badge: 'Under 18', title: 'Children (0–17 years)', subtitle: 'Registration — NOT naturalisation', details: [
                  { heading: 'How children become British', items: [
                    '👶 Born in UK after 1 Jan 1983 with one parent British/settled at birth → automatically British',
                    '👶 Born in UK before 1 Jan 1983 → automatically British (old law)',
                    '🌍 Born outside UK to a British parent → British by descent (1st generation only)',
                    '📋 Born in UK but parents NOT British/settled → can REGISTER if parent later becomes British/settled while child is still under 18',
                    '🏠 Born in UK and lived here for first 10 continuous years → can register regardless of parents\' status (Form UKM)',
                    '📝 Adopted by British citizen under UK court order → automatically British',
                    '🏛️ Stateless child born in UK → can register after living in UK for 5 years',
                  ]},
                  { heading: 'Key rules for children', items: [
                    '✅ NO Life in the UK Test required',
                    '✅ NO English language requirement',
                    '✅ NO citizenship ceremony (under 18)',
                    '📋 Apply using Form MN1 (registration of a child)',
                    '💰 Fee: £1,214 (2024/2025) — fee waiver available if family cannot afford it',
                    '⏰ If child turns 18 during processing, they must pay £130 ceremony fee',
                    '📝 Parent or legal guardian applies on child\'s behalf',
                    '⚠️ Once a child turns 18, they MUST use the adult route (Form AN naturalisation or adult registration)',
                  ]},
                  { heading: 'Documents needed for children', items: [
                    '🛂 Child\'s passport or travel document',
                    '📄 Full birth certificate showing both parents',
                    '📋 Parent\'s proof of British citizenship or settled status',
                    '🏠 Proof of child\'s residence in UK (school records, GP registration, council tax)',
                    '📸 Passport-sized photos of the child',
                  ]},
                ]},
                { id: 'young-adult', icon: GraduationCap, color: 'border-blue-500/30 bg-blue-500/5', badge: '18–24', title: 'Young Adults (18–24 years)', subtitle: 'Naturalisation — full requirements apply', details: [
                  { heading: 'Key considerations for young adults', items: [
                    '📋 If you were born in the UK and lived here for first 10 years, you may still register (Form UKM) — simpler than naturalisation',
                    '📋 If you turned 18 recently and your parent became British while you were under 18 but didn\'t apply, you may need adult registration',
                    '🎓 Standard naturalisation (Form AN) applies: 5 years residence + ILR + Life in the UK Test + English B1',
                    '💑 If married to British citizen: only 3 years residence needed',
                    '🎓 University students: years studying in UK count towards the 5-year residence requirement',
                    '⚠️ Gap years / travel: check you haven\'t exceeded 450 days outside UK in 5 years',
                    '💰 Total cost: approximately £1,945 minimum (test + application + passport)',
                  ]},
                  { heading: 'English language — easier for young adults', items: [
                    '🎓 A UK degree (or degree taught in English) exempts you from the SELT test',
                    '🌍 If you\'re a national of a majority English-speaking country, you\'re exempt',
                    '📋 GCSE/A-Level in English from a UK school is accepted as evidence',
                    '💡 If you grew up in the UK, you almost certainly meet the requirement',
                  ]},
                ]},
                { id: 'adult', icon: UserCheck, color: 'border-green-500/30 bg-green-500/5', badge: '25–59', title: 'Adults (25–59 years)', subtitle: 'Standard naturalisation route', details: [
                  { heading: 'Standard pathway', items: [
                    '📋 Form AN — naturalisation as a British citizen',
                    '🏠 5 years continuous residence in the UK (3 if married to British citizen)',
                    '📄 Must hold ILR (Indefinite Leave to Remain) or EU Settled Status',
                    '✅ Pass the Life in the UK Test (£50, 24 questions, 75% pass mark)',
                    '🗣️ Prove English at B1 level (SELT test, degree, or nationality exemption)',
                    '👤 Good character requirement (no serious criminal record, tax compliance)',
                    '✈️ No more than 450 days outside UK in last 5 years',
                    '✈️ No more than 90 days outside UK in last 12 months',
                    '💰 Application fee: £1,580 (non-refundable)',
                    '🎉 Attend citizenship ceremony after approval',
                  ]},
                  { heading: 'Common issues for working adults', items: [
                    '💼 Frequent business travel: carefully track days outside UK — use a spreadsheet',
                    '💰 Self-employed: ensure all tax returns are filed and paid — HMRC checks happen',
                    '🏠 Moved house multiple times: gather council tax proof for EVERY address in 5 years',
                    '⚖️ Driving offences: declare ALL — even speeding fines. Hiding them = refusal',
                    '📋 If you had any visa issues (overstay, curtailment), declare and explain',
                    '💡 Tip: Apply for ILR first if you don\'t have it — you cannot apply for citizenship without it',
                  ]},
                ]},
                { id: 'senior-60-64', icon: Clock, color: 'border-amber-500/30 bg-amber-500/5', badge: '60–64', title: 'Pre-Retirement (60–64 years)', subtitle: 'Possible exemptions — transitional age', details: [
                  { heading: 'Special rules for ages 60–64', items: [
                    '⚠️ You are in a TRANSITIONAL age group — special discretion applies',
                    '📋 The Home Office MUST normally waive the Life in the UK Test and English requirement if the time needed to study would mean you\'d be 65+ before ready',
                    '📝 You should still attempt to meet the requirements if possible',
                    '💡 If you apply at 63 and argue it would take 2+ years to prepare, the waiver is likely',
                    '📄 Provide your date of birth as evidence',
                    '🗣️ If you can demonstrate basic conversational English, it strengthens your case even if you can\'t pass the formal test',
                    '⚠️ This discretion is NOT automatic — the caseworker decides on a case-by-case basis',
                    '💡 Tip: Include a cover letter explaining your age and circumstances',
                  ]},
                ]},
                { id: 'senior-65', icon: Heart, color: 'border-red-500/30 bg-red-500/5', badge: '65+', title: 'Seniors / Retirees (65+ years)', subtitle: 'Exempt from test and English — guaranteed', details: [
                  { heading: 'Guaranteed exemptions at 65+', items: [
                    '✅ EXEMPT from the Life in the UK Test — you do NOT need to take it',
                    '✅ EXEMPT from the English language requirement — no SELT test needed',
                    '📋 These exemptions are MANDATORY — the caseworker MUST waive them at 65+',
                    '📄 Simply provide proof of age (passport, birth certificate)',
                    '💰 Saves you £50 (test fee) and £150–200 (English test fee)',
                  ]},
                  { heading: 'What you STILL need at 65+', items: [
                    '🏠 5 years continuous residence (3 if married to British citizen)',
                    '📄 ILR or EU Settled Status — this is still required',
                    '👤 Good character — still applies at any age',
                    '✈️ Travel limits still apply (450 days / 90 days rules)',
                    '💰 Application fee: £1,580 — same as any adult',
                    '🎉 Citizenship ceremony — still required (may request seated/accessible ceremony)',
                    '📋 Form AN — same form as any adult applicant',
                  ]},
                  { heading: 'Practical tips for seniors', items: [
                    '♿ Request accessibility accommodations for the ceremony if needed',
                    '👨‍👩‍👧 A family member or friend can help fill in the application form',
                    '📞 Citizens Advice (0800 144 8848) offers free help for elderly applicants',
                    '💡 Some immigration charities offer free application assistance for seniors',
                  ]},
                ]},
                { id: 'disabled', icon: Shield, color: 'border-purple-500/30 bg-purple-500/5', badge: 'Any age', title: 'Physical or Mental Health Condition', subtitle: 'Possible exemption from test and English — any age', details: [
                  { heading: 'Exemption for health conditions', items: [
                    '📋 If you have a LONG-TERM physical or mental condition that prevents you from studying/taking the test, you can request a waiver',
                    '✅ This applies to BOTH the Life in the UK Test AND the English language requirement',
                    '📄 You MUST provide a completed medical exemption form (Form KoLL) signed by a doctor',
                    '🏥 The doctor must confirm: the nature of the condition, that it is long-term, and that it prevents you from meeting the requirement',
                    '📋 Submit all original medical reports with the exemption form',
                    '⚠️ If you were exempt when you got ILR, you must submit the exemption form AGAIN for citizenship',
                    '💡 Conditions that may qualify: severe learning disabilities, dementia, Alzheimer\'s, severe mental illness, brain injury, severe physical disability affecting communication',
                    '⚠️ Mild conditions (mild anxiety, mild depression) are unlikely to qualify on their own',
                    '📞 Contact the Nationality Policy team if unsure: they can advise before you apply',
                  ]},
                ]},
              ] : [
                { id: 'child', icon: Baby, color: 'border-pink-500/30 bg-pink-500/5', badge: 'Menos de 18', title: 'Crianças (0–17 anos)', subtitle: 'Registro — NÃO naturalização', details: [
                  { heading: 'Como crianças se tornam britânicas', items: [
                    '👶 Nascida no UK após 1 Jan 1983 com um dos pais britânico/residente permanente → automaticamente britânica',
                    '👶 Nascida no UK antes de 1 Jan 1983 → automaticamente britânica (lei antiga)',
                    '🌍 Nascida fora do UK com pai/mãe britânico → britânica por descendência (apenas 1ª geração)',
                    '📋 Nascida no UK mas pais NÃO eram britânicos/residentes → pode REGISTRAR se o pai/mãe depois se tornar britânico/residente enquanto a criança ainda é menor de 18',
                    '🏠 Nascida no UK e morou aqui nos primeiros 10 anos contínuos → pode registrar independente do status dos pais (Formulário UKM)',
                    '📝 Adotada por cidadão britânico por ordem judicial do UK → automaticamente britânica',
                    '🏛️ Criança apátrida nascida no UK → pode registrar após morar no UK por 5 anos',
                  ]},
                  { heading: 'Regras principais para crianças', items: [
                    '✅ NÃO precisa do Life in the UK Test',
                    '✅ NÃO precisa comprovar inglês',
                    '✅ NÃO precisa de cerimônia de cidadania (menor de 18)',
                    '📋 Aplicar usando Formulário MN1 (registro de criança)',
                    '💰 Taxa: £1.214 (2024/2025) — isenção de taxa disponível se a família não puder pagar',
                    '⏰ Se a criança fizer 18 durante o processamento, deverá pagar £130 da cerimônia',
                    '📝 Pai/mãe ou responsável legal aplica em nome da criança',
                    '⚠️ Ao completar 18 anos, DEVE usar a rota adulta (Form AN naturalização ou registro adulto)',
                  ]},
                  { heading: 'Documentos necessários para crianças', items: [
                    '🛂 Passaporte ou documento de viagem da criança',
                    '📄 Certidão de nascimento completa mostrando ambos os pais',
                    '📋 Comprovante de cidadania britânica ou residência permanente do pai/mãe',
                    '🏠 Comprovante de residência da criança no UK (registros escolares, registro no GP, council tax)',
                    '📸 Fotos tipo passaporte da criança',
                  ]},
                ]},
                { id: 'young-adult', icon: GraduationCap, color: 'border-blue-500/30 bg-blue-500/5', badge: '18–24', title: 'Jovens Adultos (18–24 anos)', subtitle: 'Naturalização — requisitos completos se aplicam', details: [
                  { heading: 'Considerações principais para jovens adultos', items: [
                    '📋 Se nasceu no UK e morou aqui nos primeiros 10 anos, pode registrar (Form UKM) — mais simples que naturalização',
                    '📋 Se fez 18 recentemente e seu pai/mãe se tornou britânico enquanto você era menor mas não aplicou, pode precisar de registro adulto',
                    '🎓 Naturalização padrão (Form AN): 5 anos residência + ILR + Life in the UK Test + Inglês B1',
                    '💑 Se casado com cidadão britânico: apenas 3 anos de residência necessários',
                    '🎓 Estudantes universitários: anos estudando no UK contam para o requisito de 5 anos',
                    '⚠️ Ano sabático / viagens: verifique se não excedeu 450 dias fora do UK em 5 anos',
                    '💰 Custo total: aproximadamente £1.945 mínimo (teste + aplicação + passaporte)',
                  ]},
                  { heading: 'Inglês — mais fácil para jovens adultos', items: [
                    '🎓 Diploma universitário do UK (ou em inglês) isenta do teste SELT',
                    '🌍 Se nacional de país de maioria anglófona, está isento',
                    '📋 GCSE/A-Level em inglês de escola do UK é aceito como evidência',
                    '💡 Se cresceu no UK, quase certamente atende ao requisito',
                  ]},
                ]},
                { id: 'adult', icon: UserCheck, color: 'border-green-500/30 bg-green-500/5', badge: '25–59', title: 'Adultos (25–59 anos)', subtitle: 'Rota padrão de naturalização', details: [
                  { heading: 'Caminho padrão', items: [
                    '📋 Form AN — naturalização como cidadão britânico',
                    '🏠 5 anos de residência contínua no UK (3 se casado com cidadão britânico)',
                    '📄 Deve ter ILR (Indefinite Leave to Remain) ou EU Settled Status',
                    '✅ Passar no Life in the UK Test (£50, 24 perguntas, 75% nota mínima)',
                    '🗣️ Comprovar inglês nível B1 (teste SELT, diploma, ou isenção por nacionalidade)',
                    '👤 Requisito de bom caráter (sem antecedentes criminais graves, conformidade fiscal)',
                    '✈️ Não mais que 450 dias fora do UK nos últimos 5 anos',
                    '✈️ Não mais que 90 dias fora do UK nos últimos 12 meses',
                    '💰 Taxa de aplicação: £1.580 (não reembolsável)',
                    '🎉 Participar de cerimônia de cidadania após aprovação',
                  ]},
                  { heading: 'Problemas comuns para adultos trabalhadores', items: [
                    '💼 Viagens frequentes a trabalho: rastreie cuidadosamente os dias fora do UK — use uma planilha',
                    '💰 Autônomo: certifique-se que todas as declarações fiscais estão entregues e pagas — HMRC verifica',
                    '🏠 Mudou de casa várias vezes: junte comprovante de council tax de CADA endereço em 5 anos',
                    '⚖️ Multas de trânsito: declare TODAS — mesmo multas de velocidade. Esconder = recusa',
                    '📋 Se teve problemas de visto (overstay, curtailment), declare e explique',
                    '💡 Dica: Solicite ILR primeiro se não tiver — não pode aplicar cidadania sem ele',
                  ]},
                ]},
                { id: 'senior-60-64', icon: Clock, color: 'border-amber-500/30 bg-amber-500/5', badge: '60–64', title: 'Pré-Aposentadoria (60–64 anos)', subtitle: 'Possíveis isenções — idade de transição', details: [
                  { heading: 'Regras especiais para 60–64 anos', items: [
                    '⚠️ Você está em uma FAIXA ETÁRIA DE TRANSIÇÃO — discrição especial se aplica',
                    '📋 O Home Office DEVE normalmente dispensar o Life in the UK Test e requisito de inglês se o tempo necessário para estudar significaria ter 65+ antes de estar pronto',
                    '📝 Você ainda deve tentar cumprir os requisitos se possível',
                    '💡 Se aplicar aos 63 e argumentar que levaria 2+ anos para se preparar, a dispensa é provável',
                    '📄 Forneça sua data de nascimento como evidência',
                    '🗣️ Se demonstrar inglês conversacional básico, fortalece seu caso mesmo sem passar no teste formal',
                    '⚠️ Esta discrição NÃO é automática — o oficial decide caso a caso',
                    '💡 Dica: Inclua uma carta explicando sua idade e circunstâncias',
                  ]},
                ]},
                { id: 'senior-65', icon: Heart, color: 'border-red-500/30 bg-red-500/5', badge: '65+', title: 'Idosos / Aposentados (65+ anos)', subtitle: 'Isento do teste e inglês — garantido', details: [
                  { heading: 'Isenções garantidas aos 65+', items: [
                    '✅ ISENTO do Life in the UK Test — NÃO precisa fazer',
                    '✅ ISENTO do requisito de inglês — nenhum teste SELT necessário',
                    '📋 Estas isenções são OBRIGATÓRIAS — o oficial DEVE concedê-las aos 65+',
                    '📄 Basta fornecer prova de idade (passaporte, certidão de nascimento)',
                    '💰 Economiza £50 (teste) e £150–200 (teste de inglês)',
                  ]},
                  { heading: 'O que AINDA precisa aos 65+', items: [
                    '🏠 5 anos de residência contínua (3 se casado com cidadão britânico)',
                    '📄 ILR ou EU Settled Status — ainda obrigatório',
                    '👤 Bom caráter — se aplica em qualquer idade',
                    '✈️ Limites de viagem ainda se aplicam (regras de 450 dias / 90 dias)',
                    '💰 Taxa de aplicação: £1.580 — igual para qualquer adulto',
                    '🎉 Cerimônia de cidadania — ainda obrigatória (pode solicitar cerimônia acessível/sentada)',
                    '📋 Form AN — mesmo formulário de qualquer adulto',
                  ]},
                  { heading: 'Dicas práticas para idosos', items: [
                    '♿ Solicite acomodações de acessibilidade para a cerimônia se necessário',
                    '👨‍👩‍👧 Um familiar ou amigo pode ajudar a preencher o formulário de aplicação',
                    '📞 Citizens Advice (0800 144 8848) oferece ajuda gratuita para idosos',
                    '💡 Algumas instituições de caridade oferecem assistência gratuita para idosos',
                  ]},
                ]},
                { id: 'disabled', icon: Shield, color: 'border-purple-500/30 bg-purple-500/5', badge: 'Qualquer idade', title: 'Condição Física ou Mental', subtitle: 'Possível isenção do teste e inglês — qualquer idade', details: [
                  { heading: 'Isenção por condição de saúde', items: [
                    '📋 Se tiver condição física ou mental DE LONGO PRAZO que impeça de estudar/fazer o teste, pode solicitar dispensa',
                    '✅ Aplica-se a AMBOS: Life in the UK Test E requisito de inglês',
                    '📄 DEVE fornecer formulário de isenção médica (Form KoLL) preenchido e assinado por médico',
                    '🏥 O médico deve confirmar: natureza da condição, que é de longo prazo, e que impede de cumprir o requisito',
                    '📋 Envie todos os laudos médicos originais com o formulário',
                    '⚠️ Se estava isento quando obteve ILR, deve enviar o formulário de isenção NOVAMENTE para cidadania',
                    '💡 Condições que podem qualificar: deficiências severas de aprendizagem, demência, Alzheimer, doença mental grave, lesão cerebral, deficiência física grave que afeta comunicação',
                    '⚠️ Condições leves (ansiedade leve, depressão leve) provavelmente NÃO qualificam sozinhas',
                    '📞 Contate a equipe de Política de Nacionalidade se não tiver certeza: podem aconselhar antes de aplicar',
                  ]},
                ]},
              ]).map((group: any) => {
                const Icon = group.icon;
                const isExpanded = expandedGuideSection === group.id;
                return (
                  <button key={group.id} onClick={() => toggleGuideSection(group.id)} className={`w-full text-left rounded-xl border p-4 transition-all ${group.color} ${isExpanded ? 'ring-2 ring-primary/40' : 'hover:ring-1 hover:ring-primary/20'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background/80"><Icon className="h-5 w-5" /></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{group.title}</span>
                            <Badge variant="outline" className="text-[10px]">{group.badge}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {isExpanded && (
                      <div className="mt-4 space-y-4" onClick={e => e.stopPropagation()}>
                        {group.details.map((section: any, si: number) => (
                          <div key={si}>
                            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{section.heading}</h4>
                            <div className="space-y-1 bg-background/60 rounded-lg p-3 border border-border/30">
                              {section.items.map((item: string, ii: number) => (
                                <p key={ii} className="text-xs text-muted-foreground">{item}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* ENGLISH LANGUAGE REQUIREMENT — FULL EXPLANATION              */}
          {/* ══════════════════════════════════════════════════════════ */}

          <Card className="border-sky-200 dark:border-sky-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-sky-500" />
                {guideLang === 'en' ? 'English Language Requirement — Full Explanation' : 'Requisito de Inglês — Explicação Completa'}
              </CardTitle>
              <CardDescription>
                {guideLang === 'en'
                  ? 'Exactly what you need, which tests are accepted, which qualifications count, and which do NOT — based on your visa type.'
                  : 'Exatamente o que você precisa, quais testes são aceitos, quais qualificações contam e quais NÃO — com base no seu tipo de visto.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* What is the English requirement? */}
              <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5">
                <h4 className="font-bold text-sm mb-2">
                  {guideLang === 'en' ? '📋 What Exactly Is the English Requirement?' : '📋 O Que Exatamente é o Requisito de Inglês?'}
                </h4>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {(guideLang === 'en' ? [
                    '• It is NOT an interview or oral exam at the Home Office — it is a CERTIFICATE you must present with your application',
                    '• For citizenship and ILR (settlement): you only need to prove SPEAKING and LISTENING at level B1 CEFR',
                    '• For work visas (Skilled Worker, etc.): you need reading, writing, speaking and listening at B1 or B2',
                    '• B1 level means: you can understand the main points of clear speech, deal with most travel situations, and describe experiences and events',
                    '• There are 5 ways to prove your English — you only need ONE of them',
                    '• Once proved for ILR, you can reuse the same evidence for citizenship (even if the certificate has expired)',
                  ] : [
                    '• NÃO é uma entrevista ou exame oral no Home Office — é um CERTIFICADO que você deve apresentar com sua aplicação',
                    '• Para cidadania e ILR (residência permanente): você só precisa comprovar FALA e COMPREENSÃO ORAL no nível B1 CEFR',
                    '• Para vistos de trabalho (Skilled Worker, etc.): precisa de leitura, escrita, fala e compreensão oral no nível B1 ou B2',
                    '• Nível B1 significa: consegue entender os pontos principais de uma fala clara, lidar com a maioria das situações de viagem e descrever experiências',
                    '• Existem 5 formas de comprovar seu inglês — você só precisa de UMA delas',
                    '• Uma vez comprovado para ILR, pode reutilizar a mesma evidência para cidadania (mesmo se o certificado tiver expirado)',
                  ]).map((item, i) => <p key={i}>{item}</p>)}
                </div>
              </div>

              {/* 5 Ways to Prove English */}
              <div>
                <h4 className="font-bold text-sm mb-3">
                  {guideLang === 'en' ? '✅ 5 Ways to Prove Your English' : '✅ 5 Formas de Comprovar Seu Inglês'}
                </h4>
                <div className="space-y-3">
                  {(guideLang === 'en' ? [
                    { num: '1', title: 'Pass an Approved SELT Test', badge: 'Most Common', badgeColor: 'bg-green-500', items: [
                      'SELT = Secure English Language Test — a formal exam at an approved test centre',
                      'For citizenship/ILR: you only do the SPEAKING & LISTENING test (no reading or writing!)',
                      'Level required: B1 CEFR minimum',
                      'Certificate is valid for 2 years — but if it was accepted for ILR, you can reuse it for citizenship even after expiry',
                      '4 approved providers in the UK (see details below):',
                      '  → IELTS Life Skills (by IELTS SELT Consortium) — ~£150, speaking & listening only, results in 7 days',
                      '  → Trinity GESE (by Trinity College London) — ~£150, face-to-face speaking exam, results in 5 days',
                      '  → LanguageCert International ESOL SELT — ~£150, online or in-centre, speaking & listening',
                      '  → PTE Home (by Pearson) — ~£150, computer-based, speaking & listening, results in 2-5 days',
                      '⚠️ You MUST book with an approved provider at an approved centre — other IELTS/PTE tests do NOT count',
                      '💡 For citizenship: IELTS Life Skills A1/B1 or Trinity GESE Grade 5 are the most popular choices',
                    ]},
                    { num: '2', title: 'UK Academic Degree (Bachelor\'s or Above)', badge: 'If You Have One', badgeColor: 'bg-blue-500', items: [
                      'A UK bachelor\'s degree (Level 6 RQF) or above automatically proves your English',
                      'Must be an ACADEMIC degree from a recognised UK university',
                      'Must be bachelor\'s level or above: BA, BSc, MA, MSc, MBA, PhD, etc.',
                      'You need your degree certificate as evidence',
                      '⚠️ Foundation degrees (Level 5) do NOT count — they are below bachelor\'s level',
                      '⚠️ HND/HNC (Level 4/5) do NOT count — they are technical/professional, not academic',
                      '⚠️ Diplomas and certificates do NOT count — even if Level 4, 5 or 6',
                      '💡 If you studied at a UK university and got a full bachelor\'s degree, you\'re covered',
                    ]},
                    { num: '3', title: 'Degree Taught in English (Overseas)', badge: 'Foreign Degrees', badgeColor: 'bg-cyan-500', items: [
                      'A degree from outside the UK can count IF it was taught in English',
                      'Must be equivalent to a UK bachelor\'s or above',
                      'From a majority English-speaking country (USA, Australia, etc.): need Ecctis (formerly NARIC) verification',
                      'From a non-English-speaking country: also need Ecctis verification confirming it was taught in English',
                      'Ecctis verification costs approximately £140-210 and takes 15-20 working days',
                      '💡 You need to provide a Unique Person Identifier (UPI) number from Ecctis with your application',
                    ]},
                    { num: '4', title: 'National of a Majority English-Speaking Country', badge: 'Automatic', badgeColor: 'bg-purple-500', items: [
                      'If you hold a passport from one of these countries, you are AUTOMATICALLY exempt:',
                      '🌍 Antigua & Barbuda, Australia, Bahamas, Barbados, Belize, Dominica, Grenada, Guyana, Jamaica, New Zealand, St Kitts & Nevis, St Lucia, St Vincent, Trinidad & Tobago, USA',
                      '⚠️ Canada is NOT treated as majority English-speaking for degree purposes (because of French)',
                      '⚠️ Brazil is NOT on the list — Brazilians must use another method',
                      '⚠️ India, Nigeria, Philippines, Pakistan — NOT on the list despite widespread English',
                      '💡 Dual nationals: if ONE of your nationalities is on the list, you qualify',
                    ]},
                    { num: '5', title: 'GCSE or A-Level in English (UK School)', badge: 'Grew Up in UK', badgeColor: 'bg-amber-500', items: [
                      'GCSE in English Language or English Literature — accepted',
                      'A-Level in English — accepted',
                      'Scottish National Qualification level 4/5, Higher, Advanced Higher in English — accepted',
                      '⚠️ Must have attended a UK school while under 18',
                      '⚠️ CANNOT use if gained through adult education or correspondence courses',
                      '⚠️ Must be in ENGLISH subject specifically — a GCSE in Maths or Science does NOT count',
                      '⚠️ Must be from an Ofqual/SQA/CCEA regulated awarding body',
                      '💡 If you grew up in the UK and did GCSEs, check your English certificate',
                    ]},
                  ] : [
                    { num: '1', title: 'Passar em um Teste SELT Aprovado', badge: 'Mais Comum', badgeColor: 'bg-green-500', items: [
                      'SELT = Secure English Language Test — exame formal em centro de testes aprovado',
                      'Para cidadania/ILR: você só faz o teste de FALA e COMPREENSÃO ORAL (sem leitura ou escrita!)',
                      'Nível exigido: B1 CEFR mínimo',
                      'Certificado válido por 2 anos — mas se foi aceito para ILR, pode reutilizar para cidadania mesmo após expirar',
                      '4 provedores aprovados no UK (veja detalhes abaixo):',
                      '  → IELTS Life Skills (por IELTS SELT Consortium) — ~£150, fala e compreensão oral apenas, resultado em 7 dias',
                      '  → Trinity GESE (por Trinity College London) — ~£150, exame oral presencial, resultado em 5 dias',
                      '  → LanguageCert International ESOL SELT — ~£150, online ou presencial, fala e compreensão oral',
                      '  → PTE Home (por Pearson) — ~£150, em computador, fala e compreensão oral, resultado em 2-5 dias',
                      '⚠️ DEVE agendar com provedor aprovado em centro aprovado — outros testes IELTS/PTE NÃO contam',
                      '💡 Para cidadania: IELTS Life Skills A1/B1 ou Trinity GESE Grade 5 são as escolhas mais populares',
                    ]},
                    { num: '2', title: 'Diploma Universitário UK (Bacharelado ou Superior)', badge: 'Se Você Tem', badgeColor: 'bg-blue-500', items: [
                      'Um bacharelado UK (Level 6 RQF) ou superior comprova automaticamente seu inglês',
                      'Deve ser diploma ACADÊMICO de universidade UK reconhecida',
                      'Deve ser nível bacharelado ou superior: BA, BSc, MA, MSc, MBA, PhD, etc.',
                      'Você precisa do certificado do diploma como evidência',
                      '⚠️ Foundation degrees (Level 5) NÃO contam — estão abaixo do nível de bacharelado',
                      '⚠️ HND/HNC (Level 4/5) NÃO contam — são técnicos/profissionais, não acadêmicos',
                      '⚠️ Diplomas e certificados NÃO contam — mesmo se Level 4, 5 ou 6',
                      '💡 Se estudou em universidade UK e obteve bacharelado completo, está coberto',
                    ]},
                    { num: '3', title: 'Diploma em Inglês (Exterior)', badge: 'Diplomas Estrangeiros', badgeColor: 'bg-cyan-500', items: [
                      'Um diploma de fora do UK pode contar SE foi ministrado em inglês',
                      'Deve ser equivalente a bacharelado UK ou superior',
                      'De país de maioria anglófona (EUA, Austrália, etc.): precisa verificação Ecctis (antigo NARIC)',
                      'De país não anglófono: também precisa verificação Ecctis confirmando que foi em inglês',
                      'Verificação Ecctis custa aproximadamente £140-210 e leva 15-20 dias úteis',
                      '💡 Você precisa fornecer um número UPI (Unique Person Identifier) do Ecctis com sua aplicação',
                    ]},
                    { num: '4', title: 'Nacional de País de Maioria Anglófona', badge: 'Automático', badgeColor: 'bg-purple-500', items: [
                      'Se tem passaporte de um destes países, está AUTOMATICAMENTE isento:',
                      '🌍 Antígua e Barbuda, Austrália, Bahamas, Barbados, Belize, Dominica, Granada, Guiana, Jamaica, Nova Zelândia, São Cristóvão e Nevis, Santa Lúcia, São Vicente, Trinidad e Tobago, EUA',
                      '⚠️ Canadá NÃO é tratado como maioria anglófona para fins de diploma (por causa do francês)',
                      '⚠️ Brasil NÃO está na lista — brasileiros devem usar outro método',
                      '⚠️ Índia, Nigéria, Filipinas, Paquistão — NÃO estão na lista apesar do inglês difundido',
                      '💡 Dupla nacionalidade: se UMA das suas nacionalidades está na lista, você qualifica',
                    ]},
                    { num: '5', title: 'GCSE ou A-Level em Inglês (Escola UK)', badge: 'Cresceu no UK', badgeColor: 'bg-amber-500', items: [
                      'GCSE em English Language ou English Literature — aceito',
                      'A-Level em English — aceito',
                      'Scottish National Qualification nível 4/5, Higher, Advanced Higher em English — aceito',
                      '⚠️ Deve ter frequentado escola UK enquanto menor de 18 anos',
                      '⚠️ NÃO pode usar se obtido por educação de adultos ou cursos por correspondência',
                      '⚠️ Deve ser na matéria INGLÊS especificamente — GCSE em Maths ou Science NÃO conta',
                      '⚠️ Deve ser de banca examinadora regulada pelo Ofqual/SQA/CCEA',
                      '💡 Se cresceu no UK e fez GCSEs, verifique seu certificado de English',
                    ]},
                  ]).map((way: any) => (
                    <div key={way.num} className="p-3 rounded-lg border border-border/30 bg-muted/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{way.num}</span>
                        <span className="font-semibold text-sm">{way.title}</span>
                        <Badge className={`text-[9px] px-1.5 py-0 text-white ${way.badgeColor}`}>{way.badge}</Badge>
                      </div>
                      <div className="space-y-1 ml-8">
                        {way.items.map((item: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground">{item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What does NOT count */}
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <h4 className="font-bold text-sm mb-2 text-red-600 dark:text-red-400">
                  {guideLang === 'en' ? '❌ What Does NOT Count as English Proof' : '❌ O Que NÃO Conta Como Prova de Inglês'}
                </h4>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {(guideLang === 'en' ? [
                    '❌ NVQ (National Vocational Qualifications) — at ANY level (Level 1, 2, 3, 4, 5) — explicitly rejected by GOV.UK',
                    '❌ CPD courses (Continuing Professional Development) — not accepted, regardless of provider or subject',
                    '❌ HND (Higher National Diploma, Level 5) — technical/professional, not academic',
                    '❌ HNC (Higher National Certificate, Level 4) — technical/professional, not academic',
                    '❌ Foundation Degree (Level 5) — below bachelor\'s level requirement',
                    '❌ Diplomas and Certificates at Level 4, 5 or 6 (e.g. Level 4 Diploma in Health & Social Care) — professional, not academic',
                    '❌ Professional qualifications (e.g. AAT, CIPD, CMI, ILM) — not accepted',
                    '❌ ESOL qualifications that are NOT on the approved SELT list',
                    '❌ Non-UKVI IELTS (academic or general IELTS is NOT the same as IELTS for UKVI/Life Skills)',
                    '❌ Regular PTE Academic (NOT the same as PTE Home for UKVI)',
                    '❌ GCSE obtained through adult education or correspondence courses',
                    '❌ GCSE in subjects other than English (Maths GCSE, Science GCSE, etc. do not count)',
                    '❌ Online certificates from platforms like Coursera, Udemy, FutureLearn, etc.',
                    '❌ Internal company English assessments or employer certificates',
                    '❌ Letters from schools, colleges, or employers saying you "speak good English"',
                  ] : [
                    '❌ NVQ (National Vocational Qualifications) — em QUALQUER nível (Level 1, 2, 3, 4, 5) — explicitamente rejeitado pelo GOV.UK',
                    '❌ Cursos CPD (Continuing Professional Development) — não aceitos, independente do provedor ou área',
                    '❌ HND (Higher National Diploma, Level 5) — técnico/profissional, não acadêmico',
                    '❌ HNC (Higher National Certificate, Level 4) — técnico/profissional, não acadêmico',
                    '❌ Foundation Degree (Level 5) — abaixo do nível de bacharelado exigido',
                    '❌ Diplomas e Certificados Level 4, 5 ou 6 (ex: Level 4 Diploma in Health & Social Care) — profissional, não acadêmico',
                    '❌ Qualificações profissionais (ex: AAT, CIPD, CMI, ILM) — não aceitas',
                    '❌ Qualificações ESOL que NÃO estão na lista SELT aprovada',
                    '❌ IELTS não-UKVI (IELTS academic ou general NÃO é o mesmo que IELTS for UKVI/Life Skills)',
                    '❌ PTE Academic regular (NÃO é o mesmo que PTE Home for UKVI)',
                    '❌ GCSE obtido por educação de adultos ou cursos por correspondência',
                    '❌ GCSE em matérias diferentes de English (GCSE de Maths, Science, etc. não contam)',
                    '❌ Certificados online de plataformas como Coursera, Udemy, FutureLearn, etc.',
                    '❌ Avaliações internas de empresas ou certificados do empregador',
                    '❌ Cartas de escolas, faculdades ou empregadores dizendo que você "fala bem inglês"',
                  ]).map((item, i) => <p key={i}>{item}</p>)}
                </div>
              </div>

              {/* RQF Levels Explained */}
              <div>
                <h4 className="font-bold text-sm mb-2">
                  {guideLang === 'en' ? '📊 UK Qualification Levels — Which Count?' : '📊 Níveis de Qualificação UK — Quais Contam?'}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">{guideLang === 'en' ? 'RQF Level' : 'Nível RQF'}</th>
                        <th className="text-left p-2 font-semibold">{guideLang === 'en' ? 'Qualification Type' : 'Tipo de Qualificação'}</th>
                        <th className="text-center p-2 font-semibold">{guideLang === 'en' ? 'Accepted?' : 'Aceito?'}</th>
                        <th className="text-left p-2 font-semibold">{guideLang === 'en' ? 'Why' : 'Por quê'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(guideLang === 'en' ? [
                        { level: 'Level 1-2', type: 'GCSE, NVQ 1-2, Functional Skills', accepted: '⚠️', why: 'Only GCSE in English from UK school (under 18)' },
                        { level: 'Level 3', type: 'A-Level, NVQ 3, BTEC National', accepted: '⚠️', why: 'Only A-Level in English from UK school (under 18)' },
                        { level: 'Level 4', type: 'HNC, Certificate, NVQ 4', accepted: '❌', why: 'Below bachelor\'s. Technical/professional, not academic.' },
                        { level: 'Level 5', type: 'HND, Foundation Degree, NVQ 5', accepted: '❌', why: 'Below bachelor\'s. Technical/professional, not academic.' },
                        { level: 'Level 6', type: 'Bachelor\'s Degree (BA, BSc)', accepted: '✅', why: 'Full academic degree from recognised UK university' },
                        { level: 'Level 6', type: 'Graduate Diploma, Graduate Certificate', accepted: '❌', why: 'Not a full degree — professional/technical' },
                        { level: 'Level 7', type: 'Master\'s Degree (MA, MSc, MBA)', accepted: '✅', why: 'Academic degree above bachelor\'s' },
                        { level: 'Level 8', type: 'Doctorate (PhD, DPhil)', accepted: '✅', why: 'Highest academic degree' },
                        { level: 'Any', type: 'NVQ at any level', accepted: '❌', why: 'Explicitly excluded by GOV.UK — vocational, not academic' },
                        { level: 'Any', type: 'CPD courses', accepted: '❌', why: 'Professional development — not a regulated qualification' },
                        { level: 'Any', type: 'BTEC, City & Guilds', accepted: '❌', why: 'Technical/vocational — not academic' },
                      ] : [
                        { level: 'Level 1-2', type: 'GCSE, NVQ 1-2, Functional Skills', accepted: '⚠️', why: 'Apenas GCSE em English de escola UK (menor de 18)' },
                        { level: 'Level 3', type: 'A-Level, NVQ 3, BTEC National', accepted: '⚠️', why: 'Apenas A-Level em English de escola UK (menor de 18)' },
                        { level: 'Level 4', type: 'HNC, Certificate, NVQ 4', accepted: '❌', why: 'Abaixo do bacharelado. Técnico/profissional, não acadêmico.' },
                        { level: 'Level 5', type: 'HND, Foundation Degree, NVQ 5', accepted: '❌', why: 'Abaixo do bacharelado. Técnico/profissional, não acadêmico.' },
                        { level: 'Level 6', type: 'Bacharelado (BA, BSc)', accepted: '✅', why: 'Diploma acadêmico completo de universidade UK reconhecida' },
                        { level: 'Level 6', type: 'Graduate Diploma, Graduate Certificate', accepted: '❌', why: 'Não é diploma completo — profissional/técnico' },
                        { level: 'Level 7', type: 'Mestrado (MA, MSc, MBA)', accepted: '✅', why: 'Diploma acadêmico acima do bacharelado' },
                        { level: 'Level 8', type: 'Doutorado (PhD, DPhil)', accepted: '✅', why: 'Mais alto diploma acadêmico' },
                        { level: 'Qualquer', type: 'NVQ em qualquer nível', accepted: '❌', why: 'Explicitamente excluído pelo GOV.UK — vocacional, não acadêmico' },
                        { level: 'Qualquer', type: 'Cursos CPD', accepted: '❌', why: 'Desenvolvimento profissional — não é qualificação regulada' },
                        { level: 'Qualquer', type: 'BTEC, City & Guilds', accepted: '❌', why: 'Técnico/vocacional — não acadêmico' },
                      ]).map((row: any, i: number) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-muted/30">
                          <td className="p-2 font-medium">{row.level}</td>
                          <td className="p-2">{row.type}</td>
                          <td className="p-2 text-center">{row.accepted}</td>
                          <td className="p-2 text-muted-foreground">{row.why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Visa/Status Type */}
              <div>
                <h4 className="font-bold text-sm mb-2">
                  {guideLang === 'en' ? '🛂 English Requirement by Visa / Status Type' : '🛂 Requisito de Inglês por Tipo de Visto / Status'}
                </h4>
                <div className="space-y-2">
                  {(guideLang === 'en' ? [
                    { visa: 'Skilled Worker Visa', level: 'B1', skills: 'Reading, Writing, Speaking, Listening', when: 'Proved at visa application stage — if accepted then, reuse for ILR/citizenship', note: 'If your employer sponsored you, you likely already proved B1 at all 4 skills' },
                    { visa: 'Spouse / Partner Visa', level: 'A1 → A2 → B1', skills: 'Speaking & Listening', when: 'A1 for entry, A2 for extension, B1 for ILR. Progressive requirement.', note: 'IELTS Life Skills A1 for initial entry, then B1 for settlement' },
                    { visa: 'Student Visa', level: 'B2', skills: 'Reading, Writing, Speaking, Listening', when: 'Proved when applying for student visa via CAS from university', note: 'Your university assessed your English — you may have used IELTS Academic (but this doesn\'t count for ILR!)' },
                    { visa: 'EU Settled Status', level: 'None for SS', skills: 'N/A for Settled Status', when: 'No English needed for Settled Status itself. B1 speaking & listening needed for citizenship.', note: 'EU citizens need to take SELT B1 separately when applying for citizenship' },
                    { visa: 'Hong Kong BN(O)', level: 'B1', skills: 'Speaking & Listening', when: 'Required at ILR stage (after 5 years), then reusable for citizenship', note: 'Same as standard ILR/citizenship pathway' },
                    { visa: 'ILR (any 5-year route)', level: 'B1', skills: 'Speaking & Listening', when: 'Required at ILR application. Reusable for citizenship after.', note: 'Once passed for ILR, the same certificate works for citizenship even if expired' },
                    { visa: 'Citizenship (Form AN)', level: 'B1', skills: 'Speaking & Listening', when: 'At time of citizenship application — or reuse from ILR', note: 'If English was accepted for your ILR, you do NOT need to take a new test' },
                    { visa: 'Windrush Scheme', level: 'None', skills: 'N/A', when: 'No English requirement at all', note: 'Completely exempt from English language requirement' },
                    { visa: 'Refugee / Humanitarian', level: 'B1', skills: 'Speaking & Listening', when: 'Required for ILR after 5 years, then citizenship', note: 'Standard requirement applies but may have document flexibility' },
                  ] : [
                    { visa: 'Skilled Worker Visa', level: 'B1', skills: 'Leitura, Escrita, Fala, Compreensão', when: 'Comprovado na aplicação do visto — se aceito, reutilize para ILR/cidadania', note: 'Se seu empregador patrocinou, provavelmente já comprovou B1 em todas as 4 habilidades' },
                    { visa: 'Spouse / Partner Visa', level: 'A1 → A2 → B1', skills: 'Fala e Compreensão Oral', when: 'A1 para entrada, A2 para extensão, B1 para ILR. Requisito progressivo.', note: 'IELTS Life Skills A1 para entrada inicial, depois B1 para residência permanente' },
                    { visa: 'Student Visa', level: 'B2', skills: 'Leitura, Escrita, Fala, Compreensão', when: 'Comprovado ao aplicar para visto de estudante via CAS da universidade', note: 'Sua universidade avaliou seu inglês — pode ter usado IELTS Academic (mas não conta para ILR!)' },
                    { visa: 'EU Settled Status', level: 'Nenhum para SS', skills: 'N/A para Settled Status', when: 'Sem inglês para Settled Status em si. B1 fala e compreensão para cidadania.', note: 'Cidadãos da UE precisam fazer SELT B1 separadamente ao aplicar cidadania' },
                    { visa: 'Hong Kong BN(O)', level: 'B1', skills: 'Fala e Compreensão Oral', when: 'Exigido no estágio ILR (após 5 anos), depois reutilizável para cidadania', note: 'Mesmo que a rota padrão de ILR/cidadania' },
                    { visa: 'ILR (qualquer rota 5 anos)', level: 'B1', skills: 'Fala e Compreensão Oral', when: 'Exigido na aplicação de ILR. Reutilizável para cidadania depois.', note: 'Uma vez aprovado para ILR, o mesmo certificado funciona para cidadania mesmo expirado' },
                    { visa: 'Cidadania (Form AN)', level: 'B1', skills: 'Fala e Compreensão Oral', when: 'No momento da aplicação de cidadania — ou reutilize do ILR', note: 'Se inglês foi aceito para seu ILR, NÃO precisa fazer novo teste' },
                    { visa: 'Esquema Windrush', level: 'Nenhum', skills: 'N/A', when: 'Sem requisito de inglês', note: 'Completamente isento do requisito de inglês' },
                    { visa: 'Refugiado / Humanitário', level: 'B1', skills: 'Fala e Compreensão Oral', when: 'Exigido para ILR após 5 anos, depois cidadania', note: 'Requisito padrão se aplica mas pode ter flexibilidade documental' },
                  ]).map((v: any) => (
                    <div key={v.visa} className="p-3 rounded-lg border border-border/30 bg-muted/10">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs">{v.visa}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{v.level}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{v.skills}</p>
                          <p className="text-xs text-muted-foreground mt-1">{v.when}</p>
                          <p className="text-xs text-primary/80 mt-1">💡 {v.note}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Rules */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <h4 className="font-bold text-sm mb-2">
                  {guideLang === 'en' ? '💡 Important Rules to Remember' : '💡 Regras Importantes para Lembrar'}
                </h4>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {(guideLang === 'en' ? [
                    '✅ If your SELT was accepted for your ILR application, you can reuse it for citizenship — even if the 2-year validity has expired',
                    '✅ You do NOT need to take the same test again for citizenship if it was already accepted for ILR',
                    '✅ All SELT components must be taken in one sitting with the same provider',
                    '⚠️ IELTS Academic or IELTS General Training is NOT the same as IELTS for UKVI/Life Skills — make sure you book the right one',
                    '⚠️ PTE Academic is NOT the same as PTE Home — make sure you book PTE Home for citizenship/ILR',
                    '⚠️ If your SELT expires within 1 month before your application date, the Home Office may allow time to retake',
                    '📋 For citizenship: you only need speaking & listening B1. You do NOT need to prove reading or writing.',
                    '📋 The B1 speaking & listening test is much simpler than the full 4-skills test required for work visas',
                    '🏥 If you have a physical/mental condition preventing the test, use the medical exemption form (Form KoLL)',
                    '👴 Age 65+: you are completely exempt — no English test needed at all',
                  ] : [
                    '✅ Se seu SELT foi aceito para sua aplicação de ILR, pode reutilizar para cidadania — mesmo se a validade de 2 anos expirou',
                    '✅ NÃO precisa fazer o mesmo teste novamente para cidadania se já foi aceito para ILR',
                    '✅ Todos os componentes do SELT devem ser feitos de uma vez com o mesmo provedor',
                    '⚠️ IELTS Academic ou IELTS General Training NÃO é o mesmo que IELTS for UKVI/Life Skills — certifique-se de agendar o correto',
                    '⚠️ PTE Academic NÃO é o mesmo que PTE Home — certifique-se de agendar PTE Home para cidadania/ILR',
                    '⚠️ Se seu SELT expirar dentro de 1 mês antes da data da aplicação, o Home Office pode dar tempo para refazer',
                    '📋 Para cidadania: você só precisa de fala e compreensão oral B1. NÃO precisa comprovar leitura ou escrita.',
                    '📋 O teste B1 de fala e compreensão é muito mais simples que o teste completo de 4 habilidades exigido para vistos de trabalho',
                    '🏥 Se tem condição física/mental que impede o teste, use o formulário de isenção médica (Form KoLL)',
                    '👴 Idade 65+: completamente isento — nenhum teste de inglês necessário',
                  ]).map((item, i) => <p key={i}>{item}</p>)}
                </div>
              </div>
              {/* Link to English Hub SELT Prep */}
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      🎓 {guideLang === 'en' ? 'Prepare for Your English Test' : 'Prepare-se para Seu Teste de Inglês'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {guideLang === 'en'
                        ? 'Our English Hub has a dedicated SELT Preparation section with detailed exam formats, booking links, prep tips, and AI-powered exam simulations.'
                        : 'Nosso Hub de Inglês tem uma seção dedicada de Preparação SELT com formatos detalhados, links de agendamento, dicas e simulados de exame com IA.'}
                    </p>
                  </div>
                  <a href="/english-hub">
                    <Button size="sm" variant="outline" className="gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {guideLang === 'en' ? 'Go to English Hub →' : 'Ir para Hub de Inglês →'}
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Routes to British Citizenship */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-500" />
                {guideLang === 'en' ? 'All Routes to British Citizenship' : 'Todas as Rotas para Cidadania Britânica'}
              </CardTitle>
              <CardDescription>
                {guideLang === 'en'
                  ? 'There are 10+ different ways to become a British citizen. Find the one that matches your situation.'
                  : 'Existem mais de 10 formas diferentes de se tornar cidadão britânico. Encontre a que corresponde à sua situação.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(guideLang === 'en' ? [
                  { route: '1. Naturalisation (Form AN)', who: 'Adults 18+ who have lived in UK 5+ years with ILR', test: true, english: true, fee: '£1,580', form: 'AN', color: 'bg-green-500' },
                  { route: '2. Naturalisation — Married to British Citizen', who: 'Spouse/partner of British citizen, 3+ years in UK with ILR', test: true, english: true, fee: '£1,580', form: 'AN', color: 'bg-green-500' },
                  { route: '3. Child Registration (Form MN1)', who: 'Children under 18 — various eligibility criteria', test: false, english: false, fee: '£1,214', form: 'MN1', color: 'bg-pink-500' },
                  { route: '4. Born in UK — 10 Year Residence (Form UKM)', who: 'Born in UK, lived here for first 10 continuous years', test: false, english: false, fee: '£1,214', form: 'UKM', color: 'bg-pink-500' },
                  { route: '5. British by Descent — Born Abroad', who: 'Born outside UK to a British citizen parent (1st generation only)', test: false, english: false, fee: 'Automatic', form: 'N/A', color: 'bg-blue-500' },
                  { route: '6. British Overseas Territories (Form T)', who: 'Citizens of British Overseas Territories (Gibraltar, Bermuda, etc.)', test: false, english: false, fee: '£1,214', form: 'T', color: 'bg-cyan-500' },
                  { route: '7. Stateless Persons (Form S)', who: 'Born in UK and stateless; or stateless adults in UK 5+ years', test: false, english: false, fee: '£1,214', form: 'S', color: 'bg-amber-500' },
                  { route: '8. Windrush Scheme', who: 'Commonwealth citizens who arrived before 1 Jan 1973, or their descendants', test: false, english: false, fee: 'FREE', form: 'Windrush', color: 'bg-purple-500' },
                  { route: '9. Hong Kong BN(O) Route', who: 'British National (Overseas) from Hong Kong — 5 years + 1 year ILR', test: true, english: true, fee: '£1,580', form: 'AN', color: 'bg-red-500' },
                  { route: '10. Armed Forces / Crown Service', who: 'HM Armed Forces members — reduced residence requirements', test: true, english: true, fee: '£1,580', form: 'AN', color: 'bg-slate-500' },
                  { route: '11. Resumption (Form RS1)', who: 'People who previously renounced British citizenship', test: false, english: false, fee: '£372', form: 'RS1', color: 'bg-orange-500' },
                  { route: '12. EU Settlement Scheme → Naturalisation', who: 'EU/EEA/Swiss citizens with Settled Status → then Form AN after 1 year', test: true, english: true, fee: '£1,580', form: 'AN', color: 'bg-indigo-500' },
                ] : [
                  { route: '1. Naturalização (Form AN)', who: 'Adultos 18+ que moraram no UK 5+ anos com ILR', test: true, english: true, fee: '£1.580', form: 'AN', color: 'bg-green-500' },
                  { route: '2. Naturalização — Casado com Cidadão Britânico', who: 'Cônjuge/parceiro de cidadão britânico, 3+ anos no UK com ILR', test: true, english: true, fee: '£1.580', form: 'AN', color: 'bg-green-500' },
                  { route: '3. Registro de Criança (Form MN1)', who: 'Crianças menores de 18 — vários critérios de elegibilidade', test: false, english: false, fee: '£1.214', form: 'MN1', color: 'bg-pink-500' },
                  { route: '4. Nascido no UK — 10 Anos de Residência (Form UKM)', who: 'Nascido no UK, morou aqui nos primeiros 10 anos contínuos', test: false, english: false, fee: '£1.214', form: 'UKM', color: 'bg-pink-500' },
                  { route: '5. Britânico por Descendência — Nascido no Exterior', who: 'Nascido fora do UK com pai/mãe cidadão britânico (apenas 1ª geração)', test: false, english: false, fee: 'Automático', form: 'N/A', color: 'bg-blue-500' },
                  { route: '6. Territórios Ultramarinos Britânicos (Form T)', who: 'Cidadãos de Territórios Ultramarinos (Gibraltar, Bermuda, etc.)', test: false, english: false, fee: '£1.214', form: 'T', color: 'bg-cyan-500' },
                  { route: '7. Pessoas Apátridas (Form S)', who: 'Nascido no UK e apátrida; ou adultos apátridas no UK 5+ anos', test: false, english: false, fee: '£1.214', form: 'S', color: 'bg-amber-500' },
                  { route: '8. Esquema Windrush', who: 'Cidadãos da Commonwealth que chegaram antes de 1 Jan 1973, ou seus descendentes', test: false, english: false, fee: 'GRATUITO', form: 'Windrush', color: 'bg-purple-500' },
                  { route: '9. Rota Hong Kong BN(O)', who: 'British National (Overseas) de Hong Kong — 5 anos + 1 ano ILR', test: true, english: true, fee: '£1.580', form: 'AN', color: 'bg-red-500' },
                  { route: '10. Forças Armadas / Serviço da Coroa', who: 'Membros das HM Armed Forces — requisitos de residência reduzidos', test: true, english: true, fee: '£1.580', form: 'AN', color: 'bg-slate-500' },
                  { route: '11. Retomada (Form RS1)', who: 'Pessoas que renunciaram à cidadania britânica anteriormente', test: false, english: false, fee: '£372', form: 'RS1', color: 'bg-orange-500' },
                  { route: '12. EU Settlement Scheme → Naturalização', who: 'Cidadãos EU/EEA/Suíços com Settled Status → então Form AN após 1 ano', test: true, english: true, fee: '£1.580', form: 'AN', color: 'bg-indigo-500' },
                ]).map((r: any) => (
                  <div key={r.route} className="p-3 rounded-lg border border-border/30 bg-muted/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-2 h-2 rounded-full ${r.color}`} />
                          <span className="font-semibold text-xs">{r.route}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{r.who}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-xs">{r.fee}</span>
                        <div className="flex gap-1 mt-1 justify-end">
                          <Badge variant={r.test ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                            {guideLang === 'en' ? (r.test ? 'Test ✓' : 'No Test') : (r.test ? 'Teste ✓' : 'Sem Teste')}
                          </Badge>
                          <Badge variant={r.english ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                            {guideLang === 'en' ? (r.english ? 'English ✓' : 'No English') : (r.english ? 'Inglês ✓' : 'Sem Inglês')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exemptions Quick-Reference */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-500" />
                {guideLang === 'en' ? 'Exemptions Quick Reference' : 'Referência Rápida de Isenções'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">{guideLang === 'en' ? 'Situation' : 'Situação'}</th>
                      <th className="text-center p-2 font-semibold">Life in UK Test</th>
                      <th className="text-center p-2 font-semibold">{guideLang === 'en' ? 'English B1' : 'Inglês B1'}</th>
                      <th className="text-center p-2 font-semibold">{guideLang === 'en' ? 'Ceremony' : 'Cerimônia'}</th>
                      <th className="text-center p-2 font-semibold">{guideLang === 'en' ? 'ILR Required' : 'ILR Obrigatório'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(guideLang === 'en' ? [
                      { situation: 'Under 18 (child registration)', test: '❌', english: '❌', ceremony: '❌', ilr: '❌' },
                      { situation: 'Adult 18–59 (standard)', test: '✅', english: '✅', ceremony: '✅', ilr: '✅' },
                      { situation: 'Age 60–64 (transitional)', test: '⚠️ Discretion', english: '⚠️ Discretion', ceremony: '✅', ilr: '✅' },
                      { situation: 'Age 65+ (senior)', test: '❌ Exempt', english: '❌ Exempt', ceremony: '✅', ilr: '✅' },
                      { situation: 'Physical/mental condition', test: '⚠️ With medical form', english: '⚠️ With medical form', ceremony: '✅', ilr: '✅' },
                      { situation: 'Born in UK (10yr residence)', test: '❌', english: '❌', ceremony: '❌ (if under 18)', ilr: '❌' },
                      { situation: 'Windrush Scheme', test: '❌', english: '❌', ceremony: '✅', ilr: '❌' },
                      { situation: 'Stateless person', test: '❌', english: '❌', ceremony: '✅ (if adult)', ilr: '❌' },
                      { situation: 'English-speaking country national', test: '✅', english: '❌ Exempt', ceremony: '✅', ilr: '✅' },
                      { situation: 'UK degree holder', test: '✅', english: '❌ Exempt', ceremony: '✅', ilr: '✅' },
                    ] : [
                      { situation: 'Menor de 18 (registro de criança)', test: '❌', english: '❌', ceremony: '❌', ilr: '❌' },
                      { situation: 'Adulto 18–59 (padrão)', test: '✅', english: '✅', ceremony: '✅', ilr: '✅' },
                      { situation: 'Idade 60–64 (transição)', test: '⚠️ Discrição', english: '⚠️ Discrição', ceremony: '✅', ilr: '✅' },
                      { situation: 'Idade 65+ (idoso)', test: '❌ Isento', english: '❌ Isento', ceremony: '✅', ilr: '✅' },
                      { situation: 'Condição física/mental', test: '⚠️ Com laudo médico', english: '⚠️ Com laudo médico', ceremony: '✅', ilr: '✅' },
                      { situation: 'Nascido no UK (10 anos residência)', test: '❌', english: '❌', ceremony: '❌ (se menor 18)', ilr: '❌' },
                      { situation: 'Esquema Windrush', test: '❌', english: '❌', ceremony: '✅', ilr: '❌' },
                      { situation: 'Pessoa apátrida', test: '❌', english: '❌', ceremony: '✅ (se adulto)', ilr: '❌' },
                      { situation: 'Nacional de país anglófono', test: '✅', english: '❌ Isento', ceremony: '✅', ilr: '✅' },
                      { situation: 'Portador de diploma UK', test: '✅', english: '❌ Isento', ceremony: '✅', ilr: '✅' },
                    ]).map((row: any) => (
                      <tr key={row.situation} className="border-b border-border/20 hover:bg-muted/30">
                        <td className="p-2 font-medium">{row.situation}</td>
                        <td className="p-2 text-center">{row.test}</td>
                        <td className="p-2 text-center">{row.english}</td>
                        <td className="p-2 text-center">{row.ceremony}</td>
                        <td className="p-2 text-center">{row.ilr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Special Situations & Edge Cases */}
          <Card className="border-rose-200 dark:border-rose-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                {guideLang === 'en' ? 'Special Situations & Edge Cases' : 'Situações Especiais e Casos Excepcionais'}
              </CardTitle>
              <CardDescription>
                {guideLang === 'en'
                  ? 'Important variables that can affect your application — know these before applying.'
                  : 'Variáveis importantes que podem afetar sua aplicação — saiba disso antes de aplicar.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(guideLang === 'en' ? [
                { title: '⚖️ Criminal Record', items: [
                  'Unspent convictions: almost certainly refused — wait until spent',
                  'Spent convictions: must still declare, assessed case-by-case',
                  'Driving offences (speeding, drink-driving): declare ALL — non-disclosure = automatic refusal',
                  'Cautions and warnings: must be declared',
                  'Overseas convictions: must be declared and translated',
                  'Ongoing investigations or pending charges: application will be delayed or refused',
                ]},
                { title: '💰 Tax & Financial Issues', items: [
                  'Outstanding tax debt to HMRC: pay before applying — shows good character',
                  'Unfiled tax returns: file them immediately — HMRC shares data with Home Office',
                  'Bankruptcy: not automatic disqualification but must be declared and explained',
                  'County Court Judgments (CCJs): declare them — not automatic refusal',
                  'Benefits fraud: serious issue — likely refusal',
                  'Council tax arrears: pay off before applying',
                ]},
                { title: '✈️ Absences from the UK', items: [
                  '5-year route: max 450 days total absent, max 90 days in last 12 months',
                  '3-year route (married): max 270 days total absent, max 90 days in last 12 months',
                  'Absences are calculated from the date of application, looking backwards',
                  'Even 1 day over the limit = automatic refusal (no discretion)',
                  'COVID period (2020-2021): some absences may be disregarded — check latest guidance',
                  'Tip: keep a detailed travel log with exact dates — check passport stamps, flights, calendar',
                ]},
                { title: '👨‍👩‍👧 Family & Relationship Situations', items: [
                  'Married to British citizen: 3-year route (instead of 5) — must have been married the whole time',
                  'Divorced from British spouse during application: may need to restart on 5-year route',
                  'Children born to you after you become British: automatically British',
                  'Children born to you abroad before citizenship: NOT automatically British — may need to register',
                  'Unmarried partner of British citizen: 5-year route (not 3-year)',
                  'Same-sex marriage/civil partnership: same rights as opposite-sex marriage',
                ]},
                { title: '🌍 Dual Nationality', items: [
                  'The UK ALLOWS dual/multiple nationality — you do NOT need to give up your current citizenship',
                  'However, YOUR home country may not allow dual nationality — check their rules',
                  'Brazil: allows dual nationality — you can be Brazilian AND British',
                  'Some countries require you to renounce before acquiring another citizenship',
                  'If you renounce British citizenship, you can apply to resume it later (Form RS1, £372)',
                ]},
                { title: '🏛️ Refugees & Humanitarian Protection', items: [
                  'Refugees can apply for ILR after 5 years of leave, then citizenship after 1 year with ILR',
                  'May be exempt from providing certain documents (passport from country of persecution)',
                  'Home Office is generally sympathetic to document gaps for refugees',
                  'Stateless convention: additional protections and routes available',
                  'Unaccompanied minors who came as children: special consideration may apply',
                ]},
                { title: '🏠 ILR — The Gateway Requirement', items: [
                  'You CANNOT apply for citizenship without ILR (or EU Settled Status)',
                  'ILR costs £2,885 (2024/2025) — must be obtained first',
                  'ILR has its own residence and English requirements',
                  'ILR can lapse if you spend 2+ continuous years outside the UK',
                  'EU Settled Status is treated as equivalent to ILR for citizenship purposes',
                  'Some routes to ILR: 5-year work visa, 10-year long residence, family route, refugee route',
                ]},
                { title: '🔄 If Your Application is Refused', items: [
                  'The fee (£1,580) is NOT refunded if refused',
                  'You will receive reasons for refusal in writing',
                  'You CAN reapply — there is no limit on attempts',
                  'Address the reasons for refusal before reapplying',
                  'No formal appeal process for naturalisation — but you can request administrative review',
                  'Consider getting professional immigration advice before reapplying',
                  'Common refusal reasons: absences exceeded, character issues, incomplete documents, dishonesty',
                ]},
              ] : [
                { title: '⚖️ Antecedentes Criminais', items: [
                  'Condenações não prescritas: quase certamente recusado — espere prescrever',
                  'Condenações prescritas: ainda deve declarar, avaliado caso a caso',
                  'Multas de trânsito (velocidade, beber e dirigir): declare TODAS — não declarar = recusa automática',
                  'Advertências e avisos: devem ser declarados',
                  'Condenações no exterior: devem ser declaradas e traduzidas',
                  'Investigações em andamento ou acusações pendentes: aplicação será atrasada ou recusada',
                ]},
                { title: '💰 Questões Fiscais e Financeiras', items: [
                  'Dívida fiscal com HMRC: pague antes de aplicar — demonstra bom caráter',
                  'Declarações fiscais não entregues: entregue imediatamente — HMRC compartilha dados com Home Office',
                  'Falência: não é desqualificação automática mas deve ser declarada e explicada',
                  'County Court Judgments (CCJs): declare — não é recusa automática',
                  'Fraude de benefícios: problema sério — provável recusa',
                  'Council tax em atraso: quite antes de aplicar',
                ]},
                { title: '✈️ Ausências do UK', items: [
                  'Rota 5 anos: máximo 450 dias total ausente, máximo 90 dias nos últimos 12 meses',
                  'Rota 3 anos (casado): máximo 270 dias total ausente, máximo 90 dias nos últimos 12 meses',
                  'Ausências são calculadas da data da aplicação, olhando para trás',
                  'Mesmo 1 dia acima do limite = recusa automática (sem discrição)',
                  'Período COVID (2020-2021): algumas ausências podem ser desconsideradas — verifique orientação atual',
                  'Dica: mantenha registro detalhado de viagens com datas exatas — verifique carimbos, voos, calendário',
                ]},
                { title: '👨‍👩‍👧 Situações Familiares', items: [
                  'Casado com cidadão britânico: rota de 3 anos (em vez de 5) — deve estar casado durante todo o período',
                  'Divorciado de cônjuge britânico durante aplicação: pode precisar recomeçar na rota de 5 anos',
                  'Filhos nascidos após você se tornar britânico: automaticamente britânicos',
                  'Filhos nascidos no exterior antes da cidadania: NÃO automaticamente britânicos — pode precisar registrar',
                  'Parceiro não casado de cidadão britânico: rota de 5 anos (não 3 anos)',
                  'Casamento/união civil homoafetivo: mesmos direitos que casamento heterossexual',
                ]},
                { title: '🌍 Dupla Nacionalidade', items: [
                  'O UK PERMITE dupla/múltipla nacionalidade — você NÃO precisa abrir mão da cidadania atual',
                  'Porém, SEU país de origem pode não permitir dupla nacionalidade — verifique as regras deles',
                  'Brasil: permite dupla nacionalidade — você pode ser brasileiro E britânico',
                  'Alguns países exigem renúncia antes de adquirir outra cidadania',
                  'Se renunciar à cidadania britânica, pode solicitar retomada depois (Form RS1, £372)',
                ]},
                { title: '🏛️ Refugiados e Proteção Humanitária', items: [
                  'Refugiados podem solicitar ILR após 5 anos de permissão, depois cidadania após 1 ano com ILR',
                  'Pode estar isento de fornecer certos documentos (passaporte do país de perseguição)',
                  'Home Office é geralmente compreensivo com lacunas documentais de refugiados',
                  'Convenção de apátridas: proteções e rotas adicionais disponíveis',
                  'Menores desacompanhados que vieram quando crianças: consideração especial pode se aplicar',
                ]},
                { title: '🏠 ILR — O Requisito Portal', items: [
                  'Você NÃO PODE aplicar cidadania sem ILR (ou EU Settled Status)',
                  'ILR custa £2.885 (2024/2025) — deve ser obtido primeiro',
                  'ILR tem seus próprios requisitos de residência e inglês',
                  'ILR pode caducar se passar 2+ anos contínuos fora do UK',
                  'EU Settled Status é tratado como equivalente a ILR para fins de cidadania',
                  'Algumas rotas para ILR: visto de trabalho 5 anos, residência longa 10 anos, rota familiar, rota de refugiado',
                ]},
                { title: '🔄 Se Sua Aplicação For Recusada', items: [
                  'A taxa (£1.580) NÃO é reembolsada se recusada',
                  'Você receberá os motivos da recusa por escrito',
                  'Você PODE reaplicar — não há limite de tentativas',
                  'Resolva os motivos da recusa antes de reaplicar',
                  'Não há processo formal de recurso para naturalização — mas pode solicitar revisão administrativa',
                  'Considere obter aconselhamento profissional de imigração antes de reaplicar',
                  'Motivos comuns de recusa: ausências excedidas, questões de caráter, documentos incompletos, desonestidade',
                ]},
              ]).map((section: any) => (
                <div key={section.title} className="p-3 rounded-lg border border-border/30 bg-muted/10">
                  <h4 className="font-semibold text-sm mb-2">{section.title}</h4>
                  <div className="space-y-1">
                    {section.items.map((item: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground">• {item}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Step-by-Step Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-blue-500" />
                {guideLang === 'en' ? 'Step-by-Step: UK Citizenship Application' : 'Passo a Passo: Aplicação para Cidadania Britânica'}
              </CardTitle>
              <CardDescription>
                {guideLang === 'en' ? 'Complete guide from eligibility to passport — everything you need to know' : 'Guia completo da elegibilidade ao passaporte — tudo o que você precisa saber'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {(guideLang === 'en' ? [
                { step: 1, title: 'Check Your Eligibility', desc: 'You must have lived in the UK for at least 5 years (3 if married to a British citizen), hold Indefinite Leave to Remain (ILR) or EU Settled Status, and be of good character. You must not have spent more than 450 days outside the UK in the last 5 years, and no more than 90 days in the last 12 months.', link: 'https://www.gov.uk/british-citizenship', details: [
                  '✅ Lived in the UK for 5+ years (or 3 if married to a British citizen)',
                  '✅ Hold ILR (Indefinite Leave to Remain) or EU Settled Status',
                  '✅ No more than 450 days outside UK in last 5 years',
                  '✅ No more than 90 days outside UK in last 12 months',
                  '✅ Be of good character (no serious criminal record)',
                  '✅ Intend to continue living in the UK',
                  '⚠️ If you have any criminal convictions, driving offences, or tax issues, declare them — hiding them will result in refusal',
                ] },
                { step: 2, title: 'Pass the Life in the UK Test', desc: 'Book and pass the test (£50 fee). 24 multiple-choice questions, 45 minutes, 75% pass mark (18/24). Results are immediate. You can retake after 7 days if you fail.', link: 'https://www.gov.uk/life-in-the-uk-test', details: [
                  '📋 Book online at gov.uk — you\'ll need your BRP/passport number',
                  '📍 Test centres across the UK — choose one near you',
                  '💰 Fee: £50 per attempt (non-refundable)',
                  '📝 24 questions from the official handbook, 45 minutes',
                  '✅ Pass mark: 75% (18 out of 24 correct)',
                  '📊 Results shown immediately on screen',
                  '🔄 Can retake after 7 days if you fail',
                  '📄 Pass certificate has no expiry date — keep it safe!',
                  '💡 Tip: Study using our Mock Tests and Review modes above',
                ] },
                { step: 3, title: 'Meet English Language Requirement', desc: 'Prove your English at B1 CEFR level or higher. Several ways to prove this — choose the most convenient for you.', link: 'https://www.gov.uk/english-language', details: [
                  '🎓 Pass an approved SELT test (Secure English Language Test) at B1 level or above',
                  '📜 Have a degree taught in English (UK NARIC confirmation may be needed)',
                  '🌍 Be a national of a majority English-speaking country (e.g., USA, Australia, Jamaica)',
                  '📋 Approved SELT providers: IELTS for UKVI (British Council), Trinity College London, LanguageCert, Pearson',
                  '💰 SELT test costs: £150-200 depending on provider and location',
                  '⏰ Book well in advance — popular centres fill up quickly',
                  '📄 Certificate is valid for 2 years from the test date',
                  '⚠️ Exemptions: aged 65+ or have a physical/mental condition preventing you from meeting the requirement',
                ] },
                { step: 4, title: 'Prepare Your Documents', desc: 'Gather all required documents before starting your application. Missing documents will delay your application.', link: null, details: [
                  '🛂 Valid passport or travel document (current + any expired ones from the last 5 years)',
                  '📇 Biometric Residence Permit (BRP) — original',
                  '✅ Life in the UK Test pass certificate — original',
                  '📜 English language certificate — original (SELT or degree)',
                  '📝 2 referees: must have known you 3+ years, be UK passport holders or professionals, NOT related to you or each other',
                  '📸 Recent passport-sized photos (if applying by post)',
                  '📄 Proof of ILR or EU Settled Status',
                  '💡 Referee 1: Any person of standing in the community (doctor, teacher, solicitor, etc.) or British passport holder',
                  '💡 Referee 2: A professional person (see official list) or British passport holder',
                  '⚠️ If any document is not in English, you need a certified translation',
                ] },
                { step: 5, title: 'Prove Council Tax & Address History', desc: 'You need to prove your UK residency for the last 5 years. Council tax records are the strongest proof of address.', link: null, details: [
                  '🏠 Council tax bills or statements for the last 5 years',
                  '📬 How to get council tax proof: Contact your local council, request council tax statements showing your name and address',
                  '💰 If you owe council tax, pay it off before applying — unpaid tax shows bad character',
                  '📋 Alternative address proof: utility bills (gas, electric, water), bank statements, HMRC letters, NHS letters',
                  '🔄 If you\'ve moved, you need proof for EACH address in the last 5 years',
                  '💡 Tip: Create a spreadsheet listing all your addresses with dates — the application asks for exact dates',
                  '📞 Council tax enquiry lines: each council has a dedicated phone number — Google "[your council] council tax statement"',
                  '⚠️ Joint tenants: make sure your name appears on the council tax account, not just your landlord\'s',
                ] },
                { step: 6, title: 'Apply Online (Form AN)', desc: 'Complete the online application (Form AN) on the Gov.uk website. The fee is £1,580 (2024/2025). Takes about 1-2 hours to complete.', link: 'https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain', details: [
                  '💻 Apply online at gov.uk — Form AN (naturalisation as a British citizen)',
                  '💰 Application fee: £1,580 (2024/2025) — non-refundable even if refused',
                  '💳 Payment: credit/debit card online',
                  '📝 The form asks for: personal details, immigration history, travel history (every trip outside UK in 5 years), employment, referees',
                  '💡 Tip: Prepare your travel history BEFORE starting — you need dates of every trip outside the UK',
                  '📱 Check passport stamps, flight bookings, and calendar to reconstruct travel dates',
                  '⚠️ Be 100% honest — the Home Office checks and any inconsistency can lead to refusal',
                  '📧 You\'ll receive email confirmation with your reference number',
                ] },
                { step: 7, title: 'Biometrics Appointment (UKVCAS)', desc: 'After submitting your online application, book a biometrics appointment to provide fingerprints and a photograph.', link: 'https://www.ukvcas.co.uk/', details: [
                  '📍 Book at a UKVCAS (UK Visa and Citizenship Application Services) centre',
                  '📅 Book as soon as possible after submitting — centres get busy',
                  '🆓 Standard appointment is free; premium (faster) costs extra',
                  '📄 Bring: passport/BRP, application reference number, ALL original supporting documents',
                  '📸 Fingerprints and photo taken digitally',
                  '📱 You can upload documents digitally via the UKVCAS app before your appointment',
                  '⏰ Appointment takes about 15-30 minutes',
                  '💡 Tip: Use the UKVCAS app to scan and upload documents — saves time at the appointment',
                ] },
                { step: 8, title: 'Wait for Decision', desc: 'The Home Office will process your application. Standard processing takes up to 6 months, but most decisions are made within 3-4 months.', link: null, details: [
                  '⏳ Standard processing: up to 6 months (most decided in 3-4 months)',
                  '🚀 Priority service: available for an extra fee (currently around £573) — decision in about 1 month',
                  '📧 Decision sent by email and post',
                  '📞 You can check status online or call the Home Office (0300 123 2253)',
                  '📄 The Home Office may request additional documents — respond promptly',
                  '⚠️ Do NOT travel outside the UK excessively while your application is being processed',
                  '💡 Tip: Keep copies of everything you submitted',
                ] },
                { step: 9, title: 'Attend Citizenship Ceremony', desc: 'Once approved, you\'ll receive an invitation to attend a citizenship ceremony within 90 days. This is a proud and emotional moment!', link: null, details: [
                  '🎉 You MUST attend within 90 days of the invitation, or your approval may be revoked',
                  '📍 Ceremonies are held at your local council office or register office',
                  '💰 Ceremony fee: £80 (included in some councils, extra in others)',
                  '📜 You\'ll take the Oath of Allegiance to the Crown and the Pledge of Loyalty',
                  '📄 You\'ll receive your Certificate of Naturalisation — this is your most important document',
                  '👔 Dress smartly — it\'s a formal occasion. You can bring family and friends',
                  '📸 Photos are usually taken — councils often have a photographer',
                  '🎵 The national anthem is usually played',
                  '⚠️ Keep your Certificate of Naturalisation in a safe place — you need it for your passport application',
                ] },
                { step: 10, title: 'Apply for a British Passport', desc: 'After the ceremony, apply for your first British passport. You are now a British citizen!', link: 'https://www.gov.uk/apply-first-adult-passport', details: [
                  '💻 Apply online at gov.uk — "Apply for a first adult passport"',
                  '💰 Fee: £82.50 (online) or £93 (paper form)',
                  '📄 You\'ll need: Certificate of Naturalisation (original), old passport, passport photo',
                  '📸 Use the gov.uk photo checker — photos must meet strict requirements',
                  '⏰ Standard processing: up to 10 weeks (usually 3-6 weeks)',
                  '🚀 Fast Track (1 week): £177 — collect at a passport office',
                  '🚀 Online Premium (same/next day): £197 — collect at a passport office',
                  '✈️ Once you have your British passport, you can travel on it immediately',
                  '🎉 Congratulations — you are now a British citizen with full rights!',
                ] },
              ] : [
                { step: 1, title: 'Verifique sua Elegibilidade', desc: 'Você deve ter morado no Reino Unido por pelo menos 5 anos (3 se casado com cidadão britânico), ter ILR (Indefinite Leave to Remain) ou EU Settled Status, e ser de bom caráter.', link: 'https://www.gov.uk/british-citizenship', details: [
                  '✅ Morar no UK por 5+ anos (ou 3 se casado com cidadão britânico)',
                  '✅ Ter ILR (Indefinite Leave to Remain) ou EU Settled Status',
                  '✅ Não ter ficado mais de 450 dias fora do UK nos últimos 5 anos',
                  '✅ Não ter ficado mais de 90 dias fora do UK nos últimos 12 meses',
                  '✅ Ser de bom caráter (sem antecedentes criminais graves)',
                  '✅ Ter intenção de continuar morando no UK',
                  '⚠️ Se tiver condenações criminais, multas de trânsito ou dívidas fiscais, declare — esconder resulta em recusa',
                ] },
                { step: 2, title: 'Passar no Life in the UK Test', desc: 'Agendar e passar no teste (£50). 24 perguntas múltipla escolha, 45 minutos, nota mínima 75% (18/24). Resultado imediato. Pode refazer após 7 dias.', link: 'https://www.gov.uk/life-in-the-uk-test', details: [
                  '📋 Agende online em gov.uk — precisa do número do BRP/passaporte',
                  '📍 Centros de teste em todo o UK — escolha um perto de você',
                  '💰 Taxa: £50 por tentativa (não reembolsável)',
                  '📝 24 perguntas do livro oficial, 45 minutos',
                  '✅ Nota mínima: 75% (18 de 24 corretas)',
                  '📊 Resultado mostrado imediatamente na tela',
                  '🔄 Pode refazer após 7 dias se reprovar',
                  '📄 Certificado de aprovação não tem data de validade — guarde bem!',
                  '💡 Dica: Estude usando nossos Simulados e modo Review acima',
                ] },
                { step: 3, title: 'Comprovar Nível de Inglês', desc: 'Comprovar inglês no nível B1 CEFR ou superior. Existem várias formas de comprovar — escolha a mais conveniente.', link: 'https://www.gov.uk/english-language', details: [
                  '🎓 Passar em teste SELT aprovado (Secure English Language Test) nível B1 ou superior',
                  '📜 Ter diploma de graduação ministrado em inglês (pode precisar confirmação do UK NARIC)',
                  '🌍 Ser nacional de país de maioria anglófona (EUA, Austrália, Jamaica, etc.)',
                  '📋 Provedores SELT aprovados: IELTS for UKVI (British Council), Trinity College London, LanguageCert, Pearson',
                  '💰 Custo do teste SELT: £150-200 dependendo do provedor e local',
                  '⏰ Agende com antecedência — centros populares lotam rápido',
                  '📄 Certificado válido por 2 anos a partir da data do teste',
                  '⚠️ Isenções: maiores de 65 anos ou condição física/mental que impeça o teste',
                ] },
                { step: 4, title: 'Preparar seus Documentos', desc: 'Junte todos os documentos necessários antes de iniciar a aplicação. Documentos faltando vão atrasar seu processo.', link: null, details: [
                  '🛂 Passaporte válido ou documento de viagem (atual + expirados dos últimos 5 anos)',
                  '📇 Biometric Residence Permit (BRP) — original',
                  '✅ Certificado do Life in the UK Test — original',
                  '📜 Certificado de inglês — original (SELT ou diploma)',
                  '📝 2 referências: devem te conhecer há 3+ anos, ter passaporte britânico ou ser profissionais, NÃO ser parentes seus nem entre si',
                  '📸 Fotos tipo passaporte recentes (se aplicar por correio)',
                  '📄 Comprovante de ILR ou EU Settled Status',
                  '💡 Referência 1: Qualquer pessoa de posição na comunidade (médico, professor, advogado, etc.) ou portador de passaporte britânico',
                  '💡 Referência 2: Um profissional (ver lista oficial) ou portador de passaporte britânico',
                  '⚠️ Se algum documento não for em inglês, precisa de tradução juramentada',
                ] },
                { step: 5, title: 'Comprovar Council Tax e Histórico de Endereços', desc: 'Você precisa comprovar residência no UK nos últimos 5 anos. Council tax é a prova mais forte de endereço.', link: null, details: [
                  '🏠 Contas ou extratos de council tax dos últimos 5 anos',
                  '📬 Como obter comprovante: Entre em contato com seu council local, solicite extratos de council tax mostrando seu nome e endereço',
                  '💰 Se dever council tax, pague antes de aplicar — dívida mostra mau caráter',
                  '📋 Provas alternativas de endereço: contas de luz/gás/água, extratos bancários, cartas do HMRC, cartas do NHS',
                  '🔄 Se mudou de endereço, precisa de comprovante de CADA endereço nos últimos 5 anos',
                  '💡 Dica: Faça uma planilha listando todos os endereços com datas — a aplicação pede datas exatas',
                  '📞 Cada council tem telefone dedicado — pesquise "[nome do seu council] council tax statement"',
                  '⚠️ Inquilinos em nome conjunto: certifique-se que SEU nome aparece na conta de council tax, não só o do proprietário',
                ] },
                { step: 6, title: 'Aplicar Online (Formulário AN)', desc: 'Preencher a aplicação online (Form AN) no site Gov.uk. Taxa: £1,580 (2024/2025). Leva cerca de 1-2 horas para preencher.', link: 'https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain', details: [
                  '💻 Aplique online em gov.uk — Form AN (naturalização como cidadão britânico)',
                  '💰 Taxa de aplicação: £1,580 (2024/2025) — não reembolsável mesmo se recusada',
                  '💳 Pagamento: cartão de crédito/débito online',
                  '📝 O formulário pede: dados pessoais, histórico imigratório, viagens (cada saída do UK em 5 anos), emprego, referências',
                  '💡 Dica: Prepare seu histórico de viagens ANTES de começar — você precisa das datas de cada saída do UK',
                  '📱 Verifique carimbos no passaporte, reservas de voos e calendário para reconstruir as datas',
                  '⚠️ Seja 100% honesto — o Home Office verifica e qualquer inconsistência pode levar à recusa',
                  '📧 Você receberá confirmação por email com número de referência',
                ] },
                { step: 7, title: 'Agendamento Biométrico (UKVCAS)', desc: 'Após enviar a aplicação online, agende biometria para fornecer impressões digitais e foto.', link: 'https://www.ukvcas.co.uk/', details: [
                  '📍 Agende em um centro UKVCAS (UK Visa and Citizenship Application Services)',
                  '📅 Agende o mais rápido possível — centros ficam cheios',
                  '🆓 Agendamento padrão é gratuito; premium (mais rápido) tem custo extra',
                  '📄 Leve: passaporte/BRP, número de referência, TODOS os documentos originais',
                  '📸 Impressões digitais e foto tiradas digitalmente',
                  '📱 Você pode enviar documentos pelo app UKVCAS antes do agendamento',
                  '⏰ Agendamento leva cerca de 15-30 minutos',
                  '💡 Dica: Use o app UKVCAS para escanear e enviar documentos — economiza tempo no dia',
                ] },
                { step: 8, title: 'Aguardar a Decisão', desc: 'O Home Office processará sua aplicação. Prazo padrão: até 6 meses, mas a maioria das decisões sai em 3-4 meses.', link: null, details: [
                  '⏳ Processamento padrão: até 6 meses (maioria decidida em 3-4 meses)',
                  '🚀 Serviço prioritário: taxa extra (~£573) — decisão em cerca de 1 mês',
                  '📧 Decisão enviada por email e correio',
                  '📞 Pode verificar status online ou ligar para o Home Office (0300 123 2253)',
                  '📄 O Home Office pode pedir documentos adicionais — responda rapidamente',
                  '⚠️ NÃO viaje excessivamente para fora do UK enquanto a aplicação está sendo processada',
                  '💡 Dica: Guarde cópias de tudo que enviou',
                ] },
                { step: 9, title: 'Participar da Cerimônia de Cidadania', desc: 'Uma vez aprovado, você receberá um convite para a cerimônia dentro de 90 dias. É um momento de orgulho e emoção!', link: null, details: [
                  '🎉 Você DEVE comparecer dentro de 90 dias do convite, senão a aprovação pode ser revogada',
                  '📍 Cerimônias são realizadas no escritório do council local ou cartório',
                  '💰 Taxa da cerimônia: £80 (incluída em alguns councils, extra em outros)',
                  '📜 Você fará o Juramento de Lealdade à Coroa e o Compromisso de Lealdade',
                  '📄 Você receberá o Certificado de Naturalização — este é seu documento MAIS importante',
                  '👔 Vista-se formalmente — é uma ocasião formal. Pode levar família e amigos',
                  '📸 Fotos geralmente são tiradas — councils costumam ter fotógrafo',
                  '🎵 O hino nacional geralmente é tocado',
                  '⚠️ Guarde o Certificado em lugar seguro — você precisa dele para o passaporte',
                ] },
                { step: 10, title: 'Solicitar o Passaporte Britânico', desc: 'Após a cerimônia, solicite seu primeiro passaporte britânico. Você agora é cidadão britânico!', link: 'https://www.gov.uk/apply-first-adult-passport', details: [
                  '💻 Aplique online em gov.uk — "Apply for a first adult passport"',
                  '💰 Taxa: £82.50 (online) ou £93 (formulário em papel)',
                  '📄 Precisa: Certificado de Naturalização (original), passaporte antigo, foto de passaporte',
                  '📸 Use o verificador de fotos do gov.uk — fotos devem seguir requisitos rigorosos',
                  '⏰ Processamento padrão: até 10 semanas (geralmente 3-6 semanas)',
                  '🚀 Fast Track (1 semana): £177 — retirada em escritório de passaportes',
                  '🚀 Online Premium (mesmo dia/dia seguinte): £197 — retirada em escritório',
                  '✈️ Com o passaporte britânico, você pode viajar imediatamente',
                  '🎉 Parabéns — você agora é cidadão britânico com direitos plenos!',
                ] },
              ]).map((s: any) => (
                <div key={s.step} className="flex gap-4 p-4 border-l-2 border-primary/30 ml-4 relative">
                  <div className="absolute -left-[13px] top-4 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{s.step}</div>
                  <div className="flex-1 ml-4">
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                    {s.details && (
                      <div className="mt-2 space-y-1 bg-muted/30 rounded-lg p-3 border border-border/30">
                        {s.details.map((d: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground">{d}</p>
                        ))}
                      </div>
                    )}
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                        <ExternalLink className="h-3 w-3" /> GOV.UK Official Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{guideLang === 'en' ? 'Key Costs (2024/2025)' : 'Custos Principais (2024/2025)'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(guideLang === 'en' ? [
                  { item: 'Life in the UK Test', cost: '£50', note: 'per attempt' },
                  { item: 'English Language Test (SELT)', cost: '£150-200', note: 'valid 2 years' },
                  { item: 'Citizenship Application (Form AN)', cost: '£1,580', note: 'non-refundable' },
                  { item: 'Priority Service (optional)', cost: '£573', note: '~1 month decision' },
                  { item: 'Citizenship Ceremony', cost: '£80', note: 'some councils include in tax' },
                  { item: 'First British Passport (online)', cost: '£82.50', note: '3-10 weeks' },
                  { item: 'Fast Track Passport (1 week)', cost: '£177', note: 'collect in person' },
                  { item: 'Total Minimum Cost', cost: '≈ £1,945', note: 'standard route' },
                  { item: 'Total with Priority + Fast Track', cost: '≈ £2,630', note: 'fastest route' },
                ] : [
                  { item: 'Life in the UK Test', cost: '£50', note: 'por tentativa' },
                  { item: 'Teste de Inglês (SELT)', cost: '£150-200', note: 'válido 2 anos' },
                  { item: 'Aplicação de Cidadania (Form AN)', cost: '£1,580', note: 'não reembolsável' },
                  { item: 'Serviço Prioritário (opcional)', cost: '£573', note: '~1 mês para decisão' },
                  { item: 'Cerimônia de Cidadania', cost: '£80', note: 'alguns councils incluem no imposto' },
                  { item: 'Primeiro Passaporte Britânico (online)', cost: '£82.50', note: '3-10 semanas' },
                  { item: 'Fast Track Passaporte (1 semana)', cost: '£177', note: 'retirada presencial' },
                  { item: 'Custo Mínimo Total', cost: '≈ £1,945', note: 'rota padrão' },
                  { item: 'Total com Prioridade + Fast Track', cost: '≈ £2,630', note: 'rota mais rápida' },
                ]).map((c: any) => (
                  <div key={c.item} className="flex items-center justify-between p-2 rounded bg-muted">
                    <div>
                      <span>{c.item}</span>
                      {c.note && <span className="text-xs text-muted-foreground ml-2">({c.note})</span>}
                    </div>
                    <span className="font-semibold">{c.cost}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Useful Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{guideLang === 'en' ? 'Useful Contacts & Links' : 'Contatos e Links Úteis'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {[
                  { name: 'Home Office', phone: '0300 123 2253', url: 'https://www.gov.uk/contact-ukvi-inside-outside-uk' },
                  { name: 'UKVCAS (Biometrics)', phone: null, url: 'https://www.ukvcas.co.uk/' },
                  { name: 'Life in the UK Test Booking', phone: null, url: 'https://www.gov.uk/life-in-the-uk-test' },
                  { name: 'British Citizenship Application', phone: null, url: 'https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain' },
                  { name: 'Passport Application', phone: null, url: 'https://www.gov.uk/apply-first-adult-passport' },
                  { name: guideLang === 'en' ? 'Citizens Advice (Free Help)' : 'Citizens Advice (Ajuda Gratuita)', phone: '0800 144 8848', url: 'https://www.citizensadvice.org.uk/' },
                ].map(c => (
                  <div key={c.name} className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border/30">
                    <div>
                      <p className="font-medium text-xs">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">📞 {c.phone}</p>}
                    </div>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'progress' && (
        <div className="space-y-4">
          {attempts.length === 0 ? (
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold">No Attempts Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start a mock test or study a topic to track your progress.</p>
              <Button onClick={() => setTab('mock')}>Start Your First Test</Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold">{attempts.length}</div>
                  <div className="text-xs text-muted-foreground">Total Attempts</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">{attempts.filter(a => a.passed).length}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">{bestScore}%</div>
                  <div className="text-xs text-muted-foreground">Best Mock Score</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold">{avgScore}%</div>
                  <div className="text-xs text-muted-foreground">Avg Mock Score</div>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">All Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attempts.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          {a.passed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                          <div>
                            <div className="font-medium text-sm">
                              {a.mode === 'mock' ? 'Mock Test' : THEMES.find(t => t.id === a.themeId)?.name || a.themeId}
                              {' — '}{a.score}/{a.total} ({a.percentage}%)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              {a.duration && ` • ${Math.floor(a.duration / 60)}m ${a.duration % 60}s`}
                            </div>
                          </div>
                        </div>
                        <Badge variant={a.passed ? 'default' : 'destructive'} className="text-xs">
                          {a.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
