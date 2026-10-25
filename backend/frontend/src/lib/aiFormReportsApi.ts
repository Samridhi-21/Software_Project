const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : ''
const REPORTS_URL = `${API_BASE}/api/gym/ai-form-reports`

export interface AiFormReportPayload {
  exercise: 'Bicep Curl' | 'Squat' | 'Lunge' | 'Push-Up' | 'Overhead Press'
  score: number
  repetitions: number | null
  metrics: Record<string, number>
  feedback: string[]
  issues: string[]
  durationSeconds: number
  startedAt: string
  analysisMetadata: Record<string, string>
}

export interface AiFormReportRecord extends AiFormReportPayload {
  id: string
  userId: string
  status: 'Good Form' | 'Needs Improvement'
  createdAt: string
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json() as { error?: string }
    return new Error(body.error || fallback)
  } catch {
    return new Error(fallback)
  }
}

function authHeaders(token: string | null): Record<string, string> {
  return token && token !== 'offline_token' ? { Authorization: `Bearer ${token}` } : {}
}

export async function loadAiFormReports(token: string | null): Promise<AiFormReportRecord[]> {
  const response = await fetch(REPORTS_URL, { headers: authHeaders(token) })
  if (!response.ok) throw await responseError(response, 'Could not load saved form reports.')
  const body = await response.json() as { reports?: AiFormReportRecord[] }
  if (!Array.isArray(body.reports)) throw new Error('The report service returned an invalid response.')
  return body.reports
}

export async function saveAiFormReport(token: string | null, report: AiFormReportPayload): Promise<{ report: AiFormReportRecord; storage: 'database' | 'json-fallback' }> {
  const response = await fetch(REPORTS_URL, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
  if (!response.ok) throw await responseError(response, 'Could not save the report. Please retry.')
  const body = await response.json() as { report?: AiFormReportRecord; storage?: string }
  if (!body.report || (body.storage !== 'database' && body.storage !== 'json-fallback')) {
    throw new Error('The report service did not confirm that the report was saved.')
  }
  return { report: body.report, storage: body.storage }
}
