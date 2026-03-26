import { NextRequest, NextResponse } from 'next/server'

const BINANCE_MAP: Record<string, string> = {
  BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', XRP: 'XRPUSDT',
  DOGE: 'DOGEUSDT', ADA: 'ADAUSDT', AVAX: 'AVAXUSDT', LINK: 'LINKUSDT',
  BNB: 'BNBUSDT', MATIC: 'MATICUSDT', LTC: 'LTCUSDT', DOT: 'DOTUSDT',
  UNI: 'UNIUSDT', ATOM: 'ATOMUSDT', APT: 'APTUSDT', ARB: 'ARBUSDT',
  NEAR: 'NEARUSDT', OP: 'OPUSDT', SHIB: 'SHIBUSDT', FIL: 'FILUSDT',
}

const INTERVAL_MAP: Record<string, { interval: string; limit: number }> = {
  '1D': { interval: '5m', limit: 288 },
  '1W': { interval: '1h', limit: 168 },
  '1M': { interval: '1d', limit: 30 },
  '3M': { interval: '1d', limit: 90 },
  '1Y': { interval: '1d', limit: 365 },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()
  const binanceSym = BINANCE_MAP[sym] ?? `${sym}USDT`
  const timeframe = request.nextUrl.searchParams.get('timeframe')

  // Chart data
  if (timeframe) {
    const { interval, limit } = INTERVAL_MAP[timeframe] ?? INTERVAL_MAP['1M']
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=${interval}&limit=${limit}`,
      )
      if (!res.ok) return NextResponse.json({ bars: [] })
      const candles = await res.json()
      return NextResponse.json({
        symbol: sym, type: 'crypto',
        bars: candles.map((c: string[]) => ({
          time: Math.floor(Number(c[0]) / 1000),
          open: parseFloat(c[1]), high: parseFloat(c[2]),
          low: parseFloat(c[3]), close: parseFloat(c[4]),
          volume: parseFloat(c[5]),
        })),
      })
    } catch {
      return NextResponse.json({ bars: [] })
    }
  }

  // Quote data
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSym}`)
    if (!res.ok) return NextResponse.json({ error: 'Ticker not found' }, { status: 404 })
    const data = await res.json()
    return NextResponse.json({
      symbol: sym,
      price: parseFloat(data.lastPrice),
      change_percent: parseFloat(data.priceChangePercent),
      volume: parseFloat(data.volume),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      type: 'crypto',
      conviction: 0,
      squeeze_score: 0, options_flow_score: 0, macro_score: 0,
      factors: [], regime: '', vix: null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 502 })
  }
}
