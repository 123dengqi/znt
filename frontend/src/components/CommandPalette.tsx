import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  MessagesSquare,
  GitCompareArrows,
  ClipboardList,
  Drama,
  PencilRuler,
  Database,
  Library,
  BarChart3,
  ScrollText,
  Sparkles,
  Beaker,
  Network,
  HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../store';

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  group: '导航' | '快捷操作';
  icon: React.ReactNode;
  run: () => void;
  roles?: ('student' | 'teacher' | 'admin')[];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((s) => !s);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const all: Cmd[] = useMemo(() => {
    const goto = (path: string) => () => {
      setOpen(false);
      nav(path);
    };
    return [
      { id: 'dashboard', group: '导航', label: '前往：学习首页', icon: <LayoutDashboard size={14} />, run: goto('/student/dashboard'), roles: ['student'] },
      { id: 'qa', group: '导航', label: '前往：课程问答', icon: <MessagesSquare size={14} />, run: goto('/student/qa'), roles: ['student'] },
      { id: 'compare', group: '导航', label: '前往：理论对比', icon: <GitCompareArrows size={14} />, run: goto('/student/compare'), roles: ['student'] },
      { id: 'case', group: '导航', label: '前往：案例分析', icon: <ClipboardList size={14} />, run: goto('/student/case'), roles: ['student'] },
      { id: 'role', group: '导航', label: '前往：角色模拟', icon: <Drama size={14} />, run: goto('/student/role'), roles: ['student'] },
      { id: 'lab', group: '导航', label: '前往：人格实验室（创新）', icon: <Beaker size={14} />, run: goto('/student/lab'), roles: ['student'] },
      { id: 'graph', group: '导航', label: '前往：知识图谱探险（创新）', icon: <Network size={14} />, run: goto('/student/graph'), roles: ['student'] },
      { id: 'quiz', group: '导航', label: '前往：章节测验', icon: <PencilRuler size={14} />, run: goto('/student/quiz'), roles: ['student'] },
      { id: 'ideo-stu', group: '导航', label: '前往：课程思政任务', icon: <HeartHandshake size={14} />, run: goto('/student/ideology'), roles: ['student'] },
      { id: 'kb', group: '导航', label: '前往：知识库管理', icon: <Database size={14} />, run: goto('/teacher/kb'), roles: ['teacher', 'admin'] },
      { id: 'cases', group: '导航', label: '前往：案例库管理', icon: <Library size={14} />, run: goto('/teacher/cases'), roles: ['teacher', 'admin'] },
      { id: 'stats', group: '导航', label: '前往：学情统计', icon: <BarChart3 size={14} />, run: goto('/teacher/stats'), roles: ['teacher', 'admin'] },
      { id: 'logs', group: '导航', label: '前往：日志查看', icon: <ScrollText size={14} />, run: goto('/teacher/logs'), roles: ['teacher', 'admin'] },
      { id: 'ideo-elem', group: '导航', label: '前往：思政元素库', icon: <HeartHandshake size={14} />, run: goto('/teacher/ideology/elements'), roles: ['teacher', 'admin'] },
      { id: 'ideo-map', group: '导航', label: '前往：知识点-思政映射', icon: <GitCompareArrows size={14} />, run: goto('/teacher/ideology/mappings'), roles: ['teacher', 'admin'] },
      { id: 'ideo-design', group: '导航', label: '前往：AI 教学设计', icon: <Sparkles size={14} />, run: goto('/teacher/ideology/design'), roles: ['teacher', 'admin'] },
      { id: 'ideo-task', group: '导航', label: '前往：思政任务发布', icon: <ClipboardList size={14} />, run: goto('/teacher/ideology/tasks'), roles: ['teacher', 'admin'] },
      { id: 'ideo-ana', group: '导航', label: '前往：思政效果分析', icon: <BarChart3 size={14} />, run: goto('/teacher/ideology/analytics'), roles: ['teacher', 'admin'] },
      { id: 'ask-quick', group: '快捷操作', label: '快速提问：以这段话为基准', icon: <Sparkles size={14} />, run: () => { setOpen(false); nav('/student/qa'); }, roles: ['student'] },
    ];
  }, [nav]);

  const list = useMemo(() => {
    const role = user?.role || 'student';
    const filtered = all.filter((c) => !c.roles || c.roles.includes(role as any));
    if (!q.trim()) return filtered;
    const kw = q.toLowerCase();
    return filtered.filter((c) => c.label.toLowerCase().includes(kw) || c.id.includes(kw));
  }, [all, q, user]);

  const grouped = useMemo(() => {
    const m = new Map<string, Cmd[]>();
    for (const c of list) {
      if (!m.has(c.group)) m.set(c.group, []);
      m.get(c.group)!.push(c);
    }
    return Array.from(m.entries());
  }, [list]);

  if (!open) return null;

  const flat = list;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((s) => Math.min(s + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[active]?.run();
    }
  };

  return (
    <div className="cmdk-mask" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="cmdk" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cmdk-input-wrap">
          <Search size={16} />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="搜索功能…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="cmdk-list">
          {grouped.length === 0 ? (
            <div className="cmdk-section">未找到匹配结果</div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group}>
                <div className="cmdk-section">{group}</div>
                {items.map((c) => {
                  const idx = flat.indexOf(c);
                  return (
                    <div
                      key={c.id}
                      className={`cmdk-item ${idx === active ? 'active' : ''}`}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => c.run()}
                    >
                      <span className="ic">{c.icon}</span>
                      <span className="label">{c.label}</span>
                      {c.hint && <span className="hint">{c.hint}</span>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="cmdk-foot">
          <span><kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> 选择 · <kbd className="kbd">Enter</kbd> 执行 · <kbd className="kbd">Esc</kbd> 关闭</span>
          <span><kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">K</kbd> 唤起</span>
        </div>
      </div>
    </div>
  );
}
