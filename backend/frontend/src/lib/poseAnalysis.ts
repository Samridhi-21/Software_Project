/**
 * Real, in-browser pose analysis for the AI Form Check tab.
 *
 * Uses MediaPipe's @mediapipe/tasks-vision PoseLandmarker to detect body
 * joints from video frames, then applies simple angle-based rules per
 * exercise to produce a score and plain-English feedback. Everything here
 * runs on-device in the browser — there is no backend involved.
 *
 * Accuracy note: this only looks at 2D joint positions from a single
 * camera, so it can only reason about what's visible on screen (joint
 * angles and body posture). It can't detect things like barbell position
 * or exact weight, and it can't reliably tell forward lean from backward
 * lean when the camera angle isn't known — see the "torso lean" helper
 * below for how that's handled.
 */

import type { NormalizedLandmark, PoseLandmarker } from '@mediapipe/tasks-vision'

// ---------------------------------------------------------------------------
// Model setup
// ---------------------------------------------------------------------------

// Keep the runtime URL aligned with package-lock.json to avoid accidentally
// mixing a newly published WASM binary with the installed TypeScript API.
const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let poseLandmarkerPromise: Promise<PoseLandmarker> | null = null

async function initPoseLandmarker(): Promise<PoseLandmarker> {
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
  let vision
  try {
    vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
  } catch {
    throw new Error('MODEL_LOAD_FAILED')
  }

  // The GPU delegate is faster, but isn't supported in every browser/device - fall back to CPU.
  try {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
    })
  } catch {
    try {
      return await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
    } catch {
      throw new Error('MODEL_LOAD_FAILED')
    }
  }
}

/**
 * Loads the MediaPipe WASM runtime and the pose model, once. Safe to call
 * repeatedly (e.g. to "pre-warm" it as soon as the tab opens) — later calls
 * just reuse the same promise. If loading fails, the next call retries
 * instead of reusing the failure forever.
 */
export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = initPoseLandmarker().catch((err) => {
      poseLandmarkerPromise = null
      throw err
    })
  }
  return poseLandmarkerPromise
}

// ---------------------------------------------------------------------------
// Landmark collection
// ---------------------------------------------------------------------------

// Indices of the MediaPipe pose landmarks we actually need for these five
// exercises. (Full 33-point map: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
export const JOINT_INDEX = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const

export type JointName = keyof typeof JOINT_INDEX
export type FrameJoints = Record<JointName, NormalizedLandmark>

const VISIBILITY_THRESHOLD = 0.5

function isVisible(joint: NormalizedLandmark | undefined): joint is NormalizedLandmark {
  return !!joint && (joint.visibility ?? 0) >= VISIBILITY_THRESHOLD
}

function extractFrameJoints(landmarks: NormalizedLandmark[]): FrameJoints {
  const joints = {} as FrameJoints
  for (const name of Object.keys(JOINT_INDEX) as JointName[]) {
    joints[name] = landmarks[JOINT_INDEX[name]]
  }
  return joints
}

function waitForNextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

/** Minimum number of frames a person needs to be detected in before we trust the result. */
const MIN_DETECTED_FRAMES = 10

export interface CollectPoseFramesOptions {
  /** Called after every processed frame with that frame's joints (or null if no person was found). Handy for drawing a live skeleton overlay. */
  onFrame?: (joints: FrameJoints | null) => void
  /** Checked before each frame — return true to stop collecting early (e.g. once a fixed capture window elapses). */
  shouldStop?: () => boolean
  /** Pause sampling while keeping the camera preview available. */
  shouldPause?: () => boolean
  /** Sample at a bounded rate to avoid saturating lower-powered devices. */
  sampleIntervalMs?: number
}

/**
 * Runs pose detection on `video` frame-by-frame for as long as it's playing
 * (or until `shouldStop` says to stop), collecting the joint positions we
 * care about for every frame a person was detected in.
 */
export async function collectPoseFrames(
  video: HTMLVideoElement,
  options: CollectPoseFramesOptions = {}
): Promise<FrameJoints[]> {
  const landmarker = await getPoseLandmarker()
  const frames: FrameJoints[] = []
  const sampleIntervalMs = Math.max(50, Math.min(500, options.sampleIntervalMs ?? 100))
  let lastSampleAt = -Infinity

  let ended = false
  const onEnded = () => {
    ended = true
  }
  video.addEventListener('ended', onEnded)

  try {
    while (!ended && !options.shouldStop?.()) {
      await waitForNextFrame()
      if (ended || options.shouldStop?.()) break
      if (options.shouldPause?.()) continue
      if (video.paused) break

      const now = performance.now()
      if (now - lastSampleAt < sampleIntervalMs) continue
      lastSampleAt = now

      let result
      try {
        result = landmarker.detectForVideo(video, now)
      } catch {
        throw new Error('POSE_INFERENCE_FAILED')
      }
      const landmarks = result.landmarks[0]

      if (landmarks) {
        const joints = extractFrameJoints(landmarks)
        frames.push(joints)
        options.onFrame?.(joints)
      } else {
        options.onFrame?.(null)
      }
    }
  } finally {
    video.removeEventListener('ended', onEnded)
  }

  if (frames.length < MIN_DETECTED_FRAMES) {
    throw new Error('NO_POSE_DETECTED')
  }

  return frames
}

// ---------------------------------------------------------------------------
// Skeleton overlay (a visual nice-to-have only — not used for scoring)
// ---------------------------------------------------------------------------

const SKELETON_CONNECTIONS: [JointName, JointName][] = [
  ['leftShoulder', 'rightShoulder'],
  ['leftHip', 'rightHip'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
]

/**
 * Draws a simple stick-figure skeleton for one frame onto a canvas (or just
 * clears it if `joints` is null). The canvas's pixel width/height should
 * match the source video's native resolution — CSS handles the display scaling.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  joints: FrameJoints | null,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height)
  if (!joints) return

  ctx.strokeStyle = '#a78bfa'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (const [fromName, toName] of SKELETON_CONNECTIONS) {
    const from = joints[fromName]
    const to = joints[toName]
    if (!isVisible(from) || !isVisible(to)) continue
    ctx.beginPath()
    ctx.moveTo(from.x * width, from.y * height)
    ctx.lineTo(to.x * width, to.y * height)
    ctx.stroke()
  }

  ctx.fillStyle = '#a78bfa'
  for (const name of Object.keys(JOINT_INDEX) as JointName[]) {
    const joint = joints[name]
    if (!isVisible(joint)) continue
    ctx.beginPath()
    ctx.arc(joint.x * width, joint.y * height, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}


export type ExerciseName = 'Bicep Curl' | 'Squat' | 'Lunge' | 'Push-Up' | 'Overhead Press'
