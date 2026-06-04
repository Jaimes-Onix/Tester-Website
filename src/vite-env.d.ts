/// <reference types="vite/client" />

// Typed Vite env vars exposed to the browser (must be prefixed with VITE_).
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GOOGLE_SHEETS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
