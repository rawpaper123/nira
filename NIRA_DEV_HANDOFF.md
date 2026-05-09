# Nira Dev Handoff

## 启动方式

### 后端

```bash
cd backend
uvicorn app.main:app --reload
```

默认服务地址是 `http://localhost:8000`，健康检查为：

```bash
curl http://localhost:8000/health
```

数据库迁移：

```bash
cd backend
alembic upgrade head
```

格式化/检查：

```bash
cd backend
black app/
ruff check app/
```

### 小程序

使用微信开发者工具打开 `frontend/` 目录。项目配置文件是 `frontend/project.config.json`，小程序根目录为 `frontend/miniprogram/`。

小程序 API 默认指向：

```text
http://localhost:8000
```

配置位置：`frontend/miniprogram/app.js` 的 `globalData.apiBase`。

### Next.js 落地页

根目录仍保留 Next.js 站点：

```bash
npm install
npm run dev
```

默认地址是 `http://localhost:3000`。

## 当前开发状态判断

- 产品主线已经从 Web 落地页推进到微信小程序 MVP。
- 小程序已包含首页、手机号登录、聊天、匹配、日程、群聊、我的等页面。
- 后端已有 auth、profile、match、schedule、push、test 路由。
- 匹配、活动安排、推送、登录邀请码等能力处于开发/联调阶段，部分逻辑仍是本地内存、测试接口或开发模式兜底。

## 建议下一步

1. 先打通后端启动和 `/health`，确认依赖、`.env`、Redis/Postgres 是否可用。
2. 修复会直接阻塞接口运行的明显问题，例如 push 路由中的订阅列表函数命名不一致。
3. 对齐数据库模型与 Alembic 迁移，尤其是新增的 `invite_code`、`push_subscriptions` 等字段/表。
4. 确认小程序登录链路：`wx.login`、手机号验证码、邀请码、新老用户返回值、token 存储。
5. 更新 README，让它反映当前“小程序 + FastAPI”的真实主线，同时保留 Next.js 落地页说明。

## 2026-05-09 联调阻塞修复

### 修改文件

- `backend/app/routers/push.py`
- `backend/app/models/__init__.py`
- `backend/alembic/env.py`
- `backend/alembic/versions/002_invite_code_and_push_subscriptions.py`
- `NIRA_DEV_HANDOFF.md`

### 修改原因

- `push.py` 导入的是 `get_all_subscribed`，但 `/api/v1/push/subscribers` 调用的是不存在的 `get_all_subscribers()`，会导致接口运行时报错。
- `User.invite_code` 和 `PushSubscription` 已存在于模型层，但 Alembic 初始迁移未包含 `invite_code` 字段和 `push_subscriptions` 表。
- `PushSubscription` 未从 `backend/app/models/__init__.py` 导出，`alembic/env.py` 也未显式导入，自动迁移上下文容易漏掉该模型。

### 本轮修复

- 将 `/api/v1/push/subscribers` 改为调用 `get_all_subscribed()`，并避免重复调用列表函数。
- 在模型导出和 Alembic metadata 加载路径中加入 `PushSubscription`。
- 新增 `002_invite_code_and_push_subscriptions` 迁移：
  - 为 `users` 增加 `invite_code`。
  - 为已有用户回填稳定的临时邀请码。
  - 为 `invite_code` 增加唯一索引。
  - 创建 `push_subscriptions` 表和 `user_id` 唯一索引。
  - 兼容当前本地 SQLite 开发库；PostgreSQL 下会额外设置 `invite_code` 非空。

### 验证结果

- 已运行：`.venv\Scripts\python.exe -m compileall app alembic`，通过。
- 已运行：`.venv\Scripts\python.exe -c "from app.main import app; print(app.title)"`，输出 `Nira`。
- 已运行：`.venv\Scripts\alembic.exe upgrade head`，通过，当前本地库升级到 `002_invite_push`。
- 已运行：`.venv\Scripts\alembic.exe current`，输出 `002_invite_push (head)`。
- 已通过 Uvicorn 临时启动验证 `/health`，返回 `{"status":"ok","app":"Nira","env":"development"}`。

### 遗留问题

- 当前本地 8000 端口已有两个历史 Python 监听进程，未擅自停止。后续如端口冲突，应先确认这些进程是否仍需要。
- `backend/app/services/push_service.py` 当前仍使用 JSON 文件记录订阅状态，暂未切换到 `PushSubscription` 数据库表；本轮只补齐 schema/migration，避免扩大改动。
- 当前 SQLite 开发迁移为了可运行，未在 SQLite 上强制 `users.invite_code` 非空；PostgreSQL 生产迁移会设置非空。

## 2026-05-09 小程序登录链路基线

### 修改文件

- `backend/app/routers/auth.py`
- `backend/app/services/auth_service.py`
- `frontend/miniprogram/pages/login/phone/index.js`
- `NIRA_DEV_HANDOFF.md`

### 当前登录流程

1. 小程序启动时，`frontend/miniprogram/app.js` 调用 `wx.login()`。
2. 小程序通过 `frontend/miniprogram/utils/api.js` 调用 `POST /api/v1/auth/login`，传 `{ code }`。
3. 后端在 `APP_ENV=development` 且 `WX_APPID=test` 时不请求真实微信服务，返回 mock `openid` 和临时 `user_id`。
4. 用户进入手机号登录页，调用 `POST /api/v1/auth/send-verification-code`，传 `{ phone }`。
5. development 环境验证码固定为 `123456`；Redis 不可用时不阻塞本地联调。
6. 小程序调用 `POST /api/v1/auth/verify-code-and-login`，传 `{ phone, code, openid, invite_code }`。
7. 新用户使用创始邀请码 `NIRA2026`；老用户按手机号直接登录，不需要再次传邀请码。
8. 后端返回 `success/detail/openid/user_id/invite_code/token`。
9. 小程序 `app.loginWithPhone()` 将手机号写入 `nira_phone`，openid 写入 `nira_openid`，后端用户 ID 写入 `nira_user_id`，token 写入 `token`。
10. 后续 API 请求由 `utils/api.js` 从 `wx.getStorageSync('token')` 读取并注入 `Authorization: Bearer <token>`。

### 本轮修复

- development 环境发验证码时使用固定验证码 `123456`，避免依赖真实短信。
- Redis 不可用时，development 环境仍允许发码接口返回成功。
- development 环境验证 `123456` 时不依赖 Redis，保证本地验证码登录可跑通。
- 修复 `verify_code()` 在 Redis `decode_responses=True` 时对字符串调用 `.decode()` 的问题。
- 手机号登录页默认显示邀请码输入框，并预填 `NIRA2026`，避免新用户本地首次注册被隐藏的邀请码字段卡住。

### 后端测试命令

建议使用未被占用的测试端口，例如 8011：

```bash
cd backend
.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8011
```

另开终端验证：

```bash
curl.exe -s -X POST http://127.0.0.1:8011/api/v1/auth/login -H "Content-Type: application/json" -d "{\"code\":\"dev-login-code\"}"
curl.exe -s -X POST http://127.0.0.1:8011/api/v1/auth/send-verification-code -H "Content-Type: application/json" -d "{\"phone\":\"13800001234\"}"
curl.exe -s -X POST http://127.0.0.1:8011/api/v1/auth/validate-invite-code -H "Content-Type: application/json" -d "{\"invite_code\":\"NIRA2026\"}"
curl.exe -s -X POST http://127.0.0.1:8011/api/v1/auth/verify-code-and-login -H "Content-Type: application/json" -d "{\"phone\":\"13800001234\",\"code\":\"123456\",\"openid\":\"dev_a9ec08a8ff31fa79\",\"invite_code\":\"NIRA2026\"}"
```

### 验证结果

- 已运行：`.venv\Scripts\python.exe -m compileall app`，通过。
- 已运行：`.venv\Scripts\python.exe -c "from app.main import app; print(app.title)"`，输出 `Nira`。
- 已在 8011 端口启动当前后端，验证 `POST /api/v1/auth/login`，返回 mock `openid/user_id`。
- 已验证 `POST /api/v1/auth/send-verification-code`，development 下返回成功，验证码为 `123456`。
- 已验证 `POST /api/v1/auth/validate-invite-code`，`NIRA2026` 通过。
- 已验证 `POST /api/v1/auth/verify-code-and-login`，新用户注册成功并返回 `openid/user_id/invite_code/token`。
- 已验证同一手机号重复登录成功，老用户不需要再次传 `invite_code`。
- 已运行：`node --check frontend/miniprogram/pages/login/phone/index.js`，通过。
- 已运行：`node --check frontend/miniprogram/app.js`，通过。
- 已运行：`node --check frontend/miniprogram/utils/api.js`，通过。

### 小程序端测试步骤

1. 启动后端：`cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload`。
2. 用微信开发者工具打开 `frontend/`。
3. 确认 `frontend/miniprogram/app.js` 中 `globalData.apiBase` 指向 `http://localhost:8000`。
4. 启动小程序，进入手机号登录页。
5. 输入任意合法测试手机号，例如 `13800001234`。
6. 点击获取验证码，输入 `123456`。
7. 邀请码保持默认 `NIRA2026`。
8. 点击登录，成功后应返回上一页，并在本地 storage 中看到 `nira_phone`、`nira_openid`、`nira_user_id`、`token`、`my_invite_code`。

### 遗留问题

- 当前 token 只是后端生成并由前端注入请求头，后端其他接口尚未统一校验 `Authorization`。
- development 下验证码固定为 `123456`，只能用于本地联调，生产环境仍需接真实短信服务。
- `wx.login` 在 `WX_APPID=test` 时使用 mock openid，生产环境仍需真实微信 `jscode2session` 配置。
- 手机号登录页现在默认显示并预填 `NIRA2026`，适合创始期/本地联调；正式上线前应根据“新用户/老用户”状态决定是否展示邀请码。

## 2026-05-09 登录后画像 / AI Onboarding 基线

### 修改文件

- `backend/app/routers/profile.py`
- `backend/app/schemas/profile.py`
- `backend/app/services/profile_service.py`
- `frontend/miniprogram/utils/api.js`
- `frontend/miniprogram/pages/index/index.js`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/login/phone/index.js`
- `NIRA_DEV_HANDOFF.md`

### 当前登录后 Onboarding 流程

1. 手机号登录成功后，`pages/login/phone/index.js` 调用 `app.loginWithPhone()` 保存 `nira_phone`、`nira_openid`、`nira_user_id`、`token`。
2. 登录页优先 `wx.navigateBack()`；如果没有上一页，则 `wx.switchTab()` 回首页。
3. 首页真实路径是 `frontend/miniprogram/pages/index`，项目里没有 `pages/home`。
4. 首页通过 `app.isLoggedIn()` 判断是否登录；未登录点击开始/找匹配会跳转手机号登录页。
5. 首页通过 `app.isProfileComplete()` 判断是否完成画像；如果已登录但本地没有画像，会调用 `GET /api/v1/profile/{user_id}` 尝试从后端恢复画像。
6. 未完成画像的新用户进入 `pages/chat/chat`，走本地脚本式 onboarding 对话。
7. chat 页面收集昵称、兴趣、时间偏好、搭子性别/type 偏好、视觉风格偏好。
8. chat 完成后调用 `POST /api/v1/profile/build`，传 `{ user_id, raw_input }`。
9. development 环境后端不调用真实 Qwen，直接使用本地 mock 解析画像并写入 `user_profiles`。
10. 前端收到 profile 后调用 `app.setProfile(profile)`，写入 `profile` 和 `profileCompleted`，随后展示“加入本周匹配队列”按钮。

### 当前 Profile 数据结构

数据库仍使用现有 `UserProfile` 表，不新增迁移：

- `user_id`: 后端登录后返回的 UUID。
- `interests`: 兴趣标签数组，例如 `["咖啡探店", "城市漫步"]`。
- `activity_types`: 活动类型数组，例如 `["coffee_chat", "city_walk"]`。
- `personality_tags`: 性格标签数组，例如 `["chill", "social"]`。
- `bio`: 一句 00 后朋友式个签。
- `availability`: 现有 JSON 字段，包含时间偏好和 onboarding 扩展字段：
  - `weekdays`
  - `weekends`
  - `preferred_name`
  - `preferred_style`
  - `preferred_gender`
  - `preferred_type`
  - `photo_urls`
  - `photo_status`

API 响应会把 `preferred_name/preferred_style/preferred_gender/preferred_type/photo_urls/photo_status` 从 `availability` 中扁平返回，方便小程序直接使用。

### 后端接口

- `POST /api/v1/profile/build`
  - 请求：`{ "user_id": "<uuid>", "raw_input": "<onboarding text>" }`
  - 行为：创建或更新 `UserProfile`。
- `GET /api/v1/profile/{user_id}`
  - 行为：读取已保存画像；不存在时返回 404。

### 小程序测试步骤

1. 启动后端：`cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8011`。
2. 临时把 `frontend/miniprogram/app.js` 的 `apiBase` 指向 `http://localhost:8011`，或继续使用 8000 已运行服务。
3. 用微信开发者工具打开 `frontend/`。
4. 登录手机号：验证码 `123456`，邀请码 `NIRA2026`。
5. 回到首页，点击开始/聊天。
6. 按 chat 页面提示输入昵称、兴趣、时间、搭子偏好、风格偏好。
7. 完成后应收到 mock AI 整理出的画像，并看到“加入本周匹配队列”按钮。
8. 退出再进入小程序，若本地仍有 storage，应识别为已登录；若本地 profile 丢失但后端有画像，首页会尝试从 `GET /profile/{user_id}` 恢复。

### 已验证命令

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
```

说明：用户给出的 `frontend\miniprogram\pages\chat\index.js` 和 `frontend\miniprogram\pages\home\index.js` 在当前项目中不存在；对应真实文件为 `pages/chat/chat.js` 和 `pages/index/index.js`。

已在 8011 端口验证：

- `GET /health` 返回 `{"status":"ok","app":"Nira","env":"development"}`。
- `POST /api/v1/auth/login` 返回 mock `openid/user_id`。
- `POST /api/v1/auth/send-verification-code` 返回成功，development 验证码为 `123456`。
- `POST /api/v1/auth/verify-code-and-login` 返回真实 UUID `user_id` 和 `token`。
- `POST /api/v1/profile/build` 可创建画像。
- `GET /api/v1/profile/{user_id}` 可读取画像。
- 同一 `user_id` 再次调用 `POST /profile/build` 可更新画像，不报错。

### 遗留问题

- chat onboarding 目前主要是小程序本地脚本式对话，后端没有独立的 `/chat` 或 `/onboarding-chat` 多轮接口。
- development mock 画像解析是关键词规则，足够联调，不等价于真实 Qwen 解析质量。
- `preferred_*` 字段目前存放在 `UserProfile.availability` JSON 中，避免新增迁移；后续稳定后可以考虑拆正式字段。
- 首页远端恢复画像只在“已登录但本地 profile 未完成”时尝试，尚未做强制同步/冲突合并。
- token 仍只由前端保存并注入请求头，后端 profile/match 接口尚未鉴权。

### 下一轮建议

1. 把加入匹配队列后的状态与后端队列/匹配接口对齐，减少纯本地状态。
2. 给 `profile/build` 增加一个轻量测试用例或脚本，固定验证 mock fallback。
3. 梳理 `UserProfile.availability` 中扩展字段是否需要独立迁移为正式列。
4. 再进入匹配链路：`join-queue`、`weekly`、本地候选用户、match fallback。

## 2026-05-09 Join Queue / Weekly Match 本地联调基线

### 修改文件

- `backend/app/routers/match.py`
- `backend/app/schemas/match.py`
- `backend/app/services/match_service.py`
- `frontend/miniprogram/utils/api.js`
- `frontend/miniprogram/pages/index/index.js`
- `frontend/miniprogram/pages/index/index.wxml`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/match/match.js`
- `frontend/miniprogram/pages/match/match.wxml`
- `NIRA_DEV_HANDOFF.md`

### 当前 Join Queue 流程

1. 用户完成 onboarding 后，前端 `app.setProfile(profile)` 写入本地 `profile/profileCompleted`。
2. 首页真实路径是 `frontend/miniprogram/pages/index`，项目没有 `pages/home`。
3. 首页在 `profileComplete && !joinedQueue && !hasMatch` 时显示“加入本周匹配”。
4. 点击后调用 `POST /api/v1/match/join-queue`，请求为 `{ user_id, profile }`。
5. 后端继续使用现有内存队列 `_match_queue`，不新增数据库表。
6. 后端如果没有 profile 或 profile 明显未完成，返回 `profile_required`。
7. 首次加入返回 `joined` 和 `queue_position`。
8. 重复加入返回 `already_joined`，保持稳定队列位置。
9. 前端收到 `joined/already_joined` 后调用 `app.joinQueue()`，首页显示已加入队列，并提供“查看匹配状态”入口。

### 当前 Weekly Match / Mock Match Result 流程

- `GET /api/v1/match/result/{user_id}`
  - 有本周匹配结果时返回 `status=matched` 和 `matches[0]`。
  - 已入队但暂无结果时返回 `status=waiting`、`matches=[]`。
  - 未入队时返回 `status=not_joined`、`matches=[]`。
- `POST /api/v1/match/weekly`
  - development 环境不调用真实 DashScope/Qwen，不走 simulation/compatibility agents。
  - 如果用户没有 profile，返回明确错误。
  - 如果没有候选 profile，返回等待状态，不报错。
  - 如果已有测试用户/profile，则创建一条 mock `Match`，并返回 mock result。

mock match result 至少包含：

- `match_id`
- `user_b_id`
- `user_b_nickname`
- `matched_user_name`
- `score`
- `compatibility_score`
- `compatibility.reasoning`
- `reasons`
- `suggested_activity`
- `status`
- `simulation`

### 小程序测试步骤

1. 启动后端：`cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8011`。
2. 临时把 `frontend/miniprogram/app.js` 的 `apiBase` 指向 `http://localhost:8011`，或继续使用 8000 已运行服务。
3. 打开微信开发者工具，进入 `frontend/`。
4. 手机号登录，验证码 `123456`，邀请码 `NIRA2026`。
5. 完成 chat onboarding，生成 profile。
6. 回首页，点击“加入本周匹配”。
7. 首页应显示“已加入本周匹配队列”。
8. 点击“查看匹配状态”进入 match 页。
9. 如果只有当前用户，应显示等待周三 19:00 / 等待匹配结果。
10. 如果已有另一个测试用户 profile，触发 weekly 后应显示 mock 匹配卡片。

### 已验证命令

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\index\index.js
Get-ChildItem frontend\miniprogram\pages\match -Filter *.js | ForEach-Object { node --check $_.FullName }
```

### 后端 API 测试结果

已在 8011 端口验证：

- `GET /health` 正常。
- 登录链路正常：mock wx login、发码、`123456` 验证码、`NIRA2026` 邀请码。
- `POST /api/v1/profile/build` 正常。
- `GET /api/v1/profile/{user_id}` 正常。
- `POST /api/v1/match/join-queue` 未传 profile 时返回 `profile_required`。
- 首次 `join-queue` 返回 `joined`。
- 重复 `join-queue` 返回 `already_joined`。
- `GET /api/v1/match/result/{user_id}` 单人入队时返回 `waiting` 和空 `matches`。
- 创建第二个测试用户/profile 后，`POST /api/v1/match/weekly` 返回 `matched` 和 1 条 mock match。
- 再次 `GET /api/v1/match/result/{user_id}` 返回 `matched` 和 1 条 match。

### 遗留问题

- 队列仍是进程内内存 `_match_queue`，服务重启后会丢失。
- development mock match 会使用已有测试 profile 作为候选；本地库里历史测试用户较多时，可能很快出现 mock match。
- 正式 weekly 调度尚未实现；“周三 19:00”目前是产品文案和等待状态，不是 cron。
- match 接受/拒绝、群聊仍是内存状态。
- 后端尚未使用 token 鉴权校验 `user_id` 是否属于当前登录用户。
- mock result 已满足页面联调，不代表真实匹配算法质量。

### 下一轮建议

1. 打通 `schedule/arrange-simple` 与 match result 的活动安排页联调，避免真实 scheduler/Qwen 阻塞。
2. 为队列和 match result 增加轻量开发测试脚本。
3. 决定队列是否需要落库，或先保留内存直到 MVP 规则稳定。
4. 梳理接受/拒绝匹配后的 group 页面和 activity plan fallback。

## 2026-05-09 官网线上稳定状态 / 品牌收尾交接

### 当前线上状态

- `nira.social` 已成功部署最新官网版本。
- 最新有效官网修复提交：
  - `5dcdc3f fix: replace legacy branded images and update AI matching copy`
- Vercel 已成功加载新页面 chunk：
  - `/_next/static/chunks/app/page-47136084eb759c9a.js`
- 之前官网不更新的原因不是代码没有 push，而是 Vercel 构建被 `scripts/fix-images.ts` 中 `sharp` 类型/依赖问题阻塞。
- 当前已通过在 `tsconfig.json` 的 `exclude` 中排除 `scripts` 解决该构建阻塞。

### 本轮已完成官网修复

替换了 3 张旧品牌痕迹图片，并使用新文件名避免 Vercel/CDN/浏览器缓存继续命中旧资源：

- `public/images/real-dates/real_dates_pic_02-nira-v2.webp`
- `public/images/real-dates/real_dates_pic_03-nira-v2.webp`
- `public/images/unforgettable/great_times_04-nira-v2.webp`

更新图片引用：

- `components/RealDatesSection.tsx`
- `components/GallerySection.tsx`

文案替换：

- `app/layout.tsx`
  - `AI红娘` -> `AI匹配助手`
- `components/MatchmakerSection.tsx`
  - `你的专属 AI 红娘` -> `你的 AI 匹配助手`
  - `专业红娘...` -> `关系科学与产品策略共同驱动...`
  - `找到那个 TA` -> `找到更合拍的连接`

倒计时相关：

- `components/HeroSection.tsx` 中“下次匹配日”已改为客户端每秒刷新，并与倒计时目标同步。
- 倒计时目标逻辑使用：
  - `getUTCDay`
  - `setUTCHours(11,0,0,0)`
  - UTC 11:00 = 北京时间 19:00

### 当前验证结果

- `npm run build` 成功。
- 线上已确认不再引用旧图片：
  - `real_dates_pic_02.webp`
  - `real_dates_pic_03.webp`
  - `great_times_04.webp`
- 线上 HTML / JS 已确认无以下内容：
  - `Ditto`
  - `AI红娘`
  - `红娘`
  - `相亲`
  - `婚恋`
  - `牵线`
  - `找对象`
- 旧固定日期 `2026年4月22日` 不存在。
- 三张新图片线上均返回 `200 image/webp`。
- 新图视觉检查通过：无乱码、无残缺 UI、无错误品牌字母、无明显修补感。
- 移动端 User-Agent 检查通过：
  - viewport 存在
  - 新图片路径存在
  - 无禁用词
  - 无旧日期
  - 响应式 Tailwind 类存在
- 当前环境未安装 Playwright，因此没有做截图级移动端视觉回归。

### 当前 Git 状态说明

- 当前仍有一批既有未提交改动，但不是本轮官网修复产生的。
- 包括：
  - `backend/`
  - `frontend/miniprogram/`
  - `package.json`
  - `package-lock.json`
  - `CLAUDE.md`
  - `NIRA_DEV_HANDOFF.md`
  - `NIRA_PROJECT_CONTEXT.md`
- 本轮没有 stage 或提交这些无关文件。
- 后续处理官网时，要避免误提交小程序 / FastAPI / 后端相关改动。

### 后续 TODO

#### A. 官网品牌语气细化

- 当前官网已去除 `AI红娘 / 红娘 / 相亲 / 婚恋 / 牵线 / 找对象 / 脱单` 等明显不合适表达。
- 但仍存在一些偏 dating app 的词，例如“约会”“对象”。
- 下一轮可单独做一次品牌语气细化：
  - “约会” -> 根据上下文改为“见面”“现实连接”“相遇”“活动”“同行”
  - “对象” -> 根据上下文改为“合拍的人”“连接”“匹配对象”或更自然表达
- 注意不要把 Nira 改得过于抽象。Nira 当前仍然可以保留年轻人现实社交 / 见面 / 关系发生的清晰感。

#### B. Next.js 安全升级

- 当前 Next.js 版本为 `14.2.29`，Vercel 提示存在安全漏洞。
- 不要和官网稳定修复混在一起。
- 后续单独开任务：
  - 升级 Next.js 到安全版本
  - 本地 `npm run build`
  - 检查页面回归
  - 部署 Vercel
  - 线上验证 `nira.social`

## 2026-05-09 Schedule / Arrange Simple 本地联调基线

### 修改文件

- `backend/app/routers/schedule.py`
- `frontend/miniprogram/pages/schedule/schedule.js`
- `frontend/miniprogram/pages/schedule/schedule.wxml`
- `NIRA_DEV_HANDOFF.md`

### 当前 Match → Schedule 流程

1. match 页真实路径是 `frontend/miniprogram/pages/match/match.js`。
2. 用户在 match 页看到 `matchStatus === "ready"` 的匹配卡片后，可以点击“接受匹配”。
3. `onAccept()` 会记录本地匹配历史，并跳转到 `pages/schedule/schedule?matchId=<match_id>`。
4. schedule 页优先从 URL 的 `matchId/match_id` 读取 match_id；如果 URL 没有，会尝试用 `app.getCurrentMatch().match_id`。
5. 如果没有 match_id，schedule 页展示“还没有匹配结果”的清晰 fallback，不白屏。
6. schedule 页优先调用 `POST /api/v1/schedule/arrange-simple`，传入：
   - `match_id`
   - `profile_a`
   - `profile_b`
   - `compatibility`
   - `city`
7. 返回成功后，schedule 页展示活动标题、时间、地点、推荐理由、注意事项、海报文案和破冰话题。
8. 用户点击“确认活动”后，活动方案会写入 `app.setActivityPlan()`，再进入 group 页面。

### Arrange Simple 接口定义

`POST /api/v1/schedule/arrange-simple`

请求：

```json
{
  "match_id": "mock-or-real-match-id",
  "profile_a": {},
  "profile_b": {},
  "compatibility": {},
  "city": "上海"
}
```

development 行为：

- 不调用真实 DashScope/Qwen。
- 不接真实地图、位置或日历。
- 使用本地 mock 生成低压力活动安排。
- 如果缺少 `match_id`，返回 `status=missing_match` 和空 plan。

### Mock 活动安排数据结构

响应同时保留兼容旧前端的 `plan`，并提供顶层字段：

```json
{
  "activity_id": "plan-xxxx",
  "match_id": "match-xxxx",
  "status": "planned",
  "title": "咖啡散步 90 分钟",
  "activity_type": "coffee_chat",
  "suggested_time": "本周六下午 3:00",
  "suggested_location": "上海 · 愚园路附近咖啡店",
  "reason": "低压力见面，边走边聊更自然",
  "tips": ["..."],
  "plan": {
    "title": "...",
    "description": "...",
    "activity_type": "...",
    "location": "...",
    "suggested_location": "...",
    "suggested_time": "...",
    "duration": "...",
    "reason": "...",
    "status": "planned",
    "tips": []
  },
  "poster_copy": "...",
  "group_welcome": "..."
}
```

mock 活动类型会优先选择双方共同活动偏好，常见 fallback 包括咖啡散步、看展、书店/市集/Citywalk、公园散步、轻运动、桌游等。

### 小程序测试步骤

1. 启动后端：`cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8011`。
2. 临时把 `frontend/miniprogram/app.js` 的 `apiBase` 指向 `http://localhost:8011`，或继续使用 8000 已运行服务。
3. 完成手机号登录、onboarding、join queue。
4. 使用两个测试用户触发 mock weekly match，或使用本地已有 mock match。
5. 进入 match 页，看到匹配卡片后点击“接受匹配”。
6. schedule 页应展示 mock 活动安排，不白屏。
7. 如果直接进入 schedule 页但没有 match_id，应看到“还没有匹配结果”的 fallback。

### 已验证命令

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\match\match.js
Get-ChildItem frontend\miniprogram\pages\schedule -Filter *.js | ForEach-Object { node --check $_.FullName }
```

### 后端 API 测试结果

已在 8011 端口验证：

- `GET /health` 正常。
- 登录链路正常。
- `POST /api/v1/profile/build` 正常。
- `POST /api/v1/match/join-queue` 正常。
- `POST /api/v1/match/weekly` 返回 mock matched result。
- `GET /api/v1/match/result/{user_id}` 返回 matched result。
- `POST /api/v1/schedule/arrange-simple` 返回：
  - `status=planned`
  - `activity_id`
  - `match_id`
  - `title`
  - `activity_type`
  - `suggested_time`
  - `suggested_location`
  - `reason`
  - `tips`
- `POST /api/v1/schedule/arrange-simple` 缺少 `match_id` 时返回 `status=missing_match` 和空 plan。

### 遗留问题

- `POST /api/v1/schedule/arrange` 仍是数据库 match + 真实 scheduler agent 路径；本地小程序优先使用 `arrange-simple`。
- mock 活动安排不落库；只存在接口响应和小程序 `activityPlan` storage 中。
- schedule 页确认活动后进入 group 页，但 group 聊天仍是内存/本地模拟链路。
- 没有真实地图、位置中点、日历冲突检查。
- PowerShell 直接构造中文 JSON 请求时控制台显示可能乱码；小程序端 UTF-8 请求不受这个显示问题影响。

### 下一轮建议

1. 打通 `accept match → schedule confirm → group` 的端到端本地流程。
2. 给 `arrange-simple` 增加轻量测试脚本，固定 mock 响应结构。
3. 决定 Activity 是否需要落库，或继续在 MVP 阶段使用前端缓存。
4. 整理 README，把当前五轮基线同步到项目启动/联调说明。
