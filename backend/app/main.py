from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, profile, match, schedule, test, push


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.app_name,
    description="Z世代活动搭子撮合平台 API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(match.router)
app.include_router(schedule.router)
app.include_router(test.router)
app.include_router(push.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.app_name, "env": settings.app_env}
