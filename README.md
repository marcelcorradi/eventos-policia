# Radar de Eventos

App web instalável (PWA) para acompanhar **eventos, shows, festas, manifestações e
aglomerações** que vão acontecer na cidade — pensado para policiais se prepararem
antes de precisar ir ao local.

- Busca por **hoje, amanhã, fim de semana, semana, mês** ou **período específico**
- Filtro por tipo (manifestação, show, esporte, religioso…) e palavra-chave
- Cidade configurável (padrão: **Itaúna - MG**)
- Cada evento traz data, horário, local, público estimado, **nível de risco**,
  pontos de atenção para o policiamento, link da fonte, atalho para o mapa e
  botão de compartilhar (WhatsApp etc.)
- **Salvar eventos** no próprio celular (localStorage — nada vai para servidor)
- Interface com [shadcn/ui](https://ui.shadcn.com), tema claro/escuro automático

## Como a busca funciona

A rota `POST /api/search` usa a API da Anthropic (Claude) com a ferramenta de
**pesquisa na web**: o modelo faz várias buscas (Google-like, perfis do Instagram
indexados, Facebook, Sympla, site da prefeitura, portais e rádios locais), descarta
o que está fora do período/cidade e devolve a lista estruturada.

> Instagram e Facebook não têm API pública de busca de eventos; o app encontra o
> que está indexado na web. Resultados são gerados por IA — sempre confirme na fonte.

Cada busca leva ~30 s a 2 min e custa alguns centavos de dólar na conta da Anthropic.

## Rodando localmente

```bash
cp .env.example .env.local   # coloque sua ANTHROPIC_API_KEY
npm install
npm run dev
```

## Publicando (Vercel — grátis)

1. Importe o repositório em https://vercel.com/new
2. Em *Environment Variables* adicione `ANTHROPIC_API_KEY` (e, recomendado,
   `ACCESS_CODE` para que só quem tem o código consiga buscar)
3. Deploy

## Instalando no celular

- **Android (Chrome):** abra o site → menu ⋮ → *Instalar app* / *Adicionar à tela inicial*
- **iPhone (Safari):** abra o site → botão Compartilhar → *Adicionar à Tela de Início*

Se definiu `ACCESS_CODE`, toque na cidade no topo do app e preencha o código.

## Estrutura

| Caminho | O quê |
|---|---|
| `src/app/api/search/route.ts` | Busca com Claude + web search |
| `src/components/events-app.tsx` | Tela principal (busca + salvos) |
| `src/components/event-card.tsx` | Card do evento |
| `src/components/period-picker.tsx` | Seletor de período |
| `src/components/settings-sheet.tsx` | Cidade/UF e código de acesso |
| `src/components/ui/*` | Componentes shadcn/ui |
| `src/app/manifest.ts`, `public/sw.js` | PWA (instalação) |
