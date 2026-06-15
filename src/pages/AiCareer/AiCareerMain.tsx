// "我的AI生涯" center page — editable avatar, five activity stats, the
// contribution heatmap, and the four family cards. The three blocks (stats,
// heatmap, cards) all span the same row width so they line up. Selecting a
// family card drives the right panel (AiCareerPanel) via the shared store.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useI18n } from '../../hooks/useI18n';
import { useAiCareerStore } from '../../stores/aiCareerStore';
import {
  aiCareerHeatmap,
  aiCareerTokenBytes,
  getAvatar,
  setAvatar,
  type AiCareerFamily,
} from '../../api/aiCareer';
import { deriveStats, entriesToBuckets, formatCompact, type DayBuckets } from './heatmapData';

// Approximate cumulative tokens *processed*. Each turn re-sends the ever-
// growing context, so real usage runs far above the raw stored content (stored
// once, re-read many times) — we scale the on-disk byte size up to reflect
// that. Deliberately generous; the stat is labelled "约 / Est." anyway. Tune
// this one number to dial the magnitude.
const TOKENS_PER_BYTE = 12;
import { ContributionHeatmap } from './ContributionHeatmap';

const EMPTY_BUCKETS: DayBuckets = { messages: new Map(), sessions: new Map() };

// Default avatar — a small (320px, ~32KB WebP) image bundled in public/, so it
// shows instantly offline with no network/CDN dependency. Replaced by the
// user's own image once they pick one.
const DEFAULT_AVATAR = '/default-avatar.webp';

const FAMILIES: ReadonlyArray<{ id: AiCareerFamily; name: string; icon: string }> = [
  { id: 'claude', name: 'Claude', icon: 'claude' },
  { id: 'codex', name: 'Codex', icon: 'codex' },
  { id: 'opencode', name: 'OpenCode', icon: 'opencode' },
  { id: 'hermes', name: 'Hermes', icon: 'hermes' },
  { id: 'mimo', name: 'MiMo', icon: 'mimocode' },
];

function FamilyIcon({ icon, name }: { icon: string; name: string }) {
  // Most tool icons are SVG; a couple (e.g. hermes) ship as PNG — fall back
  // once on error, matching ToolCard's behaviour.
  const [src, setSrc] = useState(`./icons/tools/${icon}.svg`);
  return (
    <img
      src={src}
      alt={name}
      className="w-8 h-8 rounded-lg flex-shrink-0 object-contain"
      onError={() => {
        if (src.endsWith('.svg')) setSrc(`./icons/tools/${icon}.png`);
      }}
    />
  );
}

export function AiCareerMain() {
  const { t } = useI18n();
  const selectedFamily = useAiCareerStore((s) => s.selectedFamily);
  const setSelectedFamily = useAiCareerStore((s) => s.setSelectedFamily);
  const refreshKey = useAiCareerStore((s) => s.refreshKey);
  const setRefreshing = useAiCareerStore((s) => s.setRefreshing);

  const [buckets, setBuckets] = useState<DayBuckets>(EMPTY_BUCKETS);
  const [avatar, setAvatarUrl] = useState<string | null>(null);
  const [tokenBytes, setTokenBytes] = useState(0);

  // Heatmap + stats — fetched on mount and whenever the refresh button bumps
  // refreshKey, re-scanning disk for new sessions/messages.
  useEffect(() => {
    let cancelled = false;
    aiCareerHeatmap()
      .then((entries) => {
        if (!cancelled) setBuckets(entriesToBuckets(entries));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    aiCareerTokenBytes()
      .then((b) => {
        if (!cancelled) setTokenBytes(b);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshKey, setRefreshing]);

  // Avatar — loaded once.
  useEffect(() => {
    getAvatar()
      .then(setAvatarUrl)
      .catch(() => {});
  }, []);

  const stats = useMemo(() => deriveStats(buckets), [buckets]);

  const handleEditAvatar = useCallback(async () => {
    try {
      const picked = await openDialog({
        multiple: false,
        filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }],
      });
      if (typeof picked !== 'string') return;
      await setAvatar(picked);
      setAvatarUrl(await getAvatar());
    } catch {
      /* user cancelled or the file wasn't a decodable image */
    }
  }, []);

  const estTokens = Math.round(tokenBytes * TOKENS_PER_BYTE);
  const statCards: ReadonlyArray<{ label: string; value: string }> = [
    { label: t('aiCareer.stat.sessions'), value: formatCompact(stats.totalSessions) },
    { label: t('aiCareer.stat.messages'), value: formatCompact(stats.totalMessages) },
    { label: t('aiCareer.stat.tokens'), value: formatCompact(estTokens) },
    { label: t('aiCareer.stat.activeDays'), value: formatCompact(stats.activeDays) },
    { label: t('aiCareer.stat.longestStreak'), value: formatCompact(stats.longestStreak) },
  ];

  return (
    <div className="max-w-3xl mx-auto min-h-full flex flex-col items-center justify-center gap-10 py-2">
      {/* Avatar — defaults to the app icon; click the avatar itself to pick a
          local image (stored as ~/.echobird/avatar.png). No edit-icon / tooltip
          chrome by design; a subtle hover dim hints it's clickable. */}
      <button type="button" onClick={handleEditAvatar} className="group cursor-pointer">
        <div className="w-40 h-40 rounded-full overflow-hidden border border-cyber-border/60 bg-cyber-surface flex items-center justify-center transition-opacity group-hover:opacity-85">
          <img
            src={avatar || DEFAULT_AVATAR}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.endsWith('/brand/bird.png')) img.src = '/brand/bird.png';
            }}
          />
        </div>
      </button>

      {/* Five activity stats */}
      <div className="grid grid-cols-5 gap-3 w-full">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-cyber-border/40 bg-cyber-surface px-2 py-4"
          >
            <span className="text-3xl font-bold text-cyber-text tabular-nums">{c.value}</span>
            <span className="text-xs text-cyber-text-secondary text-center leading-tight">
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Contribution heatmap — full row width, lines up with the stats above */}
      <div className="w-full">
        <ContributionHeatmap buckets={buckets} />
      </div>

      {/* Family cards — 3 per row, inheriting the Model Nexus / App Manager
          grid rhythm. Selecting one drives the right-side session list. */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {FAMILIES.map((f) => {
          const selected = selectedFamily === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFamily(f.id)}
              className={`flex items-center gap-2.5 p-4 border bg-cyber-surface rounded-card transition-colors ${
                selected ? 'border-cyber-accent' : 'border-transparent hover:bg-cyber-elevated'
              }`}
            >
              <FamilyIcon icon={f.icon} name={f.name} />
              {/* Match the left-nav label: 15px / medium weight, all in the
                  primary cream — the same "white" as the sidebar tool names. */}
              <span className="text-[15px] font-medium whitespace-nowrap text-cyber-text">
                {f.name} {t('aiCareer.familySuffix')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Title-bar refresh button (rendered by App.tsx in the page-title actions
// slot, like AI 资讯 / 明星项目). Bumps the store's refreshKey to re-scan.
export function AiCareerTitleActions() {
  const { t } = useI18n();
  const refresh = useAiCareerStore((s) => s.refresh);
  const refreshing = useAiCareerStore((s) => s.refreshing);
  return (
    <button
      type="button"
      onClick={refresh}
      disabled={refreshing}
      className={`text-sm px-3 py-1.5 border rounded-md transition-colors flex items-center gap-2 ${
        !refreshing
          ? 'border-cyber-border/50 text-cyber-text hover:bg-cyber-text/10'
          : 'border-cyber-border text-cyber-text-muted cursor-not-allowed'
      }`}
    >
      <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
      {t('btn.refresh')}
    </button>
  );
}
