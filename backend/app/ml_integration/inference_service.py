import json
import math
import os
import tempfile
import zipfile
from pathlib import Path
from typing import Any


os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "spms_lstm_autoencoder_rebuild.keras"
SCALER_PATH = BASE_DIR / "spms_minmax_scaler_rebuild.pkl"
THRESHOLD_PATH = BASE_DIR / "anomaly_threshold_rebuild.joblib"
METADATA_PATH = BASE_DIR / "spms_lstm_rebuild_metadata.json"


DEFAULT_FEATURES = [
    "impeller_rpm",
    "chopper_rpm",
    "impeller_ampere",
    "x_axis_rms_velocity",
    "z_axis_rms_velocity",
    "x_axis_peak_acceleration",
    "z_axis_peak_acceleration",
    "temperature_c",
]

CANONICAL_TO_API = {
    "impeller_rpm": "impeller_rpm",
    "chopper_rpm": "chopper_rpm",
    "impeller_ampere": "impeller_ampere",
    "X-Axis RMS Velocity (mm/s)": "x_axis_rms_velocity",
    "Z-Axis RMS Velocity (mm/s)": "z_axis_rms_velocity",
    "X-Axis Peak Acceleration (G)": "x_axis_peak_acceleration",
    "Z-Axis Peak Acceleration (G)": "z_axis_peak_acceleration",
    "Temperature C": "temperature_c",
}


class InferenceService:
    def __init__(self) -> None:
        self._metadata: dict[str, Any] | None = None
        self._threshold_payload: Any | None = None
        self._scaler: Any | None = None
        self._model: Any | None = None

    def artifact_status(self) -> dict[str, Any]:
        return {
            "model": MODEL_PATH.exists(),
            "scaler": SCALER_PATH.exists(),
            "threshold": THRESHOLD_PATH.exists(),
            "metadata": METADATA_PATH.exists(),
            "model_path": str(MODEL_PATH),
        }

    def readiness_status(self) -> dict[str, Any]:
        metadata = self.metadata()
        return {
            **self.artifact_status(),
            "threshold_value": metadata.get("threshold"),
            "threshold_policy": metadata.get("threshold_policy", "unknown"),
            "window_size": self.window_size(),
            "features": self.feature_names(),
            "valid_window_count": metadata.get("valid_window_count"),
            "skipped_window_count": metadata.get("skipped_window_count"),
            "limitations": metadata.get("limitations", []),
        }

    def metadata(self) -> dict[str, Any]:
        if self._metadata is None:
            if not METADATA_PATH.exists():
                self._metadata = {}
            else:
                self._metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        return self._metadata

    def feature_names(self) -> list[str]:
        metadata_features = self.metadata().get("features") or []
        return [CANONICAL_TO_API.get(feature, feature) for feature in metadata_features] or DEFAULT_FEATURES

    def window_size(self) -> int:
        return int(self.metadata().get("window_size", 15))

    def threshold(self) -> float:
        metadata_threshold = self.metadata().get("threshold")
        if metadata_threshold is not None:
            return float(metadata_threshold)

        if self._threshold_payload is None:
            if not THRESHOLD_PATH.exists():
                raise RuntimeError("Anomaly threshold artifact is missing.")
            import joblib

            self._threshold_payload = joblib.load(THRESHOLD_PATH)

        if isinstance(self._threshold_payload, dict):
            return float(self._threshold_payload.get("threshold"))
        return float(self._threshold_payload)

    def _load_runtime(self) -> None:
        missing = [name for name, exists in self.artifact_status().items() if name in {"model", "scaler"} and not exists]
        if missing:
            raise RuntimeError(f"Missing ML artifact(s): {', '.join(missing)}")

        if self._scaler is None:
            import joblib

            try:
                self._scaler = joblib.load(SCALER_PATH)
            except Exception as exc:
                raise RuntimeError(f"ML scaler artifact could not be loaded: {exc}") from exc

        if self._model is None:
            from tensorflow import keras

            try:
                self._model = keras.models.load_model(MODEL_PATH, compile=False)
            except Exception as exc:
                try:
                    self._model = self._load_rebuild_autoencoder_from_packaged_weights()
                except Exception as fallback_exc:
                    raise RuntimeError(
                        f"ML model artifact could not be loaded: {fallback_exc}"
                    ) from exc

    def _load_rebuild_autoencoder_from_packaged_weights(self):
        import h5py
        from tensorflow import keras

        feature_count = len(self.feature_names())
        expected_window = self.window_size()

        inputs = keras.layers.Input(shape=(expected_window, feature_count), name="sensor_window")
        x = keras.layers.LSTM(64, return_sequences=True, name="encoder_lstm_64")(inputs)
        x = keras.layers.LSTM(32, return_sequences=False, name="encoder_lstm_32")(x)
        x = keras.layers.RepeatVector(expected_window, name="repeat_latent")(x)
        x = keras.layers.LSTM(32, return_sequences=True, name="decoder_lstm_32")(x)
        x = keras.layers.LSTM(64, return_sequences=True, name="decoder_lstm_64")(x)
        outputs = keras.layers.TimeDistributed(
            keras.layers.Dense(feature_count),
            name="reconstruction",
        )(x)
        model = keras.Model(inputs, outputs, name="spms_lstm_autoencoder_rebuild")

        with zipfile.ZipFile(MODEL_PATH) as archive:
            with tempfile.NamedTemporaryFile(suffix=".weights.h5", delete=False) as weights_file:
                weights_file.write(archive.read("model.weights.h5"))
                weights_path = weights_file.name

        try:
            with h5py.File(weights_path, "r") as weights:
                layer_pairs = [
                    ("lstm", "encoder_lstm_64"),
                    ("lstm_1", "encoder_lstm_32"),
                    ("lstm_2", "decoder_lstm_32"),
                    ("lstm_3", "decoder_lstm_64"),
                ]
                for artifact_layer, model_layer in layer_pairs:
                    vars_group = self._h5_vars_group(weights, f"layers\\{artifact_layer}\\cell")
                    model.get_layer(model_layer).set_weights(
                        [vars_group[str(index)][()] for index in range(3)]
                    )

                dense_vars = self._h5_vars_group(weights, "layers\\time_distributed\\layer")
                model.get_layer("reconstruction").layer.set_weights(
                    [dense_vars["0"][()], dense_vars["1"][()]]
                )
        finally:
            os.unlink(weights_path)

        return model

    @staticmethod
    def _h5_vars_group(weights: Any, key: str):
        candidates = [key, key.replace("\\", "/")]
        for candidate in candidates:
            if candidate in weights:
                return weights[candidate]["vars"]
        raise RuntimeError(f"Expected model weight group is missing: {key}")

    def predict_window(self, rows: list[dict[str, Any]]) -> dict[str, Any]:
        import numpy as np

        expected_window = self.window_size()
        if len(rows) != expected_window:
            raise ValueError(f"Expected exactly {expected_window} telemetry rows.")

        feature_names = self.feature_names()
        matrix: list[list[float]] = []
        for index, row in enumerate(rows):
            values: list[float] = []
            for feature in feature_names:
                value = row.get(feature)
                if value is None:
                    raise ValueError(f"Row {index + 1} is missing feature '{feature}'.")
                numeric = float(value)
                if not math.isfinite(numeric):
                    raise ValueError(f"Row {index + 1} feature '{feature}' must be finite.")
                values.append(numeric)
            matrix.append(values)

        self._load_runtime()

        raw = np.asarray(matrix, dtype=np.float32)
        scaled = self._scaler.transform(raw).reshape(1, expected_window, len(feature_names))
        prediction = self._model.predict(scaled, verbose=0)
        reconstruction_error = float(np.mean(np.abs(prediction - scaled)))
        threshold = self.threshold()

        return {
            "reconstruction_error": reconstruction_error,
            "threshold": threshold,
            "is_anomaly": reconstruction_error > threshold,
            "threshold_policy": self.metadata().get("threshold_policy", "unknown"),
            "window_size": expected_window,
            "features": feature_names,
            "model_version": Path(str(self.metadata().get("model_path", MODEL_PATH.name))).name,
            "limitations": self.metadata().get("limitations", []),
        }


inference_service = InferenceService()
