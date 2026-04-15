import Link from 'next/link';
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
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/dashboard/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">My Profile</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Update your display name and account password.</p>
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
