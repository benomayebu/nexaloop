import { apiFetch } from '../../../../lib/api';
import { ProfileForm } from '../../../components/profile-form';
import { ChangePasswordForm } from '../../../components/change-password-form';

interface Profile {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

export default async function ProfileSettingsPage() {
  const profile = await apiFetch<Profile>('/settings/profile');

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-500 mt-0.5">How you appear to your team and to suppliers.</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Account info */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Account Details</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-1">Email address</label>
            <p className="text-sm text-slate-900">{profile?.email ?? '—'}</p>
            <p className="text-xs text-slate-400 mt-0.5">Email cannot be changed.</p>
          </div>
          <div className="mb-1">
            <label className="block text-sm font-medium text-slate-500 mb-1">Member since</label>
            <p className="text-sm text-slate-900">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>

        {/* Display name */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Display Name</h2>
          <ProfileForm currentName={profile?.name ?? ''} />
        </div>

        {/* Change password */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Change Password</h2>
          <p className="text-sm text-slate-500 mb-4">Choose a strong password of at least 8 characters.</p>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
