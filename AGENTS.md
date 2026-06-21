## 项目概述

**script-workshop** - AI 脚本生成工作流应用。基于 Next.js 构建，通过多步骤引导用户生成内容策略和脚本。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16.2.6 |
| 语言 | TypeScript 5.7.3 |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| 状态管理 | Zustand 5 |
| AI 集成 | AI SDK + OpenAI SDK |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| 包管理器 | pnpm |
| 运行时 | Node.js 24 |

## 目录结构

```
/workspace/projects/
├── .coze                    # Coze 项目配置（预览 + 部署）
├── .cozeproj/scripts/        # 部署脚本
│   ├── deploy_build.sh
│   └── deploy_run.sh
├── scripts/                  # 预览脚本
│   ├── coze-preview-build.sh
│   └── coze-preview-run.sh
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── auth/            # 认证 API
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   └── register/route.ts
│   │   ├── config/status/
│   │   ├── memberships/     # 会员 API
│   │   └── workflow/
│   │       ├── content-strategy/
│   │       └── script/
│   ├── page.tsx             # 首页
│   ├── layout.tsx
│   └── admin/               # 后台管理系统
│       ├── layout.tsx       # 管理后台布局
│       ├── page.tsx         # 工作台
│       ├── login/page.tsx   # 登录页
│       ├── users/page.tsx   # 用户管理
│       ├── memberships/page.tsx # 会员管理
│       ├── orders/page.tsx  # 订单管理
│       └── settings/page.tsx # 系统设置
├── components/              # React 组件
│   ├── steps/               # 工作流步骤组件
│   ├── admin/               # 后台管理组件
│   │   └── AdminLayout.tsx  # 管理后台布局组件
│   └── ui/                  # shadcn/ui 组件
├── lib/                     # 业务逻辑
│   ├── ai.ts               # AI 调用封装
│   ├── coze/               # Coze API 集成
│   ├── decision/            # 决策解析
│   ├── history/             # 历史记录存储
│   ├── strategy/           # 策略解析
│   ├── admin-store.ts      # 后台管理状态
│   ├── admin-data.ts       # 后台 Mock 数据
│   └── store.ts            # Zustand store
├── storage/                 # Supabase 数据库
│   └── database/
│       ├── supabase-client.ts  # Supabase 客户端
│       └── schema.ts          # 数据库表结构
└── public/                 # 静态资源
```

## 关键入口 / 核心模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 首页 | `app/page.tsx` | 应用入口页面 |
| 内容策略 API | `app/api/workflow/content-strategy/route.ts` | AI 生成内容策略 |
| 脚本生成 API | `app/api/workflow/script/route.ts` | AI 生成脚本 |
| 状态查询 API | `app/api/config/status/route.ts` | 状态配置查询 |
| AI 封装 | `lib/ai.ts` | OpenAI / Coze API 调用 |
| 状态管理 | `lib/store.ts` | Zustand 全局状态 |

### 认证与用户系统

| 模块 | 路径 | 说明 |
|------|------|------|
| 用户注册 | `app/api/auth/register/route.ts` | 邮箱注册 |
| 用户登录 | `app/api/auth/login/route.ts` | 邮箱登录，返回 JWT |
| 获取当前用户 | `app/api/auth/me/route.ts` | 获取用户信息和会员状态 |
| 用户登出 | `app/api/auth/logout/route.ts` | 登出 |
| 开通会员 | `app/api/memberships/route.ts` | POST 开通会员 |
| Supabase 客户端 | `storage/database/supabase-client.ts` | 数据库客户端封装 |
| 数据库 Schema | `storage/database/schema.ts` | 表结构定义 |

### 后台管理系统

| 模块 | 路径 | 说明 |
|------|------|------|
| 登录页 | `app/admin/login/page.tsx` | 管理员登录 |
| 工作台 | `app/admin/page.tsx` | 数据看板 |
| 用户管理 | `app/admin/users/page.tsx` | 用户列表、封禁/解封 |
| 会员管理 | `app/admin/memberships/page.tsx` | 会员列表、手动开通 |
| 订单管理 | `app/admin/orders/page.tsx` | 订单列表、退款操作 |
| 系统设置 | `app/admin/settings/page.tsx` | 价格配置、免费次数、套餐开关 |
| 管理状态 | `lib/admin-store.ts` | Zustand 管理员状态 |
| Mock 数据 | `lib/admin-data.ts` | 后台管理模拟数据 |

## Supabase 数据库

### 表结构

| 表名 | 说明 | 关联 |
|------|------|------|
| profiles | 用户扩展信息 | 关联 auth.users |
| memberships | 会员记录 | 关联 profiles |
| orders | 订单记录 | 关联 profiles |
| system_settings | 系统设置 | Key-Value 配置 |

### RLS 策略

- **profiles, memberships, orders**：用户私有数据（场景 D），用户只能操作自己的数据
- **system_settings**：公开读取，管理员可写

### 常用操作

```typescript
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 后端操作（使用 service_role_key）
const client = getSupabaseClient()

// 带认证的操作（使用 anon_key + token）
const client = getSupabaseClient(token)
```

### 更新数据库 Schema

```bash
# 1. 拉取最新表结构
coze-coding-ai db generate-models

# 2. 修改 storage/database/schema.ts

# 3. 同步到数据库
coze-coding-ai db upgrade
```

## 运行与预览

### 开发预览
```bash
# 安装依赖并启动开发服务器
bash scripts/coze-preview-build.sh
bash scripts/coze-preview-run.sh
# 访问 http://localhost:5000
```

### 生产构建与部署
```bash
# 构建
bash .cozeproj/scripts/deploy_build.sh

# 启动生产服务
bash .cozeproj/scripts/deploy_run.sh
```

## Coze 配置

### .coze 配置
```toml
[project]
sub_id = "53a229df"
name = "script-workshop"
requires = ["nodejs-24"]
project_type = "web"
entrypoint = "server.js"

[preview]
preview_enable = "enabled"

[deploy]
build = ["bash", ".cozeproj/scripts/deploy_build.sh"]
run = ["bash", ".cozeproj/scripts/deploy_run.sh"]

[deploy.profile]
kind = "service"
flavor = "web"
```

### 端口规范
- 预览端口：**5000**
- 部署端口：**5000**
- 禁止使用 9000 端口

## 用户偏好与长期约束

1. **包管理器**：必须使用 `pnpm`，禁止 `npm` 或 `yarn`
2. **运行时**：项目要求 Node.js 24
3. **端口约束**：预览和部署统一使用 5000 端口
4. **脚本规范**：所有脚本基于自身位置定位项目根目录，不依赖调用时 `pwd`

## 常见问题和预防

1. **端口占用**：启动前自动清理 5000 端口残留进程
2. **依赖安装**：始终在项目根目录执行 `pnpm install`
3. **构建验证**：生产构建使用 `pnpm run build`，启动使用 `pnpm run start`
4. **环境变量**：`.env.example` 提供环境变量模板，运行时需配置 `OPENAI_API_KEY` 等密钥
