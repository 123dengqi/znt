import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, message, Tooltip } from 'antd';
import { Plus, Pencil, Trash2, Download, HeartHandshake } from 'lucide-react';
import { ideology } from '../../api';
import '../ideology.css';

interface Elem {
  id: number;
  name: string;
  category: string;
  description: string;
  suitable_chapters: string;
  example_cases: string;
  created_at: string;
}

const CATEGORIES = ['学科精神', '人文关怀', '价值认同', '公民意识', '职业伦理'];

export default function IdeologyElements() {
  const [rows, setRows] = useState<Elem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Elem | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try { setRows(await ideology.listElements()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const v = await form.validateFields();
    if (edit) {
      await ideology.updateElement(edit.id, v);
      message.success('已更新');
    } else {
      await ideology.createElement(v);
      message.success('已创建');
    }
    setOpen(false);
    setEdit(null);
    form.resetFields();
    load();
  };

  const remove = async (id: number) => {
    await ideology.deleteElement(id);
    message.success('已删除');
    load();
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="ideo-hero">
        <div className="ttl"><HeartHandshake size={22} color="#be185d" /> 思政元素库</div>
        <div className="sub">
          维护"科学精神、学术伦理、心理测量伦理、尊重个体差异、人文关怀、社会责任、文化自信、生命教育、心理健康意识、职业使命感"等课程思政元素，
          统一作为后续知识点映射、AI 教学设计与任务发布的基础。
        </div>
      </div>

      <div className="page-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="section-title">元素列表</div>
            <div className="section-sub">共 {rows.length} 条 · 支持新增 / 编辑 / 删除 / 导出</div>
          </div>
          <Space>
            <Button icon={<Download size={14} />} onClick={() => ideology.exportCsv('elements')}>导出 CSV</Button>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEdit(null); form.resetFields(); setOpen(true); }}>新增元素</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          size="middle"
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '元素名称', dataIndex: 'name', width: 160, render: (v) => <strong>{v}</strong> },
            {
              title: '类别', dataIndex: 'category', width: 110,
              render: (v) => v ? <span className={`ideo-chip cat-${v}`}>{v}</span> : '—',
            },
            { title: '内涵说明', dataIndex: 'description', ellipsis: true },
            {
              title: '适用章节', dataIndex: 'suitable_chapters', width: 200,
              render: (v: string) => v ? v.split(',').slice(0, 3).map((s, i) => <Tag key={i}>{s.trim()}</Tag>) : '—',
            },
            {
              title: '操作', key: 'op', width: 130,
              render: (_, r) => (
                <Space>
                  <Tooltip title="编辑">
                    <Button size="small" icon={<Pencil size={14} />} onClick={() => {
                      setEdit(r);
                      form.setFieldsValue(r);
                      setOpen(true);
                    }} />
                  </Tooltip>
                  <Popconfirm title="确认删除该元素？" onConfirm={() => remove(r.id)}>
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
        title={edit ? '编辑思政元素' : '新增思政元素'}
        onCancel={() => { setOpen(false); setEdit(null); form.resetFields(); }}
        onOk={submit}
        okText="保存"
        width={620}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="元素名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如 学术伦理、尊重个体差异" />
          </Form.Item>
          <Form.Item label="类别" name="category">
            <Input placeholder="如 学科精神 / 人文关怀 / 价值认同 / 公民意识 / 职业伦理" list="cat-list" />
          </Form.Item>
          <datalist id="cat-list">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          <Form.Item label="内涵说明" name="description">
            <Input.TextArea autoSize={{ minRows: 2 }} placeholder="一句话说明这一思政元素的核心内涵与教学语境" />
          </Form.Item>
          <Form.Item label="适用章节（逗号分隔）" name="suitable_chapters">
            <Input placeholder="如 人格测评, 人格适应与异常" />
          </Form.Item>
          <Form.Item label="典型案例" name="example_cases">
            <Input.TextArea autoSize={{ minRows: 2 }} placeholder="可填 1-2 个教学化案例片段，便于后续 AI 自动引用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
