import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

const palette = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

const baseTextStyle = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Inter, 'Microsoft YaHei', sans-serif",
  color: '#0f172a',
};

interface ChartProps {
  option: EChartsOption;
  height?: number | string;
  onChartReady?: (instance: any) => void;
  onEvents?: Record<string, (...args: any[]) => void>;
}

export default function Chart({ option, height = 280, onChartReady, onEvents }: ChartProps) {
  const merged: EChartsOption = {
    color: palette,
    textStyle: baseTextStyle,
    grid: { left: 36, right: 24, top: 28, bottom: 28, ...(option.grid as any) },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#e6e8ee',
      borderWidth: 1,
      textStyle: { color: '#0f172a' },
      extraCssText: 'box-shadow: 0 8px 24px rgba(15,23,42,0.08); border-radius: 8px;',
      ...(option.tooltip as any),
    },
    ...option,
  };
  return (
    <ReactECharts
      option={merged}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'svg' }}
      notMerge
      lazyUpdate
      onChartReady={onChartReady}
      onEvents={onEvents}
    />
  );
}
