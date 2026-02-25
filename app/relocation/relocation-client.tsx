'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Globe, Send, Loader2, Bot, User, AlertTriangle, ExternalLink,
  ShieldAlert, ArrowRight, BookOpen, CreditCard, Building2,
  Landmark, Heart, Phone, Home, Briefcase, GraduationCap,
  FileText, MapPin, HelpCircle,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_TOPICS = [
  { label: 'National Insurance Number', icon: FileText, prompt: 'How do I get a National Insurance Number (NIN) in the UK? What documents do I need and what is the process?' },
  { label: 'Open a Bank Account', icon: CreditCard, prompt: 'How can I open a UK bank account as a newcomer? Which banks are most immigrant-friendly?' },
  { label: 'Register with a GP', icon: Heart, prompt: 'How do I register with a GP (doctor) in the UK? Is the NHS free for everyone?' },
  { label: 'Council Tax', icon: Building2, prompt: 'What is Council Tax and how do I register? Are there any discounts available?' },
  { label: 'Renting in the UK', icon: Home, prompt: 'What should I know about renting in the UK? What are my rights as a tenant? What documents do landlords typically require?' },
  { label: 'Driving Licence', icon: MapPin, prompt: 'How do I get a UK driving licence? Can I exchange my foreign licence?' },
  { label: 'Electoral Register', icon: Landmark, prompt: 'Should I register on the electoral roll? How does it affect my credit score?' },
  { label: 'TV Licence', icon: Phone, prompt: 'Do I need a TV Licence in the UK? What does it cover and how much does it cost?' },
  { label: 'Education System', icon: GraduationCap, prompt: 'How does the UK education system work? What are the key stages and school types?' },
  { label: 'Finding Work', icon: Briefcase, prompt: 'What do I need to know about working in the UK? What is a right to work check?' },
];

const OISC_DISCLAIMER = `⚠️ IMPORTANT LEGAL NOTICE

This AI assistant provides GENERAL ADMINISTRATIVE INFORMATION ONLY based on publicly available GOV.UK resources.

It is NOT an OISC-registered immigration advisor and CANNOT provide immigration advice as defined by the Immigration and Asylum Act 1999.

For visa applications, immigration appeals, asylum claims, or any complex immigration matters, please consult:
• An OISC-registered advisor — oisc.gov.uk
• A qualified immigration solicitor — solicitors.lawsociety.org.uk`;

export function RelocationClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: text,
          context: 'immigration',
          history,
        }),
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      const aiMsg: ChatMessage = { role: 'assistant', content: data.answer || 'No response received.', timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      toast({ title: 'Failed to get response', variant: 'destructive' });
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your request. Please try again.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Globe className="h-8 w-8 text-blue-500" />
          Immigrant Relocation Hub
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Your AI guide to settling in the United Kingdom
        </p>
      </div>

      {/* OISC Disclaimer Banner */}
      {showDisclaimer && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-800 dark:text-amber-300">Legal Disclaimer</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 whitespace-pre-line">
                  {OISC_DISCLAIMER}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <a
                    href="https://www.gov.uk/government/organisations/office-of-the-immigration-services-commissioner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 underline hover:text-amber-900"
                  >
                    <ExternalLink className="h-3 w-3" /> OISC Website
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDisclaimer(false)}
                    className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/40"
                  >
                    I Understand
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="min-h-[500px] flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Globe className="h-16 w-16 text-blue-500/30 mb-4" />
                    <h3 className="font-semibold text-lg">Welcome to the Relocation Hub</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      Ask any question about settling in the UK — from getting your NIN to opening a bank account, registering with a GP, and more.
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">Choose a topic on the right, or type your question below.</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-blue-500" />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-slate-100 dark:bg-slate-800 rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="p-4 rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
                    placeholder="Ask about settling in the UK..."
                    className="flex-1 px-4 py-3 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={loading}
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="px-4"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  General information only — not immigration advice. Consult OISC for visa/immigration matters.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — Quick Topics + Services */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" /> Quick Topics
              </h3>
              <div className="space-y-2">
                {QUICK_TOPICS.map(topic => {
                  const Icon = topic.icon;
                  return (
                    <button
                      key={topic.label}
                      onClick={() => sendMessage(topic.prompt)}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <Icon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">{topic.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Services CTA */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Need hands-on help?</h3>
              <p className="text-xs text-muted-foreground">
                Our professional team can handle NIN registration, bank account setup, company formation, and more.
              </p>
              <Button
                size="sm"
                onClick={() => router.push('/services')}
                className="w-full"
              >
                View Services <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Useful links */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> Useful Links
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'GOV.UK — Living in the UK', url: 'https://www.gov.uk/browse/visas-immigration/settle-in-the-uk' },
                  { label: 'NHS — Register with a GP', url: 'https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/' },
                  { label: 'OISC — Immigration Advisors', url: 'https://www.gov.uk/find-an-immigration-adviser' },
                  { label: 'Council Tax Bands', url: 'https://www.gov.uk/council-tax-bands' },
                  { label: 'UK Visa & Immigration', url: 'https://www.gov.uk/government/organisations/uk-visas-and-immigration' },
                ].map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
