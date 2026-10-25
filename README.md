# Gym Hub — Smart Gym Management System

A premium, full-stack operational core and interactive member dashboard for modern fitness centers, clubs, and personal training coaches.

---

## 🚀 Key Features

* **SaaS CRM Operator Console:**
* <img width="565" height="727" alt="image" src="https://github.com/user-attachments/assets/09077f24-11cc-48c6-accf-ce8192daffd8" />

  - Automated Leads Logger capturing prospect interest forms.
  - <img width="1660" height="997" alt="image" src="https://github.com/user-attachments/assets/d4fc49a7-b2ba-4bdf-a0c6-fe4f0ed5cb88" />

  - Workspace pricing tier updates.
  - Graphical User & Role Manager (register new accounts, edit tiers/roles inline, delete user accounts with full database cleanup cascade).
* **Premium Client Dashboard:**
* <img width="1699" height="1018" alt="image" src="https://github.com/user-attachments/assets/7436157e-6f88-455a-9877-df250c7b3884" />

  - Interactive group fitness class booking (Spin, Powerlifting, Yoga).
  - 
  - 1-on-1 private coach reservation calendar.
  - <img width="1648" height="973" alt="image" src="https://github.com/user-attachments/assets/20dc0657-bae6-45e9-a9aa-d388d8f2579f" />

  - Hydration tracker & streak scoring metrics.
  - <img width="1617" height="859" alt="image" src="https://github.com/user-attachments/assets/31d97c0a-81e8-48bc-92c8-e13fca93e14f" />

  - Workout logging utility.
  - <img width="1662" height="922" alt="image" src="https://github.com/user-attachments/assets/b3bb3f5b-c1a4-44b7-988d-4c93d3403d4d" />

* **Backend Security:** Native JWT Authentication with token signature checks.
* <img width="1693" height="949" alt="image" src="https://github.com/user-attachments/assets/04efceb9-bb48-47df-9388-a901f61f0099" />

* **Cloud Database Integration:** PostgreSQL (Supabase) with seamless migration queries, falling back to local JSON files automatically during offline development.
* <img width="1669" height="886" alt="image" src="https://github.com/user-attachments/assets/b0d4682c-b4e6-439c-864a-a5b064862255" />

* **Stripe Payments:** Dynamic Checkout sessions handling class registrations, slots reservation, and receipts.
* <img width="1660" height="939" alt="image" src="https://github.com/user-attachments/assets/d5e4fc29-932b-49a4-8e7d-0390e8c8baa3" />

* **Automated Operational Emails:** Dispatches welcome letters, invoice confirmations, and contact thank-you messages.
* 
* **AI Form Check:** Browser-side MediaPipe Pose Landmarker analysis for bicep curls, squats, lunges, push-ups, and overhead presses. Webcam frames and selected video files are analyzed on-device; raw footage is not sent to the API.

### AI Form Check deployment notes

The frontend loads MediaPipe Tasks Vision 1.0.1 WASM files from jsDelivr and the documented `pose_landmarker_lite/float16/1` model from Google Cloud Storage. Production Content Security Policy and network rules must permit those asset hosts, or deployments can mirror the version-pinned assets locally. The model and WASM runtime are downloaded by the browser; reports store derived metrics and feedback only.

The score averages two exercise-specific metric scores. Each score is calculated on a 0–50 scale using the configurable thresholds in `frontend/src/lib/exerciseEvaluation.ts`; the form status is Good Form at 80 or above. Clips with no clear movement are capped below that status, and repetitions count only a complete threshold-crossing and return cycle. Knee tracking is not scored because a single 2D camera cannot reliably separate sideways knee drift from forward/backward depth without a known camera plane. Camera perspective and occlusion also limit torso and joint-angle estimates. Scores are not medical advice or a guarantee of injury prevention. Reports require an authenticated Gym Hub API and are persisted in the configured PostgreSQL database or the existing server-side JSON fallback.

Uploaded videos are limited to 250 MB and five minutes. The browser analyzes them locally and sends only bounded metrics, score, feedback, model metadata, and duration to the API.

---

## 📂 Project Structure

The client is a Vite, React 19, and TypeScript application in `backend/frontend/`. The Next.js 16.2.9 server in `backend/` owns the Gym Hub API and serves the built client from `backend/public/gym-app/`.

---

## 🛠️ Local Development Setup

### 1. Backend Server Setup
1. Open your terminal in the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env.local` file inside `backend/` with the following variables:
   ```env
   DATABASE_URL="your_supabase_postgresql_connection_string"
   JWT_SECRET="your_secure_random_jwt_secret"
   STRIPE_SECRET_KEY="your_stripe_test_secret_key"
   ```
3. Run the backend development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Client Setup
1. From a separate terminal in the repository root, install the Vite client dependencies:
   ```bash
   npm --prefix backend/frontend install
   ```
2. Run the client development server:
   ```bash
   npm --prefix backend/frontend run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser. The development client connects to the Next.js API at `http://localhost:3000`.

### Production build and checks

From `backend/`, `npm run build` first builds the Vite client into `public/gym-app/`, then builds the Next.js server. Run `npm --prefix frontend run test` and `npm test` for the pose-evaluation and report-validation unit tests. Run `npm --prefix frontend run lint` and `npm run lint` for linting.
