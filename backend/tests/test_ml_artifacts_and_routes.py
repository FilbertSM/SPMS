import math
import unittest

from app.main import app
from app.ml_integration.inference_service import inference_service


EXPECTED_FEATURES = [
    "impeller_rpm",
    "chopper_rpm",
    "impeller_ampere",
    "x_axis_rms_velocity",
    "z_axis_rms_velocity",
    "x_axis_peak_acceleration",
    "z_axis_peak_acceleration",
    "temperature_c",
]


class MlArtifactsAndRoutesTests(unittest.TestCase):
    def test_required_routes_are_registered(self):
        paths = {route.path for route in app.routes}

        self.assertIn("/api/predict/anomaly/latest", paths)
        self.assertIn("/api/predict/anomaly", paths)
        self.assertIn("/api/dashboard/summary", paths)
        self.assertIn("/api/telemetry/latest", paths)

    def test_ml_artifacts_and_metadata_are_ready(self):
        status = inference_service.artifact_status()
        self.assertTrue(status["model"])
        self.assertTrue(status["scaler"])
        self.assertTrue(status["threshold"])
        self.assertTrue(status["metadata"])

        self.assertEqual(inference_service.window_size(), 15)
        self.assertEqual(inference_service.feature_names(), EXPECTED_FEATURES)
        self.assertTrue(math.isfinite(inference_service.threshold()))


if __name__ == "__main__":
    unittest.main()
