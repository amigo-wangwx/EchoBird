// SettingsDialog — Global settings modal (gear button in title bar)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Globe, Download, ExternalLink, Sun, Moon, Monitor, Sparkles } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { MiniSelect } from './MiniSelect';
import { useI18n } from '../hooks/useI18n';
import * as api from '../api/tauri';
import { isNewerVersion } from '../utils/version';
import { useThemeStore, type ThemeMode } from '../stores/themeStore';

// All supported locales
const LOCALE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'zh-Hans', label: '简体中文' },
  { id: 'zh-Hant', label: '繁體中文' },
  { id: 'ja', label: '日本語' },
];

// localStorage flag gating the opt-in apply effect + sound. MUST match the key
// AppManagerProvider reads. Default off, so it never bothers work-focused users.
const EASTER_EGG_KEY = 'echobird_easter_egg';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  locale,
  onLocaleChange,
}) => {
  const { t } = useI18n();
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'latest' | 'available'>('latest');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');
  // In-app self-update (Windows) progress state.
  const [installing, setInstalling] = useState(false);
  const [installPhase, setInstallPhase] = useState<
    'speed_test' | 'downloading' | 'launching' | 'error' | null
  >(null);
  const [installPct, setInstallPct] = useState(0);
  const [closeToTray, setCloseToTray] = useState<boolean | null>(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Read the installed binary version from Tauri at runtime — single source of truth (tauri.conf.json).
  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion(''));
  }, []);

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      setEasterEgg(localStorage.getItem(EASTER_EGG_KEY) === 'true');
      api.getSettings().then((settings) => {
        setCloseToTray(settings.closeToTray ?? false);
      });
    }
  }, [isOpen]);

  const handleEasterEggChange = useCallback((value: boolean) => {
    setEasterEgg(value);
    try {
      localStorage.setItem(EASTER_EGG_KEY, String(value));
    } catch {
      /* private mode */
    }
  }, []);

  // Save closeToTray setting when it changes
  const handleCloseToTrayChange = useCallback(async (value: boolean | null) => {
    setCloseToTray(value);
    const settings = await api.getSettings();
    // Mark the close behavior as explicitly chosen. This both suppresses the
    // first-time onboarding dialog and — critically — prevents that dialog from
    // later overwriting an explicit "always ask" (null) selection.
    await api.saveSettings({
      ...settings,
      closeToTray: value,
      closeWindowBehaviorSet: true,
    });
  }, []);

  // Close with animation
  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  }, [onClose]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  // Auto-check for updates when the dialog opens — no manual button. Version
  // truth is the canonical manifest (echobird.ai/api/version/index.json); the
  // China route is a download MIRROR only, so we never parse a second version
  // source. Any failure (offline / unreachable) silently stays on "latest" —
  // no error UI, just no update offered.
  useEffect(() => {
    if (!isOpen || !appVersion) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('https://echobird.ai/api/version/index.json');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.version && isNewerVersion(data.version, appVersion)) {
          setLatestVersion(data.version);
          setUpdateStatus('available');
        } else {
          setUpdateStatus('latest');
        }
      } catch {
        /* offline / unreachable — stay on "latest", no update offered */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, appVersion]);

  // Click "Update to vX": on Windows, download + launch the installer in-app
  // (the app exits as the wizard opens); elsewhere — or if the download fails —
  // open the locale-routed download page in the browser instead.
  const handleUpdate = useCallback(async () => {
    if (!latestVersion) return;
    const downloadPage = locale.startsWith('zh')
      ? 'https://echobird.cn/download/'
      : 'https://echobird.ai/';
    if (!navigator.userAgent.includes('Windows')) {
      await api.openExternal(downloadPage);
      return;
    }
    setInstalling(true);
    setInstallPhase('speed_test');
    setInstallPct(0);
    let unlisten: (() => void) | undefined;
    try {
      unlisten = await api.onSelfUpdateProgress((p) => {
        setInstallPhase(p.status);
        setInstallPct(p.percent);
      });
      await api.downloadAndInstallUpdate(latestVersion);
      // Success: the installer launched and the app is about to exit — leave
      // the progress UI as-is until the window closes.
    } catch {
      await api.openExternal(downloadPage);
      setInstalling(false);
      setInstallPhase(null);
    } finally {
      unlisten?.();
    }
  }, [latestVersion, locale]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center transition-all duration-200 ${
        isAnimatingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`relative w-[440px] max-w-[92vw] border border-cyber-border/30 bg-cyber-surface shadow-2xl rounded-xl overflow-hidden transition-all duration-200 ${
          isAnimatingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-px w-full bg-cyber-border" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <span className="text-lg font-bold text-cyber-text">{t('settings.title')}</span>
          <button
            onClick={handleClose}
            className="text-cyber-text-secondary hover:text-cyber-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* Version */}
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-cyber-text-secondary">{t('settings.version')}</span>
            <span className="text-[14px] font-mono font-medium text-cyber-text">
              {appVersion ? `v${appVersion}` : '—'}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-cyber-border/50" />

          {/* Appearance — Light / Dark / System */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Sun size={14} className="text-cyber-text-secondary" />
              <span className="text-[14px] font-medium text-cyber-text-secondary">
                {t('settings.appearance')}
              </span>
            </div>
            <ThemeSegmented
              value={themeMode}
              onChange={setThemeMode}
              labels={{
                light: t('settings.themeLight'),
                dark: t('settings.themeDark'),
                system: t('settings.themeSystem'),
              }}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-cyber-border/50" />

          {/* Close Window Behavior */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <X size={14} className="text-cyber-text-secondary" />
              <span className="text-[14px] font-medium text-cyber-text-secondary">
                {t('settings.closeWindowBehavior')}
              </span>
            </div>
            <div className="flex gap-1 p-1 bg-cyber-input border border-cyber-border rounded-button">
              <button
                onClick={() => handleCloseToTrayChange(false)}
                className={`flex-1 h-9 flex items-center justify-center text-[13px] transition-colors rounded ${
                  closeToTray === false
                    ? 'bg-cyber-text/15 text-cyber-text font-semibold'
                    : 'text-cyber-text-secondary hover:text-cyber-text hover:bg-cyber-elevated'
                }`}
              >
                {t('settings.closeDirectly')}
              </button>
              <button
                onClick={() => handleCloseToTrayChange(true)}
                className={`flex-1 h-9 flex items-center justify-center text-[13px] transition-colors rounded ${
                  closeToTray === true
                    ? 'bg-cyber-text/15 text-cyber-text font-semibold'
                    : 'text-cyber-text-secondary hover:text-cyber-text hover:bg-cyber-elevated'
                }`}
              >
                {t('settings.closeToTray')}
              </button>
              <button
                onClick={() => handleCloseToTrayChange(null)}
                className={`flex-1 h-9 flex items-center justify-center text-[13px] transition-colors rounded ${
                  closeToTray === null
                    ? 'bg-cyber-text/15 text-cyber-text font-semibold'
                    : 'text-cyber-text-secondary hover:text-cyber-text hover:bg-cyber-elevated'
                }`}
              >
                {t('settings.alwaysAsk')}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-cyber-border/50" />

          {/* Language */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-cyber-text-secondary" />
              <span className="text-[14px] font-medium text-cyber-text-secondary">
                {t('settings.language')}
              </span>
            </div>
            <MiniSelect value={locale} onChange={onLocaleChange} options={LOCALE_OPTIONS} />
          </div>

          {/* Divider */}
          <div className="h-px bg-cyber-border/50" />

          {/* Easter Egg — opt-in playful apply effect + sound (default off). No
              hint on purpose: an easter egg explained is no fun. */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-cyber-text-secondary" />
              <span className="text-[14px] font-medium text-cyber-text-secondary">
                {t('settings.easterEgg')}
              </span>
            </div>
            <ToggleSwitch checked={easterEgg} onChange={handleEasterEggChange} />
          </div>

          {/* Divider */}
          <div className="h-px bg-cyber-border/50" />

          {/* Update check */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Download size={14} className="text-cyber-text-secondary" />
              <span className="text-[14px] font-medium text-cyber-text-secondary">
                {t('settings.updates')}
              </span>
            </div>

            <div className="h-10 flex items-center">
              {installing ? (
                <div className="relative w-full h-10 overflow-hidden border border-cyber-accent/40 bg-cyber-input/30 rounded-button">
                  <div
                    className="absolute inset-y-0 left-0 bg-cyber-accent/20 transition-[width] duration-200"
                    style={{
                      width: `${
                        installPhase === 'launching'
                          ? 100
                          : installPhase === 'speed_test'
                            ? 8
                            : installPct
                      }%`,
                    }}
                  />
                  <div className="relative flex items-center justify-center h-full text-[13px] font-medium text-cyber-text">
                    {installPhase === 'launching'
                      ? t('settings.updateLaunching')
                      : installPhase === 'speed_test'
                        ? `${t('settings.updateDownloading')}…`
                        : `${t('settings.updateDownloading')} ${installPct}%`}
                  </div>
                </div>
              ) : updateStatus === 'available' ? (
                <button
                  onClick={handleUpdate}
                  className="flex items-center justify-center gap-1.5 w-full h-10 text-[14px] font-semibold border border-cyber-accent/50 bg-cyber-accent/10 text-cyber-accent hover:bg-cyber-accent/20 hover:border-cyber-accent transition-colors rounded-button"
                >
                  {t('settings.updateTo')} v{latestVersion} <Download size={13} />
                </button>
              ) : (
                <div className="w-full h-10 flex items-center justify-center gap-1.5 text-[14px] text-cyber-text border border-cyber-border/30 bg-cyber-input/30 rounded-button">
                  <span className="text-cyber-accent">✓</span> {t('settings.latestVersion')}
                </div>
              )}
            </div>
          </div>

          {/* Website link */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => api.openExternal('https://echobird.ai')}
              className="text-[14px] font-mono font-medium text-cyber-text-secondary hover:text-cyber-text transition-colors flex items-center gap-1.5"
            >
              EchoBird <ExternalLink size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact on/off switch.
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({
  checked,
  onChange,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full outline-none transition-colors ${
      checked ? 'bg-cyber-accent' : 'bg-cyber-border'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
        checked ? 'translate-x-[18px]' : 'translate-x-1'
      }`}
    />
  </button>
);

// 3-button segmented control for the theme: Light / Dark / System.
const ThemeSegmented: React.FC<{
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  labels: { light: string; dark: string; system: string };
}> = ({ value, onChange, labels }) => {
  const opts: Array<{ id: ThemeMode; icon: React.ReactNode; label: string }> = [
    { id: 'light', icon: <Sun size={14} />, label: labels.light },
    { id: 'dark', icon: <Moon size={14} />, label: labels.dark },
    { id: 'system', icon: <Monitor size={14} />, label: labels.system },
  ];
  return (
    <div className="flex gap-1 p-1 bg-cyber-input border border-cyber-border rounded-button">
      {opts.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`flex-1 h-9 flex items-center justify-center gap-1.5 text-[14px] transition-colors rounded ${
              active
                ? 'bg-cyber-text/15 text-cyber-text font-semibold'
                : 'text-cyber-text-secondary hover:text-cyber-text hover:bg-cyber-elevated'
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
};
