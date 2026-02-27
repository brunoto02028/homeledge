'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Invoice, Category, InvoiceStatus, ExpenseType, EXPENSE_TYPE_LABELS } from '@/lib/types';
import { Upload, FileText, Loader2, Pencil, Trash2, Download, Eye, CheckCircle, XCircle, Clock, Plus, FilePlus, Mic, MicOff, Image, X, Save, FolderOpen, Star, Settings, Camera, Building2, User, Send } from 'lucide-react';
import { ScanUploadButton } from '@/components/scan-upload-button';
import { useTranslation } from '@/lib/i18n';
import { useEntityContext } from '@/components/entity-context';
import { EntityConfirmDialog, type EntityMatchInfo } from '@/components/entity-confirm-dialog';

interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  businessName: string;
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  vatNumber?: string;
  companyNumber?: string;
  logoUrl?: string;
  bankName?: string;
  accountName?: string;
  sortCode?: string;
  accountNumber?: string;
  iban?: string;
  bic?: string;
  currency: string;
  vatRate?: number;
  paymentTerms: number;
  footerNotes?: string;
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  processed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  error: 'bg-muted text-muted-foreground/60',
  reviewed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
};

const STATUS_ICONS: Record<InvoiceStatus, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  processed: <CheckCircle className="h-3 w-3" />,
  error: <XCircle className="h-3 w-3" />,
  reviewed: <CheckCircle className="h-3 w-3" />,
};

interface InvoiceFormData {
  yourName: string;
  yourAddress: string;
  yourEmail: string;
  yourPhone: string;
  yourCompanyNumber: string;
  yourVatNumber: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  bankName: string;
  accountName: string;
  sortCode: string;
  accountNumber: string;
  items: { description: string; quantity: number; unitPrice: number; amount: number }[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes: string;
  paymentTerms: string;
  isPaid: boolean;
  logoUrl: string;
}

const emptyInvoice: InvoiceFormData = {
  yourName: '', yourAddress: '', yourEmail: '', yourPhone: '', yourCompanyNumber: '', yourVatNumber: '',
  clientName: '', clientAddress: '', clientEmail: '',
  invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '',
  bankName: '', accountName: '', sortCode: '', accountNumber: '',
  items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
  subtotal: 0, vatRate: 0, vatAmount: 0, total: 0,
  notes: '', paymentTerms: 'Payment due within 30 days', isPaid: false, logoUrl: '',
};

export default function InvoicesClient() {
  const { t } = useTranslation();
  const { entities, selectedEntityId, selectedEntity } = useEntityContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState<InvoiceFormData>(emptyInvoice);
  const [isListening, setIsListening] = useState(false);
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Template state
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isDefaultTemplate, setIsDefaultTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);
  const [entityConfirmOpen, setEntityConfirmOpen] = useState(false);
  const [pendingEntityMatch, setPendingEntityMatch] = useState<EntityMatchInfo | null>(null);
  const [pendingEntityInvoiceId, setPendingEntityInvoiceId] = useState<string | null>(null);
  const [pendingEntityDocDesc, setPendingEntityDocDesc] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterCategory !== 'all') params.set('categoryId', filterCategory);
      if (selectedEntityId) params.set('entityId', selectedEntityId);
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, selectedEntityId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/invoice-templates');
      const data = await res.json();
      setTemplates(data);
      // Auto-select default template
      const defaultTemplate = data.find((t: InvoiceTemplate) => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      setNewInvoice(emptyInvoice);
      return;
    }
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (template.paymentTerms || 30));
    
    setNewInvoice({
      ...emptyInvoice,
      yourName: template.businessName,
      yourAddress: template.businessAddress || '',
      yourEmail: template.businessEmail || '',
      yourPhone: template.businessPhone || '',
      yourCompanyNumber: template.companyNumber || '',
      yourVatNumber: template.vatNumber || '',
      logoUrl: template.logoUrl || '',
      bankName: template.bankName || '',
      accountName: template.accountName || '',
      sortCode: template.sortCode || '',
      accountNumber: template.accountNumber || '',
      vatRate: template.vatRate || 0,
      paymentTerms: template.footerNotes || `Payment due within ${template.paymentTerms || 30} days`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
    });
    toast({ title: 'Template Applied', description: `Using "${template.name}" template` });
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: 'Error', description: 'Please enter a template name', variant: 'destructive' });
      return;
    }
    setSavingTemplate(true);
    try {
      const templateData = {
        name: templateName,
        isDefault: isDefaultTemplate,
        businessName: newInvoice.yourName,
        businessAddress: newInvoice.yourAddress,
        businessEmail: newInvoice.yourEmail,
        businessPhone: newInvoice.yourPhone,
        vatNumber: newInvoice.yourVatNumber,
        companyNumber: newInvoice.yourCompanyNumber,
        logoUrl: newInvoice.logoUrl,
        bankName: newInvoice.bankName,
        accountName: newInvoice.accountName,
        sortCode: newInvoice.sortCode,
        accountNumber: newInvoice.accountNumber,
        vatRate: newInvoice.vatRate,
        paymentTerms: 30,
        footerNotes: newInvoice.paymentTerms,
      };
      
      const url = editingTemplate ? `/api/invoice-templates/${editingTemplate.id}` : '/api/invoice-templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      
      if (res.ok) {
        toast({ title: 'Template Saved', description: `Template "${templateName}" has been saved` });
        setShowTemplateDialog(false);
        setTemplateName('');
        setIsDefaultTemplate(false);
        setEditingTemplate(null);
        fetchTemplates();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/invoice-templates/${id}`, { method: 'DELETE' });
      toast({ title: 'Template Deleted' });
      fetchTemplates();
      if (selectedTemplate === id) {
        setSelectedTemplate('none');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete template', variant: 'destructive' });
    }
  };

  useEffect(() => { fetchCategories(); fetchTemplates(); }, []);
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Auto-trigger create dialog when arriving via ?action=new
  const searchParams = useSearchParams();
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') setShowCreateDialog(true);
  }, [searchParams]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (files.length > 12) {
      toast({ title: 'Too many files', description: 'Maximum 12 files allowed', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const uploadedInvoices: Invoice[] = [];

    try {
      for (const file of Array.from(files)) {
        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: false }),
        });
        const { uploadUrl, cloudStoragePath } = await presignedRes.json();
        const url = new URL(uploadUrl);
        const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders') || '';
        const headers: Record<string, string> = { 'Content-Type': file.type };
        if (signedHeaders.includes('content-disposition')) {
          headers['Content-Disposition'] = 'attachment';
        }
        await fetch(uploadUrl, { method: 'PUT', headers, body: file });

        const invoiceRes = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, cloudStoragePath, isPublic: false, status: 'pending', entityId: selectedEntityId || null }),
        });
        const invoice = await invoiceRes.json();
        uploadedInvoices.push(invoice);
      }

      toast({ title: 'Upload Complete', description: `${uploadedInvoices.length} invoice(s) uploaded successfully` });
      for (const invoice of uploadedInvoices) {
        await processInvoice(invoice);
      }
      fetchInvoices();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload Failed', description: 'Failed to upload one or more files', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const processInvoice = async (invoice: Invoice) => {
    setProcessing(invoice.id);
    try {
      const downloadRes = await fetch(`/api/invoices/${invoice.id}`);
      const { downloadUrl } = await downloadRes.json();
      const fileRes = await fetch(downloadUrl);
      const blob = await fileRes.blob();
      const file = new File([blob], invoice.fileName, { type: blob.type || 'application/pdf' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('invoiceId', invoice.id);

      const processRes = await fetch('/api/invoices/process', { method: 'POST', body: formData });
      if (processRes.ok) {
        const processData = await processRes.json();
        toast({ title: 'Invoice Processed', description: `Data extracted from ${invoice.fileName}` });
        // Check entity match
        if (processData.entityMatch && (processData.entityMatch.needsConfirmation || processData.entityMatch.mismatch)) {
          setPendingEntityMatch(processData.entityMatch);
          setPendingEntityDocDesc(processData.extractedData?.providerName || invoice.fileName);
          setPendingEntityInvoiceId(invoice.id);
          setEntityConfirmOpen(true);
        }
      } else {
        throw new Error('Processing failed');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast({ title: 'Processing Failed', description: `Could not extract data from ${invoice.fileName}`, variant: 'destructive' });
    } finally {
      setProcessing(null);
      fetchInvoices();
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editInvoice) return;
    try {
      const res = await fetch(`/api/invoices/${editInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editInvoice, status: 'reviewed' }),
      });
      if (res.ok) {
        toast({ title: 'Invoice Updated', description: 'Invoice details saved successfully' });
        setEditInvoice(null);
        fetchInvoices();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      toast({ title: 'Invoice Deleted' });
      fetchInvoices();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`);
      const { downloadUrl } = await res.json();
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = invoice.fileName;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download Failed', variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number | null | undefined, currency: string = 'GBP') => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB');
  };

  // Voice input
  const startVoiceInput = (field: string) => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({ title: 'Not Supported', description: 'Voice input is not supported in this browser. Please use Chrome.', variant: 'destructive' });
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-GB';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { setIsListening(true); setActiveVoiceField(field); };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewInvoice(inv => ({ ...inv, [field]: transcript }));
    };
    recognition.onend = () => { setIsListening(false); setActiveVoiceField(null); };
    recognition.onerror = () => { setIsListening(false); setActiveVoiceField(null); toast({ title: 'Voice Error', description: 'Could not recognize speech. Try again.', variant: 'destructive' }); };
    recognition.start();
  };

  // Logo upload
  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
      });
      const { uploadUrl, cloudStoragePath } = await presignedRes.json();
      const url = new URL(uploadUrl);
      const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders') || '';
      const headers: Record<string, string> = { 'Content-Type': file.type };
      if (signedHeaders.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }
      await fetch(uploadUrl, { method: 'PUT', headers, body: file });
      
      // Get public URL
      const getUrlRes = await fetch('/api/upload/get-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudStoragePath, isPublic: true }),
      });
      const { url: logoUrl } = await getUrlRes.json();
      setNewInvoice(inv => ({ ...inv, logoUrl }));
      toast({ title: 'Logo Uploaded' });
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({ title: 'Upload Failed', variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Invoice item management
  const updateInvoiceItem = (index: number, field: string, value: string | number) => {
    const newItems = [...newInvoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = Number(newItems[index].quantity) * Number(newItems[index].unitPrice);
    }
    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const vatAmount = subtotal * (newInvoice.vatRate / 100);
    setNewInvoice({ ...newInvoice, items: newItems, subtotal, vatAmount, total: subtotal + vatAmount });
  };

  const addInvoiceItem = () => {
    setNewInvoice({ ...newInvoice, items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }] });
  };

  const removeInvoiceItem = (index: number) => {
    if (newInvoice.items.length === 1) return;
    const newItems = newInvoice.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const vatAmount = subtotal * (newInvoice.vatRate / 100);
    setNewInvoice({ ...newInvoice, items: newItems, subtotal, vatAmount, total: subtotal + vatAmount });
  };

  const updateVatRate = (rate: number) => {
    const vatAmount = newInvoice.subtotal * (rate / 100);
    setNewInvoice({ ...newInvoice, vatRate: rate, vatAmount, total: newInvoice.subtotal + vatAmount });
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.clientName || !newInvoice.invoiceNumber || newInvoice.items.length === 0) {
      toast({ title: 'Error', description: 'Client name, invoice number and at least one item are required', variant: 'destructive' });
      return;
    }
    setCreatingInvoice(true);
    try {
      const res = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });
      if (res.ok) {
        toast({ title: 'Invoice Created', description: 'Your invoice has been created and saved as income.' });
        setShowCreateDialog(false);
        setShowPreviewDialog(false);
        setNewInvoice(emptyInvoice);
        fetchInvoices();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Generate invoice preview HTML
  const generateInvoicePreview = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            ${newInvoice.logoUrl ? `<img src="${newInvoice.logoUrl}" alt="Logo" style="max-height: 80px; max-width: 200px; margin-bottom: 10px;" />` : ''}
            <h1 style="color: #1e40af; margin: 0; font-size: 32px;">INVOICE</h1>
            <p style="color: #666; margin: 5px 0;">Invoice #${newInvoice.invoiceNumber || '[NUMBER]'}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: bold;">${newInvoice.yourName || '[Your Name]'}</p>
            <p style="margin: 5px 0; color: #666; white-space: pre-line;">${newInvoice.yourAddress || '[Your Address]'}</p>
            ${newInvoice.yourEmail ? `<p style="margin: 5px 0; color: #666;">${newInvoice.yourEmail}</p>` : ''}
            ${newInvoice.yourPhone ? `<p style="margin: 5px 0; color: #666;">${newInvoice.yourPhone}</p>` : ''}
            ${newInvoice.yourVatNumber ? `<p style="margin: 5px 0; color: #666;">VAT: ${newInvoice.yourVatNumber}</p>` : ''}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <p style="color: #666; margin: 0; font-size: 12px;">BILL TO</p>
            <p style="margin: 5px 0; font-weight: bold;">${newInvoice.clientName || '[Client Name]'}</p>
            <p style="margin: 5px 0; color: #666; white-space: pre-line;">${newInvoice.clientAddress || '[Client Address]'}</p>
            ${newInvoice.clientEmail ? `<p style="margin: 5px 0; color: #666;">${newInvoice.clientEmail}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${newInvoice.invoiceDate ? new Date(newInvoice.invoiceDate).toLocaleDateString('en-GB') : '[Date]'}</p>
            <p style="margin: 5px 0;"><strong>Due:</strong> ${newInvoice.dueDate ? new Date(newInvoice.dueDate).toLocaleDateString('en-GB') : '[Due Date]'}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e5e7eb; width: 80px;">Qty</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #e5e7eb; width: 120px;">Unit Price</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #e5e7eb; width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${newInvoice.items.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description || '[Description]'}</td>
                <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
                <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">\u00a3${item.unitPrice.toFixed(2)}</td>
                <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">\u00a3${item.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <table style="width: 280px;">
            <tr>
              <td style="padding: 8px 0;">Subtotal:</td>
              <td style="text-align: right; padding: 8px 0;">\u00a3${newInvoice.subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            ${newInvoice.vatRate > 0 ? `
              <tr>
                <td style="padding: 8px 0;">VAT (${newInvoice.vatRate}%):</td>
                <td style="text-align: right; padding: 8px 0;">\u00a3${newInvoice.vatAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ` : ''}
            <tr style="font-weight: bold; font-size: 18px;">
              <td style="padding: 12px 0; border-top: 2px solid #1e40af;">Total:</td>
              <td style="text-align: right; padding: 12px 0; border-top: 2px solid #1e40af; color: #1e40af;">\u00a3${newInvoice.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        ${(newInvoice.bankName || newInvoice.accountName || newInvoice.sortCode || newInvoice.accountNumber) ? `
          <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Bank Details</p>
            ${newInvoice.bankName ? `<p style="margin: 5px 0;"><strong>Bank:</strong> ${newInvoice.bankName}</p>` : ''}
            ${newInvoice.accountName ? `<p style="margin: 5px 0;"><strong>Account Name:</strong> ${newInvoice.accountName}</p>` : ''}
            ${newInvoice.sortCode ? `<p style="margin: 5px 0;"><strong>Sort Code:</strong> ${newInvoice.sortCode}</p>` : ''}
            ${newInvoice.accountNumber ? `<p style="margin: 5px 0;"><strong>Account Number:</strong> ${newInvoice.accountNumber}</p>` : ''}
          </div>
        ` : ''}

        ${newInvoice.notes ? `
          <div style="margin-top: 20px;">
            <p style="font-weight: bold; margin-bottom: 5px;">Notes</p>
            <p style="color: #666; white-space: pre-line;">${newInvoice.notes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
          <p>${newInvoice.paymentTerms || 'Payment due within 30 days'}</p>
        </div>
      </div>
    `;
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${newInvoice.invoiceNumber || 'Preview'}</title>
            <style>
              @media print { body { margin: 0; } }
              body { font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>${generateInvoicePreview()}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('invoices.title')}</h1>
          <p className="text-muted-foreground">{t('invoices.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/submissions">
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" /> Submissions
            </Button>
          </Link>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FilePlus className="h-4 w-4 mr-2" /> {t('invoices.create')}
          </Button>
        </div>
      </div>

      {/* Entity Context Banner */}
      {selectedEntity && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted/50 text-sm">
          {selectedEntity.type === 'individual' || selectedEntity.type === 'sole_trader'
            ? <User className="h-4 w-4 text-amber-500" />
            : <Building2 className="h-4 w-4 text-blue-500" />}
          <span>Showing invoices for <strong>{selectedEntity.name}</strong></span>
          <Badge variant="outline" className="ml-1 text-xs">{selectedEntity.taxRegime === 'corporation_tax' ? 'Corporation Tax' : 'Self Assessment'}</Badge>
        </div>
      )}

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Invoices
          </CardTitle>
          <CardDescription>
            Upload PDF or image files. AI will automatically extract invoice details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 border-2 border-dashed rounded-lg p-8 text-center">
              <input type="file" id="invoice-upload" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => handleFileUpload(e.target.files)} disabled={uploading} />
              <label htmlFor="invoice-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {uploading ? <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" /> : <FileText className="h-10 w-10 text-muted-foreground" />}
                <span className="text-lg font-medium">{uploading ? 'Uploading...' : 'Click to upload or drag and drop'}</span>
                <span className="text-sm text-muted-foreground">PDF, PNG, JPG (max 12 files)</span>
              </label>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 sm:border-l sm:pl-4">
              <p className="text-sm text-muted-foreground mb-1">Or scan with camera</p>
              <ScanUploadButton
                uploadType="invoice"
                entityId={selectedEntityId || undefined}
                onUploadComplete={() => fetchInvoices()}
                showUploadButton={false}
                label="Scan Invoice"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-48">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No invoices found. Upload your first invoice above or create one.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{invoice.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.providerName || '-'}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>
                      {invoice.category ? (
                        <Badge variant="outline" style={{ borderColor: invoice.category.color || undefined }}>
                          {invoice.category.name}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[invoice.status]}>
                        <span className="flex items-center gap-1">
                          {STATUS_ICONS[invoice.status]}
                          {invoice.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {processing === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : invoice.status === 'pending' ? (
                          <Button variant="ghost" size="sm" onClick={() => processInvoice(invoice)} title="Process with AI">
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => setEditInvoice(invoice)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(invoice)} title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete {invoice.fileName}.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>Delete</AlertDialogAction>
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

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Fill in the details to create a professional UK invoice. You can preview before saving.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Template Selector */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <Label className="text-blue-800 dark:text-blue-300">Use Template</Label>
                <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); if (v !== 'none') applyTemplate(v); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template - Start fresh</SelectItem>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.isDefault && <Star className="h-3 w-3 inline mr-1 text-yellow-500" />}
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setTemplateName(''); setIsDefaultTemplate(false); setEditingTemplate(null); setShowTemplateDialog(true); }}>
                <Save className="h-4 w-4 mr-1" /> Save as Template
              </Button>
            </div>

            {/* Logo Upload */}
            <div>
              <Label>Company Logo (optional)</Label>
              <div className="flex items-center gap-4 mt-2">
                {newInvoice.logoUrl ? (
                  <div className="relative">
                    <img src={newInvoice.logoUrl} alt="Logo" className="h-16 object-contain border rounded" />
                    <Button variant="ghost" size="sm" className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-muted hover:bg-red-200 rounded-full"
                      onClick={() => setNewInvoice(inv => ({ ...inv, logoUrl: '' }))}>
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                    <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                      {uploadingLogo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Image className="h-4 w-4 mr-2" />}
                      Upload Logo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Your Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Your Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Your Name / Company</Label>
                  <div className="flex gap-1">
                    <Input value={newInvoice.yourName} onChange={(e) => setNewInvoice(inv => ({ ...inv, yourName: e.target.value }))} />
                    <Button variant="ghost" size="sm" onClick={() => startVoiceInput('yourName')}>
                      {isListening && activeVoiceField === 'yourName' ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={newInvoice.yourEmail} onChange={(e) => setNewInvoice(inv => ({ ...inv, yourEmail: e.target.value }))} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea value={newInvoice.yourAddress} onChange={(e) => setNewInvoice(inv => ({ ...inv, yourAddress: e.target.value }))} rows={2} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={newInvoice.yourPhone} onChange={(e) => setNewInvoice(inv => ({ ...inv, yourPhone: e.target.value }))} />
                </div>
                <div>
                  <Label>Company Number</Label>
                  <Input value={newInvoice.yourCompanyNumber} onChange={(e) => setNewInvoice(inv => ({ ...inv, yourCompanyNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>VAT Number</Label>
                  <Input value={newInvoice.yourVatNumber} onChange={(e) => setNewInvoice(inv => ({ ...inv, yourVatNumber: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Client Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client Name *</Label>
                  <div className="flex gap-1">
                    <Input value={newInvoice.clientName} onChange={(e) => setNewInvoice(inv => ({ ...inv, clientName: e.target.value }))} />
                    <Button variant="ghost" size="sm" onClick={() => startVoiceInput('clientName')}>
                      {isListening && activeVoiceField === 'clientName' ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Client Email</Label>
                  <Input type="email" value={newInvoice.clientEmail} onChange={(e) => setNewInvoice(inv => ({ ...inv, clientEmail: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>Client Address</Label>
                  <Textarea value={newInvoice.clientAddress} onChange={(e) => setNewInvoice(inv => ({ ...inv, clientAddress: e.target.value }))} rows={2} />
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Invoice Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Invoice Number *</Label>
                  <Input value={newInvoice.invoiceNumber} onChange={(e) => setNewInvoice(inv => ({ ...inv, invoiceNumber: e.target.value }))} placeholder="INV-001" />
                </div>
                <div>
                  <Label>Invoice Date</Label>
                  <Input type="date" value={newInvoice.invoiceDate} onChange={(e) => setNewInvoice(inv => ({ ...inv, invoiceDate: e.target.value }))} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice(inv => ({ ...inv, dueDate: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Items</h3>
                <Button variant="outline" size="sm" onClick={addInvoiceItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-32">Unit Price (£)</TableHead>
                    <TableHead className="w-32">Amount</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newInvoice.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Input value={item.description} onChange={(e) => updateInvoiceItem(idx, 'description', e.target.value)} placeholder="Description" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="1" value={item.quantity} onChange={(e) => updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateInvoiceItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell className="font-medium">£{item.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeInvoiceItem(idx)} disabled={newInvoice.items.length === 1}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between"><span>Subtotal:</span><span>£{newInvoice.subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div className="flex items-center justify-between">
                    <span>VAT:</span>
                    <div className="flex items-center gap-2">
                      <Select value={newInvoice.vatRate.toString()} onValueChange={(v) => updateVatRate(parseFloat(v))}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>£{newInvoice.vatAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span><span>£{newInvoice.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Bank Details (for payment)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Bank Name</Label><Input value={newInvoice.bankName} onChange={(e) => setNewInvoice(inv => ({ ...inv, bankName: e.target.value }))} /></div>
                <div><Label>Account Name</Label><Input value={newInvoice.accountName} onChange={(e) => setNewInvoice(inv => ({ ...inv, accountName: e.target.value }))} /></div>
                <div><Label>Sort Code</Label><Input value={newInvoice.sortCode} onChange={(e) => setNewInvoice(inv => ({ ...inv, sortCode: e.target.value }))} placeholder="00-00-00" /></div>
                <div><Label>Account Number</Label><Input value={newInvoice.accountNumber} onChange={(e) => setNewInvoice(inv => ({ ...inv, accountNumber: e.target.value }))} placeholder="12345678" /></div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes / Payment Terms</Label>
              <Textarea value={newInvoice.notes} onChange={(e) => setNewInvoice(inv => ({ ...inv, notes: e.target.value }))} rows={2} placeholder="Additional notes..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => setShowPreviewDialog(true)}>
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
            <Button onClick={handleCreateInvoice} disabled={creatingInvoice}>
              {creatingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>Preview how your invoice will look when printed or exported.</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: generateInvoicePreview() }} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Back to Edit</Button>
            <Button variant="outline" onClick={printInvoice}>
              <Download className="h-4 w-4 mr-2" /> Print/Save as PDF
            </Button>
            <Button onClick={handleCreateInvoice} disabled={creatingInvoice}>
              {creatingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editInvoice} onOpenChange={() => setEditInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Review and edit the extracted invoice details.</DialogDescription>
          </DialogHeader>
          {editInvoice && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Provider Name</Label><Input value={editInvoice.providerName || ''} onChange={(e) => setEditInvoice({ ...editInvoice, providerName: e.target.value })} /></div>
                <div><Label>Invoice Number</Label><Input value={editInvoice.invoiceNumber || ''} onChange={(e) => setEditInvoice({ ...editInvoice, invoiceNumber: e.target.value })} /></div>
                <div><Label>Amount</Label><Input type="number" step="0.01" value={editInvoice.amount || ''} onChange={(e) => setEditInvoice({ ...editInvoice, amount: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Invoice Date</Label><Input type="date" value={editInvoice.invoiceDate ? editInvoice.invoiceDate.split('T')[0] : ''} onChange={(e) => setEditInvoice({ ...editInvoice, invoiceDate: e.target.value })} /></div>
                <div>
                  <Label>Category</Label>
                  <Select value={editInvoice.categoryId || 'uncategorized'} onValueChange={(v) => setEditInvoice({ ...editInvoice, categoryId: v === 'uncategorized' ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">No Category</SelectItem>
                      {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expense Type</Label>
                  <Select value={editInvoice.expenseType || 'none'} onValueChange={(v) => setEditInvoice({ ...editInvoice, expenseType: v === 'none' ? null : v as ExpenseType })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Type</SelectItem>
                      {Object.entries(EXPENSE_TYPE_LABELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={editInvoice.description || ''} onChange={(e) => setEditInvoice({ ...editInvoice, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditInvoice(null)}>Cancel</Button>
            <Button onClick={handleUpdateInvoice}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Update Template' : 'Save as Template'}</DialogTitle>
            <DialogDescription>
              Save your current invoice details as a reusable template. Templates save your business info, bank details, and VAT settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Template Name</Label>
              <Input 
                placeholder="e.g., My Business Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="default-template" 
                checked={isDefaultTemplate}
                onChange={(e) => setIsDefaultTemplate(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="default-template" className="text-sm">
                <Star className="h-4 w-4 inline mr-1 text-yellow-500" />
                Set as default template (auto-loads when creating invoices)
              </Label>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">This template will save:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Business name & contact details</li>
                <li>✓ Bank account information</li>
                <li>✓ VAT number & rate</li>
                <li>✓ Company logo (if uploaded)</li>
                <li>✓ Payment terms & notes</li>
              </ul>
            </div>

            {templates.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-sm text-muted-foreground">Existing Templates</Label>
                <div className="mt-2 space-y-2">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">
                        {t.isDefault && <Star className="h-3 w-3 inline mr-1 text-yellow-500" />}
                        {t.name}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingTemplate(t); setTemplateName(t.name); setIsDefaultTemplate(t.isDefault); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete "{t.name}"? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTemplate(t.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTemplateDialog(false); setEditingTemplate(null); }}>Cancel</Button>
            <Button onClick={saveAsTemplate} disabled={savingTemplate || !templateName.trim()}>
              {savingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entity Confirmation Dialog */}
      {pendingEntityMatch && (
        <EntityConfirmDialog
          open={entityConfirmOpen}
          onOpenChange={setEntityConfirmOpen}
          entityMatch={pendingEntityMatch}
          contextEntityName={selectedEntity?.name}
          documentDescription={pendingEntityDocDesc}
          onConfirm={async (newEntityId) => {
            if (pendingEntityInvoiceId) {
              try {
                await fetch(`/api/invoices/${pendingEntityInvoiceId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ entityId: newEntityId }),
                });
                toast({ title: 'Entity Updated', description: 'Invoice reassigned successfully.' });
                fetchInvoices();
              } catch {
                toast({ title: 'Error', description: 'Failed to update entity', variant: 'destructive' });
              }
            }
            setPendingEntityMatch(null);
            setPendingEntityInvoiceId(null);
          }}
          onSkip={() => {
            setPendingEntityMatch(null);
            setPendingEntityInvoiceId(null);
          }}
        />
      )}
    </div>
  );
}
