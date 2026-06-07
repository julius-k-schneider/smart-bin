/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SMART_BIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
