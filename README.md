# 人格心理学教育智能体（演示版 v0.1）

围绕《人格心理学》课程教学的教育智能体应用，**前后端分离**：

- **后端**：FastAPI + SQLite + BM25（关键词 RAG） + DeepSeek（OpenAI 兼容）
- **前端**：React 18 + Vite + TypeScript + Ant Design 5

> 教学辅助工具 · **不进行临床诊断、不给治疗建议、不贴标签**。所有输出仅服务于课程教学目标。

---

## 目录结构

```
智能体/
├─ backend/                 # FastAPI 后端
│  ├─ app/                  # 业务代码
│  │  ├─ main.py            # 入口（CORS、建表、种子账号、注册路由）
│  │  ├─ config.py          # 配置（读取 .env）
│  │  ├─ db.py              # SQLAlchemy 引擎与会话
│  │  ├─ models.py          # 用户/文档/切片/案例/测验/事件/日志
│  │  ├─ schemas.py         # Pydantic 模型
│  │  ├─ security.py        # JWT 鉴权 / 角色保护
│  │  ├─ llm.py             # DeepSeek 客户端 + 全局安全 system prompt
│  │  ├─ safety.py          # 输入级合规过滤（诊断/危机词）
│  │  ├─ retrieval.py       # 中文分词 + BM25 检索
│  │  ├─ ingest.py          # 文档解析（txt/md/pdf/docx）+ 切片入库
│  │  └─ routers/
│  │     ├─ auth.py         # 登录、个人信息
│  │     ├─ kb.py           # 知识库：上传/列表/检索/统计
│  │     ├─ chat.py         # 学生四大对话能力（QA/对比/案例/角色）
│  │     ├─ quiz.py         # 测验（含 AI 生成测验题）
│  │     ├─ cases.py        # 教师案例库 CRUD
│  │     └─ teacher.py      # 学情统计/日志/事件/CSV 导出/讨论题/作业反馈
│  ├─ requirements.txt
│  ├─ .env.example          # 环境变量模板（含 DeepSeek 配置）
│  ├─ run.py                # 本地启动入口
│  ├─ seed_kb.py            # 写入种子知识（无上传也能演示）
│  ├─ seed_quizzes.py       # 写入预置 5 套 30 题章节测验
│  ├─ seed_cases.py         # 写入预置教学案例
│  └─ seed_ideology.py      # 写入预置思政元素 / 映射 / 示例任务
├─ frontend/                # React + Vite 前端
│  └─ src/
│     ├─ api.ts             # axios 封装与各模块 API
│     ├─ store.ts           # zustand 鉴权状态
│     ├─ App.tsx            # 路由表
│     ├─ components/
│     │  ├─ AppLayout.tsx   # 学生/教师两端共用布局（含菜单切换）
│     │  └─ Markdown.tsx
│     └─ pages/
│        ├─ Login.tsx
│        ├─ student/{QA,Compare,Case,Role,Quiz}.tsx     # 学生 5 功能
│        └─ teacher/{KB,Cases,Stats,Logs}.tsx           # 教师 4 功能（KB 内含 AI 教学工具）
├─ docs/
│  ├─ 功能分析.md
│  └─ 前端界面生成提示词.md
├─ start_backend.bat
├─ start_frontend.bat
├─ .gitignore
└─ README.md
```

---

## 启动方式

> 演示账号已自动创建：
> - 教师：`teacher` / `teacher123`
> - 学生：`student` / `student123`

### 1) 启动后端

```powershell
cd backend
copy .env.example .env             # 仅首次：生成 .env（已含 DeepSeek 配置）
pip install -r requirements.txt
python seed_kb.py                  # 仅首次：写入种子知识，便于无上传也能演示
python -m uvicorn app.main:app --reload --port 8000
```

默认监听 `http://127.0.0.1:8000`，OpenAPI 文档：`/docs`

### 2) 启动前端

```powershell
cd frontend
npm install                        # 仅首次
npm run dev
```

访问 `http://127.0.0.1:5173`，前端已配置 `/api` 反代到后端。

---

## 配置（`backend/.env`）

```env
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-chat

JWT_SECRET=please-change-me
JWT_EXPIRE_MINUTES=720

DATABASE_URL=sqlite:///./data/app.db
UPLOAD_DIR=./data/uploads
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> **安全提示**：`backend/.env` 已加入 `.gitignore`。生产部署请轮换密钥并使用环境变量注入。

---

## 学生端（5 功能 + 创新「人格实验室」）

1. **课程问答**：基于知识库（章节/流派可过滤）的 RAG 问答；输出附引用片段；**支持流式输出**。
2. **理论对比**：选择两个或多个流派 + 主题，输出维度化对比表（核心观点/动力/发展/测评/边界/局限）。
3. **案例分析**：可选教师案例或自填，按视角（精分/人本/特质/社会学习/认知/综合）输出**结构化分析框架**（不下诊断）。
4. **角色模拟**：弗洛伊德、罗杰斯、班杜拉、特质学者、来访者-成长困惑等教学化身；多轮对话；**支持中文语音输入**（基于浏览器 Web Speech API，Chrome/Edge）。
5. **章节测验**：教师维护题库 + 学生作答 + 自动评分 + 错题解析。**首启动自动写入 5 套高质量预置题库（30 题，覆盖动力/人本/特质/社会学习/测评）**。

### ✨ 创新功能：人格实验室（Persona Lab）

把同一个真实情境同时投给多个流派，AI **并行流式**输出每个流派的解释，并基于五个维度（人格结构 / 动力机制 / 发展观 / 情境敏感度 / 教学可操作性）打分，最终用**雷达图**直观比较。
- 后端：`/api/lab/persona/stream`（SSE，多 generator 公平合并 + 评分）
- 前端：场景输入 + 流派多选 + 多卡片同时流式 + 渐变 hero + 麦克风波形动效 + ECharts 雷达对比

### 新增模块：课程思政融入设计中心

实现"专业知识点 — 思政元素 — 教学任务 — 学生反思 — 效果分析"完整闭环。

- **教师端 5 个子页**：思政元素库、知识点—思政元素映射（含 AI 自动推荐）、AI 教学设计生成（SSE 流式九段式）、思政任务发布（任务详情抽屉含每位学生反思 + AI 反馈 + 教师评语/打分）、思政效果分析（章节完成率、提交趋势、元素关注度、关键词词云、反思质量趋势）。
- **学生端**：「课程思政任务」入口（卡片化任务列表 + 待完成/已完成筛选）+ 反思提交页（提交后立即获取 AI 教学性反馈，4 维雷达图 + 教师评语区）。
- **联动入口**：课程问答页选定章节自动出现"本章思政引导"卡片；知识图谱节点抽屉内显示"本节点思政引导 + 相关思政任务跳转"。
- **AI 反馈约束**：仅从 `专业关联度 / 表达完整性 / 伦理意识 / 反思深度` 四个**教学**维度给建议；严禁评价学生思想立场、严禁贴标签、严禁心理诊断。
- **数据库新增 4 张表**：`ideology_elements` / `knowledge_ideology_mappings` / `ideology_tasks` / `ideology_reflections` + 行为埋点 `ideology_analytics_events`。
- **CSV 导出**：`/api/ideology/export/csv?kind=reflections|tasks|mappings|elements|events`，UTF-8 + BOM，Excel 直接打开。

首启动自动写入 **12 条思政元素 + 6 条经典映射 + 1 条示例任务**（见 `backend/seed_ideology.py`）。

## 教师端（4 + 5 个子模块）

1. **知识库管理**：上传 `.txt/.md/.pdf/.docx`；按章节/流派打标；自动切片入库。内含 **AI 教学工具**子页：
   - 测验题生成（按章节/流派/题量自动生成并入库）
   - 讨论题生成（题干/思考路径/时长/理论关联）
   - 作业结构化反馈（按可配置量规生成）
2. **案例库管理**：CRUD；学生在「案例分析」中可直接选用。
3. **学情统计**：用户、活跃、模块使用次数、近 7 天事件趋势、测验均分；**导出 CSV**（事件 / 日志 / 测验记录）。
4. **日志查看**：按模块/关键字筛选，含安全标记（ok / warned / blocked）。

---

## 形成性评价数据（首期字段）

| 类别 | 字段 |
|------|------|
| 身份 | `user_id`、`role` |
| 行为 | `module`（qa/compare/case/role/quiz/kb/login）、`session_id`、`duration_ms` |
| 内容 | `intent`、提问/案例摘要、命中文档片段 ID 列表 |
| 结果 | 测验得分、错题、作业反馈版本 |
| 对话 | `chat_logs`：用户与助教消息，`safety_flag` |

教师端可一键导出 CSV，便于后续 NLP 编码、能力画像、实验班对比研究。

---

## 合规边界（已在系统级强制）

- 系统提示中明确：不诊断、不开方、不贴标签；危机迹象→引导专业资源。
- 输入级过滤：`safety.py` 拦截「请帮我诊断/我是不是XX症」等模式（warned）与自伤/伤人危机词（blocked），并写入 `chat_logs.safety_flag` 供教师审计。
- 教师端日志面板可检索 blocked / warned 内容。

---

## 后续可扩展

- 接入更多模型（豆包/智谱）：在 `app/llm.py` 增加 client，配置项切换即可。
- 升级到向量检索：把 `retrieval.py` 替换为 `pgvector` 或 `bge-m3` + Faiss。
- 增加 SSO / 班级与课程班维度。
- 内置 NLP 自动编码 pipeline 与能力画像可视化。
- Docker Compose 一键部署。

---

## 已通过的端到端验证

```
[ok] login
[ok] kb.stats {'documents': 6, 'chunks': 6}
[ok] kb.search hits= 2
[ok] chat.qa flag= ok
[ok] safety guard works flag= warned
[ok] quiz.generate
[ok] quiz.submit score= 100.0/100
[ok] teacher.stats
[ok] teacher.export
ALL SMOKE TESTS PASSED.
```
