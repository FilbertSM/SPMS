const FORM4_WARNING_TITLE = 'UNFINISHED DEMO SECTION';
const FORM4_WARNING_TEXT =
  'This visualization may use placeholder/fallback data when backend telemetry is unavailable. Final decision pending team review.';

const Form4Warning = ({ children = null, className = '' }) => (
  <div className={`rounded-lg border-2 border-[#ba1a1a] bg-[#fff4f2] px-4 py-3 text-[#7c1d18] ${className}`}>
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-[20px] mt-0.5">warning</span>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em]">{FORM4_WARNING_TITLE}</p>
        <p className="mt-1 text-sm font-bold leading-relaxed">{FORM4_WARNING_TEXT}</p>
        {children && <p className="mt-1 text-sm font-bold leading-relaxed">{children}</p>}
      </div>
    </div>
  </div>
);

export default Form4Warning;
