import { initializeApp } from 'firebase/app';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
//import firebaseConfig from '../firebase-applet-config.json';

const configRaw = import.meta.env.VITE_FIREBASE_CONFIG;

let firebaseConfig;

try {
  // 如果 GitHub Actions 注入了 JSON 字串，就解析它
  firebaseConfig = configRaw ? JSON.parse(configRaw) : {};
} catch (e) {
  console.error("Firebase Config JSON parse failed. Using fallback.");
  firebaseConfig = {};
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
