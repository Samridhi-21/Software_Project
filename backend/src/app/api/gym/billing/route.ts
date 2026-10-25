import { NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/gymDb'
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
    let transactions = db.transactions || []
    if (userId) {
      transactions = transactions.filter(t => t.userId === userId)
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Billing GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId } = await request.json()
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const db = await getDb()
    if (!db.transactions) db.transactions = []

    const txIdx = db.transactions.findIndex(t => t.id === transactionId)
    if (txIdx === -1) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const transaction = db.transactions[txIdx]
    
    // Check if the user is authorized to refund this transaction
    if (user.role !== 'admin' && transaction.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (transaction.status === 'refunded') {
      return NextResponse.json({ error: 'Transaction already refunded' }, { status: 400 })
    }

    // Mark as refunded
    transaction.status = 'refunded'

    // Attempt to revert the booking reservation
    const isTrainer = transaction.itemName.toLowerCase().includes('1-on-1') || transaction.itemName.toLowerCase().includes('session')
    
    if (isTrainer) {
      // Find trainer by parsing name from "1-on-1 Session: [Trainer Name]"
      const trainerName = transaction.itemName.split(':').pop()?.trim() || ''
      const trainer = db.trainers.find(t => t.name.toLowerCase().includes(trainerName.toLowerCase()))
      if (trainer) {
        // Delete reservation
        const idx = db.trainerReservations.findIndex(
          r => r.userId === transaction.userId && r.trainerId === trainer.id
        )
        if (idx > -1) {
          db.trainerReservations.splice(idx, 1)
        }
      }
    } else {
      // Find class reservation by matching class name
      const classItem = db.classes.find(
        c => c.className.toLowerCase().trim() === transaction.itemName.toLowerCase().trim()
      )
      if (classItem) {
        const idx = db.classReservations.findIndex(
          r => r.userId === transaction.userId && r.classId === classItem.id
        )
        if (idx > -1) {
          db.classReservations.splice(idx, 1)
          
          // Increment class spots back
          const classIdx = db.classes.findIndex(c => c.id === classItem.id)
          if (classIdx > -1 && db.classes[classIdx].spots < db.classes[classIdx].maxSpots) {
            db.classes[classIdx].spots++
          }
        }
      }
    }

    await saveDb(db)
    
    // For admins, they expect full list or filtered, but standard user wants their own list
    let returnedTransactions = db.transactions
    if (user.role !== 'admin') {
      returnedTransactions = db.transactions.filter(t => t.userId === user.id)
    }

    return NextResponse.json({ 
      message: 'Transaction refunded successfully', 
      transactions: returnedTransactions 
    })
  } catch (error) {
    console.error('Billing POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
