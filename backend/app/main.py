from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import pandas as pd
import joblib
from fastapi.middleware.cors import CORSMiddleware
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
knn = joblib.load(os.path.join(BASE_DIR, "flood_risk_knn_weighted_model.pkl"))
scaler_params = joblib.load(os.path.join(BASE_DIR, "scaler_params.pkl"))

mean = scaler_params['mean']
std = scaler_params['std']


def scale_new_data(X_new):
    return (X_new - mean) / std


class FloodInput(BaseModel):
    Avg_rainfall: float
    Full_reservoir_level: float
    Live_capacity_FRL: float
    Storage: float
    Level: float
    Storage_shift: float
    delta_storage: float
    predicted_inflow: float
    estimated_outflow: float


app = FastAPI(title="Flood Risk Predictor API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

risk_labels = {0: "Low", 1: "Moderate", 2: "High"}

@app.post("/predict")
def predict_risk(data: FloodInput):
    # Convert input to dataframe
    df = pd.DataFrame([data.dict()])
    X_new = df.to_numpy()
    X_scaled = scale_new_data(X_new)

    # Predict
    pred = knn.predict(X_scaled)[0]
    proba = knn.predict_proba(X_scaled)[0]

    return {
        "predicted_risk": risk_labels[pred],
        "probabilities": {
            "low": round(proba[0], 2),
            "moderate": round(proba[1], 2),
            "high": round(proba[2], 2)
        }
    }
