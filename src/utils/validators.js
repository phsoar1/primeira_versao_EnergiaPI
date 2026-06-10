import { normalizarEmail } from "./formatters.js";

export const EMAIL_DOMINIOS_PERMITIDOS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
];

const EMAIL_PERMITIDO_REGEX = new RegExp(
  `^[A-Z0-9._%+-]+@(${EMAIL_DOMINIOS_PERMITIDOS.map((dominio) =>
    dominio.replace(".", "\\."),
  ).join("|")})$`,
  "i",
);

export const emailEhPermitido = (valor = "") =>
  EMAIL_PERMITIDO_REGEX.test(normalizarEmail(valor));

export const verificarSenhasIguais = (senha, confirmacao) => senha === confirmacao;
