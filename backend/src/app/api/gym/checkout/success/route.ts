import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getDb, saveDb } from '@/lib/gymDb'
import { sendBookingConfirmationEmail } from '@/lib/email'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const originParam = searchParams.get('origin')

  const defaultOrigin = new URL(request.url).origin
  const redirectOrigin = originParam ? decodeURIComponent(originParam) : defaultOrigin

  if (!sessionId) {
    return NextResponse.redirect(`${redirectOrigin}/gym-app/?booking_error=missing_session`)
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    console.error('[Stripe Success] STRIPE_SECRET_KEY environment variable is not configured.')
    return NextResponse.redirect(`${redirectOrigin}/gym-app/?booking_error=stripe_unconfigured`)
  }

  try {
    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2025-01-27.acacia' as any
    })

    // Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      console.warn(`[Stripe Success] Session ${sessionId} payment status is: ${session.payment_status}`)
      return NextResponse.redirect(`${redirectOrigin}/gym-app/?booking_error=unpaid`)
    }

    const { userId, type, targetId, itemName, price, timeSlot, currency } = session.metadata || {}

    if (!userId || !type || !targetId) {
      console.error('[Stripe Success] Missing critical booking metadata in checkout session.')
      return NextResponse.redirect(`${redirectOrigin}/gym-app/?booking_error=invalid_metadata`)
    }

    const db = await getDb()

    // 1. Process Database reservation based on type
    if (type === 'class') {
      const classItem = db.classes.find(c => c.id === targetId)
      if (!classItem) {
        console.error(`[Stripe Success] Booked class ID ${targetId} not found in database.`)
        return NextResponse.redirect(`${redirectOrigin}/gym-app/?booking_error=class_not_found`)
      }

      // Check if reservation already exists to avoid duplicates from page reloads
      const exists = db.classReservations.some(r => r.userId === userId && r.classId === targetId)
      if (!exists) {
        db.classReservations.push({
          id: 'res_' + Date.now(),
          userId,
          classId: targetId,
          bookingDate: new Date().toISOString().split('T')[0]
        })

        // Decrement sports available
        const idx = db.classes.findIndex(c => c.id === targetId)
        if (idx > -1 && db.classes[idx].spots > 0) {
          db.classes[idx].spots--
        }

        await saveDb(db)
        console.log(`[Stripe Success] Saved class reservation in database for user ${userId}, class ${targetId}`)
      }
    } else if (type === 'trainer') {
      const trainerItem = db.trainers.find(t => t.id === targetId)
      if (!trainerItem) {
        console.error(`[Stripe Success] Trainer ID ${targetId} not found in database.`)
        return NextResponse.redirect(`${redirectOrigin}/gym-app/?booking_error=trainer_not_found`)
      }

      // Check if reservation already exists
      const exists = db.trainerReservations.some(
        r => r.userId === userId && r.trainerId === targetId && r.time === timeSlot
      )
      if (!exists) {
        const dateMatch = timeSlot?.match(/on (\d{4}-\d{2}-\d{2})/)
        const parsedDate = dateMatch ? dateMatch[1] : '2026-06-18'
        db.trainerReservations.push({
          id: 'tr_res_' + Date.now(),
          userId,
          trainerId: targetId,
          time: timeSlot || '',
          date: parsedDate
        })

        await saveDb(db)
        console.log(`[Stripe Success] Saved trainer reservation in database for user ${userId}, trainer ${targetId}, time ${timeSlot}`)
      }
    }

    // 1.5 Save transaction record to database
    if (!db.transactions) db.transactions = []
    const existsTx = db.transactions.some(tx => tx.id === `txn_${sessionId}`)
    if (!existsTx) {
      db.transactions.push({
        id: `txn_${sessionId}`,
        userId,
        itemName: itemName || (type === 'class' ? 'Fitness Class Session' : '1-on-1 Trainer Session'),
        amount: price ? parseFloat(price) : (type === 'class' ? 15 : 45),
        currency: currency || 'usd',
        date: new Date().toISOString().split('T')[0],
        status: 'paid'
      })
      await saveDb(db)
      console.log(`[Stripe Success] Saved transaction record txn_${sessionId} in database`)
    }

    // 2. Dispatch Email Confirmation Receipt
    const user = db.users.find(u => u.id === userId)
    const userEmail = user?.email || session.customer_details?.email
    const userName = user?.name || session.customer_details?.name || 'Valued Member'

    if (userEmail) {
      sendBookingConfirmationEmail(userEmail, userName, {
        itemName: itemName || 'Gym Hub Session',
        price: price ? parseFloat(price) : (type === 'class' ? 15 : 45),
        type: type as 'class' | 'trainer',
        timeSlot: timeSlot || undefined,
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        currency: currency || 'usd'
      }).catch(err => {
        console.error('[Stripe Success] Failed to dispatch email receipt:', err)
      })
    }

    // Redirect user back to the application dashboard with success query parameters
    return NextResponse.redirect(`${redirectOrigin}/gym-app/?booking_success=true`)
  } catch (error) {
    console.error('[Stripe Success] Callback handler crashed:', error)
    return NextResponse.redirect(`${redirectOrigin}/gym-app/?booking_error=server_crash`)
  }
}
