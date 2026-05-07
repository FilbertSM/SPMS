import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    
    // Nanti saat disambung ke backend, kamu tinggal mengirim role "technician" secara hardcode.
    // Contoh: 
    // const userData = {
    //   name: e.target.name.value,
    //   email: e.target.email.value,
    //   password: e.target.password.value,
    //   role: 'technician' // <--- Selalu technician
    // };

    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f6] font-body">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1b263b] relative overflow-hidden items-center justify-center p-8 order-2">
         <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M100,100 C70,60 30,40 0,0 L0,100 Z" fill="#ffffff" />
          </svg>
        </div>
        <div className="relative z-10 text-white max-w-md text-center lg:text-left">
          <div className="w-14 h-14 bg-[#2ecc71]/20 rounded-xl flex items-center justify-center mb-6 border border-[#2ecc71]/30 mx-auto lg:mx-0">
            <span className="material-symbols-outlined text-3xl text-[#2ecc71]">shield_person</span>
          </div>
          <h2 className="text-3xl font-black font-headline mb-4 leading-tight">Strict Access Control</h2>
          <p className="text-[#828da7] text-sm leading-relaxed mb-8">
            Registration requires administrator approval. All access logs are tracked via Role-Based Access Control (RBAC).
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 order-1 overflow-y-auto">
        <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-[#c5c6cd]/20">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1b263b] font-headline">Request System Access</h3>
            <p className="text-[#45474d] text-xs mt-1">Submit your details to gain SPMS credentials.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Full Name</label>
              <input 
                type="text" 
                name="name"
                className="w-full px-3 py-2 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                placeholder="Full name as per ID"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Email Address</label>
              <input 
                type="email" 
                name="email"
                className="w-full px-3 py-2 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                placeholder="work.email@sakafarma.com"
                required
              />
            </div>

            {/* Bagian Role yang dibuat Statis/Default */}
            <div>
              <label className="block text-[10px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">System Role</label>
              <div className="w-full px-3 py-2.5 bg-[#f1f4f3]/50 border border-[#c5c6cd]/30 rounded-lg flex items-center justify-between cursor-not-allowed">
                <span className="text-[#1b263b] text-sm font-medium">Technician</span>
                <span className="text-[10px] font-bold text-[#45474d] uppercase tracking-widest bg-[#e0e3e2] px-2 py-0.5 rounded">Default</span>
              </div>
              <p className="text-[10px] text-[#45474d] mt-1.5">Role upgrades must be requested to an Administrator after approval.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Password</label>
              <input 
                type="password" 
                name="password"
                className="w-full px-3 py-2 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                placeholder="Min. 8 characters"
                required
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full py-3 bg-[#1b263b] text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#051125] active:scale-[0.98] transition-all shadow-md font-label"
              >
                Submit Request
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-[#45474d]">
            Already approved? <Link to="/login" className="font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">Sign In Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;