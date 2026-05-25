import { useEffect, useState } from 'react';
import { Button, Col, Empty, Row, Space, Statistic, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { BarChart3, Download } from 'lucide-react';
import Chart from '../../components/Chart';
import { ideology } from '../../api';
import '../ideology.css';

export default function IdeologyAnalytics() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await ideology.analytics()); }
    catch { message.error('分析数据加载失败'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const s = data?.summary;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="ideo-hero">
        <div className="ttl"><BarChart3 size={22} color="#be185d" /> 思政融入效果分析</div>
        <div className="sub">
          全景看板：任务完成率、提交趋势、思政元素关注度、章节完成情况、学生反思高频关键词、反思质量变化趋势，
          支持一键导出为 CSV 用于后续 NLP 编码与形成性评价。
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={12} lg={6}><div className="stat-card"><div className="stat-label">已发布任务</div><Statistic value={s?.task_count ?? 0} loading={loading} /></div></Col>
        <Col xs={12} lg={6}><div className="stat-card tone-cyan"><div className="stat-label">学生提交</div><Statistic value={s?.submission_count ?? 0} loading={loading} /></div></Col>
        <Col xs={12} lg={6}><div className="stat-card tone-green"><div className="stat-label">在册学生</div><Statistic value={s?.student_count ?? 0} loading={loading} /></div></Col>
        <Col xs={12} lg={6}><div className="stat-card tone-amber"><div className="stat-label">平均反思字数</div><Statistic value={s?.avg_reflection_length ?? 0} loading={loading} /></div></Col>
      </Row>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button icon={<Download size={14} />} onClick={() => ideology.exportCsv('reflections')}>导出反思 CSV</Button>
          <Button icon={<Download size={14} />} onClick={() => ideology.exportCsv('tasks')}>导出任务 CSV</Button>
          <Button icon={<Download size={14} />} onClick={() => ideology.exportCsv('events')}>导出行为埋点 CSV</Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <div className="page-card" style={{ padding: 20 }}>
            <div className="section-title">各章节思政任务完成率</div>
            <div className="section-sub" style={{ marginBottom: 8 }}>柱状图，按章节聚合的总提交数 / 应提交数</div>
            {(data?.chapter_completion || []).length === 0 ? (
              <Empty />
            ) : (
              <Chart
                height={300}
                option={{
                  grid: { left: 60, right: 30, top: 20, bottom: 40 },
                  xAxis: { type: 'category', data: data.chapter_completion.map((c: any) => c.chapter), axisLabel: { color: '#64748b' } },
                  yAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#eef0f5' } }, axisLabel: { color: '#94a3b8', formatter: '{value}%' } },
                  tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}：${p[0].value}% (${data.chapter_completion[p[0].dataIndex].submitted}/${data.chapter_completion[p[0].dataIndex].total})` },
                  series: [{
                    type: 'bar',
                    data: data.chapter_completion.map((c: any) => c.rate),
                    barWidth: 28,
                    itemStyle: {
                      borderRadius: [6, 6, 0, 0],
                      color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#f472b6' }, { offset: 1, color: '#fbcfe8' }],
                      },
                    },
                  }],
                }}
              />
            )}
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div className="page-card" style={{ padding: 20 }}>
            <div className="section-title">思政元素关注度</div>
            <div className="section-sub" style={{ marginBottom: 8 }}>按任务出现频次 + 学生提交加权</div>
            {(data?.element_distribution || []).length === 0 ? (
              <Empty />
            ) : (
              <Chart
                height={300}
                option={{
                  tooltip: { trigger: 'item' },
                  legend: { bottom: 0, icon: 'circle', textStyle: { color: '#64748b', fontSize: 11 } },
                  series: [{
                    type: 'pie',
                    radius: ['46%', '76%'],
                    avoidLabelOverlap: true,
                    itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 },
                    label: { show: false },
                    data: data.element_distribution,
                  }],
                }}
              />
            )}
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <div className="page-card" style={{ padding: 20 }}>
            <div className="section-title">学生反思提交趋势（近 14 天）</div>
            <Chart
              height={260}
              option={{
                grid: { left: 50, right: 20, top: 20, bottom: 30 },
                xAxis: { type: 'category', data: (data?.submission_trend || []).map((d: any) => d.date.slice(5)), axisLabel: { color: '#94a3b8', fontSize: 11 } },
                yAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef0f5' } }, axisLabel: { color: '#94a3b8' } },
                tooltip: { trigger: 'axis' },
                series: [{
                  type: 'line', smooth: true, showSymbol: false,
                  data: (data?.submission_trend || []).map((d: any) => d.value),
                  lineStyle: { color: '#a855f7', width: 3 },
                  areaStyle: {
                    color: {
                      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [{ offset: 0, color: 'rgba(168,85,247,0.3)' }, { offset: 1, color: 'rgba(168,85,247,0.02)' }],
                    },
                  },
                }],
              }}
            />
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div className="page-card" style={{ padding: 20 }}>
            <div className="section-title">学生反思高频关键词</div>
            <div className="section-sub" style={{ marginBottom: 8 }}>词频 Top 30</div>
            {(data?.keywords || []).length === 0 ? (
              <Empty />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.keywords.map((k: any, i: number) => (
                  <span key={k.name} className="ideo-chip" style={{
                    fontSize: 11 + Math.min(8, k.value),
                    opacity: 0.75 + Math.min(0.25, i / 60),
                  }}>{k.name} · {k.value}</span>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <div className="page-card" style={{ padding: 20 }}>
            <div className="section-title">任务完成情况明细</div>
            <Table
              size="small"
              rowKey="task_id"
              dataSource={data?.task_completion || []}
              pagination={{ pageSize: 8 }}
              columns={[
                { title: '任务', dataIndex: 'title', ellipsis: true },
                { title: '章节', dataIndex: 'chapter', width: 100, render: (v) => v ? <Tag>{v}</Tag> : '—' },
                { title: '提交 / 应提', key: 'r', width: 100, render: (_, r: any) => `${r.submitted}/${r.total}` },
                { title: '完成率', dataIndex: 'rate', width: 80, render: (v: number) => `${v}%` },
              ]}
            />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="page-card" style={{ padding: 20 }}>
            <div className="section-title">反思质量变化趋势</div>
            <div className="section-sub" style={{ marginBottom: 8 }}>按提交时间序列 · AI 四维平均分</div>
            {(data?.quality_trend || []).length === 0 ? (
              <Empty description="待学生提交反思后将自动生成" />
            ) : (
              <Chart
                height={260}
                option={{
                  grid: { left: 50, right: 20, top: 20, bottom: 30 },
                  xAxis: { type: 'category', data: data.quality_trend.map((d: any) => d.date), axisLabel: { color: '#94a3b8', fontSize: 10 } },
                  yAxis: { type: 'value', max: 5, min: 0, splitLine: { lineStyle: { color: '#eef0f5' } } },
                  tooltip: { trigger: 'axis' },
                  series: [{
                    type: 'line', smooth: true, showSymbol: true, symbolSize: 7,
                    data: data.quality_trend.map((d: any) => d.value),
                    lineStyle: { color: '#0ea5e9', width: 3 },
                    itemStyle: { color: '#0ea5e9' },
                  }],
                }}
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
