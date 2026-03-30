from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class UploadHistoryResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    sheet_count: int
    
    class Config:
        from_attributes = True

class SheetDataResponse(BaseModel):
    id: int
    upload_id: int
    sheet_name: str
    row_count: int
    column_count: int
    
    class Config:
        from_attributes = True

class DataRecordResponse(BaseModel):
    id: int
    sheet_id: int
    row_index: int
    data: Dict[str, Any]
    
    class Config:
        from_attributes = True

class UploadResponse(BaseModel):
    upload_id: int
    filename: str
    sheet_count: int
    message: str

class SheetWithDataResponse(BaseModel):
    sheet: SheetDataResponse
    records: List[DataRecordResponse]

class CustomerBase(BaseModel):
    name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    credit_score: Optional[int] = None
    email: Optional[str] = None

class CustomerCreate(CustomerBase):
    data_record_id: Optional[int] = None

class CustomerResponse(CustomerBase):
    id: int
    upload_id: Optional[int] = None
    data_record_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CashFlowBase(BaseModel):
    item_name: str
    item_type: Optional[str] = None
    total: Optional[float] = None
    monthly_average: Optional[float] = None
    monthly_data: Optional[Dict[str, Any]] = None

class CashFlowCreate(CashFlowBase):
    sheet_id: int
    data_record_id: Optional[int] = None

class CashFlowResponse(CashFlowBase):
    id: int
    sheet_id: int
    upload_id: Optional[int] = None
    data_record_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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
    sheet_id: int
    data_record_id: Optional[int] = None

class FixedExpenseResponse(FixedExpenseBase):
    id: int
    sheet_id: int
    upload_id: Optional[int] = None
    data_record_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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
    sheet_id: int
    data_record_id: Optional[int] = None

class MonthlySummaryResponse(MonthlySummaryBase):
    id: int
    sheet_id: int
    upload_id: Optional[int] = None
    data_record_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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
    sheet_id: int

class FinancialGoalResponse(FinancialGoalBase):
    id: int
    sheet_id: int
    upload_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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
    sheet_id: int
    data_record_id: Optional[int] = None

class RealEstateAnalysisResponse(RealEstateAnalysisBase):
    id: int
    sheet_id: int
    upload_id: Optional[int] = None
    data_record_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

