import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "shreyanshprepai-70288.firebaseapp.com",
  projectId: "shreyanshprepai-70288",
  storageBucket: "shreyanshprepai-70288.firebasestorage.app",
  messagingSenderId: "726077500848",
  appId: "1:726077500848:web:a49e798534c4b004e9ba75",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };
