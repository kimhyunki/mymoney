from sqlalchemy import Column, Integer, String, DateTime, JSON, Numeric, Index
from sqlalchemy.sql import func
from app.database import Base


class Customer(Base):
    __tablename__ = "customer"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    credit_score = Column(Integer, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CashFlow(Base):
    __tablename__ = "cash_flow"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, nullable=False, index=True)
    item_type = Column(String, nullable=True)
    total = Column(Numeric(precision=15, scale=2), nullable=True)
    monthly_average = Column(Numeric(precision=15, scale=2), nullable=True)
    monthly_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class FixedExpense(Base):
    __tablename__ = "fixed_expense"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    account_holder = Column(String, nullable=True)
    transfer_name = Column(String, nullable=True)
    category = Column(String, nullable=False, index=True)
    item_name = Column(String, nullable=False, index=True)
    monthly_amount = Column(Numeric(15, 2), nullable=True)
    monthly_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MonthlySummary(Base):
    __tablename__ = "monthly_summary"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False, index=True)
    month = Column(Integer, nullable=False)
    income = Column(Numeric(15, 2), nullable=True)
    expense = Column(Numeric(15, 2), nullable=True)
    net_income = Column(Numeric(15, 2), nullable=True)
    cumulative_net_income = Column(Numeric(15, 2), nullable=True)
    investment_principal = Column(Numeric(15, 2), nullable=True)
    investment_value = Column(Numeric(15, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_monthly_summary_year_month', 'year', 'month'),
    )


class FinancialGoal(Base):
    __tablename__ = "financial_goal"

    id = Column(Integer, primary_key=True, index=True)
    goal_name = Column(String, nullable=False, index=True)
    target_amount = Column(Numeric(15, 2), nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    interest_rate = Column(Numeric(5, 4), nullable=True)
    total_weeks = Column(Integer, nullable=True)
    elapsed_weeks = Column(Integer, nullable=True)
    remaining_weeks = Column(Integer, nullable=True)
    progress_rate = Column(Numeric(5, 4), nullable=True)
    weekly_allocation = Column(Numeric(15, 2), nullable=True)
    planned_data = Column(JSON, nullable=True)
    actual_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RealEstateAnalysis(Base):
    __tablename__ = "real_estate_analysis"

    id = Column(Integer, primary_key=True, index=True)
    property_name = Column(String, nullable=True)
    total_acquisition_cost = Column(Numeric(15, 2), nullable=True)
    self_capital = Column(Numeric(15, 2), nullable=True)
    loan_capital = Column(Numeric(15, 2), nullable=True)
    current_market_value = Column(Numeric(15, 2), nullable=True)
    unrealized_gain = Column(Numeric(15, 2), nullable=True)
    roe = Column(Numeric(8, 4), nullable=True)
    leverage_multiple = Column(Numeric(8, 4), nullable=True)
    acceleration_factor = Column(Numeric(8, 4), nullable=True)
    analysis_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class InvestmentStatus(Base):
    __tablename__ = "investment_status"

    id = Column(Integer, primary_key=True, index=True)
    investment_type = Column(String, nullable=True)   # 주식, 펀드 등
    company = Column(String, nullable=True)           # 금융사
    product_name = Column(String, nullable=False)     # 상품명
    principal = Column(Numeric(15, 2), nullable=True) # 투자원금
    current_value = Column(Numeric(15, 4), nullable=True) # 평가금액
    return_rate = Column(Numeric(10, 4), nullable=True)   # 수익률(%)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class FinancialSnapshot(Base):
    __tablename__ = "financial_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    total_assets = Column(Numeric(18, 4), nullable=True)
    total_liabilities = Column(Numeric(18, 4), nullable=True)
    net_assets = Column(Numeric(18, 4), nullable=True)
    snapshot_data = Column(JSON, nullable=True)   # 자산 카테고리별 상세 내역
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LedgerTransaction(Base):
    __tablename__ = "ledger_transaction"

    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(DateTime, nullable=True, index=True)
    transaction_time = Column(String, nullable=True)
    transaction_type = Column(String, nullable=True, index=True)  # 지출/수입/이체
    category = Column(String, nullable=True, index=True)          # 대분류
    subcategory = Column(String, nullable=True)                   # 소분류
    description = Column(String, nullable=True)                   # 내용
    amount = Column(Numeric(15, 2), nullable=True)
    currency = Column(String, nullable=True)
    payment_method = Column(String, nullable=True)                # 결제수단
    memo = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UploadHistory(Base):
    __tablename__ = "upload_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)       # bytes
    result_json = Column(JSON, nullable=True)        # import 결과 (upsert 건수 등)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
