"use client";
import { useState, ChangeEvent, FormEvent, FocusEvent } from "react";
import { floodModelSchema, FieldSchema } from "../utils/schema";

interface PredictionResult {
  predicted_risk: string;
  probabilities: {
    low: number;
    moderate: number;
    high: number;
  };
}

export default function Home() {
  const initialFormData = floodModelSchema.reduce((acc, field) => {
    acc[field.name] = "";
    return acc;
  }, {} as Record<string, string>);

  const [formData, setFormData] =
    useState<Record<string, string>>(initialFormData);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Remove error if user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: false });
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      setErrors({ ...errors, [e.target.name]: true });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Check for empty fields
    const newErrors: Record<string, boolean> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value) newErrors[key] = true;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
          Flood Risk Predictor BHAKRA DAM
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid text-black grid-cols-1 gap-4"
        >
          {floodModelSchema.map((field: FieldSchema) => (
            <div
              key={field.name}
              className={`relative ${
                errors[field.name] ? "animate-shake" : ""
              }`}
            >
              <input
                type={field.type}
                step={field.step}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`peer w-full border-b-2 text-black py-2 placeholder-transparent outline-none transition-colors ${
                  errors[field.name]
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
                placeholder={field.label}
              />
              <label className="absolute left-0 -top-3.5 text-black text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                {field.label}
              </label>
              {errors[field.name] && (
                <span className="text-red-500 text-sm mt-1 absolute top-full left-0">
                  This field is required
                </span>
              )}
            </div>
          ))}

          <button
            type="submit"
            className={`mt-4 w-full bg-blue-600 text-black py-3 rounded-xl font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 hover:bg-blue-700 ${
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
            <p className="mb-2 text-black">
              <strong>Risk Level:</strong>{" "}
              <span className="text-red-500">{result.predicted_risk}</span>
            </p>
            <p className="mb-1 text-black font-semibold">Probabilities:</p>
            <ul className="list-disc ml-6 text-black">
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
