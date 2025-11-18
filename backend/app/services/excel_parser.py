import openpyxl
import xlrd
from typing import List, Dict, Any
import io

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
        # openpyxl로 xlsx 파일 파싱
        workbook = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
        
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            data = []
            
            for row in sheet.iter_rows(values_only=True):
                # None 값 제거 및 리스트로 변환
                row_data = [cell if cell is not None else "" for cell in row]
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
                    row_data.append(cell_value)
                
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

