from pathlib import Path

OUTPUT_PATH = Path("output/pdf/smartpicks-trader-app-summary.pdf")

PAGE_WIDTH = 612
PAGE_HEIGHT = 792
MARGIN_X = 42


def escape_pdf_text(text: str) -> str:
    return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def wrap_text(text: str, max_chars: int):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def add_line(cmds, text, x, y, size=10):
    safe = escape_pdf_text(text)
    cmds.append(f"BT /F1 {size} Tf 1 0 0 1 {x} {y} Tm ({safe}) Tj ET")


def generate_content_commands():
    cmds = []
    y = 748

    add_line(cmds, "SmartPicks Trader - One-Page Summary", MARGIN_X, y, 18)
    y -= 22
    add_line(cmds, "Repo-derived snapshot", MARGIN_X, y, 9)
    y -= 24

    def heading(text):
        nonlocal y
        add_line(cmds, text, MARGIN_X, y, 12)
        y -= 16

    def paragraph(text, max_chars=93):
        nonlocal y
        for line in wrap_text(text, max_chars):
            add_line(cmds, line, MARGIN_X, y, 10)
            y -= 12
        y -= 4

    def bullets(items, max_chars=88):
        nonlocal y
        for item in items:
            wrapped = wrap_text(item, max_chars)
            if not wrapped:
                continue
            add_line(cmds, "-", MARGIN_X, y, 10)
            add_line(cmds, wrapped[0], MARGIN_X + 12, y, 10)
            y -= 12
            for cont in wrapped[1:]:
                add_line(cmds, cont, MARGIN_X + 12, y, 10)
                y -= 12
            y -= 2

    heading("What it is")
    paragraph(
        "A React plus Vite web app for crypto trading workflows, with Binance connectivity, bot dashboards, strategy management, and risk tooling in one interface. The app combines market data views, automated trading orchestration, and assistant-style guidance features."
    )

    heading("Who it is for")
    paragraph(
        "Primary persona: crypto traders who want to monitor a Binance-linked portfolio and configure rule-based automated trading behavior from a browser UI."
    )

    heading("What it does")
    bullets([
        "Connects to Binance using saved API credentials, with proxy/direct modes and offline demo fallback.",
        "Shows dashboard views for portfolio, recent trades, bot status, performance charts, and live symbol pricing.",
        "Runs automated market analysis on intervals using technical indicators across multiple timeframes.",
        "Supports strategy lifecycle management (default templates, add/update/delete, enabled states).",
        "Applies configurable risk controls including position size limits, stop loss/take profit, and max open positions.",
        "Includes a backtesting module with persisted strategy results (implemented as simulated backtests in current code).",
        "Provides assistant-style AI features (chat, predictions, advice), with simulated responses/models in this repo.",
    ])

    heading("How it works (architecture overview)")
    bullets([
        "UI layer: React pages/routes (dashboard, bot dashboard, easy-peasy workflow, settings, strategies).",
        "Service layer: binanceService composes API client plus account/market/connection/trading modules.",
        "Trading orchestration: automatedTradingService wires StrategyManager, RiskManager, BacktestingService, and StrategyExecutor via a trading event emitter.",
        "Data persistence: localStorage stores credentials, proxy/offline flags, heartbeat status, strategies, risk settings, and backtest outputs.",
        "External flow: Browser UI -> services -> Binance proxy/direct endpoints -> results back to UI; Telegram notifications are simulated in code.",
        "Dedicated backend service owned by this repo: Not found in repo.",
    ])

    heading("How to run (minimal)")
    bullets([
        "Install Node.js and npm (README states these are required).",
        "Install dependencies: npm i",
        "Start local dev server: npm run dev",
        "Open the local URL printed by Vite in your terminal.",
    ])

    if y < 40:
        raise RuntimeError(f"Content overflowed page: final y={y}")

    return "\n".join(cmds)


def build_pdf(content_stream: str) -> bytes:
    objects = []

    def add_object(data: bytes) -> int:
        objects.append(data)
        return len(objects)

    add_object(b"<< /Type /Catalog /Pages 2 0 R >>")
    add_object(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    add_object(
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>".encode(
            "ascii"
        )
    )
    add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    content_bytes = content_stream.encode("latin-1", errors="replace")
    stream_obj = (
        b"<< /Length " + str(len(content_bytes)).encode("ascii") + b" >>\nstream\n" + content_bytes + b"\nendstream"
    )
    add_object(stream_obj)

    pdf = bytearray()
    pdf.extend(b"%PDF-1.4\n")

    offsets = [0]
    for idx, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{idx} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_pos = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode(
            "ascii"
        )
    )

    return bytes(pdf)


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    content_stream = generate_content_commands()
    pdf_bytes = build_pdf(content_stream)
    OUTPUT_PATH.write_bytes(pdf_bytes)


if __name__ == "__main__":
    main()
