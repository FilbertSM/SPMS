import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Form4Warning from '../components/Form4Warning';
import { fetchJsonWithAuth } from '../utils/api';

const FALLBACK_CURRENT = [4.8, 5.0, 4.6, 5.2, 4.9, 5.8, 6.4, 6.0, 6.2, 5.8, 6.1, 5.7, 6.6, 6.0, 6.3, 5.9, 6.7, 6.1, 6.4, 5.9, 6.2];
const FALLBACK_VIBRATION = [0.22, 0.36, 0.28, 0.42, 0.31, 0.48, 0.35, 0.46, 0.33, 0.51, 0.38, 0.49, 0.41, 0.55, 0.43, 0.58, 0.44, 0.52, 0.40, 0.47];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value, decimals = 3) => {
  const parsed = toNumber(value);
  return parsed === null ? '-' : parsed.toFixed(decimals);
};

const formatTime = (timestamp) => {
  if (!timestamp) return 'No telemetry yet';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const createPolylinePoints = (values, width, height, padding = 10) => {
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width : (index / (values.length - 1)) * width;
      const y = padding + ((max - value) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const createAreaPath = (points, height) => {
  if (!points) return '';
  const pairs = points.split(' ');
  return `M ${pairs.join(' L ')} L ${pairs[pairs.length - 1].split(',')[0]},${height} L 0,${height} Z`;
};

const movingAverage = (values) => {
  if (!values.length) return [];
  return values.map((_, index) => {
    const start = Math.max(0, index - 2);
    const slice = values.slice(start, index + 1);
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
};

const statusStyle = {
  HEALTHY: {
    bg: 'bg-[#6bfe9c]',
    text: 'text-[#00743a]',
    icon: 'check_circle',
    label: 'HEALTHY',
  },
  WARNING: {
    bg: 'bg-[#ffe08a]',
    text: 'text-[#805600]',
    icon: 'warning',
    label: 'WARNING',
  },
  CRITICAL: {
    bg: 'bg-[#ffdad6]',
    text: 'text-[#ba1a1a]',
    icon: 'report',
    label: 'CRITICAL',
  },
  'NO DATA': {
    bg: 'bg-[#e0e3e2]',
    text: 'text-[#45474d]',
    icon: 'pending',
    label: 'NO DATA',
  },
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inferenceState, setInferenceState] = useState({
    loading: false,
    result: null,
    error: null,
    status: null,
    lastRunAt: null,
  });
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const loadDashboard = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const [summaryPayload, telemetryPayload] = await Promise.all([
        fetchJsonWithAuth('/api/dashboard/summary'),
        fetchJsonWithAuth('/api/telemetry/latest?limit=60'),
      ]);

      setSummary(summaryPayload);
      setTelemetry(Array.isArray(telemetryPayload) ? [...telemetryPayload].reverse() : []);
      setLastRefreshedAt(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const timer = window.setInterval(() => loadDashboard({ showLoading: false }), 60000);

    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  const handleRunLatestInference = async () => {
    setInferenceState((previous) => ({ ...previous, loading: true, error: null, status: null }));
    try {
      const result = await fetchJsonWithAuth(
        '/api/predict/anomaly/latest?machine_id=PMA%20Granulator%20%2301',
        { method: 'POST' },
      );
      setInferenceState({ loading: false, result, error: null, status: null, lastRunAt: new Date() });
      await loadDashboard({ showLoading: false });
    } catch (err) {
      setInferenceState((previous) => ({
        ...previous,
        loading: false,
        error: err.message,
        status: err.status || null,
        lastRunAt: new Date(),
      }));
    }
  };

  const telemetryCurrentValues = useMemo(
    () => telemetry.map((row) => toNumber(row.impeller_ampere)).filter((value) => value !== null),
    [telemetry],
  );
  const currentUsesFallback = telemetryCurrentValues.length === 0;
  const currentValues = useMemo(() => {
    const values = telemetryCurrentValues;
    return values.length ? values : FALLBACK_CURRENT;
  }, [telemetryCurrentValues]);

  const baselineValues = useMemo(() => movingAverage(currentValues), [currentValues]);
  const vibrationSensorValues = useMemo(() => {
    return telemetry
      .map((row) => {
        const x = toNumber(row.x_axis_peak_acceleration);
        const z = toNumber(row.z_axis_peak_acceleration);
        if (x === null && z === null) return null;
        return ((x || 0) + (z || 0)) / (x !== null && z !== null ? 2 : 1);
      })
      .filter((value) => value !== null);
  }, [telemetry]);
  const vibrationUsesFallback = vibrationSensorValues.length === 0;
  const vibrationValues = useMemo(
    () => (vibrationSensorValues.length ? vibrationSensorValues : FALLBACK_VIBRATION),
    [vibrationSensorValues],
  );

  const latestReading = summary?.latest_reading || telemetry[telemetry.length - 1] || null;
  const latestPrediction = summary?.latest_prediction || null;
  const threshold = toNumber(summary?.threshold);
  const anomalyScore = toNumber(latestPrediction?.reconstruction_error);
  const status = summary?.status || 'NO DATA';
  const statusConfig = statusStyle[status] || statusStyle['NO DATA'];
  const statusDot =
    status === 'CRITICAL'
      ? 'bg-[#ba1a1a]'
      : status === 'WARNING'
        ? 'bg-[#805600]'
        : status === 'NO DATA'
          ? 'bg-[#75777d]'
          : 'bg-[#00743a]';
  const hasTelemetry = telemetry.length > 0;
  const inferenceRuntimeMessage =
    inferenceState.status === 503
      ? 'ML runtime or artifacts are unavailable. Confirm Docker imports and copied model artifacts before rerunning latest-window inference.'
      : null;

  const currentPoints = createPolylinePoints(currentValues, 1000, 100, 12);
  const baselinePoints = createPolylinePoints(baselineValues, 1000, 100, 12);
  const currentAreaPath = createAreaPath(currentPoints, 100);
  const vibrationPoints = createPolylinePoints(vibrationValues, 400, 100, 16);
  const vibrationAreaPath = createAreaPath(vibrationPoints, 100);
  const currentMax = Math.max(10, Math.ceil(Math.max(...currentValues) * 1.2));
  const currentLabels = [currentMax, currentMax * 0.75, currentMax * 0.5, currentMax * 0.25, 0];
  const gaugeRatio = anomalyScore !== null && threshold ? Math.min(anomalyScore / Math.max(threshold * 1.25, anomalyScore), 1) : 0.08;
  const gaugeOffset = 251.2 - 251.2 * gaugeRatio;
  const latestVibration = vibrationValues[vibrationValues.length - 1];

  const sensorCards = [
    ['thermostat', 'Temp S-01', latestReading?.temperature_c],
    ['speed', 'RPM M-04', latestReading?.impeller_rpm],
    ['electric_bolt', 'Amp A-03', latestReading?.impeller_ampere],
    ['vibration', 'Vib V-02', latestReading?.x_axis_peak_acceleration ?? latestReading?.z_axis_peak_acceleration],
  ];

  return (
    <div className="page-container bg-[#f1f4f3] space-y-8 min-h-screen">
      {error && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg px-4 py-3 text-sm font-bold">
          Backend data unavailable: {error}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-[#051125] mb-2">
              {summary?.machine_id || 'PMA Granulator #01'}
            </h2>
            <p className="text-[#45474d] font-body max-w-lg leading-relaxed">
              System monitoring the wet granulation process with LSTM Autoencoder anomaly detection. The dashboard is predictive monitoring only and does not control the machine.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 z-10">
            <button
              onClick={handleRunLatestInference}
              disabled={inferenceState.loading}
              className="px-6 py-3 bg-gradient-to-br from-[#051125] to-[#1b263b] text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-sm ${inferenceState.loading ? 'animate-spin' : ''}`}>
                {inferenceState.loading ? 'sync' : 'psychology'}
              </span>
              {inferenceState.loading ? 'Running Inference' : 'Run Latest Inference'}
            </button>
            <Link to="/app/pma" className="px-6 py-3 bg-[#e6e9e8] text-[#051125] text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-[#e0e3e2] transition-colors">
              <span className="material-symbols-outlined text-sm">history</span>
              View PMA Data
            </Link>
            <button
              disabled
              title="Manual workflow only in the Form 4 demo"
              className="px-6 py-3 bg-[#e6e9e8] text-[#45474d] text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 cursor-not-allowed opacity-70"
            >
              <span className="material-symbols-outlined text-sm">medical_services</span>
              Log Maintenance Ticket
            </button>
          </div>
          <p className="mt-3 text-[11px] font-medium text-[#45474d]">
            Maintenance tickets are recorded manually in this demo.
          </p>
          <Form4Warning className="mt-4">
            UNFINISHED DEMO SECTION. The maintenance-ticket action is disabled because backend ticket creation is not implemented for Form 4.
          </Form4Warning>
          {inferenceState.error && (
            <div className="mt-4 rounded-lg bg-[#ffdad6] px-4 py-3 text-xs font-bold text-[#ba1a1a]">
              Latest inference failed: {inferenceState.error}
              {inferenceRuntimeMessage && <p className="mt-1 text-[#7c1d18]">{inferenceRuntimeMessage}</p>}
            </div>
          )}
          {inferenceState.result && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 rounded-lg bg-[#f7faf9] border border-[#c5c6cd]/30 p-4 text-xs">
              <div>
                <p className="font-bold uppercase text-[#45474d]">Source</p>
                <p className="font-bold text-[#051125]">{inferenceState.result.source || 'latest window'}</p>
              </div>
              <div>
                <p className="font-bold uppercase text-[#45474d]">Window</p>
                <p className="font-bold text-[#051125]">
                  {formatTime(inferenceState.result.window_start)} - {formatTime(inferenceState.result.window_end)}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase text-[#45474d]">Severity</p>
                <p className="font-bold text-[#051125]">{inferenceState.result.severity}</p>
              </div>
              <div>
                <p className="font-bold uppercase text-[#45474d]">MAE / Threshold</p>
                <p className="font-bold text-[#051125]">
                  {formatNumber(inferenceState.result.reconstruction_error, 3)} / {formatNumber(inferenceState.result.threshold, 3)}
                </p>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-widest text-[#45474d]">
            <span>Last refreshed: {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : 'Not yet'}</span>
            <span>Last inference result: {inferenceState.lastRunAt ? inferenceState.lastRunAt.toLocaleTimeString() : 'Not run this session'}</span>
          </div>
          <div className="absolute top-0 right-0 w-64 h-full opacity-5 pointer-events-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,77.3,-44.7C85.4,-31.3,90.5,-15.7,89.3,-0.7C88.1,14.3,80.7,28.6,71.5,41.2C62.3,53.8,51.3,64.7,38.1,72.4C24.9,80.1,9.4,84.6,-5.6,83.1C-20.6,81.6,-35.1,74.1,-47.3,64.8C-59.5,55.5,-69.4,44.4,-76.1,31.5C-82.8,18.6,-86.3,3.9,-84.4,-10.1C-82.5,-24.1,-75.2,-37.4,-65.4,-48.5C-55.6,-59.6,-43.3,-68.5,-30.2,-75.4C-17.1,-82.3,-3.2,-87.2,11.2,-86.3C25.6,-85.4,44.7,-76.4,44.7,-76.4Z" fill="#051125" transform="translate(140 100)"></path>
            </svg>
          </div>
        </div>

        <div className={`${statusConfig.bg} rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-md group`}>
          <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center animate-pulse">
            <span className={`material-symbols-outlined ${statusConfig.text} text-4xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{statusConfig.icon}</span>
          </div>
          <div>
            <span className={`text-[0.6875rem] font-bold font-label uppercase tracking-widest ${statusConfig.text}`}>Current Machine Status</span>
            <h3 className={`text-5xl font-extrabold font-headline ${statusConfig.text} tracking-tighter mt-1`}>{statusConfig.label}</h3>
          </div>
          <div className="flex items-center gap-2 bg-white/30 px-4 py-1.5 rounded-full">
            <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
            <span className={`text-[10px] font-bold uppercase ${statusConfig.text}`}>{loading ? 'Syncing backend' : `Last sample ${formatTime(latestReading?.timestamp)}`}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-xl p-6 shadow-sm border border-[#c5c6cd]/10">
          {currentUsesFallback && <Form4Warning className="mb-5" />}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-headline font-bold text-[#051125] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#051125]">electric_bolt</span>
                Motor Current vs Rolling Baseline
              </h4>
              <p className="text-xs text-[#45474d] mt-1 font-body">
                {currentUsesFallback ? 'Fallback values shown because backend current telemetry is unavailable' : 'Backend telemetry stream for impeller motor current'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold font-headline uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#1B263B]"></span>
                <span className="text-[#051125]">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-500"></span>
                <span className="text-[#45474d]">Baseline</span>
              </div>
            </div>
          </div>

          <div className="relative h-64 w-full px-2">
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] font-bold font-headline text-[#75777d] pr-2">
              {currentLabels.map((label) => (
                <span key={label}>{label.toFixed(1)}</span>
              ))}
            </div>
            <div className="ml-8 h-full relative">
              <div className="absolute inset-0 flex flex-col justify-between py-0 pointer-events-none">
                <div className="border-t border-[#c5c6cd]/20 w-full h-0"></div>
                <div className="border-t border-[#c5c6cd]/20 w-full h-0"></div>
                <div className="border-t border-[#c5c6cd]/20 w-full h-0"></div>
                <div className="border-t border-[#c5c6cd]/20 w-full h-0"></div>
                <div className="border-b border-[#c5c6cd]/40 w-full h-0"></div>
              </div>
              <div className="absolute top-[15%] w-full border-t border-[#ba1a1a]/60 border-dashed z-10 flex justify-end">
                <span className="text-[8px] font-headline font-bold text-[#ba1a1a] bg-white px-1 -mt-2">
                  Anomaly threshold: {threshold === null ? '-' : threshold.toFixed(3)}
                </span>
              </div>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
                <path d={currentAreaPath} fill="rgba(100, 116, 139, 0.1)"></path>
                <polyline fill="none" points={currentPoints} stroke="#1B263B" strokeWidth="2"></polyline>
                <polyline fill="none" points={baselinePoints} stroke="#64748b" strokeDasharray="4,2" strokeWidth="1.5"></polyline>
              </svg>
              {!hasTelemetry && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#45474d] shadow-sm">
                    No backend telemetry rows yet
                  </span>
                </div>
              )}
              <div className="absolute -bottom-6 inset-x-0 flex justify-between text-[9px] font-bold font-headline text-[#75777d]">
                <span>{formatTime(telemetry[0]?.timestamp)}</span>
                <span>{formatTime(telemetry[Math.floor(telemetry.length / 2)]?.timestamp)}</span>
                <span>{formatTime(telemetry[telemetry.length - 1]?.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <h4 className="font-headline font-bold text-[#051125] flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#1b263b]">psychology</span>
            Anomaly Score (MAE)
          </h4>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle className="text-[#e0e3e2]" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                <circle className={latestPrediction?.is_anomaly ? 'text-[#ba1a1a]' : 'text-[#006d37]'} cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={gaugeOffset} strokeLinecap="round" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold font-headline text-[#051125]">{formatNumber(anomalyScore, 3)}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#45474d]">{latestPrediction?.severity || 'No score'}</span>
              </div>
            </div>
            <p className="text-[10px] text-center text-[#45474d] mt-4 leading-relaxed">
              LSTM Autoencoder score is unsupervised anomaly detection, not a remaining-life prediction. Threshold: {threshold === null ? '-' : threshold.toFixed(3)}
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-[#c5c6cd]/10 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-[#45474d]">Sensor Integrity</span>
            <div className="flex gap-1">
              {sensorCards.map((sensor) => (
                <span key={sensor[1]} className={`w-1 h-3 rounded-full ${toNumber(sensor[2]) === null ? 'bg-[#ba1a1a]' : 'bg-[#006d37]'}`}></span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
          {vibrationUsesFallback && <Form4Warning className="mb-5" />}
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-headline font-bold text-[#051125] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1b263b]">waves</span>
              Vibration Peak Acceleration
            </h4>
            <span className="text-xs font-bold text-[#006d37] bg-[#6bfe9c] px-3 py-1 rounded-full">
              {formatNumber(latestVibration, 2)} g
            </span>
          </div>

          <div className="h-32 w-full flex items-center">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path className="text-[#006d37]/10" d={vibrationAreaPath} fill="currentColor"></path>
              <polyline className="text-[#006d37]" points={vibrationPoints} fill="none" stroke="currentColor" strokeWidth="2"></polyline>
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-[#45474d] font-bold uppercase tracking-wider mt-2">
            <span>-60 min</span>
            <span>-30 min</span>
            <span>Now</span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm">
          <h4 className="font-headline font-bold text-[#051125] flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#1b263b]">settings_remote</span>
            Sensor Health Status
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {sensorCards.map(([icon, label, value]) => (
              <div key={label} className="p-4 rounded-lg bg-[#f1f4f3] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1b263b] text-lg">{icon}</span>
                  <span className="text-xs font-bold text-[#051125]">{label}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${toNumber(value) === null ? 'bg-[#ba1a1a] animate-pulse' : 'bg-[#006d37]'}`}></span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
