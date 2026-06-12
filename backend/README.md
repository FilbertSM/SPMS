# 🏭 SPMS API Backend

**Secure Predictive Maintenance System (SPMS)** backend API built with [FastAPI](https://fastapi.tiangolo.com/), engineered for high-performance telemetry ingestion, AI model integration, and secure, tamper-proof logging.

## 🚀 Prerequisites

*   [Docker](https://www.docker.com/get-started) and Docker Compose
*   *Optional:* Python 3.11+ (if running bare-metal without Docker)

## ⚙️ Quick Start (Dockerized)

The easiest way to run the API and MariaDB database is via Docker Compose.

### 1. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
*Update the `.env` values if necessary.*

### 2. Run for Development (Live Reload)
This command uses the `dev` profile to mount your local folder into the container. Any code changes will trigger an automatic server restart.
```bash
docker-compose --profile dev up --build -d
```

If Docker commands fail with a Windows engine-pipe or permission error, start Docker Desktop and run the command from a shell/user that has Docker Desktop access.

For local signup/login diagnosis, inspect the API and database logs:
```bash
docker compose --profile dev logs -f api-dev mariadb
```

If the local MariaDB volume was created before the current user schema, reset the local-only database volume and rebuild:
```bash
docker compose --profile dev down -v
docker compose --profile dev up --build -d
```

### 3. Run for Production
This builds the optimized, security-hardened multi-stage image.
```bash
docker-compose --profile production up -build -d
```
*(Or simply `docker-compose up -d --build` as `production` is also mapped as default).*

## 📂 Directory Architecture

```text
backend/
├── app/
│   ├── api/           # Route handlers (separated by version, e.g., v1)
│   ├── core/          # Core settings (CORS, Env Vars, Config)
│   ├── db/            # Database connections (SQLAlchemy engine/sessions)
│   ├── models/        # Database ORM classes (MariaDB Tables)
│   ├── schemas/       # Pydantic validation models (Request/Response shapes)
│   ├── services/      # Business logic, AI Model integration, and Cryptography
│   └── main.py        # FastAPI application factory
├── .env.example       # Template for environment variables
├── docker-compose.yml # Docker orchestration wrapper
├── Dockerfile         # Multi-stage optimized application build
├── requirements.txt   # Python dependencies pinned
└── README.md          # Instructions
```

## 📖 API Documentation

Once the server is running, FastAPI automatically generates interactive documentation:
*   **Swagger (Interactive API UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
*   **ReDoc (Alternative UI):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
*   **Health Check Endpoint:** [http://localhost:8000/](http://localhost:8000/)

## SPMS ML Runtime Loop

The Form 4 demo inference source is the imported `pma_l1` table. It contains the merged PMA, vibration, temperature, batch, process, and 1-minute timestamp fields needed to build model windows. The API does not control or stop the PMA Granulator machine; it only performs anomaly detection and dashboard monitoring.

Runtime artifacts must be manually copied into:

```text
app/ml_integration/
```

Required files:

```text
spms_lstm_autoencoder_rebuild.keras
spms_minmax_scaler_rebuild.pkl
anomaly_threshold_rebuild.joblib
spms_lstm_rebuild_metadata.json
```

The latest-window inference endpoint is:

```bash
POST /api/predict/anomaly/latest
```

It reads the latest valid 15-minute window from `pma_l1`, validates that every row is active-running, continuous at 1-minute intervals, complete across the 8 model features, and within one batch and one process, then saves the resulting anomaly event for `/api/dashboard/summary`.

Manual/test inference remains available:

```bash
POST /api/predict/anomaly
```

Manual payloads must follow the same rules: 15 timestamped rows, complete model features, active-running PMA state, one batch, one process, and a continuous 1-minute grid.

Dashboard data flow:

* `GET /api/telemetry/latest` prefers mapped `pma_l1` rows and falls back to `telemetry_readings`.
* `GET /api/dashboard/summary` returns latest telemetry, latest saved anomaly event, threshold metadata, artifact readiness, valid-window count, skipped-window count, and recent alerts.

Forecast-risk endpoints are authenticated and separate from Autoencoder inference:

```text
POST /api/forecast/latest
GET  /api/forecast/latest
```

They use `daily_health_metrics` and cached `forecast_runs`, apply the current
effective threshold, and never create tickets or machine actions. Missing or
deployment-gate-rejected artifacts return `503`; insufficient history returns
`409`. The current forecast experiment is gate-rejected, so model unavailable is
the expected response until a future Day+1 and Day+7 model passes both baselines
and MASE below `1.0`.

If `pma_l1` is missing or stale in Docker, reset the local-only database volume and rebuild so the `db_init` SQL imports run again:

```bash
docker compose --profile dev down -v
docker compose --profile dev up --build -d
```

## 🛡️ Security & Architecture

*   **Non-Root Docker Execution:** The API container runs exclusively as `spmsuser` to minimize the attack surface.
*   **Pydantic Settings:** Strict environment validations block the system from booting if a critical environment variable is missing or malformed.
*   **CORS Regulated:** The API will reject requests from unrecognized frontends base on your `BACKEND_CORS_ORIGINS` variables.
*   **Healthchecks:** DB and API health checks ensure the system gracefully recovers or blocks unhealthy internal connections.
