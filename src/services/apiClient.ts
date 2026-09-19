// FSL TRADER — AI MARKET VISION PRO
// Client API Service Layer
// Communicates with server endpoints with token persistence and error normalization.

import {
  User,
  License,
  SignalResult,
  MarketSummary,
  OHLCVCandle,
  Strategy,
  IndicatorConfig,
  BacktestResult,
  AuditLog,
  SystemLog,
  SystemHealth,
} from '../types';

const TOKEN_KEY = 'fsl_auth_token';

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Server request failed');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err as any).code = data.code;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err as any).details = data.details;
      throw err;
    }

    return data as T;
  },

  // --- Auth ---
  async login(email: string, password: string, deviceFingerprint?: string) {
    const res = await this.request<{
      token: string;
      user: User;
      license: License | null;
      licenseValid: boolean;
      licenseReason: string;
      deviceLimitReached: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceFingerprint }),
    });
    if (res.token) this.setToken(res.token);
    return res;
  },

  async register(name: string, email: string, password: string, licenseKey?: string) {
    const res = await this.request<{
      token: string;
      user: User;
      license: License | null;
      licenseValid: boolean;
      licenseReason: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, licenseKey }),
    });
    if (res.token) this.setToken(res.token);
    return res;
  },

  async getMe() {
    return this.request<{
      user: User;
      license: License | null;
      licenseValid: boolean;
      licenseReason: string;
    }>('/auth/me');
  },

  async getProfile() {
    return this.getMe();
  },

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  },

  // --- License ---
  async activateLicense(key: string, deviceFingerprint?: string) {
    return this.request<{
      success: boolean;
      license: License;
      user: User;
      message: string;
    }>('/license/activate', {
      method: 'POST',
      body: JSON.stringify({ key, deviceFingerprint }),
    });
  },

  async getLicenseStatus() {
    return this.request<{
      active: boolean;
      license: License | null;
      reason: string;
    }>('/license/status');
  },

  // --- Analyzer ---
  async analyze(params: {
    imageBase64?: string;
    symbol?: string;
    timeframe?: string;
    mimeType?: string;
  }) {
    return this.request<{
      success: boolean;
      signal: SignalResult;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      indicators: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vision: any;
    }>('/analyzer/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // --- Signals History ---
  async getSignals(params?: { symbol?: string; direction?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.symbol) query.set('symbol', params.symbol);
    if (params?.direction) query.set('direction', params.direction);
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ signals: SignalResult[] }>(`/signals${qs}`);
  },

  // --- Markets & Candles ---
  async getMarkets() {
    return this.request<{ markets: MarketSummary[] }>('/markets');
  },

  async getCandles(symbol: string) {
    return this.request<{
      symbol: string;
      candles: OHLCVCandle[];
      lastPrice: number;
      change24h: number;
      isLive: boolean;
    }>(`/markets/${encodeURIComponent(symbol)}/candles`);
  },

  async getMarketScanner() {
    return this.request<{
      scanner: Array<{
        symbol: string;
        marketType: string;
        lastPrice: number;
        change24h: number;
        volatility: string;
        confluenceScore: number;
        direction: 'UP' | 'DOWN' | 'NO_TRADE';
        setupQuality: string;
        structure: string;
      }>;
      timestamp: string;
    }>('/markets/scanner');
  },

  // --- Watchlist ---
  async getWatchlist() {
    return this.request<{ watchlist: MarketSummary[] }>('/watchlist');
  },

  async addToWatchlist(symbol: string) {
    return this.request<{ success: boolean; symbols: string[] }>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  },

  async removeFromWatchlist(symbol: string) {
    return this.request<{ success: boolean }>(`/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    });
  },

  // --- Admin ---
  async getAdminStats() {
    return this.request<{
      totalUsers: number;
      activeUsers: number;
      activeLicenses: number;
      expiredLicenses: number;
      todayScans: number;
      todaySignalsCount: number;
      upSignals: number;
      downSignals: number;
      noTradeSignals: number;
      apiStatus: string;
      marketDataStatus: string;
      systemHealth: SystemHealth;
    }>('/admin/stats');
  },

  async getAdminUsers() {
    return this.request<{ users: User[] }>('/admin/users');
  },

  async updateAdminUser(id: string, updates: Partial<User> & { newPassword?: string; assignLicenseKey?: string }) {
    return this.request<{ success: boolean; user: User }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async getAdminLicenses() {
    return this.request<{ licenses: License[] }>('/admin/licenses');
  },

  async generateLicense(data: {
    plan: string;
    expirationDays: number;
    maxDevices: number;
    dailyScanLimit: number;
    notes?: string;
  }) {
    return this.request<{ success: boolean; license: License }>('/admin/licenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateBulkLicenses(data: {
    plan: string;
    expirationDays: number;
    maxDevices: number;
    dailyScanLimit: number;
    quantity: number;
  }) {
    return this.request<{ success: boolean; count: number; licenses: License[] }>('/admin/licenses/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLicense(id: string, updates: Partial<License> & { extendDays?: number }) {
    return this.request<{ success: boolean; license: License }>(`/admin/licenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteLicense(id: string) {
    return this.request<{ success: boolean }>(`/admin/licenses/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminLogs() {
    return this.request<{ auditLogs: AuditLog[]; systemLogs: SystemLog[] }>('/admin/logs');
  },

  async getAdminStrategies() {
    return this.request<{ strategies: Strategy[] }>('/admin/strategies');
  },

  async createAdminStrategy(data: Partial<Strategy>) {
    return this.request<{ success: boolean; strategy: Strategy }>('/admin/strategy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdminStrategy(id: string, data: Partial<Strategy>) {
    return this.request<{ success: boolean; strategy: Strategy }>(`/admin/strategy/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminStrategy(id: string) {
    return this.request<{ success: boolean }>(`/admin/strategy/${id}`, {
      method: 'DELETE',
    });
  },

  async getEngineSettings() {
    return this.request<{ config: IndicatorConfig }>('/admin/engine-settings');
  },

  async updateEngineSettings(config: Partial<IndicatorConfig>) {
    return this.request<{ success: boolean; config: IndicatorConfig }>('/admin/engine-settings', {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
  },

  async runBacktest(params: { strategyId?: string; symbol: string; timeframe: string; candleCount: number }) {
    return this.request<{ success: boolean; result: BacktestResult }>('/admin/backtest', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // --- Twelve Data Integration ---
  async getTwelveDataStatus() {
    return this.request<{
      provider: string;
      providerUrl: string;
      isConfigured: boolean;
      maskedKey: string | null;
      supportedIntervals: string[];
      pairsTracked: string[];
    }>('/market-data/status');
  },

  async testTwelveDataConnection() {
    return this.request<{
      success: boolean;
      provider: string;
      message: string;
    }>('/market-data/test', {
      method: 'POST',
    });
  },
};
