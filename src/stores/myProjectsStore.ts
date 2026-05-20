// MyProjects store — user-authored AI projects added via the "我的AI项目"
// page. **Two-table architecture** (mirrors Model Nexus):
//
//   • Built-in entries (Reversi / AI Translator) live in code + the bundled
//     resource dir. They are NOT stored here — the page computes them at
//     render time, and the only persistence they need is the reference copy
//     in ~/.echobird/<id>/ (which Rust's seed_builtin_to_user_dir manages).
//     They render alongside user entries but can't be edited or deleted —
//     they're system data, like the built-in models in Model Nexus.
//
//   • User-added entries live here, persisted to localStorage. CRUD as
//     expected.
//
// On init() we run a one-time migration that strips any entry with
// linkedToolId set — those were seeded by the previous architecture and
// don't belong in user storage anymore.
import { create } from 'zustand';
import type { LocalTool } from '../api/types';
import * as api from '../api/tauri';

export interface MyProject {
  id: string;
  name: string;
  /** Path to icon. Vite-served relative paths (./icons/...) and absolute
   *  filesystem paths (with or without file://) are both accepted; an empty
   *  string falls back to a default placeholder. */
  iconPath: string;
  /** Path to launcher entry. For seeded built-ins this is the tool's bundled
   *  directory (e.g. .../tools/reversi); for user projects it's whatever
   *  executable they pick. */
  launcherPath: string;
  /** Absolute path to the project's models.json (model-field read/write mapping). */
  modelsJsonPath: string;
  createdAt: number;
  /** Set when this entry mirrors a bundled tool (reversi / translator).
   *  Used at render time to (a) drive AppManager's right-side panel via
   *  linkedToolId and (b) flag the card as built-in for UI affordances
   *  (no delete button, read-only edit dialog with "open folder" 📁). */
  linkedToolId?: string;
}

export type MyProjectInput = Omit<MyProject, 'id' | 'createdAt'>;

const LS_KEY = 'echobird_my_projects';
// Internal hidden list — built-in tool ids the user has "deleted" from
// the page. Reference files in ~/.echobird/<id>/ are NOT touched; only
// the card is removed from the displayed grid. Kept in its own LS slot
// so it doesn't co-mingle with user projects.
const HIDDEN_BUILTINS_KEY = 'echobird_my_projects_hidden_builtins';
// Old flag from the previous seed-into-localStorage design. Cleaned up on
// init so future versions don't trip on it; we never read it again.
const LEGACY_SEED_FLAG_KEY = 'echobird_my_projects_seeded';

// Bundled tools surfaced as built-in entries on the "我的AI项目" page.
// Order here is the order rendered on the page.
export const BUILTIN_TOOL_IDS = ['reversi', 'translator'] as const;
export type BuiltinToolId = (typeof BUILTIN_TOOL_IDS)[number];

// Append a filename to a directory path using whichever separator the
// directory already speaks (Windows-style backslashes if the path looks
// like Windows, forward slashes otherwise).
export const joinPath = (dir: string, file: string): string => {
  if (!dir) return '';
  const trimmed = dir.replace(/[\\/]$/, '');
  const sep = trimmed.includes('\\') ? '\\' : '/';
  return `${trimmed}${sep}${file}`;
};

const loadFromStorage = (): MyProject[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Defensive: drop entries missing required fields rather than crashing on a bad LS write.
    return parsed.filter(
      (p): p is MyProject =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as MyProject).id === 'string' &&
        typeof (p as MyProject).name === 'string' &&
        typeof (p as MyProject).launcherPath === 'string' &&
        typeof (p as MyProject).modelsJsonPath === 'string'
    );
  } catch {
    return [];
  }
};

const saveToStorage = (projects: MyProject[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(projects));
  } catch {
    /* private mode / quota — silently drop */
  }
};

const loadHiddenBuiltins = (): BuiltinToolId[] => {
  try {
    const raw = localStorage.getItem(HIDDEN_BUILTINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is BuiltinToolId =>
        typeof v === 'string' && (BUILTIN_TOOL_IDS as readonly string[]).includes(v)
    );
  } catch {
    return [];
  }
};

const saveHiddenBuiltins = (ids: BuiltinToolId[]) => {
  try {
    localStorage.setItem(HIDDEN_BUILTINS_KEY, JSON.stringify(ids));
  } catch {
    /* private mode — accept loss */
  }
};

// Slug-from-name id is human-readable in localStorage and easy to debug, but we
// append a short random suffix so two projects with the same name don't collide.
const makeId = (name: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  const rnd = Math.random().toString(36).slice(2, 8);
  return slug ? `${slug}-${rnd}` : `project-${rnd}`;
};

// Pick the best display name for a tool given the current UI locale.
export const pickToolName = (tool: LocalTool, locale: string): string => {
  if (locale === 'en' || !tool.names) return tool.name;
  const direct = tool.names[locale];
  if (direct) return direct;
  const base = locale.split('-')[0];
  if (tool.names[base]) return tool.names[base];
  const fuzzy = Object.entries(tool.names).find(([k]) => k.startsWith(base));
  return fuzzy?.[1] || tool.name;
};

interface MyProjectsState {
  /** User-added projects only. Built-in entries (Reversi / Translator) are
   *  computed at render time in the page component and never live here. */
  projects: MyProject[];
  /** Resolved absolute paths to each built-in's reference copy directory in
   *  ~/.echobird/<id>/, populated by ensureBuiltinDirs(). The page uses
   *  these to build the on-the-fly built-in MyProject records (and to
   *  resolve the folder for the "open folder" affordance). */
  builtinDirs: Partial<Record<BuiltinToolId, string>>;
  /** Built-in ids the user has hidden via [delete]. The page filters
   *  these out when rendering. Files on disk are untouched. */
  hiddenBuiltins: BuiltinToolId[];
  addProject: (input: MyProjectInput) => MyProject;
  updateProject: (id: string, patch: Partial<MyProjectInput>) => void;
  deleteProject: (id: string) => void;
  hideBuiltin: (id: BuiltinToolId) => void;
  init: () => void;
  /** Idempotent — calls Rust seed_builtin_to_user_dir for each built-in
   *  present in the live tool scan, populating builtinDirs once we have a
   *  resolvable destination. The Rust side skips files the user already
   *  has, so this is safe to run on every tool-scan update. */
  ensureBuiltinDirs: (tools: LocalTool[]) => Promise<void>;
}

export const useMyProjectsStore = create<MyProjectsState>((set, get) => ({
  projects: [],
  builtinDirs: {},
  hiddenBuiltins: [],
  addProject: (input) => {
    const project: MyProject = {
      ...input,
      id: makeId(input.name),
      createdAt: Date.now(),
    };
    const next = [...get().projects, project];
    saveToStorage(next);
    set({ projects: next });
    return project;
  },
  updateProject: (id, patch) => {
    const next = get().projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
    saveToStorage(next);
    set({ projects: next });
  },
  deleteProject: (id) => {
    const next = get().projects.filter((p) => p.id !== id);
    saveToStorage(next);
    set({ projects: next });
  },
  hideBuiltin: (id) => {
    const current = get().hiddenBuiltins;
    if (current.includes(id)) return;
    const next = [...current, id];
    saveHiddenBuiltins(next);
    set({ hiddenBuiltins: next });
  },
  init: () => {
    // Migration: strip seeded built-in entries from localStorage. They moved
    // out of user storage when we switched to the two-table model — keeping
    // them would render duplicates next to the computed built-ins.
    const raw = loadFromStorage();
    const filtered = raw.filter((p) => !p.linkedToolId);
    if (filtered.length !== raw.length) {
      saveToStorage(filtered);
    }
    try {
      localStorage.removeItem(LEGACY_SEED_FLAG_KEY);
    } catch {
      /* private mode */
    }
    set({ projects: filtered, hiddenBuiltins: loadHiddenBuiltins() });
  },
  ensureBuiltinDirs: async (tools) => {
    const next: Partial<Record<BuiltinToolId, string>> = { ...get().builtinDirs };
    let changed = false;
    for (const id of BUILTIN_TOOL_IDS) {
      if (next[id]) continue; // already resolved
      if (!tools.some((t) => t.id === id)) continue; // tool scan hasn't surfaced this id yet
      try {
        next[id] = await api.seedBuiltinToUserDir(id);
        changed = true;
      } catch (e) {
        console.error(`[MyProjects] Failed to ensure built-in dir for ${id}:`, e);
      }
    }
    if (changed) set({ builtinDirs: next });
  },
}));
