// ChangelogDialog — "更新日志 / Changelog" modal. Opened from the title-bar
// button (left of Feedback) and auto-opened once on the first launch after an
// update. Content is the current release's notes read straight from the
// version manifest (echobird.ai/api/version/index.json); only the section
// matching the active UI locale is shown.
import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18n } from '../hooks/useI18n';
import { mdComponents } from '../pages/MotherAgent/mdComponents';

const VERSION_MANIFEST_URL = 'https://echobird.ai/api/version/index.json';

interface Manifest {
  version?: string;
  releaseDate?: string;
  // Legacy single-blob notes ("## 中文 / ## English / ## 日本語"), kept for
  // manifests written before the per-language split.
  releaseNotes?: string;
  // Preferred: notes stored per language, keyed by a short language code
  // ("en" / "zh-cn" / "zh-tw" / "ja") — the marker the manifest author writes.
  // The app maps its locale to the matching code (see LOCALE_TO_NOTES_CODE).
  releaseNotesI18n?: Record<string, string>;
}

// Map an app locale to the manifest's language marker. The manifest uses
// friendly codes (zh-cn / zh-tw) rather than the app's internal locale ids
// (zh-Hans / zh-Hant), so hand-writing the notes JSON reads naturally.
const LOCALE_TO_NOTES_CODE: Record<string, string> = {
  en: 'en',
  'zh-Hans': 'zh-cn',
  'zh-Hant': 'zh-tw',
  ja: 'ja',
};

// releaseNotes is markdown with per-language sections ("## 中文 / ## English /
// ## 日本語"). Return just the section for the active locale, header stripped,
// so a user sees only their language. Falls back to the whole string when no
// section matches (e.g. a future single-language note).
function sectionForLocale(releaseNotes: string, locale: string): string {
  const label = locale === 'en' ? 'English' : locale === 'ja' ? '日本語' : '中文';
  const blocks = releaseNotes
    .split(/\n?##\s+/)
    .map((b) => b.trim())
    .filter(Boolean);
  for (const block of blocks) {
    const nl = block.indexOf('\n');
    const head = (nl === -1 ? block : block.slice(0, nl)).trim();
    if (head === label) {
      return nl === -1 ? '' : block.slice(nl + 1).trim();
    }
  }
  return releaseNotes.trim();
}

// Pick the notes for the active locale: prefer the structured per-language
// field, falling back to English, then to any language present, then to
// parsing the legacy single-blob releaseNotes.
function notesForLocale(m: Manifest, locale: string): string {
  const i18n = m.releaseNotesI18n;
  if (i18n && typeof i18n === 'object') {
    const code = LOCALE_TO_NOTES_CODE[locale] ?? locale;
    const picked = i18n[code] || i18n.en || i18n['zh-cn'] || Object.values(i18n)[0];
    if (picked) return picked.trim();
  }
  if (m.releaseNotes) return sectionForLocale(m.releaseNotes, locale);
  return '';
}

interface ChangelogDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogDialog: React.FC<ChangelogDialogProps> = ({ isOpen, onClose }) => {
  const { t, locale } = useI18n();
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Fetch the manifest each time the dialog opens — it's a tiny JSON and we
  // want the freshest notes. The initial state is 'loading' (covers the first
  // open); on later opens we keep the last content visible and refetch
  // silently, so there's no loading flash. Failure surfaces as the error state.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(VERSION_MANIFEST_URL);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Manifest;
        if (cancelled) return;
        setManifest(data);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

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

  if (!isOpen) return null;

  const notes = manifest ? notesForLocale(manifest, locale) : '';

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
        className={`relative w-[520px] max-w-[92vw] border border-cyber-border/30 bg-cyber-surface shadow-2xl rounded-xl overflow-hidden transition-all duration-200 ${
          isAnimatingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-px w-full bg-cyber-border" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-lg font-bold text-cyber-text">{t('nav.changelog')}</span>
            {manifest?.version && (
              <span className="text-xs font-mono text-cyber-accent">v{manifest.version}</span>
            )}
            {manifest?.releaseDate && (
              <span className="text-xs font-mono text-cyber-text-secondary">
                {manifest.releaseDate}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-cyber-text-secondary hover:text-cyber-text transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          {status === 'loading' && (
            <p className="text-sm text-cyber-text-secondary py-8 text-center">
              {t('changelog.loading')}
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-cyber-text-secondary py-8 text-center">
              {t('changelog.error')}
            </p>
          )}
          {status === 'ready' &&
            (notes ? (
              <div className="text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {notes}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-cyber-text-secondary py-8 text-center">
                {t('changelog.empty')}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
};
