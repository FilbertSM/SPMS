import React, { useEffect, useMemo, useState } from 'react';
import Form4Warning from '../components/Form4Warning';
import { fetchJsonWithAuth } from '../utils/api';

const formatNumber = (value, decimals = 3) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(decimals) : '-';
};

const ArtifactStatus = ({ name, ready }) => (
  <div className="flex items-center justify-between rounded-lg bg-[#f1f4f3] px-4 py-3 border border-[#c5c6cd]/20">
    <div className="flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full ${ready ? 'bg-[#006d37]' : 'bg-[#ba1a1a]'}`}></span>
      <span className="text-sm font-bold text-[#1b263b] capitalize">{name.replaceAll('_', ' ')}</span>
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${ready ? 'text-[#006d37]' : 'text-[#ba1a1a]'}`}>
      {ready ? 'Ready' : 'Missing'}
    </span>
  </div>
);

export default function Settings() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadSummary = async () => {
      try {
        setLoading(true);
        const payload = await fetchJsonWithAuth('/api/dashboard/summary');
        if (!ignore) {
          setSummary(payload);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      ignore = true;
    };
  }, []);

  const artifacts = useMemo(
    () => Object.entries(summary?.artifact_status || {}).filter(([, value]) => typeof value === 'boolean'),
    [summary],
  );
  const modelPath = summary?.artifact_status?.model_path;

  return (
    <div className="page-container">
      <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#45474d] block mb-2 font-label">
            Monitoring Configuration
          </span>
          <h1 className="heading-primary">System Settings & Configuration</h1>
          <p className="text-subtitle mt-2 max-w-3xl">
            SPMS is predictive monitoring only. The frontend reports anomaly detection output and does not control, stop, or override the PMA Granulator machine.
          </p>
        </div>
        <button
          disabled
          title="Settings persistence is not implemented in this demo"
          className="px-6 py-2.5 rounded-md text-sm font-bold text-white bg-[#1b263b]/60 cursor-not-allowed shadow font-label uppercase tracking-widest"
        >
          Save Global Config
        </button>
      </div>

      <Form4Warning>
        Settings controls are read-only or disabled for Form 4. Editable admin configuration is not implemented in the backend yet.
      </Form4Warning>

      {error && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg px-4 py-3 text-sm font-bold">
          Settings data unavailable: {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <section className="panel-card col-span-12 lg:col-span-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">
              psychology
            </span>
            <div>
              <h3 className="heading-secondary">Model Threshold</h3>
              <p className="text-subtitle font-medium">
                Read-only value loaded from the active LSTM Autoencoder metadata.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#f1f4f3] p-5 border border-[#c5c6cd]/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Threshold</p>
              <p className="text-3xl font-black text-[#051125] mt-2">{loading ? '...' : formatNumber(summary?.threshold)}</p>
            </div>
            <div className="rounded-xl bg-[#f1f4f3] p-5 border border-[#c5c6cd]/20 md:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Threshold Policy</p>
              <p className="text-sm font-bold text-[#051125] mt-2">
                {loading ? 'Loading...' : summary?.threshold_policy || 'No policy returned'}
              </p>
            </div>
            <div className="rounded-xl bg-[#f1f4f3] p-5 border border-[#c5c6cd]/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Valid Windows</p>
              <p className="text-2xl font-black text-[#051125] mt-2">{summary?.valid_window_count ?? '-'}</p>
            </div>
            <div className="rounded-xl bg-[#f1f4f3] p-5 border border-[#c5c6cd]/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Skipped Windows</p>
              <p className="text-2xl font-black text-[#051125] mt-2">{summary?.skipped_window_count ?? '-'}</p>
            </div>
            <div className="rounded-xl bg-[#f1f4f3] p-5 border border-[#c5c6cd]/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Current Status</p>
              <p className="text-2xl font-black text-[#051125] mt-2">{summary?.status || '-'}</p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-[#c5c6cd]/30 bg-white p-4">
            <Form4Warning className="mb-4">
              Threshold editing is a future admin workflow and is intentionally disabled.
            </Form4Warning>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#45474d]">lock</span>
              <div>
                <p className="text-sm font-bold text-[#1b263b]">Future admin configuration</p>
                <p className="text-xs text-[#45474d] mt-1">
                  Threshold editing is intentionally disabled until the backend exposes audited settings updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel-card col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div>
            <h3 className="heading-secondary mb-2">Artifact Readiness</h3>
            <p className="text-subtitle leading-relaxed">
              Backend readiness for the model, scaler, threshold, and metadata artifacts used by latest-window inference.
            </p>
          </div>
          <div className="space-y-3">
            {loading && <div className="text-sm font-bold text-[#45474d]">Loading artifact status...</div>}
            {!loading && artifacts.length === 0 && (
              <div className="text-sm font-bold text-[#45474d]">No artifact status returned.</div>
            )}
            {artifacts.map(([name, ready]) => (
              <ArtifactStatus key={name} name={name} ready={Boolean(ready)} />
            ))}
            {modelPath && (
              <div className="rounded-lg bg-[#f1f4f3] px-4 py-3 border border-[#c5c6cd]/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Model Path</p>
                <p className="mt-1 break-all text-xs font-bold text-[#1b263b]">{modelPath}</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel-card col-span-12 lg:col-span-5">
          <Form4Warning className="mb-6">
            Notification rules below are future controls and do not persist to the backend.
          </Form4Warning>
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">
              mail
            </span>
            <div>
              <h3 className="heading-secondary">Notification Rules</h3>
              <p className="text-subtitle">Future admin config. Backend persistence is not implemented.</p>
            </div>
          </div>
          
          <div className="space-y-5">
            {['Critical anomaly alerts', 'Warning anomaly notifications', 'Sensor offline event', 'Weekly monitoring summary'].map((label) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[#c5c6cd]/10 last:border-b-0">
                <div>
                  <p className="text-[13px] font-bold text-[#1b263b]">{label}</p>
                  <p className="text-[11px] text-[#45474d]">Manual workflow in current demo</p>
                </div>
                <button
                  type="button"
                  disabled
                  title="Notification settings are not implemented in this demo"
                  className="w-11 h-6 bg-[#e0e3e2] rounded-full cursor-not-allowed relative opacity-70"
                >
                  <span className="absolute top-1 left-1 bg-white rounded-full h-4 w-4"></span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card col-span-12 lg:col-span-7">
          <Form4Warning className="mb-6">
            User administration is not wired to a backend user-list or role-management workflow.
          </Form4Warning>
          <div className="flex items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">
                group
              </span>
              <div>
                <h3 className="heading-secondary">User Access Management</h3>
                <p className="text-subtitle">The current frontend can read the signed-in profile only.</p>
              </div>
            </div>
            <button
              disabled
              title="User administration is not implemented in this demo"
              className="text-[11px] font-bold uppercase tracking-widest text-[#1b263b]/50 flex items-center gap-1 font-label cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add Personnel
            </button>
          </div>

          <div className="rounded-lg bg-[#f1f4f3] border border-[#c5c6cd]/20 p-6">
            <p className="text-sm font-bold text-[#1b263b]">No user list API is wired to this screen.</p>
            <p className="text-xs text-[#45474d] mt-2">
              Role-based access is enforced by the backend. A managed personnel table should be added only after the backend exposes audited user administration endpoints.
            </p>
          </div>
        </section>

        <section className="panel-card col-span-12 flex flex-col md:flex-row gap-6 md:items-center md:justify-between border-l-4 border-l-[#1b263b]">
          <Form4Warning className="md:max-w-md">
            Security and retention controls are display-only until audited settings endpoints exist.
          </Form4Warning>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#1b263b]">security</span>
            <div>
              <h3 className="text-lg font-bold text-[#1b263b] font-headline">Security & Retention</h3>
              <p className="text-xs text-[#45474d]">Future audited configuration. Current controls are display-only.</p>
            </div>
          </div>
          
          <button
            disabled
            title="Key rotation is not implemented in this demo"
            className="px-5 py-2.5 bg-white text-[#1b263b]/50 text-[11px] font-bold uppercase tracking-widest border border-[#c5c6cd]/40 flex items-center gap-2 font-label rounded-md cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">key</span> Rotate Cryptographic Keys
          </button>
        </section>
      </div>
    </div>
  );
}
