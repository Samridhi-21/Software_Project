import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateAiFormReportInput } from './aiFormReports.ts'

const validReport = () => ({
  exercise: 'Squat',
  score: 84,
  repetitions: 3,
  metrics: { kneeFlexionDeg: 91.2, torsoLeanDeg: 12.4 },
  feedback: ['Your knee angle reached the configured depth range.'],
  issues: [],
  durationSeconds: 12,
  startedAt: new Date().toISOString(),
  analysisMetadata: { model: 'MediaPipe Pose Landmarker Lite', packageVersion: '1.0.1' },
})

test('accepts a bounded browser-derived form report without an owner field', () => {
  const parsed = validateAiFormReportInput(validReport())
  assert.ok(parsed)
  assert.equal(parsed.exercise, 'Squat')
  assert.equal('userId' in parsed, false)
})

test('rejects invalid scores, exercise names, repetitions, and metrics', () => {
  assert.equal(validateAiFormReportInput({ ...validReport(), score: 101 }), null)
  assert.equal(validateAiFormReportInput({ ...validReport(), exercise: 'Deadlift' }), null)
  assert.equal(validateAiFormReportInput({ ...validReport(), repetitions: -1 }), null)
  assert.equal(validateAiFormReportInput({ ...validReport(), metrics: { kneeFlexionDeg: 181 } }), null)
})

test('rejects missing feedback and timestamps outside the accepted window', () => {
  assert.equal(validateAiFormReportInput({ ...validReport(), feedback: [] }), null)
  assert.equal(validateAiFormReportInput({ ...validReport(), startedAt: 'not-a-date' }), null)
  assert.equal(validateAiFormReportInput({ ...validReport(), startedAt: '2000-01-01T00:00:00.000Z' }), null)
})
