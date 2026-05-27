# Estrutura do Projeto EnergiaPI

## Pastas principais

- `src/components`: componentes visuais por área (`auth`, `devices`, `missions`, `onboarding`, `rankings`, `schools`, `ui`).
- `src/hooks`: hooks de autenticação indireta, busca, rankings, missões, aparelhos e navegação por swipe.
- `src/services`: integração com Firebase/Auth/Firestore separada por domínio.
- `src/utils`: cálculos, formatação, validações e busca.
- `src/data`: JSONs usados como catálogo local e fallback elegante.
- `public`: logo e arquivos públicos. O vídeo institucional esperado é `public/videos/intro.mp4`.

## Fluxo de autenticação

O `App.jsx` chama `authService.js` para login com email/senha, Google popup/redirect, logout e leitura do usuário atual. Depois da autenticação, `userService.js` garante o documento em `users/{uid}` e o onboarding completa os campos de perfil.

## Estrutura Firestore

`users/{uid}` usa os campos padronizados:

`uid`, `nome`, `email`, `tipoUsuario`, `escolaId`, `escolaNome`, `gre`, `score`, `onboardingCompleto`, `createdAt`, `updatedAt`.

`schools/{schoolId}` usa:

`id`, `nome`, `gre`, `cidade`, `auditores`, `scoreTotal`, `keywords`.

`devices/{deviceId}` usa:

`id`, `nome`, `emoji`, `categoria`, `potencia`, `consumoMensal`, `custoMensal`, `keywords`.

Campos legados como `GRE`, `schoolName`, `totalKwhSalvo` e `alunosAtivos` ainda são lidos por compatibilidade, mas novas gravações usam os nomes padronizados.

## Rankings

O ranking escolar lê `schools` e ordena por `scoreTotal`, com desempate por `auditores` e nome. O ranking da comunidade lê `community`, ordena por `score` e mostra um estado vazio quando ainda não há usuários reais.

## Aparelhos

O catálogo base fica em `src/data/devices.json`. O consumo e o custo mensal são calculados em `src/utils/calculations.js`. Aparelhos do usuário ficam em `users/{uid}/devices`.

## Missões

As missões públicas vêm de `missions`; quando o Firestore não responde, o app usa `MISSIONS_SEED`. O progresso individual fica em `users/{uid}/missions`.

## Como alimentar JSONs

Para adicionar escolas, edite `src/data/schools.json` usando `gre` em minúsculo. Para aparelhos, edite `src/data/devices.json` com nome, categoria, potência e uso médio. Depois, rode `npm run import:firestore` com `GOOGLE_APPLICATION_CREDENTIALS` configurado para enviar os dados ao Firestore.
