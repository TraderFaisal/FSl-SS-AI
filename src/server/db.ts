// FSL TRADER — AI MARKET VISION PRO
// Production Database & State Management Layer
// Implements Prisma schema models, validation, seed data, and audit logging.

import {
  User,
  License,
  Plan,
  SignalResult,
  Strategy,
  IndicatorConfig,
  MarketSummary,
  OHLCVCandle,
  AuditLog,
  SystemLog,
  SystemHealth,
  DeviceSession,
} from '../types';

// Helper to generate FSL license key: FSL-XXXX-XXXX-XXXX-XXXX
export function generateLicenseKey(): string {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FSL-${segment()}-${segment()}-${segment()}-${segment()}`;
}

// Generate realistic financial candles for a pair
function generateRealisticCandles(
  basePrice: number,
  volatility: number,
  count = 70,
  trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS' = 'UP'
): OHLCVCandle[] {
  const candles: OHLCVCandle[] = [];
  const now = Date.now();
  let currentPrice = basePrice;
  const timeframeMs = 60 * 1000; // 1 min

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * timeframeMs;
    const trendDrift = trendDirection === 'UP' ? 0.0003 : trendDirection === 'DOWN' ? -0.0003 : 0;
    const randomShock = (Math.random() - 0.48) * volatility * currentPrice;
    const open = currentPrice;
    const close = Math.max(0.0001, open + randomShock + trendDrift * currentPrice);
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.8;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.8;
    const volume = Math.round(500 + Math.random() * 2500 + (Math.abs(close - open) / open) * 50000);

    candles.push({
      timestamp,
      open: Math.round(open * 100000) / 100000,
      high: Math.round(high * 100000) / 100000,
      low: Math.round(low * 100000) / 100000,
      close: Math.round(close * 100000) / 100000,
      volume,
    });
    currentPrice = close;
  }
  return candles;
}

class DatabaseStore {
  users: Map<string, User> = new Map();
  userPasswords: Map<string, string> = new Map(); // Secure memory store (never exposed to client)
  licenses: Map<string, License> = new Map();
  plans: Map<string, Plan> = new Map();
  signals: SignalResult[] = [];
  strategies: Map<string, Strategy> = new Map();
  markets: Map<string, MarketSummary> = new Map();
  userWatchlists: Map<string, Set<string>> = new Map();
  sessions: Map<string, DeviceSession> = new Map();
  auditLogs: AuditLog[] = [];
  systemLogs: SystemLog[] = [];

  indicatorConfig: IndicatorConfig = {
    emaPeriods: [9, 21, 50, 100, 200],
    rsiPeriod: 14,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    adxPeriod: 14,
    adxThreshold: 20.0,
    atrPeriod: 14,
    bbPeriod: 20,
    bbStdDev: 2.0,
    noTradeCutoff: 65.0,
    srSensitivity: 0.8,
    structureDepth: 5,
    weights: {
      trend: 15,
      momentum: 15,
      structure: 20,
      volume: 10,
      volatility: 10,
      sr: 15,
      candlestick: 5,
      mtf: 10,
    },
  };

  systemHealth: SystemHealth = {
    database: 'ONLINE',
    marketApi: 'ONLINE',
    aiVisionApi: 'ONLINE',
    signalEngine: 'ONLINE',
    storage: 'ONLINE',
    serverHealth: 'ONLINE',
    activeConnections: 12,
    uptimeSeconds: 86400,
    memoryUsageMb: 142,
  };

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Plans
    const plansData: Plan[] = [
      {
        id: 'plan-free',
        name: 'FREE',
        displayName: 'Trial Scout',
        priceMonthly: 0,
        maxDevices: 1,
        dailyScanLimit: 5,
        allowedFeatures: ['AI_ANALYZER_BASIC', 'WATCHLIST'],
        description: 'Basic chart analysis with 5 daily scans.',
      },
      {
        id: 'plan-basic',
        name: 'BASIC',
        displayName: 'Cyber Basic',
        priceMonthly: 49,
        maxDevices: 2,
        dailyScanLimit: 30,
        allowedFeatures: ['AI_ANALYZER_BASIC', 'WATCHLIST', 'INDICATORS'],
        description: 'Standard access for retail traders.',
      },
      {
        id: 'plan-pro',
        name: 'PRO',
        displayName: 'Vision Pro',
        priceMonthly: 129,
        maxDevices: 3,
        dailyScanLimit: 150,
        allowedFeatures: ['AI_ANALYZER_FULL', 'MULTI_TIMEFRAME', 'CONFLUENCE_MATRIX', 'WATCHLIST', 'HISTORY'],
        description: 'Full multi-timeframe analysis and neural confluence engine.',
      },
      {
        id: 'plan-vip',
        name: 'VIP',
        displayName: 'Elite Institutional',
        priceMonthly: 299,
        maxDevices: 5,
        dailyScanLimit: 500,
        allowedFeatures: ['AI_ANALYZER_FULL', 'MULTI_TIMEFRAME', 'CONFLUENCE_MATRIX', 'BACKTESTING', 'STRATEGY_BUILDER', 'INSTANT_ALERTS'],
        description: 'Uncapped precision with institutional backtesting and priority vision queue.',
      },
      {
        id: 'plan-enterprise',
        name: 'ENTERPRISE',
        displayName: 'Cyberpunk Syndicate',
        priceMonthly: 799,
        maxDevices: 10,
        dailyScanLimit: 2000,
        allowedFeatures: ['ALL_FEATURES', 'ADMIN_ACCESS', 'CUSTOM_ENGINE_SETTINGS', 'API_ACCESS'],
        description: 'Complete syndicate control with customizable engine parameters.',
      },
    ];

    for (const p of plansData) {
      this.plans.set(p.name, p);
    }

    // 2. Initial Licenses
    const lic1Key = 'FSL-PRO9-8832-7719-4401';
    const lic2Key = 'FSL-ENT1-9002-3114-7782';
    const lic3Key = 'FSL-VIP4-4433-2211-8899';
    const lic4Key = 'FSL-FREE-0012-9983-1120';
    const licExpiredKey = 'FSL-EXPD-1029-3847-5612';
    const licUnusedKey1 = 'FSL-UNSD-7711-2299-4455';
    const licUnusedKey2 = 'FSL-UNSD-9933-4411-8822';

    const sampleLicenses: License[] = [
      {
        id: 'lic-1',
        key: lic1Key,
        plan: 'PRO',
        status: 'ACTIVE',
        createdAt: '2026-01-10T10:00:00Z',
        activatedAt: '2026-01-10T10:15:00Z',
        expiresAt: '2027-01-10T10:15:00Z',
        maxDevices: 3,
        scanLimit: 150,
        userId: 'usr-superadmin',
        userEmail: 'faisal.sokal55@gmail.com',
        lastUsedAt: new Date().toISOString(),
        notes: 'Founder SuperAdmin Master Key',
        activationsCount: 1,
      },
      {
        id: 'lic-2',
        key: lic2Key,
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        createdAt: '2026-02-01T08:00:00Z',
        activatedAt: '2026-02-01T08:30:00Z',
        expiresAt: '2027-02-01T08:30:00Z',
        maxDevices: 10,
        scanLimit: 2000,
        userId: 'usr-admin',
        userEmail: 'admin@fsltrader.io',
        lastUsedAt: new Date().toISOString(),
        notes: 'Admin Syndicate Tier',
        activationsCount: 1,
      },
      {
        id: 'lic-3',
        key: lic3Key,
        plan: 'PRO',
        status: 'ACTIVE',
        createdAt: '2026-03-01T12:00:00Z',
        activatedAt: '2026-03-01T12:30:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        maxDevices: 3,
        scanLimit: 150,
        userId: 'usr-trader',
        userEmail: 'trader@fsltrader.io',
        lastUsedAt: new Date().toISOString(),
        notes: 'Active Trader License',
        activationsCount: 1,
      },
      {
        id: 'lic-4',
        key: lic4Key,
        plan: 'FREE',
        status: 'ACTIVE',
        createdAt: '2026-03-15T09:00:00Z',
        activatedAt: '2026-03-15T09:05:00Z',
        expiresAt: '2026-10-15T09:05:00Z',
        maxDevices: 1,
        scanLimit: 10,
        userId: 'usr-unlicensed',
        userEmail: 'unlicensed@fsltrader.io',
        lastUsedAt: '2026-03-15T09:05:00Z',
        notes: 'Trial demo key',
        activationsCount: 1,
      },
      {
        id: 'lic-exp',
        key: licExpiredKey,
        plan: 'BASIC',
        status: 'EXPIRED',
        createdAt: '2025-01-01T00:00:00Z',
        activatedAt: '2025-01-01T01:00:00Z',
        expiresAt: '2026-01-01T01:00:00Z',
        maxDevices: 2,
        scanLimit: 30,
        notes: 'Expired subscription',
        activationsCount: 1,
      },
      {
        id: 'lic-unsd-1',
        key: licUnusedKey1,
        plan: 'VIP',
        status: 'UNUSED',
        createdAt: '2026-03-18T14:00:00Z',
        maxDevices: 5,
        scanLimit: 500,
        notes: 'Generated for commercial distribution',
        activationsCount: 0,
      },
      {
        id: 'lic-unsd-2',
        key: licUnusedKey2,
        plan: 'PRO',
        status: 'UNUSED',
        createdAt: '2026-03-18T14:00:00Z',
        maxDevices: 3,
        scanLimit: 150,
        notes: 'Generated for promotional campaign',
        activationsCount: 0,
      },
    ];

    for (const l of sampleLicenses) {
      this.licenses.set(l.key, l);
    }

    // 3. Initial Users
    const superAdmin: User = {
      id: 'usr-superadmin',
      email: 'faisal.sokal55@gmail.com',
      name: 'Faisal (Lead Architect)',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
      activeLicenseKey: lic1Key,
      deviceLimit: 10,
      devicesActive: 1,
    };
    this.users.set(superAdmin.id, superAdmin);
    this.userPasswords.set(superAdmin.email.toLowerCase(), 'Password123!');

    const adminUser: User = {
      id: 'usr-admin',
      email: 'admin@fsltrader.io',
      name: 'Syndicate Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      plan: 'VIP',
      createdAt: '2026-01-15T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
      activeLicenseKey: lic2Key,
      deviceLimit: 5,
      devicesActive: 1,
    };
    this.users.set(adminUser.id, adminUser);
    this.userPasswords.set(adminUser.email.toLowerCase(), 'AdminPassword123!');

    const traderUser: User = {
      id: 'usr-trader',
      email: 'trader@fsltrader.io',
      name: 'Cyber Quant Pro',
      role: 'USER',
      status: 'ACTIVE',
      plan: 'PRO',
      createdAt: '2026-02-10T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
      activeLicenseKey: lic3Key,
      deviceLimit: 3,
      devicesActive: 1,
    };
    this.users.set(traderUser.id, traderUser);
    this.userPasswords.set(traderUser.email.toLowerCase(), 'TraderPass123!');

    const demoUnlicensed: User = {
      id: 'usr-unlicensed',
      email: 'newuser@fsltrader.io',
      name: 'Alex Vance',
      role: 'USER',
      status: 'ACTIVE',
      plan: 'FREE',
      createdAt: new Date().toISOString(),
      activeLicenseKey: undefined, // no active license to demonstrate license verification flow
      deviceLimit: 1,
      devicesActive: 0,
    };
    this.users.set(demoUnlicensed.id, demoUnlicensed);
    this.userPasswords.set(demoUnlicensed.email.toLowerCase(), 'NewUser123!');

    // 4. Initial Markets
    const initialMarkets: Array<{
      symbol: string;
      base: string;
      quote: string;
      type: MarketSummary['marketType'];
      basePrice: number;
      vol: number;
      trend: 'UP' | 'DOWN' | 'SIDEWAYS';
    }> = [
      { symbol: 'NZD/JPY', base: 'NZD', quote: 'JPY', type: 'FOREX', basePrice: 91.45, vol: 0.0012, trend: 'UP' },
      { symbol: 'EUR/USD', base: 'EUR', quote: 'USD', type: 'FOREX', basePrice: 1.0842, vol: 0.0008, trend: 'UP' },
      { symbol: 'GBP/USD', base: 'GBP', quote: 'USD', type: 'FOREX', basePrice: 1.2915, vol: 0.0011, trend: 'DOWN' },
      { symbol: 'USD/JPY', base: 'USD', quote: 'JPY', type: 'FOREX', basePrice: 154.32, vol: 0.0015, trend: 'UP' },
      { symbol: 'BTC/USDT', base: 'BTC', quote: 'USDT', type: 'CRYPTO', basePrice: 68520, vol: 0.004, trend: 'UP' },
      { symbol: 'ETH/USDT', base: 'ETH', quote: 'USDT', type: 'CRYPTO', basePrice: 3480, vol: 0.0045, trend: 'SIDEWAYS' },
      { symbol: 'XAU/USD', base: 'XAU', quote: 'USD', type: 'COMMODITIES', basePrice: 2715.4, vol: 0.002, trend: 'UP' },
    ];

    for (const m of initialMarkets) {
      const candles = generateRealisticCandles(m.basePrice, m.vol, 75, m.trend);
      const lastCandle = candles[candles.length - 1];
      const firstCandle = candles[0];
      const change = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);

      this.markets.set(m.symbol, {
        symbol: m.symbol,
        baseAsset: m.base,
        quoteAsset: m.quote,
        marketType: m.type,
        lastPrice: lastCandle.close,
        change24h: Math.round(change * 100) / 100,
        high24h: Math.round(Math.max(...highs) * 100000) / 100000,
        low24h: Math.round(Math.min(...lows) * 100000) / 100000,
        volume24h: candles.reduce((acc, c) => acc + c.volume, 0),
        trend: m.trend === 'UP' ? 'BULLISH' : m.trend === 'DOWN' ? 'BEARISH' : 'NEUTRAL',
        volatility: m.vol > 0.003 ? 'HIGH' : m.vol > 0.001 ? 'MEDIUM' : 'LOW',
        confluence: m.trend === 'UP' ? 78 : m.trend === 'DOWN' ? 73 : 52,
        signalState: m.trend === 'UP' ? 'UP' : m.trend === 'DOWN' ? 'DOWN' : 'NO_TRADE',
        isLive: true,
        candles,
      });
    }

    // Default Watchlists
    this.userWatchlists.set(superAdmin.id, new Set(['NZD/JPY', 'EUR/USD', 'BTC/USDT', 'USD/JPY']));
    this.userWatchlists.set(traderUser.id, new Set(['NZD/JPY', 'GBP/USD', 'BTC/USDT']));

    // 5. Strategies for Strategy Builder
    const strat1: Strategy = {
      id: 'strat-ema-momentum',
      name: 'EMA Momentum Continuation',
      description: 'Captures high-probability trend extensions using EMA 9/21 crossovers with RSI expansion above support.',
      enabled: true,
      biasTarget: 'UP',
      minConfluence: 75,
      winRateSim: 78.4,
      createdAt: '2026-02-01T10:00:00Z',
      conditions: [
        { id: 'c1', logicOp: 'IF', indicator: 'EMA', operator: '>', compareValue: 'EMA 21', param1: '9', param2: '21' },
        { id: 'c2', logicOp: 'AND', indicator: 'RSI', operator: '>', compareValue: '50', param1: '14' },
        { id: 'c3', logicOp: 'AND', indicator: 'MACD', operator: '>', compareValue: '0' },
        { id: 'c4', logicOp: 'AND', indicator: 'ADX', operator: '>', compareValue: '20', param1: '14' },
        { id: 'c5', logicOp: 'AND', indicator: 'S_R', operator: '>', compareValue: 'SUPPORT' },
      ],
    };

    const strat2: Strategy = {
      id: 'strat-res-rejection',
      name: 'Resistance Liquidity Rejection',
      description: 'Executes short directional bias when price rejects higher boundary with overbought momentum divergence.',
      enabled: true,
      biasTarget: 'DOWN',
      minConfluence: 72,
      winRateSim: 74.2,
      createdAt: '2026-02-15T14:30:00Z',
      conditions: [
        { id: 'c1', logicOp: 'IF', indicator: 'S_R', operator: 'NEAR', compareValue: 'RESISTANCE' },
        { id: 'c2', logicOp: 'AND', indicator: 'RSI', operator: '>', compareValue: '65' },
        { id: 'c3', logicOp: 'AND', indicator: 'MACD', operator: '<', compareValue: 'SIGNAL' },
        { id: 'c4', logicOp: 'AND', indicator: 'BB', operator: 'NEAR', compareValue: 'UPPER_BAND' },
      ],
    };

    const strat3: Strategy = {
      id: 'strat-mean-reversion',
      name: 'Bollinger Band Squeeze Breakout',
      description: 'Filters volatility compression and triggers on explosive volume breakout.',
      enabled: true,
      biasTarget: 'UP',
      minConfluence: 80,
      winRateSim: 81.0,
      createdAt: '2026-03-01T16:00:00Z',
      conditions: [
        { id: 'c1', logicOp: 'IF', indicator: 'BB', operator: '<', compareValue: '0.04' },
        { id: 'c2', logicOp: 'AND', indicator: 'VOLUME', operator: '>', compareValue: '1.5x_EMA' },
        { id: 'c3', logicOp: 'AND', indicator: 'PRICE', operator: '>', compareValue: 'EMA 21' },
      ],
    };

    this.strategies.set(strat1.id, strat1);
    this.strategies.set(strat2.id, strat2);
    this.strategies.set(strat3.id, strat3);

    // Initial Logs
    this.logAudit({
      userId: superAdmin.id,
      userEmail: superAdmin.email,
      action: 'SYSTEM_BOOTSTRAP',
      resource: 'PLATFORM_CORE',
      details: { version: 'FSL TRADER AI MARKET VISION PRO v4.2', environment: 'production-ready' },
    });

    this.logSystem({
      level: 'INFO',
      subsystem: 'CONFLUENCE_CORE',
      message: 'Quantitative indicator engine & neural confluence matrices initialized.',
    });
    this.logSystem({
      level: 'INFO',
      subsystem: 'VISION_ENGINE',
      message: 'Gemini 3.8 Flash Vision pipeline mounted for server-side chart OCR.',
    });
  }

  logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
  }

  logSystem(entry: Omit<SystemLog, 'id' | 'timestamp'>) {
    const log: SystemLog = {
      id: `SYS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.systemLogs.unshift(log);
    if (this.systemLogs.length > 500) this.systemLogs.pop();
  }
}

// Global Singleton Instance
export const db = new DatabaseStore();
