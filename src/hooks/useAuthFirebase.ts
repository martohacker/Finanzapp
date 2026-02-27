import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { Usuario } from '../types';

// Fallback a localStorage si Firebase no está configurado
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

export function useAuthFirebase() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [cargando, setCargando] = useState(true);
  const [usandoFirebase, setUsandoFirebase] = useState(false);

  // Detectar si Firebase está configurado
  useEffect(() => {
    setUsandoFirebase(isFirebaseConfigured());
  }, []);

  // Escuchar cambios de autenticación de Firebase
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
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

    let timeoutId: NodeJS.Timeout;
    let hasResolved = false;

    // Timeout de seguridad: si después de 5 segundos no hay respuesta, dejar de cargar
    timeoutId = setTimeout(() => {
      if (!hasResolved) {
        console.warn('⚠️ Timeout esperando autenticación de Firebase. Continuando sin autenticación.');
        setCargando(false);
        hasResolved = true;
      }
    }, 5000);

    // Escuchar cambios de sesión en Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (hasResolved) return; // Evitar múltiples llamadas
      
      clearTimeout(timeoutId);
      hasResolved = true;
      
      if (user) {
        setFirebaseUser(user);
        
        const usuario: Usuario = {
          id: user.uid,
          email: user.email || '',
          nombre: user.displayName || user.email?.split('@')[0] || 'Usuario',
          fechaCreacion: user.metadata.creationTime || new Date().toISOString(),
        };
        setUsuarioActual(usuario);
      } else {
        setFirebaseUser(null);
        setUsuarioActual(null);
      }
      setCargando(false);
    });

    // Verificar sesión actual inmediatamente (similar a Supabase)
    // Esto puede ejecutarse antes que onAuthStateChanged
    if (auth.currentUser) {
      clearTimeout(timeoutId);
      if (!hasResolved) {
        hasResolved = true;
        const user = auth.currentUser;
        setFirebaseUser(user);
        const usuario: Usuario = {
          id: user.uid,
          email: user.email || '',
          nombre: user.displayName || user.email?.split('@')[0] || 'Usuario',
          fechaCreacion: user.metadata.creationTime || new Date().toISOString(),
        };
        setUsuarioActual(usuario);
        setCargando(false);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

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

  const registrar = async (
    email: string,
    password: string,
    nombre: string
  ): Promise<{ exito: boolean; error?: string }> => {
    if (!isFirebaseConfigured() || !auth) {
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

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        password
      );

      // Actualizar perfil con el nombre
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: nombre.trim(),
        });

        const usuario: Usuario = {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          nombre: nombre.trim(),
          fechaCreacion: userCredential.user.metadata.creationTime || new Date().toISOString(),
        };
        setUsuarioActual(usuario);
        setFirebaseUser(userCredential.user);
        return { exito: true };
      }

      return { exito: false, error: 'Error al registrar usuario' };
    } catch (error: any) {
      let mensajeError = 'Error al registrar usuario';
      if (error.code === 'auth/email-already-in-use') {
        mensajeError = 'Este email ya está registrado';
      } else if (error.code === 'auth/weak-password') {
        mensajeError = 'La contraseña es muy débil';
      } else if (error.message) {
        mensajeError = error.message;
      }
      return { exito: false, error: mensajeError };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ exito: boolean; error?: string }> => {
    if (!isFirebaseConfigured() || !auth) {
      // Fallback a localStorage
      return await loginLocal(email, password);
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        password
      );

      if (userCredential.user) {
        const usuario: Usuario = {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          nombre: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'Usuario',
          fechaCreacion: userCredential.user.metadata.creationTime || new Date().toISOString(),
        };
        setUsuarioActual(usuario);
        setFirebaseUser(userCredential.user);
        return { exito: true };
      }

      return { exito: false, error: 'Error al iniciar sesión' };
    } catch (error: any) {
      let mensajeError = 'Email o contraseña incorrectos';
      if (error.code === 'auth/user-not-found') {
        mensajeError = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        mensajeError = 'Contraseña incorrecta';
      } else if (error.message) {
        mensajeError = error.message;
      }
      return { exito: false, error: mensajeError };
    }
  };

  const cerrarSesion = async () => {
    setFirebaseUser(null);
    setUsuarioActual(null);
    localStorage.removeItem(STORAGE_SESION);
    if (isFirebaseConfigured() && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Error al cerrar sesión en Firebase:', e);
      }
    }
  };

  const recuperarContrasena = async (email: string): Promise<{ exito: boolean; error?: string }> => {
    if (!isFirebaseConfigured() || !auth) {
      return { exito: false, error: 'La recuperación de contraseña solo está disponible con Firebase.' };
    }
    if (!email || !email.includes('@')) {
      return { exito: false, error: 'Ingresa un email válido.' };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { exito: true };
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      let mensaje = 'No se pudo enviar el correo de recuperación.';
      if (err?.code === 'auth/user-not-found') {
        mensaje = 'No hay ninguna cuenta con ese email.';
      } else if (err?.code === 'auth/invalid-email') {
        mensaje = 'Email inválido.';
      } else if (err?.message) {
        mensaje = err.message;
      }
      return { exito: false, error: mensaje };
    }
  };

  return {
    usuarioActual,
    cargando,
    registrar,
    login,
    cerrarSesion,
    recuperarContrasena,
    usandoFirebase,
    firebaseUser,
  };
}

