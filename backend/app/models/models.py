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

class FixedExpense(Base):
    __tablename__ = "fixed_expense"

    id             = Column(Integer, primary_key=True, index=True)
    sheet_id       = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    account_number = Column(String, nullable=True)   # 계좌번호
    bank_name      = Column(String, nullable=True)   # 은행명
    account_holder = Column(String, nullable=True)   # 예금주
    transfer_name  = Column(String, nullable=True)   # 이체명
    category       = Column(String, nullable=False, index=True)  # 성향 (저축/용돈/보험 등)
    item_name      = Column(String, nullable=False, index=True)  # 항목명
    monthly_amount = Column(Numeric(15, 2), nullable=True)       # 대표 월 금액
    monthly_data   = Column(JSON, nullable=True)                 # {"2026-01": 200000, ...}
    upload_id      = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    data_record_id = Column(Integer, ForeignKey("data_record.id"), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sheet       = relationship("SheetData", backref="fixed_expenses")
    upload      = relationship("UploadHistory", backref="fixed_expenses")
    data_record = relationship("DataRecord", backref="fixed_expenses")

    __table_args__ = (
        Index('idx_fixed_exp_item_upload', 'item_name', 'upload_id'),
    )

class MonthlySummary(Base):
    __tablename__ = "monthly_summary"

    id                    = Column(Integer, primary_key=True, index=True)
    sheet_id              = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    year                  = Column(Integer, nullable=False, index=True)
    month                 = Column(Integer, nullable=False)           # 1–12
    income                = Column(Numeric(15, 2), nullable=True)    # 월 수입
    expense               = Column(Numeric(15, 2), nullable=True)    # 월 지출
    net_income            = Column(Numeric(15, 2), nullable=True)    # 월 순수익
    cumulative_net_income = Column(Numeric(15, 2), nullable=True)    # 누적 순수익
    investment_principal  = Column(Numeric(15, 2), nullable=True)    # 투자 원금
    investment_value      = Column(Numeric(15, 2), nullable=True)    # 평가금
    upload_id             = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    data_record_id        = Column(Integer, ForeignKey("data_record.id"), nullable=True)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())
    updated_at            = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sheet       = relationship("SheetData", backref="monthly_summaries")
    upload      = relationship("UploadHistory", backref="monthly_summaries")
    data_record = relationship("DataRecord", backref="monthly_summaries")

    __table_args__ = (
        Index('idx_monthly_summary_year_month_upload', 'year', 'month', 'upload_id'),
    )

class FinancialGoal(Base):
    __tablename__ = "financial_goal"

    id                = Column(Integer, primary_key=True, index=True)
    sheet_id          = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    goal_name         = Column(String, nullable=False, index=True)
    target_amount     = Column(Numeric(15, 2), nullable=True)   # 목표금액
    start_date        = Column(String, nullable=True)           # 시작일 (YYYY-MM)
    end_date          = Column(String, nullable=True)           # 종료일 (YYYY-MM)
    interest_rate     = Column(Numeric(5, 4), nullable=True)    # 연이율 (0.05 = 5%)
    total_weeks       = Column(Integer, nullable=True)          # 총 기간(주)
    elapsed_weeks     = Column(Integer, nullable=True)          # 경과 기간(주)
    remaining_weeks   = Column(Integer, nullable=True)          # 잔여 기간(주)
    progress_rate     = Column(Numeric(5, 4), nullable=True)    # 진행률 (0.2137 = 21.37%)
    weekly_allocation = Column(Numeric(15, 2), nullable=True)   # 주간 배분액
    planned_data      = Column(JSON, nullable=True)             # 계획 항목 배열
    actual_data       = Column(JSON, nullable=True)             # 집행 항목 배열
    upload_id         = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sheet  = relationship("SheetData", backref="financial_goals")
    upload = relationship("UploadHistory", backref="financial_goals")

class RealEstateAnalysis(Base):
    __tablename__ = "real_estate_analysis"

    id                     = Column(Integer, primary_key=True, index=True)
    sheet_id               = Column(Integer, ForeignKey("sheet_data.id"), nullable=False)
    property_name          = Column(String, nullable=True)
    total_acquisition_cost = Column(Numeric(15, 2), nullable=True)  # 취득원가
    self_capital           = Column(Numeric(15, 2), nullable=True)  # 자기자본
    loan_capital           = Column(Numeric(15, 2), nullable=True)  # 타인자본
    current_market_value   = Column(Numeric(15, 2), nullable=True)  # 시세
    unrealized_gain        = Column(Numeric(15, 2), nullable=True)  # 시세차익
    roe                    = Column(Numeric(8, 4), nullable=True)    # ROE
    leverage_multiple      = Column(Numeric(8, 4), nullable=True)   # 레버리지 배수
    acceleration_factor    = Column(Numeric(8, 4), nullable=True)   # 가속계수
    analysis_data          = Column(JSON, nullable=True)            # 원시 데이터 보존
    upload_id              = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    data_record_id         = Column(Integer, ForeignKey("data_record.id"), nullable=True)
    created_at             = Column(DateTime(timezone=True), server_default=func.now())
    updated_at             = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sheet       = relationship("SheetData", backref="real_estate_analyses")
    upload      = relationship("UploadHistory", backref="real_estate_analyses")
    data_record = relationship("DataRecord", backref="real_estate_analyses")

