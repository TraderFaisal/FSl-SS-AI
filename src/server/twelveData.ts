// FSL TRADER — AI MARKET VISION PRO
// Twelve Data (https://twelvedata.com/) Integration Service
// Fetches real-time quotes, OHLCV time series, and market depth with caching and graceful synthetic fallback.

import { OHLCVCandle, MarketSummary } from '../types';

interface TwelveDataQuoteResponse {
  symbol: string;
  name?: string;
  exchange?: string;
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  is_market_open?: boolean;
  status?: string;
  message?: string;
  code?: number;
}

interface TwelveDataTimeSeriesItem {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

interface TwelveDataTimeSeriesResponse {
  meta?: {
    symbol: string;
    interval: string;
    currency_base?: string;
    currency_quote?: string;
    exchange?: string;
    type?: string;
  };
  values?: TwelveDataTimeSeriesItem[];
  status?: string;
  message?: string;
  code?: number;
}

// In-memory cache to respect API rate limits (Free tier: 8 credits/min)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const candleCache: Map<string, CacheEntry<OHLCVCandle[]>> = new Map();
const quoteCache: Map<string, CacheEntry<TwelveDataQuoteResponse>> = new Map();
const CACHE_TTL_MS = 20 * 1000; // 20 seconds cache

export class TwelveDataService {
  private getApiKey(): string | null {
    return process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY || null;
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  public getMaskedKey(): string | null {
    const key = this.getApiKey();
    if (!key) return null;
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }

  /**
   * Normalize symbol for Twelve Data:
   * e.g. "NZD/JPY" -> "NZD/JPY"
   * "BTC/USDT" -> "BTC/USD" (Twelve Data prefers BTC/USD or BTC/USDT)
   */
  public normalizeSymbol(symbol: string): string {
    const clean = symbol.trim().toUpperCase();
    if (clean === 'BTC/USDT') return 'BTC/USD';
    if (clean === 'ETH/USDT') return 'ETH/USD';
    return clean;
  }

  /**
   * Map application timeframe to Twelve Data interval:
   * "1m" -> "1min"
   * "3m" -> "1min" (or "5min")
   * "5m" -> "5min"
   * "15m" -> "15min"
   * "1h" -> "1h"
   * "1d" -> "1day"
   */
  public mapTimeframeToInterval(tf: string): string {
    switch (tf.toLowerCase()) {
      case '1m':
        return '1min';
      case '3m':
        return '1min';
      case '5m':
        return '5min';
      case '15m':
        return '15min';
      case '30m':
        return '30min';
      case '1h':
        return '1h';
      case '4h':
        return '4h';
      case '1d':
        return '1day';
      default:
        return '1min';
    }
  }

  /**
   * Fetch Live Quote from Twelve Data
   */
  public async fetchQuote(symbol: string): Promise<TwelveDataQuoteResponse | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const tdSymbol = this.normalizeSymbol(symbol);
    const cacheKey = `quote_${tdSymbol}`;
    const cached = quoteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${apiKey}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'FSL-Trader-Pro/1.0' } });
      if (!res.ok) {
        console.warn(`[TwelveData] HTTP ${res.status} for symbol ${tdSymbol}`);
        return null;
      }

      const data: TwelveDataQuoteResponse = await res.json();
      if (data.status === 'error' || data.code) {
        console.warn(`[TwelveData] Error for ${tdSymbol}:`, data.message);
        return null;
      }

      quoteCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      console.warn(`[TwelveData] Quote fetch failed for ${tdSymbol}:`, err);
      return null;
    }
  }

  /**
   * Fetch Real-Time OHLCV Candlesticks from Twelve Data
   */
  public async fetchCandles(
    symbol: string,
    timeframe = '1m',
    outputSize = 70
  ): Promise<OHLCVCandle[] | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const tdSymbol = this.normalizeSymbol(symbol);
    const interval = this.mapTimeframeToInterval(timeframe);
    const cacheKey = `candles_${tdSymbol}_${interval}_${outputSize}`;

    const cached = candleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
        tdSymbol
      )}&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`;

      const res = await fetch(url, { headers: { 'User-Agent': 'FSL-Trader-Pro/1.0' } });
      if (!res.ok) {
        console.warn(`[TwelveData] Time Series HTTP ${res.status} for ${tdSymbol}`);
        return null;
      }

      const data: TwelveDataTimeSeriesResponse = await res.json();
      if (data.status === 'error' || !data.values || !Array.isArray(data.values)) {
        console.warn(`[TwelveData] Time Series error for ${tdSymbol}:`, data.message);
        return null;
      }

      // Twelve Data returns newest first. Sort ascending (oldest -> newest) for indicators & canvas chart
      const parsed: OHLCVCandle[] = data.values
        .map((v) => {
          const timestamp = new Date(v.datetime).getTime() || Date.now();
          const open = parseFloat(v.open);
          const high = parseFloat(v.high);
          const low = parseFloat(v.low);
          const close = parseFloat(v.close);
          const volume = v.volume ? parseFloat(v.volume) : 1000;

          return {
            timestamp,
            open: Math.round(open * 100000) / 100000,
            high: Math.round(high * 100000) / 100000,
            low: Math.round(low * 100000) / 100000,
            close: Math.round(close * 100000) / 100000,
            volume: isNaN(volume) ? 1000 : Math.round(volume),
          };
        })
        .filter((c) => !isNaN(c.open) && !isNaN(c.close) && c.open > 0)
        .reverse();

      if (parsed.length > 0) {
        candleCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
        return parsed;
      }

      return null;
    } catch (err) {
      console.warn(`[TwelveData] Candles fetch failed for ${tdSymbol}:`, err);
      return null;
    }
  }

  /**
   * Test API Key validity
   */
  public async testConnection(): Promise<{
    success: boolean;
    provider: string;
    message: string;
    rateLimitRemaining?: string;
  }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        provider: 'Twelve Data (https://twelvedata.com/)',
        message: 'No TWELVE_DATA_API_KEY configured in environment.',
      };
    }

    try {
      const url = `https://api.twelvedata.com/quote?symbol=EUR/USD&apikey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'error' || data.code) {
        return {
          success: false,
          provider: 'Twelve Data (https://twelvedata.com/)',
          message: data.message || 'API responded with error',
        };
      }

      return {
        success: true,
        provider: 'Twelve Data (https://twelvedata.com/)',
        message: `Connected successfully. EUR/USD live price: ${data.close || 'N/A'}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return {
        success: false,
        provider: 'Twelve Data (https://twelvedata.com/)',
        message: `Connection failed: ${msg}`,
      };
    }
  }
}

export const twelveDataService = new TwelveDataService();
