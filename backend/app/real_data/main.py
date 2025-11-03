from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta

app = FastAPI(
    title="Bhakra Nangal Dam Water Level Prediction API",
    description="ML-powered API for predicting dam water inflow levels",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
model_path = Path(__file__).parent / 'dam_water_level_model.pkl'
model_artifacts = joblib.load(model_path)

model = model_artifacts['model']
scaler = model_artifacts['scaler']
feature_cols = model_artifacts['feature_cols']
model_metrics = model_artifacts['metrics']

print(f"✓ Model loaded: {model_artifacts['model_name']}")
print(f"✓ R² Score: {model_metrics['r2_score']:.4f}")
print(f"✓ RMSE: {model_metrics['rmse']:.2f} cms")


class CurrentConditions(BaseModel):
    """Current dam conditions for prediction"""
    rainfall_mm: float = Field(description="Current rainfall in mm", ge=0)
    temperature_c: float = Field(description="Current temperature in Celsius")
    inflow_lag_1: float = Field(description="Yesterday's inflow in cms", ge=0)
    inflow_lag_3: float = Field(description="3 days ago inflow in cms", ge=0)
    inflow_lag_7: float = Field(description="7 days ago inflow in cms", ge=0)
    inflow_lag_14: float = Field(description="14 days ago inflow in cms", ge=0)
    inflow_lag_30: float = Field(description="30 days ago inflow in cms", ge=0)
    outflow_lag_1: float = Field(description="Yesterday's outflow in cms", ge=0)
    outflow_lag_3: float = Field(description="3 days ago outflow in cms", ge=0)
    outflow_lag_7: float = Field(description="7 days ago outflow in cms", ge=0)
    outflow_lag_14: float = Field(description="14 days ago outflow in cms", ge=0)
    outflow_lag_30: float = Field(description="30 days ago outflow in cms", ge=0)
    rainfall_lag_1: float = Field(description="Yesterday's rainfall in mm", ge=0)
    rainfall_lag_3: float = Field(description="3 days ago rainfall in mm", ge=0)
    rainfall_lag_7: float = Field(description="7 days ago rainfall in mm", ge=0)
    rainfall_lag_14: float = Field(description="14 days ago rainfall in mm", ge=0)
    rainfall_lag_30: float = Field(description="30 days ago rainfall in mm", ge=0)
    temp_lag_1: float = Field(description="Yesterday's temperature in Celsius")
    temp_lag_3: float = Field(description="3 days ago temperature in Celsius")
    temp_lag_7: float = Field(description="7 days ago temperature in Celsius")
    temp_lag_14: float = Field(description="14 days ago temperature in Celsius")
    temp_lag_30: float = Field(description="30 days ago temperature in Celsius")
    date: Optional[str] = Field(default=None, description="Date for prediction (YYYY-MM-DD)")


class SimplePredictionInput(BaseModel):
    """Simplified input for quick predictions"""
    current_inflow: float = Field(description="Current inflow in cms", ge=0)
    recent_rainfall: float = Field(description="Recent rainfall in mm", ge=0)
    temperature: float = Field(description="Current temperature in Celsius")
    month: int = Field(description="Month (1-12)", ge=1, le=12)


class PredictionResponse(BaseModel):
    """Prediction response"""
    predicted_inflow: float
    confidence_interval: dict
    model_name: str
    prediction_date: str
    metrics: dict


def create_features_from_simple_input(data: SimplePredictionInput) -> dict:
    """Create full feature set from simplified input"""
    # Use current values for all lag features as approximation
    now = datetime.now()
    features = {
        'rainfall_mm': data.recent_rainfall,
        'temperature_c': data.temperature,
        'year': now.year,
        'month': data.month,
        'day': now.day,
        'day_of_year': now.timetuple().tm_yday,
        'week_of_year': now.isocalendar()[1],
    }
    
    # Lag features - use current/recent values as approximation
    for lag in [1, 3, 7, 14, 30]:
        features[f'inflow_lag_{lag}'] = data.current_inflow
        features[f'outflow_lag_{lag}'] = data.current_inflow * 0.85  # Estimate 85% outflow
        features[f'rainfall_lag_{lag}'] = data.recent_rainfall * 0.7
        features[f'temp_lag_{lag}'] = data.temperature
    
    # Rolling statistics
    for window in [7, 14, 30]:
        features[f'inflow_rolling_mean_{window}'] = data.current_inflow
        features[f'rainfall_rolling_sum_{window}'] = data.recent_rainfall * window * 0.5
        features[f'temp_rolling_mean_{window}'] = data.temperature
    
    # Seasonal indicators
    features['is_monsoon'] = 1 if data.month in [6, 7, 8, 9] else 0
    features['is_winter'] = 1 if data.month in [12, 1, 2] else 0
    features['is_summer'] = 1 if data.month in [3, 4, 5] else 0
    
    return features


def prepare_features(features_dict: dict) -> np.ndarray:
    """Prepare features in the correct order for the model"""
    feature_values = []
    for col in feature_cols:
        if col in features_dict:
            feature_values.append(features_dict[col])
        else:
            feature_values.append(0)  # Default value for missing features
    
    return np.array(feature_values).reshape(1, -1)


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Bhakra Nangal Dam Water Level Prediction API",
        "version": "1.0.0",
        "model": model_artifacts['model_name'],
        "endpoints": {
            "predict": "/predict",
            "predict_simple": "/predict/simple",
            "model_info": "/model/info",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/model/info")
async def model_info():
    """Get model information and metrics"""
    return {
        "model_name": model_artifacts['model_name'],
        "metrics": model_metrics,
        "features_count": len(feature_cols),
        "top_features": model_artifacts['feature_importance']['feature'][:10]
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(data: CurrentConditions):
    """
    Predict dam water inflow based on current conditions
    Requires detailed historical data (lag features)
    """
    try:
        # Create feature dictionary
        features_dict = data.model_dump()
        
        # Add temporal features if date is provided
        if data.date:
            date_obj = datetime.strptime(data.date, "%Y-%m-%d")
        else:
            date_obj = datetime.now()
        
        features_dict.update({
            'year': date_obj.year,
            'month': date_obj.month,
            'day': date_obj.day,
            'day_of_year': date_obj.timetuple().tm_yday,
            'week_of_year': date_obj.isocalendar()[1],
            'is_monsoon': 1 if date_obj.month in [6, 7, 8, 9] else 0,
            'is_winter': 1 if date_obj.month in [12, 1, 2] else 0,
            'is_summer': 1 if date_obj.month in [3, 4, 5] else 0,
        })
        
        # Calculate rolling features from lag features
        inflow_lags = [features_dict[f'inflow_lag_{lag}'] for lag in [1, 3, 7, 14, 30]]
        rainfall_lags = [features_dict[f'rainfall_lag_{lag}'] for lag in [1, 3, 7, 14, 30]]
        temp_lags = [features_dict[f'temp_lag_{lag}'] for lag in [1, 3, 7, 14, 30]]
        
        features_dict.update({
            'inflow_rolling_mean_7': np.mean(inflow_lags[:3]),
            'inflow_rolling_mean_14': np.mean(inflow_lags[:4]),
            'inflow_rolling_mean_30': np.mean(inflow_lags),
            'rainfall_rolling_sum_7': sum(rainfall_lags[:3]),
            'rainfall_rolling_sum_14': sum(rainfall_lags[:4]),
            'rainfall_rolling_sum_30': sum(rainfall_lags),
            'temp_rolling_mean_7': np.mean(temp_lags[:3]),
            'temp_rolling_mean_14': np.mean(temp_lags[:4]),
            'temp_rolling_mean_30': np.mean(temp_lags),
        })
        
        # Prepare features
        X = prepare_features(features_dict)
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X_scaled)[0]
        
        # Calculate confidence interval (using RMSE)
        rmse = model_metrics['rmse']
        confidence_interval = {
            'lower': max(0, prediction - 1.96 * rmse),
            'upper': prediction + 1.96 * rmse
        }
        
        return PredictionResponse(
            predicted_inflow=round(prediction, 2),
            confidence_interval=confidence_interval,
            model_name=model_artifacts['model_name'],
            prediction_date=date_obj.strftime("%Y-%m-%d"),
            metrics=model_metrics
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")


@app.post("/predict/simple", response_model=PredictionResponse)
async def predict_simple(data: SimplePredictionInput):
    """
    Simplified prediction endpoint requiring only basic inputs
    Uses approximations for historical data
    """
    try:
        # Create full feature set from simplified input
        features_dict = create_features_from_simple_input(data)
        
        # Prepare features
        X = prepare_features(features_dict)
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X_scaled)[0]
        
        # Calculate confidence interval
        rmse = model_metrics['rmse']
        confidence_interval = {
            'lower': max(0, prediction - 1.96 * rmse),
            'upper': prediction + 1.96 * rmse
        }
        
        return PredictionResponse(
            predicted_inflow=round(prediction, 2),
            confidence_interval=confidence_interval,
            model_name=model_artifacts['model_name'],
            prediction_date=datetime.now().strftime("%Y-%m-%d"),
            metrics=model_metrics
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)