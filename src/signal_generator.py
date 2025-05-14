# src/signal_generator.py

def generate_signal(predicted, current):
    """
    Generates a simple Buy/Sell signal based on predicted and current price.
    """
    if predicted > current * 1.01:
        return "Buy"
    elif predicted < current * 0.99:
        return "Sell"
    else:
        return "Hold"