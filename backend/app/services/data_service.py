from sqlalchemy.orm import Session
import re
from calendar import monthrange
from typing import List, Optional, Any, Tuple
from datetime import datetime, date, time
from app.models import UploadHistory, SheetData, DataRecord, Customer, CashFlow

def parse_date_range_from_filename(filename: str) -> Optional[Tuple[date, date]]:
    """
    파일명에서 날짜 범위를 추출합니다.
    형식: YYYY-MM-DD~YYYY-MM-DD (확장자 제외)
    예: 2024-08-13~2025-08-13.xlsx -> (2024-08-13, 2025-08-13)
    """
    # 확장자 제거
    base_name = filename.rsplit('.', 1)[0]
    
    # 정규식 패턴: YYYY-MM-DD~YYYY-MM-DD
    # 예: 2024-08-13~2025-08-13
    pattern = r'(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})'
    match = re.search(pattern, base_name)
    
    if match:
        try:
            start_str, end_str = match.groups()
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            return start_date, end_date
        except ValueError:
            return None
            
    return None

def is_date_in_range(target_date: date, start_date: date, end_date: date) -> bool:
    """
    특정 날짜가 날짜 범위에 포함되는지 확인합니다.
    
    Args:
        target_date: 확인할 날짜
        start_date: 범위 시작일
        end_date: 범위 종료일
    
    Returns:
        날짜가 범위에 포함되면 True
    """
    return start_date <= target_date <= end_date

def is_upload_newer(new_upload: UploadHistory, old_upload: UploadHistory) -> bool:
    """
    두 업로드 중 새로운 업로드(new_upload)가 더 최신인지 판단합니다.
    파일명의 날짜 범위를 우선적으로 비교하고, 실패 시 업로드 시간을 비교합니다.
    """
    new_range = parse_date_range_from_filename(new_upload.filename)
    old_range = parse_date_range_from_filename(old_upload.filename)
    
    if new_range and old_range:
        # 시작 날짜 비교
        if new_range[0] > old_range[0]:
            return True
        elif new_range[0] < old_range[0]:
            return False
        # 시작 날짜가 같으면 종료 날짜 비교
        if new_range[1] > old_range[1]:
            return True
        elif new_range[1] < old_range[1]:
            return False
            
    # 날짜 범위 파싱 실패 시 업로드 시간 비교
    return new_upload.uploaded_at > old_upload.uploaded_at

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

def get_records_by_ids(db: Session, record_ids: List[int]) -> List[DataRecord]:
    """레코드 ID 리스트로 레코드 조회"""
    if not record_ids:
        return []
    return db.query(DataRecord).filter(DataRecord.id.in_(record_ids)).all()

def extract_and_save_customer_from_data_record(db: Session, sheet_id: int, upload_id: int) -> Optional[Customer]:
    """
    data_record에서 고객정보를 추출하여 customer 테이블에 저장합니다.
    
    고객정보는 보통 헤더 행(이름, 성별, 연령 등) 다음 행에 위치합니다.
    
    Args:
        db: 데이터베이스 세션
        sheet_id: 시트 ID
        upload_id: 업로드 ID
    
    Returns:
        생성된 Customer 객체 또는 None
    """
    # 시트 정보 조회 (upload_id 확인용)
    sheet = db.query(SheetData).filter(SheetData.id == sheet_id).first()
    if not sheet:
        return None
    
    # upload_id가 제공되지 않으면 시트에서 가져오기
    if upload_id is None:
        upload_id = sheet.upload_id
    
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
    
    # 업로드 정보 조회 (업로드 날짜 비교용)
    current_upload = db.query(UploadHistory).filter(UploadHistory.id == upload_id).first()
    if not current_upload:
        return None
    
    # 같은 이름과 upload_id를 가진 고객 확인
    existing_customer = db.query(Customer).filter(
        Customer.name == name,
        Customer.upload_id == upload_id
    ).first()
    
    if existing_customer:
        # 기존 고객 정보 업데이트
        existing_customer.name = name
        existing_customer.gender = gender
        existing_customer.age = age
        existing_customer.credit_score = credit_score
        existing_customer.email = email
        existing_customer.data_record_id = customer_record.id
        existing_customer.updated_at = datetime.now()
        db.commit()
        db.refresh(existing_customer)
        return existing_customer
    
    # 같은 이름의 다른 업로드 고객 확인 (날짜 범위 기반 우선순위)
    existing_customer_by_name = db.query(Customer).filter(
        Customer.name == name
    ).join(UploadHistory, Customer.upload_id == UploadHistory.id).order_by(
        UploadHistory.uploaded_at.desc()
    ).first()
    
    if existing_customer_by_name:
        existing_upload = db.query(UploadHistory).filter(
            UploadHistory.id == existing_customer_by_name.upload_id
        ).first()
        
        if existing_upload:
            # 현재 날짜 기준으로 우선순위 결정
            today = date.today()
            current_range = parse_date_range_from_filename(current_upload.filename)
            existing_range = parse_date_range_from_filename(existing_upload.filename)
            
            current_in_range = False
            if current_range:
                current_in_range = is_date_in_range(today, current_range[0], current_range[1])
            else:
                # 날짜 파싱 실패 시 업로드 시간 기준
                current_in_range = True
            
            existing_in_range = False
            if existing_range:
                existing_in_range = is_date_in_range(today, existing_range[0], existing_range[1])
            else:
                existing_in_range = True
            
            # 우선순위 결정
            should_update = False
            if current_in_range and not existing_in_range:
                # 현재 파일에만 포함되면 업데이트
                should_update = True
            elif not current_in_range and existing_in_range:
                # 기존 파일에만 포함되면 유지
                should_update = False
            else:
                # 둘 다 포함되거나 둘 다 포함 안되면, 더 최신 파일 우선
                should_update = is_upload_newer(current_upload, existing_upload)
            
            if should_update:
                existing_customer_by_name.name = name
                existing_customer_by_name.gender = gender
                existing_customer_by_name.age = age
                existing_customer_by_name.credit_score = credit_score
                existing_customer_by_name.email = email
                existing_customer_by_name.upload_id = upload_id
                existing_customer_by_name.data_record_id = customer_record.id
                existing_customer_by_name.updated_at = datetime.now()
                db.commit()
                db.refresh(existing_customer_by_name)
                return existing_customer_by_name
    
    # 새 고객 생성
    customer = Customer(
        name=name,
        gender=gender,
        age=age,
        credit_score=credit_score,
        email=email,
        upload_id=upload_id,
        data_record_id=customer_record.id
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

def extract_and_save_cash_flows_from_data_record(db: Session, sheet_id: int, upload_id: int) -> List[CashFlow]:
    """
    data_record에서 현금 흐름 현황을 추출하여 cash_flow 테이블에 저장합니다.
    
    현금 흐름 현황은 "2.현금흐름현황" 헤더 다음에 위치하며,
    헤더 행(항목, 총계, 월평균, 월별...) 다음 행부터 실제 데이터입니다.
    
    Args:
        db: 데이터베이스 세션
        sheet_id: 시트 ID
        upload_id: 업로드 ID
    
    Returns:
        생성된 CashFlow 객체 리스트
    """
    # 시트 정보 조회 (upload_id 확인용)
    sheet = db.query(SheetData).filter(SheetData.id == sheet_id).first()
    if not sheet:
        return []
    
    # upload_id가 제공되지 않으면 시트에서 가져오기
    if upload_id is None:
        upload_id = sheet.upload_id
    
    # 업로드 정보 조회 (업로드 날짜 비교용)
    current_upload = db.query(UploadHistory).filter(UploadHistory.id == upload_id).first()
    if not current_upload:
        return []
    
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
        
        # 같은 sheet_id, item_name과 upload_id를 가진 cash_flow 확인
        existing = db.query(CashFlow).filter(
            CashFlow.sheet_id == sheet_id,
            CashFlow.item_name == item_name,
            CashFlow.upload_id == upload_id
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
            # 같은 항목명의 다른 업로드 cash_flow 확인 (최신 업로드 날짜로 업데이트)
            existing_by_item = db.query(CashFlow).filter(
                CashFlow.item_name == item_name
            ).join(UploadHistory, CashFlow.upload_id == UploadHistory.id).order_by(
                UploadHistory.uploaded_at.desc()
            ).first()
            
            if existing_by_item:
                existing_upload = db.query(UploadHistory).filter(
                    UploadHistory.id == existing_by_item.upload_id
                ).first()
                
                # 병합 로직
                if existing_upload:
                    # 날짜 범위 파싱
                    current_range = parse_date_range_from_filename(current_upload.filename)
                    existing_range = parse_date_range_from_filename(existing_upload.filename)
                    
                    # 누가 더 최신 파일인지 판단 (시작 날짜 기준)
                    current_is_newer = is_upload_newer(current_upload, existing_upload)
                    
                    # 월별 데이터 병합
                    merged_monthly_data = {}
                    if existing_by_item.monthly_data:
                        merged_monthly_data = dict(existing_by_item.monthly_data)
                    
                    # 병합 수행
                    for month_key, amount in monthly_data.items():
                        # month_key: "YYYY-MM"
                        # 기존 값 확인
                        existing_amount = merged_monthly_data.get(month_key)
                        
                        if existing_amount is None:
                            # 기존에 없으면 추가
                            merged_monthly_data[month_key] = amount
                        else:
                            # 충돌 시 우선순위 결정: 해당 월이 포함된 파일 선택
                            should_update = False
                            
                            try:
                                # 월의 시작일과 종료일 계산 (해당 월의 첫날과 마지막날)
                                year, month = map(int, month_key.split('-'))
                                month_start = date(year, month, 1)
                                # 해당 월의 마지막날 계산
                                month_end = date(year, month, monthrange(year, month)[1])
                                
                                # 각 파일의 날짜 범위에 해당 월이 포함되는지 확인
                                current_in_range = False
                                if current_range:
                                    # 현재 파일의 범위에 해당 월이 포함되는지 확인
                                    # 월의 시작일이 파일 범위에 포함되거나, 월의 종료일이 파일 범위에 포함되면 유효
                                    current_in_range = (
                                        is_date_in_range(month_start, current_range[0], current_range[1]) or
                                        is_date_in_range(month_end, current_range[0], current_range[1]) or
                                        (month_start <= current_range[0] <= month_end) or
                                        (month_start <= current_range[1] <= month_end)
                                    )
                                else:
                                    # 날짜 파싱 실패 시, 업로드 시간 기준으로 판단
                                    current_in_range = True

                                existing_in_range = False
                                if existing_range:
                                    existing_in_range = (
                                        is_date_in_range(month_start, existing_range[0], existing_range[1]) or
                                        is_date_in_range(month_end, existing_range[0], existing_range[1]) or
                                        (month_start <= existing_range[0] <= month_end) or
                                        (month_start <= existing_range[1] <= month_end)
                                    )
                                else:
                                    existing_in_range = True
                                
                                # 우선순위 결정
                                if current_in_range and not existing_in_range:
                                    # 현재 파일에만 포함되면 업데이트
                                    should_update = True
                                elif not current_in_range and existing_in_range:
                                    # 기존 파일에만 포함되면 유지
                                    should_update = False
                                else:
                                    # 둘 다 포함되거나 둘 다 포함 안되면, 더 최신 파일 우선
                                    if current_is_newer:
                                        should_update = True
                                
                            except Exception:
                                # 날짜 계산 중 에러 발생 시 최신 파일 우선
                                if current_is_newer:
                                    should_update = True
                            
                            if should_update:
                                merged_monthly_data[month_key] = amount
                    
                    # DB 업데이트
                    existing_by_item.monthly_data = merged_monthly_data
                    existing_by_item.updated_at = datetime.now()
                    
                    # 현재 파일이 더 최신이면 메타데이터도 업데이트
                    if current_is_newer:
                        existing_by_item.item_type = item_type
                        existing_by_item.total = total
                        existing_by_item.monthly_average = monthly_average
                        existing_by_item.upload_id = upload_id
                        existing_by_item.sheet_id = sheet_id
                        existing_by_item.data_record_id = record.id
                    
                    db.commit()
                    db.refresh(existing_by_item)
                    cash_flows.append(existing_by_item)
                else:
                    # 기존 업로드 정보가 없는 경우 (예외적 상황)
                    # 그냥 현재 데이터로 덮어쓰기
                    existing_by_item.item_type = item_type
                    existing_by_item.total = total
                    existing_by_item.monthly_average = monthly_average
                    existing_by_item.monthly_data = monthly_data
                    existing_by_item.upload_id = upload_id
                    existing_by_item.sheet_id = sheet_id
                    existing_by_item.data_record_id = record.id
                    existing_by_item.updated_at = datetime.now()
                    db.commit()
                    db.refresh(existing_by_item)
                    cash_flows.append(existing_by_item)
            else:
                # 새 cash_flow 생성
                cash_flow = CashFlow(
                    sheet_id=sheet_id,
                    item_name=item_name,
                    item_type=item_type,
                    total=total,
                    monthly_average=monthly_average,
                    monthly_data=monthly_data,
                    upload_id=upload_id,
                    data_record_id=record.id
                )
                db.add(cash_flow)
                db.commit()
                db.refresh(cash_flow)
                cash_flows.append(cash_flow)
    
    return cash_flows

