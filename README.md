# Mental Health Score

A machine learning web project that predicts a **mental health score** from a student's lifestyle, academic and social media habits.

A scikit-learn model is served through a **FastAPI** backend and used by a plain **HTML / CSS / JavaScript** frontend.

> **Disclaimer:** This project is for educational purposes only. The prediction is not a medical diagnosis or a professional mental health assessment.

---

## Features

- Regression model trained on a student social media and mental health dataset
- REST API built with FastAPI, with request validation through Pydantic
- Frontend with no frameworks: just HTML, CSS and vanilla JavaScript (`fetch()`)
- Client-side form validation with friendly messages next to each field
- Loading, error and reset states, plus a circular score gauge

---

## How It Works

```text
Browser (index.html + script.js)
        |  POST /predict  (JSON)
        v
FastAPI (main.py)  --validates with Pydantic-->  scikit-learn pipeline (Mental_Health_Model.pkl)
        |
        v
{ "predicted_mental_health_score": 72.45 }
        |
        v
Browser shows the score and gauge
```

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | HTML, CSS, vanilla JavaScript                   |
| Backend  | Python, FastAPI, Pydantic, Uvicorn              |
| ML       | scikit-learn, pandas, joblib                    |
| Training | Google Colab (`ML_Project1.ipynb`)              |

---

## Project Structure

```text
Machine Learning/
├── main.py                 # FastAPI backend
├── requirements.txt        # Python dependencies
├── index.html              # Frontend page
├── style.css               # Frontend styles
├── script.js               # Frontend logic (validation + API calls)
├── ML_Project1.ipynb       # Data analysis and model training notebook
├── Student Social Media And Mental Health Impact.csv   # Dataset
├── Mental_Health_Model.pkl # Trained model pipeline
└── README.md
```

---

## Dataset and Model

**Dataset:** 5,000 rows with 13 columns. The target is `Mental_Health_Score`.

**Input features**

| Feature | Type |
|---------|------|
| Age | Numeric |
| Gender | Categorical |
| Country (grouped into the top 10 values; everything else becomes `Other`) | Categorical |
| Academic Level | Categorical |
| Most Used Platform | Categorical |
| Purpose of Use | Categorical |
| Average Daily Usage Hours | Numeric |
| Daily Unlocks | Numeric |
| Study Hours | Numeric (log-transformed, since it is skewed) |
| Physical Activity Hours | Numeric |
| Sleep Hours Per Night | Numeric |
| Stress Level | Ordinal (Low < Medium < High < Very High) |

**Preprocessing (scikit-learn `ColumnTransformer` + `Pipeline`):** log transform and scaling for the skewed column, scaling for the other numeric columns, ordinal encoding for stress level and one-hot encoding for the remaining categories.

**Data cleaning:** duplicates removed and negative physical activity values clipped to 0.

**Models compared** (70/30 train-test split, `random_state=42`):

| Model | Test R² | Train R² | MAE | RMSE |
|-------|---------|----------|-----|------|
| Linear Regression | 0.740 | 0.724 | 0.536 | 0.676 |
| Random Forest (default) | 0.878 | 0.981 | 0.347 | 0.464 |
| Random Forest (tuned with RandomizedSearchCV) | 0.865 | 0.955 | 0.369 | 0.487 |

The saved model (`Mental_Health_Model.pkl`) is the **default Random Forest pipeline**. It scored best on the test set. Its much higher training R² suggests some overfitting.

---

## API Reference

Base URL: `http://127.0.0.1:8000`

### `GET /`

Health check that returns a welcome message.

### `POST /predict`

**Request body**

```json
{
  "age": 21,
  "gender": "Male",
  "country": "India",
  "academic_level": "Undergraduate",
  "most_used_platform": "Instagram",
  "purpose_of_use": "Entertainment",
  "avg_daily_usage_hours": 5.5,
  "daily_unlocks": 40,
  "study_hours": 4,
  "physical_activity_hours": 1,
  "sleep_hours_per_night": 7,
  "stress_level": "Medium"
}
```

**Allowed values**

| Field | Rule |
|-------|------|
| `age` | integer, 10 to 100 |
| `gender` | `Male`, `Female` |
| `country` | string (values outside the top countries are treated as `Other`) |
| `academic_level` | `Undergraduate`, `Graduate`, `High School` |
| `most_used_platform` | `Facebook`, `LinkedIn`, `Instagram`, `Snapchat`, `Twitter`, `YouTube`, `TikTok`, `LINE`, `KakaoTalk`, `VKontakte`, `WhatsApp`, `WeChat` |
| `purpose_of_use` | `Networking`, `Education`, `Entertainment`, `News` |
| `avg_daily_usage_hours` | float, 0 to 24 |
| `daily_unlocks` | integer, 0 or more |
| `study_hours` | float, 0 to 24 |
| `physical_activity_hours` | float, 0 to 24 |
| `sleep_hours_per_night` | float, 0 to 24 |
| `stress_level` | `Low`, `Medium`, `High`, `Very High` |

**Response**

```json
{
  "predicted_mental_health_score": 72.45
}
```

Invalid input returns `422 Unprocessable Entity` with details.

FastAPI also generates interactive docs at `http://127.0.0.1:8000/docs`.

---

## Getting Started

### Prerequisites

- Python 3.10 or newer
- A modern web browser

### 1. Install dependencies

From inside the `Machine Learning` folder:

```bash
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Start the backend

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Check it at `http://127.0.0.1:8000/docs`.

### 3. Start the frontend

Open a second terminal in the same folder and run:

```bash
python -m http.server 5500
```

Then open **http://127.0.0.1:5500/index.html** in your browser.

Fill in the form, click **Calculate Mental Health Score** and view the result.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Unable to connect to the prediction server" | Make sure Uvicorn is running on port 8000 |
| CORS error in the console | Confirm `CORSMiddleware` is added in `main.py` (this project allows all origins) |
| `pip install -r requirements.txt` fails | Each line must contain only a package name, with no trailing commas |
| Model fails to load or shows a version warning | Install the same scikit-learn version used in Colab to train the model |
| Port 8000 already in use | Stop the other process or start Uvicorn on another port and update `API_URL` in `script.js` |

---

## Limitations

- The dataset mostly describes college-age students, so predictions for people far outside that range (for example age 10 or 80) are less reliable.
- The model shows signs of overfitting (train R² is much higher than test R²).
- The score is on a 0 to 10 scale, and the gauge is drawn against that range. If the range ever changes, update `MAX_SCORE` at the top of `script.js`.
- The model finds statistical patterns in a survey-style dataset and does not measure actual mental health.

---

## Future Improvements

- Show the most important features behind each prediction
- Try other models and cross-validation to reduce overfitting
- Deploy the backend and frontend online

---

## Author

**Vishal**
GitHub: [vishalkhade25](https://github.com/vishalkhade25)
