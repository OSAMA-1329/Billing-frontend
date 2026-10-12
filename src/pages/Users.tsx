import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import type { Paginated, Role } from '../types';

interface AdminUser {
	_id: string;
	name: string;
	email: string;
	role: Role;
	isActive: boolean;
	createdAt?: string;
}

export function UsersPage() {
	const queryClient = useQueryClient();
	const { user } = useAuth();
	const [createOpen, setCreateOpen] = useState(false);
	const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STAFF' as Role });
	const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const users = useQuery({
		queryKey: ['users'],
		queryFn: () => apiGet<Paginated<AdminUser>>('/users', { page: 1, limit: 100 }),
	});

	const createUser = useMutation({
		mutationFn: () => apiPost('/auth/register', newUser),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['users'] });
			setCreateOpen(false);
			setNewUser({ name: '', email: '', password: '', role: 'STAFF' });
			toast.success('Team account created');
		},
		onError: () => toast.error('Account could not be created. Check whether the email is already in use.'),
	});

	const updateUser = useMutation({
		mutationFn: ({ id, changes }: { id: string; changes: Partial<AdminUser> & { password?: string } }) =>
			apiPut<AdminUser>(`/users/${id}`, changes),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['users'] });
			setPasswordTarget(null);
			setNewPassword('');
			toast.success('User updated');
		},
		onError: () => toast.error('User could not be updated.'),
	});

	const deleteUser = useMutation({
		mutationFn: (id: string) => apiDelete(`/users/${id}`),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['users'] });
			setDeleteTarget(null);
			toast.success('User deleted');
		},
		onError: () => toast.error('User could not be deleted.'),
	});

	function isCurrentUser(account: AdminUser) {
		return user?.id === account._id;
	}

	return (
		<div className="page-stack">
			<header className="page-heading">
				<div><p className="eyebrow">Access control</p><h1>Users</h1><p>Manage team roles, account access, and password resets.</p></div>
				<div className="heading-actions"><span className="count-pill">{users.data?.total ?? 0} accounts</span><button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>Add team member</button></div>
			</header>

			<section className="data-panel">
				<div className="panel-heading"><div><h2>Team accounts</h2><p>Changes to roles and access take effect on the next request.</p></div><button type="button" className="btn-secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>Refresh</button></div>
				{users.isPending ? <p className="empty-state">Loading users...</p> : users.isError ? <div className="empty-state"><p>Users could not be loaded.</p><button type="button" className="btn-secondary mt-3" onClick={() => users.refetch()}>Retry</button></div> : users.data.items.length ? (
					<div className="table-scroll"><table className="table-dense w-full min-w-[850px]">
						<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Access</th><th className="text-right">Account actions</th></tr></thead>
						<tbody>{users.data.items.map((account) => {
							const self = isCurrentUser(account);
							return <tr key={account._id}>
								<td><strong>{account.name}</strong>{self && <span className="ml-2 status-pill">You</span>}</td>
								<td>{account.email}</td>
								<td><select aria-label={`Role for ${account.name}`} className="input compact-input" value={account.role} disabled={self || updateUser.isPending} onChange={(event) => updateUser.mutate({ id: account._id, changes: { role: event.target.value as Role } })}><option value="ADMIN">Admin</option><option value="MANAGER">Manager</option><option value="STAFF">Staff</option></select></td>
								<td><label className="switch-label"><input type="checkbox" checked={account.isActive} disabled={self || updateUser.isPending} onChange={(event) => updateUser.mutate({ id: account._id, changes: { isActive: event.target.checked } })} /><span>{account.isActive ? 'Active' : 'Disabled'}</span></label></td>
								<td><div className="flex justify-end gap-2"><button type="button" className="table-action" onClick={() => { setNewPassword(''); setPasswordTarget(account); }}>Set password</button><button type="button" className="table-action table-action-danger" disabled={self} onClick={() => setDeleteTarget(account)}>Delete</button></div></td>
							</tr>;
						})}</tbody>
					</table></div>
				) : <div className="empty-state">No user accounts found.</div>}
			</section>

			<Modal open={createOpen} title="Create team account" onClose={() => setCreateOpen(false)}>
				<form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (newUser.password.length < 8) { toast.error('Use at least 8 characters for the password.'); return; } createUser.mutate(); }}>
					<div className="sm:col-span-2"><label className="label" htmlFor="new-user-name">Full name</label><input id="new-user-name" autoFocus required minLength={2} maxLength={100} className="input" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} /></div>
					<div className="sm:col-span-2"><label className="label" htmlFor="new-user-email">Email address</label><input id="new-user-email" type="email" autoComplete="off" required className="input" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} /></div>
					<div className="sm:col-span-2"><label className="label" htmlFor="new-user-password">Temporary password</label><input id="new-user-password" type="password" autoComplete="new-password" required minLength={8} className="input" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} /></div>
					<div className="sm:col-span-2"><label className="label" htmlFor="new-user-role">Role</label><select id="new-user-role" className="input" value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value as Role })}><option value="STAFF">Staff</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select></div>
					<div className="sm:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={createUser.isPending}>{createUser.isPending ? 'Creating...' : 'Create account'}</button></div>
				</form>
			</Modal>

			<Modal open={!!passwordTarget} title={`Set password${passwordTarget ? ` · ${passwordTarget.name}` : ''}`} onClose={() => setPasswordTarget(null)}>
				<form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (newPassword.length < 8) { toast.error('Use at least 8 characters.'); return; } if (passwordTarget) updateUser.mutate({ id: passwordTarget._id, changes: { password: newPassword } }); }}>
					<div className="sm:col-span-2"><label className="label" htmlFor="user-new-password">New password</label><input id="user-new-password" type="password" autoComplete="new-password" minLength={8} required className="input" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><p className="mt-1 text-xs text-slate-500">Use at least 8 characters. The password is not displayed after saving.</p></div>
					<div className="sm:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" className="btn-secondary" onClick={() => setPasswordTarget(null)}>Cancel</button><button type="submit" className="btn-primary" disabled={updateUser.isPending}>{updateUser.isPending ? 'Saving...' : 'Update password'}</button></div>
				</form>
			</Modal>

			<ConfirmDialog open={!!deleteTarget} title="Delete user?" message={`Permanently remove ${deleteTarget?.name ?? 'this account'}? This cannot be undone.`} danger confirmLabel={deleteUser.isPending ? 'Deleting...' : 'Delete user'} onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteUser.mutate(deleteTarget._id)} />
		</div>
	);
}
