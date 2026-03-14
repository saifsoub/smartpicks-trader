# SmartPicks Trader

> ⚠️ **DISCLAIMER: SmartPicks Trader is experimental software for educational and research purposes only. It is NOT financial advice. Cryptocurrency trading carries significant risk of financial loss. Never trade with money you cannot afford to lose. Past performance does not guarantee future results.**

---

## What is SmartPicks Trader?

SmartPicks Trader is an open-source cryptocurrency trading dashboard and strategy engine that runs entirely in the browser. It connects to the [Binance](https://www.binance.com) exchange via REST API and lets you:

- Monitor real-time BTC and portfolio prices.
- Configure and run automated technical-analysis-based trading strategies (SMA, RSI, MACD, Volume, Divergence, Breakout, and more).
- Operate in **Demo**, **Paper**, or **Live** mode with explicit safety controls.
- Review bot performance history and trade logs.
- Receive notifications via Telegram.

### Who is it for?

Retail crypto traders and developers who want to experiment with automated strategy execution in a transparent, open-source environment.

---

## Safety Model & Risks

### Trading Modes

SmartPicks Trader supports three explicit operating modes, selectable in Settings:

| Mode | Description | Real Orders? |
|------|-------------|:------------:|
| 🟢 **Demo** | Fully simulated; no Binance API required | ✗ |
| 🔵 **Paper** | Uses live market data; all orders simulated | ✗ |
| 🔴 **Live** | Real orders placed on your Binance account | ✅ |

**The default mode is Demo.** Switching to Live requires an explicit confirmation dialog. A prominent **Kill Switch** is available at all times while in Live mode to immediately stop the bot and revert to Demo.

### Credential Security

- API keys are stored in **session memory only** (`sessionStorage`). They are never written to `localStorage` or disk.
- Keys are cleared automatically when the browser tab is closed.
- You will be prompted to re-enter credentials each session.
- ⚠️ This is a **frontend-only** app — your secret key is used to sign requests directly in the browser. For production use, we strongly recommend a backend-managed secrets approach (see [Roadmap](#roadmap)).

### Recommended Binance API Key Restrictions

When creating API keys for use with SmartPicks Trader:
1. Enable **Spot trading** only (no Futures/Margin).
2. Restrict the key to your IP address if possible.
3. For Paper/Demo mode, create a **read-only** key (no trading permission needed).
4. Never share your Secret Key.

---

## Setup & Configuration

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

### Local Development

```sh
# 1. Clone the repository
git clone https://github.com/saifsoub/smartpicks-trader.git
cd smartpicks-trader

# 2. Install dependencies
npm install

# 3. Start the development server (http://localhost:8080)
npm run dev
```

### Production Build

```sh
npm run build
# Output is in the dist/ folder – serve it with any static file host.
```

The production build **does not** include any third-party live-editing scripts (e.g., `cdn.gpteng.co`).

### Binance API Setup

1. Log in to your Binance account → **API Management**.
2. Create a new API key.
3. For Live trading: enable **Enable Spot & Margin Trading**.
4. (Recommended) Add an IP restriction for your server/device.
5. Open the app → go to **Settings** → enter your API Key and Secret Key.
6. Click **Save & Verify** to confirm the connection.

### Proxy Mode

Due to browser CORS restrictions, direct Binance API calls may fail. The app supports a proxy mode that routes requests through a relay server. Enable **Use API Proxy** in Settings if you encounter connectivity issues.

### Offline / Demo Mode

For development and testing without a Binance account, enable **Offline Mode** in Settings. All market data will be simulated.

---

## Architecture Overview

```
src/
  components/         # Reusable UI components (dashboard, charts, etc.)
  pages/              # Route-level pages (Index, BotDashboard, Settings, ...)
  services/
    binanceService.ts         # Binance facade (delegates to sub-services)
    tradingService.ts         # Bot orchestrator (mode enforcement, position tracking)
    binance/                  # Binance sub-services (credentials, market data, ...)
      storageManager.ts       # sessionStorage for credentials, localStorage for prefs
    trading/
      strategies/
        technicalStrategies.ts  # SMA, RSI, MACD, Volume, etc.
        strategyFactory.ts      # Advanced ML/sentiment strategy wrappers
      execution/tradeExecutor.ts  # Position management & risk controls
      types.ts                    # Shared types including TradingMode
  hooks/              # Custom React hooks
  lib/                # Utility helpers
```

---

## Key Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Real-time BTC price, bot overview, AI tools |
| `/bot-dashboard` | BotDashboard | Bot controls and performance metrics |
| `/easy-peasy` | EasyPeasy | Simplified trading interface |
| `/strategies` | Strategies | Strategy list and management |
| `/strategies/:id` | StrategyDetail | Individual strategy details |
| `/settings` | Settings | API keys, trading mode, notifications |

---

## Development Commands

```sh
npm run dev       # Start dev server (http://localhost:8080)
npm run build     # Production build
npm run lint      # Run ESLint
npm run test      # Run unit tests (Vitest)
npm run preview   # Preview production build
```

---

## Roadmap

### High Priority
- [ ] Backend service to hold API secrets securely (removes key from browser entirely)
- [ ] Binance API permissions validation before enabling Live mode
- [ ] Position reconciliation against live exchange state

### Medium Priority
- [ ] Backtesting pipeline with historical data
- [ ] Parameterized strategy configuration UI
- [ ] Observability: structured trade log export
- [ ] TypeScript strict mode

### Low Priority
- [ ] Plugin architecture for custom strategies
- [ ] Multi-exchange support
- [ ] Mobile-optimized layout

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss significant changes.

---

## License

MIT

---

> ⚠️ **Final reminder: This software is provided for educational purposes only. The authors are not responsible for any financial losses incurred through its use. Always conduct your own research and consult a qualified financial advisor before making investment decisions.**
