// src/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getStorage, FirebaseStorage } from "firebase/storage";

// cấu hình Firebase
const firebaseConfig: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
} = {
  apiKey: "AIzaSyD_1bzer4sVFXtzB-1H-Catb05hi9kK3i8",
  authDomain: "shopee-clone-c8370.firebaseapp.com",
  projectId: "shopee-clone-c8370",
  storageBucket: "shopee-clone-c8370.appspot.com",
  messagingSenderId: "910023744123",
  appId: "1:910023744123:web:b7568a97ec599506b320de",
  measurementId: "G-G32ZKG047N",
};

// Khởi tạo Firebase app
const app: FirebaseApp = initializeApp(firebaseConfig);

// Khởi tạo Firebase Storage
export const storage: FirebaseStorage = getStorage(app);
