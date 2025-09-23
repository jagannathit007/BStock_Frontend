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
}