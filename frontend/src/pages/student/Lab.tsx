import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Input, Tag, Tooltip, message } from 'antd';
import { Beaker, Sparkles, Square, Wand2, Copy, Mic, MicOff, RefreshCw } from 'lucide-react';
import Markdown from '../../components/Markdown';
import Chart from '../../components/Chart';
import { useSSE } from '../../hooks/useSSE';
import { apiPath } from '../../env';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import './lab.css';

const { TextArea } = Input;

const ALL_SCHOOLS = ['精神分析', '人本主义', '特质理论', '社会学习理论', '认知取向', '行为主义'];

const SCHOOL_TONE: Record<string, { from: string; to: string }> = {
  精神分析: { from: '#7c3aed', to: '#a855f7' },
  人本主义: { from: '#10b981', to: '#34d399' },
  特质理论: { from: '#f59e0b', to: '#fbbf24' },
  社会学习理论: { from: '#06b6d4', to: '#22d3ee' },
  认知取向: { from: '#3b82f6', to: '#6366f1' },
  行为主义: { from: '#ef4444', to: '#f97316' },
};

const PRESET_SCENARIOS = [
  '小李大三，在导师面前总是显得紧张，平时朋友评价他幽默自信。最近他在备研路上反复拖延，凌晨复盘后又决心努力，但白天又重复拖延。',
  '小张是一名舞蹈生，从小被父母严格要求“必须出类拔萃”。她公开演出前会反复焦虑，但只有在被认可后才敢继续投入。',
  '小王在小组项目中习惯先观察组长怎么做，再尝试模仿。当组长不在时，他常常怀疑自己的判断，难以独立决策。',
];

interface SchoolBox {
  text: string;
  done: boolean;
  error?: string;
}

interface ScoresPayload {
  dims: string[];
  scores: Record<string, number[]>;
}

export default function Lab() {
  const [scenario, setScenario] = useState('');
  const [picked, setPicked] = useState<string[]>(['精神分析', '人本主义', '特质理论', '社会学习理论']);
  const [boxes, setBoxes] = useState<Record<string, SchoolBox>>({});
  const [scores, setScores] = useState<ScoresPayload | null>(null);
  const [meta, setMeta] = useState<{ session_id?: string; safety_flag?: string; notice?: string } | null>(null);
  const sse = useSSE();
  const speech = useSpeechRecognition('zh-CN');
  const baseRef = useRef('');

  // 语音转录注入
  useEffect(() => {
    if (!speech.listening && !speech.transcript) return;
    const composed = (baseRef.current ? baseRef.current + ' ' : '') + speech.transcript + speech.interim;
    setScenario(composed);
  }, [speech.listening, speech.transcript, speech.interim]);

  const start = async () => {
    if (!scenario.trim() || picked.length === 0) return;
    if (speech.listening) speech.stop();
    setBoxes(Object.fromEntries(picked.map((s) => [s, { text: '', done: false } as SchoolBox])));
    setScores(null);
    setMeta(null);
    await sse.post(apiPath('/api/lab/persona/stream'), { scenario, schools: picked }, {
      onEvent: (evt) => {
        if (evt.type === 'meta') {
          setMeta({ session_id: evt.session_id, safety_flag: evt.safety_flag, notice: evt.notice });
        } else if (evt.type === 'delta') {
          setBoxes((s) => ({ ...s, [evt.school]: { text: (s[evt.school]?.text || '') + (evt.text || ''), done: false } }));
        } else if (evt.type === 'school_done') {
          setBoxes((s) => ({ ...s, [evt.school]: { ...(s[evt.school] || { text: '', done: false }), done: true } }));
        } else if (evt.type === 'error') {
          setBoxes((s) => ({ ...s, [evt.school]: { ...(s[evt.school] || { text: '', done: false }), error: evt.text } }));
        } else if (evt.type === 'scores') {
          setScores({ dims: evt.dims, scores: evt.scores });
        } else if (evt.type === 'done') {
          // 整体结束
        }
      },
      onError: (e) => message.error(e),
    });
    setBoxes((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { ...v, done: true }])));
  };

  const stop = () => sse.abort();

  const fillPreset = (i: number) => {
    setScenario(PRESET_SCENARIOS[i]);
    baseRef.current = PRESET_SCENARIOS[i];
  };

  const toggleMic = () => {
    if (!speech.supported) {
      message.warning('当前浏览器不支持语音识别（建议 Chrome/Edge）');
      return;
    }
    if (speech.listening) {
      speech.stop();
    } else {
      baseRef.current = scenario;
      speech.reset();
      speech.start();
    }
  };

  const radarOption = useMemo(() => {
    if (!scores) return null;
    const max = 5;
    return {
      tooltip: {},
      legend: { bottom: 0, icon: 'circle', textStyle: { color: '#64748b', fontSize: 12 } },
      radar: {
        shape: 'polygon',
        indicator: scores.dims.map((d) => ({ name: d, max })),
        splitArea: { areaStyle: { color: ['rgba(99,102,241,0.04)', 'rgba(99,102,241,0.02)'] } },
        axisLine: { lineStyle: { color: '#e6e8ee' } },
        splitLine: { lineStyle: { color: '#eef0f5' } },
        axisName: { color: '#64748b', fontSize: 12 },
      },
      series: [
        {
          type: 'radar',
          data: Object.entries(scores.scores).map(([name, vals]) => ({
            name,
            value: vals,
            areaStyle: { opacity: 0.15 },
            lineStyle: { width: 2 },
          })),
        },
      ],
    } as any;
  }, [scores]);

  const empty = Object.keys(boxes).length === 0;

  return (
    <div className="lab-shell">
      {/* Hero */}
      <div className="lab-hero">
        <div className="hero-inner">
          <span className="lab-badge"><Beaker size={14} /> Persona Lab · 创新实验</span>
          <h2>同一情境，多流派同时解读</h2>
          <p>把一段真实情境投入「人格实验室」，AI 会以多个流派视角并行实时解读，并基于五个维度生成对比雷达图，帮助你理解理论之间的边界与互补。</p>
          <div className="hero-meta">
            <span className="hero-stat"><b>{picked.length}</b> 个流派已选</span>
            <span className="hero-divider" />
            <span className="hero-stat"><b>{scenario.length}</b> 字情境</span>
            <span className="hero-pill">教学使用 · 不进行临床诊断</span>
          </div>
        </div>
        <div className="hero-orb a" />
        <div className="hero-orb b" />
        <div className="hero-orb c" />
      </div>

      {/* 输入区 */}
      <div className="page-card lab-input">
        <div className="lab-input-head">
          <span className="lab-ic"><Sparkles size={16} /></span>
          <div className="lab-input-title">
            <div className="section-title" style={{ marginBottom: 0 }}>情境与流派</div>
            <div className="section-sub" style={{ marginTop: 4 }}>选择 2 - 6 个流派，输入情境（建议不少于 30 字）。</div>
          </div>
          <Tooltip title={speech.supported ? (speech.listening ? '停止聆听' : '语音输入（中文）') : '当前浏览器不支持语音识别'}>
            <button className={`mic-btn ${speech.listening ? 'listening' : ''}`} onClick={toggleMic}>
              {speech.listening ? <MicOff size={18} /> : <Mic size={18} />}
              {speech.listening && (
                <span className="mic-wave"><i /><i /><i /><i /></span>
              )}
            </button>
          </Tooltip>
        </div>

        <div className="field-block">
          <div className="field-label">选择流派</div>
          <div className="chip-row">
            {ALL_SCHOOLS.map((s) => {
              const active = picked.includes(s);
              const tone = SCHOOL_TONE[s] || { from: '#4f46e5', to: '#06b6d4' };
              return (
                <button
                  key={s}
                  className={`school-chip ${active ? 'active' : ''}`}
                  style={active ? {
                    background: `linear-gradient(135deg, ${tone.from}, ${tone.to})`,
                    borderColor: 'transparent',
                    color: '#fff',
                    boxShadow: `0 6px 18px ${tone.from}33`,
                  } : {}}
                  onClick={() =>
                    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field-block">
          <div className="field-label">情境描述</div>
          <TextArea
            rows={6}
            value={scenario}
            onChange={(e) => { setScenario(e.target.value); baseRef.current = e.target.value; }}
            placeholder={speech.listening ? '正在聆听… 你可以直接说话' : '示例：小李大三，朋友评价他幽默自信，但在导师面前总是紧张……（避免真实身份信息）'}
            style={{ fontSize: 14 }}
          />
          <div className="preset-row">
            <span className="muted" style={{ fontSize: 12 }}>试试预设情境</span>
            {PRESET_SCENARIOS.map((_, i) => (
              <Tag key={i} color="geekblue" style={{ cursor: 'pointer', borderRadius: 999 }} onClick={() => fillPreset(i)}>
                情境 {i + 1}
              </Tag>
            ))}
          </div>
        </div>

        <div className="lab-actions">
          <span className="muted" style={{ fontSize: 12 }}>
            已选 {picked.length} 个流派 · {scenario.length} 字
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => { setScenario(''); baseRef.current = ''; setBoxes({}); setScores(null); setMeta(null); speech.reset(); }}
            >
              重置
            </Button>
            {sse.running ? (
              <Button danger icon={<Square size={14} />} onClick={stop} size="large">停止</Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<Wand2 size={14} />}
                onClick={start}
                disabled={!scenario.trim() || picked.length === 0}
              >
                开始多流派并行解读
              </Button>
            )}
          </div>
        </div>
      </div>

      {meta?.notice && (
        <div className={`notice ${meta.safety_flag === 'blocked' ? 'blocked' : ''}`}>{meta.notice}</div>
      )}

      {empty ? (
        <div className="page-card lab-empty">
          <Empty
            description={
              <div style={{ maxWidth: 420, margin: '0 auto' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>等待你的情境输入</div>
                <span className="muted" style={{ fontSize: 13 }}>
                  描述一段真实教学情境，点击「开始多流派并行解读」即可看到多个 AI 视角同时流式输出与对比雷达图。
                </span>
              </div>
            }
          />
        </div>
      ) : (
        <div className="result-section">
          <div className="result-title-row">
            <div>
              <div className="section-title">流派并行解读</div>
              <div className="section-sub">每个卡片是一个流派的实时输出，互不阻塞</div>
            </div>
            {sse.running && <span className="running-pill"><span className="dot-blink" /> 正在生成…</span>}
          </div>
          <div className="lab-grid">
            {Object.entries(boxes).map(([school, box]) => {
              const tone = SCHOOL_TONE[school] || { from: '#4f46e5', to: '#06b6d4' };
              const running = !box.done && sse.running;
              return (
                <div key={school} className={`lab-card ${running ? 'is-running' : ''}`} style={{ ['--tone-from' as any]: tone.from, ['--tone-to' as any]: tone.to }}>
                  <div className="lab-card-head">
                    <span className="dot" />
                    <strong>{school}</strong>
                    {running && <span className="pill">流式输出中</span>}
                    {box.done && <span className="pill done">完成</span>}
                    {box.text && (
                      <Tooltip title="复制本卡内容">
                        <button
                          className="action-btn"
                          style={{ marginLeft: 'auto', height: 26 }}
                          onClick={async () => {
                            try { await navigator.clipboard.writeText(box.text); message.success('已复制'); } catch {}
                          }}
                        >
                          <Copy size={12} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                  <div className="lab-card-body">
                    {box.error ? (
                      <div className="notice blocked">{box.error}</div>
                    ) : box.text ? (
                      <Markdown>{box.text}</Markdown>
                    ) : (
                      <div className="dot-loader" style={{ marginTop: 8 }}><span /><span /><span /></div>
                    )}
                    {running && box.text && <span className="cursor-blink" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {radarOption && (
        <div className="page-card lab-radar">
          <div className="result-title-row" style={{ marginBottom: 8 }}>
            <div>
              <div className="section-title">五维度对比 · AI 评分（1 - 5）</div>
              <div className="section-sub">维度：人格结构 / 动力机制 / 发展观 / 情境敏感度 / 教学可操作性</div>
            </div>
          </div>
          <Chart height={420} option={radarOption} />
        </div>
      )}
    </div>
  );
}
