from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Nira"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-to-a-random-secret-key"

    database_url: str = "postgresql+asyncpg://nira:nira_password@localhost:5432/nira"

    redis_url: str = "redis://localhost:6379/0"

    dashscope_api_key: str = ""
    qwen_model_name: str = "qwen-max"

    wx_appid: str = ""
    wx_secret: str = ""
    genesis_invite_code: str = "NIRA2026"  # 创始邀请码（User < 1000 时可用）

    cos_secret_id: str = ""
    cos_secret_key: str = ""
    cos_bucket: str = ""
    cos_region: str = "ap-shanghai"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
