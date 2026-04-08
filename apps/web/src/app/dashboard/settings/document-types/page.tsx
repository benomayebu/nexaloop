import Link from 'next/link';
import { apiFetchList } from '../../../../lib/api';
import { DocumentTypeForm } from '../../../components/document-type-form';
import { DeleteDocumentTypeButton } from '../../../components/delete-document-type-button';

interface DocumentType {
  id: string; name: string; description: string | null;
  requiredForSupplierTypes: string[]; isActive: boolean;
}

function formatLabel(v: string) { return v.replace(/_/g, ' '); }

function Badge({ children, variant }: { children: React.ReactNode; variant: 'emerald' | 'slate' | 'indigo' }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>{children}</span>;
}

export default async function DocumentTypesSettingsPage() {
  const documentTypes = await apiFetchList<DocumentType>('/document-types');

  return (
    <div>
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dashboard/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">Document Types</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Types</h1>
          <p className="text-sm text-slate-500 mt-1">Manage the compliance document types required from suppliers.</p>
        </div>
        <DocumentTypeForm />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {documentTypes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No document types yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first document type to start tracking supplier compliance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Applicable Types</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentTypes.map((dt) => (
                  <tr key={dt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{dt.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{dt.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {dt.requiredForSupplierTypes.length > 0
                          ? dt.requiredForSupplierTypes.map((t) => <Badge key={t} variant="indigo">{formatLabel(t)}</Badge>)
                          : <span className="text-xs text-slate-400">All types</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={dt.isActive ? 'emerald' : 'slate'}>{dt.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DocumentTypeForm initialData={dt} />
                        <DeleteDocumentTypeButton id={dt.id} name={dt.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
