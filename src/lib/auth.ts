// Import the functions you need from the SDKs you need
import { browser } from "$app/environment";
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { readable, writable } from "svelte/store";

const firebaseConfig = {
  apiKey: "AIzaSyCI5nGZKWtm5-PONy3-WHAPOmGC3mySG0A",
  authDomain: "stock-testify.firebaseapp.com",
  projectId: "stock-testify",
  storageBucket: "stock-testify.appspot.com",
  messagingSenderId: "559113315165",
  appId: "1:559113315165:web:30dbf020df922c84e4beb4",
  measurementId: "G-81FJ9S1643"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

const user = writable<User | null>(null);
const isLoading = writable<boolean>(true);

onAuthStateChanged(auth, u => {
  if (!browser) return;
  isLoading.set(false);
  user.set(u);
});

export { app, auth, provider, user, isLoading };