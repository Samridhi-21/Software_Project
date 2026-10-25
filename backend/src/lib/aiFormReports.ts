export const AI_FORM_EXERCISES = [
  'Bicep Curl',
  'Squat',
  'Lunge',
  'Push-Up',
  'Overhead Press',
] as const

export type AiFormExercise = (typeof AI_FORM_EXERCISES)[number]
export type AiFormStatus = 'Good Form' | 'Needs Improvement'

export interface AiFormReportInput {
  exercise: AiFormExercise
  score: number
  repetitions: number | null
  metrics: Record<string, number>
  feedback: string[]
  issues: string[]
  durationSeconds: number
  startedAt: string
  analysisMetadata: Record<string, string>
}

export interface AiFormReport extends AiFormReportInput {
  id: string
  userId: string
  status: AiFormStatus
  createdAt: string
}

const ALLOWED_METRICS = new Set([
  'elbowFlexionDeg',
  'kneeFlexionDeg',
  'shoulderSwingDeg',
  'torsoLeanDeg',
  'hipAlignmentDeg',
  'shoulderElevationDeg',
  'kneeAlignmentDeg',
])
const EXERCISE_METRICS: Record<AiFormExercise, Set<string>> = {
  'Bicep Curl': new Set(['elbowFlexionDeg', 'shoulderSwingDeg']),
  Squat: new Set(['kneeFlexionDeg', 'torsoLeanDeg']),
  Lunge: new Set(['kneeFlexionDeg', 'torsoLeanDeg']),
  'Push-Up': new Set(['elbowFlexionDeg', 'hipAlignmentDeg']),
  'Overhead Press': new Set(['elbowFlexionDeg', 'torsoLeanDeg']),
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBoundedTextArray(value: unknown, maxItems: number): value is string[] {
  return Array.isArray(value) && value.length <= maxItems &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 240)
}

export function validateAiFormReportInput(value: unknown): AiFormReportInput | null {
  if (!isRecord(value)) return null
  if (!AI_FORM_EXERCISES.includes(value.exercise as AiFormExercise)) return null
  if (!Number.isInteger(value.score) || (value.score as number) < 0 || (value.score as number) > 100) return null
  if (value.repetitions !== null && (!Number.isInteger(value.repetitions) || (value.repetitions as number) < 0 || (value.repetitions as number) > 500)) return null
  if (!Number.isInteger(value.durationSeconds) || (value.durationSeconds as number) < 1 || (value.durationSeconds as number) > 3600) return null
  if (typeof value.startedAt !== 'string' || !Number.isFinite(Date.parse(value.startedAt))) return null

  const startedAtMs = Date.parse(value.startedAt)
  const now = Date.now()
  if (startedAtMs > now + 5 * 60_000 || startedAtMs < now - 24 * 60 * 60_000) return null
  if (!isRecord(value.metrics) || Object.keys(value.metrics).length > ALLOWED_METRICS.size) return null

  const metrics: Record<string, number> = {}
  for (const [key, metric] of Object.entries(value.metrics)) {
    const exercise = value.exercise as AiFormExercise
    if (!ALLOWED_METRICS.has(key) || !EXERCISE_METRICS[exercise].has(key) || typeof metric !== 'number' || !Number.isFinite(metric) || metric < 0 || metric > 180) return null
    metrics[key] = Math.round(metric * 10) / 10
  }

  if (!isBoundedTextArray(value.feedback, 8) || value.feedback.length === 0) return null
  if (!isBoundedTextArray(value.issues, 8)) return null
  if (!isRecord(value.analysisMetadata) || Object.keys(value.analysisMetadata).length > 8) return null

  const analysisMetadata: Record<string, string> = {}
  for (const [key, metadataValue] of Object.entries(value.analysisMetadata)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key) || typeof metadataValue !== 'string' || metadataValue.length > 120) return null
    analysisMetadata[key] = metadataValue
  }

  return {
    exercise: value.exercise as AiFormExercise,
    score: value.score as number,
    repetitions: value.repetitions as number | null,
    metrics,
    feedback: value.feedback.map((item) => item.trim()),
    issues: value.issues.map((item) => item.trim()),
    durationSeconds: value.durationSeconds as number,
    startedAt: new Date(startedAtMs).toISOString(),
    analysisMetadata,
  }
}

export function normalizeAiFormReport(row: AiFormReport): AiFormReport {
  const score = Math.max(0, Math.min(100, Math.round(row.score)))
  return {
    ...row,
    score,
    status: score >= 80 ? 'Good Form' : 'Needs Improvement',
    repetitions: row.repetitions === null ? null : Math.max(0, Math.min(500, Math.round(row.repetitions))),
    createdAt: new Date(row.createdAt).toISOString(),
  }
}
