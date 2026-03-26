// Technical indicators computed client-side from OHLCV data

export function computeSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += closes[j]
    return sum / period
  })
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const result: number[] = [values[0]]
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k))
  }
  return result
}

export function computeRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = []
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { result.push(null); continue }
    const change = closes[i] - closes[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? -change : 0)

    if (i < period) { result.push(null); continue }

    if (i === period) {
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push(100 - 100 / (1 + rs))
    } else {
      const prevRsi = result[i - 1] ?? 50
      const prevAvgGain = (100 / (100 - prevRsi) - 1) > 0
        ? gains.slice(i - period, i - 1).reduce((a, b) => a + b, 0) / period
        : 0
      const avgGain = (prevAvgGain * (period - 1) + gains[i - 1]) / period
      const prevAvgLoss = losses.slice(i - period, i - 1).reduce((a, b) => a + b, 0) / period
      const avgLoss = (prevAvgLoss * (period - 1) + losses[i - 1]) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push(100 - 100 / (1 + rs))
    }
  }
  return result
}

export function computeMACD(closes: number[]): {
  macd: (number | null)[]
  signal: (number | null)[]
  histogram: (number | null)[]
} {
  if (closes.length < 26) {
    const n = closes.length
    return { macd: Array(n).fill(null), signal: Array(n).fill(null), histogram: Array(n).fill(null) }
  }
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const macdLine = ema12.map((v, i) => i < 25 ? null : v - ema26[i])
  const macdValues = macdLine.filter((v): v is number => v !== null)
  const signalLine = ema(macdValues, 9)

  const signal: (number | null)[] = Array(closes.length - macdValues.length).fill(null)
  const histogram: (number | null)[] = Array(closes.length - macdValues.length).fill(null)

  let si = 0
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] !== null) {
      if (si < 8) {
        signal.push(null)
        histogram.push(null)
      } else {
        signal.push(signalLine[si])
        histogram.push((macdLine[i] as number) - signalLine[si])
      }
      si++
    }
  }

  return { macd: macdLine, signal, histogram }
}

export function computeBollingerBands(closes: number[], period = 20, stdDev = 2): {
  upper: (number | null)[]
  middle: (number | null)[]
  lower: (number | null)[]
} {
  const upper: (number | null)[] = []
  const middle: (number | null)[] = []
  const lower: (number | null)[] = []

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(null); middle.push(null); lower.push(null)
      continue
    }
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period
    const sd = Math.sqrt(variance)
    middle.push(mean)
    upper.push(mean + stdDev * sd)
    lower.push(mean - stdDev * sd)
  }

  return { upper, middle, lower }
}
