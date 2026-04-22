# Nira - Z世代活动搭子撮合平台

## 技术栈
- 前端：微信小程序（原生 + TDesign）
- 后端：FastAPI (Python 3.11+) + Uvicorn
- AI：LangGraph + 通义千问 (Qwen-Max)
- 数据库：PostgreSQL (SQLAlchemy 2.0 + Alembic)
- 向量库：Chroma
- 缓存：Redis
- 存储：腾讯云 COS

## 项目结构
- `frontend/` - 微信小程序
- `backend/` - FastAPI 后端（核心代码在 `app/` 下）
- `docs/` - 文档

## 开发命令
```bash
# 启动后端
cd backend && uvicorn app.main:app --reload

# 数据库迁移
cd backend && alembic revision --autogenerate -m "description"
cd backend && alembic upgrade head

# 代码格式化
cd backend && black app/ && ruff check app/ --fix
```

## 规范
- 使用 async/await
- 数据库操作通过 SQLAlchemy async session
- 配置通过 .env + pydantic-settings 管理
- 总公司 Overgreen 仅出现在后台，前端品牌为 Nira
