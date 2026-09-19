// FSL TRADER — AI MARKET VISION PRO
// License Activation & Management Modal
// Validates keys against server, handles device quotas, and provides test keys.

import React, { useState } from 'react';
import { License, User } from '../types';
import { apiClient } from '../services/apiClient';
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  Laptop,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLicense: License | null;
  user: User | null;
  onLicenseActivated: (lic: License, user: User) => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  currentLicense,
  user,
  onLicenseActivated,
}) => {
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivate = async (keyToUse?: string) => {
    const key = (keyToUse || licenseKeyInput).trim().toUpperCase();
    if (!key) {
      setErrorMessage('Please enter a valid license key.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient.activateLicense(key);
      setSuccessMessage(res.message || 'License activated successfully!');
      onLicenseActivated(res.license, res.user);
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#6366f1', '#3b82f6'],
        });
      } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Activation failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = currentLicense?.expiresAt
    ? new Date(currentLicense.expiresAt) < new Date()
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b0e1a] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-400">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-mono tracking-wide">
                FSL TRADER LICENSE
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Institutional Access & Device Quotas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current License Status Card */}
        {currentLicense && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">CURRENT PLAN:</span>
              <span className="px-2.5 py-0.5 rounded font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                {currentLicense.plan}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">KEY:</span>
              <span className="font-bold text-slate-200">{currentLicense.key}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">STATUS:</span>
              <span
                className={`font-bold ${
                  currentLicense.status === 'ACTIVE' && !isExpired
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {isExpired ? 'EXPIRED' : currentLicense.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">EXPIRES:</span>
              <span className="text-slate-300">
                {currentLicense.expiresAt
                  ? new Date(currentLicense.expiresAt).toLocaleDateString()
                  : 'NEVER (LIFETIME)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">DEVICE LIMIT:</span>
              <span className="text-slate-300">
                {user?.devicesActive || 1} / {currentLicense.maxDevices} Devices
              </span>
            </div>
          </div>
        )}

        {/* Activation Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-slate-300 block">
            ENTER LICENSE KEY
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="license-key-input"
              value={licenseKeyInput}
              onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
              placeholder="FSL-XXXX-XXXX-XXXX-XXXX"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-sm font-mono tracking-widest text-white uppercase focus:outline-none focus:border-purple-500"
            />
            <button
              id="activate-license-submit-btn"
              onClick={() => handleActivate()}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-mono font-bold text-xs tracking-wider text-white transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'VERIFYING...' : 'ACTIVATE'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Demo Test Keys for Evaluators */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ONE-CLICK TEST KEYS:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() => {
                setLicenseKeyInput('FSL-ENT1-9002-3114-7782');
                handleActivate('FSL-ENT1-9002-3114-7782');
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-purple-500/20 text-left transition-all group"
            >
              <div className="font-bold text-purple-300">ENTERPRISE SYNDICATE</div>
              <div className="text-[10px] text-slate-400 truncate">FSL-ENT1-9002-3114-7782</div>
            </button>

            <button
              onClick={() => {
                setLicenseKeyInput('FSL-PRO9-8832-7719-4401');
                handleActivate('FSL-PRO9-8832-7719-4401');
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-500/20 text-left transition-all group"
            >
              <div className="font-bold text-indigo-300">PRO VISION</div>
              <div className="text-[10px] text-slate-400 truncate">FSL-PRO9-8832-7719-4401</div>
            </button>

            <button
              onClick={() => {
                setLicenseKeyInput('FSL-UNSD-7711-2299-4455');
                handleActivate('FSL-UNSD-7711-2299-4455');
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-emerald-500/20 text-left transition-all group"
            >
              <div className="font-bold text-emerald-300">NEW UNUSED VIP KEY</div>
              <div className="text-[10px] text-slate-400 truncate">FSL-UNSD-7711-2299-4455</div>
            </button>

            <button
              onClick={() => {
                setLicenseKeyInput('FSL-EXPD-1029-3847-5612');
                handleActivate('FSL-EXPD-1029-3847-5612');
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-rose-500/20 text-left transition-all group"
            >
              <div className="font-bold text-rose-300">TEST EXPIRED KEY</div>
              <div className="text-[10px] text-slate-400 truncate">FSL-EXPD-1029-3847-5612</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
