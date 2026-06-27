import unittest
from datetime import datetime, timedelta

from app.ml_integration.inference_service import inference_service
from app.ml_integration.window_builder import WindowValidationError, validate_prediction_window


FEATURES = inference_service.feature_names()
WINDOW_SIZE = inference_service.window_size()


def make_row(offset: int, **overrides):
    row = {
        "timestamp": datetime(2026, 1, 1, 8, 0) + timedelta(minutes=offset),
        "batch_id": "BATCH-01",
        "process_id": "PROC-01",
        "impeller_rpm": 25.0,
        "chopper_rpm": 10.0,
        "impeller_ampere": 15.0,
        "x_axis_rms_velocity": 0.4,
        "z_axis_rms_velocity": 0.5,
        "x_axis_peak_acceleration": 0.2,
        "z_axis_peak_acceleration": 0.3,
        "temperature_c": 32.0,
    }
    row.update(overrides)
    return row


class WindowBuilderTests(unittest.TestCase):
    def valid_rows(self):
        return [make_row(index) for index in range(WINDOW_SIZE)]

    def test_valid_15_row_active_window_succeeds(self):
        window = validate_prediction_window(
            self.valid_rows(),
            expected_window=WINDOW_SIZE,
            feature_names=FEATURES,
        )

        self.assertEqual(len(window), WINDOW_SIZE)
        self.assertEqual(window[0]["timestamp"], datetime(2026, 1, 1, 8, 0))
        self.assertEqual(window[-1]["timestamp"], datetime(2026, 1, 1, 8, 14))

    def test_missing_feature_fails(self):
        rows = self.valid_rows()
        rows[3]["temperature_c"] = None

        with self.assertRaisesRegex(WindowValidationError, "temperature_c"):
            validate_prediction_window(rows, expected_window=WINDOW_SIZE, feature_names=FEATURES)

    def test_inactive_row_fails(self):
        rows = self.valid_rows()
        rows[5]["impeller_ampere"] = 0.0

        with self.assertRaisesRegex(WindowValidationError, "not active-running"):
            validate_prediction_window(rows, expected_window=WINDOW_SIZE, feature_names=FEATURES)

    def test_timestamp_gap_fails(self):
        rows = self.valid_rows()
        rows[8]["timestamp"] = rows[8]["timestamp"] + timedelta(minutes=1)

        with self.assertRaisesRegex(WindowValidationError, "continuous 1-minute grid"):
            validate_prediction_window(rows, expected_window=WINDOW_SIZE, feature_names=FEATURES)

    def test_cross_batch_fails(self):
        rows = self.valid_rows()
        rows[10]["batch_id"] = "BATCH-02"

        with self.assertRaisesRegex(WindowValidationError, "batch_id"):
            validate_prediction_window(rows, expected_window=WINDOW_SIZE, feature_names=FEATURES)

    def test_cross_process_fails(self):
        rows = self.valid_rows()
        rows[10]["process_id"] = "PROC-02"

        with self.assertRaisesRegex(WindowValidationError, "process_id"):
            validate_prediction_window(rows, expected_window=WINDOW_SIZE, feature_names=FEATURES)


if __name__ == "__main__":
    unittest.main()
