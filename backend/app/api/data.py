from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import (
    Customer, CashFlow, FixedExpense,
    MonthlySummary, FinancialGoal, RealEstateAnalysis,
)
from app.schemas.schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    CashFlowCreate, CashFlowUpdate, CashFlowResponse,
    FixedExpenseCreate, FixedExpenseUpdate, FixedExpenseResponse,
    MonthlySummaryCreate, MonthlySummaryUpdate, MonthlySummaryResponse,
    FinancialGoalCreate, FinancialGoalUpdate, FinancialGoalResponse,
    RealEstateAnalysisCreate, RealEstateAnalysisUpdate, RealEstateAnalysisResponse,
)

router = APIRouter()


# ── Customer ─────────────────────────────────────────────────
@router.get("/customers", response_model=List[CustomerResponse])
async def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Customer).offset(skip).limit(limit).all()

@router.post("/customers", response_model=CustomerResponse)
async def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    obj = Customer(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    obj = db.query(Customer).filter(Customer.id == customer_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="고객 정보를 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    obj = db.query(Customer).filter(Customer.id == customer_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="고객 정보를 찾을 수 없습니다.")
    db.delete(obj)
    db.commit()
    return {"ok": True}


# ── CashFlow ──────────────────────────────────────────────────
@router.get("/cash-flows", response_model=List[CashFlowResponse])
async def get_cash_flows(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return db.query(CashFlow).offset(skip).limit(limit).all()

@router.post("/cash-flows", response_model=CashFlowResponse)
async def create_cash_flow(data: CashFlowCreate, db: Session = Depends(get_db)):
    obj = CashFlow(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/cash-flows/{cash_flow_id}", response_model=CashFlowResponse)
async def update_cash_flow(cash_flow_id: int, data: CashFlowUpdate, db: Session = Depends(get_db)):
    obj = db.query(CashFlow).filter(CashFlow.id == cash_flow_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="현금흐름 항목을 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/cash-flows/{cash_flow_id}")
async def delete_cash_flow(cash_flow_id: int, db: Session = Depends(get_db)):
    obj = db.query(CashFlow).filter(CashFlow.id == cash_flow_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="현금흐름 항목을 찾을 수 없습니다.")
    db.delete(obj)
    db.commit()
    return {"ok": True}


# ── FixedExpense ──────────────────────────────────────────────
@router.get("/fixed-expenses", response_model=List[FixedExpenseResponse])
async def get_fixed_expenses(
    skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)
):
    return db.query(FixedExpense).offset(skip).limit(limit).all()

@router.post("/fixed-expenses", response_model=FixedExpenseResponse)
async def create_fixed_expense(data: FixedExpenseCreate, db: Session = Depends(get_db)):
    obj = FixedExpense(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/fixed-expenses/{expense_id}", response_model=FixedExpenseResponse)
async def update_fixed_expense(expense_id: int, data: FixedExpenseUpdate, db: Session = Depends(get_db)):
    obj = db.query(FixedExpense).filter(FixedExpense.id == expense_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="고정비 항목을 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/fixed-expenses/{expense_id}")
async def delete_fixed_expense(expense_id: int, db: Session = Depends(get_db)):
    obj = db.query(FixedExpense).filter(FixedExpense.id == expense_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="고정비 항목을 찾을 수 없습니다.")
    db.delete(obj)
    db.commit()
    return {"ok": True}


# ── MonthlySummary ────────────────────────────────────────────
@router.get("/monthly-summaries", response_model=List[MonthlySummaryResponse])
async def get_monthly_summaries(
    year: Optional[int] = None,
    skip: int = 0, limit: int = 1000,
    db: Session = Depends(get_db),
):
    q = db.query(MonthlySummary)
    if year:
        q = q.filter(MonthlySummary.year == year)
    return q.order_by(MonthlySummary.year, MonthlySummary.month).offset(skip).limit(limit).all()

@router.post("/monthly-summaries", response_model=MonthlySummaryResponse)
async def create_monthly_summary(data: MonthlySummaryCreate, db: Session = Depends(get_db)):
    obj = MonthlySummary(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/monthly-summaries/{summary_id}", response_model=MonthlySummaryResponse)
async def update_monthly_summary(summary_id: int, data: MonthlySummaryUpdate, db: Session = Depends(get_db)):
    obj = db.query(MonthlySummary).filter(MonthlySummary.id == summary_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="월별 결산 항목을 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/monthly-summaries/{summary_id}")
async def delete_monthly_summary(summary_id: int, db: Session = Depends(get_db)):
    obj = db.query(MonthlySummary).filter(MonthlySummary.id == summary_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="월별 결산 항목을 찾을 수 없습니다.")
    db.delete(obj)
    db.commit()
    return {"ok": True}


# ── FinancialGoal ─────────────────────────────────────────────
@router.get("/financial-goals", response_model=List[FinancialGoalResponse])
async def get_financial_goals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(FinancialGoal).offset(skip).limit(limit).all()

@router.post("/financial-goals", response_model=FinancialGoalResponse)
async def create_financial_goal(data: FinancialGoalCreate, db: Session = Depends(get_db)):
    obj = FinancialGoal(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/financial-goals/{goal_id}", response_model=FinancialGoalResponse)
async def update_financial_goal(goal_id: int, data: FinancialGoalUpdate, db: Session = Depends(get_db)):
    obj = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="재무 목표를 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/financial-goals/{goal_id}")
async def delete_financial_goal(goal_id: int, db: Session = Depends(get_db)):
    obj = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="재무 목표를 찾을 수 없습니다.")
    db.delete(obj)
    db.commit()
    return {"ok": True}


# ── RealEstateAnalysis ────────────────────────────────────────
@router.get("/real-estate-analyses", response_model=List[RealEstateAnalysisResponse])
async def get_real_estate_analyses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(RealEstateAnalysis).offset(skip).limit(limit).all()

@router.post("/real-estate-analyses", response_model=RealEstateAnalysisResponse)
async def create_real_estate_analysis(data: RealEstateAnalysisCreate, db: Session = Depends(get_db)):
    obj = RealEstateAnalysis(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/real-estate-analyses/{analysis_id}", response_model=RealEstateAnalysisResponse)
async def update_real_estate_analysis(analysis_id: int, data: RealEstateAnalysisUpdate, db: Session = Depends(get_db)):
    obj = db.query(RealEstateAnalysis).filter(RealEstateAnalysis.id == analysis_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="부동산 수익분석을 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/real-estate-analyses/{analysis_id}")
async def delete_real_estate_analysis(analysis_id: int, db: Session = Depends(get_db)):
    obj = db.query(RealEstateAnalysis).filter(RealEstateAnalysis.id == analysis_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="부동산 수익분석을 찾을 수 없습니다.")
    db.delete(obj)
    db.commit()
    return {"ok": True}
