import { NextResponse } from 'next/server'
import { getDb, saveDb, TrainerReservation } from '@/lib/gymDb'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('userId')
    if (user.role !== 'admin') {
      if (userId && userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      userId = user.id
    }

    const db = await getDb()

    const reservations = userId 
      ? db.trainerReservations.filter(r => r.userId === userId)
      : []

    return NextResponse.json({
      trainers: db.trainers,
      reservations
    })
  } catch (error) {
    console.error('Trainers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 550 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, trainerId, timeSlot } = await request.json()
    if (!userId || !trainerId || !timeSlot) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (user.role !== 'admin' && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = await getDb()

    // Find trainer
    const trainer = db.trainers.find(t => t.id === trainerId)
    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    // Check if already booked
    const existingIdx = db.trainerReservations.findIndex(
      r => r.userId === userId && r.trainerId === trainerId && r.time === timeSlot
    )

    if (existingIdx > -1) {
      // Cancel
      db.trainerReservations.splice(existingIdx, 1)
      await saveDb(db)
      return NextResponse.json({ message: 'Appointment cancelled', isBooked: false })
    } else {
      // Add booking
      const dateMatch = timeSlot.match(/on (\d{4}-\d{2}-\d{2})/)
      const parsedDate = dateMatch ? dateMatch[1] : '2026-06-18'
      const newReservation: TrainerReservation = {
        id: 'tres_' + Date.now(),
        userId,
        trainerId,
        time: timeSlot,
        date: parsedDate
      }

      db.trainerReservations.push(newReservation)
      await saveDb(db)
      return NextResponse.json({ message: 'Appointment booked', isBooked: true })
    }
  } catch (error) {
    console.error('Trainers POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin Add Trainer
export async function PUT(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, specialty, image, bio, rating, availability } = await request.json()
    if (!name || !specialty || !bio) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const db = await getDb()
    const newTrainer = {
      id: 't_' + Date.now(),
      name,
      specialty,
      image: image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
      bio,
      rating: rating || 5.0,
      availability: availability || ['Mon 10:00 AM', 'Wed 10:00 AM']
    }

    db.trainers.push(newTrainer)
    await saveDb(db)

    return NextResponse.json({ message: 'Trainer added successfully', trainer: newTrainer })
  } catch (error) {
    console.error('Trainers PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 550 })
  }
}
