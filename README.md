# 社区健康守护（health-AIweb-project）

社区健康管理平台，服务社区卫生服务中心与辖区居民，包含三部分：Vue3 + Element Plus 管理后台（`robot-admin`）、uni-app 居民端（H5 / 微信小程序，`robot-mini-app`）、Express + json-server 数据服务（`robot-server`，含豆包 AI 健康顾问代理）。启动方式：三个目录分别执行 `npm install`，再分别运行 `npm run dev`（后台 5173）、`npm run dev:h5`（居民端 5174）、`npm start`（服务端 3000）。
> 本项目以 `vue-AIweb-project`（机器人学习打卡）为模板复制并整体改造为「社区健康管理 / 慢病随访」主题，技术栈、目录结构、接口命名、构建脚本均沿用原模板。

## 一、目录结构

```
health-AIweb-project/
├── robot-admin/      Vue3 + Element Plus + ECharts 管理后台
├── robot-mini-app/   uni-app 居民端（H5 / 微信小程序）
├── robot-server/     Express + json-server 风格数据服务 + 豆包 AI 代理
└── _preview/         后台实际渲染截图
```

三个目录名保持原样（未重命名），以降低改动风险。

## 二、启动方式与端口

### 1. 服务端 robot-server（端口 3000）

```bash
cd robot-server
npm install
npm start            # 或 node server.js
```

- 数据文件：`db.json`（json-server 风格，写操作会直接落盘）
- 静态图片：`/image/*`
- 健康检查：`GET http://localhost:3000/chat/health`

### 2. 后台 robot-admin（端口 5173）

```bash
cd robot-admin
npm install
npm run dev          # http://localhost:5173
npm run build        # 产物 dist/
```

`/api` 由 Vite 代理到 `http://localhost:3000`；如需指向其他端口，可设置环境变量
`API_TARGET`（本次验证时 3000 被原项目占用，使用 `API_TARGET=http://127.0.0.1:3001`）。

登录账号（`db.json → admins`）：

| 账号 | 密码 | 昵称 |
| --- | --- | --- |
| admin | 123456 | 社区健康管理员 |
| doctor | 123456 | 全科随访医生 |

### 3. 居民端 robot-mini-app

```bash
cd robot-mini-app
npm install

# H5（本项目模板为「根目录即源码目录」，需指定输入目录）
# PowerShell:
$env:UNI_INPUT_DIR='.'
npm run dev:h5       # 或 npm run build:h5，产物 dist/build/h5

# 微信小程序
npm run dev:mp-weixin
npm run build:mp-weixin
```

- 接口地址在 `utils/api.js` 的 `BASE_URL`，默认 `http://127.0.0.1:3000`
- H5 可直接访问；微信开发者工具需勾选“不校验合法域名”，真机预览请改为电脑局域网 IP
- 演示居民账号：`13800138002 / 123456`（李国强，康乐社区，2型糖尿病）

### 4. AI 健康问答（豆包）

`POST /chat` 为模型代理，`config.js` 中读取：

```js
DOUBAO_API_KEY: process.env.DOUBAO_API_KEY || ''
DOUBAO_MODEL:   'doubao-seed-evolving'
```

**仓库内不含任何真实密钥**，请自行填写 `robot-server/config.js` 的 Key（或用环境变量
`DOUBAO_API_KEY` 注入）后重启服务。未配置时 `/chat` 返回 503 并提示配置位置，
其余功能不受影响。场景提示词（`SYSTEM_PROMPT`，健康咨询/慢病管理/饮食运动/用药提醒，
并要求急症提示就医）由服务端统一注入。

## 三、页面清单（新 ⇄ 旧对照）

| 端 | 现页面 | 原模板页面 | 路由 / 入口 |
| --- | --- | --- | --- |
| 后台 | 健康数据看板 | 控制台 | `/dashboard` |
| 后台 | 居民健康档案 | 用户管理 | `/users` |
| 后台 | 健康科普管理 | 知识点管理 | `/knowledge` |
| 后台 | 健康宣教横幅 | 轮播图管理 | `/banners` |
| 后台 | 健康提醒公告 | 公告管理 | `/notices` |
| 后台 | 健康打卡记录 | 打卡记录管理 | `/checkins` |
| 后台 | 健康数据统计 | 数据统计 | `/charts` |
| 后台 | 登录 | 登录 | `/login` |
| 居民端 | 健康首页 | 首页 | `pages/index/index` |
| 居民端 | 健康科普 | 知识列表 | `pages/knowledge/list` |
| 居民端 | 科普详情 + 健康打卡 | 知识点详情 + 打卡 | `pages/knowledge/detail` |
| 居民端 | 健康打卡 | 打卡中心 | `pages/checkin/checkin` |
| 居民端 | 社区健康积分榜 | 积分排行 | `pages/ranking/ranking` |
| 居民端 | 我的健康档案 | 我的 | `pages/mine/mine` |
| 居民端 | 健康提醒 / 提醒详情 | 公告 / 公告详情 | `pages/notice/list`、`detail` |
| 居民端 | AI 健康顾问 | AI 对话 | `pages/chat/chat` |

## 四、接口对照表（路径全部沿用原命名）

| 接口 | 说明 | 对应新语义 |
| --- | --- | --- |
| `GET /users` | 居民列表 | 居民健康档案 |
| `GET /users/:id` | 单个居民 | 健康档案详情 |
| `POST /users` | 新增居民 | 建档 |
| `PUT /users/:id` | 更新居民 | 更新档案 / 打卡后累计积分 |
| `DELETE /users/:id` | 删除居民 | 删除档案 |
| `GET /knowledge` | 科普列表 | 健康科普知识库 |
| `GET/POST/PUT/DELETE /knowledge...` | 科普 CRUD | 健康科普管理 |
| `GET /checkins` | 打卡记录 | 健康打卡 / 随访记录 |
| `POST /checkins` | 新增打卡 | 提交血压、血糖、体重、步数 |
| `DELETE /checkins/:id` | 删除打卡 | 删除健康记录 |
| `GET /banners`、CRUD | 横幅 | 健康宣教横幅 |
| `GET /notices`、CRUD | 提醒 | 服药 / 复诊 / 体检提醒 |
| `GET /admins`、`PUT /admins/:id` | 管理员 | 后台账号 |
| `POST /chat` | 豆包模型代理 | AI 健康顾问（保留真实模型调用） |
| `GET /chat/health` | 服务状态 | 返回 `{ ok, model, configured }` |

### 数据结构（相对模板新增字段）

- `users`：`gender` 性别、`age` 年龄、`chronicTags` 慢病标签（如「高血压、2型糖尿病」）；
  `className` 复用为「所属社区」，`totalPoints` 为健康积分，`continuousDays` 连续打卡天数
- `checkins`：`systolic`/`diastolic` 收缩压/舒张压、`bloodSugar` 血糖、`weight` 体重、
  `steps` 步数、`recordTime` 记录时间、`note` 随访备注
- `knowledge`：`summary` 摘要、`readCount` 阅读量；`duration` 表示阅读时长
- `notices.type`：`服药提醒` / `复诊提醒` / `体检通知`

示例数据：22 位居民（3 个社区）、12 篇科普、48 条健康打卡、5 条宣教横幅、6 条健康提醒，
时间分布在 2026-11-01 ~ 2026-11-10，可直接支撑图表与日历展示。

## 五、相比原模板的改动文件

**robot-server**

- `db.json`：全量替换为医疗语境数据（含新增字段）
- `config.js`：健康场景提示词；密钥改为环境变量/自行填写，不再硬编码
- `server.js`：注入 `SYSTEM_PROMPT`、未配置 Key 时返回 503、`/chat/health` 增加 `configured`、
  端口支持 `PORT` 环境变量、健康化日志
- `package.json`：名称与描述

**robot-admin**

- `src/views/`：`Dashboard.vue`、`Users.vue`、`Knowledge.vue`、`Banners.vue`、`Notices.vue`、
  `Checkins.vue`、`Charts.vue`、`Layout.vue`、`Login.vue` 全部改为健康医疗文案/列/表单/图表
- `src/router/index.js`、`src/utils/api.js`、`src/App.vue`：标题、主题色、Logo 选项说明
- `index.html`、`package.json`、`vite.config.js`（代理支持 `API_TARGET`）

**robot-mini-app**

- 全部页面：`index`、`login`、`checkin`、`knowledge/list`、`knowledge/detail`、`ranking`、
  `mine`、`notice/list`、`notice/detail`、`chat`
- `utils/api.js`：新增 `doCheckin(userId, knowledgeId, metrics)` 健康打卡（血压/血糖/体重/步数、
  连续天数与积分计算）、注册默认字段改为医疗语境
- `utils/style.js`：提醒类型 → 服药/复诊/体检样式
- `pages.json`、`App.vue`、`uni.scss`、`manifest.json`、`index.html`、`package.json`：标题、
  tabBar、医疗蓝青绿主色与渐变

配色：主色 `#12A8A0`（青绿）→ `#1D7EC9` / `#2D9CDB`（医疗蓝），侧边栏 `#0B3B48 → #072630`，
页面底色 `#F1F7FA`。图片全部复用模板已有的 `static/image/1-9.jpg`、`logo*.jpg`，无新增图片。

## 六、验证结果

| 项目 | 结果 |
| --- | --- |
| `robot-admin` `npm run build` | 通过（dist 生成，约 6s） |
| `robot-server` 启动 | 通过，`3000` 被原项目服务占用时以 `PORT=3001` 验证 |
| 接口数据 | `/users` 22 条、`/knowledge` 12 条、`/checkins` 48 条、`/notices` 6 条、`/banners` 5 条 |
| `/chat/health` | 返回 `{ ok: true, model: "doubao-seed-evolving", configured: false }` |
| `robot-mini-app` `npm run build:h5` | 通过（产物 `dist/build/h5`） |
| 后台页面渲染 | 见 `_preview/` 截图 |

`_preview/` 截图（1440×900，真实渲染）：

- `01-dashboard.png` 健康数据看板（首页）
- `02-users-list.png` 居民健康档案（列表页）
- `03-user-detail.png` 居民健康档案详情（详情弹窗）
- `04-checkins.png` 健康打卡记录
- `05-charts.png` 健康数据统计（ECharts）

> 截图方式：构建后的 `dist` 通过本地静态服务托管，`/api` 代理到运行中的新服务端（3001），
> 与 dev server 渲染结果一致。

## 七、待确认 / 遗留问题

1. **豆包 API Key 未配置**：`config.js` 默认为空，AI 健康问答会返回 503，需要自行填写。
2. **端口 3000 被占用**：本机原 `vue-AIweb-project` 的服务端仍在运行，验证时使用 3001；
   正式运行前请先停止旧服务，或将新服务端的 `PORT` 与后台 `API_TARGET` 一并调整。
3. **H5 构建目录**：模板根目录即 uni-app 源码目录，CLI 默认找 `src/`，需设置
   `UNI_INPUT_DIR='.'`（已在本文档说明，未改动原模板脚本）。
4. **小程序真机接口地址**：`BASE_URL` 为 `127.0.0.1:3000`，真机需改为电脑局域网 IP。
5. **居民头像**：`db.json` 中 `avatar` 为空，前端回退为 `logo.jpg`（未编造新图片）。
6. **排行榜范围**：沿用模板逻辑，按当前居民 `className`（社区）分组排行。
7. **科普阅读量**：`readCount` 为静态示例值，未做进入详情自增（模板无此接口）。
