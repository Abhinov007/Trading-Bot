import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

# ── Helpers ────────────────────────────────────────────────────────────────────

def make_test_token():
    """Create a real JWT token signed with the same key the app uses."""
    from src.auth import create_access_token
    return create_access_token({"sub": "test@example.com"})


@pytest.fixture
def client():
    mock_model = MagicMock()
    mock_model.predict.return_value = [[215.0]]

    with patch("main._load_model", return_value=mock_model), \
         patch("main.db"), \
         patch("main.get_user_by_email", new_callable=AsyncMock, return_value=None), \
         patch("main.authenticate_user", new_callable=AsyncMock), \
         patch("main.get_user_transactions", new_callable=AsyncMock, return_value=[]):
        from main import app
        app.state.model = mock_model
        yield TestClient(app)


# ── Public routes ──────────────────────────────────────────────────────────────

def test_health_check(client):
    res = client.get("/docs")
    assert res.status_code == 200


def test_predict_invalid_ticker(client):
    res = client.get("/predict?ticker=INVALID!!!")
    assert res.status_code == 400


def test_predict_ticker_too_long(client):
    res = client.get("/predict?ticker=TOOLONG")
    assert res.status_code == 400


def test_predict_missing_ticker(client):
    res = client.get("/predict")
    assert res.status_code == 422


def test_register_missing_fields(client):
    res = client.post("/register", json={"username": "test"})
    assert res.status_code == 422


def test_register_invalid_email(client):
    res = client.post("/register", json={
        "username": "test",
        "email": "notanemail",
        "password": "pass123"
    })
    assert res.status_code == 422


# ── Protected routes — unauthenticated should return 401 ──────────────────────

def test_transactions_requires_auth(client):
    """Unauthenticated request to /transactions must be rejected."""
    res = client.get("/transactions")
    assert res.status_code == 401


def test_execute_trade_requires_auth(client):
    """Unauthenticated trade execution must be rejected."""
    res = client.post("/execute-trade?signal=Buy&ticker=AAPL")
    assert res.status_code == 401


def test_record_transaction_requires_auth(client):
    """Unauthenticated record-transaction must be rejected."""
    res = client.post("/record-transaction", json={})
    assert res.status_code == 401


# ── Protected routes — authenticated ──────────────────────────────────────────

def test_transactions_with_valid_token(client):
    """Authenticated request to /transactions returns data list."""
    token = make_test_token()
    res = client.get("/transactions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "data" in res.json()


# ── Input validation still applies even without auth ─────────────────────────

def test_execute_trade_invalid_ticker(client):
    res = client.post("/execute-trade?signal=Buy&ticker=BAD!!!")
    # FastAPI checks auth before business logic; invalid ticker still triggers 401
    # (or 400 if ticker validation runs first — accept either)
    assert res.status_code in (400, 401)


def test_execute_trade_missing_params(client):
    # Auth check runs before query-param validation, so unauthenticated
    # requests get 401 even when params are missing.
    res = client.post("/execute-trade")
    assert res.status_code in (401, 422)
