import { useEffect, useRef, useState } from 'react';
import { Button, Input, Radio, Select, Space } from 'antd';
import { ClipboardList } from 'lucide-react';
import Markdown from '../../components/Markdown';
import AnswerActions from '../../components/AnswerActions';
import { cases, chat } from '../../api';

const { TextArea } = Input;

const PERSPECTIVES = ['综合', '精神分析', '人本主义', '特质理论', '社会学习理论', '认知取向'];

export default function Case() {
  const [perspective, setPerspective] = useState('综合');
  const [text, setText] = useState('');
  const [presetId, setPresetId] = useState<number | undefined>();
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);
  const sidRef = useRef<string>('case-' + Date.now());

  useEffect(() => {
    cases.list().then(setPresets).catch(() => {});
  }, []);

  const onUsePreset = (id: number) => {
    setPresetId(id);
    const it = presets.find((x) => x.id === id);
    if (it) setText(`${it.title}\n\n${it.description}`);
  };

  const onAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResp(null);
    try {
      const r = await chat.caseAnalyze({ case_text: text, perspective, session_id: sidRef.current });
      setResp(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="page-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(16,185,129,0.12)', color: '#059669',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ClipboardList size={16} />
          </span>
          <div className="section-title" style={{ marginBottom: 0 }}>案例分析（教学辅助 · 非诊断）</div>
        </div>
        <div className="section-sub" style={{ marginLeft: 42 }}>
          以教学化身从理论视角拆解可观察行为，给出概念联系与苏格拉底式追问。不下临床诊断、不贴标签。
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
          <Space wrap>
            <span style={{ color: 'var(--text-soft)', fontSize: 13, minWidth: 70 }}>分析视角</span>
            <Radio.Group
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={PERSPECTIVES.map((p) => ({ value: p, label: p }))}
            />
          </Space>
          {presets.length > 0 && (
            <Space wrap>
              <span style={{ color: 'var(--text-soft)', fontSize: 13, minWidth: 70 }}>教师案例</span>
              <Select
                allowClear
                style={{ minWidth: 320 }}
                placeholder="可选：从案例库选择"
                value={presetId}
                onChange={(v) => (v ? onUsePreset(v) : setPresetId(undefined))}
                options={presets.map((c: any) => ({ value: c.id, label: c.title }))}
              />
            </Space>
          )}
          <TextArea
            rows={8}
            placeholder="请粘贴或描述案例情境（教学用，避免真实身份信息）。"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div>
            <Button type="primary" onClick={onAnalyze} loading={loading}>
              开始分析
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="page-card" style={{ padding: 20 }}>
          <div className="dot-loader"><span /><span /><span /></div>
          <span style={{ marginLeft: 10, color: 'var(--text-soft)' }}>正在结构化分析…</span>
        </div>
      )}
      {resp && (
        <div className="page-card" style={{ padding: 24 }}>
          {resp.notice && (
            <div className={`notice ${resp.safety_flag === 'blocked' ? 'blocked' : ''}`} style={{ marginBottom: 12 }}>
              {resp.notice}
            </div>
          )}
          <Markdown>{resp.answer}</Markdown>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <AnswerActions
              text={resp.answer || ''}
              module="case"
              sessionId={sidRef.current}
              onRetry={onAnalyze}
            />
          </div>
        </div>
      )}
    </div>
  );
}
