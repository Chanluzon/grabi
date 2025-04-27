import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAdg0UssVeQ4v7ZjOMHBJ4peGe0GS55Zkw",
  authDomain: "appdev-86a96.firebaseapp.com",
  projectId: "appdev-86a96",
  storageBucket: "appdev-86a96.appspot.com",
  messagingSenderId: "117176618238522617226",
  appId: "1:117176618238522617226:web:3f9b9b9b9b9b9b9b9b9b9b",
  databaseURL: "https://appdev-86a96-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 