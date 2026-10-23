/** OpenRouter complementary-question generation. Falls back to null on any failure. */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
/** Cheap/fast default; override with VITE_OPENROUTER_MODEL */
const DEFAULT_MODEL = 'openai/gpt-4o-mini'

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

function getModel(): string {
  const model = import.meta.env.VITE_OPENROUTER_MODEL
  if (typeof model === 'string' && model.trim()) return model.trim()
  return DEFAULT_MODEL
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

  const listed = userQuestions
    .map((q, i) => `${i + 1}. ${q.trim()}`)
    .filter((line) => line.length > 3)
    .join('\n')

  const prompt = `You help a two-person "get to know you" evening.

Each person already wrote questions. Generate exactly ${count} NEW complementary questions that:
- both people will answer
- do NOT repeat or closely paraphrase the existing questions
- mix depth: roughly 30% light/fun, 40% medium, 30% deeper/reflective
- are warm, specific, and suitable for a first or early date
- are single sentences ending with ?
- are under 120 characters each
- avoid yes/no-only questions when possible

Existing questions:
${listed || '(none)'}

Return JSON only: { "questions": string[] } with exactly ${count} strings.`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer':
          typeof window !== 'undefined' ? window.location.origin : 'https://wmaminuddin.github.io',
        'X-Title': 'Get to Know You',
      },
      body: JSON.stringify({
        model: getModel(),
        temperature: 0.9,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You generate short get-to-know questions. Reply with valid JSON only, no markdown.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      console.warn('[openrouter] HTTP', res.status, await res.text().catch(() => ''))
      return null
    }

    const data = (await res.json()) as OpenRouterResponse
    if (data.error?.message) {
      console.warn('[openrouter]', data.error.message)
      return null
    }
    const text = data.choices?.[0]?.message?.content
    if (!text) return null
    return parseQuestionsJson(text, count)
  } catch (e) {
    console.warn('[openrouter] generate failed', e)
    return null
  } finally {
    clearTimeout(timer)
  }
}
