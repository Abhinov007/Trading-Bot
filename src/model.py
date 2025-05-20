# src/model.py

import os
from tensorflow.keras.models import load_model as keras_load_model

def load_model(model_path: str):
    """
    Loads a pre-trained Keras model from a file.

    Args:
        model_path (str): Path to the saved model (.h5 file)

    Returns:
        keras.Model: Loaded Keras model object
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"[ERROR] Model file not found: {model_path}")
    
    print(f"[INFO] Loading model from {model_path}...")
    model = keras_load_model(model_path)
    print("[INFO] Model loaded successfully.")
    return model
