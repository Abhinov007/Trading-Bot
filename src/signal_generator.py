# src/signal_generator.py

def generate_signal(predicted: float, current: float, threshold: float = 0.01) -> str:
    """
    Generates a trading signal based on predicted and current price.

    Args:
        predicted (float): Predicted price from the model.
        current (float): Actual latest price.
        threshold (float): Percentage threshold to trigger a Buy or Sell.

    Returns:
        str: One of ["Buy", "Sell", "Hold"]
    """
    upper_bound = current * (1 + threshold)
    lower_bound = current * (1 - threshold)

    print(f"[DEBUG] Predicted: {predicted:.2f}, Current: {current:.2f}, "
          f"Buy if > {upper_bound:.2f}, Sell if < {lower_bound:.2f}")

    if predicted > upper_bound:
        return "Buy"
    else:
        return "Sell"
