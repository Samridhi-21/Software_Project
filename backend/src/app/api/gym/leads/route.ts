import { NextResponse } from 'next/server'
import { getDb, saveDb, Lead } from '@/lib/gymDb'
import { getAuthUser } from '@/lib/auth'
import { sendLeadInquiryThankYouEmail } from '@/lib/email'

export async function GET(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = await getDb()
    return NextResponse.json({ leads: db.leads })
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, goal } = await request.json()
    if (!name || !email) {
      return NextResponse.json({ error: 'Missing name or email' }, { status: 400 })
    }

    const db = await getDb()
    const newLead: Lead = {
      id: 'l_' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      goal: goal || 'General Fitness',
      date: new Date().toISOString().split('T')[0]
    }

    db.leads.unshift(newLead)
    await saveDb(db)

    // Dispatch thank-you email asynchronously
    sendLeadInquiryThankYouEmail(newLead.email, newLead.name, newLead.goal).catch(err => {
      console.error('Lead inquiry email failed to dispatch:', err)
    })

    return NextResponse.json({ lead: newLead, message: 'Lead recorded successfully' })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
