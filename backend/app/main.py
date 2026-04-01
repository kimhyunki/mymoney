from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import data
from app.database import engine
from app.models import Base
from app.services.scheduler_service import start_scheduler, stop_scheduler
import logging
import sys
import os

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("데이터베이스 테이블 준비 완료")
    interval = int(os.getenv("CUSTOMER_SYNC_INTERVAL", "30"))
    start_scheduler(interval_seconds=interval)
    yield
    stop_scheduler()


app = FastAPI(title="MyMoney API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8050",
        "http://frontend:80",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(data.router, prefix="/api", tags=["data"])


@app.get("/")
async def root():
    return {"message": "MyMoney API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
