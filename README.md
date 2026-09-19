# FSL TRADER — AI MARKET VISION PRO
> **TRADE | ANALYZE | GROW**

**FSL TRADER — AI Market Vision Pro** is a high-grade cyberpunk AI-powered financial market analysis and decision-support terminal. It pairs computer vision with quantitative order-flow models to evaluate candlestick structure, technical indicators, dynamic support/resistance, and multi-timeframe alignment across Forex, Crypto, and Commodities.

---

## Key Features

1. **Multimodal Chart Vision (Gemini 3.8 Flash)**
   - Drag & drop or paste (<kbd>Ctrl+V</kbd>) broker screenshots (TradingView, MT4/MT5, Exness, Pocket Option, Binance).
   - Cyberpunk animated laser scan detection of price axes, timeframe, candlestick patterns, and market structures.
   - Robust heuristic fallback engine in case of offline or obfuscated inputs.

2. **Strict Confluence Matrix Engine (100-Point Model)**
   - **Trend Structure (15 pts):** EMA ribbon alignment (9 > 21 > 50 > 100 > 200).
   - **Momentum Strength (15 pts):** RSI 14 oscillator + MACD histogram expansion.
   - **Market Structure (20 pts):** Higher-highs / higher-lows vs. lower-lows / lower-highs, Break of Structure (BOS), and Change of Character (CHOCH).
   - **Volume Validation (10 pts):** Relative volume expansion over 20-period baseline.
   - **Volatility / Squeeze (10 pts):** Bollinger Bandwidth & ATR volatility breakout detection.
   - **Support & Resistance (15 pts):** Dynamic and horizontal pivot reaction barriers.
   - **Candlestick Formations (5 pts):** Engulfing bars, pin bars, tweezers, morning/evening stars.
   - **Multi-Timeframe Alignment (10 pts):** Confirmation across higher and lower order flow horizons.

3. **Mandatory Capital Preservation ("NO-TRADE" Filter)**
   - Strict filter enforcing `NO_TRADE` when total confluence is below 65/100, when key indicators conflict (e.g. RSI overbought during bullish momentum), or when entering directly into major resistance/support barriers.

4. **Multi-Timeframe Horizon Matrix**
   - Direct projections for:
     - **NEXT 1 MIN** (Direction, Confluence %, Structure, Momentum)
     - **NEXT 3 MIN** (Direction, Confluence %, Structure, Momentum)
     - **NEXT 5 MIN** (Direction, Confluence %, Structure, Momentum)

5. **Interactive HTML5 Canvas Candlestick Chart**
   - High-FPS canvas renderer with HiDPI retina scaling.
   - Interactive crosshair showing timestamp, Open, High, Low, Close, Volume.
   - Toggleable indicator overlays: EMA 9, EMA 21, EMA 50, Bollinger Bands (20,2), Support floors, and Resistance ceilings.

6. **Cross-Asset Radar Scanner & Watchlist**
   - Real-time screening across NZD/JPY, EUR/USD, GBP/USD, USD/JPY, BTC/USDT, ETH/USDT, and XAU/USD.
   - Live directional bias, confluence rating, and one-click transition to workspace.

7. **Institutional Strategy Lab & Backtesting Engine**
   - Visual rule builder for boolean indicator conditions.
   - Real simulation executing historical trades, reporting Win Rate %, Profit Factor, Max Drawdown %, and Expectancy.

8. **Enterprise RBAC & Commercial Licensing**
   - Role hierarchy: `USER`, `ADMIN`, `SUPER_ADMIN`.
   - Hardware device binding & daily scan limits.
   - Interactive admin terminal with live system diagnostics, single & bulk key generation, user management, and engine weights tuning.

---

## One-Click Demo Credentials

### Pre-Configured Test Accounts

| Role | Email | Password | Plan |
|---|---|---|---|
| **Super Admin** | `faisal.sokal55@gmail.com` | `Password123!` | ENTERPRISE |
| **Administrator** | `admin@fsltrader.io` | `AdminPassword123!` | ENTERPRISE |
| **Pro Trader** | `trader@fsltrader.io` | `TraderPass123!` | PRO |
| **Unlicensed User** | `newuser@fsltrader.io` | `NewUser123!` | FREE |

### Ready-To-Use License Keys

- **Enterprise Syndicate:** `FSL-ENT1-9002-3114-7782`
- **Pro Vision:** `FSL-PRO9-8832-7719-4401`
- **VIP Elite (Unused):** `FSL-UNSD-7711-2299-4455`
- **Expired Test Key:** `FSL-EXPD-1029-3847-5612`

---

## API Architecture

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & check license status | Public |
| `POST` | `/api/auth/register` | Create account & bind initial key | Public |
| `GET` | `/api/auth/me` | Fetch active profile and session data | Bearer Token |
| `POST` | `/api/license/activate` | Activate and bind commercial license key | Bearer Token |
| `POST` | `/api/vision/analyze` | Multimodal AI chart OCR and confluence analysis | Licensed User |
| `GET` | `/api/markets/scanner` | Real-time multi-market scanner matrix | Public |
| `GET` | `/api/markets/:symbol/candles` | Stream OHLCV candles for canvas chart | Public |
| `POST` | `/api/backtest/run` | Execute quantitative backtesting simulation | Licensed User |
| `GET` | `/api/admin/stats` | System overview stats & subsystem diagnostics | Admin Only |
| `POST` | `/api/admin/licenses/generate` | Generate individual license key | Admin Only |
| `POST` | `/api/admin/licenses/bulk` | Bulk issue commercial license batch | Admin Only |
| `POST` | `/api/admin/engine-settings` | Update confluence weights and cutoffs | Admin Only |

---

## Disclaimer & Risk Disclosure

*FSL TRADER is an analytical decision-support and educational tool. It does NOT guarantee trading profits, execute automatic financial transactions, or predict market movements with absolute certainty. Foreign exchange, cryptocurrency, and commodity trading involves substantial risk of loss. Always apply disciplined capital allocation and risk management.*
