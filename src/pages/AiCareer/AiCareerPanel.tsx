// Right panel for "我的AI生涯" — the selected family's session history.
// One family at a time (set by the family cards in AiCareerMain) keeps the
// payload small; rows page in on scroll via the backend `offset`. Scrolls
// with the wheel only — the scrollbar is hidden (slim-scroll) so the list
// doesn't shift when it appears. Loading shows skeleton rows, not text.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useAiCareerStore } from '../../stores/aiCareerStore';
import { aiCareerFamilyHistory, type SavedSession } from '../../api/aiCareer';

const PAGE = 30;
// Title-bar widths for skeleton rows — varied so the placeholder reads as a
// list of different-length titles rather than identical blocks.
const SKELETON_WIDTHS = ['72%', '58%', '80%', '52%', '68%', '76%', '61%'];

function parseSavedMs(savedAt: string): number {
  const parsed = Date.parse(savedAt);
  if (!isNaN(parsed)) return parsed;
  const num = Number(savedAt);
  if (!isNaN(num) && num > 0) return num < 1e11 ? num * 1000 : num;
  return Date.now();
}

function SkeletonRow({ w }: { w: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-cyber-border/40 bg-cyber-text/[0.02] px-3 py-2.5">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 rounded bg-cyber-text/10 animate-pulse" style={{ width: w }} />
        <div className="h-2.5 w-2/5 rounded bg-cyber-text/10 animate-pulse" />
      </div>
    </div>
  );
}

export function AiCareerPanel() {
  const { t, locale } = useI18n();
  const selectedFamily = useAiCareerStore((s) => s.selectedFamily);
  const refreshKey = useAiCareerStore((s) => s.refreshKey);

  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset + load the first page whenever the selected family changes.
  useEffect(() => {
    let cancelled = false;
    setSessions([]);
    setHasMore(true);
    offsetRef.current = 0;
    setLoading(true);
    // Hold the skeleton for a short minimum so a refresh is visibly "loading"
    // even for families that return instantly (few / unchanged sessions).
    const minDelay = new Promise<void>((resolve) => window.setTimeout(resolve, 350));
    Promise.all([aiCareerFamilyHistory(selectedFamily, 0, PAGE), minDelay])
      .then(([rows]) => {
        if (cancelled) return;
        setSessions(rows);
        offsetRef.current = rows.length;
        setHasMore(rows.length === PAGE);
      })
      .catch(() => {
        if (!cancelled) setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedFamily, refreshKey]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    aiCareerFamilyHistory(selectedFamily, offsetRef.current, PAGE)
      .then((rows) => {
        setSessions((prev) => [...prev, ...rows]);
        offsetRef.current += rows.length;
        setHasMore(rows.length === PAGE);
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoading(false));
  }, [selectedFamily, loading, hasMore]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, sessions.length]);

  const relativeTime = (savedAt: string): string => {
    const ms = parseSavedMs(savedAt);
    const diff = Date.now() - ms;
    const d = new Date(ms);
    const now = new Date();
    if (diff < 3_600_000) return t('aiCareer.timeJustNow');
    if (now.toDateString() === d.toDateString()) return t('aiCareer.timeToday');
    if (new Date(Date.now() - 86_400_000).toDateString() === d.toDateString())
      return t('aiCareer.timeYesterday');
    const days = Math.floor(diff / 86_400_000);
    if (days < 7) return t('aiCareer.timeDaysAgo').replace('{days}', String(days));
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  // Copy the session's on-disk file path to the clipboard (like Coffee CLI's
  // copy-path button), with a brief Copy → Check confirmation on the row.
  const handleCopy = (e: React.MouseEvent, id: string, path: string | null) => {
    e.stopPropagation();
    if (!path) return;
    navigator.clipboard
      .writeText(path)
      .then(() => {
        setCopiedId(id);
        window.setTimeout(() => setCopiedId(null), 1500);
      })
      .catch(() => {});
  };

  // First load → skeleton rows (no "loading" text).
  if (loading && sessions.length === 0) {
    return (
      <div className="h-full overflow-y-auto slim-scroll pr-1 pb-5 space-y-2">
        {SKELETON_WIDTHS.map((w, i) => (
          <SkeletonRow key={i} w={w} />
        ))}
      </div>
    );
  }

  // Empty (centered, matching the App Manager panel's style).
  if (sessions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-cyber-text-secondary text-center">{t('aiCareer.noSessions')}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto slim-scroll pr-1 pb-5 space-y-2">
      {sessions.map((session) => {
        const meta = session.turn_count
          ? `${relativeTime(session.saved_at)} · ${t('aiCareer.messages').replace('{count}', String(session.turn_count))}`
          : relativeTime(session.saved_at);
        return (
          <div
            key={session.id}
            className="group flex items-center gap-2 rounded-lg border border-cyber-border/40 bg-cyber-text/[0.02] px-3 py-2.5 hover:bg-cyber-text/[0.06] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-cyber-text truncate">{session.name}</div>
              <div className="text-[11px] text-cyber-text-secondary truncate mt-0.5">{meta}</div>
            </div>
            {session.file_path && (
              <button
                type="button"
                aria-label={t('aiCareer.copyPath')}
                onClick={(e) => handleCopy(e, session.id, session.file_path)}
                className="flex-shrink-0 p-1.5 rounded-md text-cyber-text-muted hover:text-cyber-text hover:bg-cyber-text/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                {copiedId === session.id ? (
                  <Check size={14} className="text-cyber-accent" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}
          </div>
        );
      })}

      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {/* Loading more → a few skeleton rows at the tail. */}
      {loading &&
        SKELETON_WIDTHS.slice(0, 3).map((w, i) => <SkeletonRow key={`more-${i}`} w={w} />)}
    </div>
  );
}
