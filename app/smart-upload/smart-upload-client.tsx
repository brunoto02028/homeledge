'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ModuleGuide } from '@/components/module-guide';
import {
  Upload, Camera, FileText, CheckCircle, Loader2, Sparkles,
  Plus, Trash2, Image as ImageIcon, FileUp, Building2, User,
  Calendar, FolderOpen, Eye, Download, X, ScanLine, Receipt,
  ChevronDown, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';

interface UploadResult {
  success: boolean;
  bill: any;
  document: any;
  extracted: any;
  categorization: any;
  entity: any;
}

interface ScannedPage {
  id: string;
  base64: string;
  mimeType: string;
  thumbnail: string;
}

interface ArchiveFile {
  id: string;
  fileName: string;
  cloudStoragePath: string;
  documentType: string;
  senderName: string | null;
  summary: string | null;
  amountDue: number | null;
  currency: string;
  linkedBillId: string | null;
  entityId: string | null;
  entityName?: string | null;
  createdAt: string;
  status: string;
}

interface ArchiveGroup {
  year: number;
  month: number;
  label: string;
  files: ArchiveFile[];
}

export default function SmartUploadClient() {
  const { t, locale } = useTranslation();
  const isPt = locale === 'pt-BR';
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [results, setResults] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scanner state
  const [scanPages, setScanPages] = useState<ScannedPage[]>([]);
  const [scanning, setScanning] = useState(false);
  const [combining, setCombining] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Archive state
  const [archive, setArchive] = useState<ArchiveGroup[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch entities
  useEffect(() => {
    fetch('/api/entities').then(r => r.ok ? r.json() : []).then(setEntities).catch(() => {});
  }, []);

  // Fetch archive when tab changes
  useEffect(() => {
    if (activeTab === 'archive') fetchArchive();
  }, [activeTab]);

  const fetchArchive = async () => {
    setArchiveLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedEntityId) params.set('entityId', selectedEntityId);
      const res = await fetch(`/api/smart-upload/archive?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArchive(data.groups || []);
        // Auto-expand first group
        if (data.groups?.length > 0) {
          setExpandedGroups(new Set([`${data.groups[0].year}-${data.groups[0].month}`]));
        }
      }
    } catch { /* ignore */ }
    setArchiveLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedEntityId) formData.append('entityId', selectedEntityId);

      setUploadProgress('Analyzing with AI...');

      const res = await fetch('/api/smart-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setResults(prev => [data, ...prev]);
      toast({
        title: isPt ? 'Envio Inteligente Concluído!' : 'Smart Upload Complete!',
        description: isPt ? `Conta criada: ${data.bill?.billName || 'Desconhecido'} — £${data.bill?.amount?.toFixed(2) || '0.00'}` : `Created bill: ${data.bill?.billName || 'Unknown'} — £${data.bill?.amount?.toFixed(2) || '0.00'}`,
      });
    } catch (err: any) {
      toast({ title: isPt ? 'Falha no Envio' : 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleFileUpload(files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files[0]);
  }, [selectedEntityId]);

  // Multi-page scanner
  const handleScanPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setScanPages(prev => [...prev, {
        id: Date.now().toString(),
        base64,
        mimeType: file.type || 'image/jpeg',
        thumbnail: dataUrl,
      }]);
    };
    reader.readAsDataURL(file);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeScanPage = (id: string) => {
    setScanPages(prev => prev.filter(p => p.id !== id));
  };

  const handleCombineAndUpload = async () => {
    if (scanPages.length === 0) return;
    setCombining(true);
    setUploadProgress('Combining pages into PDF...');

    try {
      // 1. Combine images into PDF
      const combineRes = await fetch('/api/smart-upload/combine-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: scanPages.map(p => ({ base64: p.base64, mimeType: p.mimeType })),
          fileName: `scan-${new Date().toISOString().slice(0, 10)}.pdf`,
        }),
      });

      const combineData = await combineRes.json();
      if (!combineRes.ok) throw new Error(combineData.error || 'Failed to combine PDF');

      setUploadProgress('Analyzing with AI...');

      // 2. Smart upload the combined PDF
      const uploadRes = await fetch('/api/smart-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: combineData.fileBase64,
          fileName: combineData.fileName,
          mimeType: 'application/pdf',
          isPDF: true,
          cloudStoragePath: combineData.cloudStoragePath,
          entityId: selectedEntityId || null,
        }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      setResults(prev => [uploadData, ...prev]);
      setScanPages([]);
      toast({
        title: isPt ? 'Digitalização Concluída!' : 'Scan Complete!',
        description: isPt ? `${combineData.pageCount} páginas combinadas → Conta: ${uploadData.bill?.billName || 'Desconhecido'}` : `${combineData.pageCount} pages combined → Bill: ${uploadData.bill?.billName || 'Unknown'}`,
      });
    } catch (err: any) {
      toast({ title: isPt ? 'Falha na Digitalização' : 'Scan Failed', description: err.message, variant: 'destructive' });
    } finally {
      setCombining(false);
      setUploadProgress('');
    }
  };

  const handlePreview = async (cloudStoragePath: string) => {
    try {
      const res = await fetch(`/api/files/serve?path=${encodeURIComponent(cloudStoragePath)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch { /* ignore */ }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <ModuleGuide moduleKey="smart_upload" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500" />
            Smart Upload
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload files and let AI auto-create bill entries
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload" className="gap-1.5"><Upload className="h-4 w-4" /> Upload</TabsTrigger>
          <TabsTrigger value="scanner" className="gap-1.5"><ScanLine className="h-4 w-4" /> Scanner</TabsTrigger>
          <TabsTrigger value="archive" className="gap-1.5"><FolderOpen className="h-4 w-4" /> Archive</TabsTrigger>
        </TabsList>

        {/* ─── Upload Tab ─── */}
        <TabsContent value="upload" className="space-y-4 mt-4">
          {/* Entity Selector */}
          <div className="flex items-center gap-3">
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All entities</SelectItem>
                {entities.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      {e.type === 'individual' ? <User className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                      {e.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop Zone */}
          <Card
            className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16">
              {uploading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
                  <p className="text-lg font-medium">{uploadProgress}</p>
                  <p className="text-sm text-muted-foreground mt-1">Please wait...</p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                    <FileUp className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-lg font-medium mb-1">Drop a file here or click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    PDF, image (JPG, PNG) — AI will analyze and auto-create a bill entry
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Recent Uploads</h3>
              {results.map((r, i) => (
                <Card key={i} className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{r.bill?.billName || 'Unknown'}</p>
                          <Badge variant="outline" className="text-xs">
                            £{r.bill?.amount?.toFixed(2) || '0.00'}
                          </Badge>
                          <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            Auto-created
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {r.extracted?.description || r.document?.fileName}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {r.bill?.category?.name && (
                            <span>Category: {r.bill.category.name}</span>
                          )}
                          <span>Frequency: {r.bill?.frequency || 'one_time'}</span>
                          {r.extracted?.confidence && (
                            <Badge variant="outline" className="text-[10px]">
                              {r.extracted.confidence} confidence
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Scanner Tab ─── */}
        <TabsContent value="scanner" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-5 w-5 text-amber-500" />
                Multi-Page Scanner
              </CardTitle>
              <CardDescription>
                Scan multiple pages, combine into a single PDF, and auto-create a ledger entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Entity Selector */}
              <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All entities</SelectItem>
                  {entities.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="flex items-center gap-2">
                        {e.type === 'individual' ? <User className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                        {e.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Scanned Pages Grid */}
              {scanPages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {scanPages.map((page, idx) => (
                    <div key={page.id} className="relative group">
                      <div className="aspect-[3/4] rounded-lg border overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={page.thumbnail}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        {idx + 1}
                      </span>
                      <button
                        onClick={() => removeScanPage(page.id)}
                        className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Scanner Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleScanPage}
                />
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={combining}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {scanPages.length === 0 ? 'Scan First Page' : 'Add Page'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        const base64 = dataUrl.split(',')[1];
                        setScanPages(prev => [...prev, {
                          id: Date.now().toString(),
                          base64,
                          mimeType: file.type || 'image/jpeg',
                          thumbnail: dataUrl,
                        }]);
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                  disabled={combining}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  From Gallery
                </Button>

                {scanPages.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => setScanPages([])}
                      disabled={combining}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                    <div className="flex-1" />
                    <Button
                      onClick={handleCombineAndUpload}
                      disabled={combining}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {combining ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {combining ? uploadProgress : `Combine ${scanPages.length} Page${scanPages.length !== 1 ? 's' : ''} & Upload`}
                    </Button>
                  </>
                )}
              </div>

              {scanPages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ScanLine className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No pages scanned yet. Tap &quot;Scan First Page&quot; to begin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Archive Tab ─── */}
        <TabsContent value="archive" className="space-y-4 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <Select value={selectedEntityId} onValueChange={(v) => { setSelectedEntityId(v); }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All entities</SelectItem>
                {entities.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      {e.type === 'individual' ? <User className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                      {e.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchArchive}>
              <Loader2 className={`h-4 w-4 mr-1 ${archiveLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {archiveLoading ? (
            <LoadingSpinner />
          ) : archive.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-16">
                <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium mb-2">No files yet</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md text-sm">
                  Upload files using the Upload or Scanner tab to see them organized here by year and month.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {archive.map((group) => {
                const key = `${group.year}-${group.month}`;
                const isExpanded = expandedGroups.has(key);
                return (
                  <Card key={key}>
                    <button
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg"
                      onClick={() => toggleGroup(key)}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">{group.label}</p>
                          <p className="text-xs text-muted-foreground">{group.files.length} file{group.files.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {isExpanded && (
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-2">
                          {group.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                  <Receipt className="h-4 w-4 text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{file.senderName || file.fileName}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {file.amountDue != null && (
                                      <span>£{file.amountDue.toFixed(2)}</span>
                                    )}
                                    <span>{file.documentType}</span>
                                    {file.entityName && (
                                      <Badge variant="outline" className="text-[10px]">{file.entityName}</Badge>
                                    )}
                                    <span>{formatDate(file.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handlePreview(file.cloudStoragePath)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {file.linkedBillId && (
                                  <Badge className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                    Linked
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">File Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-auto">
              <iframe src={previewUrl} className="w-full h-[70vh] rounded border" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
