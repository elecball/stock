import { browser } from "$app/environment";
import { initializeApp } from "firebase/app";
import { collection, doc, getDoc, getDocs, getFirestore, query } from "firebase/firestore";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { readable, writable } from "svelte/store";
import type { UserData, Stock } from "./interfaces";

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
const firestore = getFirestore(app);

const provider = new GoogleAuthProvider();

const user = readable<User | null>(null, set => onAuthStateChanged(auth, async (u) => {
  if(!browser) return; 
  isLoading.set(false);
  set(u);

  if (u) {
    const docSnap = await getDoc(doc(firestore, "users", u.uid));
    userData.set(docSnap.data() as UserData | null);
  }
  else {
    userData.set(null);
  }

  
}));

const userData = writable<UserData | null>(null);

const isLoading = writable<boolean>(true);

function waitLoading(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      isLoading.subscribe(l => {
        if (!l) resolve(l);
      });
    } catch (e) {
      reject(false);
    }
  });
}

async function getStocks(): Promise<Stock[]> {
  const colRef = collection(firestore, "stocks");
  return (await getDocs(colRef)).docs.map(d => {
    const stock = d.data() as Stock;
    stock.id = d.id;
    return stock;
  });
}


export { app, auth, firestore, provider, user, userData, isLoading, waitLoading, getStocks };