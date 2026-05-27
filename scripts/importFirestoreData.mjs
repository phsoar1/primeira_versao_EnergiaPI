import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  DEVICES_SEED,
  MISSIONS_SEED,
  SCHOOLS_SEED,
} from "../src/data/seedData.js";
import { calcularConsumoMensal, calcularCustoMensal } from "../src/utils/calculations.js";
import { criarIdPadronizado, criarKeywords } from "../src/utils/search.js";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath || !existsSync(serviceAccountPath)) {
  console.error(
    "Defina GOOGLE_APPLICATION_CREDENTIALS apontando para a chave de service account.",
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(readFileSync(serviceAccountPath, "utf8"))),
  });
}

const db = getFirestore();
const raw = (path, fallback) =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;

const separarGRECidade = (valor = "") => {
  const [gre, cidade] = String(valor).split(" - ").map((parte) => parte.trim());
  return { gre: gre || "", cidade: cidade || "" };
};

const normalizarEscola = (school) => {
  const local =
    (school.GRE || school.gre) && school.cidade
      ? school
      : { ...school, ...separarGRECidade(school.regional || school.GRE || school.gre) };
  const nome = String(local.nome || local.name || "").trim();
  const id = school.id || criarIdPadronizado(nome.replace(/^CETI\s+/i, ""), "ceti");
  const gre = local.gre || local.GRE || "";

  return {
    id,
    nome,
    gre,
    cidade: local.cidade,
    regiao: local.regiao || "",
    tipo: local.tipo || "CETI",
    auditores: Number(local.auditores || 0),
    scoreTotal: Number(local.scoreTotal || 0),
    keywords: criarKeywords(
      nome,
      nome.replace(/^CETI\s+/i, ""),
      gre,
      local.cidade,
      local.regiao,
    ),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
};

const numero = (valor, fallback = 0) => {
  const limpo = String(valor ?? fallback).replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = Number(limpo);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizarDevice = (device) => {
  const nome = String(device.nome || device.name || "").trim();
  const categoria = device.categoria || "Tecnologia";
  const potencia = numero(device.potencia, 0);
  const usoHorasDia = numero(device.usoHorasDia ?? device.horasDia, 1);
  const diasPorSemana = numero(device.diasPorSemana, 7);
  const consumoMensal = calcularConsumoMensal({
    potencia,
    usoHorasDia,
    diasPorSemana,
    quantidade: 1,
  });

  return {
    id: device.id || criarIdPadronizado(nome),
    nome,
    emoji: device.emoji || "⚡",
    categoria,
    potencia,
    usoHorasDia,
    diasPorSemana,
    consumoMensal,
    custoMensal: calcularCustoMensal(consumoMensal),
    keywords: criarKeywords(nome, categoria, String(potencia)),
    updatedAt: FieldValue.serverTimestamp(),
  };
};

const gravarColecao = async (collectionName, items) => {
  const batch = db.batch();
  items.forEach((item) => {
    batch.set(db.collection(collectionName).doc(item.id), item, { merge: true });
  });
  await batch.commit();
  console.log(`${collectionName}: ${items.length} documentos importados.`);
};

const schools = raw("src/data/schools.json", SCHOOLS_SEED).map(normalizarEscola);
const devices = raw("src/data/devices.json", DEVICES_SEED).map(normalizarDevice);
const missions = raw("data/missions.json", MISSIONS_SEED);

await gravarColecao("schools", schools);
await gravarColecao("devices", devices);
await gravarColecao("missions", missions);

console.log("Importação Firestore concluída.");
