# Documentacao Tecnica EnergiaPI

Este documento explica o projeto EnergiaPI de forma didatica. A ideia é entender o sistema por partes: primeiro a visao geral, depois as tecnologias usadas, a estrutura de arquivos, o fluxo de telas, a autenticacao, o banco de dados e os principais componentes.

## 1. Visao Geral Do Projeto

O EnergiaPI e uma aplicacao web criada para ajudar estudantes, moradores e escolas do Piaui a entenderem melhor o consumo de energia eletrica.

O sistema permite que o usuario:

- faca cadastro ou login;
- complete um perfil inicial;
- cadastre aparelhos eletricos da casa;
- veja estimativas de consumo em kWh;
- veja estimativa de custo em reais;
- receba dicas de economia;
- participe de missoes;
- ganhe pontos;
- apareca em ranking da comunidade;
- contribua para o ranking das escolas.

### Qual Problema O EnergiaPI Resolve

Muitas pessoas pagam a conta de energia sem saber quais aparelhos gastam mais. O EnergiaPI transforma esse assunto em uma experiencia interativa.

Exemplo:

```txt
Chuveiro eletrico
4500 W
0,5 hora por dia
7 dias por semana
```

Com esses dados, o sistema calcula uma estimativa mensal de consumo. Assim o usuario consegue perceber que pequenas mudancas, como não deicar aparelhos ligados em "standy" o tempo todo ou trocar lampadas antigas por LED, podem gerar economia real.

### Tecnologia E Sustentabilidade

O projeto conecta tecnologia e sustentabilidade porque usa software para educar sobre consumo consciente. O React cria a interface, o Firebase guarda e gerencia os dados, e os cálculos mostram impactos práticos: consumo, custo estimado e reducao de carbono.

## 2. Stack Tecnológica

### React

O React é uma biblioteca JavaScript para construir interfaces. Ela é o principal componente usado para construir nosso front-end. No EnergiaPI, usamos esse recurso em cada tela(aba), botão, card, modal, caixas de pesquisa, formulários e escrito com JSX, uma sintaxe parecida com HTML dentro do JavaScript.

Exemplo simples:

```jsx
function LockIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}
```

No projeto, o principal componente React é `App.jsx`, localizado em `src/App.jsx`.

### Vite

No projeto EnergiaPI, usamos o Vite durante todo o desenvolvimento para otimizar a estrutura feita em .jsx, visando a fluidez e velocidade da aplicação.

Como localizar Vite no repostório? Busque os "scripts" no `package.json`:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint ."
}
```

### JavaScript

JavaScript e a linguagem principal do projeto. Ela controla:

- estados da interface;
- chamadas ao Firebase;
- validacoes de formulario;
- calculos de energia;
- ordenacao de rankings;
- eventos de clique, toque e scroll.

### Tailwind CSS

Tailwind CSS e uma ferramenta de estilos baseada em classes utilitarias. Em vez de escrever muito CSS separado, optamos pela facilidade dessa stack, que usa classes diretamente no JSX.

Exemplo:

```jsx
<button className="bg-[#10B981] text-white rounded-2xl px-6 py-4">
  Enviar
</button>
```

Essa classe define cor de fundo, cor do texto, borda arredondada e espacamento.

### Firebase

Firebase é a plataforma usada como backend. No EnergiaPI, ele é responsável, principalmente, pela autenticação dos usuários, através do Firebase Authentication, disponíveis nos métodos de login "Provedor: Google" e "Provedor: Email/Senha"; armazenamento e usabilidade dos dados de pontuação, endereço, aparelhos cadastrados e rankings.

### Firebase Authentication

Firebase Authentication permite login com:

- email e senha;
- conta Google.

No codigo, isso aparece em `src/App.jsx` com funcoes como:

- `createUserWithEmailAndPassword`;
- `signInWithEmailAndPassword`;
- `signInWithPopup`;
- `signInWithRedirect`;
- `onAuthStateChanged`;
- `signOut`.

### Firestore Database

Foram usadas quatro coleções que armazenam e gerenciam os dados principais da aplicação.

Coleções:

- Community
- rankings
- schools
- users
  Exemplo de como as coleções foram usadas:

```txt
users
  uid_do_usuario
    nome
    email
    score
    escolaNome
```

No projeto, o arquivo principal de acesso ao Firestore e `src/services/firestoreService.js`.

### Vercel

Vercel é uma plataforma comum para publicar aplicacoes Vite/React. No EnergiaPI, usamos ele para publicá-lo online.

O Vite gera a pasta `dist`, que e a versao pronta para hospedagem.

## 3. Estrutura De Pastas E Arquivos

Estrutura real do projeto:

```txt
.
├── README.md
├── docs/
├── public/
├── scripts/
├── src/
├── firebase.json
├── firestore.rules
├── index.html
├── package.json
└── vite.config.js
```

### `src/`

Pasta principal do codigo da aplicacao.

Contem:

- `App.jsx`;
- `main.jsx`;
- `firebase.js`;
- `ErrorBoundary.jsx`;
- `components/`;
- `hooks/`;
- `services/`;
- `utils/`;
- `data/`;
- `index.css`;
- `App.css`;
- `assets/`.

### `src/App.jsx`

É o maior arquivo do projeto e concentra a maior parte da aplicação:

- login;
- cadastro;
- tela principal;
- dashboard;
- aparelhos;
- missoes;
- comunidade;
- ranking de escolas;
- modais;
- estilos globais inline;
- navegacao entre abas.

### `src/main.jsx`

E o ponto de entrada do React. Ele pega a div `#root` do `index.html` e renderiza o app.

Resumo do fluxo:

```jsx
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
```

Tambem registra logs globais de erro:

- `window.addEventListener("error", ...)`;
- `window.addEventListener("unhandledrejection", ...)`.

### `src/firebase.js`

Configura o Firebase:

- inicializa o app Firebase;
- cria `auth`;
- cria `db`;
- cria o provider do Google;
- define persistencia local do login.

Exports importantes:

- `app`;
- `auth`;
- `authReady`;
- `db`;
- `provider`;
- `isFirebaseConfigured`;
- `firebaseConfigStatus`.

### `src/ErrorBoundary.jsx`

Componente de seguranca. Se alguma parte da interface quebrar durante a renderizacao, ele mostra uma tela amigavel com botao de recarregar.

Isso evita que o usuario veja uma tela totalmente branca.

### `src/components/`

Contém componentes reutilizaveis.

Arquivos importantes:

- `components/onboarding/OnboardingGate.jsx`;
- `components/schools/SchoolSearchPicker.jsx`;
- `components/layout/Header.jsx`.

### `src/components/onboarding/OnboardingGate.jsx`

Tela de perfil inicial usada principalmente quando o usuario entra com Google e ainda precisa completar dados.

Ela pergunta:

- tipo de usuario: estudante ou morador;
- CEP;
- numero;
- escola, caso seja estudante.

Tambem possui area de video introdutorio:

```jsx
<video src="/videos/demo.mp4" controls autoPlay muted loop playsInline />
```

Se o video falhar, aparece um fallback visual com logo EnergiaPI.

### `src/components/schools/SchoolSearchPicker.jsx`

Componente para pesquisar e selecionar um CETI.

Ele:

- abre um modal;
- permite digitar o nome da escola;
- consulta escolas com `useSchoolSearch`;
- mostra resultados;
- chama `onSelect` quando a escola e escolhida.

### `src/hooks/`

Hooks sao funcoes especiais do React que encapsulam logica reutilizavel.

Arquivos:

- `useCatalogSearch.js`;
- `useDebouncedValue.js`;
- `useMissions.js`;
- `useRankings.js`;
- `useUserDevices.js`.

### `src/services/`

Pasta de servicos. Servicos sao funcoes que conversam com sistemas externos, neste caso o Firestore.

Arquivo principal:

- `firestoreService.js`.

### `src/utils/`

Funcoes auxiliares puras, sem interface.

Arquivos:

- `energyCalculations.js`;
- `text.js`.

### `src/data/`

Dados iniciais usados como fallback ou importacao.

Arquivos:

- `seedData.js`;
- `schools.json`.

### `public/`

Arquivos publicos servidos diretamente pelo navegador.

Arquivos/pastas:

- `logo.png`;
- `favicon.svg`;
- `icons.svg`;
- `videos/`;

O video esperado na tela de onboarding e:

```txt
public/videos/demo.mp4
```

### `scripts/`

Contem script de importacao:

- `importFirestoreData.mjs`.

Ele usa Firebase Admin para importar escolas, aparelhos e missoes para o Firestore.

### `firestore.rules`

Arquivo de regras de seguranca do Firestore. Define quem pode ler e escrever em cada colecao.

### `firebase.json`

Informa ao Firebase que as regras do Firestore estao em:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### `vite.config.js`

Configura Vite com React e Tailwind:

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

## 4. Fluxo Geral Do Sistema

Fluxo simplificado:

```txt
Usuario acessa o site
→ index.html carrega
→ main.jsx inicia React
→ App.jsx e renderizado
→ Firebase Auth verifica login
→ usuario faz login/cadastro
→ se for Google sem perfil completo, abre perfil inicial
→ usuario envia dados
→ Firestore salva perfil
→ app principal e liberado
→ usuario navega por dashboard, aparelhos, missoes, comunidade e escolas
```

### Passo 1: O Navegador Abre O Site

O arquivo `index.html` possui a div:

```html
<div id="root"></div>
```

Essa div e onde o React coloca toda a aplicacao.

### Passo 2: React Inicia

`src/main.jsx` importa `App.jsx` e renderiza.

### Passo 3: Firebase Verifica Login

Em `App.jsx`, o `onAuthStateChanged` escuta se existe usuario logado.

Se existir, o app tenta carregar o perfil no Firestore. Se nao existir, mostra login/cadastro.

### Passo 4: Cadastro Ou Login

O usuario pode:

- entrar com email e senha;
- cadastrar nova conta com email e senha;
- entrar com Google.

### Passo 5: Perfil Inicial

Se o usuario do Google ainda nao completou dados como tipo de usuario e escola, o componente `OnboardingGate` aparece.

### Passo 6: Aplicativo Principal

Depois do perfil completo, o app mostra:

- Resumo;
- Aparelhos;
- Missoes;
- Comunidade;
- Escolas do Piaui.

## 5. Explicacao Do `App.jsx`

`App.jsx` e o centro do sistema. Ele mistura tres responsabilidades principais:

1. controle de usuario;
2. controle das telas;
3. regras de interface.

### Constantes Principais

#### `LOGO_URL`

Define onde esta a logo:

```js
const LOGO_URL = "/logo.png";
```

#### `ABAS_APP`

Define as abas internas do app:

```js
const ABAS_APP = ["dashboard", "aparelhos", "missões", "comunidade", "ranking"];
```

#### `SWIPE_MIN_DISTANCE`

Define a distancia minima para trocar de aba com gesto de swipe no mobile.

### Componentes Internos

#### `LogoEnergiaPI`

Renderiza a imagem da logo com tamanho configuravel.

#### `GoogleIcon`

Renderiza o icone visual do Google usado nos botoes de login/cadastro.

#### `Emoji`

Renderiza emojis usando Twemoji via CDN. Se a imagem falhar ou o emoji estiver corrompido, mostra fallback seguro.

### Funcoes Auxiliares Fora Do `App`

#### `normalizarEmojiVisual`

Evita mostrar caracteres quebrados. Se detectar texto corrompido, usa o simbolo de energia como fallback.

#### `iconeAparelhoSeguro`

Escolhe um icone estavel para aparelhos pelo nome. Exemplo:

- ar-condicionado recebe floco de neve;
- chuveiro recebe chuveiro;
- geladeira/freezer recebem gelo;
- lampada recebe lampada.

#### `nomePublicoEscola`

Evita mostrar `escolaId` na interface. Prioriza:

1. `escolaNome`;
2. `escola`;
3. `nome`;
4. `name`;
5. `razaoSocial`.

Se encontrar um slug como `ceti_didacio_silva`, nao usa isso como nome publico.

### Estados Principais

Dentro de `App`, existem muitos `useState`. Os mais importantes sao:

#### Autenticacao

- `autenticado`: indica se o usuario esta logado;
- `authCarregando`: indica se o Firebase ainda esta verificando login;
- `authProcessando`: indica qual acao esta em andamento, como login ou cadastro;
- `usuario`: guarda os dados do usuario atual.

#### Formulario De Login/Cadastro

- `isLogin`: alterna entre login e cadastro;
- `nomeUsuario`;
- `email`;
- `senha`;
- `confirmarSenha`;
- `perfil`: estudante ou morador;
- `cep`;
- `estadoCidade`;
- `bairro`;
- `numero`;
- `escolaUsuario`;
- `escolaSelecionada`.

#### Interface

- `tema`: claro ou escuro;
- `abaSelecionada`: aba aberta no app;
- `menuAberto`: menu lateral aberto ou fechado;
- `notificacao`: mensagem temporaria no topo.

#### Aparelhos

- `modalTemplatesAberto`;
- `modalNovoAberto`;
- `aparelhoParaExcluir`;
- `novoAparelho`;
- `buscaTemplate`;
- `categoriaTemplate`;
- `quickEdit`.

### Hooks Usados Em `App`

#### `useUserDevices(usuario?.uid)`

Carrega aparelhos do usuario logado.

Retorna:

- `devices`;
- `loading`;
- `addDevice`;
- `updateDevice`;
- `deleteDevice`.

#### `useDeviceCatalogSearch`

Busca modelos de aparelhos no catalogo.

#### `useMissions`

Carrega missoes e progresso do usuario.

#### `useRankings`

Carrega ranking de escolas e comunidade.

### Funcoes Principais De Autenticacao

#### `validarFirebaseConfigurado`

Verifica se as configuracoes do Firebase sao validas antes de tentar login ou cadastro.

#### `handleAuthSubmit`

Funcao chamada ao enviar o formulario de login/cadastro.

Se `isLogin` for verdadeiro:

- valida email e senha;
- chama `signInWithEmailAndPassword`;
- sincroniza perfil.

Se for cadastro:

- valida senhas;
- valida endereco;
- cria usuario com `createUserWithEmailAndPassword`;
- atualiza `displayName`;
- salva perfil no Firestore.

#### `autenticarComGoogle`

Tenta login/cadastro com Google usando popup. Se o popup for bloqueado, tenta redirect.

#### `finalizarGoogleAuth`

Depois do Google retornar um usuario, essa funcao sincroniza os dados com o Firestore. Se o perfil ainda nao estiver completo, o app mostra a tela de perfil inicial.

#### `handleLogout`

Sai da conta com `signOut`, limpa estados e volta para a aba dashboard.

#### `handleOnboardingSubmit`

Recebe os dados do `OnboardingGate` e chama `completeUserOnboarding`. Depois atualiza o perfil local e libera o app principal.

### Funcoes Principais De Aparelhos

#### `adicionarTemplate`

Adiciona um aparelho vindo do catalogo oficial.

#### `salvarNovoAparelhoCustomizado`

Cria um aparelho digitado manualmente pelo usuario.

#### `atualizarEletrodomestico`

Atualiza campos de um aparelho, como:

- uso por dia;
- dias por semana;
- quantidade;
- ativo/inativo;
- nome.

#### `abrirEditorRapido` E `aplicarValorRapido`

Controlam uma pequena janela para editar valores numericos rapidamente.

#### `solicitarExclusaoEletrodomestico`

Abre confirmacao de exclusao.

#### `confirmarExclusaoEletrodomestico`

Remove o aparelho do Firestore.

#### `SliderAnimado`

Componente interno para controlar valores por arraste. Ele calcula a porcentagem do valor e posiciona a bolinha branca do slider de forma centralizada.

### Funcoes Principais De Missoes

#### `aceitarMissao`

Marca uma missao como ativa se ela estiver desbloqueada.

#### `completarMissao`

Marca a missao como concluida, soma pontos e chama `addUserScore`.

### Renderizacao Condicional

`App.jsx` decide o que mostrar com base no estado:

```txt
Se Firebase ainda carrega
→ tela de carregamento

Se nao autenticado
→ tela de login/cadastro

Se autenticado com Google e perfil incompleto
→ OnboardingGate

Se autenticado e perfil completo
→ app principal
```

### Navegacao Entre Abas

A aba atual fica em:

```js
const [abaSelecionada, setAbaSelecionada] = useState("dashboard");
```

As abas sao:

- `dashboard`: resumo;
- `aparelhos`: diagnostico de equipamentos;
- `missões`: desafios de economia;
- `comunidade`: ranking dos usuarios;
- `ranking`: escolas do Piaui.

No desktop ha menu no topo. No mobile ha navegacao fixa no rodape.

## 6. Explicacao Da Autenticacao

### Cadastro Por Email E Senha

No cadastro, o usuario preenche:

- nome;
- email;
- senha;
- confirmacao de senha;
- tipo de perfil;
- endereco;
- escola, se for estudante.

O codigo usa:

```js
createUserWithEmailAndPassword(auth, emailNormalizado, senha);
```

Depois salva o perfil com:

```js
saveUserProfile(credencial.user, perfilFirebase);
```

### Login Por Email E Senha

O login usa:

```js
signInWithEmailAndPassword(auth, emailNormalizado, senha);
```

Depois chama `sincronizarUsuarioAutenticado` para carregar dados do Firestore.

### Login Com Google

O login com Google usa:

```js
signInWithPopup(auth, provider);
```

Se o popup for bloqueado, o app usa:

```js
signInWithRedirect(auth, provider);
```

### `onAuthStateChanged`

Essa funcao do Firebase observa mudancas de login.

Ela responde perguntas como:

- O usuario acabou de entrar?
- O usuario saiu?
- O navegador recarregou e ainda existe sessao?

No EnergiaPI, quando `onAuthStateChanged` encontra usuario logado, o app sincroniza o perfil.

### Persistencia De Login

Em `firebase.js`, o app usa:

```js
setPersistence(auth, browserLocalPersistence);
```

Isso faz o login permanecer salvo no navegador.

### UID Do Firebase

UID e o identificador unico do usuario no Firebase. Mesmo que duas pessoas tenham o mesmo nome, os UIDs sao diferentes.

Exemplo:

```txt
Nome: Maria Silva
UID: 9xK2...aPq
```

No Firestore, o UID e usado como ID do documento do usuario:

```txt
users/{uid}
community/{uid}
```

Isso evita confundir usuarios com nomes iguais.

## 7. Explicacao Do Banco Firestore

Firestore organiza dados em colecoes e documentos.

### Colecao `users`

Caminho:

```txt
users/{uid}
```

Guarda dados privados do usuario:

- `uid`;
- `nome`;
- `email`;
- `tipoUsuario`;
- `onboardingCompleto`;
- `escolaId`;
- `escolaNome`;
- `GRE`;
- `endereco`;
- `numero`;
- `cidade`;
- `bairro`;
- `estado`;
- `cep`;
- `score`;
- `kwhSalvo`;
- `badges`.

### Subcolecao `users/{uid}/devices`

Guarda aparelhos do usuario.

Campos importantes:

- `deviceId`;
- `nome`;
- `emoji`;
- `icone`;
- `categoria`;
- `potencia`;
- `quantidade`;
- `diasPorSemana`;
- `usoHorasDia`;
- `consumoMensal`;
- `custoMensal`;
- `ativo`.

### Subcolecao `users/{uid}/missions`

Guarda progresso de missoes do usuario.

Campos:

- `ativa`;
- `concluida`;
- `updatedAt`.

### Colecao `community`

Caminho:

```txt
community/{uid}
```

E um espelho publico do perfil para ranking da comunidade.

Nao guarda tudo do usuario. Guarda apenas dados necessarios para ranking:

- nome;
- tipoUsuario/perfil;
- escola;
- escolaId;
- escolaNome;
- score/pontuacao;
- kwhSalvo;
- badges.

### Colecao `schools`

Guarda escolas CETI e agregados do ranking escolar.

Campos importantes:

- `id`;
- `nome`;
- `escolaNome`;
- `GRE`;
- `gre`;
- `cidade`;
- `regiao`;
- `auditores`;
- `scoreTotal`;
- `totalKwhSalvo`;
- `impactoKwhTotal`;
- `keywords`.

### Colecao `devices`

Catalogo publico de aparelhos oficiais. O usuario pode ler, mas nao escrever diretamente.

### Colecao `missions`

Catalogo publico de missoes. O usuario pode ler, mas o progresso fica em `users/{uid}/missions`.

### Colecao `rankings`

Existe nas regras como compatibilidade de leitura. O ranking real do app e calculado a partir de:

- `schools`;
- `community`.

### Leitura

Leitura pode acontecer com:

- `getDoc`;
- `getDocs`;
- `onSnapshot`.

`onSnapshot` e usado quando o app quer atualizacao em tempo real.

### Escrita

Escrita pode acontecer com:

- `setDoc`;
- `addDoc`;
- `updateDoc`;
- `runTransaction`.

### Atualizacao

Exemplo: quando o usuario completa missao, o app atualiza:

- score do usuario;
- ranking da comunidade;
- score da escola, se for estudante.

### Relacao Entre Usuario E Escola

Um estudante possui:

```js
{
  escolaId: "ceti_didacio_silva",
  escolaNome: "CETI Didacio Silva"
}
```

`escolaId` e usado para localizar o documento no Firestore.

`escolaNome` e usado para mostrar o nome bonito na tela.

## 8. Explicacao Dos Rankings

### Ranking Da Comunidade

Mostra usuarios com maior pontuacao.

Fonte:

```txt
community
```

Ordenacao:

1. maior `score`;
2. maior `kwhSalvo`;
3. nome em ordem alfabetica.

### Ranking Das Escolas

Mostra CETIs com melhor desempenho.

Fonte:

```txt
schools
```

Ordenacao:

1. maior `scoreTotal`;
2. maior numero de `auditores`;
3. nome da escola.

### Pontuacao

O usuario ganha pontos ao:

- completar missoes;
- adicionar aparelho;
- realizar acoes de economia.

### Nome Do Usuario X UID

O nome pode se repetir. O UID nao.

Por isso:

- `nome` aparece na tela;
- `uid` identifica o documento.

### `escolaId` X `escolaNome`

Essa diferenca e muito importante.

`escolaId`:

```txt
ceti_didacio_silva
```

Serve para codigo e banco.

`escolaNome`:

```txt
CETI Didacio Silva
```

Serve para mostrar ao usuario.

O app possui protecao para nao exibir slugs `ceti_...` como nome publico.

## 9. Explicacao Da Aba Aparelhos

A aba Aparelhos permite montar um diagnostico de consumo residencial.

### Cadastro De Aparelhos

Existem duas formas:

1. selecionar um aparelho do catalogo;
2. criar aparelho personalizado.

### Potencia

Potencia e medida em watts (W). Quanto maior a potencia, maior pode ser o consumo.

Exemplo:

```txt
Chuveiro eletrico: 4500 W
Lampada LED: 9 W
```

### Horas De Uso

`usoHorasDia` indica quantas horas por dia o aparelho fica ligado.

### Dias Por Semana

`diasPorSemana` indica quantos dias por semana o aparelho e usado.

### Quantidade

`quantidade` indica quantos aparelhos iguais existem.

Exemplo:

```txt
3 lampadas LED
```

### Calculo De kWh

Arquivo:

```txt
src/utils/energyCalculations.js
```

Funcao:

```js
calcularConsumoMensal({
  potencia,
  usoHorasDia,
  diasPorSemana,
  quantidade,
});
```

Formula simplificada:

```txt
(watts × horas × dias por semana × semanas medias do mes × quantidade) / 1000
```

O projeto usa:

```js
SEMANAS_MEDIA_MES = 4.345;
```

### Estimativa Financeira

A tarifa usada esta em:

```js
TARIFA_KWH_PI = 0.88;
```

Funcao:

```js
calcularCustoMensal(consumoMensal);
```

Ela multiplica kWh por tarifa.

### Carbono

O projeto tambem estima carbono com:

```js
FATOR_CO2_SIN_KG_KWH = 0.125;
```

## 10. Explicacao Das Missoes

As missoes incentivam o usuario a economizar energia.

Fonte:

```txt
missions
```

Fallback:

```txt
src/data/seedData.js
```

Exemplos de missoes:

- Chuveiro no modo Verao;
- Operacao Standby Zero;
- Mapa dos 5 Maiores Consumos;
- Iluminacao Inteligente LED;
- Ar-condicionado no 23 graus.

### Como Aparecem

O hook `useMissions` assina:

- catalogo de missoes;
- progresso do usuario.

Depois combina os dois.

### Como Pontuam

Cada missao possui campo `pontos`.

Quando concluida, `completarMissao`:

1. atualiza pontuacao local;
2. salva progresso;
3. chama `addUserScore`;
4. atualiza rankings.

### Desbloqueio

Missoes podem exigir pontuacao minima por `scoreNecessario`.

`useMissions` calcula se a missao esta desbloqueada.

### Gamificacao

Gamificacao e usar elementos de jogo em um contexto educativo.

No EnergiaPI:

- pontos;
- badges;
- missoes;
- ranking;
- conquistas.

## 11. Explicacao Da Interface

### Responsividade

O sistema se adapta a desktop e mobile.

No desktop:

- menu aparece no topo.

No mobile:

- navegacao aparece fixa no rodape;
- gestos de swipe podem trocar de aba.

### Dark Mode

O estado `tema` controla claro/escuro.

O objeto `tm` em `App.jsx` guarda classes de estilo para:

- fundo;
- cards;
- textos;
- bordas;
- inputs;
- header;
- modais.

### Glassmorphism

Glassmorphism e um estilo visual com:

- transparencia;
- blur;
- bordas suaves;
- sombras.

Exemplo do projeto:

```txt
bg-[#111d35]/80
backdrop-blur-md
border-slate-800/60
```

### Botoes

Os botoes usam:

- gradientes verdes/ciano;
- estados `hover`;
- estados `active`;
- `disabled` quando formulario esta invalido.

### Cards

Cards mostram informacoes separadas:

- consumo;
- custo;
- carbono;
- ranking;
- missoes;
- aparelhos.

### Navegacao Mobile E Desktop

Desktop:

- `nav` no header.

Mobile:

- barra fixa inferior;
- icones do `lucide-react`;
- labels curtos.

## 12. Principais Bugs Ja Corrigidos

### Scroll

Problema: a pagina nao rolava corretamente porque containers cresciam indefinidamente ou o `touch-action` bloqueava gestos.

Correcao:

- `html`, `body` e `#root` com altura travada;
- raiz com `h-screen`;
- conteudo principal com `overflow-y-auto`;
- `min-h-0` em itens flex;
- `touch-action: none` mantido apenas nos sliders/ranges.

### Login Com Google

Problema: popup pode ser bloqueado ou usuario Google pode nao ter perfil completo.

Correcao:

- tentativa com popup;
- fallback com redirect;
- perfil pendente tratado por `OnboardingGate`;
- `authProvider` identifica origem da conta.

### Nomes Das Escolas

Problema: a tela mostrava `escolaId`, como `ceti_didacio_silva`, em vez de `escolaNome`.

Correcao:

- `nomePublicoEscola` no frontend;
- `normalizarEscola` no servico;
- `escolaId` fica como identificador tecnico;
- `escolaNome` e `escola` viram prioridade visual.

### Usuarios Com Mesmo Nome

Problema: rankings poderiam confundir pessoas com nomes iguais.

Correcao arquitetural:

- documentos usam `uid`;
- `community/{uid}` espelha perfil publico;
- nome e apenas exibicao.

### Botao Continuar Removido

Problema: a tela introdutoria tinha botao `Continuar` e tambem `Enviar`.

Correcao:

- o botao `Continuar` foi removido;
- `Enviar` permanece como unico submit;
- o fluxo avanca depois do envio bem-sucedido.

### Sliders

Problema: a bolinha branca do slider ficava desalinhada ou cortada.

Correcao:

- componente `SliderAnimado` ajustado;
- trilha interna com margem;
- thumb centralizado;
- CSS de range ajustado para navegadores modernos.

### Emojis E Icones

Problema: alguns emojis apareciam quebrados.

Correcao:

- `normalizarEmojiVisual`;
- `iconeAparelhoSeguro`;
- normalizacao no catalogo e no Firestore service;
- fallback visual quando Twemoji falha.

## 13. Glossario Para Iniciantes

### Componente

Parte reutilizavel da interface.

Exemplo: um botao, card ou modal.

### Estado

Informacao que pode mudar durante o uso.

Exemplo:

```js
const [abaSelecionada, setAbaSelecionada] = useState("dashboard");
```

### Props

Dados enviados de um componente pai para um componente filho.

Exemplo:

```jsx
<OnboardingGate usuario={usuario} onSubmit={handleOnboardingSubmit} />
```

### Hook

Funcao especial do React. Geralmente comeca com `use`.

Exemplos:

- `useState`;
- `useEffect`;
- `useMemo`;
- `useCallback`;
- `useUserDevices`.

### Funcao

Bloco de codigo que executa uma tarefa.

Exemplo:

```js
const somar = (a, b) => a + b;
```

### Array

Lista de valores.

Exemplo:

```js
["dashboard", "aparelhos", "missões"];
```

### Objeto

Conjunto de campos com valores.

Exemplo:

```js
{
  nome: "CETI Didacio Silva",
  cidade: "Teresina"
}
```

### Import/Export

`export` permite que um arquivo disponibilize algo.

`import` permite que outro arquivo use aquilo.

Exemplo:

```js
export const TARIFA_KWH_PI = 0.88;
```

```js
import { TARIFA_KWH_PI } from "./utils/energyCalculations";
```

### API

Forma de um sistema conversar com outro.

No projeto, Firebase fornece APIs para autenticar e salvar dados.

### Backend

Parte que cuida de dados, regras e servidor. Aqui, o backend principal e Firebase/Firestore.

### Frontend

Parte que o usuario ve e usa no navegador. Aqui, o frontend e React.

### Banco De Dados

Lugar onde dados sao guardados. Aqui, o banco e Firestore.

## Apendice A. Mapa Arquivo Por Arquivo E Funcao Por Funcao

Esta secao serve como guia rapido para localizar cada parte do projeto.

### Arquivos Da Raiz

| Arquivo                             | Papel no projeto                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `package.json`                      | Lista dependencias e scripts, como `npm run dev`, `npm run build`, `npm run lint` e `npm run import:firestore`. |
| `package-lock.json`                 | Registra versoes exatas instaladas pelo npm.                                                                    |
| `index.html`                        | Pagina HTML base. Contem a div `#root`, onde o React renderiza o app.                                           |
| `vite.config.js`                    | Configura Vite com plugins React e Tailwind.                                                                    |
| `eslint.config.js`                  | Configuracao do ESLint para analisar qualidade do codigo.                                                       |
| `firebase.json`                     | Aponta para o arquivo de regras `firestore.rules`.                                                              |
| `firestore.rules`                   | Define permissoes de leitura e escrita no Firestore.                                                            |
| `README.md`                         | README inicial do template React + Vite.                                                                        |
| `DOCUMENTACAO_TECNICA_ENERGIAPI.md` | Este documento.                                                                                                 |

### Pasta `public`

| Arquivo ou pasta         | Papel                                                                         |
| ------------------------ | ----------------------------------------------------------------------------- |
| `public/logo.png`        | Logo usada em telas, header e fallback de video.                              |
| `public/favicon.svg`     | Icone da aba do navegador.                                                    |
| `public/icons.svg`       | Arquivo SVG publico de icones.                                                |
| `public/videos/.gitkeep` | Mantem a pasta `videos` versionada mesmo vazia.                               |
| `public/videos/demo.mp4` | Video esperado pela tela introdutoria. Se nao existir, o app mostra fallback. |

### Pasta `src`

| Arquivo                            | Papel                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/main.jsx`                     | Entrada do React. Renderiza `App` dentro de `ErrorBoundary`.                                 |
| `src/App.jsx`                      | Componente central com autenticacao, telas, abas, modais e estilos globais.                  |
| `src/firebase.js`                  | Configura Firebase App, Auth, Firestore e Google Provider.                                   |
| `src/ErrorBoundary.jsx`            | Mostra tela de erro amigavel se a renderizacao quebrar.                                      |
| `src/index.css`                    | Importa Tailwind CSS.                                                                        |
| `src/App.css`                      | Arquivo CSS antigo/auxiliar. No codigo atual, `main.jsx` importa `index.css`, nao `App.css`. |
| `src/components/layout/Header.jsx` | Arquivo existente, atualmente sem conteudo renderizado.                                      |

### Funcoes Importantes De `src/firebase.js`

| Nome                 | Explicacao                                                       |
| -------------------- | ---------------------------------------------------------------- |
| `isPlaceholderValue` | Verifica se uma configuracao parece vazia, falsa ou placeholder. |
| `resolveConfigValue` | Escolhe valor do `.env` ou fallback padrao.                      |
| `firebaseConfig`     | Objeto final de configuracao do Firebase.                        |
| `auth`               | Servico de autenticacao do Firebase.                             |
| `db`                 | Instancia do Firestore.                                          |
| `provider`           | Provider Google usado no login.                                  |
| `authReady`          | Promessa que configura persistencia local do login.              |

### Funcoes E Constantes Importantes De `src/App.jsx`

| Nome                                  | Para que serve                                             |
| ------------------------------------- | ---------------------------------------------------------- |
| `LOGO_URL`                            | Caminho da logo.                                           |
| `ABAS_APP`                            | Lista de abas internas do app.                             |
| `SWIPE_MIN_DISTANCE`                  | Distancia minima para gesto de trocar aba no mobile.       |
| `LogoEnergiaPI`                       | Mostra a logo do projeto.                                  |
| `GoogleIcon`                          | Mostra o icone Google no botao de login/cadastro.          |
| `Emoji`                               | Renderiza emoji com Twemoji e fallback seguro.             |
| `normalizarEmojiVisual`               | Evita emojis corrompidos na interface.                     |
| `iconeAparelhoSeguro`                 | Escolhe icone confiavel para aparelho pelo nome.           |
| `nomePublicoEscola`                   | Garante que a UI mostre nome de escola, nao `escolaId`.    |
| `montarEndereco`                      | Junta bairro, numero, cidade/estado e CEP em uma string.   |
| `formatarCep`                         | Formata CEP como `00000-000`.                              |
| `normalizarEmail`                     | Remove espacos e coloca email em minusculas.               |
| `emailEhPermitido`                    | Verifica dominios permitidos de email.                     |
| `aguardarPopup`                       | Limita o tempo de espera do popup Google.                  |
| `lerPerfisSalvos`                     | Le cache local de perfis no navegador.                     |
| `salvarPerfilUsuario`                 | Salva perfil no `localStorage`.                            |
| `detectarAuthProvider`                | Identifica se a conta veio de Google ou senha.             |
| `registrarErroAuth`                   | Registra erros de autenticacao no console.                 |
| `carregarPerfilUsuario`               | Monta perfil inicial a partir de Firebase e cache local.   |
| `traduzirErroFirebase`                | Transforma codigos Firebase em mensagens amigaveis.        |
| `App`                                 | Componente principal da aplicacao.                         |
| `dispararNotificacao`                 | Mostra mensagem temporaria na tela.                        |
| `validarFirebaseConfigurado`          | Bloqueia login se Firebase estiver mal configurado.        |
| `fecharModalTemplates`                | Fecha modal de modelos de aparelhos e limpa busca.         |
| `calcularConsumoAparelho`             | Calcula consumo usando dados de aparelho.                  |
| `aplicarPerfilUsuario`                | Atualiza estados locais com dados do perfil.               |
| `sincronizarUsuarioAutenticado`       | Garante que usuario logado tenha documento no Firestore.   |
| `handleAuthSubmit`                    | Controla login/cadastro por email e senha.                 |
| `finalizarGoogleAuth`                 | Finaliza fluxo do Google e decide se falta onboarding.     |
| `autenticarComGoogle`                 | Faz login/cadastro com popup ou redirect Google.           |
| `handleGoogleSignup`                  | Inicia cadastro com Google.                                |
| `handleGoogleLogin`                   | Inicia login com Google.                                   |
| `handleLogout`                        | Sai da conta e limpa estados de sessao.                    |
| `handleOnboardingSubmit`              | Salva perfil inicial vindo do `OnboardingGate`.            |
| `adicionarTemplate`                   | Adiciona aparelho oficial ao usuario.                      |
| `salvarNovoAparelhoCustomizado`       | Salva aparelho criado manualmente.                         |
| `atualizarEletrodomestico`            | Atualiza dados de um aparelho do usuario.                  |
| `abrirEditorRapido`                   | Abre editor pequeno de valor numerico.                     |
| `aplicarValorRapido`                  | Aplica valor escolhido no editor rapido.                   |
| `solicitarExclusaoEletrodomestico`    | Abre confirmacao para excluir aparelho.                    |
| `confirmarExclusaoEletrodomestico`    | Remove aparelho do Firestore.                              |
| `aceitarMissao`                       | Ativa uma missao desbloqueada.                             |
| `completarMissao`                     | Conclui missao, soma pontos e atualiza ranking.            |
| `SliderAnimado`                       | Slider visual customizado da aba Aparelhos.                |
| `handleSwipeStart` e `handleSwipeEnd` | Controlam troca de abas por gesto no mobile.               |
| `LockIcon`                            | Pequeno icone SVG usado em partes bloqueadas da interface. |

### Telas Renderizadas Em `App.jsx`

| Tela             | Quando aparece                                                               |
| ---------------- | ---------------------------------------------------------------------------- |
| Carregamento     | Enquanto `authCarregando` ou cadastro por email esta finalizando.            |
| Login/Cadastro   | Quando `autenticado` e falso.                                                |
| Perfil inicial   | Quando usuario Google ainda nao completou onboarding.                        |
| Dashboard/Resumo | Aba `dashboard`, com consumo, score, insights e ranking de aparelhos.        |
| Aparelhos        | Aba `aparelhos`, com cards, sliders, modelos e aparelhos customizados.       |
| Missoes          | Aba `missões`, com desafios desbloqueados e futuros.                         |
| Comunidade       | Aba `comunidade`, com ranking publico dos auditores.                         |
| Escolas do Piaui | Aba `ranking`, com ranking de CETIs.                                         |
| Modais           | Aparecem para modelos de aparelhos, novo aparelho e confirmacao de exclusao. |

### `src/components/onboarding/OnboardingGate.jsx`

| Nome                 | Explicacao                                                               |
| -------------------- | ------------------------------------------------------------------------ |
| `VIDEO_SRC`          | Caminho `/videos/demo.mp4`.                                              |
| `apenasNumeros`      | Remove tudo que nao e numero.                                            |
| `formatarCep`        | Formata o CEP digitado.                                                  |
| `montarEndereco`     | Monta endereco completo para salvar no perfil.                           |
| `InstitutionalVideo` | Mostra video de demonstracao ou fallback com logo.                       |
| `OnboardingGate`     | Tela que coleta perfil inicial: estudante/morador, CEP, numero e escola. |
| `formularioValido`   | `useMemo` que libera o botao Enviar apenas quando tudo esta correto.     |
| `handleCepChange`    | Atualiza CEP e limpa endereco se CEP ainda esta incompleto.              |
| `useEffect` do CEP   | Consulta ViaCEP quando ha 8 digitos.                                     |
| `enviar`             | Faz submit do perfil inicial chamando `onSubmit`.                        |

### `src/components/schools/SchoolSearchPicker.jsx`

| Nome                 | Explicacao                                       |
| -------------------- | ------------------------------------------------ |
| `getGRE`             | Pega `GRE` ou `gre` de uma escola.               |
| `getSchoolMeta`      | Junta GRE, regiao e cidade para mostrar detalhe. |
| `fallbackTheme`      | Tema padrao caso `tm` nao seja enviado.          |
| `SchoolSearchPicker` | Modal de busca e selecao de CETI.                |
| `closeModal`         | Fecha modal e limpa busca.                       |
| `selecionarEscola`   | Envia escola escolhida ao componente pai.        |

### Hooks

| Arquivo                | Hook/Função              | Explicacao                                                    |
| ---------------------- | ------------------------ | ------------------------------------------------------------- |
| `useDebouncedValue.js` | `useDebouncedValue`      | Espera um tempo antes de atualizar valor. Usado em busca.     |
| `useCatalogSearch.js`  | `useAsyncSearch`         | Logica generica para buscar dados com loading e debounce.     |
| `useCatalogSearch.js`  | `useSchoolSearch`        | Busca escolas.                                                |
| `useCatalogSearch.js`  | `useDeviceCatalogSearch` | Busca aparelhos oficiais.                                     |
| `useMissions.js`       | `trilhaPorThreshold`     | Converte score minimo em trilha: Basicas, Intermediarias etc. |
| `useMissions.js`       | `useMissions`            | Junta catalogo de missoes com progresso do usuario.           |
| `useUserDevices.js`    | `useUserDevices`         | Le, adiciona, atualiza e remove aparelhos do usuario.         |
| `useRankings.js`       | `useRankings`            | Assina rankings de escolas e comunidade.                      |

### `src/services/firestoreService.js`

| Nome                                       | Explicacao                                               |
| ------------------------------------------ | -------------------------------------------------------- |
| `colecao`                                  | Atalho para `collection(db, nome)`.                      |
| `dataDoc`                                  | Junta ID do documento com seus dados.                    |
| `normalizarTipoUsuario`                    | Garante tipo `estudante`, `morador` ou vazio.            |
| `escolaIdPareceSlug`                       | Detecta slugs como `ceti_didacio_silva`.                 |
| `normalizarEscola`                         | Padroniza documento de escola para ranking/busca.        |
| `ordenarRankingEscolas`                    | Ordena escolas por score, auditores e nome.              |
| `normalizarRankingComunidade`              | Padroniza perfil publico do ranking.                     |
| `ordenarRankingComunidade`                 | Ordena comunidade por score, kWh salvo e nome.           |
| `normalizarMissoes`                        | Ajusta missoes iniciais, liberando as primeiras.         |
| `normalizarEmojiVisual`                    | Corrige emoji vazio ou corrompido.                       |
| `normalizarEmojiAparelho`                  | Escolhe emoji de aparelho pelo nome.                     |
| `normalizarAparelhoCatalogo`               | Garante `emoji` e `icone` coerentes.                     |
| `normalizarPerfilUsuario`                  | Padroniza dados do perfil privado.                       |
| `ordenarPorScoreBusca`                     | Ordena resultados por relevancia da busca.               |
| `fallbackQuandoVazio`                      | Usa fallback se uma lista vier vazia.                    |
| `cacheGet` e `cacheSet`                    | Controlam cache com tempo de vida.                       |
| `lerRankingsCache` e `salvarRankingsCache` | Cacheiam rankings no `localStorage`.                     |
| `withTimeout`                              | Impede chamada Firestore de ficar esperando para sempre. |
| `gerarBadgesPontuacao`                     | Cria badges conforme pontuacao.                          |
| `montarCommunityProfile`                   | Monta perfil publico para ranking.                       |
| `montarUserProfile`                        | Monta documento completo do usuario.                     |
| `getUserProfile`                           | Le `users/{uid}`.                                        |
| `montarPendingUserProfile`                 | Cria perfil pendente para usuario Google sem onboarding. |
| `ensureUserDocument`                       | Garante que o usuario tenha documento no Firestore.      |
| `completeUserOnboarding`                   | Finaliza perfil, atualiza `users`, `community` e escola. |
| `saveUserProfile`                          | Alias para completar/salvar perfil.                      |
| `subscribeUserDocument`                    | Escuta documento privado do usuario.                     |
| `addUserScore`                             | Soma pontos e atualiza rankings por transacao.           |
| `searchSchools`                            | Busca escolas por keywords.                              |
| `searchDevices`                            | Busca aparelhos por keywords/categoria.                  |
| `subscribeUserDevices`                     | Escuta aparelhos do usuario.                             |
| `addUserDevice`                            | Adiciona aparelho na subcolecao do usuario.              |
| `updateUserDevice`                         | Atualiza aparelho existente.                             |
| `removeUserDevice`                         | Remove aparelho.                                         |
| `subscribeMissions`                        | Escuta catalogo de missoes.                              |
| `subscribeUserMissionProgress`             | Escuta progresso das missoes do usuario.                 |
| `setUserMissionProgress`                   | Salva progresso de uma missao.                           |
| `listarRankingEscolas`                     | Le escolas para ranking.                                 |
| `listarRankingComunidade`                  | Le comunidade para ranking.                              |
| `subscribeRankings`                        | Junta ranking de escolas e comunidade em tempo real.     |
| `normalizeSchoolForImport`                 | Padroniza escola antes de importacao.                    |
| `incrementRankingSchool`                   | Funcao vazia mantida por compatibilidade.                |

### `src/utils/energyCalculations.js`

| Nome                    | Explicacao                                    |
| ----------------------- | --------------------------------------------- |
| `TARIFA_KWH_PI`         | Tarifa usada no calculo financeiro.           |
| `FATOR_CO2_SIN_KG_KWH`  | Fator usado para estimar carbono.             |
| `SEMANAS_MEDIA_MES`     | Media de semanas por mes.                     |
| `numeroSeguro`          | Converte valor em numero confiavel.           |
| `arredondar`            | Arredonda para casas decimais.                |
| `calcularConsumoMensal` | Calcula kWh mensal estimado.                  |
| `calcularCustoMensal`   | Calcula custo em reais.                       |
| `calcularCarbonoMensal` | Calcula emissao estimada.                     |
| `normalizarUsoAparelho` | Padroniza aparelho e recalcula consumo/custo. |

### `src/utils/text.js`

| Nome                           | Explicacao                              |
| ------------------------------ | --------------------------------------- |
| `removerAcentos`               | Remove acentos para facilitar busca.    |
| `normalizarBusca`              | Limpa texto para busca.                 |
| `criarIdPadronizado`           | Cria IDs como `ceti_didacio_silva`.     |
| `criarPrefixes`                | Gera prefixos para busca parcial.       |
| `criarKeywords`                | Cria lista de palavras-chave.           |
| `distanciaLevenshteinLimitada` | Mede semelhanca simples entre palavras. |
| `pontuarBusca`                 | Da nota para resultado de busca.        |

### `src/data/seedData.js`

| Nome                      | Explicacao                                      |
| ------------------------- | ----------------------------------------------- |
| `CATEGORIAS_APARELHOS`    | Categorias usadas em aparelhos.                 |
| `GRE_OPTIONS`             | Lista de GREs.                                  |
| `SCHOOLS_SEED`            | Escolas vindas de `schools.json`, normalizadas. |
| `devicesBase`             | Lista base de aparelhos.                        |
| `emojiSeguroAparelho`     | Escolhe emoji confiavel para aparelhos do seed. |
| `DEVICES_SEED`            | Catalogo inicial de aparelhos.                  |
| `MISSIONS_SEED`           | Catalogo inicial de missoes.                    |
| `RANKING_ESCOLAS_SEED`    | Ranking inicial baseado nas escolas.            |
| `RANKING_COMUNIDADE_SEED` | Usuarios demonstrativos para ranking.           |

### `scripts/importFirestoreData.mjs`

| Nome                 | Explicacao                                                            |
| -------------------- | --------------------------------------------------------------------- |
| `serviceAccountPath` | Caminho da chave Firebase Admin via `GOOGLE_APPLICATION_CREDENTIALS`. |
| `raw`                | Le JSON de arquivo ou usa fallback.                                   |
| `separarGRECidade`   | Separa texto no formato `GRE - cidade`.                               |
| `normalizarEscola`   | Padroniza escola antes de importar.                                   |
| `numero`             | Limpa numeros vindos como texto.                                      |
| `normalizarDevice`   | Padroniza aparelho antes de importar.                                 |
| `gravarColecao`      | Usa batch para gravar muitos documentos.                              |

## 14. Perguntas Que A Banca Pode Fazer

### 1. O que e o EnergiaPI?

E uma aplicacao web educativa que ajuda usuarios a entender e reduzir o consumo de energia eletrica, usando calculos, rankings, missoes e gamificacao.

### 2. Por que usar React?

Porque React facilita criar interfaces dinamicas com componentes reutilizaveis e estados.

### 3. Por que usar Firebase?

Porque Firebase oferece autenticacao e banco de dados em tempo real sem precisar construir um servidor proprio.

### 4. O que e Firestore?

E um banco NoSQL em nuvem. Ele organiza dados em colecoes e documentos.

### 5. Qual a diferenca entre `escolaId` e `escolaNome`?

`escolaId` e identificador tecnico, como `ceti_didacio_silva`. `escolaNome` e o nome mostrado ao usuario, como `CETI Didacio Silva`.

### 6. Por que usar UID?

Porque duas pessoas podem ter o mesmo nome, mas cada usuario Firebase tem um UID unico.

### 7. Como o app calcula consumo de energia?

Usa potencia, horas de uso, dias por semana e quantidade:

```txt
(W × horas × dias × semanas do mes × quantidade) / 1000
```

### 8. Como o ranking das escolas funciona?

Cada estudante esta ligado a uma escola. Quando ganha pontos, a escola tambem recebe pontos agregados.

### 9. Como o ranking da comunidade funciona?

Ele le a colecao `community`, ordenando usuarios por score.

### 10. Como o Google Login funciona?

O app tenta abrir popup do Google. Se o navegador bloquear, usa redirect.

### 11. O que acontece se o usuario Google nao completou perfil?

O app mostra `OnboardingGate`, a tela de perfil inicial.

### 12. Por que existe a colecao `community` se ja existe `users`?

Porque `users` e privado. `community` e uma versao publica e reduzida para ranking.

### 13. O que sao regras do Firestore?

Sao regras que dizem quem pode ler e escrever dados. Elas protegem o banco contra alteracoes indevidas.

### 14. O que e debounce?

E uma tecnica para esperar o usuario parar de digitar antes de buscar dados. Isso evita muitas buscas seguidas.

### 15. O que e `onSnapshot`?

E uma escuta em tempo real do Firestore. Quando os dados mudam, o app recebe atualizacao.

### 16. Por que o botao Continuar foi removido?

Porque ja havia o botao `Enviar`. Manter dois botoes para a mesma acao causava confusao.

### 17. Como o app e responsivo?

Ele usa classes Tailwind com prefixos como `sm:`, `md:` e `lg:`, alem de navegacao diferente para mobile e desktop.

### 18. O que acontece quando uma missao e concluida?

O progresso e salvo, o score aumenta e os rankings podem ser atualizados.

### 19. Por que existem dados seed?

Para o app ter escolas, aparelhos e missoes iniciais mesmo quando o Firestore nao retorna dados.

### 20. Qual o papel do Vite?

Rodar o projeto em desenvolvimento e gerar a pasta `dist` para producao.

## 15. Conclusao

O EnergiaPI e relevante tecnicamente porque integra varias partes de uma aplicacao moderna:

- React para interface;
- Vite para desenvolvimento rapido;
- Firebase Authentication para login;
- Firestore para banco de dados;
- hooks para organizacao de logica;
- calculos energeticos em utilitarios;
- regras de seguranca no banco;
- UI responsiva e gamificada.

Ele tambem e relevante socialmente porque transforma um tema importante, consumo de energia, em algo acessivel e pratico. O usuario nao apenas recebe informacao: ele interage, cadastra aparelhos, ve numeros, participa de missoes e entende como suas escolhas afetam a conta de luz.

Institucionalmente, o projeto valoriza escolas do Piaui ao criar ranking de CETIs e estimular estudantes a se envolverem com tecnologia, sustentabilidade e educacao energetica.

Em resumo, o EnergiaPI mostra como programacao pode sair da teoria e virar uma ferramenta real para educacao, economia domestica e impacto ambiental.
