import { useCallback, useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import {
  firebaseConfigStatus,
  isFirebaseConfigured,
} from "./services/firebase";
import GoogleIcon from "./components/auth/GoogleIcon";
import DeviceIcon from "./components/devices/DeviceIcon";
import MissionsView from "./components/missions/MissionsView";
import OnboardingGate from "./components/onboarding/OnboardingGate";
import CommunityRanking from "./components/rankings/CommunityRanking";
import SchoolRanking from "./components/rankings/SchoolRanking";
import SchoolSearchPicker from "./components/schools/SchoolSearchPicker";
import AnimatedSlider from "./components/ui/AnimatedSlider";
import BrandLogo from "./components/ui/BrandLogo";
import Emoji from "./components/ui/Emoji";
import QuickEditPopover from "./components/ui/QuickEditPopover";
import Toast from "./components/ui/Toast";
import { CATEGORIAS_APARELHOS } from "./data/seedData";
import { useDeviceCatalogSearch } from "./hooks/useCatalogSearch";
import { useCommunityRanking } from "./hooks/useCommunityRanking";
import { useMissions } from "./hooks/useMissions";
import { useSwipeNavigation } from "./hooks/useSwipeNavigation";
import { useDevices } from "./hooks/useDevices";
import {
  createAccountWithEmail,
  detectarAuthProvider,
  getCurrentFirebaseUser,
  lerPerfisSalvos,
  loginWithEmail,
  loginWithGooglePopup,
  loginWithGoogleRedirect,
  logoutFirebase,
  registrarErroAuth,
  resolveGoogleRedirect,
  salvarPerfilUsuario,
  subscribeAuthState,
  traduzirErroFirebase,
} from "./services/authService";
import {
  addUserScore,
  completeUserOnboarding,
  ensureUserDocument,
  saveUserProfile,
  subscribeUserDocument,
} from "./services/userService";
import {
  calcularCarbonoMensal,
  calcularConsumoAparelho,
  calcularConsumoMensal,
  calcularCustoMensal,
  gerarInsightsEnergeticos,
  TARIFA_KWH_PI,
} from "./utils/calculations";
import {
  apenasNumeros,
  EMOJIS,
  ESCOLA_NAO_APLICA,
  formatarCep,
  iconeAparelhoSeguro,
  montarEndereco,
  normalizarEmail,
  normalizarTipoUsuario,
  NOME_AUDITOR_FALLBACK,
  obterGre,
} from "./utils/formatters";
import { emailEhPermitido, verificarSenhasIguais } from "./utils/validators";

// ==========================================
// CONFIGURAÇÃO DA LOGO DO PROJETO ENERGIAPI
// ==========================================
const ABAS_APP = ["dashboard", "aparelhos", "missões", "comunidade", "ranking"];

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
    nome: perfilSalvo?.nome || firebaseUser.displayName || NOME_AUDITOR_FALLBACK,
    email: perfilSalvo?.email || firebaseUser.email || "",
    tipoUsuario,
    onboardingCompleto: Boolean(
      perfilSalvo?.onboardingCompleto ?? Boolean(perfilSalvo),
    ),
    escolaId: perfilSalvo?.escolaId || "",
    escolaNome: tipoUsuario === "estudante" ? escolaNome : "",
    gre: tipoUsuario === "estudante" ? obterGre(perfilSalvo) : "",
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
  const authSyncSeqRef = useRef(0);

  const {
    devices: eletrodomesticos,
    loading: aparelhosCarregando,
    addDevice,
    updateDevice,
    deleteDevice,
  } = useDevices(usuario?.uid);
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
  const missoesAtivas = missoesComProgresso.filter(
    (missao) => missao.ativa === true && missao.concluida === false,
  );
  const {
    escolasOrdenadas: rankingEscolasOrdenado,
    comunidadeOrdenada: rankingComunidadeOrdenado,
    loading: rankingsCarregando,
    error: rankingsErro,
  } = useCommunityRanking();

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
        : NOME_AUDITOR_FALLBACK,
    email: typeof usuario?.email === "string" ? usuario.email : "",
    escola:
      typeof usuario?.escolaNome === "string" && usuario.escolaNome.trim()
        ? usuario.escolaNome.trim()
        : typeof usuario?.escola === "string" && usuario.escola.trim()
          ? usuario.escola.trim()
          : "EnergiaPI",
    escolaId: usuario?.escolaId || "",
    gre: obterGre(usuario),
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
  const onboardingPendente =
    autenticado &&
    !authCarregando &&
    usuario &&
    usuario.authProvider === "google" &&
    usuario.onboardingCompleto !== true;
  const bloqueandoRenderCadastroEmail =
    authProcessando === "email-cadastro" && autenticado;
  const { handleSwipeStart, handleSwipeEnd } = useSwipeNavigation({
    abas: ABAS_APP,
    abaAtual: abaSelecionada,
    onChange: setAbaSelecionada,
  });

  const dispararNotificacao = useCallback((mensagem) => {
    setNotificacao(mensagem);
    setTimeout(() => setNotificacao(null), 4000);
  }, []);

  const validarFirebaseConfigurado = useCallback(() => {
    if (isFirebaseConfigured) return true;

    console.warn("[Firebase Config] Login bloqueado", firebaseConfigStatus);
    dispararNotificacao(
      "Não foi possível conectar aos serviços do app. Confira a configuração do ambiente.",
    );
    return false;
  }, [dispararNotificacao]);

  const fecharModalTemplates = useCallback(() => {
    setModalTemplatesAberto(false);
    setBuscaTemplate("");
    setCategoriaTemplate("");
  }, []);

  const consumoTotal = eletrodomesticos.reduce((acc, elet) => {
    return elet.ativo === false ? acc : acc + calcularConsumoMensal(elet);
  }, 0);
  const custoTotal = calcularCustoMensal(consumoTotal, TARIFA_KWH_PI);
  const carbonoTotal = calcularCarbonoMensal(consumoTotal);
  const tarifaFormatada = TARIFA_KWH_PI.toFixed(2).replace(".", ",");
  const insightsEnergeticos = gerarInsightsEnergeticos({
    aparelhos: eletrodomesticos,
    consumoTotal,
    custoTotal,
  });

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
      normalizarTipoUsuario(origem.tipoUsuario) ||
      (origem.perfil === "morador" ? "morador" : "");
    const perfilVisual =
      tipoUsuario || (origem.perfil === "morador" ? "morador" : "estudante");
    const escolaNome =
      tipoUsuario === "estudante"
        ? origem.escolaNome || origem.escola || ""
        : "";
    const gre = tipoUsuario === "estudante" ? obterGre(origem) : "";
    const authProvider = detectarAuthProvider(firebaseUser, origem);
    const perfilSeguro = {
      ...origem,
      uid: firebaseUser.uid,
      nome: origem.nome || firebaseUser.displayName || NOME_AUDITOR_FALLBACK,
      email: origem.email || firebaseUser.email || "",
      tipoUsuario,
      perfil: perfilVisual,
      authProvider,
      onboardingCompleto: origem.onboardingCompleto === true && Boolean(tipoUsuario),
      escolaId: tipoUsuario === "estudante" ? origem.escolaId || "" : "",
      escolaNome,
      escola: tipoUsuario === "morador" ? ESCOLA_NAO_APLICA : escolaNome,
      gre,
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
        gre,
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
        const resultadoRedirect = await resolveGoogleRedirect();

        if (ativo && resultadoRedirect?.user) {
          await sincronizarUsuarioAutenticado(resultadoRedirect.user);
          dispararNotificacao("Conta Google conectada.");
        }
      } catch (error) {
        registrarErroAuth("google-redirect", error);
        dispararNotificacao(traduzirErroFirebase(error));
      }
    };

    resolverRedirect();

    const unsubscribe = subscribeAuthState(
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
        const tipoUsuario = normalizarTipoUsuario(perfilFirestore.tipoUsuario);
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
          gre: obterGre(perfilFirestore),
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
          throw new Error("Falha ao consultar o CEP.");
        }

        const dados = await resposta.json();

        if (dados.erro) {
          setCepStatus("erro");
          setCepMensagem("CEP não encontrado.");
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
          setCepMensagem("Não foi possível consultar o CEP agora.");
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
    const modalAberto =
      modalTemplatesAberto || modalNovoAberto || Boolean(aparelhoParaExcluir);
    if (!modalAberto) return undefined;

    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [aparelhoParaExcluir, modalNovoAberto, modalTemplatesAberto]);

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
    rankingComunidadeOrdenado.length,
    rankingEscolasOrdenado.length,
  ]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authEmAndamento) return;
    if (!validarFirebaseConfigurado()) return;

    if (!validarEmailFormulario()) return;

    setAuthProcessando(isLogin ? "email-login" : "email-cadastro");

    try {
      if (isLogin) {
        if (!email || !senha) {
          dispararNotificacao("Preencha email e senha para entrar.");
          return;
        }

        const credencial = await loginWithEmail(emailNormalizado, senha);
        await sincronizarUsuarioAutenticado(credencial.user);
        dispararNotificacao("Bem-vindo de volta. Seu diagnóstico está pronto.");
        return;
      }

      if (!verificarSenhasIguais(senha, confirmarSenha)) {
        dispararNotificacao("As senhas digitadas não coincidem.");
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
          "Preencha os dados obrigatórios para concluir o perfil.",
        );
        return;
      }

      const credencial = await createAccountWithEmail({
        email: emailNormalizado,
        senha,
        nome: nomeUsuario,
      });

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
        gre: perfil === "estudante" ? obterGre(escolaSelecionada) : "",
        score: 0,
        escola: perfil === "estudante" ? escolaUsuario : ESCOLA_NAO_APLICA,
        endereco: montarEndereco({
          bairro,
          numero,
          cidade: cidadeCadastro,
          estado: estadoCadastro,
          cep,
        }),
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
        `Cadastro concluído. Perfil: ${perfil === "estudante" ? "estudante" : "morador"}.`,
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
        nome: firebaseUser.displayName || nomeUsuario || NOME_AUDITOR_FALLBACK,
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
          ? "Login com Google concluído."
          : "Cadastro com Google concluído."
        : "Complete seu perfil para liberar a plataforma.",
    );
  };

  const autenticarComGoogle = async (origem = "cadastro") => {
    if (authEmAndamento) return;
    if (!validarFirebaseConfigurado()) return;

    setAuthProcessando(origem === "login" ? "google-login" : "google-cadastro");
    let usandoRedirect = false;

    try {
      const credencial = await loginWithGooglePopup();
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
          await loginWithGoogleRedirect();
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
      await logoutFirebase();
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
      const firebaseUser = await getCurrentFirebaseUser();
      if (!firebaseUser) {
        dispararNotificacao("Sessão expirada. Entre novamente.");
        return;
      }

      const perfilFirebase = {
        uid: firebaseUser.uid,
        nome: usuario?.nome || firebaseUser.displayName || NOME_AUDITOR_FALLBACK,
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
        "Não foi possível concluir o perfil agora. Tente novamente.",
      );
    }
  };

  const adicionarTemplate = async (template) => {
    try {
      await addDevice({
        ...template,
        deviceId: template.id,
        emoji: iconeAparelhoSeguro(template),
        icone: iconeAparelhoSeguro(template),
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
        emoji: iconeAparelhoSeguro(novoAparelho),
        icone: iconeAparelhoSeguro(novoAparelho),
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
    const numericValue = Number(nextValue);
    if (!Number.isFinite(numericValue)) return;
    const decimals = String(quickEdit.step).includes(".")
      ? String(quickEdit.step).split(".")[1].length
      : 0;
    const next = Number(
      Math.min(
        Math.max(numericValue, quickEdit.min),
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

  return (
    <div
      className={`min-h-dvh h-dvh flex flex-col overflow-hidden antialiased selection:bg-[#10B981] selection:text-white transition-colors duration-500 ${tm.bg} ${tm.text}`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        html, body, #root {
          height: 100%;
          overflow: hidden;
        }
        .auth-scroll-wrapper {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        body {
          touch-action: manipulation;
          -webkit-text-size-adjust: 100%;
        }
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
          overscroll-behavior-y: contain;
        }
        input[type="range"] {
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          height: 24px;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
          accent-color: #10B981;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #10B981, #06B6D4);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          margin-top: -6px;
          border-radius: 9999px;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.12);
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.24);
        }
        input[type="range"]::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #10B981, #06B6D4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border: 0;
          border-radius: 9999px;
          background: #fff;
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.24);
        }
        
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-scale { animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .toast-enter { animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .reveal-on-scroll,
          .animate-fade-in-scale,
          .toast-enter {
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

      <Toast
        mensagem={notificacao}
        isDark={isDark}
        tm={tm}
        onClose={() => setNotificacao(null)}
      />

      <QuickEditPopover
        quickEdit={quickEdit}
        isDark={isDark}
        tm={tm}
        onApply={aplicarValorRapido}
        onClose={() => setQuickEdit(null)}
      />

      {authCarregando || bloqueandoRenderCadastroEmail ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-4 md:p-8 mesh-gradient-auth relative overflow-y-auto">
          <div className="w-full max-w-[460px] bg-[#0B1426]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 animate-fade-in-scale my-4">
            <div className="flex flex-col items-center gap-4">
              <BrandLogo size={72} className="mb-2" />
              <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-[10px] text-center font-bold uppercase tracking-wider">
                {bloqueandoRenderCadastroEmail
                  ? "Finalizando cadastro"
                  : "Abrindo sua sessão"}
              </p>
            </div>
          </div>
        </div>
      ) : !autenticado ? (
        <div className="flex-1 min-h-0 flex items-start md:items-center justify-center p-4 md:p-8 mesh-gradient-auth relative scroll-custom ios-scroll auth-scroll-wrapper">
          <div className="w-full max-w-[460px] bg-[#0B1426]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-6 py-6 pb-10 md:px-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 animate-fade-in-scale my-6 mx-auto">
            <div className="flex flex-col items-center mb-6">
              <BrandLogo size={72} className="mb-4" />

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
                      : "Entrar"}{" "}
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
                      {authProcessando === "email-cadastro"
                        ? "Criando conta..."
                        : "Avançar"}
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
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* HEADER PRINCIPAL */}
          <header
            className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${tm.header}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandLogo size={40} />
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
                      ? "Início"
                      : aba === "ranking"
                        ? "Ranking"
                        : aba === "aparelhos"
                          ? "Minha Casa"
                          : aba === "comunidade"
                            ? "Comunidade"
                            : aba === "missões"
                              ? "Missões"
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
                      Menu
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
                        {usuarioSeguro.perfil === "estudante"
                          ? "Estudante SEDUC"
                          : "Morador"}
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

                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444] hover:text-white font-bold text-xs py-3 px-4 rounded-xl transition-all tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95"
                >
                  <LogOut size={16} /> Sair
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
                        ? "Início"
                        : aba === "ranking"
                          ? "Ranking"
                          : aba === "aparelhos"
                            ? "Casa"
                            : aba === "comunidade"
                              ? "Turma"
                              : aba === "missões"
                                ? "Missões"
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
            className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden scroll-custom ios-scroll touch-pan-y gpu-smooth"
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12">
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
                      Seu diagnóstico energético • Do Piauí para o Mundo
                    </span>
                    <h3
                      className={`text-2xl md:text-3xl font-extrabold tracking-tight mt-1 ${tm.text}`}
                    >
                      Olá, {usuarioSeguro.nome}!
                    </h3>
                    <p
                      className={`text-xs mt-1.5 max-w-xl leading-relaxed ${tm.textMuted}`}
                    >
                      Cada aparelho ligado tem um custo. O EnergiaPI mostra
                      exatamente onde seu dinheiro vai embora — e como você
                      pode trazer ele de volta.
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
                        Seus pontos
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

                  {missoesAtivas.length > 0 && (
                    <div className="space-y-3">
                      <p
                        className={`text-[10px] font-extrabold uppercase tracking-widest ${tm.textMuted}`}
                      >
                        Missões em andamento
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {missoesAtivas.map((missao) => (
                          <div
                            key={missao.id}
                            className={`border rounded-2xl p-4 flex items-center justify-between gap-4 ${
                              isDark
                                ? "bg-[#10B981]/5 border-[#10B981]/20"
                                : "bg-emerald-50 border-emerald-200"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${tm.text}`}>
                                {missao.titulo}
                              </p>
                              <p className={`text-xs mt-0.5 ${tm.textMuted}`}>
                                +{missao.pontos} pts · {missao.categoria}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => completarMissao(missao.id)}
                              className="shrink-0 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
                            >
                              Concluir
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insightsEnergeticos.map((insight) => (
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
                      title: "Consumo do mês",
                      tag: "Mensal",
                      valor: consumoTotal.toFixed(1),
                      suf: "kWh",
                      subt: "Baseado nos seus aparelhos",
                      icon: <Zap size={10} className="text-[#10B981]" />,
                    },
                    {
                      title: "Sua conta estimada",
                      tag: "Equatorial PI",
                      valor: `R$ ${custoTotal.toFixed(2)}`,
                      suf: "",
                      subt: `Tarifa Equatorial PI: R$ ${tarifaFormatada}/kWh`,
                      icon: null,
                    },
                    {
                      title: "Carbono gerado",
                      tag: "CO₂",
                      valor: carbonoTotal.toFixed(1),
                      suf: "kg",
                      subt: "Equivalente a árvores derrubadas",
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
                        Suas conquistas
                      </p>
                      <span className="bg-purple-500/10 text-purple-500 text-[10px] font-bold py-1 px-2.5 rounded-full">
                        Medalhas
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
                      {badges.length === 1
                        ? "1 conquistada"
                        : `${badges.length} conquistadas`}
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
                          Maiores consumos da casa
                        </h4>
                        <p className={`text-xs ${tm.textMuted}`}>
                          Equipamentos que mais pesam na estimativa mensal
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
                                    <DeviceIcon device={elet} />
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
                        Seu impacto no Piauí
                      </h4>
                      <p className={`text-xs leading-relaxed ${tm.textMuted}`}>
                        Cada kWh economizado é um passo real. O que parece
                        pequeno em casa vira diferença quando toda a comunidade
                        faz junto.
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
                          Equivale a plantar
                        </p>
                        <p className={`text-lg font-black ${tm.text}`}>
                          {(consumoTotal * 0.05).toFixed(1)} árvores/mês
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
                      Quanto mais fiel ao seu dia a dia, mais certeiro fica o
                      diagnóstico.
                    </p>
                  </div>
                  <button
                    onClick={() => setModalTemplatesAberto(true)}
                    className="self-start sm:self-auto bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-extrabold text-xs min-h-[44px] py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider whitespace-nowrap animate-pulse"
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
                      Carregando seus aparelhos...
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
                      Sua casa ainda está no escuro
                    </h4>
                    <p className={`text-sm max-w-md mb-6 ${tm.textMuted}`}>
                      Cadastre o primeiro aparelho e descubra o vilão da sua
                      conta de luz.
                    </p>
                    <button
                      onClick={() => setModalTemplatesAberto(true)}
                      className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-extrabold text-xs min-h-[44px] py-3.5 px-6 rounded-2xl hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider whitespace-nowrap"
                    >
                      <Plus size={16} /> Cadastrar aparelho
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
                                <DeviceIcon device={elet} />
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
                                  Potência:
                                </span>
                                <span className={`font-bold ${tm.text}`}>
                                  {elet.potencia} W
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] font-semibold mb-2">
                                <span className={tm.textMuted}>
                                  Uso por dia:
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
                              <AnimatedSlider
                                value={elet.usoHorasDia ?? elet.horasDia}
                                min={0}
                                max={24}
                                step={0.5}
                                isDark={isDark}
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
                                  Dias por semana:
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
                              <AnimatedSlider
                                value={elet.diasPorSemana || 1}
                                min={1}
                                max={7}
                                step={1}
                                isDark={isDark}
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
                              <AnimatedSlider
                                value={elet.quantidade || 1}
                                min={1}
                                max={35}
                                step={1}
                                isDark={isDark}
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
                                  Consumo/mês
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
                                  Custo/mês
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
              <MissionsView
                disponiveis={missoesDisponiveis}
                futuras={missoesFuturas}
                verMais={verMaisMissoes}
                onToggleMore={() => setVerMaisMissoes(!verMaisMissoes)}
                onAccept={aceitarMissao}
                onComplete={completarMissao}
                tm={tm}
                isDark={isDark}
              />
            )}

            {/* ABA: COMUNIDADE (Requisito 6) */}
            {abaSelecionada === "comunidade" && (
              <CommunityRanking
                items={rankingComunidadeOrdenado}
                loading={rankingsCarregando}
                error={rankingsErro}
                usuario={usuarioSeguro}
                tm={tm}
                isDark={isDark}
              />
            )}

            {/* ABA: RANKING ESCOLAS */}
            {abaSelecionada === "ranking" && (
              <SchoolRanking
                escolas={rankingEscolasOrdenado}
                loading={rankingsCarregando}
                escolaUsuario={escolaUsuario}
                tm={tm}
                isDark={isDark}
              />
            )}
            </div>
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
                    Procurando modelos...
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
                      <DeviceIcon device={tpl} />
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
                Remover {aparelhoParaExcluir?.nome || "este aparelho"}?
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
                Sim, remover
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
