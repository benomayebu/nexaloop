'use client';

import { useState } from 'react';
import { NexaButton } from '@/components/ui/nexa-button';
import { CsvImportModal } from './csv-import-modal';

export function CsvImportButton({ entity }: { entity: 'suppliers' | 'products' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <NexaButton
        variant="secondary"
        onClick={() => setOpen(true)}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        }
      >
        Import CSV
      </NexaButton>
      {open && <CsvImportModal entity={entity} onClose={() => setOpen(false)} />}
    </>
  );
}
