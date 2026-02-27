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
  Languages, School, FileText, Clock, PoundSterling, Target, Sparkles,
  RefreshCw,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  level: string;
}

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// ─── Data ───────────────────────────────────────────────────────────────

const CEFR_LEVELS: { level: CEFRLevel; name: string; description: string; color: string; skills: string[]; ukRelevance: string }[] = [
  { level: 'A1', name: 'Beginner', description: 'Can understand and use familiar everyday expressions and very basic phrases.', color: 'from-red-500 to-red-600', skills: ['Basic greetings', 'Simple questions', 'Numbers & dates', 'Introduce yourself'], ukRelevance: 'IELTS Life Skills A1 — Required for some family visas' },
  { level: 'A2', name: 'Elementary', description: 'Can communicate in simple and routine tasks on familiar topics.', color: 'from-orange-500 to-orange-600', skills: ['Shopping & ordering', 'Directions', 'Daily routines', 'Simple past events'], ukRelevance: 'Foundation for ESOL Entry Level 2' },
  { level: 'B1', name: 'Intermediate', description: 'Can deal with most situations likely to arise whilst travelling or living in the UK.', color: 'from-yellow-500 to-yellow-600', skills: ['Express opinions', 'Describe experiences', 'Write simple texts', 'Understand main points'], ukRelevance: '⭐ Required for ILR (Indefinite Leave to Remain) & British Citizenship' },
  { level: 'B2', name: 'Upper Intermediate', description: 'Can interact with a degree of fluency and spontaneity with native speakers.', color: 'from-green-500 to-green-600', skills: ['Complex discussions', 'News & articles', 'Workplace English', 'Academic writing'], ukRelevance: 'IELTS 5.5-6.5 — Required for many UK university courses' },
  { level: 'C1', name: 'Advanced', description: 'Can express ideas fluently and spontaneously. Can use language flexibly for social, academic and professional purposes.', color: 'from-blue-500 to-blue-600', skills: ['Professional presentations', 'Academic essays', 'Nuanced expression', 'Implicit meaning'], ukRelevance: 'IELTS 7.0+ — Required for postgraduate study & regulated professions' },
  { level: 'C2', name: 'Proficiency', description: 'Can understand with ease virtually everything heard or read. Near-native fluency.', color: 'from-purple-500 to-purple-600', skills: ['Idiomatic expression', 'Cultural subtlety', 'Academic research', 'Professional mastery'], ukRelevance: 'IELTS 8.0-9.0 — Top-level academic and professional English' },
];

const QUICK_TOPICS = [
  { label: 'GP Appointment', prompt: 'Let\'s practice booking a GP appointment. You be the receptionist.', icon: '🏥' },
  { label: 'Job Interview', prompt: 'Let\'s practice a basic job interview in English. You be the interviewer.', icon: '💼' },
  { label: 'At the Shop', prompt: 'Let\'s practice buying groceries at a supermarket. You be the cashier.', icon: '🛒' },
  { label: 'Renting a Flat', prompt: 'Let\'s practice viewing a flat and asking the landlord questions.', icon: '🏠' },
  { label: 'School Meeting', prompt: 'Let\'s practice a parent-teacher meeting at my child\'s school.', icon: '🎒' },
  { label: 'Council Tax', prompt: 'Let\'s practice calling the council about my council tax bill.', icon: '📋' },
  { label: 'Bank Account', prompt: 'Let\'s practice opening a bank account as a newcomer to the UK.', icon: '🏦' },
  { label: 'Grammar Help', prompt: 'I want to practice English grammar. Start with articles (a/an/the) — they confuse me.', icon: '📝' },
  { label: 'Pronunciation', prompt: 'Help me with English pronunciation. Give me 5 commonly mispronounced UK English words.', icon: '🗣️' },
  { label: 'Idioms & Slang', prompt: 'Teach me 5 British English idioms that I would hear in everyday life in the UK.', icon: '🇬🇧' },
];

const QUIZ_BANK: QuizQuestion[] = [
  // A1
  { id: 1, question: 'Choose the correct greeting for the morning:', options: ['Good night', 'Good morning', 'Good evening', 'Goodbye'], correct: 1, explanation: '"Good morning" is used from sunrise until noon. "Good evening" is after 6pm.', level: 'A1' },
  { id: 2, question: '"She ___ a student." Choose the correct verb:', options: ['am', 'is', 'are', 'be'], correct: 1, explanation: 'We use "is" with he/she/it. "I am", "you/we/they are".', level: 'A1' },
  { id: 3, question: 'What does "How much is it?" mean?', options: ['How old is it?', 'What is the price?', 'How big is it?', 'Where is it?'], correct: 1, explanation: '"How much is it?" is asking for the price of something.', level: 'A1' },
  // A2
  { id: 4, question: '"I ___ to the supermarket yesterday." Choose the correct verb:', options: ['go', 'went', 'gone', 'going'], correct: 1, explanation: '"Went" is the past simple of "go". We use past simple for completed actions in the past.', level: 'A2' },
  { id: 5, question: 'Which sentence is correct?', options: ['She don\'t like coffee', 'She doesn\'t like coffee', 'She not like coffee', 'She isn\'t like coffee'], correct: 1, explanation: 'With he/she/it in present simple negative, we use "doesn\'t" + base verb.', level: 'A2' },
  { id: 6, question: '"Can I have the ___, please?" (at a restaurant)', options: ['menu', 'bill', 'receipt', 'All of these are correct'], correct: 3, explanation: 'All three are correct! "Menu" to order, "bill" to pay, "receipt" as proof of payment.', level: 'A2' },
  // B1
  { id: 7, question: '"If it rains tomorrow, I ___ an umbrella." Choose:', options: ['will take', 'would take', 'took', 'had taken'], correct: 0, explanation: 'First conditional: If + present simple, will + base verb. Used for real/likely future situations.', level: 'B1' },
  { id: 8, question: '"I\'ve lived in London ___ three years." Choose the correct preposition:', options: ['since', 'for', 'during', 'from'], correct: 1, explanation: '"For" is used with periods of time (3 years, 2 months). "Since" is used with points in time (since 2022).', level: 'B1' },
  { id: 9, question: 'What does "I\'m over the moon" mean?', options: ['I\'m confused', 'I\'m very happy', 'I\'m scared', 'I\'m tired'], correct: 1, explanation: '"Over the moon" is a British idiom meaning extremely happy or delighted.', level: 'B1' },
  // B2
  { id: 10, question: '"The report ___ by the time you arrive." Choose:', options: ['will have been finished', 'will finish', 'is finishing', 'has finished'], correct: 0, explanation: 'Future perfect passive: "will have been + past participle". The action will be completed before a future point.', level: 'B2' },
  { id: 11, question: 'Which is the FORMAL way to complain?', options: ['This is rubbish!', 'I\'m afraid I need to raise a concern about...', 'You messed up!', 'Sort it out, mate!'], correct: 1, explanation: '"I\'m afraid I need to raise a concern..." is polite, professional British English for complaints.', level: 'B2' },
  { id: 12, question: '"She suggested ___ early." Complete correctly:', options: ['to leave', 'leaving', 'leave', 'left'], correct: 1, explanation: '"Suggest" is followed by the gerund (-ing form). "She suggested leaving early."', level: 'B2' },
  // C1
  { id: 13, question: '"Had I known about the delay, I ___ left earlier." Choose:', options: ['will have', 'would have', 'had', 'could'], correct: 1, explanation: 'Third conditional with inversion: "Had I known..." = "If I had known..." + would have + past participle.', level: 'C1' },
  { id: 14, question: 'What does "to be made redundant" mean in UK English?', options: ['To be promoted', 'To lose your job because the role no longer exists', 'To be transferred', 'To retire early'], correct: 1, explanation: '"Made redundant" means losing your job because the company no longer needs that position — not because of poor performance.', level: 'C1' },
  // C2
  { id: 15, question: '"The minister\'s comments were met with ___ criticism." Choose the most precise word:', options: ['big', 'heavy', 'scathing', 'much'], correct: 2, explanation: '"Scathing" means severely critical. It\'s a precise, C2-level adjective showing harsh condemnation.', level: 'C2' },
];

const UK_EXAMS = [
  { name: 'IELTS Life Skills', levels: 'A1 / B1', purpose: 'UK visa & immigration (family, ILR, citizenship)', cost: '£150-170', format: 'Speaking & Listening only, 16-22 mins', link: 'https://www.ielts.org/take-a-test/ielts-life-skills' },
  { name: 'IELTS Academic', levels: 'B1-C2', purpose: 'University admission, professional registration', cost: '£195-210', format: '4 sections: Listening, Reading, Writing, Speaking — 2h 45m', link: 'https://www.ielts.org' },
  { name: 'IELTS General Training', levels: 'B1-C2', purpose: 'Work visa, migration, general English proof', cost: '£195-210', format: '4 sections: Listening, Reading, Writing, Speaking — 2h 45m', link: 'https://www.ielts.org' },
  { name: 'Trinity GESE', levels: 'A1-C2', purpose: 'UK visa (SELT approved), general English certification', cost: '£130-180', format: 'Face-to-face speaking exam, 5-25 mins by grade', link: 'https://www.trinitycollege.com/qualifications/SELT' },
  { name: 'Trinity ISE', levels: 'A2-C2', purpose: 'Academic English, professional development', cost: '£150-200', format: 'Reading, Writing, Speaking & Listening modules', link: 'https://www.trinitycollege.com/qualifications/english-language/ISE' },
  { name: 'PTE Academic', levels: 'B1-C2', purpose: 'University admission, UK visa applications', cost: '£170-190', format: 'Computer-based: Speaking, Writing, Reading, Listening — 2h', link: 'https://www.pearsonpte.com' },
  { name: 'Cambridge B2 First', levels: 'B2', purpose: 'Proof of upper-intermediate English', cost: '£165-190', format: 'Reading, Writing, Listening, Speaking — 3.5h', link: 'https://www.cambridgeenglish.org/exams-and-tests/first/' },
  { name: 'Cambridge C1 Advanced', levels: 'C1', purpose: 'High-level academic and professional English', cost: '£175-200', format: 'Reading, Writing, Listening, Speaking — 4h', link: 'https://www.cambridgeenglish.org/exams-and-tests/advanced/' },
];

const ESOL_INFO = [
  { title: 'Free ESOL Courses', description: 'If you\'ve been in the UK for 3+ years (or have refugee/asylum status), you can access FREE ESOL courses at local colleges through the Adult Education Budget.', icon: PoundSterling },
  { title: 'Local Colleges', description: 'Search for ESOL courses at your local FE (Further Education) college. Most offer Entry Level 1-3, Level 1 and Level 2 courses.', icon: School },
  { title: 'British Council', description: 'Free online resources, grammar exercises, and listening practice at learnenglish.britishcouncil.org.', icon: Globe },
  { title: 'Learn My Way', description: 'Free digital skills and English courses at local UK Online Centres. Find your nearest at learnmyway.com.', icon: MapPin },
  { title: 'BBC Learning English', description: 'Free courses, videos, and podcasts for all levels at bbc.co.uk/learningenglish.', icon: Headphones },
  { title: 'Duolingo / Babbel', description: 'Mobile apps for daily practice. Duolingo is free; Babbel has UK-focused content with subscription.', icon: Languages },
];

const LIFE_IN_UK_FACTS = [
  { q: 'How many questions are in the Life in the UK Test?', a: '24 questions', detail: 'You need 18 correct (75%) to pass.' },
  { q: 'How much does the test cost?', a: '£50', detail: 'You can retake it as many times as needed, but pay each time.' },
  { q: 'How long do you have?', a: '45 minutes', detail: 'Most people finish in 15-20 minutes.' },
  { q: 'Where do you take the test?', a: 'Approved test centres across the UK', detail: 'Book at gov.uk/life-in-the-uk-test. You need to bring your BRP or passport.' },
  { q: 'What topics does it cover?', a: 'UK values, history, traditions and everyday life', detail: 'Topics include: The development of democracy, the UK government, UK law, religion, customs, and famous landmarks.' },
  { q: 'Do I need it for ILR?', a: 'Yes — both ILR and British Citizenship require the Life in the UK Test', detail: 'Exemptions exist for under 18s, over 65s, and certain medical conditions.' },
];

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

  // Quiz
  const [quizLevel, setQuizLevel] = useState<CEFRLevel>('B1');
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Chat history for AI context
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // ─── Init ──────────────────────────────────────────────────────────

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    setTtsSupported('speechSynthesis' in window);
    // Pre-load TTS voices (some browsers need voiceschanged event)
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
    if (!msg) return;

    const userMsg: ChatMessage = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const levelContext = `[User's current CEFR level: ${selectedLevel}. Adapt your language complexity accordingly.]`;
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: `${levelContext}\n\n${msg}`,
          context: 'english',
          history: chatHistory.slice(-10),
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, assistantMsg]);
      setChatHistory(prev => [...prev, userMsg, assistantMsg]);

      // Auto-speak response (new message will be at current messages.length + 1 index, since user msg was already added)
      if (autoSpeak && ttsSupported) {
        // The assistant message is the last one added
        setSpeakingIdx(messages.length + 1);
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

    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: 'Speech not recognised', description: 'Please try again or type your message', variant: 'destructive' });
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

    // Clean markdown-style formatting for speech
    const clean = text
      .replace(/[#*_`~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .substring(0, 2000);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to get a British voice
    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Female'))
      || voices.find(v => v.lang === 'en-GB')
      || voices.find(v => v.lang.startsWith('en'));
    if (britishVoice) utterance.voice = britishVoice;

    utterance.onstart = () => {};
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

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

  // ─── Quiz ──────────────────────────────────────────────────────────

  const startQuiz = (level: CEFRLevel) => {
    const questions = QUIZ_BANK.filter(q => q.level === level);
    if (questions.length === 0) {
      toast({ title: 'No questions available for this level yet', variant: 'destructive' });
      return;
    }
    setQuizLevel(level);
    setCurrentQuiz(questions);
    setQuizIndex(0);
    setQuizAnswers(new Array(questions.length).fill(null));
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const answerQuiz = (optionIdx: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...quizAnswers];
    newAnswers[quizIndex] = optionIdx;
    setQuizAnswers(newAnswers);
  };

  const submitQuiz = () => {
    let score = 0;
    currentQuiz.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  // ─── Render helpers ────────────────────────────────────────────────

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  };

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-white/20">
              <Languages className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">English Hub</h1>
            <Badge className="bg-white/20 text-white border-0">AI-Powered</Badge>
          </div>
          <p className="text-white/80 max-w-2xl">
            Learn English for life in the UK — practice speaking with AI, prepare for IELTS & B1 exams,
            and build the confidence you need for work, study, and daily life.
          </p>
          <div className="flex gap-3 mt-4 flex-wrap">
            <Badge className="bg-white/20 text-white border-0 gap-1"><Mic className="h-3 w-3" /> Voice Practice</Badge>
            <Badge className="bg-white/20 text-white border-0 gap-1"><Headphones className="h-3 w-3" /> Listen & Learn</Badge>
            <Badge className="bg-white/20 text-white border-0 gap-1"><Brain className="h-3 w-3" /> AI Tutor</Badge>
            <Badge className="bg-white/20 text-white border-0 gap-1"><GraduationCap className="h-3 w-3" /> Exam Prep</Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tutor" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto gap-1">
          <TabsTrigger value="tutor" className="gap-1.5"><MessageCircle className="h-4 w-4" /> AI Tutor</TabsTrigger>
          <TabsTrigger value="levels" className="gap-1.5"><Target className="h-4 w-4" /> CEFR Levels</TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5"><PenTool className="h-4 w-4" /> Practice Quiz</TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5"><GraduationCap className="h-4 w-4" /> UK Exams</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5"><BookOpen className="h-4 w-4" /> Resources</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* AI TUTOR TAB                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="tutor" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            {/* Chat Area */}
            <Card className="flex flex-col" style={{ minHeight: '600px' }}>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      English AI Tutor
                    </CardTitle>
                    <CardDescription>Practice speaking, grammar, vocabulary, and real UK scenarios</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedLevel} onValueChange={v => setSelectedLevel(v as CEFRLevel)}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map(l => (
                          <SelectItem key={l.level} value={l.level}>{l.level} — {l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ttsSupported && (
                      <Button
                        size="sm"
                        variant={autoSpeak ? 'default' : 'outline'}
                        className="h-8 text-xs gap-1"
                        onClick={() => setAutoSpeak(!autoSpeak)}
                        title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
                      >
                        {autoSpeak ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                        {autoSpeak ? 'Sound ON' : 'Sound OFF'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '450px' }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                    <Languages className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-1">Welcome to your English Tutor!</p>
                    <p className="text-sm max-w-md mb-4">
                      Type or speak to practice English. I&apos;ll adapt to your {selectedLevel} level,
                      correct your mistakes gently, and help you prepare for life in the UK.
                    </p>
                    <p className="text-xs text-muted-foreground">Try a quick topic from the sidebar →</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        {msg.role === 'assistant' && ttsSupported && (
                          <div className="flex gap-1 mt-2 pt-2 border-t border-border/30">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs gap-1 px-2"
                              onClick={() => speakingIdx === i ? stopSpeaking() : speakMessage(msg.content, i)}
                            >
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
              {/* Input area */}
              <div className="p-4 border-t">
                <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      placeholder={isListening ? 'Listening... speak now' : 'Type or speak your message...'}
                      disabled={sending || isListening}
                      className={isListening ? 'border-red-500 animate-pulse' : ''}
                    />
                  </div>
                  {speechSupported && (
                    <Button
                      type="button"
                      size="icon"
                      variant={isListening ? 'destructive' : 'outline'}
                      onClick={isListening ? stopListening : startListening}
                      disabled={sending}
                      title={isListening ? 'Stop listening' : 'Speak'}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button type="submit" disabled={sending || !inputMessage.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
                {speechSupported && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                    🎤 Click the mic to practice speaking in English — your speech will be converted to text
                  </p>
                )}
              </div>
            </Card>

            {/* Quick Topics Sidebar */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Quick Topics</h3>
              {QUICK_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(topic.prompt)}
                  disabled={sending}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm flex items-center gap-2.5 group"
                >
                  <span className="text-lg">{topic.icon}</span>
                  <span className="flex-1 font-medium">{topic.label}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}

              <div className="pt-3 border-t">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Level</h4>
                <div className={`rounded-lg p-3 bg-gradient-to-r ${CEFR_LEVELS.find(l => l.level === selectedLevel)?.color} text-white`}>
                  <p className="font-bold text-lg">{selectedLevel}</p>
                  <p className="text-xs text-white/80">{CEFR_LEVELS.find(l => l.level === selectedLevel)?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CEFR LEVELS TAB                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="levels" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-1">CEFR English Levels</h2>
            <p className="text-muted-foreground text-sm">The Common European Framework of Reference — your roadmap from beginner to fluency</p>
          </div>

          {/* Visual Roadmap */}
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-300 via-green-300 to-purple-300 hidden md:block" />

            <div className="space-y-4">
              {CEFR_LEVELS.map((level) => (
                <Card key={level.level} className="relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${level.color}`} />
                  <CardContent className="pt-5 pb-5 pl-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Level badge */}
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${level.color} text-white flex flex-col items-center justify-center shadow-lg`}>
                        <span className="text-lg font-bold">{level.level}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-80">{level.name.split(' ')[0]}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <h3 className="font-bold text-base">{level.level} — {level.name}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{level.description}</p>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { setSelectedLevel(level.level); startQuiz(level.level); }}>
                            <PenTool className="h-3 w-3" /> Practice
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {level.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                        </div>

                        {/* UK Relevance */}
                        <div className="mt-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-xs">
                          <span className="font-semibold text-blue-700 dark:text-blue-400">🇬🇧 UK Relevance: </span>
                          <span className="text-blue-600 dark:text-blue-300">{level.ukRelevance}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Visa Requirements Quick Reference */}
          <Card className="border-2 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                English Requirements for UK Visas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { visa: 'Spouse / Family Visa', level: 'A1', exam: 'IELTS Life Skills A1' },
                  { visa: 'Indefinite Leave to Remain (ILR)', level: 'B1', exam: 'IELTS Life Skills B1 or Trinity GESE' },
                  { visa: 'British Citizenship', level: 'B1', exam: 'IELTS Life Skills B1 or Trinity GESE' },
                  { visa: 'Skilled Worker Visa', level: 'B1', exam: 'IELTS General Training 4.0+' },
                  { visa: 'Student Visa (Degree)', level: 'B2', exam: 'IELTS Academic 5.5-6.0+' },
                  { visa: 'Student Visa (Postgrad)', level: 'C1', exam: 'IELTS Academic 6.5-7.0+' },
                ].map(v => (
                  <div key={v.visa} className="p-3 rounded-lg border bg-card">
                    <p className="font-semibold text-sm">{v.visa}</p>
                    <Badge className="mt-1 text-xs" variant="outline">{v.level} Required</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{v.exam}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* PRACTICE QUIZ TAB                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="quiz" className="space-y-4">
          {currentQuiz.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500 opacity-40" />
              <h2 className="text-xl font-bold mb-2">Practice Quizzes</h2>
              <p className="text-muted-foreground mb-6">Test your English knowledge at each CEFR level</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
                {CEFR_LEVELS.map(level => {
                  const count = QUIZ_BANK.filter(q => q.level === level.level).length;
                  return (
                    <button
                      key={level.level}
                      onClick={() => startQuiz(level.level)}
                      disabled={count === 0}
                      className={`p-4 rounded-xl bg-gradient-to-br ${level.color} text-white shadow-lg hover:scale-105 transition-transform disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      <p className="text-2xl font-bold">{level.level}</p>
                      <p className="text-xs opacity-80">{level.name}</p>
                      <p className="text-[10px] mt-1 opacity-60">{count} questions</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : quizSubmitted ? (
            /* Quiz Results */
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-3">
                  {quizScore === currentQuiz.length ? (
                    <Trophy className="h-16 w-16 text-yellow-500" />
                  ) : quizScore >= currentQuiz.length * 0.7 ? (
                    <Star className="h-16 w-16 text-green-500" />
                  ) : (
                    <Target className="h-16 w-16 text-orange-500" />
                  )}
                </div>
                <CardTitle>
                  {quizScore === currentQuiz.length ? 'Perfect Score!' : quizScore >= currentQuiz.length * 0.7 ? 'Great Job!' : 'Keep Practicing!'}
                </CardTitle>
                <CardDescription>
                  You scored {quizScore} / {currentQuiz.length} ({Math.round(quizScore / currentQuiz.length * 100)}%) at {quizLevel} level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQuiz.map((q, i) => {
                  const isCorrect = quizAnswers[i] === q.correct;
                  return (
                    <div key={q.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10' : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10'}`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" /> : <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{q.question}</p>
                          {!isCorrect && (
                            <p className="text-xs mt-1">
                              <span className="text-red-600">Your answer: {q.options[quizAnswers[i]!]}</span>
                              <span className="mx-2">→</span>
                              <span className="text-green-600 font-semibold">Correct: {q.options[q.correct]}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 p-2 rounded">💡 {q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => startQuiz(quizLevel)}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentQuiz([])}>
                    Choose Another Level
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Quiz In Progress */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Level {quizLevel} Quiz</CardTitle>
                    <CardDescription>Question {quizIndex + 1} of {currentQuiz.length}</CardDescription>
                  </div>
                  <Badge variant="outline">{quizLevel} — {CEFR_LEVELS.find(l => l.level === quizLevel)?.name}</Badge>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${((quizIndex + 1) / currentQuiz.length) * 100}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium">{currentQuiz[quizIndex].question}</p>
                <div className="grid gap-2">
                  {currentQuiz[quizIndex].options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => answerQuiz(oi)}
                      className={`text-left p-3.5 rounded-lg border-2 transition-all text-sm ${
                        quizAnswers[quizIndex] === oi
                          ? 'border-primary bg-primary/5 font-semibold'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold mr-2.5">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    disabled={quizIndex === 0}
                    onClick={() => setQuizIndex(i => i - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    {quizIndex < currentQuiz.length - 1 ? (
                      <Button
                        disabled={quizAnswers[quizIndex] === null}
                        onClick={() => setQuizIndex(i => i + 1)}
                      >
                        Next <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        disabled={quizAnswers.some(a => a === null)}
                        onClick={submitQuiz}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Submit Quiz
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* UK EXAMS TAB                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="exams" className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-1">UK English Exams & Certifications</h2>
            <p className="text-muted-foreground text-sm">Official exams accepted for UK visas, university admission, and professional certification</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {UK_EXAMS.map(exam => (
              <Card key={exam.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{exam.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{exam.levels}</Badge>
                  </div>
                  <CardDescription className="text-xs">{exam.purpose}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PoundSterling className="h-3.5 w-3.5" />
                      <span>{exam.cost}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{exam.format}</span>
                    </div>
                    <a
                      href={exam.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      Visit official website <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Life in the UK Test */}
          <Card className="border-2 border-blue-200 dark:border-blue-800 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🇬🇧</span> Life in the UK Test
              </CardTitle>
              <CardDescription>Required for ILR and British Citizenship — alongside the English language requirement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {LIFE_IN_UK_FACTS.map((fact, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground">{fact.q}</p>
                    <p className="font-bold text-base mt-0.5">{fact.a}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fact.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-sm">
                <p className="font-semibold text-blue-700 dark:text-blue-300">📚 Study Material</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  The official study guide is &quot;Life in the United Kingdom: A Guide for New Residents&quot; (3rd edition).
                  Available at bookshops and libraries. Practice tests available at <a href="https://lifeintheuktests.co.uk" target="_blank" rel="noopener noreferrer" className="underline">lifeintheuktests.co.uk</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* RESOURCES TAB                                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="resources" className="space-y-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-1">Where to Learn English in the UK</h2>
            <p className="text-muted-foreground text-sm">Free and affordable resources for immigrants</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ESOL_INFO.map((info, i) => {
              const Icon = info.icon;
              return (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      {info.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">{info.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Funding info */}
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PoundSterling className="h-5 w-5 text-green-600" />
                Free English Courses — Am I Eligible?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>You may be eligible for <strong>fully funded ESOL courses</strong> if you meet any of these criteria:</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    'Refugee or asylum seeker',
                    'Receiving Universal Credit or JSA',
                    'Earning below the national minimum wage',
                    'Been in the UK for 3+ years with settled status',
                    'UK/EU/EEA citizen or family member',
                    'Have a Biometric Residence Permit',
                  ].map(criterion => (
                    <div key={criterion} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{criterion}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-xs">
                  <p className="font-semibold text-green-700 dark:text-green-300">💡 How to find courses</p>
                  <p className="text-green-600 dark:text-green-400 mt-1">
                    Search &quot;ESOL courses near me&quot; on <a href="https://nationalcareers.service.gov.uk/find-a-course" target="_blank" rel="noopener noreferrer" className="underline">nationalcareers.service.gov.uk</a> or
                    contact your local council&apos;s adult education service.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Useful Apps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Languages className="h-5 w-5 text-indigo-500" />
                Recommended Apps & Websites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'Duolingo', type: 'App (Free)', desc: 'Gamified daily lessons, good for beginners', stars: 5 },
                  { name: 'BBC Learning English', type: 'Website & App (Free)', desc: 'News-based lessons, grammar, pronunciation', stars: 5 },
                  { name: 'British Council — Learn English', type: 'Website & App (Free)', desc: 'Comprehensive grammar, vocabulary, skills', stars: 5 },
                  { name: 'Babbel', type: 'App (Subscription)', desc: 'Structured courses with speech recognition', stars: 4 },
                  { name: 'IELTS Prep by British Council', type: 'App (Free)', desc: 'Official practice for IELTS exam', stars: 4 },
                  { name: 'English Sounds — Pronunciation', type: 'App (Free)', desc: 'IPA chart with audio for all English sounds', stars: 4 },
                ].map(app => (
                  <div key={app.name} className="p-3 rounded-lg border">
                    <p className="font-semibold text-sm">{app.name}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">{app.type}</Badge>
                    <p className="text-xs text-muted-foreground mt-1.5">{app.desc}</p>
                    <div className="flex gap-0.5 mt-1.5">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star key={si} className={`h-3 w-3 ${si < app.stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
