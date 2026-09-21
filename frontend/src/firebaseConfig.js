import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase con soporte para variables de entorno de Vite
// o fallback predeterminado para el proyecto
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoPlaceholderKeyForLocalTesting",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "farmacia-comparator.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "farmacia-comparator",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "farmacia-comparator.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

// Inicialización segura singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export default app;
