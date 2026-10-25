import { NextResponse } from 'next/server'
import { getDb, saveDb, ClassReservation } from '@/lib/gymDb'
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

    // Add user booking flags to classes
    const classes = db.classes.map(c => {
      const isBooked = userId 
        ? db.classReservations.some(r => r.userId === userId && r.classId === c.id)
        : false
      return {
        ...c,
        isBooked
      }
    })

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Classes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, classId } = await request.json()
    if (!userId || !classId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (user.role !== 'admin' && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = await getDb()

    // Verify class exists
    const classItem = db.classes.find(c => c.id === classId)
    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Check if already booked
    const existingIdx = db.classReservations.findIndex(r => r.userId === userId && r.classId === classId)

    if (existingIdx > -1) {
      // Cancel booking
      db.classReservations.splice(existingIdx, 1)
      
      // Update spots available
      const idx = db.classes.findIndex(c => c.id === classId)
      if (idx > -1 && db.classes[idx].spots < db.classes[idx].maxSpots) {
        db.classes[idx].spots++
      }

      await saveDb(db)
      return NextResponse.json({ message: 'Reservation cancelled', isBooked: false })
    } else {
      // Book class
      const newReservation: ClassReservation = {
        id: 'res_' + Date.now(),
        userId,
        classId,
        bookingDate: new Date().toISOString().split('T')[0]
      }

      db.classReservations.push(newReservation)

      // Update spots
      const idx = db.classes.findIndex(c => c.id === classId)
      if (idx > -1 && db.classes[idx].spots > 0) {
        db.classes[idx].spots--
      }

      await saveDb(db)
      return NextResponse.json({ message: 'Reservation confirmed', isBooked: true })
    }
  } catch (error) {
    console.error('Classes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin Add Class
export async function PUT(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { className, trainerName, time, day, maxSpots } = await request.json()
    if (!className || !trainerName || !time || !day || !maxSpots) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const db = await getDb()
    const newClass = {
      id: 'c_' + Date.now(),
      className,
      trainerName,
      time,
      day,
      spots: maxSpots,
      maxSpots
    }

    db.classes.push(newClass)
    await saveDb(db)

    return NextResponse.json({ message: 'Class added successfully', class: newClass })
  } catch (error) {
    console.error('Classes PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
