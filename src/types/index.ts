// FSL TRADER — AI MARKET VISION PRO
// Shared Type Definitions

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'UNUSED';
export type PlanTier = 'FREE' | 'BASIC' | 'PRO' | 'VIP' | 'ENTERPRISE';
export type SignalDirection = 'UP' | 'DOWN' | 'NO_TRADE';
export type MarketStructureType = 'UPTREND' | 'DOWNTREND' | 'RANGE' | 'CHOPPY' | 'TRANSITION';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  plan: PlanTier;
  createdAt: string;
  lastLoginAt?: string;
  activeLicenseKey?: string;
  deviceLimit: number;
  devicesActive: number;
  scansToday?: number;
}

export interface Plan {
  id: string;
  name: PlanTier;
  displayName: string;
  priceMonthly: number;
  maxDevices: number;
  dailyScanLimit: number;
  allowedFeatures: string[];
  description?: string;
}

export interface License {
  id: string;
  key: string;
  plan: PlanTier;
  status: LicenseStatus;
  createdAt: string;
  activatedAt?: string;
  expiresAt?: string;
  maxDevices: number;
  scanLimit: number;
  dailyScanLimit?: number;
  userId?: string;
  userEmail?: string;
  lastUsedAt?: string;
  notes?: string;
  activationsCount: number;
}

export interface LicenseActivation {
  id: string;
  licenseId: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  activatedAt: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  fingerprint: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastActive: string;
}

export interface OHLCVCandle {
  timestamp: number; // epoch ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSummary {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  marketType: 'FOREX' | 'CRYPTO' | 'INDICES' | 'COMMODITIES';
  lastPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  confluence: number;
  signalState: SignalDirection;
  isLive: boolean;
  candles: OHLCVCandle[];
}

export interface SignalFactor {
  category: 'Trend' | 'Momentum' | 'Structure' | 'Volume' | 'Volatility' | 'S/R' | 'Candlestick' | 'MTF';
  weight: number;
  passed: boolean;
  score: number;
  details: string;
}

export interface TimeframeForecast {
  timeframe: 'NEXT 1 MIN' | 'NEXT 3 MIN' | 'NEXT 5 MIN' | 'NEXT 15 MIN';
  direction: SignalDirection;
  confluence: number; // 0 - 100
  marketStructure: MarketStructureType;
  momentum: 'STRONG POSITIVE' | 'MODERATE POSITIVE' | 'NEUTRAL' | 'MODERATE NEGATIVE' | 'STRONG NEGATIVE';
  riskFlags: string[];
}

export interface SignalResult {
  id: string;
  timestamp: string;
  symbol: string;
  market: string;
  timeframe: string;
  direction: SignalDirection;
  confluenceScore: number; // 0 - 100
  setupQuality: 'HIGH' | 'MODERATE' | 'LOW';
  setupTitle: string;
  explanation: string;
  warnings: string[];
  marketStructure: MarketStructureType;
  imageUrl?: string;
  factors: SignalFactor[];
  timeframeForecasts: {
    next1Min: TimeframeForecast;
    next3Min: TimeframeForecast;
    next5Min: TimeframeForecast;
  };
  detectedCandlesticks: string[];
  supportLevels: number[];
  resistanceLevels: number[];
  currentPrice: number;
  engineVersion: string;
}

export interface StrategyCondition {
  id: string;
  logicOp: 'IF' | 'AND' | 'OR';
  indicator: 'EMA' | 'RSI' | 'MACD' | 'ADX' | 'PRICE' | 'S_R' | 'BB' | 'VOLUME';
  operator: '>' | '<' | '>=' | '<=' | 'CROSS_ABOVE' | 'CROSS_BELOW' | 'EQUALS' | 'NEAR';
  compareValue: string;
  param1?: string;
  param2?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  biasTarget: SignalDirection;
  minConfluence: number;
  conditions: StrategyCondition[];
  winRateSim?: number;
  createdAt: string;
}

export interface IndicatorConfig {
  emaPeriods: number[];
  rsiPeriod: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  adxPeriod: number;
  adxThreshold: number;
  atrPeriod: number;
  bbPeriod: number;
  bbStdDev: number;
  noTradeCutoff: number;
  srSensitivity: number;
  structureDepth: number;
  weights: {
    trend: number;
    momentum: number;
    structure: number;
    volume: number;
    volatility: number;
    sr: number;
    candlestick: number;
    mtf: number;
  };
}

export interface BacktestRequest {
  strategyId: string;
  symbol: string;
  timeframe: string;
  candleCount: number;
  initialBalance: number;
}

export interface BacktestResult {
  strategyName: string;
  symbol: string;
  timeframe: string;
  totalSetups: number;
  upSetups: number;
  downSetups: number;
  noTradeSetups: number;
  winningSetups: number;
  losingSetups: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy: number;
  averageMovementPips: number;
  trades: Array<{
    id: string;
    timestamp: string;
    type: 'UP' | 'DOWN';
    entryPrice: number;
    exitPrice: number;
    confluence: number;
    result: 'WIN' | 'LOSS';
    pips: number;
  }>;
}

export interface SystemHealth {
  database: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  marketApi: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  aiVisionApi: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  signalEngine: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  storage: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  serverHealth: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  activeConnections: number;
  uptimeSeconds: number;
  memoryUsageMb: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  subsystem: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
