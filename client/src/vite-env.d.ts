/// <reference types="vite/client" />

// Typed Vite env vars exposed to the browser (must be prefixed with VITE_).
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GOOGLE_SHEETS_URL?: string;
  // Base URL of the separately-deployed backend API (e.g. https://tester-api.vercel.app).
  // Leave empty in local dev so calls stay relative and go through the Vite proxy.
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
