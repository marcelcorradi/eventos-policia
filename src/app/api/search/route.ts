import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { z } from "zod"

import {
  CATEGORIES,
  eventId,
  eventSchema,
  searchRequestSchema,
  type EventItem,
  type SearchResponse,
} from "@/lib/events"

export const maxDuration = 300

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5"

const nullableString = { type: ["string", "null"] } as const

const REPORT_TOOL: Anthropic.Beta.BetaTool = {
  name: "report_events",
  description:
    "Entrega a lista final de eventos encontrados. Chame exatamente uma vez, depois de terminar as pesquisas.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "events"],
    properties: {
      summary: {
        type: "string",
        description:
          "Resumo operacional curto (2-4 frases) do período: o que merece mais atenção.",
      },
      events: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "title",
            "description",
            "category",
            "date",
            "startTime",
            "endDate",
            "venue",
            "address",
            "estimatedAttendance",
            "riskLevel",
            "policeNotes",
            "confidence",
            "sourceUrl",
            "sourceName",
          ],
          properties: {
            title: { type: "string" },
            description: { type: "string", description: "1-3 frases sobre o evento." },
            category: { type: "string", enum: Object.keys(CATEGORIES) },
            date: { type: "string", description: "Data de início no formato YYYY-MM-DD." },
            startTime: { ...nullableString, description: "Horário HH:MM ou null." },
            endDate: { ...nullableString, description: "Data final YYYY-MM-DD se durar mais de um dia." },
            venue: { ...nullableString, description: "Nome do local (praça, clube, igreja...)." },
            address: { ...nullableString, description: "Endereço ou ponto de referência." },
            estimatedAttendance: {
              ...nullableString,
              description: "Público estimado, ex.: '~2 mil pessoas'. null se desconhecido.",
            },
            riskLevel: { type: "string", enum: ["baixo", "medio", "alto"] },
            policeNotes: {
              type: "string",
              description:
                "Pontos de atenção para o policiamento: aglomeração, álcool, trânsito, rivalidade, rota de passeata, menores etc.",
            },
            confidence: { type: "string", enum: ["confirmado", "provavel", "rumor"] },
            sourceUrl: { ...nullableString, description: "URL da fonte principal." },
            sourceName: { ...nullableString, description: "Nome da fonte (ex.: Instagram @perfil, site da prefeitura)." },
          },
        },
      },
    },
  },
}

const reportSchema = z.object({
  summary: z.string(),
  events: z.array(eventSchema),
})

function buildPrompt(input: z.infer<typeof searchRequestSchema>, today: string) {
  const period =
    input.from === input.to ? `no dia ${input.from}` : `entre ${input.from} e ${input.to}`
  const focus = [
    input.category && input.category !== "todos"
      ? `Foque principalmente na categoria: ${CATEGORIES[input.category as keyof typeof CATEGORIES] ?? input.category}.`
      : "",
    input.query ? `Termos/assunto de interesse informados pelo usuário: "${input.query}".` : "",
  ]
    .filter(Boolean)
    .join("\n")

  return `Hoje é ${today}. Encontre eventos públicos, manifestações, protestos, passeatas, carreatas, greves, shows, festas, jogos, eventos religiosos, feiras, eventos políticos, interdições de vias e qualquer aglomeração relevante que vão acontecer em ${input.city} - ${input.state}, Brasil, ${period}.

${focus}

Quem vai usar é um policial que precisa saber o que está rolando na cidade para se preparar caso precise ir ao local.

Como pesquisar:
- Faça várias buscas variadas em português, por exemplo: "eventos ${input.city} ${input.state}", "agenda ${input.city}", "show ${input.city}", "manifestação ${input.city}", "protesto ${input.city}", "festa ${input.city}", e versões com o mês/data.
- Procure em Instagram (site:instagram.com ${input.city}), Facebook, sites de ingressos (Sympla, Eventbrite, Ingresse etc.), site e redes da prefeitura e câmara municipal, portais de notícia e rádios locais, paróquias, clubes e casas de show da cidade.
- Inclua apenas eventos dentro do período pedido e na cidade (ou zona rural/distritos dela). Descarte eventos de outras cidades e eventos que já passaram.
- Não invente nada. Se a data ou o local não forem claros, marque confidence como "provavel" ou "rumor" e explique em description.
- Não repita o mesmo evento.

Quando terminar, chame a ferramenta report_events uma única vez com todos os eventos (lista vazia se não achar nada), ordenados por data e horário.`
}

export async function POST(req: Request) {
  const accessCode = process.env.ACCESS_CODE
  if (accessCode && req.headers.get("x-access-code") !== accessCode) {
    return NextResponse.json({ error: "Código de acesso inválido." }, { status: 401 })
  }

  const parsed = searchRequestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros de busca inválidos." }, { status: 400 })
  }
  const input = parsed.data

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date())

  const client = new Anthropic()
  const tools: Anthropic.Beta.BetaToolUnion[] = [
    {
      type: "web_search_20260209",
      name: "web_search",
      max_uses: 10,
      user_location: {
        type: "approximate",
        city: input.city,
        region: input.state,
        country: "BR",
        timezone: "America/Sao_Paulo",
      },
    },
    REPORT_TOOL,
  ]

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: buildPrompt(input, today) },
  ]

  try {
    for (let turn = 0; turn < 6; turn++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system:
          "Você é um analista de inteligência de eventos para segurança pública. Responda sempre em português do Brasil.",
        tools,
        tool_choice: { type: "auto" },
        messages,
      })

      if (response.stop_reason === "refusal") {
        return NextResponse.json(
          { error: "A busca foi recusada pelo modelo. Tente reformular." },
          { status: 422 },
        )
      }

      const report = response.content.find(
        (b): b is Anthropic.Beta.BetaToolUseBlock =>
          b.type === "tool_use" && b.name === "report_events",
      )

      if (report) {
        const data = reportSchema.safeParse(report.input)
        if (!data.success) {
          return NextResponse.json(
            { error: "Resposta em formato inesperado. Tente novamente." },
            { status: 502 },
          )
        }
        const seen = new Set<string>()
        const events: EventItem[] = []
        for (const e of data.data.events) {
          if (e.date < input.from || e.date > input.to) {
            // aceita eventos de vários dias que começaram antes mas continuam no período
            if (!(e.endDate && e.date < input.from && e.endDate >= input.from)) continue
          }
          const id = eventId({ ...e, city: input.city })
          if (seen.has(id)) continue
          seen.add(id)
          events.push({ ...e, id, city: `${input.city} - ${input.state}` })
        }
        events.sort((a, b) =>
          `${a.date} ${a.startTime ?? "99:99"}`.localeCompare(`${b.date} ${b.startTime ?? "99:99"}`),
        )
        const body: SearchResponse = {
          events,
          summary: data.data.summary,
          searchedAt: new Date().toISOString(),
        }
        return NextResponse.json(body)
      }

      // Continua a conversa: pause_turn (servidor retoma sozinho) ou o modelo
      // terminou sem chamar a ferramenta (pedimos para entregar o resultado).
      messages.push({ role: "assistant", content: response.content })
      if (response.stop_reason !== "pause_turn") {
        messages.push({
          role: "user",
          content: "Agora chame report_events com os eventos encontrados.",
        })
      }
    }

    return NextResponse.json(
      { error: "A busca demorou demais. Tente um período menor." },
      { status: 504 },
    )
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Chave da API Anthropic inválida ou ausente no servidor." },
        { status: 500 },
      )
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Muitas buscas seguidas. Aguarde um pouco e tente de novo." },
        { status: 429 },
      )
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error", err.status, err.message)
      return NextResponse.json(
        { error: "Falha ao consultar o serviço de busca." },
        { status: 502 },
      )
    }
    console.error(err)
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 })
  }
}
