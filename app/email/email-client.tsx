'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  Mail, Plus, RefreshCw, Send, Star, Trash2, Archive, Inbox, FileEdit,
  ChevronRight, Paperclip, Search, X, MoreVertical, Reply, Forward,
  AlertCircle, Check, Clock, Eye, EyeOff, Settings, Pen, ArrowLeft,
  FolderOpen, StarOff, MailOpen, Loader2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────
interface EmailAccount {
  id: string; email: string; displayName: string; provider: string;
  color: string; isActive: boolean; lastSyncAt: string | null;
  folders: EmailFolder[]; _count: { messages: number };
  signature?: { id: string; name: string } | null;
}
interface EmailFolder {
  id: string; name: string; path: string; type: string;
  unreadCount: number; totalCount: number;
}
interface EmailMsg {
  id: string; subject: string; fromAddress: string; fromName: string | null;
  toAddresses: string[]; snippet: string | null; isRead: boolean;
  isStarred: boolean; isDraft: boolean; hasAttachments: boolean;
  receivedAt: string; sentAt: string | null; aiCategory: string | null;
  aiSummary: string | null; folderId: string;
  folder: { name: string; type: string };
  bodyHtml?: string; bodyText?: string;
  attachments?: { id: string; filename: string; contentType: string; size: number }[];
}
interface Signature { id: string; name: string; bodyHtml: string; isDefault: boolean; }

const FOLDER_ICONS: Record<string, any> = {
  inbox: Inbox, sent: Send, drafts: FileEdit, trash: Trash2,
  spam: AlertCircle, archive: Archive, custom: FolderOpen,
};

const PROVIDER_PRESETS = [
  { key: 'gmail', label: 'Gmail', color: '#ea4335' },
  { key: 'outlook', label: 'Outlook / Hotmail', color: '#0078d4' },
  { key: 'yahoo', label: 'Yahoo Mail', color: '#6001d2' },
  { key: 'icloud', label: 'iCloud Mail', color: '#157efb' },
  { key: 'hostinger', label: 'Hostinger Email', color: '#673de6' },
  { key: 'imap', label: 'Other (IMAP/SMTP)', color: '#6b7280' },
];

export function EmailClient() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMsg[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<EmailMsg | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<EmailMsg | null>(null);

  // Add account dialog
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProvider, setNewProvider] = useState('gmail');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newImapHost, setNewImapHost] = useState('');
  const [newImapPort, setNewImapPort] = useState('');
  const [newSmtpHost, setNewSmtpHost] = useState('');
  const [newSmtpPort, setNewSmtpPort] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);
  const [addError, setAddError] = useState('');

  // Signatures
  const [showSignatures, setShowSignatures] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [sigName, setSigName] = useState('');
  const [sigBody, setSigBody] = useState('');
  const [editingSigId, setEditingSigId] = useState<string | null>(null);

  // ── Fetch accounts ──────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/email/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
        if (data.length > 0 && !activeAccountId) {
          setActiveAccountId(data[0].id);
          const inboxFolder = data[0].folders?.find((f: EmailFolder) => f.type === 'inbox');
          if (inboxFolder) setActiveFolderId(inboxFolder.id);
        }
      }
    } catch { } finally { setLoading(false); }
  }, [activeAccountId]);

  // ── Fetch messages ──────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!activeAccountId) return;
    try {
      const params = new URLSearchParams({ accountId: activeAccountId, page: String(page), limit: '30' });
      if (activeFolderId) params.set('folderId', activeFolderId);
      const res = await fetch(`/api/email/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTotalMessages(data.total || 0);
      }
    } catch { }
  }, [activeAccountId, activeFolderId, page]);

  // ── Fetch single message ────────────────────────────────────────────
  const fetchMessageBody = async (msgId: string) => {
    if (!activeAccountId) return;
    const res = await fetch(`/api/email/messages?accountId=${activeAccountId}&messageId=${msgId}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedMsg(data);
      // Update list to mark as read
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRead: true } : m));
    }
  };

  // ── Sync ────────────────────────────────────────────────────────────
  const syncAccount = async () => {
    if (!activeAccountId) return;
    setSyncing(true);
    try {
      await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: activeAccountId, folderId: activeFolderId }),
      });
      await fetchMessages();
      await fetchAccounts();
    } catch { } finally { setSyncing(false); }
  };

  // ── Send email ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!activeAccountId || !composeTo || !composeSubject) return;
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: activeAccountId,
          to: composeTo.split(',').map(s => s.trim()),
          cc: composeCc ? composeCc.split(',').map(s => s.trim()) : undefined,
          subject: composeSubject,
          html: `<div>${composeBody.replace(/\n/g, '<br/>')}</div>`,
          text: composeBody,
          inReplyTo: replyTo?.id,
        }),
      });
      if (res.ok) {
        setShowCompose(false);
        resetCompose();
        await fetchMessages();
      }
    } catch { } finally { setSending(false); }
  };

  const resetCompose = () => {
    setComposeTo(''); setComposeCc(''); setComposeSubject('');
    setComposeBody(''); setReplyTo(null);
  };

  // ── Add account ─────────────────────────────────────────────────────
  const handleAddAccount = async () => {
    if (!newEmail || !newPassword) { setAddError('Email and password are required'); return; }
    setAddingAccount(true); setAddError('');
    try {
      const payload: any = {
        email: newEmail, password: newPassword, provider: newProvider,
        displayName: newDisplayName || newEmail.split('@')[0],
      };
      if (newImapHost) payload.imapHost = newImapHost;
      if (newImapPort) payload.imapPort = parseInt(newImapPort);
      if (newSmtpHost) payload.smtpHost = newSmtpHost;
      if (newSmtpPort) payload.smtpPort = parseInt(newSmtpPort);
      const res = await fetch('/api/email/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Failed to add account'); return; }
      setShowAddAccount(false);
      setNewEmail(''); setNewPassword(''); setNewDisplayName('');
      setNewImapHost(''); setNewImapPort(''); setNewSmtpHost(''); setNewSmtpPort('');
      await fetchAccounts();
    } catch (e: any) { setAddError(e.message); } finally { setAddingAccount(false); }
  };

  // ── Delete account ──────────────────────────────────────────────────
  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Delete this email account and all its messages?')) return;
    await fetch(`/api/email/accounts?id=${id}`, { method: 'DELETE' });
    if (activeAccountId === id) { setActiveAccountId(null); setActiveFolderId(null); setMessages([]); }
    await fetchAccounts();
  };

  // ── Toggle star ─────────────────────────────────────────────────────
  const toggleStar = async (msgId: string, current: boolean) => {
    await fetch('/api/email/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId, isStarred: !current }),
    });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStarred: !current } : m));
  };

  // ── Toggle read ─────────────────────────────────────────────────────
  const toggleRead = async (msgId: string, current: boolean) => {
    await fetch('/api/email/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId, isRead: !current }),
    });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRead: !current } : m));
  };

  // ── Reply ───────────────────────────────────────────────────────────
  const handleReply = (msg: EmailMsg) => {
    setReplyTo(msg);
    setComposeTo(msg.fromAddress);
    setComposeSubject(`Re: ${msg.subject || ''}`);
    setComposeBody(`\n\n--- Original message ---\n${msg.bodyText || msg.snippet || ''}`);
    setShowCompose(true);
  };

  // ── Signatures ──────────────────────────────────────────────────────
  const fetchSignatures = async () => {
    const res = await fetch('/api/email/signatures');
    if (res.ok) setSignatures(await res.json());
  };

  const saveSig = async () => {
    if (!sigName || !sigBody) return;
    const method = editingSigId ? 'PUT' : 'POST';
    const payload: any = { name: sigName, bodyHtml: sigBody };
    if (editingSigId) payload.id = editingSigId;
    await fetch('/api/email/signatures', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSigName(''); setSigBody(''); setEditingSigId(null);
    await fetchSignatures();
  };

  const deleteSig = async (id: string) => {
    await fetch(`/api/email/signatures?id=${id}`, { method: 'DELETE' });
    await fetchSignatures();
  };

  // ── Effects ─────────────────────────────────────────────────────────
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const activeAccount = accounts.find(a => a.id === activeAccountId);
  const activeFolder = activeAccount?.folders?.find(f => f.id === activeFolderId);

  const filteredMessages = searchQuery
    ? messages.filter(m =>
      (m.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.fromAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.fromName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.snippet || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    : messages;

  // ── Render ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="h-6 w-6 text-amber-400" />
            {t('email.title') || 'Email'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('email.subtitle') || 'Manage all your email accounts in one place'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchSignatures(); setShowSignatures(true); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 flex items-center gap-2">
            <Pen className="h-4 w-4" /> {t('email.signatures') || 'Signatures'}
          </button>
          <button onClick={() => setShowAddAccount(true)} className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 flex items-center gap-2">
            <Plus className="h-4 w-4" /> {t('email.addAccount') || 'Add Account'}
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-6">
            <Mail className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{t('email.noAccounts') || 'No email accounts yet'}</h2>
          <p className="text-slate-400 max-w-md mb-6">{t('email.addFirstAccount') || 'Connect your Gmail, Outlook, Yahoo or any IMAP email account to manage all your emails here.'}</p>
          <button onClick={() => setShowAddAccount(true)} className="px-6 py-3 rounded-xl bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 flex items-center gap-2">
            <Plus className="h-5 w-5" /> {t('email.addAccount') || 'Add Email Account'}
          </button>
        </div>
      ) : (
        /* Email Client Layout */
        <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
          {/* Sidebar — accounts + folders */}
          <div className="w-56 flex-shrink-0 bg-white/5 rounded-xl border border-white/10 overflow-y-auto">
            {/* Compose button */}
            <div className="p-3">
              <button onClick={() => { resetCompose(); setShowCompose(true); }} className="w-full px-4 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 flex items-center justify-center gap-2">
                <Pen className="h-4 w-4" /> {t('email.compose') || 'Compose'}
              </button>
            </div>

            {/* Account list */}
            {accounts.map(acc => (
              <div key={acc.id}>
                <button
                  onClick={() => {
                    setActiveAccountId(acc.id);
                    const inbox = acc.folders?.find(f => f.type === 'inbox');
                    setActiveFolderId(inbox?.id || null);
                    setSelectedMsg(null);
                    setPage(1);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5 ${activeAccountId === acc.id ? 'bg-white/10' : ''}`}
                >
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: acc.color || '#f59e0b' }}>
                    {(acc.displayName || acc.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate text-xs font-medium">{acc.displayName || acc.email}</p>
                    <p className="text-slate-500 truncate text-[10px]">{acc.email}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id); }} className="text-slate-600 hover:text-red-400 p-0.5"><Trash2 className="h-3 w-3" /></button>
                </button>

                {/* Folders for active account */}
                {activeAccountId === acc.id && acc.folders && (
                  <div className="pl-3 pr-1 pb-2">
                    {acc.folders.map(folder => {
                      const FIcon = FOLDER_ICONS[folder.type] || FolderOpen;
                      return (
                        <button
                          key={folder.id}
                          onClick={() => { setActiveFolderId(folder.id); setSelectedMsg(null); setPage(1); }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${activeFolderId === folder.id ? 'bg-amber-400/10 text-amber-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'}`}
                        >
                          <FIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{folder.name}</span>
                          {folder.unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-400 px-1.5 rounded-full">{folder.unreadCount}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Message list */}
          <div className={`${selectedMsg ? 'hidden md:flex' : 'flex'} flex-col w-80 flex-shrink-0 bg-white/5 rounded-xl border border-white/10 overflow-hidden`}>
            {/* Toolbar */}
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('email.searchEmails') || 'Search emails...'}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-amber-400/30 focus:outline-none"
                />
              </div>
              <button onClick={syncAccount} disabled={syncing} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 disabled:opacity-50" title="Sync">
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Folder header */}
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-xs font-semibold text-white">{activeFolder?.name || 'All Messages'}</p>
              <p className="text-[10px] text-slate-500">{totalMessages} {t('email.messagesCount') || 'messages'}</p>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Inbox className="h-8 w-8 mb-2" />
                  <p className="text-sm">{t('email.noMessages') || 'No messages'}</p>
                </div>
              ) : (
                filteredMessages.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => fetchMessageBody(msg.id)}
                    className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${selectedMsg?.id === msg.id ? 'bg-white/10' : ''} ${!msg.isRead ? 'bg-amber-400/5' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleStar(msg.id, msg.isStarred); }} className="mt-0.5 flex-shrink-0">
                        {msg.isStarred ? <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> : <Star className="h-3.5 w-3.5 text-slate-600 hover:text-amber-400" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs truncate ${!msg.isRead ? 'font-semibold text-white' : 'text-slate-300'}`}>
                            {msg.fromName || msg.fromAddress}
                          </p>
                          <span className="text-[10px] text-slate-500 flex-shrink-0">
                            {new Date(msg.receivedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${!msg.isRead ? 'text-slate-200' : 'text-slate-400'}`}>{msg.subject || '(no subject)'}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{msg.snippet}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {msg.hasAttachments && <Paperclip className="h-3 w-3 text-slate-500" />}
                          {msg.aiCategory && (
                            <span className={`text-[9px] px-1.5 rounded-full ${msg.aiCategory === 'action_required' ? 'bg-red-400/10 text-red-400' : msg.aiCategory === 'billing' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-400/10 text-slate-400'}`}>
                              {msg.aiCategory}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalMessages > 30 && (
              <div className="p-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="hover:text-white disabled:opacity-50">&laquo; Prev</button>
                <span>Page {page}</span>
                <button disabled={page * 30 >= totalMessages} onClick={() => setPage(p => p + 1)} className="hover:text-white disabled:opacity-50">Next &raquo;</button>
              </div>
            )}
          </div>

          {/* Message reader */}
          <div className={`${selectedMsg ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white/5 rounded-xl border border-white/10 overflow-hidden`}>
            {selectedMsg ? (
              <>
                {/* Reader toolbar */}
                <div className="p-3 border-b border-white/5 flex items-center gap-2">
                  <button onClick={() => setSelectedMsg(null)} className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => handleReply(selectedMsg)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400" title="Reply">
                    <Reply className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setComposeTo(''); setComposeSubject(`Fwd: ${selectedMsg.subject || ''}`); setComposeBody(`\n\n--- Forwarded message ---\nFrom: ${selectedMsg.fromAddress}\n${selectedMsg.bodyText || selectedMsg.snippet || ''}`); setShowCompose(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400" title="Forward">
                    <Forward className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleRead(selectedMsg.id, selectedMsg.isRead)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400" title={selectedMsg.isRead ? 'Mark unread' : 'Mark read'}>
                    {selectedMsg.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => toggleStar(selectedMsg.id, selectedMsg.isStarred)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400">
                    {selectedMsg.isStarred ? <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> : <Star className="h-4 w-4" />}
                  </button>
                </div>

                {/* Message header */}
                <div className="p-4 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-white">{selectedMsg.subject || '(no subject)'}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="h-9 w-9 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {(selectedMsg.fromName || selectedMsg.fromAddress)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{selectedMsg.fromName || selectedMsg.fromAddress}</p>
                      <p className="text-xs text-slate-500">{selectedMsg.fromAddress}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-500">{new Date(selectedMsg.receivedAt).toLocaleString('en-GB')}</p>
                      <p className="text-[10px] text-slate-600">to {selectedMsg.toAddresses?.join(', ')}</p>
                    </div>
                  </div>
                  {selectedMsg.aiSummary && (
                    <div className="mt-3 p-2.5 rounded-lg bg-violet-400/10 border border-violet-400/20 text-xs text-violet-300">
                      <strong>AI Summary:</strong> {selectedMsg.aiSummary}
                    </div>
                  )}
                </div>

                {/* Message body */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedMsg.bodyHtml ? (
                    <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedMsg.bodyHtml }} />
                  ) : (
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{selectedMsg.bodyText || selectedMsg.snippet || 'No content'}</pre>
                  )}

                  {/* Attachments */}
                  {selectedMsg.attachments && selectedMsg.attachments.length > 0 && (
                    <div className="mt-6 border-t border-white/5 pt-4">
                      <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1"><Paperclip className="h-3 w-3" /> {selectedMsg.attachments.length} attachment(s)</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMsg.attachments.map(att => (
                          <div key={att.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                            <Paperclip className="h-3 w-3 text-slate-500" />
                            <span>{att.filename}</span>
                            <span className="text-slate-500">({(att.size / 1024).toFixed(0)}KB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <MailOpen className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm">{t('email.selectMessage') || 'Select an email to read'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Compose Dialog ─────────────────────────────────────────────── */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">{replyTo ? 'Reply' : (t('email.newMessage') || 'New Message')}</h3>
              <button onClick={() => { setShowCompose(false); resetCompose(); }} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="text-[10px] text-slate-500 uppercase">To</label>
                <input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="recipient@example.com" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase">Cc</label>
                <input value={composeCc} onChange={e => setComposeCc(e.target.value)} placeholder="cc@example.com" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase">{t('email.subject') || 'Subject'}</label>
                <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase">{t('email.body') || 'Message'}</label>
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={10} placeholder="Type your message..." className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-[10px] text-slate-500">{activeAccount?.email}</p>
              <button onClick={handleSend} disabled={sending || !composeTo || !composeSubject} className="px-5 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 flex items-center gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t('email.send') || 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Account Dialog ─────────────────────────────────────────── */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">{t('email.addEmailAccount') || 'Add Email Account'}</h3>
              <button onClick={() => { setShowAddAccount(false); setAddError(''); }} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Provider selector */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">{t('email.provider') || 'Email Provider'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROVIDER_PRESETS.map(p => (
                    <button key={p.key} onClick={() => setNewProvider(p.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${newProvider === p.key ? 'border-amber-400/50 bg-amber-400/10 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">{t('email.displayName') || 'Display Name'}</label>
                <input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="John Doe" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t('common.email') || 'Email'}</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="you@gmail.com" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t('email.appPassword') || 'App Password'}</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="App-specific password" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
                <p className="text-[10px] text-slate-500 mt-1">
                  {newProvider === 'gmail' && '💡 Use an App Password from myaccount.google.com/apppasswords'}
                  {newProvider === 'outlook' && '💡 Use your Microsoft password or App Password if 2FA enabled'}
                  {newProvider === 'yahoo' && '💡 Generate an App Password at login.yahoo.com > Account Security'}
                  {newProvider === 'icloud' && '💡 Generate an App-Specific Password at appleid.apple.com'}
                  {newProvider === 'hostinger' && '💡 Use the email password you set in Hostinger hPanel > Emails'}
                  {newProvider === 'imap' && '💡 Enter your IMAP/SMTP server details below'}
                </p>
              </div>

              {/* IMAP/SMTP host fields — shown for custom/hostinger providers */}
              {(newProvider === 'imap' || newProvider === 'hostinger') && (
                <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide">Server Settings</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500">IMAP Host</label>
                      <input value={newImapHost || (newProvider === 'hostinger' ? 'imap.hostinger.com' : '')} onChange={e => setNewImapHost(e.target.value)} placeholder="imap.example.com" className="w-full mt-0.5 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Port</label>
                      <input value={newImapPort || (newProvider === 'hostinger' ? '993' : '')} onChange={e => setNewImapPort(e.target.value)} placeholder="993" className="w-full mt-0.5 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500">SMTP Host</label>
                      <input value={newSmtpHost || (newProvider === 'hostinger' ? 'smtp.hostinger.com' : '')} onChange={e => setNewSmtpHost(e.target.value)} placeholder="smtp.example.com" className="w-full mt-0.5 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Port</label>
                      <input value={newSmtpPort || (newProvider === 'hostinger' ? '465' : '')} onChange={e => setNewSmtpPort(e.target.value)} placeholder="465" className="w-full mt-0.5 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {addError && (
                <div className="p-2.5 rounded-lg bg-red-400/10 border border-red-400/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {addError}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end gap-2">
              <button onClick={() => { setShowAddAccount(false); setAddError(''); }} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white">
                {t('common.cancel') || 'Cancel'}
              </button>
              <button onClick={handleAddAccount} disabled={addingAccount} className="px-5 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 flex items-center gap-2">
                {addingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t('email.connectAccount') || 'Connect & Sync'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Signatures Dialog ──────────────────────────────────────────── */}
      {showSignatures && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">{t('email.manageSignatures') || 'Manage Signatures'}</h3>
              <button onClick={() => setShowSignatures(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Existing signatures */}
              {signatures.map(sig => (
                <div key={sig.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{sig.name} {sig.isDefault && <span className="text-[10px] text-amber-400">(default)</span>}</p>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingSigId(sig.id); setSigName(sig.name); setSigBody(sig.bodyHtml); }} className="text-slate-400 hover:text-amber-400"><Pen className="h-3 w-3" /></button>
                      <button onClick={() => deleteSig(sig.id)} className="text-slate-400 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400" dangerouslySetInnerHTML={{ __html: sig.bodyHtml }} />
                </div>
              ))}

              {/* Add/Edit signature form with templates */}
              <div className="border-t border-white/5 pt-3 space-y-3">
                <p className="text-xs font-semibold text-slate-400">{editingSigId ? 'Edit Signature' : 'New Signature'}</p>
                <input value={sigName} onChange={e => setSigName(e.target.value)} placeholder="Signature name (e.g. Work, Personal)" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none" />

                {/* Template selector */}
                {!editingSigId && (
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Choose a Template</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'professional', label: 'Professional', colors: ['#f59e0b', '#1e293b'] },
                        { key: 'minimal', label: 'Minimal', colors: ['#64748b', '#ffffff'] },
                        { key: 'corporate', label: 'Corporate', colors: ['#3b82f6', '#1e293b'] },
                        { key: 'elegant', label: 'Elegant', colors: ['#a855f7', '#1e293b'] },
                      ].map(tmpl => (
                        <button key={tmpl.key} type="button"
                          onClick={() => {
                            const name = sigName || 'Your Name';
                            const templates: Record<string, string> = {
                              professional: `<div style="font-family:'Segoe UI',Arial,sans-serif;border-top:3px solid #f59e0b;padding-top:12px;margin-top:16px"><p style="margin:0;font-size:15px;font-weight:700;color:#f59e0b">${name}</p><p style="margin:2px 0 8px;font-size:12px;color:#94a3b8">Finance Manager | HomeLedger</p><p style="margin:0;font-size:11px;color:#64748b">📞 +44 7000 000000 · 📧 ${name.toLowerCase().replace(/\s/g,'.')}@homeledger.co.uk</p><p style="margin:4px 0 0;font-size:11px;color:#64748b">🌐 homeledger.co.uk</p></div>`,
                              minimal: `<div style="font-family:'Segoe UI',Arial,sans-serif;margin-top:16px"><p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0">${name}</p><p style="margin:2px 0;font-size:11px;color:#94a3b8">HomeLedger · homeledger.co.uk</p></div>`,
                              corporate: `<div style="font-family:'Segoe UI',Arial,sans-serif;border-left:4px solid #3b82f6;padding-left:12px;margin-top:16px"><p style="margin:0;font-size:14px;font-weight:700;color:#e2e8f0">${name}</p><p style="margin:2px 0;font-size:12px;color:#60a5fa">Finance Manager</p><p style="margin:0;font-size:11px;color:#94a3b8">HomeLedger UK Ltd</p><p style="margin:4px 0 0;font-size:11px;color:#64748b">+44 7000 000000 | homeledger.co.uk</p></div>`,
                              elegant: `<div style="font-family:Georgia,serif;margin-top:16px;text-align:center;border-top:1px solid #a855f7;padding-top:12px"><p style="margin:0;font-size:15px;font-weight:700;color:#a855f7;letter-spacing:1px">${name}</p><p style="margin:4px 0;font-size:11px;color:#94a3b8;font-style:italic">Finance Manager — HomeLedger</p><p style="margin:0;font-size:11px;color:#64748b">homeledger.co.uk · +44 7000 000000</p></div>`,
                            };
                            setSigBody(templates[tmpl.key] || '');
                          }}
                          className="p-2 rounded-lg border border-white/10 hover:border-amber-400/30 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-0.5">
                              {tmpl.colors.map((c, i) => <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />)}
                            </div>
                            <span className="text-[10px] font-medium text-slate-300">{tmpl.label}</span>
                          </div>
                          <div className="h-5 rounded bg-white/5 w-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* HTML editor / preview */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">HTML Content</p>
                    {sigBody && <span className="text-[9px] text-amber-400/60">Edit the HTML below to customise</span>}
                  </div>
                  <textarea value={sigBody} onChange={e => setSigBody(e.target.value)} rows={4} placeholder="<b>John Doe</b><br/>Finance Manager<br/>john@company.com" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:border-amber-400/30 focus:outline-none resize-none font-mono text-[11px]" />
                </div>

                {/* Live preview */}
                {sigBody && (
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Preview</p>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5" dangerouslySetInnerHTML={{ __html: sigBody }} />
                  </div>
                )}

                <button onClick={saveSig} disabled={!sigName || !sigBody} className="w-full px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 disabled:opacity-50">
                  {editingSigId ? 'Update' : 'Add'} Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
