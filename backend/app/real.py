import pandas as pd


rainfall_file = "Rainfall_2020.csv"       
reservoir_file = "Dam_2020.csv"     
output_file = "merged_data_2020_1.csv"

df_rain = pd.read_csv(rainfall_file)
df_res = pd.read_csv(reservoir_file)


for df in [df_rain, df_res]:
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.date


df_merged = pd.merge(df_rain, df_res, on="Date", how="outer", suffixes=("_rain", "_res"))

columns_needed = [
    "Date",
    "Avg_rainfall",
    "Full_reservoir_level",
    "Live_capacity_FRL",
    "Storage",
    "Level"
]


available_cols = [c for c in columns_needed if c in df_merged.columns]
df_final = df_merged[available_cols].dropna(subset=["Date"])


df_final.to_csv(output_file, index=False)

print(f"✅ Merged data saved successfully to {output_file}")
print(df_final.head(10))
