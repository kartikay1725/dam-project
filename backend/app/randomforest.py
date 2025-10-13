import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os


years = range(2020, 2025)  # 2020–2024
input_dir = "./real_data"
model_file = "flood_risk_knn_weighted_model.pkl"
output_file = "flood_risk_knn_predictions.csv"


feature_cols = [
    'Avg_rainfall','Full_reservoir_level','Live_capacity_FRL','Storage','Level',
    'Storage_shift','delta_storage','predicted_inflow','estimated_outflow'
]


def add_lag_rolling_features(df):
    """Adds lagged and rolling features for time-series learning."""
    for col in ['delta_storage','predicted_inflow','estimated_outflow','Avg_rainfall']:
        for lag in range(1, 4):
            df[f'{col}_lag{lag}'] = df[col].shift(lag)

    df['rainfall_3d_sum'] = df['Avg_rainfall'].rolling(3).sum()
    df['rainfall_7d_sum'] = df['Avg_rainfall'].rolling(7).sum()
    df['inflow_3d_avg'] = df['predicted_inflow'].rolling(3).mean()
    df['inflow_7d_avg'] = df['predicted_inflow'].rolling(7).mean()

    df = df.dropna()
    return df

def assign_risk(row, inflow_80, inflow_90):
    """Assign flood risk based on inflow and storage levels."""
    storage_pct = row['Storage'] / row['Live_capacity_FRL'] if row['Live_capacity_FRL'] > 0 else 0
    inflow = row['predicted_inflow']

    if storage_pct > 0.9 or inflow > inflow_90:
        return 2  # High
    elif storage_pct >= 0.7 or inflow > inflow_80:
        return 1  # Moderate
    else:
        return 0  # Low

def scale_features(X, scaler_file="scaler_params.pkl"):
    """Manually scale features to zero mean, unit variance and save scaler."""
    mean = X.mean(axis=0)
    std = X.std(axis=0) + 1e-8
    X_scaled = (X - mean) / std

    # Always save scaler
    scaler_params = {'mean': mean, 'std': std}
    joblib.dump(scaler_params, scaler_file)
    print(f" Scaler parameters saved to '{scaler_file}'")

    return X_scaled


all_dfs = []
for year in years:
    file_path = os.path.join(input_dir, f"merged_with_inflow_outflow_{year}.csv")
    df = pd.read_csv(file_path)
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date')

    numeric_cols = feature_cols
    df[numeric_cols] = df[numeric_cols].ffill().fillna(0)

    df = add_lag_rolling_features(df)
    all_dfs.append(df)

df_all = pd.concat(all_dfs, ignore_index=True)


inflow_80 = df_all['predicted_inflow'].quantile(0.8)
inflow_90 = df_all['predicted_inflow'].quantile(0.9)
df_all['risk_score'] = df_all.apply(assign_risk, axis=1, args=(inflow_80, inflow_90))


X = df_all[feature_cols].to_numpy()
y = df_all['risk_score'].to_numpy()

# Scale features manually
X_scaled = scale_features(X)

n_neighbors = 7
weights_option = 'distance'  # 'uniform' or 'distance'
knn = KNeighborsClassifier(n_neighbors=n_neighbors, weights=weights_option)


skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for fold, (train_index, test_index) in enumerate(skf.split(X_scaled, y), 1):
    X_train, X_test = X_scaled[train_index], X_scaled[test_index]
    y_train, y_test = y[train_index], y[test_index]

    knn.fit(X_train, y_train)
    y_pred = knn.predict(X_test)

    print(f"\n--- Fold {fold} ---")
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("Classification Report:\n", classification_report(y_test, y_pred))


knn.fit(X_scaled, y)


joblib.dump(knn, model_file)
print(f"\nWeighted KNN model saved as '{model_file}'")


df_all['predicted_risk'] = knn.predict(X_scaled)
probs = knn.predict_proba(X_scaled)
df_all[['low_prob','moderate_prob','high_prob']] = probs

# Save predictions
df_all.to_csv(output_file, index=False)
print(f" All flood risk predictions saved to '{output_file}'")


latest_data = df_all.iloc[-1:][feature_cols].to_numpy()
latest_scaled = scale_features(latest_data)

next_day_prediction = knn.predict(latest_scaled)[0]
next_day_proba = knn.predict_proba(latest_scaled)[0]

risk_labels = {0: "Low", 1: "Moderate", 2: "High"}
predicted_label = risk_labels[next_day_prediction]

print("\n Next-Day Flood Risk Prediction ")
print(f"Predicted Risk: {predicted_label}")
print(f"Probabilities → Low: {next_day_proba[0]:.2f}, Moderate: {next_day_proba[1]:.2f}, High: {next_day_proba[2]:.2f}")
