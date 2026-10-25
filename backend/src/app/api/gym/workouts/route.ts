import { NextResponse } from 'next/server'
import { getDb, saveDb, WorkoutLog } from '@/lib/gymDb'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    if (user.role !== 'admin' && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = await getDb()
    const logs = db.workoutLogs.filter(log => log.userId === userId)

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Workouts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, exercise, sets, reps, weight } = await request.json()
    if (!userId || !exercise || !sets || !reps) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (user.role !== 'admin' && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = await getDb()
    const newLog: WorkoutLog = {
      id: 'w_' + Date.now(),
      userId,
      exercise: exercise.trim(),
      sets,
      reps,
      weight,
      date: new Date().toISOString().split('T')[0]
    }

    db.workoutLogs.unshift(newLog)
    
    // Increment streak on workout logged
    const userIdx = db.users.findIndex(u => u.id === userId)
    if (userIdx > -1) {
      db.users[userIdx].streak++
    }

    await saveDb(db)

    return NextResponse.json({ log: newLog, streak: userIdx > -1 ? db.users[userIdx].streak : 1 })
  } catch (error) {
    console.error('Workouts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const db = await getDb()
    const existingIdx = db.workoutLogs.findIndex(log => log.id === id)
    if (existingIdx === -1) {
      return NextResponse.json({ error: 'Workout log not found' }, { status: 404 })
    }

    const logToDelete = db.workoutLogs[existingIdx]
    if (user.role !== 'admin' && logToDelete.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    db.workoutLogs.splice(existingIdx, 1)
    await saveDb(db)

    return NextResponse.json({ message: 'Log removed successfully' })
  } catch (error) {
    console.error('Workouts DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
