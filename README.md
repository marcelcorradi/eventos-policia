# Radar de Eventos

App web instalável no celular para acompanhar **eventos, shows, festas,
manifestações e interdições** na cidade — pensado para policiais se prepararem
antes de precisar ir ao local. **Gratuito, sem cadastro e sem chave de API.**

## O que faz

- **Período:** hoje, amanhã, fim de semana, semana, mês ou datas específicas
- **Assunto:** tudo, manifestações, shows e festas, esporte, religioso, trânsito
  (ou uma palavra-chave)
- **Notícias automáticas:** lista as notícias recentes da cidade sobre o assunto
  (Google Notícias)
- **Buscas prontas:** botões que abrem Google Eventos, Google, posts do Instagram,
  `#hashtag` da cidade, eventos do Facebook, Sympla/ingressos, prefeitura e X/Twitter
  já com cidade + período + assunto preenchidos
- **Salvos:** salve notícias ou cadastre eventos à mão (data, horário, local,
  observações, link). Fica só no celular (localStorage). Botões de mapa e
  compartilhar (WhatsApp etc.)
- Cidade configurável (padrão **Itaúna - MG**), tema claro/escuro automático
- Interface com [shadcn/ui](https://ui.shadcn.com)

## Publicar (Vercel, grátis)

1. Entre em https://vercel.com com a conta do GitHub
2. *Add New → Project* → escolha este repositório → *Deploy* (não precisa
   configurar nada)
3. Abra o link gerado (ex.: `eventos-policia.vercel.app`) no celular

## Instalar no celular

- **Android (Chrome):** menu ⋮ → *Instalar app* / *Adicionar à tela inicial*
- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*

## Rodar localmente

```bash
npm install
npm run dev
```

## Estrutura

| Caminho | O quê |
|---|---|
| `src/app/api/news/route.ts` | Lê o RSS do Google Notícias (precisa do servidor por causa de CORS) |
| `src/lib/links.ts` | Monta os atalhos de busca |
| `src/lib/topics.ts` | Assuntos e termos de busca |
| `src/components/events-app.tsx` | Tela principal (buscar + salvos) |
| `src/components/saved-event-dialog.tsx` | Cadastro/edição de evento salvo |
| `src/components/ui/*` | Componentes shadcn/ui |
| `src/app/manifest.ts`, `public/sw.js` | PWA (instalação) |
