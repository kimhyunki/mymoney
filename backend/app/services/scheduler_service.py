"""
스케줄러 서비스 - 주기적으로 DB 상태를 모니터링하고 로깅합니다.

현재 아키텍처에서 실제 데이터 동기화는 POST /api/import/banksalad-excel 엔드포인트에서
업로드 시점에 동기적으로 처리됩니다. 스케줄러는 시스템 상태를 모니터링하는 역할을 합니다.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Customer, CashFlow, FixedExpense, MonthlySummary, UploadHistory
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def check_data_health():
    """DB 데이터 현황을 주기적으로 로깅합니다."""
    db: Session = SessionLocal()
    try:
        customer_count = db.query(Customer).count()
        cash_flow_count = db.query(CashFlow).count()
        fixed_expense_count = db.query(FixedExpense).count()
        monthly_summary_count = db.query(MonthlySummary).count()

        recent_upload = (
            db.query(UploadHistory)
            .order_by(UploadHistory.created_at.desc())
            .first()
        )
        last_upload_info = (
            f"{recent_upload.filename} ({recent_upload.created_at.strftime('%Y-%m-%d %H:%M')})"
            if recent_upload else "없음"
        )

        logger.info(
            f"[헬스체크] 고객 {customer_count}건 · 현금흐름 {cash_flow_count}건 · "
            f"고정비 {fixed_expense_count}건 · 월별결산 {monthly_summary_count}건 | "
            f"최근 업로드: {last_upload_info}"
        )
    except Exception as e:
        logger.error(f"헬스체크 중 오류 발생: {str(e)}", exc_info=True)
    finally:
        db.close()


def start_scheduler(interval_seconds: int = 30):
    """스케줄러를 시작합니다."""
    if scheduler.running:
        logger.warning("스케줄러가 이미 실행 중입니다.")
        return

    scheduler.add_job(
        check_data_health,
        trigger=IntervalTrigger(seconds=interval_seconds),
        id='check_data_health',
        name='데이터 헬스체크',
        replace_existing=True,
    )

    scheduler.start()
    logger.info(f"스케줄러 시작됨 - 헬스체크 주기: {interval_seconds}초")


def stop_scheduler():
    """스케줄러를 중지합니다."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("스케줄러 중지됨")
    else:
        logger.warning("스케줄러가 실행 중이 아닙니다.")
