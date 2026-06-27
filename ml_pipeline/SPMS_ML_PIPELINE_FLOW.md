# SPMS ML Pipeline Flow

This document explains the current machine learning flow in simple language.
It starts from `master_data.csv` and ends at the anomaly result used by SPMS.

## Purpose

The ML pipeline is built for experimental Form 4 work on the Secure Predictive
Maintenance System for the PMA Granulator machine.

The goal is to learn normal active-running machine behavior, then flag windows
that are hard for the model to reconstruct. A high reconstruction error means
the machine behavior looks unusual compared with the normal training pattern.

This is anomaly detection. It is not validated failure prediction, and it is
not Remaining Useful Life (RUL), because there are no confirmed failure or
maintenance labels in the current dataset.

## Main Flow

### 1. Start From The Raw Source

The source file is:

```text
Data/data/master_data.csv
```

This file is treated as the source of truth for the current rebuild. The
current dataset has:

- `414,720` rows
- timestamps from `2025-05-30 00:00:00` to `2026-03-13 23:59:00`
- one row per minute
- no duplicate timestamps in the raw minute grid

### 2. Audit The Data First

Before training anything, the notebook checks the dataset quality:

- total row count
- timestamp range
- duplicate timestamps
- missing values
- zero values
- process distribution
- batch distribution

This step protects the model from silently training on broken data.

### 3. Choose The Model Features

The model uses these 8 sensor features:

- `impeller_rpm`
- `chopper_rpm`
- `impeller_ampere`
- `X-Axis RMS Velocity (mm/s)`
- `Z-Axis RMS Velocity (mm/s)`
- `X-Axis Peak Acceleration (G)`
- `Z-Axis Peak Acceleration (G)`
- `Temperature C`

The inch-unit vibration columns are excluded because they duplicate the same
vibration meaning already represented in millimeters per second.

`batch_id_clean` and `process_id_clean` are kept for checking and traceability,
but they are not used as numeric model features.

### 4. Detect Basic Machine State

The pipeline creates a simple machine-state layer before making LSTM windows.

The current states are:

- `Absolute Offline`: impeller RPM and impeller ampere are both zero.
- `Active Running`: impeller RPM and ampere pass conservative nonzero floors.
- `Transition/Idle`: everything that is not clearly offline or active-running.

Only active-running rows are allowed into model windows. This is meant to stop
the model from learning offline or idle behavior as normal machine operation.

### 5. Keep The Full 1-Minute Grid

The pipeline keeps the real timestamp grid instead of compressing rows.

This matters because an LSTM window must represent real consecutive minutes.
If rows are filtered first and then windowed by row order, the model can
accidentally join two machine readings that are far apart in real time.

That old row-order approach is rejected.

### 6. Apply The Gap Rule

The dataset has missing sensor values. The pipeline separates them into two
types:

- Micro-gaps: missing runs up to 2 minutes.
- Macro-gaps: missing runs longer than 2 minutes.

Micro-gaps can be interpolated because the machine usually does not change
drastically over 1 or 2 minutes.

Macro-gaps stay as `NaN`. The notebook does not fill them with zero, because
zero would create fake machine behavior and poison the model.

Current rebuild result:

- missing model-feature cells before interpolation: `163,128`
- missing model-feature cells after interpolation: `152,844`
- full-grid rows still touching missing model features: `50,219`

### 7. Build Valid 15-Minute LSTM Windows

The model sees data in 15-minute windows.

A valid window must:

- come from the full timestamp grid
- contain 15 continuous minutes
- contain no `NaN` in model features
- be active-running for all 15 rows
- stay inside one batch

Current aligned rebuild result:

- valid windows before split embargo: `4,977`
- valid windows after split embargo: `4,963`
- skipped windows: `409,729`

Skipped-window reasons:

- `51,852` touched missing model-feature values
- `357,448` were not active-running for all rows
- `2` crossed batch or missing-batch boundaries
- `427` crossed process boundaries

### 8. Split The Windows By Time

The aligned rebuild sorts valid windows by time, then applies a split-boundary
embargo so train, validation, and test windows do not overlap.

The split target is still:

- train: first 70 percent
- validation: next 15 percent
- test: final 15 percent

Current aligned split:

- train windows: `3,483`
- validation windows: `746`
- test windows: `734`

The current split boundaries are non-overlapping:

- train ends at `2025-11-06 22:59:00`
- validation starts at `2025-11-07 22:32:00`
- validation ends at `2026-02-20 14:59:00`
- test starts at `2026-02-20 15:00:00`

### 9. Scale The Sensor Values

The model uses a `MinMaxScaler`.

Important rule:

- fit the scaler only on train windows
- use the trained scaler to transform validation and test windows

This prevents validation and test data from influencing the training scale.

### 10. Train The LSTM Autoencoder

The model is an LSTM Autoencoder.

It learns to reconstruct normal active-running windows. During inference:

- normal behavior should reconstruct with low error
- unusual behavior should reconstruct with higher error

The current rebuild saves the model to:

```text
Data/export_models/spms_lstm_autoencoder_rebuild.keras
```

### 11. Pick The Anomaly Threshold

The notebook calculates reconstruction error on train, validation, and test
windows.

The current threshold policy is:

```text
99th percentile of validation reconstruction MAE
```

Current selected threshold:

```text
0.2241775095462799
```

The threshold is saved with metadata, not only as a raw number.

### 12. Produce The Final Result

For each window, the final ML result is:

- reconstruction error
- threshold
- anomaly flag

The logic is:

```text
if reconstruction_error > threshold:
    result = anomaly
else:
    result = normal
```

This result can support a dashboard health status or backend prediction
endpoint, but it should be described as anomaly detection unless the team later
adds real failure or maintenance labels.

## Current Exported Artifacts

The current rebuild exports:

- `Data/data/spms_cleaned_full_grid.csv`
- `Data/data/spms_valid_windows_metadata.csv`
- `Data/data/spms_lstm_windows_rebuild.npz`
- `Data/export_models/spms_lstm_autoencoder_rebuild.keras`
- `Data/export_models/spms_minmax_scaler_rebuild.pkl`
- `Data/export_models/anomaly_threshold_rebuild.joblib`
- `Data/export_models/spms_lstm_rebuild_metadata.json`
- `Data/SPMS_LSTM_Autoencoder_Experimental_Report.ipynb`

## Current Known Problems After Alignment

These problems are fixed in the aligned rebuild:

- train, validation, and test split boundaries no longer overlap
- process-crossing windows are rejected
- macro-gap assertions now verify that macro-gap cells remain `NaN`
- exported metadata uses repo-relative paths

This problem remains as a known limitation:

- `4,710` accepted windows contain at least one row where `chopper_rpm == 0`;
  a hard chopper-on filter leaves too few valid windows, so this should be
  reviewed with process experts before production use

## Simple Explanation For Reports

The SPMS model does not directly predict when the machine will fail. Instead,
it learns normal machine patterns from clean active-running windows. When new
machine data is passed into the model, the model tries to reconstruct it. If
the reconstruction error is high, the system marks the window as anomalous.

This makes the current model useful for predictive monitoring, but not yet for
validated RUL or failure-date prediction.
