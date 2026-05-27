import { useEffect, useMemo, useState } from 'react';
import { fetchJsonWithAuth } from '../utils/api';

const statusLabel = (value) => (value ? 'Ready' : 'Missing');
const statusColor = (value) => (value ? 'text-[#006d37]' : 'text-[#ba1a1a]');

const CheckCard = ({ label, value, detail, icon }) => (
  <div className="rounded-lg border border-[#c5c6cd]/30 bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <span className={`material-symbols-outlined mt-0.5 ${statusColor(value)}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">{label}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${value ? 'bg-[#e8f5e9] text-[#00743a]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
            {value ? 'Ready' : 'Issue'}
          </span>
        </div>
        {detail && <p className="text-xs font-medium text-[#45474d] mt-3 leading-relaxed">{detail}</p>}
      </div>
    </div>
  </div>
);

const SystemStatus = () => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadStatus = async () => {
      try {
        setLoading(true);
        const payload = await fetchJsonWithAuth('/api/system/status');
        if (!ignore) {
          setStatus(payload);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadStatus();
    return () => {
      ignore = true;
    };
  }, []);

  const artifactEntries = useMemo(
    () => Object.entries(status?.ml_artifacts || {}).filter(([, value]) => typeof value === 'boolean'),
    [status],
  );

  return (
    <div className="page-container">
      <div className="space-y-6">
        <div>
          <h1 className="heading-primary text-3xl">System Status</h1>
          <p className="text-subtitle mt-2 max-w-2xl">
            Backend evidence for database, telemetry, audit chain, threshold, and ML runtime readiness.
          </p>
        </div>

        {error && (
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg px-4 py-3 text-sm font-bold">
            Backend status unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <CheckCard
            label="Database"
            value={Boolean(status?.database?.connected)}
            detail={loading ? 'Checking database connection...' : status?.database?.detail}
            icon="database"
          />
          <CheckCard
            label="Telemetry Source"
            value={Boolean(status?.telemetry_source?.available)}
            detail={loading ? 'Checking telemetry source...' : status?.telemetry_source?.detail}
            icon="sensors"
          />
          <CheckCard
            label="Audit Chain"
            value={status?.audit_chain?.overall_status === 'VERIFIED'}
            detail={status?.audit_chain ? `${status.audit_chain.valid_count}/${status.audit_chain.total_logs_checked} logs verified` : 'Checking audit hash chain...'}
            icon="verified_user"
          />
          <CheckCard
            label="Threshold"
            value={Boolean(status?.threshold?.threshold)}
            detail={status?.threshold ? `${status.threshold.threshold_source}: ${status.threshold.threshold.toFixed(3)}` : 'Checking threshold state...'}
            icon="tune"
          />
        </div>

        <section className="panel-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <h2 className="heading-secondary text-xl">ML Runtime Readiness</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">{artifactEntries.length} artifact checks</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {artifactEntries.length === 0 && (
              <p className="text-sm font-bold text-[#45474d]">No boolean artifact readiness keys returned yet.</p>
            )}
            {artifactEntries.map(([key, ready]) => (
              <div key={key} className="rounded-lg bg-[#f1f4f3] border border-[#c5c6cd]/20 px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-sm font-bold capitalize text-[#1b263b]">{key.replaceAll('_', ' ')}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor(ready)}`}>
                  {statusLabel(ready)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card">
          <h2 className="heading-secondary text-xl mb-4">Runtime Evidence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-[#f1f4f3] p-4 border border-[#c5c6cd]/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Effective Threshold</p>
              <p className="text-xl font-black text-[#051125] mt-2">{status?.threshold?.threshold?.toFixed(3) || '-'}</p>
            </div>
            <div className="rounded-lg bg-[#f1f4f3] p-4 border border-[#c5c6cd]/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Artifact Threshold</p>
              <p className="text-xl font-black text-[#051125] mt-2">{status?.threshold?.artifact_threshold?.toFixed(3) || '-'}</p>
            </div>
            <div className="rounded-lg bg-[#f1f4f3] p-4 border border-[#c5c6cd]/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Checked At</p>
              <p className="text-sm font-black text-[#051125] mt-2">
                {status?.checked_at ? new Date(status.checked_at).toLocaleString() : 'Not checked yet'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemStatus;
