import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'

const originalDirectory = process.cwd()
const originalDatabaseUrl = process.env.DATABASE_URL
const testDirectory = await fs.mkdtemp(path.join(originalDirectory, '.ai-form-report-test-'))
process.chdir(testDirectory)
delete process.env.DATABASE_URL

const reportStore = await import('./gymDb.ts')

after(async () => {
  process.chdir(originalDirectory)
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = originalDatabaseUrl
  await fs.rm(testDirectory, { recursive: true, force: true })
})

const input = (exercise: 'Squat' | 'Bicep Curl') => ({
  exercise,
  score: 84,
  repetitions: 3,
  metrics: { kneeFlexionDeg: 91.2 },
  feedback: ['Keep a stable, comfortable range of motion.'],
  issues: [],
  durationSeconds: 12,
  startedAt: new Date().toISOString(),
  analysisMetadata: { model: 'MediaPipe Pose Landmarker Lite' },
})

test('JSON fallback persists reports and scopes all reads and deletes to the owner', async () => {
  const report = await reportStore.createAiFormReport('member-one', input('Squat'))
  assert.equal((await reportStore.listAiFormReports('member-one')).length, 1)
  assert.equal(await reportStore.getAiFormReport('member-two', report.id), null)
  const ownedReport = await reportStore.getAiFormReport('member-one', report.id)
  assert.equal(ownedReport?.id, report.id)
  assert.equal(await reportStore.deleteAiFormReport('member-two', report.id), false)
  assert.equal(await reportStore.deleteAiFormReport('member-one', report.id), true)
  assert.deepEqual(await reportStore.listAiFormReports('member-one'), [])
})

test('concurrent JSON fallback writes are serialized without losing reports', async () => {
  await Promise.all(Array.from({ length: 12 }, (_, index) =>
    reportStore.createAiFormReport('member-concurrent', input(index % 2 ? 'Squat' : 'Bicep Curl'))
  ))
  const reports = await reportStore.listAiFormReports('member-concurrent')
  assert.equal(reports.length, 12)
  assert.equal(new Set(reports.map((report) => report.id)).size, 12)
})
