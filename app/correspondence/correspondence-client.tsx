'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { ModuleGuide } from '@/components/module-guide';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useTranslation } from '@/lib/i18n';
import { useEntityContext } from '@/components/entity-context';
import {
  FileText, Plus, Pencil, Trash2, Loader2, Landmark, Building2, Home,
  CreditCard, Shield, Scale, Zap, Briefcase, MoreHorizontal,
  Calendar, AlertTriangle, CheckCircle2, Clock, ArrowDown, ArrowUp,
  PoundSterling, Search, Reply, Eye, ChevronRight,
} from 'lucide-react';

const SENDER_CATEGORIES = [
  { value: 'hmrc', label: 'HMRC', icon: Landmark, color: 'bg-red-500' },
  { value: 'companies_house', label: 'Companies House', icon: Building2, color: 'bg-blue-500' },
  { value: 'council', label: 'Council', icon: Home, color: 'bg-green-500' },
  { value: 'bank', label: 'Bank', icon: CreditCard, color: 'bg-purple-500' },
  { value: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-cyan-500' },
  { value: 'legal', label: 'Legal', icon: Scale, color: 'bg-amber-500' },
  { value: 'utility', label: 'Utility', icon: Zap, color: 'bg-orange-500' },
  { value: 'employer', label: 'Employer', icon: Briefcase, color: 'bg-slate-500' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-500' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  received: { label: 'Received', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: ArrowDown },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', icon: Eye },
  action_taken: { label: 'Action Taken', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', icon: CheckCircle2 },
  responded: { label: 'Responded', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300', icon: Reply },
  resolved: { label: 'Resolved', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle2 },
  archived: { label: 'Archived', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400', icon: FileText },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  normal: { label: 'Normal', color: 'text-blue-600' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' },
};

const STATUS_FLOW = ['received', 'under_review', 'action_taken', 'responded', 'resolved', 'archived'];

interface CorrespondenceItem {
  id: string;
  direction: string;
  senderCategory: string;
  senderName: string;
  recipientName: string | null;
  subject: string;
  summary: string | null;
  referenceNumber: string | null;
  utr: string | null;
  paymentRef: string | null;
  status: string;
  priority: string;
  dateReceived: string;
  deadlineDate: string | null;
  resolvedDate: string | null;
  amountDue: number | null;
  amountPaid: number | null;
  documentId: string | null;
  attachmentUrl: string | null;
  parentId: string | null;
  linkedActionId: string | null;
  notes: string | null;
  tags: string[];
  entityId: string | null;
  entity: { id: string; name: string } | null;
  parent: { id: string; subject: string; senderName: string } | null;
  replies: { id: string; subject: string; direction: string; dateReceived: string; status: string }[];
}

const emptyForm = {
  direction: 'incoming', senderCategory: 'hmrc', senderName: '', recipientName: '',
  subject: '', summary: '', referenceNumber: '', utr: '', paymentRef: '',
  status: 'received', priority: 'normal', dateReceived: new Date().toISOString().split('T')[0],
  deadlineDate: '', resolvedDate: '', amountDue: '', amountPaid: '',
  documentId: '', attachmentUrl: '', parentId: '', linkedActionId: '',
  notes: '', tags: '', entityId: '',
};

export function CorrespondenceClient() {
  const { t } = useTranslation();
  const { selectedEntityId } = useEntityContext();
  const { toast } = useToast();
  const [items, setItems] = useState<CorrespondenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailItem, setDetailItem] = useState<CorrespondenceItem | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEntityId) params.set('entityId', selectedEntityId);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      const res = await fetch(`/api/correspondence?${params.toString()}`);
      if (res.ok) setItems(await res.json());
    } catch {
      toast({ title: 'Error loading correspondence', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [selectedEntityId, filterStatus, filterCategory, toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = async () => {
    if (!form.senderName || !form.subject || !form.dateReceived) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/correspondence/${editId}` : '/api/correspondence';
      const method = editId ? 'PUT' : 'POST';
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: editId ? 'Updated' : 'Added' });
        setShowDialog(false);
        setEditId(null);
        setForm(emptyForm);
        fetchItems();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Error', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/correspondence/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Deleted' });
        fetchItems();
        if (detailItem?.id === deleteId) setDetailItem(null);
      }
    } catch {
      toast({ title: 'Error deleting', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const data: any = { status: newStatus };
      if (newStatus === 'resolved') data.resolvedDate = new Date().toISOString();
      const res = await fetch(`/api/correspondence/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast({ title: `Status → ${STATUS_CONFIG[newStatus]?.label}` });
        fetchItems();
      }
    } catch {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const openEdit = (item: CorrespondenceItem) => {
    setEditId(item.id);
    setForm({
      direction: item.direction,
      senderCategory: item.senderCategory,
      senderName: item.senderName,
      recipientName: item.recipientName || '',
      subject: item.subject,
      summary: item.summary || '',
      referenceNumber: item.referenceNumber || '',
      utr: item.utr || '',
      paymentRef: item.paymentRef || '',
      status: item.status,
      priority: item.priority,
      dateReceived: item.dateReceived?.split('T')[0] || '',
      deadlineDate: item.deadlineDate?.split('T')[0] || '',
      resolvedDate: item.resolvedDate?.split('T')[0] || '',
      amountDue: item.amountDue?.toString() || '',
      amountPaid: item.amountPaid?.toString() || '',
      documentId: item.documentId || '',
      attachmentUrl: item.attachmentUrl || '',
      parentId: item.parentId || '',
      linkedActionId: item.linkedActionId || '',
      notes: item.notes || '',
      tags: item.tags?.join(', ') || '',
      entityId: item.entityId || '',
    });
    setShowDialog(true);
  };

  const openReply = (parent: CorrespondenceItem) => {
    setEditId(null);
    setForm({
      ...emptyForm,
      direction: 'outgoing',
      senderCategory: parent.senderCategory,
      senderName: parent.senderName,
      subject: `RE: ${parent.subject}`,
      parentId: parent.id,
      entityId: parent.entityId || '',
    });
    setShowDialog(true);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

  const isDeadlineSoon = (d: string | null) => {
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000;
  };

  const isOverdue = (d: string | null) => {
    if (!d) return false;
    return new Date(d).getTime() < Date.now();
  };

  if (loading) return <LoadingSpinner />;

  const searchFiltered = searchTerm
    ? items.filter(i =>
        i.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.referenceNumber && i.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (i.utr && i.utr.includes(searchTerm))
      )
    : items;

  const activeItems = items.filter(i => i.status !== 'archived' && i.status !== 'resolved');
  const pendingAction = items.filter(i => i.status === 'received' || i.status === 'under_review');
  const deadlineSoon = activeItems.filter(i => isDeadlineSoon(i.deadlineDate));
  const overdueItems = activeItems.filter(i => i.deadlineDate && isOverdue(i.deadlineDate) && i.status !== 'resolved' && i.status !== 'archived');
  const totalOwed = activeItems.reduce((s, i) => s + (i.amountDue || 0) - (i.amountPaid || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <ModuleGuide moduleKey="correspondence" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            {t('nav.correspondence')}
          </h1>
          <p className="text-muted-foreground mt-1">Track and archive official correspondence</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Log Correspondence
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold">{items.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
              <p className="text-lg font-bold">{pendingAction.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Overdue</p>
              <p className="text-lg font-bold text-red-600">{overdueItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Due Soon</p>
              <p className="text-lg font-bold">{deadlineSoon.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <PoundSterling className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Owed</p>
              <p className="text-lg font-bold">{totalOwed > 0 ? formatCurrency(totalOwed) : '£0'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search subject, sender, reference..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SENDER_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      {searchFiltered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No correspondence yet</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">Log your first official letter to start tracking.</p>
          <Button className="mt-4" onClick={() => { setEditId(null); setForm(emptyForm); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Log Correspondence
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {searchFiltered.map(item => {
            const catConfig = SENDER_CATEGORIES.find(c => c.value === item.senderCategory) || SENDER_CATEGORIES[8];
            const CatIcon = catConfig.icon;
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.received;
            const StatusIcon = statusCfg.icon;
            const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;
            const overdue = item.deadlineDate && isOverdue(item.deadlineDate) && item.status !== 'resolved' && item.status !== 'archived';
            const dueSoon = isDeadlineSoon(item.deadlineDate) && !overdue;
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(item.status) + 1];

            return (
              <Card key={item.id} className={`overflow-hidden transition-shadow hover:shadow-md ${item.status === 'archived' ? 'opacity-50' : ''}`}>
                <div className={`h-1 ${catConfig.color}`} />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-lg ${catConfig.color}/10 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <CatIcon className={`h-5 w-5 ${catConfig.color.replace('bg-', 'text-')}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{item.subject}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.direction === 'outgoing' ? (
                              <span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3" /> Sent to {item.senderName}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1"><ArrowDown className="h-3 w-3" /> From {item.senderName}</span>
                            )}
                            {' · '}{new Date(item.dateReceived).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {nextStatus && item.status !== 'archived' && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(item.id, nextStatus)}>
                              <ChevronRight className="h-3 w-3 mr-1" />
                              {STATUS_CONFIG[nextStatus]?.label}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openReply(item)}>
                            <Reply className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge className={statusCfg.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />{statusCfg.label}
                        </Badge>
                        {item.priority !== 'normal' && (
                          <Badge variant="outline" className={priorityCfg.color}>{priorityCfg.label}</Badge>
                        )}
                        {overdue && (
                          <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</Badge>
                        )}
                        {dueSoon && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                            <Clock className="h-3 w-3 mr-1" /> Due Soon
                          </Badge>
                        )}
                        {item.direction === 'outgoing' && (
                          <Badge variant="outline" className="text-cyan-600 border-cyan-200">
                            <ArrowUp className="h-3 w-3 mr-1" /> Outgoing
                          </Badge>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {item.referenceNumber && <span>Ref: <span className="font-mono">{item.referenceNumber}</span></span>}
                        {item.utr && <span>UTR: <span className="font-mono">{item.utr}</span></span>}
                        {item.paymentRef && <span>Payment: <span className="font-mono">{item.paymentRef}</span></span>}
                        {item.deadlineDate && <span>Deadline: {new Date(item.deadlineDate).toLocaleDateString('en-GB')}</span>}
                        {item.amountDue != null && item.amountDue > 0 && <span>Amount: {formatCurrency(item.amountDue)}</span>}
                      </div>

                      {item.summary && (
                        <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2">{item.summary}</p>
                      )}

                      {/* Reply chain indicator */}
                      {item.replies && item.replies.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed">
                          <p className="text-xs text-muted-foreground font-medium mb-1">{item.replies.length} related item(s)</p>
                          {item.replies.map(r => (
                            <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                              {r.direction === 'outgoing' ? <ArrowUp className="h-3 w-3 text-cyan-500" /> : <ArrowDown className="h-3 w-3 text-blue-500" />}
                              <span className="truncate">{r.subject}</span>
                              <Badge variant="outline" className="text-[10px] h-4 px-1">{STATUS_CONFIG[r.status]?.label}</Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.entity && (
                        <div className="mt-1.5">
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.entity.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Correspondence' : form.parentId ? 'Log Reply' : 'Log Correspondence'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Direction */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={v => setForm({ ...form, direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Incoming (Received)</SelectItem>
                    <SelectItem value="outgoing">Outgoing (Sent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.senderCategory} onValueChange={v => setForm({ ...form, senderCategory: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SENDER_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sender/Recipient */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{form.direction === 'outgoing' ? 'Recipient *' : 'Sender *'}</Label>
                <Input value={form.senderName} onChange={e => setForm({ ...form, senderName: e.target.value })} placeholder="e.g. HM Revenue & Customs" />
              </div>
              <div>
                <Label>Subject *</Label>
                <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. CT603 - Notice to file" />
              </div>
            </div>

            {/* Summary */}
            <div>
              <Label>Summary</Label>
              <Textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Brief description of the correspondence..." rows={2} />
            </div>

            {/* References */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Reference #</Label>
                <Input value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} placeholder="Any ref" />
              </div>
              <div>
                <Label>UTR</Label>
                <Input value={form.utr} onChange={e => setForm({ ...form, utr: e.target.value })} placeholder="10 digits" />
              </div>
              <div>
                <Label>Payment Ref</Label>
                <Input value={form.paymentRef} onChange={e => setForm({ ...form, paymentRef: e.target.value })} placeholder="Payment ref" />
              </div>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date Received *</Label>
                <Input type="date" value={form.dateReceived} onChange={e => setForm({ ...form, dateReceived: e.target.value })} />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={form.deadlineDate} onChange={e => setForm({ ...form, deadlineDate: e.target.value })} />
              </div>
            </div>

            {/* Financial */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount Due (£)</Label>
                <Input type="number" step="0.01" value={form.amountDue} onChange={e => setForm({ ...form, amountDue: e.target.value })} />
              </div>
              <div>
                <Label>Amount Paid (£)</Label>
                <Input type="number" step="0.01" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} />
              </div>
            </div>

            {/* Tags & Notes */}
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="tax_document, hmrc, ct603" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
            </div>

            {form.parentId && (
              <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
                Reply to: {items.find(i => i.id === form.parentId)?.subject || form.parentId}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditId(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? 'Update' : form.parentId ? 'Log Reply' : 'Log Correspondence'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Correspondence?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this correspondence record and any chain links.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
