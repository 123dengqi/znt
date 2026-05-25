/** 生产环境在 Vercel 配置 VITE_API_BASE=https://你的后端域名（不要末尾斜杠） */
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '';

export function apiPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
