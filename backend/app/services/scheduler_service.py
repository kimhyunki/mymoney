"""
스케줄러 서비스 - 주기적으로 customer 테이블을 업데이트
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services import data_service
from app.models import SheetData, Customer, CashFlow, DataRecord
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def sync_customers_from_data_records():
    """
    모든 시트를 스캔하여 customer 테이블을 업데이트합니다.
    주기적으로 실행되는 함수입니다.
    """
    db: Session = SessionLocal()
    try:
        logger.info("=== 고객정보 동기화 시작 ===")
        
        # 모든 시트 조회
        sheets = db.query(SheetData).all()
        logger.info(f"총 {len(sheets)}개의 시트를 확인합니다.")
        
        updated_count = 0
        created_count = 0
        
        for sheet in sheets:
            try:
                # 시트의 upload_id 가져오기
                upload_id = sheet.upload_id
                if not upload_id:
                    logger.warning(f"시트 {sheet.id}에 upload_id가 없습니다. 건너뜁니다.")
                    continue
                
                # 기존 고객정보 추출 함수 사용 (upload_id 전달)
                customer = data_service.extract_and_save_customer_from_data_record(
                    db=db,
                    sheet_id=sheet.id,
                    upload_id=upload_id
                )
                
                if customer:
                    # 기존 고객인지 확인
                    existing_customer = db.query(Customer).filter(
                        Customer.id == customer.id
                    ).first()
                    
                    if existing_customer and existing_customer.upload_id == upload_id:
                        # 기존 고객 업데이트
                        updated_count += 1
                        logger.debug(f"시트 {sheet.id}의 고객정보 업데이트: {customer.name}")
                    else:
                        # 새 고객 생성
                        created_count += 1
                        logger.debug(f"시트 {sheet.id}의 고객정보 생성: {customer.name}")
                        
            except Exception as e:
                logger.error(f"시트 {sheet.id} 처리 중 오류: {str(e)}", exc_info=True)
                continue
        
        logger.info(
            f"=== 고객정보 동기화 완료 - 생성: {created_count}, 업데이트: {updated_count} ==="
        )
        
    except Exception as e:
        logger.error(f"고객정보 동기화 중 오류 발생: {str(e)}", exc_info=True)
    finally:
        db.close()

def sync_cash_flows_from_data_records():
    """
    모든 시트를 스캔하여 cash_flow 테이블을 업데이트합니다.
    주기적으로 실행되는 함수입니다.
    """
    db: Session = SessionLocal()
    try:
        logger.info("=== 현금 흐름 현황 동기화 시작 ===")
        
        # 모든 시트 조회
        sheets = db.query(SheetData).all()
        logger.info(f"총 {len(sheets)}개의 시트를 확인합니다.")
        
        updated_count = 0
        created_count = 0
        
        for sheet in sheets:
            try:
                # 시트의 upload_id 가져오기
                upload_id = sheet.upload_id
                if not upload_id:
                    logger.warning(f"시트 {sheet.id}에 upload_id가 없습니다. 건너뜁니다.")
                    continue
                
                # 함수 호출 전에 기존 cash_flow 레코드 ID 수집 (같은 upload_id와 item_name)
                existing_cash_flow_ids = set()
                existing_cash_flows = db.query(CashFlow).filter(
                    CashFlow.upload_id == upload_id,
                    CashFlow.sheet_id == sheet.id
                ).all()
                for cf in existing_cash_flows:
                    existing_cash_flow_ids.add(cf.id)
                
                # 현금 흐름 추출 함수 사용 (upload_id 전달)
                cash_flows = data_service.extract_and_save_cash_flows_from_data_record(
                    db=db,
                    sheet_id=sheet.id,
                    upload_id=upload_id
                )
                
                for cash_flow in cash_flows:
                    # 함수 호출 전에 존재했던 레코드인지 확인
                    if cash_flow.id in existing_cash_flow_ids:
                        updated_count += 1
                        logger.debug(f"시트 {sheet.id}의 현금 흐름 업데이트: {cash_flow.item_name}")
                    else:
                        created_count += 1
                        logger.debug(f"시트 {sheet.id}의 현금 흐름 생성: {cash_flow.item_name}")
                        
            except Exception as e:
                logger.error(f"시트 {sheet.id} 처리 중 오류: {str(e)}", exc_info=True)
                continue
        
        logger.info(
            f"=== 현금 흐름 현황 동기화 완료 - 생성: {created_count}, 업데이트: {updated_count} ==="
        )
        
    except Exception as e:
        logger.error(f"현금 흐름 현황 동기화 중 오류 발생: {str(e)}", exc_info=True)
    finally:
        db.close()

def start_scheduler(interval_seconds: int = 30):
    """
    스케줄러를 시작합니다.
    
    Args:
        interval_seconds: 동기화 주기 (초 단위, 기본값: 30초)
    """
    if scheduler.running:
        logger.warning("스케줄러가 이미 실행 중입니다.")
        return
    
    # 주기적 작업 등록
    scheduler.add_job(
        sync_customers_from_data_records,
        trigger=IntervalTrigger(seconds=interval_seconds),
        id='sync_customers',
        name='고객정보 동기화',
        replace_existing=True
    )
    
    scheduler.add_job(
        sync_cash_flows_from_data_records,
        trigger=IntervalTrigger(seconds=interval_seconds),
        id='sync_cash_flows',
        name='현금 흐름 현황 동기화',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info(f"스케줄러 시작됨 - 동기화 주기: {interval_seconds}초 (고객정보, 현금 흐름 현황)")

def stop_scheduler():
    """스케줄러를 중지합니다."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("스케줄러 중지됨")
    else:
        logger.warning("스케줄러가 실행 중이 아닙니다.")

