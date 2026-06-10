# EnergiaPI

O EnergiaPI é uma aplicação web educacional voltada para conscientização e eficiência energética residencial, desenvolvida por estudantes da rede pública do Piauí.

O projeto utiliza gamificação, cálculos de consumo elétrico e rankings colaborativos para incentivar hábitos de economia de energia em residências e comunidades escolares.

---

# Objetivo do Projeto

# Problema

O aumento do custo da energia elétrica impacta diretamente o orçamento de muitas famílias, especialmente em residências de baixa e média renda.

Apesar disso, a maioria dos consumidores não possui ferramentas acessíveis para identificar:

- quais aparelhos consomem mais energia;
- quanto cada hábito doméstico representa financeiramente;
- quais mudanças realmente geram economia.

Na prática, muitas famílias recebem apenas o valor final da conta de energia, sem informações claras sobre a origem do consumo.

Além disso, ações tradicionais de conscientização energética normalmente apresentam recomendações genéricas, sem dados quantitativos ou acompanhamento contínuo.

---

# Solução Proposta

O EnergiaPI propõe uma solução baseada em educação tecnológica, gamificação e análise de consumo energético residencial.

A aplicação transforma o usuário em um “auditor energético” da própria residência, permitindo que ele visualize, de forma prática e quantitativa, o impacto dos aparelhos elétricos e hábitos domésticos no consumo mensal.

A solução funciona em três etapas principais:

## 1. Diagnóstico de Consumo

O usuário cadastra os aparelhos presentes na residência e informa tempo médio de uso.

Com base nesses dados, o sistema calcula:

- consumo estimado em kWh;
- custo aproximado em reais;
- ranking dos aparelhos que mais consomem energia.

---

## 2. Missões Gamificadas

Após o diagnóstico inicial, o sistema recomenda missões de economia energética.

Exemplos:

- reduzir tempo de banho;
- desligar aparelhos em standby;
- utilizar iluminação LED;
- otimizar uso de ar-condicionado.

As missões geram pontuação, badges e progressão dentro da plataforma.

---

## 3. Engajamento Coletivo

O sistema utiliza rankings entre usuários e escolas para incentivar participação contínua e engajamento coletivo.

Essa abordagem transforma eficiência energética em uma experiência interativa e colaborativa, aproximando estudantes de temas relacionados à tecnologia, sustentabilidade e impacto social.

---

# Diferencial da Solução

O principal diferencial do EnergiaPI está na combinação entre:

- educação ambiental;
- gamificação;
- acessibilidade tecnológica;
- integração com escolas públicas;
- baixo custo operacional.

Diferentemente de soluções comerciais voltadas para monitoramento avançado com sensores físicos e dispositivos IoT, o EnergiaPI foi projetado para funcionar utilizando apenas informações declaradas pelo usuário, permitindo ampla acessibilidade mesmo em contextos de baixa renda.

Além disso, o sistema foi pensado para integração com o ambiente escolar, utilizando estudantes como agentes multiplicadores de conscientização energética dentro das próprias famílias.

# Funcionalidades Principais

- Cadastro e autenticação de usuários;
- Login com Google e Email/Senha;
- Cadastro de eletrodomésticos;
- Estimativa de consumo mensal em kWh;
- Estimativa de custo energético em reais;
- Sistema de missões gamificadas;
- Sistema de pontuação e badges;
- Ranking da comunidade;
- Ranking entre escolas;
- Interface responsiva;
- Persistência de dados em nuvem.

---

# Arquitetura do Projeto

O sistema foi desenvolvido utilizando arquitetura baseada em frontend React integrado ao ecossistema Firebase.

## Frontend

Responsável pela interface, interação do usuário e renderização das telas.

Tecnologias utilizadas:

- React
- Vite
- JavaScript
- Tailwind CSS

## Backend e Persistência

Responsável por autenticação, armazenamento e sincronização de dados.

Serviços utilizados:

- Firebase Authentication
- Firebase Firestore

## Hospedagem

- Vercel (frontend)
- Firebase Services (backend e banco)

---

# Estrutura do Projeto

```txt id="2c1x9o"
src/
├── components/
├── hooks/
├── services/
├── utils/
├── data/
├── firebase/
├── App.jsx
└── main.jsx
```

### Principais Diretórios

| Pasta        | Função                                       |
| ------------ | -------------------------------------------- |
| `components` | Componentes reutilizáveis da interface       |
| `hooks`      | Hooks personalizados com lógica reutilizável |
| `services`   | Comunicação com Firebase e Firestore         |
| `utils`      | Funções auxiliares e cálculos                |
| `data`       | Dados iniciais e catálogos                   |
| `firebase`   | Configuração dos serviços Firebase           |

---

# Funcionamento do Sistema

O fluxo principal da aplicação ocorre da seguinte forma:

```txt id="4k92aa"
Usuário acessa a aplicação
→ Firebase verifica autenticação
→ Usuário realiza login
→ Sistema carrega perfil e dados
→ Usuário cadastra aparelhos
→ Aplicação calcula consumo e custo
→ Missões e rankings são atualizados
```

---

# Cálculo de Consumo Energético

O sistema utiliza uma fórmula baseada em potência elétrica, tempo de uso e frequência semanal do equipamento.

Fórmula utilizada:

```txt
(Watts × horas por dia × dias por semana × semanas do mês × quantidade) / 1000
```

O resultado é convertido para quilowatt-hora (kWh), permitindo estimativas financeiras com base na tarifa energética cadastrada.

---

# Sistema de Gamificação

O projeto utiliza gamificação como estratégia de engajamento educacional.

O usuário pode:

- concluir missões;
- acumular pontos;
- desbloquear desafios;
- receber badges;
- participar de rankings.

As missões incentivam mudanças simples de comportamento relacionadas à economia de energia.

Exemplos:

- uso intercalado de aparelhos refrigeradores, como ventilador e ar-condicionado;
- desligamento de aparelhos em standby;
- substituição de iluminação convencional por LED.

---

# Banco de Dados

O Firestore organiza os dados em coleções e documentos.

Principais coleções utilizadas:

| Coleção     | Finalidade                   |
| ----------- | ---------------------------- |
| `users`     | Dados privados dos usuários  |
| `community` | Dados públicos para rankings |
| `schools`   | Informações das escolas      |
| `missions`  | Catálogo de missões          |

---

# Autenticação

O sistema utiliza Firebase Authentication com os seguintes métodos:

- Email e senha;
- Conta Google.

O login com Google utiliza:

```js id="e6m8qd"
signInWithPopup();
```

e possui fallback utilizando:

```js id="3a9vku"
signInWithRedirect();
```

para navegadores que bloqueiam popups.

---

# Interface e Responsividade

A interface foi desenvolvida utilizando Tailwind CSS com foco em:

- responsividade;
- acessibilidade;
- desempenho;
- experiência mobile.

A aplicação adapta navegação e layout para diferentes tamanhos de tela.

---

# Tecnologias Utilizadas

| Tecnologia    | Função                      |
| ------------- | --------------------------- |
| React         | Interface da aplicação      |
| Vite          | Ambiente de desenvolvimento |
| JavaScript    | Lógica da aplicação         |
| Tailwind CSS  | Estilização                 |
| Firebase Auth | Autenticação                |
| Firestore     | Banco de dados              |
| Git/GitHub    | Versionamento               |

---

# Como Executar o Projeto

## Instalar dependências

```bash id="n4kzv1"
npm install
```

## Executar em ambiente de desenvolvimento

```bash id="y8r6tw"
npm run dev
```

## Gerar build de produção

```bash id="6q3lxs"
npm run build
```

---

# Objetivos de Expansão

As próximas etapas previstas para o projeto incluem:

- integração com dispositivos IoT;
- monitoramento em tempo real;
- relatórios institucionais;
- inteligência artificial para recomendações;
- dashboards administrativos para escolas.

---

# Impacto do Projeto

O EnergiaPI busca gerar impacto em três dimensões principais:

## Social

Conscientização sobre consumo energético e redução de desperdício doméstico.

## Educacional

Aplicação prática de conteúdos de tecnologia, sustentabilidade e lógica de programação.

## Econômico

Redução estimada de custos energéticos em residências participantes.

---

# Equipe

Projeto desenvolvido por estudantes da rede pública estadual do Piauí durante a fase de pré-hackathon do programa "Do Piauí para o Mundo".

Nome dos integrantes da equipe:

- Luis Felipe Soares Cardoso
- Guilherme Maylson
- Jamille Maria
- Yasmin Rayane
