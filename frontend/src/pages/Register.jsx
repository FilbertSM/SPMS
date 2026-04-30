    import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // TODO: Implementasi logika register.
    // Pastikan password di-hash menggunakan SHA-256 sebelum disimpan ke database untuk memenuhi standar keamanan siber.
    
    navigate('/login'); // Arahkan ke login setelah sukses register
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f6] font-body">
      {/* Kanan: Branding & Visual (Dibalik posisinya untuk variasi) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1b263b] relative overflow-hidden items-center justify-center p-12 order-2">
         <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M100,100 C70,60 30,40 0,0 L0,100 Z" fill="#ffffff" />
          </svg>
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="w-16 h-16 bg-[#2ecc71]/20 rounded-xl flex items-center justify-center mb-8 border border-[#2ecc71]/30">
            <span className="material-symbols-outlined text-4xl text-[#2ecc71]">shield_person</span>
          </div>
          <h2 className="text-4xl font-black font-headline mb-4 leading-tight">Strict Access Control</h2>
          <p className="text-[#c5c6cd] text-base leading-relaxed mb-8">
            Registration requires administrator approval. All access logs are immutable and tracked via Role-Based Access Control (RBAC).
          </p>
        </div>
      </div>

      {/* Kiri: Form Register */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 order-1 overflow-y-auto">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#c5c6cd]/20 my-auto">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-[#1b263b] font-headline">Request System Access</h3>
            <p className="text-[#45474d] text-sm mt-2">Submit your details to gain SPMS credentials.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Full Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                placeholder="e.g. Budi Prasetyo"
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Employee ID</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                  placeholder="e.g. 3310"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Role</label>
                <select className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm cursor-pointer appearance-none">
                  <option value="technician">Technician</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Plant Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                placeholder="Create a strong password"
                required
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full py-3 bg-[#1b263b] text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#051125] active:scale-[0.98] transition-all shadow-md font-label"
              >
                Submit Request
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-[#45474d]">
            Already approved? <Link to="/login" className="font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">Sign In Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;