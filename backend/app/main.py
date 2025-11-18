from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, data
from app.database import engine
from app.models import Base

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MyMoney API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:7000", "http://frontend:3000"],
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

