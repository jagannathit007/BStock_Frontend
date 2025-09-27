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
  mobileCountryCode?: string;
  logo?: File | string | null;
  certificate?: File | string | null;
  profileImage?: File | string | null;
  whatsappNumber?: string;
  whatsappCountryCode?: string;
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
  mobileNumber?: string;
  mobileCountryCode?: string;
  whatsappNumber?: string;
  whatsappCountryCode?: string;
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
  // Helper method to check if user profile is complete
  static isProfileComplete = (customer: any): boolean => {
    if (!customer) return false;
    
    // Check required personal information
    const hasPersonalInfo = customer.name && 
                           customer.email && 
                           customer.mobileNumber && 
                           customer.mobileCountryCode;
    
    // Check required business information
    // const businessProfile = customer.businessProfile || {};
    // const hasBusinessInfo = businessProfile.businessName && 
    //                        businessProfile.country;
    // return hasPersonalInfo && hasBusinessInfo;
    return hasPersonalInfo;
  };

  // Helper method to convert relative URLs to absolute URLs
  private static toAbsoluteUrl = (p: string | null | undefined): string | null => {
    if (!p || typeof p !== 'string') return null;
    const normalized = p.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalized)) return normalized;
    return `${env.baseUrl}/${normalized.replace(/^\//, '')}`;
  };

  // Helper method to save user data to localStorage
  private static saveUserToLocalStorage = (userData: any): void => {
    try {
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Save profile image separately if available
      const profileImage = userData.profileImage || userData.avatar;
      if (profileImage) {
        const absoluteUrl = this.toAbsoluteUrl(profileImage);
        if (absoluteUrl) {
          localStorage.setItem("profileImageUrl", absoluteUrl);
        }
      }

      // Dispatch custom event to notify components about the update
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: userData 
      }));
    } catch (error) {
      console.error('Failed to save user data to localStorage:', error);
    }
  };

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
      
      // Store userId
      localStorage.setItem('userId', res.data.data?.customer?._id || '');
      
      // Save customer data to localStorage
      if (res.data.data?.customer) {
        this.saveUserToLocalStorage(res.data.data.customer);
      }
      
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
      
      // Save updated user data to localStorage when profile is fetched
      if (res.data) {
        const userData = res.data.data || res.data.customer || res.data;
        if (userData) {
          this.saveUserToLocalStorage(userData);
        }
      }
      
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
    if (payload.mobileCountryCode !== undefined) form.append('mobileCountryCode', String(payload.mobileCountryCode));
    if (payload.whatsappNumber !== undefined) form.append('whatsappNumber', String(payload.whatsappNumber));
    if (payload.whatsappCountryCode !== undefined) form.append('whatsappCountryCode', String(payload.whatsappCountryCode));


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
      
      // Update localStorage with the updated profile data
      if (res.data) {
        const userData = res.data.data || res.data.customer || res.data;
        if (userData) {
          this.saveUserToLocalStorage(userData);
        }
      }
      
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

  // Clear user data from localStorage (for logout)
  static clearUserData = (): void => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('profileImageUrl');
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
    } catch (error) {
      console.error('Failed to clear user data from localStorage:', error);
    }
  };
}