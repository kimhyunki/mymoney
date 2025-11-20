import openpyxl
import xlrd
from typing import List, Dict, Any, Optional
import io
from datetime import datetime, date, time
import logging

logger = logging.getLogger(__name__)

def convert_datetime_to_string(value: Any) -> Any:
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

def parse_excel_file(file_content: bytes, filename: str) -> Dict[str, Any]:
    """
    엑셀 파일을 파싱하여 데이터를 반환합니다.
    
    Args:
        file_content: 파일 바이너리 내용
        filename: 파일명 (확장자로 형식 판단)
    
    Returns:
        {
            "sheets": [
                {
                    "name": "시트명",
                    "data": [[행1], [행2], ...],
                    "row_count": 행 수,
                    "column_count": 열 수
                }
            ]
        }
    """
    sheets_data = []
    
    if filename.endswith('.xlsx'):
        # 먼저 data_only=True로 계산된 값을 읽기
        # file_content는 bytes이므로 새로운 BytesIO 객체를 만들어야 함
        # read_only=True로 메모리 사용량 최적화
        file_content_copy1 = io.BytesIO(file_content)
        file_content_copy2 = io.BytesIO(file_content)
        
        logger.info(f"워크북 로딩 시작...")
        # read_only=False로 변경 (수식 계산을 위해 필요)
        workbook_data_only = openpyxl.load_workbook(file_content_copy1, data_only=True)
        logger.info(f"워크북 (data_only=True) 로딩 완료")
        
        # 수식 확인이 필요한 경우에만 data_only=False로 로드
        workbook_formula = openpyxl.load_workbook(file_content_copy2, data_only=False)
        logger.info(f"워크북 (data_only=False) 로딩 완료")
        
        for sheet_name in workbook_data_only.sheetnames:
            sheet_data_only = workbook_data_only[sheet_name]
            sheet_formula = workbook_formula[sheet_name]
            data = []
            
            # 행과 열의 최대 범위를 계산
            max_row_data = sheet_data_only.max_row if sheet_data_only.max_row else 0
            max_row_formula = sheet_formula.max_row if sheet_formula.max_row else 0
            max_row = max(max_row_data, max_row_formula)
            
            max_col_data = sheet_data_only.max_column if sheet_data_only.max_column else 0
            max_col_formula = sheet_formula.max_column if sheet_formula.max_column else 0
            max_col = max(max_col_data, max_col_formula)
            
            # iter_rows를 사용하여 더 효율적으로 읽기
            logger.info(f"시트 '{sheet_name}' 데이터 읽기 시작 (최대 행: {max_row}, 최대 열: {max_col})")
            row_num = 0
            for row_data_only, row_formula in zip(
                sheet_data_only.iter_rows(values_only=True),
                sheet_formula.iter_rows(values_only=False)
            ):
                row_num += 1
                row_data = []
                
                # 진행 상황 로깅 (1000행마다)
                if row_num % 1000 == 0:
                    logger.info(f"시트 '{sheet_name}' {row_num}행 처리 중...")
                
                for col_idx, (cell_value, cell_formula_obj) in enumerate(zip(row_data_only, row_formula), 1):
                    # 계산된 값이 None이거나 빈 값이고, 수식이 있는 경우
                    if (cell_value is None or cell_value == "") and cell_formula_obj.data_type == 'f':
                        # 수식이 있으면 수식을 읽어서 처리
                        formula = cell_formula_obj.value
                        
                        # 수식 타입 확인 (문자열이 아닌 경우 ArrayFormula 등)
                        if not isinstance(formula, str):
                            logger.debug(
                                f"시트 '{sheet_name}'의 셀 {openpyxl.utils.get_column_letter(col_idx)}{row_num}에 "
                                f"복잡한 수식 타입이 있습니다 (처리 불가): {type(formula).__name__}"
                            )
                            # 복잡한 수식은 계산할 수 없으므로 0으로 설정
                            cell_value = 0
                        else:
                            logger.warning(
                                f"시트 '{sheet_name}'의 셀 {openpyxl.utils.get_column_letter(col_idx)}{row_num}에 "
                                f"수식이 있지만 계산된 값이 없습니다: {formula}"
                            )
                            # 수식 결과를 계산하려고 시도 (간단한 수식만 처리)
                            calculated_value = _try_calculate_simple_formula(
                                formula, sheet_data_only, row_num, col_idx
                            )
                            if calculated_value is not None:
                                cell_value = calculated_value
                                logger.info(
                                    f"시트 '{sheet_name}'의 셀 {openpyxl.utils.get_column_letter(col_idx)}{row_num} "
                                    f"수식 계산 결과: {calculated_value}"
                                )
                            else:
                                # 계산할 수 없으면 0으로 설정 (또는 빈 문자열)
                                cell_value = 0
                                logger.debug(
                                    f"시트 '{sheet_name}'의 셀 {openpyxl.utils.get_column_letter(col_idx)}{row_num} "
                                    f"수식을 계산할 수 없습니다. 0으로 설정합니다."
                                )
                    
                    # None 값 제거 및 리스트로 변환, datetime 객체는 문자열로 변환
                    cell_result = convert_datetime_to_string(cell_value) if cell_value is not None else ""
                    row_data.append(cell_result)
                
                if any(cell != "" for cell in row_data):  # 빈 행 제외
                    data.append(row_data)
            
            if data:
                # 최대 열 수 계산
                max_cols = max(len(row) for row in data) if data else 0
                sheets_data.append({
                    "name": sheet_name,
                    "data": data,
                    "row_count": len(data),
                    "column_count": max_cols
                })
    
    elif filename.endswith('.xls'):
        # xlrd로 xls 파일 파싱
        workbook = xlrd.open_workbook(file_contents=file_content)
        
        for sheet_name in workbook.sheet_names():
            sheet = workbook.sheet_by_name(sheet_name)
            data = []
            
            for row_idx in range(sheet.nrows):
                row_data = []
                for col_idx in range(sheet.ncols):
                    cell_value = sheet.cell_value(row_idx, col_idx)
                    # xlrd는 날짜를 float로 반환하므로, 날짜 타입인 경우 datetime으로 변환 후 문자열로 변환
                    if sheet.cell_type(row_idx, col_idx) == xlrd.XL_CELL_DATE:
                        # xlrd의 날짜 변환
                        date_tuple = xlrd.xldate_as_tuple(cell_value, workbook.datemode)
                        if date_tuple:
                            cell_value = datetime(*date_tuple[:6])
                    row_data.append(convert_datetime_to_string(cell_value))
                
                if any(cell != "" for cell in row_data):  # 빈 행 제외
                    data.append(row_data)
            
            if data:
                max_cols = max(len(row) for row in data) if data else 0
                sheets_data.append({
                    "name": sheet_name,
                    "data": data,
                    "row_count": len(data),
                    "column_count": max_cols
                })
    else:
        raise ValueError(f"지원하지 않는 파일 형식입니다: {filename}")
    
    return {
        "sheets": sheets_data,
        "sheet_count": len(sheets_data)
    }

def _try_calculate_simple_formula(
    formula: Any, 
    sheet: openpyxl.worksheet.worksheet.Worksheet,
    row_idx: int,
    col_idx: int
) -> Optional[Any]:
    """
    간단한 수식을 계산하려고 시도합니다.
    현재는 SUM, AVERAGE, COUNT, MIN, MAX 등의 기본 함수만 지원합니다.
    
    Args:
        formula: 수식 문자열 또는 수식 객체 (예: "=SUM(A1:A5)")
        sheet: 워크시트 객체
        row_idx: 현재 행 인덱스 (1-based)
        col_idx: 현재 열 인덱스 (1-based)
    
    Returns:
        계산된 값 또는 None (계산할 수 없는 경우)
    """
    # formula가 문자열이 아니면 처리 불가 (ArrayFormula 등)
    if not isinstance(formula, str):
        logger.debug(f"수식이 문자열이 아닙니다. 타입: {type(formula)}")
        return None
    
    if not formula or not formula.startswith('='):
        return None
    
    try:
        # SUM 함수 처리
        if formula.upper().startswith('=SUM('):
            # SUM 범위 추출 및 계산
            # 괄호 안의 내용 추출
            inner = formula[5:-1].strip()  # '=SUM(' 와 ')' 제거
            
            # 여러 인자가 있을 수 있으므로 쉼표로 분리
            # 하지만 범위 내에도 쉼표가 있을 수 있으므로 간단하게 첫 번째 인자만 처리
            # 실제로는 더 복잡한 파싱이 필요하지만, 기본적인 경우만 처리
            args = []
            current_arg = ""
            paren_depth = 0
            
            for char in inner:
                if char == '(':
                    paren_depth += 1
                    current_arg += char
                elif char == ')':
                    paren_depth -= 1
                    current_arg += char
                elif char == ',' and paren_depth == 0:
                    if current_arg.strip():
                        args.append(current_arg.strip())
                    current_arg = ""
                else:
                    current_arg += char
            
            if current_arg.strip():
                args.append(current_arg.strip())
            
            # 모든 인자의 합계 계산
            total = 0.0
            for arg in args:
                arg_result = _calculate_sum_range(arg, sheet)
                if arg_result is not None:
                    total += arg_result
            
            return total if total != 0.0 else None
        
        # 추가 함수들을 여기에 구현할 수 있습니다.
        # 현재는 SUM만 지원
        
    except Exception as e:
        logger.debug(f"수식 계산 중 오류 발생: {formula}, 오류: {e}")
        return None
    
    return None

def _calculate_sum_range(range_str: str, sheet: openpyxl.worksheet.worksheet.Worksheet) -> Optional[float]:
    """
    SUM 범위를 계산합니다.
    
    Args:
        range_str: 범위 문자열 (예: "A1:A5", "A1:B2")
        sheet: 워크시트 객체
    
    Returns:
        합계 값 또는 None
    """
    try:
        # 범위 파싱 (예: "A1:A5" -> (1, 1) to (5, 1))
        if ':' in range_str:
            start_cell, end_cell = range_str.split(':')
            start_col = openpyxl.utils.column_index_from_string(
                ''.join(c for c in start_cell if c.isalpha())
            )
            start_row = int(''.join(c for c in start_cell if c.isdigit()))
            end_col = openpyxl.utils.column_index_from_string(
                ''.join(c for c in end_cell if c.isalpha())
            )
            end_row = int(''.join(c for c in end_cell if c.isdigit()))
            
            total = 0.0
            for row in range(start_row, end_row + 1):
                for col in range(start_col, end_col + 1):
                    cell_value = sheet.cell(row=row, column=col).value
                    if isinstance(cell_value, (int, float)):
                        total += float(cell_value)
            return total
        else:
            # 단일 셀 참조
            col = openpyxl.utils.column_index_from_string(
                ''.join(c for c in range_str if c.isalpha())
            )
            row = int(''.join(c for c in range_str if c.isdigit()))
            cell_value = sheet.cell(row=row, column=col).value
            if isinstance(cell_value, (int, float)):
                return float(cell_value)
    except Exception as e:
        logger.debug(f"SUM 범위 계산 중 오류 발생: {range_str}, 오류: {e}")
        return None
    
    return None

