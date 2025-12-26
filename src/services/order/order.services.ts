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
  billingAddress?: Address;
  shippingAddress?: Address;
  currentLocation?: string;
  deliveryLocation?: string;
  currency?: string;
  otherCharges?: number | null;
  paymentIds?: string | string[]; // Can be single ObjectId or array of ObjectIds
  isGroupedOrder?: boolean; // Flag to indicate if order contains groupCode products (for totalMoq validation)
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
  billingAddress?: Address;
  shippingAddress?: Address;
  currentLocation?: string;
  deliveryLocation?: string;
  currency?: string;
  paymentIds?: string | string[]; // Can be single ObjectId or array of ObjectIds
  pendingAmount?: number; // Remaining amount to be paid
  adminSelectedPaymentMethod?: string;
  status: string;
  totalAmount: number;
  otherCharges?: number | null;
  deliveryChargeOption?: 'standard' | 'express' | 'same_location';
  extraDeliveryCharge?: number;
  createdAt: string;
  receiverDetails?: {
    name?: string | null;
    mobile?: string | null;
  };
  negotiationId?: string | {
    _id: string;
    bidId: string;
    offerPrice: number;
    quantity: number;
    status: string;
    FromUserType: string;
  } | null; // Link to negotiation if order was created from a negotiation
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

  static async listOrders(page: number = 1, limit: number = 10, status?: string, searchQuery?: string): Promise<OrderListResponse> {
    try {
      const res = await api.post('/api/customer/order/list', { page, limit, status, searchQuery });
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

  static async confirmOrderModification(token: string): Promise<any> {
    try {
      const res = await api.get(`/api/customer/order/confirm-modification/${token}`);
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to confirm order modification';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async getDeliveryChargePreview(orderId: string, option: 'express' | 'same_location'): Promise<CreateOrderResponse> {
    try {
      const res = await api.post('/api/customer/order/apply-delivery-charge', { orderId, option, preview: true });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to preview delivery charge';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async applyDeliveryCharge(orderId: string, option: 'express' | 'same_location'): Promise<CreateOrderResponse> {
    try {
      const res = await api.post('/api/customer/order/apply-delivery-charge', { orderId, option });
      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(
        res.data?.message || (ok ? 'Delivery charge applied successfully' : 'Failed to apply delivery charge'),
        ok ? 'success' : 'error'
      );
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to apply delivery charge';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

static async addReceiverDetails(
  orderId: string, 
  receiverName: string, 
  receiverMobile: string, 
  remark: string, 
  images: File[]
): Promise<any> {
  try {
    // Create FormData object
    const formData = new FormData();
    
    // Append text fields
    formData.append('orderId', orderId);
    formData.append('receiverName', receiverName);
    formData.append('receiverMobile', receiverMobile);
    formData.append('remark', remark);
    
    // Append image files
    if (images && images.length > 0) {
      images.forEach((file, index) => {
        formData.append('images', file);
      });
    }

    // Make API call with FormData
    const res = await api.post('/api/customer/order/add-receiver-details', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const ok = res.data?.success === true || res.data?.status === 200;
    toastHelper.showTost(
      res.data?.message || (ok ? 'Receiver details added successfully' : 'Failed to add receiver details'), 
      ok ? 'success' : 'error'
    );
    return res.data;
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Failed to add receiver details';
    toastHelper.showTost(msg, 'error');
    throw err;
  }
}

  // ✅ Addresses are optional - backend will use order's addresses if not provided
  static async submitPayment(orderId: string, billingAddress: any, shippingAddress: any, paymentDetails: any, files?: File[]): Promise<CreateOrderResponse> {
    try {
      let res;
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append('orderId', orderId);
        // ✅ Only append addresses if they are provided (not null/undefined)
        if (billingAddress) {
          formData.append('billingAddress', JSON.stringify(billingAddress));
        }
        if (shippingAddress) {
          formData.append('shippingAddress', JSON.stringify(shippingAddress));
        }
        formData.append('paymentDetails', JSON.stringify(paymentDetails));
        files.forEach((file) => {
          formData.append('images', file);
        });
        res = await api.post('/api/customer/order/submit-payment', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const requestBody: any = {
          orderId,
          paymentDetails,
        };
        // ✅ Only include addresses if they are provided
        if (billingAddress) {
          requestBody.billingAddress = billingAddress;
        }
        if (shippingAddress) {
          requestBody.shippingAddress = shippingAddress;
        }
        res = await api.post('/api/customer/order/submit-payment', requestBody);
      }
      const ok = res.data?.success === true || res.data?.status === 200;
      toastHelper.showTost(res.data?.message || (ok ? 'Payment submitted successfully' : 'Failed to submit payment'), ok ? 'success' : 'error');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.errors?.map((e: any) => e.message).join(', ') || err.response?.data?.message || 'Failed to submit payment';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }
}

export default OrderService;