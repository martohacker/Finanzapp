import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Configuración de Firebase
// ⚠️ IMPORTANTE: Reemplaza con tus credenciales de Firebase
const firebaseConfig = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || '',
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || '',
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || '',
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || '',
};

// Inicializar Firebase solo si está configurado
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Persistencia de auth: mantiene la sesión al cerrar/recargar el navegador
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('⚠️ No se pudo activar persistencia de auth:', err?.message);
    });

    // Cache offline de Firestore: permite leer datos sin red y sincronizar después
    enableIndexedDbPersistence(db).catch((err) => {
      if (err?.code === 'failed-precondition') {
        console.warn('⚠️ Persistencia Firestore: ya está abierta en otra pestaña.');
      } else {
        console.warn('⚠️ Persistencia Firestore desactivada:', err?.message);
      }
    });

    if (import.meta.env?.DEV) {
      console.log('✅ Firebase inicializado correctamente');
      console.log('📍 Entorno:', {
        esProduccion: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
        hostname: window.location.hostname,
        url: window.location.origin,
      });
    }
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
  }
} else {
  if (import.meta.env?.DEV) {
    console.warn('⚠️ Firebase no está configurado. Variables faltantes:', {
      apiKey: !firebaseConfig.apiKey ? 'FALTA' : `OK (${firebaseConfig.apiKey.substring(0, 10)}...)`,
      authDomain: !firebaseConfig.authDomain ? 'FALTA' : `OK (${firebaseConfig.authDomain})`,
      projectId: !firebaseConfig.projectId ? 'FALTA' : `OK (${firebaseConfig.projectId})`,
      storageBucket: !firebaseConfig.storageBucket ? 'FALTA' : 'OK',
      messagingSenderId: !firebaseConfig.messagingSenderId ? 'FALTA' : 'OK',
      appId: !firebaseConfig.appId ? 'FALTA' : 'OK',
    });
    console.warn('⚠️ Usando localStorage como fallback.');
  }
}

export { app, auth, db };
export const isFirebaseConfigured = () => !!app && !!auth && !!db;
