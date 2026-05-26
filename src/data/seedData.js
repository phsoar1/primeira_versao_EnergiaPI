import {
  calcularConsumoMensal,
  calcularCustoMensal,
} from "../utils/energyCalculations.js";
import { criarIdPadronizado, criarKeywords } from "../utils/text.js";
import schoolsJson from "./schools.json" with { type: "json" };

export const CATEGORIAS_APARELHOS = [
  "Cozinha",
  "Tecnologia",
  "Climatização",
  "Iluminação",
  "Segurança",
  "Banheiro",
  "Lavanderia",
  "Lazer",
  "Ferramentas",
];

export const GRE_OPTIONS = [
  "1ª GRE",
  "2ª GRE",
  "3ª GRE",
  "4ª GRE",
  "5ª GRE",
  "6ª GRE",
  "7ª GRE",
  "8ª GRE",
  "9ª GRE",
  "10ª GRE",
  "11ª GRE",
  "12ª GRE",
  "13ª GRE",
  "14ª GRE",
  "15ª GRE",
  "16ª GRE",
  "17ª GRE",
  "18ª GRE",
  "19ª GRE",
  "20ª GRE",
  "21ª GRE",
];

export const SCHOOLS_SEED = schoolsJson.map((school) => {
  const nome = school.nome;
  const GRE = school.GRE || school.gre || "";
  const cidade = school.cidade || "";
  const regiao = school.regiao || "";
  const id = school.id || criarIdPadronizado(nome.replace(/^CETI\s+/i, ""), "ceti");
  return {
    id,
    nome,
    GRE,
    gre: GRE,
    cidade,
    regiao,
    auditores: Number(school.auditores || 0),
    scoreTotal: Number(school.scoreTotal || 0),
    tipo: "CETI",
    keywords: criarKeywords(nome, nome.replace(/^CETI\s+/i, ""), GRE, cidade, regiao),
  };
});

const devicesBase = [
  ["Geladeira Frost-Free", "🧊", "Cozinha", 150, 24, 7],
  ["Chuveiro Elétrico", "🚿", "Banheiro", 4500, 0.5, 7],
  ["Ar-condicionado 9000 BTUs", "🌬️", "Climatização", 1200, 6, 7],
  ['Televisor LED 50"', "📺", "Lazer", 100, 5, 7],
  ["Ventilador de Coluna", "🌀", "Climatização", 80, 8, 7],
  ["Máquina de Lavar", "🧺", "Lavanderia", 500, 1, 3],
  ["Forno Micro-ondas", "🍽️", "Cozinha", 1200, 0.3, 7],
  ["Computador Desktop", "🖥️", "Tecnologia", 300, 4, 7],
  ["Ferro de Passar Roupas", "🔌", "Lavanderia", 1500, 0.5, 3],
  ["Lâmpada Incandescente 60W", "💡", "Iluminação", 60, 5, 7],
  ["Lâmpada LED 9W", "💡", "Iluminação", 9, 5, 7],
  ["Forno Elétrico", "🔥", "Cozinha", 1500, 0.4, 3],
  ["Air Fryer", "🍟", "Cozinha", 1400, 0.5, 5],
  ["Freezer Horizontal", "🧊", "Cozinha", 220, 24, 7],
  ["Notebook", "💻", "Tecnologia", 65, 6, 7],
  ["Roteador Wi-Fi", "📡", "Tecnologia", 12, 24, 7],
  ["Câmera de Segurança", "📹", "Segurança", 10, 24, 7],
  ["Bomba d'água", "💧", "Ferramentas", 370, 1, 4],
  ["Liquidificador", "🥤", "Cozinha", 600, 0.15, 5],
  ["Aspirador de Pó", "🧹", "Ferramentas", 1200, 0.4, 2],
];

export const DEVICES_SEED = devicesBase.map(
  ([nome, emoji, categoria, potencia, usoHorasDia, diasPorSemana]) => {
    const consumoMensal = calcularConsumoMensal({
      potencia,
      usoHorasDia,
      diasPorSemana,
      quantidade: 1,
    });

    return {
      id: criarIdPadronizado(nome),
      nome,
      emoji,
      categoria,
      potencia,
      usoHorasDia,
      consumoMensal,
      custoMensal: calcularCustoMensal(consumoMensal),
      keywords: criarKeywords(
        nome,
        categoria,
        String(potencia),
        nome.split(" ")[0],
      ),
    };
  },
);

export const MISSIONS_SEED = [
  {
    id: "chuveiro_modo_verao",
    titulo: "Chuveiro no Modo Verão",
    descricao:
      'Altere a chave do chuveiro elétrico para a posição "Morna" ou use banhos mais curtos durante a semana.',
    pontos: 50,
    scoreNecessario: 0,
    ordem: 1,
    bloqueada: false,
    impactoKwh: 22.5,
    impactoReais: 19.8,
    dificuldade: "Fácil",
    categoria: "Banheiro",
  },
  {
    id: "standby_zero",
    titulo: "Operação Standby Zero",
    descricao:
      "Desligue da tomada filtros de linha com aparelhos em standby antes de dormir.",
    pontos: 50,
    scoreNecessario: 0,
    ordem: 2,
    bloqueada: false,
    impactoKwh: 8.4,
    impactoReais: 7.39,
    dificuldade: "Fácil",
    categoria: "Geral",
  },
  {
    id: "mapear_cinco_aparelhos",
    titulo: "Mapa dos 5 Maiores Consumos",
    descricao:
      "Cadastre e revise pelo menos cinco aparelhos para entender onde sua casa consome mais energia.",
    pontos: 40,
    scoreNecessario: 50,
    ordem: 3,
    bloqueada: true,
    impactoKwh: 6,
    impactoReais: 5.28,
    dificuldade: "Fácil",
    categoria: "Diagnóstico",
  },
  {
    id: "iluminacao_led",
    titulo: "Iluminação Inteligente LED",
    descricao:
      "Troque pelo menos duas lâmpadas antigas da casa por tecnologia LED.",
    pontos: 45,
    scoreNecessario: 100,
    ordem: 4,
    bloqueada: true,
    impactoKwh: 12,
    impactoReais: 10.56,
    dificuldade: "Médio",
    categoria: "Iluminação",
  },
  {
    id: "ar_condicionado_23",
    titulo: "Ar-condicionado no 23°C",
    descricao: "Mantenha o ar em 23°C e utilize a função Sleep/Timer.",
    pontos: 100,
    scoreNecessario: 180,
    ordem: 5,
    bloqueada: true,
    impactoKwh: 36,
    impactoReais: 31.68,
    dificuldade: "Médio",
    categoria: "Climatização",
  },
  {
    id: "lavar_agua_fria",
    titulo: "Lavar na Água Fria",
    descricao:
      "Configure sua máquina de lavar roupas para utilizar somente água fria durante os ciclos.",
    pontos: 70,
    scoreNecessario: 300,
    ordem: 6,
    bloqueada: true,
    impactoKwh: 20,
    impactoReais: 17.6,
    dificuldade: "Difícil",
    categoria: "Lavanderia",
  },
  {
    id: "horario_de_pico",
    titulo: "Desafio do Horário de Pico",
    descricao:
      "Evite usar aparelhos de alta potência das 18h às 21h por 5 dias.",
    pontos: 150,
    scoreNecessario: 700,
    ordem: 7,
    bloqueada: true,
    impactoKwh: 45,
    impactoReais: 39.6,
    dificuldade: "Especialista",
    categoria: "Geral",
  },
  {
    id: "auditoria_familiar",
    titulo: "Auditoria Familiar Completa",
    descricao:
      "Converse com sua família, revise hábitos de banho, climatização e iluminação e registre um plano de redução semanal.",
    pontos: 180,
    scoreNecessario: 900,
    ordem: 8,
    bloqueada: true,
    impactoKwh: 55,
    impactoReais: 48.4,
    dificuldade: "Especialista",
    categoria: "Comunidade",
  },
];

export const RANKING_ESCOLAS_SEED = SCHOOLS_SEED.map((school) => ({
  id: school.id,
  nome: school.nome,
  cidade: school.cidade,
  GRE: school.GRE,
  gre: school.GRE,
  regiao: school.regiao,
  auditores: school.auditores,
  alunosAtivos: school.auditores,
  scoreTotal: school.scoreTotal,
  totalKwhSalvo: school.scoreTotal,
}));

export const RANKING_COMUNIDADE_SEED = [
  {
    id: "demo_luis",
    nome: "Luis Felipe Soares",
    perfil: "Estudante",
    escola: "CETI Didácio Silva",
    pontuacao: 450,
    kwhSalvo: 185,
    badges: ["🌱", "🌍", "⚡"],
  },
  {
    id: "demo_jamylle",
    nome: "Jamylle Maria França",
    perfil: "Estudante",
    escola: "CETI Didácio Silva",
    pontuacao: 420,
    kwhSalvo: 170,
    badges: ["🌱", "💰", "⚡"],
  },
  {
    id: "demo_carlos",
    nome: "Carlos Eduardo Santos",
    perfil: "Morador",
    escola: "Nenhuma",
    pontuacao: 390,
    kwhSalvo: 158,
    badges: ["🌱", "🌍"],
  },
];
