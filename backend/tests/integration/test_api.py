"""
API 엔드포인트 통합 테스트
SQLite in-memory DB + TestClient 사용
"""
import pytest
from sqlalchemy import text


# ────────────────────────────────────────────
# Health check
# ────────────────────────────────────────────

class TestHealthCheck:
    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "MyMoney API is running"}

    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


# ────────────────────────────────────────────
# 업로드 목록 (GET /api/uploads)
# ────────────────────────────────────────────

class TestUploadsEndpoint:
    def test_empty_list(self, client):
        response = client.get("/api/uploads")
        assert response.status_code == 200
        assert response.json() == []


# ────────────────────────────────────────────
# 고객정보 목록 (GET /api/customers)
# ────────────────────────────────────────────

class TestCustomersEndpoint:
    def test_empty_list(self, client):
        response = client.get("/api/customers")
        assert response.status_code == 200
        assert response.json() == []


# ────────────────────────────────────────────
# 현금흐름 목록 (GET /api/cash-flows)
# ────────────────────────────────────────────

class TestCashFlowsEndpoint:
    def test_empty_list(self, client):
        response = client.get("/api/cash-flows")
        assert response.status_code == 200
        assert response.json() == []


# ────────────────────────────────────────────
# 파일 업로드 (POST /api/upload)
# ────────────────────────────────────────────

class TestUploadEndpoint:
    def test_no_file(self, client):
        """파일 없이 요청하면 422 반환."""
        response = client.post("/api/upload")
        assert response.status_code == 422

    def test_invalid_extension(self, client):
        """지원하지 않는 확장자 파일은 400 반환."""
        response = client.post(
            "/api/upload",
            files={"file": ("test.txt", b"dummy content", "text/plain")},
        )
        assert response.status_code == 400

    def test_empty_xlsx(self, client):
        """내용이 비어있는 xlsx는 400 반환."""
        # 최소한의 유효하지 않은 xlsx 바이너리
        response = client.post(
            "/api/upload",
            files={"file": ("test.xlsx", b"not an xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert response.status_code == 400
