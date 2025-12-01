from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Numeric, Index
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
    upload_id = Column(Integer, ForeignKey("upload_history.id"), nullable=True)  # 업로드 이력 참조
    data_record_id = Column(Integer, ForeignKey("data_record.id"), nullable=True)  # 원본 데이터 레코드 참조
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    upload = relationship("UploadHistory", backref="customers")
    data_record = relationship("DataRecord", backref="customers")
    
    __table_args__ = (
        Index('idx_customer_name_upload', 'name', 'upload_id'),
    )

class CashFlow(Base):
    __tablename__ = "cash_flow"
    
    id = Column(Integer, primary_key=True, index=True)
    sheet_id = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    item_name = Column(String, nullable=False, index=True)  # 항목명 (금융수입, 급여 등)
    item_type = Column(String, nullable=True)  # 항목 타입 (수입/지출)
    total = Column(Numeric(precision=15, scale=2), nullable=True)  # 총계
    monthly_average = Column(Numeric(precision=15, scale=2), nullable=True)  # 월평균
    monthly_data = Column(JSON, nullable=True)  # 월별 데이터 { "2024-11": 1000, "2024-12": 2000, ... }
    upload_id = Column(Integer, ForeignKey("upload_history.id"), nullable=True)  # 업로드 이력 참조
    data_record_id = Column(Integer, ForeignKey("data_record.id"), nullable=True)  # 원본 데이터 레코드 참조
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    sheet = relationship("SheetData", backref="cash_flows")
    upload = relationship("UploadHistory", backref="cash_flows")
    data_record = relationship("DataRecord", backref="cash_flows")
    
    __table_args__ = (
        Index('idx_cashflow_item_upload', 'item_name', 'upload_id'),
    )

