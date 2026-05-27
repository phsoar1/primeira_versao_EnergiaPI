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
import { db } from "./firebase";
import {
  DEVICES_SEED,
  MISSIONS_SEED,
  RANKING_ESCOLAS_SEED,
  SCHOOLS_SEED,
} from "../data/seedData";
import { normalizarUsoAparelho } from "../utils/calculations";
import { criarKeywords, normalizarBusca, pontuarBusca } from "../utils/search";

const RANKING_REFRESH_MS = 10 * 60 * 1000;
const RANKINGS_STORAGE_KEY = "energiapi:rankings-cache";

const cache = {
  schools: new Map(),
  devices: new Map(),
  rankings: new Map(),
};

const colecao = (nome) => collection(db, nome);

const dataDoc = (snapshot) => {
  const data = snapshot.data();
  return {
    ...data,
    id: data.id || snapshot.id,
    docId: snapshot.id,
  };
};

const normalizarTipoUsuario = (tipo) => {
  if (tipo === "morador") return "morador";
  if (tipo === "seduc" || tipo === "estudante") return "estudante";
  return "";
};

const escolaIdPareceSlug = (valor = "") =>
  /^ceti_[a-z0-9_]+$/i.test(String(valor).trim());

const ESCOLA_EM_VALIDACAO = "CETI em validação";

const escolasSeedPorId = new Map(
  SCHOOLS_SEED.map((school) => [school.id, school]),
);

const campoTextoValido = (valor = "") => {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  if (texto.toLowerCase() === "escola sem nome") return "";
  if (escolaIdPareceSlug(texto)) return "";
  return texto;
};

const nomeAPartirSlugEscola = (valor = "") => {
  const slug = String(valor || "").trim();
  if (!escolaIdPareceSlug(slug)) return "";
  return slug
    .replace(/^ceti_/i, "")
    .split("_")
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ")
    .replace(/^/, "CETI ");
};

const obterIdEscola = (school = {}) =>
  school.escolaId ||
  school.schoolId ||
  school.id ||
  school.docId ||
  school.slug ||
  "";

const obterNomeEscola = (school = {}) => {
  const camposPossiveis = [
    school.escolaNome,
    school.nomeEscola,
    school.schoolName,
    school.title,
    school.school,
    school.escola,
    school.nome,
    school.name,
    school.razaoSocial,
  ];

  const nomeDireto = camposPossiveis.map(campoTextoValido).find(Boolean);
  if (nomeDireto) return nomeDireto;

  const idEscola = obterIdEscola(school);
  const seed = escolasSeedPorId.get(idEscola);
  if (seed?.nome) return seed.nome;

  const nomeSlug = nomeAPartirSlugEscola(idEscola || camposPossiveis.find(Boolean));
  return nomeSlug || ESCOLA_EM_VALIDACAO;
};

const normalizarEscola = (school = {}) => {
  const gre = school.gre || school.GRE || "";
  const id = obterIdEscola(school);
  const nome = obterNomeEscola(school);
  const auditores = Number(
    school.auditores ??
      school.alunosAtivos ??
      school.totalAuditores ??
      school.studentsCount ??
      school.usersCount ??
      0,
  );
  const scoreTotal = Number(
    school.scoreTotal ??
      school.totalKwhSalvo ??
      school.totalScore ??
      school.score ??
      school.pontuacao ??
      school.pontos ??
      0,
  );
  return {
    ...school,
    id,
    nome,
    escolaNome: campoTextoValido(school.escolaNome) || nome,
    escola: campoTextoValido(school.escola) || campoTextoValido(school.school) || nome,
    gre,
    cidade: school.cidade || school.municipio || "",
    regiao: school.regiao || "",
    auditores,
    alunosAtivos: auditores,
    scoreTotal,
    totalKwhSalvo: scoreTotal,
  };
};

const normalizarListaEscolas = (lista = [], fallback = RANKING_ESCOLAS_SEED) => {
  const normalizadas = fallbackQuandoVazio(lista, fallback).map(normalizarEscola);
  const temNomesReais = normalizadas.some((school) => school.nome !== ESCOLA_EM_VALIDACAO);
  return temNomesReais ? normalizadas : fallback.map(normalizarEscola);
};

const ordenarRankingEscolas = (lista = []) =>
  [...lista].sort((a, b) => {
    const scoreDelta = Number(b.scoreTotal || b.totalKwhSalvo || 0) - Number(a.scoreTotal || a.totalKwhSalvo || 0);
    if (scoreDelta) return scoreDelta;
    const auditoresDelta = Number(b.auditores || b.alunosAtivos || 0) - Number(a.auditores || a.alunosAtivos || 0);
    if (auditoresDelta) return auditoresDelta;
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  });

const normalizarRankingComunidade = (perfil = {}) => {
  const score = Number(perfil.score || perfil.pontuacao || 0);
  return {
    ...perfil,
    nome: perfil.nome || "Participante EnergiaPI",
    perfil: perfil.perfil || (perfil.tipoUsuario === "morador" ? "Morador" : "Estudante"),
    escola:
      perfil.escola ||
      perfil.escolaNome ||
      (perfil.tipoUsuario === "morador" ? "Comunidade" : "CETI em validação"),
    pontuacao: score,
    score,
    kwhSalvo: Number(perfil.kwhSalvo || 0),
    badges: perfil.badges || gerarBadgesPontuacao(score),
  };
};

const ordenarRankingComunidade = (lista = []) =>
  [...lista].sort((a, b) => {
    const scoreDelta = Number(b.score || b.pontuacao || 0) - Number(a.score || a.pontuacao || 0);
    if (scoreDelta) return scoreDelta;
    const kwhDelta = Number(b.kwhSalvo || 0) - Number(a.kwhSalvo || 0);
    if (kwhDelta) return kwhDelta;
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  });

const normalizarMissoes = (missions = []) =>
  missions.map((mission, index) => {
    if (index > 1) return mission;
    return {
      ...mission,
      pontos: 50,
      scoreNecessario: 0,
      bloqueada: false,
    };
  });

const MOJIBAKE_EMOJI_REGEX = /[\u00C2\u00C3\u00E2\u00F0\uFFFD]/;

const normalizarEmojiVisual = (valor, fallback = "\u26A1") => {
  const emoji = String(valor || "").trim();
  return !emoji || MOJIBAKE_EMOJI_REGEX.test(emoji) ? fallback : emoji;
};

const regrasIconesAparelhos = [
  { termos: ["ar-condicionado", "ar condicionado", "climatizador"], emoji: "\u2744\uFE0F" },
  { termos: ["geladeira", "freezer"], emoji: "\u{1F9CA}" },
  { termos: ["chuveiro"], emoji: "\u{1F6BF}" },
  { termos: ["televisor", "televisao", "tv"], emoji: "\u{1F4FA}" },
  { termos: ["ventilador"], emoji: "\u{1F300}" },
  { termos: ["maquina de lavar", "lavadora", "lavar roupas"], emoji: "\u{1F9FA}" },
  { termos: ["micro ondas", "microondas", "forno micro"], emoji: "\u{1F37D}\uFE0F" },
  { termos: ["computador", "desktop"], emoji: "\u{1F5A5}\uFE0F" },
  { termos: ["notebook"], emoji: "\u{1F4BB}" },
  { termos: ["ferro de passar"], emoji: "\u{1F50C}" },
  { termos: ["lampada", "luminaria"], emoji: "\u{1F4A1}" },
  { termos: ["forno eletrico", "air fryer"], emoji: "\u{1F525}" },
  { termos: ["roteador", "wi fi", "wifi"], emoji: "\u{1F4F6}" },
  { termos: ["camera"], emoji: "\u{1F4F9}" },
  { termos: ["bomba d agua", "bomba dagua", "bomba de agua"], emoji: "\u{1F4A7}" },
  { termos: ["liquidificador"], emoji: "\u{1F964}" },
  { termos: ["aspirador"], emoji: "\u{1F9F9}" },
];

const normalizarEmojiAparelho = (device = {}) => {
  const nome = normalizarBusca(device.nome || "");
  const regra = regrasIconesAparelhos.find(({ termos }) =>
    termos.some((termo) => nome.includes(termo)),
  );
  if (regra) return regra.emoji;
  return normalizarEmojiVisual(device.emoji || device.icone);
};

const normalizarAparelhoCatalogo = (device = {}) => {
  const emoji = normalizarEmojiAparelho(device);
  return {
    ...device,
    emoji,
    icone: emoji,
  };
};

const normalizarPerfilUsuario = (perfil = {}, uidFallback = "") => {
  const tipoUsuario = normalizarTipoUsuario(perfil.tipoUsuario);
  const onboardingCompleto =
    perfil.onboardingCompleto ?? Boolean(tipoUsuario);
  const gre = perfil.gre || perfil.GRE || "";

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
    gre: tipoUsuario === "estudante" ? gre : "",
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
    nome: perfil.nome || "Participante EnergiaPI",
    perfil: tipoUsuario === "morador" ? "Morador" : "Estudante",
    tipoUsuario,
    escolaId: tipoUsuario === "estudante" ? perfil.escolaId || "" : "",
    escola:
      tipoUsuario === "estudante"
        ? perfil.escolaNome || "CETI em validação"
        : "Comunidade",
    escolaNome: tipoUsuario === "estudante" ? perfil.escolaNome || "" : "",
    gre: tipoUsuario === "estudante" ? perfil.gre || perfil.GRE || "" : "",
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
    nome: perfil.nome || firebaseUser.displayName || "Participante EnergiaPI",
    email: (perfil.email || firebaseUser.email || "").toLowerCase(),
    tipoUsuario,
    authProvider: perfil.authProvider || "password",
    onboardingCompleto: Boolean(perfil.onboardingCompleto),
    escolaId: estudante ? perfil.escolaId || "" : "",
    escolaNome: estudante ? perfil.escolaNome || perfil.escola || "" : "",
    gre: estudante ? perfil.gre || perfil.GRE || "" : "",
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
  nome: perfil.nome || firebaseUser.displayName || "Participante EnergiaPI",
  email: (perfil.email || firebaseUser.email || "").toLowerCase(),
  authProvider: perfil.authProvider || "google",
  tipoUsuario: "",
  onboardingCompleto: false,
  escolaId: "",
  escolaNome: "",
  gre: "",
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
    const schoolRef = mudouParaEstudante
      ? doc(db, "schools", payload.escolaId)
      : null;
    const schoolSnap = schoolRef ? await transaction.get(schoolRef) : null;

    transaction.set(
      userRef,
      {
        ...payload,
        ...(userSnap.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true },
    );

    transaction.set(communityRef, montarCommunityProfile(payload), { merge: true });

    if (mudouParaEstudante && schoolSnap?.exists()) {
      transaction.update(
        schoolRef,
        {
          auditores: increment(1),
          scoreTotal: increment(0),
          impactoKwhTotal: increment(0),
          updatedAt: serverTimestamp(),
        },
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
    const schoolRef =
      atual.tipoUsuario === "estudante" && atual.escolaId
        ? doc(db, "schools", atual.escolaId)
        : null;
    const schoolSnap = schoolRef ? await transaction.get(schoolRef) : null;
    const novoScore = Number(atual.score || 0) + pontosNumericos;
    const novoKwh = Number(atual.kwhSalvo || 0) + impactoKwh;
    const patch = {
      tipoUsuario: atual.tipoUsuario,
      onboardingCompleto: true,
      escolaId: atual.escolaId || "",
      escolaNome: atual.escolaNome || "",
      gre: atual.gre || atual.GRE || "",
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

    if (schoolSnap?.exists()) {
      transaction.update(
        schoolRef,
        {
          auditores: increment(0),
          scoreTotal: increment(pontosNumericos),
          impactoKwhTotal: increment(impactoKwh),
          updatedAt: serverTimestamp(),
        },
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
    let lista = normalizarListaEscolas(
      snapshot.docs.map(dataDoc),
      SCHOOLS_SEED,
    );

    if (termoNormalizado) {
      lista = ordenarPorScoreBusca(lista, termoNormalizado, [
        "nome",
        "gre",
        "cidade",
        "regiao",
      ]);
    }

    return cacheSet(cache.schools, chave, lista.slice(0, max));
  } catch (error) {
    console.warn("[Firestore schools search fallback]", error?.message);
    let lista = normalizarListaEscolas(SCHOOLS_SEED, SCHOOLS_SEED);
    if (termoNormalizado) {
      lista = ordenarPorScoreBusca(lista, termoNormalizado, [
        "nome",
        "gre",
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
    let lista = fallbackQuandoVazio(snapshot.docs.map(dataDoc), DEVICES_SEED).map(
      normalizarAparelhoCatalogo,
    );

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
    let lista = DEVICES_SEED.map(normalizarAparelhoCatalogo);
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
      callback(
        snapshot.docs.map((item) =>
          normalizarAparelhoCatalogo(normalizarUsoAparelho(dataDoc(item))),
        ),
      );
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
    emoji: normalizarEmojiAparelho(device),
    icone: normalizarEmojiAparelho(device),
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
  const payload = normalizarAparelhoCatalogo(
    normalizarUsoAparelho({ ...atual, ...patch }),
  );

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
      callback(
        normalizarMissoes(
          fallbackQuandoVazio(snapshot.docs.map(dataDoc), MISSIONS_SEED),
        ),
      );
    },
    (error) => {
      console.warn("[Firestore missions fallback]", error?.message);
      callback(normalizarMissoes(MISSIONS_SEED));
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
    getDocs(colecao("schools")),
  );
  return ordenarRankingEscolas(
    normalizarListaEscolas(snapshot.docs.map(dataDoc), RANKING_ESCOLAS_SEED),
  );
};

const listarRankingComunidade = async () => {
  const snapshot = await withTimeout(
    getDocs(colecao("community")),
  );
  return ordenarRankingComunidade(
    fallbackQuandoVazio(
      snapshot.docs.map((item) => normalizarRankingComunidade(dataDoc(item))),
      [],
    ),
  );
};

export const subscribeRankings = (callback) => {
  let ativo = true;
  const cached =
    cacheGet(cache.rankings, "last") || lerRankingsCache();
  const state = {
    escolas: cached?.escolas
      ? ordenarRankingEscolas(normalizarListaEscolas(cached.escolas, RANKING_ESCOLAS_SEED))
      : null,
    comunidade: cached?.comunidade
      ? ordenarRankingComunidade(cached.comunidade.map(normalizarRankingComunidade))
      : null,
  };

  if (cached) {
    callback({
      ...cached,
      escolas: state.escolas || [],
      comunidade: state.comunidade || [],
      fromCache: true,
    });
  }

  const emitir = (extra = {}) => {
    if (!ativo) return;
    const payload = {
      escolas: state.escolas || normalizarListaEscolas(RANKING_ESCOLAS_SEED, RANKING_ESCOLAS_SEED),
      comunidade: state.comunidade || [],
      lastUpdated: new Date().toISOString(),
      fromCache: false,
      ...extra,
    };
    cacheSet(cache.rankings, "last", payload);
    salvarRankingsCache(payload);
    callback(payload);
  };

  const unsubscribeEscolas = onSnapshot(
    colecao("schools"),
    (snapshot) => {
      state.escolas = ordenarRankingEscolas(
        normalizarListaEscolas(snapshot.docs.map(dataDoc), RANKING_ESCOLAS_SEED),
      );
      emitir();
    },
    (error) => {
      console.warn("[Firestore schools ranking fallback]", error?.message);
      state.escolas =
        state.escolas ||
        normalizarListaEscolas(cached?.escolas || [], RANKING_ESCOLAS_SEED);
      emitir({
        error: error?.message || "schools-ranking-unavailable",
        fromCache: Boolean(cached),
      });
    },
  );

  const unsubscribeComunidade = onSnapshot(
    colecao("community"),
    (snapshot) => {
      state.comunidade = ordenarRankingComunidade(
        fallbackQuandoVazio(
          snapshot.docs.map((item) => normalizarRankingComunidade(dataDoc(item))),
          [],
        ),
      );
      emitir();
    },
    (error) => {
      console.warn("[Firestore community ranking fallback]", error?.message);
      state.comunidade = state.comunidade || cached?.comunidade || [];
      emitir({
        error: error?.message || "community-ranking-unavailable",
        fromCache: Boolean(cached),
      });
    },
  );

  Promise.allSettled([listarRankingEscolas(), listarRankingComunidade()]).then(
    (results) => {
      if (!ativo) return;
      const [escolasResult, comunidadeResult] = results;
      if (escolasResult.status === "fulfilled") state.escolas = escolasResult.value;
      if (comunidadeResult.status === "fulfilled") {
        state.comunidade = comunidadeResult.value;
      }
      if (
        escolasResult.status === "fulfilled" ||
        comunidadeResult.status === "fulfilled"
      ) {
        emitir();
      }
    }
  );

  return () => {
    ativo = false;
    unsubscribeEscolas();
    unsubscribeComunidade();
  };
};

export const normalizeSchoolForImport = (school) => {
  const nome = obterNomeEscola(school);
  const gre = school.gre || school.GRE || "";
  const cidade = school.cidade || school.municipio || "";
  const regiao = school.regiao || "";
  return {
    id: obterIdEscola(school) || criarKeywords(nome)[0]?.replace(/\s+/g, "_"),
    nome,
    gre,
    cidade,
    regiao,
    tipo: school.tipo || "CETI",
    auditores: Number(
      school.auditores ??
        school.alunosAtivos ??
        school.totalAuditores ??
        school.studentsCount ??
        school.usersCount ??
        0,
    ),
    scoreTotal: Number(
      school.scoreTotal ??
        school.totalKwhSalvo ??
        school.totalScore ??
        school.score ??
        school.pontuacao ??
        school.pontos ??
        0,
    ),
    keywords:
      school.keywords ||
      criarKeywords(nome, nome.replace(/^CETI\s+/i, ""), gre, cidade, regiao),
  };
};

export const incrementRankingSchool = async () => {};
