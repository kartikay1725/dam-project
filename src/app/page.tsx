import { useState, ChangeEvent, FormEvent } from "react";

interface FormData {
  Avg_rainfall: string;
  Full_reservoir_level: string;
  Live_capacity_FRL: string;
  Storage: string;
  Level: string;
  Storage_shift: string;
  delta_storage: string;
  predicted_inflow: string;
  estimated_outflow: string;
}

interface PredictionResult {
  predicted_risk: string;
  probabilities: {
    low: number;
    moderate: number;
    high: number;
  };
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    Avg_rainfall: "",
    Full_reservoir_level: "",
    Live_capacity_FRL: "",
    Storage: "",
    Level: "",
    Storage_shift: "",
    delta_storage: "",
    predicted_inflow: "",
    estimated_outflow: "",
  });

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.fromEntries(
            Object.entries(formData).map(([k, v]) => [k, parseFloat(v)])
          )
        ),
      });

      if (!response.ok) throw new Error("Network response not ok");

      const data: PredictionResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Error calling API. Make sure FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-blue-400 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-2xl w-full animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
          Flood Risk Predictor
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          {Object.keys(formData).map((key) => (
            <div key={key} className="relative">
              <input
                type="number"
                step="any"
                name={key}
                value={formData[key as keyof FormData]}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 placeholder-transparent transition-colors"
                placeholder={key}
              />
              <label className="absolute left-0 -top-3.5 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                {key.replace(/_/g, " ")}
              </label>
            </div>
          ))}

          <button
            type="submit"
            className={`mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 hover:bg-blue-700 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Predicting..." : "Predict Risk"}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-white shadow-lg animate-slide-up">
            <h2 className="text-xl font-bold mb-2 text-blue-800">
              Prediction Result
            </h2>
            <p className="mb-2">
              <strong>Risk Level:</strong>{" "}
              <span className="text-red-500">{result.predicted_risk}</span>
            </p>
            <p className="mb-1 font-semibold">Probabilities:</p>
            <ul className="list-disc ml-6 text-gray-700">
              <li>Low: {result.probabilities.low}</li>
              <li>Moderate: {result.probabilities.moderate}</li>
              <li>High: {result.probabilities.high}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
