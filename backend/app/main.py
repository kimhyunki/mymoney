from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, data
from app.database import engine
from app.models import Base
from app.services import scheduler_service
import logging
import sys
import os

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시
    Base.metadata.create_all(bind=engine)
    logger.info("데이터베이스 테이블 생성 완료")
    sync_interval = int(os.getenv("CUSTOMER_SYNC_INTERVAL", "30"))
    scheduler_service.start_scheduler(interval_seconds=sync_interval)
    yield
    # 종료 시
    scheduler_service.stop_scheduler()

app = FastAPI(title="MyMoney API", version="1.0.0", lifespan=lifespan)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8050",  # 프론트엔드 호스트 포트
        "http://frontend:80",     # Docker 내부 네트워크
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# 라우터 등록
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(data.router, prefix="/api", tags=["data"])

@app.get("/")
async def root():
    return {"message": "MyMoney API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

