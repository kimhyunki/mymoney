"""
스케줄러 서비스 - 주기적으로 customer / cash_flow 테이블을 업데이트
새로 업로드된 시트만 처리하여 풀스캔을 방지합니다 (P3).
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import SessionLocal
from app.services import data_service
from app.models import SheetData, Customer, CashFlow, FixedExpense, MonthlySummary, FinancialGoal, RealEstateAnalysis, DataRecord, UploadHistory
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

# 마지막 동기화 시각 (메모리 추적 — 새 업로드만 처리하기 위함)
_last_customer_sync: Optional[datetime] = None
_last_cash_flow_sync: Optional[datetime] = None
_last_fixed_expense_sync: Optional[datetime] = None
_last_monthly_summary_sync: Optional[datetime] = None
_last_financial_goal_sync: Optional[datetime] = None
_last_real_estate_sync: Optional[datetime] = None


def _get_sheets_to_sync(db: Session, last_sync: Optional[datetime]) -> list:
    """last_sync 이후 새로 업로드된 시트만 반환. 최초 실행 시 전체 반환."""
    if last_sync is None:
        return db.query(SheetData).all()
    new_upload_ids = [
        row.id
        for row in db.query(UploadHistory.id).filter(
            UploadHistory.uploaded_at > last_sync
        ).all()
    ]
    if not new_upload_ids:
        return []
    return db.query(SheetData).filter(SheetData.upload_id.in_(new_upload_ids)).all()


def sync_customers_from_data_records():
    """
    신규 업로드 시트만 스캔하여 customer 테이블을 업데이트합니다.
    """
    global _last_customer_sync
    db: Session = SessionLocal()
    try:
        logger.info("=== 고객정보 동기화 시작 ===")

        sheets = _get_sheets_to_sync(db, _last_customer_sync)
        if not sheets:
            logger.info("새로운 업로드 없음 — 고객정보 동기화 건너뜀")
            return
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
        _last_customer_sync = datetime.now()

    except Exception as e:
        logger.error(f"고객정보 동기화 중 오류 발생: {str(e)}", exc_info=True)
    finally:
        db.close()

def sync_cash_flows_from_data_records():
    """
    신규 업로드 시트만 스캔하여 cash_flow 테이블을 업데이트합니다.
    """
    global _last_cash_flow_sync
    db: Session = SessionLocal()
    try:
        logger.info("=== 현금 흐름 현황 동기화 시작 ===")

        sheets = _get_sheets_to_sync(db, _last_cash_flow_sync)
        if not sheets:
            logger.info("새로운 업로드 없음 — 현금흐름 동기화 건너뜀")
            return
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
        _last_cash_flow_sync = datetime.now()

    except Exception as e:
        logger.error(f"현금 흐름 현황 동기화 중 오류 발생: {str(e)}", exc_info=True)
    finally:
        db.close()

def sync_fixed_expenses_from_data_records():
    """
    신규 업로드 시트만 스캔하여 fixed_expense 테이블을 업데이트합니다.
    고정비 시트(sheet_name에 '고정비' 포함)만 처리합니다.
    """
    global _last_fixed_expense_sync
    db: Session = SessionLocal()
    try:
        logger.info("=== 고정비 동기화 시작 ===")

        sheets = _get_sheets_to_sync(db, _last_fixed_expense_sync)
        target_sheets = [s for s in sheets if "고정비" in (s.sheet_name or "")]
        if not target_sheets:
            logger.info("고정비 시트 없음 — 고정비 동기화 건너뜀")
            return
        logger.info(f"총 {len(target_sheets)}개의 고정비 시트를 확인합니다.")

        updated_count = 0
        created_count = 0

        for sheet in target_sheets:
            try:
                upload_id = sheet.upload_id
                if not upload_id:
                    logger.warning(f"시트 {sheet.id}에 upload_id가 없습니다. 건너뜁니다.")
                    continue

                existing_ids = {
                    fe.id for fe in db.query(FixedExpense).filter(
                        FixedExpense.upload_id == upload_id,
                        FixedExpense.sheet_id == sheet.id,
                    ).all()
                }

                fixed_expenses = data_service.extract_and_save_fixed_expenses_from_data_record(
                    db=db, sheet_id=sheet.id, upload_id=upload_id
                )

                for fe in fixed_expenses:
                    if fe.id in existing_ids:
                        updated_count += 1
                    else:
                        created_count += 1

            except Exception as e:
                logger.error(f"시트 {sheet.id} 처리 중 오류: {str(e)}", exc_info=True)
                continue

        logger.info(
            f"=== 고정비 동기화 완료 - 생성: {created_count}, 업데이트: {updated_count} ==="
        )
        _last_fixed_expense_sync = datetime.now()

    except Exception as e:
        logger.error(f"고정비 동기화 중 오류 발생: {str(e)}", exc_info=True)
    finally:
        db.close()


def sync_monthly_summary_from_data_records():
    """
    신규 업로드 시트만 스캔하여 monthly_summary 테이블을 업데이트합니다.
    '총 결산' 시트만 처리합니다.
    """
    global _last_monthly_summary_sync
    db: Session = SessionLocal()
    try:
        logger.info("=== 월별 결산 동기화 시작 ===")

        sheets = _get_sheets_to_sync(db, _last_monthly_summary_sync)
        target_sheets = [s for s in sheets if "총 결산" in (s.sheet_name or "")]
        if not target_sheets:
            logger.info("총 결산 시트 없음 — 월별 결산 동기화 건너뜀")
            return
        logger.info(f"총 {len(target_sheets)}개의 총 결산 시트를 확인합니다.")

        updated_count = 0
        created_count = 0

        for sheet in target_sheets:
            try:
                upload_id = sheet.upload_id
                if not upload_id:
                    logger.warning(f"시트 {sheet.id}에 upload_id가 없습니다. 건너뜁니다.")
                    continue

                existing_ids = {
                    ms.id for ms in db.query(MonthlySummary).filter(
                        MonthlySummary.upload_id == upload_id,
                        MonthlySummary.sheet_id == sheet.id,
                    ).all()
                }

                summaries = data_service.extract_and_save_monthly_summary_from_data_record(
                    db=db, sheet_id=sheet.id, upload_id=upload_id
                )

                for ms in summaries:
                    if ms.id in existing_ids:
                        updated_count += 1
                    else:
                        created_count += 1

            except Exception as e:
                logger.error(f"시트 {sheet.id} 처리 중 오류: {str(e)}", exc_info=True)
                continue

        logger.info(
            f"=== 월별 결산 동기화 완료 - 생성: {created_count}, 업데이트: {updated_count} ==="
        )
        _last_monthly_summary_sync = datetime.now()

    except Exception as e:
        logger.error(f"월별 결산 동기화 중 오류 발생: {str(e)}", exc_info=True)
    finally:
        db.close()


def sync_financial_goal_from_data_records():
    """
    신규 업로드 시트만 스캔하여 financial_goal 테이블을 업데이트합니다.
    '분양금' 키워드가 포함된 시트만 처리합니다.
    """
    global _last_financial_goal_sync
    db: Session = SessionLocal()
    try:
        logger.info("=== 분양금 계획 동기화 시작 ===")

        sheets = _get_sheets_to_sync(db, _last_financial_goal_sync)
        target_sheets = [s for s in sheets if "분양금" in (s.sheet_name or "")]
        if not target_sheets:
            logger.info("분양금 시트 없음 — 분양금 계획 동기화 건너뜀")
            return
        logger.info(f"총 {len(target_sheets)}개의 분양금 시트를 확인합니다.")

        updated_count = 0
        created_count = 0

        for sheet in target_sheets:
            try:
                upload_id = sheet.upload_id
                if not upload_id:
                    logger.warning(f"시트 {sheet.id}에 upload_id가 없습니다. 건너뜁니다.")
                    continue

                existing_ids = {
                    fg.id for fg in db.query(FinancialGoal).filter(
                        FinancialGoal.upload_id == upload_id,
                        FinancialGoal.sheet_id == sheet.id,
                    ).all()
                }

                goal = data_service.extract_and_save_financial_goal_from_data_record(
                    db=db, sheet_id=sheet.id, upload_id=upload_id
                )

                if goal:
                    if goal.id in existing_ids:
                        updated_count += 1
                    else:
                        created_count += 1

            except Exception as e:
                logger.error(f"시트 {sheet.id} 처리 중 오류: {str(e)}", exc_info=True)
                continue

        logger.info(
            f"=== 분양금 계획 동기화 완료 - 생성: {created_count}, 업데이트: {updated_count} ==="
        )
        _last_financial_goal_sync = datetime.now()

    except Exception as e:
        logger.error(f"분양금 계획 동기화 중 오류 발생: {str(e)}", exc_info=True)
    finally:
        db.close()


def sync_real_estate_from_data_records():
    """
    신규 업로드 시트만 스캔하여 real_estate_analysis 테이블을 업데이트합니다.
    '부동산' 키워드가 포함된 시트만 처리합니다.
    """
    global _last_real_estate_sync
    db: Session = SessionLocal()
    try:
        logger.info("=== 부동산 수익분석 동기화 시작 ===")

        sheets = _get_sheets_to_sync(db, _last_real_estate_sync)
        target_sheets = [s for s in sheets if "부동산" in (s.sheet_name or "")]
        if not target_sheets:
            logger.info("부동산 시트 없음 — 부동산 수익분석 동기화 건너뜀")
            return
        logger.info(f"총 {len(target_sheets)}개의 부동산 시트를 확인합니다.")

        updated_count = 0
        created_count = 0

        for sheet in target_sheets:
            try:
                upload_id = sheet.upload_id
                if not upload_id:
                    logger.warning(f"시트 {sheet.id}에 upload_id가 없습니다. 건너뜁니다.")
                    continue

                existing_ids = {
                    re.id for re in db.query(RealEstateAnalysis).filter(
                        RealEstateAnalysis.upload_id == upload_id,
                        RealEstateAnalysis.sheet_id == sheet.id,
                    ).all()
                }

                analysis = data_service.extract_and_save_real_estate_from_data_record(
                    db=db, sheet_id=sheet.id, upload_id=upload_id
                )

                if analysis:
                    if analysis.id in existing_ids:
                        updated_count += 1
                    else:
                        created_count += 1

            except Exception as e:
                logger.error(f"시트 {sheet.id} 처리 중 오류: {str(e)}", exc_info=True)
                continue

        logger.info(
            f"=== 부동산 수익분석 동기화 완료 - 생성: {created_count}, 업데이트: {updated_count} ==="
        )
        _last_real_estate_sync = datetime.now()

    except Exception as e:
        logger.error(f"부동산 수익분석 동기화 중 오류 발생: {str(e)}", exc_info=True)
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

    scheduler.add_job(
        sync_fixed_expenses_from_data_records,
        trigger=IntervalTrigger(seconds=interval_seconds),
        id='sync_fixed_expenses',
        name='고정비 동기화',
        replace_existing=True
    )

    scheduler.add_job(
        sync_monthly_summary_from_data_records,
        trigger=IntervalTrigger(seconds=interval_seconds),
        id='sync_monthly_summary',
        name='월별 결산 동기화',
        replace_existing=True
    )

    scheduler.add_job(
        sync_financial_goal_from_data_records,
        trigger=IntervalTrigger(seconds=interval_seconds),
        id='sync_financial_goal',
        name='분양금 계획 동기화',
        replace_existing=True
    )

    scheduler.add_job(
        sync_real_estate_from_data_records,
        trigger=IntervalTrigger(seconds=interval_seconds),
        id='sync_real_estate',
        name='부동산 수익분석 동기화',
        replace_existing=True
    )

    scheduler.start()
    logger.info(
        f"스케줄러 시작됨 - 동기화 주기: {interval_seconds}초 "
        f"(고객정보, 현금 흐름 현황, 고정비, 월별 결산, 분양금 계획, 부동산 수익분석)"
    )

def stop_scheduler():
    """스케줄러를 중지합니다."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("스케줄러 중지됨")
    else:
        logger.warning("스케줄러가 실행 중이 아닙니다.")

