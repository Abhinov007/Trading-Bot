# src/model.py
from tensorflow.keras.models import load_model as keras_load_model

def load_model(model_path):
    """
    Loads a pre-trained model from a file.
    """
    print(f"[INFO] Loading model from {model_path}...")
    model = keras_load_model(model_path)
    return model
