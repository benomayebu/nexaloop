'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast-provider';

export function ProductImageUpload({
  productId,
  currentImageUrl,
}: {
  productId: string;
  currentImageUrl: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be under 5 MB');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch(`/api/products/${productId}/image`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      toast('Image uploaded');
      router.refresh();
    } catch {
      toast('Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const displayUrl = preview ?? currentImageUrl;

  return (
    <div
      className="relative group border-2 border-dashed border-slate-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {displayUrl ? (
        <div className="relative aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl.startsWith('/') ? `/api${displayUrl}` : displayUrl}
            alt="Product"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {uploading ? 'Uploading…' : 'Change image'}
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2 py-6">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <p className="text-xs text-slate-400">
            {uploading ? 'Uploading…' : 'Drop image or click to upload'}
          </p>
          <p className="text-[10px] text-slate-300">Max 5 MB</p>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
