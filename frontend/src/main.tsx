import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 10,
          colorBgLayout: '#f6f7f9',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Inter, 'Microsoft YaHei', sans-serif",
        },
        algorithm: antdTheme.defaultAlgorithm,
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
);
