import { useRef, useState } from 'react';
import { Button, Input, Select, Space, Tag } from 'antd';
import { GitCompareArrows, Lightbulb } from 'lucide-react';
import Markdown from '../../components/Markdown';
import AnswerActions from '../../components/AnswerActions';
import { chat } from '../../api';

const SCHOOLS = ['精神分析', '人本主义', '特质理论', '社会学习理论', '认知取向', '行为主义'];

const PRESETS = [
  { schools: ['精神分析', '人本主义'], topic: '人格的形成机制' },
  { schools: ['特质理论', '社会学习理论'], topic: '个体差异的来源' },
  { schools: ['精神分析', '认知取向'], topic: '不适应行为的解释' },
];

export default function Compare() {
  const [schools, setSchools] = useState<string[]>(['精神分析', '人本主义']);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const sidRef = useRef<string>('compare-' + Date.now());

  const onCompare = async () => {
    if (schools.length < 2) return;
    setLoading(true);
    setText('');
    try {
      const r = await chat.compare({ schools, topic, session_id: sidRef.current });
      setText(r.answer);
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
              background: 'rgba(6,182,212,0.12)', color: '#0891b2',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <GitCompareArrows size={16} />
          </span>
          <div className="section-title" style={{ marginBottom: 0 }}>理论流派对比</div>
        </div>
        <div className="section-sub" style={{ marginLeft: 42 }}>
          支持任意两个或多个流派的多维对比（核心观点 / 动力 / 发展 / 测评 / 边界 / 局限）。
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 6 }}>
          <Space wrap>
            <span style={{ color: 'var(--text-soft)', fontSize: 13, minWidth: 60 }}>选择流派</span>
            <Select
              mode="multiple"
              style={{ minWidth: 360 }}
              value={schools}
              onChange={setSchools}
              options={SCHOOLS.map((s) => ({ value: s, label: s }))}
              placeholder="至少选择两个流派"
            />
          </Space>
          <Space wrap>
            <span style={{ color: 'var(--text-soft)', fontSize: 13, minWidth: 60 }}>对比主题</span>
            <Input
              style={{ width: 480 }}
              placeholder="例如：人格的形成机制、动机来源、个体差异"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </Space>

          <Space wrap style={{ marginTop: 4 }}>
            <span style={{ color: 'var(--text-soft)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Lightbulb size={14} /> 一键试试
            </span>
            {PRESETS.map((p, i) => (
              <Tag
                key={i}
                color="geekblue"
                style={{ cursor: 'pointer', borderRadius: 999 }}
                onClick={() => {
                  setSchools(p.schools);
                  setTopic(p.topic);
                }}
              >
                {p.schools.join(' vs ')} · {p.topic}
              </Tag>
            ))}
          </Space>

          <div>
            <Button type="primary" onClick={onCompare} loading={loading} disabled={schools.length < 2}>
              生成对比
            </Button>
          </div>
        </div>
      </div>

      {(loading || text) && (
        <div className="page-card" style={{ padding: 24 }}>
          {loading && !text && (
            <div className="dot-loader" style={{ marginBottom: 8 }}><span /><span /><span /></div>
          )}
          {text && <Markdown>{text}</Markdown>}
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <AnswerActions
              text={text}
              module="compare"
              sessionId={sidRef.current}
              loading={loading}
              onRetry={onCompare}
            />
          </div>
        </div>
      )}
    </div>
  );
}
