/** Foreground stalls count in full. Visibility changes start a fresh frame baseline. */
export function createPlaybackTimer() {
  let previous: number | undefined
  return {
    reset() { previous = undefined },
    elapsed(now: number, visible: boolean) {
      if (!visible) { previous = undefined; return 0 }
      const seconds = previous === undefined ? 0 : Math.max(0, (now - previous) / 1000)
      previous = now
      return seconds
    },
  }
}

export function advancePlaybackTime(time: number, elapsed: number, rate: number, start: number, end: number) {
  const next = time + elapsed * rate
  return next > end ? start + (next - start) % (end - start) : next
}
