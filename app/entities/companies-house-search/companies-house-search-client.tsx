'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';
import {
  Search, Building2, ArrowLeft, Loader2, MapPin, Users, Clock, FileText,
  ExternalLink, Plus, Globe, Shield, ChevronDown, ChevronUp, Circle,
  Landmark, Calendar, RefreshCw, Filter, Hash, ArrowRight, Briefcase,
  Download, CheckCircle, AlertTriangle, Info,
} from 'lucide-react';

interface CompanyResult {
  companyNumber: string;
  name: string;
  status: string;
  type: string;
  incorporationDate: string | null;
  address: string;
  entityType: string;
}

interface CompanyDetail {
  companyNumber: string;
  name: string;
  status: string;
  type: string;
  incorporationDate: string | null;
  sicCodes: string[];
  registeredAddress: string;
  officers: any[];
  filings: any[];
  entityType: string;
  raw: any;
}

const STATUS_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  active: { text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', dot: 'bg-green-500' },
  dissolved: { text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', dot: 'bg-red-500' },
  liquidation: { text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', dot: 'bg-red-500' },
  dormant: { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', dot: 'bg-amber-500' },
  administration: { text: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', dot: 'bg-orange-500' },
};

const TYPE_LABELS: Record<string, string> = {
  ltd: 'Private Limited',
  plc: 'Public Limited (PLC)',
  llp: 'LLP',
  'limited-partnership': 'Limited Partnership',
  'scottish-partnership': 'Scottish Partnership',
  'private-limited-guarant-nsc': 'Ltd by Guarantee',
  'private-unlimited': 'Private Unlimited',
};

export default function CompaniesHouseSearchClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Detail panel
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Auto-search if ?q= param is present
  useEffect(() => {
    if (initialQuery.trim()) {
      searchCompanies(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Import dialog
  const [importDialog, setImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);

  const searchCompanies = useCallback(async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setSearching(true);
    setHasSearched(true);
    setSelectedCompany(null);
    setDetail(null);
    try {
      const res = await fetch(`/api/entities/companies-house?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setTotalResults(data.total || 0);
      } else {
        const err = await res.json();
        toast({ title: t('chSearch.searchError'), description: err.error || err.hint || 'Search failed', variant: 'destructive' });
        setResults([]);
      }
    } catch {
      toast({ title: t('chSearch.error'), description: t('chSearch.connectionError'), variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  }, [query, toast, t]);

  const loadDetail = async (companyNumber: string) => {
    if (selectedCompany === companyNumber) {
      setSelectedCompany(null);
      setDetail(null);
      return;
    }
    setSelectedCompany(companyNumber);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/entities/companies-house?number=${encodeURIComponent(companyNumber)}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      } else {
        toast({ title: t('chSearch.detailError'), variant: 'destructive' });
        setSelectedCompany(null);
      }
    } catch {
      setSelectedCompany(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const importAsEntity = async () => {
    if (!detail) return;
    setImporting(true);
    try {
      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: detail.name,
          type: detail.entityType,
          companyNumber: detail.companyNumber,
          companyStatus: detail.status,
          sicCodes: detail.sicCodes,
          incorporationDate: detail.incorporationDate,
          registeredAddress: detail.registeredAddress,
          officers: detail.officers,
          taxRegime: detail.entityType === 'llp' || detail.entityType === 'limited_company' ? 'corporation_tax' : 'self_assessment',
        }),
      });
      if (res.ok) {
        const entity = await res.json();
        toast({ title: t('chSearch.imported'), description: `${detail.name} ${t('chSearch.importedAs')} ${detail.entityType}` });
        setImportDialog(false);
        router.push(`/entities/${entity.id}`);
      } else {
        const err = await res.json();
        toast({ title: t('chSearch.importError'), description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t('chSearch.error'), variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const filteredResults = statusFilter === 'all'
    ? results
    : results.filter(r => r.status === statusFilter);

  const getStatusStyle = (status: string) =>
    STATUS_COLORS[status] || { text: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30', dot: 'bg-gray-400' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/entities')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('chSearch.backToEntities')}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/40">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          {t('chSearch.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('chSearch.subtitle')}</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCompanies()}
                placeholder={t('chSearch.placeholder')}
                className="pl-10 h-11"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>
            <Button onClick={() => searchCompanies()} disabled={searching || !query.trim()} className="h-11 px-6">
              {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {t('chSearch.search')}
            </Button>
          </div>

          {/* Quick tips */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Info className="h-3 w-3" /> {t('chSearch.tip')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <>
          {/* Results header with filter */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searching ? t('chSearch.searching') : (
                <>
                  <span className="font-semibold text-foreground">{totalResults.toLocaleString()}</span> {t('chSearch.resultsFound')}
                  {filteredResults.length !== results.length && (
                    <span> · {t('chSearch.showing')} {filteredResults.length}</span>
                  )}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('chSearch.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('chSearch.active')}</SelectItem>
                  <SelectItem value="dissolved">{t('chSearch.dissolved')}</SelectItem>
                  <SelectItem value="dormant">{t('chSearch.dormant')}</SelectItem>
                  <SelectItem value="liquidation">{t('chSearch.liquidation')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results list */}
          {filteredResults.length === 0 && !searching ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('chSearch.noResults')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredResults.map((r) => {
                const sc = getStatusStyle(r.status);
                const isSelected = selectedCompany === r.companyNumber;
                return (
                  <div key={r.companyNumber}>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
                      onClick={() => loadDetail(r.companyNumber)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex-shrink-0">
                              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{r.name}</span>
                                <Badge variant="outline" className="text-[10px] font-mono h-5">
                                  #{r.companyNumber}
                                </Badge>
                                <Badge className={`text-[10px] h-5 border-0 ${sc.bg} ${sc.text}`}>
                                  <Circle className="h-1.5 w-1.5 fill-current mr-1" />
                                  {r.status}
                                </Badge>
                                {r.type && (
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {TYPE_LABELS[r.type] || r.type}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                {r.incorporationDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(r.incorporationDate).toLocaleDateString('en-GB')}
                                  </span>
                                )}
                                {r.address && (
                                  <span className="flex items-center gap-1 truncate max-w-[400px]">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    {r.address}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {isSelected ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expanded detail panel */}
                    {isSelected && (
                      <Card className="mt-1 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
                        <CardContent className="py-5">
                          {detailLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                              <span className="ml-2 text-sm text-muted-foreground">{t('chSearch.loadingDetails')}</span>
                            </div>
                          ) : detail ? (
                            <div className="space-y-5">
                              {/* Action bar */}
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{detail.name}</h3>
                                <div className="flex gap-2">
                                  <a
                                    href={`https://find-and-update.company-information.service.gov.uk/company/${detail.companyNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                      {t('chSearch.viewOnCH')}
                                    </Button>
                                  </a>
                                  <Button size="sm" onClick={() => setImportDialog(true)}>
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    {t('chSearch.importEntity')}
                                  </Button>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-5">
                                {/* Company Info */}
                                <div className="space-y-4">
                                  <div className="rounded-lg border bg-card p-4 space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-blue-500" />
                                      {t('chSearch.companyInfo')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="text-xs text-muted-foreground">{t('chSearch.number')}</span>
                                        <p className="font-mono font-medium">{detail.companyNumber}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-muted-foreground">{t('chSearch.status')}</span>
                                        <p className={`font-medium capitalize ${getStatusStyle(detail.status).text}`}>{detail.status}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-muted-foreground">{t('chSearch.type')}</span>
                                        <p className="font-medium">{TYPE_LABELS[detail.type] || detail.type}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-muted-foreground">{t('chSearch.incorporated')}</span>
                                        <p className="font-medium">{detail.incorporationDate ? new Date(detail.incorporationDate).toLocaleDateString('en-GB') : '—'}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Address */}
                                  <div className="rounded-lg border bg-card p-4 space-y-2">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-orange-500" />
                                      {t('chSearch.registeredAddress')}
                                    </h4>
                                    <p className="text-sm">{detail.registeredAddress || '—'}</p>
                                  </div>

                                  {/* SIC Codes */}
                                  {detail.sicCodes.length > 0 && (
                                    <div className="rounded-lg border bg-card p-4 space-y-2">
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-purple-500" />
                                        {t('chSearch.sicCodes')}
                                      </h4>
                                      <div className="flex flex-wrap gap-1.5">
                                        {detail.sicCodes.map(sic => (
                                          <Badge key={sic} variant="outline" className="font-mono text-xs">
                                            SIC {sic}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Key Dates */}
                                  {(detail.raw?.nextAccounts || detail.raw?.confirmationStatement) && (
                                    <div className="rounded-lg border bg-card p-4 space-y-2">
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-green-500" />
                                        {t('chSearch.keyDates')}
                                      </h4>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        {detail.raw?.nextAccounts && (
                                          <div>
                                            <span className="text-xs text-muted-foreground">{t('chSearch.nextAccounts')}</span>
                                            <p className="font-medium">{new Date(detail.raw.nextAccounts).toLocaleDateString('en-GB')}</p>
                                          </div>
                                        )}
                                        {detail.raw?.confirmationStatement && (
                                          <div>
                                            <span className="text-xs text-muted-foreground">{t('chSearch.confirmationStmt')}</span>
                                            <p className="font-medium">{new Date(detail.raw.confirmationStatement).toLocaleDateString('en-GB')}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Officers */}
                                <div className="space-y-4">
                                  {detail.officers.length > 0 && (
                                    <div className="rounded-lg border bg-card p-4 space-y-3">
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        {t('chSearch.officers')} ({detail.officers.filter((o: any) => !o.resignedDate).length} {t('chSearch.activeOfficers')})
                                      </h4>
                                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {detail.officers
                                          .filter((o: any) => !o.resignedDate)
                                          .map((o: any, i: number) => (
                                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 text-sm">
                                            <div>
                                              <span className="font-medium">{o.name}</span>
                                              <span className="text-xs text-muted-foreground ml-2 capitalize">{o.role?.replace(/-/g, ' ')}</span>
                                            </div>
                                            {o.appointedDate && (
                                              <span className="text-xs text-muted-foreground">
                                                {t('chSearch.since')} {new Date(o.appointedDate).toLocaleDateString('en-GB')}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Recent Filings */}
                                  {detail.filings.length > 0 && (
                                    <div className="rounded-lg border bg-card p-4 space-y-3">
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-cyan-500" />
                                        {t('chSearch.recentFilings')}
                                      </h4>
                                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                        {detail.filings.slice(0, 10).map((f: any, i: number) => (
                                          <div key={i} className="flex items-center justify-between py-1.5 text-sm border-b last:border-0">
                                            <div className="min-w-0">
                                              <span className="text-xs font-medium">{f.description || f.type}</span>
                                              {f.category && (
                                                <Badge variant="outline" className="text-[9px] h-4 ml-2">{f.category}</Badge>
                                              )}
                                            </div>
                                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-3">
                                              {f.date ? new Date(f.date).toLocaleDateString('en-GB') : ''}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Empty state before search */}
      {!hasSearched && (
        <div className="text-center py-16">
          <div className="inline-flex p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 mb-4">
            <Building2 className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('chSearch.emptyTitle')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">{t('chSearch.emptyDesc')}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Tech', 'Consulting', 'Holdings', 'Solutions', 'Digital'].map(term => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => { setQuery(term); searchCompanies(term); }}
              >
                <Search className="h-3 w-3 mr-1" /> {term}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('chSearch.importTitle')}</DialogTitle>
            <DialogDescription>{t('chSearch.importDesc')}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">{detail.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>{t('chSearch.number')}: <span className="font-mono text-foreground">{detail.companyNumber}</span></span>
                  <span>{t('chSearch.status')}: <span className={`capitalize ${getStatusStyle(detail.status).text}`}>{detail.status}</span></span>
                  <span>{t('chSearch.type')}: <span className="text-foreground">{TYPE_LABELS[detail.type] || detail.type}</span></span>
                  {detail.officers.length > 0 && (
                    <span>{t('chSearch.officers')}: <span className="text-foreground">{detail.officers.filter((o: any) => !o.resignedDate).length}</span></span>
                  )}
                </div>
                {detail.registeredAddress && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {detail.registeredAddress}
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-amber-800 dark:text-amber-300">{t('chSearch.importNote')}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>{t('chSearch.cancel')}</Button>
            <Button onClick={importAsEntity} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('chSearch.importButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
