import { useEffect, useState } from 'react';
import { Input, Button, Select, Space, Tag, Empty, Tooltip } from 'antd';
import { Send, Sparkles, BookOpen, ListFilter, Eraser, HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Markdown from '../../components/Markdown';
import AnswerActions from '../../components/AnswerActions';
import { useStreamQA } from '../../hooks/useStreamQA';
import { ideology } from '../../api';
import '../ideology.css';

const { TextArea } = Input;

const CHAPTERS = [
  '人格特质理论',
  '人格动力理论',
  '人格发展理论',
  '人格测评',
  '人格适应与异常',
  '典型案例分析',
];

const SCHOOLS = ['精神分析', '人本主义', '特质理论', '社会学习理论', '认知取向', '综合'];

const SAMPLES = [
  '本我、自我、超我之间的关系是什么？请结合大学生学习场景。',
  '请用 100 字解释“自我效能感”及其在学习中的作用。',
  '大五人格中“尽责性”高低的人在学习习惯上可能有哪些差异？',
];

export default function QA() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [chapter, setChapter] = useState<string | undefined>();
  const [school, setSchool] = useState<string | undefined>();
  const [guide, setGuide] = useState<any | null>(null);
  const { state, ask, abort, reset } = useStreamQA();

  useEffect(() => {
    if (!chapter) { setGuide(null); return; }
    let alive = true;
    ideology.guidance(chapter).then((r) => { if (alive) setGuide(r?.available ? r : null); }).catch(() => setGuide(null));
    return () => { alive = false; };
  }, [chapter]);

  const onAsk = () => {
    if (!q.trim()) return;
    ask({ question: q, chapter, school });
  };

  const onRetry = () => {
    if (q.trim()) ask({ question: q, chapter, school });
  };

  const empty = !state.text && !state.loading && !state.error;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="page-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--primary-soft)', color: 'var(--primary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Sparkles size={16} />
          </span>
          <div className="section-title" style={{ marginBottom: 0 }}>课程问答（基于知识库）</div>
        </div>
        <div className="section-sub" style={{ marginLeft: 42 }}>
          回答优先依据上传的课程材料，实时流式输出。系统不进行临床诊断。
        </div>

        <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-soft)', fontSize: 12 }}>
            <ListFilter size={14} /> 过滤
          </span>
          <Select
            allowClear
            placeholder="按章节"
            options={CHAPTERS.map((c) => ({ value: c, label: c }))}
            style={{ width: 200 }}
            value={chapter}
            onChange={setChapter}
          />
          <Select
            allowClear
            placeholder="按流派"
            options={SCHOOLS.map((c) => ({ value: c, label: c }))}
            style={{ width: 200 }}
            value={school}
            onChange={setSchool}
          />
          <Tooltip title="点击以填入示例问题">
            <Space size={6} wrap>
              {SAMPLES.map((s) => (
                <Tag
                  key={s}
                  style={{ cursor: 'pointer', borderRadius: 999 }}
                  color="blue"
                  onClick={() => setQ(s)}
                >
                  {s.length > 18 ? s.slice(0, 18) + '…' : s}
                </Tag>
              ))}
            </Space>
          </Tooltip>
        </div>

        {guide && (
          <div className="ideo-guidance" style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div className="lbl"><HeartHandshake size={12} style={{ display: 'inline', marginRight: 4 }} />本章思政引导</div>
                <div style={{ marginTop: 4, color: '#9a3412', fontSize: 13 }}>
                  专业知识点：<strong>{guide.knowledge_point}</strong>
                  {guide.ideology_elements && (
                    <>　·　思政元素：{guide.ideology_elements.split(',').filter(Boolean).map((s: string) => (
                      <span key={s} className="ideo-chip" style={{ marginLeft: 4 }}>{s.trim()}</span>
                    ))}</>
                  )}
                </div>
                <div className="q">引导问题：{guide.guidance_question}</div>
              </div>
              <Button size="small" type="primary" ghost onClick={() => nav('/student/ideology')}>
                进入思政任务
              </Button>
            </div>
          </div>
        )}

        <TextArea
          rows={4}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              onAsk();
            }
          }}
          placeholder="输入问题（Ctrl/Cmd + Enter 快速提问）"
          style={{ marginTop: 14, fontSize: 14 }}
        />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {q.length > 0 && `${q.length} 字`}
          </span>
          <Space>
            <Button icon={<Eraser size={14} />} onClick={() => { setQ(''); reset(); }}>清空</Button>
            <Button type="primary" icon={<Send size={14} />} onClick={onAsk} loading={state.loading} size="large">
              提问
            </Button>
          </Space>
        </div>
      </div>

      {(state.text || state.loading || state.error) && (
        <div className="page-card" style={{ padding: 24 }}>
          {state.notice && (
            <div className={`notice ${state.safety_flag === 'blocked' ? 'blocked' : ''}`} style={{ marginBottom: 12 }}>
              {state.notice}
            </div>
          )}
          {state.error && (
            <div className="notice blocked" style={{ marginBottom: 12 }}>{state.error}</div>
          )}
          <Markdown>{state.text + (state.loading ? '\u200B' : '')}</Markdown>
          {state.loading && <span className="cursor-blink" />}

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {state.loading ? '正在生成…' : state.text ? '生成完成' : ''}
            </span>
            <AnswerActions
              text={state.text}
              module="qa"
              sessionId={state.session_id}
              loading={state.loading}
              onRetry={onRetry}
              onAbort={abort}
            />
          </div>

          {state.citations?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <BookOpen size={14} color="#4f46e5" />
                <span style={{ fontWeight: 600 }}>引用片段</span>
                <Tag>{state.citations.length}</Tag>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {state.citations.map((it, i) => (
                  <div
                    key={it.chunk_id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-soft)',
                    }}
                  >
                    <Space size={6} style={{ marginBottom: 4 }}>
                      <Tag color="blue">片段{i + 1}</Tag>
                      {it.chapter && <Tag>章节：{it.chapter}</Tag>}
                      {it.school && <Tag>流派：{it.school}</Tag>}
                      <span className="muted">score {it.score.toFixed(2)}</span>
                    </Space>
                    <div style={{ color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.7 }}>
                      {it.text.slice(0, 240)}
                      {it.text.length > 240 ? '…' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {empty && (
        <div className="page-card" style={{ padding: 32 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="muted">输入问题，或点击上方示例 chip · 支持 Ctrl/Cmd + Enter 快速提交</span>}
          />
        </div>
      )}
    </div>
  );
}
