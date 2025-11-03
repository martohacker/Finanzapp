import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
// ⚠️ IMPORTANTE: Reemplaza estas URLs con las de tu proyecto Supabase
const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL as string) || '';
const SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase no está configurado. Usando localStorage como fallback.');
}

// Crear cliente de Supabase
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Tipos para TypeScript
export interface Database {
  public: {
    Tables: {
      gastos: {
        Row: {
          id: string;
          user_id: string;
          descripcion: string;
          monto: number;
          categoria: string;
          fecha: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          descripcion: string;
          monto: number;
          categoria: string;
          fecha: string;
        };
        Update: {
          descripcion?: string;
          monto?: number;
          categoria?: string;
          fecha?: string;
          updated_at?: string;
        };
      };
    };
  };
}

