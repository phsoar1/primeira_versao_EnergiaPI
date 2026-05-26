export const removerAcentos = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const normalizarBusca = (valor = "") =>
  removerAcentos(valor)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const criarIdPadronizado = (valor = "", prefixo = "") => {
  const id = normalizarBusca(valor).replace(/\s+/g, "_");
  return [prefixo, id].filter(Boolean).join("_");
};

export const criarPrefixes = (valor = "") => {
  const texto = normalizarBusca(valor);
  if (!texto) return [];

  const prefixes = new Set();
  texto.split(" ").forEach((parte) => {
    for (let i = 1; i <= parte.length; i += 1) {
      prefixes.add(parte.slice(0, i));
    }
  });

  for (let i = 1; i <= texto.length; i += 1) {
    prefixes.add(texto.slice(0, i));
  }

  return [...prefixes];
};

export const criarKeywords = (...valores) => {
  const keywords = new Set();

  valores
    .flat()
    .filter(Boolean)
    .forEach((valor) => {
      const texto = normalizarBusca(valor);
      const textoOriginal = String(valor).toLowerCase().trim();

      if (texto) {
        keywords.add(texto);
        criarPrefixes(texto).forEach((prefixo) => keywords.add(prefixo));
      }

      if (textoOriginal && textoOriginal !== texto) {
        keywords.add(textoOriginal);
      }
    });

  return [...keywords].slice(0, 180);
};

const distanciaLevenshteinLimitada = (a, b, limite = 2) => {
  if (Math.abs(a.length - b.length) > limite) return limite + 1;

  let anterior = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const atual = [i];
    let menorLinha = atual[0];

    for (let j = 1; j <= b.length; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        anterior[j] + 1,
        atual[j - 1] + 1,
        anterior[j - 1] + custo,
      );
      menorLinha = Math.min(menorLinha, atual[j]);
    }

    if (menorLinha > limite) return limite + 1;
    anterior = atual;
  }

  return anterior[b.length];
};

export const pontuarBusca = (item, termo, campos = ["nome", "categoria"]) => {
  const query = normalizarBusca(termo);
  if (!query) return 1;

  const haystack = [
    ...campos.map((campo) => item?.[campo]),
    ...(item?.keywords || []),
  ]
    .filter(Boolean)
    .map(normalizarBusca);

  if (haystack.some((valor) => valor === query)) return 100;
  if (haystack.some((valor) => valor.startsWith(query))) return 80;
  if (haystack.some((valor) => valor.includes(query))) return 60;

  const queryTokens = query.split(" ");
  const tolerante = haystack.some((valor) =>
    valor
      .split(" ")
      .some((token) =>
        queryTokens.some(
          (parte) => parte.length > 2 && distanciaLevenshteinLimitada(token, parte) <= 1,
        ),
      ),
  );

  return tolerante ? 35 : 0;
};
