import pytest
import numpy as np
import pandas as pd
from src.preprocessing import scale_data, create_sequences


# ── scale_data ────────────────────────────────────────────────────────────────

def make_df(col="Close"):
    return pd.DataFrame({col: [10.0, 20.0, 30.0, 40.0, 50.0]})


def test_scale_data_output_range():
    scaler, df_scaled = scale_data(make_df(), column_name="Close")
    values = df_scaled["Close"].values
    assert values.min() >= 0.0
    assert values.max() <= 1.0


def test_scale_data_min_is_zero():
    _, df_scaled = scale_data(make_df(), column_name="Close")
    assert df_scaled["Close"].min() == pytest.approx(0.0)


def test_scale_data_max_is_one():
    _, df_scaled = scale_data(make_df(), column_name="Close")
    assert df_scaled["Close"].max() == pytest.approx(1.0)


def test_scale_data_preserves_index():
    df = make_df()
    df.index = pd.date_range("2024-01-01", periods=5)
    _, df_scaled = scale_data(df, column_name="Close")
    assert list(df_scaled.index) == list(df.index)


def test_scale_data_fallback_to_close_prefix():
    df = pd.DataFrame({"close_aapl": [10.0, 20.0, 30.0]})
    scaler, df_scaled = scale_data(df, column_name="Close")
    assert df_scaled["close_aapl"].max() == pytest.approx(1.0)


def test_scale_data_raises_on_missing_column():
    df = pd.DataFrame({"volume": [100, 200, 300]})
    with pytest.raises(KeyError):
        scale_data(df, column_name="Close")


def test_scale_data_returns_scaler():
    from sklearn.preprocessing import MinMaxScaler
    scaler, _ = scale_data(make_df(), column_name="Close")
    assert isinstance(scaler, MinMaxScaler)


def test_scale_data_scaler_can_inverse_transform():
    scaler, df_scaled = scale_data(make_df(), column_name="Close")
    scaled_vals = df_scaled["Close"].values.reshape(-1, 1)
    recovered = scaler.inverse_transform(scaled_vals).flatten()
    expected = make_df()["Close"].values
    np.testing.assert_allclose(recovered, expected, rtol=1e-5)


# ── create_sequences ──────────────────────────────────────────────────────────

def make_series(n=100):
    return np.linspace(0, 1, n)


def test_create_sequences_output_shapes():
    data = make_series(100)
    X, y = create_sequences(data, time_step=10)
    assert X.shape == (90, 10)
    assert y.shape == (90,)


def test_create_sequences_correct_target():
    data = np.arange(20, dtype=float)
    X, y = create_sequences(data, time_step=5)
    # First target should be data[5]
    assert y[0] == 5.0


def test_create_sequences_correct_input_window():
    data = np.arange(20, dtype=float)
    X, y = create_sequences(data, time_step=5)
    # First sequence should be data[0:5]
    np.testing.assert_array_equal(X[0], [0, 1, 2, 3, 4])


def test_create_sequences_count():
    data = make_series(60)
    X, y = create_sequences(data, time_step=50)
    assert len(X) == 10
    assert len(y) == 10


def test_create_sequences_empty_when_too_short():
    data = make_series(5)
    X, y = create_sequences(data, time_step=10)
    assert len(X) == 0
    assert len(y) == 0
