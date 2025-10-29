import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface PaymentField {
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'file' | 'image';
  mandatory: boolean;
  providedByAdmin?: boolean;
  value?: string;
  options?: string[];
}

export interface PaymentModule {
  name: string;
  enabled: boolean;
  termsAndConditions: boolean;
  specificFields: PaymentField[];
}

export interface SharedField {
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'file';
  mandatory: boolean;
  options?: string[];
}

export interface PaymentConfig {
  _id?: string;
  modules: PaymentModule[];
  sharedFields: SharedField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentConfigResponse {
  status: number;
  message?: string;
  data: PaymentConfig;
}

export interface PaymentDetailsData {
  orderId: string;
  module: string;
  acceptedTerms: boolean;
  fields: Record<string, any>;
}

export interface PaymentDetailsResponse {
  status: number;
  message?: string;
  data?: any;
}

export interface PaymentSubmissionData {
  orderId: string;
  amount: number;
  currency: string;
  module: string;
  paymentDetailsId: string;
  transactionRef?: string;
}

export class PaymentService {
  static async getPaymentConfig(): Promise<PaymentConfigResponse> {
    try {
      const res = await api.post('/api/customer/payment/config', {});
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch payment config';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async submitPaymentDetails(data: PaymentDetailsData, files?: File[]): Promise<PaymentDetailsResponse> {
    try {
      const formData = new FormData();
      formData.append('orderId', data.orderId);
      formData.append('module', data.module);
      formData.append('acceptedTerms', data.acceptedTerms.toString());
      formData.append('fields', JSON.stringify(data.fields));

      // Add files if any
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append('images', files[i]);
        }
      }

      const res = await api.post('/api/customer/payment/submit-details', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const responseData = res.data;
      
      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Payment details submitted successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to submit payment details', 'error');
      }

      return responseData;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit payment details';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async submitPayment(data: PaymentSubmissionData): Promise<PaymentDetailsResponse> {
    try {
      const res = await api.post('/api/customer/payment/submit', data);
      const responseData = res.data;
      
      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Payment submitted successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to submit payment', 'error');
      }

      return responseData;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit payment';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async getMyPaymentDetails(orderId: string): Promise<PaymentDetailsResponse> {
    try {
      const res = await api.post('/api/customer/payment/get', { orderId });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch payment details';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async listMyPaymentDetails(page = 1, limit = 10): Promise<PaymentDetailsResponse> {
    try {
      const res = await api.post('/api/customer/payment/list', { page, limit });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch payment details list';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }
}

export default PaymentService;
