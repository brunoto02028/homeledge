'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Building2, CreditCard, Loader2, Building, Landmark, Wallet, Search, Link2, RefreshCw, Unlink, Zap, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Provider {
  id: string;
  name: string;
  type: string;
  logoUrl?: string;
  contactInfo?: string;
  accounts?: Account[];
}

interface Entity {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Account {
  id: string;
  providerId: string;
  entityId?: string | null;
  accountName: string;
  accountNumber?: string;
  accountType: string;
  balance: number;
  currency: string;
  isActive: boolean;
  provider?: Provider;
  entity?: Entity | null;
}

const PROVIDER_TYPES = [
  { value: 'bank', label: 'Bank', icon: Building },
  { value: 'utility', label: 'Utility', icon: Landmark },
  { value: 'subscription', label: 'Subscription', icon: CreditCard },
  { value: 'insurance', label: 'Insurance', icon: Building2 },
  { value: 'other', label: 'Other', icon: Wallet },
];

const ACCOUNT_TYPES = [
  { value: 'current', label: 'Current Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'business_current', label: 'Business Current Account' },
  { value: 'business_savings', label: 'Business Savings Account' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
];

// UK Banks - Digital and Traditional
const UK_BANKS = [
  // Traditional Banks
  { name: 'Barclays', logo: 'https://static.vecteezy.com/system/resources/previews/069/864/336/non_2x/barclays-bank-logo-glossy-rounded-square-icon-free-png.png', contact: '0345 734 5345' },
  { name: 'HSBC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/1200px-HSBC_logo_%282018%29.svg.png', contact: '0345 740 4404' },
  { name: 'Lloyds Bank', logo: 'https://cdn.freebiesupply.com/logos/large/2x/lloyds-bank-logo-png-transparent.png', contact: '0345 300 0000' },
  { name: 'NatWest', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Natwest_2014_logo.svg/1855px-Natwest_2014_logo.svg.png', contact: '0345 788 8444' },
  { name: 'Santander UK', logo: 'https://cdn.freebiesupply.com/logos/large/2x/santander-logo-png-transparent.png', contact: '0800 389 7000' },
  { name: 'TSB', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/TSB_logo_2013.svg/1280px-TSB_logo_2013.svg.png', contact: '0345 975 8758' },
  { name: 'Royal Bank of Scotland', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Royal_Bank_of_Scotland_logo.svg/960px-Royal_Bank_of_Scotland_logo.svg.png', contact: '0345 724 2424' },
  { name: 'Halifax', logo: 'https://cdn.freebiesupply.com/logos/large/2x/halifax-logo-png-transparent.png', contact: '0345 720 3040' },
  { name: 'Nationwide', logo: 'https://1000logos.net/wp-content/uploads/2023/01/Nationwide-logo.png', contact: '0800 302 0192' },
  { name: 'Co-operative Bank', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/The_co-operative_bank_logo.svg/2560px-The_co-operative_bank_logo.svg.png', contact: '0345 7212 212' },
  { name: 'Yorkshire Bank', logo: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Yorkshire_Bank_logo.svg', contact: '0800 202 122' },
  { name: 'Metro Bank', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Metropolitan_Bank_and_Trust_Company.svg/1280px-Metropolitan_Bank_and_Trust_Company.svg.png', contact: '0345 08 08 500' },
  // Digital Banks
  { name: 'Monzo', logo: 'https://upload.wikimedia.org/wikipedia/en/archive/3/3a/20251111151609%21Monzo_logo.png', contact: 'In-app support' },
  { name: 'Starling Bank', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Starling_Bank_Logo.png', contact: 'In-app support' },
  { name: 'Revolut', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Logo_Revolut.png', contact: 'In-app support' },
  { name: 'Chase UK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Chase_logo_2007.svg/1200px-Chase_logo_2007.svg.png', contact: 'In-app support' },
  { name: 'N26', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/N26_logo.svg/1200px-N26_logo.svg.png', contact: 'In-app support' },
  { name: 'Atom Bank', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Atom_Bank_Logo.svg/1200px-Atom_Bank_Logo.svg.png', contact: 'In-app support' },
  { name: 'Tandem Bank', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Tandem_Logo.jpg', contact: 'In-app support' },
  { name: 'Wise', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/New_Wise_%28formerly_TransferWise%29_logo.svg/2560px-New_Wise_%28formerly_TransferWise%29_logo.svg.png', contact: 'wise.com/help' },
];

export default function ProvidersClient() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'providers' | 'accounts' | 'openbanking'>('providers');
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankSelector, setShowBankSelector] = useState(false);
  const { toast } = useToast();

  // Open Banking state
  const [bankConnections, setBankConnections] = useState<any[]>([]);
  const [obConfigured, setObConfigured] = useState<boolean | null>(null);
  const [connectingBank, setConnectingBank] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [obAccountId, setObAccountId] = useState('');
  const [obEntityId, setObEntityId] = useState('');

  const [entities, setEntities] = useState<Entity[]>([]);

  const [providerForm, setProviderForm] = useState({
    name: '',
    type: 'bank',
    logoUrl: '',
    contactInfo: '',
  });

  const [accountForm, setAccountForm] = useState({
    providerId: '',
    entityId: '',
    accountName: '',
    accountNumber: '',
    accountType: 'current',
    balance: '',
    currency: 'GBP',
    isActive: true,
  });

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const res = await fetch('/api/entities');
      const data = await res.json();
      setEntities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  }, []);

  const fetchBankConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/open-banking/connect');
      if (res.ok) {
        const data = await res.json();
        setBankConnections(data.connections || []);
        setObConfigured(data.configured ?? false);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProviders();
    fetchAccounts();
    fetchEntities();
    fetchBankConnections();

    // Check for Open Banking callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get('ob_success')) {
      const synced = params.get('synced');
      const bankLabel = params.get('bank') || 'your bank';
      const isSyncing = params.get('syncing') === 'true';
      const desc = synced
        ? `Connected to ${bankLabel} — ${synced} transactions synced automatically!`
        : isSyncing
          ? `Connected to ${bankLabel} — syncing transactions in background. Refresh in a minute to see your data.`
          : `Successfully connected to ${bankLabel}`;
      toast({ title: 'Bank Connected!', description: desc, duration: 15000 });
      fetchBankConnections();
      window.history.replaceState({}, '', '/providers');
    } else if (params.get('ob_error')) {
      toast({ title: 'Connection Failed', description: params.get('ob_error') || 'Unknown error', variant: 'destructive' });
      window.history.replaceState({}, '', '/providers');
    }
  }, [fetchProviders, fetchAccounts, fetchEntities, fetchBankConnections]);

  const handleConnectBank = async () => {
    setConnectingBank(true);
    try {
      const res = await fetch('/api/open-banking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: obAccountId || null, entityId: obEntityId || null }),
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({ title: 'Error', description: data.message || data.error || 'Failed to start connection', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to connect', variant: 'destructive' });
    } finally {
      setConnectingBank(false);
    }
  };

  const handleReconnectBank = async (conn: any) => {
    // Step 1: Disconnect old connection
    try {
      await fetch('/api/open-banking/connect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: conn.id }),
      });
    } catch { /* continue even if disconnect fails */ }

    // Step 2: Start new connection with same entity
    setConnectingBank(true);
    try {
      const res = await fetch('/api/open-banking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: conn.accountId || null, entityId: conn.entityId || null }),
      });
      const data = await res.json();
      if (data.authUrl) {
        toast({ title: 'Reconnecting...', description: 'You will be redirected to your bank. After login, all history will be synced automatically.' });
        window.location.href = data.authUrl;
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to reconnect', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to reconnect', variant: 'destructive' });
    } finally {
      setConnectingBank(false);
    }
  };

  const handleRefreshConnection = async (connId: string) => {
    setSyncingId(connId);
    try {
      const res = await fetch('/api/open-banking/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.code === 'ALREADY_SYNCED') {
          toast({
            title: `✅ Up to Date — ${data.bank || 'Bank'}`,
            description: 'All transactions are synced. No new activity.',
          });
        } else {
          const parts = [];
          if (data.synced > 0) parts.push(`${data.synced} new transactions`);
          if (data.skipped > 0) parts.push(`${data.skipped} duplicates skipped`);
          if (data.categorized > 0) parts.push(`${data.categorized} auto-categorized`);
          const desc = parts.length > 0 ? parts.join(' | ') : 'No new transactions';
          toast({ title: `Refreshed — ${data.bank || 'Bank'}`, description: desc });
        }
        fetchBankConnections();
        fetchAccounts();
      } else if (data.code === 'SCA_EXCEEDED') {
        toast({
          title: 'Re-authentication Required',
          description: 'Click "Reconnect & Sync Full History" to refresh your bank connection.',
          variant: 'destructive',
          duration: 10000,
        });
        fetchBankConnections();
      } else {
        toast({ title: 'Refresh Failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Refresh failed', variant: 'destructive' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnectBank = async (connId: string) => {
    try {
      const res = await fetch('/api/open-banking/connect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connId }),
      });
      if (res.ok) {
        toast({ title: 'Disconnected' });
        fetchBankConnections();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to disconnect', variant: 'destructive' });
    }
  };

  const selectUkBank = (bank: typeof UK_BANKS[0]) => {
    setProviderForm({
      name: bank.name,
      type: 'bank',
      logoUrl: bank.logo,
      contactInfo: bank.contact,
    });
    setShowBankSelector(false);
    setBankSearch('');
  };

  const handleSaveProvider = async () => {
    if (!providerForm.name || !providerForm.type) {
      toast({ title: 'Error', description: 'Name and type are required', variant: 'destructive' });
      return;
    }

    try {
      const url = editProvider ? `/api/providers/${editProvider.id}` : '/api/providers';
      const method = editProvider ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerForm),
      });

      if (res.ok) {
        toast({ title: editProvider ? 'Provider Updated' : 'Provider Added' });
        setProviderDialogOpen(false);
        setEditProvider(null);
        setProviderForm({ name: '', type: 'bank', logoUrl: '', contactInfo: '' });
        fetchProviders();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving provider:', error);
      toast({ title: 'Error', description: 'Failed to save provider', variant: 'destructive' });
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await fetch(`/api/providers/${id}`, { method: 'DELETE' });
      toast({ title: 'Provider Deleted' });
      fetchProviders();
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast({ title: 'Error', description: 'Failed to delete provider', variant: 'destructive' });
    }
  };

  const handleSaveAccount = async () => {
    if (!accountForm.providerId || !accountForm.accountName || !accountForm.accountType) {
      toast({ title: 'Error', description: 'Provider, account name and type are required', variant: 'destructive' });
      return;
    }

    try {
      const url = editAccount ? `/api/accounts/${editAccount.id}` : '/api/accounts';
      const method = editAccount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...accountForm,
          entityId: accountForm.entityId || null,
          balance: parseFloat(accountForm.balance) || 0,
        }),
      });

      if (res.ok) {
        toast({ title: editAccount ? 'Account Updated' : 'Account Added' });
        setAccountDialogOpen(false);
        setEditAccount(null);
        setAccountForm({ providerId: '', entityId: '', accountName: '', accountNumber: '', accountType: 'current', balance: '', currency: 'GBP', isActive: true });
        fetchAccounts();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving account:', error);
      toast({ title: 'Error', description: 'Failed to save account', variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      toast({ title: 'Account Deleted' });
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({ title: 'Error', description: 'Failed to delete account', variant: 'destructive' });
    }
  };

  const openEditProvider = (provider: Provider) => {
    setEditProvider(provider);
    setProviderForm({
      name: provider.name,
      type: provider.type,
      logoUrl: provider.logoUrl || '',
      contactInfo: provider.contactInfo || '',
    });
    setProviderDialogOpen(true);
  };

  const openEditAccount = (account: Account) => {
    setEditAccount(account);
    setAccountForm({
      providerId: account.providerId,
      entityId: account.entityId || '',
      accountName: account.accountName,
      accountNumber: account.accountNumber || '',
      accountType: account.accountType,
      balance: String(account.balance),
      currency: account.currency,
      isActive: account.isActive,
    });
    setAccountDialogOpen(true);
  };

  const openAddAccountForProvider = (provider: Provider) => {
    setEditAccount(null);
    setAccountForm({
      providerId: provider.id,
      entityId: '',
      accountName: '',
      accountNumber: '',
      accountType: 'current',
      balance: '',
      currency: 'GBP',
      isActive: true,
    });
    setAccountDialogOpen(true);
  };

  const filteredBanks = UK_BANKS.filter(bank =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('providers.title')}</h1>
          <p className="text-muted-foreground">{t('providers.subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="providers">
            <Building2 className="h-4 w-4 mr-2" /> Providers ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <CreditCard className="h-4 w-4 mr-2" /> Accounts ({accounts.length})
          </TabsTrigger>
          <TabsTrigger value="openbanking">
            <Link2 className="h-4 w-4 mr-2" /> Open Banking ({bankConnections.filter(c => c.status === 'active').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Providers</CardTitle>
                  <CardDescription>Banks, utilities, subscriptions and other service providers</CardDescription>
                </div>
                <Button onClick={() => { setEditProvider(null); setProviderForm({ name: '', type: 'bank', logoUrl: '', contactInfo: '' }); setProviderDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Provider
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : providers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No providers yet. Add your first provider above.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {provider.logoUrl && (
                              <div className="w-8 h-8 rounded overflow-hidden bg-muted flex items-center justify-center">
                                <img src={provider.logoUrl} alt={provider.name} className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                            )}
                            <span className="font-medium">{provider.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{provider.type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{provider.contactInfo || '-'}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openAddAccountForProvider(provider)} className="text-xs gap-1">
                              <Plus className="h-3 w-3" /> Account
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditProvider(provider)}><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Provider?</AlertDialogTitle>
                                  <AlertDialogDescription>This will also delete all associated accounts and bills.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProvider(provider.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Accounts</CardTitle>
                  <CardDescription>Bank accounts, credit cards and other financial accounts</CardDescription>
                </div>
                <Button onClick={() => { setEditAccount(null); setAccountForm({ providerId: providers[0]?.id || '', entityId: '', accountName: '', accountNumber: '', accountType: 'current', balance: '', currency: 'GBP', isActive: true }); setAccountDialogOpen(true); }} disabled={providers.length === 0}>
                  <Plus className="h-4 w-4 mr-2" /> Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {providers.length === 0 ? 'Add a provider first before creating accounts.' : 'No accounts yet. Add your first account above.'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{account.accountName}</p>
                            {account.accountNumber && <p className="text-sm text-muted-foreground">{account.accountNumber}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{account.provider?.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{account.entity?.name || <span className="italic">Personal</span>}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{account.accountType.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(account.balance)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditAccount(account)}><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                                  <AlertDialogDescription>This will also delete all associated bills and transactions.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAccount(account.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openbanking" className="space-y-6">
          {/* Connect New Bank */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /> Connect Your Bank</CardTitle>
                  <CardDescription>Automatically sync transactions daily via UK Open Banking. Works with personal and business accounts.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {obConfigured === false && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-500 text-sm">Setup Required</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Open Banking requires TrueLayer API credentials. To enable:
                      </p>
                      <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                        <li>Create an account at <a href="https://console.truelayer.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">console.truelayer.com</a></li>
                        <li>Create an application and set redirect URI to: <code className="text-xs bg-muted px-1 py-0.5 rounded">https://homeledger.co.uk/api/open-banking/callback</code></li>
                        <li>Add <code className="text-xs bg-muted px-1 py-0.5 rounded">TRUELAYER_CLIENT_ID</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">TRUELAYER_CLIENT_SECRET</code>, and <code className="text-xs bg-muted px-1 py-0.5 rounded">TRUELAYER_REDIRECT_URI</code> to your server environment</li>
                        <li>Restart the application</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Link to Account (optional)</Label>
                  <Select value={obAccountId || 'none'} onValueChange={v => setObAccountId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Create new —</SelectItem>
                      {accounts.filter(a => a.isActive).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.provider?.name} — {a.accountName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Entity (optional)</Label>
                  <Select value={obEntityId || 'personal'} onValueChange={v => setObEntityId(v === 'personal' ? '' : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      {entities.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleConnectBank} disabled={connectingBank || obConfigured === false} className="w-full">
                    {connectingBank ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                    Connect Bank
                  </Button>
                </div>
              </div>
              {obConfigured !== false && (
                <p className="text-xs text-muted-foreground mt-3">You&apos;ll be redirected to your bank to authorise access. HomeLedger uses TrueLayer (FCA-regulated) for secure Open Banking connections.</p>
              )}
            </CardContent>
          </Card>

          {/* Active Connections */}
          {bankConnections.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {bankConnections.map(conn => {
                const statusConfig: Record<string, { color: string; border: string; dot: string; label: string }> = {
                  active: { color: 'text-emerald-500', border: 'border-emerald-500/30', dot: 'bg-emerald-500', label: 'Active' },
                  pending: { color: 'text-amber-500', border: 'border-amber-500/30', dot: 'bg-amber-500', label: 'Pending' },
                  expired: { color: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500', label: 'Expired' },
                  revoked: { color: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500', label: 'Disconnected' },
                  error: { color: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500', label: 'Error' },
                };
                const sc = statusConfig[conn.status] || statusConfig.error;

                return (
                  <Card key={conn.id} className={`${sc.border} border`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Building2 className="h-5 w-5 text-primary" />
                            <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${sc.dot} ring-2 ring-background`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{conn.bankName || 'Bank Connection'}</h3>
                            <p className="text-xs text-muted-foreground font-medium">{conn.entityName || 'Personal'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`gap-1.5 ${sc.color}`}>
                          <span className={`h-2 w-2 rounded-full ${sc.dot} animate-pulse`} /> {sc.label}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground mb-4">
                        {conn.entityName && <p>Entity: <span className="text-foreground font-medium">{conn.entityName}</span></p>}
                        {conn.lastSyncAt && (
                          <p className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-green-500 font-medium">Synced</span>
                            <span className="text-muted-foreground">— {new Date(conn.lastSyncAt).toLocaleString()}</span>
                          </p>
                        )}
                        {conn.transactionCount > 0 && <p>Transactions: <span className="text-foreground font-medium">{conn.transactionCount}</span></p>}
                        {conn.lastSyncError && <p className="text-red-400 text-xs">{conn.lastSyncError}</p>}
                        <p className="text-xs text-muted-foreground">Auto-sync 3x daily | Auto-categorize: {conn.autoCategories ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {conn.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => handleRefreshConnection(conn.id)} disabled={syncingId === conn.id}>
                            {syncingId === conn.id ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Refreshing...</> : <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</>}
                          </Button>
                        )}
                        {['active', 'expired', 'error'].includes(conn.status) && (
                          <Button
                            size="sm"
                            variant={conn.status === 'expired' || conn.status === 'error' ? 'default' : 'outline'}
                            className={conn.status === 'expired' || conn.status === 'error'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'border-amber-500 text-amber-500 hover:bg-amber-950/20'}
                            onClick={() => handleReconnectBank(conn)}
                            disabled={connectingBank}
                          >
                            {connectingBank ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Link2 className="h-3.5 w-3.5 mr-1" />}
                            {conn.status === 'expired' || conn.status === 'error' ? 'Reconnect Bank' : 'Reconnect & Sync Full History'}
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            {['revoked', 'error', 'expired'].includes(conn.status) ? (
                              <Button size="sm" variant="ghost" className="text-red-500"><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="text-red-500"><Unlink className="h-3.5 w-3.5 mr-1" /> Disconnect</Button>
                            )}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {['revoked', 'error', 'expired'].includes(conn.status) ? `Delete ${conn.bankName}?` : `Disconnect ${conn.bankName}?`}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {['revoked', 'error', 'expired'].includes(conn.status)
                                  ? 'This will permanently remove this connection. Existing synced transactions will remain.'
                                  : 'This will revoke access. Existing synced data will remain.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDisconnectBank(conn.id)}>
                                {['revoked', 'error', 'expired'].includes(conn.status) ? 'Delete' : 'Disconnect'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {bankConnections.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Link2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No bank connections yet</h3>
                <p className="text-muted-foreground mb-2">Connect your bank above to automatically sync transactions daily.</p>
                <p className="text-xs text-muted-foreground">Supports all major UK banks: Monzo, Starling, Barclays, HSBC, Lloyds, NatWest, Santander, and more.</p>
              </CardContent>
            </Card>
          )}

          {/* Info cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm mb-1">Automatic Sync</h4>
                <p className="text-xs text-muted-foreground">Transactions sync daily. New entries are auto-categorized using AI.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm mb-1">Personal &amp; Business</h4>
                <p className="text-xs text-muted-foreground">Works with personal current accounts, savings, and business bank accounts.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm mb-1">FCA Regulated</h4>
                <p className="text-xs text-muted-foreground">TrueLayer is authorised by the FCA. Your bank credentials are never shared.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Provider Dialog */}
      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editProvider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
            <DialogDescription>Add a bank, utility company or other service provider.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editProvider && providerForm.type === 'bank' && (
              <div className="space-y-2">
                <Label>Select UK Bank (Optional)</Label>
                <div className="relative">
                  <Input
                    placeholder="Search UK banks..."
                    value={bankSearch}
                    onChange={(e) => { setBankSearch(e.target.value); setShowBankSelector(true); }}
                    onFocus={() => setShowBankSelector(true)}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {showBankSelector && filteredBanks.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-md bg-popover shadow-lg">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank.name}
                        type="button"
                        onClick={() => selectUkBank(bank)}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                      >
                        <img src={bank.logo} alt={bank.name} className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span>{bank.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Provider Name *</Label>
              <Input
                id="name"
                value={providerForm.name}
                onChange={(e) => setProviderForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Barclays, British Gas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={providerForm.type} onValueChange={(v) => setProviderForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={providerForm.logoUrl}
                onChange={(e) => setProviderForm(f => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://www.onlinelogomaker.com/blog/wp-content/uploads/2017/09/elegant-logo-design.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Info</Label>
              <Input
                id="contactInfo"
                value={providerForm.contactInfo}
                onChange={(e) => setProviderForm(f => ({ ...f, contactInfo: e.target.value }))}
                placeholder="Phone or website"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProvider}>{editProvider ? 'Save Changes' : 'Add Provider'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
            <DialogDescription>Add a bank account, credit card or other financial account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="providerId">Provider *</Label>
              <Select value={accountForm.providerId} onValueChange={(v) => setAccountForm(f => ({ ...f, providerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entity (optional)</Label>
              <Select value={accountForm.entityId || 'personal'} onValueChange={(v) => setAccountForm(f => ({ ...f, entityId: v === 'personal' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Personal (no entity)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal (no entity)</SelectItem>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Link this account to a business entity for separate tracking</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                value={accountForm.accountName}
                onChange={(e) => setAccountForm(f => ({ ...f, accountName: e.target.value }))}
                placeholder="e.g., Main Current Account"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number (last 4)</Label>
                <Input
                  id="accountNumber"
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm(f => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="****1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <Select value={accountForm.accountType} onValueChange={(v) => setAccountForm(f => ({ ...f, accountType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((at) => (
                      <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance">Current Balance (£)</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm(f => ({ ...f, balance: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={accountForm.currency} onValueChange={(v) => setAccountForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAccount}>{editAccount ? 'Save Changes' : 'Add Account'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Period Dialog removed — full mirror sync now handles everything automatically */}
    </div>
  );
}
