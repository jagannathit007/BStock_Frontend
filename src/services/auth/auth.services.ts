import toastHelper from '../../utils/toastHelper';
import api from '../api/api';
import { env } from '../../utils/env';

export interface User {
  _id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  role: string;
}

export interface AuthResponse {
  status: number;
  message: string;
  data?: {
    token?: string;
    customer?: User;
  };
}

export interface ProfileData {
  businessName?: string;
  country?: string;
  address?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  logo?: File | string | null;
  certificate?: File | string | null;
  profileImage?: File | string | null;
}

export interface ProfileResponse<T = any> {
  status: number;
  message: string;
  data?: T;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  socialId?: string;
  platformName?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  socialId?: string;
  platformName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  // Register a new user
  static register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/register`;

    try {
      const res = await api.post(url, userData);
      toastHelper.showTost(res.data.message || 'Registration successful!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to register';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Verify email
  static verifyEmail = async (token: string): Promise<AuthResponse> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/verify-email/${token}`; // Updated endpoint
    try {
      const res = await api.get(url);
      toastHelper.showTost(res.data.message || 'Email verified successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify email';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Login user
  static login = async (loginData: LoginRequest): Promise<AuthResponse> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/login`;

    try {
      const res = await api.post(url, loginData);
      localStorage.setItem('userId', res.data.data?.customer?._id || '');
      toastHelper.showTost(res.data.message || 'Login successful!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to login';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get profile (POST as per backend)
  static getProfile = async (): Promise<ProfileResponse<ProfileData>> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/get-profile`;
    try {
      const res = await api.post(url, {});
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load profile';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Update profile (multipart)
  static updateProfile = async (payload: ProfileData): Promise<ProfileResponse> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/update-profile`;

    const form = new FormData();
    if (payload.businessName !== undefined) form.append('businessName', String(payload.businessName));
    if (payload.country !== undefined) form.append('country', String(payload.country));
    if (payload.address !== undefined) form.append('address', String(payload.address));
    if (payload.name !== undefined) form.append('name', String(payload.name));
    if (payload.email !== undefined) form.append('email', String(payload.email));
    if (payload.mobileNumber !== undefined) form.append('mobileNumber', String(payload.mobileNumber));

    if (payload.logo instanceof File) {
      form.append('logo', payload.logo);
    } else if (typeof payload.logo === 'string') {
      form.append('logo', payload.logo);
    }

    if (payload.certificate instanceof File) {
      form.append('certificate', payload.certificate);
    } else if (typeof payload.certificate === 'string') {
      form.append('certificate', payload.certificate);
    }

    if (payload.profileImage instanceof File) {
      form.append('profileImage', payload.profileImage);
    } else if (typeof payload.profileImage === 'string') {
      form.append('profileImage', payload.profileImage);
    }

    try {
      const res = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toastHelper.showTost(res.data?.message || 'Profile updated successfully', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Change password
  static changePassword = async (
    payload: ChangePasswordRequest
  ): Promise<ProfileResponse> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/change-Password`;

    try {
      const res = await api.post(url, payload);
      toastHelper.showTost(res.data?.message || 'Password changed successfully', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}