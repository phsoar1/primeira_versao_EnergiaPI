import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const defaultFirebaseConfig = {
  apiKey: "AIzaSyCEX0l9i7t8CKne5VZnNK3vOrrtE8egDOc",
  authDomain: "energiapi.firebaseapp.com",
  projectId: "energiapi",
  storageBucket: "energiapi.firebasestorage.app",
  messagingSenderId: "55451316958",
  appId: "1:55451316958:web:cf10498b9830ccc210c84f",
  measurementId: "G-TMD0W8Z2HL",
};

const requiredConfigKeys = ["apiKey", "authDomain", "projectId", "appId"];

const isPlaceholderValue = (value) => {
  const normalized = String(value || "").toLowerCase();
  return (
    !normalized ||
    normalized === "undefined" ||
    normalized === "null" ||
    normalized.includes("demo") ||
    normalized.includes("your_") ||
    normalized.includes("xxxx") ||
    normalized.includes("placeholder")
  );
};

const envFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const resolveConfigValue = (key) =>
  isPlaceholderValue(envFirebaseConfig[key])
    ? defaultFirebaseConfig[key]
    : envFirebaseConfig[key];

const firebaseConfig = {
  apiKey: resolveConfigValue("apiKey"),
  authDomain: resolveConfigValue("authDomain"),
  projectId: resolveConfigValue("projectId"),
  storageBucket: resolveConfigValue("storageBucket"),
  messagingSenderId: resolveConfigValue("messagingSenderId"),
  appId: resolveConfigValue("appId"),
  measurementId: resolveConfigValue("measurementId"),
};

const missingConfigKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key]);
const placeholderConfigKeys = requiredConfigKeys.filter((key) =>
  isPlaceholderValue(firebaseConfig[key]),
);
const apiKeyLooksValid =
  !firebaseConfig.apiKey || /^AIza[0-9A-Za-z_-]{20,}$/.test(firebaseConfig.apiKey);
const invalidConfigKeys = [
  ...new Set([
    ...missingConfigKeys,
    ...placeholderConfigKeys,
    ...(apiKeyLooksValid ? [] : ["apiKey"]),
  ]),
];

export const isFirebaseConfigured = invalidConfigKeys.length === 0;
export const firebaseConfigStatus = {
  isConfigured: isFirebaseConfigured,
  invalidKeys: invalidConfigKeys,
  missingKeys: missingConfigKeys,
};

if (!isFirebaseConfigured) {
  console.warn(
    "[Firebase Config] Variáveis ausentes ou inválidas:",
    invalidConfigKeys.join(", "),
  );
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

auth.useDeviceLanguage();
provider.addScope("email");
provider.addScope("profile");
provider.setCustomParameters({ prompt: "select_account" });

export const authReady = setPersistence(auth, browserLocalPersistence).catch(
  (error) => {
    console.error("[Firebase Auth Persistence]", error?.code, error?.message);
  },
);
