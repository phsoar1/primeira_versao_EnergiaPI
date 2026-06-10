export {
  TARIFA_KWH_PI,
  FATOR_CO2_SIN_KG_KWH,
  SEMANAS_MEDIA_MES,
  arredondar,
  calcularCarbonoMensal,
  calcularConsumoMensal,
  calcularCustoMensal,
  normalizarUsoAparelho,
} from "./energyCalculations.js";

import {
  calcularConsumoMensal,
  calcularCustoMensal,
  TARIFA_KWH_PI,
} from "./energyCalculations.js";

export const calcularConsumoAparelho = (aparelhoOuPotencia, horasDia = 0) => {
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

export const gerarInsightsEnergeticos = ({
  aparelhos = [],
  consumoTotal = 0,
  custoTotal = 0,
}) => {
  const insights = [];
  const ativos = aparelhos.filter((aparelho) => aparelho.ativo !== false);
  const chuveiro = ativos.find((elet) =>
    String(elet.nome || "").toLowerCase().includes("chuveiro"),
  );
  const arCondicionado = ativos.find((elet) => {
    const nome = String(elet.nome || "").toLowerCase();
    return nome.includes("ar-condicionado") || nome.includes("ar condicionado");
  });
  const lampadasIncandescentes = ativos.find((elet) =>
    String(elet.nome || "").toLowerCase().includes("incandescente"),
  );

  if (aparelhos.length === 0) {
    return [
      {
        id: "cadastro",
        titulo: "Mapeamento inicial pendente",
        descricao:
          "Cadastre os primeiros aparelhos para receber recomendações baseadas na rotina da sua casa.",
        economiaKwh: 0,
        economiaReais: 0,
        tipo: "info",
      },
    ];
  }

  if (chuveiro && Number(chuveiro.potencia || 0) >= 4000) {
    const economiaKwh = calcularConsumoMensal({
      ...chuveiro,
      potencia: Math.max(Number(chuveiro.potencia || 0) - 2500, 0),
    });
    insights.push({
      id: "chuveiro_verao",
      titulo: "Revise o modo do chuveiro",
      descricao: `Seu chuveiro está em alta potência (${chuveiro.potencia}W). Usar a posição morna/verão e reduzir alguns minutos do banho já muda a conta.`,
      economiaKwh: economiaKwh.toFixed(1),
      economiaReais: calcularCustoMensal(economiaKwh, TARIFA_KWH_PI).toFixed(2),
      tipo: "alerta",
    });
  }

  if (arCondicionado && Number(arCondicionado.horasDia || arCondicionado.usoHorasDia || 0) > 4) {
    const economiaKwh = calcularConsumoMensal(arCondicionado) * 0.2;
    insights.push({
      id: "ar_23",
      titulo: "Ajuste o ar-condicionado para 23°C",
      descricao:
        "Temperaturas muito baixas fazem o compressor trabalhar por mais tempo. Em 23°C, o conforto continua bom e o consumo tende a cair.",
      economiaKwh: economiaKwh.toFixed(1),
      economiaReais: calcularCustoMensal(economiaKwh, TARIFA_KWH_PI).toFixed(2),
      tipo: "economia",
    });
  }

  if (lampadasIncandescentes) {
    const diferencaPotencia = (Number(lampadasIncandescentes.potencia || 0) - 9) * 3;
    const economiaKwh = calcularConsumoMensal({
      ...lampadasIncandescentes,
      potencia: Math.max(diferencaPotencia, 0),
    });
    insights.push({
      id: "substituicao_led",
      titulo: "Troque lâmpadas antigas por LED",
      descricao:
        "A iluminação LED entrega a mesma rotina com menos desperdício em calor. Comece pelos cômodos mais usados.",
      economiaKwh: economiaKwh.toFixed(1),
      economiaReais: calcularCustoMensal(economiaKwh, TARIFA_KWH_PI).toFixed(2),
      tipo: "oportunidade",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "geral_standby",
      titulo: "Reduza consumo em standby",
      descricao:
        "Antes de dormir, desligue filtros de linha e aparelhos que não precisam ficar em espera. Pequenas rotinas somam no mês.",
      economiaKwh: (Number(consumoTotal || 0) * 0.05).toFixed(1),
      economiaReais: (Number(custoTotal || 0) * 0.05).toFixed(2),
      tipo: "economia",
    });
  }

  return insights;
};
