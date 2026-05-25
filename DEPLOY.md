# 公网访问部署指南（最简单：GitHub + Render + Vercel）

目标：得到一个 **`https://xxxx.vercel.app`** 链接，任何人用浏览器打开即可使用（无需安装）。

预计耗时：**30～60 分钟**（首次注册账号）。

---

## 第 0 步：准备 GitHub 仓库

1. 注册 [GitHub](https://github.com)
2. 在项目根目录执行（**不要上传 `.env` 和数据库**）：

```powershell
cd "你的项目路径\智能体"
git init
git add .
git commit -m "initial"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

3. 确认 `.gitignore` 已包含：
   - `backend/.env`
   - `backend/data/`
   - `node_modules/`
   - `frontend/dist/`

> **重要**：`DEEPSEEK_API_KEY` 只填在 Render 网页后台，不要写进 GitHub。

---

## 第 1 步：部署后端（Render，免费）

1. 打开 [https://render.com](https://render.com) 注册，用 GitHub 登录
2. **New +** → **Web Service** → 选择你的仓库
3. 填写：

| 项 | 值 |
|---|---|
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install --upgrade pip setuptools wheel && pip install -r requirements.txt` |
| Python Version | `3.11.9`（或在 Environment 加 `PYTHON_VERSION=3.11.9`） |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | Free |

4. **Environment** 里添加变量：

| Key | Value |
|---|---|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek Key |
| `JWT_SECRET` | 随便一长串随机字符 |
| `CORS_ORIGINS` | 先填 `http://localhost:5173`，第 2 步部署完前端后再改成 Vercel 地址 |

5. 点 **Create Web Service**，等部署成功
6. 记下公网地址，例如：`https://personality-psychology-api.onrender.com`  
   浏览器打开 `https://你的地址/api/health` 应看到 `{"status":"ok",...}`

> 免费版 **15 分钟不用会休眠**，别人第一次打开可能要等 **30～50 秒** 唤醒，属正常现象。

---

## 第 2 步：部署前端（Vercel，免费）

1. 打开 [https://vercel.com](https://vercel.com) 注册，用 GitHub 登录
2. **Add New Project** → 导入同一仓库
3. 填写：

| 项 | 值 |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. **Environment Variables** 添加：

| Key | Value |
|---|---|
| `VITE_API_BASE` | 第 1 步的后端地址，如 `https://personality-psychology-api.onrender.com`（**不要**末尾 `/`） |

5. Deploy，完成后得到链接，例如：`https://xxx.vercel.app`

6. 回到 **Render** → 后端服务 → Environment，把 `CORS_ORIGINS` 改成：

```
https://xxx.vercel.app
```

（多个域名用英文逗号分隔）保存后 Render 会自动重启。

---

## 第 3 步：把链接发给别人

- **公网入口**：`https://你的项目.vercel.app`
- 演示账号（种子数据，首次启动后端会自动创建）：
  - 教师：`teacher` / `teacher123`
  - 学生：`student` / `student123`

---

## 常见问题

**1. 页面能开，登录失败 / 接口 404**  
检查 Vercel 的 `VITE_API_BASE` 是否填对，且 Render 的 `CORS_ORIGINS` 是否包含 Vercel 域名。

**2. AI 功能没反应**  
检查 Render 里 `DEEPSEEK_API_KEY` 是否正确。

**3. 上传的知识库重启后没了**  
Render 免费盘不持久化 SQLite/上传文件；演示够用，长期用建议换云数据库或付费持久盘。

**4. 国内访问慢**  
Render/Vercel 服务器在国外；若主要给国内老师演示，可改用阿里云/腾讯云轻量服务器（见 README 或单独咨询）。

---

## 不想用 GitHub？

也可以只在 Render 上同时部署（稍复杂）。**最省事仍是：GitHub + Render 后端 + Vercel 前端**。
