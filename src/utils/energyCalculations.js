export const TARIFA_KWH_PI = 0.95;
export const FATOR_CO2_SIN_KG_KWH = 0.125;
export const SEMANAS_MEDIA_MES = 4.345;

const numeroSeguro = (valor, fallback = 0) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
};

export const arredondar = (valor, casas = 2) => {
  const fator = 10 ** casas;
  return Math.round((numeroSeguro(valor) + Number.EPSILON) * fator) / fator;
};

export const calcularConsumoMensal = ({
  potencia = 0,
  usoHorasDia = 0,
  diasPorSemana = 7,
  quantidade = 1,
}) => {
  const watts = Math.max(numeroSeguro(potencia), 0);
  const horas = Math.min(Math.max(numeroSeguro(usoHorasDia), 0), 24);
  const dias = Math.min(Math.max(numeroSeguro(diasPorSemana), 1), 7);
  const qtd = Math.min(Math.max(numeroSeguro(quantidade, 1), 1), 35);

  return arredondar((watts * horas * dias * SEMANAS_MEDIA_MES * qtd) / 1000, 2);
};

export const calcularCustoMensal = (consumoMensal, tarifa = TARIFA_KWH_PI) =>
  arredondar(numeroSeguro(consumoMensal) * tarifa, 2);

export const calcularCarbonoMensal = (
  consumoMensal,
  fator = FATOR_CO2_SIN_KG_KWH,
) => arredondar(numeroSeguro(consumoMensal) * fator, 2);

export const normalizarUsoAparelho = (aparelho) => {
  const usoHorasDia = Number(aparelho.usoHorasDia ?? aparelho.horasDia ?? 1);
  const diasPorSemana = Number(aparelho.diasPorSemana ?? 7);
  const quantidade = Number(aparelho.quantidade ?? 1);
  const consumoMensal = calcularConsumoMensal({
    potencia: aparelho.potencia,
    usoHorasDia,
    diasPorSemana,
    quantidade,
  });

  return {
    ...aparelho,
    usoHorasDia,
    horasDia: usoHorasDia,
    diasPorSemana,
    quantidade,
    consumoMensal,
    custoMensal: calcularCustoMensal(consumoMensal),
  };
};
