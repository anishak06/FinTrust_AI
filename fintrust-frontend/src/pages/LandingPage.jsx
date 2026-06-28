import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ShieldCheck, TrendingUp, Users, ArrowRight, Award, Zap, Layers, HelpCircle, Activity, Globe, Check, Lock, ChevronRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PremiumBackground from '../components/PremiumBackground';
import NetworkGlobe from '../components/NetworkGlobe';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [telemetryLogs, setTelemetryLogs] = useState([
    "[Node MUMBAI] verified Arjun Sharma alternative credit ledger (+32 pts)",
    "[Node FRANKFURT] gas utility bill statement parsed & verified ... OK",
    "[Node SINGAPORE] computing monthly savings ratio ... 28% Excellent",
    "[Node LONDON] synchronized transaction block 849193"
  ]);

  useEffect(() => {
    const nodeNames = ["MUMBAI", "LONDON", "SINGAPORE", "FRANKFURT", "TOKYO", "NEW YORK", "SYDNEY"];
    const events = [
      "utility bill parsed & verified",
      "UPI transaction consistency checked",
      "explainable insights model synced",
      "alternative asset ledger updated",
      "synchronized block",
      "computed monthly savings ratio",
      "alternative score generated",
      "explainable telemetry payload sent"
    ];
    
    const interval = setInterval(() => {
      const randomNode = nodeNames[Math.floor(Math.random() * nodeNames.length)];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      let value = "";
      if (randomEvent.includes("ratio")) value = " ... " + (20 + Math.floor(Math.random() * 25)) + "%";
      if (randomEvent.includes("score")) value = " ... Score: " + (580 + Math.floor(Math.random() * 240));
      if (randomEvent.includes("block")) value = " " + (849000 + Math.floor(Math.random() * 1000));
      if (randomEvent.includes("checked") || randomEvent.includes("verified")) value = " ... OK";

      const newLog = `[Node ${randomNode}] ${randomEvent}${value}`;
      setTelemetryLogs(prev => [newLog, ...prev.slice(0, 3)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleEligibility = () => {
    if (isAuthenticated) {
      navigate('/check-eligibility');
    } else {
      navigate('/login?redirect=check-eligibility');
    }
  };

  // Scroll animations variants
  const fadeInVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#010308] text-white selection:bg-[#59CFFF] selection:text-[#010308]">
      {/* Background Mesh, Grid, Particles */}
      <PremiumBackground />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#010308]/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#59CFFF] to-[#102C57] border border-white/10">
              <Cpu className="h-5 w-5 text-[#59CFFF]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              FinTrust<span className="text-[#59CFFF] font-light">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/60 font-medium">
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
            </nav>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-[#1e90ff]" />}
              </button>
              {isAuthenticated ? (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-outline-premium px-4.5 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="px-4 py-1.5 text-xs text-white/70 hover:text-white font-medium transition-all"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => navigate('/signup')} 
                    className="btn-glow-sky px-4.5 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-28 md:pt-24 lg:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                theme === 'light' 
                  ? 'bg-[#102C57]/10 border-[#102C57]/15 text-[#102C57]' 
                  : 'bg-white/5 border border-white/10 text-[#59CFFF]'
              }`}
            >
              <Zap className="h-3.5 w-3.5" /> Next-Gen Credit Inclusions
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] font-sans"
            >
              Transforming Financial Behaviour Into <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
                theme === 'light' 
                  ? 'from-[#102C57] via-[#163D78] to-[#1e52a0]' 
                  : 'from-[#59CFFF] via-[#92E0FF] to-[#F5E6D3]'
              }`}>Credit Opportunities</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="max-w-2xl text-base md:text-lg text-white/60 font-light leading-relaxed"
            >
              Evaluating individuals using alternative indicators like savings ratios, utility consistency, and UPI patterns rather than legacy bank records. Fully explainable scoring powered by Gemini insights.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <button 
                onClick={handleStart}
                className="btn-glow-sky px-8 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={handleEligibility}
                className="btn-outline-premium px-8 py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white"
              >
                Check Eligibility
              </button>
            </motion.div>

            {/* Bullet Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/5"
            >
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Check className="h-4 w-4 text-[#59CFFF] shrink-0" />
                <span>AI Powered</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Lock className="h-4 w-4 text-[#59CFFF] shrink-0" />
                <span>Secure Storage</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Layers className="h-4 w-4 text-[#59CFFF] shrink-0" />
                <span>Explainable Scores</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Globe className="h-4 w-4 text-[#59CFFF] shrink-0" />
                <span>Financial Inclusion</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Right Content: 3D Rotating Canvas Globe + Telemetry HUD */}
          <div className="lg:col-span-5 flex flex-col justify-center items-center relative space-y-6 min-h-[460px] w-full">
            {/* Soft Glowing Gradient behind */}
            <div className="absolute top-[20%] w-72 h-72 rounded-full bg-gradient-to-tr from-[#59CFFF] to-[#102C57] opacity-25 blur-[90px] pointer-events-none" />

            <div className="w-full max-w-[460px] relative flex justify-center items-center h-[340px]">
              {/* Slowly rotating network globe behind the card */}
              <div className="absolute z-0 opacity-60 scale-95 pointer-events-none">
                <NetworkGlobe size={380} />
              </div>

              {/* Floating 3D Credit Card on top */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotateX: 15, rotateY: -15 }}
                animate={{ 
                  opacity: 1, 
                  y: [0, -12, 0],
                  rotateX: [12, 8, 12],
                  rotateY: [-15, -8, -15]
                }}
                transition={{ 
                  opacity: { duration: 1, delay: 0.2 },
                  y: { repeat: Infinity, duration: 5.5, ease: "easeInOut" },
                  rotateX: { repeat: Infinity, duration: 5.5, ease: "easeInOut" },
                  rotateY: { repeat: Infinity, duration: 5.5, ease: "easeInOut" }
                }}
                whileHover={{ scale: 1.05, rotateX: 0, rotateY: 0 }}
                style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                className={`relative z-10 w-72 h-44 rounded-2xl p-5 overflow-hidden border ${
                  theme === 'light' 
                    ? 'border-[#102C57]/15 shadow-[0_25px_60px_rgba(16,44,87,0.35)]' 
                    : 'border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.75)]'
                } flex flex-col justify-between cursor-pointer transition-shadow duration-300`}
              >
                {/* Card Background Gradient & Blur */}
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  theme === 'light' 
                    ? 'from-[#102C57] via-[#0A234A] to-[#1F4E8D]' 
                    : 'from-white/10 via-[#030E21]/90 to-white/[0.02]'
                } backdrop-blur-xl z-0`} />
                {/* Glowing edge highlight */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#59CFFF]/60 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-[#59CFFF]/20 to-transparent" />

                {/* Card Header */}
                <div className="flex justify-between items-start z-10 relative">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-4.5 w-4.5 text-[#59CFFF] animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-white/80 keep-white font-mono">FINTRUST AI</span>
                  </div>
                  <span className="text-[8px] font-bold text-white/40 keep-white tracking-wider uppercase font-mono">Alternative Ledger</span>
                </div>

                {/* Chip & Wi-Fi */}
                <div className="flex items-center gap-3 z-10 relative my-1">
                  <div className="w-8 h-6 rounded-md bg-gradient-to-r from-[#F5E6D3] via-[#BBA68D] to-[#E1D0BC] opacity-80 border border-black/10 flex items-center justify-center overflow-hidden">
                    {/* Chip lines */}
                    <div className="grid grid-cols-3 grid-rows-3 gap-[1px] w-full h-full p-1 opacity-45">
                      <div className="border border-black/40"></div>
                      <div className="border border-black/40"></div>
                      <div className="border border-black/40"></div>
                      <div className="border border-black/40"></div>
                      <div className="border border-black/40"></div>
                      <div className="border border-black/40"></div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-white/30 keep-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12a10 10 0 0 1 14 0" />
                    <path d="M8 15a6 6 0 0 1 8 0" />
                    <path d="M11 18a2 2 0 0 1 2 0" />
                  </svg>
                </div>

                {/* Card Number & Details */}
                <div className="space-y-2 z-10 relative">
                  <div className="text-sm tracking-[0.25em] font-mono text-white keep-white font-semibold">
                    •••• •••• •••• 8492
                  </div>
                  <div className="flex justify-between items-end text-[8px] uppercase tracking-wider font-mono text-white/50 keep-white">
                    <div className="text-left">
                      <div className="text-[6px] text-white/30 keep-white">Cardholder</div>
                      <div className="font-bold text-white/70 keep-white">Arjun Sharma</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[6px] text-white/30 keep-white">Trust Score</div>
                      <div className="font-bold text-emerald-400 text-xs">785 / 900</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Globe Telemetry HUD Panel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="w-full max-w-[420px] glass-card p-5 rounded-xl text-left border border-white/5 bg-white/[0.01] relative overflow-hidden"
            >
              {/* LED Status Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold text-[#59CFFF] tracking-wider font-mono">Ledger Node Telemetry</span>
                </div>
                <span className="text-[9px] text-white/35 font-mono">Decentralized Mesh Connected</span>
              </div>

              {/* Grid Statistics */}
              <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-3 mb-3 text-center">
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                  <div className="text-[8px] uppercase text-white/40 font-mono">Active Nodes</div>
                  <div className="text-xs font-extrabold text-white font-mono mt-0.5">7 Online</div>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                  <div className="text-[8px] uppercase text-white/40 font-mono">Scoring Speed</div>
                  <div className="text-xs font-extrabold text-white font-mono mt-0.5">1.2s avg</div>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                  <div className="text-[8px] uppercase text-white/40 font-mono">Trust Index</div>
                  <div className="text-xs font-extrabold text-emerald-400 font-mono mt-0.5">99.86%</div>
                </div>
              </div>

              {/* Mini Terminal Logger Log Stream */}
              <div className="h-24 overflow-hidden font-mono text-[9px] text-white/50 leading-relaxed space-y-1.5 no-scrollbar relative select-none">
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#010308] to-transparent pointer-events-none" />
                <AnimatePresence mode="popLayout">
                  {telemetryLogs.map((log, idx) => {
                    const isNewest = idx === 0;
                    return (
                      <motion.div 
                        key={log + idx}
                        initial={isNewest ? { opacity: 0, x: -10 } : { opacity: 1 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-center gap-1.5 ${isNewest ? 'text-[#59CFFF] font-semibold' : ''}`}
                      >
                        <span className="text-white/25">&gt;</span>
                        <span className="truncate">{log}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariant}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="text-xs font-bold text-[#59CFFF] uppercase tracking-widest">Workflow</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">How FinTrust AI Works</h2>
            <div className="h-1 w-12 bg-[#59CFFF] mx-auto rounded-full" />
            <p className="text-white/60 text-sm">Follow a simple, explainable sequence to verify your digital creditworthiness.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="glass-card p-6.5 rounded-xl text-left space-y-4">
              <div className="h-9 w-9 rounded-lg bg-[#59CFFF]/10 text-[#59CFFF] border border-[#59CFFF]/25 flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-sm font-bold text-white">Declare Telemetry</h3>
              <p className="text-white/50 text-xs leading-normal">Submit baseline monthly savings buffers, employment details, and reported transaction frequencies securely.</p>
            </div>
            
            {/* Step 2 */}
            <div className="glass-card p-6.5 rounded-xl text-left space-y-4">
              <div className="h-9 w-9 rounded-lg bg-[#59CFFF]/10 text-[#59CFFF] border border-[#59CFFF]/25 flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="text-sm font-bold text-white">Upload Documents</h3>
              <p className="text-white/50 text-xs leading-normal">Upload PDF/image utility bills. The engine extracts merchant data, payment dates, and computes payment consistency.</p>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-6.5 rounded-xl text-left space-y-4">
              <div className="h-9 w-9 rounded-lg bg-[#59CFFF]/10 text-[#59CFFF] border border-[#59CFFF]/25 flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-sm font-bold text-white">Deterministic Scoring</h3>
              <p className="text-white/50 text-xs leading-normal">A weighted mathematical engine processes factors instantly in Java, bypassing arbitrary LLM score calculations.</p>
            </div>

            {/* Step 4 */}
            <div className="glass-card p-6.5 rounded-xl text-left space-y-4">
              <div className="h-9 w-9 rounded-lg bg-[#59CFFF]/10 text-[#59CFFF] border border-[#59CFFF]/25 flex items-center justify-center font-bold text-sm">4</div>
              <h3 className="text-sm font-bold text-white">Unlock Insights</h3>
              <p className="text-white/50 text-xs leading-normal">Analyze your circular score gauge, review suggestions generated by Gemini, and check loan eligibility reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features & Benefits Section */}
      <section id="features" className="relative z-10 py-24 border-t border-white/5 bg-[#102C57]/20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariant}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="text-xs font-bold text-[#59CFFF] uppercase tracking-widest">Platform Strengths</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Features & Core Benefits</h2>
            <div className="h-1 w-12 bg-[#59CFFF] mx-auto rounded-full" />
            <p className="text-white/60 text-sm">Secure alternative credit scoring built with clean architecture.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feat 1 */}
            <div className="glass-card p-6 text-left space-y-3.5">
              <div className="h-10 w-10 rounded-lg bg-[#59CFFF]/10 flex items-center justify-center text-[#59CFFF] border border-[#59CFFF]/15">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Explainable Underwriting</h3>
              <p className="text-white/50 text-xs leading-relaxed">Direct line-item point assignments based on clear financial metrics, assuring total audit transparency.</p>
            </div>

            {/* Feat 2 */}
            <div className="glass-card p-6 text-left space-y-3.5">
              <div className="h-10 w-10 rounded-lg bg-[#59CFFF]/10 flex items-center justify-center text-[#59CFFF] border border-[#59CFFF]/15">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Goals Savings Tracker</h3>
              <p className="text-white/50 text-xs leading-relaxed">Declare savings goals (Emergency funds, hardware purchases) and calculate required monthly deposits.</p>
            </div>

            {/* Feat 3 */}
            <div className="glass-card p-6 text-left space-y-3.5">
              <div className="h-10 w-10 rounded-lg bg-[#59CFFF]/10 flex items-center justify-center text-[#59CFFF] border border-[#59CFFF]/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">JWT Secure Auth</h3>
              <p className="text-white/50 text-xs leading-relaxed">Uses encrypted stateless JSON Web Tokens, safeguarding transaction records and email logs.</p>
            </div>

            {/* Feat 4 */}
            <div className="glass-card p-6 text-left space-y-3.5">
              <div className="h-10 w-10 rounded-lg bg-[#59CFFF]/10 flex items-center justify-center text-[#59CFFF] border border-[#59CFFF]/15">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Eligibility Forecasting</h3>
              <p className="text-white/50 text-xs leading-relaxed">Instantly checks credit tier, suggesting maximum loan capacity with clear risk classifications.</p>
            </div>

            {/* Feat 5 */}
            <div className="glass-card p-6 text-left space-y-3.5">
              <div className="h-10 w-10 rounded-lg bg-[#59CFFF]/10 flex items-center justify-center text-[#59CFFF] border border-[#59CFFF]/15">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Non-PII Gemini Insights</h3>
              <p className="text-white/50 text-xs leading-relaxed">Generates financial coaching tips by sharing strictly numerical data, removing PII leakage risks.</p>
            </div>

            {/* Feat 6 */}
            <div className="glass-card p-6 text-left space-y-3.5">
              <div className="h-10 w-10 rounded-lg bg-[#59CFFF]/10 flex items-center justify-center text-[#59CFFF] border border-[#59CFFF]/15">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Secure Audit Logs</h3>
              <p className="text-white/50 text-xs leading-relaxed">Every credit assessment, file upload, or login creates immutable logs inside the database for compliance.</p>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-white/5 py-14 bg-[#030E21]/50 relative z-10 text-sm text-white/40">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
              <Cpu className="h-4 w-4 text-[#59CFFF]" />
            </div>
            <span className="font-bold text-white text-base">FinTrust AI</span>
          </div>
          <span>&copy; {new Date().getFullYear()} FinTrust AI. All rights reserved. Built for credit visibility.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
