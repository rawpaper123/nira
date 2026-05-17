## 2026-05-17 Poster Local Fallback Baseline

### Git Safety

- PR #1 was merged with GitHub CLI.
- PR #1 merge commit on `main`: `35b5b541a708f48a977fa0949282759a43dbe212`.
- Poster work branch: `work/poster-local-fallback-baseline`.
- Poster branch checkpoint: `35b5b541a708f48a977fa0949282759a43dbe212`.
- Pre-poster local residual work was preserved in `stash@{0}`: `preserve residual before poster local fallback branch 2026-05-17`.
- No poster branch push was performed.
- No generated PNG, `package.json`, `package-lock.json`, real COS key, or real image API integration was submitted.

### Poster/COS Decision

This milestone intentionally implements only a local text-card fallback:

- No real image generation call.
- No real COS upload.
- No generated static poster image committed.
- No package dependency churn.
- No orchestrator runtime change.

The poster payload is a structured text card:

```json
{
  "poster": {
    "status": "mocked",
    "type": "text_card",
    "title": "Citywalk，轻松一点",
    "subtitle": "Citywalk / 看展 / 咖啡散步",
    "copy": "Nira 给你们留了一个不赶时间的开场...",
    "style": "black_white_minimal",
    "tags": ["Citywalk", "看展"]
  },
  "poster_copy": "..."
}
```

### Commits Created

- `10dad8c7029a8c8232c663d4ba4a7266cf8238d0` - `feat: add poster local fallback baseline`
  - `backend/app/agents/poster_agent.py`
  - `backend/app/routers/match.py`
  - `backend/app/routers/schedule.py`
  - `backend/app/schemas/match.py`
  - `backend/app/services/match_service.py`
- `8fb09ad410cd28964ec443738993d93fc05d5fea` - `feat: connect match poster card display`
  - `frontend/miniprogram/pages/match/match.js`
  - `frontend/miniprogram/pages/match/match.wxml`
  - `frontend/miniprogram/pages/match/match.wxss`
  - `frontend/miniprogram/pages/schedule/schedule.js`
  - `frontend/miniprogram/pages/schedule/schedule.wxml`
  - `frontend/miniprogram/pages/schedule/schedule.wxss`

### Verification Results

Backend:

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health
```

Result: passed. `/health` returned `{"status":"ok","app":"Nira","env":"development"}`.

Frontend:

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\match\match.js
node --check frontend\miniprogram\pages\schedule\schedule.js
node --check frontend\miniprogram\pages\group\group.js
```

Result: passed.

API smoke:

- `POST /api/v1/schedule/arrange-simple`: passed, returned `status=planned` and `poster.status=mocked`.
- `POST /api/v1/schedule/confirm`: passed, returned `status=group_created`.
- `GET /api/v1/match/group/{group_id}`: passed, returned `status=group_created`.

### Remaining Notes

- PowerShell console rendering can garble Chinese response text, but the backend response structure is valid and the Mini Program uses the API fields directly.
- Existing larger poster/COS residual code remains preserved in `stash@{0}` and should not be applied wholesale.
- The next safe step is to push `work/poster-local-fallback-baseline` and open a dedicated poster fallback PR after one manual Mini Program visual pass.

### Rollback

Rollback this poster branch to its start:

```bash
git reset --hard 35b5b541a708f48a977fa0949282759a43dbe212
```

Revert an individual commit:

```bash
git revert <commit_hash>
```

Restore preserved pre-poster residual work only if needed:

```bash
git stash apply stash@{0}
```

## 2026-05-17 PR Review And Poster/COS Preparation

### Git Safety

- Work branch: `work/push-notification-baseline`
- Checkpoint commit before this run: `517c86b3069ad8f2dda5ee42ee037ebd98c9f6d9`
- No push was performed.
- Staged area was empty at start and checked before commit.
- Review base: `main...HEAD` because local `main` exists at `27c95589941f8e75d2450271ca058bee3a3fe824`.

### PR Pre-Review Result

The current committed branch is suitable for PR review.

Checked:

- `git diff main...HEAD --stat`
- `git diff main...HEAD --name-only`
- secret scan over committed `HEAD`

Findings:

- No real secret/key/token found in committed files.
- No `package.json` or `package-lock.json` committed in the PR range.
- No `CLAUDE.md` or `NIRA_PROJECT_CONTEXT.md` committed in the PR range.
- No `backend/app/static/posters/*`, `poster_agent.py`, `poster_image_service.py`, or `cos_upload.py` committed.
- Submitted miniprogram images are only tiny tabBar/profile-tab icons.
- LLM provider commit is limited to config/env/requirements plus the shared provider adapter, not broad agent behavior.
- Push commits do not include poster/COS.

### Poster/COS Review Result

Poster/COS was not advanced to a code commit in this run.

Classification:

- Poster backend logic:
  - `backend/app/agents/poster_agent.py` is untracked and generates poster text via LLM.
  - It has no independent endpoint and would currently be used only through the modified orchestrator.
- COS/local storage fallback:
  - `backend/app/utils/cos_upload.py` is untracked and can fallback to local static files after it receives image bytes.
  - It does not itself create a no-provider placeholder.
- Poster image generation:
  - `backend/app/services/poster_image_service.py` is untracked and tries OpenAI image generation first, then DashScope/Wanx.
  - Without provider keys it returns `None`; this is not a complete local poster image fallback.
- Miniprogram poster display:
  - Poster display is mixed into `frontend/miniprogram/pages/chat/*` and `components/chat-bubble/*`, not a clean match-page-only feature.
- Static/generated assets:
  - `backend/app/static/posters/*.png` contains generated files around 1.3-1.5MB each.
  - These were treated as generated artifacts and were not committed.
- Package dependencies:
  - `package.json` and `package-lock.json` contain broad native image dependency churn (`canvas`, `sharp`, and transitive dependencies).
  - These are not safe to include without a dedicated dependency review.
- Mixed hunk risk:
  - `backend/app/agents/orchestrator.py` wires poster nodes directly into the match orchestration.
  - This would change match runtime behavior and could call real image/LLM providers unless further guarded.

Decision: skip poster/COS code commit for now. A safe baseline should first add a no-provider local/mock poster path, avoid static generated PNG commits, and keep orchestrator integration behind a verified development fallback.

### LLM/Agent Remaining Diff Review

Remaining agent changes were reviewed but not submitted.

Classification:

- Profile agent behavior:
  - Adds preferred name/style/gender/type extraction and photo-related fields.
  - This overlaps with existing dynamic `/profile/chat` baseline and needs separate behavioral tests.
- Compatibility scoring behavior:
  - Rewrites prompt tone and adds score calibration logic.
  - Contains an unused `math` import and should get focused tests before commit.
- Simulation behavior:
  - Rewrites simulation prompt to be much more colloquial and changes parsing resilience.
  - Needs output-quality smoke tests before being merged.
- Scheduler behavior:
  - Rewrites schedule prompt and poster/group copy style.
  - Safe only as an agent-quality milestone, not poster/COS.
- Orchestrator behavior:
  - Adds poster and poster-image nodes into the graph.
  - Not safe until poster local fallback is proven.
- Test endpoints/scripts:
  - Add poster fields to test router and test script output.
  - Should be submitted only with a verified poster/orchestrator baseline.
- Match schema/router leftovers:
  - `backend/app/schemas/match.py` changes `Field(default_factory=list)` to `[]` and removes `AcceptMatchRequest` / `RejectMatchRequest`.
  - This is a regression risk and should not be committed as-is.

### Verification Results

Backend:

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health
```

Result: passed. `/health` returned:

```json
{"status":"ok","app":"Nira","env":"development"}
```

Frontend:

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
node --check frontend\miniprogram\pages\match\match.js
node --check frontend\miniprogram\pages\schedule\schedule.js
node --check frontend\miniprogram\pages\group\group.js
node --check frontend\miniprogram\pages\me\me.js
```

Result: passed.

API smoke:

- `GET /api/v1/push/subscribers`: passed, returned one local JSON fallback subscriber.
- `POST /api/v1/push/test-match-result` with empty openid: passed, returned `status: mocked`.

### Still Uncommitted

- Poster/COS/static generated files:
  - `backend/app/agents/poster_agent.py`
  - `backend/app/services/poster_image_service.py`
  - `backend/app/utils/cos_upload.py`
  - `backend/app/static/posters/*.png`
- LLM/agent behavior:
  - `backend/app/agents/compatibility_agent.py`
  - `backend/app/agents/orchestrator.py`
  - `backend/app/agents/profile_agent.py`
  - `backend/app/agents/scheduler_agent.py`
  - `backend/app/agents/simulation_agent.py`
  - `backend/app/routers/test.py`
  - `backend/app/test_orchestrator.py`
  - `backend/app/schemas/match.py`
  - `backend/app/routers/match.py`
- Mixed frontend residue:
  - `frontend/miniprogram/app.js`
  - `frontend/miniprogram/app.wxss`
  - `frontend/miniprogram/components/chat-bubble/*`
  - `frontend/miniprogram/pages/chat/*`
  - `frontend/miniprogram/pages/index/*`
  - `frontend/miniprogram/pages/match/match.js`
  - `frontend/miniprogram/utils/api.js`
- Package/local:
  - `package.json`
  - `package-lock.json`
  - `backend/app/data/`
  - `CLAUDE.md`
  - `NIRA_PROJECT_CONTEXT.md`

### Rollback

Rollback this run:

```bash
git reset --hard 517c86b3069ad8f2dda5ee42ee037ebd98c9f6d9
```

Revert a single commit:

```bash
git revert <commit_hash>
```

Only unstage or discard a specific file:

```bash
git restore --staged <file>
git restore <file>
```

Do not run broad cleanup on untracked generated files until reviewed.

### Next Suggestions

1. Open a PR for the current branch before adding poster/COS. The committed branch is already coherent: dynamic onboarding, match/schedule/group, push baseline, provider config, and profile tab.
2. For poster/COS, first design a development-only poster text/card fallback that never calls image APIs when no explicit provider key is configured.
3. Keep static poster PNGs out of Git unless a tiny intentional placeholder is added and documented.
4. Split agent-quality changes into a later milestone, and restore `Field(default_factory=list)` plus accept/reject schema before any match schema commit.

## 2026-05-17 Multi-Milestone Cleanup

### Git Safety

- Work branch: `work/push-notification-baseline`
- Checkpoint commit before this run: `97fb9f84abc1c63ca89012c763fa0cda5c5f6a2c`
- No push was performed.
- Staged area was checked before and after each commit.
- Real secrets, `.codex`, generated poster images, package files, and mixed poster/COS work were not committed.

### Milestone Results

- Milestone 0 - Push milestone review: completed. Push commits were checked by `git show --stat` and `git show --name-only`; no package, poster/COS/static poster, me/images, broad agent refactor, or real secret was found.
- Milestone 1 - LLM/provider/config baseline: partially completed. Committed only provider configuration and the shared OpenAI-compatible fallback adapter. Broad agent prompt rewrites, poster orchestration, and test router/script changes remain uncommitted because they are behavior changes and partly poster-related.
- Milestone 2 - Poster/COS/static assets: skipped. The remaining work includes untracked poster agent/image/COS files, large generated poster PNGs under `backend/app/static/posters`, broad orchestrator changes, and package-lock churn from image dependencies. This needs a dedicated poster milestone.
- Milestone 3 - Miniprogram me/tabBar/images: completed. Added the profile tab, tabBar registration, small tabBar icons, and a minimal `switchTab` fix for the me page edit-profile action.
- Milestone 4 - Docs/handoff: completed by this section.

### Commits Created

- `7615886a47b2c80aa7234e14fa1ba550aae56979` - `feat: add configurable llm provider baseline`
  - `backend/.env.example`
  - `backend/app/agents/base.py`
  - `backend/app/core/config.py`
  - `backend/requirements.txt`
- `953a3c513a538118ea823e6ac0747a089010fe60` - `feat: add miniprogram profile tab baseline`
  - `frontend/miniprogram/app.json`
  - `frontend/miniprogram/images/chat.png`
  - `frontend/miniprogram/images/chat_active.png`
  - `frontend/miniprogram/images/home.png`
  - `frontend/miniprogram/images/home_active.png`
  - `frontend/miniprogram/images/match.png`
  - `frontend/miniprogram/images/match_active.png`
  - `frontend/miniprogram/images/me.png`
  - `frontend/miniprogram/images/me_active.png`
  - `frontend/miniprogram/pages/me/me.js`
  - `frontend/miniprogram/pages/me/me.json`
  - `frontend/miniprogram/pages/me/me.wxml`
  - `frontend/miniprogram/pages/me/me.wxss`

### LLM Provider Baseline

- `LLM_PROVIDER=auto` means DeepSeek -> OpenAI -> Qwen when keys are available.
- `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, and model names are documented as placeholders in `.env.example`; no real key was committed.
- `get_llm()` now returns a fallback adapter that can call DeepSeek/OpenAI through the OpenAI-compatible client, then fall back to Qwen.
- No real paid LLM smoke call was executed in this run.

### Miniprogram Profile Tab Baseline

- `app.json` now registers `pages/me/me` and a four-item tabBar: home, chat, match, me.
- The new `me` page reads local profile, queue, user id, and match history state from `app.js` helpers.
- The edit-profile action uses `wx.switchTab()` because `pages/chat/chat` is now a tabBar page.
- TabBar icons are small local PNG assets, each under 300 bytes.

### Verification Results

Backend:

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health
```

Result: passed. `/health` returned:

```json
{"status":"ok","app":"Nira","env":"development"}
```

Frontend:

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
node --check frontend\miniprogram\pages\match\match.js
node --check frontend\miniprogram\pages\schedule\schedule.js
node --check frontend\miniprogram\pages\group\group.js
node --check frontend\miniprogram\pages\me\me.js
```

Result: passed.

Additional check:

```bash
node -e "parse app.json and verify registered pages/tabBar icon files exist"
```

Result: passed.

### Still Uncommitted

- LLM/agent behavior work: prompt and scoring changes in `backend/app/agents/compatibility_agent.py`, `profile_agent.py`, `scheduler_agent.py`, `simulation_agent.py`, plus poster-related `orchestrator.py`.
- Poster/COS/static: `poster_agent.py`, `poster_image_service.py`, `cos_upload.py`, `backend/app/static/posters/*.png`.
- Push/generated local data: `backend/app/data/`.
- Mixed frontend residue: `frontend/miniprogram/app.js`, `app.wxss`, `components/chat-bubble/*`, `pages/chat/*`, `pages/index/*`, `pages/match/match.js`, `utils/api.js`.
- Package files: `package.json`, `package-lock.json`; not submitted because the diff includes broad Next/package metadata and native image dependencies.
- Docs/local: `CLAUDE.md`, `NIRA_PROJECT_CONTEXT.md`.

### Rollback

Rollback this multi-milestone run to the checkpoint:

```bash
git reset --hard 97fb9f84abc1c63ca89012c763fa0cda5c5f6a2c
```

Revert a single commit while preserving history:

```bash
git revert <commit_hash>
```

Only unstage files:

```bash
git restore --staged <file>
```

Only discard a specific uncommitted file:

```bash
git restore <file>
```

Do not remove untracked/generated files automatically unless reviewed first; if the user approves cleanup later, use a targeted remove command instead of broad `git clean -fd`.

### Next Suggestions

1. Run a dedicated poster/COS milestone: fix encoding/readability, separate backend poster text fallback from real image generation, avoid committing generated PNGs by default, and decide whether package image dependencies are truly needed.
2. Run a dedicated agent-quality milestone for compatibility/simulation/scheduler prompt changes without mixing poster orchestration.
3. Review mixed frontend visual changes (`app.wxss`, index styles, chat-bubble poster display) with a UI-specific acceptance pass before committing.
4. Once the current branch is reviewed, consider opening a PR rather than continuing to stack unrelated feature commits.

## 2026-05-17 Push Notification Baseline Milestone

### Git Safety

- Work branch: `work/push-notification-baseline`
- Checkpoint commit before this milestone: `27c95589941f8e75d2450271ca058bee3a3fe824`
- No push was performed.
- Staged area was checked before and after each commit.
- `.codex`, package files, poster/COS assets, broad LLM provider changes, and generated static assets were not committed.

### Review Scope

Push-related backend files reviewed:

- `backend/app/main.py`
- `backend/app/routers/push.py`
- `backend/app/services/push_service.py`
- `backend/app/services/match_service.py`
- `backend/app/core/config.py`
- `backend/.env.example`
- existing `PushSubscription` model and migration state

Push-related frontend files reviewed:

- `frontend/miniprogram/app.js`
- `frontend/miniprogram/utils/api.js`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/chat/chat.wxml`
- `frontend/miniprogram/pages/chat/chat.wxss`
- `frontend/miniprogram/pages/match/match.js`

Explicitly not included:

- poster agent/image/COS/static poster assets
- `frontend/miniprogram/images/*`
- `frontend/miniprogram/pages/me/*`
- `package.json` / `package-lock.json`
- broad LLM provider and agent refactors
- `CLAUDE.md`
- `NIRA_PROJECT_CONTEXT.md`

### Push Backend Design

- `backend/app/main.py` now registers `push.router`.
- `backend/app/routers/push.py` exposes development-safe push endpoints.
- `backend/app/services/push_service.py` stores subscriptions in a local JSON file fallback at `backend/app/data/subscriptions.json`.
- Real WeChat subscription-message calls are attempted only when `openid`, `WX_APPID`, `WX_SECRET`, and `WX_TEMPLATE_ID_MATCH` are available.
- Missing WeChat credentials do not block local demo; development endpoints return `mocked`.
- `backend/app/services/match_service.py` can call push notification after non-development weekly match generation, and catches failures so matching is not blocked.
- Existing `PushSubscription` model and Alembic migration already exist; this milestone kept the runtime service on JSON fallback and did not add a migration.

Backend endpoints:

- `POST /api/v1/push/subscribe`
- `GET /api/v1/push/subscription/{user_id}`
- `GET /api/v1/push/subscribers`
- `POST /api/v1/push/match-result`
- `POST /api/v1/push/test-match-result`
- `POST /api/v1/push/test`

### Miniprogram Push Entry

- `app.js` adds `sendSubscribeRequest()` and `handlePushEntry()`.
- `api.js` adds `subscribeNotification()`, `sendMatchPush()`, and `testMatchPush()`.
- `chat` page asks for subscription when joining queue; if no template id is configured, it safely skips and continues joining.
- `chat` page has a local development push test panel after profile is ready and the user is queued.
- `chat` push entry avoids poster-specific rendering in this committed baseline and routes users to the match result page.
- `match` page logs when opened from push and continues using existing match-result fallback behavior.

### Commits Created

- `491b3831044a4b52dd56d875bf7385c867fc91df` - `feat: add backend push subscription baseline`
- `f60b7080d28cf8615b59f056f2f70c2245be7985` - `feat: connect miniprogram push entry`

### Verification Results

Backend:

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health
```

Result: passed. `/health` returned:

```json
{"status":"ok","app":"Nira","env":"development"}
```

Frontend:

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
node --check frontend\miniprogram\pages\match\match.js
```

Result: passed.

API smoke:

```json
{
  "health": "ok",
  "subscribers_initial": {"status": "ok", "total": 0},
  "subscribe": {"status": "ok", "message": "subscription recorded"},
  "subscription_read": {"status": "ok", "subscribed": true},
  "match_result_without_openid": {"status": "mocked"},
  "test_match_result_without_openid": {"status": "mocked"},
  "test_without_credentials": {"status": "mocked"}
}
```

No real WeChat production API call was required for the smoke path.

### Still Uncommitted

Remaining working-tree changes are intentionally uncommitted because they are outside this push baseline or still mixed:

- broad LLM/provider changes in `backend/app/agents/*`, `backend/app/core/config.py`, `backend/.env.example`, and `backend/requirements.txt`
- poster/COS files: `poster_agent.py`, `poster_image_service.py`, `cos_upload.py`, `backend/app/static/*`
- miniprogram visual/tabBar/me/images changes
- package files
- `CLAUDE.md`
- `NIRA_PROJECT_CONTEXT.md`
- residual mixed hunks in `app.js`, `api.js`, `chat/*`, `match.js`, and index styling files
- generated smoke data under `backend/app/data/`, not committed

### Rollback

Rollback the entire milestone to the checkpoint:

```bash
git reset --hard 27c95589941f8e75d2450271ca058bee3a3fe824
```

Remove uncommitted/generated files after reviewing them:

```bash
git clean -fd
```

Only unstage files:

```bash
git restore --staged <file>
```

Only discard a specific uncommitted file:

```bash
git restore <file>
```

### Next Suggestions

1. Decide whether push subscriptions should stay JSON fallback for MVP or move to the existing `push_subscriptions` DB table.
2. Add a small backend test for `/api/v1/push/subscribe`, `/subscription/{user_id}`, and development `mocked` push responses.
3. Configure a real `WX_TEMPLATE_ID_MATCH` only when ready for a device test, then verify on a logged-in WeChat developer account.
4. Keep poster/COS and LLM provider commits separate from push.

## 2026-05-16 Autonomous Commit Split

### Scope

Safely split the already-verified working tree into small commits without pushing. The goal was to avoid mixing dynamic onboarding, match/schedule/group demo stabilization, docs, push/poster work, and broader LLM/provider experiments.

### Commits Created

- `12dea4e8d03369d39bd3627859d56d0d046685c2` - `feat: connect miniprogram chat to dynamic onboarding`
- `f0ebe2e89cf2257b8dcad13a393f2061b85609bc` - `feat: stabilize demo match schedule group flow`

Commit A was already present before this round:

- `3827e0195ed894ddaf1b54af6168f6b9271f98bc` - `feat: add dynamic profile chat onboarding`

### Commit B Notes

Committed only the miniprogram dynamic onboarding UI boundary:

- `frontend/miniprogram/app.js`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/chat/chat.wxml`
- `frontend/miniprogram/pages/chat/chat.wxss`
- `frontend/miniprogram/pages/index/index.js`
- `frontend/miniprogram/utils/api.js`

The staged version was manually split from mixed working-tree changes. Excluded push/poster/test-push content and removed the old fixed-step `buildProfile` onboarding block from the staged commit.

### Commit C Notes

Committed the local demo match/schedule/group boundary:

- `backend/app/routers/match.py`
- `backend/app/routers/schedule.py`
- `backend/app/schemas/match.py`
- `backend/app/services/match_service.py`
- `frontend/miniprogram/app.js`
- `frontend/miniprogram/pages/group/group.js`
- `frontend/miniprogram/pages/group/group.wxml`
- `frontend/miniprogram/pages/group/group.wxss`
- `frontend/miniprogram/pages/match/match.js`
- `frontend/miniprogram/pages/match/match.wxml`
- `frontend/miniprogram/pages/match/match.wxss`
- `frontend/miniprogram/pages/schedule/schedule.js`
- `frontend/miniprogram/pages/schedule/schedule.wxml`
- `frontend/miniprogram/pages/schedule/schedule.wxss`
- `frontend/miniprogram/utils/api.js`

The staged version excluded push notification API/client handling, `push_service` calls, `handlePushEntry`, and `testMatchPush`. It also kept `Field(default_factory=list)` behavior out of the staged schema regression risk.

### Validation Results

Commit B validation passed:

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health
```

Commit C validation passed:

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\match\match.js
node --check frontend\miniprogram\pages\schedule\schedule.js
node --check frontend\miniprogram\pages\group\group.js
```

`/health` returned:

```json
{"status":"ok","app":"Nira","env":"development"}
```

### Still Uncommitted

The following categories remain intentionally uncommitted:

- Push notification router/service/client hooks and WeChat subscription entry handling.
- Poster/image/COS/static poster assets.
- Broad LLM provider/config/agent changes.
- `package.json` / `package-lock.json`.
- `CLAUDE.md`, ECC/Codex-related files, generated assets, and untracked pages/images.
- Residual working-tree hunks in files that were partially staged for clean commit boundaries.

### Next Suggestion

Review the remaining diff by feature area before committing anything else. The safest next candidates are either a dedicated push-notification commit after verifying the router/service end to end, or a dedicated LLM-provider commit after removing any sensitive keys and confirming fallback behavior.

## 2026-05-16 Dynamic Onboarding to Match Regression

### 本轮目标

回归验证动态 onboarding 不破坏后续主链路：profile ready → join queue → waiting/match result → accept → schedule → confirm → group。本轮不新增功能、不重构、不接真实服务。

### 本轮是否完整回归

已通过本地 API smoke 完整跑通：

动态 `/profile/chat` 建档 → `GET /profile/{user_id}` 校正 ready 状态 → `join-queue` → 重复入队 → 单人 waiting → 第二测试用户入队 → weekly mock match → match result → accept match → arrange-simple → schedule confirm → group read。

### 本轮修改文件

- `NIRA_DEV_HANDOFF.md`

本轮未修改业务代码、前端页面、数据库或 agent 架构。

### API Smoke 结果

```json
{
  "user_a": "a4f5f2d7-a4aa-40da-b9e4-0d56fadedca2",
  "first_ready": false,
  "first_profile_completed": false,
  "after_first_get_completed": false,
  "final_ready": true,
  "final_get_completed": true,
  "preferred_name": "Raw",
  "preferred_type": "friends/activity_partner",
  "joinA": "joined",
  "repeatA": "already_joined",
  "waiting_before_second_user": "waiting",
  "joinB": "joined",
  "weekly_status": "matched",
  "match_result_status": "matched",
  "match_id": "50a85cf3-8d8b-4c83-b443-74fcc6db758d",
  "accept_status": "accepted_first",
  "accept_group_id": "group-da1074c8463d",
  "arrange_status": "planned",
  "confirm_status": "group_created",
  "confirm_group_id": "group-50a85cf3-c0006d",
  "group_status": "group_created"
}
```

覆盖的真实聊天输入：

- `我叫小然，平时喜欢 citywalk 和看展`
- `不是，我刚刚说错了，我叫 Raw`
- `我只想找一起玩的朋友，不想太像约会`
- `女生男生都可以，主要是聊得来`
- `我工作日晚上或者周末下午比较方便`
- `我不喜欢酒吧，太吵了`
- `对了，我最近更想找看展搭子`

### 发现的问题

- 未发现需要本轮修复的动态 onboarding → 入队 → 匹配 → 活动 → group 阻塞问题。
- PowerShell 终端在部分中文响应输出中仍可能出现显示乱码，这是控制台编码显示问题，不影响 API 字段和链路状态。
- development weekly mock 当前会从数据库已有 `UserProfile` 中找候选，不严格限定“本轮新入队用户”。本轮 smoke 可稳定生成结果，暂记录为 dev mock 行为，不在本轮改结构。

### 验证命令结果

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health

node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
node --check frontend\miniprogram\pages\match\match.js
node --check frontend\miniprogram\pages\schedule\schedule.js
node --check frontend\miniprogram\pages\group\group.js
```

结果：全部通过。`/health` 返回 `{"status":"ok","app":"Nira","env":"development"}`。

### 遗留问题

- 微信开发者工具 GUI 点击链路仍需要人工确认；之前 CLI/automation 连接存在 IDE port timeout，不属于 Nira 业务代码错误。
- 当前 `/profile/chat` 仍是规则型 development parser，不是真实 LLM JSON extraction。
- match / schedule / group 的部分状态仍是 development 内存态，服务重启后会丢失。

### 下一轮建议

1. 在微信开发者工具里人工跑一遍动态 onboarding → 入队 → match → schedule → group，若有真实 UI 报错再做最小修复。
2. 给 `/profile/chat` 和 MVP 全链路补轻量自动化回归脚本，固定本轮 smoke 用例。
3. 后续若要提升 weekly mock 稳定性，可让 development match 优先使用当前队列用户，再回退到数据库 mock 候选。

## 2026-05-16 Dynamic Onboarding Conversation Quality v1

### 本轮目标

优化本地 mock 动态 onboarding 的自然度、字段提取稳定性和建档状态展示。不接真实 Qwen/DashScope，不改数据库结构，不重构 agent。

### 本轮修改文件

- `backend/app/services/profile_service.py`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/chat/chat.wxml`
- `frontend/miniprogram/pages/chat/chat.wxss`
- `frontend/miniprogram/pages/index/index.js`
- `NIRA_DEV_HANDOFF.md`

### 对话质量优化点

- 回复不再默认反复说“我记下了”，改成按当前 patch 类型生成更自然的短回复。
- 每轮最多追问一个缺失重点，按缺失顺序问：称呼、兴趣、搭子方向/性别偏好、时间。
- 纠正姓名时明确表达“覆盖旧称呼”，避免用户感觉系统新增了一个名字。
- 用户跳过或不想回答时允许先放着，不强迫推进。
- ready 后回复提示“可以加入本周匹配，也可以继续改偏好”。

### 字段提取规则更新

- preferred_name 支持：`叫我 Raw`、`我是 Raw`、`名字改成 Raw`、`别叫我小然，名字改成 Raw`。
- interests/activity_types 补充支持：citywalk、看展、书店、咖啡、徒步、市集、livehouse、电影、桌游、运动等。
- preferred_type 支持：朋友、搭子、饭搭子、运动搭子、展览搭子、看展搭子、恋爱、暧昧、随缘。
- preferred_gender 支持：男生、女生、都可以、不限、无所谓。
- availability 支持：工作日晚上、平时晚上、下班后、周末、周末下午、最近都行。
- negative_preferences 支持：不喜欢、不想、不要、雷、别安排、太吵、酒吧、相亲感、约会感。

### Ready 规则

本轮将 ready 判断从“分数足够”收紧为四项全部具备：

1. `preferred_name`
2. `interests` 至少 1 个
3. `preferred_type` 或显式 `preferred_gender` 至少 1 个
4. `availability` 有时间信息

用户表达 `都可以` / `不限` / `随缘` 视为有效偏好。

### 小程序展示变化

- chat 页增加轻量提示文案：ready 前显示“再聊两句，Nira 就能帮你加入本周匹配”。
- ready 后提示“信息够用了，可以加入本周匹配；想改偏好也可以继续聊”。
- ready 后仍保留“继续修改偏好”入口，点击后恢复输入框继续调用 `/profile/chat`。
- 首页 `restoreRemoteProfile()` 不再因为本地 `profileCompleted=true` 就跳过后端；登录后优先用 `GET /profile/{user_id}` 校正本地状态，避免旧缓存误判。

### API Smoke 结果

主用例 A-H 已通过：

```json
{
  "A_ready": false,
  "A_missing": "preferred_type_or_gender,availability",
  "A_profile_completed": false,
  "after_A_get_completed": false,
  "B_name": "Raw",
  "C_ready": false,
  "C_type": "friends/activity_partner",
  "D_gender": "any",
  "E_ready": true,
  "E_weekdays": "evening",
  "E_weekends": "afternoon",
  "G_completed": true,
  "H_ready": true,
  "H_type": "friends/activity_partner",
  "join_status": "joined",
  "repeat_status": "already_joined"
}
```

额外边界用例已通过：

- `别叫我小然，名字改成 Raw` -> preferred_name 覆盖为 `Raw`
- `饭搭子运动搭子都可以，随缘一点` -> preferred_type 为 `friends/activity_partner`
- `我下班后或者最近都行` -> weekdays evening + flexible
- `别安排酒吧，也不要相亲感` -> negative_preferences 包含酒吧 / 相亲感

### 验证命令结果

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health

node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
```

结果：全部通过。`/health` 返回 `{"status":"ok","app":"Nira","env":"development"}`。

### 遗留问题

- 当前仍是规则型 mock parser，不是真实 LLM JSON extraction。
- `chat.js` 里旧的 `handleNicknameReply/followUp/buildProfile` 兜底函数仍保留，主链路不再使用，后续可小范围清理。
- 微信开发者工具 CLI 仍可能出现 IDE port timeout，真实 GUI 点击需要人工确认。

### 下一轮建议

1. 给 `/api/v1/profile/chat` 写后端自动化测试，覆盖 A-H 和额外边界用例。
2. 在不破坏 mock fallback 的前提下接入 LLM JSON extraction。
3. 清理 chat 页旧兜底问卷函数，减少维护噪音。

## 2026-05-16 Dynamic Onboarding UI Experience Check

### 本轮目标

做动态 onboarding 小程序 UI 真实体验检查，只修影响真实点击体验的最小问题，不新增功能、不改数据库、不重构 agent。

### 本轮实际检查的 UI 路径

1. 小程序 `pages/chat/chat` 首次进入文案与输入框状态。
2. 用户发送自然语言消息后，`chat.js -> api.profileChat() -> POST /api/v1/profile/chat`。
3. 后端返回 `reply/profile_patch/profile/completion` 后，chat 页展示 AI 回复并更新本地 `profile/profilePatch/profileCompleted`。
4. `completion.is_ready=false` 时继续显示聊天输入框。
5. `completion.is_ready=true` 时显示“加入本周匹配队列”和“继续修改偏好”入口。
6. ready profile 回首页后，首页可加入队列；重复加入保持 `already_joined`。

### 发现的问题

- chat 首屏欢迎语仍偏“固定问卷第一题”，会引导用户只回答昵称，不符合动态建档体验。
- `onSend()` 主链路已经调用后端，但函数内仍保留 unreachable 的旧 step 问卷分支，容易造成后续维护误判。
- `/profile/chat` 返回的 `profile` 没有直接携带 `profile_completed`，虽然前端用 `completion` 可以判断，但 storage 中 profile 状态不够自描述。

### 修复文件

- `frontend/miniprogram/pages/chat/chat.js`
- `backend/app/services/profile_service.py`
- `NIRA_DEV_HANDOFF.md`

### 修复内容

- chat 默认 placeholder 改为开放式输入：“随便说说你自己，Nira 会边聊边整理”。
- chat 首次欢迎语改为自然说明：可以聊活动、想认识的人、时间偏好，不用按表格填。
- 删除 `onSend()` 里的旧固定 step 问卷推进分支；现在发送消息只走 `sendProfileChat()`。
- `loadChatHistory()` 会恢复 `nira_profile_conversation_id`，便于继续同一轮本地对话。
- `/profile/chat` 返回的 `profile` 增加 `profile_completed`，与 `completion.is_ready` 保持一致。

### 动态 onboarding 当前真实体验

- 用户输入“我叫小然，平时喜欢 citywalk 和看展”：后端返回自然回复，继续轻量追问缺失的搭子方向；不会直接判定完成。
- 用户输入“不是，我刚刚说错了，我叫 Raw”：preferred_name 覆盖为 Raw，不会把 Raw 当成兴趣或下一题答案。
- 用户输入“我只想找一起玩的朋友，不想太像约会”：preferred_type 更新为 `friends/activity_partner`，negative preferences 记录约会感相关偏好。
- 用户输入“女生男生都可以，主要是聊得来”：preferred_gender 为 `any`，preference_notes 记录“主要看聊不聊得来”。
- 用户输入“我工作日晚上或者周末下午比较方便”：availability 写入 weekdays evening / weekends afternoon。
- 用户输入“我不喜欢酒吧，太吵了”：negative preferences 包含酒吧 / 太吵。
- ready 后 chat 页显示加入队列入口，也保留继续修改偏好入口。

### API 测试结果

本轮在 `http://localhost:8000` 完成 smoke：

```json
{
  "A_ready": false,
  "A_profile_completed": false,
  "after_A_get_completed": false,
  "B_name": "Raw",
  "C_type": "friends/activity_partner",
  "D_gender": "any",
  "E_weekdays": "evening",
  "E_weekends": "afternoon",
  "final_ready": true,
  "final_profile_completed": true,
  "join_status": "joined",
  "repeat_status": "already_joined"
}
```

### 验证命令结果

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health

node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
```

结果：全部通过。`/health` 返回 `{"status":"ok","app":"Nira","env":"development"}`。

### 遗留问题

- 本轮仍未做微信开发者工具 GUI 点击自动化；当前是代码路径检查 + API smoke + JS 静态检查。
- 已找到微信开发者工具 CLI：`C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`，但本轮执行 `islogin/open --project C:\Users\rawle\nira\frontend --port 9420` 均返回 `wait IDE port timeout`，未能建立 IDE 自动化连接。
- `chat.js` 中旧的 `handleNicknameReply/followUp/buildProfile` 等兜底函数仍保留，但主发送链路已不再引用。下一轮可在 UI 稳定后小范围清理。
- 当前 `/profile/chat` 仍是规则型 development parser，不是真正 LLM JSON extraction。

### 下一轮建议

1. 在微信开发者工具里手动点击一次 chat UI，确认首屏文案、输入、ready CTA、继续修改偏好按钮都符合预期。
2. 给 `/api/v1/profile/chat` 的 A-F 用例补后端自动化测试。
3. 在保留 fallback 的前提下接入 LLM JSON extraction，让 mock parser 只作为兜底。

# Nira Dev Handoff

## 启动方式

### 后端

```bash
cd backend
.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
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

## 2026-05-09 Accept Match / Schedule Confirm / Group 本地联调基线

### 本轮修改文件

- `backend/app/routers/schedule.py`
- `backend/app/services/match_service.py`
- `frontend/miniprogram/utils/api.js`
- `frontend/miniprogram/pages/match/match.js`
- `frontend/miniprogram/pages/schedule/schedule.js`
- `frontend/miniprogram/pages/schedule/schedule.wxml`
- `frontend/miniprogram/pages/group/group.js`
- `frontend/miniprogram/pages/group/group.wxml`
- `frontend/miniprogram/pages/group/group.wxss`
- `NIRA_DEV_HANDOFF.md`

### 当前 accept match → schedule confirm → group 流程

1. match 页面展示 `matched` 结果后，点击“接受匹配”。
2. 小程序调用 `POST /api/v1/match/accept`，请求 `{ match_id, user_id, role }`。
3. 后端 `match_service.accept_match()` 使用进程内存记录 accepted 状态，并返回稳定 `group_id`。
4. match 页面缓存 `groupInfo`，随后进入 `pages/schedule/schedule?matchId=<match_id>`。
5. schedule 页面调用既有 `POST /api/v1/schedule/arrange-simple`，展示 mock 活动安排。
6. 点击“确认这个安排”后，小程序调用新增 `POST /api/v1/schedule/confirm`。
7. schedule confirm 返回 mock group 数据，并通过 `app.setGroupInfo()` 缓存。
8. 小程序跳转 `pages/group/group?group_id=<group_id>&match_id=<match_id>`。
9. group 页面优先使用缓存 group 数据；如有 `group_id`，也会调用 `GET /api/v1/match/group/{group_id}` 刷新。没有参数时显示明确 fallback，不白屏。

### 新增或修复的接口定义

- `POST /api/v1/schedule/confirm`
  - 请求字段：`match_id`、`activity_id` 或 `plan_id`、`plan`、`group_welcome`、可选 `members`。
  - 返回字段：`group_id`、`match_id`、`activity_id`、`plan_id`、`group_name`、`members`、`welcome_message`、`icebreaker_questions`、`activity_summary`、`status`、`messages`。
- `GET /api/v1/match/group/{group_id}` 现在会返回更完整的 mock group 信息，包括 group 名称、成员、欢迎语、破冰问题、活动摘要和消息。

### Group mock 数据结构

```json
{
  "group_id": "group-xxxx",
  "match_id": "match-xxxx",
  "activity_id": "plan-xxxx",
  "plan_id": "plan-xxxx",
  "group_name": "Nira 活动搭子小队",
  "members": [
    { "role": "me", "name": "你", "status": "accepted" },
    { "role": "partner", "name": "活动搭子", "status": "invited" },
    { "role": "assistant", "name": "Nira", "status": "online" }
  ],
  "welcome_message": "你们这次的见面已经安排好啦。先不用急着尬聊，Nira 给你们准备了几个轻松开场。",
  "icebreaker_questions": [],
  "activity_summary": {
    "title": "轻量活动安排",
    "activity_type": "coffee_chat",
    "suggested_time": "本周末下午",
    "suggested_location": "交通方便的公共地点",
    "reason": "先用低压力的方式见一面，不把行程排太满。",
    "tips": []
  },
  "status": "group_created",
  "messages": []
}
```

### 小程序测试步骤

1. 启动后端：`cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8011`。
2. 如使用 8011，临时确认 `frontend/miniprogram/app.js` 的 `globalData.apiBase` 指向 `http://localhost:8011`。
3. 完成手机号登录，验证码 `123456`，邀请码 `NIRA2026`。
4. 完成 onboarding/profile。
5. 加入本周匹配队列，并用两个测试用户触发 mock weekly match。
6. 进入 match 页面，看到匹配卡片后点击“接受匹配”。
7. 应进入 schedule 页面并展示 mock 活动安排。
8. 点击“确认这个安排”。
9. 应进入 group 页面，看到 mock 群信息、活动摘要、欢迎语、破冰问题和本地聊天输入框。
10. 若直接进入 group 且没有 `group_id` / 缓存，应显示“还没有确认活动安排”的 fallback。

### 后端 API 测试结果

已在 8011 临时服务上验证：

- `GET /health` 返回 `ok`。
- mock wx login、手机号验证码登录、`NIRA2026` 邀请码链路正常。
- `POST /api/v1/profile/build` 正常。
- `POST /api/v1/match/join-queue` 两个测试用户均返回 `joined`。
- `POST /api/v1/match/weekly` 返回 `matched`。
- `GET /api/v1/match/result/{user_id}` 返回 `matched` 和 `match_id`。
- `POST /api/v1/match/accept` 返回 `accepted_first` 和 `group_id`。
- `POST /api/v1/schedule/arrange-simple` 返回 `planned` 和 `activity_id`。
- `POST /api/v1/schedule/confirm` 返回 `group_created` 和新的 `group_id`。
- `GET /api/v1/match/group/{group_id}` 返回 `group_created` 和 `Nira 活动搭子小队` mock 数据。

### 已验证命令

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\match\match.js
node --check frontend\miniprogram\pages\schedule\schedule.js
Get-ChildItem frontend\miniprogram\pages\group -Filter *.js | ForEach-Object { node --check $_.FullName }
```

### 遗留问题

- 当前 accept/group 状态仍是进程内存，服务重启后会丢失。
- `schedule/confirm` 不落库，group mock 数据只服务本地联调。
- 当前没有真实 IM、微信群、微信订阅消息、地图、位置中点、日历能力。
- `POST /api/v1/match/accept` 目前没有校验当前登录 token 与 `user_id` 的归属关系。
- 单人接受后本地仍允许进入 schedule/group，这是本轮为打通单端联调保留的 development 行为。

### 下一轮建议

1. 给 accept / schedule confirm / group 增加轻量 API 测试脚本，固定本地 smoke 流程。
2. 决定 Match accepted/scheduled/group_created 状态是否需要正式落库。
3. 决定 Activity / Schedule 是否需要正式表结构，还是继续使用前端缓存到 MVP 规则稳定。
4. 梳理 group 页后续真实 IM 接入边界，但暂时不要在本地基线里接真实服务。

## 2026-05-10 端到端 MVP 演示链路稳态修复

### 本轮修改文件

- `frontend/miniprogram/app.js`
- `frontend/miniprogram/utils/api.js`
- `frontend/miniprogram/pages/index/index.js`
- `frontend/miniprogram/pages/index/index.wxml`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/match/match.js`
- `frontend/miniprogram/pages/match/match.wxml`
- `backend/app/routers/match.py`
- `NIRA_DEV_HANDOFF.md`

### 当前完整 MVP 演示链路

登录 → onboarding → profile build → join queue → weekly mock match → match result → accept → schedule arrange-simple → confirm schedule → group。

小程序端当前状态：

1. 未登录用户从首页点击“开始匹配”，进入手机号登录。
2. 手机号登录使用验证码 `123456` 和邀请码 `NIRA2026`。
3. 登录后进入 chat onboarding；如果本地或后端已有 profile，不再反复进入 onboarding。
4. onboarding 完成后写入 `profile/profileCompleted`，首页显示“加入本周匹配”。
5. 加入队列后首页显示“已加入本周匹配队列”，并提供“查看匹配状态”。
6. match 页面优先读本地 `matchResult/currentMatch`，没有缓存再读 `GET /api/v1/match/result/{user_id}`。
7. 暂无匹配时显示 waiting，不白屏。
8. development 下可通过 weekly mock 生成匹配结果。
9. 接受匹配后进入 schedule 页面。
10. schedule 页面使用 `arrange-simple` 展示低压力活动安排。
11. 确认活动后进入 group 页面。
12. group 页面展示 mock 群信息、活动摘要、破冰问题和本地聊天 fallback。

### 已统一的 storage key / API 方法

Storage key：

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

兼容处理：

- `app.setCurrentMatch()` 同时写入 `currentMatch` 和 `matchResult`。
- `app.getCurrentMatch()` 会兼容读取 `currentMatch` 或 `matchResult`。
- `app.setGroupInfo()` 会把旧写法 `groupId/matchId/activityId/planId` 规范为 `group_id/match_id/activity_id/plan_id`。
- `app.resetProfile()` 会同步清理 `matchResult/activityPlan/groupInfo`，避免演示切用户时残留。

API 方法：

- `login`
- `sendVerificationCode`
- `verifyCodeAndLogin`
- `buildProfile`
- `getProfile`
- `joinQueue`
- `getMatchResult`
- `weeklyMatch`
- `runWeeklyMatch` / `triggerWeeklyMatch`：`weeklyMatch` 的清晰别名
- `acceptMatch`
- `arrangeActivitySimple`
- `arrangeSimple`：`arrangeActivitySimple` 的清晰别名
- `confirmSchedule`
- `getGroupInfo`
- `getGroup` / `readGroup`：`getGroupInfo` 的清晰别名

### 已修复的 fallback / loading / error

- 首页远端恢复 profile 时显示“正在恢复档案...”。
- 已完成 profile 但 chat 记录为空时，不再重新进入 onboarding，而是显示可加入队列的完成态。
- match 页面未登录时显示明确引导，不继续盲查接口。
- match 页面接受按钮增加 `accepting` 状态，防止重复点击。
- match 页面重试会清理旧 timeout，并回到 `loading` 状态。
- accept 缺少 `match_id/user_id` 时返回 `missing_match/missing_user`，不创建空 group。
- reject 缺少 `match_id` 时返回 `missing_match`。
- groupInfo 缓存兼容旧 camelCase key，避免从 chat 推送路径进入 group 时丢参数。

### API smoke 测试结果

已在 8011 临时服务上验证：

- `/health`：`ok`
- mock wx login：返回 openid
- send verification code：`success=true`
- verify code and login：`success=true`
- profile build：成功
- profile read：成功
- join queue：`joined`
- repeat join queue：`already_joined`
- single-user match result：`waiting`
- 第二测试用户加入队列：`joined`
- weekly mock match：`matched`
- matched result：`matched`
- accept match：`accepted_first`
- accept 缺参：`missing_match`
- arrange-simple：`planned`
- arrange-simple 缺 `match_id`：`missing_match`
- schedule confirm：`group_created`
- schedule confirm 缺 `match_id`：`missing_match`
- group read：`group_created`

### 已验证命令

后端：

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

前端：

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

### 手动演示步骤

1. 启动后端：
   ```bash
   cd backend
   .venv\Scripts\uvicorn.exe app.main:app --reload --port 8011
   ```
2. 打开微信开发者工具，载入 `frontend/`。
3. 如使用 8011，临时确认 `frontend/miniprogram/app.js` 的 `globalData.apiBase` 指向 `http://localhost:8011`。
4. 清理小程序 storage，尤其是 `profile/profileCompleted/currentMatch/matchResult/activityPlan/groupInfo/joinedQueue`。
5. 首页点击“开始匹配”，进入手机号登录。
6. 输入手机号，验证码 `123456`，邀请码 `NIRA2026`。
7. 登录后进入 chat onboarding，按提示输入昵称、兴趣、时间、搭子偏好、风格偏好。
8. 画像生成后点击“加入本周匹配队列”。
9. 首页应显示“已加入本周匹配队列”。
10. 准备第二个测试用户/profile，或用 API 触发 `POST /api/v1/match/weekly` 生成 mock match。
11. 进入 match 页面查看匹配卡片。
12. 点击“接受匹配”。
13. 进入 schedule 页面，查看活动安排。
14. 点击“确认这个安排”。
15. 进入 group 页面，查看 mock 群信息、活动摘要、破冰问题。

### 遗留问题

- 演示链路依然依赖 development/mock；没有真实微信登录、短信、推送、IM、地图、日历或 Qwen/DashScope。
- 队列、accept/group 状态仍是进程内存，后端重启会丢失。
- weekly mock match 依赖本地库里存在第二个测试 profile；单用户时会稳定返回 waiting。
- token 仍只由前端存储和注入，后端业务接口没有统一鉴权。
- `app.js` 默认 `apiBase` 仍是 `http://localhost:8000`；使用 8011 演示时需临时调整，或启动后端到 8000。

### 下一轮建议

1. 增加一个后端 smoke 脚本，固定一键跑完整 MVP 演示链路。
2. 增加小程序开发环境“演示重置”入口，清理 storage 更方便。
3. 梳理 README，把当前 MVP 演示路径和 8011/8000 端口说明同步进去。
4. 决定 queue/match/group 是否需要最小落库，以支持服务重启后的演示稳定性。

## 2026-05-10 演示前最终检查 / README 对齐

### 本轮修改文件

- `README.md`
- `NIRA_DEV_HANDOFF.md`

### README 更新内容

- 明确当前开发主线是 `frontend/miniprogram` 微信小程序 + `backend` FastAPI。
- 明确根目录 `app/`、`components/`、`lib/` 是 Next.js landing page 遗留/并行模块，不是当前小程序 MVP 联调主线。
- 写清后端启动方式：
  ```bash
  cd backend
  .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
  ```
- 写清健康检查：
  ```bash
  curl http://localhost:8000/health
  ```
- 写清微信开发者工具打开目录是 `frontend/`。
- 写清小程序默认 API base 在 `frontend/miniprogram/app.js`，当前为 `http://localhost:8000`。
- 写清如果后端临时使用 `8011`，需要临时改 `app.js` 的 `apiBase`，或把后端启动到 `8000`。
- 补充当前 MVP 演示路径、真实页面路径、storage key 约定和 Next.js landing page 单独启动方式。

### 当前最终演示启动方式

后端：

```bash
cd backend
.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
```

小程序：

1. 使用微信开发者工具打开 `frontend/`。
2. 确认 `frontend/miniprogram/app.js` 中 `globalData.apiBase` 为 `http://localhost:8000`。
3. 如果要使用 `8011`，临时把 `apiBase` 改成 `http://localhost:8011`，或者把后端改回启动到 `8000`。

### 当前最终演示路径

1. 清理小程序 storage。
2. 手机号登录。
3. 验证码输入 `123456`。
4. 邀请码输入 `NIRA2026`。
5. 完成 chat onboarding。
6. profile build 成功后加入本周匹配。
7. 准备第二个测试用户/profile，或用 API 触发 `POST /api/v1/match/weekly`。
8. 进入 match 页面查看 match result。
9. 点击接受匹配。
10. 进入 schedule 页面查看 arrange-simple 活动安排。
11. 点击确认活动。
12. 进入 group 页面查看 mock 群信息、活动摘要和破冰问题。

### 轻量一致性检查

- `frontend/miniprogram/app.js` 默认 `apiBase` 已确认是 `http://localhost:8000`，与 README 一致。
- `frontend/miniprogram/utils/api.js` 当前链路方法存在，别名只指向同一实现，没有重复实现同类方法：
  - `login`
  - `sendVerificationCode`
  - `verifyCodeAndLogin`
  - `buildProfile`
  - `getProfile`
  - `joinQueue`
  - `getMatchResult`
  - `weeklyMatch` / `runWeeklyMatch` / `triggerWeeklyMatch`
  - `acceptMatch`
  - `arrangeActivitySimple` / `arrangeSimple`
  - `confirmSchedule`
  - `getGroupInfo` / `getGroup` / `readGroup`
- `currentMatch` / `matchResult` / `groupInfo` storage key 使用已在 `app.js` 统一兼容。
- 真实页面路径已确认存在：
  - `frontend/miniprogram/pages/index/index.js`
  - `frontend/miniprogram/pages/chat/chat.js`
  - `frontend/miniprogram/pages/match/match.js`
  - `frontend/miniprogram/pages/schedule/schedule.js`
  - `frontend/miniprogram/pages/group/group.js`
  - `frontend/miniprogram/pages/login/phone/index.js`
- 未在 README 中误写 `pages/home/index.js` 或 `pages/chat/index.js`；handoff 历史记录中只保留“项目里没有这些路径”的说明。

### 验证结果

后端：

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

前端：

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

以上命令均已通过。

### 遗留问题

- MVP 演示仍依赖 development/mock，不接真实微信、短信、推送、Qwen/DashScope、IM/微信群、地图或日历。
- 队列、accept/group 状态仍是进程内存，后端重启会丢失。
- weekly mock match 需要第二个测试 profile；单用户时会稳定返回 waiting。
- token 仍只由前端存储和注入，后端业务接口没有统一鉴权。

### 下一轮建议

1. 增加一键 API smoke 脚本，降低演示前手动准备成本。
2. 增加小程序开发环境“清理演示状态”入口，避免手动清 storage 漏项。
3. 决定 queue/match/group 是否需要最小落库，以支持重启后继续演示。
4. 后续如进入真实服务阶段，再单独拆任务接微信、短信、推送、IM、地图/日历和 Qwen/DashScope。

## 2026-05-10 真实本地演示 Dry-run

### dry-run 是否完整跑通

已完整跑通 API 侧 dry-run：

登录 → profile build → join queue → single-user waiting → weekly mock match → match result → accept → arrange-simple → confirm schedule → group read。

说明：本轮无法在当前 shell 中直接操作微信开发者工具 UI，因此“小程序点击路径”按 README/handoff 做配置核对，核心链路用 8000 后端 API 实际跑通。

### 实际演示路径

1. 后端按 README 启动到 `http://localhost:8000`。
2. `/health` 返回 `{"status":"ok","app":"Nira","env":"development"}`。
3. 确认 `frontend/miniprogram/app.js` 中 `apiBase` 为 `http://localhost:8000`。
4. 确认微信开发者工具应打开目录 `C:\Users\rawle\nira\frontend`，该目录下存在 `project.config.json`。
5. API dry-run 使用全新手机号模拟清理 storage 后的新用户：
   - 手机号 A：`13978427522`
   - 手机号 B：`13878427522`
   - 验证码：`123456`
   - 邀请码：`NIRA2026`
6. 用户 A 完成 profile build。
7. 用户 A 加入本周匹配队列。
8. 用户 A 重复入队返回 `already_joined`。
9. 只有用户 A 时，match result 返回 `waiting`。
10. 用户 B 完成 profile build 并加入队列。
11. 触发 weekly mock match，返回 `matched`。
12. match result 返回 `matched`。
13. accept match 返回 `accepted_first`。
14. arrange-simple 返回 `planned`。
15. confirm schedule 返回 `group_created`。
16. group read 返回 `group_created`。

### 过程中发现的问题

- 8000 端口启动时已有旧版 Python/uvicorn 进程占用。
- 旧服务的 `/health` 正常，但 `openapi.json` 不包含最新 dry-run 必需接口，例如：
  - `POST /api/v1/auth/verify-code-and-login`
  - `GET /api/v1/match/result/{user_id}`
  - `POST /api/v1/schedule/confirm`
- 因此第一次 dry-run 在 `POST /api/v1/auth/login` 后续链路阶段遇到接口版本不一致/404 卡点。

### 本轮修改文件

- `NIRA_DEV_HANDOFF.md`

本轮没有修改业务代码、数据库结构或 UI。

### 已修复问题

- 停止了占用 8000 的旧 Python/uvicorn 进程。
- 按 README 当前命令从 `C:\Users\rawle\nira\backend` 重新启动后端：
  ```bash
  .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
  ```
- 重新启动后确认最新接口存在：
  - `POST /api/v1/auth/verify-code-and-login`
  - `GET /api/v1/match/result/{user_id}`
  - `POST /api/v1/schedule/confirm`
- 完整 API dry-run 随后跑通。

### 未修复问题

- 微信开发者工具 UI 未在本轮 shell 中自动化点击验证；需人工按 README 路径操作小程序页面。
- 由于 `--reload` 会产生 reloader/worker 进程，8000 上会看到多个 Python 相关监听/子进程，这是 uvicorn reload 模式的正常现象。
- 如果后续再次出现 `/health` 正常但业务接口缺失，应优先检查是否是旧后端进程占用 8000。

### 验证结果

后端健康检查：

```bash
curl http://localhost:8000/health
```

返回：

```json
{"status":"ok","app":"Nira","env":"development"}
```

API dry-run 关键结果：

```json
{
  "health": "ok",
  "wx_login_openid": true,
  "send_code_a": true,
  "verify_login_a": true,
  "verify_login_b": true,
  "profile_build": true,
  "profile_read": true,
  "join_queue": "joined",
  "repeat_join": "already_joined",
  "single_result": "waiting",
  "second_join": "joined",
  "weekly": "matched",
  "matched_result": "matched",
  "accept": "accepted_first",
  "arrange": "planned",
  "confirm": "group_created",
  "group_read": "group_created"
}
```

验证命令均通过：

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

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

### 当前后端进程

本轮按演示要求启动的后端仍在运行：

- reloader PID：`45736`
- 命令：`.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000`
- 服务地址：`http://localhost:8000`

### 下一轮建议

1. 增加一个 `backend/scripts/smoke_mvp_demo.ps1` 或同类脚本，把本轮 API dry-run 固化，避免每次手工拼命令。
2. 演示前固定先检查 `openapi.json` 是否包含关键接口，避免旧进程伪装成“健康”后端。
3. 在小程序里增加开发环境“清理演示 storage”按钮，减少人工清理漏项。

## 2026-05-10 小程序 UI 手动演示陪跑检查

### 小程序 UI 手动演示是否完整跑通

未能在当前 shell 会话里完成真实“人工点击 UI”的全流程确认。

已完成陪跑前置检查：

- 后端 `http://localhost:8000` 仍在运行。
- `/health` 返回 `{"status":"ok","app":"Nira","env":"development"}`。
- `frontend/miniprogram/app.js` 的 `apiBase` 已确认是 `http://localhost:8000`。
- 微信开发者工具 CLI 已定位到：`C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`。
- 微信项目目录已确认：`C:\Users\rawle\nira\frontend`。
- `frontend/project.config.json` 存在，`miniprogramRoot` 为 `miniprogram/`。
- `project.config.json` 中 `urlCheck=false`，本地 `http://localhost:8000` 请求不应被合法域名校验阻塞。
- tabBar 图标文件均存在。
- 关键页面文件均存在。

CLI 尝试：

- 执行过：
  ```bash
  "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" open --project C:\Users\rawle\nira\frontend
  ```
- 命令在当前 shell 中超时，没有返回可用于确认点击流程的结果。
- `preview` 命令同样未在当前 shell 中返回可操作结果。

因此，本轮没有声称“UI 点击全链路已人工跑通”；当前结论是：后端、配置、页面文件、图标和 JS 语法都已准备好，真实 UI 点击仍需在微信开发者工具窗口中人工确认。

### 实际点击路径

待人工在微信开发者工具中确认：

1. 清理 storage。
2. 进入首页。
3. 点击开始/登录入口。
4. 手机号登录。
5. 验证码输入 `123456`。
6. 邀请码保持 `NIRA2026`。
7. 登录成功后进入首页或 onboarding。
8. 完成 onboarding。
9. 确认 profile build 成功。
10. 回到首页。
11. 点击加入本周匹配。
12. 进入 match 页面。
13. 暂无结果时确认 waiting 状态正常展示。
14. 触发 weekly mock match 或使用已准备的第二测试用户。
15. 查看 match result。
16. 点击接受匹配。
17. 进入 schedule 页面。
18. 查看活动安排。
19. 点击确认活动。
20. 进入 group 页面。
21. 确认展示 mock 群信息、活动摘要、破冰问题。

### 发现的问题

- 当前环境无法通过 shell 自动完成微信开发者工具 UI 点击验证。
- 微信开发者工具 CLI `open` / `preview` 命令没有在当前 shell 中给出可用于判断 UI 编译或点击状态的结果。
- 静态扫描未发现页面路径、tabBar 图标、`apiBase`、项目目录配置的阻塞问题。

### 修复的问题

本轮没有发现需要修改业务代码的明确 UI 阻塞问题，因此没有做代码修复。

### 本轮修改文件

- `NIRA_DEV_HANDOFF.md`

### 验证命令结果

后端：

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

结果：通过。

前端：

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

结果：全部通过。

### 未修复问题

- 真实微信开发者工具 UI 点击流程仍需人工在窗口内确认。
- 若人工点击时发现 WXML 编译错误、按钮无反应、跳转错误、storage 状态异常或接口参数异常，应按当时错误日志做最小修复。

### 下一轮建议

1. 人工打开微信开发者工具后，从控制台复制第一条真实错误日志给下一轮 agent。
2. 如果希望自动化微信开发者工具 UI，可单独研究 DevTools automation/HTTP server 或 miniprogram-automator，但不要和当前 MVP 功能修复混在一轮里做。
3. 在小程序里增加 development-only “清理演示 storage”按钮，方便人工 UI 演示。

## 2026-05-15 小程序 UI 自动化尝试 / 编译陪跑

### 本轮目标

用户授权由 agent 自己尽量跑微信开发者工具 UI。实际执行结果：后端、配置、WXML/WXSS 编译和关键 JS 检查均通过；微信开发者工具 GUI 已用可见窗口方式拉起，但 automation 端口未能正常建立，未能完成自动点击全链路。

### 当前环境确认

- 后端地址：`http://localhost:8000`
- `/health` 返回 `{"status":"ok","app":"Nira","env":"development"}`
- `frontend/miniprogram/app.js` 中 `apiBase` 为 `http://localhost:8000`
- 微信项目目录：`C:\Users\rawle\nira\frontend`
- 微信开发者工具 CLI：`C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`
- 微信开发者工具可见窗口已启动：
  - `微信开发者工具.exe` PID：`22164`
  - `wechatdevtools.exe` PID：`15112`

### automation 尝试结果

尝试过：

```bash
"C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" auto --project C:\Users\rawle\nira\frontend --auto-port 9420 --trust-project --disable-gpu
```

也尝试过 `miniprogram-automator` 临时包启动：

- 临时安装位置：`%TEMP%\nira-miniprogram-automator`
- 包：`miniprogram-automator@0.12.1`

结果：

- CLI 命令在当前 shell 中超时。
- `127.0.0.1:9420` automation 端口未开放。
- `miniprogram-automator` 报错：`Failed to launch wechat web devTools, please make sure cliPath is correctly specified`。
- 因此未能通过 automation 获得页面对象，也未能自动执行 UI 点击链路。

### 编译/静态陪跑结果

微信开发者工具自带 WXML 编译器检查通过：

```bash
wcc.exe frontend\miniprogram\pages\index\index.wxml frontend\miniprogram\pages\chat\chat.wxml frontend\miniprogram\pages\match\match.wxml frontend\miniprogram\pages\schedule\schedule.wxml frontend\miniprogram\pages\group\group.wxml frontend\miniprogram\pages\login\phone\index.wxml
```

结果：`wcc ok`

微信开发者工具自带 WXSS 编译器检查通过：

```bash
wcsc.exe frontend\miniprogram\app.wxss frontend\miniprogram\pages\index\index.wxss frontend\miniprogram\pages\chat\chat.wxss frontend\miniprogram\pages\match\match.wxss frontend\miniprogram\pages\schedule\schedule.wxss frontend\miniprogram\pages\group\group.wxss frontend\miniprogram\pages\login\phone\index.wxss
```

结果：`wcsc ok`

关键 JS 检查全部通过：

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

后端编译检查通过：

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

### 本轮修改文件

- `NIRA_DEV_HANDOFF.md`

没有修改业务代码、UI、数据库或 agent 架构。

### 未完成项

- 未能自动完成微信开发者工具 GUI 点击链路。
- 仍需在已打开的微信开发者工具窗口中手动点击：
  登录 → onboarding → 加入匹配 → match → accept → schedule → confirm → group。

### 下一轮建议

1. 在当前已打开的微信开发者工具窗口中手动点一遍；如出现报错，复制 Console 第一条红色错误和 Network 失败接口。
2. 如果必须自动化 GUI，再单独处理微信开发者工具 automation 端口未开放的问题，不要和业务修复混做。
3. 本轮静态/编译层面没有发现必须修的 UI 阻塞点。
## 2026-05-15 微信登录后 GUI 重试记录

### 本轮目标

用户登录微信开发者工具后，继续尝试由 agent 直接跑小程序 GUI 点击链路。

### 已确认状态

- 后端仍在 `http://localhost:8000` 运行，`/health` 返回正常。
- `frontend/miniprogram/app.js` 的 `apiBase` 仍为 `http://localhost:8000`。
- 微信开发者工具可见窗口可以拉起，项目卡片显示为 `frontend`，路径为 `C:\Users\rawle\nira\frontend`。

### 本轮实际尝试

- 重新尝试 `miniprogram-automator.launch()`，Windows 下直接 spawn `cli.bat` 仍报 `Failed to launch wechat web devTools, please make sure cliPath is correctly specified`。
- 检查当前微信开发者工具 CLI，发现当前版本 `auto --help` 使用的是全局 `--port`，不是旧版 `--auto-port`。
- 使用 `auto --project ... --port 9420 --trust-project` 后，DevTools 进程参数包含 `--ide-http-port 9420`，但本机没有监听 `9420`，automator 仍无法连接。
- 发现 DevTools 用户数据里的 `Default\.ide` 记录 stale port `50795`，CLI 报 `IDE may already started at port 50795` / `wait IDE port timeout`。已关闭 DevTools 后删除该本地端口锁文件。
- 删除 `.ide` 后，DevTools 可以重新打开首页，但 CLI `open --project` 仍停留在最近项目页，未自动进入项目工作台。
- 尝试用 Windows 截屏 + `SendInput` 做桌面点击：
  - 能把 DevTools 窗口置前并截图。
  - 能看到 `frontend` 项目卡片。
  - 合成鼠标点击项目卡片、导入按钮，以及点击搜索框后输入 `front` 均没有被 DevTools 接收。

### 结论

本轮没有发现 Nira 业务代码阻塞。当前阻塞点在微信开发者工具 GUI/CLI 自动化层：

- DevTools automation WebSocket 未开放。
- CLI HTTP/IDE port 状态不稳定。
- 当前 Codex shell 发出的合成鼠标/键盘事件没有被 DevTools 首页接收。

因此仍不能由 agent 在当前 shell 会话里完整自动点击小程序 UI。人工在 DevTools 窗口内点击仍是下一步最可靠路径。

### 本轮修改文件

- `NIRA_DEV_HANDOFF.md`

未修改业务代码、前端页面、后端接口、数据库或 agent 架构。

### 下一轮建议

1. 人工在当前 DevTools 窗口内点开 `frontend` 项目卡片并跑一遍 MVP 演示链路。
2. 如果人工点击中出现真实报错，优先贴 Console 第一条红色错误、Network 失败请求和当前页面路径，再做最小修复。
3. 如果必须自动化微信开发者工具 UI，建议单独处理 DevTools automation/CLI 端口问题，不和 Nira 业务修复混在一轮里。
## 2026-05-15 小程序 UI 真实报错修复：profile 404

### 用户贴出的错误

微信开发者工具 Console 中出现：

```text
Error: timeout
api.js GET http://localhost:8000/api/v1/profile/6b5c2900-9d29-4a9d-bd7e-462e1f2315e2 404 (Not Found)
restoreRemoteProfile @ pages/index/index.js
```

### 原因

首页 `onShow()` 会调用 `restoreRemoteProfile()`，用于从后端恢复 profile。对尚未完成 onboarding/profile build 的用户，后端原来按 REST 语义返回 `404 profile not found`。这不会破坏业务逻辑，但在微信开发者工具里会显示红色 Network 错误，影响演示判断。

### 本轮修改文件

- `backend/app/routers/profile.py`
- `frontend/miniprogram/pages/index/index.js`
- `frontend/miniprogram/utils/api.js`
- `NIRA_DEV_HANDOFF.md`

### 修复内容

- `GET /api/v1/profile/{user_id}` 未找到 profile 时不再返回 404，而是返回 200：
  - `profile_completed: false`
  - `status: "not_found"`
  - 空的 profile 字段
- 找到 profile 时返回：
  - `profile_completed: true`
  - `status: "ok"`
- 首页恢复远端 profile 时，如果返回 `profile_completed === false` 或 `status === "not_found"`，不调用 `app.setProfile()`，避免把空状态误判为已完成画像。
- `api.request()` 增加显式 `timeout: 10000`，减少小程序默认 timeout 行为不确定性。

### 验证结果

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
```

通过。

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

全部通过。

API 验证：

- `/health` 返回正常。
- 用户贴出的 `GET /api/v1/profile/6b5c2900-9d29-4a9d-bd7e-462e1f2315e2` 当前返回 200，且 `profile_completed: true`。
- 不存在 profile 的测试 UUID 返回 200，且 `profile_completed: false`、`status: "not_found"`。

### 下一步人工复测

1. 在微信开发者工具里重新编译/刷新小程序。
2. 回到首页，确认不再出现 profile 404 红错。
3. 若仍有 `Error: timeout`，请继续贴第一条 timeout 对应的 Network 失败 URL；本轮已处理明确的 profile 404。
## 2026-05-15 小程序 UI 日志修复：wx.login timeout / imageUrl null

### 用户贴出的日志

- `Error: timeout` 出现在小程序启动后。
- `components/chat-bubble/index` 警告：`imageUrl` 期望 `String`，但收到 `null`。
- 其余日志包括 SharedArrayBuffer deprecation、WeChatLib 版本提示、合法域名检查关闭提示、`reportRealtimeAction:fail not support`，均为微信开发者工具/基础库提示，不是 Nira 业务阻塞。

### 本轮修改文件

- `frontend/miniprogram/app.js`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/chat/chat.wxml`
- `NIRA_DEV_HANDOFF.md`

### 修复内容

- 本地开发模式下，如果 `apiBase` 包含 `localhost`，`app.doWxLogin()` 直接写入 `dev_local_openid`，不再调用真实 `wx.login`，避免 DevTools 启动阶段微信登录超时。
- 读取聊天历史时规整历史消息：
  - `text: message.text || ""`
  - `imageUrl: message.imageUrl || ""`
- chat 页面传给 `chat-bubble` 时也兜底为空字符串，避免组件属性类型警告。

### 验证结果

- `curl http://localhost:8000/health` 通过。
- `cd backend && .venv\Scripts\python.exe -m compileall app` 通过。
- 以下前端检查通过：

```bash
node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\index\index.js
node --check frontend\miniprogram\pages\match\match.js
node --check frontend\miniprogram\pages\schedule\schedule.js
node --check frontend\miniprogram\pages\group\group.js
```

### 下一步人工复测

1. 微信开发者工具点“清缓存 / 清除 Storage”。
2. 重新编译小程序。
3. 确认启动时不再出现 `Error: timeout`。
4. 进入 chat 页面，确认不再出现 `imageUrl null` 组件警告。
## 2026-05-15 OpenAI LLM Provider 试接入

### 本轮目标

验证 Nira 的大模型调用是否可以接入 OpenAI API key，同时保证当前免费 Qwen 路径不被破坏。

### 本轮修改文件

- `backend/app/core/config.py`
- `backend/app/agents/base.py`
- `backend/.env.example`
- `NIRA_DEV_HANDOFF.md`

### 当前接入方式

- 默认仍为 `LLM_PROVIDER=qwen`，走原来的 `ChatTongyi` / DashScope / Qwen。
- 只有显式设置 `LLM_PROVIDER=openai` 时，文本 agent 才会尝试 OpenAI。
- 新增配置：

```env
LLM_PROVIDER=qwen
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4.1-nano
```

### 重要保护

OpenAI provider 已增加自动 fallback：

1. 先调用 OpenAI Chat Completions。
2. 如果 OpenAI 报错，并且 `DASHSCOPE_API_KEY` 存在，则自动回退到 Qwen。
3. 因此即使 OpenAI 没额度、网络失败或 key 权限异常，也不会阻断当前 Nira 本地演示链路。

### 实测结果

- 默认配置下：
  - `get_llm()` 返回 `ChatTongyi`
  - `provider=qwen`
  - Qwen 免费路径未被改坏
- 设置 `LLM_PROVIDER=openai` 后做极小请求：
  - OpenAI 返回 `429 insufficient_quota`
  - 说明当前 OpenAI key/项目已被识别，但没有可用额度或 billing 不可用
  - fallback 自动切回 Qwen
  - 最终响应为 `ok`

### 已验证命令

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health
```

均通过。

### 结论

Nira 现在可以安全接入 OpenAI API key，但当前这枚 key/项目无法直接调用 OpenAI，因为 OpenAI 返回 `insufficient_quota`。在这种情况下系统会自动 fallback 到 Qwen，因此当前可运行性不受影响。

要真正使用 OpenAI，需要确保 OpenAI Platform 项目有可用额度/billing，然后设置：

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4.1-nano
```
## 2026-05-15 DeepSeek First LLM Fallback Chain

### 本轮目标

按用户要求将 Nira 文本大模型调用改为：

1. DeepSeek API Key + `deepseek-v4-flash`
2. 如果 DeepSeek 调用失败，则调用 OpenAI
3. 如果 OpenAI 再失败，则调用当前 Qwen 免费模型

### 本轮修改文件

- `backend/app/core/config.py`
- `backend/app/agents/base.py`
- `backend/.env.example`
- `backend/.env`（本机配置，包含敏感 key，不应提交）
- `NIRA_DEV_HANDOFF.md`

### 当前配置

`.env` 已写入 DeepSeek 配置，密钥不在文档中明文记录：

```env
LLM_PROVIDER=auto
DEEPSEEK_API_KEY=***set***
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
OPENAI_API_KEY=***set***
DASHSCOPE_API_KEY=***set***
QWEN_MODEL_NAME=qwen-max
```

`backend/app/agents/base.py` 当前统一返回 `FallbackChatAdapter`，现有 profile / match / schedule / simulation / poster agents 仍按原来的 `.ainvoke(messages)` 使用，无需改业务 agent。

### 实测结果

1. 默认 `auto` provider 构造成功：
   - `provider_setting=auto`
   - `adapter=FallbackChatAdapter`
   - DeepSeek / OpenAI / Qwen key 均已读取
2. 直连 DeepSeek：
   - 模型：`deepseek-v4-flash`
   - 返回：`ok`
   - 说明 DeepSeek API key 和模型可正常使用
3. 故意设置错误模型 `definitely-invalid-model`：
   - DeepSeek 返回 400，并提示支持 `deepseek-v4-pro` / `deepseek-v4-flash`
   - 随后尝试 OpenAI
   - OpenAI 仍返回 `429 insufficient_quota`
   - 最后 fallback 到 Qwen
   - 最终返回：`ok`

### 已验证命令

```bash
cd backend
.venv\Scripts\python.exe -m compileall app
curl http://localhost:8000/health
```

均通过。

### 注意事项

- DeepSeek 的展示名可以写作 `DeepSeek-V4-Flash`，但 API model id 必须是 `deepseek-v4-flash`。
- 当前 OpenAI key 仍无可用额度，OpenAI 会返回 `insufficient_quota`，但不会影响 Nira，因为 Qwen 会兜底。
- `.env` 包含真实 key，不能提交。
## 2026-05-15 Dynamic AI Onboarding Chat Baseline

### 本轮目标

把小程序 chat 建档从前端固定 step 问卷，升级为后端驱动的动态对话建档基线。当前仍保持小范围改造，不新增数据库迁移，不重构 agent 架构。

### 本轮修改文件

- `backend/app/routers/profile.py`
- `backend/app/schemas/profile.py`
- `backend/app/schemas/__init__.py`
- `backend/app/services/profile_service.py`
- `frontend/miniprogram/utils/api.js`
- `frontend/miniprogram/pages/chat/chat.js`
- `frontend/miniprogram/pages/chat/chat.wxml`
- `frontend/miniprogram/app.js`
- `NIRA_DEV_HANDOFF.md`

### 新增接口

`POST /api/v1/profile/chat`

Request:
```json
{
  "user_id": "uuid",
  "message": "我刚刚名字说错了，我叫小然，平时喜欢citywalk和看展",
  "conversation_id": "optional-local-id"
}
```

Response:
```json
{
  "status": "ok",
  "reply": "Nira 的自然回复",
  "profile_patch": {},
  "profile": {},
  "completion": {
    "is_ready": false,
    "missing_fields": []
  },
  "intent": "update_profile | correct_profile | skip | unclear",
  "conversation_id": "optional-local-id"
}
```

### 动态建档逻辑

- 后端每轮从 `message` 中抽取 `profile_patch`，并合并保存到 `UserProfile`。
- 不新增字段和迁移，扩展信息暂存在 `UserProfile.availability` JSON。
- 支持自然纠正：`不是`、`刚刚说错了`、`改成`、`其实` 会覆盖对应字段，例如 preferred_name。
- 支持追加兴趣：`喜欢`、`平时会`、`常去`、`想试试` 相关活动会追加到 interests/activity_types。
- 支持负向偏好：`不喜欢`、`不想`、`雷`、`别给我` 会写入 `availability.negative_preferences`。
- 支持性别/关系偏好：`男生`、`女生`、`都可以`、`朋友`、`搭子`、`暧昧` 等会更新 preferred_gender/preferred_type。
- 支持时间偏好：`工作日晚上`、`周末下午` 等会写入 `availability.weekdays/weekends/time_preference_text`。
- `completion.is_ready` 初期按宽松标准判断：称呼、兴趣、关系/性别偏好、时间偏好中满足大部分即可。

### 小程序 chat 新流程

- `frontend/miniprogram/utils/api.js` 新增 `profileChat(userId, message, conversationId)`。
- `chat.js` 的 `onSend` 现在直接调用 `POST /api/v1/profile/chat`，不再执行固定 step 问卷推进。
- 每轮后端返回的 `reply` 直接展示在聊天页。
- 返回的 `profile` 存入 `profile` storage；仅当 `completion.is_ready=true` 时才设置 `profileCompleted=true`。
- 返回的 `profile_patch` 存入 `profilePatch` storage。
- ready 后展示“加入本周匹配队列”，同时提供“继续修改偏好”入口，用户不会被锁死。
- `app.resetProfile()` 现在会清理 `nira_profile_conversation_id` 和 `profilePatch`。

### 已验证命令

```bash
cd backend
.venv\Scripts\python.exe -m compileall app

node --check frontend\miniprogram\app.js
node --check frontend\miniprogram\utils\api.js
node --check frontend\miniprogram\pages\chat\chat.js
node --check frontend\miniprogram\pages\index\index.js
curl http://localhost:8000/health
```

结果：全部通过。

### API smoke 结果

已在 `http://localhost:8000` 上完成登录 + `/api/v1/profile/chat` 连续对话 smoke。覆盖输入：

- `我叫小然，平时喜欢citywalk和看展`
- `不是，我刚刚说错了，我叫Raw`
- `我只想找一起玩的朋友，不想太像约会`
- `女生男生都可以，主要是聊得来`
- `我工作日晚上或者周末下午比较方便`
- `我不喜欢酒吧，太吵了`

验证结果：

- preferred_name 可从小然纠正为 Raw。
- interests 包含 citywalk / 看展。
- preferred_type 更新为 `friends/activity_partner`。
- preferred_gender 可记录 `any` 且标记为用户显式表达。
- availability 写入 weekdays evening / weekends afternoon。
- negative_preferences 持久化写入约会感、酒吧、太吵等负向偏好。
- completion 最终返回 ready。
- 补充验证：第一轮只提供昵称和兴趣时，`GET /api/v1/profile/{user_id}` 返回 `profile_completed=false`，不会让首页误判已完成建档。
- 补充验证：最终 ready 后，`join-queue` 返回 `joined`，重复加入返回 `already_joined`。

### 遗留问题

- 当前动态 parser 是 development/mock 规则引擎，不是真正的多轮 LLM agent。
- `profile_agent.py` 仍保留旧的一次性 build prompt，本轮没有重构。
- 部分历史文件在终端中显示中文编码异常，但运行链路未因本轮改动受阻。
- 小程序 WXML 已修正为可读中文；`chat.js` 内部分旧兜底文案仍是历史编码文本，但主发送链路已不再走固定问卷分支。

### 下一轮建议

1. 给 `/api/v1/profile/chat` 增加真实 LLM JSON extraction 可选路径，并保留当前 mock parser fallback。
2. 给动态建档补后端单元测试，固定 A-F 六个验收用例。
3. 清理 `chat.js` 中已不再使用的旧 step 问卷函数，前提是先确认 UI 演示链路稳定。
