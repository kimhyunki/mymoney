"""
ref/2025-03-03~2026-03-03.xlsx 가계부 내역 시트 데이터를
ledger_transaction 테이블에 삽입합니다.
"""
import os
import sys
from datetime import datetime, date

import openpyxl
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://mymoney:mymoney123@database:5432/mymoney",
)
EXCEL_PATH = "/app/ref/2025-03-03~2026-03-03.xlsx"


def run():
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        existing = conn.execute(text("SELECT COUNT(*) FROM ledger_transaction")).scalar()
        if existing > 0:
            print(f"이미 {existing}개 레코드가 있습니다. 스킵합니다.")
            return

    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb["가계부 내역"]

    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        transaction_date, transaction_time, transaction_type, category, subcategory, \
            description, amount, currency, payment_method, memo = row

        # 날짜 정규화
        if isinstance(transaction_date, (datetime, date)):
            dt_str = transaction_date.strftime("%Y-%m-%d %H:%M:%S") if hasattr(transaction_date, "hour") else str(transaction_date)
        else:
            dt_str = None

        # 시간 정규화
        if transaction_time is not None:
            time_str = str(transaction_time)
        else:
            time_str = None

        # 금액 정규화
        if amount is not None:
            try:
                amount_val = float(str(amount).replace(",", ""))
            except (ValueError, TypeError):
                amount_val = None
        else:
            amount_val = None

        rows.append({
            "transaction_date": dt_str,
            "transaction_time": time_str,
            "transaction_type": str(transaction_type) if transaction_type else None,
            "category": str(category) if category else None,
            "subcategory": str(subcategory) if subcategory else None,
            "description": str(description) if description else None,
            "amount": amount_val,
            "currency": str(currency) if currency else None,
            "payment_method": str(payment_method) if payment_method else None,
            "memo": str(memo) if memo else None,
        })

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO ledger_transaction
                    (transaction_date, transaction_time, transaction_type, category,
                     subcategory, description, amount, currency, payment_method, memo)
                VALUES
                    (:transaction_date, :transaction_time, :transaction_type, :category,
                     :subcategory, :description, :amount, :currency, :payment_method, :memo)
            """),
            rows,
        )

    print(f"{len(rows)}개 레코드 삽입 완료.")


if __name__ == "__main__":
    run()
