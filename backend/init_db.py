#!/usr/bin/env python3
"""
데이터베이스 초기화 스크립트
테이블을 생성합니다.
"""
import os
import sys
from app.database import engine, Base
from app.models import UploadHistory, SheetData, DataRecord

def init_db():
    """데이터베이스 테이블 생성"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()

