import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createAiFormReport, isAiFormReportsPostgresBacked, listAiFormReports } from '@/lib/gymDb'
import { validateAiFormReportInput } from '@/lib/aiFormReports'

const MAX_BODY_CHARS = 16_384
const HISTORY_LIMIT = 50

export async function GET(request: Request) {
  const user = getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'member' || typeof user.id !== 'string') {
    return NextResponse.json({ error: 'Member access required' }, { status: 403 })
  }

  try {
    const reports = await listAiFormReports(user.id)
    return NextResponse.json({ reports: reports.slice(0, HISTORY_LIMIT) })
  } catch {
    return NextResponse.json({ error: 'Unable to load form analysis history' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const user = getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'member' || typeof user.id !== 'string') {
    return NextResponse.json({ error: 'Member access required' }, { status: 403 })
  }

  try {
    const rawBody = await request.text()
    if (rawBody.length > MAX_BODY_CHARS) return NextResponse.json({ error: 'Report payload is too large' }, { status: 413 })

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 })
    }

    const input = validateAiFormReportInput(body)
    if (!input) return NextResponse.json({ error: 'Invalid report fields' }, { status: 400 })

    const report = await createAiFormReport(user.id, {
      ...input,
      analysisMetadata: { ...input.analysisMetadata, analysisOrigin: 'browser-landmark-analysis' },
    })
    return NextResponse.json({ report, storage: isAiFormReportsPostgresBacked() ? 'database' : 'json-fallback' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unable to save form analysis report' }, { status: 503 })
  }
}
