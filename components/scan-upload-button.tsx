'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Upload, Loader2, Smartphone, QrCode } from 'lucide-react';
import { EntityConfirmDialog, type EntityMatchInfo } from '@/components/entity-confirm-dialog';

export type UploadType = 'document' | 'invoice' | 'bill' | 'statement';

interface ScanUploadButtonProps {
  uploadType: UploadType;
  entityId?: string;
  onUploadComplete?: () => void;
  onFileSelected?: (file: File) => void;
  variant?: 'default' | 'outline' | 'ghost';
  label?: string;
  showUploadButton?: boolean;
  accept?: string;
  disabled?: boolean;
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
}

export function ScanUploadButton({
  uploadType,
  entityId,
  onUploadComplete,
  onFileSelected,
  variant = 'outline',
  label,
  showUploadButton = true,
  accept = 'image/*,.pdf,application/pdf',
  disabled = false,
}: ScanUploadButtonProps) {
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [entityConfirmOpen, setEntityConfirmOpen] = useState(false);
  const [pendingEntityMatch, setPendingEntityMatch] = useState<EntityMatchInfo | null>(null);
  const [pendingDocDescription, setPendingDocDescription] = useState('');
  const [pendingRecordId, setPendingRecordId] = useState<string | null>(null);
  const [pendingRecordType, setPendingRecordType] = useState<'document' | 'invoice' | 'bill' | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleScanClick = async () => {
    if (isMobileDevice()) {
      cameraInputRef.current?.click();
      return;
    }

    // Desktop: show QR code dialog
    setQrDialogOpen(true);
    setQrLoading(true);
    try {
      const res = await fetch('/api/documents/mobile-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadType, entityId }),
      });
      if (res.ok) {
        const data = await res.json();
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/upload/${data.token}`;
        setQrUrl(url);

        // Poll for completion
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/documents/mobile-upload?token=${data.token}&checkComplete=true`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.completed) {
                toast({ title: 'Upload Complete!', description: 'Document uploaded from your phone.' });
                setQrDialogOpen(false);
                if (pollRef.current) clearInterval(pollRef.current);
                onUploadComplete?.();
              }
            }
          } catch { /* ignore */ }
        }, 4000);
      } else {
        toast({ title: 'Error', description: 'Failed to generate QR code', variant: 'destructive' });
        setQrDialogOpen(false);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate QR code', variant: 'destructive' });
      setQrDialogOpen(false);
    }
    setQrLoading(false);
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If parent wants to handle the file itself
    if (onFileSelected) {
      onFileSelected(file);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Default: upload to S3 + process
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
    const validTypes = [...imageTypes, 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload an image (JPG, PNG, WebP) or PDF file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const isPDF = file.type === 'application/pdf';
    setUploadProgress(isPDF ? 'Uploading PDF...' : 'Uploading image...');

    try {
      // 1. Get presigned URL
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: false }),
      });
      const presignData = await presignRes.json();
      const uploadUrl = presignData.uploadUrl;
      const cloudStoragePath = presignData.cloudStoragePath || presignData.cloud_storage_path;
      if (!uploadUrl || !cloudStoragePath) throw new Error('Failed to get upload URL');

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadRes.ok) throw new Error('Failed to upload file to storage');

      setUploadProgress('Analyzing with AI...');

      // 3. Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 4. Route to correct scan API based on type
      let scanEndpoint = '/api/documents/scan';
      let scanBody: any = {
        cloudStoragePath,
        fileName: file.name,
        fileBase64: base64,
        mimeType: file.type,
        isPDF,
        entityId: entityId || undefined,
      };

      if (uploadType === 'invoice') {
        // For invoices: create invoice record first, then process
        const invoiceRes = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, cloudStoragePath, isPublic: false, status: 'pending', entityId: entityId || null }),
        });
        const invoice = await invoiceRes.json();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('invoiceId', invoice.id);
        const processRes = await fetch('/api/invoices/process', { method: 'POST', body: formData });
        if (processRes.ok) {
          const processData = await processRes.json();
          toast({ title: 'Invoice Scanned!', description: 'Data extracted and categorized automatically.' });
          // Check entity match
          if (processData.entityMatch && (processData.entityMatch.needsConfirmation || processData.entityMatch.mismatch)) {
            setPendingEntityMatch(processData.entityMatch);
            setPendingDocDescription(processData.extractedData?.providerName || file.name);
            setPendingRecordId(invoice.id);
            setPendingRecordType('invoice');
            setEntityConfirmOpen(true);
          }
        } else {
          toast({ title: 'Invoice Uploaded', description: 'Uploaded but AI extraction failed. You can retry.', variant: 'default' });
        }
        onUploadComplete?.();
        return;
      }

      if (uploadType === 'statement') {
        // For statements: process with AI, then save to DB
        const formData = new FormData();
        formData.append('file', file);
        if (cloudStoragePath) formData.append('cloudStoragePath', cloudStoragePath);
        if (entityId) formData.append('entityId', entityId);

        const processRes = await fetch('/api/invoices/process-statement', { method: 'POST', body: formData });
        const result = await processRes.json();
        const categorisedCount = result.transactions?.filter((tx: any) => tx.suggestedCategoryId).length || 0;

        const createRes = await fetch('/api/statements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            cloudStoragePath,
            entityId: entityId || null,
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
              categoryId: tx.suggestedCategoryId || null,
            })),
          }),
        });

        if (createRes.ok) {
          const createResult = await createRes.json();
          const txCount = createResult.transactionsCreated || result.transactions?.length || 0;
          let msg = `${txCount} transactions extracted`;
          if (categorisedCount > 0) msg += ` • ${categorisedCount} auto-categorised`;
          toast({ title: 'Statement Scanned!', description: msg });
        } else {
          toast({ title: 'Statement Processed', description: 'Could not save — please try uploading the file directly.', variant: 'default' });
        }
        onUploadComplete?.();
        return;
      }

      if (uploadType === 'bill') {
        scanEndpoint = '/api/bills/scan';
        scanBody = {
          cloudStoragePath,
          fileName: file.name,
          fileBase64: base64,
          mimeType: file.type,
          isPDF,
          entityId: entityId || undefined,
        };
      }

      // Call scan API (document or bill)
      const scanRes = await fetch(scanEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanBody),
      });
      const scanData = await scanRes.json();

      if (scanData.success || scanRes.ok) {
        const typeLabel = uploadType === 'bill' ? 'Bill' : 'Document';
        toast({
          title: `${typeLabel} Scanned!`,
          description: scanData.document?.summary || scanData.summary || 'Processed and categorized automatically.',
        });
        // Check entity match
        if (scanData.entityMatch && (scanData.entityMatch.needsConfirmation || scanData.entityMatch.mismatch)) {
          setPendingEntityMatch(scanData.entityMatch);
          setPendingDocDescription(scanData.document?.senderName || scanData.billName || file.name);
          setPendingRecordId(scanData.document?.id || null);
          setPendingRecordType(uploadType === 'bill' ? 'bill' : 'document');
          setEntityConfirmOpen(true);
        }
      } else {
        throw new Error(scanData.error || 'Failed to scan');
      }

      onUploadComplete?.();
    } catch (err) {
      console.error(`Error processing ${uploadType}:`, err);
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to process', variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploadType, entityId, onFileSelected, onUploadComplete, toast]);

  // Handle entity reassignment after user confirms
  const handleEntityConfirm = async (newEntityId: string) => {
    if (!pendingRecordId || !pendingRecordType) return;
    try {
      let url = '';
      if (pendingRecordType === 'document') {
        url = `/api/documents/${pendingRecordId}`;
      } else if (pendingRecordType === 'invoice') {
        url = `/api/invoices/${pendingRecordId}`;
      }
      // For bills created via scan, the entityId was already set in the response
      // but we might need to update it if the user changes their selection
      if (url) {
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityId: newEntityId }),
        });
      }
      toast({ title: 'Entity Updated', description: 'Document reassigned successfully.' });
      onUploadComplete?.();
    } catch {
      toast({ title: 'Error', description: 'Failed to update entity assignment', variant: 'destructive' });
    }
  };

  const defaultLabel = label || 'Scan Document';

  return (
    <>
      {/* Hidden inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />

      {uploading ? (
        <Button disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {uploadProgress}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          {/* Camera/Scan button */}
          <Button onClick={handleScanClick} variant={variant} className="gap-2" disabled={disabled}>
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">{defaultLabel}</span>
            <span className="sm:hidden">Scan</span>
          </Button>

          {/* File upload button */}
          {showUploadButton && (
            <Button onClick={() => fileInputRef.current?.click()} variant="default" className="gap-2" disabled={disabled}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          )}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={(open) => { setQrDialogOpen(open); if (!open && pollRef.current) clearInterval(pollRef.current); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Scan with your phone
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your phone camera to take a photo and upload it directly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrLoading ? (
              <div className="h-48 w-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : qrUrl ? (
              <>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg border"
                />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Link expires in 10 minutes
                </p>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entity Confirmation Dialog */}
      {pendingEntityMatch && (
        <EntityConfirmDialog
          open={entityConfirmOpen}
          onOpenChange={setEntityConfirmOpen}
          entityMatch={pendingEntityMatch}
          documentDescription={pendingDocDescription}
          onConfirm={handleEntityConfirm}
          onSkip={() => {
            setPendingEntityMatch(null);
            setPendingRecordId(null);
            setPendingRecordType(null);
          }}
        />
      )}
    </>
  );
}
