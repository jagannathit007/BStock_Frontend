import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface OrderItem {
  productId: string;
  skuFamilyId?: string | null;
  subSkuFamilyId?: string | null;
  quantity: number;
  price: number;
}

export interface Address {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaymentDetails {
  module: string;
  currency: string;
  acceptedTerms: boolean;
  fields: Record<string, any>;
  uploadedFiles?: string[];
  transactionRef?: string;
}

export interface CreateOrderRequest {
  cartItems: OrderItem[];
  billingAddress: Address;
  shippingAddress: Address;
  paymentDetails?: PaymentDetails;
}

export interface Order {
  _id: string;
  customerId: string;
  cartItems: Array<{
    productId: { _id: string; name: string; price: number };
    skuFamilyId: { _id: string; name: string };
    quantity: number;
    price: number;
  }>;
  billingAddress: Address;
  shippingAddress: Address;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface OrderListResponse {
  status?: number;
  success?: boolean;
  message?: string;
  data?: {
    docs: Order[];
    totalDocs: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

export interface CreateOrderResponse {
  status?: number;
  success?: boolean;
  message?: string;
  data?: any;
}

export interface CancelOrderResponse {
  status?: number;
  success?: boolean;
  message?: string;
  data?: any;
}

export class OrderService {
  static async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const res = await api.post('/api/customer/order/create', orderData);
      
      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(res.data?.message || (ok ? 'Order created successfully' : 'Failed to create order'), ok ? 'success' : 'error');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.errors?.map((e: any) => e.message).join(', ') || err.response?.data?.message || 'Failed to create order';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async createOrderWithFiles(orderData: CreateOrderRequest, files: File[]): Promise<CreateOrderResponse> {
    try {
      const formData = new FormData();
      
      // Add order data
      formData.append('cartItems', JSON.stringify(orderData.cartItems));
      formData.append('billingAddress', JSON.stringify(orderData.billingAddress));
      formData.append('shippingAddress', JSON.stringify(orderData.shippingAddress));
      if (orderData.paymentDetails) {
        formData.append('paymentDetails', JSON.stringify(orderData.paymentDetails));
      }

      // Add files
      files.forEach((file, index) => {
        formData.append('images', file);
      });

      const res = await api.post('/api/customer/order/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(res.data?.message || (ok ? 'Order created successfully' : 'Failed to create order'), ok ? 'success' : 'error');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.errors?.map((e: any) => e.message).join(', ') || err.response?.data?.message || 'Failed to create order';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async listOrders(page: number = 1, limit: number = 10, status?: string): Promise<OrderListResponse> {
    try {
      const res = await api.post('/api/customer/order/list', { page, limit, status });
      const ok = res.data?.success === true || res.data?.status === 200;
      if (!ok) {
        toastHelper.showTost(res.data?.message || 'Failed to fetch orders', 'error');
      }
      return res.data;
    } catch (err: any) {
      console.error("OrderService listOrders error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const msg = err.response?.data?.message || 'Failed to fetch orders';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    try {
      const res = await api.post('/api/customer/order/cancel', { orderId });
      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(res.data?.message || (ok ? 'Order cancellation requested successfully' : 'Failed to cancel order'), ok ? 'success' : 'error');
      return res.data;
    } catch (err: any) {
      console.error("OrderService cancelOrder error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const msg = err.response?.data?.message || 'Failed to cancel order';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async getOrderWithPaymentDetails(orderId: string): Promise<CreateOrderResponse> {
    try {
      const res = await api.post('/api/customer/order/get-payment-details', { orderId });
      return res.data;
    } catch (err: any) {
      throw err;
    }
  }
}

export default OrderService;