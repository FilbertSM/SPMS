import Form4Warning from '../components/Form4Warning';

const Support = () => (
  <div className="page-container">
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="heading-primary text-3xl">Support Center</h1>
        <p className="text-subtitle mt-2">
          This Form 4 screen documents the intended support workflow without pretending backend ticketing exists.
        </p>
      </div>

      <Form4Warning>
        UNFINISHED DEMO SECTION. This support workflow is read-only in the frontend. Ticket creation, acknowledgement routing, and support assignment are not implemented in the backend yet.
      </Form4Warning>

      <section className="panel-card">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined rounded-lg bg-[#f1f4f3] p-2 text-[#1b263b]">support_agent</span>
          <div>
            <h2 className="heading-secondary text-xl">Manual escalation for demo</h2>
            <p className="text-sm text-[#45474d] mt-2">
              If an anomaly event appears, the evaluator should review the Alerts page and record the maintenance follow-up manually. The app does not create maintenance tickets.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default Support;
