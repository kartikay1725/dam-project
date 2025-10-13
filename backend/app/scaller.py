import pandas as pd
from sklearn.preprocessing import MinMaxScaler


file_path = "./real_data/merged_data_2024.csv"   # change this if your file has a different name

df = pd.read_csv(file_path)


cols_to_scale = [
    "Avg_rainfall",
    "Full_reservoir_level",
    "Live_capacity_FRL",
    "Storage",
    "Level"
]

# Convert safely to numeric (to handle blanks or text)
for col in cols_to_scale:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Drop rows where all scaling columns are NaN
df = df.dropna(subset=cols_to_scale, how="all")


scaler = MinMaxScaler()
df[cols_to_scale] = scaler.fit_transform(df[cols_to_scale])

df.to_csv(file_path, index=False)

print(f" Scaled values have been updated in '{file_path}' successfully!")
print(df.head(10))
