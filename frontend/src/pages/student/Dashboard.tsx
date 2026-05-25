import { useEffect, useState } from 'react';
import { Col, Row, Tag, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  MessagesSquare,
  GitCompareArrows,
  ClipboardList,
  Drama,
  PencilRuler,
  Activity,
  Clock,
  Trophy,
  Target,
  ArrowRight,
  Beaker,
  Network,
  HeartHandshake,
} from 'lucide-react';
import { api } from '../../api';
import Chart from '../../components/Chart';
import { useAuth } from '../../store';

const FEATURES = [
  {
    key: 'qa',
    path: '/student/qa',
    title: '课程问答',
    desc: '基于课程材料的检索增强问答，引用片段可追溯',
    icon: <MessagesSquare size={20} />,
    color: 'rgba(99,102,241,0.12)',
  },
  {
    key: 'compare',
    path: '/student/compare',
    title: '理论对比',
    desc: '在多个流派之间进行结构化维度对比',
    icon: <GitCompareArrows size={20} />,
    color: 'rgba(6,182,212,0.12)',
  },
  {
    key: 'case',
    path: '/student/case',
    title: '案例分析',
    desc: '按视角拆解可观察行为，给出反思路径',
    icon: <ClipboardList size={20} />,
    color: 'rgba(16,185,129,0.12)',
  },
  {
    key: 'role',
    path: '/student/role',
    title: '角色模拟',
    desc: '与教学化身展开多轮情境对话',
    icon: <Drama size={20} />,
    color: 'rgba(245,158,11,0.12)',
  },
  {
    key: 'lab',
    path: '/student/lab',
    title: '人格实验室（创新）',
    desc: '同一情境下多流派并行解读 + 五维雷达对比',
    icon: <Beaker size={20} />,
    color: 'rgba(244,63,94,0.12)',
  },
  {
    key: 'graph',
    path: '/student/graph',
    title: '知识图谱探险（创新）',
    desc: '可拖拽的人格心理学知识图谱 · 点节点即学',
    icon: <Network size={20} />,
    color: 'rgba(6,182,212,0.12)',
  },
  {
    key: 'quiz',
    path: '/student/quiz',
    title: '章节测验',
    desc: '完成自测，巩固重点与难点',
    icon: <PencilRuler size={20} />,
    color: 'rgba(139,92,246,0.12)',
  },
  {
    key: 'ideology',
    path: '/student/ideology',
    title: '课程思政任务',
    desc: '本章思政引导 · 案例反思任务 · 课后反思记录',
    icon: <HeartHandshake size={20} />,
    color: 'rgba(244,114,182,0.12)',
  },
];

const MODULE_LABEL: Record<string, string> = {
  qa: '问答',
  compare: '对比',
  case: '案例',
  role: '角色',
  quiz: '测验',
};

export default function Dashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/student/overview').then((r) => setData(r.data));
  }, []);

  const totals = data?.totals;
  const trend = data?.last14 || [];
  const moduleEntries = Object.entries(data?.by_module || {})
    .filter(([k]) => MODULE_LABEL[k])
    .map(([k, v]) => ({ name: MODULE_LABEL[k], value: v as number }));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="gradient-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2>你好，{user?.name || user?.username} 👋</h2>
            <p>最近 14 天累计完成 {totals?.events ?? 0} 次学习活动 · 学习时长约 {totals?.minutes ?? 0} 分钟</p>
          </div>
          <Tag color="white" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '4px 12px' }}>
            非诊断 · 教学辅助
          </Tag>
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={12} lg={6}>
          <div className="stat-card">
            <div className="stat-icon"><Activity size={18} /></div>
            <div className="stat-label">最近 14 天活动</div>
            <div className="stat-value">{totals?.events ?? 0}</div>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="stat-card tone-cyan">
            <div className="stat-icon"><Clock size={18} /></div>
            <div className="stat-label">学习时长（分钟）</div>
            <div className="stat-value">{totals?.minutes ?? 0}</div>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="stat-card tone-green">
            <div className="stat-icon"><Target size={18} /></div>
            <div className="stat-label">测验平均分</div>
            <div className="stat-value">{totals?.avg_score ?? 0}</div>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="stat-card tone-amber">
            <div className="stat-icon"><Trophy size={18} /></div>
            <div className="stat-label">最高得分</div>
            <div className="stat-value">{totals?.best_score ?? 0}</div>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <div className="page-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="section-title">学习活跃趋势</div>
                <div className="section-sub">近 14 天每日学习事件数量</div>
              </div>
            </div>
            <Chart
              height={260}
              option={{
                xAxis: {
                  type: 'category',
                  data: trend.map((d: any) => d.date),
                  axisLine: { lineStyle: { color: '#e6e8ee' } },
                  axisLabel: { color: '#94a3b8', fontSize: 11 },
                },
                yAxis: {
                  type: 'value',
                  splitLine: { lineStyle: { color: '#eef0f5' } },
                  axisLabel: { color: '#94a3b8', fontSize: 11 },
                },
                tooltip: { trigger: 'axis' },
                series: [
                  {
                    type: 'line',
                    smooth: true,
                    showSymbol: false,
                    data: trend.map((d: any) => d.count),
                    lineStyle: { width: 3, color: '#4f46e5' },
                    areaStyle: {
                      color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(79, 70, 229, 0.28)' },
                          { offset: 1, color: 'rgba(79, 70, 229, 0.02)' },
                        ],
                      },
                    },
                  },
                ],
              }}
            />
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="page-card" style={{ padding: 20, height: '100%' }}>
            <div className="section-title">模块使用分布</div>
            <div className="section-sub">按学习模块统计</div>
            {moduleEntries.length === 0 ? (
              <Empty description="暂无数据，去试试下面的功能吧" />
            ) : (
              <Chart
                height={260}
                option={{
                  tooltip: { trigger: 'item' },
                  legend: { bottom: 0, icon: 'circle', textStyle: { color: '#64748b', fontSize: 12 } },
                  series: [
                    {
                      type: 'pie',
                      radius: ['52%', '76%'],
                      center: ['50%', '46%'],
                      avoidLabelOverlap: true,
                      itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 },
                      label: { show: false },
                      data: moduleEntries,
                    },
                  ],
                }}
              />
            )}
          </div>
        </Col>
      </Row>

      <div className="page-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="section-title">开始你的学习</div>
            <div className="section-sub">围绕《人格心理学》课程任务工作 · 任选模块进入</div>
          </div>
        </div>
        <Row gutter={[16, 16]}>
          {FEATURES.map((f) => (
            <Col xs={24} sm={12} lg={8} xl={8} key={f.key}>
              <div className="feature-card" onClick={() => nav(f.path)}>
                <div className="ic" style={{ background: f.color }}>
                  {f.icon}
                </div>
                <div className="ttl">{f.title}</div>
                <div className="desc">{f.desc}</div>
                <div style={{ marginTop: 14, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  立即进入 <ArrowRight size={14} />
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
