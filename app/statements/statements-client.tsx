'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Category } from '@/lib/types';
import { Upload, FileSpreadsheet, Loader2, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, Plus, CheckCircle, XCircle, Filter, Download, ChevronDown, ChevronUp, AlertTriangle, Eye, CheckSquare, Square, Sparkles, Bot, Lightbulb, Landmark, User, Building2, ArrowUpDown, Camera } from 'lucide-react';
import { ScanUploadButton } from '@/components/scan-upload-button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/lib/i18n';

interface BankStatement {
  id: string;
  fileName: string;
  entityId: string | null;
  cloudStoragePath: string;
  statementDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  totalCredits: number;
  totalDebits: number;
  openingBalance: number | null;
  closingBalance: number | null;
  parseStatus: 'success' | 'needs_review' | 'failed';
  parseError: string | null;
  account: {
    id: string;
    accountName: string;
    accountNumber: string | null;
    provider: {
      id: string;
      name: string;
      logoUrl: string | null;
    };
  } | null;
  transactions: BankTransaction[];
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  cleanDescription: string | null;
  reference: string | null;
  amount: number;
  type: 'credit' | 'debit';
  balance: number | null;
  categoryId: string | null;
  suggestedCategoryId: string | null;
  hmrcMapping: string | null;
  isTaxDeductible: boolean;
  confidenceScore: number | null;
  aiReasoning: string | null;
  needsReview: boolean;
  notes: string | null;
  isReconciled: boolean;
  category: Category | null;
}

interface Account {
  id: string;
  accountName: string;
  accountNumber: string | null;
  provider: {
    id: string;
    name: string;
  };
}

export default function StatementsClient() {
  const { t } = useTranslation();
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'uncategorised'>('all');
  const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
  const [expandedStatements, setExpandedStatements] = useState<Set<string>>(new Set());
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>('expense');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [debugStatementId, setDebugStatementId] = useState<string | null>(null);
  const [debugText, setDebugText] = useState<{ textPreview: string; textLength: number; parseError: string | null } | null>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'description' | 'type' | 'amount' | 'category'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Apply to similar dialog state
  const [showApplyToSimilarDialog, setShowApplyToSimilarDialog] = useState(false);
  const [similarTransactions, setSimilarTransactions] = useState<BankTransaction[]>([]);
  const [pendingCategorisation, setPendingCategorization] = useState<{
    transactionId: string;
    categoryId: string;
    keyword: string;
  } | null>(null);
  const [applyingToSimilar, setApplyingToSimilar] = useState(false);
  
  // Draft categorisation state — stores pending category selections before confirmation
  const [draftCategorisations, setDraftCategorizations] = useState<Map<string, string>>(new Map());
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  
  // AI Category Assistant state
  const [aiSuggestingFor, setAiSuggestingFor] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{
    transactionId: string;
    suggestion: any;
  } | null>(null);
  const [aiUserContext, setAiUserContext] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryHmrcMapping, setNewCategoryHmrcMapping] = useState('none');
  const [newCategoryDeductibility, setNewCategoryDeductibility] = useState(0);
  const [aiFillingCategory, setAiFillingCategory] = useState(false);
  const [pendingNewCategoryTxId, setPendingNewCategoryTxId] = useState<string | null>(null);
  
  // Entity selection state
  const [entities, setEntities] = useState<{ id: string; name: string; type: string; taxRegime: string; isDefault: boolean; companyStatus: string | null }[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const isEntityOperational = (e: { type: string; companyStatus: string | null }) => {
    const status = e.companyStatus?.toLowerCase() || '';
    if (e.type === 'individual' || e.type === 'sole_trader') return true;
    return status === 'active' || status === 'open' || status === '';
  };
  const activeEntities = entities.filter(e => isEntityOperational(e));
  
  const ITEMS_PER_PAGE = 100;
  const { toast } = useToast();

  const fetchEntities = async () => {
    try {
      const res = await fetch('/api/entities');
      if (res.ok) {
        const data = await res.json();
        setEntities(data);
        const defaultEntity = data.find((e: any) => e.isDefault);
        if (defaultEntity && !selectedEntityId) setSelectedEntityId(defaultEntity.id);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  };

  const fetchStatements = useCallback(async () => {
    try {
      const url = selectedEntityId ? `/api/statements?entityId=${selectedEntityId}` : '/api/statements';
      const res = await fetch(url);
      const data = await res.json();
      setStatements(data);
    } catch (error) {
      console.error('Error fetching statements:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEntityId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchDebugText = async (statementId: string) => {
    setLoadingDebug(true);
    setDebugStatementId(statementId);
    try {
      const res = await fetch(`/api/statements/${statementId}/debug-text`);
      const data = await res.json();
      setDebugText(data);
    } catch (error) {
      console.error('Error fetching debug text:', error);
      setDebugText({ textPreview: 'Error loading debug text', textLength: 0, parseError: null });
    } finally {
      setLoadingDebug(false);
    }
  };

  // Auto-sync all bank connections on page load
  const autoSyncConnections = useCallback(async () => {
    try {
      setAutoSyncing(true);
      const res = await fetch('/api/open-banking/connect');
      if (!res.ok) return;
      const { connections } = await res.json();
      const active = (connections || []).filter((c: any) => c.status === 'active');
      for (const conn of active) {
        try {
          await fetch('/api/open-banking/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId: conn.id }),
          });
        } catch { /* non-fatal */ }
      }
      if (active.length > 0) fetchStatements();
    } catch { /* non-fatal */ } finally {
      setAutoSyncing(false);
    }
  }, [fetchStatements]);

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
    fetchEntities();
    autoSyncConnections();
  }, []);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  // Auto-trigger upload when arriving via ?action=upload
  useEffect(() => {
    if (loading) return;
    const action = searchParams.get('action');
    if (action === 'upload') {
      setTimeout(() => uploadInputRef.current?.click(), 300);
    }
  }, [loading, searchParams]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setProcessing(true);
    setUploadErrors([]);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    for (const file of Array.from(files)) {
      try {
        // Step 1: Try cloud upload (optional - skip if S3 not configured)
        let cloudStoragePath = '';
        setUploadProgress(5);
        setUploadStatus(`Preparing ${file.name}...`);

        try {
          const presignedRes = await fetch('/api/upload/presigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type || 'application/pdf',
              isPublic: false,
            }),
          });

          if (presignedRes.ok) {
            const presignedData = await presignedRes.json();
            if (presignedData.uploadUrl) {
              cloudStoragePath = presignedData.cloudStoragePath || '';
              setUploadProgress(15);
              setUploadStatus(`Uploading ${file.name} to cloud...`);

              const url = new URL(presignedData.uploadUrl);
              const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders') || '';
              const uploadHeaders: Record<string, string> = {
                'Content-Type': file.type || 'application/pdf'
              };
              if (signedHeaders.includes('content-disposition')) {
                uploadHeaders['Content-Disposition'] = 'attachment';
              }
              await fetch(presignedData.uploadUrl, { method: 'PUT', headers: uploadHeaders, body: file });
            }
          }
        } catch (s3Error) {
          // S3 upload skipped (not configured)
        }

        setUploadProgress(30);
        setUploadStatus(`Processing ${file.name} with AI...`);

        // Step 2: Process with AI (always runs - this is the core step)
        const formData = new FormData();
        formData.append('file', file);
        if (cloudStoragePath) formData.append('cloudStoragePath', cloudStoragePath);
        if (selectedEntityId) formData.append('entityId', selectedEntityId);

        const processRes = await fetch('/api/invoices/process-statement', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(80);
        setUploadStatus(`Saving statement to database...`);

        const result = await processRes.json();
        const categorisedCount = result.transactions?.filter((tx: any) => tx.suggestedCategoryId).length || 0;
        const _parseError = result.parseError;

        // Step 4: Save to database (80% -> 100%)
        const createRes = await fetch('/api/statements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            cloudStoragePath,
            entityId: selectedEntityId || null,
            extractedText: result.extractedText || '',
            parseStatus: result.parseStatus || 'needs_review',
            parseError: result.parseError || null,
            periodStart: result.accountInfo?.periodStart,
            periodEnd: result.accountInfo?.periodEnd,
            transactions: (result.transactions || []).map((tx: any) => ({
              date: tx.date,
              description: tx.description,
              reference: tx.reference || null,
              amount: Math.abs(tx.amount),
              type: tx.type,
              balance: tx.balance || null,
              categoryId: tx.suggestedCategoryId || null, // Auto-categorization
            })),
          }),
        });

        setUploadProgress(100);
        setUploadStatus(`Complete!`);

        if (createRes.ok) {
          const createResult = await createRes.json();
          const txCount = createResult.transactionsCreated || result.transactions?.length || 0;
          const status = result.parseStatus;
          const autoCategorised = createResult.categorisedCount || categorisedCount || 0;
          
          if (status === 'success' && txCount > 0) {
            let msg = createResult.duplicatesSkipped > 0
              ? `${txCount} transactions added, ${createResult.duplicatesSkipped} duplicates skipped`
              : `${txCount} transactions added`;
            if (autoCategorised > 0) {
              msg += ` • ${autoCategorised} auto-categorised`;
            }
            toast({ title: 'Statement Processed ✓', description: msg });
          } else if (status === 'needs_review') {
            toast({ 
              title: 'Statement Needs Review', 
              description: result.parseError || `${txCount} transactions found - please review`,
              variant: 'default'
            });
          } else {
            toast({ 
              title: 'Statement Saved (Review Required)', 
              description: result.parseError || 'Could not extract transactions automatically',
              variant: 'destructive'
            });
          }
        } else {
          setUploadErrors(prev => [...prev, `${file.name}: Failed to save statement`]);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadErrors(prev => [...prev, `${file.name}: Upload failed`]);
      }
    }

    // Wait a bit to show 100% before resetting
    await new Promise(resolve => setTimeout(resolve, 500));
    setUploading(false);
    setProcessing(false);
    setUploadProgress(0);
    setUploadStatus('');
    fetchStatements();
  };

  // Extract keyword from transaction description
  const extractKeyword = (description: string): string => {
    const removeTerms = ['CARD PAYMENT TO', 'DIRECT DEBIT PAYMENT TO', 'FASTER PAYMENTS', 'BANK GIRO', 'STANDING ORDER', 'REF:', 'CD '];
    let cleaned = description;
    for (const term of removeTerms) {
      cleaned = cleaned.replace(new RegExp(term, 'gi'), '').trim();
    }
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    const words = cleaned.split(' ');
    const skipWords = ['the', 'a', 'an', 'to', 'from', 'for', 'in', 'on', 'at', 'by', 'gbr', 'ltd', 'plc'];
    const keyword = words.find(w => w.length > 2 && !skipWords.includes(w.toLowerCase())) || words[0];
    return keyword.toUpperCase();
  };

  // Find similar uncategorised transactions
  const findSimilarTransactions = (transactionId: string, keyword: string): BankTransaction[] => {
    const allTx = getAllTransactions();
    const currentTx = allTx.find(tx => tx.id === transactionId);
    if (!currentTx) return [];

    return allTx.filter(tx => 
      tx.id !== transactionId && 
      !tx.categoryId && // Only uncategorised
      tx.type === currentTx.type && // Same type (income/expense)
      tx.description.toUpperCase().includes(keyword)
    );
  };

  const updateTransactionCategory = async (transactionId: string, categoryId: string | null, learnRule: boolean = true, skipSimilarCheck: boolean = false) => {
    try {
      // First, update this transaction
      if (categoryId && learnRule) {
        const res = await fetch(`/api/statements/transactions/${transactionId}/categorize`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId, learnRule: true }),
        });
        const data = await res.json();
        
        // Check for similar uncategorised transactions
        if (!skipSimilarCheck && data.rule?.keyword) {
          const similar = findSimilarTransactions(transactionId, data.rule.keyword);
          
          if (similar.length > 0) {
            // Show dialog to ask about similar transactions
            setSimilarTransactions(similar);
            setPendingCategorization({
              transactionId,
              categoryId,
              keyword: data.rule.keyword
            });
            setShowApplyToSimilarDialog(true);
            await fetchStatements();
            setEditingTransaction(null);
            return; // Don't show toast yet, wait for user decision
          }
        }
        
        if (data.success && data.rule) {
          toast({ 
            title: '🧠 Rule Learned!', 
            description: data.message,
          });
        } else {
          toast({ title: 'Category Updated' });
        }
      } else {
        await fetch(`/api/statements/transactions/${transactionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId }),
        });
        toast({ title: 'Category Updated' });
      }
      await fetchStatements();
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error updating category:', error);
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
    }
  };

  // Apply category to all similar transactions
  const applyToSimilarTransactions = async (count?: number) => {
    if (!pendingCategorisation || similarTransactions.length === 0) return;
    
    setApplyingToSimilar(true);
    const toApply = count ? similarTransactions.slice(0, count) : similarTransactions;
    
    try {
      let successCount = 0;
      for (const tx of toApply) {
        await fetch(`/api/statements/transactions/${tx.id}/categorize`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: pendingCategorisation.categoryId, learnRule: false }),
        });
        successCount++;
      }
      
      toast({ 
        title: '✅ Bulk Categorisation Complete', 
        description: `Applied category to ${successCount} similar transactions`
      });
      
      setShowApplyToSimilarDialog(false);
      setSimilarTransactions([]);
      setPendingCategorization(null);
      await fetchStatements();
    } catch (error) {
      console.error('Error applying to similar:', error);
      toast({ title: 'Error', description: 'Failed to apply to some transactions', variant: 'destructive' });
    } finally {
      setApplyingToSimilar(false);
    }
  };

  const skipSimilarTransactions = () => {
    toast({ 
      title: '🧠 Rule Learned!', 
      description: `Future "${pendingCategorisation?.keyword}" transactions will be auto-categorised`
    });
    setShowApplyToSimilarDialog(false);
    setSimilarTransactions([]);
    setPendingCategorization(null);
  };

  // Draft categorization helpers - for "confirm before save" workflow
  const setDraftCategory = (transactionId: string, categoryId: string) => {
    setDraftCategorizations(prev => {
      const newMap = new Map(prev);
      if (categoryId === 'uncategorised') {
        newMap.delete(transactionId);
      } else {
        newMap.set(transactionId, categoryId);
      }
      return newMap;
    });
  };

  const confirmCategorisation = async (transactionId: string) => {
    const categoryId = draftCategorisations.get(transactionId);
    if (!categoryId) return;
    
    setSavingCategory(transactionId);
    try {
      await updateTransactionCategory(transactionId, categoryId, true, false);
      // Remove from draft on success
      setDraftCategorizations(prev => {
        const newMap = new Map(prev);
        newMap.delete(transactionId);
        return newMap;
      });
    } finally {
      setSavingCategory(null);
    }
  };

  const cancelDraftCategory = (transactionId: string) => {
    setDraftCategorizations(prev => {
      const newMap = new Map(prev);
      newMap.delete(transactionId);
      return newMap;
    });
  };

  // Re-classify transactions with HMRC AI
  const classifyTransactions = async (statementId: string) => {
    try {
      toast({ title: 'Classifying...', description: 'Using AI to categorise transactions for HMRC' });
      const res = await fetch('/api/statements/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ 
          title: '✅ Classification Complete', 
          description: `${data.rulesApplied} by rules, ${data.aiClassified} by AI`,
        });
        fetchStatements();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error classifying:', error);
      toast({ title: 'Error', description: 'Failed to classify transactions', variant: 'destructive' });
    }
  };

  const updateTransactionNotes = async (transactionId: string, notes: string) => {
    try {
      await fetch(`/api/statements/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      fetchStatements();
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  // AI Category Assistant - get suggestion for a transaction
  const getAiSuggestion = async (tx: BankTransaction, userExplanation?: string) => {
    setAiSuggestingFor(tx.id);
    setAiSuggestion(null);

    // Use the entityId from the statement the transaction belongs to (correct regime)
    const ownerStatement = statements.find(s => s.transactions.some(t => t.id === tx.id));
    const txEntityId = ownerStatement?.entityId || selectedEntityId || undefined;

    try {
      const res = await fetch('/api/categories/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          transactionId: tx.id,
          userContext: userExplanation || undefined,
          entityId: txEntityId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion({ transactionId: tx.id, suggestion: data.suggestion });
      } else {
        toast({ title: 'AI Error', description: 'Could not get suggestion', variant: 'destructive' });
      }
    } catch (error) {
      console.error('AI suggest error:', error);
      toast({ title: 'AI Error', description: 'Service unavailable', variant: 'destructive' });
    } finally {
      setAiSuggestingFor(null);
    }
  };

  // Re-ask AI with user context explanation
  const refineAiSuggestion = async (tx: BankTransaction) => {
    if (!aiUserContext.trim()) return;
    await getAiSuggestion(tx, aiUserContext.trim());
  };

  // Accept AI suggestion - set draft category
  const acceptAiSuggestion = (transactionId: string) => {
    if (!aiSuggestion || aiSuggestion.transactionId !== transactionId) return;
    const { suggestion } = aiSuggestion;
    
    if (suggestion.suggestedCategoryId) {
      setDraftCategory(transactionId, suggestion.suggestedCategoryId);
      setAiSuggestion(null);
      toast({ title: 'AI Suggestion Applied', description: `Category: ${suggestion.suggestedCategoryName}` });
    } else if (suggestion.suggestNewCategory && suggestion.newCategoryDetails) {
      // Open create category dialog pre-filled with AI suggestion
      const details = suggestion.newCategoryDetails;
      setNewCategoryName(details.name || '');
      setNewCategoryDescription(details.description || '');
      setNewCategoryType(details.type || 'expense');
      setNewCategoryHmrcMapping(details.hmrcMapping || 'none');
      setNewCategoryDeductibility(details.deductibilityPercent ?? 0);
      setPendingNewCategoryTxId(transactionId);
      setShowNewCategoryDialog(true);
      setAiSuggestion(null);
    }
  };

  // AI-assisted new category name lookup
  const aiAssistNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAiFillingCategory(true);
    try {
      const res = await fetch('/api/categories/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newCategoryName,
          amount: 0,
          type: newCategoryType === 'income' ? 'credit' : 'debit',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.suggestion;
        if (s.suggestNewCategory && s.newCategoryDetails) {
          setNewCategoryName(s.newCategoryDetails.name || newCategoryName);
          setNewCategoryDescription(s.newCategoryDetails.description || '');
          setNewCategoryHmrcMapping(s.newCategoryDetails.hmrcMapping || 'none');
          setNewCategoryDeductibility(s.newCategoryDetails.deductibilityPercent ?? 0);
        } else {
          setNewCategoryDescription(s.reasoning || '');
          setNewCategoryHmrcMapping(s.hmrcBox?.includes('17') ? 'office_costs' : s.hmrcBox?.includes('20') ? 'travel_costs' : 'none');
          setNewCategoryDeductibility(s.deductibilityPercent ?? 0);
        }
        toast({ title: 'AI Filled', description: 'HMRC mapping and description auto-filled' });
      }
    } catch (error) {
      console.error('AI assist error:', error);
    } finally {
      setAiFillingCategory(false);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          type: newCategoryType,
          description: newCategoryDescription || undefined,
          hmrcMapping: newCategoryHmrcMapping !== 'none' ? newCategoryHmrcMapping : undefined,
          defaultDeductibilityPercent: newCategoryDeductibility,
        }),
      });
      if (res.ok) {
        const newCat = await res.json();
        toast({ title: 'Category Created', description: `${newCategoryName} added with HMRC mapping` });
        await fetchCategories();
        setShowNewCategoryDialog(false);
        
        // If created from AI suggestion for a specific transaction, auto-assign it
        if (pendingNewCategoryTxId && newCat.id) {
          setDraftCategory(pendingNewCategoryTxId, newCat.id);
        }
        
        // Reset form
        setNewCategoryName('');
        setNewCategoryDescription('');
        setNewCategoryHmrcMapping('none');
        setNewCategoryDeductibility(0);
        setPendingNewCategoryTxId(null);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const deleteStatement = async (id: string) => {
    try {
      await fetch(`/api/statements/${id}`, { method: 'DELETE' });
      toast({ title: 'Statement Deleted' });
      fetchStatements();
      setShowDeleteDialog(null);
    } catch (error) {
      console.error('Error deleting statement:', error);
    }
  };

  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [editingTransactionData, setEditingTransactionData] = useState<{
    id: string;
    description: string;
    amount: number;
    date: string;
    type: 'credit' | 'debit';
  } | null>(null);

  const deleteTransaction = async (id: string) => {
    try {
      await fetch(`/api/statements/transactions/${id}`, { method: 'DELETE' });
      toast({ title: 'Transaction Deleted', description: 'Transaction removed. This action is logged for audit purposes.' });
      fetchStatements();
      setDeleteTransactionId(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({ title: 'Error', description: 'Failed to delete transaction', variant: 'destructive' });
    }
  };

  const updateTransaction = async () => {
    if (!editingTransactionData) return;
    try {
      await fetch(`/api/statements/transactions/${editingTransactionData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editingTransactionData.description,
          amount: editingTransactionData.amount,
          date: editingTransactionData.date,
          type: editingTransactionData.type,
        }),
      });
      toast({ title: 'Transaction Updated', description: 'Changes saved. Edit history is preserved for audit.' });
      fetchStatements();
      setEditingTransactionData(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({ title: 'Error', description: 'Failed to update transaction', variant: 'destructive' });
    }
  };

  const toggleStatementExpanded = (id: string) => {
    setExpandedStatements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle tab change - reset page number
  const handleTabChange = (tab: 'all' | 'uncategorised') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedTransactions(new Set());
  };

  // Bulk selection functions
  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllOnPage = () => {
    const currentTxs = paginatedTransactions();
    const allPageSelected = currentTxs.length > 0 && currentTxs.every(tx => selectedTransactions.has(tx.id));
    if (allPageSelected) {
      // Deselect all
      setSelectedTransactions(new Set());
    } else {
      // Select all on current page
      setSelectedTransactions(new Set(currentTxs.map(tx => tx.id)));
    }
  };

  const selectAllAcrossPages = () => {
    setSelectedTransactions(new Set(allFilteredTransactions.map(tx => tx.id)));
  };

  const bulkDeleteTransactions = async () => {
    if (selectedTransactions.size === 0) return;
    
    if (!confirm(`Delete ${selectedTransactions.size} selected transactions? This cannot be undone.`)) {
      return;
    }

    try {
      for (const id of selectedTransactions) {
        await fetch(`/api/statements/transactions/${id}`, { method: 'DELETE' });
      }
      toast({ title: 'Bulk Delete Complete', description: `${selectedTransactions.size} transactions deleted` });
      setSelectedTransactions(new Set());
      fetchStatements();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({ title: 'Error', description: 'Failed to delete some transactions', variant: 'destructive' });
    }
  };

  const bulkCategorise = async () => {
    if (selectedTransactions.size === 0 || !bulkCategoryId) return;

    try {
      let learnedCount = 0;
      for (const id of selectedTransactions) {
        const res = await fetch(`/api/statements/transactions/${id}/categorize`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: bulkCategoryId, learnRule: true }),
        });
        const data = await res.json();
        if (data.rule) learnedCount++;
      }
      
      toast({ 
        title: '🧠 Bulk Categorisation Complete', 
        description: `${selectedTransactions.size} transactions categorised. ${learnedCount} new rules learned!`
      });
      setSelectedTransactions(new Set());
      setBulkCategoryId(null);
      fetchStatements();
    } catch (error) {
      console.error('Bulk categorise error:', error);
      toast({ title: 'Error', description: 'Failed to categorise some transactions', variant: 'destructive' });
    }
  };

  const getAllTransactions = () => {
    let allTx: (BankTransaction & { statementName: string; statementEntityId: string | null })[] = [];
    statements.forEach(stmt => {
      stmt.transactions.forEach(tx => {
        allTx.push({ ...tx, statementName: stmt.fileName, statementEntityId: stmt.entityId });
      });
    });
    return allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getEntityRegimeLabel = (entityId: string | null | undefined): string => {
    if (!entityId) return 'AI Tax Assistant';
    const entity = entities.find(e => e.id === entityId);
    if (!entity) return 'AI Tax Assistant';
    const companyTypes = ['limited_company', 'llp', 'partnership'];
    return companyTypes.includes(entity.type) ? 'AI Companies House Assistant' : 'AI HMRC Assistant';
  };

  const filteredTransactions = () => {
    let txs = getAllTransactions();
    if (activeTab === 'uncategorised') {
      txs = txs.filter(tx => !tx.categoryId);
    }
    if (filterType !== 'all') {
      txs = txs.filter(tx => tx.type === filterType);
    }
    // Apply date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      txs = txs.filter(tx => new Date(tx.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      txs = txs.filter(tx => new Date(tx.date) <= to);
    }
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      txs = txs.filter(tx => 
        tx.description.toLowerCase().includes(query) ||
        tx.category?.name.toLowerCase().includes(query) ||
        tx.notes?.toLowerCase().includes(query)
      );
    }
    // Apply sorting
    txs.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'description': cmp = a.description.localeCompare(b.description); break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'amount': cmp = Math.abs(a.amount) - Math.abs(b.amount); break;
        case 'category': cmp = (a.category?.name || 'zzz').localeCompare(b.category?.name || 'zzz'); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return txs;
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const allFilteredTransactions = filteredTransactions();
  const totalPages = Math.ceil(allFilteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allFilteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const totals = (() => {
    const filtered = filteredTransactions();
    const all = getAllTransactions();
    const hasDateFilter = dateFrom || dateTo;
    return {
      credits: filtered.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0),
      debits: filtered.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0),
      uncategorised: hasDateFilter ? filtered.filter(tx => !tx.categoryId).length : all.filter(tx => !tx.categoryId).length,
      total: hasDateFilter ? filtered.length : all.length,
    };
  })();

  const exportTransactions = (format: 'csv' | 'json') => {
    const txs = filteredTransactions();
    if (format === 'csv') {
      const headers = ['Date', 'Description', 'Type', 'Amount', 'Category', 'Notes', 'Statement'];
      const rows = txs.map(tx => [
        new Date(tx.date).toLocaleDateString('en-GB'),
        tx.description,
        tx.type,
        tx.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        tx.category?.name || 'Uncategorised',
        tx.notes || '',
        tx.statementName,
      ]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(txs, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank-transactions-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('statements.title')}</h1>
          <p className="text-muted-foreground">{t('statements.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {entities.length > 0 ? (
            <Select value={selectedEntityId || ''} onValueChange={(v) => { setSelectedEntityId(v === '__none__' ? null : v); }}>
              <SelectTrigger className={`w-[280px] h-10 ${!selectedEntityId ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-primary/30'}`}>
                <div className="flex items-center gap-2 truncate">
                  <Landmark className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <SelectValue placeholder="Select entity to filter *" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-w-[320px]">
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">All Entities</span>
                </SelectItem>
                {activeEntities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <div className="flex items-center gap-2">
                      {e.type === 'individual' || e.type === 'sole_trader' 
                        ? <User className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                        : <Building2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                      <span className="truncate">{e.name}</span>
                      {e.isDefault && <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px] h-4 px-1 ml-1">Default</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <a href="/entities" className="text-sm text-amber-500 hover:underline flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
              <Landmark className="h-4 w-4" /> Create an entity first
            </a>
          )}
          {autoSyncing && (
            <div className="flex items-center gap-1.5 text-xs text-blue-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing...
            </div>
          )}
          <Button variant="outline" onClick={() => exportTransactions('csv')}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <ScanUploadButton
            uploadType="statement"
            entityId={selectedEntityId || undefined}
            onUploadComplete={() => fetchStatements()}
            showUploadButton={false}
            label="Scan Statement"
            disabled={!selectedEntityId}
          />
          <label className="cursor-pointer">
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf"
              className="hidden"
              onChange={(e) => {
                if (!selectedEntityId) {
                  toast({ title: 'Entity Required', description: 'Please select an entity before uploading a statement.', variant: 'destructive' });
                  return;
                }
                handleFileUpload(e.target.files);
              }}
              disabled={uploading || !selectedEntityId}
            />
            <Button disabled={uploading || !selectedEntityId} asChild>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload Statement
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{uploadStatus}</span>
                <span className="text-sm font-bold text-blue-800 dark:text-blue-300">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-foreground">Upload Errors</h4>
                <ul className="mt-2 text-sm text-red-700">
                  {uploadErrors.map((err, i) => <li key={i}>• {err}</li>)}
                </ul>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setUploadErrors([])}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statements needing review */}
      {statements.filter(s => s.parseStatus !== 'success').length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Statements Requiring Review
            </CardTitle>
            <CardDescription>These statements could not be fully parsed automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statements.filter(s => s.parseStatus !== 'success').map(statement => (
                <div key={statement.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground/60" />
                    <div>
                      <p className="font-medium">{statement.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {statement.transactions.length} transactions • 
                        <Badge variant="outline" className={
                          statement.parseStatus === 'needs_review' 
                            ? 'ml-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700' 
                            : 'ml-2 bg-red-100 dark:bg-red-900/30 text-foreground border-red-300 dark:border-red-700'
                        }>
                          {statement.parseStatus === 'needs_review' ? 'Needs Review' : 'Failed'}
                        </Badge>
                      </p>
                      {statement.parseError && (
                        <p className="text-xs text-red-600 mt-1">{statement.parseError}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchDebugText(statement.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View Extracted Text
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-border"
                      onClick={() => setShowDeleteDialog(statement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">£{totals.credits.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">£{totals.debits.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{totals.total}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={totals.uncategorised > 0 ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uncategorised</p>
                <p className="text-2xl font-bold text-yellow-600">{totals.uncategorised}</p>
              </div>
              {totals.uncategorised > 0 ? (
                <XCircle className="h-8 w-8 text-yellow-600" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as 'all' | 'uncategorised')}>
                <TabsList>
                  <TabsTrigger value="all">All Transactions ({totals.total})</TabsTrigger>
                  <TabsTrigger value="uncategorized" className={totals.uncategorised > 0 ? 'text-yellow-600' : ''}>
                    Uncategorised ({totals.uncategorised})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Date Range Filter */}
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="w-[140px] h-9 text-xs"
                  placeholder="From"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="w-[140px] h-9 text-xs"
                  placeholder="To"
                />
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}>
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                )}
                <span className="text-muted-foreground">|</span>
                {/* Search Input */}
                <div className="relative">
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-[200px] pl-8"
                  />
                  <Filter className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Income Only</SelectItem>
                    <SelectItem value="debit">Expenses Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setShowNewCategoryDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" /> New Category
                </Button>
              </div>
            </div>

            {/* Filtered Transactions Summary - shows when any filter is active */}
            {(searchQuery.trim() || filterType !== 'all' || dateFrom || dateTo) && allFilteredTransactions.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800 dark:text-blue-300">
                        Filtered Results: {allFilteredTransactions.length} transaction{allFilteredTransactions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {searchQuery.trim() && (
                      <Badge variant="outline" className="bg-card">
                        Search: &quot;{searchQuery}&quot;
                      </Badge>
                    )}
                    {(dateFrom || dateTo) && (
                      <Badge variant="outline" className="bg-card">
                        Period: {dateFrom || '...'} to {dateTo || '...'}
                      </Badge>
                    )}
                    {filterType !== 'all' && (
                      <Badge variant="outline" className="bg-card">
                        Type: {filterType === 'credit' ? 'Income' : 'Expenses'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    {(() => {
                      const filteredCredits = allFilteredTransactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
                      const filteredDebits = allFilteredTransactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);
                      const filteredNet = filteredCredits - filteredDebits;
                      return (
                        <>
                          {filterType !== 'debit' && (
                            <div className="text-center">
                              <p className="text-muted-foreground text-xs uppercase">Income</p>
                              <p className="font-bold text-green-600">
                                +£{filteredCredits.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}
                          {filterType !== 'credit' && (
                            <div className="text-center">
                              <p className="text-muted-foreground text-xs uppercase">Expenses</p>
                              <p className="font-bold text-red-600">
                                -£{filteredDebits.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}
                          {filterType === 'all' && (
                            <div className="text-center border-l pl-4 ml-2">
                              <p className="text-muted-foreground text-xs uppercase">Net Total</p>
                              <p className={`font-bold ${filteredNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {filteredNet >= 0 ? '+' : ''}£{filteredNet.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Actions Bar */}
            {selectedTransactions.size > 0 && (
              <div className="space-y-2">
              {/* Select all across pages banner */}
              {totalPages > 1 && selectedTransactions.size < allFilteredTransactions.length && paginatedTransactions().every(tx => selectedTransactions.has(tx.id)) && (
                <div className="flex items-center justify-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm">
                  <span className="text-yellow-800 dark:text-yellow-300">
                    All {paginatedTransactions().length} transactions on this page are selected.
                  </span>
                  <Button
                    size="sm"
                    variant="link"
                    className="text-yellow-700 dark:text-yellow-400 font-semibold p-0 h-auto"
                    onClick={selectAllAcrossPages}
                  >
                    Select all {allFilteredTransactions.length} transactions across all pages
                  </Button>
                </div>
              )}
              {selectedTransactions.size === allFilteredTransactions.length && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-sm">
                  <span className="text-green-800 dark:text-green-300">
                    All {allFilteredTransactions.length} transactions across all pages are selected.
                  </span>
                  <Button
                    size="sm"
                    variant="link"
                    className="text-green-700 dark:text-green-400 font-semibold p-0 h-auto"
                    onClick={() => setSelectedTransactions(new Set())}
                  >
                    Clear selection
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {selectedTransactions.size} selected
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <Select value={bulkCategoryId || ''} onValueChange={(v) => setBulkCategoryId(v || null)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={bulkCategorise} disabled={!bulkCategoryId}>
                    Apply & Learn
                  </Button>
                  <Button size="sm" variant="destructive" onClick={bulkDeleteTransactions}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedTransactions(new Set())}>
                  Clear Selection
                </Button>
              </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={paginatedTransactions().length > 0 && paginatedTransactions().every(tx => selectedTransactions.has(tx.id))}
                      onCheckedChange={() => selectAllOnPage()}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => toggleSort('date')}>
                    <span className="flex items-center gap-1">Date {sortField === 'date' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />}</span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => toggleSort('description')}>
                    <span className="flex items-center gap-1">Description {sortField === 'description' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />}</span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => toggleSort('type')}>
                    <span className="flex items-center gap-1">Type {sortField === 'type' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />}</span>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => toggleSort('amount')}>
                    <span className="flex items-center justify-end gap-1">Amount {sortField === 'amount' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />}</span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => toggleSort('category')}>
                    <span className="flex items-center gap-1">Category {sortField === 'category' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />}</span>
                  </TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {statements.length === 0
                        ? 'No bank statements uploaded. Upload a statement to get started.'
                        : 'No transactions match your filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions().map((tx) => (
                    <TableRow key={tx.id} className={`${!tx.categoryId ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''} ${selectedTransactions.has(tx.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.has(tx.id)}
                          onCheckedChange={() => toggleTransactionSelection(tx.id)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={tx.description}>
                        {tx.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'}
                          className={tx.type === 'credit' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'}>
                          {tx.type === 'credit' ? 'Income' : 'Expense'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}£{tx.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const hasDraft = draftCategorisations.has(tx.id);
                          const draftCategoryId = draftCategorisations.get(tx.id);
                          const draftCategory = draftCategoryId ? categories.find(c => c.id === draftCategoryId) : null;
                          const isSaving = savingCategory === tx.id;
                          
                          if (hasDraft) {
                            // Show draft state with confirm/cancel buttons
                            return (
                              <div className={`flex items-center gap-2 p-2 rounded-md ${isSaving ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700'}`}>
                                <Select
                                  value={draftCategoryId || 'uncategorised'}
                                  onValueChange={(v) => setDraftCategory(tx.id, v)}
                                  disabled={isSaving}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="uncategorized">No Category</SelectItem>
                                    {categories
                                      .filter(c => c.type === (tx.type === 'credit' ? 'income' : 'expense'))
                                      .map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                  onClick={() => confirmCategorisation(tx.id)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => cancelDraftCategory(tx.id)}
                                  disabled={isSaving}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          }
                          
                          if (editingTransaction === tx.id) {
                            const isAiLoading = aiSuggestingFor === tx.id;
                            const hasSuggestion = aiSuggestion?.transactionId === tx.id;
                            // Show dropdown for initial selection + AI button
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={tx.categoryId || 'uncategorised'}
                                    onValueChange={(v) => {
                                      if (v !== 'uncategorised' && v !== tx.categoryId) {
                                        setDraftCategory(tx.id, v);
                                      }
                                      setEditingTransaction(null);
                                    }}
                                  >
                                    <SelectTrigger className="w-[160px]">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="uncategorized">No Category</SelectItem>
                                      {categories
                                        .filter(c => c.type === (tx.type === 'credit' ? 'income' : 'expense'))
                                        .map((cat) => (
                                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                                    onClick={() => getAiSuggestion(tx)}
                                    disabled={isAiLoading}
                                    title={getEntityRegimeLabel((() => { const s = statements.find(s => s.transactions.some(t => t.id === tx.id)); return s?.entityId; })())}
                                  >
                                    {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                  </Button>
                                </div>
                                {(hasSuggestion || isAiLoading) && (
                                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-xs space-y-2 max-w-[350px]">
                                    <div className="flex items-center gap-1.5 font-semibold text-purple-800 dark:text-purple-300">
                                      <Bot className="h-3.5 w-3.5" /> {getEntityRegimeLabel((() => { const s = statements.find(s => s.transactions.some(t => t.id === tx.id)); return s?.entityId; })())}
                                    </div>
                                    {isAiLoading ? (
                                      <div className="flex items-center gap-2 py-2 text-purple-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Analysing transaction...</span>
                                      </div>
                                    ) : hasSuggestion && (
                                      <>
                                        <div className="text-purple-900">
                                          <span className="font-medium">Suggested: </span>
                                          <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                                            {aiSuggestion.suggestion.suggestedCategoryName}
                                          </Badge>
                                        </div>
                                        <p className="text-purple-700 leading-relaxed">{aiSuggestion.suggestion.reasoning}</p>
                                        {aiSuggestion.suggestion.hmrcBox && (
                                          <div className="flex items-center gap-1 text-purple-600">
                                            <Lightbulb className="h-3 w-3" />
                                            <span>{aiSuggestion.suggestion.hmrcBox} • {aiSuggestion.suggestion.deductibilityPercent}% deductible</span>
                                          </div>
                                        )}
                                        {aiSuggestion.suggestion.followUpQuestion && (
                                          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded p-2 text-yellow-800 dark:text-yellow-300">
                                            <span className="font-medium">Clarification needed: </span>
                                            {aiSuggestion.suggestion.followUpQuestion}
                                          </div>
                                        )}
                                        <div className="flex gap-1.5 pt-1">
                                          <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => { acceptAiSuggestion(tx.id); setAiUserContext(''); }}>
                                            {aiSuggestion.suggestion.suggestedCategoryId ? 'Apply Category' : 'Create Category'}
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAiSuggestion(null); setAiUserContext(''); }}>
                                            Dismiss
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                    {/* Chat input - explain to AI what this transaction is */}
                                    <div className="border-t border-purple-200 pt-2 mt-2">
                                      <p className="text-purple-600 mb-1.5 font-medium">Not right? Explain what this is:</p>
                                      <div className="flex gap-1.5">
                                        <Input
                                          value={aiUserContext}
                                          onChange={(e) => setAiUserContext(e.target.value)}
                                          placeholder="e.g. This is a dividend payment to the director"
                                          className="h-8 text-xs flex-1"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && aiUserContext.trim()) {
                                              refineAiSuggestion(tx);
                                            }
                                          }}
                                        />
                                        <Button
                                          size="sm"
                                          className="h-8 px-2 bg-purple-600 hover:bg-purple-700"
                                          onClick={() => refineAiSuggestion(tx)}
                                          disabled={!aiUserContext.trim() || isAiLoading}
                                        >
                                          {isAiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          
                          // Show current category with edit button
                          return (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingTransaction(tx.id)}
                                className="flex items-center gap-1 hover:bg-muted px-2 py-1 rounded text-left"
                              >
                                {tx.category ? (
                                  <Badge variant="outline">{tx.category.name}</Badge>
                                ) : (
                                  <span className="text-yellow-600 italic">Click to categorise</span>
                                )}
                                <Pencil className="h-3 w-3 text-muted-foreground/60" />
                              </button>
                              {!tx.categoryId && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                                  onClick={() => { setEditingTransaction(tx.id); getAiSuggestion(tx); }}
                                  disabled={aiSuggestingFor === tx.id}
                                  title={getEntityRegimeLabel((tx as any).statementEntityId)}
                                >
                                  {aiSuggestingFor === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Add notes..."
                          defaultValue={tx.notes || ''}
                          className="w-[150px] h-8 text-sm"
                          onBlur={(e) => {
                            if (e.target.value !== (tx.notes || '')) {
                              updateTransactionNotes(tx.id, e.target.value);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingTransactionData({
                              id: tx.id,
                              description: tx.description,
                              amount: tx.amount,
                              date: new Date(tx.date).toISOString().split('T')[0],
                              type: tx.type,
                            })}
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setDeleteTransactionId(tx.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, allFilteredTransactions.length)} of {allFilteredTransactions.length} transactions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statements List — hidden, transactions shown in flat view above */}
      <Card className="hidden">
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No statements uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {statements.map((stmt) => (
                <div key={stmt.id} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleStatementExpanded(stmt.id)}
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{stmt.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {stmt.transactions.length} transactions • 
                          {stmt.account ? ` ${stmt.account.provider.name} - ${stmt.account.accountName}` : ' No account linked'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-green-600">+£{stmt.totalCredits.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-sm text-red-600">-£{stmt.totalDebits.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(stmt.id); }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      {expandedStatements.has(stmt.id) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  {expandedStatements.has(stmt.id) && (
                    <div className="border-t p-4 bg-muted/50">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-muted-foreground">
                          {stmt.transactions.filter(t => t.needsReview).length > 0 && (
                            <span className="text-yellow-600 flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              {stmt.transactions.filter(t => t.needsReview).length} transactions need review
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); classifyTransactions(stmt.id); }}
                          className="gap-2"
                        >
                          <Loader2 className="h-4 w-4" />
                          AI Classify for HMRC
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>HMRC</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stmt.transactions.map((tx) => (
                            <TableRow key={tx.id} className={tx.needsReview ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                              <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{tx.description}</span>
                                  {tx.aiReasoning && tx.confidenceScore && tx.confidenceScore < 0.8 && (
                                    <span className="text-xs text-muted-foreground italic">{tx.aiReasoning}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={tx.type === 'credit' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'}>
                                  {tx.type === 'credit' ? 'Income' : 'Expense'}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-right ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'credit' ? '+' : '-'}£{tx.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const hasDraft = draftCategorisations.has(tx.id);
                                  const draftCategoryId = draftCategorisations.get(tx.id);
                                  const isSaving = savingCategory === tx.id;
                                  
                                  if (hasDraft) {
                                    // Show draft state with confirm/cancel buttons
                                    return (
                                      <div className={`flex items-center gap-1.5 p-1.5 rounded-md ${isSaving ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700'}`}>
                                        <Select
                                          value={draftCategoryId || 'uncategorised'}
                                          onValueChange={(v) => setDraftCategory(tx.id, v)}
                                          disabled={isSaving}
                                        >
                                          <SelectTrigger className="w-[120px] h-8 text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="uncategorized">
                                              <span className="text-yellow-600">Uncategorised</span>
                                            </SelectItem>
                                            {categories
                                              .filter(c => c.type === (tx.type === 'credit' ? 'income' : 'expense'))
                                              .map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                  {cat.name}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          size="sm"
                                          className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                                          onClick={() => confirmCategorisation(tx.id)}
                                          disabled={isSaving}
                                          title="Confirm"
                                        >
                                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                          onClick={() => cancelDraftCategory(tx.id)}
                                          disabled={isSaving}
                                          title="Cancel"
                                        >
                                          <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    );
                                  }
                                  
                                  // Show dropdown + AI button for selection
                                  return (
                                    <div className="flex items-center gap-1">
                                      <Select
                                        value={tx.categoryId || 'uncategorised'}
                                        onValueChange={(v) => {
                                          if (v !== 'uncategorised') {
                                            setDraftCategory(tx.id, v);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-[130px] h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="uncategorized">
                                            <span className="text-yellow-600">Uncategorised</span>
                                          </SelectItem>
                                          {categories
                                            .filter(c => c.type === (tx.type === 'credit' ? 'income' : 'expense'))
                                            .map((cat) => (
                                              <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                      {!tx.categoryId && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                                          onClick={() => { setEditingTransaction(tx.id); getAiSuggestion(tx); }}
                                          disabled={aiSuggestingFor === tx.id}
                                          title={getEntityRegimeLabel(stmt.entityId)}
                                        >
                                          {aiSuggestingFor === tx.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                {tx.hmrcMapping && tx.hmrcMapping !== 'none' ? (
                                  <Badge variant="outline" className="text-xs">
                                    {tx.isTaxDeductible ? '✓ ' : ''}{tx.hmrcMapping.replace(/_/g, ' ')}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground/60 text-xs">N/A</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Category Dialog - Enhanced with AI HMRC Assistant */}
      <Dialog open={showNewCategoryDialog} onOpenChange={(open) => {
        setShowNewCategoryDialog(open);
        if (!open) {
          setNewCategoryName('');
          setNewCategoryDescription('');
          setNewCategoryHmrcMapping('none');
          setNewCategoryDeductibility(0);
          setPendingNewCategoryTxId(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Create New Category
            </DialogTitle>
            <DialogDescription>
              Add an HMRC-compliant category. Use the AI assistant to auto-fill fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Consultancy Services"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50 whitespace-nowrap"
                  onClick={aiAssistNewCategory}
                  disabled={aiFillingCategory || !newCategoryName.trim()}
                  title="AI will auto-fill HMRC mapping, description and deductibility"
                >
                  {aiFillingCategory ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  AI Fill
                </Button>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="HMRC-compliant description"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as any)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tax Deductibility</Label>
                <Select value={String(newCategoryDeductibility)} onValueChange={(v) => setNewCategoryDeductibility(Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Personal)</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50% (Mixed Use)</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100% (Business)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>HMRC SA103 Mapping</Label>
              <Select value={newCategoryHmrcMapping} onValueChange={setNewCategoryHmrcMapping}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Personal/Household)</SelectItem>
                  <SelectItem value="office_costs">Office Costs (Box 17)</SelectItem>
                  <SelectItem value="travel_costs">Travel & Vehicle (Box 18/20)</SelectItem>
                  <SelectItem value="clothing">Clothing (Box 19)</SelectItem>
                  <SelectItem value="staff_costs">Staff Costs (Box 21)</SelectItem>
                  <SelectItem value="reselling_goods">Goods for Resale (Box 22)</SelectItem>
                  <SelectItem value="premises_costs">Premises Costs (Box 23)</SelectItem>
                  <SelectItem value="advertising">Advertising (Box 24)</SelectItem>
                  <SelectItem value="financial_charges">Bank & Finance (Box 25)</SelectItem>
                  <SelectItem value="legal_professional">Professional Fees (Box 26)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newCategoryHmrcMapping !== 'none' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                <div className="flex items-center gap-1 font-medium mb-1">
                  <Lightbulb className="h-3.5 w-3.5" /> Tax Deductible Category
                </div>
                Transactions in this category will be {newCategoryDeductibility}% tax deductible and mapped to HMRC SA103 for Self Assessment reporting.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>Cancel</Button>
            <Button onClick={createCategory} disabled={!newCategoryName.trim()}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Statement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this statement and all its transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-sm"
              onClick={() => showDeleteDialog && deleteStatement(showDeleteDialog)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Debug Text Dialog */}
      <Dialog open={!!debugStatementId} onOpenChange={() => { setDebugStatementId(null); setDebugText(null); }}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Extracted Text Debug</DialogTitle>
            <DialogDescription>
              First 3000 characters of extracted text from the PDF
            </DialogDescription>
          </DialogHeader>
          {loadingDebug ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : debugText ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Total text length: {debugText.textLength.toLocaleString()} chars</span>
                {debugText.parseError && (
                  <Badge variant="destructive">{debugText.parseError}</Badge>
                )}
              </div>
              <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[50vh]">
                <pre className="text-xs whitespace-pre-wrap font-mono">{debugText.textPreview}</pre>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => { setDebugStatementId(null); setDebugText(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransactionData} onOpenChange={() => setEditingTransactionData(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Changes are logged for audit purposes
            </DialogDescription>
          </DialogHeader>
          {editingTransactionData && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editingTransactionData.date}
                  onChange={(e) => setEditingTransactionData({ ...editingTransactionData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingTransactionData.description}
                  onChange={(e) => setEditingTransactionData({ ...editingTransactionData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Amount (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingTransactionData.amount}
                  onChange={(e) => setEditingTransactionData({ ...editingTransactionData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={editingTransactionData.type} onValueChange={(v) => setEditingTransactionData({ ...editingTransactionData, type: v as 'credit' | 'debit' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Income (Credit)</SelectItem>
                    <SelectItem value="debit">Expense (Debit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTransactionData(null)}>Cancel</Button>
            <Button onClick={updateTransaction}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Confirmation */}
      <AlertDialog open={!!deleteTransactionId} onOpenChange={() => setDeleteTransactionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transaction. This action is logged for audit purposes and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-sm"
              onClick={() => deleteTransactionId && deleteTransaction(deleteTransactionId)}
            >
              Delete Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Apply to Similar Transactions Dialog */}
      <Dialog open={showApplyToSimilarDialog} onOpenChange={(open) => {
        if (!open && !applyingToSimilar) {
          skipSimilarTransactions();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              Apply to Similar Transactions?
            </DialogTitle>
            <DialogDescription>
              We found <strong>{similarTransactions.length}</strong> other uncategorized transactions 
              containing <Badge variant="outline" className="mx-1">{pendingCategorisation?.keyword}</Badge>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
              {similarTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{tx.description}</p>
                    <p className="text-muted-foreground text-xs">{new Date(tx.date).toLocaleDateString('en-GB')}</p>
                  </div>
                  <span className={`ml-2 font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}£{tx.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {similarTransactions.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  ...and {similarTransactions.length - 5} more
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={skipSimilarTransactions}
              disabled={applyingToSimilar}
            >
              No, just this one
            </Button>
            <Button
              onClick={() => applyToSimilarTransactions()}
              disabled={applyingToSimilar}
              className="gap-2"
            >
              {applyingToSimilar ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Yes, apply to all {similarTransactions.length}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
