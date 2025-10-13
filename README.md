# Flood Risk Predictor

A full-stack web application that predicts flood risk levels based on reservoir and rainfall data using a **KNN machine learning model**. The project includes a **FastAPI backend** serving predictions via REST API and a **Next.js frontend** with a dynamic, animated, and professional form for user input.

---

## Features

### Backend (FastAPI)
- Predicts flood risk: Low, Moderate, High
- Returns probability distribution for each risk level
- Scales input features using pre-trained scaler parameters
- **CORS enabled** for frontend integration
- Fully typed and robust FastAPI endpoints
- Docker-ready

### Frontend (Next.js + TailwindCSS)
- Dynamic form auto-generated from model schema
- Animated floating labels and professional design
- Live input validation with shake animation for empty fields
- Displays prediction results with probabilities
- Fully responsive and mobile-friendly
- Written in **TypeScript**
- Easily extendable schema for new models

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Python, FastAPI, Pandas, NumPy, scikit-learn, Joblib |
| Frontend  | Next.js, TypeScript, TailwindCSS, React Hooks |
| Deployment| Docker, Vercel / Netlify |

---

## Folder Structure

flood-risk-predictor/
│
├─ backend/
│ ├─ app/
│ │ ├─ main.py
│ │ ├─ flood_risk_knn_weighted_model.pkl
│ │ └─ scaler_params.pkl
│ ├─ requirements.txt
│ └─ Dockerfile
│
├─ frontend/
│ ├─ pages/
│ │ └─ index.tsx
│ ├─ utils/
│ │ └─ schema.ts
│ ├─ styles/
│ │ └─ globals.css
│ ├─ package.json
│ └─ tsconfig.json
│
├─ screenshots/
│ ├─ form.png
│ └─ result.png
├─ README.md
└─ .gitignore

yaml
Copy code

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/flood-risk-predictor.git
cd flood-risk-predictor
2. Backend Setup (FastAPI)
Navigate to backend folder:

bash
Copy code
cd backend
Install dependencies:

bash
Copy code
pip install -r requirements.txt
Run FastAPI server:

bash
Copy code
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Ensure model files flood_risk_knn_weighted_model.pkl and scaler_params.pkl are in app/.

3. Frontend Setup (Next.js)
Navigate to frontend folder:

bash
Copy code
cd ../frontend
Install dependencies:

bash
Copy code
npm install
Run development server:

bash
Copy code
npm run dev
Open browser at http://localhost:3000

The frontend calls the backend API at http://localhost:8000/predict.

4. Docker Setup (Optional)
Build Docker image:

bash
Copy code
docker build -t flood-predictor ./backend
Run container:

bash
Copy code
docker run -d -p 8000:8000 flood-predictor
Deployment
Frontend
Deploy on Vercel, Netlify, or similar platforms.

Update backend API URL in fetch() to deployed backend.

Backend
Deploy using Docker on servers like AWS EC2, DigitalOcean, Render, or Heroku.

Update allow_origins in CORS to point to frontend URL.

Usage
Start backend (FastAPI).

Start frontend (Next.js).

Open the web app.

Fill reservoir and rainfall data in the form.

Submit to get flood risk prediction with probabilities.

Notes
CORS is enabled for local development (allow_origins=["*"]). Update in production.

Input fields are dynamically generated from floodModelSchema.

Validation includes red shake animation for empty inputs.

TailwindCSS provides professional styling and animations.

Future Improvements
Add user authentication to save predictions.

Integrate real-time reservoir & rainfall APIs for live predictions.

Add historical data visualization using charts.

Enable secure HTTPS deployment.

Enhance UI with success animations for submit button.

Live Demo (Optional)
Frontend: https://your-frontend.vercel.app

Backend API: https://your-backend.com/predict

License
This project is licensed under the MIT License.
