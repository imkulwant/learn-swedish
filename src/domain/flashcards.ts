/**
 * The items in a random order (Fisher–Yates), as a new array. `random` returns
 * a number from 0 up to, but not including, 1, so a test can fix the order.
 */
export function shuffled<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}
