import { apiFetch } from '../../../../lib/api';
import { InviteMemberForm } from '../../../components/invite-member-form';
import { ChangeMemberRoleButton } from '../../../components/change-member-role-button';
import { RemoveMemberButton } from '../../../components/remove-member-button';
import { CancelInviteButton, ResendInviteButton } from '../../../components/pending-invite-actions';

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
}

interface MeData {
  user: { id: string };
  role: string;
}

const ROLE_STYLES: Record<string, string> = {
  OWNER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ADMIN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  USER:  'bg-slate-50 text-slate-600 border-slate-200',
  VIEWER:'bg-amber-50 text-amber-700 border-amber-200',
};

const ROLES_ORDER = ['OWNER', 'ADMIN', 'USER', 'VIEWER'];

function canManage(actorRole: string) {
  return actorRole === 'OWNER' || actorRole === 'ADMIN';
}

export default async function TeamSettingsPage() {
  const [members, me, pendingInvites] = await Promise.all([
    apiFetch<Member[]>('/settings/team'),
    apiFetch<MeData>('/auth/me'),
    apiFetch<PendingInvite[]>('/settings/team/pending-invites').catch(() => [] as PendingInvite[]),
  ]);

  const memberList = members ?? [];
  const pendingList = pendingInvites ?? [];
  const myUserId = me?.user?.id ?? '';
  const myRole = me?.role ?? 'USER';
  const isManager = canManage(myRole);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Team members</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {memberList.length} member{memberList.length !== 1 ? 's' : ''} in your organisation
          </p>
        </div>
        {isManager && <InviteMemberForm />}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Member</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Joined</th>
              {isManager && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memberList.map((member) => {
              const isMe = member.user.id === myUserId;
              const canEdit = isManager && !isMe && member.role !== 'OWNER';
              return (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold text-xs">
                          {(member.user.name ?? member.user.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {member.user.name ?? <span className="text-slate-400 italic">No name</span>}
                          {isMe && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[member.role] ?? ROLE_STYLES.USER}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(member.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-2">
                          <ChangeMemberRoleButton
                            memberId={member.id}
                            currentRole={member.role}
                            roles={ROLES_ORDER.filter((r) => r !== 'OWNER')}
                          />
                          <RemoveMemberButton memberId={member.id} memberName={member.user.name ?? member.user.email} />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending invitations */}
      {isManager && pendingList.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Pending invitations ({pendingList.length})
          </h3>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-amber-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Invited by</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expires</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingList.map((invite) => {
                  const expired = new Date(invite.expiresAt) < new Date();
                  return (
                    <tr key={invite.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                          </div>
                          <span className="text-sm text-slate-700">{invite.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[invite.role] ?? ROLE_STYLES.USER}`}>
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {invite.invitedBy.name ?? invite.invitedBy.email}
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="text-xs font-medium text-red-600">Expired</span>
                        ) : (
                          <span className="text-sm text-slate-500">
                            {new Date(invite.expiresAt).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ResendInviteButton inviteId={invite.id} />
                          <CancelInviteButton inviteId={invite.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role legend */}
      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Role Permissions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { role: 'OWNER', desc: 'Full access, can transfer ownership' },
            { role: 'ADMIN', desc: 'Manage suppliers, documents, and team' },
            { role: 'USER', desc: 'Upload and manage documents' },
            { role: 'VIEWER', desc: 'Read-only access to all data' },
          ].map(({ role, desc }) => (
            <div key={role}>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mb-1 ${ROLE_STYLES[role]}`}>
                {role}
              </span>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
