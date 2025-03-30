// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFmvAHgSJsdULbvdtZPh4XxYJAz1WxGfc",
  authDomain: "team-task-system.firebaseapp.com",
  projectId: "team-task-system",
  storageBucket: "team-task-system.appspot.com",
  messagingSenderId: "535484338940",
  appId: "1:535484338940:web:4bbcc51b3a69198ca33d79",
};

// 🛡️ 避免重複初始化
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
