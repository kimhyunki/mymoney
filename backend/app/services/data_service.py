# 하위 호환성을 위한 재수출 모듈
# 직접 임포트 권장: crud / customer_service / cash_flow_service / utils.date_utils
from app.services.utils.date_utils import (
    parse_date_range_from_filename,
    is_date_in_range,
    is_upload_newer,
)
from app.services.crud import (
    create_upload_history,
    create_sheet_data,
    create_data_records,
    get_upload_history_list,
    get_upload_history,
    get_sheets_by_upload,
    get_sheet_data,
    get_records_by_sheet,
    get_records_by_ids,
    get_customers,
    get_cash_flows,
    get_fixed_expenses,
    get_monthly_summaries,
    get_financial_goals,
    get_real_estate_analyses,
)
from app.services.customer_service import extract_and_save_customer_from_data_record
from app.services.cash_flow_service import extract_and_save_cash_flows_from_data_record
from app.services.fixed_expense_service import extract_and_save_fixed_expenses_from_data_record
from app.services.monthly_summary_service import extract_and_save_monthly_summary_from_data_record
from app.services.financial_goal_service import extract_and_save_financial_goal_from_data_record
from app.services.real_estate_service import extract_and_save_real_estate_from_data_record

__all__ = [
    "parse_date_range_from_filename",
    "is_date_in_range",
    "is_upload_newer",
    "create_upload_history",
    "create_sheet_data",
    "create_data_records",
    "get_upload_history_list",
    "get_upload_history",
    "get_sheets_by_upload",
    "get_sheet_data",
    "get_records_by_sheet",
    "get_records_by_ids",
    "get_customers",
    "get_cash_flows",
    "get_fixed_expenses",
    "get_monthly_summaries",
    "get_financial_goals",
    "get_real_estate_analyses",
    "extract_and_save_customer_from_data_record",
    "extract_and_save_cash_flows_from_data_record",
    "extract_and_save_fixed_expenses_from_data_record",
    "extract_and_save_monthly_summary_from_data_record",
    "extract_and_save_financial_goal_from_data_record",
    "extract_and_save_real_estate_from_data_record",
]
