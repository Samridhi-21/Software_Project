import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Pool } from 'pg'
import type { AiFormReport, AiFormReportInput } from './aiFormReports'

// Define the local database file path at the Gym Hub backend root.
const DB_PATH = path.join(process.cwd(), 'gym_db.json')
const AI_REPORTS_PATH = path.join(process.cwd(), 'gym_ai_form_reports.json')
let aiReportsWriteQueue: Promise<void> = Promise.resolve()

// Interfaces
export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  tier: 'Standard Club' | 'Platinum Elite' | 'VIP Coach Pro'
  joined: string
  streak: number
  waterIntake: number
  role: 'member' | 'admin' | 'trainer'
  avatar?: string
}

export interface ClassBooking {
  id: string
  className: string
  trainerName: string
  time: string
  day: string
  spots: number
  maxSpots: number
}

export interface Trainer {
  id: string
  name: string
  specialty: string
  image: string
  bio: string
  rating: number
  availability: string[]
}

export interface WorkoutLog {
  id: string
  userId: string
  exercise: string
  sets: number
  reps: number
  weight: number
  date: string
}

export interface ClassReservation {
  id: string
  userId: string
  classId: string
  bookingDate: string
}

export interface TrainerReservation {
  id: string
  userId: string
  trainerId: string
  time: string
  date: string
}

export interface Lead {
  id: string
  name: string
  email: string
  goal: string
  date: string
}

export interface Transaction {
  id: string
  userId: string
  itemName: string
  amount: number
  currency: string
  date: string
  status: 'paid' | 'refunded'
}

export interface GymDbData {
  users: User[]
  classes: ClassBooking[]
  trainers: Trainer[]
  workoutLogs: WorkoutLog[]
  classReservations: ClassReservation[]
  trainerReservations: TrainerReservation[]
  leads: Lead[]
  pricingTiers: { name: string; price: number }[]
  transactions: Transaction[]
}

// Initial seeder data
const DEFAULT_DATA: GymDbData = {
  users: [
    {
      id: 'u1',
      name: 'Samridhi Gusain',
      email: 'samridhi@gusain.com',
      passwordHash: 'e10adc3949ba59abbe56e057f20f883e', // MD5 of '123456'
      tier: 'Platinum Elite',
      joined: 'Jan 2026',
      streak: 5,
      waterIntake: 1250,
      role: 'member',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80'
    },
    {
      id: 'admin',
      name: 'Operations Manager',
      email: 'admin@gym.com',
      passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // SHA256/hash of 'admin123'
      tier: 'VIP Coach Pro',
      joined: 'Dec 2025',
      streak: 12,
      waterIntake: 0,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80'
    }
  ],
  classes: [
    { id: 'c1', className: 'Gym Hub Spin Revolution', trainerName: 'Marcus Vance', time: '08:00 AM - 09:00 AM', day: 'Mon, Wed', spots: 8, maxSpots: 15 },
    { id: 'c2', className: 'Vinyasa Power Flow', trainerName: 'Serena Croft', time: '10:00 AM - 11:15 AM', day: 'Tue, Thu', spots: 14, maxSpots: 20 },
    { id: 'c3', className: 'Metabolic HIIT Conditioning', trainerName: 'Alex Rivera', time: '05:30 PM - 06:30 PM', day: 'Mon, Fri', spots: 6, maxSpots: 12 },
    { id: 'c4', className: 'Olympic Powerlifting Lab', trainerName: 'Marcus Vance', time: '06:00 PM - 07:30 PM', day: 'Wed, Sat', spots: 2, maxSpots: 6 },
    { id: 'c5', className: 'Functional Pilates Core', trainerName: 'Elena Rostova', time: '09:00 AM - 10:00 AM', day: 'Thu, Sat', spots: 11, maxSpots: 15 }
  ],
  trainers: [
    { 
      id: 't1', 
      name: 'Marcus Vance', 
      specialty: 'Powerlifting, Strength & Hypertrophy', 
      image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&q=80',
      bio: 'Former Olympic weightlifting competitor. Focuses on mechanical precision, heavy compounds, and progressive overload.',
      rating: 4.9,
      availability: ['Mon 9:00 AM', 'Mon 2:00 PM', 'Wed 11:00 AM', 'Wed 4:00 PM', 'Sat 10:00 AM']
    },
    { 
      id: 't2', 
      name: 'Serena Croft', 
      specialty: 'Yoga, Mobility & Athletic Restoration', 
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
      bio: 'B.S. in Kinesiology. Integrates deep flexibility training with breathing mechanics to bulletproof joints and enhance recoverability.',
      rating: 4.8,
      availability: ['Tue 8:00 AM', 'Tue 1:00 PM', 'Thu 10:00 AM', 'Thu 3:00 PM']
    },
    { 
      id: 't3', 
      name: 'Alex Rivera', 
      specialty: 'High-Intensity Tactical Conditioning', 
      image: 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?w=600&q=80',
      bio: 'Ex-Military Physical Training Instructor. Specializes in building raw endurance, explosive speed, and mental toughness.',
      rating: 5.0,
      availability: ['Mon 7:00 AM', 'Mon 4:00 PM', 'Fri 8:00 AM', 'Fri 2:00 PM']
    },
    { 
      id: 't4', 
      name: 'Elena Rostova', 
      specialty: 'Pilates, Posture Correction & Core Strength', 
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
      bio: 'Professional dancer and certified Pilates instructor. Focuses on stabilizer muscles, posture alignment, and core endurance.',
      rating: 4.7,
      availability: ['Thu 1:00 PM', 'Thu 4:00 PM', 'Sat 9:00 AM', 'Sat 1:00 PM']
    }
  ],
  workoutLogs: [
    { id: 'w1', userId: 'u1', exercise: 'Barbell Back Squat', sets: 4, reps: 8, weight: 100, date: '2026-06-12' },
    { id: 'w2', userId: 'u1', exercise: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 32, date: '2026-06-12' },
    { id: 'w3', userId: 'u1', exercise: 'Deadlift', sets: 5, reps: 5, weight: 140, date: '2026-06-14' }
  ],
  classReservations: [],
  trainerReservations: [],
  leads: [
    { id: 'l1', name: 'Kabir Dev', email: 'kabir@dev.co', goal: 'Gain Strength', date: '2026-06-14' },
    { id: 'l2', name: 'Ishita Sharma', email: 'ishita@gmail.com', goal: 'Weight Loss', date: '2026-06-15' }
  ],
  pricingTiers: [
    { name: 'Standard Club', price: 49 },
    { name: 'Platinum Elite', price: 99 },
    { name: 'VIP Coach Pro', price: 199 }
  ],
  transactions: [
    { id: 'txn_1', userId: 'u1', itemName: 'Gym Hub Spin Revolution', amount: 15, currency: 'usd', date: '2026-06-12', status: 'paid' },
    { id: 'txn_2', userId: 'u1', itemName: '1-on-1 Session: Marcus Vance', amount: 45, currency: 'usd', date: '2026-06-14', status: 'paid' }
  ]
}

// ----------------------------------------------------
// DATABASE INITIALIZATION (POSTGRES / JSON FALLBACK)
// ----------------------------------------------------
const pgUrl = process.env.DATABASE_URL
let pool: Pool | null = null
let dbInitialized = false

if (pgUrl) {
  pool = new Pool({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  })
}

async function initPostgres() {
  if (!pool || dbInitialized) return
  try {
    const client = await pool.connect()
    try {
      // 1. Create Tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS gym_users (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          password_hash TEXT,
          tier TEXT,
          joined TEXT,
          streak INTEGER,
          water_intake INTEGER,
          role TEXT,
          avatar TEXT
        );
        CREATE TABLE IF NOT EXISTS gym_classes (
          id TEXT PRIMARY KEY,
          class_name TEXT,
          trainer_name TEXT,
          time TEXT,
          day TEXT,
          spots INTEGER,
          max_spots INTEGER
        );
        CREATE TABLE IF NOT EXISTS gym_trainers (
          id TEXT PRIMARY KEY,
          name TEXT,
          specialty TEXT,
          image TEXT,
          bio TEXT,
          rating NUMERIC,
          availability TEXT[]
        );
        CREATE TABLE IF NOT EXISTS gym_workout_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          exercise TEXT,
          sets INTEGER,
          reps INTEGER,
          weight INTEGER,
          date TEXT
        );
        CREATE TABLE IF NOT EXISTS gym_class_reservations (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          class_id TEXT,
          booking_date TEXT
        );
        CREATE TABLE IF NOT EXISTS gym_trainer_reservations (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          trainer_id TEXT,
          time TEXT,
          date TEXT
        );
        CREATE TABLE IF NOT EXISTS gym_leads (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          goal TEXT,
          date TEXT
        );
        CREATE TABLE IF NOT EXISTS gym_pricing (
          name TEXT PRIMARY KEY,
          price INTEGER
        );
        CREATE TABLE IF NOT EXISTS gym_transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          item_name TEXT,
          amount NUMERIC,
          currency TEXT,
          date TEXT,
          status TEXT
        );
        CREATE TABLE IF NOT EXISTS gym_ai_form_reports (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES gym_users(id) ON DELETE CASCADE,
          exercise TEXT NOT NULL CHECK (exercise IN ('Bicep Curl', 'Squat', 'Lunge', 'Push-Up', 'Overhead Press')),
          score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
          status TEXT NOT NULL CHECK (status IN ('Good Form', 'Needs Improvement')),
          repetitions INTEGER CHECK (repetitions IS NULL OR repetitions BETWEEN 0 AND 500),
          metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
          feedback JSONB NOT NULL DEFAULT '[]'::jsonb,
          issues JSONB NOT NULL DEFAULT '[]'::jsonb,
          duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 1 AND 3600),
          started_at TIMESTAMPTZ NOT NULL,
          analysis_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS gym_ai_form_reports_user_created_idx
          ON gym_ai_form_reports (user_id, created_at DESC);
      `)

      // 2. Seed default tables if users is empty
      const checkUsers = await client.query('SELECT count(*) FROM gym_users')
      if (parseInt(checkUsers.rows[0].count) === 0) {
        console.log('Seeding cloud PostgreSQL tables for Gym Hub...')
        
        // Seed users
        for (const user of DEFAULT_DATA.users) {
          await client.query(
            'INSERT INTO gym_users (id, name, email, password_hash, tier, joined, streak, water_intake, role, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [user.id, user.name, user.email, user.passwordHash, user.tier, user.joined, user.streak, user.waterIntake, user.role, user.avatar || '']
          )
        }

        // Seed classes
        for (const cls of DEFAULT_DATA.classes) {
          await client.query(
            'INSERT INTO gym_classes (id, class_name, trainer_name, time, day, spots, max_spots) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [cls.id, cls.className, cls.trainerName, cls.time, cls.day, cls.spots, cls.maxSpots]
          )
        }

        // Seed trainers
        for (const t of DEFAULT_DATA.trainers) {
          await client.query(
            'INSERT INTO gym_trainers (id, name, specialty, image, bio, rating, availability) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [t.id, t.name, t.specialty, t.image, t.bio, t.rating, t.availability]
          )
        }

        // Seed pricing
        for (const pr of DEFAULT_DATA.pricingTiers) {
          await client.query(
            'INSERT INTO gym_pricing (name, price) VALUES ($1, $2)',
            [pr.name, pr.price]
          )
        }

        // Seed default workouts
        for (const w of DEFAULT_DATA.workoutLogs) {
          await client.query(
            'INSERT INTO gym_workout_logs (id, user_id, exercise, sets, reps, weight, date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [w.id, w.userId, w.exercise, w.sets, w.reps, w.weight, w.date]
          )
        }

        // Seed default leads
        for (const l of DEFAULT_DATA.leads) {
          await client.query(
            'INSERT INTO gym_leads (id, name, email, goal, date) VALUES ($1, $2, $3, $4, $5)',
            [l.id, l.name, l.email, l.goal, l.date]
          )
        }

        // Seed default transactions
        for (const txn of DEFAULT_DATA.transactions) {
          await client.query(
            'INSERT INTO gym_transactions (id, user_id, item_name, amount, currency, date, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [txn.id, txn.userId, txn.itemName, txn.amount, txn.currency, txn.date, txn.status]
          )
        }
      }

      dbInitialized = true
    } finally {
      client.release()
    }
  } catch (e) {
    console.error('Failed to initialize PostgreSQL. Falling back to local file JSON database.', e)
    pool = null // Fallback to local
  }
}

function mapAiFormReport(input: unknown): AiFormReport {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw new Error('Invalid AI form report record')
  const row = input as Record<string, unknown>
  const parseJson = (value: unknown, fallback: unknown) => typeof value === 'string' ? JSON.parse(value) as unknown : (value ?? fallback)
  const score = Number(row.score)
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId),
    exercise: String(row.exercise) as AiFormReport['exercise'],
    score,
    status: score >= 80 ? 'Good Form' : 'Needs Improvement',
    repetitions: row.repetitions === null || row.repetitions === undefined ? null : Number(row.repetitions),
    metrics: parseJson(row.metrics, {}) as Record<string, number>,
    feedback: parseJson(row.feedback, []) as string[],
    issues: parseJson(row.issues, []) as string[],
    durationSeconds: Number(row.duration_seconds ?? row.durationSeconds),
    startedAt: new Date(String(row.started_at ?? row.startedAt)).toISOString(),
    analysisMetadata: parseJson(row.analysis_metadata ?? row.analysisMetadata, {}) as Record<string, string>,
    createdAt: new Date(String(row.created_at ?? row.createdAt)).toISOString(),
  }
}

async function withAiReportsFileLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = aiReportsWriteQueue
  let release!: () => void
  aiReportsWriteQueue = new Promise<void>((resolve) => { release = resolve })
  await previous
  const lockPath = `${AI_REPORTS_PATH}.lock`
  let lockHandle: fs.promises.FileHandle | null = null
  try {
    const waitUntil = Date.now() + 5000
    while (!lockHandle) {
      try {
        lockHandle = await fs.promises.open(lockPath, 'wx', 0o600)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
        try {
          const lockStat = await fs.promises.stat(lockPath)
          if (Date.now() - lockStat.mtimeMs > 30_000) {
            await fs.promises.rm(lockPath, { force: true })
            continue
          }
        } catch (statError) {
          if ((statError as NodeJS.ErrnoException).code === 'ENOENT') continue
          throw statError
        }
        if (Date.now() >= waitUntil) throw new Error('AI form report store is busy')
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }
    return await operation()
  } finally {
    await lockHandle?.close().catch(() => undefined)
    await fs.promises.rm(lockPath, { force: true }).catch(() => undefined)
    release()
  }
}

async function readLocalAiReports(): Promise<AiFormReport[]> {
  try {
    const raw = await fs.promises.readFile(AI_REPORTS_PATH, 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Invalid AI form report store')
    return parsed.map((row) => mapAiFormReport(row))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

async function writeLocalAiReports(reports: AiFormReport[]): Promise<void> {
  const temporaryPath = `${AI_REPORTS_PATH}.${process.pid}.${crypto.randomUUID()}.tmp`
  try {
    await fs.promises.writeFile(temporaryPath, JSON.stringify(reports, null, 2), { encoding: 'utf-8', flag: 'wx' })
    await fs.promises.rename(temporaryPath, AI_REPORTS_PATH)
  } catch (error) {
    await fs.promises.rm(temporaryPath, { force: true }).catch(() => undefined)
    throw error
  }
}

export async function listAiFormReports(userId: string): Promise<AiFormReport[]> {
  if (pool) {
    await initPostgres()
    if (pool) {
      const result = await pool.query('SELECT * FROM gym_ai_form_reports WHERE user_id = $1 ORDER BY created_at DESC', [userId])
      return result.rows.map(mapAiFormReport)
    }
  }
  return withAiReportsFileLock(async () => (await readLocalAiReports()).filter((report) => report.userId === userId))
}

export function isAiFormReportsPostgresBacked(): boolean {
  return pool !== null
}

export async function getAiFormReport(userId: string, reportId: string): Promise<AiFormReport | null> {
  if (pool) {
    await initPostgres()
    if (pool) {
      const result = await pool.query('SELECT * FROM gym_ai_form_reports WHERE user_id = $1 AND id = $2', [userId, reportId])
      return result.rows[0] ? mapAiFormReport(result.rows[0]) : null
    }
  }
  return withAiReportsFileLock(async () => (await readLocalAiReports()).find((report) => report.userId === userId && report.id === reportId) ?? null)
}

export async function createAiFormReport(userId: string, input: AiFormReportInput): Promise<AiFormReport> {
  const id = crypto.randomUUID()
  const score = Math.max(0, Math.min(100, Math.round(input.score)))
  const createdAt = new Date().toISOString()
  const report: AiFormReport = {
    ...input,
    id,
    userId,
    score,
    status: score >= 80 ? 'Good Form' : 'Needs Improvement',
    createdAt,
  }

  if (pool) {
    await initPostgres()
    if (pool) {
      const result = await pool.query(
        `INSERT INTO gym_ai_form_reports
          (id, user_id, exercise, score, status, repetitions, metrics, feedback, issues, duration_seconds, started_at, analysis_metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12::jsonb, $13)
         RETURNING *`,
        [id, userId, input.exercise, score, report.status, input.repetitions, JSON.stringify(input.metrics), JSON.stringify(input.feedback), JSON.stringify(input.issues), input.durationSeconds, input.startedAt, JSON.stringify(input.analysisMetadata), createdAt]
      )
      return mapAiFormReport(result.rows[0])
    }
  }

  await withAiReportsFileLock(async () => {
    const reports = await readLocalAiReports()
    await writeLocalAiReports([report, ...reports])
  })
  return report
}

export async function deleteAiFormReport(userId: string, reportId: string): Promise<boolean> {
  if (pool) {
    await initPostgres()
    if (pool) {
      const result = await pool.query('DELETE FROM gym_ai_form_reports WHERE user_id = $1 AND id = $2', [userId, reportId])
      return (result.rowCount ?? 0) > 0
    }
  }
  return withAiReportsFileLock(async () => {
    const reports = await readLocalAiReports()
    const filtered = reports.filter((report) => !(report.userId === userId && report.id === reportId))
    if (filtered.length === reports.length) return false
    await writeLocalAiReports(filtered)
    return true
  })
}

export async function deleteAiFormReportsForUser(userId: string): Promise<void> {
  if (pool) {
    await initPostgres()
    if (pool) {
      await pool.query('DELETE FROM gym_ai_form_reports WHERE user_id = $1', [userId])
      return
    }
  }
  await withAiReportsFileLock(async () => {
    const reports = await readLocalAiReports()
    const filtered = reports.filter((report) => report.userId !== userId)
    if (filtered.length !== reports.length) await writeLocalAiReports(filtered)
  })
}

// ----------------------------------------------------
// LOCAL JSON DATABASE CONTROLLERS
// ----------------------------------------------------
function getLocalDb(): GymDbData {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8')
      return DEFAULT_DATA
    }
    const content = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    console.error('Failed to read local database', e)
    return DEFAULT_DATA
  }
}

function saveLocalDb(data: GymDbData): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to write local database file', e)
  }
}

// ----------------------------------------------------
// PUBLIC ABSTRACTED CRUD INTERFACES
// ----------------------------------------------------
export async function getDb(): Promise<GymDbData> {
  if (pool) {
    await initPostgres()
    try {
      const uRes = await pool.query('SELECT * FROM gym_users')
      const cRes = await pool.query('SELECT * FROM gym_classes')
      const tRes = await pool.query('SELECT * FROM gym_trainers')
      const wRes = await pool.query('SELECT * FROM gym_workout_logs')
      const crRes = await pool.query('SELECT * FROM gym_class_reservations')
      const trRes = await pool.query('SELECT * FROM gym_trainer_reservations')
      const lRes = await pool.query('SELECT * FROM gym_leads')
      const pRes = await pool.query('SELECT * FROM gym_pricing')
      const txRes = await pool.query('SELECT * FROM gym_transactions')

      return {
        users: uRes.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          passwordHash: row.password_hash,
          tier: row.tier,
          joined: row.joined,
          streak: row.streak,
          waterIntake: row.water_intake,
          role: row.role,
          avatar: row.avatar
        })),
        classes: cRes.rows.map(row => ({
          id: row.id,
          className: row.class_name,
          trainerName: row.trainer_name,
          time: row.time,
          day: row.day,
          spots: row.spots,
          maxSpots: row.max_spots
        })),
        trainers: tRes.rows.map(row => ({
          id: row.id,
          name: row.name,
          specialty: row.specialty,
          image: row.image,
          bio: row.bio,
          rating: parseFloat(row.rating),
          availability: row.availability
        })),
        workoutLogs: wRes.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          exercise: row.exercise,
          sets: row.sets,
          reps: row.reps,
          weight: row.weight,
          date: row.date
        })),
        classReservations: crRes.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          classId: row.class_id,
          bookingDate: row.booking_date
        })),
        trainerReservations: trRes.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          trainerId: row.trainer_id,
          time: row.time,
          date: row.date
        })),
        leads: lRes.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          goal: row.goal,
          date: row.date
        })),
        pricingTiers: pRes.rows.map(row => ({
          name: row.name,
          price: row.price
        })),
        transactions: txRes.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          itemName: row.item_name,
          amount: parseFloat(row.amount),
          currency: row.currency,
          date: row.date,
          status: row.status as 'paid' | 'refunded'
        }))
      }
    } catch (e) {
      console.error('Postgres read error, using local JSON fallback', e)
    }
  }
  return getLocalDb()
}

export async function saveDb(data: GymDbData): Promise<void> {
  // Save local copy regardless to maintain offline backups
  saveLocalDb(data)

  if (pool) {
    await initPostgres()
    try {
      // For simplified mock sync, we do bulk replacement on write
      // In a real application, separate tables would have direct updates
      // Here we synchronize users, classes, trainers, reservations, logs, leads, pricing, transactions
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        
        // Clear and reload class reservations
        await client.query('DELETE FROM gym_class_reservations')
        for (const cr of data.classReservations) {
          await client.query(
            'INSERT INTO gym_class_reservations (id, user_id, class_id, booking_date) VALUES ($1, $2, $3, $4)',
            [cr.id, cr.userId, cr.classId, cr.bookingDate]
          )
        }

        // Clear and reload trainer reservations
        await client.query('DELETE FROM gym_trainer_reservations')
        for (const tr of data.trainerReservations) {
          await client.query(
            'INSERT INTO gym_trainer_reservations (id, user_id, trainer_id, time, date) VALUES ($1, $2, $3, $4, $5)',
            [tr.id, tr.userId, tr.trainerId, tr.time, tr.date]
          )
        }

        // Clear and reload workout logs
        await client.query('DELETE FROM gym_workout_logs')
        for (const w of data.workoutLogs) {
          await client.query(
            'INSERT INTO gym_workout_logs (id, user_id, exercise, sets, reps, weight, date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [w.id, w.userId, w.exercise, w.sets, w.reps, w.weight, w.date]
          )
        }

        // Clear and reload leads
        await client.query('DELETE FROM gym_leads')
        for (const l of data.leads) {
          await client.query(
            'INSERT INTO gym_leads (id, name, email, goal, date) VALUES ($1, $2, $3, $4, $5)',
            [l.id, l.name, l.email, l.goal, l.date]
          )
        }

        // Clear and reload transactions
        await client.query('DELETE FROM gym_transactions')
        for (const txn of data.transactions) {
          await client.query(
            'INSERT INTO gym_transactions (id, user_id, item_name, amount, currency, date, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [txn.id, txn.userId, txn.itemName, txn.amount, txn.currency, txn.date, txn.status]
          )
        }

        // Synchronize classes (update spots)
        for (const cls of data.classes) {
          await client.query(
            'INSERT INTO gym_classes (id, class_name, trainer_name, time, day, spots, max_spots) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET spots = $6',
            [cls.id, cls.className, cls.trainerName, cls.time, cls.day, cls.spots, cls.maxSpots]
          )
        }

        // Synchronize users (signup or updates)
        for (const user of data.users) {
          await client.query(
            `INSERT INTO gym_users (id, name, email, password_hash, tier, joined, streak, water_intake, role, avatar) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             ON CONFLICT (email) DO UPDATE SET streak = $7, water_intake = $8, tier = $5`,
            [user.id, user.name, user.email, user.passwordHash, user.tier, user.joined, user.streak, user.waterIntake, user.role, user.avatar || '']
          )
        }

        // Synchronize pricing
        for (const pr of data.pricingTiers) {
          await client.query(
            'INSERT INTO gym_pricing (name, price) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET price = $2',
            [pr.name, pr.price]
          )
        }

        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    } catch (e) {
      console.error('Postgres write sync failed', e)
    }
  }
}
