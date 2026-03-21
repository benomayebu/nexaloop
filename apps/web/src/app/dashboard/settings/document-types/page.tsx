import { cookies } from 'next/headers';
import { DocumentTypeForm } from '../../../components/document-type-form';
import { DeleteDocumentTypeButton } from '../../../components/delete-document-type-button';

interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  requiredForSupplierTypes: string[];
  isActive: boolean;
}

async function getDocumentTypes(): Promise<DocumentType[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return [];

  const apiUrl =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/document-types`, {
      headers: { Cookie: `auth_token=${token.value}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default async function DocumentTypesSettingsPage() {
  const documentTypes = await getDocumentTypes();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Types</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the document types required from suppliers.
          </p>
        </div>
        <DocumentTypeForm />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {documentTypes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No document types yet. Add your first document type to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicable Supplier Types
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documentTypes.map((dt) => (
                <tr key={dt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dt.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {dt.description ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {dt.requiredForSupplierTypes.length > 0
                      ? dt.requiredForSupplierTypes.map(formatLabel).join(', ')
                      : 'All types'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <DocumentTypeForm initialData={dt} />
                      <DeleteDocumentTypeButton id={dt.id} name={dt.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
