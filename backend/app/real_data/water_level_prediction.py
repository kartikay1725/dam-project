import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os
from pathlib import Path

# Get the directory where the script is located
script_dir = Path(__file__).parent.absolute()
csv_file = script_dir / 'bhakra_nangal_2020_2024.csv'

# Check if file exists
if not csv_file.exists():
    print(f"Error: CSV file not found at {csv_file}")
    print(f"\nCurrent directory: {script_dir}")
    print("\nFiles in current directory:")
    for file in script_dir.iterdir():
        print(f"  - {file.name}")
    raise FileNotFoundError(f"Please ensure 'bhakra_nangal_2020_2024.csv' is in {script_dir}")

# Load the data
print(f"Loading data from: {csv_file}")
df = pd.read_csv(csv_file)

# Convert date to datetime
df['date'] = pd.to_datetime(df['date'])

# Feature Engineering
# Extract temporal features
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['day'] = df['date'].dt.day
df['day_of_year'] = df['date'].dt.dayofyear
df['week_of_year'] = df['date'].dt.isocalendar().week

# Create lag features (previous days' data)
for lag in [1, 3, 7, 14, 30]:
    df[f'inflow_lag_{lag}'] = df['inflow_cms'].shift(lag)
    df[f'outflow_lag_{lag}'] = df['outflow_cms'].shift(lag)
    df[f'rainfall_lag_{lag}'] = df['rainfall_mm'].shift(lag)
    df[f'temp_lag_{lag}'] = df['temperature_c'].shift(lag)

# Rolling statistics (moving averages)
for window in [7, 14, 30]:
    df[f'inflow_rolling_mean_{window}'] = df['inflow_cms'].rolling(window=window).mean()
    df[f'rainfall_rolling_sum_{window}'] = df['rainfall_mm'].rolling(window=window).sum()
    df[f'temp_rolling_mean_{window}'] = df['temperature_c'].rolling(window=window).mean()

# Create seasonal indicators
df['is_monsoon'] = df['month'].isin([6, 7, 8, 9]).astype(int)
df['is_winter'] = df['month'].isin([12, 1, 2]).astype(int)
df['is_summer'] = df['month'].isin([3, 4, 5]).astype(int)

# Drop rows with NaN values created by lag and rolling features
df_clean = df.dropna().reset_index(drop=True)

# Define features and target
target = 'inflow_cms'  # Predicting inflow (water level indicator)
exclude_cols = ['date', 'inflow_cms', 'outflow_cms']  # Don't use outflow as it's dependent
feature_cols = [col for col in df_clean.columns if col not in exclude_cols]

X = df_clean[feature_cols]
y = df_clean[target]
dates = df_clean['date']  # Store dates for later use

# Split data (80% train, 20% test)
split_idx = int(len(X) * 0.8)
X_train = X.iloc[:split_idx]
X_test = X.iloc[split_idx:]
y_train = y.iloc[:split_idx]
y_test = y.iloc[split_idx:]
dates_test = dates.iloc[split_idx:]

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("=" * 70)
print("BHAKRA NANGAL DAM WATER LEVEL PREDICTION MODEL")
print("=" * 70)
print(f"\nDataset Shape: {df_clean.shape}")
print(f"Training Samples: {len(X_train)}")
print(f"Testing Samples: {len(X_test)}")
print(f"Number of Features: {len(feature_cols)}")

# Model 1: Random Forest
print("\n" + "-" * 70)
print("Training Random Forest Model...")
print("-" * 70)
rf_model = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train_scaled, y_train)

rf_pred_train = rf_model.predict(X_train_scaled)
rf_pred_test = rf_model.predict(X_test_scaled)

rf_train_rmse = np.sqrt(mean_squared_error(y_train, rf_pred_train))
rf_test_rmse = np.sqrt(mean_squared_error(y_test, rf_pred_test))
rf_train_r2 = r2_score(y_train, rf_pred_train)
rf_test_r2 = r2_score(y_test, rf_pred_test)
rf_test_mae = mean_absolute_error(y_test, rf_pred_test)

print(f"\nRandom Forest Results:")
print(f"  Training RMSE: {rf_train_rmse:.2f} cms")
print(f"  Testing RMSE:  {rf_test_rmse:.2f} cms")
print(f"  Training R²:   {rf_train_r2:.4f}")
print(f"  Testing R²:    {rf_test_r2:.4f}")
print(f"  Testing MAE:   {rf_test_mae:.2f} cms")

# Model 2: Gradient Boosting
print("\n" + "-" * 70)
print("Training Gradient Boosting Model...")
print("-" * 70)
gb_model = GradientBoostingRegressor(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=5,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42
)
gb_model.fit(X_train_scaled, y_train)

gb_pred_train = gb_model.predict(X_train_scaled)
gb_pred_test = gb_model.predict(X_test_scaled)

gb_train_rmse = np.sqrt(mean_squared_error(y_train, gb_pred_train))
gb_test_rmse = np.sqrt(mean_squared_error(y_test, gb_pred_test))
gb_train_r2 = r2_score(y_train, gb_pred_train)
gb_test_r2 = r2_score(y_test, gb_pred_test)
gb_test_mae = mean_absolute_error(y_test, gb_pred_test)

print(f"\nGradient Boosting Results:")
print(f"  Training RMSE: {gb_train_rmse:.2f} cms")
print(f"  Testing RMSE:  {gb_test_rmse:.2f} cms")
print(f"  Training R²:   {gb_train_r2:.4f}")
print(f"  Testing R²:    {gb_test_r2:.4f}")
print(f"  Testing MAE:   {gb_test_mae:.2f} cms")

# Feature Importance (using Random Forest)
print("\n" + "-" * 70)
print("Top 15 Most Important Features:")
print("-" * 70)
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False)

for idx, row in feature_importance.head(15).iterrows():
    print(f"  {row['feature']:30s}: {row['importance']:.4f}")

# Visualization
fig, axes = plt.subplots(2, 2, figsize=(15, 10))
fig.suptitle('Dam Water Level Prediction Analysis', fontsize=16, fontweight='bold')

# Plot 1: Actual vs Predicted (Random Forest)
axes[0, 0].scatter(y_test, rf_pred_test, alpha=0.5, s=20)
axes[0, 0].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
axes[0, 0].set_xlabel('Actual Inflow (cms)')
axes[0, 0].set_ylabel('Predicted Inflow (cms)')
axes[0, 0].set_title(f'Random Forest: R² = {rf_test_r2:.4f}')
axes[0, 0].grid(True, alpha=0.3)

# Plot 2: Actual vs Predicted (Gradient Boosting)
axes[0, 1].scatter(y_test, gb_pred_test, alpha=0.5, s=20, color='green')
axes[0, 1].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
axes[0, 1].set_xlabel('Actual Inflow (cms)')
axes[0, 1].set_ylabel('Predicted Inflow (cms)')
axes[0, 1].set_title(f'Gradient Boosting: R² = {gb_test_r2:.4f}')
axes[0, 1].grid(True, alpha=0.3)

# Plot 3: Time Series Comparison
axes[1, 0].plot(dates_test.values, y_test.values, label='Actual', linewidth=2)
axes[1, 0].plot(dates_test.values, rf_pred_test, label='RF Prediction', alpha=0.7)
axes[1, 0].set_xlabel('Date')
axes[1, 0].set_ylabel('Inflow (cms)')
axes[1, 0].set_title('Time Series: Actual vs Predicted')
axes[1, 0].legend()
axes[1, 0].grid(True, alpha=0.3)
axes[1, 0].tick_params(axis='x', rotation=45)

# Plot 4: Feature Importance
top_features = feature_importance.head(10)
axes[1, 1].barh(range(len(top_features)), top_features['importance'])
axes[1, 1].set_yticks(range(len(top_features)))
axes[1, 1].set_yticklabels(top_features['feature'])
axes[1, 1].set_xlabel('Importance')
axes[1, 1].set_title('Top 10 Feature Importance')
axes[1, 1].invert_yaxis()

plt.tight_layout()
plt.show()

# Summary Statistics
print("\n" + "=" * 70)
print("PREDICTION SUMMARY")
print("=" * 70)
print(f"\nActual Inflow Statistics (Test Set):")
print(f"  Mean:   {y_test.mean():.2f} cms")
print(f"  Median: {y_test.median():.2f} cms")
print(f"  Std:    {y_test.std():.2f} cms")
print(f"  Min:    {y_test.min():.2f} cms")
print(f"  Max:    {y_test.max():.2f} cms")

print(f"\nBest Model: {'Random Forest' if rf_test_r2 > gb_test_r2 else 'Gradient Boosting'}")
print(f"Best R² Score: {max(rf_test_r2, gb_test_r2):.4f}")
print(f"Best RMSE: {min(rf_test_rmse, gb_test_rmse):.2f} cms")

print("\n" + "=" * 70)
print("Model training complete!")
print("=" * 70)

# Save the best model and scaler
import joblib

print("\n" + "-" * 70)
print("Saving model and preprocessing objects...")
print("-" * 70)

# Choose the best model
best_model = rf_model if rf_test_r2 > gb_test_r2 else gb_model
model_name = 'Random Forest' if rf_test_r2 > gb_test_r2 else 'Gradient Boosting'

# Save model, scaler, and feature information
model_artifacts = {
    'model': best_model,
    'scaler': scaler,
    'feature_cols': feature_cols,
    'model_name': model_name,
    'metrics': {
        'r2_score': max(rf_test_r2, gb_test_r2),
        'rmse': min(rf_test_rmse, gb_test_rmse),
        'mae': rf_test_mae if rf_test_r2 > gb_test_r2 else gb_test_mae
    },
    'feature_importance': feature_importance.to_dict()
}

model_path = script_dir / 'dam_water_level_model.pkl'
joblib.dump(model_artifacts, model_path)

print(f"✓ Model saved successfully to: {model_path}")
print(f"✓ Model type: {model_name}")
print(f"✓ Test R² Score: {model_artifacts['metrics']['r2_score']:.4f}")
print(f"✓ Test RMSE: {model_artifacts['metrics']['rmse']:.2f} cms")
print("-" * 70)