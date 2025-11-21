from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import datetime, date, time
from app.models import UploadHistory, SheetData, DataRecord, Customer, CashFlow

def create_upload_history(db: Session, filename: str, sheet_count: int) -> UploadHistory:
    """업로드 이력 생성"""
    upload = UploadHistory(filename=filename, sheet_count=sheet_count)
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload

def create_sheet_data(db: Session, upload_id: int, sheet_name: str, row_count: int, column_count: int) -> SheetData:
    """시트 데이터 생성"""
    sheet = SheetData(
        upload_id=upload_id,
        sheet_name=sheet_name,
        row_count=row_count,
        column_count=column_count
    )
    db.add(sheet)
    db.commit()
    db.refresh(sheet)
    return sheet

def _convert_datetime_to_string(value: Any) -> Any:
    """
    datetime, date, time 객체를 ISO 형식 문자열로 변환합니다.
    다른 타입의 값은 그대로 반환합니다.
    
    Args:
        value: 변환할 값
    
    Returns:
        datetime/date/time 객체는 ISO 형식 문자열, 그 외는 원본 값
    """
    if isinstance(value, datetime):
        return value.isoformat()
    elif isinstance(value, date):
        return value.isoformat()
    elif isinstance(value, time):
        return value.isoformat()
    return value

def create_data_records(db: Session, sheet_id: int, data: List[List[Any]]) -> List[DataRecord]:
    """데이터 레코드 생성"""
    records = []
    for row_index, row_data in enumerate(data):
        # 행 데이터를 딕셔너리로 변환 (열 인덱스를 키로 사용)
        # datetime 객체가 있는 경우 문자열로 변환 (이중 보호)
        row_dict = {str(i): _convert_datetime_to_string(value) for i, value in enumerate(row_data)}
        record = DataRecord(
            sheet_id=sheet_id,
            row_index=row_index,
            data=row_dict
        )
        records.append(record)
    
    db.add_all(records)
    db.commit()
    return records

def get_upload_history_list(db: Session, skip: int = 0, limit: int = 100) -> List[UploadHistory]:
    """업로드 이력 목록 조회"""
    return db.query(UploadHistory).offset(skip).limit(limit).all()

def get_upload_history(db: Session, upload_id: int) -> Optional[UploadHistory]:
    """업로드 이력 조회"""
    return db.query(UploadHistory).filter(UploadHistory.id == upload_id).first()

def get_sheets_by_upload(db: Session, upload_id: int) -> List[SheetData]:
    """업로드 ID로 시트 목록 조회"""
    return db.query(SheetData).filter(SheetData.upload_id == upload_id).all()

def get_sheet_data(db: Session, sheet_id: int) -> Optional[SheetData]:
    """시트 데이터 조회"""
    return db.query(SheetData).filter(SheetData.id == sheet_id).first()

def get_records_by_sheet(db: Session, sheet_id: int, skip: int = 0, limit: int = 1000) -> List[DataRecord]:
    """시트 ID로 데이터 레코드 조회"""
    return db.query(DataRecord).filter(DataRecord.sheet_id == sheet_id).offset(skip).limit(limit).all()

def extract_and_save_customer_from_data_record(db: Session, sheet_id: int) -> Optional[Customer]:
    """
    data_record에서 고객정보를 추출하여 customer 테이블에 저장합니다.
    
    고객정보는 보통 헤더 행(이름, 성별, 연령 등) 다음 행에 위치합니다.
    
    Args:
        db: 데이터베이스 세션
        sheet_id: 시트 ID
    
    Returns:
        생성된 Customer 객체 또는 None
    """
    # 시트의 모든 레코드 조회
    records = db.query(DataRecord).filter(DataRecord.sheet_id == sheet_id).order_by(DataRecord.row_index).all()
    
    if not records:
        return None
    
    # 헤더 행 찾기 (이름, 성별, 연령 등의 키워드가 있는 행)
    header_row_index = None
    for record in records:
        data = record.data
        col1 = data.get("1", "").strip() if data.get("1") else ""
        # 헤더 행 확인 (이름, 성별 등의 키워드 포함)
        if col1 in ["이름", "고객정보"] or "이름" in col1:
            header_row_index = record.row_index
            break
    
    if header_row_index is None:
        return None
    
    # 헤더 행 다음 행이 고객정보 데이터
    customer_record = None
    for record in records:
        if record.row_index == header_row_index + 1:
            customer_record = record
            break
    
    if not customer_record:
        return None
    
    data = customer_record.data
    
    # 고객정보 추출
    name = data.get("1", "").strip() if data.get("1") else ""
    gender = data.get("2", "").strip() if data.get("2") else None
    age_str = data.get("3", "")
    credit_score_str = data.get("4", "")
    email = data.get("5", "").strip() if data.get("5") else None
    
    # 이름이 없으면 고객정보가 아님
    if not name or name in ["항목", "2.현금흐름현황"]:
        return None
    
    # 나이와 신용점수 변환
    age = None
    if age_str:
        try:
            age = int(age_str) if isinstance(age_str, (int, str)) and str(age_str).isdigit() else None
        except (ValueError, TypeError):
            age = None
    
    credit_score = None
    if credit_score_str:
        try:
            credit_score = int(credit_score_str) if isinstance(credit_score_str, (int, str)) and str(credit_score_str).isdigit() else None
        except (ValueError, TypeError):
            credit_score = None
    
    # 이메일이 "-"이면 None으로 처리
    if email == "-" or email == "":
        email = None
    
    # 이미 존재하는 고객인지 확인 (같은 data_record_id로)
    existing_customer = db.query(Customer).filter(Customer.data_record_id == customer_record.id).first()
    if existing_customer:
        # 기존 고객 정보 업데이트
        existing_customer.name = name
        existing_customer.gender = gender
        existing_customer.age = age
        existing_customer.credit_score = credit_score
        existing_customer.email = email
        existing_customer.updated_at = datetime.now()
        db.commit()
        db.refresh(existing_customer)
        return existing_customer
    
    # 새 고객 생성
    customer = Customer(
        name=name,
        gender=gender,
        age=age,
        credit_score=credit_score,
        email=email,
        data_record_id=customer_record.id
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

def extract_and_save_cash_flows_from_data_record(db: Session, sheet_id: int) -> List[CashFlow]:
    """
    data_record에서 현금 흐름 현황을 추출하여 cash_flow 테이블에 저장합니다.
    
    현금 흐름 현황은 "2.현금흐름현황" 헤더 다음에 위치하며,
    헤더 행(항목, 총계, 월평균, 월별...) 다음 행부터 실제 데이터입니다.
    
    Args:
        db: 데이터베이스 세션
        sheet_id: 시트 ID
    
    Returns:
        생성된 CashFlow 객체 리스트
    """
    # 시트의 모든 레코드 조회
    records = db.query(DataRecord).filter(DataRecord.sheet_id == sheet_id).order_by(DataRecord.row_index).all()
    
    if not records:
        return []
    
    # "2.현금흐름현황" 헤더 찾기
    cash_flow_start_index = None
    for record in records:
        data = record.data
        col1_raw = data.get("1", "")
        if isinstance(col1_raw, (int, float)):
            col1 = str(col1_raw).strip()
        elif isinstance(col1_raw, str):
            col1 = col1_raw.strip()
        else:
            col1 = ""
        if "현금흐름현황" in col1 or "현금흐름" in col1:
            cash_flow_start_index = record.row_index
            break
    
    if cash_flow_start_index is None:
        return []
    
    # 헤더 행 찾기 (항목, 총계, 월평균 등이 있는 행)
    header_row_index = None
    monthly_headers = {}  # {column_index: month_string}
    
    for record in records:
        if record.row_index <= cash_flow_start_index:
            continue
        data = record.data
        col1_raw = data.get("1", "")
        if isinstance(col1_raw, (int, float)):
            col1 = str(col1_raw).strip()
        elif isinstance(col1_raw, str):
            col1 = col1_raw.strip()
        else:
            col1 = ""
        if col1 == "항목":
            header_row_index = record.row_index
            # 월별 헤더 추출 (col 4부터)
            for col_idx in range(4, 17):  # 일반적으로 4~16까지 월별 데이터
                month_str_raw = data.get(str(col_idx), "")
                if isinstance(month_str_raw, (int, float)):
                    month_str = str(month_str_raw).strip()
                elif isinstance(month_str_raw, str):
                    month_str = month_str_raw.strip()
                else:
                    month_str = ""
                if month_str and month_str not in ["총계", "월평균"]:
                    monthly_headers[str(col_idx)] = month_str
            break
    
    if header_row_index is None:
        return []
    
    # 데이터 행들 추출 (헤더 행 다음부터)
    cash_flows = []
    for record in records:
        if record.row_index <= header_row_index:
            continue
        
        data = record.data
        # item_name 추출 (문자열로 변환 후 strip)
        item_name_raw = data.get("1", "")
        if isinstance(item_name_raw, (int, float)):
            item_name = str(item_name_raw).strip()
        elif isinstance(item_name_raw, str):
            item_name = item_name_raw.strip()
        else:
            item_name = ""
        
        # 항목명이 없거나 특정 키워드면 건너뛰기 (요약 행 및 헤더 제외)
        exclude_keywords = [
            "항목", 
            "2.현금흐름현황", 
            "최근 1년 동안의 현금흐름을 분석합니다.",
            "월수입 총계",
            "월지출 총계",
            "순수입 총계",
            "총계",
            "현금 자산",
            "데이터를 내보낸 시점의 자산과 부채 상태를 분석합니다.",
            "사용자가 보유한 대출상품 현황을 분석합니다.",
            "사용자가 보유한 보험상품 현황을 분석합니다.",
            "사용자가 보유한 투자상품 현황을 분석합니다.",
            "대출종류",
            "금융사"
        ]
        
        # 숫자만 있는 항목 제외
        import re
        if not item_name or item_name in exclude_keywords:
            continue
        
        # "총계", "현황", "분석" 키워드가 포함된 항목 제외
        if "총계" in item_name or "현황" in item_name or "분석" in item_name:
            continue
        
        # 숫자로만 구성된 항목 제외
        if re.match(r'^[\d.]+$', item_name):
            continue
        
        # 섹션 헤더 제외 (예: "3.재무현황", "4.보험현황" 등)
        if re.match(r'^\d+\.', item_name):
            continue
        
        # 재무현황 섹션의 항목들 제외 (자산 관련 항목들)
        asset_keywords = ["자산", "부동산", "동산", "주식", "연금", "신탁", "보험", "저축", "투자상품", 
                         "삼성생명", "삼성화재", "현대해상", "순자산", "총자산", "전자금융"]
        if any(keyword in item_name for keyword in asset_keywords):
            continue
        
        # 총계와 월평균 추출
        total_str = data.get("2", "")
        monthly_avg_str = data.get("3", "")
        
        total = None
        if total_str:
            try:
                if isinstance(total_str, (int, float)):
                    total = float(total_str)
                elif isinstance(total_str, str) and total_str.strip():
                    # 숫자 문자열인지 확인 (소수점, 음수 포함)
                    cleaned = total_str.strip().replace(',', '')
                    if cleaned.replace('.', '').replace('-', '').isdigit():
                        total = float(cleaned)
            except (ValueError, TypeError):
                total = None
        
        monthly_average = None
        if monthly_avg_str:
            try:
                if isinstance(monthly_avg_str, (int, float)):
                    monthly_average = float(monthly_avg_str)
                elif isinstance(monthly_avg_str, str) and monthly_avg_str.strip():
                    cleaned = monthly_avg_str.strip().replace(',', '')
                    if cleaned.replace('.', '').replace('-', '').isdigit():
                        monthly_average = float(cleaned)
            except (ValueError, TypeError):
                monthly_average = None
        
        # 월별 데이터 추출
        monthly_data = {}
        for col_idx, month_str in monthly_headers.items():
            amount_str = data.get(col_idx, "")
            if amount_str:
                try:
                    if isinstance(amount_str, (int, float)):
                        amount = float(amount_str)
                    elif isinstance(amount_str, str) and amount_str.strip():
                        cleaned = str(amount_str).strip().replace(',', '')
                        if cleaned.replace('.', '').replace('-', '').isdigit():
                            amount = float(cleaned)
                        else:
                            amount = None
                    else:
                        amount = None
                    if amount is not None:
                        monthly_data[month_str] = amount
                except (ValueError, TypeError):
                    pass
        
        # 항목 타입 판단 (수입/지출)
        # 수입 항목들
        income_keywords = ["수입", "급여", "상여", "용돈", "금융수입", "기타수입", "사업수입", "앱테크"]
        # 지출 항목들
        expense_keywords = ["지출", "경조", "선물", "교육", "학습", "교통", "금융", "문화", "여가", 
                          "뷰티", "미용", "생활", "식비", "여행", "숙박", "온라인쇼핑", "의료", "건강",
                          "자녀", "육아", "자동차", "주거", "통신", "카페", "간식", "패션", "쇼핑"]
        
        item_type = None
        if any(keyword in item_name for keyword in income_keywords):
            item_type = "수입"
        elif any(keyword in item_name for keyword in expense_keywords):
            item_type = "지출"
        
        # 기존 cash_flow 확인 (같은 sheet_id와 item_name으로)
        existing = db.query(CashFlow).filter(
            CashFlow.sheet_id == sheet_id,
            CashFlow.item_name == item_name
        ).first()
        
        if existing:
            # 기존 데이터 업데이트
            existing.item_type = item_type
            existing.total = total
            existing.monthly_average = monthly_average
            existing.monthly_data = monthly_data
            existing.data_record_id = record.id
            existing.updated_at = datetime.now()
            db.commit()
            db.refresh(existing)
            cash_flows.append(existing)
        else:
            # 새 cash_flow 생성
            cash_flow = CashFlow(
                sheet_id=sheet_id,
                item_name=item_name,
                item_type=item_type,
                total=total,
                monthly_average=monthly_average,
                monthly_data=monthly_data,
                data_record_id=record.id
            )
            db.add(cash_flow)
            db.commit()
            db.refresh(cash_flow)
            cash_flows.append(cash_flow)
    
    return cash_flows

