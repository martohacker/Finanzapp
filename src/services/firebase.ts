import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuración de Firebase
// ⚠️ IMPORTANTE: Reemplaza con tus credenciales de Firebase
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY as string || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string || '',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID as string || '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string || '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string || '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID as string || '',
};

// Inicializar Firebase solo si está configurado
let app: any = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('⚠️ Error al inicializar Firebase:', error);
  }
} else {
  console.warn('⚠️ Firebase no está configurado. Usando localStorage como fallback.');
}

export { app, auth, db };
export const isFirebaseConfigured = () => !!app && !!auth && !!db;

