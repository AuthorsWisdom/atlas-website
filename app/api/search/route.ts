import { NextRequest, NextResponse } from 'next/server'

const POLYGON_KEY = process.env.POLYGON_API_KEY

// Fallback local data when Polygon isn't configured
const LOCAL_TICKERS = [
  { symbol: 'AAPL', name: 'Apple', type: 'CS' }, { symbol: 'MSFT', name: 'Microsoft', type: 'CS' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'CS' }, { symbol: 'AMZN', name: 'Amazon', type: 'CS' },
  { symbol: 'GOOGL', name: 'Alphabet', type: 'CS' }, { symbol: 'META', name: 'Meta Platforms', type: 'CS' },
  { symbol: 'TSLA', name: 'Tesla', type: 'CS' }, { symbol: 'JPM', name: 'JPMorgan Chase', type: 'CS' },
  { symbol: 'V', name: 'Visa', type: 'CS' }, { symbol: 'UNH', name: 'UnitedHealth Group', type: 'CS' },
  { symbol: 'XOM', name: 'ExxonMobil', type: 'CS' }, { symbol: 'LLY', name: 'Eli Lilly', type: 'CS' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'CS' }, { symbol: 'WMT', name: 'Walmart', type: 'CS' },
  { symbol: 'MA', name: 'Mastercard', type: 'CS' }, { symbol: 'AVGO', name: 'Broadcom', type: 'CS' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'CS' }, { symbol: 'HD', name: 'Home Depot', type: 'CS' },
  { symbol: 'CVX', name: 'Chevron', type: 'CS' }, { symbol: 'MRK', name: 'Merck', type: 'CS' },
  { symbol: 'ABBV', name: 'AbbVie', type: 'CS' }, { symbol: 'COST', name: 'Costco', type: 'CS' },
  { symbol: 'PEP', name: 'PepsiCo', type: 'CS' }, { symbol: 'KO', name: 'Coca-Cola', type: 'CS' },
  { symbol: 'ADBE', name: 'Adobe', type: 'CS' }, { symbol: 'CSCO', name: 'Cisco', type: 'CS' },
  { symbol: 'CRM', name: 'Salesforce', type: 'CS' }, { symbol: 'NFLX', name: 'Netflix', type: 'CS' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'CS' }, { symbol: 'QCOM', name: 'Qualcomm', type: 'CS' },
  { symbol: 'TXN', name: 'Texas Instruments', type: 'CS' }, { symbol: 'AMGN', name: 'Amgen', type: 'CS' },
  { symbol: 'INTU', name: 'Intuit', type: 'CS' }, { symbol: 'SBUX', name: 'Starbucks', type: 'CS' },
  { symbol: 'GE', name: 'GE Aerospace', type: 'CS' }, { symbol: 'CAT', name: 'Caterpillar', type: 'CS' },
  { symbol: 'IBM', name: 'IBM', type: 'CS' }, { symbol: 'GILD', name: 'Gilead Sciences', type: 'CS' },
  { symbol: 'BKNG', name: 'Booking Holdings', type: 'CS' }, { symbol: 'BAC', name: 'Bank of America', type: 'CS' },
  { symbol: 'WFC', name: 'Wells Fargo', type: 'CS' }, { symbol: 'GS', name: 'Goldman Sachs', type: 'CS' },
  { symbol: 'MS', name: 'Morgan Stanley', type: 'CS' }, { symbol: 'BLK', name: 'BlackRock', type: 'CS' },
  { symbol: 'PLTR', name: 'Palantir', type: 'CS' }, { symbol: 'SOFI', name: 'SoFi Technologies', type: 'CS' },
  { symbol: 'GME', name: 'GameStop', type: 'CS' }, { symbol: 'AMC', name: 'AMC Entertainment', type: 'CS' },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'ETF' }, { symbol: 'QQQ', name: 'Nasdaq 100 ETF', type: 'ETF' },
  { symbol: 'IWM', name: 'Russell 2000 ETF', type: 'ETF' }, { symbol: 'GLD', name: 'Gold ETF', type: 'ETF' },
  { symbol: 'SLV', name: 'Silver ETF', type: 'ETF' }, { symbol: 'DIA', name: 'Dow Jones ETF', type: 'ETF' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR', type: 'ETF' }, { symbol: 'XLF', name: 'Financial Select Sector SPDR', type: 'ETF' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR', type: 'ETF' }, { symbol: 'XLV', name: 'Health Care Select Sector SPDR', type: 'ETF' },
  { symbol: 'XLI', name: 'Industrial Select Sector SPDR', type: 'ETF' }, { symbol: 'XLP', name: 'Consumer Staples Select SPDR', type: 'ETF' },
  { symbol: 'XLY', name: 'Consumer Discretionary Select SPDR', type: 'ETF' }, { symbol: 'XLU', name: 'Utilities Select Sector SPDR', type: 'ETF' },
  { symbol: 'XLB', name: 'Materials Select Sector SPDR', type: 'ETF' }, { symbol: 'XLRE', name: 'Real Estate Select Sector SPDR', type: 'ETF' },
  { symbol: 'XLC', name: 'Communication Services Select SPDR', type: 'ETF' },
  { symbol: 'FANG', name: 'Diamondback Energy', type: 'CS' }, { symbol: 'FNGS', name: 'MicroSectors FANG+ ETN', type: 'ETF' },
  { symbol: 'SOXL', name: 'Direxion Semiconductor Bull 3X', type: 'ETF' }, { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ', type: 'ETF' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'ETF' }, { symbol: 'TLT', name: 'iShares 20+ Year Treasury', type: 'ETF' },
  { symbol: 'HYG', name: 'iShares iBoxx High Yield Corporate', type: 'ETF' }, { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', type: 'ETF' },
  { symbol: 'EEM', name: 'iShares MSCI Emerging Markets', type: 'ETF' }, { symbol: 'VTI', name: 'Vanguard Total Stock Market', type: 'ETF' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'ETF' }, { symbol: 'SCHD', name: 'Schwab US Dividend Equity', type: 'ETF' },
  { symbol: 'NEE', name: 'NextEra Energy', type: 'CS' }, { symbol: 'DHR', name: 'Danaher', type: 'CS' },
  { symbol: 'RTX', name: 'RTX Corp', type: 'CS' }, { symbol: 'HON', name: 'Honeywell', type: 'CS' },
  { symbol: 'AXP', name: 'American Express', type: 'CS' }, { symbol: 'ISRG', name: 'Intuitive Surgical', type: 'CS' },
  { symbol: 'VRTX', name: 'Vertex Pharmaceuticals', type: 'CS' }, { symbol: 'REGN', name: 'Regeneron', type: 'CS' },
  { symbol: 'SYK', name: 'Stryker', type: 'CS' }, { symbol: 'PGR', name: 'Progressive', type: 'CS' },
  { symbol: 'BSX', name: 'Boston Scientific', type: 'CS' }, { symbol: 'KLAC', name: 'KLA Corp', type: 'CS' },
  { symbol: 'LRCX', name: 'Lam Research', type: 'CS' }, { symbol: 'MCO', name: "Moody's", type: 'CS' },
  { symbol: 'ADP', name: 'ADP', type: 'CS' }, { symbol: 'ORLY', name: "O'Reilly Auto", type: 'CS' },
  { symbol: 'MCD', name: "McDonald's", type: 'CS' }, { symbol: 'COIN', name: 'Coinbase', type: 'CS' },
  { symbol: 'MARA', name: 'Marathon Digital', type: 'CS' }, { symbol: 'RIOT', name: 'Riot Platforms', type: 'CS' },
  { symbol: 'SNOW', name: 'Snowflake', type: 'CS' }, { symbol: 'DDOG', name: 'Datadog', type: 'CS' },
  { symbol: 'NET', name: 'Cloudflare', type: 'CS' }, { symbol: 'CRWD', name: 'CrowdStrike', type: 'CS' },
  { symbol: 'ZS', name: 'Zscaler', type: 'CS' }, { symbol: 'PANW', name: 'Palo Alto Networks', type: 'CS' },
  { symbol: 'ARM', name: 'Arm Holdings', type: 'CS' }, { symbol: 'SMCI', name: 'Super Micro Computer', type: 'CS' },
]

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  // Try Polygon first
  if (POLYGON_KEY) {
    try {
      const res = await fetch(
        `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=10&apiKey=${POLYGON_KEY}`,
        { next: { revalidate: 300 } },
      )
      if (res.ok) {
        const data = await res.json()
        const polygonResults = (data.results ?? [])
          .filter((t: { market: string; type: string }) => t.market === 'stocks' || t.type === 'ETF' || t.type === 'ETP')
          .map((t: { ticker: string; name: string; type: string; market: string }) => ({
            symbol: t.ticker,
            name: t.name,
            type: t.type,
          }))
          .slice(0, 10)
        return NextResponse.json({ results: polygonResults })
      }
    } catch {
      // Fall through to local
    }
  }

  // Fallback: local search (stocks + crypto)
  const CRYPTO_TICKERS = [
    { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO' },
    { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO' },
    { symbol: 'SOL', name: 'Solana', type: 'CRYPTO' },
    { symbol: 'XRP', name: 'XRP', type: 'CRYPTO' },
    { symbol: 'DOGE', name: 'Dogecoin', type: 'CRYPTO' },
    { symbol: 'ADA', name: 'Cardano', type: 'CRYPTO' },
    { symbol: 'AVAX', name: 'Avalanche', type: 'CRYPTO' },
    { symbol: 'LINK', name: 'Chainlink', type: 'CRYPTO' },
    { symbol: 'DOT', name: 'Polkadot', type: 'CRYPTO' },
    { symbol: 'MATIC', name: 'Polygon', type: 'CRYPTO' },
    { symbol: 'BNB', name: 'BNB', type: 'CRYPTO' },
    { symbol: 'LTC', name: 'Litecoin', type: 'CRYPTO' },
    { symbol: 'UNI', name: 'Uniswap', type: 'CRYPTO' },
    { symbol: 'ATOM', name: 'Cosmos', type: 'CRYPTO' },
    { symbol: 'APT', name: 'Aptos', type: 'CRYPTO' },
    { symbol: 'ARB', name: 'Arbitrum', type: 'CRYPTO' },
    { symbol: 'NEAR', name: 'NEAR Protocol', type: 'CRYPTO' },
    { symbol: 'OP', name: 'Optimism', type: 'CRYPTO' },
  ]

  const q = query.toUpperCase()
  const ql = query.toLowerCase()
  const all = [...LOCAL_TICKERS, ...CRYPTO_TICKERS]
  const results = all
    .filter(t => t.symbol.startsWith(q) || t.name.toLowerCase().includes(ql))
    .slice(0, 8)

  return NextResponse.json({ results })
}
