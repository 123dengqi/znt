import { useEffect, useMemo, useState } from 'react';
import { Button, Col, Empty, Input, Row, Space, Spin, Tag, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ArrowLeft, BookOpen, Send, Sparkles } from 'lucide-react';
import Chart from '../../components/Chart';
import Markdown from '../../components/Markdown';
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

const DIMS = ['专业关联度', '表达完整性', '伦理意识', '反思深度'];

export default function IdeologyReflectionPage() {
  const { taskId } = useParams();
  const nav = useNavigate();
  const tid = Number(taskId);

  const [task, setTask] = useState<any | null>(null);
  const [mine, setMine] = useState<any | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      ideology.getTask(tid),
      ideology.listReflections({ task_id: tid }),
    ]).then(([t, rs]) => {
      if (!alive) return;
      setTask(t);
      const my = (rs || [])[0] || null;
      setMine(my);
    }).catch(() => message.error('任务加载失败'))
    .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tid]);

  const submit = async () => {
    if (text.trim().length < 10) {
      message.warning('请至少撰写 10 字以上的反思');
      return;
    }
    setSubmitting(true);
    try {
      const r = await ideology.submitReflection({ task_id: tid, response_text: text });
      setMine(r);
      message.success('已提交，AI 教学性反馈已生成');
    } catch (e: any) {
      message.error('提交失败，请稍后重试');
    } finally { setSubmitting(false); }
  };

  const radar = useMemo(() => {
    const scores = mine?.ai_dimensions?.scores || {};
    return DIMS.map((d) => Number(scores[d] || 0));
  }, [mine]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>;
  if (!task) return <Empty description="任务不存在" />;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <Button icon={<ArrowLeft size={14} />} onClick={() => nav('/student/ideology')}>返回任务列表</Button>
      </div>

      <div className="ideo-hero">
        <div className="ttl"><BookOpen size={20} /> {task.title}</div>
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            <Tag color="magenta">{TYPE_LABEL[task.task_type] || task.task_type}</Tag>
            {task.chapter && <Tag color="blue">{task.chapter}</Tag>}
            {task.knowledge_point && <Tag>{task.knowledge_point}</Tag>}
            {(task.ideology_elements || '').split(',').filter(Boolean).map((s: string) => (
              <span key={s} className="ideo-chip">{s.trim()}</span>
            ))}
          </Space>
        </div>
        <div style={{ marginTop: 14, color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 14 }}>
          {task.task_content}
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={mine ? 12 : 24}>
          <div className="page-card" style={{ padding: 18 }}>
            <div className="section-title">
              <Sparkles size={16} style={{ display: 'inline', marginRight: 6, marginBottom: 3 }} />
              撰写你的反思
            </div>
            <div className="section-sub" style={{ marginBottom: 10 }}>
              提示：可结合本章人格心理学专业概念举例说明，注意伦理边界（如不贴标签、不替专业人员下诊断）。
            </div>
            <Input.TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoSize={{ minRows: 8, maxRows: 18 }}
              placeholder={mine ? '已提交后仍可再次撰写一份新的反思' : '请在这里写下你的反思（不少于 10 字）'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, color: '#94a3b8', fontSize: 12 }}>
              <span>当前字数：{text.length}</span>
              <Button type="primary" icon={<Send size={14} />} loading={submitting} onClick={submit}>
                提交反思 · 获取 AI 反馈
              </Button>
            </div>
          </div>
        </Col>

        {mine && (
          <Col xs={24} lg={12}>
            <div className="ideo-feedback">
              <h4>AI 教学性反馈 · {dayjs(mine.submitted_at).format('YYYY-MM-DD HH:mm')}</h4>
              <div style={{ marginTop: 8 }}>
                <Markdown>{mine.ai_feedback}</Markdown>
              </div>
              {radar.some((v) => v > 0) && (
                <Chart
                  height={260}
                  option={{
                    tooltip: {},
                    radar: {
                      indicator: DIMS.map((d) => ({ name: d, max: 5 })),
                      splitArea: { areaStyle: { color: ['rgba(248,250,252,0.4)', 'rgba(238,242,255,0.4)'] } },
                      axisName: { color: '#64748b', fontSize: 12 },
                    },
                    series: [{
                      type: 'radar',
                      data: [{
                        value: radar,
                        name: 'AI 评估',
                        areaStyle: { color: 'rgba(168,85,247,0.25)' },
                        lineStyle: { color: '#a855f7', width: 2 },
                        itemStyle: { color: '#a855f7' },
                      }],
                    }],
                  }}
                />
              )}
              {mine.teacher_comment && (
                <div style={{ marginTop: 10, padding: 12, background: '#fff', borderRadius: 10, border: '1px dashed #c7d2fe' }}>
                  <div style={{ color: '#0f766e', fontSize: 13, fontWeight: 600 }}>教师评语 · 得分 {mine.score}</div>
                  <div style={{ marginTop: 4, color: '#334155', whiteSpace: 'pre-wrap' }}>{mine.teacher_comment}</div>
                </div>
              )}
            </div>
          </Col>
        )}
      </Row>

      <div className="page-card" style={{ padding: 14, color: '#94a3b8', fontSize: 12 }}>
        本系统对学生反思的 AI 反馈仅来自专业关联度、表达完整性、伦理意识、反思深度四个教学维度，
        不评价个体的思想立场，不输出心理诊断或人格标签。如你遇到强烈的情绪困扰，请及时寻求专业帮助或学校心理支持。
      </div>
    </div>
  );
}
