import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { Usuario } from '../types';

// Fallback a localStorage si Supabase no está configurado
const STORAGE_USUARIOS = 'finanzapp-usuarios';
const STORAGE_SESION = 'finanzapp-sesion';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Función fallback para localStorage (cuando no hay Supabase)
function obtenerUsuariosLocal(): Usuario[] {
  const stored = localStorage.getItem(STORAGE_USUARIOS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

function guardarUsuariosLocal(usuarios: Usuario[]) {
  localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuarios));
}

export function useAuthSupabase() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [userSupabase, setUserSupabase] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [usandoSupabase, setUsandoSupabase] = useState(false);

  // Detectar si Supabase está configurado
  useEffect(() => {
    setUsandoSupabase(supabase !== null);
  }, []);

  // Escuchar cambios de autenticación de Supabase
  useEffect(() => {
    if (!supabase) {
      // Fallback a localStorage
      const sesionId = localStorage.getItem(STORAGE_SESION);
      if (sesionId) {
        const usuarios = obtenerUsuariosLocal();
        const usuario = usuarios.find(u => u.id === sesionId);
        if (usuario) {
          setUsuarioActual(usuario);
        } else {
          localStorage.removeItem(STORAGE_SESION);
        }
      }
      setCargando(false);
      return;
    }

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserSupabase(session.user);
        
        // Crear objeto Usuario desde Supabase User
        const usuario: Usuario = {
          id: session.user.id,
          email: session.user.email || '',
          nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || 'Usuario',
          fechaCreacion: session.user.created_at || new Date().toISOString(),
        };
        setUsuarioActual(usuario);
      } else {
        setUserSupabase(null);
        setUsuarioActual(null);
      }
      setCargando(false);
    });

    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const usuario: Usuario = {
          id: session.user.id,
          email: session.user.email || '',
          nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || 'Usuario',
          fechaCreacion: session.user.created_at || new Date().toISOString(),
        };
        setUsuarioActual(usuario);
        setUserSupabase(session.user);
      }
      setCargando(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const registrar = async (
    email: string,
    password: string,
    nombre: string
  ): Promise<{ exito: boolean; error?: string }> => {
    if (!supabase) {
      // Fallback a localStorage
      return await registrarLocal(email, password, nombre);
    }

    try {
      // Validaciones
      if (!email || !email.includes('@')) {
        return { exito: false, error: 'Email inválido' };
      }
      if (!password || password.length < 6) {
        return { exito: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }
      if (!nombre || nombre.trim().length < 2) {
        return { exito: false, error: 'El nombre debe tener al menos 2 caracteres' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
          },
        },
      });

      if (error) {
        return { exito: false, error: error.message };
      }

      if (data.user) {
        const usuario: Usuario = {
          id: data.user.id,
          email: data.user.email || '',
          nombre: nombre.trim(),
          fechaCreacion: data.user.created_at || new Date().toISOString(),
        };
        setUsuarioActual(usuario);
        setUserSupabase(data.user);
        return { exito: true };
      }

      return { exito: false, error: 'Error al registrar usuario' };
    } catch (error: any) {
      return { exito: false, error: error.message || 'Error al registrar usuario' };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ exito: boolean; error?: string }> => {
    if (!supabase) {
      // Fallback a localStorage
      return await loginLocal(email, password);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        return { exito: false, error: error.message };
      }

      if (data.user) {
        const usuario: Usuario = {
          id: data.user.id,
          email: data.user.email || '',
          nombre: data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || 'Usuario',
          fechaCreacion: data.user.created_at || new Date().toISOString(),
        };
        setUsuarioActual(usuario);
        setUserSupabase(data.user);
        return { exito: true };
      }

      return { exito: false, error: 'Error al iniciar sesión' };
    } catch (error: any) {
      return { exito: false, error: error.message || 'Error al iniciar sesión' };
    }
  };

  const cerrarSesion = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      setUsuarioActual(null);
      localStorage.removeItem(STORAGE_SESION);
    }
  };

  // Funciones fallback para localStorage
  async function registrarLocal(
    email: string,
    password: string,
    nombre: string
  ): Promise<{ exito: boolean; error?: string }> {
    const usuarios = obtenerUsuariosLocal();

    if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { exito: false, error: 'Este email ya está registrado' };
    }

    if (!email || !email.includes('@')) {
      return { exito: false, error: 'Email inválido' };
    }

    if (!password || password.length < 4) {
      return { exito: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    if (!nombre || nombre.trim().length < 2) {
      return { exito: false, error: 'El nombre debe tener al menos 2 caracteres' };
    }

    try {
      const passwordHash = await hashPassword(password);
      const nuevoUsuario: Usuario = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        nombre: nombre.trim(),
        fechaCreacion: new Date().toISOString(),
      };

      usuarios.push(nuevoUsuario);
      guardarUsuariosLocal(usuarios);
      localStorage.setItem(`finanzapp-pwd-${nuevoUsuario.id}`, passwordHash);
      localStorage.setItem(STORAGE_SESION, nuevoUsuario.id);

      setUsuarioActual(nuevoUsuario);
      return { exito: true };
    } catch (error) {
      return { exito: false, error: 'Error al registrar usuario' };
    }
  }

  async function loginLocal(
    email: string,
    password: string
  ): Promise<{ exito: boolean; error?: string }> {
    const usuarios = obtenerUsuariosLocal();
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!usuario) {
      return { exito: false, error: 'Email o contraseña incorrectos' };
    }

    try {
      const passwordHash = await hashPassword(password);
      const storedHash = localStorage.getItem(`finanzapp-pwd-${usuario.id}`);

      if (storedHash && storedHash === passwordHash) {
        setUsuarioActual(usuario);
        localStorage.setItem(STORAGE_SESION, usuario.id);
        return { exito: true };
      } else {
        return { exito: false, error: 'Email o contraseña incorrectos' };
      }
    } catch (error) {
      return { exito: false, error: 'Error al iniciar sesión' };
    }
  }

  return {
    usuarioActual,
    cargando,
    registrar,
    login,
    cerrarSesion,
    usandoSupabase,
    userSupabase,
  };
}

