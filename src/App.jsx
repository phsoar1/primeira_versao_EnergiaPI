import { useCallback, useMemo, useState, useEffect, useRef } from "react";
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
import {
  LogOut,
  Plus,
  Trash2,
  TrendingDown,
  Award,
  Target,
  Lightbulb,
  Menu,
  X,
  Zap,
  CheckCircle,
  AlertTriangle,
  Users,
  ChevronRight,
  Sparkles,
  School,
  Moon,
  Sun,
  MapPin,
  ZapOff,
  Search,
  Trophy,
  Eye,
} from "lucide-react";
import twemoji from "@twemoji/api";
import {
  auth,
  authReady,
  firebaseConfigStatus,
  isFirebaseConfigured,
  provider,
} from "./firebase";
import OnboardingGate from "./components/onboarding/OnboardingGate";
import SchoolSearchPicker from "./components/schools/SchoolSearchPicker";
import { CATEGORIAS_APARELHOS } from "./data/seedData";
import { useDeviceCatalogSearch } from "./hooks/useCatalogSearch";
import { useMissions } from "./hooks/useMissions";
import { useRankings } from "./hooks/useRankings";
import { useUserDevices } from "./hooks/useUserDevices";
import {
  addUserScore,
  completeUserOnboarding,
  ensureUserDocument,
  saveUserProfile,
  subscribeUserDocument,
} from "./services/firestoreService";
import {
  calcularCarbonoMensal,
  calcularConsumoMensal,
  calcularCustoMensal,
  TARIFA_KWH_PI,
} from "./utils/energyCalculations";

// ==========================================
// CONFIGURAÇÃO DA LOGO DO PROJETO ENERGIAPI
// ==========================================
const LOGO_URL = "/logo.png";
const ABAS_APP = ["dashboard", "aparelhos", "missões", "comunidade", "ranking"];
const SWIPE_MIN_DISTANCE = 56;

const LogoEnergiaPI = ({ size = 48, className = "" }) => {
  return (
    <img
      src={LOGO_URL}
      alt="Logo EnergiaPI"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src =
          "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=150&q=80";
      }}
    />
  );
};

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const TWEMOJI_BASE_URL =
  "https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.2/assets/72x72";

const Emoji = ({ children, className = "" }) => {
  const emoji = String(children || "");
  const codePoint = emoji ? twemoji.convert.toCodePoint(emoji) : "";

  if (!codePoint) {
    return (
      <span
        className={`inline-flex items-center justify-center leading-none ${className}`.trim()}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={`${TWEMOJI_BASE_URL}/${codePoint}.png`}
      alt={emoji}
      draggable="false"
      loading="lazy"
      className={`twemoji ${className}`.trim()}
    />
  );
};

const PERFIS_STORAGE_KEY = "energiapi:firebase-user-profiles";
const ESCOLA_NAO_APLICA = "Nao se aplica (Perfil Morador)";
const POPUP_TIMEOUT_MS = 45000;
const EMAIL_DOMINIOS_PERMITIDOS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
];
const EMOJIS = {
  frio: "❄️",
  chuveiro: "🚿",
  tv: "📺",
  ventilador: "🌀",
  lavanderia: "🧺",
  cozinha: "🍲",
  computador: "🖥️",
  tomada: "🔌",
  lampada: "💡",
  energia: "⚡",
  broto: "🌱",
  planeta: "🌍",
  dinheiro: "💰",
  arvore: "🌳",
  ouro: "🥇",
  prata: "🥈",
  bronze: "🥉",
};
const EMAIL_PERMITIDO_REGEX = new RegExp(
  `^[A-Z0-9._%+-]+@(${EMAIL_DOMINIOS_PERMITIDOS.map((dominio) => dominio.replace(".", "\\.")).join("|")})$`,
  "i",
);

const montarEndereco = ({ bairro, numero, estadoCidade, cep }) =>
  `${bairro}, No ${numero}, ${estadoCidade} - CEP: ${formatarCep(cep)}`;

const apenasNumeros = (valor) => valor.replace(/\D/g, "");
const formatarCep = (valor) => {
  const digitos = apenasNumeros(valor).slice(0, 8);
  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
};
const normalizarEmail = (valor) => valor.trim().toLowerCase();
const emailEhPermitido = (valor) =>
  EMAIL_PERMITIDO_REGEX.test(normalizarEmail(valor));
const criarErroFluxo = (code, message) =>
  Object.assign(new Error(message), { code });
const aguardarPopup = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          criarErroFluxo(
            "auth/popup-timeout",
            "A janela do Google demorou para responder.",
          ),
        );
      }, POPUP_TIMEOUT_MS);
    }),
  ]);

const lerPerfisSalvos = () => {
  try {
    return JSON.parse(localStorage.getItem(PERFIS_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const salvarPerfilUsuario = (uid, perfilUsuario) => {
  const perfis = lerPerfisSalvos();
  localStorage.setItem(
    PERFIS_STORAGE_KEY,
    JSON.stringify({
      ...perfis,
      [uid]: perfilUsuario,
    }),
  );
};

const detectarAuthProvider = (firebaseUser, perfil = {}) => {
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

const registrarErroAuth = (contexto, error) => {
  console.error(
    `[Firebase Auth] ${contexto}`,
    error?.code,
    error?.message,
    error,
  );
};

const carregarPerfilUsuario = (firebaseUser) => {
  const perfilSalvo = lerPerfisSalvos()[firebaseUser.uid];
  const tipoUsuario =
    perfilSalvo?.tipoUsuario === "morador" || perfilSalvo?.perfil === "morador"
      ? "morador"
      : perfilSalvo
        ? "estudante"
        : "";
  const escolaNome =
    perfilSalvo?.escolaNome ||
    perfilSalvo?.escola ||
    (tipoUsuario === "estudante" ? "" : ESCOLA_NAO_APLICA);

  return {
    uid: firebaseUser.uid,
    nome: perfilSalvo?.nome || firebaseUser.displayName || "Auditor EnergiaPI",
    email: perfilSalvo?.email || firebaseUser.email || "",
    tipoUsuario,
    onboardingCompleto: Boolean(
      perfilSalvo?.onboardingCompleto ?? Boolean(perfilSalvo),
    ),
    escolaId: perfilSalvo?.escolaId || "",
    escolaNome: tipoUsuario === "estudante" ? escolaNome : "",
    GRE: tipoUsuario === "estudante" ? perfilSalvo?.GRE || perfilSalvo?.gre || "" : "",
    gre: tipoUsuario === "estudante" ? perfilSalvo?.GRE || perfilSalvo?.gre || "" : "",
    score: Number(perfilSalvo?.score || 0),
    escola: tipoUsuario === "estudante" ? escolaNome : ESCOLA_NAO_APLICA,
    authProvider: detectarAuthProvider(firebaseUser, perfilSalvo || {}),
    endereco: perfilSalvo?.endereco || "",
    numero: perfilSalvo?.numero || "",
    cidade: perfilSalvo?.cidade || "",
    bairro: perfilSalvo?.bairro || "",
    estado: perfilSalvo?.estado || "",
    cep: perfilSalvo?.cep || "",
    perfil: tipoUsuario === "morador" ? "morador" : "estudante",
  };
};

const traduzirErroFirebase = (error) => {
  const mensagens = {
    "auth/email-already-in-use":
      "Este email ja esta cadastrado. Tente fazer login.",
    "auth/invalid-email": "Informe um email valido.",
    "auth/invalid-credential": "Email ou senha invalidos.",
    "auth/popup-closed-by-user":
      "Login com Google cancelado antes da conclusao.",
    "auth/popup-blocked":
      "O navegador bloqueou a janela do Google. Autorize popups ou tente novamente.",
    "auth/cancelled-popup-request":
      "Ja existe uma tentativa de login com Google em andamento.",
    "auth/unauthorized-domain":
      "Este dominio nao esta autorizado no Firebase Authentication.",
    "auth/too-many-requests":
      "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
    "auth/popup-timeout":
      "A janela do Google demorou para responder. Tente novamente.",
    "auth/operation-not-supported-in-this-environment":
      "Este navegador bloqueou o popup. Vamos tentar por redirecionamento.",
    "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
    "auth/network-request-failed":
      "Falha de conexao com o Firebase. Tente novamente.",
  };

  return (
    mensagens[error?.code] ||
    "Nao foi possivel autenticar agora. Tente novamente."
  );
};

export default function App() {
  // ESTADOS GERAIS
  const [tema, setTema] = useState("escuro"); // Modo Escuro como padrão
  const [autenticado, setAutenticado] = useState(false);
  const [authCarregando, setAuthCarregando] = useState(true);
  const [authProcessando, setAuthProcessando] = useState(null);
  const [isLogin, setIsLogin] = useState(false); // Alterna entre Login e Cadastro
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState("estudante"); // estudante ou morador

  // ESTADOS DE CADASTRO / LOGIN
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [emailTocado, setEmailTocado] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Endereço
  const [cep, setCep] = useState("");
  const [estadoCidade, setEstadoCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [cepStatus, setCepStatus] = useState("idle");
  const [cepMensagem, setCepMensagem] = useState("");

  const [escolaUsuario, setEscolaUsuario] = useState("");
  const [escolaSelecionada, setEscolaSelecionada] = useState(null);

  // NAVEGAÇÃO E FEEDBACK
  const [abaSelecionada, setAbaSelecionada] = useState("dashboard");
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacao, setNotificacao] = useState(null);

  // ESTADOS DOS MODAIS
  const [modalTemplatesAberto, setModalTemplatesAberto] = useState(false);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [aparelhoParaExcluir, setAparelhoParaExcluir] = useState(null);
  const [novoAparelho, setNovoAparelho] = useState({
    nome: "",
    categoria: "Tecnologia",
    potencia: 100,
    usoHorasDia: 1,
    diasPorSemana: 1,
    quantidade: 1,
  });
  const [salvandoAparelho, setSalvandoAparelho] = useState(false);
  const [buscaTemplate, setBuscaTemplate] = useState("");
  const [categoriaTemplate, setCategoriaTemplate] = useState("");
  const [quickEdit, setQuickEdit] = useState(null);

  // REFERÊNCIAS PARA CLIQUE FORA DOS MODAIS
  const modalTemplatesRef = useRef(null);
  const modalNovoRef = useRef(null);
  const swipeStartRef = useRef(null);
  const authSyncSeqRef = useRef(0);

  const {
    devices: eletrodomesticos,
    loading: aparelhosCarregando,
    addDevice,
    updateDevice,
    deleteDevice,
  } = useUserDevices(usuario?.uid);
  const { items: templatesFiltrados, loading: catalogoCarregando } =
    useDeviceCatalogSearch({
      termo: buscaTemplate,
      categoria: categoriaTemplate,
      max: buscaTemplate ? 16 : 10,
    });

  const [verMaisMissoes, setVerMaisMissoes] = useState(false);
  const [pontuacao, setPontuacao] = useState(0);
  const [badges, setBadges] = useState(["Recruta da Luz"]);
  const missoesDesbloqueadasRef = useRef(new Set());
  const { missions: missoesComProgresso, activateMission, completeMission } =
    useMissions(pontuacao, usuario?.uid);
  const missoesDisponiveis = missoesComProgresso.filter(
    (missao) => missao.desbloqueada,
  );
  const missoesFuturas = missoesComProgresso.filter(
    (missao) => !missao.desbloqueada,
  );
  const {
    escolas: rankingEscolas,
    comunidade: rankingComunidade,
    loading: rankingsCarregando,
    error: rankingsErro,
  } = useRankings();

  // SISTEMA DE CORES DINÂMICO
  const isDark = tema === "escuro";
  const tm = {
    bg: isDark ? "bg-[#0B1426]" : "bg-slate-50",
    card: isDark
      ? "bg-[#111d35]/80 backdrop-blur-md border-slate-800/60"
      : "bg-white/80 backdrop-blur-md border-slate-200 shadow-sm",
    cardHover: isDark
      ? "hover:border-[#10B981]/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]"
      : "hover:border-slate-300 hover:shadow-md",
    text: isDark ? "text-white" : "text-slate-900",
    textMuted: isDark ? "text-slate-400" : "text-slate-500",
    border: isDark ? "border-slate-800/80" : "border-slate-200",
    input: isDark
      ? "bg-[#0e1930]/50 border-slate-700 text-white focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]",
    header: isDark
      ? "bg-[#0B1426]/80 backdrop-blur-xl border-slate-800/80"
      : "bg-white/80 backdrop-blur-xl border-slate-200",
    modal: isDark
      ? "bg-[#111d35]/95 backdrop-blur-2xl border-slate-700/50 shadow-2xl"
      : "bg-white/95 backdrop-blur-2xl border-slate-200 shadow-2xl",
  };

  const authEmAndamento = Boolean(authProcessando);
  const emailNormalizado = normalizarEmail(email);
  const emailInvalido =
    emailTocado && email.length > 0 && !emailEhPermitido(email);
  const cepNumeros = apenasNumeros(cep);
  const cepInvalido = cep.length > 0 && cepNumeros.length !== 8;
  const classeInputAuth =
    "w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300";
  const classeInputAuthFocus =
    "w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] focus:bg-white/10 text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300";
  const classeInputEmail = `${classeInputAuth} ${emailInvalido ? "border-[#EF4444]/60 focus:border-[#EF4444] focus:ring-[#EF4444]" : ""}`;
  const classeInputEmailLogin = `${classeInputAuthFocus} ${emailInvalido ? "border-[#EF4444]/60 focus:border-[#EF4444] focus:ring-[#EF4444]" : ""}`;
  const classeInputCep = `${classeInputAuth} ${cepInvalido || cepStatus === "erro" ? "border-[#EF4444]/60 focus:border-[#EF4444] focus:ring-[#EF4444]" : cepStatus === "encontrado" ? "border-[#10B981]/60" : ""}`;
  const usuarioSeguro = {
    uid: usuario?.uid || "",
    nome:
      typeof usuario?.nome === "string" && usuario.nome.trim()
        ? usuario.nome.trim()
        : "Auditor EnergiaPI",
    email: typeof usuario?.email === "string" ? usuario.email : "",
    escola:
      typeof usuario?.escolaNome === "string" && usuario.escolaNome.trim()
        ? usuario.escolaNome.trim()
        : typeof usuario?.escola === "string" && usuario.escola.trim()
          ? usuario.escola.trim()
          : "EnergiaPI",
    escolaId: usuario?.escolaId || "",
    GRE: usuario?.GRE || usuario?.gre || "",
    gre: usuario?.GRE || usuario?.gre || "",
    endereco:
      typeof usuario?.endereco === "string" && usuario.endereco.trim()
        ? usuario.endereco.trim()
        : "sua comunidade",
    tipoUsuario: usuario?.tipoUsuario === "morador" ? "morador" : "estudante",
    perfil: usuario?.tipoUsuario === "morador" || usuario?.perfil === "morador" ? "morador" : "estudante",
    authProvider: usuario?.authProvider || "password",
    score: Number(usuario?.score || pontuacao || 0),
    onboardingCompleto: usuario?.onboardingCompleto === true,
  };
  const primeiroNomeUsuario = usuarioSeguro.nome.split(" ")[0] || "Auditor";
  const bairroUsuario =
    usuarioSeguro.endereco.split(",")[0] || "sua comunidade";
  const onboardingPendente =
    autenticado &&
    !authCarregando &&
    usuario &&
    usuario.authProvider === "google" &&
    usuario.onboardingCompleto !== true;
  const bloqueandoRenderCadastroEmail =
    authProcessando === "email-cadastro" && autenticado;
  const abaIndiceAtual = useMemo(
    () => Math.max(ABAS_APP.indexOf(abaSelecionada), 0),
    [abaSelecionada],
  );

  const dispararNotificacao = useCallback((mensagem) => {
    setNotificacao(mensagem);
    setTimeout(() => setNotificacao(null), 4000);
  }, []);

  const validarFirebaseConfigurado = useCallback(() => {
    if (isFirebaseConfigured) return true;

    console.warn("[Firebase Config] Login bloqueado", firebaseConfigStatus);
    dispararNotificacao(
      "Firebase nao configurado. Verifique as variaveis VITE_FIREBASE_*.",
    );
    return false;
  }, [dispararNotificacao]);

  const fecharModalTemplates = useCallback(() => {
    setModalTemplatesAberto(false);
    setBuscaTemplate("");
    setCategoriaTemplate("");
  }, []);

  const verificarSenhasIguais = (s1, s2) => s1 === s2;
  const calcularConsumoAparelho = (aparelhoOuPotencia, horasDia = 0) => {
    if (typeof aparelhoOuPotencia === "object") {
      return calcularConsumoMensal(aparelhoOuPotencia);
    }

    return calcularConsumoMensal({
      potencia: aparelhoOuPotencia,
      usoHorasDia: horasDia,
      diasPorSemana: 7,
      quantidade: 1,
    });
  };

  const consumoTotal = eletrodomesticos.reduce((acc, elet) => {
    return elet.ativo === false ? acc : acc + calcularConsumoMensal(elet);
  }, 0);
  const custoTotal = calcularCustoMensal(consumoTotal, TARIFA_KWH_PI);
  const carbonoTotal = calcularCarbonoMensal(consumoTotal);

  useEffect(() => {
    const idsDesbloqueados = new Set(
      missoesComProgresso
        .filter((missao) => missao.desbloqueada)
        .map((missao) => missao.id),
    );

    if (missoesDesbloqueadasRef.current.size === 0) {
      missoesDesbloqueadasRef.current = idsDesbloqueados;
      return;
    }

    const novasMissoes = [...idsDesbloqueados].filter(
      (id) => !missoesDesbloqueadasRef.current.has(id),
    );
    if (novasMissoes.length > 0) {
      const primeiraMissao = missoesComProgresso.find(
        (missao) => missao.id === novasMissoes[0],
      );
      dispararNotificacao(
        "Nova missão liberada: " +
          (primeiraMissao?.titulo || "continue avançando") +
          "!",
      );
    }

    missoesDesbloqueadasRef.current = idsDesbloqueados;
  }, [dispararNotificacao, missoesComProgresso]);

  const aplicarPerfilUsuario = useCallback((firebaseUser, perfilBase = null) => {
    const fallback = carregarPerfilUsuario(firebaseUser);
    const origem = { ...fallback, ...(perfilBase || {}) };
    const tipoUsuario =
      origem.tipoUsuario === "morador" || origem.perfil === "morador"
        ? "morador"
        : origem.tipoUsuario === "estudante" || origem.tipoUsuario === "seduc"
          ? "estudante"
          : "";
    const perfilVisual =
      tipoUsuario || (origem.perfil === "morador" ? "morador" : "estudante");
    const escolaNome =
      tipoUsuario === "estudante"
        ? origem.escolaNome || origem.escola || ""
        : "";
    const GRE = tipoUsuario === "estudante" ? origem.GRE || origem.gre || "" : "";
    const authProvider = detectarAuthProvider(firebaseUser, origem);
    const perfilSeguro = {
      ...origem,
      uid: firebaseUser.uid,
      nome: origem.nome || firebaseUser.displayName || "Auditor EnergiaPI",
      email: origem.email || firebaseUser.email || "",
      tipoUsuario,
      perfil: perfilVisual,
      authProvider,
      onboardingCompleto: origem.onboardingCompleto === true && Boolean(tipoUsuario),
      escolaId: tipoUsuario === "estudante" ? origem.escolaId || "" : "",
      escolaNome,
      escola: tipoUsuario === "morador" ? ESCOLA_NAO_APLICA : escolaNome,
      GRE,
      gre: GRE,
      endereco: origem.endereco || "",
      numero: origem.numero || "",
      cidade: origem.cidade || "",
      bairro: origem.bairro || "",
      estado: origem.estado || "",
      cep: origem.cep || "",
      score: Number(origem.score || 0),
    };

    setUsuario(perfilSeguro);
    setAutenticado(true);
    setPerfil(perfilVisual);
    setNomeUsuario(perfilSeguro.nome);
    setEmail(perfilSeguro.email);
    setPontuacao(Number(perfilSeguro.score || 0));

    if (tipoUsuario === "estudante") {
      setEscolaUsuario(escolaNome);
      setEscolaSelecionada({
        id: perfilSeguro.escolaId || "",
        nome: escolaNome,
        GRE,
        gre: GRE,
      });
    } else if (tipoUsuario === "morador") {
      setEscolaUsuario("");
      setEscolaSelecionada(null);
    }

    return perfilSeguro;
  }, []);

  const sincronizarUsuarioAutenticado = useCallback(
    async (firebaseUser, perfilManual = null) => {
      if (!firebaseUser?.uid) return null;

      const syncId = authSyncSeqRef.current + 1;
      authSyncSeqRef.current = syncId;
      const perfilInicial = aplicarPerfilUsuario(firebaseUser, perfilManual);

      try {
        const perfilFirestore = await ensureUserDocument(
          firebaseUser,
          perfilManual || perfilInicial,
        );

        if (authSyncSeqRef.current !== syncId) {
          return perfilFirestore || perfilInicial;
        }

        const perfilFinal = aplicarPerfilUsuario(
          firebaseUser,
          perfilFirestore || perfilInicial,
        );
        if (perfilFinal.onboardingCompleto) {
          salvarPerfilUsuario(firebaseUser.uid, perfilFinal);
        }
        return perfilFinal;
      } catch (error) {
        console.warn("[Firestore user profile] fallback local", error?.message);
        return perfilInicial;
      }
    },
    [aplicarPerfilUsuario],
  );

  const validarEmailFormulario = () => {
    setEmailTocado(true);

    if (!emailNormalizado || !emailEhPermitido(emailNormalizado)) {
      dispararNotificacao(
        "Use um email Gmail, Hotmail, Outlook, Yahoo ou iCloud.",
      );
      return false;
    }

    return true;
  };

  const validarEnderecoCadastro = () => {
    if (cepNumeros.length !== 8) {
      dispararNotificacao("Informe um CEP valido com 8 numeros.");
      return false;
    }

    if (cepStatus === "buscando") {
      dispararNotificacao("Aguarde a validacao do CEP.");
      return false;
    }

    if (cepStatus === "erro") {
      dispararNotificacao(cepMensagem || "Confirme o CEP antes de continuar.");
      return false;
    }

    if (cepStatus !== "encontrado") {
      dispararNotificacao("Confirme um CEP valido antes de continuar.");
      return false;
    }

    if (!/^\d+$/.test(numero)) {
      dispararNotificacao("Informe apenas numeros no campo No.");
      return false;
    }

    return true;
  };

  const handleEmailChange = (valor) => {
    setEmail(valor);
    if (!emailTocado) setEmailTocado(true);
  };

  const handleCepChange = (valor) => {
    const cepFormatado = formatarCep(valor);
    const digitos = apenasNumeros(cepFormatado);
    setCep(cepFormatado);

    if (digitos.length !== 8) {
      setCepStatus("idle");
      setCepMensagem("");
    }
  };

  const handleNumeroChange = (valor) => {
    setNumero(apenasNumeros(valor));
  };

  useEffect(() => {
    let ativo = true;

    if (!isFirebaseConfigured) {
      queueMicrotask(() => {
        if (!ativo) return;
        authSyncSeqRef.current += 1;
        setUsuario(null);
        setAutenticado(false);
        setAuthCarregando(false);
      });
      return () => {
        ativo = false;
      };
    }

    const resolverRedirect = async () => {
      try {
        await authReady;
        const resultadoRedirect = await getRedirectResult(auth);

        if (ativo && resultadoRedirect?.user) {
          await sincronizarUsuarioAutenticado(resultadoRedirect.user);
          dispararNotificacao("Autenticado com Google pelo Firebase.");
        }
      } catch (error) {
        registrarErroAuth("google-redirect", error);
        dispararNotificacao(traduzirErroFirebase(error));
      }
    };

    resolverRedirect();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (import.meta.env.DEV) {
            console.debug("[Firebase Auth] estado recebido", {
              autenticado: Boolean(firebaseUser),
              uid: firebaseUser?.uid || null,
            });
          }

          if (firebaseUser) {
            await sincronizarUsuarioAutenticado(firebaseUser);
          } else {
            authSyncSeqRef.current += 1;
            setUsuario(null);
            setAutenticado(false);
          }
        } catch (error) {
          console.error("[Firebase Auth] falha ao sincronizar usuario", error);
          setUsuario(null);
          setAutenticado(false);
        } finally {
          if (ativo) {
            setAuthCarregando(false);
          }
        }
      },
      (error) => {
        registrarErroAuth("auth-state-listener", error);
        setUsuario(null);
        setAutenticado(false);
        setAuthCarregando(false);
        dispararNotificacao(traduzirErroFirebase(error));
      },
    );

    return () => {
      ativo = false;
      unsubscribe();
    };
  }, [dispararNotificacao, sincronizarUsuarioAutenticado]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug("[EnergiaPI Render]", {
        authCarregando,
        autenticado,
        usuario: Boolean(usuario),
        abaSelecionada,
      });
    }
  }, [abaSelecionada, authCarregando, autenticado, usuario]);

  useEffect(() => {
    if (!usuario?.uid) return undefined;

    return subscribeUserDocument(
      usuario.uid,
      (perfilFirestore) => {
        if (!perfilFirestore) return;
        const tipoUsuario =
          perfilFirestore.tipoUsuario === "morador"
            ? "morador"
            : perfilFirestore.tipoUsuario === "estudante"
              ? "estudante"
              : "";
        setUsuario((atual) => ({
          ...(atual || {}),
          ...perfilFirestore,
          tipoUsuario,
          authProvider: perfilFirestore.authProvider || atual?.authProvider || "password",
          perfil:
            tipoUsuario || (atual?.perfil === "morador" ? "morador" : "estudante"),
          onboardingCompleto:
            perfilFirestore.onboardingCompleto === true && Boolean(tipoUsuario),
          escola:
            tipoUsuario === "estudante"
              ? perfilFirestore.escolaNome || atual?.escola || ""
              : tipoUsuario === "morador"
                ? ESCOLA_NAO_APLICA
                : atual?.escola || "",
          GRE: perfilFirestore.GRE || perfilFirestore.gre || "",
        }));
        setPontuacao(Number(perfilFirestore.score || 0));
      },
      (error) => {
        console.warn("[Firestore user profile] listener indisponivel", error?.message);
      },
    );
  }, [usuario?.uid]);

  useEffect(() => {
    if (cepNumeros.length !== 8) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCepStatus("buscando");
      setCepMensagem("Consultando CEP...");

      try {
        const resposta = await fetch(
          `https://viacep.com.br/ws/${cepNumeros}/json/`,
          {
            signal: controller.signal,
          },
        );

        if (!resposta.ok) {
          throw criarErroFluxo("cep/network", "Falha ao consultar o CEP.");
        }

        const dados = await resposta.json();

        if (dados.erro) {
          setCepStatus("erro");
          setCepMensagem("CEP nao encontrado.");
          return;
        }

        setEstadoCidade(`${dados.localidade} - ${dados.uf}`);
        setBairro(dados.bairro || "");
        setCepStatus("encontrado");
        setCepMensagem(
          dados.bairro
            ? "CEP localizado."
            : "CEP localizado. Complete o bairro.",
        );
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("[ViaCEP]", error?.message, error);
        setCepStatus("erro");
        setCepMensagem("Nao foi possivel consultar o CEP agora.");
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cepNumeros]);

  // DETECTAR CLIQUES FORA DOS MODAIS PARA SAÍDA DE UX FACILITADA (Requisito 3)
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        modalTemplatesAberto &&
        modalTemplatesRef.current &&
        !modalTemplatesRef.current.contains(event.target)
      ) {
        fecharModalTemplates();
      }
      if (
        modalNovoAberto &&
        modalNovoRef.current &&
        !modalNovoRef.current.contains(event.target)
      ) {
        setModalNovoAberto(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [fecharModalTemplates, modalTemplatesAberto, modalNovoAberto]);

  useEffect(() => {
    if (!quickEdit) return undefined;

    const handlePointerDown = (event) => {
      if (event.target.closest("[data-quick-editor='true']")) return;
      if (event.target.closest("[data-quick-value='true']")) return;
      setQuickEdit(null);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setQuickEdit(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickEdit]);

  useEffect(() => {
    if (!autenticado || onboardingPendente) return undefined;

    const root = document.querySelector("[data-app-scroll-root='true']");
    if (!root) return undefined;

    const elements = root.querySelectorAll(".reveal-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    elements.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index * 38, 220)}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [
    abaSelecionada,
    autenticado,
    onboardingPendente,
    eletrodomesticos.length,
    rankingComunidade.length,
    rankingEscolas.length,
  ]);

  // MOTOR DE "INSIGHTS INTELIGENTES" (Requisito 4)
  const gerarInsightsInteligentes = () => {
    const insights = [];

    // Verifica vilões extremos
    const chuveiro = eletrodomesticos.find(
      (e) => e.nome.toLowerCase().includes("chuveiro") && e.ativo,
    );
    const arCondicionado = eletrodomesticos.find(
      (e) =>
        (e.nome.toLowerCase().includes("ar-condicionado") ||
          e.nome.toLowerCase().includes("ar condicionado")) &&
        e.ativo,
    );
    const lampadasIncandescentes = eletrodomesticos.find(
      (e) => e.nome.toLowerCase().includes("incandescente") && e.ativo,
    );

    if (eletrodomesticos.length === 0) {
      return [
        {
          id: "cadastro",
          titulo: "Mapeamento Inicial pendente",
          descricao:
            "Cadastre seus primeiros aparelhos residenciais para que nosso motor de inteligência analise e gere recomendações personalizadas.",
          economiaKwh: 0,
          economiaReais: 0,
          tipo: "info",
        },
      ];
    }

    if (chuveiro && chuveiro.potencia >= 4000) {
      const economiaKwh = calcularConsumoMensal({
        ...chuveiro,
        potencia: Math.max(chuveiro.potencia - 2500, 0),
      });
      const economiaReais = calcularCustoMensal(economiaKwh, TARIFA_KWH_PI);
      insights.push({
        id: "chuveiro_verao",
        titulo: "Altere o Chuveiro para o modo Verão",
        descricao: `Seu chuveiro elétrico opera em alta potência (${chuveiro.potencia}W). Reduzindo a temperatura ou mudando a chave para "Verão" (que reduz a potência para ~2500W), você gera economia real instantânea.`,
        economiaKwh: economiaKwh.toFixed(1),
        economiaReais: economiaReais.toFixed(2),
        tipo: "alerta",
      });
    }

    if (arCondicionado && arCondicionado.horasDia > 4) {
      const economiaKwh =
        calcularConsumoMensal(arCondicionado) * 0.2; // 20% economia regulando temp
      const economiaReais = calcularCustoMensal(economiaKwh, TARIFA_KWH_PI);
      insights.push({
        id: "ar_23",
        titulo: "Ajuste o Ar-condicionado para 23°C",
        descricao: `Seu aparelho climatiza por longas horas (${arCondicionado.horasDia}h/dia). Programar em 23°C em vez de temperaturas mais baixas (como 17°C) impede que o compressor trabalhe sem pausas.`,
        economiaKwh: economiaKwh.toFixed(1),
        economiaReais: economiaReais.toFixed(2),
        tipo: "economia",
      });
    }

    if (lampadasIncandescentes) {
      const quantidade = 3; // fictício para o cálculo
      const potenciaLedEquivalente = 9;
      const diferencaPotencia =
        (lampadasIncandescentes.potencia - potenciaLedEquivalente) * quantidade;
      const economiaKwh = calcularConsumoMensal({
        ...lampadasIncandescentes,
        potencia: diferencaPotencia,
      });
      const economiaReais = calcularCustoMensal(economiaKwh, TARIFA_KWH_PI);
      insights.push({
        id: "substituicao_led",
        titulo: "Substitua Lâmpadas Antigas por LED",
        descricao: `Lâmpadas incandescentes gastam energia desnecessária em forma de calor. Trocar 3 delas por tecnologia LED gera economia a curto prazo.`,
        economiaKwh: economiaKwh.toFixed(1),
        economiaReais: economiaReais.toFixed(2),
        tipo: "oportunidade",
      });
    }

    // Se nenhum vilão específico for mapeado
    if (insights.length === 0) {
      insights.push({
        id: "geral_standby",
        titulo: "Combata o Consumo Standby",
        descricao:
          "Aparelhos conectados em tomada no modo de espera (luz vermelha) consomem energia passivamente. Tirar roteadores ou TVs desnecessários da tomada à noite gera redução média de 5% na fatura.",
        economiaKwh: (consumoTotal * 0.05).toFixed(1),
        economiaReais: (custoTotal * 0.05).toFixed(2),
        tipo: "economia",
      });
    }

    return insights;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authEmAndamento) return;
    if (!validarFirebaseConfigurado()) return;

    if (!validarEmailFormulario()) return;

    setAuthProcessando(isLogin ? "email-login" : "email-cadastro");

    try {
      await authReady;

      if (isLogin) {
        if (!email || !senha) {
          dispararNotificacao("Preencha email e senha para entrar.");
          return;
        }

        const credencial = await signInWithEmailAndPassword(
          auth,
          emailNormalizado,
          senha,
        );
        await sincronizarUsuarioAutenticado(credencial.user);
        dispararNotificacao(`Bem-vindo de volta! Seu diagnostico esta pronto.`);
        return;
      }

      if (!verificarSenhasIguais(senha, confirmarSenha)) {
        dispararNotificacao("Erro: As senhas digitadas nao coincidem!");
        return;
      }

      if (!validarEnderecoCadastro()) return;

      const camposComunsOk =
        nomeUsuario &&
        email &&
        senha &&
        cep &&
        estadoCidade &&
        bairro &&
        numero;
      const camposEstudanteOk =
        perfil === "estudante" ? escolaSelecionada?.id : true;

      if (!camposComunsOk || !camposEstudanteOk) {
        dispararNotificacao(
          "Por favor, preencha todos os campos do formulario.",
        );
        return;
      }

      const credencial = await createUserWithEmailAndPassword(
        auth,
        emailNormalizado,
        senha,
      );
      await updateProfile(credencial.user, { displayName: nomeUsuario });

      const [cidadeCadastro = "", estadoCadastro = ""] = estadoCidade
        .split(" - ")
        .map((parte) => parte.trim());
      const perfilFirebase = {
        uid: credencial.user.uid,
        nome: nomeUsuario,
        email: emailNormalizado,
        tipoUsuario: perfil === "estudante" ? "estudante" : "morador",
        authProvider: "password",
        onboardingCompleto: true,
        escolaId: perfil === "estudante" ? escolaSelecionada?.id || "" : "",
        escolaNome: perfil === "estudante" ? escolaUsuario : "",
        GRE: perfil === "estudante" ? escolaSelecionada?.GRE || escolaSelecionada?.gre || "" : "",
        score: 0,
        escola: perfil === "estudante" ? escolaUsuario : ESCOLA_NAO_APLICA,
        endereco: montarEndereco({ bairro, numero, estadoCidade, cep }),
        numero,
        cidade: cidadeCadastro,
        bairro,
        estado: estadoCadastro,
        cep: formatarCep(cep),
        perfil,
      };

      salvarPerfilUsuario(credencial.user.uid, perfilFirebase);
      await saveUserProfile(credencial.user, perfilFirebase);
      await sincronizarUsuarioAutenticado(credencial.user, perfilFirebase);
      setSenha("");
      setConfirmarSenha("");
      dispararNotificacao(
        `Cadastro efetuado! Bem-vindo como ${perfil === "estudante" ? "Estudante" : "Morador"}.`,
      );
    } catch (error) {
      registrarErroAuth(isLogin ? "email-login" : "email-cadastro", error);
      dispararNotificacao(traduzirErroFirebase(error));
    } finally {
      setAuthProcessando(null);
    }
  };

  const finalizarGoogleAuth = async (firebaseUser, origem) => {
    const perfilSalvo = lerPerfisSalvos()[firebaseUser.uid];
    const perfilFirebase = await sincronizarUsuarioAutenticado(
      firebaseUser,
      perfilSalvo || {
        nome: firebaseUser.displayName || nomeUsuario || "Auditor EnergiaPI",
        email: firebaseUser.email || emailNormalizado,
        authProvider: "google",
      },
    );

    if (perfilFirebase?.onboardingCompleto) {
      salvarPerfilUsuario(firebaseUser.uid, perfilFirebase);
    }

    setSenha("");
    setConfirmarSenha("");
    dispararNotificacao(
      perfilFirebase?.onboardingCompleto
        ? origem === "login"
          ? "Login com Google concluido."
          : "Cadastro com Google concluido."
        : "Complete seu perfil para liberar a plataforma.",
    );
  };

  const autenticarComGoogle = async (origem = "cadastro") => {
    if (authEmAndamento) return;
    if (!validarFirebaseConfigurado()) return;

    setAuthProcessando(origem === "login" ? "google-login" : "google-cadastro");
    let usandoRedirect = false;

    try {
      await authReady;
      const credencial = await aguardarPopup(signInWithPopup(auth, provider));
      await finalizarGoogleAuth(credencial.user, origem);
    } catch (error) {
      registrarErroAuth(`google-${origem}`, error);

      if (
        [
          "auth/popup-blocked",
          "auth/operation-not-supported-in-this-environment",
        ].includes(error?.code)
      ) {
        usandoRedirect = true;
        dispararNotificacao("Popup bloqueado. Redirecionando para o Google...");
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          usandoRedirect = false;
          registrarErroAuth(`google-redirect-${origem}`, redirectError);
          dispararNotificacao(traduzirErroFirebase(redirectError));
          return;
        }
      }

      dispararNotificacao(traduzirErroFirebase(error));
    } finally {
      if (!usandoRedirect) {
        setAuthProcessando(null);
      }
    }
  };

  const handleGoogleSignup = () => autenticarComGoogle("cadastro");
  const handleGoogleLogin = () => autenticarComGoogle("login");

  const handleLogout = async () => {
    try {
      await authReady;
      await signOut(auth);
      authSyncSeqRef.current += 1;
      setAutenticado(false);
      setUsuario(null);
      setAuthProcessando(null);
      setAbaSelecionada("dashboard");
      setSenha("");
      setConfirmarSenha("");
    } catch (error) {
      registrarErroAuth("logout", error);
      dispararNotificacao(traduzirErroFirebase(error));
    }
  };

  const handleOnboardingSubmit = async (dadosOnboarding) => {
    try {
      await authReady;
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        dispararNotificacao("Sessao expirada. Entre novamente.");
        return;
      }

      const perfilFirebase = {
        uid: firebaseUser.uid,
        nome: usuario?.nome || firebaseUser.displayName || "Auditor EnergiaPI",
        email: usuario?.email || firebaseUser.email || "",
        score: Number(usuario?.score || 0),
        authProvider: "google",
        perfil: dadosOnboarding.tipoUsuario,
        escola:
          dadosOnboarding.tipoUsuario === "estudante"
            ? dadosOnboarding.escolaNome
            : ESCOLA_NAO_APLICA,
        ...dadosOnboarding,
      };

      const perfilAtualizado = await completeUserOnboarding(
        firebaseUser,
        perfilFirebase,
      );
      salvarPerfilUsuario(firebaseUser.uid, {
        ...perfilFirebase,
        ...perfilAtualizado,
      });
      aplicarPerfilUsuario(firebaseUser, {
        ...perfilFirebase,
        ...perfilAtualizado,
      });
      dispararNotificacao("Perfil concluido. Bem-vindo a EnergiaPI.");
    } catch (error) {
      console.error("[Onboarding]", error);
      dispararNotificacao(
        "Nao foi possivel concluir o perfil agora. Tente novamente.",
      );
    }
  };

  const adicionarTemplate = async (template) => {
    try {
      await addDevice({
        ...template,
        deviceId: template.id,
        usoHorasDia: template.usoHorasDia ?? template.horasDia ?? 1,
        diasPorSemana: template.diasPorSemana || 7,
        quantidade: 1,
      });
      fecharModalTemplates();
      dispararNotificacao(template.nome + " adicionado com sucesso!");
    } catch (error) {
      console.error("[Firestore add device]", error);
      dispararNotificacao("Não foi possível adicionar o aparelho agora.");
    }
  };

  const salvarNovoAparelhoCustomizado = async (e) => {
    e.preventDefault();
    setSalvandoAparelho(true);

    try {
      await addDevice({
        ...novoAparelho,
        emoji: EMOJIS.energia,
        icone: EMOJIS.energia,
      });
      setModalNovoAberto(false);
      fecharModalTemplates();
      dispararNotificacao('Aparelho "' + novoAparelho.nome + '" salvo com sucesso!');
      setNovoAparelho({
        nome: "",
        categoria: "Tecnologia",
        potencia: 100,
        usoHorasDia: 1,
        diasPorSemana: 1,
        quantidade: 1,
      });
    } catch (error) {
      console.error("[Firestore custom device]", error);
      dispararNotificacao("Não foi possível salvar o aparelho agora.");
    } finally {
      setSalvandoAparelho(false);
    }
  };

  const atualizarEletrodomestico = (id, campo, valor) => {
    const atual = eletrodomesticos.find((elet) => elet.id === id);
    if (!atual) return;
    updateDevice(id, { ...atual, [campo]: valor }).catch((error) => {
      console.error("[Firestore update device]", error);
      dispararNotificacao("Ajuste não sincronizado. Tente novamente.");
    });
  };

  const abrirEditorRapido = (event, config) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const largura = 238;
    setQuickEdit({
      ...config,
      value: Number(config.value || config.min),
      anchor: {
        top: rect.bottom + 10,
        left: Math.min(
          Math.max(12, rect.left + rect.width - largura),
          window.innerWidth - largura - 12,
        ),
      },
    });
  };

  const aplicarValorRapido = (nextValue) => {
    if (!quickEdit) return;
    const decimals = String(quickEdit.step).includes(".")
      ? String(quickEdit.step).split(".")[1].length
      : 0;
    const next = Number(
      Math.min(
        Math.max(Number(nextValue), quickEdit.min),
        quickEdit.max,
      ).toFixed(decimals),
    );

    setQuickEdit((atual) => (atual ? { ...atual, value: next } : atual));
    atualizarEletrodomestico(quickEdit.deviceId, quickEdit.field, next);
  };

  const solicitarExclusaoEletrodomestico = (aparelho) => {
    setAparelhoParaExcluir(aparelho);
  };

  const confirmarExclusaoEletrodomestico = async () => {
    if (!aparelhoParaExcluir) return;

    try {
      await deleteDevice(aparelhoParaExcluir.id);
      dispararNotificacao("Aparelho removido do diagnóstico.");
    } catch (error) {
      console.error("[Firestore delete device]", error);
      dispararNotificacao("Não foi possível excluir o aparelho agora.");
    } finally {
      setAparelhoParaExcluir(null);
    }
  };

  const aceitarMissao = (id) => {
    const missao = missoesComProgresso.find((m) => m.id === id);
    if (!missao || !missao.desbloqueada) {
      dispararNotificacao("Essa missão ainda faz parte da sua próxima etapa.");
      return;
    }

    activateMission(id).catch((error) => {
      console.error("[Firestore activate mission]", error);
    });
    dispararNotificacao("Missão aceita! Siga as diretrizes para economizar.");
  };

  const completarMissao = async (id) => {
    const missao = missoesComProgresso.find((m) => m.id === id);
    if (!missao || missao.concluida) return;

    const novaPontuacao = pontuacao + Number(missao.pontos || 0);
    setPontuacao(novaPontuacao);
    await completeMission(id);

    const novosBadges = [...badges];
    if (novaPontuacao >= 120 && !novosBadges.includes("Eco Guardião"))
      novosBadges.push("Eco Guardião");
    if (novaPontuacao >= 250 && !novosBadges.includes("Mestre da Eficiência"))
      novosBadges.push("Mestre da Eficiência");
    setBadges(novosBadges);

    try {
      await addUserScore(usuarioSeguro.uid, Number(missao.pontos || 0), {
        impactoKwh: missao.impactoKwh || 0,
      });
    } catch (error) {
      console.error("[Firestore mission score]", error);
    }

    dispararNotificacao("Parabéns! +" + missao.pontos + " pontos conquistados!");
  };

  const SliderAnimado = ({ value, min, max, step, onChange, colorClass }) => {
    const sliderRef = useRef(null);
    const frameRef = useRef(null);
    const nextValueRef = useRef(value);
    const percentage = ((value - min) / (max - min)) * 100;

    useEffect(
      () => () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      },
      [],
    );

    const emitirMudanca = (nextValue) => {
      nextValueRef.current = nextValue;
      if (frameRef.current) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        onChange({ target: { value: String(nextValueRef.current) } });
      });
    };

    const ajustarPorPonteiro = (event) => {
      const rect = sliderRef.current?.getBoundingClientRect();
      if (!rect) return;
      const raw = ((event.clientX - rect.left) / rect.width) * (max - min) + min;
      const stepped = Math.round(raw / step) * step;
      const nextValue = Math.min(Math.max(stepped, min), max);
      emitirMudanca(nextValue);
    };

    const bloquearGestoGlobal = (event) => {
      event.stopPropagation();
      event.preventDefault();
    };

    return (
      <div
        ref={sliderRef}
        data-no-swipe="true"
        data-slider-control="true"
        className="relative w-full h-11 rounded-full flex items-center group touch-none select-none slider-ios"
        onTouchStart={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        onPointerDown={(event) => {
          bloquearGestoGlobal(event);
          event.currentTarget.setPointerCapture?.(event.pointerId);
          ajustarPorPonteiro(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          bloquearGestoGlobal(event);
          ajustarPorPonteiro(event);
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={(event) => {
          event.stopPropagation();
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
      >
        <div
          className={`absolute left-0 right-0 top-1/2 h-7 -translate-y-1/2 rounded-full ${isDark ? "bg-slate-900/80" : "bg-slate-200/90"} shadow-inner border ${isDark ? "border-white/5" : "border-white/70"}`}
        />
        <div
          className={`absolute left-1 top-1/2 h-5 -translate-y-1/2 ${colorClass} rounded-full transition-[width] duration-75 ease-out shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] slider-fill`}
          style={{ width: `calc(${percentage}% - 0.5rem)` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          data-no-swipe="true"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 touch-none"
        />
        <div
          className="absolute w-9 h-9 bg-white rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.28)] ring-1 ring-black/5 transition-[left,transform] duration-75 ease-out pointer-events-none transform -translate-x-1/2 group-active:scale-95 slider-thumb"
          style={{ left: `${percentage}%` }}
        />
      </div>
    );
  };

  const handleSwipeStart = (event) => {
    if (event.target.closest("input, textarea, select, button, [data-no-swipe='true']")) {
      swipeStartRef.current = null;
      return;
    }

    const touch = event.touches?.[0];
    if (!touch) return;
    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleSwipeEnd = (event) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const duration = Math.max(Date.now() - start.time, 1);
    const velocity = Math.abs(deltaX) / duration;
    const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * 1.35;
    const shouldSwipe =
      Math.abs(deltaX) >= SWIPE_MIN_DISTANCE || velocity > 0.42;

    if (!horizontalIntent || !shouldSwipe || Math.abs(deltaY) > 92) return;

    const nextIndex =
      deltaX < 0
        ? Math.min(abaIndiceAtual + 1, ABAS_APP.length - 1)
        : Math.max(abaIndiceAtual - 1, 0);

    if (nextIndex !== abaIndiceAtual) {
      setAbaSelecionada(ABAS_APP[nextIndex]);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between antialiased selection:bg-[#10B981] selection:text-white transition-colors duration-500 ${tm.bg} ${tm.text}`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        html, body, #root { overscroll-behavior-y: contain; }
        body { touch-action: manipulation; }
        .text-neon-green { color: #10B981; }
        .gpu-smooth {
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .reveal-on-scroll {
          opacity: 0;
          transform: translate3d(0, 16px, 0) scale(0.985);
          transition:
            opacity 520ms cubic-bezier(0.16, 1, 0.3, 1) var(--reveal-delay, 0ms),
            transform 520ms cubic-bezier(0.16, 1, 0.3, 1) var(--reveal-delay, 0ms);
          will-change: opacity, transform;
        }
        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
        .slider-ios {
          touch-action: none;
          contain: layout paint;
          will-change: transform;
        }
        .slider-fill,
        .slider-thumb {
          will-change: width, left, transform;
          transform: translateZ(0);
        }
        .twemoji {
          width: 1em;
          height: 1em;
          display: inline-block;
          vertical-align: -0.12em;
          object-fit: contain;
        }
        
        /* Custom scrollbar optimized (smooth rolling) */
        .scroll-custom::-webkit-scrollbar { width: 8px; }
        .scroll-custom::-webkit-scrollbar-track { background: transparent; }
        .scroll-custom::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .dark .scroll-custom::-webkit-scrollbar-thumb { background: #1e293b; }
        .ios-scroll {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
          will-change: scroll-position;
          transform: translateZ(0);
        }
        input[type="range"] {
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-scale { animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .reveal-on-scroll,
          .animate-fade-in-scale {
            opacity: 1;
            transform: none;
            animation: none;
            transition: none;
          }
        }
        
        /* Premium Apple-like Mesh Gradient */
        .mesh-gradient-auth {
          background-color: #0B1426;
          background-image: 
            radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(11, 20, 38, 0.9) 0px, transparent 50%);
          background-size: 100% 100%;
        }

        /* Glassmorphism switch custom cubic-bezier (Requisito 2) */
        .switch-bezier {
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}</style>

      {/* NOTIFICAÇÃO (Estilo Toast Premium) */}
      {notificacao && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 w-[90%] md:w-auto max-w-md ${isDark ? "bg-[#111d35]/90 backdrop-blur-xl border border-slate-700/50" : "bg-white/90 backdrop-blur-xl border border-slate-200"} ${tm.text} p-4 rounded-2xl shadow-2xl z-[100] flex items-center justify-between gap-4 animate-bounce`}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#10B981] flex-shrink-0" size={20} />
            <p className="text-xs font-semibold tracking-wide">{notificacao}</p>
          </div>
          <button
            onClick={() => setNotificacao(null)}
            className={`p-1 rounded-full hover:bg-slate-500/20 ${tm.textMuted} hover:${tm.text} transition-colors`}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* TELA DE AUTENTICAÇÃO / CADASTRO */}
      {quickEdit && (
        <div
          data-quick-editor="true"
          className={`${tm.modal} fixed z-[120] w-[238px] rounded-[1.5rem] border p-3 shadow-2xl animate-fade-in-scale gpu-smooth`}
          style={{
            top: quickEdit.anchor.top,
            left: quickEdit.anchor.left,
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className={`text-[10px] font-black uppercase tracking-widest ${tm.textMuted}`}>
              {quickEdit.label}
            </p>
            <button
              type="button"
              onClick={() => setQuickEdit(null)}
              className={`p-1.5 rounded-full hover:bg-slate-500/10 ${tm.textMuted} hover:text-[#EF4444] transition-colors`}
              aria-label="Fechar ajuste rapido"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-[42px_1fr_42px] items-center gap-2">
            <button
              type="button"
              onClick={() => aplicarValorRapido(quickEdit.value - quickEdit.step)}
              className={`${isDark ? "bg-slate-900/70 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} h-10 rounded-2xl border text-lg font-black active:scale-95 transition-all`}
            >
              -
            </button>
            <input
              type="number"
              min={quickEdit.min}
              max={quickEdit.max}
              step={quickEdit.step}
              value={quickEdit.value}
              onChange={(event) => aplicarValorRapido(event.target.value)}
              className={`h-10 text-center rounded-2xl border text-sm font-black outline-none ${tm.input}`}
            />
            <button
              type="button"
              onClick={() => aplicarValorRapido(quickEdit.value + quickEdit.step)}
              className={`${isDark ? "bg-slate-900/70 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} h-10 rounded-2xl border text-lg font-black active:scale-95 transition-all`}
            >
              +
            </button>
          </div>
          <input
            type="range"
            min={quickEdit.min}
            max={quickEdit.max}
            step={quickEdit.step}
            value={quickEdit.value}
            onChange={(event) => aplicarValorRapido(event.target.value)}
            className="mt-3 w-full accent-[#10B981]"
          />
          <p className="mt-2 text-center text-[10px] font-black uppercase tracking-widest text-[#10B981]">
            {quickEdit.value}
            {quickEdit.suffix}
          </p>
        </div>
      )}

      {authCarregando || bloqueandoRenderCadastroEmail ? (
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 mesh-gradient-auth relative">
          <div className="w-full max-w-[460px] bg-[#0B1426]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 animate-fade-in-scale my-4">
            <div className="flex flex-col items-center gap-4">
              <LogoEnergiaPI size={72} className="mb-2" />
              <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-[10px] text-center font-bold uppercase tracking-wider">
                {bloqueandoRenderCadastroEmail
                  ? "Finalizando cadastro seguro"
                  : "Restaurando sessao segura"}
              </p>
            </div>
          </div>
        </div>
      ) : !autenticado ? (
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 mesh-gradient-auth relative scroll-custom overflow-y-auto">
          <div className="w-full max-w-[460px] bg-[#0B1426]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 animate-fade-in-scale my-4">
            <div className="flex flex-col items-center mb-6">
              <LogoEnergiaPI size={72} className="mb-4" />

              <h1 className="text-2xl font-extrabold tracking-tight mb-1 text-white">
                Energia<span className="text-[#10B981]">PI</span>
              </h1>
              <p className="text-slate-400 text-[10px] text-center font-medium max-w-xs leading-relaxed uppercase tracking-wider">
                Gamificando o consumo consciente de energia
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isLogin ? (
                /* ================= LOGIN VIEW ================= */
                <div className="space-y-4 animate-fade-in-scale">
                  <div>
                    <label className="block text-[11px] tracking-wider font-semibold text-slate-400 uppercase mb-2 ml-1">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => setEmailTocado(true)}
                      placeholder="ex. joao@gmail.com"
                      className={classeInputEmailLogin}
                    />
                    {emailInvalido && (
                      <p className="mt-1.5 ml-1 text-[10px] font-bold text-[#FCA5A5] uppercase tracking-wider">
                        Use Gmail, Hotmail, Outlook, Yahoo ou iCloud.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-wider font-semibold text-slate-400 uppercase mb-2 ml-1">
                      Senha
                    </label>
                    <input
                      required
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] focus:bg-white/10 text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authEmAndamento}
                    className="w-full mt-6 bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-bold text-sm py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_8px_25px_rgba(16,185,129,0.3)] tracking-wide flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {authProcessando === "email-login"
                      ? "Entrando..."
                      : "Iniciar Sessao"}{" "}
                    <ChevronRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authEmAndamento}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-3 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-sm backdrop-blur-md disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <GoogleIcon />
                    {authProcessando === "google-login"
                      ? "Conectando..."
                      : "Fazer login com o Google"}
                  </button>
                </div>
              ) : (
                /* ================= SIGNUP VIEW ================= */
                <div className="space-y-4 animate-fade-in-scale">
                  {/* BOTÃO DO GOOGLE (APPLE-LIKE GLASSMORPHISM) */}
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={authEmAndamento}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-3 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-sm backdrop-blur-md disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <GoogleIcon />
                    {authProcessando === "google-cadastro"
                      ? "Conectando..."
                      : "Cadastrar-se com o Google"}
                  </button>

                  {/* SELETOR DE PERFIL ANIMADO (Requisito 2) */}
                  <div className="relative bg-black/40 p-1 rounded-2xl flex items-center w-full select-none cursor-pointer border border-white/5 h-12">
                    {/* Slider Glider com cubic-bezier */}
                    <div
                      className="absolute top-1 bottom-1 bg-white rounded-xl shadow-lg switch-bezier"
                      style={{
                        width: "calc(50% - 4px)",
                        left: perfil === "estudante" ? "4px" : "calc(50%)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPerfil("estudante")}
                      className={`relative z-10 w-1/2 text-center text-xs font-bold transition-colors duration-300 ${perfil === "estudante" ? "text-slate-900" : "text-slate-400 hover:text-white"}`}
                    >
                      Estudante
                    </button>
                    <button
                      type="button"
                      onClick={() => setPerfil("morador")}
                      className={`relative z-10 w-1/2 text-center text-xs font-bold transition-colors duration-300 ${perfil === "morador" ? "text-slate-900" : "text-slate-400 hover:text-white"}`}
                    >
                      Morador
                    </button>
                  </div>

                  <div className="flex items-center my-4">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="mx-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                      Ou dados do perfil
                    </span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  {/* FORMULÁRIO COM TRANSIÇÃO FADE + SLIDE (Requisito 2) */}
                  <div className="space-y-3 switch-bezier">
                    <div>
                      <input
                        required
                        type="text"
                        value={nomeUsuario}
                        onChange={(e) => setNomeUsuario(e.target.value)}
                        placeholder="Nome Completo"
                        className="w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
                      />
                    </div>

                    <div>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={() => setEmailTocado(true)}
                        placeholder="Email (ex. joao@gmail.com)"
                        className={classeInputEmail}
                      />
                      {emailInvalido && (
                        <p className="mt-1.5 ml-1 text-[10px] font-bold text-[#FCA5A5] uppercase tracking-wider">
                          Use Gmail, Hotmail, Outlook, Yahoo ou iCloud.
                        </p>
                      )}
                    </div>

                    {/* ENDEREÇO */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          required
                          type="text"
                          value={cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          inputMode="numeric"
                          maxLength={9}
                          placeholder="CEP"
                          className={classeInputCep}
                        />
                      </div>
                      <input
                        required
                        type="text"
                        value={estadoCidade}
                        onChange={(e) => setEstadoCidade(e.target.value)}
                        placeholder="Cidade - UF"
                        className="w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
                      />
                    </div>
                    {cepMensagem && (
                      <p
                        className={`ml-1 text-[10px] font-bold uppercase tracking-wider ${cepStatus === "erro" ? "text-[#FCA5A5]" : cepStatus === "encontrado" ? "text-[#10B981]" : "text-slate-400"}`}
                      >
                        {cepMensagem}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        required
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Bairro"
                        className="col-span-2 w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
                      />
                      <input
                        required
                        type="text"
                        value={numero}
                        onChange={(e) => handleNumeroChange(e.target.value)}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Nº"
                        className="col-span-1 w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
                      />
                    </div>

                    {/* SENHAS */}
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        required
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Senha"
                        className="w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
                      />
                      <input
                        required
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        placeholder="Confirmar"
                        className="w-full bg-white/5 border border-white/10 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-white px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
                      />
                    </div>

                    {/* ESCOLA - EXIBIDO CONDICIONALMENTE (FADE + SLIDE) */}
                    {perfil === "estudante" && (
                      <div className="pt-1 transition-all duration-500 ease-out transform origin-top translate-y-0 opacity-100 animate-fade-in-scale space-y-3">
                        <SchoolSearchPicker
                          selectedSchool={escolaSelecionada}
                          onSelect={(escola) => {
                            setEscolaSelecionada(escola);
                            setEscolaUsuario(escola.nome);
                          }}
                          isDark={isDark}
                          tm={tm}
                          label="Escolha seu CETI"
                          buttonText="Pesquisar"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authEmAndamento}
                      className="w-full mt-4 bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-bold text-sm py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_8px_25px_rgba(16,185,129,0.3)] tracking-wide flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Zap size={18} className="text-white animate-pulse" />{" "}
                      {authProcessando === "email-cadastro"
                        ? "Criando conta..."
                        : "Concluir e Auditar"}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* SWITCHER LOGIN / CADASTRO */}
            <div className="mt-6 text-center relative z-10">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
                <span className="text-[#10B981] font-bold">
                  {isLogin ? "Cadastre-se aqui." : "Faça login aqui."}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : onboardingPendente ? (
        <OnboardingGate
          usuario={usuario}
          onSubmit={handleOnboardingSubmit}
          onLogout={handleLogout}
          isDark={isDark}
          tm={tm}
        />
      ) : (
        /* INTERFACE LOGADA DO AUDITOR */
        <div className="flex-1 flex flex-col min-h-screen">
          {/* HEADER PRINCIPAL */}
          <header
            className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${tm.header}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogoEnergiaPI size={40} />
                <div>
                  <h2 className={`text-md font-bold leading-none ${tm.text}`}>
                    Energia<span className="text-neon-green">PI</span>
                  </h2>
                  <p
                    className={`text-[10px] ${tm.textMuted} font-bold tracking-wider mt-0.5 uppercase`}
                  >
                    Membro:{" "}
                    {usuarioSeguro.perfil === "estudante"
                      ? "Estudante SEDUC"
                      : "Morador"}
                  </p>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-2">
                {ABAS_APP.map((aba) => (
                  <button
                    key={aba}
                    onClick={() => setAbaSelecionada(aba)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${abaSelecionada === aba ? (isDark ? "text-black bg-white font-black" : "text-white bg-black font-black") : `${tm.textMuted} hover:${tm.text}`}`}
                  >
                    {aba === "dashboard"
                      ? "Resumo"
                      : aba === "ranking"
                        ? "Escolas do Piauí"
                        : aba}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className={`text-xs font-bold ${tm.text}`}>
                    {primeiroNomeUsuario}
                  </p>
                  <p className="text-[10px] text-[#10B981] font-extrabold tracking-wider uppercase">
                    {usuarioSeguro.perfil === "estudante"
                      ? usuarioSeguro.escola
                      : "Piauí Ativo"}
                  </p>
                </div>

                <button
                  onClick={() => setMenuAberto(!menuAberto)}
                  className={`border p-2 rounded-xl transition-all active:scale-90 ${isDark ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600 hover:text-black"}`}
                >
                  {menuAberto ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </header>

          {/* PAINEL LATERAL DE CONFIGURAÇÕES */}
          {menuAberto && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMenuAberto(false)}
              />
              <div
                className={`relative w-80 max-w-full border-l h-full p-6 flex flex-col justify-between animate-modal ${isDark ? "bg-[#111d35] border-slate-800" : "bg-white border-slate-200"}`}
              >
                <div>
                  <div
                    className={`flex items-center justify-between mb-6 pb-4 border-b ${tm.border}`}
                  >
                    <h3
                      className={`font-extrabold text-sm tracking-widest uppercase ${tm.textMuted}`}
                    >
                      Menu do Auditor
                    </h3>
                    <button
                      onClick={() => setMenuAberto(false)}
                      className={`${tm.textMuted} hover:text-[#EF4444] transition-colors`}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div
                      className={`border rounded-xl p-4 ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}
                      >
                        Auditor Logado (
                        {usuarioSeguro.perfil === "estudante"
                          ? "Estudante"
                          : "Morador"}
                        )
                      </p>
                      <p className={`text-sm font-bold ${tm.text}`}>
                        {usuarioSeguro.nome}
                      </p>
                      <p className="text-xs text-[#10B981] font-bold tracking-wider mt-1 mb-2">
                        {usuarioSeguro.escola}
                      </p>
                      <p
                        className={`text-[10px] font-semibold flex items-center gap-1 ${tm.textMuted}`}
                      >
                        <MapPin size={10} /> {usuarioSeguro.endereco}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setTema(tema === "claro" ? "escuro" : "claro")
                      }
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-black"}`}
                    >
                      <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                        {isDark ? (
                          <Moon size={16} className="text-indigo-400" />
                        ) : (
                          <Sun size={16} className="text-amber-500" />
                        )}
                        Modo {tema === "claro" ? "Escuro" : "Claro"}
                      </span>
                      <div
                        className={`w-8 h-4 rounded-full relative transition-colors ${isDark ? "bg-indigo-600" : "bg-slate-300"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isDark ? "left-4" : "left-0.5"}`}
                        />
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        alert(
                          "Manual: 1) Evite banhos no pico. 2) Ar em 23°C.",
                        );
                        setMenuAberto(false);
                      }}
                      className={`w-full flex items-center gap-3 py-2 text-xs font-bold tracking-wider uppercase transition-all ${tm.textMuted} hover:${tm.text}`}
                    >
                      <Lightbulb size={16} className="text-[#06B6D4]" /> Manual
                      de Consumo
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444] hover:text-white font-bold text-xs py-3 px-4 rounded-xl transition-all tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95"
                >
                  <LogOut size={16} /> Encerrar Sessão
                </button>
              </div>
            </div>
          )}

          {/* SELETOR MOBILE INFERIOR */}
          <div
            className={`md:hidden fixed bottom-0 left-0 right-0 border-t py-2 px-4 z-40 flex justify-around pb-6 ${isDark ? "bg-[#0B1426]/95 border-slate-800" : "bg-white/95 border-slate-200"}`}
          >
            {ABAS_APP.map(
              (aba, i) => {
                const Icone = [TrendingDown, Lightbulb, Target, Users, School][
                  i
                ];
                const isActive = abaSelecionada === aba;
                return (
                  <button
                    key={aba}
                    onClick={() => setAbaSelecionada(aba)}
                    className={`flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-[#10B981]" : tm.textMuted}`}
                  >
                    <Icone size={16} />
                    <span>
                      {aba === "dashboard"
                        ? "Resumo"
                        : aba === "ranking"
                          ? "Escolas"
                          : aba}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          {/* CONTEÚDO PRINCIPAL */}
          <main
            data-app-scroll-root="true"
            className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12 scroll-custom ios-scroll overflow-y-auto touch-pan-y gpu-smooth"
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
          >
            {/* ABA: RESUMO / DASHBOARD */}
            {abaSelecionada === "dashboard" && (
              <div className="space-y-8 animate-fade-in-scale reveal-on-scroll">
                {/* Boas-vindas Banner */}
                <div
                  className={`border p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden ${isDark ? "bg-gradient-to-r from-[#031c0e] via-[#0B1426] to-[#0B1426] border-slate-800" : "bg-gradient-to-r from-emerald-50 via-white to-white border-emerald-100 shadow-sm"}`}
                >
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-extrabold tracking-widest text-[#10B981] uppercase">
                      Letramento Energético • Do Piauí para o Mundo
                    </span>
                    <h3
                      className={`text-2xl md:text-3xl font-extrabold tracking-tight mt-1 ${tm.text}`}
                    >
                      Olá, {usuarioSeguro.nome}!
                    </h3>
                    <p
                      className={`text-xs mt-1.5 max-w-xl leading-relaxed ${tm.textMuted}`}
                    >
                      Sua casa consome energia e gera CO₂. Ao mapear seus
                      equipamentos, você descobre os vilões de consumo e salva
                      dinheiro do orçamento familiar em {bairroUsuario}.
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-4 border p-4 rounded-2xl relative z-10 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
                  >
                    <div className="bg-[#10B981]/10 p-3 rounded-xl border border-[#10B981]/20">
                      <Award className="text-[#10B981]" size={28} />
                    </div>
                    <div>
                      <p
                        className={`text-[9px] font-extrabold uppercase tracking-widest ${tm.textMuted}`}
                      >
                        Score Acumulado
                      </p>
                      <p className={`text-xl font-black ${tm.text}`}>
                        {pontuacao}{" "}
                        <span className={`text-xs font-normal ${tm.textMuted}`}>
                          pts
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* INSIGHTS INTELIGENTES (Requisito 4) */}
                <div className="space-y-4 animate-fade-in-scale reveal-on-scroll">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-[#10B981]" />
                    <h3
                      className={`text-lg font-extrabold tracking-tight ${tm.text}`}
                    >
                      Faça agora: ações simples e poderosas!
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gerarInsightsInteligentes().map((insight) => (
                      <div
                        key={insight.id}
                        className={`border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between ${
                          insight.tipo === "alerta"
                            ? isDark
                              ? "bg-red-500/5 border-red-500/25"
                              : "bg-red-50 border-red-100"
                            : insight.tipo === "info"
                              ? isDark
                                ? "bg-blue-500/5 border-blue-500/25"
                                : "bg-blue-50 border-blue-100"
                              : isDark
                                ? "bg-[#111d35] border-slate-800"
                                : "bg-emerald-50/50 border-emerald-100"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`text-sm font-extrabold ${tm.text}`}>
                              {insight.titulo}
                            </h4>
                          </div>
                          <p
                            className={`text-xs leading-relaxed mb-4 ${tm.textMuted}`}
                          >
                            {insight.descricao}
                          </p>
                        </div>

                        {insight.economiaKwh > 0 && (
                          <div
                            className={`pt-3 border-t flex justify-between items-center ${isDark ? "border-slate-800" : "border-slate-200"}`}
                          >
                            <div className="text-left">
                              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">
                                Redução Esperada
                              </span>
                              <span className={`text-xs font-black ${tm.text}`}>
                                {insight.economiaKwh} kWh/mês
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-[#10B981] font-bold block uppercase tracking-wide">
                                Economia Extra
                              </span>
                              <span className="text-sm font-black text-[#10B981]">
                                R$ {insight.economiaReais}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: "Consumo Estimado",
                      tag: "Mensal",
                      valor: consumoTotal.toFixed(1),
                      suf: "kWh",
                      subt: "Baseado em hábitos declarados",
                      icon: <Zap size={10} className="text-[#10B981]" />,
                    },
                    {
                      title: "Custo Projetado",
                      tag: "Equatorial PI",
                      valor: `R$ ${custoTotal.toFixed(2)}`,
                      suf: "",
                      subt: "Tarifa ANEEL: R$ 0.88/kWh",
                      icon: null,
                    },
                    {
                      title: "Emissão de Carbono",
                      tag: "CO₂",
                      valor: carbonoTotal.toFixed(1),
                      suf: "kg",
                      subt: "Fator médio anual do SIN",
                      icon: null,
                      tagColor: "bg-[#EF4444]/10 text-[#EF4444]",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`${tm.card} border rounded-2xl p-5 ${tm.cardHover} transition-all duration-300`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <p
                          className={`text-[10px] font-bold tracking-wider uppercase ${tm.textMuted}`}
                        >
                          {stat.title}
                        </p>
                        <span
                          className={`${stat.tagColor || "bg-[#10B981]/10 text-[#10B981]"} text-[10px] font-bold py-1 px-2.5 rounded-full`}
                        >
                          {stat.tag}
                        </span>
                      </div>
                      <p className={`text-3xl font-black ${tm.text}`}>
                        {stat.valor}{" "}
                        <span className={`text-xs font-bold ${tm.textMuted}`}>
                          {stat.suf}
                        </span>
                      </p>
                      <p
                        className={`text-[10px] mt-2 flex items-center gap-1 ${tm.textMuted}`}
                      >
                        {stat.icon} {stat.subt}
                      </p>
                    </div>
                  ))}

                  <div
                    className={`${tm.card} border rounded-2xl p-5 ${tm.cardHover} transition-all duration-300`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <p
                        className={`text-[10px] font-bold tracking-wider uppercase ${tm.textMuted}`}
                      >
                        Conquistas Ativas
                      </p>
                      <span className="bg-purple-500/10 text-purple-500 text-[10px] font-bold py-1 px-2.5 rounded-full">
                        Badges
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-2xl">
                      <Emoji>{EMOJIS.broto}</Emoji>
                      {badges.includes("Eco Guardião") && (
                        <Emoji>{EMOJIS.dinheiro}</Emoji>
                      )}
                      {badges.includes("Mestre da Eficiência") && (
                        <Emoji>{EMOJIS.planeta}</Emoji>
                      )}
                    </div>
                    <p
                      className={`text-[10px] mt-2.5 font-bold tracking-wider uppercase ${tm.textMuted}`}
                    >
                      {badges.length} Desbloqueadas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div
                    className={`lg:col-span-2 border rounded-3xl p-6 space-y-6 ${tm.card}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`text-base font-bold ${tm.text}`}>
                          Ranking de Vilões de Consumo
                        </h4>
                        <p className={`text-xs ${tm.textMuted}`}>
                          Aparelhos com maior faturamento energético
                        </p>
                      </div>
                      <AlertTriangle size={18} className="text-[#EF4444]" />
                    </div>

                    <div className="space-y-4">
                      {eletrodomesticos.length === 0 ? (
                        <div
                          className={`text-center py-8 border-2 border-dashed rounded-2xl ${isDark ? "border-slate-800" : "border-slate-300"}`}
                        >
                          <ZapOff
                            size={32}
                            className={`mx-auto mb-2 ${tm.textMuted}`}
                          />
                          <p className={`text-sm font-bold ${tm.text}`}>
                            Nenhum aparelho monitorado
                          </p>
                          <p className={`text-xs ${tm.textMuted}`}>
                            Acesse a aba de "Aparelhos" para carregar seus
                            eletrodomésticos.
                          </p>
                        </div>
                      ) : (
                        eletrodomesticos
                          .filter((e) => e.active || e.ativo)
                          .sort(
                            (a, b) =>
                              calcularConsumoAparelho(b) -
                              calcularConsumoAparelho(a),
                          )
                          .map((elet, i) => {
                            const kwh = calcularConsumoAparelho(elet);
                            const porc = (
                              (kwh / (consumoTotal || 1)) *
                              100
                            ).toFixed(0);
                            return (
                              <div key={elet.id} className="space-y-2">
                                <div
                                  className={`flex justify-between text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-[#10B981] font-extrabold w-4">
                                      {i + 1}.
                                    </span>
                                    <Emoji>{elet.icone}</Emoji>
                                    <span>{elet.nome}</span>
                                  </span>
                                  <span>
                                    {porc}% ({kwh.toFixed(1)} kWh)
                                  </span>
                                </div>
                                <div
                                  className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                                >
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${i === 0 ? "bg-gradient-to-r from-[#EF4444] to-[#f87171]" : "bg-gradient-to-r from-[#10B981] to-[#06B6D4]"}`}
                                    style={{ width: `${porc}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  <div
                    className={`border rounded-3xl p-6 flex flex-col justify-between space-y-6 ${tm.card}`}
                  >
                    <div className="space-y-4">
                      <span className="text-[10px] font-extrabold tracking-widest text-[#10B981] uppercase">
                        Impacto Ambiental
                      </span>
                      <h4
                        className={`text-lg font-bold leading-tight ${tm.text}`}
                      >
                        Preserve o Piauí
                      </h4>
                      <p className={`text-xs leading-relaxed ${tm.textMuted}`}>
                        Seu consumo economizado ajuda na proteção e
                        sustentabilidade regional do Piauí.
                      </p>
                    </div>
                    <div
                      className={`border p-4 rounded-2xl flex items-center gap-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <span className="text-4xl">
                        <Emoji>{EMOJIS.arvore}</Emoji>
                      </span>
                      <div>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-widest ${tm.textMuted}`}
                        >
                          Equivalência Arbórea
                        </p>
                        <p className={`text-lg font-black ${tm.text}`}>
                          {(consumoTotal * 0.05).toFixed(1)} Árvores
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: CONFIGURAÇÃO DE APARELHOS */}
            {abaSelecionada === "aparelhos" && (
              <div className="space-y-6 animate-fade-in-scale reveal-on-scroll">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3
                      className={`text-2xl font-extrabold tracking-tight ${tm.text}`}
                    >
                      Diagnóstico de Equipamentos
                    </h3>
                    <p className={`text-xs ${tm.textMuted}`}>
                      Ajuste uso, frequência e quantidade dos aparelhos
                      monitorados.
                    </p>
                  </div>
                  <button
                    onClick={() => setModalTemplatesAberto(true)}
                    className="self-start sm:self-auto bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-extrabold text-xs py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-all duration-300 flex items-center gap-2 uppercase tracking-wider animate-pulse"
                  >
                    <Plus size={16} /> Adicionar Aparelho
                  </button>
                </div>

                {aparelhosCarregando ? (
                  <div
                    className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-3xl ${isDark ? "border-slate-800 bg-[#111d35]/30" : "border-slate-300 bg-white"}`}
                  >
                    <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className={`text-sm font-bold ${tm.text}`}>
                      Sincronizando aparelhos...
                    </p>
                  </div>
                ) : eletrodomesticos.length === 0 ? (
                  <div
                    className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-3xl ${isDark ? "border-slate-800 bg-[#111d35]/30" : "border-slate-300 bg-white"}`}
                  >
                    <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-4">
                      <ZapOff size={32} className="text-[#10B981]" />
                    </div>
                    <h4 className={`text-lg font-bold mb-2 ${tm.text}`}>
                      Você ainda não tem aparelhos monitorados
                    </h4>
                    <p className={`text-sm max-w-md mb-6 ${tm.textMuted}`}>
                      Adicione aparelhos para começar a ver onde você pode
                      economizar mais energia.
                    </p>
                    <button
                      onClick={() => setModalTemplatesAberto(true)}
                      className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 uppercase tracking-wider"
                    >
                      <Plus size={16} /> Iniciar Mapeamento
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {eletrodomesticos.map((elet) => {
                      const kwh = calcularConsumoAparelho(elet);
                      const reais = calcularCustoMensal(kwh, TARIFA_KWH_PI);
                      return (
                        <div
                          key={elet.id}
                          className={`border rounded-[2rem] p-6 space-y-5 transition-all duration-300 reveal-on-scroll gpu-smooth ${tm.card} ${!elet.ativo ? "opacity-50 grayscale-[0.3]" : ""}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl bg-white/5 p-2 rounded-xl border border-white/5">
                                <Emoji>{elet.icone}</Emoji>
                              </span>
                              <input
                                type="text"
                                value={elet.nome}
                                onChange={(e) =>
                                  atualizarEletrodomestico(
                                    elet.id,
                                    "nome",
                                    e.target.value,
                                  )
                                }
                                className={`bg-transparent border-b border-transparent focus:border-[#10B981] text-sm font-bold ${tm.text} outline-none w-full transition-colors`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  atualizarEletrodomestico(
                                    elet.id,
                                    "ativo",
                                    !elet.ativo,
                                  )
                                }
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border transition-all ${elet.ativo ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30" : isDark ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-slate-100 text-slate-500 border-slate-300"}`}
                              >
                                {elet.ativo ? "Ativo" : "Inativo"}
                              </button>
                              <button
                                onClick={() =>
                                  solicitarExclusaoEletrodomestico(elet)
                                }
                                className="text-[#EF4444]/60 hover:text-[#EF4444] p-1.5 bg-[#EF4444]/5 hover:bg-[#EF4444]/10 rounded-lg transition-colors active:scale-90"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-5 pt-2">
                            <div>
                              <div className="flex justify-between text-[11px] font-semibold mb-2">
                                <span className={tm.textMuted}>
                                  Potência Oficial:
                                </span>
                                <span className={`font-bold ${tm.text}`}>
                                  {elet.potencia} W
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] font-semibold mb-2">
                                <span className={tm.textMuted}>
                                  Uso Médio Diário:
                                </span>
                                <button
                                  type="button"
                                  data-quick-value="true"
                                  onClick={(event) =>
                                    abrirEditorRapido(event, {
                                      deviceId: elet.id,
                                      field: "usoHorasDia",
                                      label: "Uso diario",
                                      value: elet.usoHorasDia ?? elet.horasDia,
                                      min: 0,
                                      max: 24,
                                      step: 0.5,
                                      suffix: " h/dia",
                                    })
                                  }
                                  className={`font-bold ${tm.text} touch-manipulation transition-colors hover:text-[#10B981]`}
                                >
                                  {elet.usoHorasDia ?? elet.horasDia} h/dia
                                </button>
                              </div>
                              <SliderAnimado
                                value={elet.usoHorasDia ?? elet.horasDia}
                                min={0}
                                max={24}
                                step={0.5}
                                onChange={(e) =>
                                  atualizarEletrodomestico(
                                    elet.id,
                                    "usoHorasDia",
                                    parseFloat(e.target.value),
                                  )
                                }
                                colorClass="bg-gradient-to-r from-[#06B6D4] to-blue-500"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] font-semibold mb-2">
                                <span className={tm.textMuted}>
                                  Quantas vezes por semana:
                                </span>
                                <button
                                  type="button"
                                  data-quick-value="true"
                                  onClick={(event) =>
                                    abrirEditorRapido(event, {
                                      deviceId: elet.id,
                                      field: "diasPorSemana",
                                      label: "Frequencia",
                                      value: elet.diasPorSemana || 1,
                                      min: 1,
                                      max: 7,
                                      step: 1,
                                      suffix: "x/sem",
                                    })
                                  }
                                  className={`font-bold ${tm.text} touch-manipulation transition-colors hover:text-[#10B981]`}
                                >
                                  {elet.diasPorSemana || 1}x
                                </button>
                              </div>
                              <SliderAnimado
                                value={elet.diasPorSemana || 1}
                                min={1}
                                max={7}
                                step={1}
                                onChange={(e) =>
                                  atualizarEletrodomestico(
                                    elet.id,
                                    "diasPorSemana",
                                    parseInt(e.target.value),
                                  )
                                }
                                colorClass="bg-gradient-to-r from-[#10B981] to-[#06B6D4]"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] font-semibold mb-2">
                                <span className={tm.textMuted}>
                                  Quantidade de aparelhos:
                                </span>
                                <button
                                  type="button"
                                  data-quick-value="true"
                                  onClick={(event) =>
                                    abrirEditorRapido(event, {
                                      deviceId: elet.id,
                                      field: "quantidade",
                                      label: "Quantidade",
                                      value: elet.quantidade || 1,
                                      min: 1,
                                      max: 35,
                                      step: 1,
                                      suffix: "",
                                    })
                                  }
                                  className={`font-bold ${tm.text} touch-manipulation transition-colors hover:text-[#10B981]`}
                                >
                                  {elet.quantidade || 1}
                                </button>
                              </div>
                              <SliderAnimado
                                value={elet.quantidade || 1}
                                min={1}
                                max={35}
                                step={1}
                                onChange={(e) =>
                                  atualizarEletrodomestico(
                                    elet.id,
                                    "quantidade",
                                    parseInt(e.target.value),
                                  )
                                }
                                colorClass="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                              />
                            </div>
                          </div>

                          {elet.ativo && (
                            <div
                              className={`pt-4 border-t flex justify-between items-end ${tm.border}`}
                            >
                              <div>
                                <p
                                  className={`font-bold uppercase tracking-widest text-[9px] mb-1 ${tm.textMuted}`}
                                >
                                  Estimativa Mensal
                                </p>
                                <p
                                  className={`text-base font-black ${tm.text}`}
                                >
                                  {kwh.toFixed(1)}{" "}
                                  <span className="text-[10px] font-bold text-slate-500">
                                    kWh
                                  </span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-bold uppercase tracking-widest text-[9px] mb-1 ${tm.textMuted}`}
                                >
                                  Financeiro
                                </p>
                                <p className="text-base font-black text-[#10B981]">
                                  R$ {reais.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ABA: MISSÕES GAMIFICADAS (Requisito 2) */}
            {abaSelecionada === "missões" && (
              <div className="space-y-6 animate-fade-in-scale reveal-on-scroll">
                <div>
                  <h3
                    className={`text-2xl font-extrabold tracking-tight ${tm.text}`}
                  >
                    Pratique Economizar Energia!
                  </h3>
                  <p className={`text-xs ${tm.textMuted}`}>
                    Complete as missões semanais e ative novas conquistas
                    ambientais.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {missoesDisponiveis.map((missao) => (
                    <div
                      key={missao.id}
                      className={`border rounded-[2rem] p-6 flex flex-col justify-between space-y-5 relative overflow-hidden transition-all duration-500 animate-fade-in-scale ${
                        missao.concluida
                          ? isDark
                            ? "border-[#10B981]/30 bg-gradient-to-br from-[#10B981]/5 to-[#111d35]"
                            : "border-[#10B981]/50 bg-gradient-to-br from-emerald-50 to-white"
                          : tm.card
                      }`}
                    >
                      <div className="space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${isDark ? "text-slate-400 bg-slate-900" : "text-slate-600 bg-slate-100"}`}
                          >
                            {missao.categoria}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${missao.dificuldade.startsWith("F") ? "text-emerald-600 bg-emerald-500/10" : missao.dificuldade.startsWith("M") ? "text-cyan-600 bg-cyan-500/10" : "text-red-500 bg-red-500/10"}`}
                          >
                            {missao.dificuldade}
                          </span>
                        </div>
                        <h4
                          className={`text-lg font-extrabold flex items-center gap-2 ${tm.text}`}
                        >
                          {missao.concluida && (
                            <CheckCircle size={20} className="text-[#10B981]" />
                          )}
                          {missao.titulo}
                        </h4>
                        <p
                          className={`text-xs leading-relaxed font-medium ${tm.textMuted}`}
                        >
                          {missao.descricao}
                        </p>
                      </div>

                      <div
                        className={`grid grid-cols-3 gap-3 p-4 rounded-2xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="text-center">
                          <p
                            className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}
                          >
                            Economia
                          </p>
                          <p className={`text-sm font-black ${tm.text}`}>
                            {missao.impactoKwh}{" "}
                            <span className="text-[9px] text-slate-500">
                              kWh
                            </span>
                          </p>
                        </div>
                        <div className="text-center">
                          <p
                            className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}
                          >
                            Financeiro
                          </p>
                          <p className="text-sm font-black text-[#10B981]">
                            R$ {missao.impactoReais.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p
                            className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}
                          >
                            Score
                          </p>
                          <p className="text-sm font-black text-[#06B6D4]">
                            +{missao.pontos}{" "}
                            <span className="text-[9px] text-cyan-700/50">
                              pts
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="relative z-20">
                        {missao.concluida ? (
                          <div className="text-center bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider">
                            Concluída e Auditada
                          </div>
                        ) : missao.ativa ? (
                          <button
                            onClick={() => completarMissao(missao.id)}
                            className="w-full bg-gradient-to-r from-[#06B6D4] to-[#10B981] text-white font-extrabold text-xs py-4 rounded-2xl transition-all duration-300 uppercase tracking-wider active:scale-[0.98] shadow-[0_8px_20px_rgba(16,185,129,0.2)]"
                          >
                            Registrar Conclusão
                          </button>
                        ) : (
                          <button
                            onClick={() => aceitarMissao(missao.id)}
                            className={`w-full font-extrabold text-xs py-4 rounded-2xl transition-all duration-300 uppercase tracking-wider active:scale-95 border ${isDark ? "bg-slate-800 text-white hover:bg-slate-700 border-slate-700" : "bg-white text-slate-800 hover:bg-slate-50 border-slate-300 shadow-sm"}`}
                          >
                            Aceitar Missão
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {missoesFuturas.length > 0 && (
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <button
                      onClick={() => setVerMaisMissoes(!verMaisMissoes)}
                      className={`font-extrabold text-xs py-3.5 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 uppercase tracking-widest border ${isDark ? "bg-white text-slate-900 border-white/10" : "bg-slate-900 text-white border-slate-900"}`}
                    >
                      <Eye className="w-4 h-4" />{" "}
                      {verMaisMissoes
                        ? "Ocultar Missões Futuras"
                        : "Mostrar Mais Missões"}
                    </button>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest text-center ${tm.textMuted}`}
                    >
                      Missões futuras aparecem abaixo sem desbloquear
                      automaticamente
                    </p>
                  </div>
                )}

                {verMaisMissoes && missoesFuturas.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-scale">
                    {missoesFuturas.map((missao) => (
                      <div
                        key={missao.id}
                        className={`border rounded-[2rem] p-6 flex flex-col justify-between space-y-5 relative overflow-hidden transition-all duration-500 opacity-70 ${isDark ? "bg-slate-900/30 border-slate-800/80" : "bg-white/60 border-slate-200"}`}
                      >
                        <div className="absolute inset-0 bg-[#0B1426]/10 backdrop-blur-[1.5px] z-10 pointer-events-none" />
                        <div className="absolute top-5 right-5 z-20 bg-black/40 p-2.5 rounded-full border border-white/10 shadow-lg">
                          <LockIcon className="text-slate-300 w-4 h-4 animate-pulse" />
                        </div>

                        <div className="space-y-3 relative z-20 blur-[0.2px]">
                          <div className="flex items-center justify-between pr-12">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${isDark ? "text-slate-400 bg-slate-900" : "text-slate-600 bg-slate-100"}`}
                            >
                              {missao.categoria}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${missao.dificuldade.startsWith("F") ? "text-emerald-600 bg-emerald-500/10" : missao.dificuldade.startsWith("M") ? "text-cyan-600 bg-cyan-500/10" : "text-red-500 bg-red-500/10"}`}
                            >
                              {missao.dificuldade}
                            </span>
                          </div>
                          <h4
                            className={`text-lg font-extrabold flex items-center gap-2 ${tm.text}`}
                          >
                            {missao.titulo}
                          </h4>
                          <p
                            className={`text-xs leading-relaxed font-medium ${tm.textMuted}`}
                          >
                            {missao.descricao}
                          </p>
                        </div>

                        <div
                          className={`grid grid-cols-3 gap-3 p-4 rounded-2xl border relative z-20 ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                        >
                          <div className="text-center">
                            <p
                              className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}
                            >
                              Economia
                            </p>
                            <p className={`text-sm font-black ${tm.text}`}>
                              {missao.impactoKwh}{" "}
                              <span className="text-[9px] text-slate-500">
                                kWh
                              </span>
                            </p>
                          </div>
                          <div className="text-center">
                            <p
                              className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}
                            >
                              Financeiro
                            </p>
                            <p className="text-sm font-black text-[#10B981]">
                              R$ {missao.impactoReais.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p
                              className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${tm.textMuted}`}
                            >
                              Score
                            </p>
                            <p className="text-sm font-black text-[#06B6D4]">
                              +{missao.pontos}{" "}
                              <span className="text-[9px] text-cyan-700/50">
                                pts
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="relative z-20 text-center bg-white/5 border border-white/10 text-slate-300 py-3.5 rounded-2xl text-[10px] font-extrabold uppercase tracking-wider">
                          Libera com {missao.threshold} pts • Trilha{" "}
                          {missao.trilha}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA: COMUNIDADE (Requisito 6) */}
            {abaSelecionada === "comunidade" && (
              <div className="space-y-6 animate-fade-in-scale reveal-on-scroll">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3
                      className={`text-2xl font-extrabold tracking-tight ${tm.text}`}
                    >
                      Comunidade EnergiaPI
                    </h3>
                    <p className={`text-xs ${tm.textMuted}`}>
                      O ranking geral de pontuação dos auditores domésticos do
                      estado.
                    </p>
                  </div>
                  <div
                    className={`border p-3.5 rounded-2xl flex items-center gap-3 shadow-sm ${isDark ? "bg-[#111d35]/80 border-slate-800" : "bg-white border-slate-200"}`}
                  >
                    <Trophy className="text-[#10B981]" size={18} />
                    <span className="text-xs font-bold text-neon-green">
                      Líderes de Economia
                    </span>
                  </div>
                </div>

                <div
                  className={`border rounded-[2rem] overflow-hidden shadow-2xl ${tm.card}`}
                >
                  <div
                    className={`hidden md:grid grid-cols-12 gap-4 px-6 py-5 border-b text-[10px] font-extrabold tracking-widest uppercase ${isDark ? "bg-[#0B1426]/80 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                  >
                    <div className="col-span-1 text-center">Pos</div>
                    <div className="col-span-5">Auditor / Perfil</div>
                    <div className="col-span-3 text-left">CETI / Regional</div>
                    <div className="col-span-2 text-right">Badges</div>
                    <div className="col-span-1 text-right">Pontos</div>
                  </div>

                  <div
                    className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}
                  >
                    {rankingsCarregando && rankingComunidade.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className={`text-sm font-bold ${tm.text}`}>
                          Sincronizando comunidade...
                        </p>
                        <p className={`text-xs mt-1 ${tm.textMuted}`}>
                          Buscando ranking em tempo real.
                        </p>
                      </div>
                    ) : rankingComunidade.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <p className={`text-sm font-bold ${tm.text}`}>
                          Nenhum auditor ranqueado ainda.
                        </p>
                        <p className={`text-xs mt-1 ${tm.textMuted}`}>
                          Os dados aparecem quando usuários reais concluem o onboarding.
                        </p>
                        {rankingsErro && (
                          <p className="text-[10px] mt-3 font-bold uppercase tracking-wider text-[#F59E0B]">
                            Exibindo fallback local enquanto o Firestore responde.
                          </p>
                        )}
                      </div>
                    ) : rankingComunidade.map((item, index) => {
                      const isCurrentUser = item.nome === usuarioSeguro.nome;
                      return (
                        <div
                          key={item.id}
                          className={`grid grid-cols-[auto_1fr_auto] md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-5 items-center transition-all reveal-on-scroll ${
                            isCurrentUser
                              ? "bg-[#10B981]/5 border-y border-[#10B981]/15"
                              : isDark
                                ? "hover:bg-slate-800/30"
                                : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="md:col-span-1 text-center font-black text-sm row-span-2 md:row-span-1 self-start md:self-center pt-1 md:pt-0">
                            {index === 0 ? (
                              <span className="text-xl">
                                <Emoji>{EMOJIS.ouro}</Emoji>
                              </span>
                            ) : index === 1 ? (
                              <span className="text-lg">
                                <Emoji>{EMOJIS.prata}</Emoji>
                              </span>
                            ) : index === 2 ? (
                              <span className="text-base">
                                <Emoji>{EMOJIS.bronze}</Emoji>
                              </span>
                            ) : (
                              <span className={`text-xs ${tm.textMuted}`}>
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#10B981]/10 flex shrink-0 items-center justify-center border border-[#10B981]/25 text-sm font-bold">
                              {(item.nome || "A").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4
                                className={`font-extrabold text-xs sm:text-sm flex flex-wrap items-center gap-2 leading-snug ${tm.text}`}
                              >
                                {item.nome}
                                {isCurrentUser && (
                                  <span className="bg-[#10B981]/10 text-[#10B981] text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                    Você
                                  </span>
                                )}
                              </h4>
                              <p
                                className={`text-[10px] font-semibold mt-0.5 ${tm.textMuted}`}
                              >
                                {item.perfil}
                              </p>
                            </div>
                          </div>
                          <div className="col-start-2 col-span-2 md:col-start-auto md:col-span-3 min-w-0">
                            <p className={`text-xs font-bold truncate md:whitespace-normal ${tm.text}`}>
                              {item.escola}
                            </p>
                            <p className="text-[10px] text-[#10B981] font-bold mt-0.5">
                              {item.kwhSalvo} kWh Salvos
                            </p>
                          </div>
                          <div className="col-start-2 md:col-start-auto md:col-span-2 md:text-right text-lg select-none flex md:block gap-1 min-w-0">
                            {(item.badges || []).map((badge, badgeIndex) => (
                              <Emoji key={`${item.id}-${badgeIndex}`}>
                                {badge}
                              </Emoji>
                            ))}
                          </div>
                          <div className="col-start-3 row-start-1 md:row-start-auto md:col-start-auto md:col-span-1 md:text-right font-black text-xs text-neon-green justify-self-end">
                            {item.pontuacao || item.score || 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ABA: RANKING ESCOLAS */}
            {abaSelecionada === "ranking" && (
              <div className="space-y-6 animate-fade-in-scale reveal-on-scroll">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3
                      className={`text-2xl font-extrabold tracking-tight ${tm.text}`}
                    >
                      Copa Escolar de Sustentabilidade
                    </h3>
                    <p className={`text-xs ${tm.textMuted}`}>
                      Acompanhe a economia acumulada por cada colégio público
                      estadual.
                    </p>
                  </div>
                  <div
                    className={`border p-3.5 rounded-2xl flex items-center gap-3 shadow-sm ${isDark ? "bg-[#111d35]/80 border-slate-800" : "bg-white border-slate-200"}`}
                  >
                    <Users className="text-[#10B981]" size={18} />
                    <span
                      className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Unidos pela mudança
                    </span>
                  </div>
                </div>

                <div
                  className={`border rounded-[2rem] overflow-hidden shadow-2xl ${tm.card}`}
                >
                  <div
                    className={`hidden md:grid grid-cols-12 gap-4 px-6 py-5 border-b text-[10px] font-extrabold tracking-widest uppercase ${isDark ? "bg-[#0B1426]/80 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                  >
                    <div className="col-span-1 text-center">Pos</div>
                    <div className="col-span-6">Unidade Escolar / Regional</div>
                    <div className="col-span-3 text-right">Auditores</div>
                    <div className="col-span-2 text-right">Score</div>
                  </div>

                  <div
                    className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}
                  >
                    {rankingsCarregando && rankingEscolas.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className={`text-sm font-bold ${tm.text}`}>
                          Sincronizando escolas...
                        </p>
                      </div>
                    ) : rankingEscolas.map((escola, index) => {
                      const nomeEscola =
                        escola.nome ||
                        escola.name ||
                        escola.escolaNome ||
                        escola.escola ||
                        "CETI EnergiaPI";
                      return (
                      <div
                        key={escola.id || index}
                        className={`grid grid-cols-[auto_1fr_auto] md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-6 items-center transition-colors duration-200 reveal-on-scroll ${nomeEscola === escolaUsuario ? (isDark ? "bg-[#10B981]/5 border-y border-[#10B981]/20" : "bg-[#10B981]/5 border-y border-[#10B981]/20") : isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}`}
                      >
                        <div className="md:col-span-1 text-center font-black text-sm row-span-2 md:row-span-1 self-start md:self-center pt-1 md:pt-0">
                          {index === 0 ? (
                            <span className="text-2xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                              <Emoji>{EMOJIS.ouro}</Emoji>
                            </span>
                          ) : index === 1 ? (
                            <span className="text-xl">
                              <Emoji>{EMOJIS.prata}</Emoji>
                            </span>
                          ) : index === 2 ? (
                            <span className="text-lg">
                              <Emoji>{EMOJIS.bronze}</Emoji>
                            </span>
                          ) : (
                            <span className={`text-sm ${tm.textMuted}`}>
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div className="md:col-span-6 min-w-0">
                          <h4
                            className={`font-bold text-xs sm:text-sm flex flex-wrap items-center gap-2 leading-snug ${tm.text}`}
                          >
                            {nomeEscola}
                            {nomeEscola === escolaUsuario && (
                              <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                                Sua Escola
                              </span>
                            )}
                          </h4>
                          <p
                            className={`text-[10px] font-bold tracking-wider mt-1 uppercase ${tm.textMuted}`}
                          >
                            {escola.GRE || escola.gre} • {escola.regiao || escola.cidade}
                          </p>
                        </div>
                        <div
                          className={`col-start-2 col-span-2 md:col-start-auto md:col-span-3 md:text-right font-extrabold text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {escola.auditores ?? escola.alunosAtivos ?? 0}{" "}
                          <span className="text-[10px] text-slate-500 font-medium">
                            auditores
                          </span>
                        </div>
                        <div className="col-start-3 row-start-1 md:row-start-auto md:col-start-auto md:col-span-2 md:text-right font-black text-xs text-[#10B981] justify-self-end">
                          {escola.scoreTotal ?? escola.totalKwhSalvo ?? 0}{" "}
                          <span className="text-[9px] font-bold">pts</span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* MODAL 1: TEMPLATES DE APARELHOS (Clique fora e Scroll configurado) (Requisitos 3 e 5) */}
      {modalTemplatesAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div
            ref={modalTemplatesRef}
            className={`${tm.modal} w-full max-w-2xl border rounded-[2rem] p-6 md:p-8 shadow-2xl relative animate-fade-in-scale max-h-[85vh] overflow-y-auto scroll-smooth ios-scroll`}
          >
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
              <button
                onClick={() => {
                  fecharModalTemplates();
                  setModalNovoAberto(true);
                }}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-extrabold text-sm py-4 rounded-2xl shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider flex justify-center items-center gap-2"
              >
                <Plus size={18} /> Novo Aparelho Customizado
              </button>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3
                  className={`text-2xl font-extrabold tracking-tight ${tm.text}`}
                >
                  Escolha um Modelo
                </h3>
                <p className={`text-xs mt-1 ${tm.textMuted}`}>
                  Adicione rapidamente um dos eletrodomésticos abaixo:
                </p>
              </div>
              <button
                onClick={fecharModalTemplates}
                className={`p-2 rounded-full hover:bg-slate-500/10 ${tm.textMuted} hover:text-[#EF4444] transition-colors`}
              >
                <X size={20} />
              </button>
            </div>

            {/* BARRA DE PESQUISA INTELIGENTE (Requisito 5) */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px] gap-3 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={buscaTemplate}
                  onChange={(e) => setBuscaTemplate(e.target.value)}
                  placeholder="Pesquisar"
                  className={`w-full ${tm.input} pl-12 pr-5 py-4 rounded-2xl text-sm outline-none transition-all duration-300`}
                />
              </div>
              <select
                value={categoriaTemplate}
                onChange={(e) => setCategoriaTemplate(e.target.value)}
                className={`w-full ${tm.input} px-4 py-4 rounded-2xl text-xs outline-none transition-all duration-300 font-bold appearance-none`}
              >
                <option value="">Todas</option>
                {CATEGORIAS_APARELHOS.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto scroll-smooth ios-scroll pr-1 scroll-custom">
              {catalogoCarregando ? (
                <div className="col-span-2 text-center py-6">
                  <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className={`text-sm ${tm.textMuted}`}>
                    Buscando aparelhos...
                  </p>
                </div>
              ) : templatesFiltrados.length > 0 ? (
                templatesFiltrados.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => adicionarTemplate(tpl)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${isDark ? "bg-slate-900/30 border-slate-800 hover:border-[#10B981] hover:bg-slate-800/50" : "bg-slate-50 border-slate-200 hover:border-[#10B981] hover:shadow-md"}`}
                  >
                    <span className="text-3xl bg-white/5 p-2 rounded-xl border border-white/5">
                      <Emoji>{tpl.emoji || tpl.icone}</Emoji>
                    </span>
                    <div>
                      <p className={`font-bold text-sm ${tm.text}`}>
                        {tpl.nome}
                      </p>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${tm.textMuted}`}
                      >
                        {tpl.potencia}W • {tpl.usoHorasDia ?? tpl.horasDia}h/dia
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-2 text-center py-6">
                  <p className={`text-sm ${tm.textMuted}`}>
                    Nenhum modelo compatível encontrado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CRIAR NOVO APARELHO (Clique fora e Scroll configurado) (Requisito 3) */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div
            ref={modalNovoRef}
            className={`${tm.modal} w-full max-w-md border rounded-[2rem] p-6 md:p-8 shadow-2xl relative animate-fade-in-scale max-h-[90vh] overflow-y-auto scroll-smooth ios-scroll`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                className={`text-2xl font-extrabold tracking-tight ${tm.text}`}
              >
                Novo Aparelho
              </h3>
              <button
                onClick={() => setModalNovoAberto(false)}
                className={`p-2 rounded-full hover:bg-slate-500/10 ${tm.textMuted} hover:text-[#EF4444] transition-colors`}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={salvarNovoAparelhoCustomizado}
              className="space-y-4"
            >
              <div>
                <label
                  className={`block text-[10px] tracking-wider font-bold ${tm.textMuted} uppercase mb-2 ml-1`}
                >
                  Nome do Aparelho
                </label>
                <input
                  required
                  type="text"
                  value={novoAparelho.nome}
                  onChange={(e) =>
                    setNovoAparelho({ ...novoAparelho, nome: e.target.value })
                  }
                  placeholder="Ex: Air Fryer"
                  className={`w-full ${tm.input} px-5 py-4 rounded-2xl text-sm outline-none transition-all duration-300 font-medium`}
                />
              </div>

              <div>
                <label
                  className={`block text-[10px] tracking-wider font-bold ${tm.textMuted} uppercase mb-2 ml-1`}
                >
                  Categoria
                </label>
                <select
                  value={novoAparelho.categoria}
                  onChange={(e) =>
                    setNovoAparelho({
                      ...novoAparelho,
                      categoria: e.target.value,
                    })
                  }
                  className={`w-full ${tm.input} px-4 py-4 rounded-2xl text-sm outline-none transition-all duration-300 font-medium appearance-none`}
                >
                  {CATEGORIAS_APARELHOS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-[10px] tracking-wider font-bold ${tm.textMuted} uppercase mb-2 ml-1`}
                  >
                    Potência (W)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={novoAparelho.potencia}
                    onChange={(e) =>
                      setNovoAparelho({
                        ...novoAparelho,
                        potencia: Number(e.target.value),
                      })
                    }
                    className={`w-full ${tm.input} px-5 py-4 rounded-2xl text-sm outline-none transition-all duration-300 font-medium`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[10px] tracking-wider font-bold ${tm.textMuted} uppercase mb-2 ml-1`}
                  >
                    Uso (Horas/Dia)
                  </label>
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    max="24"
                    value={novoAparelho.usoHorasDia}
                    onChange={(e) =>
                      setNovoAparelho({
                        ...novoAparelho,
                        usoHorasDia: Number(e.target.value),
                      })
                    }
                    className={`w-full ${tm.input} px-5 py-4 rounded-2xl text-sm outline-none transition-all duration-300 font-medium`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-[10px] tracking-wider font-bold ${tm.textMuted} uppercase mb-2 ml-1`}
                  >
                    Vezes/Semana
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="7"
                    value={novoAparelho.diasPorSemana}
                    onChange={(e) =>
                      setNovoAparelho({
                        ...novoAparelho,
                        diasPorSemana: Number(e.target.value),
                      })
                    }
                    className={`w-full ${tm.input} px-5 py-4 rounded-2xl text-sm outline-none transition-all duration-300 font-medium`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[10px] tracking-wider font-bold ${tm.textMuted} uppercase mb-2 ml-1`}
                  >
                    Quantidade
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="35"
                    value={novoAparelho.quantidade}
                    onChange={(e) =>
                      setNovoAparelho({
                        ...novoAparelho,
                        quantidade: Number(e.target.value),
                      })
                    }
                    className={`w-full ${tm.input} px-5 py-4 rounded-2xl text-sm outline-none transition-all duration-300 font-medium`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={salvandoAparelho}
                className="w-full mt-6 bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-extrabold text-sm py-4 px-6 rounded-2xl hover:shadow-[0_8px_25px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-300 transform uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {salvandoAparelho ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Salvando...
                  </span>
                ) : (
                  <>
                    <CheckCircle size={18} /> Salvar Aparelho
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {aparelhoParaExcluir && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div
            className={`${tm.modal} w-full max-w-sm border rounded-[2rem] p-6 shadow-2xl animate-fade-in-scale`}
          >
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center">
                <Trash2 className="text-[#EF4444]" size={24} />
              </div>
              <h3 className={`text-lg font-extrabold ${tm.text}`}>
                Você deseja excluir este aparelho?
              </h3>
              <p className={`text-xs ${tm.textMuted}`}>
                {aparelhoParaExcluir.nome}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={confirmarExclusaoEletrodomestico}
                className="bg-[#EF4444] hover:bg-[#dc2626] text-white font-extrabold text-xs py-3.5 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-wider"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setAparelhoParaExcluir(null)}
                className={`${isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"} font-extrabold text-xs py-3.5 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-wider`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pequeno helper icon para a interface
function LockIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}
