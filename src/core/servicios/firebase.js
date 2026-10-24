// src/core/servicios/firebase.js
// Instancia Base Singleton de Firebase para Gaswii con App Check Enterprise (JavaScript Puro)

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { id as wiiId } from '../../wii.js';
import { configurarSistema } from '../../semillas/configurar.js';

export const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || configurarSistema.id || wiiId || '',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  databaseURL: import.meta.env.PUBLIC_FIREBASE_DATABASE_URL
};

export const app = getApps()[0] || initializeApp(firebaseConfig);

export let appCheck = null;

export function initAppCheck() {
  if (appCheck) return appCheck;
  if (typeof window !== 'undefined' && import.meta.env.PUBLIC_RECAPTCHA_WEB) {
    if (['localhost'].includes(location.hostname)) {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.PUBLIC_APPCHECK_DEBUG_TOKEN || true;
    }
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(import.meta.env.PUBLIC_RECAPTCHA_WEB),
        isTokenAutoRefreshEnabled: true
      });
    } catch (err) {
      console.warn('[Firebase AppCheck] Inicialización ignorada:', err?.message || err);
    }
  }
  return appCheck;
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
