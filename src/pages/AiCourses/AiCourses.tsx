// AI Courses — Curated, application-oriented AI courses for builders, indie hackers,
// and creators. Focus: "how to USE AI to ship things" (vibe coding, agent orchestration,
// content creation, AI-powered startups) — NOT how to research/train LLMs.
//
// Both lists live as JSON on echobird.ai/courses (CF Worker), with GitHub raw at
// docs/courses/{cn,en}.json as the secondary mirror. Edit those files to add/remove
// entries without shipping a release; users pull fresh data within the 6h cache window
// (or instantly via the refresh button).
//
// The bundled CN_COURSES / EN_COURSES arrays below are the offline floor: shown on
// cold start before remote fetch completes and as a fallback when both mirrors fail.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { usePulseScroll } from '../../hooks/usePulseScroll';

// ===== Mirror config =====

// Both langs share the same mirror chain; only the file name differs. Primary is
// echobird.ai's CF Worker; GitHub raw is the cold backup that auto-tracks main.
const COURSES_MIRRORS: { name: string; base: string }[] = [
  { name: 'echobird', base: 'https://echobird.ai/courses' },
  {
    name: 'github',
    base: 'https://raw.githubusercontent.com/edison7009/EchoBird/main/docs/courses',
  },
];

const COURSES_FILE_EN = 'en.json';
const COURSES_FILE_CN = 'cn.json';

// ===== Types =====

type Lang = 'zh' | 'en';

interface Course {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  lang: Lang;
}

interface CachedEn {
  enCourses: Course[];
  enCategories: string[];
  fetchedAt: number;
}

interface CachedZh {
  zhCourses: Course[];
  zhCategories: string[];
  fetchedAt: number;
}

interface Catalog {
  courses: Course[];
  categoriesByLang: Record<Lang, string[]>;
  fetchedAt: number;
}

// ===== Bundled CN fallback =====
//
// Mirror of docs/courses/cn.json — manually kept in sync when shipping a release
// so first-launch / offline users see content immediately.

const CN_CATEGORIES = ['AI 创业', 'AI 编程', 'AI 内容创作', 'Prompt 与 Agent', '学习平台'];

const CN_COURSES: Course[] = [
  {
    id: 'cn-claude-founders-playbook',
    name: 'Claude 教你用 AI 创业',
    url: 'https://coffeecli.com/courses/founders-playbook',
    description:
      '面向独立开发者与创业者的 AI 实战课,讲解如何用 Claude 等大模型搭建产品并跑通商业闭环',
    category: 'AI 创业',
    lang: 'zh',
  },
  {
    id: 'cn-datawhale-easy-vibe',
    name: 'Datawhale · Easy-Vibe',
    url: 'https://datawhalechina.github.io/easy-vibe/welcome.html',
    description: 'Datawhale 出品的零基础 Vibe Coding 四阶段课程,GitHub 13.9k stars,中文社区背书',
    category: 'AI 编程',
    lang: 'zh',
  },
  {
    id: 'cn-liyupi-ai-guide',
    name: '程序员鱼皮 · AI 编程指南',
    url: 'https://github.com/liyupi/ai-guide',
    description: 'GitHub 14.3k stars 的中文 AI 资源大全,涵盖 Vibe Coding、Claude 玩法、AI 产品变现',
    category: 'AI 编程',
    lang: 'zh',
  },
  {
    id: 'cn-bilibili-yincode-claude',
    name: '10 分钟学会 24 个 Claude Code 使用技巧',
    url: 'https://www.bilibili.com/video/BV1SddcBFESs/',
    description: 'B 站 UP 主 Yin_Code,8.7w 播放的 Claude Code 快速上手实战',
    category: 'AI 编程',
    lang: 'zh',
  },
  {
    id: 'cn-tukuaiai-vibe-coding',
    name: 'Vibe Coding 中文教程',
    url: 'https://github.com/tukuaiai/vibe-coding-cn',
    description: 'Prompt / Skill / Workflow / Codex 实战的中文 Vibe Coding 教程仓库',
    category: 'AI 编程',
    lang: 'zh',
  },
  {
    id: 'cn-bilibili-coze-jianying',
    name: 'Coze + 剪映 智能体保姆级搭建',
    url: 'https://www.bilibili.com/video/BV1cjoCY3EbD/',
    description: 'DeepSeek + 通义万相 + Vidu + 剪映全流程,从 0 搭一个能批量出短视频的智能体',
    category: 'AI 内容创作',
    lang: 'zh',
  },
  {
    id: 'cn-baoyu-share',
    name: '宝玉的分享',
    url: 'https://baoyu.io/',
    description: '中文 Prompt 工程头部博主,系统性翻译与整理 Prompt 实战、多 Agent 协作范本',
    category: 'Prompt 与 Agent',
    lang: 'zh',
  },
  {
    id: 'cn-waytoagi',
    name: 'WaytoAGI · 通往 AGI 之路',
    url: 'https://www.waytoagi.com/zh',
    description: '900w 学习者的中文 AI 知识库,含教程、问答、Agent 章节',
    category: 'Prompt 与 Agent',
    lang: 'zh',
  },
  {
    id: 'cn-langgpt-wonderful-prompts',
    name: 'LangGPT · Wonderful Prompts',
    url: 'https://github.com/langgptai/wonderful-prompts',
    description: '中文 Prompt 精选合集,提升 ChatGPT / Claude 实际可用性',
    category: 'Prompt 与 Agent',
    lang: 'zh',
  },
  // ── 学习平台 / 资源入口 ──
  {
    id: 'cn-ai-bot',
    name: 'AI 工具集',
    url: 'https://ai-bot.cn/',
    description: '1000+ 国内外 AI 工具导航,带教程板块,产品入门必经',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-atomgit',
    name: 'AtomGit AI Hub · 学习中心',
    url: 'https://ai.atomgit.com/learn',
    description: 'GitCode 旗下 AI 学习平台,集中各类学习路径与实战教程',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-aistudio',
    name: '飞桨 AI Studio',
    url: 'https://aistudio.baidu.com/learn',
    description: '百度飞桨学习平台,大量免费公开课与可在线运行的实战项目,自带算力',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-modelscope',
    name: 'ModelScope · 魔搭学习',
    url: 'https://www.modelscope.cn/learn',
    description: '阿里达摩院出品,模型 / 课程 / 数据集一体化的中文 AI 社区',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-datawhale',
    name: 'Datawhale 开源学习社区',
    url: 'https://datawhale.cn/',
    description: '国内最活跃的 AI 开源学习社区,主打开源教程 / 组队学习 / 入门到进阶',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-openbayes',
    name: 'OpenBayes 公开教程',
    url: 'https://openbayes.com/console/public/tutorials',
    description: '算力平台开放的公开 Notebook 教程,可一键运行',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-geektime',
    name: '极客时间 · AI 专栏',
    url: 'https://time.geekbang.org/category/intel-100',
    description: 'AI / ML / 大模型方向收费专栏,内容深度与体系化程度高',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-coursera-cn',
    name: 'Coursera 中文站',
    url: 'https://www.coursera.org/zh-CN',
    description: '国际公开课中文界面入口,大量斯坦福 / DeepLearning.AI 课程有中文字幕',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-icourse163',
    name: '中国大学 MOOC',
    url: 'https://www.icourse163.org/search.htm?search=人工智能',
    description: '清华 / 北大 / 浙大 / 中科大 / 复旦等顶尖高校 AI 公开课聚合入口',
    category: '学习平台',
    lang: 'zh',
  },
  {
    id: 'cn-platform-xuetangx',
    name: '学堂在线',
    url: 'https://www.xuetangx.com/search?query=人工智能',
    description: '清华出品 MOOC 平台,聚合国内顶尖高校 AI 课程',
    category: '学习平台',
    lang: 'zh',
  },
];

// ===== Bundled EN fallback =====
//
// Mirror of docs/courses/en.json — same role as CN_COURSES, just for non-CN locales.

const EN_CATEGORIES = [
  'AI Founders',
  'AI Coding',
  'Content Creation',
  'Prompts & Agents',
  'Learning Hubs',
];

const EN_COURSES: Course[] = [
  {
    id: 'en-greg-isenberg',
    name: 'Greg Isenberg · Startup Ideas',
    url: 'https://www.youtube.com/@GregIsenberg',
    description:
      'Late Checkout CEO breaks down AI startup ideas weekly — pricing, growth, vibe marketing. High-density idea source for indie hackers.',
    category: 'AI Founders',
    lang: 'en',
  },
  {
    id: 'en-david-ondrej',
    name: 'David Ondrej · Build Anything with AI',
    url: 'https://www.youtube.com/@DavidOndrej',
    description:
      '"Build Anything with X" series covering LLama, CrewAI, n8n — turning agents into cashflow.',
    category: 'AI Founders',
    lang: 'en',
  },
  {
    id: 'en-indie-hackers',
    name: 'Indie Hackers',
    url: 'https://www.indiehackers.com/',
    description:
      'Largest bootstrapping community — real MRR stories and AI SaaS case studies from solo founders.',
    category: 'AI Founders',
    lang: 'en',
  },
  {
    id: 'en-anthropic-academy',
    name: 'Anthropic Academy',
    url: 'https://anthropic.skilljar.com/',
    description:
      'Official Anthropic courses — Claude Code 101, Claude Code in Action, Agent Skills, Subagents. Free with certificates.',
    category: 'AI Coding',
    lang: 'en',
  },
  {
    id: 'en-riley-brown',
    name: 'Riley Brown · Vibe Coding',
    url: 'https://www.youtube.com/@rileybrownai/videos',
    description:
      'Popularizer of "vibe coding" — practical breakdowns across Lovable, Bolt, v0, Cursor for shipping real apps.',
    category: 'AI Coding',
    lang: 'en',
  },
  {
    id: 'en-deeplearning-langgraph',
    name: 'DeepLearning.AI · AI Agents in LangGraph',
    url: 'https://www.deeplearning.ai/courses/ai-agents-in-langgraph',
    description: 'Harrison Chase walks through the agent loop in 1.5 hours. Free.',
    category: 'AI Coding',
    lang: 'en',
  },
  {
    id: 'en-matt-wolfe',
    name: 'Matt Wolfe · AI Tool Reviews',
    url: 'https://www.youtube.com/@mreflow',
    description:
      'FutureTools.io founder — fastest channel for new AI tool and model reviews. Essential for creators tracking the frontier.',
    category: 'Content Creation',
    lang: 'en',
  },
  {
    id: 'en-prompting-guide',
    name: 'Prompt Engineering Guide',
    url: 'https://www.promptingguide.ai/',
    description:
      "Dair-AI's reference guide — 74.8k stars, 13 languages, the de facto standard for prompt engineering.",
    category: 'Prompts & Agents',
    lang: 'en',
  },
  {
    id: 'en-langchain-academy',
    name: 'LangChain Academy',
    url: 'https://academy.langchain.com/',
    description:
      'Official free courses on LangGraph, Deep Agents, and Deep Research with LangGraph.',
    category: 'Prompts & Agents',
    lang: 'en',
  },
  {
    id: 'en-deeplearning-prompt',
    name: 'DeepLearning.AI · Prompt Engineering for Developers',
    url: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers',
    description:
      'Andrew Ng + Isa Fulford — the non-negotiable starting point for prompt engineering.',
    category: 'Prompts & Agents',
    lang: 'en',
  },
  {
    id: 'en-huggingface-learn',
    name: 'Hugging Face · Learn',
    url: 'https://huggingface.co/learn',
    description:
      "Free courses on NLP, Deep RL, Audio, ML for Games — paired with the Hub's models and datasets.",
    category: 'Learning Hubs',
    lang: 'en',
  },
  {
    id: 'en-deeplearning-catalog',
    name: 'DeepLearning.AI · Short Courses',
    url: 'https://www.deeplearning.ai/courses/',
    description:
      'Catalog of free hands-on courses covering RAG, agents, evaluation, fine-tuning, and more.',
    category: 'Learning Hubs',
    lang: 'en',
  },
];

// ===== Local cache =====
//
// `:v2` bump invalidates the old dair-ai academic content that used to live under
// `courses:cache:en` so users instantly see the new applied-direction list after upgrade.
const CACHE_KEY_EN = 'courses:cache:en:v2';
const CACHE_KEY_ZH = 'courses:cache:zh';
const REFRESH_AFTER_MS = 6 * 3600 * 1000;

const loadCachedEn = (): CachedEn | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY_EN);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.enCourses) || !Array.isArray(parsed?.enCategories)) return null;
    return parsed as CachedEn;
  } catch {
    return null;
  }
};
const saveCachedEn = (c: CachedEn) => {
  try {
    localStorage.setItem(CACHE_KEY_EN, JSON.stringify(c));
  } catch {
    /* quota */
  }
};

const loadCachedZh = (): CachedZh | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY_ZH);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.zhCourses) || !Array.isArray(parsed?.zhCategories)) return null;
    return parsed as CachedZh;
  } catch {
    return null;
  }
};
const saveCachedZh = (c: CachedZh) => {
  try {
    localStorage.setItem(CACHE_KEY_ZH, JSON.stringify(c));
  } catch {
    /* quota */
  }
};

// Each lang has both a remote source and a bundled fallback now — buildCatalog
// merges remote-or-bundled per lang.
const buildCatalog = (en: CachedEn | null, zh: CachedZh | null): Catalog => {
  const enCourses = en?.enCourses?.length ? en.enCourses : EN_COURSES;
  const enCategories = en?.enCategories?.length ? en.enCategories : EN_CATEGORIES;
  const zhCourses = zh?.zhCourses?.length ? zh.zhCourses : CN_COURSES;
  const zhCategories = zh?.zhCategories?.length ? zh.zhCategories : CN_CATEGORIES;
  return {
    courses: [...enCourses, ...zhCourses],
    categoriesByLang: { en: enCategories, zh: zhCategories },
    fetchedAt: Math.max(en?.fetchedAt ?? 0, zh?.fetchedAt ?? 0) || Date.now(),
  };
};

// ===== Network: mirror-aware JSON fetch =====
//
// Same shape for both lists: { courses: Omit<Course, 'lang'>[], categories: string[] }.
// No preferredMirror optimization — VPN switches change which mirror works, so don't
// cache the choice.

const looksLikeHtml = (s: string): boolean => {
  const head = s.slice(0, 200).trimStart().toLowerCase();
  return head.startsWith('<!doctype html') || head.startsWith('<html');
};

async function fetchCoursesJson(
  file: string,
  lang: Lang
): Promise<{ courses: Course[]; categories: string[] }> {
  let lastErr: unknown = null;
  for (const mirror of COURSES_MIRRORS) {
    try {
      const res = await fetch(`${mirror.base}/${file}`, { cache: 'no-cache' });
      if (!res.ok) {
        lastErr = new Error(`${mirror.name} ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (looksLikeHtml(text)) {
        lastErr = new Error(`${mirror.name} returned HTML`);
        continue;
      }
      const json = JSON.parse(text);
      if (!Array.isArray(json?.courses) || !Array.isArray(json?.categories)) {
        lastErr = new Error(`${mirror.name} invalid shape`);
        continue;
      }
      const courses: Course[] = json.courses.map((c: Omit<Course, 'lang'>) => ({
        ...c,
        lang,
      }));
      return { courses, categories: json.categories as string[] };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`all ${lang} mirrors failed`);
}

// ===== Helpers =====

const openExternal = (url: string) => shellOpen(url).catch(() => window.open(url, '_blank'));
const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// ===== Context =====

interface AiCoursesContextValue {
  catalog: Catalog;
  initialLoading: boolean;
  syncing: boolean;
  error: string | null;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  retry: () => void;
}

const AiCoursesContext = createContext<AiCoursesContextValue | null>(null);

function useAiCourses() {
  const ctx = useContext(AiCoursesContext);
  if (!ctx) throw new Error('AiCourses context missing');
  return ctx;
}

// ===== Provider =====

export function AiCoursesProvider({ children }: { children: React.ReactNode }) {
  // Hydrate caches once on mount so re-renders don't re-read localStorage.
  const initialCachedEn = useMemo(() => loadCachedEn(), []);
  const initialCachedZh = useMemo(() => loadCachedZh(), []);
  const [cachedEn, setCachedEn] = useState<CachedEn | null>(initialCachedEn);
  const [cachedZh, setCachedZh] = useState<CachedZh | null>(initialCachedZh);
  // Skeleton only when BOTH caches are cold — bundled arrays still render content
  // for both langs even when nothing is cached, so this is more of a "first sync
  // is in flight" hint than a "we have nothing to show" gate.
  const [initialLoading, setInitialLoading] = useState(
    initialCachedEn === null && initialCachedZh === null
  );
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const seq = useRef(0);
  const cacheRefEn = useRef(cachedEn);
  const cacheRefZh = useRef(cachedZh);
  useEffect(() => {
    cacheRefEn.current = cachedEn;
  }, [cachedEn]);
  useEffect(() => {
    cacheRefZh.current = cachedZh;
  }, [cachedZh]);

  const catalog = useMemo(() => buildCatalog(cachedEn, cachedZh), [cachedEn, cachedZh]);

  const sync = useCallback(async (force = false) => {
    const curEn = cacheRefEn.current;
    const curZh = cacheRefZh.current;
    const enFresh = !force && curEn && Date.now() - curEn.fetchedAt < REFRESH_AFTER_MS;
    const zhFresh = !force && curZh && Date.now() - curZh.fetchedAt < REFRESH_AFTER_MS;

    if (enFresh && zhFresh) {
      setInitialLoading(false);
      return;
    }

    const my = ++seq.current;
    setSyncing(true);
    setError(null);

    let latestError: string | null = null;
    const tasks: Promise<void>[] = [];

    if (!enFresh) {
      tasks.push(
        fetchCoursesJson(COURSES_FILE_EN, 'en')
          .then(({ courses, categories }) => {
            if (my !== seq.current) return;
            const fresh: CachedEn = {
              enCourses: courses,
              enCategories: categories,
              fetchedAt: Date.now(),
            };
            saveCachedEn(fresh);
            setCachedEn(fresh);
          })
          .catch((e: unknown) => {
            latestError = e instanceof Error ? e.message : 'EN fetch failed';
          })
      );
    }

    if (!zhFresh) {
      tasks.push(
        fetchCoursesJson(COURSES_FILE_CN, 'zh')
          .then(({ courses, categories }) => {
            if (my !== seq.current) return;
            const fresh: CachedZh = {
              zhCourses: courses,
              zhCategories: categories,
              fetchedAt: Date.now(),
            };
            saveCachedZh(fresh);
            setCachedZh(fresh);
          })
          .catch((e: unknown) => {
            latestError = e instanceof Error ? e.message : 'CN fetch failed';
          })
      );
    }

    await Promise.allSettled(tasks);

    if (my === seq.current) {
      // Error UI only surfaces when visible.length === 0 anyway — bundled fallbacks
      // mean users never see it in practice.
      if (latestError) setError(latestError);
      setInitialLoading(false);
      setSyncing(false);
    }
  }, []);

  const retry = useCallback(() => {
    sync(true);
  }, [sync]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    sync();
  }, [sync]);

  const value = useMemo<AiCoursesContextValue>(
    () => ({
      catalog,
      initialLoading,
      syncing,
      error,
      selectedCategory,
      setSelectedCategory,
      retry,
    }),
    [catalog, initialLoading, syncing, error, selectedCategory, retry]
  );

  return <AiCoursesContext.Provider value={value}>{children}</AiCoursesContext.Provider>;
}

// ===== Title actions =====

export function AiCoursesTitleActions() {
  const { t } = useI18n();
  const { syncing, retry } = useAiCourses();
  return (
    <div className="ml-auto flex-shrink-0 flex items-center gap-2">
      <button
        onClick={retry}
        disabled={syncing}
        className={`text-sm px-3 py-1.5 border rounded-md transition-colors flex items-center gap-2 ${
          !syncing
            ? 'border-cyber-border/50 text-cyber-text hover:bg-cyber-text/10'
            : 'border-cyber-border text-cyber-text-muted cursor-not-allowed'
        }`}
      >
        <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
        {t('btn.refresh')}
      </button>
    </div>
  );
}

// ===== Card =====

function CourseCard({ course }: { course: Course }) {
  return (
    <button
      onClick={() => openExternal(course.url)}
      className="group w-full text-left bg-cyber-surface rounded-card border border-cyber-border/15 hover:border-cyber-border/40 hover:bg-cyber-elevated transition-colors p-5 flex flex-col h-full"
    >
      <div className="text-xs text-cyber-text-secondary tracking-wide mb-2 truncate">
        {course.category}
      </div>
      <div className="text-[17px] font-bold text-cyber-text leading-snug mb-3 group-hover:text-cyber-accent transition-colors line-clamp-2">
        {course.name}
      </div>

      {course.description && (
        <div className="text-[13px] text-cyber-text-secondary leading-relaxed flex-1 line-clamp-3">
          {course.description}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-cyber-border/10 flex items-center gap-2">
        <span className="text-xs font-mono text-cyber-text-muted truncate flex-1">
          {hostnameOf(course.url)}
        </span>
        <ExternalLink
          size={13}
          className="text-cyber-text-muted/60 group-hover:text-cyber-text transition-colors"
        />
      </div>
    </button>
  );
}

// ===== Main =====

export function AiCoursesMain() {
  const { t, locale } = useI18n();
  const { catalog, initialLoading, syncing, error, selectedCategory, retry } = useAiCourses();
  const scrollRef = usePulseScroll<HTMLDivElement>();
  // Only zh-Hans gets the CN list (Bilibili / Datawhale / 飞桨 etc. on CN-domestic
  // platforms). zh-Hant (TW/HK/MO) and ja users see the EN list — TW/HK builders
  // follow the international AI stack (Anthropic Academy / LangChain / HF), not the
  // CN-domestic ecosystem.
  const lang: Lang = locale === 'zh-Hans' ? 'zh' : 'en';

  const visible = useMemo(() => {
    const langMatched = catalog.courses.filter((c) => c.lang === lang);
    if (selectedCategory === 'all') return langMatched;
    return langMatched.filter((c) => c.category === selectedCategory);
  }, [catalog, selectedCategory, lang]);

  if ((initialLoading || syncing) && visible.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="p-4 bg-cyber-surface rounded-card animate-pulse h-32">
              <div className="h-3 w-20 bg-cyber-border/40 rounded mb-2" />
              <div className="h-4 w-3/4 bg-cyber-border/50 rounded mb-3" />
              <div className="h-3 w-full bg-cyber-border/30 rounded mb-2" />
              <div className="h-3 w-2/3 bg-cyber-border/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && visible.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="p-8 text-center text-sm font-mono">
          <div className="text-cyber-warning mb-2">{t('pulse.fetchFailed')}</div>
          <div className="text-xs text-cyber-text-muted/60 mb-4 break-all max-w-md mx-auto">
            {error}
          </div>
          <button
            onClick={retry}
            className="text-xs px-4 py-2 border border-cyber-border/50 rounded text-cyber-text hover:bg-cyber-text/10 transition-colors"
          >
            {t('btn.refresh')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4 pulse-scroll">
      {/* Reserved 2px slot — opacity toggle prevents layout shift on sync start/stop */}
      <div className="sticky top-0 z-20 h-0.5 overflow-hidden pointer-events-none mb-2">
        <div
          className={`h-full w-1/3 bg-cyber-accent/70 transition-opacity duration-150 ${
            syncing ? 'opacity-100 animate-[loading_1.2s_ease-in-out_infinite]' : 'opacity-0'
          }`}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visible.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </div>
  );
}

// ===== Right panel: category filter =====

export function AiCoursesPanel() {
  const { t, locale } = useI18n();
  const { catalog, selectedCategory, setSelectedCategory } = useAiCourses();
  const scrollRef = usePulseScroll<HTMLDivElement>();
  // Same lang fork as AiCoursesMain — see comment there.
  const lang: Lang = locale === 'zh-Hans' ? 'zh' : 'en';

  // Reset filter when categories of the current lang don't include the selection
  useEffect(() => {
    if (selectedCategory === 'all') return;
    const cats = catalog.categoriesByLang[lang] || [];
    if (!cats.includes(selectedCategory)) setSelectedCategory('all');
  }, [lang, catalog, selectedCategory, setSelectedCategory]);

  const categories = catalog.categoriesByLang[lang] || [];
  const langCourses = useMemo(
    () => catalog.courses.filter((c) => c.lang === lang),
    [catalog, lang]
  );
  const total = langCourses.length;
  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of langCourses) m.set(c.category, (m.get(c.category) || 0) + 1);
    return m;
  }, [langCourses]);

  return (
    <>
      <div className="px-3 py-2 mb-1 flex items-center justify-between bg-transparent">
        <div className="text-[15px] font-semibold text-cyber-text">{t('courses.filter')}</div>
        {total > 0 && <span className="text-[13px] font-mono text-cyber-text-muted">{total}</span>}
      </div>
      <div ref={scrollRef} className="flex-1 px-2 overflow-y-auto pb-4 space-y-1 pulse-scroll">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`w-full text-left px-3 py-2 rounded text-[14px] transition-colors flex items-center justify-between ${
            selectedCategory === 'all'
              ? 'bg-cyber-elevated text-cyber-text font-medium'
              : 'text-cyber-text-secondary hover:bg-cyber-surface hover:text-cyber-text'
          }`}
        >
          <span>{t('courses.cat.all')}</span>
          <span className="text-[13px] font-mono text-cyber-text-muted">{total}</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`w-full text-left px-3 py-2 rounded text-[14px] transition-colors flex items-center justify-between ${
              selectedCategory === cat
                ? 'bg-cyber-elevated text-cyber-text font-medium'
                : 'text-cyber-text-secondary hover:bg-cyber-surface hover:text-cyber-text'
            }`}
          >
            <span className="truncate">{cat}</span>
            <span className="text-[13px] font-mono text-cyber-text-muted ml-2">
              {countByCat.get(cat) || 0}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
