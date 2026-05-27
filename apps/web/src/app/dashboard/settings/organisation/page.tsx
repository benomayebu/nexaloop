import { apiFetch } from '../../../../lib/api';
import { OrgSettingsForm } from '../../../components/org-settings-form';

interface OrgData {
  id: string;
  name: string;
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

      <div className="max-w-xl space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Organisation Details</h2>
          <p className="text-sm text-slate-500 mb-5">
            Created{' '}
            {org?.createdAt
              ? new Date(org.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : '—'}
          </p>
          <OrgSettingsForm
            currentName={org?.name ?? ''}
            currentIndustry={org?.industry ?? ''}
          />
        </div>

        {/* Read-only onboarding details */}
        {(org?.supplierCount || org?.primaryConcern) && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Onboarding Details</h2>
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
      </div>
    </div>
  );
}
