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

export interface ListResponse {
  data: {
    docs: Product[];
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
  status: number;
  message: string;
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
  notifyType: 'stock_alert' | 'price_alert';
  notify: boolean;
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
  // Create a new product
  static createProduct = async (productData: Omit<Product, '_id'>): Promise<any> => {
    const baseUrl = env.baseUrl;
    const adminRoute = env.adminRoute;
    const url = `${baseUrl}/api/${adminRoute}/product/create`;

    try {
      const res = await api.post(url, productData);
      toastHelper.showTost(res.data.message || 'Product created successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Update an existing product
  static updateProduct = async (id: string, productData: Partial<Product>): Promise<any> => {
    const baseUrl = env.baseUrl;
    const adminRoute = env.adminRoute;
    const url = `${baseUrl}/api/${adminRoute}/product/update`;

    try {
      const data = { id, ...productData };
      const res = await api.post(url, data);
      toastHelper.showTost(res.data.message || 'Product updated successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Delete a product
  static deleteProduct = async (id: string): Promise<any> => {
    const baseUrl = env.baseUrl;
    const adminRoute = env.adminRoute;
    const url = `${baseUrl}/api/${adminRoute}/product/delete`;

    try {
      const res = await api.post(url, { id });
      toastHelper.showTost(res.data.message || 'Product deleted successfully!', 'success');
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get product list with pagination and search
  // static getProductList = async (page: number, limit: number, search?: string): Promise<ListResponse> => {
  //   const baseUrl = env.baseUrl;
  //   const adminRoute = env.adminRoute;
  //   const url = `${baseUrl}/api/customer/get-product-list`;

  //   const body: any = { page, limit };
  //   if (search) {
  //     body.search = search;
  //   }

  //   try {
  //     const res = await api.post(url, body);
  //     return res.data;
  //   } catch (err: any) {
  //     const errorMessage = err.response?.data?.message || 'Failed to fetch Products';
  //     toastHelper.showTost(errorMessage, 'error');
  //     throw new Error(errorMessage);
  //   }
  // };

  // Get a single product by ID
  static getProductById = async (id: string): Promise<Product> => {
    const baseUrl = env.baseUrl;
    const adminRoute = env.adminRoute;
    const url = `${baseUrl}/api/${adminRoute}/product/${id}`;

    try {
      const res = await api.get(url);
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get a single product by ID via POST api/admin/product/get
  static getProductByIdPost = async (id: string): Promise<Product> => {
    const baseUrl = env.baseUrl;
    const adminRoute = env.adminRoute;
    const url = `${baseUrl}/api/${adminRoute}/product/get`;

    try {
      const res = await api.post(url, { id });
      if (res.data?.status && res.data.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch Product');
      }
      return res.data?.data ?? res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch Product';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get SKU Family list
  static getSkuFamilyList = async (): Promise<{ _id: string; name: string }[]> => {
    const baseUrl = env.baseUrl;
    const adminRoute = env.adminRoute;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/listByName`;

    try {
      const res = await api.post(url, {});
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch SKU Families');
      }
      return res.data?.data;
    } catch (err: any) {
      console.error('SKU Family API Error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to fetch SKU Families';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Get SKU Family list by name
  static getSkuFamilyListByName = async (): Promise<{ _id: string; name: string }[]> => {
    const baseUrl = env.baseUrl;
    const adminRoute = env.adminRoute;
    const url = `${baseUrl}/api/${adminRoute}/skuFamily/listByName`;

    try {
      const res = await api.post(url, {});
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch SKU Families by name');
      }
      return res.data?.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch SKU Families by name';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  // Upload Excel file for product import
  // static uploadExcelFile = async (formData: FormData): Promise<ImportResponse> => {
  //   const baseUrl = env.baseUrl;
  //   const adminRoute = env.adminRoute;
  //   const url = `${baseUrl}/api/${adminRoute}/product/import`;

  //   try {
  //     const res = await api.post(url, formData);
  //     if (res.data?.status !== 200) {
  //       throw new Error(res.data?.message || 'Failed to import products');
  //     }
  //     toastHelper.showTost(res.data.message || 'Products imported successfully!', 'success');
  //     return res.data;
  //   } catch (err: any) {
  //     const errorMessage = err.response?.data?.message || 'Failed to import products';
  //     toastHelper.showTost(errorMessage, 'error');
  //     throw new Error(errorMessage);
  //   }
  // };


  // Create a new notification request
  static createNotification = async (notificationData: NotificationRequest): Promise<NotificationResponse> => {
    const baseUrl = env.baseUrl;
    const customerRoute = env.customerRoute;
    const url = `${baseUrl}/api/${customerRoute}/notify/me`;

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