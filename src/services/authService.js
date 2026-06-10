import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, authReady, provider } from "./firebase";

const PERFIS_STORAGE_KEY = "energiapi:firebase-user-profiles";
const POPUP_TIMEOUT_MS = 45000;

export const criarErroFluxo = (code, message) =>
  Object.assign(new Error(message), { code });

export const aguardarPopup = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(
          criarErroFluxo(
            "auth/popup-timeout",
            "A janela do Google demorou para responder.",
          ),
        );
      }, POPUP_TIMEOUT_MS);
    }),
  ]);

export const lerPerfisSalvos = () => {
  try {
    return JSON.parse(localStorage.getItem(PERFIS_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

export const salvarPerfilUsuario = (uid, perfilUsuario) => {
  if (!uid) return;
  const perfis = lerPerfisSalvos();
  localStorage.setItem(
    PERFIS_STORAGE_KEY,
    JSON.stringify({
      ...perfis,
      [uid]: perfilUsuario,
    }),
  );
};

export const detectarAuthProvider = (firebaseUser, perfil = {}) => {
  if (perfil.authProvider === "google" || perfil.provider === "google") {
    return "google";
  }

  if (perfil.authProvider === "password" || perfil.provider === "password") {
    return "password";
  }

  return firebaseUser?.providerData?.some(
    (providerInfo) => providerInfo.providerId === "google.com",
  )
    ? "google"
    : "password";
};

export const registrarErroAuth = (contexto, error) => {
  console.error(
    `[Firebase Auth] ${contexto}`,
    error?.code,
    error?.message,
    error,
  );
};

export const traduzirErroFirebase = (error) => {
  const mensagens = {
    "auth/email-already-in-use":
      "Este email já está cadastrado. Tente fazer login.",
    "auth/invalid-email": "Informe um email válido.",
    "auth/invalid-credential": "Email ou senha inválidos.",
    "auth/popup-closed-by-user": "Login com Google cancelado antes da conclusão.",
    "auth/popup-blocked":
      "O navegador bloqueou a janela do Google. Autorize popups ou tente novamente.",
    "auth/cancelled-popup-request":
      "Já existe uma tentativa de login com Google em andamento.",
    "auth/unauthorized-domain": "Este domínio não está autorizado para login.",
    "auth/too-many-requests":
      "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
    "auth/popup-timeout":
      "A janela do Google demorou para responder. Tente novamente.",
    "auth/operation-not-supported-in-this-environment":
      "Este navegador bloqueou o popup. Vamos tentar por redirecionamento.",
    "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
    "auth/network-request-failed":
      "A conexão falhou. Verifique a internet e tente novamente.",
  };

  return mensagens[error?.code] || "Não foi possível autenticar agora. Tente novamente.";
};

export const loginWithEmail = async (email, senha) => {
  await authReady;
  return signInWithEmailAndPassword(auth, email, senha);
};

export const createAccountWithEmail = async ({ email, senha, nome }) => {
  await authReady;
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  if (nome) await updateProfile(credencial.user, { displayName: nome });
  return credencial;
};

export const loginWithGooglePopup = async () => {
  await authReady;
  return aguardarPopup(signInWithPopup(auth, provider));
};

export const loginWithGoogleRedirect = async () => {
  await authReady;
  return signInWithRedirect(auth, provider);
};

export const resolveGoogleRedirect = async () => {
  await authReady;
  return getRedirectResult(auth);
};

export const subscribeAuthState = (next, onError) =>
  onAuthStateChanged(auth, next, onError);

export const logoutFirebase = async () => {
  await authReady;
  return signOut(auth);
};

export const getCurrentFirebaseUser = async () => {
  await authReady;
  return auth.currentUser;
};
