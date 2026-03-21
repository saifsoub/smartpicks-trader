# SmartPicks Trader

## Mission

Build and operate a best-in-class AI-powered cryptocurrency trading bot platform that empowers retail traders to participate in crypto markets safely, with transparent risk controls and full auditability.

## What We Do

SmartPicks Trader is a React/TypeScript dashboard that connects to the Binance API and runs automated trading strategies. The platform supports three operating modes:

- **Demo** — fully simulated, no real funds at risk (default)
- **Paper** — live market data, simulated execution
- **Live** — real order placement via Binance API (requires explicit activation)

Key features:
- Real-time BTC/ETH price feeds
- Multiple strategy engines (SMA crossover, RSI, MACD, volume, breakout, divergence, profit-taking)
- Position management with stop-loss / take-profit enforcement
- Emergency kill switch
- CSV trade log export
- AI chat assistant for trading insights

## Values

1. **Safety first** — trading mode defaults to Demo; Live mode requires confirmation and shows a persistent kill switch
2. **Transparency** — all simulated orders are logged with a `[SIMULATED]` prefix; audit trail exportable as CSV
3. **Retail-friendly** — guided setup wizard, newbie dashboard, plain-language risk disclosures

## Tech Stack

- Frontend: React 18, TypeScript (strict), Vite, Tailwind CSS, shadcn-ui
- Charting: Recharts
- Data fetching: TanStack React Query
- Build CI: GitHub Actions (lint → tsc → build → unit tests)

## Important Context

- **Credentials** are stored in `sessionStorage` only — never `localStorage`
- **No third-party CDN scripts** are loaded in production builds
- **TypeScript strict mode** is enforced; zero type errors tolerated
- All trading logic lives in `src/services/trading/`; UI components are in `src/components/`
