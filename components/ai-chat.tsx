'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bot, X, Send, Loader2, MessageSquare, Minimize2, Maximize2, Sparkles, Mic, MicOff,
  ThumbsUp, ThumbsDown, Brain, History, Plus, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  feedbackGiven?: 'up' | 'down' | null;
}

interface ConversationSummary {
  id: string;
  section: string;
  title: string;
  updatedAt: string;
}

interface AiChatProps {
  section: string;
  context?: any;
  placeholder?: string;
}

export function AiChat({ section, context, placeholder = 'Ask Clarity & Co AI...' }: AiChatProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context, section, conversationId }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply, feedbackGiven: null }]);
        if (data.conversationId) setConversationId(data.conversationId);
      } else {
        setMessages([...newMessages, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        }]);
      }
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Connection error. Please check your internet and try again.',
      }]);
    }
    setLoading(false);
  };

  const handleFeedback = async (msgIndex: number, rating: 1 | 2) => {
    const msg = messages[msgIndex];
    if (!msg || msg.role !== 'assistant') return;
    const prevUserMsg = messages[msgIndex - 1];
    if (!prevUserMsg) return;

    const updated = [...messages];
    updated[msgIndex] = { ...msg, feedbackGiven: rating === 2 ? 'up' : 'down' };
    setMessages(updated);

    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          section,
          userMessage: prevUserMsg.content,
          aiResponse: msg.content,
          rating,
        }),
      });
    } catch {}
  };

  const loadConversations = async () => {
    try {
      const res = await fetch(`/api/ai/conversations?section=${section}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
  };

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations?section=${section}`);
      if (res.ok) {
        const allConvs = await res.json();
        const conv = allConvs.find((c: any) => c.id === convId);
        if (conv) {
          // Fetch full conversation with messages
          const fullRes = await fetch(`/api/ai/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: convId, messages: [] }),
          });
          if (fullRes.ok) {
            const fullConv = await fullRes.json();
            const msgs = (fullConv.messages || []).map((m: any) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
              feedbackGiven: null,
            }));
            setMessages(msgs);
            setConversationId(convId);
          }
        }
      }
      setShowHistory(false);
    } catch {}
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-GB';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-amber-500 dark:to-amber-400 text-white dark:text-slate-900 rounded-full px-5 py-3 shadow-lg hover:shadow-xl transition-all group"
      >
        <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
        <span className="text-sm font-medium">AI Assistant</span>
      </button>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-2xl shadow-xl w-72">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setMinimized(false)}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Clarity & Co AI</p>
              <p className="text-xs text-muted-foreground">{messages.length} messages</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); setMinimized(false); }} className="p-1 hover:bg-muted rounded">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); setMessages([]); }} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '70vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Clarity & Co AI</p>
            <p className="text-xs text-slate-300 capitalize">{section} assistant</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Minimize2 className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadConversations(); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Chat history"
          >
            <History className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={startNewConversation}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="New conversation"
          >
            <Plus className="h-4 w-4 text-white" />
          </button>
          <button onClick={() => { setOpen(false); setMessages([]); setConversationId(null); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Conversation History Panel */}
      {showHistory && (
        <div className="border-b bg-muted/50 px-3 py-2 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">Recent conversations</p>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No previous conversations</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={cn(
                  'block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors mb-1 truncate',
                  conv.id === conversationId ? 'bg-primary/10 text-primary' : 'text-foreground'
                )}
              >
                <span className="font-medium">{conv.title || 'Untitled'}</span>
                <span className="text-muted-foreground ml-1">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '200px', maxHeight: '50vh' }}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Ask me anything about your finances</p>
            <div className="mt-4 space-y-2">
              {getSuggestions(section).map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="block w-full text-left text-xs text-primary bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-slate-700 to-slate-600 dark:from-amber-500 dark:to-amber-400 text-white dark:text-slate-900 rounded-br-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-md'
              )}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'assistant' && !msg.content.startsWith('Sorry') && !msg.content.startsWith('Connection') && (
              <div className="flex items-center gap-1 mt-1 ml-1">
                <button
                  onClick={() => handleFeedback(i, 2)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    msg.feedbackGiven === 'up'
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : 'text-muted-foreground/40 hover:text-emerald-500 hover:bg-emerald-500/10'
                  )}
                  title="Good response"
                  disabled={msg.feedbackGiven !== undefined && msg.feedbackGiven !== null}
                >
                  <ThumbsUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleFeedback(i, 1)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    msg.feedbackGiven === 'down'
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10'
                  )}
                  title="Poor response"
                  disabled={msg.feedbackGiven !== undefined && msg.feedbackGiven !== null}
                >
                  <ThumbsDown className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-3 py-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : placeholder}
            disabled={loading}
            className={`flex-1 text-sm ${isListening ? 'border-red-400 dark:border-red-500' : ''}`}
          />
          <Button
            size="sm"
            variant={isListening ? 'destructive' : 'outline'}
            onClick={toggleVoice}
            className="px-2.5"
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            onClick={() => { if (isListening) { recognitionRef.current?.stop(); setIsListening(false); } handleSend(); }}
            disabled={loading || !input.trim()}
            className="px-3"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getSuggestions(section: string): string[] {
  const suggestions: Record<string, string[]> = {
    general: [
      'What are my biggest expenses this month?',
      'How can I reduce my household bills?',
      'What tax deductions am I eligible for?',
    ],
    statements: [
      'Explain my spending patterns',
      'Which transactions should I categorise?',
      'Are there any unusual transactions?',
    ],
    invoices: [
      'Which invoices are overdue?',
      'What expenses can I claim for tax?',
      'Help me understand this invoice',
    ],
    bills: [
      'Am I overpaying for utilities?',
      'When are my next bill payments due?',
      'How to reduce council tax bill?',
    ],
    reports: [
      'Help me with Self Assessment',
      'What HMRC category is this expense?',
      'When is the SA deadline?',
    ],
    categories: [
      'Which HMRC categories should I use?',
      'Is this expense tax deductible?',
      'Help me organize my categories',
    ],
    documents: [
      'What type of document is this?',
      'Help me understand this letter',
      'What action do I need to take?',
    ],
    vault: [
      'What reference numbers do I need?',
      'How to find my UTR number?',
      'Best practices for password security',
    ],
    life: [
      'How to register with a GP?',
      'Council tax band explained',
      'DVLA driving licence renewal',
    ],
    insurance: [
      'Is my car insurance a good price?',
      'When should I renew my policies?',
      'How does no-claims discount work?',
    ],
    properties: [
      'Should I fix my mortgage rate?',
      'What is SDLT on a £300k property?',
      'How to calculate rental yield?',
    ],
    projections: [
      'Help me create a monthly budget',
      'What is the 50/30/20 rule?',
      'How to pay off debts faster?',
    ],
    'tax-timeline': [
      'When is the Self Assessment deadline?',
      'What CT600 deadlines do I have?',
      'Help me plan my tax year',
    ],
    transfers: [
      'What standing orders should I review?',
      'How to set up a direct debit?',
      'Best day to schedule payments?',
    ],
    correspondence: [
      'What does this HMRC letter mean?',
      'Do I need to respond to this?',
      'Help me draft a reply',
    ],
    household: [
      'How do household roles work?',
      'Can I share data with my partner?',
      'How to invite a family member?',
    ],
    relocation: [
      'How to get a National Insurance number?',
      'Steps to open a UK bank account',
      'How to register with a GP?',
    ],
  };
  return suggestions[section] || suggestions.general;
}
