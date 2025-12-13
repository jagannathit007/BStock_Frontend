import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface Wallet {
  _id: string;
  customerId: string;
  balance: number;
  blockedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  customerId: string;
  type: 'credit' | 'debit';
  amount: string;
  remark: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: string;
}

export interface WalletResponse {
  status?: number;
  success?: boolean;
  message?: string;
  data?: Wallet;
}

export interface TransactionListResponse {
  status?: number;
  success?: boolean;
  message?: string;
  data?: {
    docs: Transaction[];
    totalDocs: string;
    limit: string;
    totalPages: string;
    page: string;
    pagingCounter: string;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

export class WalletService {
  static async getWallet(): Promise<WalletResponse> {
    try {
      const res = await api.post('/api/customer/wallet/get');
      const ok = res.data?.success === true || res.data?.status === 200;
      if(!ok){
        toastHelper.showTost(res.data?.message || 'Failed to fetch wallet', 'warning');
      }
      return res.data;
    } catch (err: any) {
      console.error("WalletService getWallet error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const msg = err.response?.data?.errors?.map((e: any) => e.message).join(', ') || err.response?.data?.message || 'Failed to fetch wallet';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  static async listTransactions(page: number = 1, limit: number = 10): Promise<TransactionListResponse> {
    try {
      const res = await api.post('/api/customer/wallet/transactions', { page, limit });
      const ok = res.data?.success === true || res.data?.status === 200;
      if (!ok) {
        toastHelper.showTost(res.data?.message || 'Failed to fetch transactions', 'warning');
      }
      return res.data;
    } catch (err: any) {
      console.error("WalletService listTransactions error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const msg = err.response?.data?.message || 'Failed to fetch transactions';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }
}

export default WalletService;