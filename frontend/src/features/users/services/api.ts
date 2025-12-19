import { apiClient } from '../../../shared/lib/api';
import type { User, UserRole } from '../../auth/types';

export interface UserApiResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  disabled?: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
  disabled?: boolean;
}

export const mapUserResponse = (payload: UserApiResponse): User => ({
  id: payload.id,
  name: payload.name,
  email: payload.email,
  role: payload.role,
  disabled: payload.disabled,
});

export const fetchUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<UserApiResponse[]>('/api/v1/users');
  return response.map(mapUserResponse);
};

export const createUserRequest = async (payload: CreateUserPayload): Promise<User> => {
  const response = await apiClient.post<UserApiResponse>('/api/v1/users', payload);
  return mapUserResponse(response);
};

export const updateUserRoleRequest = async (userId: string, role: UserRole): Promise<User> => {
  const response = await apiClient.patch<UserApiResponse>(`/api/v1/users/${userId}/role`, { role });
  return mapUserResponse(response);
};

export const toggleUserStatusRequest = async (userId: string, role: UserRole, disabled: boolean): Promise<User> => {
  const response = await apiClient.patch<UserApiResponse>(`/api/v1/users/${userId}/role`, { role, disabled });
  return mapUserResponse(response);
};

export const updateUserRequest = async (userId: string, payload: UpdateUserPayload): Promise<User> => {
  const response = await apiClient.patch<UserApiResponse>(`/api/v1/users/${userId}`, payload);
  return mapUserResponse(response);
};

export const deleteUserRequest = async (userId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/users/${userId}`);
};
