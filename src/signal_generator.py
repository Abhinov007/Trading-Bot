# src/signal_generator.py

def generate_signal(predicted, current):
    """
    Generates a simple Buy/Sell signal based on predicted and current price.
    """
    return "Buy" if predicted > current else "Sell"