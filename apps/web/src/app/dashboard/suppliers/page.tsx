import Link from 'next/link';
import { Suspense } from 'react';
import { apiFetchList } from '../../../lib/api';
import { SupplierFilters } from '../../components/supplier-filters';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { SupAvatar } from '@/components/ui/sup-avatar';
import { NexaButton } from '@/components/ui/nexa-button';
import { CsvImportButton } from '../../components/csv-import-button';
import { CsvExportButton } from '../../components/csv-export-button';
import { ScoreBar } from '@/components/ui/score-bar';
import { supStatusBadge, riskBadge, typeBadge } from '@/lib/badges';
import { fmtDate } from '@/lib/format';

interface Supplier {
  id: string;
  name: string;
  supplierCode: string | null;
  type: string;
  country: string;
  city: string | null;
  status: string;
  riskLevel: string;
  updatedAt: string;
  complianceScore: number | null;
  _count: { documents: number };
  _pending: number;
  _expiring: number;
  _expired: number;
}

async function getSuppliers(searchParams: Record<string, string>): Promise<Supplier[]> {
  const params = new URLSearchParams();
  if (searchParams.type) params.set('type', searchParams.type);
  if (searchParams.status) params.set('status', searchParams.status);
  if (searchParams.riskLevel) params.set('riskLevel', searchParams.riskLevel);
  if (searchParams.q) params.set('q', searchParams.q);
  const qs = params.toString();
  return apiFetchList<Supplier>(`/suppliers${qs ? `?${qs}` : ''}`);
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolvedParams = await searchParams;
  const suppliers = await getSuppliers(resolvedParams);

  const active = suppliers.filter((s) => s.status === 'ACTIVE').length;
  const totalPending = suppliers.reduce((sum, s) => sum + s._pending, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {suppliers.length} total &middot; {active} active
            {totalPending > 0 && (
              <> &middot; <span className="text-amber-600 font-medium">{totalPending} documents awaiting review</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CsvExportButton entity="suppliers" />
          <CsvImportButton entity="suppliers" />
          <Link href="/dashboard/suppliers/new">
            <NexaButton
              variant="primary"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              New supplier
            </NexaButton>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <Suspense>
          <SupplierFilters />
        </Suspense>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {suppliers.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m4.5-18v18m4.5-18v18m4.5-18v18m4.5-18v18" />
            </svg>
            <p className="mt-4 text-sm text-slate-500">No suppliers found. Add your first supplier to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ minWidth: 160 }}>Compliance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Documents</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-3" style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((supplier) => {
                  const status = supStatusBadge(supplier.status);
                  const risk = riskBadge(supplier.riskLevel);
                  const type = typeBadge(supplier.type);
                  return (
                    <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <SupAvatar name={supplier.name} type={supplier.type} size="sm" />
                          <div className="min-w-0">
                            <Link href={`/dashboard/suppliers/${supplier.id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                              {supplier.name}
                            </Link>
                            {supplier.supplierCode && (
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{supplier.supplierCode}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <NexaBadge tone={type.tone}>{type.label}</NexaBadge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {supplier.city ? `${supplier.city}, ` : ''}{supplier.country}
                      </td>
                      <td className="px-4 py-3">
                        <NexaBadge tone={status.tone} dot>{status.label}</NexaBadge>
                      </td>
                      <td className="px-4 py-3">
                        <NexaBadge tone={risk.tone}>{risk.label}</NexaBadge>
                      </td>
                      <td className="px-4 py-3">
                        {supplier.complianceScore !== null ? (
                          <ScoreBar value={supplier.complianceScore} />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-slate-700 tabular-nums">{supplier._count.documents}</span>
                          {supplier._pending > 0 && (
                            <NexaBadge tone="indigo">{supplier._pending} pending</NexaBadge>
                          )}
                          {supplier._expiring > 0 && (
                            <NexaBadge tone="amber">{supplier._expiring} expiring</NexaBadge>
                          )}
                          {supplier._expired > 0 && (
                            <NexaBadge tone="red">{supplier._expired} expired</NexaBadge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {fmtDate(supplier.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/suppliers/${supplier.id}`}>
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
