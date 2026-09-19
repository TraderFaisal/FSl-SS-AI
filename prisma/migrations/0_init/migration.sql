-- Migration 0_init for FSL TRADER — AI MARKET VISION PRO
-- PostgreSQL DDL with Enums, Tables, Constraints, and Indexes

CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'UNUSED');
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'VIP', 'ENTERPRISE');
CREATE TYPE "SignalDirection" AS ENUM ('UP', 'DOWN', 'NO_TRADE');
CREATE TYPE "MarketStructureType" AS ENUM ('UPTREND', 'DOWNTREND', 'RANGE', 'CHOPPY', 'TRANSITION');

CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3)
);

CREATE TABLE "Plan" (
    "id" TEXT PRIMARY KEY,
    "name" "PlanTier" NOT NULL UNIQUE,
    "displayName" TEXT NOT NULL,
    "priceMonthly" DOUBLE PRECISION NOT NULL,
    "maxDevices" INTEGER NOT NULL DEFAULT 2,
    "dailyScanLimit" INTEGER NOT NULL DEFAULT 20,
    "allowedFeatures" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "License" (
    "id" TEXT PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "plan" "PlanTier" NOT NULL DEFAULT 'PRO',
    "status" "LicenseStatus" NOT NULL DEFAULT 'UNUSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "maxDevices" INTEGER NOT NULL DEFAULT 2,
    "scanLimit" INTEGER NOT NULL DEFAULT 100,
    "lastUsedAt" TIMESTAMP(3),
    "notes" TEXT,
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "LicenseActivation" (
    "id" TEXT PRIMARY KEY,
    "licenseId" TEXT NOT NULL REFERENCES "License"("id") ON DELETE CASCADE,
    "deviceId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3)
);

CREATE TABLE "Device" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "deviceFingerprint" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "ipAddress" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Device_user_fingerprint_unique" UNIQUE ("userId", "deviceFingerprint")
);

CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL UNIQUE,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Signal" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "symbol" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "direction" "SignalDirection" NOT NULL,
    "confluenceScore" DOUBLE PRECISION NOT NULL,
    "setupQuality" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "warnings" TEXT[] NOT NULL DEFAULT '{}',
    "marketStructure" "MarketStructureType" NOT NULL,
    "imageUrl" TEXT,
    "screenshotRef" TEXT,
    "engineVersion" TEXT NOT NULL DEFAULT 'v4.2-VISION-PRO',
    "resultStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next1MinDirection" "SignalDirection",
    "next1MinScore" DOUBLE PRECISION,
    "next3MinDirection" "SignalDirection",
    "next3MinScore" DOUBLE PRECISION,
    "next5MinDirection" "SignalDirection",
    "next5MinScore" DOUBLE PRECISION
);

CREATE TABLE "SignalFactor" (
    "id" TEXT PRIMARY KEY,
    "signalId" TEXT NOT NULL REFERENCES "Signal"("id") ON DELETE CASCADE,
    "category" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "details" TEXT NOT NULL
);

CREATE TABLE "Strategy" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "biasTarget" "SignalDirection" NOT NULL DEFAULT 'UP',
    "minConfluence" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "StrategyCondition" (
    "id" TEXT PRIMARY KEY,
    "strategyId" TEXT NOT NULL REFERENCES "Strategy"("id") ON DELETE CASCADE,
    "logicOp" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "compareValue" TEXT NOT NULL,
    "param1" TEXT,
    "param2" TEXT
);

CREATE TABLE "IndicatorConfig" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "emaPeriods" INTEGER[] NOT NULL DEFAULT '{9, 21, 50, 100, 200}',
    "rsiPeriod" INTEGER NOT NULL DEFAULT 14,
    "macdFast" INTEGER NOT NULL DEFAULT 12,
    "macdSlow" INTEGER NOT NULL DEFAULT 26,
    "macdSignal" INTEGER NOT NULL DEFAULT 9,
    "adxPeriod" INTEGER NOT NULL DEFAULT 14,
    "adxThreshold" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "atrPeriod" INTEGER NOT NULL DEFAULT 14,
    "bbPeriod" INTEGER NOT NULL DEFAULT 20,
    "bbStdDev" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "noTradeCutoff" DOUBLE PRECISION NOT NULL DEFAULT 65.0,
    "srSensitivity" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "structureDepth" INTEGER NOT NULL DEFAULT 5,
    "weights" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Market" (
    "id" TEXT PRIMARY KEY,
    "symbol" TEXT NOT NULL UNIQUE,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "marketType" TEXT NOT NULL,
    "lastPrice" DOUBLE PRECISION NOT NULL,
    "change24h" DOUBLE PRECISION NOT NULL,
    "high24h" DOUBLE PRECISION NOT NULL,
    "low24h" DOUBLE PRECISION NOT NULL,
    "volume24h" DOUBLE PRECISION NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT TRUE,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Candle" (
    "id" TEXT PRIMARY KEY,
    "marketId" TEXT NOT NULL REFERENCES "Market"("id") ON DELETE CASCADE,
    "timeframe" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "Candle_market_tf_time_unique" UNIQUE ("marketId", "timeframe", "timestamp")
);

CREATE TABLE "Watchlist" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "symbol" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Watchlist_user_symbol_unique" UNIQUE ("userId", "symbol")
);

CREATE TABLE "AuditLog" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SystemLog" (
    "id" TEXT PRIMARY KEY,
    "level" TEXT NOT NULL,
    "subsystem" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ApiCredential" (
    "id" TEXT PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "apiKeyMask" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'HEALTHY'
);

CREATE TABLE "UserSetting" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "theme" TEXT NOT NULL DEFAULT 'cyberpunk',
    "soundAlerts" BOOLEAN NOT NULL DEFAULT TRUE,
    "hapticFeedback" BOOLEAN NOT NULL DEFAULT FALSE,
    "preferredTimeframe" TEXT NOT NULL DEFAULT '1m',
    "chartStyle" TEXT NOT NULL DEFAULT 'candles',
    "autoScanInterval" INTEGER NOT NULL DEFAULT 0,
    "defaultMarket" TEXT NOT NULL DEFAULT 'NZD/JPY'
);

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "License_key_idx" ON "License"("key");
CREATE INDEX "Signal_symbol_idx" ON "Signal"("symbol");
CREATE INDEX "Candle_market_idx" ON "Candle"("marketId", "timeframe", "timestamp");
