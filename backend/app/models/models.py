from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class UploadHistory(Base):
    __tablename__ = "upload_history"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    sheet_count = Column(Integer, default=0)
    
    sheets = relationship("SheetData", back_populates="upload", cascade="all, delete-orphan")

class SheetData(Base):
    __tablename__ = "sheet_data"
    
    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("upload_history.id"), nullable=False)
    sheet_name = Column(String, nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    
    upload = relationship("UploadHistory", back_populates="sheets")
    records = relationship("DataRecord", back_populates="sheet", cascade="all, delete-orphan")

class DataRecord(Base):
    __tablename__ = "data_record"
    
    id = Column(Integer, primary_key=True, index=True)
    sheet_id = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False)  # 행 데이터를 JSON으로 저장
    
    sheet = relationship("SheetData", back_populates="records")

class Customer(Base):
    __tablename__ = "customer"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)  # 이름
    gender = Column(String, nullable=True)  # 성별 (남/여)
    age = Column(Integer, nullable=True)  # 나이 (만 나이)
    credit_score = Column(Integer, nullable=True)  # 신용점수 (KCB)
    email = Column(String, nullable=True)  # 이메일
    data_record_id = Column(Integer, ForeignKey("data_record.id"), nullable=True)  # 원본 데이터 레코드 참조
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    data_record = relationship("DataRecord", backref="customers")

