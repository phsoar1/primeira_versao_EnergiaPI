# EnergiaPI Firestore Architecture

## Collections

- `users/{uid}`: perfil privado, onboarding, endereço, escola vinculada, score e aparelhos do usuário.
- `users/{uid}/devices/{deviceDocId}`: aparelhos monitorados pelo usuário.
- `users/{uid}/missions/{missionId}`: progresso persistente de missões.
- `schools/{schoolId}`: catálogo público de CETIs e agregados do ranking escolar.
- `community/{uid}`: espelho público sanitizado para ranking da comunidade.
- `devices/{deviceId}`: catálogo público de aparelhos oficiais.
- `missions/{missionId}`: catálogo público de missões e trilhas.

`rankings/{rankingId}` foi mantida apenas como compatibilidade de leitura. O ranking real agora é calculado a partir de `schools` e `community`.

## School Document

```json
{
  "id": "ceti_joao_henrique_almeida_sousa",
  "nome": "CETI João Henrique de Almeida Sousa",
  "GRE": "19ª GRE",
  "cidade": "Teresina",
  "regiao": "Teresina Sul",
  "auditores": 0,
  "scoreTotal": 0,
  "impactoKwhTotal": 0,
  "keywords": [],
  "createdAt": "",
  "updatedAt": ""
}
```

## User Document

```json
{
  "uid": "",
  "nome": "",
  "email": "",
  "tipoUsuario": "estudante",
  "onboardingCompleto": true,
  "escolaId": "",
  "escolaNome": "",
  "GRE": "",
  "endereco": "",
  "numero": "",
  "cidade": "",
  "bairro": "",
  "estado": "",
  "cep": "",
  "score": 0,
  "kwhSalvo": 0,
  "badges": [],
  "createdAt": "",
  "updatedAt": ""
}
```

For moradores, `tipoUsuario` is `morador` and `escolaId`, `escolaNome` and `GRE` are empty strings.

## Ranking Flow

- When onboarding is completed as estudante, the selected school receives `auditores + 1`.
- When the user earns points, `users/{uid}.score` is incremented and the same transaction increments `schools/{schoolId}.scoreTotal`.
- `scoreTotal` is the sum of the points earned by all auditors from that school.
- The school ranking reads `schools` ordered by `scoreTotal desc`.
- The community ranking reads `community` ordered by `score desc`.
- `useRankings` refreshes automatically every 10 minutes to avoid unnecessary listeners and re-renders.

## Search

Schools and devices use normalized `keywords` with prefixes. The app applies:

- debounce between 160ms and 220ms;
- cache with 10-minute TTL;
- Firestore `array-contains` plus `limit()`;
- local tolerant scoring for accents, prefixes and small typos;
- no manual GRE filter in the UI.

## Import

Manual school source:

```txt
src/data/schools.json
```

To import schools, devices and missions:

```bash
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\service-account.json"
npm run import:firestore
```

The importer standardizes `GRE`, `regiao`, counters, timestamps and search keywords.

## Onboarding Video

Add the institutional video here:

```txt
public/videos/energia-pi-institucional.mp4
```

Component:

```txt
src/components/onboarding/OnboardingGate.jsx
```

The video runs with `autoPlay`, `muted`, `loop`, `playsInline` and responsive object-cover sizing.

## Security Rules

- `users/{uid}` is private to the authenticated owner.
- `community/{uid}` is public read, but can only be written by the owner and must match the owner's private score.
- `schools/{schoolId}` is public read. Client updates are limited to bounded aggregate deltas tied to the authenticated student's school.
- `devices`, `missions` and legacy `rankings` are public read and client write protected.
- User mission progress and devices remain private subcollections.
