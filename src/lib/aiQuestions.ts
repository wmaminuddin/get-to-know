/** OpenRouter complementary-question generation. Falls back to null on any failure. */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
/** Primary chat model (override with VITE_OPENROUTER_MODEL). */
const PRIMARY_MODEL = 'google/gemma-4-31b-it:free'
/** Used when the primary model fails / is rate-limited. */
const FALLBACK_MODEL = '~z-ai/glm-flash-latest'

interface OpenRouterResponse {
  choices?: Array<{
    message?: { content?: string | null }
  }>
  error?: { message?: string }
}

function getApiKey(): string | null {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Chat-completions only — reject batch / offline adapter slugs. */
function isUsableChatModel(model: string): boolean {
  const m = model.trim().toLowerCase()
  if (!m || !m.includes('/')) return false
  if (m.includes(':batch')) return false
  if (m.endsWith(':offline')) return false
  return true
}

function getPreferredModel(): string {
  const model = import.meta.env.VITE_OPENROUTER_MODEL
  if (typeof model === 'string' && model.trim()) {
    const trimmed = model.trim()
    if (isUsableChatModel(trimmed)) return trimmed
    console.warn(
      '[openrouter] VITE_OPENROUTER_MODEL is not usable for chat completions; using primary:',
      trimmed,
    )
  }
  return PRIMARY_MODEL
}

/** Preferred first, then built-in fallback(s), de-duplicated. */
function getModelChain(): string[] {
  const chain = [getPreferredModel(), FALLBACK_MODEL, PRIMARY_MODEL]
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of chain) {
    if (!isUsableChatModel(m) || seen.has(m)) continue
    seen.add(m)
    out.push(m)
  }
  return out.length > 0 ? out : [PRIMARY_MODEL]
}

export function isAiConfigured(): boolean {
  return getApiKey() !== null
}

function normalizeQuestion(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const text = raw.replace(/\s+/g, ' ').trim()
  if (text.length < 8 || text.length > 160) return null
  const cleaned = text.replace(/^\d+[\).\]]\s*/, '').trim()
  if (!cleaned.endsWith('?')) return `${cleaned}?`
  return cleaned
}

/** Collapse for near-duplicate checks (case, punctuation, filler words). */
function questionFingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(
      /\b(a|an|the|your|you|to|of|in|on|for|with|about|do|does|did|is|are|was|were|what|which|who|how|when|where|why)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
}

function overlapsExisting(candidate: string, existingFingerprints: Set<string>): boolean {
  const fp = questionFingerprint(candidate)
  if (!fp) return false
  if (existingFingerprints.has(fp)) return true
  for (const ex of existingFingerprints) {
    if (!ex) continue
    if (fp.includes(ex) || ex.includes(fp)) return true
  }
  return false
}

function parseQuestionsJson(text: string, count: number): string[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!match) return null
    try {
      parsed = JSON.parse(match[0])
    } catch {
      return null
    }
  }

  const list = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { questions?: unknown }).questions)
      ? (parsed as { questions: unknown[] }).questions
      : null

  if (!list) return null

  const seen = new Set<string>()
  const out: string[] = []
  for (const item of list) {
    const q = normalizeQuestion(
      typeof item === 'string' ? item : (item as { text?: string })?.text,
    )
    if (!q) continue
    const key = q.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(q)
    if (out.length >= count) break
  }
  return out.length > 0 ? out : null
}

async function requestQuestions(
  apiKey: string,
  model: string,
  prompt: string,
  signal: AbortSignal,
): Promise<string | null> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer':
        typeof window !== 'undefined' ? window.location.origin : 'https://wmaminuddin.github.io',
      'X-Title': 'Get to Know You',
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You generate short get-to-know questions that complement what two people already wrote. Never repeat or closely paraphrase their questions. Reply with valid JSON only, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.warn('[openrouter] HTTP', res.status, model, body)
    return null
  }

  const data = (await res.json()) as OpenRouterResponse
  if (data.error?.message) {
    console.warn('[openrouter]', model, data.error.message)
    return null
  }
  return data.choices?.[0]?.message?.content ?? null
}

/**
 * Ask OpenRouter for complementary get-to-know questions.
 * Returns null if unconfigured or the call/parse fails.
 */
export async function generateComplementaryQuestions(
  userQuestions: string[],
  count: number,
): Promise<string[] | null> {
  const apiKey = getApiKey()
  if (!apiKey || count <= 0) return null

  const cleanedUser = userQuestions.map((q) => q.trim()).filter((q) => q.length > 2)
  const listed = cleanedUser.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const existingFingerprints = new Set(cleanedUser.map(questionFingerprint))

  const prompt = `You help a two-person "get to know you" evening.

Below are the questions the two people wrote themselves. Study them carefully: note the topics, themes, wording, and what they already covered. Your job is to add NEW complementary questions that expand the conversation — not redo theirs.

Generate exactly ${count} NEW questions that:
- both people will answer
- are clearly different from every listed question (no repeats, near-duplicates, or close paraphrases)
- do not ask the same thing with different words (e.g. if they asked about childhood pets, do not ask about animals they grew up with)
- learn from their list: fill gaps and complementary angles they did not cover; avoid their topics when those topics are already well covered
- mix depth: roughly 30% light/fun, 40% medium, 30% deeper/reflective
- are warm, specific, and suitable for a first or early date
- are single sentences ending with ?
- are under 120 characters each
- avoid yes/no-only questions when possible

Questions they wrote (do not repeat or rephrase these):
${listed || '(none)'}

Return JSON only: { "questions": string[] } with exactly ${count} strings.`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  const models = getModelChain()

  try {
    let text: string | null = null
    for (const model of models) {
      text = await requestQuestions(apiKey, model, prompt, controller.signal)
      if (text) {
        if (model !== models[0]) {
          console.warn('[openrouter] fell back to model', model)
        }
        break
      }
    }
    if (!text) return null

    const parsed = parseQuestionsJson(text, count)
    if (!parsed) return null
    // Drop any model output that still overlaps what users wrote.
    const unique = parsed.filter((q) => !overlapsExisting(q, existingFingerprints))
    return unique.length > 0 ? unique : null
  } catch (e) {
    console.warn('[openrouter] generate failed', e)
    return null
  } finally {
    clearTimeout(timer)
  }
}
