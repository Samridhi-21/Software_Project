import { useState, useEffect } from 'react'
import { 
  Dumbbell, 
  Calendar, 
  Users, 
  Calculator, 
  Sliders, 
  Droplet, 
  Flame, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Trash2, 
  Shield, 
  Activity, 
  Apple, 
  DollarSign,
  Lock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Edit,
  Settings
} from 'lucide-react'

// Backend base URL detection
const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : ''

// Types
interface ClassBooking {
  id: string
  className: string
  trainerName: string
  time: string
  day: string
  spots: number
  maxSpots: number
  isBooked?: boolean
}

interface Trainer {
  id: string
  name: string
  specialty: string
  image: string
  bio: string
  rating: number
  availability: string[]
}

interface WorkoutLog {
  id: string
  exercise: string
  sets: number
  reps: number
  weight: number
  date: string
}

interface Lead {
  id: string
  name: string
  email: string
  goal: string
  date: string
}

interface Transaction {
  id: string
  userId: string
  itemName: string
  amount: number
  currency: string
  date: string
  status: 'paid' | 'refunded'
}

interface UserSession {
  id: string
  name: string
  email: string
  tier: 'Standard Club' | 'Platinum Elite' | 'VIP Coach Pro'
  joined: string
  streak: number
  waterIntake: number
  role: 'member' | 'admin' | 'trainer'
  avatar?: string
}

interface AiExerciseReport {
  id: string
  exercise: string
  inputMode: 'camera' | 'upload'
  fileName?: string
  postureResult: 'Correct' | 'Needs Correction'
  score: number
  feedback: string[]
  date: string
}

// Exercise Library Presets
interface ExercisePreset {
  name: string
  tip: string
}

interface MuscleGroup {
  category: string
  exercises: ExercisePreset[]
}

const EXERCISE_PRESETS: MuscleGroup[] = [
  {
    category: 'Chest',
    exercises: [
      { name: 'Barbell Bench Press', tip: 'Keep your shoulder blades retracted and feet flat on the floor.' },
      { name: 'Incline Dumbbell Press', tip: 'Control the dumbbells on the descent and press up in a slight arc.' },
      { name: 'Cable Chest Fly', tip: 'Squeeze the chest at the peak contraction and maintain a slight bend in your elbows.' }
    ]
  },
  {
    category: 'Back',
    exercises: [
      { name: 'Deadlift', tip: 'Keep the bar close to your shins, engage your lats, and pull with a flat back.' },
      { name: 'Pull-Ups', tip: 'Pull your elbows down towards your hips and get your chin over the bar.' },
      { name: 'Barbell Bent Over Row', tip: 'Hinge at the hips, pull the bar to your lower ribs, and squeeze your shoulder blades.' },
      { name: 'Lat Pulldown', tip: 'Pull with your elbows, not your hands, and lean back slightly at the bottom.' }
    ]
  },
  {
    category: 'Legs',
    exercises: [
      { name: 'Barbell Back Squat', tip: 'Brace your core, sit back into your hips, and keep knees tracking in line with toes.' },
      { name: 'Romanian Deadlift', tip: 'Push your hips back until you feel a hamstring stretch, keeping the back straight.' },
      { name: 'Leg Press', tip: 'Do not lock out your knees at the top and keep your lower back pressed flat into the seat.' }
    ]
  },
  {
    category: 'Shoulders',
    exercises: [
      { name: 'Overhead Barbell Press', tip: 'Brace your core and squeeze your glutes to prevent arching your lower back.' },
      { name: 'Dumbbell Lateral Raise', tip: 'Lead with your elbows and keep hands slightly lower than elbows at the top.' },
      { name: 'Face Pulls', tip: 'Pull the rope towards your nose/forehead and pull hands apart, squeezing rear delts.' }
    ]
  },
  {
    category: 'Arms',
    exercises: [
      { name: 'Barbell Bicep Curl', tip: 'Keep your elbows tucked into your sides and avoid swinging your torso.' },
      { name: 'Tricep Overhead Extension', tip: 'Keep elbows tucked in and pointing forward, extending fully at the top.' },
      { name: 'Dumbbell Hammer Curl', tip: 'Use a neutral grip (palms facing) to target the brachialis and forearm muscles.' }
    ]
  },
  {
    category: 'Core',
    exercises: [
      { name: 'Hanging Knee Raise', tip: 'Avoid swinging; use your lower abs to pull your knees to your chest.' },
      { name: 'Ab Wheel Rollout', tip: 'Keep a slight posterior pelvic tilt (hollow body) to protect your lower back.' }
    ]
  }
]

// Food Log Types and Presets
interface FoodLog {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  servings: number
  date: string
}

interface FoodPreset {
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  unit: string
}

const FOOD_PRESETS: FoodPreset[] = [
  { name: 'Chicken Breast (Cooked)', calories: 165, protein: 31, carbs: 0, fats: 3.6, unit: '100g' },
  { name: 'Brown Rice (Cooked)', calories: 112, protein: 2.3, carbs: 23.5, fats: 0.8, unit: '100g' },
  { name: 'White Rice (Cooked)', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, unit: '100g' },
  { name: 'Whole Egg', calories: 70, protein: 6, carbs: 0.6, fats: 5, unit: '1 piece' },
  { name: 'Oatmeal (Raw)', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, unit: '100g' },
  { name: 'Whey Protein Powder', calories: 120, protein: 24, carbs: 3, fats: 1.5, unit: '1 scoop (30g)' },
  { name: 'Whole Milk', calories: 150, protein: 8, carbs: 12, fats: 8, unit: '250ml' },
  { name: 'Peanut Butter', calories: 94, protein: 4, carbs: 3, fats: 8, unit: '1 tbsp (16g)' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fats: 0.3, unit: '1 medium' },
  { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fats: 14, unit: '1 oz (28g)' }
]

export default function App() {
  // Authentication State
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  // Helper for making authenticated requests to the Next.js API
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = authToken || localStorage.getItem('apex_gym_token')
    const headers = {
      ...(options.headers || {}),
    } as Record<string, string>
    if (token && token !== 'offline_token') {
      headers['Authorization'] = `Bearer ${token}`
    }
    return fetch(url, {
      ...options,
      headers
    })
  }
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('samridhi@gusain.com') // Default credential for ease
  const [authPassword, setAuthPassword] = useState('123456')     // Default credential
  const [authName, setAuthName] = useState('')
  const [authTier, setAuthTier] = useState<'Standard Club' | 'Platinum Elite' | 'VIP Coach Pro'>('Platinum Elite')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'trainers' | 'workouts' | 'ai-form' | 'nutrition' | 'admin' | 'billing'>('dashboard')
  
  // App States
  const [dbMode, setDbMode] = useState<'online' | 'offline'>('offline')
  const [usersList, setUsersList] = useState<UserSession[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [themeColor, setThemeColor] = useState<'emerald' | 'violet' | 'amber'>('emerald')
  const [waterIntake, setWaterIntake] = useState<number>(0)
  const [streak, setStreak] = useState<number>(5)
  
  // Dynamic collections
  const [classesList, setClassesList] = useState<ClassBooking[]>([])
  const [trainersList, setTrainersList] = useState<Trainer[]>([])
  const [bookedTrainers, setBookedTrainers] = useState<{trainerId: string, time: string, date: string}[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [pricingTiers, setPricingTiers] = useState([
    { name: 'Standard Club', price: 49 },
    { name: 'Platinum Elite', price: 99 },
    { name: 'VIP Coach Pro', price: 199 }
  ])

  // Admin user manager states
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('123456')
  const [newUserRole, setNewUserRole] = useState<'member' | 'admin' | 'trainer'>('member')
  const [newUserTier, setNewUserTier] = useState<'Standard Club' | 'Platinum Elite' | 'VIP Coach Pro'>('Standard Club')

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserName, setEditUserName] = useState('')
  const [editUserEmail, setEditUserEmail] = useState('')
  const [editUserRole, setEditUserRole] = useState<'member' | 'admin' | 'trainer'>('member')
  const [editUserTier, setEditUserTier] = useState<'Standard Club' | 'Platinum Elite' | 'VIP Coach Pro'>('Standard Club')

  // Workout Builder Inputs
  const [exerciseInput, setExerciseInput] = useState('')
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>('')
  const [selectedPresetName, setSelectedPresetName] = useState<string>('')
  const [setsInput, setSetsInput] = useState<number>(3)
  const [repsInput, setRepsInput] = useState<number>(10)
  const [weightInput, setWeightInput] = useState<number>(60)

  // BMI/Calorie Calculator State
  const [weight, setWeight] = useState<number>(75)
  const [height, setHeight] = useState<number>(180)
  const [age, setAge] = useState<number>(24)
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [activity, setActivity] = useState<string>('moderate')
  const [fitnessGoal, setFitnessGoal] = useState<string>('muscle')
  const [bmiResult, setBmiResult] = useState<{ bmi: number, category: string, color: string } | null>(null)
  const [nutritionTarget, setNutritionTarget] = useState<{ calories: number, protein: number, carbs: number, fats: number } | null>(null)

  // Food Logger State
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [selectedFoodPreset, setSelectedFoodPreset] = useState<string>('')
  const [foodServingsInput, setFoodServingsInput] = useState<number>(1)
  const [isCustomFood, setIsCustomFood] = useState<boolean>(false)
  const [customFoodName, setCustomFoodName] = useState<string>('')
  const [customFoodCalories, setCustomFoodCalories] = useState<number>(100)
  const [customFoodProtein, setCustomFoodProtein] = useState<number>(10)
  const [customFoodCarbs, setCustomFoodCarbs] = useState<number>(10)
  const [customFoodFats, setCustomFoodFats] = useState<number>(5)

  // Trainer Booking Scheduler State
  const tomorrowStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()
  const [bookingTrainerId, setBookingTrainerId] = useState<string | null>(null)
  const [bookingDate, setBookingDate] = useState<string>(tomorrowStr)
  const [bookingTime, setBookingTime] = useState<string>('10:00 AM')
  const [bookingFocus, setBookingFocus] = useState<string>('Strength & Conditioning')

  // Goal Milestones State
  const [targetWeight, setTargetWeight] = useState<number>(70)
  const [streakGoal, setStreakGoal] = useState<number>(10)
  const [isEditingGoals, setIsEditingGoals] = useState<boolean>(false)

  // AI Exercise Form Correction demo state
  const [aiExercise, setAiExercise] = useState<string>('Barbell Back Squat')
  const [aiInputMode, setAiInputMode] = useState<'camera' | 'upload'>('camera')
  const [aiVideoFile, setAiVideoFile] = useState<string>('')
  const [aiStatus, setAiStatus] = useState<string>('Ready for posture analysis')
  const [aiProcessing, setAiProcessing] = useState<boolean>(false)
  const [aiReports, setAiReports] = useState<AiExerciseReport[]>([])

  // CRM Inquiry State
  const [newInquiryName, setNewInquiryName] = useState('')
  const [newInquiryEmail, setNewInquiryEmail] = useState('')
  const [newInquiryGoal, setNewInquiryGoal] = useState('Build Muscle')

  // Admin Panel Form States
  const [newClassName, setNewClassName] = useState('')
  const [newClassTrainer, setNewClassTrainer] = useState('')
  const [newClassTime, setNewClassTime] = useState('08:00 AM - 09:00 AM')
  const [newClassDay, setNewClassDay] = useState('Mon, Wed')
  const [newClassSpots, setNewClassSpots] = useState<number>(15)

  const [newTrainerName, setNewTrainerName] = useState('')
  const [newTrainerSpecialty, setNewTrainerSpecialty] = useState('')
  const [newTrainerBio, setNewTrainerBio] = useState('')
  const [newTrainerImage, setNewTrainerImage] = useState('')
  const [newTrainerSlots, setNewTrainerSlots] = useState('Mon 10:00 AM, Wed 10:00 AM')

  // Stripe Simulation Modal State
  const [stripeModal, setStripeModal] = useState<{
    isOpen: boolean
    itemName: string
    price: number
    type: 'class' | 'trainer'
    targetId: string
    timeSlot?: string
    status: 'idle' | 'processing' | 'success' | 'failed'
  } | null>(null)

  // Profile Settings Edit Modal State
  const [profileEditModal, setProfileEditModal] = useState<{
    isOpen: boolean
    name: string
    email: string
    avatar: string
  } | null>(null)

  const [paymentCurrency, setPaymentCurrency] = useState<'usd' | 'inr'>('usd')

  // System Notifications
  const [notification, setNotification] = useState<string | null>(null)

  // Fallback Static Data
  const fallbackClasses: ClassBooking[] = [
    { id: 'c1', className: 'Apex Spin Revolution', trainerName: 'Marcus Vance', time: '08:00 AM - 09:00 AM', day: 'Mon, Wed', spots: 8, maxSpots: 15 },
    { id: 'c2', className: 'Vinyasa Power Flow', trainerName: 'Serena Croft', time: '10:00 AM - 11:15 AM', day: 'Tue, Thu', spots: 14, maxSpots: 20 },
    { id: 'c3', className: 'Metabolic HIIT Conditioning', trainerName: 'Alex Rivera', time: '05:30 PM - 06:30 PM', day: 'Mon, Fri', spots: 6, maxSpots: 12 },
    { id: 'c4', className: 'Olympic Powerlifting Lab', trainerName: 'Marcus Vance', time: '06:00 PM - 07:30 PM', day: 'Wed, Sat', spots: 2, maxSpots: 6 },
    { id: 'c5', className: 'Functional Pilates Core', trainerName: 'Elena Rostova', time: '09:00 AM - 10:00 AM', day: 'Thu, Sat', spots: 11, maxSpots: 15 }
  ]

  const fallbackTrainers: Trainer[] = [
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
      bio: 'B.S. in Kinesiology. Integrates deep flexibility training with breathing mechanics to bulletproof joints and recoverability.',
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
  ]

  const fallbackUsers: UserSession[] = [
    {
      id: 'u1',
      name: 'Samridhi Gusain',
      email: 'samridhi@gusain.com',
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
      tier: 'VIP Coach Pro',
      joined: 'Dec 2025',
      streak: 12,
      waterIntake: 0,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80'
    }
  ]

  const fallbackTransactions: Transaction[] = [
    { id: 'txn_1', userId: 'u1', itemName: 'Apex Spin Revolution', amount: 15, currency: 'usd', date: '2026-06-12', status: 'paid' },
    { id: 'txn_2', userId: 'u1', itemName: '1-on-1 Session: Marcus Vance', amount: 45, currency: 'usd', date: '2026-06-14', status: 'paid' }
  ]

  // Detect server status and restore local session
  useEffect(() => {
    const savedToken = localStorage.getItem('apex_gym_token')
    const savedUser = localStorage.getItem('apex_gym_user')
    const savedTheme = localStorage.getItem('apex_gym_theme_color') as any

    if (savedTheme) setThemeColor(savedTheme)

    if (savedToken && savedUser) {
      setAuthToken(savedToken)
      setSessionUser(JSON.parse(savedUser))
    }
    
    const savedFoods = localStorage.getItem('apex_gym_food_logs')
    if (savedFoods) setFoodLogs(JSON.parse(savedFoods))
    
    const savedTargetWeight = localStorage.getItem('apex_gym_target_weight')
    if (savedTargetWeight) setTargetWeight(parseFloat(savedTargetWeight))
    
    const savedStreakGoal = localStorage.getItem('apex_gym_streak_goal')
    if (savedStreakGoal) setStreakGoal(parseInt(savedStreakGoal))

    const savedAiReports = localStorage.getItem('apex_gym_ai_reports')
    if (savedAiReports) setAiReports(JSON.parse(savedAiReports))
    
    checkServerConnection()
    calculateBMIAndCalories()
  }, [])

  // Sync state whenever session user changes
  useEffect(() => {
    if (sessionUser) {
      setWaterIntake(sessionUser.waterIntake)
      setStreak(sessionUser.streak)
      loadWorkspaceData(sessionUser.id)

      // Role-based navigation redirects
      const allowedIds = sessionUser.role === 'admin' 
        ? ['admin', 'classes', 'trainers', 'billing'] 
        : ['dashboard', 'classes', 'trainers', 'workouts', 'ai-form', 'nutrition', 'billing']
      
      if (!allowedIds.includes(activeTab)) {
        setActiveTab(allowedIds[0] as any)
      }
    }
  }, [sessionUser, activeTab])

  // Recalculate BMI / Nutrition targets
  useEffect(() => {
    calculateBMIAndCalories()
  }, [weight, height, age, activity, fitnessGoal, gender])

  // Check connection status to Next.js API
  const checkServerConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/gym/pricing`)
      if (response.ok) {
        setDbMode('online')
      } else {
        setDbMode('offline')
      }
    } catch {
      setDbMode('offline')
    }
  }

  // Load database collections
  const loadWorkspaceData = async (userId: string) => {
    try {
      // 1. Fetch Classes
      const resClasses = await authFetch(`${API_BASE}/api/gym/classes?userId=${userId}`)
      if (resClasses.ok) {
        const data = await resClasses.json()
        setClassesList(data.classes)
      }

      // 2. Fetch Trainers & Appointments
      const resTrainers = await authFetch(`${API_BASE}/api/gym/trainers?userId=${userId}`)
      if (resTrainers.ok) {
        const data = await resTrainers.json()
        setTrainersList(data.trainers)
        const mapped = data.reservations.map((r: any) => ({
          trainerId: r.trainerId,
          time: r.time,
          date: r.date
        }))
        setBookedTrainers(mapped)
      }

      // 3. Fetch Workouts
      const resWorkouts = await authFetch(`${API_BASE}/api/gym/workouts?userId=${userId}`)
      if (resWorkouts.ok) {
        const data = await resWorkouts.json()
        setWorkoutLogs(data.logs)
      }

      // 4. Fetch CRM Leads
      const resLeads = await authFetch(`${API_BASE}/api/gym/leads`)
      if (resLeads.ok) {
        const data = await resLeads.json()
        setLeads(data.leads)
      }

      // 5. Fetch Pricing
      const resPricing = await authFetch(`${API_BASE}/api/gym/pricing`)
      if (resPricing.ok) {
        const data = await resPricing.json()
        setPricingTiers(data.pricingTiers)
      }

      // 6. Fetch Transactions
      const txUrl = (userId === 'admin' || (sessionUser && sessionUser.role === 'admin'))
        ? `${API_BASE}/api/gym/billing`
        : `${API_BASE}/api/gym/billing?userId=${userId}`
      const resTransactions = await authFetch(txUrl)
      if (resTransactions.ok) {
        const data = await resTransactions.json()
        setTransactions(data.transactions)
      }

      // 7. Fetch Users List
      const resUsers = await authFetch(`${API_BASE}/api/gym/profile`)
      if (resUsers.ok) {
        const data = await resUsers.json()
        setUsersList(data.users)
      }

      setDbMode('online')
    } catch (e) {
      console.warn('API sync failed, falling back to LocalStorage offline mode.', e)
      setDbMode('offline')
      loadOfflineFallbackData()
    }
  }

  // Load offline data from localStorage
  const loadOfflineFallbackData = () => {
    // Classes
    const savedClasses = localStorage.getItem('apex_gym_booked_classes')
    const booked = savedClasses ? JSON.parse(savedClasses) : []
    const mapped = fallbackClasses.map(c => ({
      ...c,
      isBooked: booked.includes(c.id),
      spots: booked.includes(c.id) ? c.spots - 1 : c.spots
    }))
    setClassesList(mapped)

    // Trainers
    const savedTrainersList = localStorage.getItem('apex_gym_trainers_list')
    if (savedTrainersList) {
      setTrainersList(JSON.parse(savedTrainersList))
    } else {
      setTrainersList(fallbackTrainers)
      localStorage.setItem('apex_gym_trainers_list', JSON.stringify(fallbackTrainers))
    }

    // Trainer bookings
    const savedTrainers = localStorage.getItem('apex_gym_booked_trainers')
    if (savedTrainers) setBookedTrainers(JSON.parse(savedTrainers))

    // Workouts
    const savedWorkouts = localStorage.getItem('apex_gym_workouts')
    if (savedWorkouts) {
      setWorkoutLogs(JSON.parse(savedWorkouts))
    } else {
      const defaultLogs = [
        { id: 'w1', exercise: 'Barbell Back Squat', sets: 4, reps: 8, weight: 100, date: '2026-06-12' },
        { id: 'w2', exercise: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 32, date: '2026-06-12' }
      ]
      setWorkoutLogs(defaultLogs)
      localStorage.setItem('apex_gym_workouts', JSON.stringify(defaultLogs))
    }

    // Leads
    const savedLeads = localStorage.getItem('apex_gym_leads')
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads))
    } else {
      const defaultLeads = [
        { id: 'l1', name: 'Kabir Dev', email: 'kabir@dev.co', goal: 'Gain Strength', date: '2026-06-14' }
      ]
      setLeads(defaultLeads)
      localStorage.setItem('apex_gym_leads', JSON.stringify(defaultLeads))
    }

    // Transactions fallback
    const savedTx = localStorage.getItem('apex_gym_transactions')
    if (savedTx) {
      setTransactions(JSON.parse(savedTx))
    } else {
      setTransactions(fallbackTransactions)
      localStorage.setItem('apex_gym_transactions', JSON.stringify(fallbackTransactions))
    }

    // Users List fallback
    const savedUsers = localStorage.getItem('apex_gym_users_list')
    if (savedUsers) {
      setUsersList(JSON.parse(savedUsers))
    } else {
      setUsersList(fallbackUsers)
      localStorage.setItem('apex_gym_users_list', JSON.stringify(fallbackUsers))
    }
  }

  // Trigger Notification banners
  const triggerNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Handle successful redirect back from Stripe checkout session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('booking_success') === 'true') {
      triggerNotification('Stripe payment processed. Booking secured!')
      // Clean up URL query parameters so page refreshes don't re-trigger notification
      const cleanUrl = window.location.pathname + (window.location.hash || '')
      window.history.replaceState({}, document.title, cleanUrl)
    } else if (params.get('booking_error')) {
      const errCode = params.get('booking_error')
      triggerNotification(`Stripe booking failed: ${errCode?.replace(/_/g, ' ')}`)
      const cleanUrl = window.location.pathname + (window.location.hash || '')
      window.history.replaceState({}, document.title, cleanUrl)
    }
  }, [])

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthLoading(true)

    try {
      if (authMode === 'login') {
        const response = await fetch(`${API_BASE}/api/gym/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || 'Login failed')
        }

        const data = await response.json()
        setAuthToken(data.token)
        setSessionUser(data.user)
        localStorage.setItem('apex_gym_token', data.token)
        localStorage.setItem('apex_gym_user', JSON.stringify(data.user))
        triggerNotification(`Welcome back, ${data.user.name}!`)
      } else {
        // Sign up
        if (!authName.trim()) throw new Error('Please fill in your name')
        const response = await fetch(`${API_BASE}/api/gym/auth`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: authName, email: authEmail, password: authPassword, tier: authTier })
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || 'Signup failed')
        }

        const data = await response.json()
        setAuthToken(data.token)
        setSessionUser(data.user)
        localStorage.setItem('apex_gym_token', data.token)
        localStorage.setItem('apex_gym_user', JSON.stringify(data.user))
        triggerNotification(`Account created! Welcome, ${data.user.name}!`)
      }
    } catch (err: any) {
      setAuthError(err.message || 'Server connection failed. Connecting locally...')
      setTimeout(() => {
        const mockOfflineUser: UserSession = {
          id: authEmail.includes('admin') ? 'admin' : 'offline_user',
          name: authName || (authEmail.includes('admin') ? 'Operator Owner' : 'Guest Athlete'),
          email: authEmail,
          tier: authTier,
          joined: 'Jun 2026',
          streak: 5,
          waterIntake: 500,
          role: authEmail.toLowerCase().includes('admin') ? 'admin' : 'member',
          avatar: authEmail.includes('admin') 
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' 
            : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80'
        }
        setAuthToken('offline_token')
        setSessionUser(mockOfflineUser)
        localStorage.setItem('apex_gym_token', 'offline_token')
        localStorage.setItem('apex_gym_user', JSON.stringify(mockOfflineUser))
        setAuthLoading(false)
        triggerNotification(`Logged in (Offline ${mockOfflineUser.role.toUpperCase()} mode)`)
      }, 1200)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('apex_gym_token')
    localStorage.removeItem('apex_gym_user')
    setAuthToken(null)
    setSessionUser(null)
    triggerNotification('Logged out successfully.')
  }

  // Hydration Operations
  const handleWaterChange = async (amt: number) => {
    if (!sessionUser) return
    const newVol = Math.max(0, waterIntake + amt)
    setWaterIntake(newVol)

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: sessionUser.id, waterIntake: newVol })
        })
        if (res.ok) {
          const data = await res.json()
          setSessionUser(data.user)
          localStorage.setItem('apex_gym_user', JSON.stringify(data.user))
        }
      } catch {
        setDbMode('offline')
      }
    } else {
      localStorage.setItem('apex_gym_water', newVol.toString())
    }

    if (amt > 0) {
      triggerNotification(`Hydration logged: +${amt}ml.`)
    }
  }

  // Stripe Checkout Mocks
  const triggerStripePayment = (itemName: string, subtotal: number, type: 'class' | 'trainer', targetId: string, timeSlot?: string) => {
    setStripeModal({
      isOpen: true,
      itemName,
      price: subtotal,
      type,
      targetId,
      timeSlot,
      status: 'idle'
    })
  }

  const handleProcessPayment = async () => {
    if (!stripeModal || !sessionUser) return
    
    setStripeModal(prev => prev ? { ...prev, status: 'processing' } : null)

    // Real Stripe Integration if Database is Online
    if (dbMode === 'online') {
      try {
        const finalPrice = paymentCurrency === 'inr' ? Math.round(stripeModal.price * 84) : stripeModal.price
        const res = await authFetch(`${API_BASE}/api/gym/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: sessionUser.id,
            type: stripeModal.type,
            targetId: stripeModal.targetId,
            price: finalPrice,
            name: stripeModal.itemName,
            timeSlot: stripeModal.timeSlot,
            origin: window.location.origin,
            currency: paymentCurrency
          })
        })
        const data = await res.json()
        if (res.ok && data.url) {
          // Redirect to Stripe checkout page
          window.location.href = data.url
          return
        } else {
          console.warn('Stripe checkout API error, falling back to simulation:', data.error)
          triggerNotification('Stripe sandbox active. Defaulting to local payment simulation.')
        }
      } catch (err) {
        console.error('Stripe connection error, falling back to simulation:', err)
        triggerNotification('Stripe server offline. Defaulting to local payment simulation.')
      }
    }

    // SIMULATION MOCK FALLBACK (Runs if offline OR if Stripe API is unconfigured/fails)
    await new Promise(r => setTimeout(r, 2200))

    try {
      if (stripeModal.type === 'class') {
        if (dbMode === 'online') {
          const res = await authFetch(`${API_BASE}/api/gym/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: sessionUser.id, classId: stripeModal.targetId })
          })
          if (res.ok) {
            loadWorkspaceData(sessionUser.id)
          }
        } else {
          const savedClasses = localStorage.getItem('apex_gym_booked_classes')
          let booked = savedClasses ? JSON.parse(savedClasses) : []
          if (!booked.includes(stripeModal.targetId)) {
            booked.push(stripeModal.targetId)
          }
          localStorage.setItem('apex_gym_booked_classes', JSON.stringify(booked))
          loadOfflineFallbackData()
        }
      } else {
        if (dbMode === 'online') {
          const res = await authFetch(`${API_BASE}/api/gym/trainers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: sessionUser.id, 
              trainerId: stripeModal.targetId, 
              timeSlot: stripeModal.timeSlot 
            })
          })
          if (res.ok) {
            loadWorkspaceData(sessionUser.id)
          }
        } else {
          const key = `apex_gym_booked_trainers`
          const savedTrainers = localStorage.getItem(key)
          let booked = savedTrainers ? JSON.parse(savedTrainers) : []
          const exists = booked.some((b: any) => b.trainerId === stripeModal.targetId && b.time === stripeModal.timeSlot)
          if (!exists) {
            const dateMatch = stripeModal.timeSlot?.match(/on (\d{4}-\d{2}-\d{2})/)
            const parsedDate = dateMatch ? dateMatch[1] : '2026-06-18'
            booked.push({ trainerId: stripeModal.targetId, time: stripeModal.timeSlot, date: parsedDate })
          }
          localStorage.setItem(key, JSON.stringify(booked))
          loadOfflineFallbackData()
        }
      }

      // Save simulated transaction
      const finalPrice = paymentCurrency === 'inr' ? Math.round(stripeModal.price * 84) : stripeModal.price
      saveSimulatedTransaction(stripeModal.itemName, finalPrice, paymentCurrency)

      setStripeModal(prev => prev ? { ...prev, status: 'success' } : null)
      triggerNotification(`Stripe payment processed. Booking secured!`)
      
      setTimeout(() => {
        setStripeModal(null)
      }, 1500)

    } catch {
      setStripeModal(prev => prev ? { ...prev, status: 'failed' } : null)
      triggerNotification('Transaction failed.')
    }
  }

  const handleCancelBooking = async (type: 'class' | 'trainer', targetId: string, timeSlot?: string) => {
    if (!sessionUser) return
    
    if (dbMode === 'online') {
      if (type === 'class') {
        await authFetch(`${API_BASE}/api/gym/classes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: sessionUser.id, classId: targetId })
        })
      } else {
        await authFetch(`${API_BASE}/api/gym/trainers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: sessionUser.id, trainerId: targetId, timeSlot })
        })
      }
      loadWorkspaceData(sessionUser.id)
    } else {
      if (type === 'class') {
        const savedClasses = localStorage.getItem('apex_gym_booked_classes')
        let booked = savedClasses ? JSON.parse(savedClasses) : []
        booked = booked.filter((id: string) => id !== targetId)
        localStorage.setItem('apex_gym_booked_classes', JSON.stringify(booked))
      } else {
        const savedTrainers = localStorage.getItem('apex_gym_booked_trainers')
        let booked = savedTrainers ? JSON.parse(savedTrainers) : []
        booked = booked.filter((b: any) => !(b.trainerId === targetId && b.time === timeSlot))
        localStorage.setItem('apex_gym_booked_trainers', JSON.stringify(booked))
      }
      loadOfflineFallbackData()
    }
    triggerNotification('Booking cancelled.')
  }

  const saveSimulatedTransaction = (itemName: string, amount: number, currency: string) => {
    if (!sessionUser) return
    const savedTx = localStorage.getItem('apex_gym_transactions')
    const txs: Transaction[] = savedTx ? JSON.parse(savedTx) : []
    const newTx: Transaction = {
      id: `sim_txn_${Date.now()}`,
      userId: sessionUser.id,
      itemName,
      amount,
      currency,
      date: new Date().toISOString().split('T')[0],
      status: 'paid'
    }
    txs.push(newTx)
    localStorage.setItem('apex_gym_transactions', JSON.stringify(txs))
    setTransactions(prev => {
      // Avoid duplicate transactions if state is already updated
      if (prev.some(t => t.id === newTx.id)) return prev
      return [...prev, newTx]
    })
  }

  const handleRefundTransaction = async (transactionId: string) => {
    if (!sessionUser) return

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/billing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId })
        })
        const data = await res.json()
        if (res.ok) {
          setTransactions(data.transactions)
          triggerNotification('Transaction refunded. Booking reverted!')
          loadWorkspaceData(sessionUser.id)
        } else {
          triggerNotification(`Refund failed: ${data.error}`)
        }
      } catch (err) {
        console.error('Refund request failed:', err)
        triggerNotification('Failed to process refund on server.')
      }
    } else {
      // Offline simulation refund
      const savedTx = localStorage.getItem('apex_gym_transactions')
      let txs: Transaction[] = savedTx ? JSON.parse(savedTx) : []
      const txIdx = txs.findIndex(t => t.id === transactionId)
      if (txIdx > -1) {
        const tx = txs[txIdx]
        if (tx.status === 'refunded') {
          triggerNotification('Transaction already refunded.')
          return
        }
        tx.status = 'refunded'
        localStorage.setItem('apex_gym_transactions', JSON.stringify(txs))
        setTransactions(txs)

        // Revert bookings locally
        const isTrainer = tx.itemName.toLowerCase().includes('1-on-1') || tx.itemName.toLowerCase().includes('session')
        if (isTrainer) {
          const trainerName = tx.itemName.split(':').pop()?.trim() || ''
          const trainer = trainersList.find(t => t.name.toLowerCase().includes(trainerName.toLowerCase()))
          if (trainer) {
            const savedTrainers = localStorage.getItem('apex_gym_booked_trainers')
            let booked = savedTrainers ? JSON.parse(savedTrainers) : []
            booked = booked.filter((b: any) => !(b.trainerId === trainer.id))
            localStorage.setItem('apex_gym_booked_trainers', JSON.stringify(booked))
          }
        } else {
          const classItem = classesList.find(c => c.className.toLowerCase().trim() === tx.itemName.toLowerCase().trim())
          if (classItem) {
            const savedClasses = localStorage.getItem('apex_gym_booked_classes')
            let booked = savedClasses ? JSON.parse(savedClasses) : []
            booked = booked.filter((id: string) => id !== classItem.id)
            localStorage.setItem('apex_gym_booked_classes', JSON.stringify(booked))
          }
        }
        loadOfflineFallbackData()
        triggerNotification('Transaction refunded. Booking reverted locally!')
      } else {
        triggerNotification('Transaction not found locally.')
      }
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileEditModal || !sessionUser) return

    if (!profileEditModal.name.trim()) {
      triggerNotification('Name cannot be empty.')
      return
    }
    if (!profileEditModal.email.trim()) {
      triggerNotification('Email cannot be empty.')
      return
    }

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: sessionUser.id,
            name: profileEditModal.name.trim(),
            email: profileEditModal.email.trim(),
            avatar: profileEditModal.avatar.trim()
          })
        })
        const data = await res.json()
        if (res.ok) {
          setSessionUser(data.user)
          localStorage.setItem('apex_gym_user', JSON.stringify(data.user))
          triggerNotification('Profile updated successfully!')
          setProfileEditModal(null)
          loadWorkspaceData(sessionUser.id)
        } else {
          triggerNotification(`Update failed: ${data.error}`)
        }
      } catch (err) {
        console.error('Profile update failed:', err)
        triggerNotification('Connection error, failed to save on server.')
      }
    } else {
      // Offline mode profile save
      const updatedUser: UserSession = {
        ...sessionUser,
        name: profileEditModal.name.trim(),
        email: profileEditModal.email.trim(),
        avatar: profileEditModal.avatar.trim()
      }
      setSessionUser(updatedUser)
      localStorage.setItem('apex_gym_user', JSON.stringify(updatedUser))

      // Update in usersList offline fallback too!
      const savedUsers = localStorage.getItem('apex_gym_users_list')
      if (savedUsers) {
        let list: UserSession[] = JSON.parse(savedUsers)
        const idx = list.findIndex(u => u.id === sessionUser.id)
        if (idx > -1) {
          list[idx] = {
            ...list[idx],
            name: profileEditModal.name.trim(),
            email: profileEditModal.email.trim(),
            avatar: profileEditModal.avatar.trim()
          }
          localStorage.setItem('apex_gym_users_list', JSON.stringify(list))
          setUsersList(list)
        }
      }

      triggerNotification('Profile updated locally (offline mode)!')
      setProfileEditModal(null)
    }
  }

  // Food Log Operations
  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionUser) return

    let name = ''
    let calories = 0
    let protein = 0
    let carbs = 0
    let fats = 0

    if (isCustomFood) {
      if (!customFoodName.trim()) return
      name = customFoodName.trim()
      calories = customFoodCalories
      protein = customFoodProtein
      carbs = customFoodCarbs
      fats = customFoodFats
    } else {
      const preset = FOOD_PRESETS.find(f => f.name === selectedFoodPreset)
      if (!preset) return
      name = preset.name
      calories = Math.round(preset.calories * foodServingsInput)
      protein = Math.round(preset.protein * foodServingsInput)
      carbs = Math.round(preset.carbs * foodServingsInput)
      fats = Math.round(preset.fats * foodServingsInput)
    }

    const newLog: FoodLog = {
      id: 'f_' + Date.now(),
      name,
      calories,
      protein,
      carbs,
      fats,
      servings: isCustomFood ? 1 : foodServingsInput,
      date: new Date().toISOString().split('T')[0]
    }

    const updated = [newLog, ...foodLogs]
    setFoodLogs(updated)
    localStorage.setItem('apex_gym_food_logs', JSON.stringify(updated))

    // Reset inputs
    setCustomFoodName('')
    setSelectedFoodPreset('')
    setFoodServingsInput(1)
    triggerNotification(`Logged Food: ${newLog.name}`)
  }

  const handleDeleteFood = (id: string) => {
    const updated = foodLogs.filter(f => f.id !== id)
    setFoodLogs(updated)
    localStorage.setItem('apex_gym_food_logs', JSON.stringify(updated))
    triggerNotification('Food log entry deleted.')
  }

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('apex_gym_target_weight', targetWeight.toString())
    localStorage.setItem('apex_gym_streak_goal', streakGoal.toString())
    setIsEditingGoals(false)
    triggerNotification('Athletic targets updated successfully!')
  }

  const handleRunAiAnalysis = () => {
    if (!sessionUser || aiProcessing) return
    if (aiInputMode === 'upload' && !aiVideoFile) {
      triggerNotification('Please upload a workout video before analysis.')
      return
    }

    setAiProcessing(true)
    setAiStatus('Capturing exercise input...')

    const pipeline = [
      'Processing video frames with OpenCV...',
      'Detecting pose landmarks with MediaPipe...',
      'Calculating shoulder, hip and knee joint angles...',
      'Comparing posture with exercise safety rules...',
      'Generating corrective feedback and score...'
    ]

    pipeline.forEach((message, index) => {
      window.setTimeout(() => setAiStatus(message), (index + 1) * 650)
    })

    window.setTimeout(() => {
      const score = aiExercise.toLowerCase().includes('squat') ? 86 : aiExercise.toLowerCase().includes('deadlift') ? 78 : 82
      const postureResult = score >= 80 ? 'Correct' : 'Needs Correction'
      const feedback = aiExercise.toLowerCase().includes('squat')
        ? ['Keep knees aligned with toes during descent.', 'Maintain a neutral spine and controlled depth.', 'Brace core before each repetition.']
        : aiExercise.toLowerCase().includes('deadlift')
          ? ['Keep the bar close to the shins.', 'Avoid rounding the lower back.', 'Drive through hips after the bar passes the knees.']
          : ['Maintain shoulder stability.', 'Use controlled tempo during each repetition.', 'Keep movement range consistent.']

      const report: AiExerciseReport = {
        id: 'ai_' + Date.now(),
        exercise: aiExercise,
        inputMode: aiInputMode,
        fileName: aiVideoFile || undefined,
        postureResult,
        score,
        feedback,
        date: new Date().toISOString().split('T')[0]
      }

      const updated = [report, ...aiReports]
      setAiReports(updated)
      localStorage.setItem('apex_gym_ai_reports', JSON.stringify(updated))
      setAiStatus('Analysis complete. Report saved to member dashboard.')
      setAiProcessing(false)
      triggerNotification(`AI form report generated: ${report.score}/100`)
    }, 4300)
  }

  // Workout Log Operations
  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exerciseInput.trim() || !sessionUser) return

    const newLog = {
      userId: sessionUser.id,
      exercise: exerciseInput.trim(),
      sets: setsInput,
      reps: repsInput,
      weight: weightInput
    }

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/workouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        })
        if (res.ok) {
          const data = await res.json()
          setStreak(data.streak)
          loadWorkspaceData(sessionUser.id)
        }
      } catch {
        setDbMode('offline')
      }
    } else {
      const localLog: WorkoutLog = {
        id: 'w_' + Date.now(),
        exercise: newLog.exercise,
        sets: newLog.sets,
        reps: newLog.reps,
        weight: newLog.weight,
        date: new Date().toISOString().split('T')[0]
      }
      const updated = [localLog, ...workoutLogs]
      setWorkoutLogs(updated)
      localStorage.setItem('apex_gym_workouts', JSON.stringify(updated))
      setStreak(s => s + 1)
    }

    setExerciseInput('')
    setSelectedPresetCategory('')
    setSelectedPresetName('')
    triggerNotification(`Logged: ${newLog.exercise}`)
  }

  const handleDeleteWorkout = async (id: string) => {
    if (!sessionUser) return

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/workouts?id=${id}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          loadWorkspaceData(sessionUser.id)
        }
      } catch {
        setDbMode('offline')
      }
    } else {
      const updated = workoutLogs.filter(w => w.id !== id)
      setWorkoutLogs(updated)
      localStorage.setItem('apex_gym_workouts', JSON.stringify(updated))
    }
    triggerNotification('Log entry deleted.')
  }

  // Admin Operations (Add Class & Add Trainer)
  const handleAddClassAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim() || !newClassTrainer.trim() || !sessionUser) return

    const newClass = {
      className: newClassName.trim(),
      trainerName: newClassTrainer.trim(),
      time: newClassTime,
      day: newClassDay,
      maxSpots: newClassSpots
    }

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/classes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newClass)
        })
        if (res.ok) {
          loadWorkspaceData(sessionUser.id)
        }
      } catch {
        setDbMode('offline')
      }
    } else {
      const localClass: ClassBooking = {
        id: 'c_' + Date.now(),
        className: newClass.className,
        trainerName: newClass.trainerName,
        time: newClass.time,
        day: newClass.day,
        spots: newClass.maxSpots,
        maxSpots: newClass.maxSpots
      }
      const updated = [...classesList, localClass]
      setClassesList(updated)
      localStorage.setItem('apex_gym_booked_classes', JSON.stringify(updated.filter(c => c.isBooked).map(c => c.id)))
    }

    setNewClassName('')
    setNewClassTrainer('')
    triggerNotification(`Added Class: ${newClass.className}`)
  }

  const handleAddTrainerAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTrainerName.trim() || !newTrainerSpecialty.trim() || !sessionUser) return

    const newTrainer = {
      name: newTrainerName.trim(),
      specialty: newTrainerSpecialty.trim(),
      bio: newTrainerBio.trim() || 'Certified master coach.',
      image: newTrainerImage.trim() || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
      availability: newTrainerSlots.split(',').map(s => s.trim()).filter(Boolean),
      rating: 5.0
    }

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/trainers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTrainer)
        })
        if (res.ok) {
          loadWorkspaceData(sessionUser.id)
        }
      } catch {
        setDbMode('offline')
      }
    } else {
      const localTrainer: Trainer = {
        id: 't_' + Date.now(),
        name: newTrainer.name,
        specialty: newTrainer.specialty,
        bio: newTrainer.bio,
        image: newTrainer.image,
        availability: newTrainer.availability,
        rating: newTrainer.rating
      }
      const updated = [...trainersList, localTrainer]
      setTrainersList(updated)
      localStorage.setItem('apex_gym_trainers_list', JSON.stringify(updated))
    }

    setNewTrainerName('')
    setNewTrainerSpecialty('')
    setNewTrainerBio('')
    setNewTrainerImage('')
    setNewTrainerSlots('Mon 10:00 AM, Wed 10:00 AM')
    triggerNotification(`Added Coach: ${newTrainer.name}`)
  }

  // Calorie & BMI Calculations
  const calculateBMIAndCalories = () => {
    const heightInMeters = height / 100
    const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1))
    
    let category = 'Normal'
    let color = 'text-emerald-400'
    if (bmi < 18.5) {
      category = 'Underweight'
      color = 'text-sky-400'
    } else if (bmi >= 25 && bmi < 29.9) {
      category = 'Overweight'
      color = 'text-amber-400'
    } else if (bmi >= 30) {
      category = 'Obese'
      color = 'text-rose-500'
    }

    setBmiResult({ bmi, category, color })

    let bmr = 10 * weight + 6.25 * height - 5 * age
    if (gender === 'male') {
      bmr += 5
    } else {
      bmr -= 161
    }

    let multiplier = 1.2
    if (activity === 'light') multiplier = 1.375
    if (activity === 'moderate') multiplier = 1.55
    if (activity === 'active') multiplier = 1.725
    if (activity === 'extreme') multiplier = 1.9

    let calories = Math.round(bmr * multiplier)

    if (fitnessGoal === 'lose') {
      calories -= 500
    } else if (fitnessGoal === 'muscle') {
      calories += 300
    }

    let pRatio = 0.25, cRatio = 0.50, fRatio = 0.25
    if (fitnessGoal === 'muscle') {
      pRatio = 0.30; cRatio = 0.45; fRatio = 0.25
    } else if (fitnessGoal === 'lose') {
      pRatio = 0.38; cRatio = 0.35; fRatio = 0.27
    }

    setNutritionTarget({
      calories,
      protein: Math.round((calories * pRatio) / 4),
      carbs: Math.round((calories * cRatio) / 4),
      fats: Math.round((calories * fRatio) / 9)
    })
  }

  // CRM Inquiry submission
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInquiryName.trim() || !newInquiryEmail.trim() || !sessionUser) return

    const newLead = {
      name: newInquiryName.trim(),
      email: newInquiryEmail.trim(),
      goal: newInquiryGoal
    }

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLead)
        })
        if (res.ok) {
          loadWorkspaceData(sessionUser.id)
        }
      } catch {
        setDbMode('offline')
      }
    } else {
      const localLead: Lead = {
        id: 'l_' + Date.now(),
        name: newLead.name,
        email: newLead.email,
        goal: newLead.goal,
        date: new Date().toISOString().split('T')[0]
      }
      const updated = [localLead, ...leads]
      setLeads(updated)
      localStorage.setItem('apex_gym_leads', JSON.stringify(updated))
    }

    setNewInquiryName('')
    setNewInquiryEmail('')
    triggerNotification('Lead recorded. Operations Desk notified.')
  }

  // Admin pricing deck update
  const handleUpdatePrice = async (name: string, newPrice: number) => {
    if (!sessionUser) return

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/pricing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, price: newPrice })
        })
        if (res.ok) {
          loadWorkspaceData(sessionUser.id)
        }
      } catch {
        setDbMode('offline')
      }
    } else {
      const updated = pricingTiers.map(t => t.name === name ? { ...t, price: newPrice } : t)
      setPricingTiers(updated)
    }
    triggerNotification(`Pricing updated: ${name} set to $${newPrice}`)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!sessionUser) return
    if (userId === sessionUser.id) {
      triggerNotification("You cannot delete your own administrator account.")
      return
    }
    if (confirm("Are you sure you want to permanently delete this user and all their records?")) {
      if (dbMode === 'online') {
        try {
          const res = await authFetch(`${API_BASE}/api/gym/profile?userId=${userId}`, {
            method: 'DELETE'
          })
          if (res.ok) {
            const data = await res.json()
            setUsersList(data.users)
            triggerNotification("User deleted successfully.")
          } else {
            const data = await res.json()
            triggerNotification(`Deletion failed: ${data.error}`)
          }
        } catch {
          triggerNotification("Failed to delete user on server.")
        }
      } else {
        const updated = usersList.filter(u => u.id !== userId)
        setUsersList(updated)
        triggerNotification("User deleted locally.")
      }
    }
  }

  const handleAddUserAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionUser) return
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      triggerNotification("Please fill in all user registration fields.")
      return
    }
    
    const newUserData = {
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword.trim(),
      role: newUserRole,
      tier: newUserTier
    }

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/auth`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUserData)
        })
        if (res.ok) {
          triggerNotification("User account created successfully.")
          setNewUserName('')
          setNewUserEmail('')
          setNewUserPassword('123456')
          loadWorkspaceData(sessionUser.id)
        } else {
          const data = await res.json()
          triggerNotification(`Creation failed: ${data.error}`)
        }
      } catch {
        triggerNotification("Failed to create user on server.")
      }
    } else {
      const localNewUser: UserSession = {
        id: 'u_' + Date.now(),
        name: newUserData.name,
        email: newUserData.email,
        tier: newUserData.tier,
        joined: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        streak: 1,
        waterIntake: 0,
        role: newUserData.role,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'
      }
      const updated = [...usersList, localNewUser]
      setUsersList(updated)
      triggerNotification("User created locally.")
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword('123456')
    }
  }

  const handleSaveUserEdit = async (userId: string) => {
    if (!sessionUser) return
    if (!editUserName.trim() || !editUserEmail.trim()) {
      triggerNotification("Name and email cannot be empty.")
      return
    }

    const editData = {
      userId,
      name: editUserName.trim(),
      email: editUserEmail.trim(),
      role: editUserRole,
      tier: editUserTier
    }

    if (dbMode === 'online') {
      try {
        const res = await authFetch(`${API_BASE}/api/gym/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editData)
        })
        if (res.ok) {
          triggerNotification("User profile updated successfully.")
          setEditingUserId(null)
          loadWorkspaceData(sessionUser.id)
        } else {
          const data = await res.json()
          triggerNotification(`Update failed: ${data.error}`)
        }
      } catch {
        triggerNotification("Failed to update user on server.")
      }
    } else {
      const updated = usersList.map(u => u.id === userId ? { ...u, name: editData.name, email: editData.email, role: editData.role, tier: editData.tier } : u)
      setUsersList(updated)
      triggerNotification("User updated locally.")
      setEditingUserId(null)
    }
  }

  const handleStartEditUser = (user: UserSession) => {
    setEditingUserId(user.id)
    setEditUserName(user.name)
    setEditUserEmail(user.email)
    setEditUserRole(user.role as any)
    setEditUserTier(user.tier as any)
  }

  const changeTheme = (theme: 'emerald' | 'violet' | 'amber') => {
    setThemeColor(theme)
    localStorage.setItem('apex_gym_theme_color', theme)
    triggerNotification(`Workspace design modified to ${theme.toUpperCase()}`)
  }

  // Color classes map
  const themeClasses = {
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      bgMuted: 'bg-emerald-500/10',
      border: 'border-emerald-500/35',
      glow: 'shadow-emerald-500/20',
      accentText: 'text-emerald-500 hover:text-emerald-400',
      accentBtn: 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950',
      accentHover: 'hover:border-emerald-500/60'
    },
    violet: {
      text: 'text-violet-400',
      bg: 'bg-violet-500',
      bgMuted: 'bg-violet-500/10',
      border: 'border-violet-500/35',
      glow: 'shadow-violet-500/20',
      accentText: 'text-violet-500 hover:text-violet-400',
      accentBtn: 'bg-violet-500 hover:bg-violet-600 text-white',
      accentHover: 'hover:border-violet-500/60'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500',
      bgMuted: 'bg-amber-500/10',
      border: 'border-amber-500/35',
      glow: 'shadow-amber-500/20',
      accentText: 'text-amber-500 hover:text-amber-400',
      accentBtn: 'bg-amber-500 hover:bg-amber-600 text-zinc-950',
      accentHover: 'hover:border-amber-500/60'
    }
  }

  const activeTheme = themeClasses[themeColor]

  // Render Login state if unauthenticated
  if (!authToken || !sessionUser) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative font-sans" style={{ backgroundColor: '#09090b' }}>
        <div className="absolute top-[-25%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[150px] bg-zinc-900 pointer-events-none -z-10" />
        <div className={`absolute bottom-[-15%] left-[-15%] w-[50vw] h-[50vw] rounded-full blur-[180px] ${activeTheme.bgMuted} opacity-20 pointer-events-none -z-10`} />

        <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 mb-1">
              <Dumbbell className={`w-8 h-8 ${activeTheme.text}`} />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">GYM <span className={activeTheme.text}>HUB</span></h1>
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-550">MEMBER ACCESS PORTAL</p>
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850">
            <button 
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              className={`flex-1 py-2 rounded text-xs font-bold uppercase transition-all duration-300 ${authMode === 'login' ? `${activeTheme.bg} text-zinc-950` : 'text-zinc-400'} cursor-pointer`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); setAuthError(null); }}
              className={`flex-1 py-2 rounded text-xs font-bold uppercase transition-all duration-300 ${authMode === 'signup' ? `${activeTheme.bg} text-zinc-950` : 'text-zinc-400'} cursor-pointer`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-xs text-rose-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Samridhi Gusain"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Email Address</label>
                <span className="text-[9px] text-zinc-600 font-mono">Owner: admin@gym.com</span>
              </div>
              <input 
                type="email" 
                required
                placeholder="samridhi@gusain.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Password</label>
                <span className="text-[9px] text-zinc-600 font-mono">Pass: 123456 / admin123</span>
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>

            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Membership Tier</label>
                <select 
                  value={authTier}
                  onChange={(e) => setAuthTier(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                >
                  <option value="Standard Club">Standard Club ($49/mo)</option>
                  <option value="Platinum Elite">Platinum Elite ($99/mo)</option>
                  <option value="VIP Coach Pro">VIP Coach Pro ($199/mo)</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className={`w-full py-3 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${activeTheme.accentBtn}`}
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{authMode === 'login' ? 'Authenticate' : 'Initialize Account'}</span>
            </button>
          </form>

          <div className="text-[10px] text-zinc-550 font-mono text-center pt-2">
            Workspace Theme: 
            <span className="flex justify-center gap-1.5 mt-2">
              <button onClick={() => changeTheme('emerald')} className="w-3.5 h-3.5 rounded-full bg-emerald-500 cursor-pointer" />
              <button onClick={() => changeTheme('violet')} className="w-3.5 h-3.5 rounded-full bg-violet-500 cursor-pointer" />
              <button onClick={() => changeTheme('amber')} className="w-3.5 h-3.5 rounded-full bg-amber-500 cursor-pointer" />
            </span>
          </div>

        </div>
      </div>
    )
  }

  // Analytics Math (Step 4: Workout Analytics)
  const totalVolume = workoutLogs.reduce((acc, log) => acc + (log.sets * log.reps * log.weight), 0)
  const averageSets = workoutLogs.length ? parseFloat((workoutLogs.reduce((acc, l) => acc + l.sets, 0) / workoutLogs.length).toFixed(1)) : 0
  const averageWeight = workoutLogs.length ? Math.round(workoutLogs.reduce((acc, l) => acc + l.weight, 0) / workoutLogs.length) : 0

  // Food Analytics Math
  const consumedCalories = foodLogs.reduce((sum, f) => sum + f.calories, 0)
  const consumedProtein = foodLogs.reduce((sum, f) => sum + f.protein, 0)
  const consumedCarbs = foodLogs.reduce((sum, f) => sum + f.carbs, 0)
  const consumedFats = foodLogs.reduce((sum, f) => sum + f.fats, 0)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative font-sans overflow-x-hidden" style={{ backgroundColor: '#09090b' }}>
      
      {/* Background glow overlay */}
      <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] bg-zinc-900 pointer-events-none -z-10 animate-pulse" />
      <div className={`absolute bottom-[-10%] left-[-20%] w-[50vw] h-[50vw] rounded-full blur-[180px] ${activeTheme.bgMuted} opacity-30 pointer-events-none -z-10`} />

      {/* Profile Settings Modal */}
      {profileEditModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveProfile}
            className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-start border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider">Profile Settings</h3>
              </div>
              <button 
                type="button"
                onClick={() => setProfileEditModal(null)} 
                className="text-xs text-zinc-550 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar Preview & URL */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-950/40 border border-zinc-800/40">
                <img 
                  src={profileEditModal.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80'} 
                  alt="Avatar Preview" 
                  className="w-16 h-16 rounded-full border border-zinc-700 object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80'
                  }}
                />
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block font-bold">Profile Photo URL</label>
                  <input 
                    type="url"
                    value={profileEditModal.avatar}
                    onChange={(e) => setProfileEditModal(prev => prev ? { ...prev, avatar: e.target.value } : null)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Avatar Presets Selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block font-bold">Quick Presets</label>
                <div className="flex gap-2.5 overflow-x-auto py-1">
                  {[
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
                    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80'
                  ].map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setProfileEditModal(prev => prev ? { ...prev, avatar: url } : null)}
                      className={`w-9 h-9 rounded-full border flex-shrink-0 overflow-hidden cursor-pointer transition ${
                        profileEditModal.avatar === url ? 'border-emerald-400 scale-110 shadow-lg' : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block font-bold">Display Name</label>
                <input 
                  type="text"
                  required
                  value={profileEditModal.name}
                  onChange={(e) => setProfileEditModal(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Athlete Name"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block font-bold">Email Address</label>
                <input 
                  type="email"
                  required
                  value={profileEditModal.email}
                  onChange={(e) => setProfileEditModal(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="email@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3 rounded-lg text-xs font-mono font-bold uppercase bg-emerald-500 hover:bg-emerald-600 text-zinc-950 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>
      )}

      {/* Stripe Simulator Modal */}
      {stripeModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider">Stripe Payment Gateway</h3>
              </div>
              <button onClick={() => setStripeModal(null)} className="text-xs text-zinc-550 hover:text-zinc-200 cursor-pointer">Cancel</button>
            </div>

            {stripeModal.status === 'idle' && (
              <div className="space-y-6">
                <div className="p-4 rounded bg-zinc-950 border border-zinc-850 space-y-2">
                  <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest">Order Summary</span>
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-sm font-bold">{stripeModal.itemName}</h4>
                    <span className="text-sm font-mono font-black text-emerald-400">
                      {paymentCurrency === 'inr' ? `₹${Math.round(stripeModal.price * 84)}` : `$${stripeModal.price}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Secure gym slot allocation, booking synchronization, and local tax.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest">Select Currency & Gateway</label>
                  <select 
                    value={paymentCurrency} 
                    onChange={(e) => setPaymentCurrency(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3.5 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="usd">USD (Stripe Card Gateway)</option>
                    <option value="inr">INR (Stripe UPI + RuPay/Local Cards)</option>
                  </select>
                </div>

                {paymentCurrency === 'usd' ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest">Card Details</label>
                      <div className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-3 text-xs text-zinc-300 font-mono flex items-center gap-3">
                        <span>💳</span>
                        <span>4242  ••••  ••••  4242</span>
                        <span className="ml-auto text-zinc-500">12 / 29</span>
                        <span className="text-zinc-500">CVC</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest">Supported Payment Gateways</label>
                      <div className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-3 text-xs text-zinc-300 font-mono flex items-center gap-3">
                        <span>📱</span>
                        <span className="font-bold text-emerald-400">UPI / BHIM / Google Pay / PhonePe / RuPay</span>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleProcessPayment}
                  className="w-full py-3 rounded-lg text-xs font-mono font-bold uppercase bg-emerald-500 hover:bg-emerald-600 text-zinc-950 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Authorize Payment of {paymentCurrency === 'inr' ? `₹${Math.round(stripeModal.price * 84)}` : `$${stripeModal.price}`}</span>
                </button>
              </div>
            )}


            {stripeModal.status === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <div>
                  <h4 className="text-sm font-bold">Encrypting Stripe Transaction...</h4>
                  <p className="text-xs text-zinc-500 mt-1">Interfacing with secure bank merchant deposit protocols...</p>
                </div>
              </div>
            )}

            {stripeModal.status === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold">Stripe Payment Confirmed</h4>
                  <p className="text-xs text-zinc-500 mt-1">Receipt reference #str_{Date.now().toString().substring(5)} logged.</p>
                </div>
              </div>
            )}

            <div className="text-[9px] text-zinc-550 font-mono text-center">
              🔒 Stripe Sandbox Environment Active (No real funds charged)
            </div>
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-md shadow-2xl border ${activeTheme.border} ${activeTheme.bgMuted} backdrop-blur-md max-w-sm flex items-center gap-3 animate-bounce`}>
          <Activity className={`w-5 h-5 ${activeTheme.text} animate-pulse`} />
          <span className="text-xs font-mono tracking-wider">{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-8 gap-6 relative">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
          {/* Logo Card */}
          <div className="p-6 rounded-xl backdrop-blur-md bg-zinc-900/40 border border-zinc-800/60 shadow-xl flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTheme.bgMuted} border ${activeTheme.border}`}>
                <Dumbbell className={`w-6 h-6 ${activeTheme.text}`} />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter uppercase">GYM<span className={activeTheme.text}>HUB</span></h1>
                <p className="text-[10px] text-zinc-550 font-mono tracking-widest uppercase">Member & Coach Platform</p>
              </div>
            </div>
            <div className="h-px bg-zinc-850 my-2" />
            
            {/* Quick Profile Summary */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <img src={sessionUser.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80'} alt="avatar" className="w-10 h-10 rounded-full border border-zinc-700 object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{sessionUser.name}</p>
                  <p className={`text-[9px] font-mono tracking-wider truncate uppercase ${activeTheme.text}`}>{sessionUser.tier}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setProfileEditModal({
                    isOpen: true,
                    name: sessionUser.name,
                    email: sessionUser.email,
                    avatar: sessionUser.avatar || ''
                  })
                }}
                className="p-1.5 rounded hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 transition cursor-pointer flex-shrink-0"
                title="Edit Profile Settings"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Items (Filtered dynamically by role - Milestone 2) */}
          <nav className="p-4 rounded-xl backdrop-blur-md bg-zinc-900/40 border border-zinc-800/60 shadow-xl flex flex-col gap-1.5">
            {(sessionUser.role === 'admin' 
              ? [
                  { id: 'admin', label: 'Operator Console', icon: Sliders },
                  { id: 'classes', label: 'Manage Classes', icon: Calendar },
                  { id: 'trainers', label: 'Manage Trainers', icon: Users },
                  { id: 'billing', label: 'Fees & Performance', icon: CreditCard }
                ]
              : [
                  { id: 'dashboard', label: 'Overview Dashboard', icon: Activity },
                  { id: 'classes', label: 'Class Scheduler', icon: Calendar },
                  { id: 'trainers', label: 'Personal Trainers', icon: Users },
                  { id: 'workouts', label: 'Workout Log', icon: Dumbbell },
                  { id: 'ai-form', label: 'AI Form Check', icon: Shield },
                  { id: 'nutrition', label: 'Nutrition & BMI', icon: Calculator },
                  { id: 'billing', label: 'Fees & Performance', icon: CreditCard }
                ]
            ).map(item => {
              const Icon = item.icon
              const isSelected = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                    isSelected 
                      ? `${activeTheme.bgMuted} border-l-2 border-emerald-400 text-zinc-100` 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? activeTheme.text : 'text-zinc-550'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isSelected ? 'translate-x-0.5' : 'opacity-0'}`} />
                </button>
              )
            })}
          </nav>

          {/* Connection Status & Logout */}
          <div className="p-4 rounded-xl backdrop-blur-md bg-zinc-900/40 border border-zinc-800/60 shadow-xl flex flex-col gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Database Engine Status</span>
            
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${dbMode === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-mono capitalize">
                {dbMode === 'online' ? 'Online (Supabase DB)' : 'Offline (Local Sandbox)'}
              </span>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full mt-2 py-2 rounded border border-zinc-850 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-xs font-mono font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          
          {/* HEADER ROW */}
          <header className="p-6 rounded-xl backdrop-blur-md bg-zinc-900/40 border border-zinc-800/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-zinc-550 uppercase">GymHub Workspace Console</span>
              <h2 className="text-2xl font-black tracking-tight uppercase">
                {activeTab === 'dashboard' && 'SYSTEM OVERVIEW'}
                {activeTab === 'classes' && (sessionUser.role === 'admin' ? 'CLASS CATALOG MANAGEMENT' : 'FITNESS CLASS CALENDAR')}
                {activeTab === 'trainers' && (sessionUser.role === 'admin' ? 'TRAINER TEAM MANAGEMENT' : 'ELITE TRAINER ROSTER')}
                {activeTab === 'workouts' && 'REPETITION LOG BOOK'}
                {activeTab === 'ai-form' && 'AI EXERCISE FORM CHECK'}
                {activeTab === 'nutrition' && 'DIET & MACRO ENGINE'}
                {activeTab === 'admin' && 'SYSTEM OPERATIONS PANEL'}
                {activeTab === 'billing' && (sessionUser.role === 'admin' ? 'REVENUE & PERFORMANCE REGISTRY' : 'FEES & PERFORMANCE METRICS')}
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs font-mono font-bold text-amber-400">{streak} Day Streak</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Active Athlete</p>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div>
                <p className="text-xs font-mono font-bold text-sky-400">{waterIntake} ml</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Today's Water</p>
              </div>
            </div>
          </header>

          {/* DYNAMIC VIEW CONTAINER */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* VIEW 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Hydration Logger */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Grid metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-xl bg-zinc-900/20 border border-zinc-800/50 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Hydration Goals</span>
                        <h3 className="text-xl font-black">{waterIntake} <span className="text-xs text-zinc-400">/ 3000ml</span></h3>
                        <p className="text-[10px] text-zinc-500 leading-none">Status: {waterIntake >= 3000 ? 'Fully Hydrated' : 'Needs Fluid Log'}</p>
                      </div>
                      <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
                        <Droplet className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-6 rounded-xl bg-zinc-900/20 border border-zinc-800/50 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Workouts Logged</span>
                        <h3 className="text-xl font-black">{workoutLogs.length} <span className="text-xs text-zinc-400">exercises</span></h3>
                        <p className="text-[10px] text-zinc-500 leading-none">Streak multiplier active</p>
                      </div>
                      <div className={`p-3 ${activeTheme.bgMuted} border ${activeTheme.border} ${activeTheme.text} rounded-lg`}>
                        <Dumbbell className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Water logging interactive widget */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold tracking-wider uppercase">Hydration Tracker & Wave Simulation</h3>
                    <p className="text-xs text-zinc-455">Log your daily fluid consumption. Water keeps structural density stable during heavy workouts.</p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                      {/* Water tank visual */}
                      <div className="w-24 h-32 bg-zinc-900 rounded-xl relative overflow-hidden border border-zinc-800">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-sky-500/50 transition-all duration-700 ease-out flex items-center justify-center"
                          style={{ height: `${Math.min(100, (waterIntake / 3000) * 100)}%` }}
                        >
                          {waterIntake > 0 && (
                            <span className="text-[10px] font-mono font-bold text-white drop-shadow-md">
                              {Math.round(Math.min(100, (waterIntake / 3000) * 100))}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex-1 flex flex-wrap gap-3">
                        <button onClick={() => handleWaterChange(250)} className="px-4 py-2 text-xs font-mono font-bold uppercase rounded border border-sky-500/35 hover:bg-sky-500/20 text-sky-400 transition-colors cursor-pointer">
                          +250ml (Cup)
                        </button>
                        <button onClick={() => handleWaterChange(500)} className="px-4 py-2 text-xs font-mono font-bold uppercase rounded border border-sky-500/35 hover:bg-sky-500/20 text-sky-400 transition-colors cursor-pointer">
                          +500ml (Bottle)
                        </button>
                        <button onClick={() => handleWaterChange(1000)} className="px-4 py-2 text-xs font-mono font-bold uppercase rounded border border-sky-500/35 hover:bg-sky-500/20 text-sky-400 transition-colors cursor-pointer">
                          +1.0L (Shaker)
                        </button>
                        <button onClick={() => handleWaterChange(-waterIntake)} className="px-4 py-2 text-xs font-mono font-bold uppercase rounded border border-rose-500/35 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer">
                          Reset Data
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Registered Sessions summary */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Reserved Classes & Appointments</span>
                    </h3>
                    
                    {classesList.filter(c => c.isBooked).length === 0 && bookedTrainers.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No class bookings or private trainer appointments logged for this cycle.</p>
                    ) : (
                      <div className="space-y-3">
                        {/* Booked Classes */}
                        {classesList.filter(c => c.isBooked).map(classObj => (
                          <div key={classObj.id} className="p-4 rounded-lg bg-zinc-900/65 border border-zinc-800 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold">{classObj.className}</p>
                              <p className="text-[10px] text-zinc-400">{classObj.day} | {classObj.time}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded">
                                Paid via Stripe
                              </span>
                              <button 
                                onClick={() => handleCancelBooking('class', classObj.id)}
                                className="text-[10px] font-mono uppercase text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded hover:bg-rose-500/20 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Booked Trainers */}
                        {bookedTrainers.map((bt, idx) => {
                          const trainer = trainersList.find(t => t.id === bt.trainerId)
                          if (!trainer) return null
                          return (
                            <div key={idx} className="p-4 rounded-lg bg-zinc-900/65 border border-zinc-800 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <img src={trainer.image} className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                  <p className="text-xs font-bold">1-on-1 with {trainer.name}</p>
                                  <p className="text-[10px] text-zinc-400">{bt.time} | {bt.date}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded">
                                  Confirmed
                                </span>
                                <button 
                                  onClick={() => handleCancelBooking('trainer', trainer.id, bt.time)}
                                  className="text-[10px] font-mono uppercase text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded hover:bg-rose-500/20 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Latest AI form correction report */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-violet-500/20 shadow-xl space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                        <Shield className="w-4 h-4 text-violet-400" />
                        <span>AI Exercise Form Report</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('ai-form')}
                        className="text-[10px] font-mono uppercase text-violet-400 hover:text-violet-300 transition cursor-pointer"
                      >
                        Open Analyzer
                      </button>
                    </div>
                    {aiReports.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No AI posture analysis has been generated yet.</p>
                    ) : (
                      <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">{aiReports[0].exercise}</p>
                          <p className="text-[10px] text-zinc-400 mt-1">{aiReports[0].postureResult} | {aiReports[0].date}</p>
                          <p className="text-[10px] text-zinc-500 mt-2">{aiReports[0].feedback[0]}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-violet-400 font-mono">{aiReports[0].score}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-mono">Form Score</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Mini analytics */}
                <div className="space-y-6">
                  
                  {/* Calorie Calculator Mini Summary */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold tracking-wider uppercase">Metabolic Blueprint</h3>
                    
                    {bmiResult && nutritionTarget && (
                      <div className="space-y-4">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-zinc-400">Body Mass Index (BMI)</span>
                          <span className={`text-lg font-black ${bmiResult.color}`}>{bmiResult.bmi}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              bmiResult.bmi < 18.5 ? 'bg-sky-400' :
                              bmiResult.bmi < 25 ? 'bg-emerald-500' :
                              bmiResult.bmi < 30 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, (bmiResult.bmi / 40) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-mono text-right text-zinc-450 text-zinc-400">Class: {bmiResult.category}</p>

                        <div className="h-px bg-zinc-800/80 my-2" />

                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-zinc-400">Daily Calorie Target</span>
                          <span className={`text-xl font-black ${activeTheme.text}`}>{nutritionTarget.calories} kcal</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2 rounded bg-zinc-950 text-center">
                            <span className="block text-[9px] text-zinc-500 uppercase font-mono">Protein</span>
                            <span className="text-xs font-bold text-rose-400">{nutritionTarget.protein}g</span>
                          </div>
                          <div className="p-2 rounded bg-zinc-950 text-center">
                            <span className="block text-[9px] text-zinc-500 uppercase font-mono">Carbs</span>
                            <span className="text-xs font-bold text-sky-400">{nutritionTarget.carbs}g</span>
                          </div>
                          <div className="p-2 rounded bg-zinc-950 text-center">
                            <span className="block text-[9px] text-zinc-500 uppercase font-mono">Fat</span>
                            <span className="text-xs font-bold text-amber-400">{nutritionTarget.fats}g</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SVG Analytics Graph */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold tracking-wider uppercase flex items-center justify-between">
                      <span>Weekly Performance</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </h3>
                    
                    <div className="h-32 w-full flex items-end justify-between pt-4">
                      {[300, 450, 200, 600, 500, 650, 800].map((val, idx) => {
                        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
                        const heightPercent = (val / 900) * 100
                        return (
                          <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                            <div className="text-[8px] font-mono text-zinc-500">{val}</div>
                            <div className="w-6 rounded-t bg-zinc-850 relative group overflow-hidden" style={{ height: `${heightPercent}%` }}>
                              <div className={`absolute inset-0 ${activeTheme.bg} opacity-70 transition-all duration-300 group-hover:opacity-100`} />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-zinc-400">{days[idx]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Athletic Goals & Milestone Tracker (Option D) */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold tracking-wider uppercase">Milestone Targets</h3>
                      <button
                        onClick={() => setIsEditingGoals(!isEditingGoals)}
                        className="text-[10px] font-mono uppercase text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                      >
                        {isEditingGoals ? 'View Progress' : 'Edit Targets'}
                      </button>
                    </div>

                    {isEditingGoals ? (
                      <form onSubmit={handleSaveGoals} className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Target Weight (kg)</label>
                          <input 
                            type="number"
                            required
                            min={30}
                            max={200}
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 70)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Streak Goal (days)</label>
                          <input 
                            type="number"
                            required
                            min={1}
                            max={365}
                            value={streakGoal}
                            onChange={(e) => setStreakGoal(parseInt(e.target.value) || 10)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className={`w-full py-2 rounded text-xs font-mono font-bold uppercase transition cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-zinc-950`}
                        >
                          Save Goals
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {/* Weight Progress Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-semibold text-zinc-400">Weight Goal Progress</span>
                            <span className="font-mono font-bold text-zinc-200">
                              {weight} kg <span className="text-[10px] text-zinc-550">of {targetWeight} kg</span>
                            </span>
                          </div>
                          {(() => {
                            const diff = Math.abs(weight - targetWeight)
                            const percent = Math.min(100, Math.round((Math.min(weight, targetWeight) / Math.max(weight, targetWeight)) * 100))
                            return (
                              <>
                                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850 mt-1">
                                  <div className="h-full bg-teal-400" style={{ width: `${percent}%` }} />
                                </div>
                                <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                                  <span>{percent}% match</span>
                                  <span>{diff === 0 ? 'Goal Met!' : `${diff.toFixed(1)} kg delta`}</span>
                                </div>
                              </>
                            )
                          })()}
                        </div>

                        {/* Streak Progress Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-semibold text-zinc-400">Streak Goal Progress</span>
                            <span className="font-mono font-bold text-zinc-200">
                              {streak} <span className="text-[10px] text-zinc-550">of {streakGoal} days</span>
                            </span>
                          </div>
                          {(() => {
                            const percent = Math.min(100, Math.round((streak / streakGoal) * 100))
                            return (
                              <>
                                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850 mt-1">
                                  <div className="h-full bg-amber-400" style={{ width: `${percent}%` }} />
                                </div>
                                <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                                  <span>{percent}% reached</span>
                                  <span>{streak >= streakGoal ? 'Goal Achieved!' : `${streakGoal - streak} days remaining`}</span>
                                </div>
                              </>
                            )
                          })()}
                        </div>

                        <div className="h-px bg-zinc-850 my-1" />

                        {/* Milestone badges */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block font-bold">Earned Badges</span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {/* Hydro Champion */}
                            {(() => {
                              const earned = waterIntake >= 3000
                              return (
                                <div className={`p-2 rounded border flex flex-col justify-between transition duration-300 ${earned ? 'bg-sky-500/5 border-sky-500/20 text-sky-400' : 'bg-zinc-950/20 border-zinc-900 opacity-40 text-zinc-500'}`}>
                                  <span className="text-xs font-bold">💧 Hydro King</span>
                                  <span className="text-[8px] font-mono mt-0.5">{earned ? 'Target reached: 3L+' : 'Log 3.0L water'}</span>
                                </div>
                              )
                            })()}

                            {/* Consistent Athlete */}
                            {(() => {
                              const earned = streak >= 5
                              return (
                                <div className={`p-2 rounded border flex flex-col justify-between transition duration-300 ${earned ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-zinc-950/20 border-zinc-900 opacity-40 text-zinc-500'}`}>
                                  <span className="text-xs font-bold">⚡ Consistent</span>
                                  <span className="text-[8px] font-mono mt-0.5">{earned ? '5+ Day Streak!' : 'Unlock at 5d streak'}</span>
                                </div>
                              )
                            })()}

                            {/* Target Locked */}
                            {(() => {
                              const earned = Math.abs(weight - targetWeight) <= 1
                              return (
                                <div className={`p-2 rounded border flex flex-col justify-between transition duration-350 ${earned ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-zinc-950/20 border-zinc-900 opacity-40 text-zinc-500'}`}>
                                  <span className="text-xs font-bold">🎯 Target Match</span>
                                  <span className="text-[8px] font-mono mt-0.5">{earned ? 'Within 1kg of target!' : 'Get within 1kg of target'}</span>
                                </div>
                              )
                            })()}

                            {/* Premium VIP */}
                            {(() => {
                              const earned = sessionUser?.tier === 'VIP Coach Pro'
                              return (
                                <div className={`p-2 rounded border flex flex-col justify-between transition duration-300 ${earned ? 'bg-violet-500/5 border-violet-500/20 text-violet-400' : 'bg-zinc-950/20 border-zinc-900 opacity-40 text-zinc-500'}`}>
                                  <span className="text-xs font-bold">🏆 VIP Master</span>
                                  <span className="text-[8px] font-mono mt-0.5">{earned ? 'Elite Tier active!' : 'VIP Coach Pro tier'}</span>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 2: CLASS SCHEDULER & ADMIN CLASS DECK */}
            {activeTab === 'classes' && (
              <div className="space-y-6">
                
                {/* ADMIN CLASS MANAGEMENT PANEL (Milestone 2) */}
                {sessionUser.role === 'admin' ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* Add Class Form */}
                    <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6 h-fit">
                      <div>
                        <h3 className="text-base font-bold tracking-wider uppercase">Add Group Class</h3>
                        <p className="text-xs text-zinc-450">Register a new class slot into the cloud catalogue.</p>
                      </div>

                      <form onSubmit={handleAddClassAdmin} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Class Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Boxing Bootcamp"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Coach / Instructor</label>
                          <select 
                            value={newClassTrainer}
                            onChange={(e) => setNewClassTrainer(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                          >
                            <option value="">Select Instructor</option>
                            {trainersList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Time Slot</label>
                          <input 
                            type="text" 
                            required
                            value={newClassTime}
                            onChange={(e) => setNewClassTime(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Days</label>
                            <input 
                              type="text" 
                              required
                              value={newClassDay}
                              onChange={(e) => setNewClassDay(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Spots</label>
                            <input 
                              type="number" 
                              required
                              value={newClassSpots}
                              onChange={(e) => setNewClassSpots(parseInt(e.target.value) || 0)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className={`w-full py-3 rounded text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${activeTheme.accentBtn}`}
                        >
                          Create Class
                        </button>
                      </form>
                    </div>

                    {/* Class List Table */}
                    <div className="md:col-span-2 p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                      <div>
                        <h3 className="text-base font-bold tracking-wider uppercase">Active Class Catalog</h3>
                        <p className="text-xs text-zinc-450">Roster of all sessions compiled inside databases.</p>
                      </div>

                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {classesList.map(c => (
                          <div key={c.id} className="p-4 rounded bg-zinc-950 border border-zinc-850 flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-zinc-150 uppercase tracking-wider">{c.className}</h4>
                              <div className="flex gap-4 mt-1 text-[10px] font-mono text-zinc-500">
                                <span>Instructor: {c.trainerName}</span>
                                <span>Time: {c.time} ({c.day})</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 px-3 py-1 rounded">
                              Capacity: {c.spots} / {c.maxSpots} slots
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  // MEMBER VIEW: STANDARD CLASS BOOKING
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
                      <div>
                        <h3 className="text-lg font-bold tracking-wider uppercase">Class Reservations</h3>
                        <p className="text-xs text-zinc-400">Filter the interactive timetable and reserve slots instantly.</p>
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        <span className="text-xs text-zinc-400 px-3 py-1 font-semibold">Reserved: {classesList.filter(c => c.isBooked).length}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {classesList.map(classObj => {
                        const isBooked = classObj.isBooked
                        return (
                          <div 
                            key={classObj.id} 
                            className={`p-6 rounded-lg bg-zinc-905 border transition-all duration-300 ${
                              isBooked 
                                ? `${activeTheme.border} ${activeTheme.bgMuted}` 
                                : 'border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4 mb-4">
                              <div>
                                <h4 className="font-bold text-sm text-zinc-100">{classObj.className}</h4>
                                <p className="text-xs text-zinc-450 font-mono mt-0.5">Coach: {classObj.trainerName}</p>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isBooked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                {isBooked ? 'Reserved (Stripe)' : 'Available'}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 mb-5 text-[11px] font-mono text-zinc-400">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{classObj.day} | {classObj.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Capacity: {classObj.spots} / {classObj.maxSpots} Booked</span>
                              </div>
                            </div>

                            {isBooked ? (
                              <button
                                onClick={() => handleCancelBooking('class', classObj.id)}
                                className="w-full py-2.5 rounded text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                              >
                                Cancel Slot Reservation
                              </button>
                            ) : (
                              <button
                                onClick={() => triggerStripePayment(classObj.className, 15, 'class', classObj.id)}
                                className={`w-full py-2.5 rounded text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${activeTheme.accentBtn}`}
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Stripe Checkout ($15)</span>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* VIEW 3: PERSONAL TRAINERS & ADMIN TRAINER DECK */}
            {activeTab === 'trainers' && (
              <div className="space-y-6">
                
                {/* ADMIN TRAINER MANAGEMENT PANEL (Milestone 2) */}
                {sessionUser.role === 'admin' ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* Add Trainer Form */}
                    <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6 h-fit">
                      <div>
                        <h3 className="text-base font-bold tracking-wider uppercase">Add Personal Coach</h3>
                        <p className="text-xs text-zinc-450">Register a certified coach profile inside the database.</p>
                      </div>

                      <form onSubmit={handleAddTrainerAdmin} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Coach Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. John Doe"
                            value={newTrainerName}
                            onChange={(e) => setNewTrainerName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Specialties</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Core, Kettlebells, HIIT"
                            value={newTrainerSpecialty}
                            onChange={(e) => setNewTrainerSpecialty(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Coach Bio Description</label>
                          <textarea 
                            required
                            rows={3}
                            placeholder="Describe experience and approach..."
                            value={newTrainerBio}
                            onChange={(e) => setNewTrainerBio(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 resize-none focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Profile Image (URL)</label>
                          <input 
                            type="text" 
                            placeholder="Leave blank for placeholder"
                            value={newTrainerImage}
                            onChange={(e) => setNewTrainerImage(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Open Slots (Comma Separated)</label>
                          <input 
                            type="text" 
                            required
                            value={newTrainerSlots}
                            onChange={(e) => setNewTrainerSlots(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className={`w-full py-3 rounded text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${activeTheme.accentBtn}`}
                        >
                          Hire Coach
                        </button>
                      </form>
                    </div>

                    {/* Trainer Roster Table */}
                    <div className="md:col-span-2 p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                      <div>
                        <h3 className="text-base font-bold tracking-wider uppercase">Active Trainer Team</h3>
                        <p className="text-xs text-zinc-450">Coaching roster registered to operations.</p>
                      </div>

                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                        {trainersList.map(t => (
                          <div key={t.id} className="p-4 rounded bg-zinc-950 border border-zinc-850 flex items-center gap-4">
                            <img src={t.image} className="w-12 h-12 rounded-full object-cover shrink-0" />
                            <div>
                              <h4 className="text-xs font-bold text-zinc-150 uppercase tracking-wider">{t.name}</h4>
                              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{t.specialty}</p>
                              <p className="text-[11px] text-zinc-500 italic mt-1 leading-normal">"{t.bio}"</p>
                            </div>
                            <span className="ml-auto text-xs font-mono font-bold text-amber-400 shrink-0">
                              ★ {t.rating}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  // MEMBER VIEW: STANDARD TRAINER BOOKING
                  <>
                    <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl">
                      <h3 className="text-lg font-bold tracking-wider uppercase mb-1">Meet Our Master Trainers</h3>
                      <p className="text-xs text-zinc-400">Book dedicated coaching sessions to fine-tune energy systems, leverage compound lifts, or speed up recovery.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {trainersList.map(trainer => (
                        <div key={trainer.id} className="rounded-xl overflow-hidden bg-zinc-900/40 border border-zinc-800 flex flex-col group hover:border-zinc-700 transition-all duration-300">
                          <div className="aspect-[16/10] w-full overflow-hidden relative">
                            <img src={trainer.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-955 to-transparent opacity-80" />
                            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                              <div>
                                <h4 className="text-base font-black uppercase text-white leading-none">{trainer.name}</h4>
                                <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase tracking-wide">{trainer.specialty}</p>
                              </div>
                              <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                ★ {trainer.rating}
                              </span>
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                            <p className="text-xs text-zinc-400 leading-relaxed italic text-zinc-350">"{trainer.bio}"</p>
                            
                            <div className="space-y-4">
                              {/* Display already booked sessions for this trainer */}
                              {(() => {
                                const activeBookings = bookedTrainers.filter(b => b.trainerId === trainer.id)
                                if (activeBookings.length > 0) {
                                  return (
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block font-bold">Your Booked Sessions:</span>
                                      <div className="space-y-1.5">
                                        {activeBookings.map((bt, idx) => (
                                          <div key={idx} className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-xs">
                                            <div className="space-y-0.5">
                                              <p className="font-bold text-emerald-400">{bt.time}</p>
                                              <p className="text-[9px] text-zinc-550 font-mono">Date: {bt.date}</p>
                                            </div>
                                            <button
                                              onClick={() => handleCancelBooking('trainer', trainer.id, bt.time)}
                                              className="text-[9px] font-mono uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded hover:bg-rose-500/20 cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              })()}

                              {/* Toggle Form Button */}
                              {bookingTrainerId !== trainer.id ? (
                                <button
                                  onClick={() => {
                                    setBookingTrainerId(trainer.id)
                                    setBookingDate(tomorrowStr)
                                    setBookingTime('10:00 AM')
                                    setBookingFocus('Strength & Conditioning')
                                  }}
                                  className={`w-full py-2.5 rounded text-xs font-mono font-bold uppercase transition cursor-pointer ${activeTheme.accentBtn}`}
                                >
                                  Schedule New Session
                                </button>
                              ) : (
                                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-850 space-y-3">
                                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">New Appointment Form</span>
                                    <button 
                                      onClick={() => setBookingTrainerId(null)}
                                      className="text-[10px] text-zinc-500 hover:text-zinc-350 cursor-pointer"
                                    >
                                      Close
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {/* Date */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Select Date</label>
                                      <input 
                                        type="date"
                                        min={tomorrowStr}
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-250 focus:outline-none focus:border-zinc-700"
                                      />
                                    </div>

                                    {/* Time slots */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Select Time Slot</label>
                                      <select
                                        value={bookingTime}
                                        onChange={(e) => setBookingTime(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-350 focus:outline-none focus:border-zinc-700"
                                      >
                                        <option value="08:00 AM">08:00 AM</option>
                                        <option value="09:00 AM">09:00 AM</option>
                                        <option value="10:00 AM">10:00 AM</option>
                                        <option value="11:00 AM">11:00 AM</option>
                                        <option value="12:00 PM">12:00 PM</option>
                                        <option value="01:00 PM">01:00 PM</option>
                                        <option value="02:00 PM">02:00 PM</option>
                                        <option value="03:00 PM">03:00 PM</option>
                                        <option value="04:00 PM">04:00 PM</option>
                                        <option value="05:00 PM">05:00 PM</option>
                                      </select>
                                    </div>

                                    {/* Focus */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Session Focus</label>
                                      <select
                                        value={bookingFocus}
                                        onChange={(e) => setBookingFocus(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-350 focus:outline-none focus:border-zinc-700"
                                      >
                                        <option value="Strength & Conditioning">Strength & Conditioning</option>
                                        <option value="Cardio & HIIT Conditioning">Cardio & HIIT Conditioning</option>
                                        <option value="Yoga, Mobility & Flexibility">Yoga, Mobility & Flexibility</option>
                                        <option value="Rehabilitative Restoration">Rehabilitative Restoration</option>
                                        <option value="General Athletic Performance">General Athletic Performance</option>
                                      </select>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      const timeSlotDesc = `${bookingTime} (${bookingFocus}) on ${bookingDate}`
                                      triggerStripePayment(
                                        `1-on-1 Session: ${trainer.name}`,
                                        45,
                                        'trainer',
                                        trainer.id,
                                        timeSlotDesc
                                      )
                                      setBookingTrainerId(null)
                                    }}
                                    className={`w-full py-2 rounded text-xs font-mono font-bold uppercase transition cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-zinc-950`}
                                  >
                                    Book via Stripe ($45)
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              </div>
            )}

            {/* VIEW 4: WORKOUT LOG */}
            {activeTab === 'workouts' && (
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Logger Form */}
                <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6 h-fit">
                  <div>
                    <h3 className="text-base font-bold tracking-wider uppercase">Log Set Metrics</h3>
                    <p className="text-xs text-zinc-450">Track weight velocity, intensity levels, and mechanical load.</p>
                  </div>

                  <form onSubmit={handleAddWorkout} className="space-y-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Muscle Category</label>
                          <select
                            value={selectedPresetCategory}
                            onChange={(e) => {
                              const cat = e.target.value
                              setSelectedPresetCategory(cat)
                              setSelectedPresetName('')
                              if (!cat) {
                                setExerciseInput('')
                              }
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                          >
                            <option value="">-- Custom --</option>
                            {EXERCISE_PRESETS.map(g => (
                              <option key={g.category} value={g.category}>{g.category}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Preset Library</label>
                          <select
                            value={selectedPresetName}
                            disabled={!selectedPresetCategory}
                            onChange={(e) => {
                              const name = e.target.value
                              setSelectedPresetName(name)
                              setExerciseInput(name)
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 disabled:opacity-40 focus:outline-none focus:border-zinc-700"
                          >
                            <option value="">-- Select --</option>
                            {selectedPresetCategory && EXERCISE_PRESETS.find(g => g.category === selectedPresetCategory)?.exercises.map(ex => (
                              <option key={ex.name} value={ex.name}>{ex.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Exercise Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Barbell Bench Press" 
                          value={exerciseInput}
                          onChange={(e) => {
                            const val = e.target.value
                            setExerciseInput(val)
                            if (val !== selectedPresetName) {
                              setSelectedPresetName('')
                            }
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                        />
                      </div>

                      {selectedPresetCategory && selectedPresetName && (
                        <div className="p-3 rounded bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-zinc-400 leading-normal">
                          <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">💡 Form Tip:</span>
                          {EXERCISE_PRESETS.find(g => g.category === selectedPresetCategory)?.exercises.find(e => e.name === selectedPresetName)?.tip}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sets</label>
                        <input 
                          type="number" 
                          required
                          min={1}
                          value={setsInput}
                          onChange={(e) => setSetsInput(parseInt(e.target.value) || 0)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Reps</label>
                        <input 
                          type="number" 
                          required
                          min={1}
                          value={repsInput}
                          onChange={(e) => setRepsInput(parseInt(e.target.value) || 0)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Wt (kg)</label>
                        <input 
                          type="number" 
                          required
                          min={0}
                          value={weightInput}
                          onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={`w-full py-3 rounded text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${activeTheme.accentBtn}`}
                    >
                      Log Workout
                    </button>
                  </form>
                </div>

                {/* Log history list & Workout Analytics */}
                <div className="md:col-span-2 p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                  
                  {/* Performance Analytics metrics */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-850">
                    <div className="text-center">
                      <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Total Volume</span>
                      <span className={`text-base font-black ${activeTheme.text}`}>{totalVolume.toLocaleString()} kg</span>
                    </div>
                    <div className="text-center border-x border-zinc-850">
                      <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Avg Weight</span>
                      <span className="text-base font-black text-sky-400">{averageWeight} kg</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Avg Sets</span>
                      <span className="text-base font-black text-violet-400">{averageSets} sets</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold tracking-wider uppercase">Session History Logs</h3>
                    <p className="text-xs text-zinc-450 mt-0.5">Active repository synced to cloud databases.</p>
                  </div>

                  {workoutLogs.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No workouts logged yet. Put in some work and log your first metrics!</p>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {workoutLogs.map(log => (
                        <div key={log.id} className="p-4 rounded bg-zinc-950 border border-zinc-850 flex items-center justify-between gap-4 group">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">{log.exercise}</h4>
                            <div className="flex gap-4 mt-1 text-[10px] font-mono text-zinc-455">
                              <span>Sets: {log.sets}</span>
                              <span>Reps: {log.reps}</span>
                              <span>Weight: {log.weight} kg</span>
                              <span>Date: {log.date}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteWorkout(log.id)}
                            className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all duration-300 cursor-pointer"
                            title="Remove log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 5: AI EXERCISE FORM CORRECTION */}
            {activeTab === 'ai-form' && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-violet-500/20 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold tracking-wider uppercase flex items-center gap-2">
                          <Shield className="w-5 h-5 text-violet-400" />
                          <span>AI-Based Exercise Form Correction</span>
                        </h3>
                        <p className="text-xs text-zinc-450 mt-1">
                          
                        </p>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1.5 rounded">
                        Computer Vision Module
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Exercise Type</label>
                        <select
                          value={aiExercise}
                          onChange={(e) => setAiExercise(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500/60"
                        >
                          <option value="Barbell Back Squat">Barbell Back Squat</option>
                          <option value="Deadlift">Deadlift</option>
                          <option value="Push-Up">Push-Up</option>
                          <option value="Overhead Press">Overhead Press</option>
                          <option value="Lunge">Lunge</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Input Source</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAiInputMode('camera')}
                            className={`py-2.5 rounded border text-xs font-mono font-bold uppercase transition cursor-pointer ${aiInputMode === 'camera' ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Webcam
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiInputMode('upload')}
                            className={`py-2.5 rounded border text-xs font-mono font-bold uppercase transition cursor-pointer ${aiInputMode === 'upload' ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Upload Video
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-950 border border-zinc-800 min-h-[280px] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.35),transparent_55%)]" />
                      <div className="relative z-10 space-y-4 max-w-xl">
                        <div className="mx-auto w-20 h-20 rounded-full border border-violet-500/30 bg-violet-500/10 flex items-center justify-center">
                          {aiProcessing ? (
                            <RefreshCw className="w-9 h-9 text-violet-400 animate-spin" />
                          ) : (
                            <Activity className="w-9 h-9 text-violet-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-wider">{aiInputMode === 'camera' ? 'Webcam Preview Placeholder' : 'Video Upload Preview'}</h4>
                          <p className="text-xs text-zinc-450 mt-2">
                            {aiInputMode === 'camera'
                              ? 'Camera permission and live pose overlay will connect here when the Python CV backend is added.'
                              : aiVideoFile || 'Upload an exercise video to simulate frame-by-frame analysis.'}
                          </p>
                        </div>

                        {aiInputMode === 'upload' && (
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setAiVideoFile(e.target.files?.[0]?.name || '')}
                            className="block w-full text-xs text-zinc-400 file:mr-4 file:rounded file:border-0 file:bg-violet-500 file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:text-white hover:file:bg-violet-600"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-5 gap-3">
                      {['OpenCV frames', 'Pose landmarks', 'Joint angles', 'Posture rules', 'Score report'].map((step, idx) => (
                        <div key={step} className={`p-3 rounded border text-center text-[10px] font-mono uppercase ${aiProcessing ? 'bg-violet-500/10 border-violet-500/25 text-violet-300' : idx < 4 && aiReports.length ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-zinc-950 border-zinc-850 text-zinc-500'}`}>
                          {step}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-xs text-zinc-400">
                        <span className="font-mono text-violet-400 uppercase tracking-wider">Status:</span> {aiStatus}
                      </div>
                      <button
                        type="button"
                        disabled={aiProcessing}
                        onClick={handleRunAiAnalysis}
                        className="px-5 py-3 rounded bg-violet-500 hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        {aiProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        <span>{aiProcessing ? 'Analyzing' : 'Run AI Form Check'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold tracking-wider uppercase">Latest Result</h3>
                    {aiReports.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">Run an analysis to generate posture score and feedback.</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase">{aiReports[0].exercise}</p>
                            <p className="text-[10px] text-zinc-500">{aiReports[0].inputMode === 'camera' ? 'Webcam input' : aiReports[0].fileName}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-3xl font-black font-mono ${aiReports[0].score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{aiReports[0].score}</p>
                            <p className="text-[9px] text-zinc-500 uppercase font-mono">/100</p>
                          </div>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded border text-[10px] font-mono uppercase ${aiReports[0].postureResult === 'Correct' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {aiReports[0].postureResult}
                        </span>
                        <div className="space-y-2">
                          {aiReports[0].feedback.map(item => (
                            <div key={item} className="p-3 rounded bg-zinc-950 border border-zinc-850 text-xs text-zinc-300">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold tracking-wider uppercase">Saved AI Reports</h3>
                    {aiReports.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No saved reports yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {aiReports.map(report => (
                          <div key={report.id} className="p-3 rounded bg-zinc-950 border border-zinc-850 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold">{report.exercise}</p>
                              <p className="text-[10px] text-zinc-500">{report.date} | {report.postureResult}</p>
                            </div>
                            <span className="text-sm font-black text-violet-400 font-mono">{report.score}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: NUTRITION & BMI ENGINE */}
            {activeTab === 'nutrition' && (
              <div className="space-y-6">
                
                {/* Section 1: Metabolic Profiler & BMI */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Inputs */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-base font-bold tracking-wider uppercase">Metabolic Profiler</h3>
                      <p className="text-xs text-zinc-450">Input physiological metrics to compile daily caloric targets.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest">Weight (kg)</label>
                          <input 
                            type="number" 
                            value={weight}
                            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest">Height (cm)</label>
                          <input 
                            type="number" 
                            value={height}
                            onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest">Age</label>
                          <input 
                            type="number" 
                            value={age}
                            onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest">Gender</label>
                          <select 
                            value={gender}
                            onChange={(e) => setGender(e.target.value as any)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest">Activity Level</label>
                        <select 
                          value={activity}
                          onChange={(e) => setActivity(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-855 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                        >
                          <option value="sedentary">Sedentary (Office job, no exercise)</option>
                          <option value="light">Lightly Active (1-3 days exercise)</option>
                          <option value="moderate">Moderately Active (3-5 days workout)</option>
                          <option value="active">Very Active (6-7 days intense gym)</option>
                          <option value="extreme">Extremely Active (Double splits)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest">Target Goal</label>
                        <select 
                          value={fitnessGoal}
                          onChange={(e) => setFitnessGoal(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-855 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                        >
                          <option value="lose">Fat Loss (Deficit)</option>
                          <option value="maintain">Body Recomp (Maintain)</option>
                          <option value="muscle">Lean Bulk (Surplus)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Calculations Results */}
                  <div className="md:col-span-2 p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-base font-bold tracking-wider uppercase">Metabolic Blueprint Compilation</h3>
                      <p className="text-xs text-zinc-455">Real-time calculations for energy density maintenance.</p>
                    </div>

                    {bmiResult && nutritionTarget && (
                      <div className="grid sm:grid-cols-2 gap-6">
                        
                        {/* BMI Block */}
                        <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-850 flex flex-col justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block mb-1">Body Mass Index</span>
                            <h4 className={`text-4xl font-black ${bmiResult.color}`}>{bmiResult.bmi}</h4>
                            <span className="text-xs font-mono font-semibold text-zinc-350">Category: {bmiResult.category}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            A normal BMI range is 18.5 - 24.9. Focus on body composition splits (skeletal muscle mass vs. fat tissue percentage).
                          </p>
                        </div>

                        {/* Calorie Goal block */}
                        <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-850 flex flex-col justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block mb-1">Daily Energy Target</span>
                            <h4 className={`text-4xl font-black ${activeTheme.text}`}>{nutritionTarget.calories} <span className="text-sm font-normal text-zinc-400">kcal/day</span></h4>
                            <span className="text-xs font-mono font-semibold text-zinc-350">Goal: {fitnessGoal === 'lose' ? 'Caloric Deficit' : fitnessGoal === 'muscle' ? 'Caloric Surplus' : 'Isocaloric Maintenance'}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Includes estimated physical expenditure. Maintaining targets triggers progressive recovery rates.
                          </p>
                        </div>

                        {/* Macronutrient breakdown */}
                        <div className="sm:col-span-2 p-6 rounded-lg bg-zinc-950 border border-zinc-850 space-y-6">
                          <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider">Macronutrient Split Blueprint</span>
                            <Apple className="w-4 h-4 text-emerald-400" />
                          </div>

                          <div className="grid sm:grid-cols-3 gap-6">
                            {/* Protein */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline text-xs">
                                <span className="font-semibold text-zinc-300">Protein Target</span>
                                <span className="font-mono text-rose-400 font-bold">{nutritionTarget.protein}g</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: `${(nutritionTarget.protein * 4 / nutritionTarget.calories) * 100}%` }} />
                              </div>
                              <p className="text-[10px] text-zinc-550 leading-relaxed">Essential for mechanical tissue repair and amino acid synthesis.</p>
                            </div>

                            {/* Carbs */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline text-xs">
                                <span className="font-semibold text-zinc-300">Carbohydrates Target</span>
                                <span className="font-mono text-sky-400 font-bold">{nutritionTarget.carbs}g</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-400" style={{ width: `${(nutritionTarget.carbs * 4 / nutritionTarget.calories) * 100}%` }} />
                              </div>
                              <p className="text-[10px] text-zinc-550 leading-relaxed">Primary glycogen buffer for heavy concentric and eccentric loads.</p>
                            </div>

                            {/* Fats */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline text-xs">
                                <span className="font-semibold text-zinc-300">Dietary Fats Target</span>
                                <span className="font-mono text-amber-400 font-bold">{nutritionTarget.fats}g</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400" style={{ width: `${(nutritionTarget.fats * 9 / nutritionTarget.calories) * 100}%` }} />
                              </div>
                              <p className="text-[10px] text-zinc-550 leading-relaxed">Crucial for endocrine optimization, cell structure, and joint lubrication.</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Consumed Food Logger & Gauge */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left: Food Logger Form */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-base font-bold tracking-wider uppercase">Log Consumed Food</h3>
                      <p className="text-xs text-zinc-455">Add items to your daily intake ledger to monitor macros.</p>
                    </div>

                    <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                      <button 
                        type="button"
                        onClick={() => setIsCustomFood(false)}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition ${!isCustomFood ? `${activeTheme.bg} text-zinc-950` : 'text-zinc-400'} cursor-pointer`}
                      >
                        Presets
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsCustomFood(true)}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition ${isCustomFood ? `${activeTheme.bg} text-zinc-955` : 'text-zinc-400'} cursor-pointer`}
                      >
                        Custom Food
                      </button>
                    </div>

                    <form onSubmit={handleAddFood} className="space-y-4">
                      {!isCustomFood ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Select Food Item</label>
                            <select
                              value={selectedFoodPreset}
                              required={!isCustomFood}
                              onChange={(e) => setSelectedFoodPreset(e.target.value)}
                              className="w-full bg-zinc-955 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                            >
                              <option value="">-- Choose Food --</option>
                              {FOOD_PRESETS.map(f => (
                                <option key={f.name} value={f.name}>{f.name} ({f.calories} kcal / {f.unit})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Servings / Quantity</label>
                            <input
                              type="number"
                              required={!isCustomFood}
                              min={0.1}
                              step={0.1}
                              value={foodServingsInput}
                              onChange={(e) => setFoodServingsInput(parseFloat(e.target.value) || 1)}
                              className="w-full bg-zinc-955 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                            />
                            <p className="text-[9px] text-zinc-500 italic">Example: 1.5 servings = 1.5x of the unit size</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Food Name</label>
                            <input
                              type="text"
                              required={isCustomFood}
                              placeholder="e.g. Protein Shake"
                              value={customFoodName}
                              onChange={(e) => setCustomFoodName(e.target.value)}
                              className="w-full bg-zinc-955 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Calories (kcal)</label>
                              <input
                                type="number"
                                required={isCustomFood}
                                min={0}
                                value={customFoodCalories}
                                onChange={(e) => setCustomFoodCalories(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-955 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Protein (g)</label>
                              <input
                                type="number"
                                required={isCustomFood}
                                min={0}
                                value={customFoodProtein}
                                onChange={(e) => setCustomFoodProtein(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-955 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Carbs (g)</label>
                              <input
                                type="number"
                                required={isCustomFood}
                                min={0}
                                value={customFoodCarbs}
                                onChange={(e) => setCustomFoodCarbs(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-955 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Fats (g)</label>
                              <input
                                type="number"
                                required={isCustomFood}
                                min={0}
                                value={customFoodFats}
                                onChange={(e) => setCustomFoodFats(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-955 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        className={`w-full py-2.5 rounded text-xs font-mono font-bold uppercase transition cursor-pointer ${activeTheme.accentBtn}`}
                      >
                        Log Food Entry
                      </button>
                    </form>
                  </div>

                  {/* Right: Macro Consumption Tracker & Food History */}
                  <div className="md:col-span-2 p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-base font-bold tracking-wider uppercase">Calorie & Macro Consumption Balance</h3>
                      <p className="text-xs text-zinc-450">Sum of daily consumed food logged against calculated targets.</p>
                    </div>

                    {/* Gauges section */}
                    {nutritionTarget && (
                      <div className="grid sm:grid-cols-4 gap-4">
                        
                        {/* Calories Balance */}
                        <div className="p-4 rounded bg-zinc-950 border border-zinc-850 flex flex-col justify-between">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Calories</span>
                          <div className="mt-2">
                            <span className="text-base font-black text-white">{consumedCalories}</span>
                            <span className="text-[10px] text-zinc-550"> / {nutritionTarget.calories} kcal</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
                            <div 
                              className={`h-full ${consumedCalories > nutritionTarget.calories ? 'bg-rose-500 animate-pulse' : activeTheme.bg}`} 
                              style={{ width: `${Math.min(100, (consumedCalories / nutritionTarget.calories) * 100)}%` }} 
                            />
                          </div>
                          <span className="text-[8px] font-mono text-zinc-600 text-right mt-1">
                            {nutritionTarget.calories > 0 ? Math.round((consumedCalories / nutritionTarget.calories) * 100) : 0}%
                          </span>
                        </div>

                        {/* Protein Balance */}
                        <div className="p-4 rounded bg-zinc-955 border border-zinc-850 flex flex-col justify-between">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest text-rose-400">Protein</span>
                          <div className="mt-2">
                            <span className="text-base font-black text-rose-400">{consumedProtein}g</span>
                            <span className="text-[10px] text-zinc-555"> / {nutritionTarget.protein}g</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (consumedProtein / nutritionTarget.protein) * 100)}%` }} />
                          </div>
                          <span className="text-[8px] font-mono text-zinc-600 text-right mt-1">
                            {nutritionTarget.protein > 0 ? Math.round((consumedProtein / nutritionTarget.protein) * 100) : 0}%
                          </span>
                        </div>

                        {/* Carbs Balance */}
                        <div className="p-4 rounded bg-zinc-955 border border-zinc-850 flex flex-col justify-between">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest text-sky-400">Carbs</span>
                          <div className="mt-2">
                            <span className="text-base font-black text-sky-400">{consumedCarbs}g</span>
                            <span className="text-[10px] text-zinc-555"> / {nutritionTarget.carbs}g</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-sky-400" style={{ width: `${Math.min(100, (consumedCarbs / nutritionTarget.carbs) * 100)}%` }} />
                          </div>
                          <span className="text-[8px] font-mono text-zinc-600 text-right mt-1">
                            {nutritionTarget.carbs > 0 ? Math.round((consumedCarbs / nutritionTarget.carbs) * 100) : 0}%
                          </span>
                        </div>

                        {/* Fats Balance */}
                        <div className="p-4 rounded bg-zinc-955 border border-zinc-850 flex flex-col justify-between">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest text-amber-400">Fats</span>
                          <div className="mt-2">
                            <span className="text-base font-black text-amber-400">{consumedFats}g</span>
                            <span className="text-[10px] text-zinc-555"> / {nutritionTarget.fats}g</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (consumedFats / nutritionTarget.fats) * 100)}%` }} />
                          </div>
                          <span className="text-[8px] font-mono text-zinc-600 text-right mt-1">
                            {nutritionTarget.fats > 0 ? Math.round((consumedFats / nutritionTarget.fats) * 100) : 0}%
                          </span>
                        </div>

                      </div>
                    )}

                    {/* Food list */}
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Daily Consumed Log</h4>
                      
                      {foodLogs.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded">
                          No food records logged for today. Start building your macro buffer!
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                          {foodLogs.map(log => (
                            <div key={log.id} className="p-3 rounded bg-zinc-950 border border-zinc-850 flex items-center justify-between gap-4">
                              <div>
                                <h5 className="text-xs font-bold text-zinc-200">{log.name}</h5>
                                <div className="flex gap-3 text-[9px] font-mono text-zinc-550 mt-0.5">
                                  <span className="text-zinc-400">{log.calories} kcal</span>
                                  <span>P: {log.protein}g</span>
                                  <span>C: {log.carbs}g</span>
                                  <span>F: {log.fats}g</span>
                                  {log.servings !== 1 && <span>Qty: {log.servings}</span>}
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleDeleteFood(log.id)}
                                className="text-[10px] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 p-1 rounded cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 6: OPERATOR CONSOLE */}
            {activeTab === 'admin' && (
              <div className="space-y-6">
                
                {/* Stats row */}
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-zinc-900/20 border border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Active Leads</span>
                      <h4 className="text-xl font-black text-white">{leads.length} leads</h4>
                    </div>
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-900/20 border border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Subscribers</span>
                      <h4 className="text-xl font-black text-white">418 members</h4>
                    </div>
                    <Activity className="w-5 h-5 text-violet-400" />
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-900/20 border border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Current Revenue</span>
                      <h4 className="text-xl font-black text-white">$41,382 /mo</h4>
                    </div>
                    <DollarSign className="w-5 h-5 text-amber-400" />
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-900/20 border border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Server Health</span>
                      <h4 className="text-xl font-black text-white">100%</h4>
                    </div>
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>

                {/* Operations grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Lead registrations */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-base font-bold tracking-wider uppercase">Lead Inquiries CRM Log</h3>
                      <p className="text-xs text-zinc-400">Displays incoming requests captured from our marketing nodes.</p>
                    </div>

                    <div className="space-y-3">
                      {leads.map(lead => (
                        <div key={lead.id} className="p-4 rounded bg-zinc-950 border border-zinc-850 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{lead.name}</h4>
                            <p className="text-[10px] text-zinc-500 font-mono">{lead.email}</p>
                            <span className={`inline-block text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15`}>
                              Goal: {lead.goal}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-550">{lead.date}</span>
                        </div>
                      ))}
                    </div>

                    {/* Form to submit a lead directly */}
                    <div className="pt-4 border-t border-zinc-855 space-y-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">Log Lead / Simulate Client Inquiry</span>
                      
                      <form onSubmit={handleInquirySubmit} className="grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          required
                          placeholder="Client Name"
                          value={newInquiryName}
                          onChange={(e) => setNewInquiryName(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none"
                        />
                        <input 
                          type="email" 
                          required
                          placeholder="Client Email"
                          value={newInquiryEmail}
                          onChange={(e) => setNewInquiryEmail(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none"
                        />
                        <select 
                          value={newInquiryGoal}
                          onChange={(e) => setNewInquiryGoal(e.target.value)}
                          className="col-span-2 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
                        >
                          <option value="Build Muscle">Build Muscle</option>
                          <option value="Weight Deficit">Weight Deficit</option>
                          <option value="Restoration / Flexibility">Restoration / Flexibility</option>
                        </select>
                        <button 
                          type="submit" 
                          className={`col-span-2 py-2 rounded text-xs font-mono font-bold uppercase cursor-pointer ${activeTheme.accentBtn}`}
                        >
                          Simulate Contact Submission
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Pricing adjustment panel */}
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-base font-bold tracking-wider uppercase">Workspace Pricing Manager</h3>
                      <p className="text-xs text-zinc-400">Tweak pricing metrics stored inside database state.</p>
                    </div>

                    <div className="space-y-4">
                      {pricingTiers.map(tier => (
                        <div key={tier.name} className="p-4 rounded bg-zinc-950 border border-zinc-850 flex items-center justify-between gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{tier.name}</h4>
                            <p className="text-[10px] text-zinc-500">Currently: <span className="text-emerald-400 font-bold font-mono">${tier.price}/mo</span></p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={tier.price} 
                              onChange={(e) => handleUpdatePrice(tier.name, parseInt(e.target.value) || 0)}
                              className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-center font-mono font-bold text-emerald-400 focus:outline-none"
                            />
                            <span className="text-xs text-zinc-555">USD</span>
                          </div>
                        </div>
                      ))}
                    </div>


                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-zinc-455 leading-relaxed space-y-1">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider block">CRM Integration Status</span>
                      <p>All values changed in this control deck trigger immediate state updates. The Leads Logger intercepts form requests, logs metadata, and handles persistence securely.</p>
                    </div>
                  </div>

                </div>

                {/* Member Account Manager Panel */}
                <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold tracking-wider uppercase text-white">Graphic Member & Role Manager</h3>
                      <p className="text-xs text-zinc-400">Add, edit, or delete user accounts and control credentials graphically.</p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Add User Form */}
                    <div className="lg:col-span-1 p-4 rounded bg-zinc-950 border border-zinc-850 space-y-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">Register New Account</span>
                      
                      <form onSubmit={handleAddUserAdminSubmit} className="space-y-3">
                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">Full Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Alex Smith"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">Email Address</label>
                          <input 
                            type="email" 
                            required
                            placeholder="alex@domain.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">Password</label>
                          <input 
                            type="text" 
                            required
                            placeholder="123456"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">Membership Tier</label>
                          <select 
                            value={newUserTier}
                            onChange={(e) => setNewUserTier(e.target.value as any)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
                          >
                            <option value="Standard Club">Standard Club</option>
                            <option value="Platinum Elite">Platinum Elite</option>
                            <option value="VIP Coach Pro">VIP Coach Pro</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">System Role</label>
                          <select 
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as any)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
                          >
                            <option value="member">member (Client)</option>
                            <option value="trainer">trainer (Staff)</option>
                            <option value="admin">admin (Operations)</option>
                          </select>
                        </div>

                        <button 
                          type="submit" 
                          className={`w-full py-2 rounded text-xs font-mono font-bold uppercase cursor-pointer ${activeTheme.accentBtn}`}
                        >
                          Register Member Account
                        </button>
                      </form>
                    </div>

                    {/* Users Grid Table */}
                    <div className="lg:col-span-2 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-zinc-850 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                            <th className="py-2.5 px-3">Identity</th>
                            <th className="py-2.5 px-3">Role</th>
                            <th className="py-2.5 px-3">Tier</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {usersList.map(user => {
                            const isEditing = editingUserId === user.id;
                            return (
                              <tr key={user.id} className="hover:bg-zinc-900/10">
                                <td className="py-2.5 px-3">
                                  {isEditing ? (
                                    <div className="space-y-1.5">
                                      <input 
                                        type="text" 
                                        value={editUserName} 
                                        onChange={(e) => setEditUserName(e.target.value)}
                                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                      />
                                      <input 
                                        type="email" 
                                        value={editUserEmail} 
                                        onChange={(e) => setEditUserEmail(e.target.value)}
                                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-400 focus:outline-none block"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <img src={user.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80'} alt="" className="w-7 h-7 rounded-full object-cover border border-zinc-800" />
                                      <div>
                                        <p className="font-bold text-white">{user.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono">{user.email}</p>
                                      </div>
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {isEditing ? (
                                    <select 
                                      value={editUserRole} 
                                      onChange={(e) => setEditUserRole(e.target.value as any)}
                                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                                    >
                                      <option value="member">member</option>
                                      <option value="trainer">trainer</option>
                                      <option value="admin">admin</option>
                                    </select>
                                  ) : (
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                      user.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                      user.role === 'trainer' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                                      'bg-zinc-800 text-zinc-400 border border-zinc-700/35'
                                    }`}>
                                      {user.role}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {isEditing ? (
                                    <select 
                                      value={editUserTier} 
                                      onChange={(e) => setEditUserTier(e.target.value as any)}
                                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                                    >
                                      <option value="Standard Club">Standard Club</option>
                                      <option value="Platinum Elite">Platinum Elite</option>
                                      <option value="VIP Coach Pro">VIP Coach Pro</option>
                                    </select>
                                  ) : (
                                    <span className="text-[10px] font-mono text-zinc-400">{user.tier}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button 
                                        onClick={() => handleSaveUserEdit(user.id)}
                                        className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-bold font-mono cursor-pointer transition"
                                      >
                                        Save
                                      </button>
                                      <button 
                                        onClick={() => setEditingUserId(null)}
                                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 rounded text-[10px] text-zinc-400 font-bold font-mono cursor-pointer transition"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button 
                                        onClick={() => handleStartEditUser(user)}
                                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 rounded text-[10px] text-zinc-300 font-bold font-mono cursor-pointer transition"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="px-2.5 py-1 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/15 rounded text-[10px] text-rose-400 font-bold font-mono cursor-pointer transition"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 7: FEES & PERFORMANCE */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                
                {/* -------------------- MEMBER VIEW -------------------- */}
                {sessionUser.role !== 'admin' && (
                  <div className="space-y-6">
                    {/* Member Stats Grid */}
                    <div className="grid md:grid-cols-3 gap-6">
                      
                      {/* Subscription Fee Card */}
                      <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <CreditCard className="w-24 h-24 text-white" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest block">Active Subscription Plan</span>
                          <h3 className="text-lg font-black text-white mt-1">{sessionUser.tier}</h3>
                        </div>
                        <div className="pt-2 border-t border-zinc-800/60">
                          <p className="text-2xl font-black text-emerald-400 font-mono">
                            {paymentCurrency === 'inr' 
                              ? `₹${Math.round((pricingTiers.find(p => p.name === sessionUser.tier)?.price || 99) * 84)}`
                              : `$${pricingTiers.find(p => p.name === sessionUser.tier)?.price || 99}`
                            }
                            <span className="text-xs text-zinc-500 font-normal font-sans"> / month</span>
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400 mt-2 uppercase tracking-wide">
                            Auto-renews on: <span className="text-white">July 16, 2026</span>
                          </p>
                        </div>
                      </div>

                      {/* Performance Score Card */}
                      {(() => {
                        const score = Math.min(100, Math.round((waterIntake / 3000) * 50 + (streak / 15) * 50));
                        const standing = score >= 85 ? { label: 'Gold Master', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' } :
                                         score >= 60 ? { label: 'Silver Elite', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' } :
                                                       { label: 'Bronze Athlete', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
                        return (
                          <>
                            <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                              <div>
                                <span className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest block">Workout Consistency Score</span>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="relative w-16 h-16 flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/40">
                                    <span className="text-lg font-black text-white font-mono">{score}</span>
                                    <span className="text-[8px] text-zinc-555 font-mono absolute bottom-2">/100</span>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-white">Performant Quotient</h4>
                                    <div className="w-32 bg-zinc-900 h-2 rounded-full overflow-hidden mt-1.5 border border-zinc-800">
                                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${score}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                                <span className="text-zinc-400">Daily Water Target (3L):</span>
                                <span className="font-bold text-white font-mono">{waterIntake}/3000ml</span>
                              </div>
                            </div>

                            {/* Standing Badge Card */}
                            <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                              <div>
                                <span className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest block">Athletic Tier Standing</span>
                                <div className="mt-3 flex flex-col items-start gap-2">
                                  <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-widest ${standing.color}`}>
                                    🏆 {standing.label}
                                  </span>
                                  <p className="text-[11px] text-zinc-450 mt-1 leading-relaxed">
                                    Standing recalculates dynamically based on your hydration compliance and training streak velocity.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                    </div>

                    {/* Coach recommendations box */}
                    <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                          <span>📋</span> Personal Coach Performance Directive
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">AI-driven actionable recommendations compiled from your real-time active metrics.</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-800/50 space-y-2">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 block font-bold">Hydration Analysis</span>
                          {waterIntake < 1500 ? (
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              🚨 <span className="font-bold text-rose-400">HYDRATION HAZARD:</span> Your logs report only <span className="font-mono text-white font-bold">{waterIntake}ml</span>. High metabolic stress requires at least 2,500ml daily to prevent cramping and maintain protein synthesis. Keep logging water!
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              💧 <span className="font-bold text-emerald-400">TARGET COMPLIANT:</span> Excellent job logging <span className="font-mono text-white font-bold">{waterIntake}ml</span>. Cellular volume is fully protected. Keep flushing lactic acid to maintain maximum mechanical output.
                            </p>
                          )}
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-800/50 space-y-2">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-violet-400 block font-bold">Training Streak Velocity</span>
                          {streak < 5 ? (
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              🚨 <span className="font-bold text-amber-400">STREAK COLLAPSE:</span> Your current workout streak is at <span className="font-mono text-white font-bold">{streak} days</span>. Consistency is key to cardiovascular and muscular adaptation. Book a training slot or attend a spin class today to lock in your metrics.
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              ⚡ <span className="font-bold text-violet-400">MOMENTUM ACCELERATION:</span> You are carrying a strong <span className="font-mono text-white font-bold">{streak} day streak</span>. This training density triggers optimal mitochondrial synthesis. Book another recovery flow session to balance workload.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member Transaction History */}
                    <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Paid Fees & Transaction Logs</h3>
                        <p className="text-xs text-zinc-400 mt-1">Audit logs of your processed Stripe checkouts. Cancel bookings below for instant automated refunds.</p>
                      </div>

                      {(() => {
                        const myTxs = transactions.filter(t => t.userId === sessionUser.id);
                        if (myTxs.length === 0) {
                          return (
                            <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                              No transaction logs found for this user account.
                            </div>
                          );
                        }
                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-zinc-850 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                                  <th className="py-3 px-4">Date</th>
                                  <th className="py-3 px-4">Invoice / Item</th>
                                  <th className="py-3 px-4">Amount</th>
                                  <th className="py-3 px-4 text-center">Status</th>
                                  <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-900 text-xs">
                                {myTxs.map(tx => (
                                  <tr key={tx.id} className="hover:bg-zinc-900/10">
                                    <td className="py-3 px-4 font-mono text-zinc-400">{tx.date}</td>
                                    <td className="py-3 px-4 font-bold text-white">{tx.itemName}</td>
                                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                                      {tx.currency === 'inr' ? `₹${tx.amount}` : `$${tx.amount}`}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                        tx.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700/30'
                                      }`}>
                                        {tx.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      {tx.status === 'paid' ? (
                                        <button
                                          onClick={() => {
                                            if (confirm(`Are you sure you want to cancel and refund your booking for: ${tx.itemName}? This will release your reserved slot.`)) {
                                              handleRefundTransaction(tx.id);
                                            }
                                          }}
                                          className="text-[10px] font-mono text-rose-400 hover:text-rose-300 font-bold bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 px-2.5 py-1 rounded cursor-pointer transition"
                                        >
                                          Cancel & Refund
                                        </button>
                                      ) : (
                                        <span className="text-[10px] font-mono text-zinc-650 font-bold">N/A</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* -------------------- ADMIN VIEW -------------------- */}
                {sessionUser.role === 'admin' && (
                  <div className="space-y-6">
                    {/* Revenue Dashboard Overview */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {(() => {
                        const totalUsdPaid = transactions.filter(t => t.status === 'paid' && t.currency === 'usd').reduce((sum, t) => sum + t.amount, 0);
                        const totalInrPaid = transactions.filter(t => t.status === 'paid' && t.currency === 'inr').reduce((sum, t) => sum + t.amount, 0);
                        
                        const totalUsdRefunded = transactions.filter(t => t.status === 'refunded' && t.currency === 'usd').reduce((sum, t) => sum + t.amount, 0);
                        const totalInrRefunded = transactions.filter(t => t.status === 'refunded' && t.currency === 'inr').reduce((sum, t) => sum + t.amount, 0);
                        
                        return (
                          <>
                            {/* Gross Revenue Card */}
                            <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-2">
                              <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block font-bold">Gross Revenue (USD + INR)</span>
                              <div className="space-y-1">
                                <h3 className="text-xl font-black text-white font-mono">${(totalUsdPaid + totalUsdRefunded).toLocaleString()} <span className="text-xs text-zinc-550 font-normal">USD</span></h3>
                                <h3 className="text-lg font-bold text-emerald-400 font-mono">₹{(totalInrPaid + totalInrRefunded).toLocaleString()} <span className="text-xs text-zinc-550 font-normal">INR</span></h3>
                              </div>
                            </div>

                            {/* Refunded Revenue Card */}
                            <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-2">
                              <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block font-bold">Refunded Capital Logs</span>
                              <div className="space-y-1">
                                <h3 className="text-xl font-black text-rose-400 font-mono">${totalUsdRefunded.toLocaleString()} <span className="text-xs text-zinc-550 font-normal">USD</span></h3>
                                <h3 className="text-lg font-bold text-rose-500 font-mono">₹{totalInrRefunded.toLocaleString()} <span className="text-xs text-zinc-550 font-normal">INR</span></h3>
                              </div>
                            </div>

                            {/* Net Revenue Card */}
                            <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-2">
                              <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest block font-bold">Net Revenue Profit</span>
                              <div className="space-y-1">
                                <h3 className="text-xl font-black text-emerald-400 font-mono">${totalUsdPaid.toLocaleString()} <span className="text-xs text-zinc-550 font-normal">USD</span></h3>
                                <h3 className="text-lg font-bold text-teal-400 font-mono">₹{totalInrPaid.toLocaleString()} <span className="text-xs text-zinc-550 font-normal">INR</span></h3>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Member Performance Registry Table */}
                    <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Member Performance Registry</h3>
                        <p className="text-xs text-zinc-400 mt-1">Central audit system to monitor workout consistency, daily hydration logs, and athletic rankings of all active athletes.</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-850 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                              <th className="py-3 px-4">Member Name</th>
                              <th className="py-3 px-4">Active Plan</th>
                              <th className="py-3 px-4">Workout Streak</th>
                              <th className="py-3 px-4">Water Logged</th>
                              <th className="py-3 px-4 text-center">Score</th>
                              <th className="py-3 px-4 text-right">Performance Rank</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 text-xs">
                            {usersList.map(user => {
                              const score = Math.min(100, Math.round((user.waterIntake / 3000) * 50 + (user.streak / 15) * 50));
                              const standing = score >= 85 ? { label: 'Gold Master', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' } :
                                               score >= 60 ? { label: 'Silver Elite', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' } :
                                                             { label: 'Bronze Athlete', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
                              return (
                                <tr key={user.id} className="hover:bg-zinc-900/10">
                                  <td className="py-3 px-4 flex items-center gap-3">
                                    <img src={user.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80'} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-800" />
                                    <div>
                                      <p className="font-bold text-white">{user.name}</p>
                                      <p className="text-[10px] text-zinc-550">{user.email}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">{user.tier}</td>
                                  <td className="py-3 px-4 text-zinc-300">
                                    <span className="font-bold text-amber-500 font-mono">{user.streak} days</span>
                                  </td>
                                  <td className="py-3 px-4 text-zinc-300">
                                    <span className="font-bold text-emerald-400 font-mono">{user.waterIntake} ml</span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="font-black text-white font-mono">{score} / 100</span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${standing.color}`}>
                                      {standing.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Master Transaction Registry Log */}
                    <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/60 shadow-xl space-y-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Master Sales & Transaction Log</h3>
                        <p className="text-xs text-zinc-400 mt-1">Review ledger transactions across all members. Cancel reservations and issue refunds directly using administrative rights.</p>
                      </div>

                      {transactions.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                          No transactions logged on system database.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-850 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                                <th className="py-3 px-4">Tx ID</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">Item Desc</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900 text-xs">
                              {transactions.map(tx => {
                                const matchedUser = usersList.find(u => u.id === tx.userId);
                                return (
                                  <tr key={tx.id} className="hover:bg-zinc-900/10">
                                    <td className="py-3 px-4 font-mono text-[10px] text-zinc-500 truncate max-w-[100px]">{tx.id}</td>
                                    <td className="py-3 px-4">
                                      <p className="font-bold text-white">{matchedUser ? matchedUser.name : 'Unknown Athlete'}</p>
                                      <p className="text-[10px] text-zinc-500">{matchedUser ? matchedUser.email : tx.userId}</p>
                                    </td>
                                    <td className="py-3 px-4 font-bold text-zinc-300">{tx.itemName}</td>
                                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                                      {tx.currency === 'inr' ? `₹${tx.amount}` : `$${tx.amount}`}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-zinc-400">{tx.date}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                        tx.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700/30'
                                      }`}>
                                        {tx.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      {tx.status === 'paid' ? (
                                        <button
                                          onClick={() => {
                                            if (confirm(`ADMIN PRIVILEGE WARNING:\nAre you sure you want to refund transaction ID ${tx.id}? This will reverse the client's spots/reservations and mark invoice status as refunded.`)) {
                                              handleRefundTransaction(tx.id);
                                            }
                                          }}
                                          className="text-[10px] font-mono text-rose-400 hover:text-rose-300 font-bold bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 px-2.5 py-1 rounded cursor-pointer transition"
                                        >
                                          Force Refund
                                        </button>
                                      ) : (
                                        <span className="text-[10px] font-mono text-zinc-650 font-bold">Refunded</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-8 text-center text-zinc-500 text-xs font-semibold mt-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[10px] tracking-wider text-zinc-550 uppercase">GYMHUB WORKSPACE © 2026. SECURE CLOUD-LINKED PLATFORM.</p>
          <div className="flex gap-6 text-[10px] tracking-widest uppercase font-mono text-zinc-500">
            {sessionUser.role === 'admin' ? (
              <>
                <button onClick={() => setActiveTab('admin')} className="hover:text-zinc-350 cursor-pointer">Console</button>
                <button onClick={() => setActiveTab('classes')} className="hover:text-zinc-350 cursor-pointer">Classes</button>
                <button onClick={() => setActiveTab('trainers')} className="hover:text-zinc-350 cursor-pointer">Trainers</button>
                <button onClick={() => setActiveTab('billing')} className="hover:text-zinc-350 cursor-pointer">Fees & Performance</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab('dashboard')} className="hover:text-zinc-350 cursor-pointer">Overview</button>
                <button onClick={() => setActiveTab('classes')} className="hover:text-zinc-350 cursor-pointer">Classes</button>
                <button onClick={() => setActiveTab('trainers')} className="hover:text-zinc-350 cursor-pointer">Trainers</button>
                <button onClick={() => setActiveTab('workouts')} className="hover:text-zinc-350 cursor-pointer">Workouts</button>
                <button onClick={() => setActiveTab('ai-form')} className="hover:text-zinc-350 cursor-pointer">AI Form Check</button>
                <button onClick={() => setActiveTab('billing')} className="hover:text-zinc-350 cursor-pointer">Fees & Performance</button>
              </>
            )}
          </div>
        </div>
      </footer>

    </div>
  )
}
