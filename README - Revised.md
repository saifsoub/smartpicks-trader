# SmartPicks Trader — plain-language README

## What this is
A web dashboard for cryptocurrency trading. It shows live prices from the Binance exchange and brings trading strategies, practice runs on past data and an AI assistant into one screen.

## Who it's for
People who trade crypto on Binance and want one dashboard with AI help, including beginners (there's a starter guide).

## What it does today
The screens include:
- Live market prices from Binance
- A summary of your holdings and how they're doing
- Price charts
- Trading strategies, with a setup flow for automatic trading
- "Backtesting": trying a strategy against past prices to see how it would have done
- Tools to limit risk
- An AI chat assistant, plus AI tips and summaries
- Recent trades and an activity log
- Two-step login (two-factor authentication)
- Social trading features
- A beginner's guide page

Which of these use real data and which show sample data: not yet confirmed.

## How to run it
```bash
npm install
npm run dev
```
It opens on port 8080 (http://localhost:8080).

## Current status and known gaps
- Built with the Lovable app builder and exported here. The live Lovable project is linked in `README.md`.
- Several security alerts are open in this repo.
- Automatic trading with real money is risky. Whether it can place real orders: not yet confirmed.
- The repo also contains an unrelated notebook, `UAE_E_Invoicing_Orchestration_Layer_Design.ipynb`. It is a design study for UAE electronic invoicing and is separate from the trading app.

## Where things live
| Folder | What's in it |
|---|---|
| `src/components/` | Screen parts: dashboard, trading, holdings, risk, AI assistant |
| `src/components/dashboard/` | Header, prices and AI tips panels |
