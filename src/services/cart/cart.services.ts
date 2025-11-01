import api from '../api/api';
import toastHelper from '../../utils/toastHelper';
import { env } from '../../utils/env';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartListResponse {
  status: number;
  message?: string;
  data?: {
    docs: any[];
    totalDocs: number;
    page: number;
    limit: number;
  };
}

export interface GenericResponse {
  status?: number;
  success?: boolean;
  message?: string;
  data?: any;
}

export class CartService {
  static async add(productId: string, quantity: number, subSkuFamilyId?: string | null): Promise<GenericResponse> {
    try {
      const requestBody: any = { productId, quantity };
      if (subSkuFamilyId) {
        requestBody.subSkuFamilyId = subSkuFamilyId;
      }
      const res = await api.post('/api/customer/cart/add', requestBody);
      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(res.data?.message || (ok ? 'Added to cart' : 'Failed to add to cart'), ok ? 'success' : 'error');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add to cart';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async list(page = 1, limit = 10): Promise<CartListResponse> {
    try {
      const res = await api.post('/api/customer/cart/get', { page, limit });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch cart';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async updateQuantity(productId: string, quantity: number): Promise<GenericResponse> {
    try {
      // Standardize to customer/cart path
      const res = await api.post('/api/customer/cart/update-quantity', { productId, quantity });
      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(res.data?.message || (ok ? 'Quantity updated' : 'Failed to update quantity'), ok ? 'success' : 'error');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update quantity';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async remove(productId: string): Promise<GenericResponse> {
    try {
      const res = await api.post('/api/customer/cart/remove', { productId });
      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(res.data?.message || (ok ? 'Item removed' : 'Failed to remove item'), ok ? 'success' : 'error');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to remove item';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async clear(): Promise<GenericResponse> {
    try {
      const res = await api.post('/api/customer/cart/clear', {});
      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(res.data?.message || (ok ? 'Cart cleared' : 'Failed to clear cart'), ok ? 'success' : 'error');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to clear cart';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async count(): Promise<number> {
    try {
      const res = await api.post('/api/customer/cart/count', {});
      const ok = res.data?.success === true || res.data?.status === 200;
      return ok ? (res.data?.data?.count ?? 0) : 0;
    } catch {
      return 0;
    }
  }
}

export default CartService;

