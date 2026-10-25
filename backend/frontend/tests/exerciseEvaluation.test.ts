import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateExercise } from '../src/lib/exerciseEvaluation.ts'
import type { FrameJoints, JointName } from '../src/lib/poseAnalysis.ts'

function landmark(x: number, y: number, visibility = 0.99) {
  return { x, y, z: 0, visibility, presence: visibility }
}

function frameFor(elbowAngle: number, kneeAngle = 170): FrameJoints {
  const elbowRadians = elbowAngle * Math.PI / 180
  const kneeRadians = (180 - kneeAngle) * Math.PI / 180
  const visible = {
    leftShoulder: landmark(0.5, 0.3),
    leftElbow: landmark(0.5, 0.45),
    leftWrist: landmark(0.5 + Math.sin(elbowRadians) * 0.2, 0.45 - Math.cos(elbowRadians) * 0.2),
    leftHip: landmark(0.5, 0.6),
    leftKnee: landmark(0.5, 0.8),
    leftAnkle: landmark(0.5 + Math.sin(kneeRadians) * 0.15, 0.8 + Math.cos(kneeRadians) * 0.15),
  }
  const joints = {} as Record<JointName, ReturnType<typeof landmark>>
  for (const name of [
    'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist',
    'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle',
  ] as JointName[]) joints[name] = landmark(0.5, 0.5, 0.1)
  Object.assign(joints, visible)
  return joints as FrameJoints
}

test('bicep curl analysis counts a complete bend-and-return repetition deterministically', () => {
  const frames = [160, 125, 80, 55, 72, 112, 150, 160].map((angle) => frameFor(angle))
  const first = evaluateExercise(frames, 'Bicep Curl')
  const second = evaluateExercise(frames, 'Bicep Curl')

  assert.equal(first.repetitions, 1)
  assert.deepEqual(first, second)
  assert.equal(first.status, 'Good Form')
  assert.ok(first.score >= 0 && first.score <= 100)
  assert.equal(first.metrics.elbowFlexionDeg, 55)
})

test('analysis rejects low-confidence landmarks instead of returning a misleading score', () => {
  const frames = [160, 90, 55, 90, 160, 160, 150].map((angle) => frameFor(angle))
  for (const frame of frames) {
    frame.leftElbow.visibility = 0.1
    frame.leftWrist.visibility = 0.1
  }

  assert.throws(() => evaluateExercise(frames, 'Bicep Curl'), /UNRELIABLE_POSE/)
})

test('push-up evaluation uses elbow depth and shoulder–hip–knee alignment', () => {
  const frames = [165, 140, 105, 80, 105, 140, 165, 165].map((angle) => frameFor(angle))
  const result = evaluateExercise(frames, 'Push-Up')

  assert.equal(result.repetitions, 1)
  assert.ok(result.metrics.hipAlignmentDeg >= 165)
  assert.equal(result.status, 'Good Form')
})

test('static footage is reported as lacking clear movement', () => {
  const result = evaluateExercise(Array.from({ length: 8 }, () => frameFor(160)), 'Overhead Press')
  assert.equal(result.repetitions, 0)
  assert.equal(result.status, 'Needs Improvement')
  assert.ok(result.issues.some((issue) => issue.includes('No clear exercise movement')))
})

