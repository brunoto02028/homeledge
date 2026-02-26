'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  Users, Plus, Crown, Shield, Eye, UserPlus, Mail, Trash2, Pencil, Loader2,
  Home, Clock, CheckCircle, XCircle, Copy, UserMinus, Settings,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Member {
  id: string;
  role: string;
  user: { id: string; fullName: string; email: string };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface Household {
  id: string;
  name: string;
  ownerId: string;
  myRole: string;
  owner?: { id: string; fullName: string; email: string };
  memberships: Member[];
  invitations: Invitation[];
  _count?: { memberships: number };
}

function useRoleConfig() {
  const { t } = useTranslation();
  return {
    owner: { label: t('household.owner'), icon: Crown, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    editor: { label: t('household.editor'), icon: Pencil, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    viewer: { label: t('household.viewer'), icon: Eye, color: 'text-muted-foreground bg-muted' },
    accountant: { label: t('household.accountant'), icon: Shield, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  } as Record<string, { label: string; icon: React.ElementType; color: string }>;
}

export function HouseholdClient() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const ROLE_CONFIG = useRoleConfig();
  const [households, setHouseholds] = useState<{ owned: Household[]; memberOf: Household[] }>({ owned: [], memberOf: [] });
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [newName, setNewName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const userId = (session?.user as any)?.id;

  const fetchHouseholds = async () => {
    try {
      const res = await fetch('/api/households');
      const data = await res.json();
      setHouseholds(data);
    } catch (err) {
      toast({ title: t('common.error'), description: t('common.errorLoading'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHouseholds(); }, []);

  // Auto-trigger invite dialog when arriving via ?action=invite
  const searchParams = useSearchParams();
  useEffect(() => {
    if (loading) return;
    const action = searchParams.get('action');
    if (action === 'invite' && households.owned.length > 0) {
      setSelectedHousehold(households.owned[0]);
      setShowInviteDialog(true);
    }
  }, [loading, searchParams, households.owned]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: t('common.created'), description: `${newName}` });
      setNewName('');
      setShowCreateDialog(false);
      fetchHouseholds();
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedHousehold) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/households/${selectedHousehold.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.emailSent) {
        toast({ title: t('household.inviteSent'), description: inviteEmail });
      } else {
        toast({
          title: 'Invitation Created',
          description: `Invitation saved but email could not be sent. Share the invite link manually.`,
          variant: 'destructive',
        });
      }
      setInviteEmail('');
      setShowInviteDialog(false);
      fetchHouseholds();
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeInvite = async (householdId: string, invitationId: string) => {
    try {
      const res = await fetch(`/api/households/${householdId}/invite`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: t('household.revokeInvite') });
      fetchHouseholds();
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (householdId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/households/${householdId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: t('household.removeMember') });
      fetchHouseholds();
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    }
  };

  const handleChangeRole = async (householdId: string, memberId: string, role: string) => {
    try {
      const res = await fetch(`/api/households/${householdId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: t('common.updated') });
      fetchHouseholds();
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/households/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: t('common.deleted') });
      setDeleteId(null);
      fetchHouseholds();
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <LoadingSpinner />;

  const allHouseholds = [...households.owned, ...households.memberOf];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            {t('household.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('household.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('household.create')}
        </Button>
      </div>

      {allHouseholds.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('household.noHousehold')}</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {t('household.createFirst')}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('household.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {allHouseholds.map((h) => {
            const isOwner = h.ownerId === userId;
            const canManage = isOwner || h.myRole === 'editor';

            return (
              <Card key={h.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{h.name}</CardTitle>
                        <CardDescription>
                          {h.memberships?.length || h._count?.memberships || 1} {t('household.members').toLowerCase()}
                          {isOwner && ` · ${t('household.owner')}`}
                          {!isOwner && ` · ${ROLE_CONFIG[h.myRole]?.label || h.myRole}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedHousehold(h); setShowInviteDialog(true); }}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {t('household.invite')}
                        </Button>
                      )}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setDeleteId(h.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Members List */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('household.members')}</h4>
                    <div className="space-y-2">
                      {(h.memberships || []).map((m) => {
                        const roleConfig = ROLE_CONFIG[m.role] || ROLE_CONFIG.viewer;
                        const RoleIcon = roleConfig.icon;
                        const isSelf = m.user.id === userId;
                        const isOwnerMember = m.role === 'owner';

                        return (
                          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                {m.user.fullName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {m.user.fullName}
                                  {isSelf && <span className="text-muted-foreground ml-1">(you)</span>}
                                </p>
                                <p className="text-xs text-muted-foreground">{m.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isOwner && !isOwnerMember && !isSelf ? (
                                <Select
                                  value={m.role}
                                  onValueChange={(v) => handleChangeRole(h.id, m.user.id, v)}
                                >
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="editor">{t('household.editor')}</SelectItem>
                                    <SelectItem value="viewer">{t('household.viewer')}</SelectItem>
                                    <SelectItem value="accountant">{t('household.accountant')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge className={`text-xs ${roleConfig.color}`}>
                                  <RoleIcon className="h-3 w-3 mr-1" />
                                  {roleConfig.label}
                                </Badge>
                              )}
                              {isOwner && !isOwnerMember && !isSelf && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500"
                                  onClick={() => handleRemoveMember(h.id, m.user.id)}
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pending Invitations */}
                  {isOwner && h.invitations && h.invitations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {t('household.invitations')}
                      </h4>
                      <div className="space-y-2">
                        {h.invitations.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <div>
                                <p className="text-sm">{inv.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  {ROLE_CONFIG[inv.role]?.label || inv.role} · 
                                  {new Date(inv.expiresAt).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-GB')}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => handleRevokeInvite(h.id, inv.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('household.create')}</DialogTitle>
            <DialogDescription>
              {t('household.createFirst')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('household.householdName')}</Label>
              <Input
                placeholder="e.g. Smith Family, My Business Team"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('household.invite')}</DialogTitle>
            <DialogDescription>
              {selectedHousehold?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('household.inviteEmail')}</Label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('household.inviteRole')}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> {t('household.viewer')}</span>
                  </SelectItem>
                  <SelectItem value="editor">
                    <span className="flex items-center gap-2"><Pencil className="h-4 w-4" /> {t('household.editor')}</span>
                  </SelectItem>
                  <SelectItem value="accountant">
                    <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> {t('household.accountant')}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleInvite} disabled={saving || !inviteEmail.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              {t('household.sendInvite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
