import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Progress, Radio, Space, Tag, message } from 'antd';
import { CheckCircle2, FileText, Trophy, RotateCcw } from 'lucide-react';
import { quiz as quizApi } from '../../api';

export default function Quiz() {
  const [list, setList] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = () => quizApi.list().then(setList);

  useEffect(() => {
    refresh();
  }, []);

  const start = async (id: number) => {
    setResult(null);
    setAnswers({});
    const detail = await quizApi.get(id);
    setActive(detail);
  };

  const submit = async () => {
    if (!active) return;
    setLoading(true);
    try {
      const r = await quizApi.submit({ quiz_id: active.id, answers });
      setResult(r);
      message.success(`得分：${r.score}`);
    } finally {
      setLoading(false);
    }
  };

  const progress = useMemo(() => {
    if (!active) return 0;
    const total = active.questions.length || 1;
    const done = active.questions.filter((q: any) => answers[q.id]).length;
    return Math.round((done / total) * 100);
  }, [active, answers]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="page-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(139,92,246,0.12)', color: '#7c3aed',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <FileText size={16} />
          </span>
          <div className="section-title" style={{ marginBottom: 0 }}>章节测验</div>
        </div>
        <div className="section-sub" style={{ marginLeft: 42 }}>
          完成测验后，系统会记录得分与错题，作为形成性评价的过程证据。
        </div>

        {list.length === 0 ? (
          <Empty description="暂无可参与的测验，请教师在「教师端 - 知识库管理 - 教学辅助工具」中生成或新建测验。" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {list.map((it: any) => (
              <div
                key={it.id}
                className="page-card"
                style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, border: active?.id === it.id ? '1px solid var(--primary)' : undefined }}
                onClick={() => start(it.id)}
              >
                <Space>
                  <Tag color="blue">#{it.id}</Tag>
                  {it.chapter && <Tag>{it.chapter}</Tag>}
                </Space>
                <div style={{ fontWeight: 600 }}>{it.title}</div>
                <div className="muted" style={{ fontSize: 12 }}>共 {it.count} 题</div>
                <Button size="small" type="primary" ghost style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  开始测验
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div className="page-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{active.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>共 {active.questions.length} 题</div>
            </div>
            {result && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} color="#f59e0b" />
                <span style={{ fontWeight: 600 }}>得分 {result.score}</span>
              </div>
            )}
          </div>
          {!result && <Progress percent={progress} status="active" strokeColor={{ from: '#4f46e5', to: '#06b6d4' }} />}

          <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
            {active.questions.map((q: any, idx: number) => {
              const r = result?.detail?.find((d: any) => d.question_id === q.id);
              return (
                <div key={q.id} style={{ padding: 16, borderRadius: 10, background: 'var(--surface-soft)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ marginBottom: 10 }}>
                    <strong>
                      {idx + 1}. {q.stem}
                    </strong>
                    {r && (
                      r.correct ? (
                        <Tag color="green" style={{ marginLeft: 8 }}>
                          <CheckCircle2 size={11} style={{ verticalAlign: -1 }} /> 正确
                        </Tag>
                      ) : (
                        <Tag color="red" style={{ marginLeft: 8 }}>应选 {r.answer}</Tag>
                      )
                    )}
                  </div>
                  <Radio.Group
                    onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))}
                    value={answers[q.id]}
                    disabled={!!result}
                  >
                    <Space direction="vertical">
                      {q.options.map((opt: string) => {
                        const code = (opt.match(/^([A-D])/i)?.[1] || '').toUpperCase();
                        return (
                          <Radio key={opt} value={code}>
                            {opt}
                          </Radio>
                        );
                      })}
                    </Space>
                  </Radio.Group>
                  {r?.explanation && (
                    <div className="muted" style={{ marginTop: 8, fontSize: 13, padding: '8px 10px', background: 'white', borderRadius: 8 }}>
                      解析：{r.explanation}
                    </div>
                  )}
                </div>
              );
            })}
            <div>
              {!result ? (
                <Button type="primary" size="large" onClick={submit} loading={loading}>
                  提交答卷
                </Button>
              ) : (
                <Space>
                  <Tag color="blue" style={{ padding: '4px 12px' }}>最终得分：{result.score}</Tag>
                  <Button icon={<RotateCcw size={14} />} onClick={() => start(active.id)}>再做一次</Button>
                </Space>
              )}
            </div>
          </Space>
        </div>
      )}
    </div>
  );
}
