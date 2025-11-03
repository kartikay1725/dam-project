"use client";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Droplets,
  TrendingUp,
  Calendar,
  ThermometerSun,
  CloudRain,
  Activity,
  Info,
  AlertCircle,
} from "lucide-react";

// Type definitions
interface HistoricalDataPoint {
  date: string;
  inflow: number;
  outflow: number;
  rainfall: number;
  temperature: number;
}

interface SimpleInputs {
  current_inflow: number;
  recent_rainfall: number;
  temperature: number;
  month: number;
}

interface DetailedInputs {
  rainfall_mm: number;
  temperature_c: number;
  inflow_lag_1: number;
  inflow_lag_3: number;
  inflow_lag_7: number;
  inflow_lag_14: number;
  inflow_lag_30: number;
  outflow_lag_1: number;
  outflow_lag_3: number;
  outflow_lag_7: number;
  outflow_lag_14: number;
  outflow_lag_30: number;
  rainfall_lag_1: number;
  rainfall_lag_3: number;
  rainfall_lag_7: number;
  rainfall_lag_14: number;
  rainfall_lag_30: number;
  temp_lag_1: number;
  temp_lag_3: number;
  temp_lag_7: number;
  temp_lag_14: number;
  temp_lag_30: number;
  date: string;
}

interface PredictionResult {
  predicted_inflow: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  model_name: string;
  prediction_date: string;
  metrics: {
    r2_score: number;
    rmse: number;
  };
}

// Sample historical data - replace with your actual CSV data
const generateHistoricalData = (): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const startDate = new Date("2024-01-01");

  for (let i = 0; i < 180; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const month = date.getMonth() + 1;
    const isMonsoon = month >= 6 && month <= 9;

    const baseInflow = isMonsoon ? 1800 : 1000;
    const variation = Math.sin(i / 30) * 300 + Math.random() * 200;

    data.push({
      date: date.toISOString().split("T")[0],
      inflow: Math.max(500, baseInflow + variation),
      outflow: Math.max(400, (baseInflow + variation) * 0.85),
      rainfall: isMonsoon ? Math.random() * 50 + 10 : Math.random() * 15,
      temperature: 20 + Math.random() * 15 + (isMonsoon ? 5 : 0),
    });
  }

  return data;
};

const DamDashboard = () => {
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [predictionType, setPredictionType] = useState<string>("simple");
  const [loading, setLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simple prediction inputs
  const [simpleInputs, setSimpleInputs] = useState<SimpleInputs>({
    current_inflow: 1500,
    recent_rainfall: 25,
    temperature: 28,
    month: new Date().getMonth() + 1,
  });

  // Detailed prediction inputs
  const [detailedInputs, setDetailedInputs] = useState<DetailedInputs>({
    rainfall_mm: 45,
    temperature_c: 29,
    inflow_lag_1: 1200,
    inflow_lag_3: 1150,
    inflow_lag_7: 1100,
    inflow_lag_14: 950,
    inflow_lag_30: 800,
    outflow_lag_1: 1020,
    outflow_lag_3: 977,
    outflow_lag_7: 935,
    outflow_lag_14: 807,
    outflow_lag_30: 680,
    rainfall_lag_1: 38,
    rainfall_lag_3: 42,
    rainfall_lag_7: 35,
    rainfall_lag_14: 28,
    rainfall_lag_30: 15,
    temp_lag_1: 28,
    temp_lag_3: 28,
    temp_lag_7: 27,
    temp_lag_14: 26,
    temp_lag_30: 24,
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    setHistoricalData(generateHistoricalData());
  }, []);

  const handleSimplePrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/predict/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simpleInputs),
      });

      if (!response.ok) throw new Error("Prediction failed");

      const result: PredictionResult = await response.json();
      setPrediction(result);
    } catch (error) {
      setError(
        "Failed to get prediction. Make sure the API server is running on localhost:8000"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDetailedPrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detailedInputs),
      });

      if (!response.ok) throw new Error("Prediction failed");

      const result: PredictionResult = await response.json();
      setPrediction(result);
    } catch (error) {
      setError(
        "Failed to get prediction. Make sure the API server is running on localhost:8000"
      );
    } finally {
      setLoading(false);
    }
  };

  const latestData = historicalData[historicalData.length - 1] || {};
  const avgInflow =
    historicalData.reduce((acc, d) => acc + d.inflow, 0) /
      historicalData.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Bhakra Nangal Dam Prediction System
              </h1>
              <p className="text-gray-600 mt-1">
                AI-Powered Water Level Forecasting
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Droplets className="w-8 h-8 opacity-80" />
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                Live
              </span>
            </div>
            <p className="text-sm opacity-90">Current Inflow</p>
            <p className="text-3xl font-bold mt-1">
              {latestData.inflow?.toFixed(0) || 0}
            </p>
            <p className="text-xs opacity-80 mt-1">cms (cubic meter/sec)</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 opacity-80" />
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-sm opacity-90">Average Inflow</p>
            <p className="text-3xl font-bold mt-1">{avgInflow.toFixed(0)}</p>
            <p className="text-xs opacity-80 mt-1">Last 180 days</p>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CloudRain className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-sm opacity-90">Rainfall</p>
            <p className="text-3xl font-bold mt-1">
              {latestData.rainfall?.toFixed(1) || 0}
            </p>
            <p className="text-xs opacity-80 mt-1">mm</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <ThermometerSun className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-sm opacity-90">Temperature</p>
            <p className="text-3xl font-bold mt-1">
              {latestData.temperature?.toFixed(1) || 0}°C
            </p>
            <p className="text-xs opacity-80 mt-1">Current</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Historical Data
            </button>
            <button
              onClick={() => setActiveTab("predict")}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === "predict"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Make Prediction
            </button>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Water Inflow & Outflow Trends
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient
                          id="colorInflow"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorOutflow"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#06b6d4"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#06b6d4"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value: string) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="inflow"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorInflow)"
                        name="Inflow (cms)"
                      />
                      <Area
                        type="monotone"
                        dataKey="outflow"
                        stroke="#06b6d4"
                        fillOpacity={1}
                        fill="url(#colorOutflow)"
                        name="Outflow (cms)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <CloudRain className="w-5 h-5 text-teal-500" />
                      Rainfall Pattern
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value: string) =>
                            new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                            })
                          }
                        />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rainfall"
                          stroke="#14b8a6"
                          strokeWidth={2}
                          dot={false}
                          name="Rainfall (mm)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <ThermometerSun className="w-5 h-5 text-orange-500" />
                      Temperature Variation
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value: string) =>
                            new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                            })
                          }
                        />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                          name="Temperature (°C)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "predict" && (
              <div className="space-y-6">
                {/* Prediction Type Selector */}
                <div className="flex gap-4 p-2 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setPredictionType("simple")}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      predictionType === "simple"
                        ? "bg-white shadow-md text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Simple Prediction
                  </button>
                  <button
                    onClick={() => setPredictionType("detailed")}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      predictionType === "detailed"
                        ? "bg-white shadow-md text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Detailed Prediction
                  </button>
                </div>

                {predictionType === "simple" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        Simple prediction requires only basic current
                        conditions. The model will approximate historical data.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Current Inflow (cms)
                        </label>
                        <input
                          type="number"
                          value={simpleInputs.current_inflow}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSimpleInputs({
                              ...simpleInputs,
                              current_inflow: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Recent Rainfall (mm)
                        </label>
                        <input
                          type="number"
                          value={simpleInputs.recent_rainfall}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSimpleInputs({
                              ...simpleInputs,
                              recent_rainfall: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Temperature (°C)
                        </label>
                        <input
                          type="number"
                          value={simpleInputs.temperature}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSimpleInputs({
                              ...simpleInputs,
                              temperature: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Month (1-12)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={simpleInputs.month}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSimpleInputs({
                              ...simpleInputs,
                              month: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSimplePrediction}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Predicting..." : "Generate Prediction"}
                    </button>
                  </div>
                )}

                {predictionType === "detailed" && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-800">
                        Detailed prediction uses comprehensive historical data
                        for more accurate forecasting.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Current Conditions */}
                      <div className="md:col-span-3 font-semibold text-gray-700 text-lg mt-2">
                        Current Conditions
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Rainfall (mm)
                        </label>
                        <input
                          type="number"
                          value={detailedInputs.rainfall_mm}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDetailedInputs({
                              ...detailedInputs,
                              rainfall_mm: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Temperature (°C)
                        </label>
                        <input
                          type="number"
                          value={detailedInputs.temperature_c}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDetailedInputs({
                              ...detailedInputs,
                              temperature_c: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Prediction Date
                        </label>
                        <input
                          type="date"
                          value={detailedInputs.date}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDetailedInputs({
                              ...detailedInputs,
                              date: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      {/* Inflow Lag Features */}
                      <div className="md:col-span-3 font-semibold text-gray-700 text-lg mt-4">
                        Historical Inflow (cms)
                      </div>

                      {[1, 3, 7, 14, 30].map((lag) => (
                        <div key={`inflow-${lag}`}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {lag} day(s) ago
                          </label>
                          <input
                            type="number"
                            value={
                              detailedInputs[
                                `inflow_lag_${lag}` as keyof DetailedInputs
                              ] as number
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setDetailedInputs({
                                ...detailedInputs,
                                [`inflow_lag_${lag}`]: parseFloat(
                                  e.target.value
                                ),
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      ))}

                      {/* Outflow Lag Features */}
                      <div className="md:col-span-3 font-semibold text-gray-700 text-lg mt-4">
                        Historical Outflow (cms)
                      </div>

                      {[1, 3, 7, 14, 30].map((lag) => (
                        <div key={`outflow-${lag}`}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {lag} day(s) ago
                          </label>
                          <input
                            type="number"
                            value={
                              detailedInputs[
                                `outflow_lag_${lag}` as keyof DetailedInputs
                              ] as number
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setDetailedInputs({
                                ...detailedInputs,
                                [`outflow_lag_${lag}`]: parseFloat(
                                  e.target.value
                                ),
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      ))}

                      {/* Rainfall Lag Features */}
                      <div className="md:col-span-3 font-semibold text-gray-700 text-lg mt-4">
                        Historical Rainfall (mm)
                      </div>

                      {[1, 3, 7, 14, 30].map((lag) => (
                        <div key={`rainfall-${lag}`}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {lag} day(s) ago
                          </label>
                          <input
                            type="number"
                            value={
                              detailedInputs[
                                `rainfall_lag_${lag}` as keyof DetailedInputs
                              ] as number
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setDetailedInputs({
                                ...detailedInputs,
                                [`rainfall_lag_${lag}`]: parseFloat(
                                  e.target.value
                                ),
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      ))}

                      {/* Temperature Lag Features */}
                      <div className="md:col-span-3 font-semibold text-gray-700 text-lg mt-4">
                        Historical Temperature (°C)
                      </div>

                      {[1, 3, 7, 14, 30].map((lag) => (
                        <div key={`temp-${lag}`}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {lag} day(s) ago
                          </label>
                          <input
                            type="number"
                            value={
                              detailedInputs[
                                `temp_lag_${lag}` as keyof DetailedInputs
                              ] as number
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setDetailedInputs({
                                ...detailedInputs,
                                [`temp_lag_${lag}`]: parseFloat(e.target.value),
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleDetailedPrediction}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? "Predicting..."
                        : "Generate Detailed Prediction"}
                    </button>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Prediction Error
                      </p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Prediction Results */}
                {prediction && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        Prediction Results
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-6 shadow-md">
                        <p className="text-sm text-gray-600 mb-1">
                          Predicted Inflow
                        </p>
                        <p className="text-4xl font-bold text-green-600">
                          {prediction.predicted_inflow}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">cms</p>
                      </div>

                      <div className="bg-white rounded-lg p-6 shadow-md">
                        <p className="text-sm text-gray-600 mb-1">
                          Confidence Interval (95%)
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {prediction.confidence_interval.lower.toFixed(1)} -{" "}
                          {prediction.confidence_interval.upper.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">cms</p>
                      </div>

                      <div className="bg-white rounded-lg p-6 shadow-md">
                        <p className="text-sm text-gray-600 mb-1">Model Used</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {prediction.model_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Prediction Date: {prediction.prediction_date}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-6 shadow-md">
                        <p className="text-sm text-gray-600 mb-1">
                          Model Performance
                        </p>
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              R² Score:
                            </span>
                            <span className="font-semibold text-gray-800">
                              {prediction.metrics.r2_score.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">RMSE:</span>
                            <span className="font-semibold text-gray-800">
                              {prediction.metrics.rmse.toFixed(2)} cms
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-md">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        Interpretation
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Based on the current conditions and historical patterns,
                        the model predicts an inflow of{" "}
                        <span className="font-bold text-green-600">
                          {prediction.predicted_inflow} cms
                        </span>{" "}
                        with 95% confidence that the actual value will fall
                        between{" "}
                        <span className="font-semibold">
                          {prediction.confidence_interval.lower.toFixed(1)}
                        </span>{" "}
                        and{" "}
                        <span className="font-semibold">
                          {prediction.confidence_interval.upper.toFixed(1)} cms
                        </span>
                        .
                        {prediction.predicted_inflow > 1500 &&
                          " This indicates higher than average inflow, possibly due to increased rainfall or seasonal patterns."}
                        {prediction.predicted_inflow <= 1500 &&
                          prediction.predicted_inflow > 1000 &&
                          " This indicates moderate inflow levels, typical for non-monsoon periods."}
                        {prediction.predicted_inflow <= 1000 &&
                          " This indicates lower inflow levels. Monitor water management strategies accordingly."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">
                About the Prediction System
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                This AI-powered system uses machine learning algorithms trained
                on historical data from the Bhakra Nangal Dam. The model
                analyzes multiple factors including rainfall patterns,
                temperature variations, and historical inflow/outflow data to
                forecast future water levels. The{" "}
                <span className="font-semibold">Simple Prediction</span> mode is
                ideal for quick estimates with minimal input, while the{" "}
                <span className="font-semibold">Detailed Prediction</span> mode
                provides higher accuracy by incorporating comprehensive
                historical data.
              </p>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span>🎯 Model Accuracy: High (R² Score shown in results)</span>
                <span>📊 Training Data: 180+ days of historical records</span>
                <span>⚡ Response Time: ~1-2 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamDashboard;
