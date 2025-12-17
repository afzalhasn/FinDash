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
