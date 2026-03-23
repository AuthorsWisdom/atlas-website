'use client'

const ITEMS = [
  { symbol: 'SPY', value: '+2.14%', up: true },
  { symbol: 'QQQ', value: '-0.87%', up: false },
  { symbol: 'NVDA', value: '+4.32%', up: true },
  { symbol: 'AAPL', value: '+0.61%', up: true },
  { symbol: 'TSLA', value: '-1.44%', up: false },
  { symbol: 'AMD', value: '+3.08%', up: true },
  { symbol: 'META', value: '+1.91%', up: true },
  { symbol: 'GLD', value: '-0.22%', up: false },
  { symbol: 'REGIME', value: 'RISK-ON', up: true },
  { symbol: 'CONVICTION', value: '82/100', up: true },
]

const DOUBLED = [...ITEMS, ...ITEMS]

export default function Ticker() {
  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      background: 'var(--bg-1)',
    }}>
      <div style={{
        display: 'flex',
        animation: 'ticker 30s linear infinite',
        width: 'max-content',
      }}>
        {DOUBLED.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 2rem',
            borderRight: '1px solid var(--border)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-2)',
              letterSpacing: '0.08em',
            }}>
              {item.symbol}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 500,
              color: item.up ? 'var(--green)' : 'var(--red)',
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
