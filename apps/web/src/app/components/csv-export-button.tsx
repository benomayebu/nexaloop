'use client';

import { useState } from 'react';
import { NexaButton } from '@/components/ui/nexa-button';

export function CsvExportButton({ entity }: { entity: 'suppliers' | 'products' }) {
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/${entity}/export-csv`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Failed to export. Please try again.');
    }
    setDownloading(false);
  }

  return (
    <NexaButton
      variant="secondary"
      onClick={handleExport}
      disabled={downloading}
      icon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      }
    >
      {downloading ? 'Exporting...' : 'Export CSV'}
    </NexaButton>
  );
}
