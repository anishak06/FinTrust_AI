import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, Cpu, AlertCircle, ArrowLeft, Send, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PremiumBackground from '../components/PremiumBackground';
import NetworkGlobe from '../components/NetworkGlobe';

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const { login, forceLogin, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  
  // Forgot Password modal simulation
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const redirect = searchParams.get('redirect') || 'dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(username, password);

    if (result.success) {
      if (result.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/' + (redirect === 'dashboard' ? 'dashboard' : redirect));
      }
    } else if (result.conflict) {
      setConflictModalOpen(true);
      setError(result.error || 'You are logged in on another device.');
      setLoading(false);
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  const handleForceLogin = async () => {
    setLoading(true);
    setConflictModalOpen(false);
    const result = await forceLogin(username, password);
    if (result.success) {
      if (result.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/' + (redirect === 'dashboard' ? 'dashboard' : redirect));
      }
    } else {
      setError(result.error || 'Failed to terminate existing session.');
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetUsername) {
      setResetError('Please enter your username.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    const result = await forgotPassword(resetUsername);
    setResetLoading(false);

    if (result.success) {
      setResetMessage(result.message);
      setTimeout(() => {
        setForgotModalOpen(false);
        setResetUsername('');
        setResetMessage('');
      }, 5000);
    } else {
      setResetError(result.error || 'Username not found.');
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
            <h2 className="text-xl font-bold text-white">Welcome back</h2>
            <p className="text-white/40 text-xs mt-1">Sign in to manage your alternative credit profile</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-[#D1495B]/10 border border-[#D1495B]/20 text-[#D1495B] text-xs flex items-start gap-2 text-left">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Username / Email</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-white/30" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Password</label>
                <button 
                  type="button" 
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[10px] font-semibold text-[#59CFFF] hover:text-[#7ce0ff] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-lg btn-glow-sky text-xs font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-white/40">
            New to FinTrust AI?{' '}
            <Link to="/signup" className="text-[#59CFFF] font-semibold hover:text-[#7ce0ff] transition-colors">
              Create an Account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030E21]/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-xl p-6 border-white/10">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <h3 className="font-bold text-white text-xs">Recover Password</h3>
              <button 
                onClick={() => setForgotModalOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {resetMessage ? (
              <div className="p-3.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[#34C759] text-xs">
                {resetMessage}
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
                <p className="text-white/50 text-xs leading-normal">
                  Enter your registered username. We will simulate sending a password recovery link to your registered email.
                </p>
                {resetError && <div className="text-[#D1495B] text-xs font-semibold">{resetError}</div>}
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-white/40 tracking-wider">Username</label>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="e.g. sharma_rahul"
                    className="w-full px-3 py-2 rounded glass-input text-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded btn-glow-sky text-xs font-bold flex justify-center items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030E21]/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-xl p-6 border-white/10">
            <div className="flex justify-between items-center border-b border-[#D1495B]/20 pb-3 mb-4">
              <h3 className="font-bold text-[#D1495B] text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Active Session Detected
              </h3>
              <button 
                onClick={() => setConflictModalOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            
            <p className="text-white/70 text-xs leading-relaxed mb-6">
              You are currently logged in on another device. Logging in here will terminate your other session. Do you wish to proceed?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConflictModalOpen(false)}
                className="flex-1 py-2.5 rounded glass-input text-xs font-bold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForceLogin}
                className="flex-1 py-2.5 rounded bg-[#D1495B] hover:bg-[#D1495B]/90 text-white text-xs font-bold transition-colors"
              >
                Confirm Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
