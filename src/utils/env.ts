export const env = {
  get baseUrl(): string {
    const value = (import.meta as any).env?.VITE_BASE_URL ?? (globalThis as any).VITE_BASE_URL;
    if (!value) throw new Error('VITE_BASE_URL is not defined');
    return value as string;
  },
  get adminRoute(): string {
    const value = (import.meta as any).env?.VITE_ADMIN_ROUTE ?? (globalThis as any).VITE_ADMIN_ROUTE;
    if (!value) throw new Error('VITE_ADMIN_ROUTE is not defined');
    return value as string;
  },

  get customerRoute(): string {
    const value = (import.meta as any).env?.VITE_CUSTOMER_ROUTE ?? (globalThis as any).VITE_CUSTOMER_ROUTE;
    if (!value) throw new Error('VITE_CUSTOMER_ROUTE is not defined');
    return value as string;
  },
};


