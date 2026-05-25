import { useEffect, useRef, useState } from 'react';
import { Button, Input, Empty, Tag, Tooltip, message } from 'antd';
import { Send, RotateCcw, Drama, Copy, Mic, MicOff } from 'lucide-react';
import Markdown from '../../components/Markdown';
import { chat } from '../../api';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface RoleDef {
  key: string;
  title: string;
  desc: string;
  initial: string;
}

const ROLES: RoleDef[] = [
  { key: '弗洛伊德', title: '弗洛伊德', desc: '精神分析视角 · 本我/自我/超我、潜意识、防御机制', initial: '欢迎来到我的研究室。请说说你近来困惑的问题，我会尝试从潜意识与防御的视角与你一同探索。' },
  { key: '罗杰斯', title: '罗杰斯', desc: '人本主义视角 · 自我概念、积极关注、价值条件', initial: '我很高兴你愿意分享。请告诉我你正在经历什么，我会以无评判、共情的态度与你一起看见你自己。' },
  { key: '阿尔伯特·班杜拉', title: '班杜拉', desc: '社会学习/自我效能 · 观察学习、三元交互', initial: '我们一起看看，你周围有哪些榜样和经验，正在影响你对自身能力的判断？' },
  { key: '特质理论学者', title: '特质学者', desc: '大五人格 · 跨情境稳定的特质差异', initial: '让我们用可测量的方式看看：在最近的情境中，哪种行为模式最常出现？我们再讨论它属于哪个特质。' },
  { key: '来访者-成长困惑', title: '来访者-成长困惑', desc: '同伴视角 · 学业、人际、自我认同', initial: '最近我有一些困惑，挺纠结的。你愿意听我说说，然后我们一起聊聊吗？' },
];

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS: Record<string, string[]> = {
  弗洛伊德: ['你如何看待大学生的“自我同一性”议题？', '梦到反复迟到考试，从潜意识看可能意味着什么？'],
  罗杰斯: ['我感觉父母对我的期望和我自己想要的差距很大，怎么办？', '什么是“真实的自我”？'],
  '阿尔伯特·班杜拉': ['想提升公开演讲的自我效能，能给我一些步骤吗？', '榜样观察学习如何帮助养成新的学习习惯？'],
  特质理论学者: ['请用大五维度说说我可能的特点（基于：周末独处、计划性强）。', '高神经质的人如何调节情绪？'],
  '来访者-成长困惑': ['(尝试以同伴身份提问，让来访者讲讲最近的纠结)'],
};

export default function Role() {
  const [role, setRole] = useState<RoleDef>(ROLES[0]);
  const [history, setHistory] = useState<Msg[]>([{ role: 'assistant', content: ROLES[0].initial }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sidRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechRecognition('zh-CN');
  const baseInputRef = useRef('');

  const switchRole = (r: RoleDef) => {
    setRole(r);
    setHistory([{ role: 'assistant', content: r.initial }]);
    sidRef.current = undefined;
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, loading]);

  // 把语音识别（最终 + 临时）结果实时写入输入框
  useEffect(() => {
    if (!speech.listening && !speech.transcript) return;
    const composed = (baseInputRef.current ? baseInputRef.current + ' ' : '') + speech.transcript + speech.interim;
    setInput(composed);
  }, [speech.transcript, speech.interim, speech.listening]);

  const toggleMic = () => {
    if (!speech.supported) {
      message.warning('当前浏览器不支持语音识别，请使用 Chrome / Edge 等现代浏览器。');
      return;
    }
    if (speech.listening) {
      speech.stop();
      return;
    }
    baseInputRef.current = input;
    speech.reset();
    speech.start();
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;
    if (speech.listening) speech.stop();
    const next = [...history, { role: 'user' as const, content: text }];
    setHistory(next);
    setInput('');
    baseInputRef.current = '';
    speech.reset();
    setLoading(true);
    try {
      const r = await chat.role({
        role: role.key,
        user_message: text,
        history: history.filter((_, i) => i !== 0).map((m) => ({ role: m.role, content: m.content })),
        session_id: sidRef.current,
      });
      sidRef.current = sidRef.current || r.session_id;
      setHistory([...next, { role: 'assistant' as const, content: r.answer }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'stretch' }}>
      <div className="page-card" style={{ padding: 16, height: 'fit-content', position: 'sticky', top: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Drama size={16} color="#7c3aed" />
          <strong style={{ fontSize: 14 }}>选择教学化身</strong>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {ROLES.map((r) => {
            const active = r.key === role.key;
            return (
              <div
                key={r.key}
                onClick={() => switchRole(r)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `1px solid ${active ? '#c7d2fe' : 'var(--border)'}`,
                  background: active ? 'var(--primary-soft)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13.5, color: active ? 'var(--primary)' : 'var(--text)' }}>
                  {r.title}
                </div>
                <div style={{ color: 'var(--text-soft)', fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>{r.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="page-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 560 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{role.title}</div>
            <div style={{ color: 'var(--text-soft)', fontSize: 12 }}>{role.desc} · 教学化身、不进行临床诊断</div>
          </div>
          <Button icon={<RotateCcw size={14} />} size="small" onClick={() => switchRole(role)}>清空</Button>
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'linear-gradient(180deg, #fafbff 0%, #ffffff 100%)',
          }}
        >
          {history.length === 0 && (
            <Empty description="开始与角色对话" />
          )}
          {history.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`} style={{ position: 'relative' }}>
              {m.role === 'assistant' ? <Markdown>{m.content}</Markdown> : <span>{m.content}</span>}
              {m.role === 'assistant' && i > 0 && (
                <button
                  className="action-btn"
                  style={{ position: 'absolute', right: 8, top: 8, height: 24, padding: '0 6px' }}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(m.content);
                      message.success('已复制');
                    } catch {
                      message.error('复制失败');
                    }
                  }}
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div className="bubble assistant">
              <span className="dot-loader"><span /><span /><span /></span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-soft)', padding: 12 }}>
          {(QUICK_PROMPTS[role.key] || []).length > 0 && history.length <= 2 && (
            <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, alignSelf: 'center' }}>试试</span>
              {(QUICK_PROMPTS[role.key] || []).map((p) => (
                <Tag
                  key={p}
                  style={{ cursor: 'pointer', borderRadius: 999 }}
                  color="blue"
                  onClick={() => setInput(p)}
                >
                  {p.length > 24 ? p.slice(0, 24) + '…' : p}
                </Tag>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tooltip title={
              !speech.supported
                ? '当前浏览器不支持语音识别（建议 Chrome/Edge）'
                : speech.listening
                  ? '正在聆听… 点击停止'
                  : '按住说话（中文识别）'
            }>
              <button
                onClick={toggleMic}
                className={`mic-btn ${speech.listening ? 'listening' : ''}`}
                aria-label="语音输入"
              >
                {speech.listening ? <MicOff size={18} /> : <Mic size={18} />}
                {speech.listening && (
                  <span className="mic-wave"><i /><i /><i /><i /></span>
                )}
              </button>
            </Tooltip>
            <Input
              placeholder={
                speech.listening
                  ? '正在聆听… 你可以直接说话'
                  : `与「${role.title}」对话… 支持语音输入 / Enter 发送`
              }
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                baseInputRef.current = e.target.value;
              }}
              onPressEnter={onSend}
              disabled={loading}
              size="large"
            />
            <Button type="primary" icon={<Send size={14} />} loading={loading} onClick={onSend} size="large">
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
