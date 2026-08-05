/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SMART_BIN_CITY_URL?: string;
  readonly VITE_SMART_BIN_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
