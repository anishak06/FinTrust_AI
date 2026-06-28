import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, Cpu, AlertCircle, ArrowLeft, ClipboardList, Briefcase, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PremiumBackground from '../components/PremiumBackground';
import NetworkGlobe from '../components/NetworkGlobe';

export default function Signup() {
  const { theme, toggleTheme } = useTheme();
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !username || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await signup(username, password, fullName, role);

    if (result.success) {
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error || 'Registration failed. Username may already be taken.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#010308] text-white selection:bg-[#59CFFF] selection:text-[#010308]">
      {/* Background Animated Meshes & Grid */}
      <PremiumBackground />

      {/* Left side panel (branding/visuals) - hidden on mobile */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-gradient-to-br from-[#020712] to-[#000205] border-r border-white/5 relative overflow-hidden z-10">
        {/* Soft blur light behind */}
        <div className="absolute top-[20%] right-[-20%] w-96 h-96 rounded-full bg-[#102C57] opacity-25 blur-[120px]" />
        
        {/* Header */}
        <div className="flex items-center gap-2.5 cursor-pointer z-10" onClick={() => navigate('/')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#59CFFF] to-[#102C57] border border-white/10">
            <Cpu className="h-5 w-5 text-[#59CFFF]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            FinTrust<span className="text-[#59CFFF] font-light">AI</span>
          </span>
        </div>

        {/* Decorative rotating globe & floating credit card representation */}
        <div className="relative flex justify-center items-center h-72 w-full my-auto z-10">
          <div className="absolute scale-75 opacity-40">
            <NetworkGlobe size={320} />
          </div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="w-56 h-32 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 backdrop-blur-md shadow-2xl p-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <Cpu className="h-4.5 w-4.5 text-[#59CFFF]" />
              <span className="text-[6px] tracking-widest opacity-40">LEDGER SYNC</span>
            </div>
            <div className="text-xs font-mono tracking-widest text-white/80">•••• •••• •••• 8492</div>
            <div className="flex justify-between items-end text-[7px] font-mono text-white/40">
              <span>Arjun Sharma</span>
              <span className="text-emerald-400 font-bold">TRUST INDEX: 99.8%</span>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="space-y-2 z-10">
          <p className="text-xs font-semibold text-white/80">Decentralized Alternative Scoring Mesh</p>
          <p className="text-[10px] text-white/40 leading-normal">
            Join thousands of individuals using alternative data indicators like payment histories and UPI frequency logs to secure transparent credit opportunities.
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 relative z-10">
        {/* Back and Theme Toggle Header */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>

          <button
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-[#1e90ff]" />}
          </button>
        </div>

        {/* Glass Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md glass-card rounded-2xl p-8 border-white/10 relative"
        >
          {/* Logo only on mobile/tablet view */}
          <div className="flex flex-col items-center mb-8">
            <div className="lg:hidden h-10 w-10 rounded-xl bg-gradient-to-br from-[#59CFFF] to-[#102C57] flex items-center justify-center mb-3.5 border border-white/10">
              <Cpu className="h-5 w-5 text-[#59CFFF]" />
            </div>
            <h2 className="text-xl font-bold text-white">Create an account</h2>
            <p className="text-white/40 text-xs mt-1">Begin assessing alternative credit scores today</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-[#D1495B]/10 border border-[#D1495B]/20 text-[#D1495B] text-xs flex items-start gap-2 text-left">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#34C759] text-xs">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Full Name</label>
              <div className="relative">
                <ClipboardList className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-white/30" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-white/30" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sharma_rahul"
                  className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Account Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-white/30" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-xs appearance-none cursor-pointer bg-[#030E21]"
                >
                  <option value="USER">Borrower Profile (Alternative score)</option>
                  <option value="ADMIN">System Administrator (Lending Panel)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-lg btn-glow-sky text-xs font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-white/40">
            Already registered?{' '}
            <Link to="/login" className="text-[#59CFFF] font-semibold hover:text-[#7ce0ff] transition-colors">
              Sign In Here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
