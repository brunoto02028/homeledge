'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, Plus, Send, CheckCircle2, XCircle, Clock, FileText,
  Settings2, Pencil, Trash2, Copy, Mail, Building2, MapPin,
  ArrowLeft, RotateCcw, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────

interface SubmissionProfile {
  id: string;
  name: string;
  prefix: string;
  poNumber: string;
  siteCode: string;
  siteName: string;
  recipientEmail: string;
  senderEmail: string;
  senderName: string;
  companyName: string;
  emailSignature?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  isActive: boolean;
  _count?: { submissions: number };
}

interface InvoiceSubmission {
  id: string;
  prefix: string;
  sequenceNumber: number;
  invoiceCode: string;
  fileCode: string;
  poNumber: string;
  month: string;
  year: number;
  siteCode: string;
  siteName: string;
  recipientEmail: string;
  senderEmail: string;
  pdfPath?: string | null;
  amount?: number | null;
  currency: string;
  status: string;
  sentAt?: string | null;
  responseAt?: string | null;
  responseDcn?: string | null;
  errorMessage?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
  notes?: string | null;
  createdAt: string;
  profile?: { name: string; siteCode?: string; siteName?: string };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  draft: { color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', icon: <FileText className="h-3 w-3" />, label: 'Draft' },
  sent: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: <Mail className="h-3 w-3" />, label: 'Sent' },
  success: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Success' },
  failed: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: <XCircle className="h-3 w-3" />, label: 'Failed' },
  error: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', icon: <XCircle className="h-3 w-3" />, label: 'Error' },
};

// ─── Component ──────────────────────────────────────────────────────────

export default function SubmissionsClient() {
  const { toast } = useToast();

  // Data
  const [profiles, setProfiles] = useState<SubmissionProfile[]>([]);
  const [submissions, setSubmissions] = useState<InvoiceSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SubmissionProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '', prefix: 'INVUK1', poNumber: '', siteCode: '', siteName: '',
    recipientEmail: 'europeaccountspayable@conduent.com', senderEmail: 'bruno@mexpress.uk',
    senderName: 'T. Bruno', companyName: 'Molina Express', emailSignature: '',
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Submission form
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [submitMonth, setSubmitMonth] = useState(MONTHS[new Date().getMonth()]);
  const [submitYear, setSubmitYear] = useState(String(new Date().getFullYear()));
  const [submitAmount, setSubmitAmount] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitPdfPath, setSubmitPdfPath] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [submitPdfName, setSubmitPdfName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail / email preview
  const [previewSubmission, setPreviewSubmission] = useState<InvoiceSubmission | null>(null);
  const [showSmtp, setShowSmtp] = useState(false);

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProfile, setFilterProfile] = useState<string>('all');

  // ─── Fetch ────────────────────────────────────────────────────────────

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices/ups-profiles');
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterProfile !== 'all') params.set('profileId', filterProfile);
      const res = await fetch(`/api/invoices/ups-submissions?${params}`);
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, [filterStatus, filterProfile]);

  useEffect(() => {
    Promise.all([fetchProfiles(), fetchSubmissions()]).finally(() => setLoading(false));
  }, [fetchProfiles, fetchSubmissions]);

  // ─── Profile Actions ──────────────────────────────────────────────────

  const openNewProfile = () => {
    setEditingProfile(null);
    setProfileForm({
      name: '', prefix: 'INVUK1', poNumber: '', siteCode: '', siteName: '',
      recipientEmail: 'europeaccountspayable@conduent.com', senderEmail: 'bruno@mexpress.uk',
      senderName: 'T. Bruno', companyName: 'Molina Express', emailSignature: '',
      smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '',
    });
    setShowSmtp(false);
    setShowProfileDialog(true);
  };

  const openEditProfile = (p: SubmissionProfile) => {
    setEditingProfile(p);
    setProfileForm({
      name: p.name,
      prefix: p.prefix,
      poNumber: p.poNumber,
      siteCode: p.siteCode,
      siteName: p.siteName,
      recipientEmail: p.recipientEmail,
      senderEmail: p.senderEmail,
      senderName: p.senderName,
      companyName: p.companyName,
      emailSignature: p.emailSignature || '',
      smtpHost: p.smtpHost || '',
      smtpPort: p.smtpPort ? String(p.smtpPort) : '',
      smtpUser: p.smtpUser || '',
      smtpPass: p.smtpPass || '',
    });
    setShowSmtp(!!p.smtpHost);
    setShowProfileDialog(true);
  };

  const saveProfile = async () => {
    if (!profileForm.name || !profileForm.poNumber || !profileForm.siteCode || !profileForm.siteName) {
      toast({ title: 'Missing fields', description: 'Name, PO Number, Site Code and Site Name are required', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    try {
      const payload: any = { ...profileForm };
      if (payload.smtpPort) payload.smtpPort = parseInt(payload.smtpPort);
      else delete payload.smtpPort;
      if (!payload.smtpHost) { delete payload.smtpHost; delete payload.smtpPort; delete payload.smtpUser; delete payload.smtpPass; }

      const url = editingProfile ? `/api/invoices/ups-profiles/${editingProfile.id}` : '/api/invoices/ups-profiles';
      const method = editingProfile ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast({ title: editingProfile ? 'Profile Updated' : 'Profile Created' });
      setShowProfileDialog(false);
      fetchProfiles();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await fetch(`/api/invoices/ups-profiles/${id}`, { method: 'DELETE' });
      toast({ title: 'Profile Deleted' });
      fetchProfiles();
    } catch {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  };

  // ─── Submission Actions ───────────────────────────────────────────────

  const openNewSubmission = () => {
    if (profiles.length === 0) {
      toast({ title: 'No profiles', description: 'Create a submission profile first', variant: 'destructive' });
      return;
    }
    setSelectedProfileId(profiles[0].id);
    setSubmitMonth(MONTHS[new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1]);
    setSubmitYear(String(new Date().getFullYear()));
    setSubmitAmount('');
    setSubmitNotes('');
    setSubmitPdfPath('');
    setSubmitPdfName('');
    setShowSubmitDialog(true);
  };

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true);
    try {
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: false }),
      });
      const { uploadUrl, cloudStoragePath } = await presignedRes.json();
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      setSubmitPdfPath(cloudStoragePath);
      setSubmitPdfName(file.name);
      toast({ title: 'PDF Uploaded', description: file.name });
    } catch {
      toast({ title: 'Upload Failed', variant: 'destructive' });
    } finally {
      setUploadingPdf(false);
    }
  };

  const createSubmission = async (sendNow: boolean) => {
    if (!selectedProfileId || !submitMonth || !submitYear) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/invoices/ups-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileId,
          month: submitMonth,
          year: submitYear,
          amount: submitAmount || null,
          notes: submitNotes || null,
          pdfPath: submitPdfPath || null,
          sendNow,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const sub = await res.json();
      toast({
        title: sendNow ? 'Invoice Sent!' : 'Draft Created',
        description: `${sub.invoiceCode} — ${sendNow ? 'Email sent to Conduent' : 'Saved as draft'}`,
      });
      setShowSubmitDialog(false);
      fetchSubmissions();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const sendDraftSubmission = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/ups-submissions/${id}/send`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to send');
      toast({ title: 'Email Sent!', description: 'Invoice submitted to Conduent' });
      fetchSubmissions();
      setPreviewSubmission(null);
    } catch (err: any) {
      toast({ title: 'Send Failed', description: err.message, variant: 'destructive' });
    }
  };

  const updateSubmissionStatus = async (id: string, status: string, dcn?: string) => {
    try {
      const body: any = { status };
      if (dcn) body.responseDcn = dcn;
      const res = await fetch(`/api/invoices/ups-submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast({ title: `Marked as ${status}` });
      fetchSubmissions();
      setPreviewSubmission(null);
    } catch {
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      await fetch(`/api/invoices/ups-submissions/${id}`, { method: 'DELETE' });
      toast({ title: 'Submission Deleted' });
      fetchSubmissions();
    } catch {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!' });
  };

  // ─── Filtered list ────────────────────────────────────────────────────

  const filteredSubs = submissions;

  const stats = {
    total: submissions.length,
    draft: submissions.filter(s => s.status === 'draft').length,
    sent: submissions.filter(s => s.status === 'sent').length,
    success: submissions.filter(s => s.status === 'success').length,
    failed: submissions.filter(s => s.status === 'failed' || s.status === 'error').length,
  };

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/invoices" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Invoice Submissions</h1>
          </div>
          <p className="text-muted-foreground">Automate invoice submission to UPS/Conduent with tracked delivery</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewProfile}>
            <Settings2 className="h-4 w-4 mr-2" /> New Profile
          </Button>
          <Button onClick={openNewSubmission}>
            <Send className="h-4 w-4 mr-2" /> New Submission
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Drafts', value: stats.draft, color: 'text-slate-500' },
          { label: 'Sent', value: stats.sent, color: 'text-blue-600' },
          { label: 'Success', value: stats.success, color: 'text-green-600' },
          { label: 'Failed', value: stats.failed, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          <TabsTrigger value="profiles">Profiles ({profiles.length})</TabsTrigger>
        </TabsList>

        {/* ─── Submissions Tab ───────────────────────────────────── */}
        <TabsContent value="submissions" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProfile} onValueChange={v => { setFilterProfile(v); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Profile" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="pt-4">
              {filteredSubs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No submissions yet</p>
                  <p className="text-sm mt-1">Create a profile and submit your first invoice</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Profile / Site</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubs.map(sub => {
                      const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG.draft;
                      return (
                        <TableRow key={sub.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setPreviewSubmission(sub)}>
                          <TableCell>
                            <div className="font-mono font-semibold text-sm">{sub.invoiceCode}</div>
                            <div className="text-xs text-muted-foreground">File: {sub.fileCode}.pdf</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{sub.profile?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{sub.siteCode} {sub.siteName}</div>
                          </TableCell>
                          <TableCell className="text-sm">{sub.month} {sub.year}</TableCell>
                          <TableCell className="text-sm">
                            {sub.amount ? `£${Number(sub.amount).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={sc.color}>
                              <span className="flex items-center gap-1">{sc.icon} {sc.label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {sub.sentAt ? new Date(sub.sentAt).toLocaleDateString('en-GB') : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                              {(sub.status === 'draft' || sub.status === 'error') && (
                                <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => sendDraftSubmission(sub.id)} title="Send Email">
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {sub.status === 'sent' && (
                                <>
                                  <Button size="sm" variant="ghost" className="text-green-600" onClick={() => updateSubmissionStatus(sub.id, 'success')} title="Mark Success">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => updateSubmissionStatus(sub.id, 'failed')} title="Mark Failed">
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(sub.invoiceCode)} title="Copy Code">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-red-500" title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete {sub.invoiceCode}?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently remove this submission record.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteSubmission(sub.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Profiles Tab ──────────────────────────────────────── */}
        <TabsContent value="profiles" className="space-y-4">
          {profiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No profiles yet</p>
                <p className="text-sm mt-1">Create a profile with your PO number, site, and email settings</p>
                <Button className="mt-4" onClick={openNewProfile}>
                  <Plus className="h-4 w-4 mr-2" /> Create Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {profiles.map(p => (
                <Card key={p.id} className={!p.isActive ? 'opacity-50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          {p.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <span className="font-mono">{p.prefix}</span> · PO: {p.poNumber}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditProfile(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{p.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This will also delete all submissions linked to this profile.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProfile(p.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.siteCode} {p.siteName}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {p.senderEmail}
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                        <Send className="h-3 w-3" /> → {p.recipientEmail}
                      </div>
                      {p._count && (
                        <div className="col-span-2 text-xs text-muted-foreground mt-1">
                          {p._count.submissions} submission{p._count.submissions !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Profile Dialog ──────────────────────────────────────── */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Profile' : 'New Submission Profile'}</DialogTitle>
            <DialogDescription>Configure PO number, site, and email settings for invoice submissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Profile Name *</Label>
                <Input placeholder="e.g. UPS Norwich" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Invoice Prefix</Label>
                <Input placeholder="INVUK1" value={profileForm.prefix} onChange={e => setProfileForm(f => ({ ...f, prefix: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>PO Number *</Label>
                <Input placeholder="OCM45697" value={profileForm.poNumber} onChange={e => setProfileForm(f => ({ ...f, poNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Site Code *</Label>
                <Input placeholder="6640" value={profileForm.siteCode} onChange={e => setProfileForm(f => ({ ...f, siteCode: e.target.value }))} />
              </div>
              <div>
                <Label>Site Name *</Label>
                <Input placeholder="Norwich" value={profileForm.siteName} onChange={e => setProfileForm(f => ({ ...f, siteName: e.target.value }))} />
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3">Email Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sender Email *</Label>
                  <Input value={profileForm.senderEmail} onChange={e => setProfileForm(f => ({ ...f, senderEmail: e.target.value }))} />
                </div>
                <div>
                  <Label>Recipient Email *</Label>
                  <Input value={profileForm.recipientEmail} onChange={e => setProfileForm(f => ({ ...f, recipientEmail: e.target.value }))} />
                </div>
                <div>
                  <Label>Sender Name</Label>
                  <Input value={profileForm.senderName} onChange={e => setProfileForm(f => ({ ...f, senderName: e.target.value }))} />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input value={profileForm.companyName} onChange={e => setProfileForm(f => ({ ...f, companyName: e.target.value }))} />
                </div>
              </div>
            </div>
            <div>
              <Label>Email Signature (HTML)</Label>
              <Textarea rows={3} placeholder="HTML signature block (logo, contact info, etc.)" value={profileForm.emailSignature} onChange={e => setProfileForm(f => ({ ...f, emailSignature: e.target.value }))} />
            </div>
            <div className="border-t pt-3">
              <button type="button" onClick={() => setShowSmtp(!showSmtp)} className="text-xs text-primary hover:underline flex items-center gap-1">
                {showSmtp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showSmtp ? 'Hide' : 'Show'} Custom SMTP Settings (optional)
              </button>
              {showSmtp && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div><Label>SMTP Host</Label><Input placeholder="smtp.hostinger.com" value={profileForm.smtpHost} onChange={e => setProfileForm(f => ({ ...f, smtpHost: e.target.value }))} /></div>
                  <div><Label>SMTP Port</Label><Input placeholder="465" value={profileForm.smtpPort} onChange={e => setProfileForm(f => ({ ...f, smtpPort: e.target.value }))} /></div>
                  <div><Label>SMTP User</Label><Input value={profileForm.smtpUser} onChange={e => setProfileForm(f => ({ ...f, smtpUser: e.target.value }))} /></div>
                  <div><Label>SMTP Password</Label><Input type="password" value={profileForm.smtpPass} onChange={e => setProfileForm(f => ({ ...f, smtpPass: e.target.value }))} /></div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProfile ? 'Update' : 'Create'} Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── New Submission Dialog ───────────────────────────────── */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Invoice Submission</DialogTitle>
            <DialogDescription>Select a profile and month to generate the next invoice number automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Profile *</Label>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger><SelectValue placeholder="Select profile" /></SelectTrigger>
                <SelectContent>
                  {profiles.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {p.siteCode} {p.siteName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Month *</Label>
                <Select value={submitMonth} onValueChange={setSubmitMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year *</Label>
                <Input type="number" value={submitYear} onChange={e => setSubmitYear(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Amount (optional)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={submitAmount} onChange={e => setSubmitAmount(e.target.value)} />
            </div>
            <div>
              <Label>PDF Attachment</Label>
              <div className="flex items-center gap-3 mt-1">
                {submitPdfName ? (
                  <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg flex-1">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{submitPdfName}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-auto" onClick={() => { setSubmitPdfPath(''); setSubmitPdfName(''); }}>
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <input type="file" id="pdf-upload" className="hidden" accept=".pdf"
                      onChange={e => e.target.files?.[0] && handlePdfUpload(e.target.files[0])} />
                    <label htmlFor="pdf-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                      {uploadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      {uploadingPdf ? 'Uploading...' : 'Click to upload PDF'}
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea rows={2} placeholder="Internal notes..." value={submitNotes} onChange={e => setSubmitNotes(e.target.value)} />
            </div>

            {/* Preview */}
            {selectedProfileId && (() => {
              const p = profiles.find(x => x.id === selectedProfileId);
              if (!p) return null;
              return (
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2 border">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Email Preview</p>
                  <div className="grid grid-cols-[60px_1fr] gap-1 text-xs">
                    <span className="text-muted-foreground">From:</span><span>{p.senderEmail}</span>
                    <span className="text-muted-foreground">To:</span><span>{p.recipientEmail}</span>
                    <span className="text-muted-foreground">Subject:</span><span className="font-mono font-semibold">{p.prefix}:??????</span>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground leading-relaxed">
                    <p>Good afternoon,</p>
                    <p className="mt-1">PO Number {p.poNumber} for the month of {submitMonth}, concerning the {p.siteCode} {p.siteName}.</p>
                    <p className="mt-1">Attached: <span className="font-mono">{p.prefix}??????.pdf</span></p>
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => createSubmission(false)} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <FileText className="h-4 w-4 mr-2" /> Save as Draft
            </Button>
            <Button onClick={() => createSubmission(true)} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" /> Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Submission Detail / Email Preview Dialog ─────────── */}
      <Dialog open={!!previewSubmission} onOpenChange={() => setPreviewSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {previewSubmission && (() => {
            const sub = previewSubmission;
            const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG.draft;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="font-mono">{sub.invoiceCode}</span>
                    <Badge className={sc.color}>
                      <span className="flex items-center gap-1">{sc.icon} {sc.label}</span>
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>{sub.profile?.name} — {sub.month} {sub.year}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">PO Number:</span> <strong>{sub.poNumber}</strong></div>
                    <div><span className="text-muted-foreground">Site:</span> <strong>{sub.siteCode} {sub.siteName}</strong></div>
                    <div><span className="text-muted-foreground">File name:</span> <span className="font-mono">{sub.fileCode}.pdf</span></div>
                    <div><span className="text-muted-foreground">Amount:</span> {sub.amount ? `£${Number(sub.amount).toFixed(2)}` : '-'}</div>
                    {sub.sentAt && <div><span className="text-muted-foreground">Sent:</span> {new Date(sub.sentAt).toLocaleString('en-GB')}</div>}
                    {sub.responseDcn && <div><span className="text-muted-foreground">DCN:</span> <span className="font-mono">{sub.responseDcn}</span></div>}
                    {sub.errorMessage && <div className="col-span-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded">{sub.errorMessage}</div>}
                  </div>

                  {/* Email content */}
                  <div className="border rounded-lg">
                    <div className="bg-muted/50 px-4 py-2 border-b text-xs space-y-0.5">
                      <p><strong>From:</strong> {sub.senderEmail}</p>
                      <p><strong>To:</strong> {sub.recipientEmail}</p>
                      <p><strong>Subject:</strong> {sub.emailSubject}</p>
                    </div>
                    <div className="p-4 text-sm whitespace-pre-wrap leading-relaxed">{sub.emailBody}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {(sub.status === 'draft' || sub.status === 'error') && (
                      <Button size="sm" variant="outline" onClick={() => sendDraftSubmission(sub.id)}>
                        <Send className="h-4 w-4 mr-1" /> Send Email
                      </Button>
                    )}
                    {sub.status === 'sent' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateSubmissionStatus(sub.id, 'success')}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Success
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateSubmissionStatus(sub.id, 'failed')}>
                          <XCircle className="h-4 w-4 mr-1" /> Mark Failed
                        </Button>
                      </>
                    )}
                    {(sub.status === 'failed' || sub.status === 'error') && (
                      <Button size="sm" variant="outline" onClick={() => updateSubmissionStatus(sub.id, 'draft')}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Reset to Draft
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(sub.emailBody || '')}>
                      <Copy className="h-4 w-4 mr-1" /> Copy Email Text
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
