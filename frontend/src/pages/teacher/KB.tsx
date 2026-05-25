import { useEffect, useState } from 'react';
import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Table,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd';
import {
  Database,
  Inbox,
  Trash2,
  Sparkles,
  MessagesSquare,
  FileEdit,
  FileText,
  Layers,
} from 'lucide-react';
import type { UploadFile } from 'antd/es/upload/interface';
import Markdown from '../../components/Markdown';
import { kb, quiz, teacher } from '../../api';

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

export default function KB() {
  const [docs, setDocs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ documents: 0, chunks: 0 });
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [files, setFiles] = useState<UploadFile[]>([]);

  const refresh = () => {
    kb.list().then(setDocs);
    kb.stats().then(setStats);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onUpload = async () => {
    const v = await form.validateFields().catch(() => null);
    if (!v) return;
    if (!files.length || !files[0].originFileObj) {
      message.warning('请选择文件');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', v.title || '');
      fd.append('chapter', v.chapter || '');
      fd.append('school', v.school || '');
      fd.append('doc_type', v.doc_type || 'material');
      fd.append('file', files[0].originFileObj);
      await kb.upload(fd);
      message.success('上传并切片完成');
      form.resetFields();
      setFiles([]);
      refresh();
    } finally {
      setLoading(false);
    }
  };

  const chapters = new Set(docs.map((d) => d.chapter).filter(Boolean));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Row gutter={16}>
        <Col xs={12} lg={8}>
          <div className="stat-card">
            <div className="stat-icon"><FileText size={18} /></div>
            <div className="stat-label">文档数</div>
            <div className="stat-value">{stats.documents}</div>
          </div>
        </Col>
        <Col xs={12} lg={8}>
          <div className="stat-card tone-cyan">
            <div className="stat-icon"><Layers size={18} /></div>
            <div className="stat-label">切片数</div>
            <div className="stat-value">{stats.chunks}</div>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="stat-card tone-violet">
            <div className="stat-icon"><Database size={18} /></div>
            <div className="stat-label">覆盖章节</div>
            <div className="stat-value">{chapters.size}</div>
          </div>
        </Col>
      </Row>

      <div className="page-card" style={{ padding: 0 }}>
        <Tabs
          style={{ padding: '8px 16px 0' }}
          items={[
            {
              key: 'kb',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Database size={14} /> 知识库管理
                </span>
              ),
              children: (
                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
                  <div className="page-card" style={{ padding: 16, background: 'var(--surface-soft)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>上传课程材料</div>
                    <Form form={form} layout="vertical" initialValues={{ doc_type: 'material' }}>
                      <Form.Item label="标题" name="title">
                        <Input placeholder="可选，默认使用文件名" />
                      </Form.Item>
                      <Form.Item label="章节" name="chapter">
                        <Select allowClear options={CHAPTERS.map((c) => ({ value: c, label: c }))} />
                      </Form.Item>
                      <Form.Item label="流派" name="school">
                        <Select allowClear options={SCHOOLS.map((c) => ({ value: c, label: c }))} />
                      </Form.Item>
                      <Form.Item label="类型" name="doc_type">
                        <Select
                          options={[
                            { value: 'material', label: '教材/讲义' },
                            { value: 'syllabus', label: '大纲' },
                            { value: 'slides', label: '课件' },
                            { value: 'case', label: '案例' },
                          ]}
                        />
                      </Form.Item>
                      <Upload.Dragger
                        multiple={false}
                        beforeUpload={() => false}
                        fileList={files}
                        onChange={(info) => setFiles(info.fileList.slice(-1))}
                        accept=".txt,.md,.pdf,.docx"
                        style={{ padding: 8 }}
                      >
                        <p style={{ margin: 0, color: '#4f46e5' }}>
                          <Inbox size={20} />
                        </p>
                        <p className="muted" style={{ margin: '6px 0 0' }}>
                          支持 .txt / .md / .pdf / .docx
                        </p>
                      </Upload.Dragger>
                      <Button type="primary" block style={{ marginTop: 12 }} onClick={onUpload} loading={loading}>
                        上传并入库
                      </Button>
                    </Form>
                  </div>
                  <Table
                    rowKey="id"
                    size="middle"
                    dataSource={docs}
                    pagination={{ pageSize: 8 }}
                    columns={[
                      { title: 'ID', dataIndex: 'id', width: 60 },
                      { title: '标题', dataIndex: 'title' },
                      {
                        title: '章节',
                        dataIndex: 'chapter',
                        width: 140,
                        render: (v) => v ? <Tag>{v}</Tag> : '-',
                      },
                      {
                        title: '流派',
                        dataIndex: 'school',
                        width: 120,
                        render: (v) => v ? <Tag color="blue">{v}</Tag> : '-',
                      },
                      { title: '类型', dataIndex: 'doc_type', width: 100 },
                      {
                        title: '操作',
                        width: 80,
                        render: (_, r) => (
                          <Button
                            danger
                            size="small"
                            icon={<Trash2 size={14} />}
                            onClick={async () => {
                              await kb.remove(r.id);
                              message.success('已删除');
                              refresh();
                            }}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'tools',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} /> 教学辅助工具
                </span>
              ),
              children: <TeacherTools />,
            },
          ]}
        />
      </div>
    </div>
  );
}

function TeacherTools() {
  const [genQuizForm] = Form.useForm();
  const [discussForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [busy, setBusy] = useState<string>('');
  const [discussText, setDiscussText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [createdQuiz, setCreatedQuiz] = useState<any>(null);

  const onGenQuiz = async () => {
    const v = await genQuizForm.validateFields();
    setBusy('quiz');
    try {
      const r = await quiz.generate(v);
      setCreatedQuiz(r);
      message.success('已生成测验，学生可在「章节测验」中作答');
    } finally {
      setBusy('');
    }
  };

  const onDiscuss = async () => {
    const v = await discussForm.validateFields();
    setBusy('discuss');
    setDiscussText('');
    try {
      const r = await teacher.discuss(v);
      setDiscussText(r.text);
    } finally {
      setBusy('');
    }
  };

  const onFeedback = async () => {
    const v = await feedbackForm.validateFields();
    setBusy('fb');
    setFeedbackText('');
    try {
      const r = await teacher.feedback(v);
      setFeedbackText(r.text);
    } finally {
      setBusy('');
    }
  };

  return (
    <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      <div className="page-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sparkles size={16} color="#4f46e5" />
          <strong>测验题生成</strong>
        </div>
        <Form form={genQuizForm} layout="vertical" initialValues={{ n: 5 }}>
          <Form.Item label="章节" name="chapter">
            <Select allowClear options={CHAPTERS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item label="流派" name="school">
            <Select allowClear options={SCHOOLS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item label="主题" name="topic"><Input placeholder="可选：例如 大五人格" /></Form.Item>
          <Form.Item label="题目数量" name="n"><Input type="number" min={1} max={15} /></Form.Item>
          <Button type="primary" block onClick={onGenQuiz} loading={busy === 'quiz'}>生成并保存</Button>
        </Form>
        {createdQuiz && (
          <div style={{ marginTop: 12 }}>
            <Tag color="green">已生成 #{createdQuiz.id}</Tag>
            <span style={{ marginLeft: 8 }}>{createdQuiz.title}（共 {createdQuiz.questions.length} 题）</span>
          </div>
        )}
      </div>

      <div className="page-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MessagesSquare size={16} color="#0891b2" />
          <strong>讨论题生成</strong>
        </div>
        <Form form={discussForm} layout="vertical" initialValues={{ n: 3 }}>
          <Form.Item label="章节" name="chapter">
            <Select allowClear options={CHAPTERS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item label="主题" name="topic"><Input placeholder="例如 同伴关系与人格" /></Form.Item>
          <Form.Item label="题目数量" name="n"><Input type="number" min={1} max={6} /></Form.Item>
          <Button type="primary" block onClick={onDiscuss} loading={busy === 'discuss'}>生成讨论题</Button>
        </Form>
        {discussText && <div style={{ marginTop: 12 }}><Markdown>{discussText}</Markdown></div>}
      </div>

      <div className="page-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <FileEdit size={16} color="#059669" />
          <strong>作业结构化反馈</strong>
        </div>
        <Form form={feedbackForm} layout="vertical">
          <Form.Item label="学生作业文本" name="student_text" rules={[{ required: true }]}>
            <TextArea rows={5} placeholder="粘贴学生作业 / 反思日志" />
          </Form.Item>
          <Form.Item label="评分量规（可选）" name="rubric">
            <Input placeholder="例如：理论40% / 联系30% / 反思20% / 表达10%" />
          </Form.Item>
          <Button type="primary" block onClick={onFeedback} loading={busy === 'fb'}>生成反馈</Button>
        </Form>
        {feedbackText && <div style={{ marginTop: 12 }}><Markdown>{feedbackText}</Markdown></div>}
      </div>
    </div>
  );
}
