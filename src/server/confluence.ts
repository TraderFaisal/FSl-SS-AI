// FSL TRADER — AI MARKET VISION PRO
// Confluence Engine & No-Trade Risk Filter
// Evaluates multi-factor quantitative matrices and enforces risk controls.

import {
  SignalDirection,
  SignalResult,
  SignalFactor,
  TimeframeForecast,
  IndicatorConfig,
  OHLCVCandle,
  MarketStructureType,
} from '../types';
import { CalculatedIndicators, computeAllIndicators } from './indicators';

export interface ConfluenceEvaluationInput {
  symbol: string;
  market: string;
  timeframe: string;
  indicators: CalculatedIndicators;
  candles: OHLCVCandle[];
  config: IndicatorConfig;
  visionScoreBias?: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    patterns: string[];
    notes: string;
  };
}

export function evaluateConfluence(input: ConfluenceEvaluationInput): SignalResult {
  const { symbol, market, timeframe, indicators, config, visionScoreBias } = input;
  const p = indicators.currentPrice;

  // 1. Category Calculations
  // Category A: Trend (Weight: 15)
  let trendScore = 0;
  let trendPassed = false;
  let trendDetails = '';
  const emaBullish = indicators.ema9 > indicators.ema21 && indicators.ema21 > indicators.ema50;
  const emaBearish = indicators.ema9 < indicators.ema21 && indicators.ema21 < indicators.ema50;
  const aboveEma200 = p > indicators.ema200;
  const belowEma200 = p < indicators.ema200;

  if (emaBullish && aboveEma200) {
    trendScore = 15;
    trendPassed = true;
    trendDetails = 'Strong Bullish Alignment (EMA 9 > 21 > 50 & above EMA 200)';
  } else if (emaBearish && belowEma200) {
    trendScore = 15;
    trendPassed = true;
    trendDetails = 'Strong Bearish Alignment (EMA 9 < 21 < 50 & below EMA 200)';
  } else if (indicators.ema9 > indicators.ema21) {
    trendScore = 9;
    trendPassed = true;
    trendDetails = 'Short-term Bullish Ribbon (EMA 9 > EMA 21)';
  } else if (indicators.ema9 < indicators.ema21) {
    trendScore = 9;
    trendPassed = true;
    trendDetails = 'Short-term Bearish Ribbon (EMA 9 < EMA 21)';
  } else {
    trendScore = 3;
    trendPassed = false;
    trendDetails = 'Neutral or Entangled Moving Averages';
  }

  // Category B: Momentum (Weight: 15)
  let momentumScore = 0;
  let momentumPassed = false;
  let momentumDetails = '';
  const rsi = indicators.rsi14;
  const macdHist = indicators.macd.histogram;
  const macdBullish = indicators.macd.macd > indicators.macd.signal && macdHist > 0;
  const macdBearish = indicators.macd.macd < indicators.macd.signal && macdHist < 0;

  let momDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (rsi > 53 && macdBullish) {
    momentumScore = 15;
    momentumPassed = true;
    momDirection = 'BULLISH';
    momentumDetails = `Bullish Momentum (RSI ${rsi.toFixed(1)} + MACD Histogram Expansion)`;
  } else if (rsi < 47 && macdBearish) {
    momentumScore = 15;
    momentumPassed = true;
    momDirection = 'BEARISH';
    momentumDetails = `Bearish Momentum (RSI ${rsi.toFixed(1)} + MACD Histogram Expansion)`;
  } else if (rsi >= 48 && rsi <= 52) {
    momentumScore = 5;
    momentumPassed = false;
    momDirection = 'NEUTRAL';
    momentumDetails = `Flat Momentum (RSI hovering at ${rsi.toFixed(1)})`;
  } else {
    momentumScore = 8;
    momentumPassed = true;
    momDirection = rsi > 50 ? 'BULLISH' : 'BEARISH';
    momentumDetails = `Moderate ${momDirection} tilt (RSI: ${rsi.toFixed(1)}, MACD: ${indicators.macd.macd.toFixed(5)})`;
  }

  // Category C: Market Structure (Weight: 20)
  let structureScore = 0;
  let structurePassed = false;
  let structureDetails = '';
  const struct = indicators.marketStructure;

  if (struct.type === 'UPTREND') {
    structureScore = 20;
    structurePassed = true;
    structureDetails = 'Bullish Market Structure (Higher Highs & Higher Lows confirmed)';
  } else if (struct.type === 'DOWNTREND') {
    structureScore = 20;
    structurePassed = true;
    structureDetails = 'Bearish Market Structure (Lower Highs & Lower Lows confirmed)';
  } else if (struct.type === 'TRANSITION') {
    structureScore = 10;
    structurePassed = false;
    structureDetails = 'Structural Transition / Potential Trend Shift in progress';
  } else if (struct.type === 'RANGE') {
    structureScore = 8;
    structurePassed = false;
    structureDetails = 'Horizontal Equilibrium (Clear Range Boundaries without expansion)';
  } else {
    // Choppy
    structureScore = 2;
    structurePassed = false;
    structureDetails = 'Erratic / Choppy Micro-structure (Unfavorable for directional execution)';
  }

  // Category D: Volume (Weight: 10)
  let volumeScore = 0;
  let volumePassed = false;
  let volumeDetails = '';
  if (indicators.volumeRatio >= 1.25) {
    volumeScore = 10;
    volumePassed = true;
    volumeDetails = `High Volume Confirmation (+${Math.round((indicators.volumeRatio - 1) * 100)}% over 20-period EMA)`;
  } else if (indicators.volumeRatio >= 0.9) {
    volumeScore = 7;
    volumePassed = true;
    volumeDetails = `Normal Liquidity Participation (${indicators.volumeRatio.toFixed(2)}x Volume baseline)`;
  } else {
    volumeScore = 3;
    volumePassed = false;
    volumeDetails = `Low Volume Anomaly (${indicators.volumeRatio.toFixed(2)}x Volume baseline)`;
  }

  // Category E: Volatility & ATR (Weight: 10)
  let volScore = 0;
  let volPassed = false;
  let volDetails = '';
  const bb = indicators.bollingerBands;
  if (bb.bandwidth > 0.05 && bb.bandwidth < 0.25) {
    volScore = 10;
    volPassed = true;
    volDetails = `Optimal Volatility Envelope (Bollinger Bandwidth ${bb.bandwidth.toFixed(2)}%)`;
  } else if (bb.bandwidth <= 0.05) {
    volScore = 5;
    volPassed = false;
    volDetails = `Volatility Squeeze / Compression (Bandwidth ${bb.bandwidth.toFixed(2)}%, pending expansion)`;
  } else {
    volScore = 4;
    volPassed = false;
    volDetails = `Excessive Volatility Expansion (Bandwidth ${bb.bandwidth.toFixed(2)}%)`;
  }

  // Category F: Support & Resistance (Weight: 15)
  let srScore = 0;
  let srPassed = false;
  let srDetails = '';
  const nearestSup = indicators.supportLevels[0] || p * 0.99;
  const nearestRes = indicators.resistanceLevels[0] || p * 1.01;
  const distToRes = Math.abs(nearestRes - p) / p;
  const distToSup = Math.abs(p - nearestSup) / p;

  if (struct.trendBias === 'BULLISH' && distToSup < 0.003 && distToRes > 0.004) {
    srScore = 15;
    srPassed = true;
    srDetails = `Confirmed Support Reaction zone (${nearestSup.toFixed(5)}) with headroom to resistance`;
  } else if (struct.trendBias === 'BEARISH' && distToRes < 0.003 && distToSup > 0.004) {
    srScore = 15;
    srPassed = true;
    srDetails = `Confirmed Resistance Rejection zone (${nearestRes.toFixed(5)}) with downside headroom`;
  } else if (distToRes > 0.005 && distToSup > 0.005) {
    srScore = 11;
    srPassed = true;
    srDetails = `Mid-Channel clearance (Support: ${nearestSup.toFixed(5)}, Resistance: ${nearestRes.toFixed(5)})`;
  } else {
    srScore = 5;
    srPassed = false;
    srDetails = `Proximity warning to key barrier (S: ${nearestSup.toFixed(5)} | R: ${nearestRes.toFixed(5)})`;
  }

  // Category G: Candlestick Pattern (Weight: 5)
  let candleScore = 0;
  let candlePassed = false;
  let candleDetails = '';
  const patterns = indicators.detectedPatterns;
  const hasStrongBull = patterns.some((p) => p.includes('Bullish') || p.includes('Morning Star') || p.includes('Hammer'));
  const hasStrongBear = patterns.some((p) => p.includes('Bearish') || p.includes('Evening Star') || p.includes('Shooting Star'));

  if (hasStrongBull && struct.trendBias === 'BULLISH') {
    candleScore = 5;
    candlePassed = true;
    candleDetails = `Bullish Candlestick Confirmation: ${patterns.join(', ')}`;
  } else if (hasStrongBear && struct.trendBias === 'BEARISH') {
    candleScore = 5;
    candlePassed = true;
    candleDetails = `Bearish Candlestick Confirmation: ${patterns.join(', ')}`;
  } else if (patterns.includes('Doji') || patterns.includes('Inside Bar')) {
    candleScore = 2;
    candlePassed = false;
    candleDetails = `Indecision Candlestick Signature: ${patterns.join(', ')}`;
  } else {
    candleScore = 3;
    candlePassed = true;
    candleDetails = `Detected Formations: ${patterns.slice(0, 2).join(', ')}`;
  }

  // Category H: Multi-Timeframe / Vision Alignment (Weight: 10)
  let mtfScore = 0;
  let mtfPassed = false;
  let mtfDetails = '';
  if (visionScoreBias && visionScoreBias.bias !== 'NEUTRAL') {
    if (visionScoreBias.bias === struct.trendBias) {
      mtfScore = 10;
      mtfPassed = true;
      mtfDetails = `AI Vision & High-TF Alignment: Full harmony with ${visionScoreBias.bias} bias (${visionScoreBias.confidence}% conf)`;
    } else {
      mtfScore = 3;
      mtfPassed = false;
      mtfDetails = `AI Vision Divergence: AI detected ${visionScoreBias.bias} while local structure shows ${struct.trendBias}`;
    }
  } else {
    // Estimate higher TF continuation using 200 EMA and ADX
    if (indicators.adx14.adx > config.adxThreshold && ((struct.trendBias === 'BULLISH' && aboveEma200) || (struct.trendBias === 'BEARISH' && belowEma200))) {
      mtfScore = 10;
      mtfPassed = true;
      mtfDetails = `Macro Trend Confluence: ADX (${indicators.adx14.adx}) confirms trend strength across higher frames`;
    } else {
      mtfScore = 6;
      mtfPassed = true;
      mtfDetails = `Neutral Multi-Timeframe backdrop (ADX: ${indicators.adx14.adx})`;
    }
  }

  // Raw Total Confluence Score (0 - 100)
  const rawScore =
    trendScore +
    momentumScore +
    structureScore +
    volumeScore +
    volScore +
    srScore +
    candleScore +
    mtfScore;

  const totalConfluence = Math.min(100, Math.max(0, Math.round(rawScore)));

  // 2. Strict NO TRADE Engine Checks
  const warnings: string[] = [];
  let forceNoTrade = false;
  let noTradeReason = '';

  // Conflict 1: Choppy market
  if (struct.type === 'CHOPPY') {
    forceNoTrade = true;
    noTradeReason = 'Market structure is choppy/erratic with no directional expansion.';
    warnings.push('Market structure is currently choppy and lacks clear expansion.');
  }

  // Conflict 2: Indicator conflict (e.g. Trend Bullish but Momentum strongly Bearish)
  const bullishIndicators = (emaBullish ? 1 : 0) + (rsi > 53 ? 1 : 0) + (macdBullish ? 1 : 0) + (struct.trendBias === 'BULLISH' ? 1 : 0);
  const bearishIndicators = (emaBearish ? 1 : 0) + (rsi < 47 ? 1 : 0) + (macdBearish ? 1 : 0) + (struct.trendBias === 'BEARISH' ? 1 : 0);

  if (bullishIndicators >= 2 && bearishIndicators >= 2) {
    forceNoTrade = true;
    noTradeReason = 'Key technical indicators are in direct conflict with contradictory momentum signals.';
    warnings.push('Key indicators show contradictory signals (RSI/MACD vs Moving Averages).');
  }

  // Conflict 3: Score below threshold
  if (totalConfluence < config.noTradeCutoff) {
    forceNoTrade = true;
    noTradeReason = `Total Confluence Score (${totalConfluence}/100) is below the minimum required threshold of ${config.noTradeCutoff}/100.`;
    warnings.push(`Confluence (${totalConfluence}/100) is below the minimum required setup quality of ${config.noTradeCutoff}/100.`);
  }

  // Conflict 4: Extreme proximity to major barrier
  if (struct.trendBias === 'BULLISH' && distToRes < 0.0015) {
    warnings.push('Warning: Price is immediately beneath key resistance zone, capping upside potential.');
    if (totalConfluence < 80) forceNoTrade = true;
  } else if (struct.trendBias === 'BEARISH' && distToSup < 0.0015) {
    warnings.push('Warning: Price is immediately above key support floor, limiting downside follow-through.');
    if (totalConfluence < 80) forceNoTrade = true;
  }

  // Conflict 5: ADX under 15 indicates complete absence of trend
  if (indicators.adx14.adx < 15 && totalConfluence < 75) {
    warnings.push(`Low directional trend index (ADX ${indicators.adx14.adx} < 15).`);
  }

  // Determine Final Direction
  let direction: SignalDirection = 'NO_TRADE';
  let setupQuality: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';

  if (!forceNoTrade) {
    if (bullishIndicators > bearishIndicators && struct.trendBias === 'BULLISH' && totalConfluence >= config.noTradeCutoff) {
      direction = 'UP';
      setupQuality = totalConfluence >= 80 ? 'HIGH' : 'MODERATE';
    } else if (bearishIndicators > bullishIndicators && struct.trendBias === 'BEARISH' && totalConfluence >= config.noTradeCutoff) {
      direction = 'DOWN';
      setupQuality = totalConfluence >= 80 ? 'HIGH' : 'MODERATE';
    } else {
      direction = 'NO_TRADE';
      setupQuality = 'LOW';
    }
  }

  // Factors List
  const factors: SignalFactor[] = [
    { category: 'Trend', weight: 15, passed: trendPassed, score: trendScore, details: trendDetails },
    { category: 'Momentum', weight: 15, passed: momentumPassed, score: momentumScore, details: momentumDetails },
    { category: 'Structure', weight: 20, passed: structurePassed, score: structureScore, details: structureDetails },
    { category: 'Volume', weight: 10, passed: volumePassed, score: volumeScore, details: volumeDetails },
    { category: 'Volatility', weight: 10, passed: volPassed, score: volScore, details: volDetails },
    { category: 'S/R', weight: 15, passed: srPassed, score: srScore, details: srDetails },
    { category: 'Candlestick', weight: 5, passed: candlePassed, score: candleScore, details: candleDetails },
    { category: 'MTF', weight: 10, passed: mtfPassed, score: mtfScore, details: mtfDetails },
  ];

  // Setup Title & Explanation
  let setupTitle = '';
  let explanation = '';

  if (direction === 'UP') {
    setupTitle = 'Bullish Continuation & Structural Support Defense';
    explanation = `Price on ${symbol} (${timeframe}) is maintaining an intact bullish structure above the detected support zone at ${nearestSup.toFixed(5)}. Trend indicators (EMA 9/21/50) and positive momentum oscillator alignment (RSI ${rsi.toFixed(1)}) confirm buyer control with clean headroom toward ${nearestRes.toFixed(5)}. Risk parameters warrant disciplined execution.`;
  } else if (direction === 'DOWN') {
    setupTitle = 'Bearish Breakdown & Rejection from Resistance';
    explanation = `Price on ${symbol} (${timeframe}) exhibits clear downward structural order flow under the resistance boundary at ${nearestRes.toFixed(5)}. Moving average ribbons have aligned in negative gradient with confirming momentum (RSI ${rsi.toFixed(1)} and bearish MACD expansion) projecting downside trajectory toward ${nearestSup.toFixed(5)}.`;
  } else {
    setupTitle = 'No-Trade Condition — Preserving Capital';
    explanation = noTradeReason
      ? `Analysis engine enforces NO TRADE: ${noTradeReason} When confluence criteria are not met or indicators disagree, the professional protocol is to stay on the sidelines.`
      : `Market conditions on ${symbol} are currently balanced or displaying low directional conviction. With confluence at ${totalConfluence}/100, evidence is insufficient for high-probability positioning.`;
  }

  // Generate Multi-Timeframe Forecasts (1m, 3m, 5m)
  const next1Min: TimeframeForecast = {
    timeframe: 'NEXT 1 MIN',
    direction: direction === 'NO_TRADE' ? 'NO_TRADE' : direction,
    confluence: Math.min(100, Math.max(0, totalConfluence + (direction === 'UP' ? 3 : direction === 'DOWN' ? 2 : -5))),
    marketStructure: struct.type,
    momentum: direction === 'UP' ? 'STRONG POSITIVE' : direction === 'DOWN' ? 'STRONG NEGATIVE' : 'NEUTRAL',
    riskFlags: warnings.slice(0, 2),
  };

  const next3Min: TimeframeForecast = {
    timeframe: 'NEXT 3 MIN',
    direction: direction,
    confluence: Math.min(100, Math.max(0, totalConfluence - (direction === 'NO_TRADE' ? 2 : 4))),
    marketStructure: struct.type,
    momentum: direction === 'UP' ? 'MODERATE POSITIVE' : direction === 'DOWN' ? 'MODERATE NEGATIVE' : 'NEUTRAL',
    riskFlags: warnings.slice(0, 1),
  };

  const next5Min: TimeframeForecast = {
    timeframe: 'NEXT 5 MIN',
    direction: totalConfluence < 75 ? 'NO_TRADE' : direction,
    confluence: Math.min(100, Math.max(0, totalConfluence - (direction === 'NO_TRADE' ? 6 : 8))),
    marketStructure: struct.type,
    momentum: direction === 'UP' ? 'MODERATE POSITIVE' : direction === 'DOWN' ? 'MODERATE NEGATIVE' : 'NEUTRAL',
    riskFlags: totalConfluence < 75 ? ['Higher-timeframe convergence weakens over 5-minute horizon.'] : [],
  };

  return {
    id: `SIG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toLocaleTimeString(),
    symbol,
    market,
    timeframe,
    direction,
    confluenceScore: totalConfluence,
    setupQuality,
    setupTitle,
    explanation,
    warnings,
    marketStructure: struct.type,
    factors,
    timeframeForecasts: {
      next1Min,
      next3Min,
      next5Min,
    },
    detectedCandlesticks: indicators.detectedPatterns,
    supportLevels: indicators.supportLevels,
    resistanceLevels: indicators.resistanceLevels,
    currentPrice: indicators.currentPrice,
    engineVersion: 'v4.2-VISION-PRO',
  };
}
