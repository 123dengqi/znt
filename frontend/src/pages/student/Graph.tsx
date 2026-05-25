import { useEffect, useMemo, useRef, useState } from 'react';
import { Drawer, Empty, Input, Select, Spin, Tag, Tooltip, message } from 'antd';
import { Network, Search as SearchIcon, Sparkles, Maximize2, Square } from 'lucide-react';
import Markdown from '../../components/Markdown';
import Chart from '../../components/Chart';
import { graph as graphApi, ideology as ideologyApi } from '../../api';
import { apiPath } from '../../env';
import { useSSE } from '../../hooks/useSSE';
import './graph.css';
import '../ideology.css';
import { HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GraphNode {
  id: string;
  name: string;
  category: number;
  brief: string;
}
interface GraphLink {
  source: string;
  target: string;
  rel: string;
}
interface GraphData {
  categories: { name: string }[];
  nodes: GraphNode[];
  links: GraphLink[];
}

const CAT_COLOR = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
const REL_LABEL: Record<string, string> = {
  belongs_to: '属于',
  proposed: '提出',
  opposed: '对立',
  applies_to: '应用于',
  measures: '测量',
  extends: '扩展自',
  related_to: '相关',
};

export default function Graph() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [neigh, setNeigh] = useState<any[]>([]);
  const [explain, setExplain] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filterCats, setFilterCats] = useState<number[]>([0, 1, 2, 3, 4]);
  const sse = useSSE();
  const [hoverHelp, setHoverHelp] = useState(true);
  const [nodeMappings, setNodeMappings] = useState<any[]>([]);
  const chartRef = useRef<any>(null);
  const nav = useNavigate();

  useEffect(() => {
    graphApi.data().then((d) => { setData(d); setLoading(false); }).catch((e) => {
      setLoading(false);
      message.error(e?.response?.data?.detail || '加载图谱失败');
    });
  }, []);

  // 高亮匹配节点
  const matched = useMemo(() => {
    if (!data) return new Set<string>();
    const k = keyword.trim().toLowerCase();
    if (!k) return new Set<string>();
    return new Set(data.nodes.filter((n) => n.name.toLowerCase().includes(k) || n.brief.toLowerCase().includes(k)).map((n) => n.id));
  }, [keyword, data]);

  const option = useMemo(() => {
    if (!data) return null;
    const visibleNodes = data.nodes.filter((n) => filterCats.includes(n.category));
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleLinks = data.links.filter((l) => visibleIds.has(l.source as any) && visibleIds.has(l.target as any));

    return {
      tooltip: {
        formatter: (p: any) => {
          if (p.dataType === 'edge') {
            const rel = REL_LABEL[p.data.rel] || p.data.rel;
            return `<div style="font-size:12px"><b>${rel}</b></div>`;
          }
          return `<div style="font-size:12px;max-width:240px">
            <b style="font-size:13px">${p.data.name}</b><br/>
            <span style="color:#94a3b8">${data.categories[p.data.category]?.name || ''}</span>
            <div style="margin-top:4px;line-height:1.6">${p.data.brief}</div>
          </div>`;
        },
      },
      legend: [
        {
          data: data.categories.map((c) => c.name),
          bottom: 0,
          icon: 'circle',
          textStyle: { color: '#475569', fontSize: 12 },
          selectedMode: 'multiple',
        },
      ],
      animationDurationUpdate: 600,
      animationEasingUpdate: 'cubicOut',
      series: [
        {
          name: 'persona-graph',
          type: 'graph',
          layout: 'force',
          roam: true,
          draggable: true,
          symbolSize: (val: any) => {
            const cat = val?.[2] ?? 0;
            return cat === 0 ? 46 : cat === 1 ? 36 : cat === 2 ? 28 : 26;
          },
          force: {
            repulsion: 220,
            edgeLength: [80, 160],
            gravity: 0.08,
            friction: 0.6,
          },
          label: {
            show: true,
            color: '#0f172a',
            fontSize: 12,
            position: 'right',
            formatter: '{b}',
          },
          emphasis: {
            focus: 'adjacency',
            scale: 1.15,
            label: { fontWeight: 600 },
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: 7,
          edgeLabel: {
            show: false,
            formatter: (p: any) => REL_LABEL[p.data.rel] || p.data.rel,
            fontSize: 10,
            color: '#94a3b8',
          },
          lineStyle: { color: '#cbd5e1', width: 1.2, opacity: 0.6, curveness: 0.12 },
          categories: data.categories.map((c, i) => ({
            name: c.name,
            itemStyle: { color: CAT_COLOR[i] },
          })),
          data: visibleNodes.map((n) => {
            const isMatched = matched.has(n.id);
            return {
              id: n.id,
              name: n.name,
              category: n.category,
              brief: n.brief,
              value: [0, 0, n.category],
              symbolSize: n.category === 0 ? 50 : n.category === 1 ? 38 : 30,
              itemStyle: {
                color: CAT_COLOR[n.category],
                borderColor: isMatched ? '#0f172a' : 'rgba(255,255,255,0.85)',
                borderWidth: isMatched ? 3 : 2,
                shadowBlur: isMatched ? 16 : 6,
                shadowColor: CAT_COLOR[n.category] + '55',
              },
              label: {
                fontWeight: isMatched ? 700 : 500,
                fontSize: n.category === 0 ? 13 : 12,
              },
            };
          }),
          links: visibleLinks.map((l) => ({
            source: l.source,
            target: l.target,
            rel: l.rel,
            lineStyle: {
              color: l.rel === 'opposed' ? '#fda4af' : l.rel === 'proposed' ? '#a5b4fc' : '#cbd5e1',
              width: l.rel === 'opposed' ? 1.6 : 1.2,
              type: l.rel === 'extends' ? 'dashed' : 'solid',
            },
          })),
        },
      ],
    } as any;
  }, [data, filterCats, matched]);

  const onChartReady = (inst: any) => {
    chartRef.current = inst;
    inst.on('click', (p: any) => {
      if (p.dataType !== 'node') return;
      const n = p.data as GraphNode;
      openNode(n);
    });
  };

  const openNode = async (n: GraphNode) => {
    setSelected(n);
    setExplain('');
    setNeigh([]);
    setNodeMappings([]);
    // 查询该节点对应的思政映射（按知识点名称匹配）
    ideologyApi.listMappings({}).then((rs: any[]) => {
      const hit = (rs || []).filter((r) => (r.knowledge_point || '').includes(n.name) || n.name.includes(r.knowledge_point || ''));
      setNodeMappings(hit.slice(0, 3));
    }).catch(() => setNodeMappings([]));
    await sse.post(apiPath('/api/graph/explain'), { node_id: n.id }, {
      onEvent: (evt) => {
        if (evt.type === 'meta') {
          setNeigh(evt.neighbors || []);
        } else if (evt.type === 'delta') {
          setExplain((s) => s + (evt.text || ''));
        } else if (evt.type === 'error') {
          message.error(evt.text || '生成失败');
        }
      },
      onError: (e) => message.error(e),
    });
  };

  const stop = () => sse.abort();

  const focusNode = (id: string) => {
    const node = data?.nodes.find((n) => n.id === id);
    if (!node) return;
    openNode(node);
  };

  if (loading) {
    return (
      <div className="page-card" style={{ padding: 60, textAlign: 'center' }}>
        <Spin tip="正在生成图谱..." />
      </div>
    );
  }

  if (!data || !data.nodes.length) {
    return <div className="page-card" style={{ padding: 40 }}><Empty /></div>;
  }

  return (
    <div className="graph-shell">
      {/* Hero */}
      <div className="graph-hero">
        <div className="graph-hero-inner">
          <span className="graph-badge"><Network size={14} /> Knowledge Graph · 知识图谱探险</span>
          <h2>把课程知识"连起来"</h2>
          <p>{data.nodes.length} 个节点 · {data.links.length} 条关系。点击任何节点，AI 会基于课程材料和邻居关系实时讲解。</p>
        </div>
        <div className="graph-orb a" />
        <div className="graph-orb b" />
      </div>

      {/* 工具条 */}
      <div className="page-card graph-toolbar">
        <Input
          allowClear
          prefix={<SearchIcon size={14} color="#94a3b8" />}
          placeholder="搜索概念 / 人物 / 流派..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Select
          mode="multiple"
          value={filterCats}
          onChange={setFilterCats}
          style={{ minWidth: 320, flex: 1 }}
          maxTagCount="responsive"
          options={data.categories.map((c, i) => ({
            value: i,
            label: <span><span className="cat-dot" style={{ background: CAT_COLOR[i] }} />{c.name}</span>,
          }))}
        />
        <div className="graph-stats">
          <Tag bordered={false} color="processing">{data.nodes.filter((n) => filterCats.includes(n.category)).length} 节点</Tag>
          <Tag bordered={false}>{matched.size ? `${matched.size} 命中` : '点击节点学习'}</Tag>
        </div>
      </div>

      {/* 图 */}
      <div className="page-card graph-canvas">
        {hoverHelp && (
          <div className="graph-help">
            <Sparkles size={12} /> 鼠标拖拽节点 · 滚轮缩放 · 点击节点查看 AI 讲解
            <span className="close" onClick={() => setHoverHelp(false)}>×</span>
          </div>
        )}
        {option && (
          <Chart
            height={620}
            option={option}
            onChartReady={onChartReady}
          />
        )}
      </div>

      {/* 抽屉 */}
      <Drawer
        title={null}
        open={!!selected}
        onClose={() => { stop(); setSelected(null); }}
        placement="right"
        width={520}
        closable={false}
      >
        {selected && (
          <div className="node-panel">
            <div className="node-panel-head">
              <span className="node-cat-pill" style={{ background: CAT_COLOR[selected.category] + '22', color: CAT_COLOR[selected.category] }}>
                {data.categories[selected.category]?.name}
              </span>
              <h2>{selected.name}</h2>
              <p className="muted">{selected.brief}</p>
            </div>

            {neigh.length > 0 && (
              <div className="node-panel-section">
                <div className="section-title" style={{ marginBottom: 8 }}>相邻节点 · 点击跳转学习</div>
                <div className="neigh-row">
                  {neigh.map((n) => (
                    <Tooltip key={n.id} title={n.brief}>
                      <button
                        className="neigh-chip"
                        onClick={() => focusNode(n.id)}
                        style={{ borderColor: CAT_COLOR[n.category] + '66', color: '#0f172a' }}
                      >
                        <span className="neigh-dot" style={{ background: CAT_COLOR[n.category] }} />
                        {n.name}
                        <span className="neigh-rel">{REL_LABEL[n.rel] || n.rel}</span>
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {nodeMappings.length > 0 && (
              <div className="node-panel-section">
                <div className="ideo-guidance" style={{ marginTop: 0 }}>
                  <div className="lbl"><HeartHandshake size={12} style={{ display: 'inline', marginRight: 4 }} />本节点思政引导</div>
                  {nodeMappings.map((m) => (
                    <div key={m.id} style={{ marginTop: 8, fontSize: 13, color: '#7c2d12', lineHeight: 1.7 }}>
                      <span className="ideo-chip" style={{ marginRight: 6 }}>{m.element_name}</span>
                      {m.integration_method}
                    </div>
                  ))}
                  <div style={{ marginTop: 10, textAlign: 'right' }}>
                    <a onClick={() => nav('/student/ideology')} style={{ fontSize: 12 }}>查看相关思政任务 →</a>
                  </div>
                </div>
              </div>
            )}

            <div className="node-panel-section">
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>AI 教学化讲解 {sse.running && <span className="cursor-blink" />}</span>
                {sse.running && (
                  <button className="action-btn" style={{ height: 26 }} onClick={stop}>
                    <Square size={12} /> 停止
                  </button>
                )}
              </div>
              <div className="explain-body">
                {explain ? (
                  <Markdown>{explain}</Markdown>
                ) : (
                  <div className="dot-loader" style={{ marginTop: 8 }}><span /><span /><span /></div>
                )}
              </div>
            </div>

            <div className="node-panel-foot">
              <span className="muted" style={{ fontSize: 12 }}>
                <Maximize2 size={12} style={{ verticalAlign: -1 }} /> 教学使用 · 不进行临床诊断
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
