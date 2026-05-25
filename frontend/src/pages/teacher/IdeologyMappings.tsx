import { useEffect, useMemo, useState } from 'react';
import {
  Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message, Tooltip, Empty,
} from 'antd';
import { Plus, Pencil, Trash2, Download, Sparkles, GitCompareArrows } from 'lucide-react';
import { ideology } from '../../api';
import '../ideology.css';

interface Mapping {
  id: number;
  chapter: string;
  knowledge_point: string;
  ideology_element_id: number;
  element_name: string;
  integration_method: string;
  teaching_scenario: string;
  prompt_template: string;
  evaluation_indicator: string;
  created_at: string;
}

interface Elem { id: number; name: string; category: string; }

const CHAPTERS = [
  '人格特质理论', '人格动力理论', '人格发展', '人格测评', '人格适应与异常',
];
const SCENARIOS = ['课前预习', '课中讨论', '课后反思'];

export default function IdeologyMappings() {
  const [rows, setRows] = useState<Mapping[]>([]);
  const [elements, setElements] = useState<Elem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Mapping | null>(null);
  const [form] = Form.useForm();

  const [fChapter, setFChapter] = useState<string | undefined>();
  const [fElement, setFElement] = useState<number | undefined>();

  // AI 推荐
  const [aiOpen, setAiOpen] = useState(false);
  const [aiForm] = Form.useForm();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fChapter) params.chapter = fChapter;
      if (fElement) params.ideology_element_id = fElement;
      setRows(await ideology.listMappings(params));
    } finally { setLoading(false); }
  };
  const loadElems = async () => setElements(await ideology.listElements());

  useEffect(() => { loadElems(); }, []);
  useEffect(() => { load(); }, [fChapter, fElement]);

  const elemMap = useMemo(() => {
    const m: Record<number, Elem> = {};
    elements.forEach((e) => (m[e.id] = e));
    return m;
  }, [elements]);

  const submit = async () => {
    const v = await form.validateFields();
    if (edit) await ideology.updateMapping(edit.id, v);
    else await ideology.createMapping(v);
    message.success('已保存');
    setOpen(false);
    setEdit(null);
    form.resetFields();
    load();
  };

  const remove = async (id: number) => {
    await ideology.deleteMapping(id);
    message.success('已删除');
    load();
  };

  const runAI = async () => {
    const v = await aiForm.validateFields();
    setAiLoading(true);
    setAiResult([]);
    try {
      const r = await ideology.suggestMapping(v);
      setAiResult(r.suggestions || []);
    } catch (e: any) {
      message.error('AI 推荐失败');
    } finally { setAiLoading(false); }
  };

  const acceptSuggestion = async (sg: any) => {
    if (!sg.ideology_element_id) {
      message.warning('该元素不在库中，请先到"思政元素库"创建');
      return;
    }
    const params = await aiForm.validateFields();
    await ideology.createMapping({
      chapter: params.chapter || '',
      knowledge_point: params.knowledge_point,
      ideology_element_id: sg.ideology_element_id,
      integration_method: sg.integration_method || '',
      teaching_scenario: '课中讨论',
      evaluation_indicator: sg.reason || '',
    });
    message.success(`已采纳：${sg.element_name}`);
    load();
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="ideo-hero">
        <div className="ttl"><GitCompareArrows size={22} color="#be185d" /> 知识点 — 思政元素映射</div>
        <div className="sub">
          把《人格心理学》中的具体知识点与思政元素建立对应关系，如"人格测评 — 心理测量伦理"。映射会作为
          学生端"本章思政引导"卡片的数据来源，也是 AI 教学设计的输入之一。
        </div>
      </div>

      <div className="page-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Select
              allowClear placeholder="按章节筛选" style={{ width: 200 }}
              value={fChapter} onChange={setFChapter}
              options={CHAPTERS.map((c) => ({ label: c, value: c }))}
            />
            <Select
              allowClear placeholder="按思政元素筛选" style={{ width: 220 }}
              value={fElement} onChange={setFElement}
              options={elements.map((e) => ({ label: e.name, value: e.id }))}
            />
          </Space>
          <Space>
            <Button icon={<Sparkles size={14} />} onClick={() => { aiForm.resetFields(); setAiResult([]); setAiOpen(true); }}>AI 自动推荐</Button>
            <Button icon={<Download size={14} />} onClick={() => ideology.exportCsv('mappings')}>导出 CSV</Button>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEdit(null); form.resetFields(); setOpen(true); }}>新增映射</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          size="middle"
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '章节', dataIndex: 'chapter', width: 130 },
            { title: '知识点', dataIndex: 'knowledge_point', width: 160, render: (v) => <strong>{v}</strong> },
            {
              title: '思政元素', dataIndex: 'element_name', width: 140,
              render: (_, r) => {
                const e = elemMap[r.ideology_element_id];
                return <span className={`ideo-chip${e?.category ? ' cat-' + e.category : ''}`}>{r.element_name || '—'}</span>;
              },
            },
            { title: '融入方式', dataIndex: 'integration_method', ellipsis: true },
            { title: '教学场景', dataIndex: 'teaching_scenario', width: 100,
              render: (v) => v ? <Tag color="blue">{v}</Tag> : '—' },
            { title: '评价指标', dataIndex: 'evaluation_indicator', ellipsis: true },
            {
              title: '操作', key: 'op', width: 110,
              render: (_, r) => (
                <Space>
                  <Tooltip title="编辑">
                    <Button size="small" icon={<Pencil size={14} />} onClick={() => {
                      setEdit(r);
                      form.setFieldsValue(r);
                      setOpen(true);
                    }} />
                  </Tooltip>
                  <Popconfirm title="确认删除？" onConfirm={() => remove(r.id)}>
                    <Button size="small" danger icon={<Trash2 size={14} />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={open}
        title={edit ? '编辑映射' : '新增映射'}
        onCancel={() => { setOpen(false); setEdit(null); form.resetFields(); }}
        onOk={submit}
        okText="保存"
        width={680}
      >
        <Form form={form} layout="vertical">
          <Space.Compact style={{ display: 'flex', gap: 12 }}>
            <Form.Item label="章节" name="chapter" style={{ flex: 1 }}>
              <Select allowClear options={CHAPTERS.map((c) => ({ label: c, value: c }))} placeholder="选择章节" />
            </Form.Item>
            <Form.Item label="教学场景" name="teaching_scenario" style={{ flex: 1 }}>
              <Select allowClear options={SCENARIOS.map((c) => ({ label: c, value: c }))} placeholder="课前 / 课中 / 课后" />
            </Form.Item>
          </Space.Compact>
          <Form.Item label="知识点" name="knowledge_point" rules={[{ required: true, message: '请输入知识点' }]}>
            <Input placeholder="如 大五人格(OCEAN)" />
          </Form.Item>
          <Form.Item label="思政元素" name="ideology_element_id" rules={[{ required: true, message: '请选择思政元素' }]}>
            <Select
              options={elements.map((e) => ({ label: `${e.name}${e.category ? '（' + e.category + '）' : ''}`, value: e.id }))}
              placeholder="选择思政元素"
              showSearch optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="融入方式" name="integration_method">
            <Input.TextArea autoSize={{ minRows: 2 }} placeholder="一句话描述如何把思政元素自然地融入该知识点的教学过程" />
          </Form.Item>
          <Form.Item label="评价指标" name="evaluation_indicator">
            <Input.TextArea autoSize={{ minRows: 2 }} placeholder="学生达成情况的可观察指标" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={aiOpen}
        onCancel={() => setAiOpen(false)}
        title="AI 自动推荐思政元素"
        onOk={runAI}
        confirmLoading={aiLoading}
        okText="开始推荐"
        width={680}
      >
        <Form form={aiForm} layout="vertical">
          <Form.Item label="章节" name="chapter">
            <Select allowClear options={CHAPTERS.map((c) => ({ label: c, value: c }))} placeholder="选择章节（可选）" />
          </Form.Item>
          <Form.Item label="知识点" name="knowledge_point" rules={[{ required: true, message: '请输入知识点' }]}>
            <Input placeholder="如 MMPI 测验结果的伦理使用" />
          </Form.Item>
        </Form>
        <div style={{ marginTop: 12 }}>
          <div className="section-sub" style={{ marginBottom: 8 }}>AI 推荐结果（紧密结合人格心理学专业概念）</div>
          {aiResult.length === 0 ? (
            <Empty description="点击「开始推荐」以生成 3 条建议" />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {aiResult.map((sg, i) => (
                <div key={i} className="ideo-card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="ideo-chip">{sg.element_name}</span>
                    <Button size="small" type="primary" onClick={() => acceptSuggestion(sg)}>采纳为映射</Button>
                  </div>
                  <div style={{ marginTop: 8, color: '#475569', fontSize: 13, lineHeight: 1.7 }}>
                    <div><strong>融入方式：</strong>{sg.integration_method}</div>
                    {sg.reason && <div style={{ color: '#94a3b8', marginTop: 4 }}><strong>建议理由：</strong>{sg.reason}</div>}
                    {!sg.ideology_element_id && <div style={{ color: '#dc2626', marginTop: 4 }}>该元素当前不在库中，请先到"思政元素库"中创建后再采纳。</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
