import { useEffect, useMemo, useState } from 'react';
import { Col, Empty, Input, Row, Segmented, Space, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { ArrowRight, ClipboardList, Filter, HeartHandshake, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ideology } from '../../api';
import '../ideology.css';

const TYPE_LABEL: Record<string, string> = {
  pre_think: '课前思考',
  in_class_discuss: '课堂讨论',
  case_analysis: '案例分析',
  role_play: '角色模拟',
  post_reflection: '课后反思',
  value_guide: '价值引导',
};

export default function IdeologyTasks() {
  const nav = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [kw, setKw] = useState('');

  const load = async () => {
    try {
      const list = await ideology.listTasks({ status: 'published' });
      setTasks(list);
    } catch { message.error('任务加载失败'); }
  };
  useEffect(() => { load(); }, []);

  const list = useMemo(() => {
    let arr = tasks;
    if (filter === 'todo') arr = arr.filter((t) => !t.submitted);
    if (filter === 'done') arr = arr.filter((t) => t.submitted);
    if (kw.trim()) {
      const q = kw.toLowerCase();
      arr = arr.filter((t) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.chapter || '').toLowerCase().includes(q) ||
        (t.knowledge_point || '').toLowerCase().includes(q) ||
        (t.ideology_elements || '').toLowerCase().includes(q),
      );
    }
    return arr;
  }, [tasks, filter, kw]);

  const todoCount = tasks.filter((t) => !t.submitted).length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="ideo-hero">
        <div className="ttl"><HeartHandshake size={22} color="#be185d" /> 课程思政学习任务</div>
        <div className="sub">
          每个任务都来自《人格心理学》的具体知识点，结合一项或多项思政元素：你将通过提交一段反思，
          看到 AI 从「专业关联度、表达完整性、伦理意识、反思深度」四个维度给出的教学性建议，老师会进一步点评。
          系统不会对你的思想立场作任何评价。
        </div>
        <div style={{ marginTop: 12 }}>
          <Tag color="magenta" style={{ borderRadius: 999 }}>共 {tasks.length} 个任务</Tag>
          <Tag color="orange" style={{ borderRadius: 999 }}>待完成 {todoCount}</Tag>
          <Tag color="green" style={{ borderRadius: 999 }}>已完成 {tasks.length - todoCount}</Tag>
        </div>
      </div>

      <div className="page-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <Segmented
            options={[
              { label: '全部', value: 'all' },
              { label: '待完成', value: 'todo' },
              { label: '已完成', value: 'done' },
            ]}
            value={filter}
            onChange={(v) => setFilter(v as any)}
          />
          <Space>
            <Input
              prefix={<Search size={14} />}
              placeholder="搜索标题 / 章节 / 知识点 / 思政元素"
              style={{ width: 320 }}
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              allowClear
            />
            <span style={{ color: '#94a3b8', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Filter size={12} />已过滤 {list.length} 条
            </span>
          </Space>
        </div>

        {list.length === 0 ? (
          <Empty description="暂无任务" />
        ) : (
          <Row gutter={[16, 16]}>
            {list.map((t) => (
              <Col xs={24} md={12} lg={8} key={t.id}>
                <div className="ideo-task-card" onClick={() => nav(`/student/ideology/${t.id}`)}>
                  {t.submitted && <span className="submitted-flag">已提交</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="typ">{TYPE_LABEL[t.task_type] || t.task_type}</span>
                    {t.chapter && <Tag>{t.chapter}</Tag>}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{t.title}</div>
                  <div style={{ color: '#64748b', fontSize: 13, minHeight: 44, lineHeight: 1.7,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.task_content}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(t.ideology_elements || '').split(',').filter(Boolean).slice(0, 3).map((s: string) => (
                      <span key={s} className="ideo-chip">{s.trim()}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: 12 }}>
                    <span>{dayjs(t.created_at).format('YYYY-MM-DD')}</span>
                    <span style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {t.submitted ? <>查看反思 <ArrowRight size={14} /></> : <>开始反思 <Sparkles size={14} /></>}
                    </span>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <div className="page-card" style={{ padding: 16, color: '#94a3b8', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <ClipboardList size={14} />
        系统对反思的 AI 反馈仅来自专业关联度、表达完整性、伦理意识、反思深度四个教学维度，不评价个体的思想立场，也不输出心理诊断或人格标签。
      </div>
    </div>
  );
}
