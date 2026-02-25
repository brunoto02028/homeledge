'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useEntityContext } from '@/components/entity-context';
import {
  Building, User, Link2, Unlink, RefreshCw, Loader2, AlertTriangle,
  CheckCircle2, ExternalLink, MapPin, Users, FileText, Clock, Shield,
  ChevronRight, Download, Eye, Send, PlusCircle, UserPlus, UserMinus,
  Pencil, Trash2, CalendarDays, History, AlertCircle, Info
} from 'lucide-react';

interface GovConnection {
  id: string;
  entityId: string;
  provider: 'companies_house' | 'hmrc';
  companyNumber?: string;
  govGatewayId?: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
  connectedAt: string;
  scope: string | null;
  profileData: any;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  companyNumber?: string;
  niNumber?: string;
  vatNumber?: string;
}

export default function ConnectionsClient() {
  const { toast } = useToast();
  const { selectedEntity } = useEntityContext();
  const [connections, setConnections] = useState<GovConnection[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Connect dialog state
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectProvider, setConnectProvider] = useState<'companies_house' | 'hmrc'>('companies_house');
  const [connectEntityId, setConnectEntityId] = useState('');
  const [connectCompanyNumber, setConnectCompanyNumber] = useState('');
  const [connectAuthCode, setConnectAuthCode] = useState('');

  // CH Filing dialog
  const [showFilingDialog, setShowFilingDialog] = useState(false);
  const [filingConnection, setFilingConnection] = useState<GovConnection | null>(null);
  const [filingType, setFilingType] = useState('change_registered_office');
  const [filingData, setFilingData] = useState<any>({});
  const [submittingFiling, setSubmittingFiling] = useState(false);
  const [officersList, setOfficersList] = useState<any[]>([]);
  const [ourFilings, setOurFilings] = useState<any[]>([]);

  // Detail view
  const [viewConnection, setViewConnection] = useState<GovConnection | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedEntity]);

  // Check URL params for success/error from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    if (success) {
      toast({ title: 'Connected!', description: `Successfully connected to ${success === 'companies_house' ? 'Companies House' : 'HMRC'}.` });
      window.history.replaceState({}, '', '/connections');
      fetchData();
    }
    if (error) {
      toast({ title: 'Connection Failed', description: decodeURIComponent(error), variant: 'destructive' });
      window.history.replaceState({}, '', '/connections');
    }
  }, []);

  const fetchData = async () => {
    try {
      const entityQs = selectedEntity?.id ? `?entityId=${selectedEntity.id}` : '';
      const [connRes, entRes] = await Promise.all([
        fetch(`/api/government/connect${entityQs}`),
        fetch('/api/entities'),
      ]);
      if (connRes.ok) setConnections(await connRes.json());
      if (entRes.ok) setEntities(await entRes.json());
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!connectEntityId) {
      toast({ title: 'Select an entity', variant: 'destructive' });
      return;
    }
    if (connectProvider === 'companies_house' && !connectCompanyNumber) {
      toast({ title: 'Company number required', variant: 'destructive' });
      return;
    }

    setConnecting(true);
    console.log('[Connect] Starting...', { provider: connectProvider, entityId: connectEntityId, companyNumber: connectCompanyNumber, authCode: connectAuthCode ? '***' : 'none' });
    try {
      const res = await fetch('/api/government/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: connectProvider,
          entityId: connectEntityId,
          companyNumber: connectCompanyNumber || undefined,
          authCode: connectAuthCode || undefined,
        }),
      });

      console.log('[Connect] Response status:', res.status);
      const text = await res.text();

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`);
      }

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      if (!data.authUrl) {
        throw new Error('No authUrl returned from server');
      }

      console.log('[Connect] Redirecting to CH for authentication...');
      // Redirect to OAuth provider — user authenticates on CH, then is sent back
      window.location.href = data.authUrl;
    } catch (err: any) {
      console.error('[Connect] Error:', err);
      toast({ title: 'Connection Error', description: err.message || 'Unknown error', variant: 'destructive' });
      setConnecting(false);
    }
  };

  const handleSync = async (connection: GovConnection) => {
    setSyncing(connection.id);
    try {
      const endpoint = connection.provider === 'companies_house'
        ? `/api/government/ch/${connection.id}?action=full-sync`
        : `/api/government/hmrc/${connection.id}?action=full-sync`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: 'Sync Complete', description: 'Data updated from ' + (connection.provider === 'companies_house' ? 'Companies House' : 'HMRC') });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Sync Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSyncing(null);
    }
  };

  const handleSubmitFiling = async () => {
    if (!filingConnection) return;
    setSubmittingFiling(true);
    try {
      const res = await fetch(`/api/government/ch/${filingConnection.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filingType, formData: filingData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: data.filing.status === 'rejected' ? 'Filing Rejected' : 'Filing Submitted',
        description: data.filing.reference ? `Reference: ${data.filing.reference}` : data.filing.responseData?.error || 'Submitted to Companies House',
        variant: data.filing.status === 'rejected' ? 'destructive' : 'default',
      });
      setShowFilingDialog(false);
    } catch (err: any) {
      toast({ title: 'Filing Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmittingFiling(false);
    }
  };

  const openFilingDialog = async (conn: GovConnection) => {
    setFilingConnection(conn);
    setFilingType('change_registered_office');
    setFilingData({});
    setShowFilingDialog(true);
    // Fetch officers for terminate/change forms
    try {
      const res = await fetch(`/api/government/ch/${conn.id}?action=officers`);
      if (res.ok) {
        const d = await res.json();
        setOfficersList((d.data?.items || []).filter((o: any) => !o.resigned_on));
      }
    } catch { /* ignore */ }
    // Fetch our filings
    try {
      const res = await fetch(`/api/government/ch/${conn.id}?action=our-filings`);
      if (res.ok) {
        const d = await res.json();
        setOurFilings(d.data || []);
      }
    } catch { /* ignore */ }
  };

  const resetFilingData = (type: string) => {
    setFilingType(type);
    switch (type) {
      case 'change_registered_office':
        setFilingData({ addressLine1: '', addressLine2: '', city: '', region: '', postcode: '', country: 'England' });
        break;
      case 'confirmation_statement':
        setFilingData({ noUpdatesRequired: true });
        break;
      case 'appoint_director':
        setFilingData({ firstName: '', lastName: '', dateOfBirth: '', nationality: 'British', occupation: '', appointedOn: new Date().toISOString().slice(0, 10), serviceAddressLine1: '', serviceCity: '', servicePostcode: '', serviceCountry: 'England', sameAsService: true, consentToAct: false });
        break;
      case 'appoint_secretary':
        setFilingData({ firstName: '', lastName: '', appointedOn: new Date().toISOString().slice(0, 10), serviceAddressLine1: '', serviceCity: '', servicePostcode: '', serviceCountry: 'England' });
        break;
      case 'terminate_director':
      case 'terminate_secretary':
        setFilingData({ officerId: '', resignedOn: new Date().toISOString().slice(0, 10) });
        break;
      case 'change_officer_details':
        setFilingData({ officerId: '', newServiceAddress: false, newResidentialAddress: false, nameChange: false });
        break;
      case 'strike_off':
        setFilingData({ reason: 'Company no longer trading', confirmation: false });
        break;
      default:
        setFilingData({});
    }
  };

  const getEntityById = (id: string) => entities.find(e => e.id === id);
  const isCompanyType = (type: string) => ['limited_company', 'llp', 'partnership'].includes(type);

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Government Connections</h1>
          <p className="text-muted-foreground">Connect to Companies House and HMRC to manage your businesses and tax directly.</p>
        </div>
        <Button onClick={() => { setShowConnectDialog(true); setConnectEntityId(selectedEntity?.id || ''); }}>
          <PlusCircle className="h-4 w-4 mr-2" /> New Connection
        </Button>
      </div>

      {/* Active Connections */}
      {connections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your companies to Companies House for real-time filing, or link your HMRC account for tax data.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setConnectProvider('companies_house'); setShowConnectDialog(true); }}>
                <Building className="h-4 w-4 mr-2" /> Connect Companies House
              </Button>
              <Button variant="outline" onClick={() => { setConnectProvider('hmrc'); setShowConnectDialog(true); }}>
                <User className="h-4 w-4 mr-2" /> Connect HMRC
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map(conn => {
            const entity = getEntityById(conn.entityId);
            const isCH = conn.provider === 'companies_house';
            return (
              <Card key={conn.id} className={conn.status === 'active' ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isCH ? 'bg-blue-100 dark:bg-blue-950/40' : 'bg-amber-100 dark:bg-amber-950/40'}`}>
                        {isCH ? <Building className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-amber-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{isCH ? 'Companies House' : 'HMRC'}</h3>
                          <Badge variant={conn.status === 'active' ? 'default' : 'destructive'} className={conn.status === 'active' ? 'bg-green-600' : ''}>
                            {conn.status === 'active' ? <><CheckCircle2 className="h-3 w-3 mr-1" />Connected</> : conn.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entity?.name || 'Unknown Entity'}
                          {conn.companyNumber && <span className="ml-2 text-xs">({conn.companyNumber})</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Last synced: {formatDate(conn.lastSyncAt)}
                        </p>
                        {conn.lastError && (
                          <p className="text-xs text-red-500 mt-1">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {conn.lastError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(conn)}
                        disabled={syncing === conn.id}
                      >
                        {syncing === conn.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Sync</span>
                      </Button>

                      {conn.profileData && (
                        <Button variant="outline" size="sm" onClick={() => setViewConnection(conn)}>
                          <Eye className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">View</span>
                        </Button>
                      )}

                      {isCH && conn.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openFilingDialog(conn)}
                        >
                          <Send className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">File</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-5 w-5 text-blue-600" /> Companies House
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-muted-foreground">Manage your limited companies directly:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2"><MapPin className="h-3 w-3 text-green-600" /> Change registered address (AD01)</li>
              <li className="flex items-center gap-2"><UserPlus className="h-3 w-3 text-green-600" /> Appoint/resign directors &amp; secretaries</li>
              <li className="flex items-center gap-2"><Pencil className="h-3 w-3 text-green-600" /> Update officer details (name, address)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-600" /> Submit confirmation statements (CS01)</li>
              <li className="flex items-center gap-2"><FileText className="h-3 w-3 text-green-600" /> View filing history, PSCs &amp; deadlines</li>
              <li className="flex items-center gap-2"><Trash2 className="h-3 w-3 text-red-500" /> Apply to dissolve company (DS01)</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">Requires your company Authentication Code (sent by post to your registered address).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-amber-600" /> HMRC
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-muted-foreground">Access your tax data securely:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2"><FileText className="h-3 w-3 text-green-600" /> Self Assessment obligations &amp; calculations</li>
              <li className="flex items-center gap-2"><FileText className="h-3 w-3 text-green-600" /> VAT returns, liabilities &amp; payments</li>
              <li className="flex items-center gap-2"><Users className="h-3 w-3 text-green-600" /> Employment &amp; PAYE information</li>
              <li className="flex items-center gap-2"><Download className="h-3 w-3 text-green-600" /> Import tax data into reports</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">Uses Government Gateway login. We never store your password — only a secure OAuth token.</p>
          </CardContent>
        </Card>
      </div>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectProvider === 'companies_house' ? <Building className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-amber-600" />}
              Connect {connectProvider === 'companies_house' ? 'Companies House' : 'HMRC'}
            </DialogTitle>
            <DialogDescription>
              {connectProvider === 'companies_house'
                ? 'Link your company for electronic filing and real-time data.'
                : 'Connect your HMRC account via Government Gateway to access tax data.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Provider Toggle */}
            <div className="flex gap-2">
              <Button
                variant={connectProvider === 'companies_house' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setConnectProvider('companies_house')}
              >
                <Building className="h-4 w-4 mr-1" /> Companies House
              </Button>
              <Button
                variant={connectProvider === 'hmrc' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setConnectProvider('hmrc')}
              >
                <User className="h-4 w-4 mr-1" /> HMRC
              </Button>
            </div>

            {/* Entity Select */}
            <div>
              <Label>Entity</Label>
              <Select value={connectEntityId} onValueChange={(id) => {
                setConnectEntityId(id);
                const ent = entities.find(e => e.id === id);
                if (ent?.companyNumber) setConnectCompanyNumber(ent.companyNumber);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entity..." />
                </SelectTrigger>
                <SelectContent>
                  {entities
                    .filter(e => connectProvider === 'companies_house' ? isCompanyType(e.type) : true)
                    .map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.type.replace('_', ' ')})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {connectProvider === 'companies_house' && entities.filter(e => isCompanyType(e.type)).length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No company entities found. Create a company entity first in the Entities page.</p>
              )}
            </div>

            {/* CH-specific fields */}
            {connectProvider === 'companies_house' && (
              <>
                <div>
                  <Label>Company Number</Label>
                  <Input
                    value={connectCompanyNumber}
                    onChange={e => setConnectCompanyNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 12345678"
                    maxLength={8}
                    readOnly={!!entities.find(e => e.id === connectEntityId)?.companyNumber}
                    className={entities.find(e => e.id === connectEntityId)?.companyNumber ? 'bg-muted' : ''}
                  />
                  {entities.find(e => e.id === connectEntityId)?.companyNumber && (
                    <p className="text-xs text-green-600 mt-1">Auto-filled from entity</p>
                  )}
                </div>
                <div>
                  <Label>Authentication Code</Label>
                  <Input
                    value={connectAuthCode}
                    onChange={e => setConnectAuthCode(e.target.value.toUpperCase())}
                    placeholder="6-character code from CH"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">Required for filing. CH sends this to your registered office.</p>
                </div>
              </>
            )}

            {connectProvider === 'hmrc' && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Click Connect below</li>
                  <li>You&apos;ll be redirected to the HMRC Government Gateway</li>
                  <li>Log in with your Government Gateway credentials</li>
                  <li>Grant permission for HomeLedger to access your data</li>
                  <li>You&apos;ll be redirected back here automatically</li>
                </ol>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              Connect {connectProvider === 'companies_house' ? 'Companies House' : 'HMRC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CH Filing Dialog — All Filing Types */}
      <Dialog open={showFilingDialog} onOpenChange={setShowFilingDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" /> Companies House Filing
            </DialogTitle>
            <DialogDescription>
              Submit a change for company {filingConnection?.companyNumber}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={filingType} onValueChange={resetFilingData}>
            <TabsList className="grid grid-cols-4 h-auto">
              <TabsTrigger value="change_registered_office" className="text-xs px-2 py-1.5">
                <MapPin className="h-3 w-3 mr-1" />Address
              </TabsTrigger>
              <TabsTrigger value="appoint_director" className="text-xs px-2 py-1.5">
                <UserPlus className="h-3 w-3 mr-1" />Appoint
              </TabsTrigger>
              <TabsTrigger value="terminate_director" className="text-xs px-2 py-1.5">
                <UserMinus className="h-3 w-3 mr-1" />Resign
              </TabsTrigger>
              <TabsTrigger value="confirmation_statement" className="text-xs px-2 py-1.5">
                <CheckCircle2 className="h-3 w-3 mr-1" />CS01
              </TabsTrigger>
            </TabsList>
            <div className="mt-2 mb-1">
              <TabsList className="grid grid-cols-4 h-auto">
                <TabsTrigger value="change_officer_details" className="text-xs px-2 py-1.5">
                  <Pencil className="h-3 w-3 mr-1" />Edit Officer
                </TabsTrigger>
                <TabsTrigger value="appoint_secretary" className="text-xs px-2 py-1.5">
                  <UserPlus className="h-3 w-3 mr-1" />Secretary
                </TabsTrigger>
                <TabsTrigger value="strike_off" className="text-xs px-2 py-1.5">
                  <Trash2 className="h-3 w-3 mr-1" />Dissolve
                </TabsTrigger>
                <TabsTrigger value="filing_history" className="text-xs px-2 py-1.5">
                  <History className="h-3 w-3 mr-1" />History
                </TabsTrigger>
              </TabsList>
            </div>

            {/* AD01 — Change Registered Office */}
            <TabsContent value="change_registered_office" className="space-y-3 mt-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />Change of Registered Office Address (AD01) — Free
              </div>
              <div>
                <Label>Premises / Building</Label>
                <Input value={filingData.premises || ''} onChange={e => setFilingData({ ...filingData, premises: e.target.value })} placeholder="e.g. Unit 5, Building Name" />
              </div>
              <div>
                <Label>Address Line 1 *</Label>
                <Input value={filingData.addressLine1 || ''} onChange={e => setFilingData({ ...filingData, addressLine1: e.target.value })} placeholder="e.g. 10 High Street" />
              </div>
              <div>
                <Label>Address Line 2</Label>
                <Input value={filingData.addressLine2 || ''} onChange={e => setFilingData({ ...filingData, addressLine2: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City / Town *</Label><Input value={filingData.city || ''} onChange={e => setFilingData({ ...filingData, city: e.target.value })} /></div>
                <div><Label>County / Region</Label><Input value={filingData.region || ''} onChange={e => setFilingData({ ...filingData, region: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Postcode *</Label><Input value={filingData.postcode || ''} onChange={e => setFilingData({ ...filingData, postcode: e.target.value.toUpperCase() })} /></div>
                <div>
                  <Label>Country</Label>
                  <Select value={filingData.country || 'England'} onValueChange={v => setFilingData({ ...filingData, country: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="England">England</SelectItem>
                      <SelectItem value="Wales">Wales</SelectItem>
                      <SelectItem value="Scotland">Scotland</SelectItem>
                      <SelectItem value="Northern Ireland">Northern Ireland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* AP01 — Appoint Director */}
            <TabsContent value="appoint_director" className="space-y-3 mt-3">
              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />Appointment of Director (AP01) — Free
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Title</Label><Input value={filingData.title || ''} onChange={e => setFilingData({ ...filingData, title: e.target.value })} placeholder="Mr/Mrs/Ms" /></div>
                <div><Label>First Name *</Label><Input value={filingData.firstName || ''} onChange={e => setFilingData({ ...filingData, firstName: e.target.value })} /></div>
                <div><Label>Last Name *</Label><Input value={filingData.lastName || ''} onChange={e => setFilingData({ ...filingData, lastName: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date of Birth *</Label><Input type="date" value={filingData.dateOfBirth || ''} onChange={e => setFilingData({ ...filingData, dateOfBirth: e.target.value })} /></div>
                <div><Label>Nationality *</Label><Input value={filingData.nationality || 'British'} onChange={e => setFilingData({ ...filingData, nationality: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Occupation</Label><Input value={filingData.occupation || ''} onChange={e => setFilingData({ ...filingData, occupation: e.target.value })} /></div>
                <div><Label>Date Appointed *</Label><Input type="date" value={filingData.appointedOn || ''} onChange={e => setFilingData({ ...filingData, appointedOn: e.target.value })} /></div>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-2">Service Address (public)</p>
              <div><Label>Address Line 1 *</Label><Input value={filingData.serviceAddressLine1 || ''} onChange={e => setFilingData({ ...filingData, serviceAddressLine1: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>City *</Label><Input value={filingData.serviceCity || ''} onChange={e => setFilingData({ ...filingData, serviceCity: e.target.value })} /></div>
                <div><Label>Postcode *</Label><Input value={filingData.servicePostcode || ''} onChange={e => setFilingData({ ...filingData, servicePostcode: e.target.value.toUpperCase() })} /></div>
                <div><Label>Country</Label><Input value={filingData.serviceCountry || 'England'} onChange={e => setFilingData({ ...filingData, serviceCountry: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filingData.sameAsService || false} onChange={e => setFilingData({ ...filingData, sameAsService: e.target.checked })} className="rounded" />
                Residential address is same as service address
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filingData.consentToAct || false} onChange={e => setFilingData({ ...filingData, consentToAct: e.target.checked })} className="rounded" />
                <span className="font-medium">I confirm consent to act as director</span>
              </label>
            </TabsContent>

            {/* TM01 — Terminate Director */}
            <TabsContent value="terminate_director" className="space-y-3 mt-3">
              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />Termination of Director (TM01) — Free
              </div>
              <div>
                <Label>Select Officer to Resign *</Label>
                <Select value={filingData.officerId || ''} onValueChange={v => setFilingData({ ...filingData, officerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select officer..." /></SelectTrigger>
                  <SelectContent>
                    {officersList.filter(o => o.officer_role === 'director').map((o: any) => (
                      <SelectItem key={o.links?.officer?.appointments || o.name} value={o.links?.self?.split('/').pop() || o.name}>
                        {o.name} — {o.officer_role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date of Resignation *</Label><Input type="date" value={filingData.resignedOn || ''} onChange={e => setFilingData({ ...filingData, resignedOn: e.target.value })} /></div>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                A company must have at least one director. This filing will be rejected if it would leave the company with no directors.
              </div>
            </TabsContent>

            {/* CS01 — Confirmation Statement */}
            <TabsContent value="confirmation_statement" className="space-y-3 mt-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />Confirmation Statement (CS01) — £13 fee charged by Companies House
              </div>
              <label className="flex items-center gap-2 text-sm p-3 border rounded">
                <input type="checkbox" checked={filingData.noUpdatesRequired !== false} onChange={e => setFilingData({ ...filingData, noUpdatesRequired: e.target.checked })} className="rounded" />
                <div>
                  <span className="font-medium">No updates required</span>
                  <p className="text-xs text-muted-foreground">I confirm all company information on record is correct and up to date.</p>
                </div>
              </label>
            </TabsContent>

            {/* CH01 — Change Officer Details */}
            <TabsContent value="change_officer_details" className="space-y-3 mt-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />Change of Director/Secretary Details (CH01/CH02) — Free
              </div>
              <div>
                <Label>Select Officer *</Label>
                <Select value={filingData.officerId || ''} onValueChange={v => setFilingData({ ...filingData, officerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select officer..." /></SelectTrigger>
                  <SelectContent>
                    {officersList.map((o: any) => (
                      <SelectItem key={o.links?.officer?.appointments || o.name} value={o.links?.self?.split('/').pop() || o.name}>
                        {o.name} — {o.officer_role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filingData.nameChange || false} onChange={e => setFilingData({ ...filingData, nameChange: e.target.checked })} className="rounded" />
                Change name
              </label>
              {filingData.nameChange && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>New First Name</Label><Input value={filingData.newFirstName || ''} onChange={e => setFilingData({ ...filingData, newFirstName: e.target.value })} /></div>
                  <div><Label>New Last Name</Label><Input value={filingData.newLastName || ''} onChange={e => setFilingData({ ...filingData, newLastName: e.target.value })} /></div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={filingData.newServiceAddress || false} onChange={e => setFilingData({ ...filingData, newServiceAddress: e.target.checked })} className="rounded" />
                Change service address
              </label>
              {filingData.newServiceAddress && (
                <div className="space-y-2">
                  <div><Label>Address Line 1</Label><Input value={filingData.serviceAddressLine1 || ''} onChange={e => setFilingData({ ...filingData, serviceAddressLine1: e.target.value })} /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>City</Label><Input value={filingData.serviceCity || ''} onChange={e => setFilingData({ ...filingData, serviceCity: e.target.value })} /></div>
                    <div><Label>Postcode</Label><Input value={filingData.servicePostcode || ''} onChange={e => setFilingData({ ...filingData, servicePostcode: e.target.value.toUpperCase() })} /></div>
                    <div><Label>Country</Label><Input value={filingData.serviceCountry || 'England'} onChange={e => setFilingData({ ...filingData, serviceCountry: e.target.value })} /></div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>New Nationality</Label><Input value={filingData.newNationality || ''} onChange={e => setFilingData({ ...filingData, newNationality: e.target.value })} placeholder="Leave empty if no change" /></div>
                <div><Label>New Occupation</Label><Input value={filingData.newOccupation || ''} onChange={e => setFilingData({ ...filingData, newOccupation: e.target.value })} placeholder="Leave empty if no change" /></div>
              </div>
            </TabsContent>

            {/* AP02 — Appoint Secretary */}
            <TabsContent value="appoint_secretary" className="space-y-3 mt-3">
              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />Appointment of Secretary (AP02) — Free
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={filingData.firstName || ''} onChange={e => setFilingData({ ...filingData, firstName: e.target.value })} /></div>
                <div><Label>Last Name *</Label><Input value={filingData.lastName || ''} onChange={e => setFilingData({ ...filingData, lastName: e.target.value })} /></div>
              </div>
              <div><Label>Date Appointed *</Label><Input type="date" value={filingData.appointedOn || ''} onChange={e => setFilingData({ ...filingData, appointedOn: e.target.value })} /></div>
              <p className="text-xs font-medium text-muted-foreground">Service Address</p>
              <div><Label>Address Line 1 *</Label><Input value={filingData.serviceAddressLine1 || ''} onChange={e => setFilingData({ ...filingData, serviceAddressLine1: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>City *</Label><Input value={filingData.serviceCity || ''} onChange={e => setFilingData({ ...filingData, serviceCity: e.target.value })} /></div>
                <div><Label>Postcode *</Label><Input value={filingData.servicePostcode || ''} onChange={e => setFilingData({ ...filingData, servicePostcode: e.target.value.toUpperCase() })} /></div>
                <div><Label>Country</Label><Input value={filingData.serviceCountry || 'England'} onChange={e => setFilingData({ ...filingData, serviceCountry: e.target.value })} /></div>
              </div>
            </TabsContent>

            {/* DS01 — Strike Off */}
            <TabsContent value="strike_off" className="space-y-3 mt-3">
              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />Application to Strike Off (DS01) — Free. THIS ACTION IS IRREVERSIBLE.
              </div>
              <div>
                <Label>Reason for dissolution</Label>
                <Input value={filingData.reason || ''} onChange={e => setFilingData({ ...filingData, reason: e.target.value })} />
              </div>
              <div className="p-3 border-2 border-red-300 dark:border-red-700 rounded space-y-2">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Before applying to strike off, confirm:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>- The company has not traded in the last 3 months</li>
                  <li>- The company has no outstanding debts</li>
                  <li>- The company is not involved in any legal proceedings</li>
                  <li>- All directors must agree to the dissolution</li>
                </ul>
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input type="checkbox" checked={filingData.confirmation || false} onChange={e => setFilingData({ ...filingData, confirmation: e.target.checked })} className="rounded border-red-300" />
                  <span className="font-medium text-red-600 dark:text-red-400">I confirm all the above and wish to dissolve this company</span>
                </label>
              </div>
            </TabsContent>

            {/* Filing History from our system */}
            <TabsContent value="filing_history" className="space-y-3 mt-3">
              <p className="text-sm font-medium">Filings submitted through HomeLedger</p>
              {ourFilings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No filings submitted yet from this system.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {ourFilings.map((f: any) => (
                    <div key={f.id} className="p-3 border rounded text-sm flex items-center justify-between">
                      <div>
                        <span className="font-medium">{f.filingType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                        <p className="text-xs text-muted-foreground">{formatDate(f.createdAt)}</p>
                        {f.reference && <p className="text-xs text-muted-foreground">Ref: {f.reference}</p>}
                      </div>
                      <Badge variant={f.status === 'submitted' || f.status === 'accepted' ? 'default' : 'destructive'}
                        className={f.status === 'submitted' ? 'bg-blue-600' : f.status === 'accepted' ? 'bg-green-600' : ''}>
                        {f.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {filingType !== 'filing_history' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFilingDialog(false)}>Cancel</Button>
              <Button
                onClick={handleSubmitFiling}
                disabled={submittingFiling || (filingType === 'strike_off' && !filingData.confirmation) || (filingType === 'appoint_director' && !filingData.consentToAct)}
                variant={filingType === 'strike_off' ? 'destructive' : 'default'}
              >
                {submittingFiling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {filingType === 'strike_off' ? 'Apply to Dissolve' : 'Submit to Companies House'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* View Connection Data Dialog — Company Dashboard */}
      <Dialog open={!!viewConnection} onOpenChange={() => setViewConnection(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewConnection?.provider === 'companies_house' ? <Building className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-amber-600" />}
              {viewConnection?.provider === 'companies_house'
                ? (viewConnection.profileData?.profile?.company_name || 'Companies House')
                : 'HMRC'} Dashboard
            </DialogTitle>
          </DialogHeader>

          {viewConnection?.profileData && viewConnection.provider === 'companies_house' && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-5 h-auto">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="officers" className="text-xs">Officers</TabsTrigger>
                <TabsTrigger value="pscs" className="text-xs">PSCs</TabsTrigger>
                <TabsTrigger value="filings" className="text-xs">Filings</TabsTrigger>
                <TabsTrigger value="deadlines" className="text-xs">Deadlines</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-3">
                {viewConnection.profileData.profile && (() => {
                  const p = viewConnection.profileData.profile;
                  const addr = p.registered_office_address || {};
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50">
                          <CardContent className="p-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Company Number</span><span className="font-mono font-bold">{p.company_number}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={p.company_status === 'active' ? 'bg-green-600' : 'bg-red-600'}>{p.company_status}</Badge></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{p.type}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Incorporated</span><span>{p.date_of_creation}</span></div>
                            {p.sic_codes?.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">SIC Codes</span><span>{p.sic_codes.join(', ')}</span></div>}
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50">
                          <CardContent className="p-4 text-sm">
                            <p className="text-muted-foreground text-xs mb-2">Registered Office</p>
                            <div className="space-y-0.5">
                              {addr.premises && <p className="font-medium">{addr.premises}</p>}
                              {addr.address_line_1 && <p>{addr.address_line_1}</p>}
                              {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                              {addr.locality && <p>{addr.locality}</p>}
                              {addr.region && <p>{addr.region}</p>}
                              {addr.postal_code && <p className="font-mono font-bold">{addr.postal_code}</p>}
                              {addr.country && <p>{addr.country}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      {/* Quick deadlines summary */}
                      {viewConnection.profileData.deadlines && (
                        <div className="grid grid-cols-3 gap-3">
                          {viewConnection.profileData.deadlines.confirmationStatementDue && (
                            <Card className={new Date(viewConnection.profileData.deadlines.confirmationStatementDue) < new Date() ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'}>
                              <CardContent className="p-3 text-center">
                                <CalendarDays className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                                <p className="text-xs text-muted-foreground">Confirmation Statement</p>
                                <p className="text-sm font-bold">{viewConnection.profileData.deadlines.confirmationStatementDue}</p>
                                {new Date(viewConnection.profileData.deadlines.confirmationStatementDue) < new Date() && <Badge variant="destructive" className="text-xs mt-1">OVERDUE</Badge>}
                              </CardContent>
                            </Card>
                          )}
                          {viewConnection.profileData.deadlines.accountsDue && (
                            <Card className={new Date(viewConnection.profileData.deadlines.accountsDue) < new Date() ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20' : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20'}>
                              <CardContent className="p-3 text-center">
                                <FileText className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                                <p className="text-xs text-muted-foreground">Accounts Due</p>
                                <p className="text-sm font-bold">{viewConnection.profileData.deadlines.accountsDue}</p>
                                {new Date(viewConnection.profileData.deadlines.accountsDue) < new Date() && <Badge variant="destructive" className="text-xs mt-1">OVERDUE</Badge>}
                              </CardContent>
                            </Card>
                          )}
                          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <CardContent className="p-3 text-center">
                              <Users className="h-4 w-4 mx-auto mb-1 text-green-600" />
                              <p className="text-xs text-muted-foreground">Active Officers</p>
                              <p className="text-sm font-bold">{viewConnection.profileData.officers?.items?.filter((o: any) => !o.resigned_on).length || 0}</p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              {/* Officers Tab */}
              <TabsContent value="officers" className="space-y-3 mt-3">
                {viewConnection.profileData.officers?.items?.length > 0 ? (
                  viewConnection.profileData.officers.items.map((o: any, i: number) => (
                    <Card key={i} className={o.resigned_on ? 'opacity-60' : ''}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{o.name}</span>
                            <Badge variant="outline" className="text-xs">{o.officer_role}</Badge>
                            {o.resigned_on && <Badge variant="destructive" className="text-xs">Resigned</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-4">
                            <span>Appointed: {o.appointed_on}</span>
                            {o.resigned_on && <span>Resigned: {o.resigned_on}</span>}
                            {o.nationality && <span>Nationality: {o.nationality}</span>}
                            {o.occupation && <span>Occupation: {o.occupation}</span>}
                          </div>
                          {o.address && (
                            <p className="text-xs text-muted-foreground">{[o.address.premises, o.address.address_line_1, o.address.locality, o.address.postal_code].filter(Boolean).join(', ')}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No officers data available. Click Sync first.</p>
                )}
              </TabsContent>

              {/* PSCs Tab */}
              <TabsContent value="pscs" className="space-y-3 mt-3">
                {viewConnection.profileData.pscs?.items?.length > 0 ? (
                  viewConnection.profileData.pscs.items.map((psc: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{psc.name}</span>
                          <Badge variant="outline" className="text-xs">{psc.kind?.replace('individual-person-with-significant-control', 'Individual PSC')}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-4">
                          {psc.nationality && <span>Nationality: {psc.nationality}</span>}
                          {psc.country_of_residence && <span>Resident: {psc.country_of_residence}</span>}
                          {psc.notified_on && <span>Notified: {psc.notified_on}</span>}
                        </div>
                        {psc.natures_of_control && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {psc.natures_of_control.map((n: string, j: number) => (
                              <Badge key={j} variant="secondary" className="text-xs">{n.replace(/-/g, ' ')}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No PSCs data. Click Sync to fetch.</p>
                )}
              </TabsContent>

              {/* Filing History Tab */}
              <TabsContent value="filings" className="space-y-2 mt-3">
                {viewConnection.profileData.filingHistory?.items?.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {viewConnection.profileData.filingHistory.items.slice(0, 30).map((f: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div>
                          <span className="font-medium">{f.description || f.type}</span>
                          <p className="text-xs text-muted-foreground">{f.date} {f.category && `— ${f.category}`}</p>
                        </div>
                        {f.links?.document_metadata && (
                          <a href={`https://find-and-update.company-information.service.gov.uk${f.links.document_metadata}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No filing history. Click Sync to fetch.</p>
                )}
              </TabsContent>

              {/* Deadlines Tab */}
              <TabsContent value="deadlines" className="space-y-3 mt-3">
                {viewConnection.profileData.deadlines ? (
                  <div className="space-y-3">
                    {Object.entries(viewConnection.profileData.deadlines).map(([key, value]: [string, any]) => {
                      const isOverdue = new Date(value) < new Date();
                      const daysUntil = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <Card key={key} className={isOverdue ? 'border-red-300 dark:border-red-700' : daysUntil < 30 ? 'border-amber-300 dark:border-amber-700' : ''}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                              <p className="text-xs text-muted-foreground">{value}</p>
                            </div>
                            {isOverdue ? (
                              <Badge variant="destructive">OVERDUE by {Math.abs(daysUntil)} days</Badge>
                            ) : daysUntil < 30 ? (
                              <Badge className="bg-amber-600">{daysUntil} days left</Badge>
                            ) : (
                              <Badge variant="secondary">{daysUntil} days left</Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No deadline data. Click Sync to fetch.</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          {viewConnection?.profileData && viewConnection?.provider === 'hmrc' && (
            <Tabs defaultValue="hmrc-overview" className="w-full">
              <TabsList className="grid grid-cols-5 h-auto">
                <TabsTrigger value="hmrc-overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="hmrc-sa" className="text-xs">Self Assessment</TabsTrigger>
                <TabsTrigger value="hmrc-vat" className="text-xs">VAT</TabsTrigger>
                <TabsTrigger value="hmrc-employment" className="text-xs">Employment</TabsTrigger>
                <TabsTrigger value="hmrc-raw" className="text-xs">Raw Data</TabsTrigger>
              </TabsList>

              {/* HMRC Overview */}
              <TabsContent value="hmrc-overview" className="space-y-4 mt-3">
                {viewConnection.profileData.profile && !viewConnection.profileData.profile.error && (
                  <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50">
                    <CardContent className="p-4 text-sm space-y-2">
                      <p className="font-semibold text-base">Profile</p>
                      {viewConnection.profileData.profile.individual && (
                        <>
                          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{viewConnection.profileData.profile.individual.firstName} {viewConnection.profileData.profile.individual.lastName}</span></div>
                          {viewConnection.profileData.profile.individual.nino && <div className="flex justify-between"><span className="text-muted-foreground">NI Number</span><span className="font-mono">{viewConnection.profileData.profile.individual.nino}</span></div>}
                          {viewConnection.profileData.profile.individual.dateOfBirth && <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth</span><span>{viewConnection.profileData.profile.individual.dateOfBirth}</span></div>}
                        </>
                      )}
                      {viewConnection.profileData.profile.name && (
                        <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{viewConnection.profileData.profile.name.forename} {viewConnection.profileData.profile.name.surname}</span></div>
                      )}
                    </CardContent>
                  </Card>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3 text-center">
                      <FileText className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs text-muted-foreground">SA Obligations</p>
                      <p className="text-sm font-bold">{viewConnection.profileData.saObligations?.obligations?.length || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-3 text-center">
                      <FileText className="h-4 w-4 mx-auto mb-1 text-green-600" />
                      <p className="text-xs text-muted-foreground">VAT Obligations</p>
                      <p className="text-sm font-bold">{viewConnection.profileData.vatObligations?.obligations?.length || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-3 text-center">
                      <FileText className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                      <p className="text-xs text-muted-foreground">SA Balance</p>
                      <p className="text-sm font-bold">{viewConnection.profileData.saBalance?.totalBalance != null ? `£${Number(viewConnection.profileData.saBalance.totalBalance).toFixed(2)}` : 'N/A'}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Self Assessment Tab */}
              <TabsContent value="hmrc-sa" className="space-y-3 mt-3">
                {viewConnection.profileData.saObligations?.obligations?.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">SA Obligations</p>
                    {viewConnection.profileData.saObligations.obligations.map((o: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="p-3 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{o.obligationDetails?.[0]?.periodKey || `Period ${i + 1}`}</span>
                            <p className="text-xs text-muted-foreground">{o.obligationDetails?.[0]?.inboundCorrespondenceFromDate} → {o.obligationDetails?.[0]?.inboundCorrespondenceToDate}</p>
                          </div>
                          <Badge className={o.obligationDetails?.[0]?.status === 'F' ? 'bg-green-600' : 'bg-amber-600'}>
                            {o.obligationDetails?.[0]?.status === 'F' ? 'Fulfilled' : 'Open'}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No SA obligations found. Click Sync to fetch.</p>
                )}
                {viewConnection.profileData.saBalance && !viewConnection.profileData.saBalance.error && (
                  <Card className="bg-slate-50 dark:bg-slate-800/50">
                    <CardContent className="p-3 text-sm space-y-1">
                      <p className="font-medium">SA Balance</p>
                      {viewConnection.profileData.saBalance.totalBalance != null && <div className="flex justify-between"><span className="text-muted-foreground">Total Balance</span><span className="font-bold">£{Number(viewConnection.profileData.saBalance.totalBalance).toFixed(2)}</span></div>}
                      {viewConnection.profileData.saBalance.pendingPayments != null && <div className="flex justify-between"><span className="text-muted-foreground">Pending Payments</span><span>£{Number(viewConnection.profileData.saBalance.pendingPayments).toFixed(2)}</span></div>}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* VAT Tab */}
              <TabsContent value="hmrc-vat" className="space-y-3 mt-3">
                {viewConnection.profileData.vatObligations?.obligations?.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">VAT Obligations</p>
                    {viewConnection.profileData.vatObligations.obligations.map((o: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="p-3 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">Period: {o.start} → {o.end}</span>
                            <p className="text-xs text-muted-foreground">Due: {o.due} | Key: {o.periodKey}</p>
                          </div>
                          <Badge className={o.status === 'F' ? 'bg-green-600' : 'bg-amber-600'}>
                            {o.status === 'F' ? 'Fulfilled' : 'Open'}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No VAT obligations. Entity may not be VAT registered or click Sync.</p>
                )}
                {viewConnection.profileData.vatLiabilities?.liabilities?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">VAT Liabilities</p>
                    {viewConnection.profileData.vatLiabilities.liabilities.slice(0, 10).map((l: any, i: number) => (
                      <div key={i} className="flex justify-between p-2 border rounded text-sm">
                        <span>{l.taxPeriod?.from} → {l.taxPeriod?.to}</span>
                        <span className="font-bold">£{Number(l.originalAmount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Employment Tab */}
              <TabsContent value="hmrc-employment" className="space-y-3 mt-3">
                {viewConnection.profileData.employment && !viewConnection.profileData.employment.error ? (
                  <Card className="bg-slate-50 dark:bg-slate-800/50">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium mb-2">Employment Data</p>
                      <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded overflow-auto max-h-[200px]">{JSON.stringify(viewConnection.profileData.employment, null, 2)}</pre>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No employment data available.</p>
                )}
                {viewConnection.profileData.income && !viewConnection.profileData.income.error && (
                  <Card className="bg-slate-50 dark:bg-slate-800/50">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium mb-2">Income Data</p>
                      <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded overflow-auto max-h-[200px]">{JSON.stringify(viewConnection.profileData.income, null, 2)}</pre>
                    </CardContent>
                  </Card>
                )}
                {viewConnection.profileData.nationalInsurance && !viewConnection.profileData.nationalInsurance.error && (
                  <Card className="bg-slate-50 dark:bg-slate-800/50">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium mb-2">National Insurance</p>
                      <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded overflow-auto max-h-[200px]">{JSON.stringify(viewConnection.profileData.nationalInsurance, null, 2)}</pre>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Raw Data Tab */}
              <TabsContent value="hmrc-raw" className="mt-3">
                <pre className="text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded overflow-auto max-h-[400px]">
                  {JSON.stringify(viewConnection.profileData, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
