import test from 'node:test'
import assert from 'node:assert/strict'
import { advancePlaybackTime, createPlaybackTimer } from '../src/playback-clock.ts'

test('foreground stalls advance the full elapsed time, independent of frame cadence', () => {
  const timer = createPlaybackTimer()
  assert.equal(timer.elapsed(0, true), 0)
  assert.equal(timer.elapsed(300, true), 0.3)
  assert.equal(advancePlaybackTime(28800, 0.3, 30, 25200, 32400), 28809)
  const slow = advancePlaybackTime(28800, timer.elapsed(1300, true), 30, 25200, 32400)
  let frequent = 28800
  for (let i = 0; i < 10; i++) frequent = advancePlaybackTime(frequent, 0.1, 30, 25200, 32400)
  assert.equal(slow, frequent)
})

test('hidden frames and visibility changes exclude background time', () => {
  const timer = createPlaybackTimer()
  timer.elapsed(100, true)
  assert.equal(timer.elapsed(1100, false), 0)
  assert.equal(timer.elapsed(61000, true), 0)
  assert.equal(timer.elapsed(61300, true), 0.3)
  // A browser may suspend all callbacks while hidden: visibility events still reset it.
  timer.reset()
  assert.equal(timer.elapsed(120000, true), 0)
  assert.equal(timer.elapsed(120500, true), 0.5)
})

test('playback wraps across one or multiple complete study windows', () => {
  assert.equal(advancePlaybackTime(99, 0.3, 10, 0, 100), 2)
  assert.equal(advancePlaybackTime(99, 30.3, 10, 0, 100), 2)
  assert.equal(advancePlaybackTime(90, 1, 10, 0, 100), 100)
  assert.equal(advancePlaybackTime(100, 0, 10, 0, 100), 100)
})
