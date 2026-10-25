import type { ExerciseName, FrameJoints, JointName } from './poseAnalysis'

export const FORM_THRESHOLDS = {
  visibility: 0.5,
  minimumMetricCoverage: 0.6,
  minimumMovementDegrees: 25,
  scoreGoodForm: 80,
  bicepCurl: { peakElbow: 60, incompleteElbow: 120, armSwingGood: 15, armSwingPoor: 45, restElbow: 145 },
  squat: { bottomKnee: 95, shallowKnee: 150, leanGood: 15, leanPoor: 45, standingKnee: 150 },
  lunge: { bottomKnee: 95, shallowKnee: 150, leanGood: 15, leanPoor: 40, standingKnee: 150 },
  pushUp: { bottomElbow: 85, shallowElbow: 150, alignmentGood: 165, alignmentPoor: 135, topElbow: 150 },
  overheadPress: { topElbow: 165, shortElbow: 120, leanGood: 10, leanPoor: 30, bottomElbow: 110 },
} as const

export interface ExerciseEvaluation {
  score: number
  status: 'Good Form' | 'Needs Improvement'
  feedback: string[]
  issues: string[]
  metrics: Record<string, number>
  repetitions: number
  detectedFrames: number
  reliable: true
}

type Side = 'left' | 'right'
type Point = { x: number; y: number }

function visible(frame: FrameJoints, name: JointName): boolean {
  const joint = frame[name]
  const confidence = joint?.visibility ?? (joint as typeof joint & { presence?: number } | undefined)?.presence ?? 0
  return !!joint && Number.isFinite(joint.x) && Number.isFinite(joint.y) && confidence >= FORM_THRESHOLDS.visibility
}

function angleAt(a: Point, b: Point, c: Point): number | null {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const scale = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y)
  if (scale < 1e-8) return null
  const cosine = (ab.x * cb.x + ab.y * cb.y) / scale
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI
}

function jointAngle(frame: FrameJoints, a: JointName, b: JointName, c: JointName): number | null {
  if (![a, b, c].every((name) => visible(frame, name))) return null
  const first = frame[a]
  const vertex = frame[b]
  const last = frame[c]
  return angleAt(first, vertex, last)
}

function sideAngle(frame: FrameJoints, side: Side, joint: 'elbow' | 'knee' | 'shoulder'): number | null {
  if (joint === 'elbow') return jointAngle(frame, `${side}Shoulder`, `${side}Elbow`, `${side}Wrist`)
  if (joint === 'knee') return jointAngle(frame, `${side}Hip`, `${side}Knee`, `${side}Ankle`)
  return jointAngle(frame, `${side}Hip`, `${side}Shoulder`, `${side}Elbow`)
}

function combinedSideAngle(frame: FrameJoints, joint: 'elbow' | 'knee', choose: 'min' | 'max'): number | null {
  const left = sideAngle(frame, 'left', joint)
  const right = sideAngle(frame, 'right', joint)
  if (left === null) return right
  if (right === null) return left
  return choose === 'min' ? Math.min(left, right) : Math.max(left, right)
}

function torsoLean(frame: FrameJoints): number | null {
  const shoulder = midpoint(frame, 'leftShoulder', 'rightShoulder')
  const hip = midpoint(frame, 'leftHip', 'rightHip')
  if (!shoulder || !hip) return null
  const dx = shoulder.x - hip.x
  const dy = hip.y - shoulder.y
  if (Math.hypot(dx, dy) < 1e-8) return null
  return Math.acos(Math.max(-1, Math.min(1, dy / Math.hypot(dx, dy)))) * 180 / Math.PI
}

function midpoint(frame: FrameJoints, left: JointName, right: JointName): Point | null {
  const l = visible(frame, left) ? frame[left] : null
  const r = visible(frame, right) ? frame[right] : null
  if (l && r) return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 }
  if (l) return { x: l.x, y: l.y }
  if (r) return { x: r.x, y: r.y }
  return null
}

function hipAlignment(frame: FrameJoints): number | null {
  const shoulder = midpoint(frame, 'leftShoulder', 'rightShoulder')
  const hip = midpoint(frame, 'leftHip', 'rightHip')
  const knee = midpoint(frame, 'leftKnee', 'rightKnee')
  if (!shoulder || !hip || !knee) return null
  return angleAt(shoulder, hip, knee)
}

function collectMetric(frames: FrameJoints[], valueAt: (frame: FrameJoints) => number | null): number[] {
  return frames.map(valueAt).filter((value): value is number => value !== null && Number.isFinite(value))
}

function requireCoverage(name: string, values: number[], frameCount: number): void {
  if (values.length < Math.max(5, Math.ceil(frameCount * FORM_THRESHOLDS.minimumMetricCoverage))) {
    throw new Error(`UNRELIABLE_POSE:${name}`)
  }
}

function minimum(values: number[]): number {
  return Math.min(...values)
}

function maximum(values: number[]): number {
  return Math.max(...values)
}

function lowerIsBetter(value: number, good: number, poor: number): number {
  if (value <= good) return 50
  if (value >= poor) return 0
  return 50 * (poor - value) / (poor - good)
}

function higherIsBetter(value: number, good: number, poor: number): number {
  if (value >= good) return 50
  if (value <= poor) return 0
  return 50 * (value - poor) / (good - poor)
}

function countRepetitions(values: number[], startAt: number, bottomAt: number, startHigh: boolean): number {
  let reachedStart = false
  let reachedBottom = false
  let repetitions = 0
  for (const value of values) {
    const atStart = startHigh ? value >= startAt : value <= startAt
    const atBottom = startHigh ? value <= bottomAt : value >= bottomAt
    if (!reachedStart && atStart) reachedStart = true
    if (reachedStart && atBottom) reachedBottom = true
    if (reachedBottom && atStart) {
      repetitions += 1
      reachedBottom = false
    }
  }
  return repetitions
}

function scoreResult(
  first: number,
  second: number,
  positiveFirst: string,
  correctiveFirst: string,
  positiveSecond: string,
  correctiveSecond: string,
  metrics: Record<string, number>,
  repetitions: number,
  detectedFrames: number,
  movementRange: number,
): ExerciseEvaluation {
  const score = Math.max(0, Math.min(100, Math.round(first + second)))
  const issues: string[] = []
  const feedback: string[] = []
  if (first < 30) { issues.push(correctiveFirst); feedback.push(correctiveFirst) } else feedback.push(positiveFirst)
  if (second < 30) { issues.push(correctiveSecond); feedback.push(correctiveSecond) } else feedback.push(positiveSecond)
  if (movementRange < FORM_THRESHOLDS.minimumMovementDegrees) {
    const issue = 'No clear exercise movement was captured. Keep the selected joints visible and complete a full repetition for a more useful assessment.'
    issues.push(issue)
    feedback.push(issue)
  } else if (repetitions === 0) {
    feedback.push('No complete repetition was counted in this clip; repetition counting uses the selected exercise angle thresholds and full return phase.')
  }
  feedback.push('Single-camera pose guidance is limited by camera angle, perspective, clothing, and joint visibility. This is form guidance, not medical advice or a guarantee of injury prevention.')
  return {
    score: movementRange < FORM_THRESHOLDS.minimumMovementDegrees ? Math.min(score, 79) : score,
    status: movementRange >= FORM_THRESHOLDS.minimumMovementDegrees && score >= FORM_THRESHOLDS.scoreGoodForm ? 'Good Form' : 'Needs Improvement',
    feedback,
    issues,
    metrics: Object.fromEntries(Object.entries(metrics).map(([name, value]) => [name, Math.round(value * 10) / 10])),
    repetitions,
    detectedFrames,
    reliable: true,
  }
}

export function evaluateExercise(frames: FrameJoints[], exercise: ExerciseName): ExerciseEvaluation {
  if (frames.length < 5) throw new Error('UNRELIABLE_POSE:too few detected frames')

  if (exercise === 'Bicep Curl') {
    const left = collectMetric(frames, (frame) => sideAngle(frame, 'left', 'elbow'))
    const right = collectMetric(frames, (frame) => sideAngle(frame, 'right', 'elbow'))
    const workingSide: Side = (minimum(right) ?? Infinity) < (minimum(left) ?? Infinity) ? 'right' : 'left'
    const elbowValues = collectMetric(frames, (frame) => sideAngle(frame, workingSide, 'elbow'))
    const swingValues = collectMetric(frames, (frame) => sideAngle(frame, workingSide, 'shoulder'))
    requireCoverage('elbow', elbowValues, frames.length)
    requireCoverage('upper arm', swingValues, frames.length)
    const peak = minimum(elbowValues)
    const swing = maximum(swingValues) - minimum(swingValues)
    return scoreResult(lowerIsBetter(peak, FORM_THRESHOLDS.bicepCurl.peakElbow, FORM_THRESHOLDS.bicepCurl.incompleteElbow),
      lowerIsBetter(swing, FORM_THRESHOLDS.bicepCurl.armSwingGood, FORM_THRESHOLDS.bicepCurl.armSwingPoor),
      'Your elbow reached a useful curl depth.', 'Curl through a fuller range and bring the forearm closer to the shoulder.',
      'Your upper arm stayed relatively steady.', 'Keep the upper arm beside your torso; visible elbow swing can indicate momentum.',
      { elbowFlexionDeg: peak, shoulderSwingDeg: swing }, countRepetitions(elbowValues, FORM_THRESHOLDS.bicepCurl.restElbow, FORM_THRESHOLDS.bicepCurl.peakElbow, true), frames.length, maximum(elbowValues) - peak)
  }

  if (exercise === 'Squat' || exercise === 'Lunge') {
    const kneeValues = collectMetric(frames, (frame) => combinedSideAngle(frame, 'knee', 'min'))
    const leanValues = collectMetric(frames, torsoLean)
    requireCoverage('knee', kneeValues, frames.length)
    requireCoverage('torso', leanValues, frames.length)
    const thresholds = exercise === 'Squat' ? FORM_THRESHOLDS.squat : FORM_THRESHOLDS.lunge
    const bottomKnee = minimum(kneeValues)
    const maxLean = maximum(leanValues)
    const depthText = exercise === 'Squat' ? 'your hips toward knee level' : 'the front thigh closer to parallel with the floor'
    return scoreResult(lowerIsBetter(bottomKnee, thresholds.bottomKnee, thresholds.shallowKnee),
      lowerIsBetter(maxLean, thresholds.leanGood, thresholds.leanPoor),
      `Good ${exercise.toLowerCase()} depth was visible.`, `Try to lower further and bring ${depthText}.`,
      'Your torso angle stayed within the configured guidance range.', 'Keep your torso more upright; the side-view torso angle is only a rough screen-space estimate.',
      { kneeFlexionDeg: bottomKnee, torsoLeanDeg: maxLean }, countRepetitions(kneeValues, thresholds.standingKnee, thresholds.bottomKnee + 15, true), frames.length, maximum(kneeValues) - bottomKnee)
  }

  if (exercise === 'Push-Up') {
    const elbowValues = collectMetric(frames, (frame) => combinedSideAngle(frame, 'elbow', 'min'))
    const alignmentValues = collectMetric(frames, hipAlignment)
    requireCoverage('elbow', elbowValues, frames.length)
    requireCoverage('hip alignment', alignmentValues, frames.length)
    const bottomElbow = minimum(elbowValues)
    const lowestAlignment = minimum(alignmentValues)
    return scoreResult(lowerIsBetter(bottomElbow, FORM_THRESHOLDS.pushUp.bottomElbow, FORM_THRESHOLDS.pushUp.shallowElbow),
      higherIsBetter(lowestAlignment, FORM_THRESHOLDS.pushUp.alignmentGood, FORM_THRESHOLDS.pushUp.alignmentPoor),
      'Your elbows reached a useful bend.', 'Lower a little further with control, if comfortable, to reach more depth.',
      'Your shoulder–hip–knee line remained close to straight.', 'Keep the visible shoulder, hip, and knee points aligned; camera perspective can make this estimate inaccurate.',
      { elbowFlexionDeg: bottomElbow, hipAlignmentDeg: lowestAlignment }, countRepetitions(elbowValues, FORM_THRESHOLDS.pushUp.topElbow, FORM_THRESHOLDS.pushUp.bottomElbow + 10, true), frames.length, maximum(elbowValues) - bottomElbow)
  }

  const elbowValues = collectMetric(frames, (frame) => combinedSideAngle(frame, 'elbow', 'max'))
  const leanValues = collectMetric(frames, torsoLean)
  requireCoverage('elbow', elbowValues, frames.length)
  requireCoverage('torso', leanValues, frames.length)
  const topElbow = maximum(elbowValues)
  const maxLean = maximum(leanValues)
  return scoreResult(higherIsBetter(topElbow, FORM_THRESHOLDS.overheadPress.topElbow, FORM_THRESHOLDS.overheadPress.shortElbow),
    lowerIsBetter(maxLean, FORM_THRESHOLDS.overheadPress.leanGood, FORM_THRESHOLDS.overheadPress.leanPoor),
    'Your arms reached near-full extension overhead.', 'Press toward a comfortable full extension; the detected elbow angle stopped short of the configured range.',
    'Your torso stayed within the configured lean range.', 'Brace your trunk and avoid pronounced torso lean; this single-camera angle cannot determine lean direction.',
    { elbowFlexionDeg: topElbow, torsoLeanDeg: maxLean }, countRepetitions(elbowValues, FORM_THRESHOLDS.overheadPress.bottomElbow, FORM_THRESHOLDS.overheadPress.topElbow, false), frames.length, topElbow - minimum(elbowValues))
}
