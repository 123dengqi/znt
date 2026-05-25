import { Layout, Menu, Avatar, Dropdown, Tag, Tooltip } from 'antd';
import {
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
  LogOut,
  ShieldCheck,
  Search,
  Beaker,
  Network,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../store';
import CommandPalette from './CommandPalette';

const { Sider, Header, Content } = Layout;

const STUDENT_GROUPS = [
  {
    key: 'g-learn',
    label: '学习中心',
    items: [
      { key: '/student/dashboard', icon: <LayoutDashboard size={16} />, label: '学习首页' },
      { key: '/student/qa', icon: <MessagesSquare size={16} />, label: '课程问答' },
    ],
  },
  {
    key: 'g-think',
    label: '思辨与情境',
    items: [
      { key: '/student/compare', icon: <GitCompareArrows size={16} />, label: '理论对比' },
      { key: '/student/case', icon: <ClipboardList size={16} />, label: '案例分析' },
      { key: '/student/role', icon: <Drama size={16} />, label: '角色模拟' },
    ],
  },
  {
    key: 'g-lab',
    label: '创新实验',
    items: [
      { key: '/student/lab', icon: <Beaker size={16} />, label: '人格实验室' },
      { key: '/student/graph', icon: <Network size={16} />, label: '知识图谱' },
    ],
  },
  {
    key: 'g-eval',
    label: '评测与反馈',
    items: [
      { key: '/student/quiz', icon: <PencilRuler size={16} />, label: '章节测验' },
      { key: '/student/ideology', icon: <HeartHandshake size={16} />, label: '课程思政任务' },
    ],
  },
];

const TEACHER_GROUPS = [
  {
    key: 'g-content',
    label: '资源中心',
    items: [
      { key: '/teacher/kb', icon: <Database size={16} />, label: '知识库管理' },
      { key: '/teacher/cases', icon: <Library size={16} />, label: '案例库管理' },
    ],
  },
  {
    key: 'g-monitor',
    label: '教学监测',
    items: [
      { key: '/teacher/stats', icon: <BarChart3 size={16} />, label: '学情统计' },
      { key: '/teacher/logs', icon: <ScrollText size={16} />, label: '日志查看' },
    ],
  },
  {
    key: 'g-ideology',
    label: '课程思政设计',
    items: [
      { key: '/teacher/ideology/elements', icon: <HeartHandshake size={16} />, label: '思政元素库' },
      { key: '/teacher/ideology/mappings', icon: <GitCompareArrows size={16} />, label: '知识点映射' },
      { key: '/teacher/ideology/design', icon: <Sparkles size={16} />, label: 'AI 教学设计' },
      { key: '/teacher/ideology/tasks', icon: <ClipboardList size={16} />, label: '任务发布' },
      { key: '/teacher/ideology/analytics', icon: <BarChart3 size={16} />, label: '思政效果分析' },
    ],
  },
];

function flattenItems(groups: typeof STUDENT_GROUPS) {
  return groups.map((g) => ({
    type: 'group' as const,
    key: g.key,
    label: <span style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.05em' }}>{g.label.toUpperCase()}</span>,
    children: g.items,
  }));
}

const PATH_TITLE: Record<string, string> = {
  '/student/dashboard': '学习首页',
  '/student/qa': '课程问答',
  '/student/compare': '理论对比',
  '/student/case': '案例分析',
  '/student/role': '角色模拟',
  '/student/lab': '人格实验室',
  '/student/graph': '知识图谱探险',
  '/student/quiz': '章节测验',
  '/student/ideology': '课程思政任务',
  '/teacher/kb': '知识库管理',
  '/teacher/cases': '案例库管理',
  '/teacher/stats': '学情统计',
  '/teacher/logs': '日志查看',
  '/teacher/ideology/elements': '思政元素库',
  '/teacher/ideology/mappings': '知识点映射',
  '/teacher/ideology/design': 'AI 教学设计',
  '/teacher/ideology/tasks': '思政任务发布',
  '/teacher/ideology/analytics': '思政效果分析',
};

export default function AppLayout() {
  const { user, clear } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const isTeacher = user.role === 'teacher' || user.role === 'admin';
  const groups = isTeacher ? TEACHER_GROUPS : STUDENT_GROUPS;
  const items = flattenItems(groups);
  const current = PATH_TITLE[loc.pathname] || '工作台';

  return (
    <Layout style={{ minHeight: '100vh' }} hasSider>
      <Sider
        width={236}
        style={{
          background: '#ffffff',
          borderRight: '1px solid var(--border-soft)',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '20px 20px 14px', flexShrink: 0 }}>
          <div className="brand">
            <span className="brand-mark" />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span>人格心理学</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>
                教育智能体平台
              </span>
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'var(--surface-soft)',
              border: '1px solid var(--border-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-soft)',
              fontSize: 12,
            }}
          >
            <ShieldCheck size={14} color="#10b981" />
            <span>教学辅助 · 非诊断系统</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Menu
            mode="inline"
            selectedKeys={[loc.pathname]}
            items={items as any}
            onClick={(e) => nav(e.key)}
            style={{ borderRight: 0, padding: '4px 10px', background: 'transparent' }}
          />
        </div>
      </Sider>
      <Layout style={{ marginLeft: 236 }}>
        <Header
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'saturate(180%) blur(10px)',
            WebkitBackdropFilter: 'saturate(180%) blur(10px)',
            borderBottom: '1px solid var(--border-soft)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tag color={isTeacher ? 'blue' : 'geekblue'} style={{ margin: 0 }}>
              {isTeacher ? '教师端' : '学生端'}
            </Tag>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{current}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tooltip title="按 Ctrl/Cmd + K 唤起命令面板">
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 32, padding: '0 12px', borderRadius: 8,
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-soft)', cursor: 'pointer', fontSize: 12,
                }}
              >
                <Search size={13} /> 搜索功能 <kbd className="kbd" style={{ marginLeft: 6 }}>Ctrl K</kbd>
              </button>
            </Tooltip>
            <Tooltip title="四课堂联动 · OBE/BOPPS · 形成性评价闭环">
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>v0.1 演示版</span>
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogOut size={14} />,
                    label: '退出登录',
                    onClick: () => {
                      clear();
                      nav('/login');
                    },
                  },
                ],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                <Avatar size={32} style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', fontWeight: 600 }}>
                  {(user.name?.[0] || user.username[0]).toUpperCase()}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{user.name || user.username}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user.username}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
      <CommandPalette />
    </Layout>
  );
}
