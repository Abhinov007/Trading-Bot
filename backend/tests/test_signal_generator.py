import pytest
from src.signal_generator import generate_signal


def test_buy_when_predicted_above_upper_bound():
    # predicted is 2% above current, threshold is 1% → Buy
    assert generate_signal(predicted=102.0, current=100.0, threshold=0.01) == "Buy"


def test_sell_when_predicted_below_lower_bound():
    # predicted is 2% below current, threshold is 1% → Sell
    assert generate_signal(predicted=98.0, current=100.0, threshold=0.01) == "Sell"


def test_hold_when_predicted_within_threshold():
    # predicted is 0.5% above current, threshold is 1% → Hold
    assert generate_signal(predicted=100.5, current=100.0, threshold=0.01) == "Hold"


def test_hold_when_predicted_equals_current():
    assert generate_signal(predicted=100.0, current=100.0, threshold=0.01) == "Hold"


def test_hold_exactly_at_upper_bound():
    # predicted == upper_bound exactly → Hold (not strictly greater)
    assert generate_signal(predicted=101.0, current=100.0, threshold=0.01) == "Hold"


def test_hold_exactly_at_lower_bound():
    # predicted == lower_bound exactly → Hold (not strictly less)
    assert generate_signal(predicted=99.0, current=100.0, threshold=0.01) == "Hold"


def test_buy_with_zero_threshold():
    # any predicted > current triggers Buy when threshold is 0
    assert generate_signal(predicted=100.01, current=100.0, threshold=0.0) == "Buy"


def test_sell_with_zero_threshold():
    assert generate_signal(predicted=99.99, current=100.0, threshold=0.0) == "Sell"


def test_buy_with_large_threshold():
    # predicted 5% above but threshold is 10% → Hold
    assert generate_signal(predicted=105.0, current=100.0, threshold=0.10) == "Hold"


def test_returns_string():
    result = generate_signal(predicted=110.0, current=100.0)
    assert isinstance(result, str)
    assert result in ("Buy", "Sell", "Hold")


def test_high_price_stock():
    # Works correctly for high-value stocks like NVDA
    assert generate_signal(predicted=950.0, current=900.0, threshold=0.01) == "Buy"


def test_fractional_prices():
    assert generate_signal(predicted=1.05, current=1.00, threshold=0.01) == "Buy"
