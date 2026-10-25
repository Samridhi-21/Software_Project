import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, type, targetId, price, name, timeSlot, origin, currency = 'usd' } = await request.json()
    if (!userId || !type || !targetId || !price || !name) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (user.role !== 'admin' && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      console.error('[Stripe Checkout] STRIPE_SECRET_KEY environment variable is not configured.')
      return NextResponse.json({ 
        error: 'Stripe Secret Key is missing in server environment variables. Please check .env.local.' 
      }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2025-01-27.acacia' as any
    })

    const isINR = currency.toLowerCase() === 'inr'
    const paymentMethods = isINR ? ['card', 'upi'] : ['card']

    // Construct redirect base using the provided frontend origin
    const redirectOrigin = origin || new URL(request.url).origin
    
    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods as any,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: name,
              description: type === 'class' ? 'Gym Hub Group Fitness Reservation' : 'Gym Hub 1-on-1 Personal Training Session',
            },
            unit_amount: Math.round(price * 100), // convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${new URL(request.url).origin}/api/gym/checkout/success?session_id={CHECKOUT_SESSION_ID}&origin=${encodeURIComponent(redirectOrigin)}`,
      cancel_url: `${redirectOrigin}/gym-app/`,
      metadata: {
        userId,
        type,
        targetId,
        itemName: name,
        price: price.toString(),
        timeSlot: timeSlot || '',
        currency: currency.toLowerCase(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Session Creation error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
