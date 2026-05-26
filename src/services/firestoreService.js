import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  DEVICES_SEED,
  MISSIONS_SEED,
  RANKING_ESCOLAS_SEED,
  SCHOOLS_SEED,
} from "../data/seedData";
import { normalizarUsoAparelho } from "../utils/energyCalculations";
import { criarKeywords, normalizarBusca, pontuarBusca } from "../utils/text";

const RANKING_REFRESH_MS = 10 * 60 * 1000;
const RANKINGS_STORAGE_KEY = "energiapi:rankings-cache";

const cache = {
  schools: new Map(),
  devices: new Map(),
  rankings: new Map(),
};

const colecao = (nome) => collection(db, nome);

const dataDoc = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
});

const normalizarTipoUsuario = (tipo) => {
  if (tipo === "morador") return "morador";
  if (tipo === "seduc" || tipo === "estudante") return "estudante";
  return "";
};

const normalizarEscola = (school = {}) => {
  const GRE = school.GRE || school.gre || "";
  const nome =
    school.nome ||
    school.name ||
    school.escolaNome ||
    school.escola ||
    school.razaoSocial ||
    "CETI EnergiaPI";
  return {
    ...school,
    nome,
    GRE,
    gre: GRE,
    cidade: school.cidade || school.municipio || "",
    regiao: school.regiao || "",
    auditores: Number(school.auditores || school.alunosAtivos || 0),
    alunosAtivos: Number(school.auditores || school.alunosAtivos || 0),
    scoreTotal: Number(school.scoreTotal || school.totalKwhSalvo || 0),
    totalKwhSalvo: Number(school.scoreTotal || school.totalKwhSalvo || 0),
  };
};

const normalizarPerfilUsuario = (perfil = {}, uidFallback = "") => {
  const tipoUsuario = normalizarTipoUsuario(perfil.tipoUsuario);
  const onboardingCompleto =
    perfil.onboardingCompleto ?? Boolean(tipoUsuario);
  const GRE = perfil.GRE || perfil.gre || "";

  return {
    ...perfil,
    uid: perfil.uid || uidFallback,
    tipoUsuario,
    perfil:
      tipoUsuario === "morador"
        ? "morador"
        : tipoUsuario === "estudante"
          ? "estudante"
          : "",
    onboardingCompleto: Boolean(onboardingCompleto),
    escolaId: tipoUsuario === "estudante" ? perfil.escolaId || "" : "",
    escolaNome: tipoUsuario === "estudante" ? perfil.escolaNome || "" : "",
    GRE: tipoUsuario === "estudante" ? GRE : "",
    gre: tipoUsuario === "estudante" ? GRE : "",
    endereco: perfil.endereco || "",
    numero: perfil.numero || "",
    cidade: perfil.cidade || "",
    bairro: perfil.bairro || "",
    estado: perfil.estado || "",
    cep: perfil.cep || "",
    score: Number(perfil.score || 0),
    kwhSalvo: Number(perfil.kwhSalvo || 0),
  };
};

const ordenarPorScoreBusca = (lista, termo, campos) =>
  lista
    .map((item) => ({ item, score: pontuarBusca(item, termo, campos) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.nome.localeCompare(b.item.nome))
    .map(({ item }) => item);

const fallbackQuandoVazio = (lista, fallback) => (lista.length ? lista : fallback);

const cacheGet = (mapa, chave) => {
  const registro = mapa.get(chave);
  if (!registro) return null;
  if (Date.now() - registro.createdAt > RANKING_REFRESH_MS) {
    mapa.delete(chave);
    return null;
  }
  return registro.value;
};

const cacheSet = (mapa, chave, value) => {
  mapa.set(chave, { createdAt: Date.now(), value });
  return value;
};

const lerRankingsCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(RANKINGS_STORAGE_KEY));
    if (!cached?.lastUpdated) return null;
    if (Date.now() - new Date(cached.lastUpdated).getTime() > RANKING_REFRESH_MS) {
      return null;
    }
    return cached;
  } catch {
    return null;
  }
};

const salvarRankingsCache = (rankings) => {
  try {
    localStorage.setItem(RANKINGS_STORAGE_KEY, JSON.stringify(rankings));
  } catch {
    // Cache local é apenas otimização de UX.
  }
};

const withTimeout = (promise, timeoutMs = 4500) =>
  new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error("Firestore request timeout"));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => globalThis.clearTimeout(timer));
  });

const gerarBadgesPontuacao = (score = 0) => {
  const pontos = Number(score || 0);
  const badges = ["🌱"];
  if (pontos >= 100) badges.push("⚡");
  if (pontos >= 250) badges.push("💰");
  if (pontos >= 500) badges.push("🌍");
  if (pontos >= 900) badges.push("🏆");
  return badges;
};

const montarCommunityProfile = (perfil) => {
  const tipoUsuario = normalizarTipoUsuario(perfil.tipoUsuario);
  const score = Number(perfil.score || 0);

  return {
    uid: perfil.uid,
    nome: perfil.nome || "Auditor EnergiaPI",
    perfil: tipoUsuario === "morador" ? "Morador" : "Estudante",
    tipoUsuario,
    escolaId: tipoUsuario === "estudante" ? perfil.escolaId || "" : "",
    escola: tipoUsuario === "estudante" ? perfil.escolaNome || "CETI" : "Comunidade",
    escolaNome: tipoUsuario === "estudante" ? perfil.escolaNome || "" : "",
    GRE: tipoUsuario === "estudante" ? perfil.GRE || perfil.gre || "" : "",
    pontuacao: score,
    score,
    kwhSalvo: Number(perfil.kwhSalvo || 0),
    badges: perfil.badges || gerarBadgesPontuacao(score),
    updatedAt: serverTimestamp(),
  };
};

export const montarUserProfile = (firebaseUser, perfil = {}) => {
  const tipoUsuario = normalizarTipoUsuario(perfil.tipoUsuario || perfil.perfil);
  const estudante = tipoUsuario === "estudante";
  const score = Number(perfil.score ?? 0);

  return {
    uid: firebaseUser.uid,
    nome: perfil.nome || firebaseUser.displayName || "Auditor EnergiaPI",
    email: (perfil.email || firebaseUser.email || "").toLowerCase(),
    tipoUsuario,
    authProvider: perfil.authProvider || "password",
    onboardingCompleto: Boolean(perfil.onboardingCompleto),
    escolaId: estudante ? perfil.escolaId || "" : "",
    escolaNome: estudante ? perfil.escolaNome || perfil.escola || "" : "",
    GRE: estudante ? perfil.GRE || perfil.gre || "" : "",
    endereco: perfil.endereco || "",
    numero: perfil.numero || "",
    cidade: perfil.cidade || "",
    bairro: perfil.bairro || "",
    estado: perfil.estado || "",
    cep: perfil.cep || "",
    score,
    kwhSalvo: Number(perfil.kwhSalvo || 0),
    badges: perfil.badges || gerarBadgesPontuacao(score),
    updatedAt: serverTimestamp(),
  };
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const snap = await withTimeout(getDoc(doc(db, "users", uid)));
  return snap.exists() ? normalizarPerfilUsuario(dataDoc(snap), uid) : null;
};

const montarPendingUserProfile = (firebaseUser, perfil = {}) => ({
  uid: firebaseUser.uid,
  nome: perfil.nome || firebaseUser.displayName || "Auditor EnergiaPI",
  email: (perfil.email || firebaseUser.email || "").toLowerCase(),
  authProvider: perfil.authProvider || "google",
  tipoUsuario: "",
  onboardingCompleto: false,
  escolaId: "",
  escolaNome: "",
  GRE: "",
  endereco: "",
  numero: "",
  cidade: "",
  bairro: "",
  estado: "",
  cep: "",
  score: 0,
  kwhSalvo: 0,
  badges: gerarBadgesPontuacao(0),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

export const ensureUserDocument = async (firebaseUser, perfil = {}) => {
  if (!firebaseUser?.uid) return null;

  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await withTimeout(getDoc(ref));

  if (snap.exists()) {
    return normalizarPerfilUsuario(dataDoc(snap), firebaseUser.uid);
  }

  if (perfil?.onboardingCompleto) {
    return completeUserOnboarding(firebaseUser, perfil);
  }

  const pendingProfile = montarPendingUserProfile(firebaseUser, perfil);
  await setDoc(ref, pendingProfile, { merge: true });
  return normalizarPerfilUsuario(pendingProfile, firebaseUser.uid);
};

export const completeUserOnboarding = async (firebaseUser, perfil) => {
  if (!firebaseUser?.uid) return null;

  const userRef = doc(db, "users", firebaseUser.uid);
  const communityRef = doc(db, "community", firebaseUser.uid);
  const payload = montarUserProfile(firebaseUser, {
    ...perfil,
    onboardingCompleto: true,
  });

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const anterior = userSnap.exists()
      ? normalizarPerfilUsuario(userSnap.data(), firebaseUser.uid)
      : null;
    const mudouParaEstudante =
      payload.tipoUsuario === "estudante" &&
      payload.escolaId &&
      (!anterior?.onboardingCompleto || anterior.escolaId !== payload.escolaId);

    transaction.set(
      userRef,
      {
        ...payload,
        ...(userSnap.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true },
    );

    transaction.set(communityRef, montarCommunityProfile(payload), { merge: true });

    if (mudouParaEstudante) {
      transaction.set(
        doc(db, "schools", payload.escolaId),
        {
          auditores: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  });

  return normalizarPerfilUsuario(payload, firebaseUser.uid);
};

export const saveUserProfile = async (firebaseUser, perfil) =>
  completeUserOnboarding(firebaseUser, perfil);

export const subscribeUserDocument = (uid, callback, onError) => {
  if (!uid) return () => {};

  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      callback(
        snapshot.exists() ? normalizarPerfilUsuario(dataDoc(snapshot), uid) : null,
      );
    },
    (error) => {
      console.warn("[Firestore user profile listener]", error?.message);
      onError?.(error);
    },
  );
};

export const addUserScore = async (uid, pontos, options = {}) => {
  if (!uid || !Number.isFinite(Number(pontos))) return;

  const pontosNumericos = Math.max(Number(pontos) || 0, 0);
  const impactoKwh = Math.max(Number(options.impactoKwh || 0), 0);
  const userRef = doc(db, "users", uid);
  const communityRef = doc(db, "community", uid);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    if (!snap.exists()) return;

    const atual = normalizarPerfilUsuario(snap.data(), uid);
    const novoScore = Number(atual.score || 0) + pontosNumericos;
    const novoKwh = Number(atual.kwhSalvo || 0) + impactoKwh;
    const patch = {
      tipoUsuario: atual.tipoUsuario,
      onboardingCompleto: true,
      escolaId: atual.escolaId || "",
      escolaNome: atual.escolaNome || "",
      GRE: atual.GRE || "",
      endereco: atual.endereco || "",
      numero: atual.numero || "",
      cidade: atual.cidade || "",
      bairro: atual.bairro || "",
      estado: atual.estado || "",
      cep: atual.cep || "",
      score: novoScore,
      kwhSalvo: novoKwh,
      badges: gerarBadgesPontuacao(novoScore),
      updatedAt: serverTimestamp(),
    };

    transaction.set(userRef, patch, { merge: true });

    if (atual.tipoUsuario === "estudante" && atual.escolaId) {
      transaction.set(
        doc(db, "schools", atual.escolaId),
        {
          scoreTotal: increment(pontosNumericos),
          impactoKwhTotal: increment(impactoKwh),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    transaction.set(
      communityRef,
      montarCommunityProfile({
        ...atual,
        ...patch,
        score: novoScore,
        kwhSalvo: novoKwh,
      }),
      { merge: true },
    );
  });
};

export const searchSchools = async ({ termo = "", max = 8 } = {}) => {
  const chave = `${normalizarBusca(termo)}:${max}`;
  const cached = cacheGet(cache.schools, chave);
  if (cached) return cached;

  const termoNormalizado = normalizarBusca(termo);
  const constraints = [];

  if (termoNormalizado) {
    constraints.push(where("keywords", "array-contains", termoNormalizado));
  } else {
    constraints.push(orderBy("nome"));
  }

  constraints.push(limit(max));

  try {
    const snapshot = await withTimeout(
      getDocs(query(colecao("schools"), ...constraints)),
    );
    let lista = fallbackQuandoVazio(
      snapshot.docs.map((item) => normalizarEscola(dataDoc(item))),
      SCHOOLS_SEED.map(normalizarEscola),
    );

    if (termoNormalizado) {
      lista = ordenarPorScoreBusca(lista, termoNormalizado, [
        "nome",
        "GRE",
        "cidade",
        "regiao",
      ]);
    }

    return cacheSet(cache.schools, chave, lista.slice(0, max));
  } catch (error) {
    console.warn("[Firestore schools search fallback]", error?.message);
    let lista = SCHOOLS_SEED.map(normalizarEscola);
    if (termoNormalizado) {
      lista = ordenarPorScoreBusca(lista, termoNormalizado, [
        "nome",
        "GRE",
        "cidade",
        "regiao",
      ]);
    }
    return lista.slice(0, max);
  }
};

export const searchDevices = async ({
  termo = "",
  categoria = "",
  max = 12,
} = {}) => {
  const chave = `${normalizarBusca(termo)}:${categoria || "todas"}:${max}`;
  const cached = cacheGet(cache.devices, chave);
  if (cached) return cached;

  const termoNormalizado = normalizarBusca(termo);
  const constraints = [];

  if (termoNormalizado) {
    constraints.push(where("keywords", "array-contains", termoNormalizado));
  } else {
    constraints.push(orderBy("nome"));
  }

  if (categoria) constraints.push(where("categoria", "==", categoria));
  constraints.push(limit(max));

  try {
    const snapshot = await withTimeout(
      getDocs(query(colecao("devices"), ...constraints)),
    );
    let lista = fallbackQuandoVazio(snapshot.docs.map(dataDoc), DEVICES_SEED);

    if (categoria) lista = lista.filter((device) => device.categoria === categoria);
    if (termoNormalizado) {
      lista = ordenarPorScoreBusca(lista, termoNormalizado, [
        "nome",
        "categoria",
      ]);
    }

    return cacheSet(cache.devices, chave, lista.slice(0, max));
  } catch (error) {
    console.warn("[Firestore devices search fallback]", error?.message);
    let lista = DEVICES_SEED;
    if (categoria) lista = lista.filter((device) => device.categoria === categoria);
    if (termoNormalizado) {
      lista = ordenarPorScoreBusca(lista, termoNormalizado, [
        "nome",
        "categoria",
      ]);
    }
    return lista.slice(0, max);
  }
};

export const subscribeUserDevices = (uid, callback) => {
  if (!uid) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, "users", uid, "devices"), orderBy("createdAt", "desc")),
    (snapshot) => {
      callback(snapshot.docs.map((item) => normalizarUsoAparelho(dataDoc(item))));
    },
    (error) => {
      console.warn("[Firestore user devices fallback]", error?.message);
      callback([]);
    },
  );
};

export const addUserDevice = async (uid, device) => {
  if (!uid) return null;

  const payload = normalizarUsoAparelho({
    deviceId: device.deviceId || device.id || "",
    nome: device.nome,
    emoji: device.emoji || device.icone || "⚡",
    icone: device.emoji || device.icone || "⚡",
    categoria: device.categoria || "Tecnologia",
    potencia: Number(device.potencia || 0),
    quantidade: Number(device.quantidade || 1),
    diasPorSemana: Number(device.diasPorSemana || 7),
    usoHorasDia: Number(device.usoHorasDia ?? device.horasDia ?? 1),
    ativo: true,
  });

  const ref = await addDoc(collection(db, "users", uid, "devices"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addUserScore(uid, 5);
  return ref.id;
};

export const updateUserDevice = async (uid, id, patch) => {
  if (!uid || !id) return;

  const ref = doc(db, "users", uid, "devices", id);
  const snap = await getDoc(ref);
  const atual = snap.exists() ? snap.data() : {};
  const payload = normalizarUsoAparelho({ ...atual, ...patch });

  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const removeUserDevice = async (uid, id) => {
  if (!uid || !id) return;
  await deleteDoc(doc(db, "users", uid, "devices", id));
};

export const subscribeMissions = (callback) =>
  onSnapshot(
    query(colecao("missions"), orderBy("ordem", "asc"), limit(80)),
    (snapshot) => {
      callback(fallbackQuandoVazio(snapshot.docs.map(dataDoc), MISSIONS_SEED));
    },
    (error) => {
      console.warn("[Firestore missions fallback]", error?.message);
      callback(MISSIONS_SEED);
    },
  );

export const subscribeUserMissionProgress = (uid, callback) => {
  if (!uid) {
    callback({});
    return () => {};
  }

  return onSnapshot(
    collection(db, "users", uid, "missions"),
    (snapshot) => {
      const progress = {};
      snapshot.docs.forEach((item) => {
        progress[item.id] = item.data();
      });
      callback(progress);
    },
    (error) => {
      console.warn("[Firestore missions progress fallback]", error?.message);
      callback({});
    },
  );
};

export const setUserMissionProgress = async (uid, missionId, patch) => {
  if (!uid || !missionId) return;
  await setDoc(
    doc(db, "users", uid, "missions", missionId),
    {
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

const listarRankingEscolas = async () => {
  const snapshot = await withTimeout(
    getDocs(query(colecao("schools"), orderBy("scoreTotal", "desc"), limit(50))),
  );
  return fallbackQuandoVazio(
    snapshot.docs.map((item) => normalizarEscola(dataDoc(item))),
    RANKING_ESCOLAS_SEED.map(normalizarEscola),
  );
};

const listarRankingComunidade = async () => {
  const snapshot = await withTimeout(
    getDocs(query(colecao("community"), orderBy("score", "desc"), limit(50))),
  );
  return fallbackQuandoVazio(
    snapshot.docs.map((item) => {
      const dados = dataDoc(item);
      return {
        ...dados,
        pontuacao: Number(dados.score || dados.pontuacao || 0),
        score: Number(dados.score || dados.pontuacao || 0),
        kwhSalvo: Number(dados.kwhSalvo || 0),
        badges: dados.badges || gerarBadgesPontuacao(dados.score || dados.pontuacao),
      };
    }),
    [],
  );
};

export const subscribeRankings = (callback, options = {}) => {
  let ativo = true;
  const intervalMs = options.intervalMs || RANKING_REFRESH_MS;
  const cached =
    cacheGet(cache.rankings, "last") || lerRankingsCache();

  if (cached) {
    callback({
      ...cached,
      fromCache: true,
    });
  }

  const carregar = async () => {
    try {
      const [escolas, comunidade] = await Promise.all([
        listarRankingEscolas(),
        listarRankingComunidade(),
      ]);

      if (ativo) {
        const payload = {
          escolas,
          comunidade,
          lastUpdated: new Date().toISOString(),
          fromCache: false,
        };
        cacheSet(cache.rankings, "last", payload);
        salvarRankingsCache(payload);
        callback(payload);
      }
    } catch (error) {
      console.warn("[Firestore rankings fallback]", error?.message);
      if (ativo) {
        const fallback = cacheGet(cache.rankings, "last") || lerRankingsCache();
        callback({
          escolas: fallback?.escolas || RANKING_ESCOLAS_SEED.map(normalizarEscola),
          comunidade: fallback?.comunidade || [],
          error: error?.message || "ranking-unavailable",
          fromCache: Boolean(fallback),
          lastUpdated: new Date().toISOString(),
        });
      }
    }
  };

  carregar();
  const timer = window.setInterval(carregar, intervalMs);

  return () => {
    ativo = false;
    window.clearInterval(timer);
  };
};

export const normalizeSchoolForImport = (school) => {
  const nome = String(school.nome || school.name || "").trim();
  const GRE = school.GRE || school.gre || "";
  return {
    id: school.id || criarKeywords(nome)[0]?.replace(/\s+/g, "_"),
    nome,
    GRE,
    cidade: school.cidade || "",
    regiao: school.regiao || "",
    tipo: school.tipo || "CETI",
    auditores: Number(school.auditores || 0),
    scoreTotal: Number(school.scoreTotal || 0),
    keywords:
      school.keywords ||
      criarKeywords(nome, nome.replace(/^CETI\s+/i, ""), GRE, school.cidade, school.regiao),
  };
};

export const incrementRankingSchool = async () => {};
