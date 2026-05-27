import { Link } from 'react-router-dom';

const Support = () => (
  <div className="page-container">
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="heading-primary text-3xl">Support</h1>
        <p className="text-subtitle mt-2">
          Route review work through alerts or maintenance tickets.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="panel-card">
          <div className="flex h-full flex-col gap-5">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined rounded-lg bg-[#f1f4f3] p-2 text-[#1b263b]">warning</span>
              <div>
              <h2 className="heading-secondary text-xl">Alert Review</h2>
              <p className="text-sm text-[#45474d] mt-2">
                Acknowledge anomaly events, create linked tickets, and export CSV evidence.
              </p>
              </div>
            </div>
            <Link to="/app/alerts" className="btn-primary mt-auto w-full sm:w-auto inline-flex px-5 py-2.5">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              Open Alerts
            </Link>
          </div>
        </div>

        <div className="panel-card">
          <div className="flex h-full flex-col gap-5">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined rounded-lg bg-[#f1f4f3] p-2 text-[#1b263b]">medical_services</span>
              <div>
              <h2 className="heading-secondary text-xl">Maintenance Tickets</h2>
              <p className="text-sm text-[#45474d] mt-2">
                Track encrypted issue notes, review status, and resolution notes.
              </p>
              </div>
            </div>
            <Link to="/app/maintenance" className="btn-secondary mt-auto w-full sm:w-auto inline-flex justify-center px-5 py-2.5">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              Open Tickets
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#c5c6cd]/30 bg-white px-5 py-4">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined rounded-lg bg-[#f1f4f3] p-2 text-[#1b263b]">info</span>
          <div>
            <h2 className="text-sm font-black text-[#051125]">Scope boundary</h2>
            <p className="text-xs text-[#45474d] mt-1">
              Support actions document human review only. SPMS does not control, stop, override, or interfere with the PMA Granulator.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default Support;
