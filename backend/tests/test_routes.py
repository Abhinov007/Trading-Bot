import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    mock_model = MagicMock()
    mock_model.predict.return_value = [[215.0]]

    with patch("main._load_model", return_value=mock_model), \
         patch("main.db"), \
         patch("main.get_user_by_email", new_callable=AsyncMock, return_value=None), \
         patch("main.authenticate_user", new_callable=AsyncMock), \
         patch("main.get_all_transactions", new_callable=AsyncMock, return_value=[]):
        from main import app
        app.state.model = mock_model
        yield TestClient(app)


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


def test_execute_trade_invalid_ticker(client):
    res = client.post("/execute-trade?signal=Buy&ticker=BAD!!!")
    assert res.status_code == 400


def test_execute_trade_invalid_signal(client):
    res = client.post("/execute-trade?signal=INVALID&ticker=AAPL")
    assert res.status_code == 400


def test_execute_trade_missing_params(client):
    res = client.post("/execute-trade")
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


def test_get_transactions_returns_list(client):
    res = client.get("/transactions")
    assert res.status_code == 200
    assert "data" in res.json()
