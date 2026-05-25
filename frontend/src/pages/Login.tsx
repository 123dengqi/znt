import { useState } from 'react';
import { Alert, Button, Form, Input, Typography, message } from 'antd';
import { ShieldCheck, Sparkles, BookOpen, Users, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { useAuth } from '../store';
import './login.css';

const { Title, Text } = Typography;

const HIGHLIGHTS = [
  { icon: <Sparkles size={16} />, title: '学科导师/学伴', desc: '基于知识库的问答、对比、复盘' },
  { icon: <Users size={16} />, title: '模拟仿真角色', desc: '弗洛伊德、罗杰斯等教学化身对话' },
  { icon: <BookOpen size={16} />, title: '教学辅助工具', desc: '测验/讨论题生成、作业结构化反馈' },
  { icon: <ShieldCheck size={16} />, title: '合规边界', desc: '不诊断、不开方、不贴标签' },
];

export default function Login() {
  const nav = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const onFinish = async (v: { username: string; password: string }) => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const data = await auth.login(v.username, v.password);
      setAuth(data.access_token, { username: data.username, role: data.role, name: data.name });
      message.success('登录成功');
      nav(data.role === 'teacher' || data.role === 'admin' ? '/teacher/kb' : '/student/dashboard');
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      const text =
        status === 401
          ? '用户名或密码错误，请重试'
          : typeof detail === 'string'
            ? detail
            : status
              ? `登录失败（${status}）`
              : '网络异常，请稍后再试';
      setErrorMsg(text);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-bg">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <div className="grid-mask" />
      </div>

      <div className="login-grid">
        <div className="login-left">
          <div className="brand brand-on-dark">
            <span className="brand-mark" />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span>人格心理学</span>
              <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>
                教育智能体平台
              </span>
            </div>
          </div>

          <div style={{ maxWidth: 540 }}>
            <Title className="hero-title" level={1}>
              让<span className="hl">课程</span>真正“跑起来”的<br />
              智能助教
            </Title>
            <Text className="hero-sub">
              围绕《人格心理学》课前-课中-课后任务，提供基于课程材料的问答、理论对比、案例分析、角色模拟与章节测验；让概念学得明白、案例分析得透彻、过程评估得见证。
            </Text>

            <div className="hl-grid">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="hl-card">
                  <span className="hl-ic">{h.icon}</span>
                  <div>
                    <div className="hl-ttl">{h.title}</div>
                    <div className="hl-desc">{h.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="login-foot">
            <span className="dot" /> 演示版 · 仅用于教学辅助 · 不进行临床诊断或药物建议
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-card-head">
              <Lock size={16} />
              <span>欢迎登录</span>
            </div>
            <Title level={3} style={{ margin: '6px 0 4px', letterSpacing: '-0.02em' }}>
              开始你的课程旅程
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 18, fontSize: 13 }}>
              演示账号：<code>teacher / teacher123</code> · <code>student / student123</code>
            </Text>
            <Form
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={() => errorMsg && setErrorMsg('')}
              initialValues={{ username: 'student', password: 'student123' }}
              requiredMark={false}
            >
              <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input size="large" placeholder="请输入用户名" autoComplete="username" />
              </Form.Item>
              <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password size="large" placeholder="请输入密码" autoComplete="current-password" />
              </Form.Item>
              {errorMsg && (
                <Alert
                  type="error"
                  showIcon
                  message={errorMsg}
                  style={{ marginBottom: 12, borderRadius: 10 }}
                />
              )}
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                className="login-btn"
                loading={submitting}
              >
                进入系统 <ArrowRight size={16} style={{ marginLeft: 6, verticalAlign: -2 }} />
              </Button>
            </Form>
            <div className="login-tip">
              提示：登录后可使用 <kbd>Ctrl</kbd> + <kbd>K</kbd> 唤起命令面板。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
