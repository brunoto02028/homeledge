'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Plus, Shield, ShieldAlert, UserCheck, UserX, Loader2, AlertCircle,
  Eye, EyeOff, Trash2, Pencil, X, Check, Search, ChevronDown, Lock, Unlock
} from 'lucide-react';
import { ALL_PERMISSIONS, PERMISSION_LABELS, PLAN_PERMISSIONS, type PermissionKey } from '@/lib/permissions';

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  plan: string;
  permissions: string[];
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { invoices: number; bills: number; bankStatements: number; events: number };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create form state
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newPlan, setNewPlan] = useState('free');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPerms, setShowNewPerms] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit form state
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if ((session?.user as any)?.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchUsers();
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Failed to load users');
      }
    } catch {
      setError('Failed to load users');
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, fullName: newFullName, password: newPassword, role: newRole, plan: newPlan, permissions: newPermissions }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreateForm(false);
        setNewEmail('');
        setNewFullName('');
        setNewPassword('');
        setNewRole('user');
        setNewPlan('free');
        setNewPermissions([]);
        fetchUsers();
      } else {
        setCreateError(data.error || 'Failed to create user');
      }
    } catch {
      setCreateError('An error occurred');
    }
    setCreateLoading(false);
  };

  const handleUpdateUser = async (userId: string) => {
    setEditLoading(true);
    try {
      const body: Record<string, any> = {};
      if (editRole) body.role = editRole;
      if (editStatus) body.status = editStatus;
      if (editPassword) body.newPassword = editPassword;
      if (editPlan) body.plan = editPlan;
      body.permissions = editPermissions;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setEditingUser(null);
        setEditPassword('');
        fetchUsers();
      }
    } catch {
      // ignore
    }
    setEditLoading(false);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch {
      // ignore
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      suspended: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      pending_verification: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>
        {status === 'pending_verification' ? 'Pending' : status}
      </span>
    );
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      user: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      business: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
      accountant: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || 'bg-muted text-muted-foreground'}`}>
        {role}
      </span>
    );
  };

  if ((session?.user as any)?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-700" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">{users.length} total users</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New User
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            {createError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="user">User</option>
                  <option value="business">Business</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <select
                  value={newPlan}
                  onChange={(e) => {
                    const p = e.target.value;
                    setNewPlan(p);
                    setNewPermissions(PLAN_PERMISSIONS[p] ? [...PLAN_PERMISSIONS[p]] : []);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="none">No Plan</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="managed">Managed</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowNewPerms(!showNewPerms)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Lock className="h-3 w-3" />
                  {showNewPerms ? 'Hide' : 'Customise'} Permissions ({newPermissions.length === 0 ? 'All access' : `${newPermissions.length}/${ALL_PERMISSIONS.length}`})
                </button>
                {showNewPerms && (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                    <div className="col-span-full flex gap-1 mb-1">
                      <button type="button" onClick={() => setNewPermissions([])} className="text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200">All Access</button>
                      {Object.keys(PLAN_PERMISSIONS).map(plan => (
                        <button key={plan} type="button" onClick={() => { setNewPermissions([...PLAN_PERMISSIONS[plan]]); setNewPlan(plan); }} className={`text-[10px] px-2 py-0.5 rounded capitalize ${newPlan === plan && newPermissions.length > 0 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{plan}</button>
                      ))}
                    </div>
                    {ALL_PERMISSIONS.map(perm => {
                      const checked = newPermissions.length === 0 || newPermissions.includes(perm);
                      const isRestricted = newPermissions.length > 0 && !newPermissions.includes(perm);
                      return (
                        <label key={perm} className={`flex items-center gap-1.5 text-[11px] rounded px-2 py-1 cursor-pointer transition-colors ${isRestricted ? 'bg-red-50 dark:bg-red-950/20 text-red-500 line-through' : 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'}`}>
                          <input type="checkbox" checked={checked} onChange={() => {
                            if (newPermissions.length === 0) { setNewPermissions(ALL_PERMISSIONS.filter(p => p !== perm) as string[]); }
                            else if (newPermissions.includes(perm)) { setNewPermissions(newPermissions.filter(p => p !== perm)); }
                            else { setNewPermissions([...newPermissions, perm]); }
                          }} className="h-3 w-3 rounded" />
                          {PERMISSION_LABELS[perm]}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create User
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{user.fullName}</h3>
                      {roleBadge(user.role)}
                      {statusBadge(user.status)}
                      {user.mustChangePassword && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          <Lock className="h-3 w-3 mr-0.5" />
                          Must change pw
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Joined {new Date(user.createdAt).toLocaleDateString('en-GB')}</span>
                      {user.lastLoginAt && (
                        <span>Last login {new Date(user.lastLoginAt).toLocaleDateString('en-GB')}</span>
                      )}
                      <span>{user._count.invoices} invoices</span>
                      <span>{user._count.bills} bills</span>
                      <span>{user._count.bankStatements} statements</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {editingUser !== user.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUser(user.id);
                            setEditRole(user.role);
                            setEditStatus(user.status);
                            setEditPassword('');
                            setEditPlan(user.plan || 'free');
                            setEditPermissions(user.permissions || []);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateUser(user.id)} disabled={editLoading}>
                          {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit inline */}
                {editingUser === user.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Role</Label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="business">Business</option>
                        <option value="accountant">Accountant</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending_verification">Pending</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reset Password</Label>
                      <Input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="New password (optional)"
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Feature Permissions
                        {editPermissions.length === 0 && <span className="text-green-600 font-normal ml-1">(All access)</span>}
                        {editPermissions.length > 0 && <span className="text-amber-600 font-normal ml-1">({editPermissions.length}/{ALL_PERMISSIONS.length})</span>}
                      </Label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditPermissions([])}
                          className="text-[10px] px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                        >
                          All Access
                        </button>
                        {Object.keys(PLAN_PERMISSIONS).map(plan => (
                          <button
                            key={plan}
                            type="button"
                            onClick={() => { setEditPermissions([...PLAN_PERMISSIONS[plan]]); setEditPlan(plan); }}
                            className={`text-[10px] px-2 py-0.5 rounded capitalize ${
                              editPlan === plan && editPermissions.length > 0
                                ? 'bg-blue-600 text-white'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {plan}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                      {ALL_PERMISSIONS.map(perm => {
                        const checked = editPermissions.length === 0 || editPermissions.includes(perm);
                        const isRestricted = editPermissions.length > 0 && !editPermissions.includes(perm);
                        return (
                          <label
                            key={perm}
                            className={`flex items-center gap-1.5 text-[11px] rounded px-2 py-1 cursor-pointer transition-colors ${
                              isRestricted
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-500 line-through'
                                : 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (editPermissions.length === 0) {
                                  // Switch from "all" to explicit: select all except this one
                                  setEditPermissions(ALL_PERMISSIONS.filter(p => p !== perm) as string[]);
                                } else if (editPermissions.includes(perm)) {
                                  setEditPermissions(editPermissions.filter(p => p !== perm));
                                } else {
                                  setEditPermissions([...editPermissions, perm]);
                                }
                              }}
                              className="h-3 w-3 rounded"
                            />
                            {PERMISSION_LABELS[perm]}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
