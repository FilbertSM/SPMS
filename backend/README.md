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

## 🛡️ Security & Architecture

*   **Non-Root Docker Execution:** The API container runs exclusively as `spmsuser` to minimize the attack surface.
*   **Pydantic Settings:** Strict environment validations block the system from booting if a critical environment variable is missing or malformed.
*   **CORS Regulated:** The API will reject requests from unrecognized frontends base on your `BACKEND_CORS_ORIGINS` variables.
*   **Healthchecks:** DB and API health checks ensure the system gracefully recovers or blocks unhealthy internal connections.