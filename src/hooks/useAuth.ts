import { useState, useEffect } from 'react';
import { Usuario } from '../types';

const STORAGE_USUARIOS = 'finanzapp-usuarios';
const STORAGE_SESION = 'finanzapp-sesion';

// Función simple para hashear contraseñas (no es super segura, pero suficiente para app local)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useAuth() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar sesión al iniciar
  useEffect(() => {
    const sesionId = localStorage.getItem(STORAGE_SESION);
    if (sesionId) {
      const usuarios = obtenerUsuarios();
      const usuario = usuarios.find(u => u.id === sesionId);
      if (usuario) {
        setUsuarioActual(usuario);
      } else {
        // Sesión inválida, limpiar
        localStorage.removeItem(STORAGE_SESION);
      }
    }
    setCargando(false);
  }, []);

  const obtenerUsuarios = (): Usuario[] => {
    const stored = localStorage.getItem(STORAGE_USUARIOS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  };

  const guardarUsuarios = (usuarios: Usuario[]) => {
    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuarios));
  };

  const registrar = async (email: string, password: string, nombre: string): Promise<{ exito: boolean; error?: string }> => {
    const usuarios = obtenerUsuarios();
    
    // Verificar si el email ya existe
    if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { exito: false, error: 'Este email ya está registrado' };
    }

    // Validar email
    if (!email || !email.includes('@')) {
      return { exito: false, error: 'Email inválido' };
    }

    // Validar contraseña
    if (!password || password.length < 4) {
      return { exito: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    // Validar nombre
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

      usuarios.push({
        ...nuevoUsuario,
        // Guardar hash en lugar de contraseña (en producción usaríamos una estructura diferente)
      });

      guardarUsuarios(usuarios);
      
      // Guardar hash de contraseña asociado al usuario (en una app real esto iría en un backend)
      localStorage.setItem(`finanzapp-pwd-${nuevoUsuario.id}`, passwordHash);

      // Iniciar sesión automáticamente
      iniciarSesion(nuevoUsuario.id);

      return { exito: true };
    } catch (error) {
      return { exito: false, error: 'Error al registrar usuario' };
    }
  };

  const iniciarSesion = (userId: string) => {
    const usuarios = obtenerUsuarios();
    const usuario = usuarios.find(u => u.id === userId);
    if (usuario) {
      setUsuarioActual(usuario);
      localStorage.setItem(STORAGE_SESION, userId);
      return true;
    }
    return false;
  };

  const login = async (email: string, password: string): Promise<{ exito: boolean; error?: string }> => {
    const usuarios = obtenerUsuarios();
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!usuario) {
      return { exito: false, error: 'Email o contraseña incorrectos' };
    }

    try {
      const passwordHash = await hashPassword(password);
      const storedHash = localStorage.getItem(`finanzapp-pwd-${usuario.id}`);

      if (storedHash && storedHash === passwordHash) {
        iniciarSesion(usuario.id);
        return { exito: true };
      } else {
        return { exito: false, error: 'Email o contraseña incorrectos' };
      }
    } catch (error) {
      return { exito: false, error: 'Error al iniciar sesión' };
    }
  };

  const cerrarSesion = () => {
    setUsuarioActual(null);
    localStorage.removeItem(STORAGE_SESION);
  };

  return {
    usuarioActual,
    cargando,
    registrar,
    login,
    cerrarSesion,
  };
}

