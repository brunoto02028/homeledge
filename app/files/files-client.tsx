'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, FileSpreadsheet, ImageIcon, File, Search,
  Download, Eye, Loader2, FolderOpen, Building2, User,
  Filter, Calendar, SortDesc
} from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { formatDate } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  path: string;
  category: 'statement' | 'document' | 'invoice';
  date: string;
  detail: string;
  entityId: string | null;
  entityName: string | null;
  entityType: string | null;
  fileType: string;
  status?: string;
}

interface Stats {
  total: number;
  statements: number;
  documents: number;
  invoices: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  statement: { label: 'Statement', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: FileSpreadsheet },
  document: { label: 'Document', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', icon: FileText },
  invoice: { label: 'Invoice', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: File },
};

const FILE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: ImageIcon,
  data: FileSpreadsheet,
  other: File,
  unknown: File,
};

export default function FilesClient() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, statements: 0, documents: 0, invoices: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [entities, setEntities] = useState<any[]>([]);
  const [entityFilter, setEntityFilter] = useState('all');

  const fetchFiles = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (entityFilter !== 'all') params.set('entityId', entityFilter);

      const res = await fetch(`/api/files?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setStats(data.stats || { total: 0, statements: 0, documents: 0, invoices: 0 });
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const res = await fetch('/api/entities');
      if (res.ok) {
        const data = await res.json();
        setEntities(data || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchFiles();
    fetchEntities();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchFiles();
  }, [categoryFilter, entityFilter]);

  const filteredFiles = files.filter(f => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return f.name.toLowerCase().includes(term)
      || f.detail.toLowerCase().includes(term)
      || (f.entityName && f.entityName.toLowerCase().includes(term));
  });

  const handleDownload = async (file: FileItem) => {
    try {
      const res = await fetch(`/api/upload/get-url?path=${encodeURIComponent(file.path)}`);
      if (res.ok) {
        const data = await res.json();
        window.open(data.url, '_blank');
      }
    } catch {
      console.error('Failed to get download URL');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Files</h1>
        <p className="text-muted-foreground">All uploaded files across your account</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`p-4 rounded-xl border text-left transition-colors ${categoryFilter === 'all' ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'border-border hover:border-muted-foreground/30'}`}
        >
          <FolderOpen className="h-5 w-5 text-amber-500 mb-1" />
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">All Files</div>
        </button>
        <button
          onClick={() => setCategoryFilter('statement')}
          className={`p-4 rounded-xl border text-left transition-colors ${categoryFilter === 'statement' ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' : 'border-border hover:border-muted-foreground/30'}`}
        >
          <FileSpreadsheet className="h-5 w-5 text-blue-500 mb-1" />
          <div className="text-2xl font-bold">{stats.statements}</div>
          <div className="text-xs text-muted-foreground">Statements</div>
        </button>
        <button
          onClick={() => setCategoryFilter('document')}
          className={`p-4 rounded-xl border text-left transition-colors ${categoryFilter === 'document' ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/20' : 'border-border hover:border-muted-foreground/30'}`}
        >
          <FileText className="h-5 w-5 text-purple-500 mb-1" />
          <div className="text-2xl font-bold">{stats.documents}</div>
          <div className="text-xs text-muted-foreground">Documents</div>
        </button>
        <button
          onClick={() => setCategoryFilter('invoice')}
          className={`p-4 rounded-xl border text-left transition-colors ${categoryFilter === 'invoice' ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : 'border-border hover:border-muted-foreground/30'}`}
        >
          <File className="h-5 w-5 text-green-500 mb-1" />
          <div className="text-2xl font-bold">{stats.invoices}</div>
          <div className="text-xs text-muted-foreground">Invoices</div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="pl-9"
          />
        </div>
        {entities.length > 0 && (
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entities.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* File List */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground max-w-md">
              {searchTerm
                ? `No files matching "${searchTerm}"`
                : 'Upload bank statements, scan documents, or create invoices to see files here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium px-4 py-3">File</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Entity</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const catConfig = CATEGORY_CONFIG[file.category] || CATEGORY_CONFIG.document;
                const CatIcon = catConfig.icon;
                const FileIcon = FILE_TYPE_ICONS[file.fileType] || File;

                return (
                  <tr key={`${file.category}-${file.id}`} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[200px] sm:max-w-[300px]">{file.name}</div>
                          {file.detail && (
                            <div className="text-xs text-muted-foreground truncate">{file.detail}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge className={catConfig.color}>
                        {catConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {file.entityName ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          {file.entityType === 'individual' ? (
                            <User className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="truncate max-w-[120px]">{file.entityName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(file.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(file)}
                        title="Download / View"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
