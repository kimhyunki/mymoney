from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class UploadHistoryResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    sheet_count: int
    
    class Config:
        from_attributes = True

class SheetDataResponse(BaseModel):
    id: int
    upload_id: int
    sheet_name: str
    row_count: int
    column_count: int
    
    class Config:
        from_attributes = True

class DataRecordResponse(BaseModel):
    id: int
    sheet_id: int
    row_index: int
    data: Dict[str, Any]
    
    class Config:
        from_attributes = True

class UploadResponse(BaseModel):
    upload_id: int
    filename: str
    sheet_count: int
    message: str

class SheetWithDataResponse(BaseModel):
    sheet: SheetDataResponse
    records: List[DataRecordResponse]

