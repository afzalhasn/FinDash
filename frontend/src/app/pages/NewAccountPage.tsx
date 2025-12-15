import React, { useState } from 'react';
import { useApp, UserRole } from '../context/AppContext';
import { ArrowLeft, UserPlus, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function NewAccountPage() {
  const { users, addUser, updateUserRole, disableUser, setCurrentPage } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('staff');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email already exists
    if (users.some(u => u.email === newUserEmail)) {
      toast.error('Email already exists!');
      return;
    }
    
    const success = await addUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const success = await updateUserRole(userId, newRole);
    if (success) {
      toast.success('User role updated successfully!');
    } else {
      toast.error('Failed to update role. Please try again.');
    }
  };

  const handleDisableUser = async (userId: string, userName: string) => {
    const success = await disableUser(userId);
    if (success) {
      toast.success(`User "${userName}" has been disabled.`);
    } else {
      toast.error('Failed to disable user. Please try again.');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'partner':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-gray-900">Account Management</h1>
          <p className="text-gray-600">Manage users and role permissions</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add User Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {showForm ? 'Cancel' : 'Create New User'}
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-gray-900 mb-6">Create New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="userName" className="block text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="userName"
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="userEmail" className="block text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="userEmail"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="user@findash.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="userRole" className="block text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="userRole"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="staff">Staff (Read-only)</option>
                  <option value="partner">Partner (Operations)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Default password will be "password". User should change it after first login.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
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
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Role Permissions Guide */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 mb-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-6 h-6" />
            <h2>Role Permissions Guide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="mb-2">Admin</p>
              <p className="text-sm text-indigo-100">
                Full system control: accounts, investors, entries, dashboard
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="mb-2">Partner</p>
              <p className="text-sm text-indigo-100">
                Business operations + entries + insights
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="mb-2">Staff</p>
              <p className="text-sm text-indigo-100">
                Read-only access to dashboard and transactions
              </p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-gray-900 mb-6">All Users</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-gray-700">Current Role</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-gray-900">{user.name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.disabled ? (
                        <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                          <EyeOff className="w-4 h-4" />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <Eye className="w-4 h-4" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!user.disabled && (
                        <div className="flex gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="staff">Staff</option>
                            <option value="partner">Partner</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleDisableUser(user.id, user.name)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                          >
                            Disable
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
