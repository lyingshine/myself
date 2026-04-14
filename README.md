# MySelf

MySelf 是一个全栈个人内容与社交平台，包含文章、动态、互动、私信、通知、每日安排和管理员压测面板。

技术栈：
- 前端：Vue 3 + Vite + Pinia + Vue Router
- 后端：Node.js + Express + MySQL
- 可选能力：Redis 缓存、SSE 实时通知、Web Push 推送、飞书提醒、模拟器压测

## 功能概览

- 内容：文章发布/编辑/删除，动态发布/删除
- 社交：点赞/点踩、评论、转发、举报、关注/取关、私信
- 消息：通知列表、未读计数、SSE 实时流、浏览器系统通知、Web Push
- 个人：头像上传、个人资料、每日安排（本地 + 数据库同步）
- 管理：系统指标、日志 tail、举报处理、模拟器启动与种子数据管理

## 项目结构

```text
.
├─ src/                     # 前端源码
│  ├─ api/                  # API 封装（含 token 刷新重试）
│  ├─ stores/               # Pinia 状态（auth / notifications）
│  ├─ views/                # 页面（Home/Moments/Discovery/...）
│  └─ router/               # 前端路由与守卫
├─ public/                  # PWA 资源与 service worker
├─ server/                  # 后端服务
│  ├─ routes/               # API 路由
│  ├─ data/                 # 数据访问层
│  ├─ db/                   # 连接池与 schema 初始化
│  ├─ utils/                # 推送/推荐/模拟器/遥测等
│  └─ uploads/              # 上传文件（头像）
└─ vite.config.js           # 前端 dev 代理配置
```

## 快速开始

### 1) 安装依赖

在项目根目录：

```bash
npm install
```

安装后端依赖：

```bash
cd server
npm install
cd ..
```

### 2) 准备数据库

默认数据库连接：
- host: `127.0.0.1`
- port: `3306`
- user: `root`
- db: `blog_db`

启动后端时会自动执行 schema 初始化（`server/db/initSchema.js`）。

### 3) 启动后端

单进程（推荐本地开发）：

```bash
cd server
npm run dev
```

或集群模式：

```bash
cd server
npm start
```

默认端口：`3000`

### 4) 启动前端

根目录执行：

```bash
npm run dev
```

默认前端端口：Vite 默认端口（通常 `5173`）

开发时前端会把 `/api`、`/uploads` 代理到 `http://127.0.0.1:3000`（可由 `VITE_DEV_BACKEND` 覆盖）。

### 5) 构建

```bash
npm run build
```

## 环境变量

### 前端（Vite）

- `VITE_API_BASE_URL`：前端请求 API 的基地址（默认 `/api`）
- `VITE_DEV_BACKEND`：开发代理目标（默认 `http://127.0.0.1:3000`）

### 后端核心

- `PORT`：服务端口（默认 `3000`）
- `NODE_ENV`：`development` / `production`
- `SESSION_SECRET`：session 密钥
- `CORS_ORIGINS`：生产环境允许跨域来源，逗号分隔
- `CORS_ALLOW_ALL`：生产环境是否允许任意来源（`true/false`）

### JWT

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`（默认 `12h`）
- `JWT_REFRESH_EXPIRES_IN`（默认 `30d`）

### MySQL

- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
- 兼容：`MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE`
- 连接池：`DB_READ_POOL_LIMIT` / `DB_WRITE_POOL_LIMIT`

### Redis（可选）

- `REDIS_HOST` / `REDIS_PORT` / `REDIS_USERNAME` / `REDIS_PASSWORD` / `REDIS_PASS`

### Web Push（可选）

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

### 飞书提醒（可选）

- `FEISHU_BOT_WEBHOOK`

### 模拟器（可选）

- `LOAD_PRESET`（`low`/`medium`/`high`/`extreme`）
- `CLUSTER_WORKERS`
- `SIM_LOGIN_WORKERS` / `SIM_REG_WORKERS`
- `SIM_CONTENT_TARGET` / `SIM_SEED_BATCH_SIZE`
- `SIM_RUNTIME_ALLOW_WRITES`

## 主要路由

- 认证：`/api/auth/*`
- 用户：`/api/users/*`
- 文章：`/api/articles/*`
- 动态：`/api/statuses/*`
- 社交：`/api/social/*`
- 通知：`/api/notifications/*`
- 管理：`/api/admin/*`

## 开发说明

- 前端管理员页面仅允许 `admin` 角色访问（前端守卫 + 后端中间件双重限制）。
- 社交点赞统一使用 `/api/social/reactions`。
- PWA service worker 位于 `public/sw.js`，生产与 localhost 下会自动注册。

## 常见问题

1. 前端请求 401：
- 检查 `token/refreshToken` 是否存在且未过期
- 确认后端 `JWT_SECRET/JWT_REFRESH_SECRET` 一致

2. 无法连接数据库：
- 检查 MySQL 是否启动
- 校验 `DB_*` 环境变量与账号权限

3. 推送不可用：
- 确认已配置 VAPID 三项变量
- 浏览器需允许通知权限

4. 管理端模拟器无法启动：
- 先在管理页生成模拟用户与内容种子数据

## 脚本

根目录：
- `npm run dev`：启动前端开发服务器
- `npm run build`：构建前端
- `npm run preview`：预览前端构建产物

`server/` 目录：
- `npm run dev`：后端热更新开发模式
- `npm run start`：后端集群模式
- `npm run start:single`：后端单进程启动
- `npm run db:reset-users`：重置用户数据脚本
