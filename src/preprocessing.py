import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def scale_data(df: pd.DataFrame, column_name: str = "Close"):
    """
    Scales a single column between 0 and 1 using MinMaxScaler.

    Args:
        df (pd.DataFrame): DataFrame containing the target column
        column_name (str): Name of the column to scale (default is 'Close')

    Returns:
        scaler (MinMaxScaler): Fitted scaler
        df_scaled (pd.DataFrame): DataFrame with scaled column and original index
    """
    if column_name not in df.columns:
        alt_close = [col for col in df.columns if col.lower().startswith("close")]
        if alt_close:
            column_name = alt_close[0]
        else:
            raise KeyError(f"No 'Close' or 'close_' column found in DataFrame.")

    print(f"[INFO] Scaling column: {column_name}")
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(df[[column_name]])

    # Maintain index and column name for compatibility
    df_scaled = df.copy()
    df_scaled[column_name] = scaled

    return scaler, df_scaled

def create_sequences(data: np.ndarray, time_step: int = 50):
    """
    Converts time-series data into sequences for LSTM input.

    Args:
        data (np.ndarray): 1D array of scaled prices
        time_step (int): Number of time steps per sequence

    Returns:
        Tuple[np.ndarray, np.ndarray]: Sequences X and corresponding targets y
    """
    X, y = [], []
    for i in range(time_step, len(data)):
        X.append(data[i - time_step:i])
        y.append(data[i])
    return np.array(X), np.array(y)
