const Dashboard = () => {
  return (
    <div className="page-container bg-[#f1f4f3]">
      {/* Header Section: Status and Identity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel-card lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="heading-primary mb-2">PMA Granulator #01</h2>
            <p className="text-subtitle max-w-lg leading-relaxed">
              System monitoring the wet granulation process. Real-time predictive maintenance enabled via LSTM neural network models.
            </p>
          </div>
          <div className="mt-8 flex gap-4 z-10">
            <button className="btn-primary w-auto py-3 px-6 mt-0 bg-gradient-to-br from-[#051125] to-[#1b263b]">
              <span className="material-symbols-outlined text-sm">history</span>
              View Historical Data
            </button>
            <button className="btn-secondary py-3 px-6 bg-[#e6e9e8]">
              <span className="material-symbols-outlined text-sm">medical_services</span>
              Log Maintenance Ticket
            </button>
          </div>
          {/* Decorative SVG */}
          <div className="absolute top-0 right-0 w-64 h-full opacity-5 pointer-events-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,77.3,-44.7C85.4,-31.3,90.5,-15.7,89.3,-0.7C88.1,14.3,80.7,28.6,71.5,41.2C62.3,53.8,51.3,64.7,38.1,72.4C24.9,80.1,9.4,84.6,-5.6,83.1C-20.6,81.6,-35.1,74.1,-47.3,64.8C-59.5,55.5,-69.4,44.4,-76.1,31.5C-82.8,18.6,-86.3,3.9,-84.4,-10.1C-82.5,-24.1,-75.2,-37.4,-65.4,-48.5C-55.6,-59.6,-43.3,-68.5,-30.2,-75.4C-17.1,-82.3,-3.2,-87.2,11.2,-86.3C25.6,-85.4,44.7,-76.4,44.7,-76.4Z" fill="#051125" transform="translate(140 100)"></path>
            </svg>
          </div>
        </div>

        {/* Status Box */}
        <div className="panel-card bg-[#6bfe9c] border-none flex flex-col items-center justify-center text-center space-y-4 shadow-md">
          <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-[#00743a] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div>
            <span className="text-[0.6875rem] font-bold font-label uppercase tracking-widest text-[#00743a]/70">Current Machine Status</span>
            <h3 className="text-5xl font-extrabold font-headline text-[#00743a] tracking-tighter mt-1">HEALTHY</h3>
          </div>
          <div className="flex items-center gap-2 bg-[#00743a]/10 px-4 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-[#00743a] rounded-full"></span>
            <span className="text-[10px] font-bold uppercase text-[#00743a]">98.4% Efficiency</span>
          </div>
        </div>
      </section>

      {/* Telemetry & Insights Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="panel-card lg:col-span-8 p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="heading-secondary text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[#051125]">electric_bolt</span>
                Motor Current vs LSTM Prediction
              </h4>
              <p className="text-subtitle text-xs mt-1">Predictive analysis of motor load behavior</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold font-headline uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#1B263B]"></span>
                <span className="text-[#051125]">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-500"></span>
                <span className="text-[#45474d]">Expected</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-64 w-full px-2">
            {/* Chart SVG Area */}
            <div className="ml-8 h-full relative">
              <div className="absolute top-[15%] w-full border-t border-[#ba1a1a]/60 border-dashed z-10 flex justify-end">
                <span className="text-[8px] font-headline font-bold text-[#ba1a1a] bg-[#ffffff] px-1 -mt-2">Threshold: 8.5A</span>
              </div>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
                <path d="M 0,40 L 50,42 L 100,38 L 150,45 L 200,41 L 250,55 L 300,65 L 350,58 L 400,62 L 450,55 L 500,60 L 550,52 L 600,68 L 650,59 L 700,63 L 750,55 L 800,67 L 850,58 L 900,62 L 950,56 L 1000,60 L 1000,70 L 950,68 L 900,75 L 850,65 L 800,78 L 750,68 L 700,72 L 650,70 L 600,82 L 550,65 L 500,75 L 450,68 L 400,74 L 350,70 L 300,80 L 250,70 L 200,55 L 150,58 L 100,52 L 50,55 L 0,53 Z" fill="rgba(100, 116, 139, 0.1)"></path>
                <polyline fill="none" points="0,40 50,42 100,38 150,45 200,41 250,55 300,65 350,58 400,62 450,55 500,60 550,52 600,68 650,59 700,63 750,55 800,67 850,58 900,62 950,56 1000,60" stroke="#1B263B" strokeWidth="2"></polyline>
                <polyline fill="none" points="0,53 50,55 100,52 150,58 200,55 250,70 300,80 350,70 400,74 450,68 500,75 550,65 600,82 650,70 700,72 750,68 800,78 850,65 900,75 950,68 1000,70" stroke="#64748b" strokeDasharray="4,2" strokeWidth="1.5"></polyline>
              </svg>
            </div>
          </div>
        </div>

        {/* Anomaly Score Gauge */}
        <div className="panel-card lg:col-span-4 p-6 flex flex-col">
          <h4 className="heading-secondary text-lg flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#1b263b]">psychology</span>
            Anomaly Score (MSE)
          </h4>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle className="text-[#e0e3e2]" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-[#006d37]" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="240" strokeLinecap="round" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold font-headline text-[#051125]">0.042</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#45474d]">Nominal</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;