/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_ADMIN_ROUTE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


