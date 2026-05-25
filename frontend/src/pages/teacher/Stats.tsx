import { useEffect, useState } from 'react';
import { Button, Col, Row, Space, message } from 'antd';
import { Download, Users, GraduationCap, Activity, Award, FileSpreadsheet } from 'lucide-react';
import Chart from '../../components/Chart';
import { teacher } from '../../api';

const MODULE_LABEL: Record<string, string> = {
  qa: '课程问答',
  compare: '理论对比',
  case: '案例分析',
  role: '角色模拟',
  quiz: '章节测验',
  kb: '教师工具',
  login: '登录',
};

export default function Stats() {
  const [data, setData] = useState<any>(null);
  const [exporting, setExporting] = useState<string>('');

  useEffect(() => {
    teacher.stats().then(setData);
  }, []);

  const doExport = async (kind: string) => {
    if (exporting) return;
    setExporting(kind);
    try {
      await teacher.exportCsv(kind);
      message.success('已开始下载');
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '导出失败，请重试');
    } finally {
      setExporting('');
    }
  };

  if (!data) return null;

  const moduleEntries = Object.entries(data.by_module || {})
    .map(([k, v]) => ({ name: MODULE_LABEL[k] || k, value: v as number }));

  const trend = data.last7_events || [];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="gradient-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2>学情统计 · 教学过程证据</h2>
            <p>近 7 天数据快照 · 用于形成性评价、NLP 编码与课程改进</p>
          </div>
          <Space>
            <Button icon={<Download size={14} />} loading={exporting === 'events'} onClick={() => doExport('events')} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white' }}>
              事件 CSV
            </Button>
            <Button icon={<Download size={14} />} loading={exporting === 'logs'} onClick={() => doExport('logs')} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white' }}>
              日志 CSV
            </Button>
            <Button icon={<Download size={14} />} loading={exporting === 'attempts'} onClick={() => doExport('attempts')} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white' }}>
              测验 CSV
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={12} lg={6}>
          <div className="stat-card">
            <div className="stat-icon"><Users size={18} /></div>
            <div className="stat-label">用户总数</div>
            <div className="stat-value">{data.users}</div>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="stat-card tone-cyan">
            <div className="stat-icon"><GraduationCap size={18} /></div>
            <div className="stat-label">学生数</div>
            <div className="stat-value">{data.students}</div>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="stat-card tone-green">
            <div className="stat-icon"><Activity size={18} /></div>
            <div className="stat-label">近 24h 活跃</div>
            <div className="stat-value">{data.active_24h}</div>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="stat-card tone-amber">
            <div className="stat-icon"><Award size={18} /></div>
            <div className="stat-label">测验平均分</div>
            <div className="stat-value">{data.avg_quiz_score}</div>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <div className="page-card" style={{ padding: 20 }}>
            <div className="section-title">近 7 天学习事件</div>
            <div className="section-sub">每日活动数量趋势</div>
            <Chart
              height={280}
              option={{
                tooltip: { trigger: 'axis' },
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
                series: [
                  {
                    type: 'bar',
                    data: trend.map((d: any) => d.count),
                    barWidth: 28,
                    itemStyle: {
                      borderRadius: [8, 8, 0, 0],
                      color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                          { offset: 0, color: '#6366f1' },
                          { offset: 1, color: '#06b6d4' },
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
            <div className="section-title">模块占比</div>
            <div className="section-sub">各模块使用情况</div>
            <Chart
              height={280}
              option={{
                tooltip: { trigger: 'item' },
                legend: { bottom: 0, icon: 'circle', textStyle: { color: '#64748b', fontSize: 12 } },
                series: [
                  {
                    type: 'pie',
                    radius: ['56%', '78%'],
                    center: ['50%', '46%'],
                    avoidLabelOverlap: true,
                    itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 },
                    label: { show: false },
                    data: moduleEntries,
                  },
                ],
              }}
            />
          </div>
        </Col>
      </Row>

      {moduleEntries.length >= 3 && (
        <div className="page-card" style={{ padding: 20 }}>
          <div className="section-title">学情画像（雷达）</div>
          <div className="section-sub">从模块覆盖度看学生整体活跃面</div>
          <Chart
            height={320}
            option={{
              tooltip: {},
              radar: {
                shape: 'polygon',
                indicator: moduleEntries.map((m) => ({ name: m.name, max: Math.max(...moduleEntries.map((x) => x.value)) + 2 })),
                splitArea: { areaStyle: { color: ['rgba(99,102,241,0.04)', 'rgba(99,102,241,0.02)'] } },
                axisLine: { lineStyle: { color: '#e6e8ee' } },
                splitLine: { lineStyle: { color: '#eef0f5' } },
                axisName: { color: '#64748b', fontSize: 12 },
              },
              series: [
                {
                  type: 'radar',
                  data: [
                    {
                      value: moduleEntries.map((m) => m.value),
                      name: '使用次数',
                      areaStyle: { color: 'rgba(79,70,229,0.18)' },
                      lineStyle: { color: '#4f46e5', width: 2 },
                      itemStyle: { color: '#4f46e5' },
                    },
                  ],
                },
              ],
            }}
          />
        </div>
      )}

      <div className="page-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileSpreadsheet size={16} color="#4f46e5" />
          <strong>导出过程性数据</strong>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          用于 NLP 编码、能力画像与教学研究。CSV 含时间、模块、会话 ID、学习意图、内容摘要等字段。
        </div>
        <Space style={{ marginTop: 12 }} wrap>
          <Button icon={<Download size={14} />} loading={exporting === 'events'} onClick={() => doExport('events')}>
            学习事件 CSV
          </Button>
          <Button icon={<Download size={14} />} loading={exporting === 'logs'} onClick={() => doExport('logs')}>
            对话日志 CSV
          </Button>
          <Button icon={<Download size={14} />} loading={exporting === 'attempts'} onClick={() => doExport('attempts')}>
            测验记录 CSV
          </Button>
        </Space>
      </div>
    </div>
  );
}
