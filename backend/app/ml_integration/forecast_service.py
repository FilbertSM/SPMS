import csv
import hashlib
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "spms_daily_p95_forecast.keras"
SCALER_PATH = BASE_DIR / "spms_daily_p95_forecast_scalers.joblib"
METADATA_PATH = BASE_DIR / "spms_daily_p95_forecast_metadata.json"
HISTORY_PATH = BASE_DIR / "spms_daily_health_history.csv"
CALIBRATION_PATH = BASE_DIR / "spms_daily_p95_forecast_calibration.joblib"
GATE_PATH = BASE_DIR / "spms_daily_p95_deployment_gate.json"

FORECAST_ARTIFACTS = {
    "model": MODEL_PATH,
    "scaler": SCALER_PATH,
    "metadata": METADATA_PATH,
    "history": HISTORY_PATH,
    "calibration": CALIBRATION_PATH,
    "deployment_gate": GATE_PATH,
}


class ForecastUnavailable(RuntimeError):
    pass


class InsufficientForecastHistory(ValueError):
    pass


class ForecastService:
    def __init__(self) -> None:
        self._metadata: dict[str, Any] | None = None
        self._gate: dict[str, Any] | None = None
        self._scalers: dict[str, Any] | None = None
        self._calibration: dict[str, Any] | None = None
        self._model: Any | None = None

    def artifact_status(self) -> dict[str, Any]:
        status = {name: path.exists() for name, path in FORECAST_ARTIFACTS.items()}
        status["paths"] = {name: str(path) for name, path in FORECAST_ARTIFACTS.items()}
        return status

    def metadata(self) -> dict[str, Any]:
        if self._metadata is None:
            self._metadata = self._read_json(METADATA_PATH)
        return self._metadata

    def deployment_gate(self) -> dict[str, Any]:
        if self._gate is None:
            self._gate = self._read_json(GATE_PATH)
        return self._gate

    def readiness_status(self) -> dict[str, Any]:
        status = self.artifact_status()
        try:
            gate = self.deployment_gate()
            status["gate_passed"] = bool(gate.get("passed"))
            status["gate"] = gate
        except ForecastUnavailable as exc:
            status["gate_passed"] = False
            status["detail"] = str(exc)
        return status

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any]:
        if not path.exists():
            raise ForecastUnavailable(f"Forecast artifact is missing: {path.name}")
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise ForecastUnavailable(f"Forecast artifact could not be loaded: {path.name}: {exc}") from exc

    def _require_deployable(self) -> None:
        missing = [name for name, path in FORECAST_ARTIFACTS.items() if not path.exists()]
        if missing:
            raise ForecastUnavailable(f"Missing forecast artifact(s): {', '.join(missing)}")
        gate = self.deployment_gate()
        if not gate.get("passed"):
            raise ForecastUnavailable(
                "Forecast model is unavailable because the Day+1 and Day+7 deployment gate was not passed."
            )

    def _load_runtime(self) -> None:
        self._require_deployable()
        import joblib

        if self._scalers is None:
            self._scalers = joblib.load(SCALER_PATH)
        if self._calibration is None:
            self._calibration = joblib.load(CALIBRATION_PATH)
        if self._model is None:
            import keras

            self._model = keras.models.load_model(MODEL_PATH, compile=False)

    def bootstrap_history(self, db, models, *, machine_id: str) -> int:
        if not HISTORY_PATH.exists():
            raise ForecastUnavailable(f"Forecast artifact is missing: {HISTORY_PATH.name}")

        inserted = 0
        with HISTORY_PATH.open("r", encoding="utf-8", newline="") as handle:
            for row in csv.DictReader(handle):
                if int(float(row.get("observation_flag") or 0)) != 1:
                    continue
                metric_date = date.fromisoformat(row["date"])
                existing = (
                    db.query(models.DailyHealthMetric)
                    .filter(
                        models.DailyHealthMetric.machine_id == machine_id,
                        models.DailyHealthMetric.metric_date == metric_date,
                    )
                    .first()
                )
                if existing is not None:
                    continue
                db.add(
                    models.DailyHealthMetric(
                        machine_id=machine_id,
                        metric_date=metric_date,
                        p95_reconstruction_error=float(row["p95_reconstruction_error"]),
                        mean_reconstruction_error=float(row["mean_reconstruction_error"]),
                        max_reconstruction_error=float(row["max_reconstruction_error"]),
                        observation_count=int(float(row["window_count"])),
                        observation_flag=True,
                        source="validated_history_artifact",
                    )
                )
                inserted += 1
        if inserted:
            db.commit()
        return inserted

    def update_daily_metric_from_event(self, db, models, *, event, source: str) -> None:
        event_date = event.timestamp.date()
        events = (
            db.query(models.AnomalyEvent)
            .filter(
                models.AnomalyEvent.machine_id == event.machine_id,
                models.AnomalyEvent.timestamp >= datetime.combine(event_date, datetime.min.time()),
                models.AnomalyEvent.timestamp < datetime.combine(event_date + timedelta(days=1), datetime.min.time()),
            )
            .all()
        )
        values = sorted(float(item.reconstruction_error) for item in events)
        if not values:
            return
        import numpy as np

        metric = (
            db.query(models.DailyHealthMetric)
            .filter(
                models.DailyHealthMetric.machine_id == event.machine_id,
                models.DailyHealthMetric.metric_date == event_date,
            )
            .first()
        )
        if metric is None:
            metric = models.DailyHealthMetric(machine_id=event.machine_id, metric_date=event_date)
            db.add(metric)
        metric.p95_reconstruction_error = float(np.quantile(values, 0.95))
        metric.mean_reconstruction_error = sum(values) / len(values)
        metric.max_reconstruction_error = max(values)
        metric.observation_count = len(values)
        metric.observation_flag = True
        metric.source = source
        metric.updated_at = datetime.now(timezone.utc)
        db.commit()

    @staticmethod
    def risk_status(value: float, threshold: float) -> str:
        if value < threshold:
            return "HEALTHY"
        if value + 1e-12 < threshold * 1.5:
            return "WARNING"
        return "CRITICAL"

    @staticmethod
    def _history_signature(metrics: list[Any]) -> str:
        payload = [
            {
                "date": item.metric_date.isoformat(),
                "p95": item.p95_reconstruction_error,
                "mean": item.mean_reconstruction_error,
                "max": item.max_reconstruction_error,
                "count": item.observation_count,
                "source": item.source,
                "updated_at": item.updated_at.isoformat() if item.updated_at else None,
            }
            for item in metrics
        ]
        return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()

    def _cache_key(self, metrics: list[Any], threshold_state: dict[str, Any]) -> tuple[str, str]:
        history_signature = self._history_signature(metrics)
        payload = {
            "history": history_signature,
            "model_version": self.metadata().get("model_version"),
            "threshold": threshold_state["threshold"],
            "threshold_source": threshold_state["threshold_source"],
        }
        return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest(), history_signature

    @staticmethod
    def _observed_history(metrics: list[Any], limit: int = 30) -> list[dict[str, Any]]:
        return [
            {
                "date": item.metric_date,
                "p95_reconstruction_error": item.p95_reconstruction_error,
                "mean_reconstruction_error": item.mean_reconstruction_error,
                "max_reconstruction_error": item.max_reconstruction_error,
                "observation_count": item.observation_count,
                "source": item.source,
            }
            for item in metrics[-limit:]
        ]

    def _sequence_for_horizon(self, metrics: list[Any], horizon: int):
        import numpy as np
        import pandas as pd

        lookback = int(self.metadata().get("lookback_days", 28))
        latest_date = metrics[-1].metric_date
        start_date = latest_date - timedelta(days=lookback - 1)
        by_date = {item.metric_date: item for item in metrics}
        rows: list[list[float]] = []
        prior_dates = [item.metric_date for item in metrics if item.metric_date < start_date]
        days_since = (start_date - prior_dates[-1]).days - 1 if prior_dates else 0
        for offset in range(lookback):
            metric_date = start_date + timedelta(days=offset)
            metric = by_date.get(metric_date)
            observed = metric is not None and bool(metric.observation_flag)
            days_since = 0 if observed else days_since + 1
            weekday = metric_date.weekday()
            rows.append(
                [
                    float(metric.p95_reconstruction_error) if observed else 0.0,
                    float(metric.mean_reconstruction_error) if observed else 0.0,
                    float(metric.max_reconstruction_error) if observed else 0.0,
                    float(metric.observation_count) if observed else 0.0,
                    1.0 if observed else 0.0,
                    float(days_since),
                    float(np.sin(2 * np.pi * weekday / 7)),
                    float(np.cos(2 * np.pi * weekday / 7)),
                    float(horizon / 14),
                ]
            )
        return pd.DataFrame(rows, columns=self.metadata()["features"]).to_numpy(dtype=np.float32)

    def generate(self, db, models, *, machine_id: str, threshold_state: dict[str, Any], force: bool = False) -> dict:
        self._load_runtime()
        self.bootstrap_history(db, models, machine_id=machine_id)
        metrics = (
            db.query(models.DailyHealthMetric)
            .filter(
                models.DailyHealthMetric.machine_id == machine_id,
                models.DailyHealthMetric.observation_flag.is_(True),
            )
            .order_by(models.DailyHealthMetric.metric_date.asc())
            .all()
        )
        lookback = int(self.metadata().get("lookback_days", 28))
        if len(metrics) < 2 or (metrics[-1].metric_date - metrics[0].metric_date).days + 1 < lookback:
            raise InsufficientForecastHistory(f"At least {lookback} calendar days of history are required.")

        cache_key, history_signature = self._cache_key(metrics, threshold_state)
        if not force:
            cached = db.query(models.ForecastRun).filter(models.ForecastRun.cache_key == cache_key).first()
            if cached is not None:
                return self._run_payload(cached, metrics, cache_status="fresh")

        import numpy as np

        forecasts = []
        threshold = float(threshold_state["threshold"])
        calibration = self._calibration["absolute_residual_by_horizon"]
        for horizon in self.metadata()["released_horizons"]:
            sequence = self._sequence_for_horizon(metrics, int(horizon))
            scaled = self._scalers["x_scaler"].transform(sequence).reshape(1, lookback, -1)
            scaled_prediction = self._model.predict(scaled, verbose=0).reshape(-1, 1)
            predicted = float(self._scalers["y_scaler"].inverse_transform(scaled_prediction)[0, 0])
            residual = float(calibration.get(int(horizon), calibration.get(str(horizon), 0.0)))
            lower = max(0.0, predicted - residual)
            upper = predicted + residual
            forecasts.append(
                {
                    "horizon_days": int(horizon),
                    "target_date": metrics[-1].metric_date + timedelta(days=int(horizon)),
                    "predicted_reconstruction_error": predicted,
                    "lower_bound": lower,
                    "upper_bound": upper,
                    "forecast_risk_status": self.risk_status(predicted, threshold),
                    "interval_crosses_threshold": lower <= threshold <= upper,
                }
            )

        payload = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "history_start": metrics[0].metric_date.isoformat(),
            "history_end": metrics[-1].metric_date.isoformat(),
            "target_metric": self.metadata()["target_metric"],
            "conditional_on_operation": True,
            "threshold": threshold,
            "threshold_source": threshold_state["threshold_source"],
            "model_version": self.metadata()["model_version"],
            "deployment_gate": self.deployment_gate(),
            "forecasts": forecasts,
            "limitations": self.metadata().get("limitations", []),
        }
        run = models.ForecastRun(
            machine_id=machine_id,
            history_start=metrics[0].metric_date,
            history_end=metrics[-1].metric_date,
            threshold=threshold,
            threshold_source=threshold_state["threshold_source"],
            model_version=self.metadata()["model_version"],
            deployment_gate_passed=True,
            history_signature=history_signature,
            cache_key=cache_key,
            payload_json=json.dumps(payload, default=str),
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        return self._run_payload(run, metrics, cache_status="refreshed")

    def latest(self, db, models, *, machine_id: str, threshold_state: dict[str, Any]) -> dict:
        self._require_deployable()
        self.bootstrap_history(db, models, machine_id=machine_id)
        metrics = (
            db.query(models.DailyHealthMetric)
            .filter(models.DailyHealthMetric.machine_id == machine_id, models.DailyHealthMetric.observation_flag.is_(True))
            .order_by(models.DailyHealthMetric.metric_date.asc())
            .all()
        )
        if not metrics:
            raise InsufficientForecastHistory("No observed daily health history is available.")
        run = (
            db.query(models.ForecastRun)
            .filter(models.ForecastRun.machine_id == machine_id)
            .order_by(models.ForecastRun.generated_at.desc())
            .first()
        )
        if run is None:
            raise InsufficientForecastHistory("No cached forecast exists. Generate a forecast first.")
        expected_key, _ = self._cache_key(metrics, threshold_state)
        return self._run_payload(run, metrics, cache_status="fresh" if run.cache_key == expected_key else "stale")

    def _run_payload(self, run, metrics: list[Any], *, cache_status: str) -> dict:
        payload = json.loads(run.payload_json)
        payload["generated_at"] = run.generated_at
        payload["history_start"] = run.history_start
        payload["history_end"] = run.history_end
        for forecast in payload.get("forecasts", []):
            forecast["target_date"] = date.fromisoformat(str(forecast["target_date"])[:10])
        payload["observed_history"] = self._observed_history(metrics)
        payload["cache_status"] = cache_status
        return payload


forecast_service = ForecastService()
