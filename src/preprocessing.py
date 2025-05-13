# src/preprocessing.py

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def scale_data(df):
    """
    Scales the correct 'Close' price column between 0 and 1.
    """
    close_col = [col for col in df.columns if col.startswith('close_')]
    if not close_col:
        raise KeyError("No 'close_' column found in the DataFrame.")

    close_col = close_col[0]
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(df[[close_col]])
    df_scaled = pd.DataFrame(scaled, columns=[close_col])
    print(f"[INFO] Scaled data: {df_scaled.shape}")
    return scaler, df_scaled

def create_sequences(data, time_step=50):
    """
    Convert data into sequences for LSTM input.
    """
    X, y = [], []
    for i in range(time_step, len(data)):
        X.append(data[i-time_step:i])
        y.append(data[i])
    return np.array(X), np.array(y)
