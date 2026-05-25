import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Table, Tag, message } from 'antd';
import { Library, Plus, Trash2 } from 'lucide-react';
import { cases } from '../../api';

const { TextArea } = Input;

export default function Cases() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const refresh = () => cases.list().then(setList);

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async () => {
    const v = await form.validateFields();
    setLoading(true);
    try {
      await cases.create(v);
      message.success('已新增案例');
      setOpen(false);
      form.resetFields();
      refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(6,182,212,0.12)', color: '#0891b2',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Library size={16} />
          </span>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>案例库管理</div>
            <div className="section-sub" style={{ marginTop: 4 }}>学生在「案例分析」中可直接选用这些案例。</div>
          </div>
        </div>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
          新增案例
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={list}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 60 },
          { title: '标题', dataIndex: 'title' },
          {
            title: '标签',
            dataIndex: 'tags',
            render: (v) => (v ? v.split(',').map((t: string) => <Tag key={t}>{t.trim()}</Tag>) : '-'),
          },
          { title: '描述', dataIndex: 'description', ellipsis: true },
          {
            title: '操作',
            width: 80,
            render: (_, r) => (
              <Button
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={async () => {
                  await cases.remove(r.id);
                  message.success('已删除');
                  refresh();
                }}
              />
            ),
          },
        ]}
      />
      <Modal
        title="新增案例"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onCreate}
        confirmLoading={loading}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="例如：大学生 W 的同伴关系困扰" />
          </Form.Item>
          <Form.Item label="标签" name="tags">
            <Input placeholder="多个标签用英文逗号分隔，例如：人际,自我同一性" />
          </Form.Item>
          <Form.Item label="案例描述" name="description" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="案例情境（请脱敏）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
