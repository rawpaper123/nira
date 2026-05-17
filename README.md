# Nira

Nira 当前开发主线是：

- 微信小程序：`frontend/miniprogram`
- FastAPI 后端：`backend`

根目录下的 `app/`、`components/`、`lib/` 仍保留 Next.js landing page，是官网/落地页遗留与并行模块，不是当前小程序 MVP 联调主线。

## 当前 MVP

当前本地演示链路：

登录 → onboarding → profile build → join queue → weekly mock match → match result → accept → schedule arrange-simple → confirm schedule → group

development 模式下使用 mock/fallback：

- 手机验证码固定为 `123456`
- 初始邀请码为 `NIRA2026`
- wx login 使用 mock openid fallback
- profile、match、schedule、group 都优先保证本地演示可跑通
- 不接真实微信、短信、推送、Qwen/DashScope、IM/微信群、地图或日历

## 后端启动

```bash
cd backend
.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
```

数据库迁移：

```bash
cd backend
.venv\Scripts\alembic.exe upgrade head
```

轻量检查：

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

## 小程序启动

使用微信开发者工具打开：

```text
frontend/
```

项目配置文件：

```text
frontend/project.config.json
```

小程序源码目录：

```text
frontend/miniprogram/
```

小程序默认 API base 在 `frontend/miniprogram/app.js`：

```js
globalData: {
  apiBase: 'http://localhost:8000'
}
```

如果后端临时启动在 `8011`，需要二选一：

- 临时把 `frontend/miniprogram/app.js` 的 `apiBase` 改为 `http://localhost:8011`
- 或把后端按上面的命令启动到 `8000`

前端 JS 检查：

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\login\phone\index.js
node --check frontend\miniprogram\pages\index\index.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\match\match.js
node --check frontend\miniprogram\pages\schedule\schedule.js
node --check frontend\miniprogram\pages\group\group.js
```

## MVP 演示路径

1. 启动后端到 `8000`。
2. 微信开发者工具打开 `frontend/`。
3. 清理小程序 storage。
4. 首页点击“开始匹配”。
5. 手机号登录，验证码输入 `123456`，邀请码输入 `NIRA2026`。
6. 完成 chat onboarding。
7. profile build 成功后加入本周匹配。
8. 准备第二个测试用户/profile，或用 API 触发 weekly mock match。
9. 进入 match 页面查看 match result。
10. 点击接受匹配。
11. 进入 schedule 页面查看 arrange-simple 活动安排。
12. 点击确认活动。
13. 进入 group 页面查看 mock 群信息、活动摘要和破冰问题。

## 实际小程序页面路径

当前真实页面路径是：

- `frontend/miniprogram/pages/index/index.js`
- `frontend/miniprogram/pages/login/phone/index.js`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/match/match.js`
- `frontend/miniprogram/pages/schedule/schedule.js`
- `frontend/miniprogram/pages/group/group.js`
- `frontend/miniprogram/pages/me/me.js`

项目里没有 `pages/home/index.js`，也没有 `pages/chat/index.js`。

## 关键状态约定

小程序 storage key：

- `token`
- `nira_user_id`
- `nira_openid`
- `nira_phone`
- `my_invite_code`
- `profile`
- `profileCompleted`
- `currentMatch`
- `matchResult`
- `activityPlan`
- `groupInfo`

`app.js` 会兼容 `currentMatch` / `matchResult`，并把旧的 `groupId/matchId` 规范为 `group_id/match_id`。

## Next.js Landing Page

根目录 Next.js 站点仍可单独运行：

```bash
npm install
npm run dev
```

默认地址：

```text
http://localhost:3000
```

它主要服务官网/landing page，不是当前小程序 MVP 联调入口。
