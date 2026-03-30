from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


# ── Customer ────────────────────────────────────────────────
class CustomerBase(BaseModel):
    name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    credit_score: Optional[int] = None
    email: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    credit_score: Optional[int] = None
    email: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── CashFlow ─────────────────────────────────────────────────
class CashFlowBase(BaseModel):
    item_name: str
    item_type: Optional[str] = None
    total: Optional[float] = None
    monthly_average: Optional[float] = None
    monthly_data: Optional[Dict[str, Any]] = None

class CashFlowCreate(CashFlowBase):
    pass

class CashFlowUpdate(BaseModel):
    item_name: Optional[str] = None
    item_type: Optional[str] = None
    total: Optional[float] = None
    monthly_average: Optional[float] = None
    monthly_data: Optional[Dict[str, Any]] = None

class CashFlowResponse(CashFlowBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── FixedExpense ──────────────────────────────────────────────
class FixedExpenseBase(BaseModel):
    account_number: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder: Optional[str] = None
    transfer_name: Optional[str] = None
    category: str
    item_name: str
    monthly_amount: Optional[float] = None
    monthly_data: Optional[Dict[str, Any]] = None

class FixedExpenseCreate(FixedExpenseBase):
    pass

class FixedExpenseUpdate(BaseModel):
    account_number: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder: Optional[str] = None
    transfer_name: Optional[str] = None
    category: Optional[str] = None
    item_name: Optional[str] = None
    monthly_amount: Optional[float] = None
    monthly_data: Optional[Dict[str, Any]] = None

class FixedExpenseResponse(FixedExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── MonthlySummary ────────────────────────────────────────────
class MonthlySummaryBase(BaseModel):
    year: int
    month: int
    income: Optional[float] = None
    expense: Optional[float] = None
    net_income: Optional[float] = None
    cumulative_net_income: Optional[float] = None
    investment_principal: Optional[float] = None
    investment_value: Optional[float] = None

class MonthlySummaryCreate(MonthlySummaryBase):
    pass

class MonthlySummaryUpdate(BaseModel):
    year: Optional[int] = None
    month: Optional[int] = None
    income: Optional[float] = None
    expense: Optional[float] = None
    net_income: Optional[float] = None
    cumulative_net_income: Optional[float] = None
    investment_principal: Optional[float] = None
    investment_value: Optional[float] = None

class MonthlySummaryResponse(MonthlySummaryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── FinancialGoal ─────────────────────────────────────────────
class FinancialGoalBase(BaseModel):
    goal_name: str
    target_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    interest_rate: Optional[float] = None
    total_weeks: Optional[int] = None
    elapsed_weeks: Optional[int] = None
    remaining_weeks: Optional[int] = None
    progress_rate: Optional[float] = None
    weekly_allocation: Optional[float] = None
    planned_data: Optional[List[Dict[str, Any]]] = None
    actual_data: Optional[List[Dict[str, Any]]] = None

class FinancialGoalCreate(FinancialGoalBase):
    pass

class FinancialGoalUpdate(BaseModel):
    goal_name: Optional[str] = None
    target_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    interest_rate: Optional[float] = None
    total_weeks: Optional[int] = None
    elapsed_weeks: Optional[int] = None
    remaining_weeks: Optional[int] = None
    progress_rate: Optional[float] = None
    weekly_allocation: Optional[float] = None
    planned_data: Optional[List[Dict[str, Any]]] = None
    actual_data: Optional[List[Dict[str, Any]]] = None

class FinancialGoalResponse(FinancialGoalBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── RealEstateAnalysis ────────────────────────────────────────
class RealEstateAnalysisBase(BaseModel):
    property_name: Optional[str] = None
    total_acquisition_cost: Optional[float] = None
    self_capital: Optional[float] = None
    loan_capital: Optional[float] = None
    current_market_value: Optional[float] = None
    unrealized_gain: Optional[float] = None
    roe: Optional[float] = None
    leverage_multiple: Optional[float] = None
    acceleration_factor: Optional[float] = None
    analysis_data: Optional[Dict[str, Any]] = None

class RealEstateAnalysisCreate(RealEstateAnalysisBase):
    pass

class RealEstateAnalysisUpdate(RealEstateAnalysisBase):
    pass

class RealEstateAnalysisResponse(RealEstateAnalysisBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
