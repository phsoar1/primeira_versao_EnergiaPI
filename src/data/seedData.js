import {
  calcularConsumoMensal,
  calcularCustoMensal,
} from "../utils/energyCalculations.js";
import { iconeAparelhoSeguro } from "../utils/formatters.js";
import { criarIdPadronizado, criarKeywords } from "../utils/search.js";
import devicesJson from "./devices.json" with { type: "json" };
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
  const gre = school.gre || school.GRE || "";
  const cidade = school.cidade || "";
  const regiao = school.regiao || "";
  const id = school.id || criarIdPadronizado(nome.replace(/^CETI\s+/i, ""), "ceti");
  return {
    id,
    nome,
    gre,
    cidade,
    regiao,
    auditores: Number(school.auditores || 0),
    scoreTotal: Number(school.scoreTotal || 0),
    tipo: "CETI",
    keywords: criarKeywords(nome, nome.replace(/^CETI\s+/i, ""), gre, cidade, regiao),
  };
});

export const DEVICES_SEED = devicesJson.map((device) => {
  const nome = String(device.nome || "").trim();
  const categoria = device.categoria || "Tecnologia";
  const potencia = Number(device.potencia || 0);
  const usoHorasDia = Number(device.usoHorasDia ?? device.horasDia ?? 1);
  const diasPorSemana = Number(device.diasPorSemana || 7);
  const consumoMensal = calcularConsumoMensal({
    potencia,
    usoHorasDia,
    diasPorSemana,
    quantidade: 1,
  });
  const emoji = iconeAparelhoSeguro(device);

  return {
    id: device.id || criarIdPadronizado(nome),
    nome,
    emoji,
    icone: emoji,
    categoria,
    potencia,
    usoHorasDia,
    diasPorSemana,
    consumoMensal,
    custoMensal: calcularCustoMensal(consumoMensal),
    keywords: criarKeywords(
      nome,
      categoria,
      String(potencia),
      nome.split(" ")[0],
    ),
  };
});

export const MISSIONS_SEED = [
  {
    id: "mapear_cinco_aparelhos",
    titulo: "Mapa dos cinco maiores consumos",
    descricao:
      "Cadastre e revise pelo menos cinco aparelhos para entender onde sua casa consome mais energia.",
    pontos: 50,
    scoreNecessario: 0,
    ordem: 1,
    bloqueada: false,
    impactoKwh: 6,
    impactoReais: 5.7,
    dificuldade: "Fácil",
    categoria: "Diagnóstico",
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
    impactoReais: 7.98,
    dificuldade: "Fácil",
    categoria: "Geral",
  },
  {
    id: "chuveiro_modo_verao",
    titulo: "Chuveiro no Modo Verão",
    descricao:
      'Altere a chave do chuveiro elétrico para a posição "Morna" ou use banhos mais curtos durante a semana.',
    pontos: 50,
    scoreNecessario: 100,
    ordem: 3,
    bloqueada: true,
    impactoKwh: 22.5,
    impactoReais: 21.38,
    dificuldade: "Fácil",
    categoria: "Banheiro",
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
    impactoReais: 11.4,
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
    impactoReais: 34.2,
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
    impactoReais: 19,
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
    impactoReais: 42.75,
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
    impactoReais: 52.25,
    dificuldade: "Especialista",
    categoria: "Comunidade",
  },
];

export const RANKING_ESCOLAS_SEED = SCHOOLS_SEED.map((school) => ({
  id: school.id,
  nome: school.nome,
  cidade: school.cidade,
  gre: school.gre,
  regiao: school.regiao,
  auditores: school.auditores,
  scoreTotal: school.scoreTotal,
}));
