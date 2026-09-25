// src/feature/auth/firebaseAuthLoader.js
// ⚡ Cargadores diferidos bajo demanda para 0ms de impacto inicial
let _fb = null;
const fb = () => (_fb ||= import('../../core/servicios/firebase.js'));

export const loadFirebaseAuth = async () => {
  const [{ auth, googleProvider }, fbAuth] = await Promise.all([fb(), import('firebase/auth')]);
  return { auth, googleProvider, ...fbAuth };
};

export const loadFirebaseDb = async () => {
  const [{ db }, fbDb] = await Promise.all([fb(), import('firebase/firestore')]);
  return { db, ...fbDb };
};

