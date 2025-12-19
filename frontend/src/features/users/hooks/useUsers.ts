"use client";

import { useApp } from '../../../app/context/AppContext';

export function useUsersFeature() {
  const { users, addUser, updateUserRole, toggleUserStatus, disableUser, updateUser, deleteUser } = useApp();
  return {
    users,
    addUser,
    updateUserRole,
    toggleUserStatus,
    disableUser,
    updateUser,
    deleteUser,
  };
}
