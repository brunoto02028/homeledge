'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, Send, Mic, MicOff, Volume2, VolumeX, BookOpen, GraduationCap,
  Globe, MessageCircle, CheckCircle2, XCircle, ChevronRight, ArrowRight,
  Brain, Headphones, PenTool, MapPin, ExternalLink, Star, Trophy,
  Languages, School, FileText, Clock, Target, Sparkles,
  RefreshCw, ChevronDown, ChevronUp, RotateCcw, Play, Award,
  BookMarked, Landmark, Library, PoundSterling, ScrollText, Zap,
  Lightbulb, Eye, EyeOff, Speech,
} from 'lucide-react';

import { CEFR_LEVELS, QUICK_TOPICS, UK_EXAMS, ESOL_INFO, VOCABULARY_SETS, LIFE_IN_UK_FACTS, CONVERSATION_SCENARIOS, IELTS_WRITING_TEMPLATES, PHRASAL_VERBS, PRONUNCIATION_GUIDE, DAILY_CHALLENGES, type ChatMessage, type CEFRLevel } from './data/constants';
import { LIFE_IN_UK_QUESTIONS, LIFE_IN_UK_CHAPTERS, type LifeInUKQuestion } from './data/life-in-uk-questions';
import { GRAMMAR_LESSONS, type GrammarLesson } from './data/grammar-lessons';

// ─── Helpers ────────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/\n/g, '<br/>');
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function EnglishHubClient() {
  const { toast } = useToast();

  // AI Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('B1');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Speech
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Life in the UK
  const [lifeChapter, setLifeChapter] = useState<number>(0);
  const [lifeQuestions, setLifeQuestions] = useState<LifeInUKQuestion[]>([]);
  const [lifeIndex, setLifeIndex] = useState(0);
  const [lifeAnswers, setLifeAnswers] = useState<(number | null)[]>([]);
  const [lifeShowResult, setLifeShowResult] = useState(false);
  const [lifeMockMode, setLifeMockMode] = useState(false);
  const [lifeMockDone, setLifeMockDone] = useState(false);

  // Grammar
  const [grammarLevel, setGrammarLevel] = useState<string>('A1');
  const [activeLesson, setActiveLesson] = useState<GrammarLesson | null>(null);
  const [grammarAnswers, setGrammarAnswers] = useState<(number | null)[]>([]);
  const [grammarShowResults, setGrammarShowResults] = useState(false);

  // Quiz (general)
  const [quizLevel, setQuizLevel] = useState<CEFRLevel>('B1');

  // Vocabulary
  const [vocabSet, setVocabSet] = useState(0);
  const [vocabRevealed, setVocabRevealed] = useState<Set<number>>(new Set());

  // Exam Prep
  const [examExpanded, setExamExpanded] = useState<number | null>(null);

  // Phrasal Verbs
  const [pvRevealed, setPvRevealed] = useState<Set<number>>(new Set());
  const [pvFilter, setPvFilter] = useState<string>('all');

  // Pronunciation
  const [pronRevealed, setPronRevealed] = useState<Set<number>>(new Set());

  // Daily Challenge
  const [challengeIdx, setChallengeIdx] = useState(() => new Date().getDate() % DAILY_CHALLENGES.length);
  const [challengeRevealed, setChallengeRevealed] = useState(false);

  // Chat history for AI context
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // ─── Init ──────────────────────────────────────────────────────────

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    setTtsSupported('speechSynthesis' in window);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── AI Chat ───────────────────────────────────────────────────────

  const sendMessage = async (text?: string) => {
    const msg = text || inputMessage.trim();
    if (!msg || sending) return;
    setInputMessage('');
    const userMsg: ChatMessage = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setSending(true);

    try {
      const levelNote = `[User CEFR level: ${selectedLevel}. Adjust vocabulary and complexity accordingly.]`;
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: `${levelNote}\n\n${msg}`,
          context: 'english',
          history: chatHistory.slice(-10),
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.answer };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);
      setChatHistory(prev => [...prev, userMsg, assistantMsg]);

      if (autoSpeak && ttsSupported) {
        setSpeakingIdx(updatedMessages.length - 1);
        speakText(data.answer);
      }
    } catch {
      toast({ title: 'Error', description: 'Could not get response from AI tutor', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // ─── Speech Recognition ────────────────────────────────────────────

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-GB';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };
    recognition.onerror = (e: any) => {
      console.error('Speech Recognition Error:', e);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ─── Text-to-Speech ────────────────────────────────────────────────

  const speakText = (text: string) => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_]/g, '').replace(/<[^>]*>/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Female'))
      || voices.find(v => v.lang === 'en-GB')
      || voices.find(v => v.lang.startsWith('en'));
    if (britishVoice) utterance.voice = britishVoice;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = (e) => {
      console.error('TTS Error:', e);
      setSpeakingIdx(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeakingIdx(null);
  };

  const speakMessage = (text: string, idx: number) => {
    setSpeakingIdx(idx);
    speakText(text);
  };

  const speakWord = (word: string) => {
    if (!ttsSupported || !word) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-GB';
    u.rate = 0.8;
    const voices = window.speechSynthesis.getVoices();
    const bv = voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'));
    if (bv) u.voice = bv;
    u.onerror = (e) => console.error('TTS Word Error:', e);
    window.speechSynthesis.speak(u);
  };

  // ─── Life in the UK — Practice / Mock ──────────────────────────────

  const startLifePractice = (chapter: number) => {
    const qs = chapter === 0
      ? shuffleArray(LIFE_IN_UK_QUESTIONS).slice(0, 24)
      : shuffleArray(LIFE_IN_UK_QUESTIONS.filter(q => q.chapter === chapter)).slice(0, 20);
    setLifeQuestions(qs);
    setLifeAnswers(new Array(qs.length).fill(null));
    setLifeIndex(0);
    setLifeShowResult(false);
    setLifeMockDone(false);
    setLifeChapter(chapter);
    setLifeMockMode(chapter === 0);
  };

  const answerLife = (optionIdx: number) => {
    setLifeAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[lifeIndex] = optionIdx;
      return newAnswers;
    });
  };

  const submitLifeMock = () => {
    setLifeMockDone(true);
  };

  const lifeScore = () => {
    let correct = 0;
    lifeQuestions.forEach((q, i) => { 
      if (lifeAnswers[i] !== null && lifeAnswers[i] === q.correct) correct++; 
    });
    return correct;
  };

  // ─── Grammar Practice ──────────────────────────────────────────────

  const openLesson = (lesson: GrammarLesson) => {
    setActiveLesson(lesson);
    setGrammarAnswers(new Array(lesson.practiceQuestions.length).fill(null));
    setGrammarShowResults(false);
  };

  const answerGrammar = (questionIndex: number, optionIdx: number) => {
    setGrammarAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = optionIdx;
      return newAnswers;
    });
  };

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg"><Languages className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-bold">English Hub</h1>
              <p className="text-blue-100 text-sm">Your complete English learning platform for life in the UK</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="bg-white/20 text-white border-0">AI Tutor</Badge>
            <Badge className="bg-white/20 text-white border-0">Life in the UK Test</Badge>
            <Badge className="bg-white/20 text-white border-0">Grammar A1-C2</Badge>
            <Badge className="bg-white/20 text-white border-0">IELTS Prep</Badge>
            <Badge className="bg-white/20 text-white border-0">Vocabulary</Badge>
            <Badge className="bg-white/20 text-white border-0">Phrasal Verbs</Badge>
            <Badge className="bg-white/20 text-white border-0">Pronunciation</Badge>
            <Badge className="bg-white/20 text-white border-0">Daily Challenge</Badge>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="tutor" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="tutor" className="gap-1.5 text-xs sm:text-sm"><MessageCircle className="h-3.5 w-3.5" />AI Tutor</TabsTrigger>
          <TabsTrigger value="life-uk" className="gap-1.5 text-xs sm:text-sm"><Landmark className="h-3.5 w-3.5" />Life in the UK</TabsTrigger>
          <TabsTrigger value="grammar" className="gap-1.5 text-xs sm:text-sm"><BookMarked className="h-3.5 w-3.5" />Grammar</TabsTrigger>
          <TabsTrigger value="vocabulary" className="gap-1.5 text-xs sm:text-sm"><Library className="h-3.5 w-3.5" />Vocabulary</TabsTrigger>
          <TabsTrigger value="phrasal" className="gap-1.5 text-xs sm:text-sm"><ScrollText className="h-3.5 w-3.5" />Phrasal Verbs</TabsTrigger>
          <TabsTrigger value="pronunciation" className="gap-1.5 text-xs sm:text-sm"><Headphones className="h-3.5 w-3.5" />Pronunciation</TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5 text-xs sm:text-sm"><Award className="h-3.5 w-3.5" />Exam Prep</TabsTrigger>
          <TabsTrigger value="cefr" className="gap-1.5 text-xs sm:text-sm"><Target className="h-3.5 w-3.5" />CEFR Levels</TabsTrigger>
          <TabsTrigger value="challenge" className="gap-1.5 text-xs sm:text-sm"><Zap className="h-3.5 w-3.5" />Daily Challenge</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5 text-xs sm:text-sm"><BookOpen className="h-3.5 w-3.5" />Resources</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: AI Tutor                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="tutor" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            {/* Chat Area */}
            <Card className="flex flex-col" style={{ minHeight: '600px' }}>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-500" />AI English Tutor</CardTitle>
                    <CardDescription>Practice speaking, grammar, writing — your personal UK English teacher</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as CEFRLevel)}>
                      <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map(l => <SelectItem key={l.level} value={l.level}>{l.level} — {l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant={autoSpeak ? 'default' : 'outline'} className="h-8 text-xs gap-1" onClick={() => setAutoSpeak(!autoSpeak)}>
                      <Volume2 className="h-3 w-3" />{autoSpeak ? 'Auto-speak ON' : 'Auto-speak'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '450px' }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                    <Brain className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-lg font-medium">Start a conversation</p>
                    <p className="text-sm mt-1">Choose a topic below or type your own question</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                      }`}>
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        {msg.role === 'assistant' && ttsSupported && (
                          <div className="flex gap-1 mt-2 pt-2 border-t border-border/30">
                            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2"
                              onClick={() => speakingIdx === i ? stopSpeaking() : speakMessage(msg.content, i)}>
                              {speakingIdx === i ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                              {speakingIdx === i ? 'Stop' : 'Listen'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input placeholder="Type your message or use the microphone..." value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    disabled={sending} className="flex-1" />
                  {speechSupported && (
                    <Button size="icon" variant={isListening ? 'destructive' : 'outline'}
                      onClick={isListening ? stopListening : startListening} disabled={sending}>
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button onClick={() => sendMessage()} disabled={sending || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Topics Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" />Quick Topics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-[350px] overflow-y-auto">
                  {QUICK_TOPICS.map((topic, i) => (
                    <Button key={i} variant="ghost" size="sm"
                      className="w-full justify-start text-xs h-auto py-2 px-2 font-normal"
                      onClick={() => sendMessage(topic.prompt)}>
                      <span className="mr-2 text-base">{topic.icon}</span>
                      {topic.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Play className="h-4 w-4 text-green-500" />Conversation Practice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {CONVERSATION_SCENARIOS.map((sc) => (
                    <Button key={sc.id} variant="ghost" size="sm"
                      className="w-full justify-start text-xs h-auto py-2 px-2 font-normal"
                      onClick={() => sendMessage(`Let's do a conversation practice. Scenario: ${sc.title}. You play the role of ${sc.aiRole} and I will be the ${sc.userRole}. Start the conversation in character. My level is ${selectedLevel}.`)}>
                      <Badge variant="outline" className="mr-2 text-[9px] px-1">{sc.level}</Badge>
                      {sc.title}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Life in the UK                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="life-uk" className="space-y-4">
          {lifeQuestions.length === 0 ? (
            <>
              {/* Info Banner */}
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg"><Landmark className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <h3 className="font-bold text-blue-900 dark:text-blue-100">Life in the UK Test</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Required for ILR and British Citizenship. 24 questions, 45 minutes, 75% pass mark (18/24). Cost: £50.</p>
                      <a href="https://www.gov.uk/life-in-the-uk-test" target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2">
                        Book your test at gov.uk <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Facts */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {LIFE_IN_UK_FACTS.map((fact, i) => (
                  <Card key={i} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground font-medium">{fact.q}</p>
                      <p className="font-bold mt-1">{fact.a}</p>
                      <p className="text-xs text-muted-foreground mt-1">{fact.detail}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Mock Exam Button */}
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="pt-5 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" />Full Mock Exam</h3>
                    <p className="text-sm text-muted-foreground mt-1">24 random questions from all chapters — just like the real test!</p>
                  </div>
                  <Button onClick={() => startLifePractice(0)} className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-sm">
                    <Play className="h-4 w-4 mr-2" />Start Mock Exam
                  </Button>
                </CardContent>
              </Card>

              {/* Chapter Practice */}
              <h3 className="text-lg font-bold flex items-center gap-2 mt-2"><BookOpen className="h-5 w-5" />Practice by Chapter</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {LIFE_IN_UK_CHAPTERS.map(ch => {
                  const qCount = LIFE_IN_UK_QUESTIONS.filter(q => q.chapter === ch.chapter).length;
                  return (
                    <Card key={ch.chapter} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => startLifePractice(ch.chapter)}>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">{ch.chapter}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm leading-tight">{ch.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ch.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px]">{qCount} questions</Badge>
                              <span className="text-xs text-primary group-hover:underline flex items-center gap-0.5">Practice <ArrowRight className="h-3 w-3" /></span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            /* ─── Active Practice / Mock ─── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    {lifeMockMode ? <Trophy className="h-5 w-5 text-amber-500" /> : <BookOpen className="h-5 w-5" />}
                    {lifeMockMode ? 'Mock Exam' : `Chapter ${lifeChapter}: ${LIFE_IN_UK_CHAPTERS.find(c => c.chapter === lifeChapter)?.name}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">Question {lifeIndex + 1} of {lifeQuestions.length}{lifeMockMode && ' — 75% to pass (18/24)'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setLifeQuestions([]); setLifeMockDone(false); }}>
                    <RotateCcw className="h-4 w-4 mr-1" />Back
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((lifeIndex + 1) / lifeQuestions.length) * 100}%` }} />
              </div>

              {lifeMockDone ? (
                /* ─── Results ─── */
                <Card className="border-2">
                  <CardContent className="pt-6 pb-6 text-center">
                    <div className={`text-5xl font-bold mb-2 ${lifeScore() >= Math.ceil(lifeQuestions.length * 0.75) ? 'text-green-600' : 'text-red-600'}`}>
                      {lifeScore()} / {lifeQuestions.length}
                    </div>
                    <p className="text-lg font-medium mb-1">
                      {lifeScore() >= Math.ceil(lifeQuestions.length * 0.75) ? '🎉 PASSED!' : '❌ Not passed'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {Math.round((lifeScore() / lifeQuestions.length) * 100)}% — Pass mark: 75%
                    </p>
                    {/* Review each question */}
                    <div className="text-left space-y-3 mt-6">
                      {lifeQuestions.map((q, i) => (
                        <div key={q.id} className={`p-3 rounded-lg text-sm ${lifeAnswers[i] === q.correct ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'}`}>
                          <p className="font-medium">{i + 1}. {q.question}</p>
                          {lifeAnswers[i] !== q.correct && (
                            <p className="text-xs mt-1">Your answer: <span className="text-red-600 font-medium">{q.options[lifeAnswers[i]!]}</span> · Correct: <span className="text-green-600 font-medium">{q.options[q.correct]}</span></p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-center mt-6">
                      <Button variant="outline" onClick={() => { setLifeQuestions([]); setLifeMockDone(false); }}>Back to Chapters</Button>
                      <Button onClick={() => startLifePractice(lifeChapter)}>
                        <RefreshCw className="h-4 w-4 mr-2" />Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* ─── Question Card ─── */
                <Card className="border-2">
                  <CardContent className="pt-6 pb-6">
                    <Badge variant="outline" className="mb-3 text-xs">{lifeQuestions[lifeIndex]?.chapterName}</Badge>
                    <p className="text-lg font-semibold mb-4">{lifeQuestions[lifeIndex]?.question}</p>
                    <div className="space-y-2">
                      {lifeQuestions[lifeIndex]?.options.map((opt, oi) => {
                        const answered = lifeAnswers[lifeIndex] !== null;
                        const isSelected = lifeAnswers[lifeIndex] === oi;
                        const isCorrect = oi === lifeQuestions[lifeIndex].correct;
                        let cls = 'border-2 cursor-pointer hover:border-primary/50';
                        if (answered && !lifeMockMode) {
                          if (isCorrect) cls = 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20';
                          else if (isSelected && !isCorrect) cls = 'border-2 border-red-500 bg-red-50 dark:bg-red-950/20';
                          else cls = 'border-2 opacity-60';
                        } else if (isSelected) {
                          cls = 'border-2 border-primary bg-primary/5';
                        }
                        return (
                          <button key={oi} className={`w-full text-left p-3 rounded-lg transition-all text-sm flex items-center gap-3 ${cls}`}
                            onClick={() => answerLife(oi)} disabled={answered && !lifeMockMode}>
                            <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span>{opt}</span>
                            {answered && !lifeMockMode && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                            {answered && !lifeMockMode && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                    {/* Explanation (study mode only) */}
                    {lifeAnswers[lifeIndex] !== null && !lifeMockMode && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Explanation:</p>
                        <p className="text-blue-700 dark:text-blue-300">{lifeQuestions[lifeIndex]?.explanation}</p>
                      </div>
                    )}
                    <div className="flex justify-between mt-4">
                      <Button variant="outline" disabled={lifeIndex === 0} onClick={() => setLifeIndex(i => i - 1)}>Previous</Button>
                      {lifeIndex < lifeQuestions.length - 1 ? (
                        <Button onClick={() => setLifeIndex(i => i + 1)} disabled={lifeMockMode ? false : lifeAnswers[lifeIndex] === null}>Next</Button>
                      ) : (
                        <Button onClick={submitLifeMock} variant="success" disabled={lifeMockMode && lifeAnswers.some(a => a === null)}>
                          <Trophy className="h-4 w-4 mr-2" />Finish & See Results
                        </Button>
                      )}
                    </div>
                    {/* Question nav dots */}
                    <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                      {lifeQuestions.map((_, qi) => (
                        <button key={qi} onClick={() => setLifeIndex(qi)}
                          className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
                            qi === lifeIndex ? 'bg-primary text-primary-foreground' :
                            lifeAnswers[qi] !== null ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>{qi + 1}</button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Grammar                                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="grammar" className="space-y-4">
          {activeLesson ? (
            /* ─── Lesson Detail ─── */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setActiveLesson(null)}><RotateCcw className="h-4 w-4 mr-1" />Back to Lessons</Button>
                <Badge>{activeLesson.level}</Badge>
                {ttsSupported && (
                  <Button size="sm" variant="outline" className="gap-1 ml-auto" onClick={() => { speakText(activeLesson.explanation); }}>
                    <Volume2 className="h-3 w-3" />Listen to Explanation
                  </Button>
                )}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>{activeLesson.title}</CardTitle>
                  <CardDescription>{activeLesson.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">{activeLesson.explanation}</div>
                  <h4 className="font-bold text-sm flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Examples</h4>
                  <div className="space-y-2">
                    {activeLesson.examples.map((ex, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
                        <button onClick={() => speakWord(ex.sentence)} className="flex-shrink-0 mt-0.5 p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"><Volume2 className="h-4 w-4 text-blue-500" /></button>
                        <div>
                          <p className="text-sm font-medium">{ex.sentence}</p>
                          {ex.note && <p className="text-xs text-muted-foreground">{ex.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <h4 className="font-bold text-sm flex items-center gap-2 mt-4"><PenTool className="h-4 w-4 text-green-500" />Practice Questions</h4>
                  <div className="space-y-3">
                    {activeLesson.practiceQuestions.map((pq, pi) => {
                      const answered = grammarAnswers[pi] !== null;
                      return (
                        <div key={pi} className="p-3 rounded-lg border">
                          <p className="text-sm font-medium mb-2">{pq.question}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {pq.options.map((opt, oi) => {
                              const isSelected = grammarAnswers[pi] === oi;
                              const isCorrect = oi === pq.correct;
                              let cls = 'border cursor-pointer hover:border-primary/50 text-xs p-2 rounded-lg transition-all text-center';
                              if (answered) {
                                if (isCorrect) cls = 'border border-green-500 bg-green-50 dark:bg-green-950/20 text-xs p-2 rounded-lg';
                                else if (isSelected) cls = 'border border-red-500 bg-red-50 dark:bg-red-950/20 text-xs p-2 rounded-lg';
                                else cls = 'border opacity-50 text-xs p-2 rounded-lg';
                              } else if (isSelected) {
                                cls = 'border border-primary bg-primary/5 text-xs p-2 rounded-lg';
                              }
                              return (
                                <button key={oi} className={cls} disabled={answered}
                                  onClick={() => answerGrammar(pi, oi)}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {answered && <p className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">{pq.explanation}</p>}
                        </div>
                      );
                    })}
                  </div>
                  {/* AI practice prompt */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm font-medium flex items-center gap-2"><Brain className="h-4 w-4 text-indigo-500" />Want more practice?</p>
                    <p className="text-xs text-muted-foreground mt-1">Ask the AI Tutor for more exercises on this topic!</p>
                    <Button size="sm" className="mt-2" variant="outline"
                      onClick={() => {
                        setActiveLesson(null);
                        sendMessage(`Give me 5 practice exercises on the topic: "${activeLesson.title}" at ${activeLesson.level} level. Include answers and explanations.`);
                        const tabEl = document.querySelector('[data-value="tutor"]') as HTMLElement;
                        tabEl?.click();
                      }}>
                      <MessageCircle className="h-3 w-3 mr-1" />Practice with AI Tutor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* ─── Lesson List ─── */
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Grammar Lessons</h2>
                <Select value={grammarLevel} onValueChange={setGrammarLevel}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {CEFR_LEVELS.map(l => <SelectItem key={l.level} value={l.level}>{l.level} — {l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {GRAMMAR_LESSONS.filter(l => grammarLevel === 'all' || l.level === grammarLevel).map(lesson => (
                  <Card key={lesson.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => openLesson(lesson)}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start gap-3">
                        <Badge className={`flex-shrink-0 ${
                          lesson.level.startsWith('A') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          lesson.level.startsWith('B') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>{lesson.level}</Badge>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{lesson.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.summary}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">{lesson.examples.length} examples · {lesson.practiceQuestions.length} exercises</span>
                            <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Vocabulary                                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="vocabulary" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold">Vocabulary Builder</h2>
            <div className="flex gap-2 flex-wrap">
              {VOCABULARY_SETS.map((vs, i) => (
                <Button key={vs.id} variant={vocabSet === i ? 'default' : 'outline'} size="sm" className="text-xs"
                  onClick={() => { setVocabSet(i); setVocabRevealed(new Set()); }}>
                  {vs.title} <Badge variant="outline" className="ml-1 text-[9px]">{vs.level}</Badge>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VOCABULARY_SETS[vocabSet]?.words.map((w, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg">{w.word}</h4>
                        {ttsSupported && (
                          <button onClick={() => speakWord(w.word)} className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-500">
                            <Volume2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {vocabRevealed.has(i) ? (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">{w.meaning}</p>
                          <p className="text-xs italic mt-1 text-foreground/80">"{w.example}"</p>
                          {ttsSupported && (
                            <button onClick={() => speakWord(w.example)} className="text-xs text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md px-1.5 py-0.5 flex items-center gap-1 mt-1 transition-colors">
                              <Volume2 className="h-3 w-3" />Listen to example
                            </button>
                          )}
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-xs mt-1 px-0" onClick={() => setVocabRevealed(prev => new Set(prev).add(i))}>
                          <ChevronDown className="h-3 w-3 mr-1" />Show meaning
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setVocabRevealed(new Set(VOCABULARY_SETS[vocabSet]?.words.map((_, i) => i)))}>
              Reveal All
            </Button>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Phrasal Verbs                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="phrasal" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold">Phrasal Verbs</h2>
            <p className="text-sm text-muted-foreground">Essential multi-word verbs used in everyday UK English</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'A2', 'B1', 'B2'].map(level => (
              <Button key={level} variant={pvFilter === level ? 'default' : 'outline'} size="sm" className="text-xs"
                onClick={() => setPvFilter(level)}>
                {level === 'all' ? 'All Levels' : level}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PHRASAL_VERBS.filter(pv => pvFilter === 'all' || pv.level === pvFilter).map((pv, i) => {
              const globalIdx = PHRASAL_VERBS.indexOf(pv);
              return (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg text-primary">{pv.verb}</h4>
                          <Badge variant="outline" className="text-[10px]">{pv.level}</Badge>
                          {ttsSupported && (
                            <button onClick={() => speakWord(pv.verb)} className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-500">
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {pvRevealed.has(globalIdx) ? (
                          <>
                            <p className="text-sm text-muted-foreground mt-1">{pv.meaning}</p>
                            <p className="text-xs italic mt-1.5 text-foreground/80 bg-muted/50 rounded-md px-2 py-1">"{pv.example}"</p>
                            {ttsSupported && (
                              <button onClick={() => speakWord(pv.example)} className="text-xs text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md px-1.5 py-0.5 flex items-center gap-1 mt-1.5 transition-colors">
                                <Volume2 className="h-3 w-3" />Listen to example
                              </button>
                            )}
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-xs mt-1 px-0" onClick={() => setPvRevealed(prev => new Set(prev).add(globalIdx))}>
                            <Eye className="h-3 w-3 mr-1" />Show meaning
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setPvRevealed(new Set(PHRASAL_VERBS.map((_, i) => i)))}>
              Reveal All
            </Button>
            <Button variant="outline" onClick={() => setPvRevealed(new Set())}>
              <EyeOff className="h-4 w-4 mr-1" />Hide All
            </Button>
          </div>
          <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
            <CardContent className="pt-5 pb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-500" />Practice phrasal verbs with AI</h3>
                <p className="text-sm text-muted-foreground mt-1">Ask the AI Tutor for fill-in-the-blank exercises using these phrasal verbs.</p>
              </div>
              <Button variant="outline"
                onClick={() => {
                  sendMessage(`Give me 10 fill-in-the-blank exercises using common English phrasal verbs (like "look after", "sort out", "turn up", etc.). After I answer, correct me and explain why. My level is ${selectedLevel}.`);
                  const tabEl = document.querySelector('[data-value="tutor"]') as HTMLElement;
                  tabEl?.click();
                }}>
                <MessageCircle className="h-4 w-4 mr-2" />Practice with AI
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Pronunciation                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="pronunciation" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">UK Pronunciation Guide</h2>
            <p className="text-sm text-muted-foreground mb-4">Tricky words that even advanced learners mispronounce. Master these to sound more natural!</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRONUNCIATION_GUIDE.map((item, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-xl">{item.word}</h4>
                        <span className="text-xs text-muted-foreground font-mono">{item.phonetic}</span>
                        {ttsSupported && (
                          <button onClick={() => speakWord(item.word)} className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-500">
                            <Volume2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {pronRevealed.has(i) ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                <span className="text-sm text-red-600 dark:text-red-400 line-through">{item.common_mistake}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-green-700 dark:text-green-400 font-semibold">{item.correct}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-xs">
                            <p className="flex items-start gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{item.tip}</p>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-xs px-0" onClick={() => setPronRevealed(prev => new Set(prev).add(i))}>
                          <Eye className="h-3 w-3 mr-1" />Show pronunciation
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setPronRevealed(new Set(PRONUNCIATION_GUIDE.map((_, i) => i)))}>
              Reveal All
            </Button>
            <Button variant="outline"
              onClick={() => {
                sendMessage(`I want to practice British English pronunciation. Give me 10 commonly mispronounced words with: the correct UK pronunciation using phonetic spelling, common mistakes, and tips. Focus on words immigrants often struggle with. My level is ${selectedLevel}.`);
                const tabEl = document.querySelector('[data-value="tutor"]') as HTMLElement;
                tabEl?.click();
              }}>
              <Brain className="h-4 w-4 mr-2" />More with AI
            </Button>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Exam Prep                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="exams" className="space-y-4">
          <h2 className="text-xl font-bold mb-1">UK English Exams & Certifications</h2>
          <p className="text-sm text-muted-foreground mb-4">Everything you need to know about English exams accepted in the UK for visas, work, and study.</p>

          <div className="space-y-3">
            {UK_EXAMS.map((exam, i) => (
              <Card key={i} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setExamExpanded(examExpanded === i ? null : i)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold">{exam.name}</h3>
                        <Badge variant="outline">{exam.levels}</Badge>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">{exam.cost}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{exam.purpose}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{exam.format}</p>
                    </div>
                    {examExpanded === i ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  {examExpanded === i && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-1 mb-2"><Target className="h-4 w-4 text-green-500" />Top Tips</h4>
                        <div className="space-y-1">
                          {exam.tips.map((tip, ti) => (
                            <div key={ti} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={exam.link} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1">
                            <ExternalLink className="h-3 w-3" />Official Website
                          </Button>
                        </a>
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => {
                            sendMessage(`I want to prepare for the ${exam.name} exam. Give me a detailed study plan, including: what to study each week, recommended resources, and practice strategies. My current level is ${selectedLevel}.`);
                            const tabEl = document.querySelector('[data-value="tutor"]') as HTMLElement;
                            tabEl?.click();
                          }}>
                          <Brain className="h-3 w-3" />Get AI Study Plan
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* IELTS Writing Templates */}
          <h3 className="text-lg font-bold mt-6 flex items-center gap-2"><PenTool className="h-5 w-5" />IELTS Writing Templates</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {IELTS_WRITING_TEMPLATES.map((tmpl, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{tmpl.task}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Structure</h5>
                    <div className="space-y-1">
                      {tmpl.structure.map((s, si) => (
                        <div key={si} className="flex items-start gap-2 text-xs">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{si + 1}</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Useful Phrases</h5>
                    <div className="flex flex-wrap gap-1">
                      {tmpl.usefulPhrases.map((p, pi) => (
                        <Badge key={pi} variant="outline" className="text-[10px] font-normal">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-xs">
                    <span className="font-semibold">Sample topic: </span>{tmpl.sampleTopic}
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-1"
                    onClick={() => {
                      sendMessage(`I want to practice IELTS writing: ${tmpl.task}. Topic: "${tmpl.sampleTopic}". Please give me model answer and then ask me to write my own. Grade it afterwards using IELTS criteria.`);
                      const tabEl = document.querySelector('[data-value="tutor"]') as HTMLElement;
                      tabEl?.click();
                    }}>
                    <Brain className="h-3 w-3" />Practice with AI
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: CEFR Levels                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="cefr" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">CEFR English Levels</h2>
            <p className="text-muted-foreground text-sm">The Common European Framework of Reference — your roadmap from beginner to fluency</p>
          </div>

          <div className="relative">
            <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-300 via-green-300 to-purple-300 hidden lg:block" />
            <div className="space-y-5">
              {CEFR_LEVELS.map((level) => (
                <Card key={level.level} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${level.color}`} />
                  <CardContent className="pt-5 pb-5 pl-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-5">
                      {/* Level Icon — large gradient square */}
                      <div className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${level.iconBg} text-white flex flex-col items-center justify-center shadow-xl ring-2 ring-white/20 overflow-hidden`}>
                        <span className="text-2xl font-extrabold leading-none">{level.level}</span>
                        <span className="text-[8px] uppercase tracking-tight opacity-90 mt-0.5 font-semibold max-w-[72px] text-center truncate">{level.name.split(' ')[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-lg">{level.level} — {level.name}</h3>
                          <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />{level.studyHours}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{level.description}</p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {level.skills.map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </div>

                        {/* UK Relevance */}
                        <div className="mt-3 p-2.5 bg-muted/50 rounded-lg text-xs flex items-start gap-2">
                          <Landmark className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{level.ukRelevance}</span>
                        </div>

                        {/* Exam Equivalents */}
                        <div className="mt-2.5">
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Award className="h-3 w-3" />Exam Equivalents:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {level.examEquivalents.map(exam => (
                              <Badge key={exam} className="text-[10px] bg-primary/5 text-primary border-primary/20 dark:bg-primary/10 border font-normal">{exam}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Study Tips */}
                        <div className="mt-2.5 p-2.5 bg-amber-50/60 dark:bg-amber-950/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1"><Lightbulb className="h-3 w-3" />Study Tips:</p>
                          <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5">
                            {level.studyTips.map((tip, ti) => (
                              <li key={ti} className="flex items-start gap-1.5">
                                <ChevronRight className="h-3 w-3 flex-shrink-0 mt-0.5 opacity-60" />{tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick assessment prompt */}
          <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
            <CardContent className="pt-5 pb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-500" />Not sure of your level?</h3>
                <p className="text-sm text-muted-foreground mt-1">Take a quick assessment with our AI Tutor to determine your approximate CEFR level.</p>
              </div>
              <Button variant="outline"
                onClick={() => {
                  sendMessage('I want you to assess my English level. Ask me 10 questions of increasing difficulty (from A1 to C2) and at the end tell me my approximate CEFR level. Start now.');
                  const tabEl = document.querySelector('[data-value="tutor"]') as HTMLElement;
                  tabEl?.click();
                }}>
                <Target className="h-4 w-4 mr-2" />Take Assessment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Daily Challenge                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="challenge" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Zap className="h-6 w-6 text-amber-500" />Daily English Challenge</h2>
            <p className="text-sm text-muted-foreground mb-4">A new mini-exercise every day to keep your English sharp!</p>
          </div>

          <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10">
            <CardContent className="pt-6 pb-6">
              <div className="text-center mb-4">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-sm px-3 py-1">
                  Challenge #{challengeIdx + 1} — {DAILY_CHALLENGES[challengeIdx]?.type.toUpperCase()}
                </Badge>
              </div>

              <div className="max-w-lg mx-auto space-y-4">
                <p className="text-sm font-medium text-muted-foreground">{DAILY_CHALLENGES[challengeIdx]?.instruction}</p>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 text-center">
                  <p className="text-lg font-semibold">{DAILY_CHALLENGES[challengeIdx]?.prompt}</p>
                </div>

                {challengeRevealed ? (
                  <div className="space-y-3">
                    {DAILY_CHALLENGES[challengeIdx]?.answer && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />Answer:
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">{DAILY_CHALLENGES[challengeIdx].answer}</p>
                      </div>
                    )}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm flex items-start gap-1.5">
                        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-700 dark:text-blue-300">{DAILY_CHALLENGES[challengeIdx]?.hint}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button onClick={() => setChallengeRevealed(true)} className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-sm">
                      <Eye className="h-4 w-4 mr-2" />Reveal Answer
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 justify-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setChallengeIdx(prev => prev === 0 ? DAILY_CHALLENGES.length - 1 : prev - 1); setChallengeRevealed(false); }}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setChallengeIdx(prev => (prev + 1) % DAILY_CHALLENGES.length); setChallengeRevealed(false); }}>
                    Next Challenge
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
            <CardContent className="pt-5 pb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-500" />Want a personalised challenge?</h3>
                <p className="text-sm text-muted-foreground mt-1">Ask the AI Tutor for exercises tailored to your level and weak areas.</p>
              </div>
              <Button variant="outline"
                onClick={() => {
                  sendMessage(`Give me a quick English challenge suitable for ${selectedLevel} level. It should test grammar, vocabulary, or comprehension. Give me the exercise first, let me try, then correct me.`);
                  const tabEl = document.querySelector('[data-value="tutor"]') as HTMLElement;
                  tabEl?.click();
                }}>
                <Zap className="h-4 w-4 mr-2" />Get AI Challenge
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Resources                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="resources" className="space-y-4">
          <h2 className="text-xl font-bold mb-1">Free Resources & ESOL Courses</h2>
          <p className="text-sm text-muted-foreground mb-4">Free and affordable ways to learn English in the UK</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ESOL_INFO.map((info, i) => {
              const iconMap: Record<string, any> = { PoundSterling, School, Globe, MapPin, Headphones, FileText, Languages, BookOpen };
              const Icon = iconMap[info.icon] || BookOpen;
              return (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{info.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Useful links */}
          <h3 className="text-lg font-bold mt-4">Useful Links</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { name: 'British Council — Learn English', url: 'https://learnenglish.britishcouncil.org' },
              { name: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish' },
              { name: 'GOV.UK — Life in the UK Test', url: 'https://www.gov.uk/life-in-the-uk-test' },
              { name: 'IELTS Official', url: 'https://www.ielts.org' },
              { name: 'Trinity College London (SELT)', url: 'https://www.trinitycollege.com/qualifications/SELT' },
              { name: 'Cambridge English', url: 'https://www.cambridgeenglish.org' },
              { name: 'GOV.UK — Prove Your English Level', url: 'https://www.gov.uk/guidance/prove-your-english-language-abilities-with-a-secure-english-language-test-selt' },
              { name: 'PTE Academic', url: 'https://www.pearsonpte.com' },
              { name: 'Find ESOL Courses Near You', url: 'https://www.gov.uk/improve-english' },
              { name: 'English My Way (British Council)', url: 'https://www.englishmyway.co.uk' },
            ].map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm">
                <ExternalLink className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{link.name}</span>
              </a>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
