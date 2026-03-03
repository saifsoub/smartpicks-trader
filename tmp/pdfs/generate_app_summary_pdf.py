from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from pathlib import Path

OUTPUT_PATH = Path("output/pdf/smartpicks-trader-app-summary.pdf")

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN_X = 42
MARGIN_TOP = 44
MARGIN_BOTTOM = 42
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN_X)


def wrap_text(text: str, font_name: str, font_size: int, max_width: float):
    words = text.split()
    lines = []
    current = ""

    for word in words:
        candidate = word if not current else f"{current} {word}"
        if stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    return lines


def draw_heading(c, text, y, size=12):
    c.setFont("Helvetica-Bold", size)
    c.drawString(MARGIN_X, y, text)
    return y - (size + 5)


def draw_paragraph(c, text, y, font_name="Helvetica", font_size=10, leading=13):
    lines = wrap_text(text, font_name, font_size, CONTENT_WIDTH)
    c.setFont(font_name, font_size)
    for line in lines:
        c.drawString(MARGIN_X, y, line)
        y -= leading
    return y


def draw_bullets(c, bullets, y, font_size=10, leading=12):
    bullet_x = MARGIN_X
    text_x = MARGIN_X + 12
    available_width = CONTENT_WIDTH - 12
    c.setFont("Helvetica", font_size)

    for bullet in bullets:
        wrapped = wrap_text(bullet, "Helvetica", font_size, available_width)
        c.drawString(bullet_x, y, "-")
        c.drawString(text_x, y, wrapped[0])
        y -= leading
        for cont in wrapped[1:]:
            c.drawString(text_x, y, cont)
            y -= leading
        y -= 2

    return y


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(OUTPUT_PATH), pagesize=letter)
    y = PAGE_HEIGHT - MARGIN_TOP

    c.setTitle("SmartPicks Trader App Summary")

    c.setFont("Helvetica-Bold", 18)
    c.drawString(MARGIN_X, y, "SmartPicks Trader - One-Page Summary")
    y -= 26

    c.setFont("Helvetica", 9)
    c.drawString(MARGIN_X, y, "Repo-derived snapshot")
    y -= 18

    y = draw_heading(c, "What it is")
    y = draw_paragraph(
        c,
        "A React plus Vite web app for crypto trading workflows, with Binance connectivity, bot dashboards, strategy management, and risk tooling in one interface. The app combines market data views, automated trading orchestration, and assistant-style guidance features.",
        y,
    )
    y -= 6

    y = draw_heading(c, "Who it is for")
    y = draw_paragraph(
        c,
        "Primary persona: crypto traders who want to monitor a Binance-linked portfolio and configure rule-based automated trading behavior from a browser UI.",
        y,
    )
    y -= 6

    y = draw_heading(c, "What it does")
    y = draw_bullets(
        c,
        [
            "Connects to Binance using saved API credentials, with proxy/direct modes and offline demo fallback.",
            "Shows dashboard views for portfolio, recent trades, bot status, performance charts, and live symbol pricing.",
            "Runs automated market analysis on intervals using technical indicators across multiple timeframes.",
            "Supports strategy lifecycle management (default templates, add/update/delete, enabled states).",
            "Applies configurable risk controls including position size limits, stop loss/take profit, and max open positions.",
            "Includes a backtesting module with persisted strategy results (implemented as simulated backtests in current code).",
            "Provides assistant-style AI features (chat, predictions, advice), with simulated responses/models in this repo.",
        ],
        y,
    )
    y -= 4

    y = draw_heading(c, "How it works (architecture overview)")
    y = draw_bullets(
        c,
        [
            "UI layer: React pages/routes (dashboard, bot dashboard, easy-peasy workflow, settings, strategies).",
            "Service layer: binanceService composes API client plus account/market/connection/trading modules.",
            "Trading orchestration: automatedTradingService wires StrategyManager, RiskManager, BacktestingService, and StrategyExecutor via a trading event emitter.",
            "Data persistence: localStorage stores credentials, proxy/offline flags, heartbeat status, strategies, risk settings, and backtest outputs.",
            "External flow: Browser UI -> services -> Binance proxy/direct endpoints -> results back to UI; Telegram notifications are simulated in code.",
            "Dedicated backend service owned by this repo: Not found in repo.",
        ],
        y,
    )
    y -= 2

    y = draw_heading(c, "How to run (minimal)")
    y = draw_bullets(
        c,
        [
            "Install Node.js and npm (README states these are required).",
            "Install dependencies: npm i",
            "Start local dev server: npm run dev",
            "Open the local URL printed by Vite in your terminal.",
        ],
        y,
    )

    if y < MARGIN_BOTTOM:
        raise RuntimeError(f"Content overflowed page by {MARGIN_BOTTOM - y:.1f} points")

    c.save()


if __name__ == "__main__":
    main()
