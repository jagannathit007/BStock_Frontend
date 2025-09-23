import toastHelper from '../../utils/toastHelper';
import api from '../api/api';
import { env } from '../../utils/env';

export interface Product {
  _id?: string;
  skuFamilyId: string | { _id: string; name: string; images?: string[] };
  specification: string;
  simType: string;
  color: string;
  ram: string;
  storage: string;
  condition: string;
  price: number | string;
  stock: number | string;
  country: string;
  moq: number | string;
  isNegotiable: boolean;
  isFlashDeal: string;
  expiryTime: string; 
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface ImportResponse {
  status: number;
  message: string;
  data: {
    imported: string;
  };
}
export interface NotificationRequest {
  productId: string;
  email: string;
  phone?: string;
}

export interface Notification {
  _id?: string;
  productId: string;
  email: string;
  phone?: string;
  notificationType: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationResponse {
  status: number;
  message: string;
  data?: Notification;
}

export interface NotificationListResponse {
  status: number;
  message: string;
  data: {
    docs: Notification[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

export interface NotificationStatsResponse {
  status: number;
  message: string;
  data: {
    totalNotifications: number;
    activeNotifications: number;
    triggeredNotifications: number;
    pendingNotifications: number;
  };
}

export interface UserPreferences {
  email: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  categories: string[];
}


export class ProductService {

static getProductById = async (id: string): Promise<Product> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/get-product`;

    try {
      const res = await api.post(url, { id });
      if (res.data?.data === null) {
        throw new Error(res.data?.message || 'Failed to fetch Product');
      }
      return res.data.data; // Return the Product with populated skuFamilyId
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };


  // Create a new notification request
  static createNotification = async (notificationData: NotificationRequest): Promise<NotificationResponse> => {
    const baseUrl = env.baseUrl;
    const adminRoute = env.adminRoute;
    const url = `${baseUrl}/api/${adminRoute}/notification/create`;

    try {
      const res = await api.post(url, notificationData);
      toastHelper.showTost(res.data.message || 'Notification created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create notification';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
}