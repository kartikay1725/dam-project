import pytest
from fastapi.testclient import TestClient

from demo.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Fixture providing a reusable TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint_status_code(client: TestClient) -> None:
    """Verify that /health returns HTTP 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_endpoint_response_body(client: TestClient) -> None:
    """Verify that /health returns JSON with status 'healthy'."""
    response = client.get("/health")
    data = response.json()
    assert data == {"status": "healthy"}
    assert data["status"] == "healthy"


def test_health_endpoint_content_type(client: TestClient) -> None:
    """Verify that /health response includes application/json content type."""
    response = client.get("/health")
    assert "application/json" in response.headers["content-type"]


def test_root_endpoint(client: TestClient) -> None:
    """Verify that root / returns HTTP 200 and expected greeting."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_not_found_endpoint(client: TestClient) -> None:
    """Verify that an undefined path returns HTTP 404."""
    response = client.get("/nonexistent-endpoint")
    assert response.status_code == 404
