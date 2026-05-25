import axios from 'axios';
import { message } from 'antd';
import { apiPath, API_BASE } from './env';

export const api = axios.create({
  baseURL: apiPath('/api'),
  timeout: 120000,
});

export { API_BASE, apiPath };

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const detail = err?.response?.data?.detail || err.message || '请求失败';
    const url: string = err?.config?.url || '';
    const isLoginCall = url.includes('/auth/login');

    if (status === 401 && !isLoginCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (location.pathname !== '/login') location.assign('/login');
    } else {
      const text = typeof detail === 'string' ? detail : '请求失败';
      message.error(status === 401 && isLoginCall ? '用户名或密码错误' : text);
    }
    return Promise.reject(err);
  },
);

export type Role = 'student' | 'teacher' | 'admin';

export interface UserInfo {
  username: string;
  role: Role;
  name: string;
}

export const auth = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const kb = {
  list: (params: any = {}) => api.get('/kb/documents', { params }).then((r) => r.data),
  stats: () => api.get('/kb/stats').then((r) => r.data),
  upload: (form: FormData) =>
    api.post('/kb/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  remove: (id: number) => api.delete(`/kb/documents/${id}`).then((r) => r.data),
  search: (body: any) => api.post('/kb/search', body).then((r) => r.data),
};

export const chat = {
  qa: (body: any) => api.post('/chat/qa', body).then((r) => r.data),
  compare: (body: any) => api.post('/chat/compare', body).then((r) => r.data),
  caseAnalyze: (body: any) => api.post('/chat/case', body).then((r) => r.data),
  role: (body: any) => api.post('/chat/role', body).then((r) => r.data),
};

export const quiz = {
  list: () => api.get('/quiz/list').then((r) => r.data),
  get: (id: number) => api.get(`/quiz/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/quiz/create', body).then((r) => r.data),
  remove: (id: number) => api.delete(`/quiz/${id}`).then((r) => r.data),
  submit: (body: any) => api.post('/quiz/submit', body).then((r) => r.data),
  generate: (body: any) => api.post('/quiz/generate', body).then((r) => r.data),
};

export const cases = {
  list: () => api.get('/cases').then((r) => r.data),
  create: (body: any) => api.post('/cases', body).then((r) => r.data),
  remove: (id: number) => api.delete(`/cases/${id}`).then((r) => r.data),
};

export const graph = {
  data: () => api.get('/graph').then((r) => r.data),
};

export const teacher = {
  stats: () => api.get('/teacher/stats').then((r) => r.data),
  logs: (params: any = {}) => api.get('/teacher/logs', { params }).then((r) => r.data),
  events: (params: any = {}) => api.get('/teacher/events', { params }).then((r) => r.data),
  exportUrl: (kind: string) => apiPath(`/api/teacher/export.csv?kind=${kind}`),
  exportCsv: async (kind: string) => {
    const r = await api.get('/teacher/export.csv', {
      params: { kind },
      responseType: 'blob',
    });
    const blob = new Blob([r.data as BlobPart], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `${kind}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  },
  discuss: (body: any) => api.post('/teacher/discuss', body).then((r) => r.data),
  feedback: (body: any) => api.post('/teacher/feedback', body).then((r) => r.data),
};

export const ideology = {
  // 元素
  listElements: () => api.get('/ideology/elements').then((r) => r.data),
  createElement: (body: any) => api.post('/ideology/elements', body).then((r) => r.data),
  updateElement: (id: number, body: any) => api.put(`/ideology/elements/${id}`, body).then((r) => r.data),
  deleteElement: (id: number) => api.delete(`/ideology/elements/${id}`).then((r) => r.data),
  // 映射
  listMappings: (params: any = {}) => api.get('/ideology/mappings', { params }).then((r) => r.data),
  createMapping: (body: any) => api.post('/ideology/mappings', body).then((r) => r.data),
  updateMapping: (id: number, body: any) => api.put(`/ideology/mappings/${id}`, body).then((r) => r.data),
  deleteMapping: (id: number) => api.delete(`/ideology/mappings/${id}`).then((r) => r.data),
  suggestMapping: (body: any) => api.post('/ideology/mappings/generate', body).then((r) => r.data),
  // 教学设计（SSE）
  lessonPlanUrl: () => apiPath('/api/ideology/lesson-plan/generate'),
  exportLessonPlanDocx: async (body: { chapter?: string; knowledge_point?: string; ideology_elements?: string[]; markdown: string }) => {
    const r = await api.post('/ideology/lesson-plan/export-docx', body, { responseType: 'blob' });
    const blob = new Blob([r.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `思政教学设计-${body.knowledge_point || 'lesson'}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  },
  // 任务
  listTasks: (params: any = {}) => api.get('/ideology/tasks', { params }).then((r) => r.data),
  getTask: (id: number) => api.get(`/ideology/tasks/${id}`).then((r) => r.data),
  createTask: (body: any) => api.post('/ideology/tasks', body).then((r) => r.data),
  // 反思
  listReflections: (params: any = {}) => api.get('/ideology/reflections', { params }).then((r) => r.data),
  submitReflection: (body: any) => api.post('/ideology/reflections', body).then((r) => r.data),
  commentReflection: (id: number, body: any) => api.put(`/ideology/reflections/${id}/comment`, body).then((r) => r.data),
  // 学生引导卡
  guidance: (chapter: string) => api.get('/ideology/student/guidance', { params: { chapter } }).then((r) => r.data),
  // 分析
  analytics: () => api.get('/ideology/analytics').then((r) => r.data),
  // 导出（CSV）
  exportCsv: async (kind: string) => {
    const r = await api.get('/ideology/export/csv', { params: { kind }, responseType: 'blob' });
    const blob = new Blob([r.data as BlobPart], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `ideology-${kind}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  },
};
