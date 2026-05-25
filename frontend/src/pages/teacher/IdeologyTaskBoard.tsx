import { useEffect, useState } from 'react';
import { Button, Col, Drawer, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { ClipboardList, Download, MessageSquareText, Plus, Send } from 'lucide-react';
import { ideology } from '../../api';
import Markdown from '../../components/Markdown';
import '../ideology.css';

const CHAPTERS = ['人格特质理论', '人格动力理论', '人格发展', '人格测评', '人格适应与异常'];
const TASK_TYPES = [
  { label: '课前思考题', value: 'pre_think' },
  { label: '课堂讨论题', value: 'in_class_discuss' },
  { label: '案例分析题', value: 'case_analysis' },
  { label: '角色模拟任务', value: 'role_play' },
  { label: '课后反思日志', value: 'post_reflection' },
  { label: '章节价值引导问题', value: 'value_guide' },
];
const typeLabel = (v: string) => TASK_TYPES.find((t) => t.value === v)?.label || v;

export default function IdeologyTaskBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  // 任务详情 + 学生反思列表
  const [detail, setDetail] = useState<any | null>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [readingId, setReadingId] = useState<number | null>(null);
  const [commentForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const list = await ideology.listTasks({ status: '' });
      setTasks(list);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const v = await form.validateFields();
    await ideology.createTask({ ...v, target_students: 'all', status: 'published' });
    message.success('已发布任务');
    setOpen(false);
    form.resetFields();
    load();
  };

  const openDetail = async (t: any) => {
    setDetail(t);
    const list = await ideology.listReflections({ task_id: t.id });
    setReflections(list);
  };

  const saveComment = async () => {
    if (readingId == null) return;
    const v = await commentForm.validateFields();
    await ideology.commentReflection(readingId, v);
    message.success('已保存评语');
    setReadingId(null);
    if (detail) openDetail(detail);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="ideo-hero">
        <div className="ttl"><ClipboardList size={22} color="#be185d" /> 思政学习任务发布</div>
        <div className="sub">
          可将"课前思考、课中讨论、案例分析、角色模拟、课后反思、章节价值引导"等任务发布给学生，
          学生提交反思后将由 AI 给出教学性建议（不评价学生立场），教师可补充评语并打分。
        </div>
      </div>

      <div className="page-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="section-title">任务列表</div>
            <div className="section-sub">共 {tasks.length} 条 · 点击行查看学生反思与 AI 反馈</div>
          </div>
          <Space>
            <Button icon={<Download size={14} />} onClick={() => ideology.exportCsv('tasks')}>导出任务 CSV</Button>
            <Button icon={<Download size={14} />} onClick={() => ideology.exportCsv('reflections')}>导出反思 CSV</Button>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => { form.resetFields(); setOpen(true); }}>新建任务</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={tasks}
          size="middle"
          pagination={{ pageSize: 10 }}
          onRow={(r) => ({ onClick: () => openDetail(r), style: { cursor: 'pointer' } })}
          columns={[
            { title: '标题', dataIndex: 'title', width: 260, render: (v) => <strong>{v}</strong> },
            { title: '章节', dataIndex: 'chapter', width: 130 },
            { title: '知识点', dataIndex: 'knowledge_point', width: 160, ellipsis: true },
            {
              title: '类型', dataIndex: 'task_type', width: 110,
              render: (v) => <Tag color="magenta">{typeLabel(v)}</Tag>,
            },
            {
              title: '思政元素', dataIndex: 'ideology_elements', width: 200,
              render: (v: string) => (v || '').split(',').filter(Boolean).map((s) => <span key={s} className="ideo-chip" style={{ marginRight: 4 }}>{s.trim()}</span>),
            },
            { title: '提交数', dataIndex: 'submission_count', width: 80 },
            { title: '状态', dataIndex: 'status', width: 80, render: (v) => v === 'published' ? <Tag color="green">已发布</Tag> : <Tag>{v}</Tag> },
            { title: '发布时间', dataIndex: 'created_at', width: 150, render: (v) => dayjs(v).format('MM-DD HH:mm') },
          ]}
        />
      </div>

      <Modal
        open={open}
        title="新建思政学习任务"
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="发布"
        width={720}
      >
        <Form form={form} layout="vertical" initialValues={{ task_type: 'post_reflection' }}>
          <Form.Item label="任务标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="如 课后反思：MMPI 测验结果的伦理使用" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="章节" name="chapter">
                <Select allowClear options={CHAPTERS.map((c) => ({ label: c, value: c }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="知识点" name="knowledge_point"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="任务类型" name="task_type">
                <Select options={TASK_TYPES} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="思政元素（逗号分隔）" name="ideology_elements">
            <Input placeholder="如 心理测量伦理, 学术伦理" />
          </Form.Item>
          <Form.Item label="任务正文 / 案例材料" name="task_content" rules={[{ required: true }]}>
            <Input.TextArea autoSize={{ minRows: 5, maxRows: 14 }} placeholder="学生在 App 内看到的题干或案例" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detail?.title}
        open={!!detail}
        onClose={() => setDetail(null)}
        width={760}
      >
        {detail && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="page-card" style={{ padding: 16 }}>
              <Space wrap>
                <Tag color="blue">{detail.chapter || '未分章节'}</Tag>
                {detail.knowledge_point && <Tag>{detail.knowledge_point}</Tag>}
                <Tag color="magenta">{typeLabel(detail.task_type)}</Tag>
                {(detail.ideology_elements || '').split(',').filter(Boolean).map((s: string) => (
                  <span key={s} className="ideo-chip">{s.trim()}</span>
                ))}
              </Space>
              <div style={{ marginTop: 12, whiteSpace: 'pre-wrap', color: '#475569', lineHeight: 1.8 }}>
                {detail.task_content}
              </div>
            </div>

            <div>
              <div className="section-title" style={{ marginBottom: 8 }}>
                <MessageSquareText size={16} style={{ display: 'inline', marginRight: 6, marginBottom: 3 }} />
                学生反思（{reflections.length}）
              </div>
              {reflections.length === 0 ? (
                <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>暂无学生提交</div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {reflections.map((r) => (
                    <div key={r.id} className="ideo-card" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{r.student_name || '#' + r.student_id}</strong>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{dayjs(r.submitted_at).format('MM-DD HH:mm')}</span>
                      </div>
                      <div style={{ marginTop: 8, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{r.response_text}</div>
                      {r.ai_feedback && (
                        <div className="ideo-feedback" style={{ marginTop: 10 }}>
                          <h4>AI 教学性反馈</h4>
                          <div style={{ marginTop: 6 }}>
                            <Markdown>{r.ai_feedback}</Markdown>
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>
                          {r.teacher_comment ? <>教师评语：<span style={{ color: '#0f766e' }}>{r.teacher_comment}</span>（{r.score} 分）</> : '尚未点评'}
                        </div>
                        <Button size="small" icon={<Send size={14} />} onClick={() => {
                          setReadingId(r.id);
                          commentForm.setFieldsValue({ teacher_comment: r.teacher_comment, score: r.score });
                        }}>写评语</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={readingId != null}
        onCancel={() => setReadingId(null)}
        onOk={saveComment}
        title="教师评语"
        okText="保存"
        width={520}
      >
        <Form form={commentForm} layout="vertical">
          <Form.Item label="评语（教学性建议，避免价值判断标签）" name="teacher_comment">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
          <Form.Item label="得分（0-100）" name="score" initialValue={85}>
            <InputNumber min={0} max={100} style={{ width: 160 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
