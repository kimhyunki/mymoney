from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, data
from app.database import engine
from app.models import Base
import logging
import sys

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

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)
logger.info("데이터베이스 테이블 생성 완료")

app = FastAPI(title="MyMoney API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8050",  # 프론트엔드 호스트 포트
        "http://frontend:80",     # Docker 내부 네트워크
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

