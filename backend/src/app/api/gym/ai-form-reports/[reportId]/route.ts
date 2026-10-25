import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { deleteAiFormReport, getAiFormReport } from '@/lib/gymDb'

interface RouteContext {
  params: Promise<{ reportId: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  const user = getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'member' || typeof user.id !== 'string') {
    return NextResponse.json({ error: 'Member access required' }, { status: 403 })
  }

  try {
    const { reportId } = await params
    if (!/^[a-f0-9-]{36}$/i.test(reportId)) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    const report = await getAiFormReport(user.id, reportId)
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    return NextResponse.json({ report })
  } catch {
    return NextResponse.json({ error: 'Unable to load form analysis report' }, { status: 503 })
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'member' || typeof user.id !== 'string') {
    return NextResponse.json({ error: 'Member access required' }, { status: 403 })
  }

  try {
    const { reportId } = await params
    if (!/^[a-f0-9-]{36}$/i.test(reportId)) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    const deleted = await deleteAiFormReport(user.id, reportId)
    if (!deleted) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: 'Unable to delete form analysis report' }, { status: 503 })
  }
}
