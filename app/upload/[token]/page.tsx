'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Camera, Upload, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function MobileUploadPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'validating' | 'ready' | 'uploading' | 'success' | 'error' | 'expired'>('validating');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/documents/mobile-upload?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setUserId(data.userId);
          setStatus('ready');
        } else if (res.status === 410) {
          setStatus('expired');
        } else {
          setStatus('error');
          setError('Invalid or expired link');
        }
      } catch {
        setStatus('error');
        setError('Could not validate link');
      }
    }
    validate();
  }, [token]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setUploadProgress('Uploading...');

    try {
      // 1. Get presigned URL (using the token for auth)
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: false,
          mobileToken: token,
        }),
      });

      if (!presignRes.ok) {
        throw new Error('Failed to get upload URL. Try uploading directly in the app.');
      }

      const presignData = await presignRes.json();
      const uploadUrl = presignData.uploadUrl;
      const cloudStoragePath = presignData.cloudStoragePath || presignData.cloud_storage_path;

      if (!uploadUrl || !cloudStoragePath) throw new Error('Failed to get upload URL');

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      setUploadProgress('Processing with AI...');

      // 3. Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 4. Scan document
      const scanRes = await fetch('/api/documents/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mobile-Token': token,
        },
        body: JSON.stringify({
          cloudStoragePath,
          fileName: file.name,
          fileBase64: base64,
          mimeType: file.type,
          isPDF: file.type === 'application/pdf',
          mobileToken: token,
        }),
      });

      if (scanRes.ok) {
        setStatus('success');
      } else {
        // Upload succeeded even if scan fails
        setStatus('success');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Upload failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 mb-3">
            <span className="text-2xl font-bold text-slate-900">£</span>
          </div>
          <h1 className="text-xl font-bold">HomeLedger</h1>
          <p className="text-sm text-slate-400">Mobile Document Upload</p>
        </div>

        {status === 'validating' && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-amber-400" />
            <p className="text-slate-400">Validating link...</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl p-6 text-center border border-slate-800">
              <Camera className="h-12 w-12 mx-auto mb-4 text-amber-400" />
              <h2 className="text-lg font-semibold mb-2">Take a Photo</h2>
              <p className="text-sm text-slate-400 mb-6">
                Snap a photo of your document, receipt, or letter. It will be uploaded and processed automatically.
              </p>

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
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-4 rounded-xl bg-amber-400 text-slate-900 font-bold text-base hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose from Gallery
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              This link expires in 10 minutes. Your photo will appear in HomeLedger automatically.
            </p>
          </div>
        )}

        {status === 'uploading' && (
          <div className="text-center py-12">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-400" />
            <p className="text-lg font-medium">{uploadProgress}</p>
            <p className="text-sm text-slate-400 mt-2">Please keep this page open</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-emerald-400" />
            <h2 className="text-xl font-bold mb-2">Upload Complete!</h2>
            <p className="text-slate-400 mb-6">
              Your document has been uploaded and is being processed. You can close this page now.
            </p>
            <button
              onClick={() => setStatus('ready')}
              className="px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
            >
              Upload Another
            </button>
          </div>
        )}

        {status === 'expired' && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <h2 className="text-lg font-bold mb-2">Link Expired</h2>
            <p className="text-slate-400">
              This upload link has expired. Please generate a new QR code from HomeLedger on your desktop.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-lg font-bold mb-2">Error</h2>
            <p className="text-slate-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
