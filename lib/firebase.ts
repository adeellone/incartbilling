import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDj-GiCbDv3tB20zuzGYcjsHpJb8ndkDUw",
  authDomain: "incart-billing.firebaseapp.com",
  projectId: "incart-billing",
  storageBucket: "incart-billing.firebasestorage.app",
  messagingSenderId: "705031293009",
  appId: "1:705031293009:web:8caae11a0bb867fe32507",
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db      = getFirestore(app);
export const storage = getStorage(app);
export const auth    = getAuth(app);
