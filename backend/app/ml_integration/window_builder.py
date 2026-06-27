import math
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


PMA_L1_SOURCE = "pma_l1"
DEFAULT_MACHINE_ID = "PMA Granulator #01"
DEFAULT_ACTIVE_IMPELLER_RPM = 1.0
DEFAULT_ACTIVE_IMPELLER_AMPERE = 12.48

PMA_L1_COLUMNS_SQL = """
    SELECT
        id,
        readable_time AS timestamp,
        :machine_id AS machine_id,
        batch_id_clean AS batch_id,
        process_id_clean AS process_id,
        impeller_rpm,
        chopper_rpm,
        impeller_ampere,
        x_axis_rms_velocity_mm_s AS x_axis_rms_velocity,
        z_axis_rms_velocity_mm_s AS z_axis_rms_velocity,
        x_axis_peak_acceleration_g AS x_axis_peak_acceleration,
        z_axis_peak_acceleration_g AS z_axis_peak_acceleration,
        temperature_c
    FROM pma_l1
    WHERE readable_time IS NOT NULL
    ORDER BY readable_time DESC
    LIMIT :limit
"""


class WindowValidationError(ValueError):
    """The telemetry rows cannot form a model-safe LSTM window."""


class WindowSourceUnavailable(RuntimeError):
    """The canonical inference source table is unavailable."""


def fetch_latest_pma_l1_rows(
    db: Session,
    *,
    limit: int,
    machine_id: str = DEFAULT_MACHINE_ID,
) -> list[dict[str, Any]]:
    try:
        results = db.execute(
            text(PMA_L1_COLUMNS_SQL),
            {"limit": limit, "machine_id": machine_id},
        ).fetchall()
    except SQLAlchemyError as exc:
        raise WindowSourceUnavailable(
            "pma_l1 telemetry source is not initialized. Reset the local Docker database volume so db_init imports can run."
        ) from exc

    return [dict(row._mapping) for row in results]


def _normalize_timestamp(value: Any, row_number: int) -> datetime:
    if value is None:
        raise WindowValidationError(f"Row {row_number} is missing timestamp.")
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise WindowValidationError(f"Row {row_number} has invalid timestamp.") from exc
    if not isinstance(value, datetime):
        raise WindowValidationError(f"Row {row_number} has invalid timestamp.")
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _numeric(value: Any, label: str, row_number: int) -> float:
    if value is None:
        raise WindowValidationError(f"Row {row_number} is missing feature '{label}'.")
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise WindowValidationError(f"Row {row_number} feature '{label}' must be numeric.") from exc
    if not math.isfinite(numeric):
        raise WindowValidationError(f"Row {row_number} feature '{label}' must be finite.")
    return numeric


def validate_prediction_window(
    rows: list[dict[str, Any]],
    *,
    expected_window: int,
    feature_names: list[str],
    active_impeller_rpm: float = DEFAULT_ACTIVE_IMPELLER_RPM,
    active_impeller_ampere: float = DEFAULT_ACTIVE_IMPELLER_AMPERE,
) -> list[dict[str, Any]]:
    if len(rows) != expected_window:
        raise WindowValidationError(f"Expected exactly {expected_window} telemetry rows.")

    prepared: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        row_number = index + 1
        prepared_row = dict(row)
        prepared_row["timestamp"] = _normalize_timestamp(prepared_row.get("timestamp"), row_number)

        for feature in feature_names:
            prepared_row[feature] = _numeric(prepared_row.get(feature), feature, row_number)

        if not prepared_row.get("batch_id"):
            raise WindowValidationError(f"Row {row_number} is missing batch_id.")
        if not prepared_row.get("process_id"):
            raise WindowValidationError(f"Row {row_number} is missing process_id.")

        if (
            prepared_row["impeller_rpm"] < active_impeller_rpm
            or prepared_row["impeller_ampere"] < active_impeller_ampere
        ):
            raise WindowValidationError(
                f"Row {row_number} is not active-running "
                f"(requires impeller_rpm >= {active_impeller_rpm:g} and impeller_ampere >= {active_impeller_ampere:g})."
            )

        prepared.append(prepared_row)

    prepared.sort(key=lambda item: item["timestamp"])

    batch_ids = {str(row["batch_id"]) for row in prepared}
    if len(batch_ids) != 1:
        raise WindowValidationError("Window crosses batch_id values.")

    process_ids = {str(row["process_id"]) for row in prepared}
    if len(process_ids) != 1:
        raise WindowValidationError("Window crosses process_id values.")

    for index in range(1, len(prepared)):
        previous = prepared[index - 1]["timestamp"]
        current = prepared[index]["timestamp"]
        seconds = (current - previous).total_seconds()
        if seconds != 60:
            raise WindowValidationError(
                f"Window timestamps are not a continuous 1-minute grid at row {index + 1}."
            )

    return prepared


def build_latest_valid_pma_l1_window(
    db: Session,
    *,
    expected_window: int,
    feature_names: list[str],
    machine_id: str = DEFAULT_MACHINE_ID,
    candidate_limit: int = 1500,
) -> dict[str, Any]:
    rows_desc = fetch_latest_pma_l1_rows(
        db,
        limit=max(candidate_limit, expected_window),
        machine_id=machine_id,
    )
    if len(rows_desc) < expected_window:
        raise WindowValidationError(
            f"pma_l1 has {len(rows_desc)} rows with timestamps; {expected_window} are required."
        )

    rows_asc = list(reversed(rows_desc))
    latest_error: WindowValidationError | None = None

    for end_index in range(len(rows_asc), expected_window - 1, -1):
        candidate = rows_asc[end_index - expected_window : end_index]
        try:
            window = validate_prediction_window(
                candidate,
                expected_window=expected_window,
                feature_names=feature_names,
            )
        except WindowValidationError as exc:
            if latest_error is None:
                latest_error = exc
            continue

        return {
            "rows": window,
            "source": PMA_L1_SOURCE,
            "window_start": window[0]["timestamp"],
            "window_end": window[-1]["timestamp"],
        }

    detail = "No valid pma_l1 inference window found in the latest candidate rows."
    if latest_error is not None:
        detail = f"{detail} Latest rejected window: {latest_error}"
    raise WindowValidationError(detail)
