import { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Input, Modal, Row, Select, Space, Tag, message } from 'antd';
import { Copy, Download, FileText, Send, Sparkles, Square } from 'lucide-react';
import Markdown from '../../components/Markdown';
import { ideology } from '../../api';
import { apiPath } from '../../env';
import { useSSE } from '../../hooks/useSSE';
import '../ideology.css';

interface Elem { id: number; name: string; category: string; }
const CHAPTERS = ['人格特质理论', '人格动力理论', '人格发展', '人格测评', '人格适应与异常'];
const SCENARIOS = ['完整教学环节', '课前预习', '课中讨论', '课后反思'];
const TASK_TYPES = [
  { label: '课前思考题', value: 'pre_think' },
  { label: '课堂讨论题', value: 'in_class_discuss' },
  { label: '案例分析题', value: 'case_analysis' },
  { label: '角色模拟任务', value: 'role_play' },
  { label: '课后反思日志', value: 'post_reflection' },
  { label: '章节价值引导问题', value: 'value_guide' },
];

export default function IdeologyDesign() {
  const [elements, setElements] = useState<Elem[]>([]);
  const [form] = Form.useForm();
  const [text, setText] = useState('');
  const [meta, setMeta] = useState<any>(null);
  const sse = useSSE();

  // 发布弹窗
  const [pubOpen, setPubOpen] = useState(false);
  const [pubForm] = Form.useForm();

  useEffect(() => { ideology.listElements().then(setElements); }, []);

  const run = async () => {
    const v = await form.validateFields();
    setText('');
    setMeta(null);
    await sse.post(apiPath('/api/ideology/lesson-plan/generate'), v, {
      onEvent: (e) => {
        if (e.type === 'meta') setMeta(e);
        if (e.type === 'delta') setText((s) => s + (e.text || ''));
        if (e.type === 'error') message.error(e.text || '生成失败');
      },
    });
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(text);
    message.success('已复制完整教学设计');
  };

  const downloadMd = () => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meta?.knowledge_point || 'ideology-plan'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDocx = async () => {
    const v = form.getFieldsValue();
    try {
      await ideology.exportLessonPlanDocx({
        chapter: v.chapter,
        knowledge_point: v.knowledge_point,
        ideology_elements: v.ideology_elements || [],
        markdown: text,
      });
    } catch {
      message.error('Word 导出失败');
    }
  };

  const openPublish = () => {
    const v = form.getFieldsValue();
    pubForm.setFieldsValue({
      title: `【${v.chapter || '思政'}】${v.knowledge_point || '教学任务'}`,
      chapter: v.chapter,
      knowledge_point: v.knowledge_point,
      ideology_elements: (v.ideology_elements || []).join(','),
      task_type: 'post_reflection',
      task_content: text.slice(0, 4000),
    });
    setPubOpen(true);
  };

  const doPublish = async () => {
    const v = await pubForm.validateFields();
    await ideology.createTask({
      ...v,
      target_students: 'all',
      status: 'published',
      lesson_plan: { markdown: text, ...meta },
    });
    message.success('已发布给学生');
    setPubOpen(false);
  };

  const elemOptions = useMemo(() => elements.map((e) => ({ label: e.name, value: e.name })), [elements]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="ideo-hero">
        <div className="ttl"><Sparkles size={22} color="#be185d" /> AI 教学设计生成</div>
        <div className="sub">
          选择章节、知识点与思政元素，AI 会按"专业知识目标 / 思政育人目标 / 融入切入点 / 课前-课中-课后任务 /
          案例材料 / 评价指标 / 教师使用建议"九段式生成完整教学设计，语言保持学术、克制、避免空泛说教。
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={9}>
          <div className="page-card" style={{ padding: 20 }}>
            <div className="section-title">设计输入</div>
            <div className="section-sub" style={{ marginBottom: 12 }}>将作为提示词的一部分传给 LLM</div>
            <Form form={form} layout="vertical" initialValues={{ teaching_scenario: '完整教学环节' }}>
              <Form.Item label="章节" name="chapter" rules={[{ required: true }]}>
                <Select options={CHAPTERS.map((c) => ({ label: c, value: c }))} placeholder="选择章节" />
              </Form.Item>
              <Form.Item label="知识点" name="knowledge_point" rules={[{ required: true }]}>
                <Input placeholder="如 大五人格测验" />
              </Form.Item>
              <Form.Item label="思政元素" name="ideology_elements">
                <Select mode="multiple" options={elemOptions} placeholder="多选思政元素" />
              </Form.Item>
              <Form.Item label="教学场景" name="teaching_scenario">
                <Select options={SCENARIOS.map((c) => ({ label: c, value: c }))} />
              </Form.Item>
              <Space>
                {sse.running ? (
                  <Button danger icon={<Square size={14} />} onClick={() => sse.abort()}>停止生成</Button>
                ) : (
                  <Button type="primary" icon={<Sparkles size={14} />} onClick={run}>生成教学设计</Button>
                )}
              </Space>
            </Form>
          </div>
        </Col>
        <Col xs={24} lg={15}>
          <div className="ideo-plan">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="section-title">教学设计输出</div>
              <Space>
                <Button size="small" icon={<Copy size={14} />} disabled={!text} onClick={copyAll}>一键复制</Button>
                <Button size="small" icon={<Download size={14} />} disabled={!text} onClick={downloadMd}>导出 Markdown</Button>
                <Button size="small" icon={<FileText size={14} />} disabled={!text || sse.running} onClick={downloadDocx}>导出 Word</Button>
                <Button size="small" type="primary" icon={<Send size={14} />} disabled={!text || sse.running} onClick={openPublish}>发布为任务</Button>
              </Space>
            </div>
            {meta && (
              <div style={{ marginBottom: 10 }}>
                <Tag color="magenta">知识点：{meta.knowledge_point}</Tag>
                {(meta.ideology_elements || []).map((n: string) => <Tag key={n} color="purple">{n}</Tag>)}
              </div>
            )}
            {text ? <Markdown>{text}</Markdown> : (
              <div style={{ color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>
                {sse.running ? '正在向 LLM 请求…' : '在左侧填写输入并点击「生成教学设计」开始'}
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Modal
        open={pubOpen}
        title="发布为学生任务"
        onCancel={() => setPubOpen(false)}
        onOk={doPublish}
        okText="确认发布"
        width={720}
      >
        <Form form={pubForm} layout="vertical">
          <Form.Item label="任务标题" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}><Form.Item label="章节" name="chapter"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="知识点" name="knowledge_point"><Input /></Form.Item></Col>
            <Col span={8}>
              <Form.Item label="任务类型" name="task_type">
                <Select options={TASK_TYPES} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="思政元素（逗号分隔）" name="ideology_elements">
            <Input />
          </Form.Item>
          <Form.Item label="任务正文（学生看到的内容）" name="task_content" rules={[{ required: true }]}>
            <Input.TextArea autoSize={{ minRows: 6, maxRows: 16 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
