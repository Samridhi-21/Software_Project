import { NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/gymDb'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const db = await getDb()
    return NextResponse.json({ pricingTiers: db.pricingTiers })
  } catch (error) {
    console.error('Pricing GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, price } = await request.json()
    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Missing name or price' }, { status: 400 })
    }

    const db = await getDb()
    const idx = db.pricingTiers.findIndex(t => t.name.toLowerCase() === name.toLowerCase())
    if (idx > -1) {
      db.pricingTiers[idx].price = price
      await saveDb(db)
      return NextResponse.json({ message: 'Pricing tier updated successfully', pricingTiers: db.pricingTiers })
    }

    return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 })
  } catch (error) {
    console.error('Pricing POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
