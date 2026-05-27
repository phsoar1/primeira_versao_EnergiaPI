import { normalizarBusca } from "./search.js";

export const ESCOLA_NAO_APLICA = "Não se aplica";
export const NOME_AUDITOR_FALLBACK = "Participante EnergiaPI";

export const EMOJIS = {
  frio: "\u2744\uFE0F",
  gelo: "\u{1F9CA}",
  chuveiro: "\u{1F6BF}",
  tv: "\u{1F4FA}",
  ventilador: "\u{1F300}",
  lavanderia: "\u{1F9FA}",
  cozinha: "\u{1F372}",
  prato: "\u{1F37D}\uFE0F",
  computador: "\u{1F5A5}\uFE0F",
  notebook: "\u{1F4BB}",
  tomada: "\u{1F50C}",
  lampada: "\u{1F4A1}",
  fogo: "\u{1F525}",
  wifi: "\u{1F4F6}",
  camera: "\u{1F4F9}",
  agua: "\u{1F4A7}",
  copo: "\u{1F964}",
  limpeza: "\u{1F9F9}",
  energia: "\u26A1",
  broto: "\u{1F331}",
  planeta: "\u{1F30D}",
  dinheiro: "\u{1F4B0}",
  arvore: "\u{1F333}",
  ouro: "\u{1F947}",
  prata: "\u{1F948}",
  bronze: "\u{1F949}",
};

const MOJIBAKE_EMOJI_REGEX = /[\u00C2\u00C3\u00E2\u00F0\uFFFD]/;

export const normalizarEmojiVisual = (valor, fallback = EMOJIS.energia) => {
  const emoji = String(valor || "").trim();
  return !emoji || MOJIBAKE_EMOJI_REGEX.test(emoji) ? fallback : emoji;
};

const regrasIconesAparelhos = [
  { termos: ["ar-condicionado", "ar condicionado", "climatizador"], emoji: EMOJIS.frio },
  { termos: ["geladeira", "freezer"], emoji: EMOJIS.gelo },
  { termos: ["chuveiro"], emoji: EMOJIS.chuveiro },
  { termos: ["televisor", "televisao", "tv"], emoji: EMOJIS.tv },
  { termos: ["ventilador"], emoji: EMOJIS.ventilador },
  { termos: ["maquina de lavar", "lavadora", "lavar roupas"], emoji: EMOJIS.lavanderia },
  { termos: ["micro-ondas", "microondas", "micro ondas", "forno micro"], emoji: EMOJIS.prato },
  { termos: ["computador", "desktop"], emoji: EMOJIS.computador },
  { termos: ["notebook"], emoji: EMOJIS.notebook },
  { termos: ["ferro de passar"], emoji: EMOJIS.tomada },
  { termos: ["lampada", "luminaria"], emoji: EMOJIS.lampada },
  { termos: ["forno eletrico", "air fryer"], emoji: EMOJIS.fogo },
  { termos: ["roteador", "wi-fi", "wi fi", "wifi"], emoji: EMOJIS.wifi },
  { termos: ["camera"], emoji: EMOJIS.camera },
  { termos: ["bomba d'agua", "bomba dagua", "bomba de agua"], emoji: EMOJIS.agua },
  { termos: ["liquidificador"], emoji: EMOJIS.copo },
  { termos: ["aspirador"], emoji: EMOJIS.limpeza },
];

export const iconeAparelhoSeguro = (aparelho = {}) => {
  const nome = normalizarBusca(aparelho.nome || aparelho.name || "");
  const regra = regrasIconesAparelhos.find(({ termos }) =>
    termos.some((termo) => nome.includes(normalizarBusca(termo))),
  );
  if (regra) return regra.emoji;
  return normalizarEmojiVisual(aparelho.emoji || aparelho.icone);
};

export const apenasNumeros = (valor = "") =>
  String(valor || "").replace(/\D/g, "");

export const formatarCep = (valor = "") => {
  const digitos = apenasNumeros(valor).slice(0, 8);
  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
};

export const montarEndereco = ({ bairro, numero, cidade, estado, cep }) =>
  [bairro, numero ? `Nº ${numero}` : "", cidade && estado ? `${cidade} - ${estado}` : cidade || estado]
    .filter(Boolean)
    .join(", ") + (cep ? ` - CEP: ${formatarCep(cep)}` : "");

export const normalizarEmail = (valor = "") => String(valor).trim().toLowerCase();

export const normalizarTipoUsuario = (tipo) => {
  if (tipo === "morador") return "morador";
  if (tipo === "seduc" || tipo === "estudante") return "estudante";
  return "";
};

export const escolaIdPareceSlug = (valor = "") =>
  /^ceti_[a-z0-9_]+$/i.test(String(valor).trim());

export const nomeAPartirSlugEscola = (valor = "") => {
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

export const campoNomeEscolaValido = (valor = "") => {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  if (texto.toLowerCase() === "escola sem nome") return "";
  if (escolaIdPareceSlug(texto)) return "";
  return texto;
};

export const obterGre = (origem = {}) => origem?.gre || origem?.GRE || "";

export const obterIdEscola = (school = {}) =>
  school.escolaId ||
  school.schoolId ||
  school.id ||
  school.docId ||
  school.slug ||
  "";

export const nomePublicoEscola = (escola = {}, fallbackSeeds = new Map()) => {
  const camposPossiveis = [
    escola.escolaNome,
    escola.nomeEscola,
    escola.schoolName,
    escola.title,
    escola.school,
    escola.escola,
    escola.nome,
    escola.name,
    escola.razaoSocial,
  ];
  const nome = camposPossiveis.map(campoNomeEscolaValido).find(Boolean);
  if (nome) return nome;

  const idEscola = obterIdEscola(escola);
  const seed = fallbackSeeds.get?.(idEscola);
  if (seed?.nome) return seed.nome;

  return nomeAPartirSlugEscola(idEscola || camposPossiveis.find(Boolean)) || "";
};
