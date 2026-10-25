import { NextResponse } from 'next/server'
import { deleteAiFormReportsForUser, getDb, saveDb } from '@/lib/gymDb'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()

    if (user.role === 'admin') {
      const users = db.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        tier: u.tier,
        joined: u.joined,
        streak: u.streak,
        waterIntake: u.waterIntake,
        role: u.role,
        avatar: u.avatar
      }))
      return NextResponse.json({ users })
    } else {
      // Return single authenticated user inside the array expected by frontend structure
      const currentUser = db.users.find(u => u.id === user.id)
      if (!currentUser) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }
      return NextResponse.json({
        users: [{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          tier: currentUser.tier,
          joined: currentUser.joined,
          streak: currentUser.streak,
          waterIntake: currentUser.waterIntake,
          role: currentUser.role,
          avatar: currentUser.avatar
        }]
      })
    }
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, waterIntake, streak, tier, name, email, avatar, role } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // Standard users can only update their own profile
    if (user.role !== 'admin' && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = await getDb()
    const idx = db.users.findIndex(u => u.id === userId)
    if (idx === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (waterIntake !== undefined) {
      db.users[idx].waterIntake = waterIntake
    }
    if (streak !== undefined) {
      db.users[idx].streak = streak
    }
    if (tier !== undefined) {
      db.users[idx].tier = tier
    }
    if (name !== undefined) {
      db.users[idx].name = name
    }
    if (role !== undefined && user.role === 'admin') {
      db.users[idx].role = role
    }
    if (email !== undefined) {
      const emailExists = db.users.some((u, i) => u.email.toLowerCase() === email.toLowerCase() && i !== idx)
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
      db.users[idx].email = email
    }
    if (avatar !== undefined) {
      db.users[idx].avatar = avatar
    }

    await saveDb(db)

    return NextResponse.json({
      user: {
        id: db.users[idx].id,
        name: db.users[idx].name,
        email: db.users[idx].email,
        tier: db.users[idx].tier,
        joined: db.users[idx].joined,
        streak: db.users[idx].streak,
        waterIntake: db.users[idx].waterIntake,
        role: db.users[idx].role,
        avatar: db.users[idx].avatar
      }
    })
  } catch (error) {
    console.error('Profile POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete own administrator account' }, { status: 400 })
    }

    const db = await getDb()
    const idx = db.users.findIndex(u => u.id === userId)
    if (idx === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    db.users.splice(idx, 1)

    // Clean up related user records
    db.classReservations = db.classReservations.filter(r => r.userId !== userId)
    db.trainerReservations = db.trainerReservations.filter(r => r.userId !== userId)
    db.workoutLogs = db.workoutLogs.filter(log => log.userId !== userId)
    if (db.transactions) {
      db.transactions = db.transactions.filter(t => t.userId !== userId)
    }

    await saveDb(db)
    await deleteAiFormReportsForUser(userId)

    const remainingUsers = db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      tier: u.tier,
      joined: u.joined,
      streak: u.streak,
      waterIntake: u.waterIntake,
      role: u.role,
      avatar: u.avatar
    }))

    return NextResponse.json({ users: remainingUsers, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Profile DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
