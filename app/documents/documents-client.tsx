"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Camera, Upload, FileText, AlertCircle, CheckCircle, Clock, Tag, Plus, Receipt, ListTodo, Trash2, Eye, X, Loader2, ImageIcon, QrCode, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useTranslation } from '@/lib/i18n'
import { EmptyState } from '@/components/empty-state'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ScannedDocument {
  id: string
  cloudStoragePath: string
  fileName: string
  senderName: string | null
  documentType: string
  summary: string | null
  actionRequired: boolean
  suggestedTaskTitle: string | null
  amountDue: number | null
  currency: string
  dueDate: string | null
  issueDate: string | null
  accountNumber: string | null
  referenceNumber: string | null
  status: string
  confidenceScore: number | null
  tags: string[]
  notes: string | null
  linkedBillId: string | null
  linkedActionId: string | null
  createdAt: string
  processedAt: string | null
}

interface Account {
  id: string
  accountName: string
  provider?: { name: string }
}

interface EntityOption {
  id: string
  name: string
  type: string
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  bill: 'Bill / Invoice',
  reminder: 'Reminder',
  fine: 'Fine / Penalty',
  information: 'Information',
  contract: 'Contract',
  tax_return: 'Tax Document',
  check: 'Cheque',
  other: 'Other',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Processing', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', icon: Clock },
  processed: { label: 'Filed', color: 'bg-muted text-muted-foreground/60', icon: CheckCircle },
  filed: { label: 'Filed', color: 'bg-muted text-muted-foreground/60', icon: CheckCircle },
  action_required: { label: 'Action Required', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: AlertCircle },
}

export function DocumentsClient() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [documents, setDocuments] = useState<ScannedDocument[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<ScannedDocument | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [createBillDialogOpen, setCreateBillDialogOpen] = useState(false)
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const qrPollRef = useRef<NodeJS.Timeout | null>(null)
  const [entities, setEntities] = useState<EntityOption[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<string>('')
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [viewImageUrl, setViewImageUrl] = useState<string>('')
  const [viewImageLoading, setViewImageLoading] = useState(false)
  const { toast } = useToast()

  // Bill creation form
  const [billForm, setBillForm] = useState({
    accountId: '',
    billName: '',
    frequency: 'monthly',
    dueDay: '1',
  })

  // Task creation form
  const [taskForm, setTaskForm] = useState({
    title: '',
    priority: 'medium',
    dueDate: '',
  })

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({ title: 'Error', description: 'Failed to load documents', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts')
      const data = await res.json()
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }, [])

  const fetchEntities = useCallback(async () => {
    try {
      const res = await fetch('/api/entities')
      if (res.ok) {
        const data = await res.json()
        setEntities(data.map((e: any) => ({ id: e.id, name: e.name, type: e.type })))
        if (data.length > 0 && !selectedEntityId) {
          setSelectedEntityId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching entities:', error)
    }
  }, [selectedEntityId])

  useEffect(() => {
    fetchDocuments()
    fetchAccounts()
    fetchEntities()
  }, [fetchDocuments, fetchAccounts, fetchEntities])

  // Auto-trigger scan/upload when arriving via ?action=scan
  useEffect(() => {
    if (loading) return
    const action = searchParams.get('action')
    if (action === 'scan') {
      // Small delay so refs are ready
      const isMobile = typeof window !== 'undefined' &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 0 && window.innerWidth < 1024))
      setTimeout(() => {
        if (isMobile) {
          cameraInputRef.current?.click()
        } else {
          fileInputRef.current?.click()
        }
      }, 300)
    }
  }, [loading, searchParams])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - accept images and PDFs
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
    const pdfType = 'application/pdf'
    const validTypes = [...imageTypes, pdfType]
    
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload an image (JPG, PNG, WebP) or PDF file', variant: 'destructive' })
      return
    }

    const isPDF = file.type === pdfType
    setUploading(true)
    setUploadProgress(isPDF ? 'Uploading PDF...' : 'Uploading image...')

    try {
      // 1. Get presigned URL
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: false,
        }),
      })
      const presignData = await presignRes.json()
      const uploadUrl = presignData.uploadUrl
      const cloudStoragePath = presignData.cloudStoragePath || presignData.cloud_storage_path

      if (!uploadUrl || !cloudStoragePath) {
        throw new Error('Failed to get upload URL')
      }

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage')
      }

      setUploadProgress('Analyzing document with AI...')

      // 3. Convert to base64 for vision model
      const reader = new FileReader()
      reader.onerror = () => {
        console.error('Error reading file')
        toast({ title: 'Error', description: 'Failed to read file', variant: 'destructive' })
        setUploading(false)
        setUploadProgress('')
      }
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1]

          if (!base64) {
            throw new Error('Failed to convert file to base64')
          }

          // 4. Call scan API with file (image or PDF)
          const scanRes = await fetch('/api/documents/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cloudStoragePath: cloudStoragePath,
              fileName: file.name,
              fileBase64: base64,
              mimeType: file.type,
              isPDF: isPDF,
              entityId: selectedEntityId || undefined,
            }),
          })

          const scanData = await scanRes.json()

          if (scanData.success) {
            toast({
              title: 'Document Scanned!',
              description: scanData.document.summary || 'Document processed successfully',
            })
            fetchDocuments()
          } else {
            throw new Error(scanData.error || 'Failed to scan document')
          }
        } catch (err) {
          console.error('Error processing document:', err)
          toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to process document', variant: 'destructive' })
        } finally {
          setUploading(false)
          setUploadProgress('')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          if (cameraInputRef.current) {
            cameraInputRef.current.value = ''
          }
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading document:', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to upload document', variant: 'destructive' })
      setUploading(false)
      setUploadProgress('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = ''
      }
    }
  }

  const fetchImageUrl = useCallback(async (cloudStoragePath: string): Promise<string> => {
    try {
      const res = await fetch('/api/upload/get-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudStoragePath, isPublic: false }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.url || ''
      }
    } catch (err) {
      console.error('Error fetching image URL:', err)
    }
    return ''
  }, [])

  const handleViewDocument = async (doc: ScannedDocument) => {
    setSelectedDoc(doc)
    setViewDialogOpen(true)
    setViewImageUrl('')
    if (doc.cloudStoragePath) {
      setViewImageLoading(true)
      const url = await fetchImageUrl(doc.cloudStoragePath)
      setViewImageUrl(url)
      setViewImageLoading(false)
    }
  }

  const handleCreateBill = (doc: ScannedDocument) => {
    setSelectedDoc(doc)
    setBillForm({
      accountId: accounts[0]?.id || '',
      billName: doc.senderName || '',
      frequency: 'monthly',
      dueDay: doc.dueDate ? new Date(doc.dueDate).getDate().toString() : '1',
    })
    setCreateBillDialogOpen(true)
  }

  const handleCreateTask = (doc: ScannedDocument) => {
    setSelectedDoc(doc)
    setTaskForm({
      title: doc.suggestedTaskTitle || `Pay ${doc.senderName}`,
      priority: 'medium',
      dueDate: doc.dueDate || '',
    })
    setCreateTaskDialogOpen(true)
  }

  const submitCreateBill = async () => {
    if (!selectedDoc) return

    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/create-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billForm),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Bill Created', description: `Created bill: ${data.bill.billName}` })
        setCreateBillDialogOpen(false)
        fetchDocuments()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error creating bill:', error)
      toast({ title: 'Error', description: 'Failed to create bill', variant: 'destructive' })
    }
  }

  const submitCreateTask = async () => {
    if (!selectedDoc) return

    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/create-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Task Created', description: `Created task: ${data.action.title}` })
        setCreateTaskDialogOpen(false)
        fetchDocuments()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' })
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      toast({ title: 'Deleted', description: 'Document deleted successfully' })
      fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' })
    }
  }

  // Detect if user is on mobile/tablet with camera
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
  }

  const handleTakePhoto = async () => {
    if (isMobileDevice()) {
      // On mobile, open the camera directly
      cameraInputRef.current?.click()
      return
    }

    // On desktop, generate QR code for mobile upload
    setQrDialogOpen(true)
    setQrLoading(true)
    try {
      const res = await fetch('/api/documents/mobile-upload', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setQrToken(data.token)
        const baseUrl = window.location.origin
        const url = `${baseUrl}/upload/${data.token}`
        setQrUrl(url)

        // Start polling for new documents (every 5 seconds)
        const initialCount = documents.length
        if (qrPollRef.current) clearInterval(qrPollRef.current)
        qrPollRef.current = setInterval(async () => {
          try {
            const docsRes = await fetch('/api/documents')
            const docsData = await docsRes.json()
            const newDocs = docsData.documents || []
            if (newDocs.length > initialCount) {
              // New document detected
              setDocuments(newDocs)
              toast({ title: 'New Document!', description: 'A document was uploaded from your phone.' })
              setQrDialogOpen(false)
              if (qrPollRef.current) clearInterval(qrPollRef.current)
            }
          } catch { /* ignore */ }
        }, 5000)
      } else {
        toast({ title: 'Error', description: 'Failed to generate QR code', variant: 'destructive' })
        setQrDialogOpen(false)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate QR code', variant: 'destructive' })
      setQrDialogOpen(false)
    }
    setQrLoading(false)
  }

  const filteredDocuments = documents.filter(doc => {
    if (activeTab === 'all') return true
    if (activeTab === 'action') return doc.status === 'action_required'
    if (activeTab === 'filed') return doc.status === 'filed' || doc.status === 'processed'
    return true
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('documents.title')}</h2>
          <p className="text-muted-foreground">{t('documents.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Entity Selector */}
          {entities.length > 0 && (
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress}
            </Button>
          ) : (
            <>
              {/* Camera button - QR on desktop, camera on mobile */}
              <Button
                onClick={handleTakePhoto}
                variant="outline"
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Take Photo</span>
                <span className="sm:hidden">Photo</span>
              </Button>
              
              {/* Upload button - for files and PDFs */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload File</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      {documents.length === 0 && !uploading && (
        <Card className="border-bordershed border-2">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">
              Take a photo or upload any letter, bill, or document to digitize it automatically.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Supports: JPG, PNG, WebP, PDF
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={handleTakePhoto}>
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {documents.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
            <TabsTrigger value="action" className="text-red-600">
              Action Required ({documents.filter(d => d.status === 'action_required').length})
            </TabsTrigger>
            <TabsTrigger value="filed">
              Filed ({documents.filter(d => d.status === 'filed' || d.status === 'processed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => {
                const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending
                const StatusIcon = statusConfig.icon

                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {doc.senderName || 'Unknown Sender'}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                          </CardDescription>
                        </div>
                        <Badge className={`${statusConfig.color} flex-shrink-0 ml-2`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Summary */}
                      {doc.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {doc.summary}
                        </p>
                      )}

                      {/* Financial Info */}
                      {doc.amountDue && doc.amountDue > 0 && (
                        <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                          <span className="text-sm text-muted-foreground">Amount Due</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(doc.amountDue)}
                          </span>
                        </div>
                      )}

                      {/* Due Date */}
                      {doc.dueDate && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Due Date</span>
                          <span className="font-medium">
                            {formatDate(doc.dueDate)}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Linked Indicator */}
                      {(doc.linkedBillId || doc.linkedActionId) && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {doc.linkedBillId && 'Linked to Bill'}
                          {doc.linkedActionId && 'Linked to Task'}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {doc.status === 'action_required' && !doc.linkedBillId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateBill(doc)}
                            className="flex-1"
                          >
                            <Receipt className="h-3 w-3 mr-1" />
                            Bill
                          </Button>
                        )}
                        {doc.status === 'action_required' && !doc.linkedActionId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateTask(doc)}
                            className="flex-1"
                          >
                            <ListTodo className="h-3 w-3 mr-1" />
                            Task
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* QR Code Dialog for Desktop Camera */}
      <Dialog open={qrDialogOpen} onOpenChange={(open) => { setQrDialogOpen(open); if (!open && qrPollRef.current) clearInterval(qrPollRef.current); }}>
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

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.senderName || 'Document Details'}</DialogTitle>
            <DialogDescription>
              {selectedDoc?.summary}
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              {/* Document Image Preview */}
              {viewImageLoading ? (
                <div className="flex items-center justify-center h-48 bg-muted/30 rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : viewImageUrl ? (
                <div className="relative rounded-lg overflow-hidden border bg-muted/20">
                  <img
                    src={viewImageUrl}
                    alt={selectedDoc.fileName || 'Document'}
                    className="w-full max-h-[300px] object-contain"
                  />
                </div>
              ) : null}

              {/* Type & Status */}
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {DOCUMENT_TYPE_LABELS[selectedDoc.documentType]}
                </Badge>
                <Badge className={STATUS_CONFIG[selectedDoc.status]?.color}>
                  {STATUS_CONFIG[selectedDoc.status]?.label}
                </Badge>
              </div>

              {/* Financial Details */}
              {selectedDoc.amountDue && selectedDoc.amountDue > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-1">Amount Due</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {formatCurrency(selectedDoc.amountDue)}
                  </div>
                  {selectedDoc.dueDate && (
                    <div className="text-sm text-red-600 mt-1">
                      Due: {formatDate(selectedDoc.dueDate)}
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Details */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Extracted Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedDoc.accountNumber && (
                    <>
                      <span className="text-muted-foreground">Account No:</span>
                      <span className="font-mono">{selectedDoc.accountNumber}</span>
                    </>
                  )}
                  {selectedDoc.referenceNumber && (
                    <>
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="font-mono">{selectedDoc.referenceNumber}</span>
                    </>
                  )}
                  {selectedDoc.issueDate && (
                    <>
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{formatDate(selectedDoc.issueDate)}</span>
                    </>
                  )}
                  {selectedDoc.confidenceScore && (
                    <>
                      <span className="text-muted-foreground">AI Confidence:</span>
                      <span>{Math.round(selectedDoc.confidenceScore * 100)}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedDoc.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Suggested Action */}
              {selectedDoc.actionRequired && selectedDoc.suggestedTaskTitle && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <div className="text-sm text-yellow-800 dark:text-yellow-300 mb-1">Suggested Action</div>
                  <div className="font-medium text-yellow-900 dark:text-yellow-200">
                    {selectedDoc.suggestedTaskTitle}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bill Dialog */}
      <Dialog open={createBillDialogOpen} onOpenChange={setCreateBillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Bill from Document</DialogTitle>
            <DialogDescription>
              Create a recurring bill from this scanned document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Account *</Label>
              <Select
                value={billForm.accountId}
                onValueChange={(v) => setBillForm(f => ({ ...f, accountId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.accountName} - {acc.provider?.name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bill Name</Label>
              <Input
                value={billForm.billName}
                onChange={(e) => setBillForm(f => ({ ...f, billName: e.target.value }))}
                placeholder="e.g., Council Tax"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={billForm.frequency}
                  onValueChange={(v) => setBillForm(f => ({ ...f, frequency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={billForm.dueDay}
                  onChange={(e) => setBillForm(f => ({ ...f, dueDay: e.target.value }))}
                />
              </div>
            </div>
            {selectedDoc && selectedDoc.amountDue && selectedDoc.amountDue > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
                <span className="text-sm text-muted-foreground">Amount: </span>
                <span className="font-semibold">{formatCurrency(selectedDoc.amountDue)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateBillDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreateBill}>
              <Receipt className="h-4 w-4 mr-2" />
              Create Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task from Document</DialogTitle>
            <DialogDescription>
              Create a task/action item from this scanned document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Pay Council Tax"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) => setTaskForm(f => ({ ...f, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            {selectedDoc && selectedDoc.amountDue && selectedDoc.amountDue > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded">
                <span className="text-sm text-muted-foreground">Amount: </span>
                <span className="font-semibold">{formatCurrency(selectedDoc.amountDue)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreateTask}>
              <ListTodo className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
