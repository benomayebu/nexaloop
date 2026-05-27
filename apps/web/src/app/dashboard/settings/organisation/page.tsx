import { apiFetch } from '../../../../lib/api';
import { OrgSettingsForm } from '../../../components/org-settings-form';

interface OrgData {
  id: string;
  name: string;
  country: string | null;
  vat: string | null;
  website: string | null;
  address: string | null;
  currency: string | null;
  industry: string | null;
  supplierCount: string | null;
  primaryConcern: string | null;
  createdAt: string;
}

export default async function OrganisationSettingsPage() {
  const org = await apiFetch<OrgData>('/settings/org');

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Workspace</h2>
        <p className="text-sm text-slate-500 mt-0.5">Information about your brand. Used on Digital Product Passports, EPR exports and outgoing emails.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Brand details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Created{' '}
                {org?.createdAt
                  ? new Date(org.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
          <OrgSettingsForm
            currentName={org?.name ?? ''}
            currentIndustry={org?.industry ?? ''}
            currentCountry={org?.country ?? ''}
            currentVat={org?.vat ?? ''}
            currentWebsite={org?.website ?? ''}
            currentAddress={org?.address ?? ''}
            currentCurrency={org?.currency ?? 'EUR'}
          />
        </div>

        {/* Read-only onboarding details */}
        {(org?.supplierCount || org?.primaryConcern) && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Onboarding details</h3>
            <dl className="space-y-3">
              {org.supplierCount && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Supplier count range</dt>
                  <dd className="mt-0.5 text-sm text-slate-900">{org.supplierCount}</dd>
                </div>
              )}
              {org.primaryConcern && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Primary compliance concern</dt>
                  <dd className="mt-0.5 text-sm text-slate-900">{org.primaryConcern}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Danger zone */}
        <div className="bg-white border border-red-100 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Delete workspace</p>
              <p className="text-xs text-slate-500 mt-0.5">Permanently delete this workspace and all its data. This cannot be undone.</p>
            </div>
            <button disabled className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Delete workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
