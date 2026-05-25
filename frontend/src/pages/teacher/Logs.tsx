import { useEffect, useState } from 'react';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import { Search, ScrollText } from 'lucide-react';
import { teacher } from '../../api';

const MODULES = [
  { value: 'qa', label: '课程问答' },
  { value: 'compare', label: '理论对比' },
  { value: 'case', label: '案例分析' },
  { value: 'role', label: '角色模拟' },
  { value: 'quiz', label: '章节测验' },
];

export default function Logs() {
  const [data, setData] = useState<any[]>([]);
  const [module, setModule] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await teacher.logs({ module, keyword: keyword || undefined, limit: 200 });
      setData(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="page-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(245,158,11,0.12)', color: '#d97706',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ScrollText size={16} />
        </span>
        <div className="section-title" style={{ marginBottom: 0 }}>日志查看 · 安全审计</div>
      </div>
      <div className="section-sub" style={{ marginLeft: 42 }}>用于教学督导、内容安全复核与合规追踪。</div>

      <Space style={{ marginTop: 12, marginBottom: 12 }} wrap>
        <Select
          allowClear
          placeholder="按模块"
          style={{ width: 160 }}
          value={module}
          onChange={setModule}
          options={MODULES}
        />
        <Input
          placeholder="按内容关键字"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 220 }}
          onPressEnter={refresh}
        />
        <Button type="primary" icon={<Search size={14} />} onClick={refresh} loading={loading}>
          查询
        </Button>
      </Space>

      <Table
        rowKey="id"
        size="small"
        dataSource={data}
        pagination={{ pageSize: 12 }}
        columns={[
          { title: '时间', dataIndex: 'created_at', width: 180 },
          { title: '用户', dataIndex: 'username', width: 120 },
          {
            title: '模块',
            dataIndex: 'module',
            width: 110,
            render: (v) => <Tag>{MODULES.find((m) => m.value === v)?.label || v}</Tag>,
          },
          {
            title: '角色',
            dataIndex: 'role',
            width: 90,
            render: (v) => <Tag color={v === 'user' ? 'geekblue' : 'blue'}>{v}</Tag>,
          },
          {
            title: '安全标记',
            dataIndex: 'safety_flag',
            width: 110,
            render: (v) =>
              v === 'blocked' ? <Tag color="red">blocked</Tag> :
              v === 'warned' ? <Tag color="orange">warned</Tag> :
              <Tag color="green">ok</Tag>,
          },
          { title: '内容', dataIndex: 'content', ellipsis: true },
        ]}
      />
    </div>
  );
}
