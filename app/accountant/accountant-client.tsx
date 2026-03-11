'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users, UserPlus, Mail, Building2, User, FileText, Receipt, CreditCard,
  Eye, Trash2, Loader2, RefreshCw, Shield, Clock, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, BarChart3, ArrowLeft, Briefcase, UserCheck,
  Phone, Hash, MapPin, Banknote, CalendarDays, Edit2, PoundSterling,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n';

interface ClientRelationship {
  id: string;
  accountantId: string;
  clientId: string | null;
  clientEmail: string;
  status: string;
  permissions: string[];
  label: string | null;
  inviteToken: string;
  invitedAt: string;
  acceptedAt: string | null;
  lastAccessedAt: string | null;
  notes: string | null;
  clientUser: {
    id: string;
    fullName: string;
    email: string;
    plan: string;
    createdAt: string;
  } | null;
  entityCount: number;
  // Walk-in / offline fields
  isOffline: boolean;
  offlineFullName: string | null;
  offlinePhone: string | null;
  offlineNino: string | null;
  offlineUtr: string | null;
  offlineDob: string | null;
  offlineAddress: string | null;
  offlineService: string | null;
  offlineTaxYear: string | null;
  offlineFee: number | null;
  offlineFeePaid: boolean;
}

const OFFLINE_SERVICES = [
  'Self Assessment (HMRC)',
  'Company Formation',
  'Contabilidade & Impostos',
  'Payroll',
  'VAT Return',
  'Corporation Tax',
  'Citizenship / Immigration',
  'Consultoria Pontual',
  'Outro',
];

const TAX_YEARS = ['2024/25', '2023/24', '2022/23', '2021/22', '2020/21'];

interface ClientData {
  clientId: string;
  section: string;
  entities?: any[];
  recentStatements?: any[];
  recentInvoices?: any[];
  bills?: any[];
  categoryCount?: number;
  totalCredits?: number;
  totalDebits?: number;
  statementCount?: number;
  invoiceCount?: number;
  billCount?: number;
  statements?: any[];
  invoices?: any[];
  documents?: any[];
}

export function AccountantDashboard() {
  const { locale } = useTranslation();
  const isPt = locale === 'pt-BR';
  const { data: session } = useSession();
  const [clients, setClients] = useState<ClientRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', label: '', notes: '' });
  const [walkInForm, setWalkInForm] = useState({
    offlineFullName: '', offlinePhone: '', offlineNino: '', offlineUtr: '',
    offlineDob: '', offlineAddress: '', offlineService: '', offlineTaxYear: '',
    offlineFee: '', notes: '',
  });
  const [inviting, setInviting] = useState(false);
  const [savingWalkIn, setSavingWalkIn] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRelationship | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/clients');
      if (res.ok) setClients(await res.json());
    } catch {
      toast.error('Failed to fetch clients');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleWalkIn = async () => {
    if (!walkInForm.offlineFullName) return;
    setSavingWalkIn(true);
    try {
      const res = await fetch('/api/accountant/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOffline: true, ...walkInForm }),
      });
      if (res.ok) {
        toast.success('Cliente pontual adicionado');
        setShowWalkIn(false);
        setWalkInForm({ offlineFullName: '', offlinePhone: '', offlineNino: '', offlineUtr: '', offlineDob: '', offlineAddress: '', offlineService: '', offlineTaxYear: '', offlineFee: '', notes: '' });
        fetchClients();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao adicionar cliente');
      }
    } catch { toast.error('Erro ao guardar'); }
    setSavingWalkIn(false);
  };

  const handleToggleFeePaid = async (client: ClientRelationship) => {
    try {
      await fetch(`/api/accountant/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offlineFeePaid: !client.offlineFeePaid }),
      });
      toast.success(client.offlineFeePaid ? 'Marcado como não pago' : 'Marcado como pago');
      fetchClients();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    setInviting(true);
    try {
      const res = await fetch('/api/accountant/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      if (res.ok) {
        toast.success('Client invited successfully');
        setShowInvite(false);
        setInviteForm({ email: '', label: '', notes: '' });
        fetchClients();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to invite client');
      }
    } catch { toast.error('Failed to invite'); }
    setInviting(false);
  };

  const handleRevoke = async (id: string) => {
    try {
      await fetch(`/api/accountant/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revoked' }),
      });
      toast.success('Client access revoked');
      fetchClients();
    } catch { toast.error('Failed to revoke'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/accountant/clients/${id}`, { method: 'DELETE' });
      toast.success('Client removed');
      fetchClients();
      if (selectedClient?.id === id) { setSelectedClient(null); setClientData(null); }
    } catch { toast.error('Failed to delete'); }
  };

  const viewClientData = async (client: ClientRelationship, section = 'overview') => {
    if (!client.clientId) {
      toast.error('Client has not joined Clarity & Co yet');
      return;
    }
    setSelectedClient(client);
    setLoadingData(true);
    setActiveTab(section);
    try {
      const res = await fetch(`/api/accountant/clients/${client.id}/data?section=${section}`);
      if (res.ok) setClientData(await res.json());
      else toast.error('Failed to load client data');
    } catch { toast.error('Failed to load data'); }
    setLoadingData(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'revoked': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" /> Revoked</Badge>;
      case 'offline': return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><UserCheck className="h-3 w-3 mr-1" /> Pontual</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const userRole = (session?.user as any)?.role;

  if (userRole !== 'accountant' && userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Shield className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">Accountant Access Required</h2>
        <p className="text-muted-foreground text-center max-w-md">
          This page is only available to users with an accountant role. Contact admin to upgrade your account.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Client detail view
  if (selectedClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setClientData(null); }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
          </Button>
          <div>
            <h2 className="text-xl font-bold">{selectedClient.label || selectedClient.clientUser?.fullName || selectedClient.clientEmail}</h2>
            <p className="text-sm text-muted-foreground">{selectedClient.clientEmail}</p>
          </div>
          {statusBadge(selectedClient.status)}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : clientData ? (
          <Tabs value={activeTab} onValueChange={(v) => viewClientData(selectedClient, v)}>
            <TabsList>
              <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
              <TabsTrigger value="statements"><FileText className="h-4 w-4 mr-2" /> Statements</TabsTrigger>
              <TabsTrigger value="invoices"><Receipt className="h-4 w-4 mr-2" /> Invoices</TabsTrigger>
              <TabsTrigger value="bills"><CreditCard className="h-4 w-4 mr-2" /> Bills</TabsTrigger>
              <TabsTrigger value="entities"><Building2 className="h-4 w-4 mr-2" /> Entities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">£{(clientData.totalCredits || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Total Credits</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">£{(clientData.totalDebits || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Total Debits</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{clientData.statementCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Statements</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{clientData.invoiceCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Invoices</p>
                  </CardContent>
                </Card>
              </div>

              {/* Entities */}
              {clientData.entities && clientData.entities.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Entities</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {clientData.entities.map((e: any) => (
                        <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          {e.type === 'individual' || e.type === 'sole_trader'
                            ? <User className="h-4 w-4 text-blue-500" />
                            : <Building2 className="h-4 w-4 text-amber-500" />
                          }
                          <div>
                            <span className="font-medium text-sm">{e.name}</span>
                            {e.companyNumber && <span className="text-xs text-muted-foreground ml-2">#{e.companyNumber}</span>}
                          </div>
                          <Badge variant="outline" className="ml-auto text-xs">{e.type?.replace('_', ' ')}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Statements */}
              {clientData.recentStatements && clientData.recentStatements.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Recent Statements</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {clientData.recentStatements.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{s.fileName}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="text-green-600">+£{s.totalCredits?.toFixed(2)}</span>
                            <span className="text-red-600">-£{s.totalDebits?.toFixed(2)}</span>
                            <Badge variant="outline">{s.parseStatus}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Invoices */}
              {clientData.recentInvoices && clientData.recentInvoices.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Recent Invoices</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {clientData.recentInvoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                          <div>
                            <span className="font-medium">{inv.invoiceNumber}</span>
                            <span className="text-muted-foreground ml-2">{inv.clientName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">£{inv.totalAmount?.toFixed(2)}</span>
                            <Badge variant={inv.status === 'paid' ? 'default' : 'outline'}>{inv.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="statements" className="space-y-4">
              {clientData.statements?.length ? clientData.statements.map((s: any) => (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" /> {s.fileName}
                      <Badge variant="outline" className="ml-auto">{s.parseStatus}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Credits: £{s.totalCredits?.toFixed(2)} · Debits: £{s.totalDebits?.toFixed(2)} · {s.transactions?.length || 0} transactions
                    </CardDescription>
                  </CardHeader>
                  {s.transactions?.length > 0 && (
                    <CardContent>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {s.transactions.slice(0, 20).map((tx: any) => (
                          <div key={tx.id} className="flex items-center justify-between text-xs py-1 border-b border-muted">
                            <div className="flex-1 truncate">{tx.description}</div>
                            <div className={`font-mono ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'credit' ? '+' : '-'}£{Math.abs(tx.amount).toFixed(2)}
                            </div>
                            {tx.category && <Badge variant="outline" className="ml-2 text-[10px]">{tx.category.name}</Badge>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )) : <p className="text-muted-foreground text-center py-8">No statements found</p>}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              {clientData.invoices?.length ? (
                <div className="grid gap-3">
                  {clientData.invoices.map((inv: any) => (
                    <Card key={inv.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{inv.invoiceNumber} — {inv.clientName}</div>
                            <div className="text-xs text-muted-foreground">{inv.issueDate && format(new Date(inv.issueDate), 'dd MMM yyyy')}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">£{inv.totalAmount?.toFixed(2)}</div>
                            <Badge variant={inv.status === 'paid' ? 'default' : 'outline'}>{inv.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-8">No invoices found</p>}
            </TabsContent>

            <TabsContent value="bills" className="space-y-4">
              {clientData.bills?.length ? (
                <div className="grid gap-3">
                  {clientData.bills.map((bill: any) => (
                    <Card key={bill.id}>
                      <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{bill.billName}</div>
                          <div className="text-xs text-muted-foreground">{bill.frequency} · Due day {bill.dueDay}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">£{bill.amount?.toFixed(2)}</div>
                          <Badge variant={bill.isActive ? 'default' : 'outline'}>{bill.isActive ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-8">No bills found</p>}
            </TabsContent>

            <TabsContent value="entities" className="space-y-4">
              {clientData.entities?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {clientData.entities.map((entity: any) => (
                    <Card key={entity.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          {entity.type === 'individual' || entity.type === 'sole_trader'
                            ? <User className="h-8 w-8 text-blue-500" />
                            : <Building2 className="h-8 w-8 text-amber-500" />
                          }
                          <div>
                            <div className="font-semibold">{entity.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {entity.type?.replace('_', ' ')}
                              {entity.companyNumber && ` · #${entity.companyNumber}`}
                            </div>
                            {entity.utr && <div className="text-xs text-muted-foreground">UTR: {entity.utr}</div>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-8">No entities found</p>}
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-muted-foreground text-center py-10">No data available</p>
        )}
      </div>
    );
  }

  // Client list view
  const activeClients = clients.filter(c => c.status === 'active');
  const pendingClients = clients.filter(c => c.status === 'pending');
  const revokedClients = clients.filter(c => c.status === 'revoked');
  const offlineClients = clients.filter(c => c.status === 'offline');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6" /> Accountant Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your clients and view their financial data</p>
        </div>
        <div className="flex gap-2">
          {/* Walk-in client dialog */}
          <Dialog open={showWalkIn} onOpenChange={setShowWalkIn}>
            <DialogTrigger asChild>
              <Button variant="outline"><UserCheck className="h-4 w-4 mr-2" /> Cliente Pontual</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-purple-500" /> Novo Cliente Pontual</DialogTitle>
                <p className="text-sm text-muted-foreground">Cliente sem conta no sistema — preenche os dados recolhidos por telefone ou presencialmente.</p>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Nome Completo *</Label>
                    <Input placeholder="João Silva" value={walkInForm.offlineFullName} onChange={e => setWalkInForm(p => ({ ...p, offlineFullName: e.target.value }))} />
                  </div>
                  <div>
                    <Label><Phone className="h-3 w-3 inline mr-1" />Telefone</Label>
                    <Input placeholder="+44 7000 000000" value={walkInForm.offlinePhone} onChange={e => setWalkInForm(p => ({ ...p, offlinePhone: e.target.value }))} />
                  </div>
                  <div>
                    <Label><CalendarDays className="h-3 w-3 inline mr-1" />Data Nasc.</Label>
                    <Input type="date" value={walkInForm.offlineDob} onChange={e => setWalkInForm(p => ({ ...p, offlineDob: e.target.value }))} />
                  </div>
                  <div>
                    <Label><Hash className="h-3 w-3 inline mr-1" />NI Number</Label>
                    <Input placeholder="AB123456C" value={walkInForm.offlineNino} onChange={e => setWalkInForm(p => ({ ...p, offlineNino: e.target.value }))} className="font-mono" />
                  </div>
                  <div>
                    <Label><Hash className="h-3 w-3 inline mr-1" />UTR</Label>
                    <Input placeholder="1234567890" value={walkInForm.offlineUtr} onChange={e => setWalkInForm(p => ({ ...p, offlineUtr: e.target.value }))} className="font-mono" />
                  </div>
                  <div className="col-span-2">
                    <Label><MapPin className="h-3 w-3 inline mr-1" />Endereço</Label>
                    <Input placeholder="123 High Street, London, E1 6RF" value={walkInForm.offlineAddress} onChange={e => setWalkInForm(p => ({ ...p, offlineAddress: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Serviço</Label>
                    <select value={walkInForm.offlineService} onChange={e => setWalkInForm(p => ({ ...p, offlineService: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Selecionar...</option>
                      {OFFLINE_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Ano Fiscal</Label>
                    <select value={walkInForm.offlineTaxYear} onChange={e => setWalkInForm(p => ({ ...p, offlineTaxYear: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Selecionar...</option>
                      {TAX_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label><PoundSterling className="h-3 w-3 inline mr-1" />Honorários (£)</Label>
                    <Input type="number" placeholder="150.00" value={walkInForm.offlineFee} onChange={e => setWalkInForm(p => ({ ...p, offlineFee: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Notas internas</Label>
                    <Textarea placeholder="Observações, docs em falta, prazos..." value={walkInForm.notes} onChange={e => setWalkInForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
                  </div>
                </div>
                <Button onClick={handleWalkIn} disabled={savingWalkIn || !walkInForm.offlineFullName} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  {savingWalkIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                  Guardar Cliente Pontual
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" /> Add Client</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Client Email *</Label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">If the client already has a Clarity & Co account, access will be granted immediately.</p>
              </div>
              <div>
                <Label>Label (optional)</Label>
                <Input
                  placeholder="e.g. John Smith - Sole Trader"
                  value={inviteForm.label}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Internal notes about this client..."
                  value={inviteForm.notes}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <Button onClick={handleInvite} disabled={inviting || !inviteForm.email} className="w-full">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{activeClients.length}</div>
            <p className="text-sm text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{pendingClients.length}</div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{offlineClients.length}</div>
            <p className="text-sm text-muted-foreground">Pontuais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{clients.length}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No clients yet</h3>
            <p className="text-muted-foreground mb-4">Start by inviting your first client</p>
            <Button onClick={() => setShowInvite(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id} className={client.status === 'revoked' ? 'opacity-60' : client.isOffline ? 'border-purple-200 dark:border-purple-800/50' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      client.isOffline ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-primary/10'
                    }`}>
                      {client.isOffline
                        ? <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        : <User className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {client.isOffline ? client.offlineFullName : (client.label || client.clientUser?.fullName || client.clientEmail)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        {client.isOffline ? (
                          <>
                            {client.offlineService && <span className="font-medium text-purple-600 dark:text-purple-400">{client.offlineService}</span>}
                            {client.offlineTaxYear && <span>· {client.offlineTaxYear}</span>}
                            {client.offlinePhone && <span>· <Phone className="h-2.5 w-2.5 inline" /> {client.offlinePhone}</span>}
                            {client.offlineNino && <span>· NI: {client.offlineNino}</span>}
                            {client.offlineFee != null && (
                              <span className={`font-medium ${ client.offlineFeePaid ? 'text-green-600' : 'text-amber-600' }`}>
                                · £{client.offlineFee.toFixed(2)} {client.offlineFeePaid ? '✓ Pago' : '⏳ Pendente'}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span>{client.clientEmail}</span>
                            {client.entityCount > 0 && <span>· {client.entityCount} entities</span>}
                            {client.lastAccessedAt && <span>· Last viewed {format(new Date(client.lastAccessedAt), 'dd MMM')}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(client.status)}
                    {client.isOffline && client.offlineFee != null && (
                      <Button size="sm" variant="outline"
                        className={client.offlineFeePaid ? 'border-green-400 text-green-700' : 'border-amber-400 text-amber-700'}
                        onClick={() => handleToggleFeePaid(client)}>
                        <Banknote className="h-3.5 w-3.5 mr-1" />
                        {client.offlineFeePaid ? 'Pago' : 'Marcar Pago'}
                      </Button>
                    )}
                    {client.status === 'active' && client.clientId && (
                      <Button size="sm" variant="outline" onClick={() => viewClientData(client)}>
                        <Eye className="h-4 w-4 mr-1" /> View Data
                      </Button>
                    )}
                    {client.status === 'active' && (
                      <Button size="sm" variant="ghost" onClick={() => handleRevoke(client.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(client.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {client.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic border-t pt-2">{client.notes}</p>
                )}
                {client.isOffline && (client.offlineUtr || client.offlineDob || client.offlineAddress) && (
                  <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-x-4 gap-y-1">
                    {client.offlineUtr && <span className="text-xs text-muted-foreground"><Hash className="h-2.5 w-2.5 inline mr-0.5" />UTR: <span className="font-mono font-medium">{client.offlineUtr}</span></span>}
                    {client.offlineDob && <span className="text-xs text-muted-foreground"><CalendarDays className="h-2.5 w-2.5 inline mr-0.5" />DOB: {client.offlineDob}</span>}
                    {client.offlineAddress && <span className="text-xs text-muted-foreground col-span-2"><MapPin className="h-2.5 w-2.5 inline mr-0.5" />{client.offlineAddress}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
