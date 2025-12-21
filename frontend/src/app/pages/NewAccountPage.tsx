"use client";

import React, { useState } from 'react';
import { useApp, UserRole, type User } from '../context/AppContext';
import { useUsersFeature } from '../../features/users/hooks/useUsers';
import { ArrowLeft, UserPlus, Shield, Eye, EyeOff, ToggleLeft, ToggleRight, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageLayout } from '../../shared/ui/layout/PageLayout';

export function NewAccountPage() {
  const { user: currentUser, setCurrentPage } = useApp();
  const { users, addUser, updateUserRole, toggleUserStatus, updateUser, deleteUser } = useUsersFeature();
  const [showForm, setShowForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('staff');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('staff');
  const [editUserPassword, setEditUserPassword] = useState('password');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.email === newUserEmail)) {
      toast.error('Email already exists!');
      return;
    }
    const success = await addUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      password: 'password',
    });
    if (success) {
      toast.success(`User "${newUserName}" created successfully!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('staff');
      setShowForm(false);
    } else {
      toast.error('Failed to create user. Please try again.');
    }
  };

  const handleRoleChange = async (userId: string, nextRole: UserRole) => {
    const success = await updateUserRole(userId, nextRole);
    if (success) {
      toast.success('User role updated successfully!');
    } else {
      toast.error('Failed to update role. Please try again.');
    }
  };

  const beginEditUser = (target: User) => {
    setEditingUserId(target.id);
    setEditUserName(target.name);
    setEditUserEmail(target.email);
    setEditUserRole(target.role);
    setEditUserPassword('password');
  };

  const resetEditForm = () => {
    setEditingUserId(null);
    setEditUserName('');
    setEditUserEmail('');
    setEditUserRole('staff');
    setEditUserPassword('password');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    const success = await updateUser(editingUserId, {
      name: editUserName,
      email: editUserEmail,
      role: editUserRole,
      password: editUserPassword || 'password',
    });
    if (success) {
      toast.success('User updated successfully!');
      resetEditForm();
    } else {
      toast.error('Failed to update user. Please try again.');
    }
  };

  const handleForceDelete = async (userId: string, userName: string) => {
    if (currentUser?.id === userId) {
      toast.error('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Force delete "${userName}"? This cannot be undone.`)) {
      return;
    }
    const success = await deleteUser(userId);
    if (success) {
      toast.success(`User "${userName}" deleted.`);
      if (editingUserId === userId) {
        resetEditForm();
      }
    } else {
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/10 text-primary';
      case 'partner':
        return 'bg-accent/10 text-accent';
      case 'staff':
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <PageLayout
      header={{
        title: 'Account Management',
        subtitle: 'Manage users and role permissions',
        backButton: {
          label: 'Back to Dashboard',
          onClick: () => setCurrentPage('dashboard'),
          icon: ArrowLeft,
        },
      }}
      contentClassName="py-8 space-y-6"
    >
      <div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          {showForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
          <h2 className="text-foreground mb-6">Create New User</h2>
          <form onSubmit={handleAddUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-muted-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  placeholder="user@findash.com"
                  required
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-2">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  <option value="staff">Staff</option>
                  <option value="partner">Partner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg mb-6 text-sm text-accent">
              Default password is <span className="font-semibold">"password"</span>. Update it later from the edit panel if needed.
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create User
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserRole('staff');
                }}
                className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUserId && (
        <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-foreground">Update User</h2>
            <button className="text-sm text-muted-foreground hover:text-foreground" onClick={resetEditForm}>
              Close
            </button>
          </div>
          <form onSubmit={handleUpdateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-muted-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  required
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  required
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-2">Role</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  <option value="staff">Staff</option>
                  <option value="partner">Partner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-muted-foreground mb-2">Password</label>
                <input
                  type="text"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  placeholder="password"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors min-w-[180px]"
              >
                Update User
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[linear-gradient(120deg,var(--primary),var(--chart-3))] rounded-xl shadow-sm p-6 text-primary-foreground">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6" />
          <h2>Role Permissions Guide</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-foreground/12 rounded-lg p-4 backdrop-blur-sm">
            <p className="mb-2 font-medium">Admin</p>
            <p className="text-sm text-primary-foreground/80">Full control across accounts, investors, and transactions.</p>
          </div>
          <div className="bg-primary-foreground/12 rounded-lg p-4 backdrop-blur-sm">
            <p className="mb-2 font-medium">Partner</p>
            <p className="text-sm text-primary-foreground/80">Operations and insights access with edit permissions.</p>
          </div>
          <div className="bg-primary-foreground/12 rounded-lg p-4 backdrop-blur-sm">
            <p className="mb-2 font-medium">Staff</p>
            <p className="text-sm text-primary-foreground/80">Read-only dashboard and transaction visibility.</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
        <h2 className="text-foreground mb-6">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/70">
                <th className="text-left py-3 px-4 text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isCurrentUser = currentUser?.email === user.email;
                return (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/40">
                    <td className="py-3 px-4">
                      <p className="text-foreground">{user.name}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${user.disabled ? 'text-destructive' : 'text-primary'}`}>
                        {user.disabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {user.disabled ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="px-3 py-1 border border-input bg-input-background text-foreground rounded text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                          disabled={isCurrentUser}
                        >
                          <option value="staff">Staff</option>
                          <option value="partner">Partner</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="button"
                          disabled={isCurrentUser}
                          onClick={async () => {
                            try {
                              const nextDisabled = !user.disabled;
                              await toggleUserStatus(user.id, nextDisabled);
                              toast.success(`User "${user.name}" is now ${nextDisabled ? 'inactive' : 'active'}.`);
                            } catch {
                              toast.error('Failed to update status. Please try again.');
                            }
                          }}
                          className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                            user.disabled ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {user.disabled ? (
                            <>
                              <ToggleRight className="w-4 h-4" />
                              Activate
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4" />
                              Deactivate
                            </>
                          )}
                        </button>
                        {/* <button
                          type="button"
                          className="px-3 py-1 rounded text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1"
                          onClick={() => beginEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button> */}
                        {/* <button
                          type="button"
                          disabled={isCurrentUser}
                          className={`px-3 py-1 rounded text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1 ${
                            isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          onClick={() => handleForceDelete(user.id, user.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button> */}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
