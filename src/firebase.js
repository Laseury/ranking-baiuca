import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhIe_n2EUn4cQr8FdRBN7-8dvwDkpkfmI",
  authDomain: "ranking-baiuca.firebaseapp.com",
  projectId: "ranking-baiuca",
  storageBucket: "ranking-baiuca.firebasestorage.app",
  messagingSenderId: "318794694342",
  appId: "1:318794694342:web:fd4511d07e635fbbe561c7",
  measurementId: "G-ZZ278E39SS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
