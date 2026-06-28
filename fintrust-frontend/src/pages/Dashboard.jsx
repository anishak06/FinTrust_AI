import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Cpu, ShieldCheck, DollarSign, LogOut, Plus, Trash2, AlertCircle, ChevronRight, CheckCircle, ArrowRight, Lightbulb, Target, Search, Bell, User, FileText, Calendar, ChevronDown, CreditCard, TrendingUp, Wallet, History, CheckCircle2, Menu, X, Globe, Activity, QrCode, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumBackground from '../components/PremiumBackground';
import NetworkGlobe from '../components/NetworkGlobe';

export default function Dashboard() {
  const { user, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Helper to get current Month (Title case) and Year
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const titleCaseMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1).toLowerCase();
  const currentYearNum = currentDate.getFullYear();

  // Data states
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(titleCaseMonth);
  const [selectedYear, setSelectedYear] = useState(currentYearNum.toString());

  // Tab state & Responsive mobile menu trigger
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Accordion state for loan explanation
  const [loanExplanationOpen, setLoanExplanationOpen] = useState(false);

  // Goal modal/inputs
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalError, setGoalError] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch latest assessment for selected month/year
      const latestRes = await fetch(`http://localhost:8080/api/credit/latest?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const latestData = await latestRes.json();
      
      if (latestRes.ok && latestData.score) {
        setLatestAssessment(latestData);
      } else {
        setLatestAssessment(null);
      }

      // 2. Fetch history
      const historyRes = await fetch('http://localhost:8080/api/credit/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setAssessmentHistory(historyData);
      }

      // 3. Fetch goals
      const goalsRes = await fetch('http://localhost:8080/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData);
      }

    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, selectedMonth, selectedYear]);

  const handleChartClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const clickedPoint = state.activePayload[0].payload;
      if (clickedPoint.month && clickedPoint.year) {
        setSelectedMonth(clickedPoint.month);
        setSelectedYear(clickedPoint.year.toString());
      }
    }
  };

  const historicalChartData = [...assessmentHistory]
    .reverse()
    .map(item => ({
      name: `${item.month ? item.month.substring(0, 3) : ''} ${item.year || ''}`,
      month: item.month,
      year: item.year,
      Income: item.income || 0,
      Expenses: item.expenses || 0,
      Savings: item.savings || 0,
      Score: item.score || 300
    }));

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setGoalError('');
    const targetVal = parseFloat(goalTarget);
    const currentVal = parseFloat(goalCurrent);

    if (!goalName || !goalTarget || !goalCurrent || !goalDate) {
      setGoalError('Please fill in all goal fields.');
      return;
    }
    if (isNaN(targetVal) || targetVal <= 0) {
      setGoalError('Target amount must be a positive number.');
      return;
    }
    if (isNaN(currentVal) || currentVal < 0) {
      setGoalError('Current savings must be a positive number.');
      return;
    }
    if (currentVal > targetVal) {
      setGoalError('Current savings cannot exceed target amount.');
      return;
    }

    setGoalLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: goalName,
          targetAmount: targetVal,
          currentSavings: currentVal,
          targetDate: goalDate
        })
      });

      if (res.ok) {
        setGoalModalOpen(false);
        setGoalName('');
        setGoalTarget('');
        setGoalCurrent('');
        setGoalDate('');
        fetchData();
      } else {
        const errData = await res.json();
        setGoalError(errData.error || 'Failed to create goal.');
      }
    } catch (err) {
      setGoalError('Network error while saving goal.');
    } finally {
      setGoalLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete goal.');
    }
  };

  const handleGenerateQr = async () => {
    setQrModalOpen(true);
    setQrLoading(true);
    setQrError('');
    setQrData('');
    try {
      const res = await fetch('http://localhost:8080/api/user/qr-code', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQrData(data.qrCode);
      } else {
        setQrError('Failed to generate QR Code. Please try again.');
      }
    } catch (err) {
      setQrError('Network error while generating QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Parsing JSON fields from latest assessment
  let scoreBreakdown = [];
  let recommendations = [];
  let strengths = [];
  let weaknesses = [];
  let insightsSummary = '';
  let loanExplanation = '';

  if (latestAssessment) {
    try {
      scoreBreakdown = JSON.parse(latestAssessment.scoreBreakdown) || [];
    } catch (e) {
      scoreBreakdown = [];
    }
    try {
      recommendations = latestAssessment.recommendations ? JSON.parse(latestAssessment.recommendations) : [];
    } catch (e) {
      recommendations = [];
    }
    try {
      strengths = latestAssessment.strengths ? JSON.parse(latestAssessment.strengths) : [];
    } catch (e) {
      strengths = [];
    }
    try {
      weaknesses = latestAssessment.weaknesses ? JSON.parse(latestAssessment.weaknesses) : [];
    } catch (e) {
      weaknesses = [];
    }
    if (latestAssessment.geminiInsights) {
      const parts = latestAssessment.geminiInsights.split('[Underwriting Decision Details]:');
      insightsSummary = parts[0].trim();
      loanExplanation = parts[1] ? parts[1].trim() : '';
    }
  }

  // Visual Score Formatting
  const getScoreColor = (score) => {
    if (score >= 750) return '#34C759'; // Success green
    if (score >= 650) return '#34C759';
    if (score >= 550) return '#F4B400'; // Warning yellow
    return '#D1495B'; // Error red
  };

  const getScoreStatusLabel = (score) => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 550) return 'Fair';
    return 'Poor';
  };

  // Charts data
  const barChartData = latestAssessment ? [
    { name: 'Income', Inflow: latestAssessment.monthlyIncome, fill: 'url(#incomeGrad)' },
    { name: 'Expenses', Outflow: latestAssessment.monthlyExpenses, fill: 'url(#expenseGrad)' }
  ] : [];

  const savingsTrendData = latestAssessment ? [
    { name: '1 Jul', Savings: Math.round(latestAssessment.monthlySavings * 0.72) },
    { name: '8 Jul', Savings: Math.round(latestAssessment.monthlySavings * 0.85) },
    { name: '15 Jul', Savings: Math.round(latestAssessment.monthlySavings * 0.78) },
    { name: '22 Jul', Savings: Math.round(latestAssessment.monthlySavings * 0.93) },
    { name: '29 Jul', Savings: latestAssessment.monthlySavings }
  ] : [];

  const breakdownPieData = scoreBreakdown.map((item, idx) => {
    const colors = ['#59CFFF', '#34C759', '#F4B400', '#F5E6D3', '#1E6F9F'];
    return {
      name: item.factor,
      value: item.points,
      color: colors[idx % colors.length]
    };
  });

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#010308] text-white flex flex-col justify-center items-center">
        <PremiumBackground />
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="h-10 w-10 rounded-full border-4 border-white/10 border-t-[#59CFFF] animate-spin" />
          <span className="text-xs text-white/50 tracking-wider">Syncing Secure Financial Ledger...</span>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Wallet, section: 'dashboard-top' },
    { id: 'credit', label: 'Credit Score', icon: History, section: 'credit-section' },
    { id: 'analytics', label: 'Financial Overview', icon: TrendingUp, section: 'analytics-section' },
    { id: 'insights', label: 'AI Insights', icon: Lightbulb, section: 'insights-section' }
  ];

  return (
    <div className="min-h-screen bg-[#010308] text-white flex relative">
      {/* Background Animated Layer */}
      <PremiumBackground />

      {/* 1. Left Sidebar (Desktop Only) */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-[#030E21]/40 backdrop-blur-xl flex flex-col justify-between sticky top-0 h-screen z-30 shrink-0">
        <div className="p-6 space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#59CFFF] to-[#102C57] flex items-center justify-center border border-white/10">
              <Cpu className="h-4.5 w-4.5 text-[#59CFFF]" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              FinTrust<span className="text-[#59CFFF] font-light">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 text-left text-xs font-semibold text-white/60">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.route) {
                    navigate(item.route);
                  } else {
                    setActiveTab(item.id);
                    scrollToSection(item.section);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-[#59CFFF]/10 text-[#59CFFF] border-l-2 border-[#59CFFF]' : 'hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 hover:text-white transition-all text-[#59CFFF]"
              >
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/5 text-left"
          >
            <LogOut className="h-4.5 w-4.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Responsive Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#030E21]/80 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-64 bg-[#010308] border-r border-white/10 flex flex-col justify-between p-6 z-10 h-full text-left"
            >
              <div className="space-y-8">
                {/* Header inside drawer */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-gradient-to-br from-[#59CFFF] to-[#102C57] flex items-center justify-center">
                      <Cpu className="h-4 w-4 text-[#59CFFF]" />
                    </div>
                    <span className="font-bold text-white text-base">FinTrust AI</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-white/40 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Links */}
                <nav className="flex flex-col gap-1.5 text-xs font-semibold text-white/60">
                  {navigationItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.route) {
                          navigate(item.route);
                        } else {
                          setActiveTab(item.id);
                          scrollToSection(item.section);
                        }
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-[#59CFFF]/10 text-[#59CFFF]' : 'hover:bg-white/5 hover:text-white'}`}
                    >
                      <item.icon className="h-4 w-4" /> {item.label}
                    </button>
                  ))}
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 hover:text-white text-[#59CFFF]"
                    >
                      <ShieldCheck className="h-4 w-4" /> Admin Panel
                    </button>
                  )}
                </nav>
              </div>

              <div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/5 text-left"
                >
                  <LogOut className="h-4.5 w-4.5" /> Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Scrollable Panel */}
      <main className="flex-grow flex flex-col min-w-0 max-h-screen overflow-y-auto relative z-10" id="dashboard-top">
        
        {/* Top Navigation Bar */}
        <header className="border-b border-white/5 bg-[#030E21]/20 backdrop-blur-xl px-6 lg:px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/70 hover:text-white"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="text-left">
              <h2 className="text-sm lg:text-base font-bold text-white leading-tight">Welcome back, {user?.fullName || 'Arjun Sharma'} 👋</h2>
              <p className="text-[9px] text-white/40 mt-0.5">Here's your alternative financial overview for {selectedMonth} {selectedYear}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Search telemetry..."
                className="w-48 bg-white/5 border border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-[#59CFFF]/50 transition-colors"
              />
            </div>

            {/* Notification bell */}
            <button className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/70 hover:text-white relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#D1495B]" />
            </button>

            {/* Month & Year Select Dropdowns */}
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white/70">
              <Calendar className="h-3.5 w-3.5 text-[#59CFFF] shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white/90 border-none outline-none cursor-pointer text-[10px] font-semibold pr-1.5"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m} className="bg-[#030E21]">{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white/90 border-none outline-none cursor-pointer text-[10px] font-semibold"
              >
                {["2024", "2025", "2026", "2027"].map(y => (
                  <option key={y} value={y} className="bg-[#030E21]">{y}</option>
                ))}
              </select>
            </div>

            {/* User Profile initials */}
            <div className="flex items-center gap-2.5 border-l border-white/10 pl-3 lg:pl-5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#59CFFF] to-[#102C57] border border-white/15 flex items-center justify-center font-bold text-xs text-white">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-white">{user?.fullName || 'Arjun Sharma'}</div>
                <div className="text-[9px] text-white/40 font-semibold">{user?.role || 'Borrower'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <div className="px-6 lg:px-8 py-8 space-y-8 flex-1">

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-left">
              <h1 className="text-xl lg:text-2xl font-extrabold text-white">Alternative Underwriting Console</h1>
              <p className="text-white/40 text-[10px] mt-0.5">Real-time ledger updates & explainable indicators</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleGenerateQr}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
              >
                <QrCode className="h-4 w-4 text-[#59CFFF]" /> Share Profile
              </button>
              <button
                onClick={() => navigate('/monthly-expense')}
                className="btn-glow-sky px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" /> New Credit Assessment
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-[#D1495B]/10 border border-[#D1495B]/20 text-[#D1495B] text-xs">
              {error}
            </div>
          )}

          {/* If no assessment, prompt user */}
          {!latestAssessment ? (
            <div className="glass-card p-10 rounded-2xl border-white/10 text-center space-y-6 max-w-xl mx-auto my-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#59CFFF]/5 rounded-full blur-xl" />
              <AlertCircle className="h-12 w-12 text-[#59CFFF] mx-auto opacity-75 animate-bounce" />
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white">No Telemetry Assessed</h2>
                <p className="text-white/50 text-xs max-w-sm mx-auto leading-relaxed">
                  We need alternative inputs (savings ratios, payment cycles) to build your digital score card.
                </p>
              </div>
              <button
                onClick={() => navigate('/monthly-expense')}
                className="btn-glow-sky px-6 py-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
              >
                Check Eligibility Now <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* 4. Top Row Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Credit Score Centered Gauge Card */}
                <div className="glass-card glass-card-hover p-5 rounded-xl flex flex-col items-center justify-between text-center relative overflow-hidden" id="credit-section">
                  <div className="w-full flex justify-between items-center text-[9px] uppercase text-white/40 tracking-wider font-bold mb-1">
                    <span>Credit Score</span>
                    <ShieldCheck className="h-4 w-4 text-[#59CFFF] opacity-75" />
                  </div>
                  
                  {/* Gauge Ring */}
                  <div className="relative flex items-center justify-center my-3 shrink-0">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        stroke={getScoreColor(latestAssessment.score)} 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray="301.6"
                        strokeDashoffset={301.6 - (301.6 * (latestAssessment.score - 300) / 600)}
                        strokeLinecap="round"
                        style={{
                          filter: `drop-shadow(0 0 5px ${getScoreColor(latestAssessment.score)}40)`
                        }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold tracking-tight text-white">
                        {latestAssessment.score}
                      </span>
                      <span className="text-[8px] text-white/30 font-semibold uppercase tracking-wider">{getScoreStatusLabel(latestAssessment.score)}</span>
                    </div>
                  </div>

                  {/* Score stats details */}
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-white/45">Score range: 300-900</div>
                    <div className="text-[10px] text-emerald-400 font-bold leading-none mt-1">
                      +32 pts this month
                    </div>
                  </div>
                </div>

                {/* Loan Eligibility Card */}
                <div className="glass-card glass-card-hover p-5 rounded-xl text-left flex flex-col justify-between">
                  <span className="text-[9px] uppercase text-white/40 tracking-wider font-bold">Loan Eligibility</span>
                  <div className="mt-3.5 space-y-1">
                    <span className="text-xl font-extrabold text-white">
                      {latestAssessment.loanEligible ? `₹${latestAssessment.suggestedLoanAmount.toLocaleString('en-IN')}` : 'Not Eligible'}
                    </span>
                    <p className="text-[10px] text-white/50 leading-normal">
                      {latestAssessment.loanEligible ? 'Maximum Suggested Limit' : 'Requires higher savings buffers'}
                    </p>
                  </div>
                  <button 
                    onClick={() => scrollToSection('insights-section')}
                    className="text-[9px] font-bold text-[#59CFFF] hover:text-[#7ce0ff] transition-colors mt-3 text-left inline-flex items-center gap-0.5"
                  >
                    View Details →
                  </button>
                </div>

                {/* Savings Rate Card */}
                <div className="glass-card glass-card-hover p-5 rounded-xl text-left flex flex-col justify-between">
                  <span className="text-[9px] uppercase text-white/40 tracking-wider font-bold">Savings Rate</span>
                  <div className="mt-3.5 space-y-1">
                    <span className="text-xl font-extrabold text-white">
                      {latestAssessment.monthlyIncome > 0 
                        ? `${Math.round((latestAssessment.monthlySavings / latestAssessment.monthlyIncome) * 100)}%`
                        : '0%'}
                    </span>
                    <p className="text-[10px] text-emerald-400 font-semibold">
                      Of Monthly Income
                    </p>
                  </div>
                  <span className="text-[9px] text-white/30 mt-3 block">Based on self-reported financials</span>
                </div>

                {/* Financial Health Card */}
                <div className="glass-card glass-card-hover p-5 rounded-xl text-left flex flex-col justify-between">
                  <span className="text-[9px] uppercase text-white/40 tracking-wider font-bold">Financial Health</span>
                  <div className="mt-3.5 space-y-1">
                    <span className="text-xl font-extrabold text-[#59CFFF]">
                      {latestAssessment.financialHealthScore !== undefined ? `${latestAssessment.financialHealthScore}/100` : latestAssessment.healthStatus}
                    </span>
                    <p className="text-[10px] text-white/50 leading-normal">
                      Index Level: {latestAssessment.financialHealthScoreLabel || 'Average'}
                    </p>
                  </div>
                  <span className="text-[9px] text-white/30 mt-3 block">Calculated via savings & outflows</span>
                </div>

              </div>

              {/* AI Risk Card & Financial Health Card Section */}
              {latestAssessment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                  {/* Financial Health Score circular progress gauge */}
                  <div className="glass-card p-6 rounded-xl text-left flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                          <Activity className="h-4.5 w-4.5 text-[#59CFFF]" /> Financial Health Score
                        </h3>
                        <p className="text-[9px] text-white/40 mt-0.5">Comprehensive financial stability score</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#59CFFF]">
                        0-100 Scale
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
                      {/* Circular Progress Gauge */}
                      <div className="relative flex items-center justify-center shrink-0">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                          <circle 
                            cx="48" 
                            cy="48" 
                            r="40" 
                            stroke={
                              latestAssessment.financialHealthScore >= 90 ? '#34C759' :
                              latestAssessment.financialHealthScore >= 75 ? '#82E0AA' :
                              latestAssessment.financialHealthScore >= 60 ? '#F4B400' : '#D1495B'
                            } 
                            strokeWidth="6" 
                            fill="transparent" 
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * latestAssessment.financialHealthScore) / 100}
                            strokeLinecap="round"
                            style={{
                              filter: `drop-shadow(0 0 4px ${
                                latestAssessment.financialHealthScore >= 90 ? '#34C759' :
                                latestAssessment.financialHealthScore >= 75 ? '#82E0AA' :
                                latestAssessment.financialHealthScore >= 60 ? '#F4B400' : '#D1495B'
                              }40)`
                            }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-xl font-extrabold tracking-tight text-white">
                            {latestAssessment.financialHealthScore}
                          </span>
                          <span className="text-[7px] text-white/40 font-bold uppercase tracking-wider">Health Index</span>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-2 text-left">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/40 block">Status</span>
                          <span className={`text-sm font-extrabold ${
                            latestAssessment.financialHealthScore >= 90 ? 'text-emerald-400' :
                            latestAssessment.financialHealthScore >= 75 ? 'text-green-300' :
                            latestAssessment.financialHealthScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {latestAssessment.financialHealthScoreLabel || 'Average'}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed font-sans">
                          {latestAssessment.financialHealthExplanation || 'Your alternative spending and saving patterns are currently stable.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Financial Risk Card */}
                  <div className={`glass-card p-6 rounded-xl text-left flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                    ['High', 'Critical'].includes(latestAssessment.overspendingRiskLevel) ? 'border-[#D1495B]/30 hover:border-[#D1495B]/40 shadow-[0_0_20px_rgba(209,73,91,0.08)]' : ''
                  }`}>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                          <AlertTriangle className={`h-4.5 w-4.5 ${
                            ['High', 'Critical'].includes(latestAssessment.overspendingRiskLevel) ? 'text-rose-400 animate-pulse' : 'text-[#59CFFF]'
                          }`} /> AI Financial Risk Alert
                        </h3>
                        <p className="text-[9px] text-white/40 mt-0.5">Automated cash outflow monitoring</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        latestAssessment.overspendingRiskLevel === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        latestAssessment.overspendingRiskLevel === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        latestAssessment.overspendingRiskLevel === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {latestAssessment.overspendingRiskLevel || 'Low'} Risk
                      </span>
                    </div>

                    <div className="py-4 space-y-3.5 flex-grow flex flex-col justify-center">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] uppercase font-bold text-white/40">Expense Ratio:</span>
                        <span className={`text-base font-extrabold ${
                          ['High', 'Critical'].includes(latestAssessment.overspendingRiskLevel) ? 'text-rose-400' : 'text-white'
                        }`}>
                          {latestAssessment.expenseRatio}%
                        </span>
                        {latestAssessment.creditScorePenalty > 0 && (
                          <span className="text-[9px] text-rose-400/80 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10 font-bold font-mono">
                            -{latestAssessment.creditScorePenalty} Score Penalty
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-white/40 block">AI Financial Insight</span>
                        <p className="text-xs text-white/60 leading-relaxed font-sans">
                          {latestAssessment.geminiInsights || 'Outflow parameters are within safe limits.'}
                        </p>
                      </div>
                    </div>

                    {recommendations.length > 0 && (
                      <div className="border-t border-white/5 pt-3 bg-white/[0.01] -mx-6 -mb-6 p-4 flex items-center justify-between text-[10px] text-[#59CFFF] font-semibold">
                        <span className="truncate max-w-[80%]">💡 Recommended: {recommendations[0]}</span>
                        <button onClick={() => scrollToSection('insights-section')} className="hover:underline shrink-0">
                          View All →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Middle Charts & Recent Bills */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="analytics-section">
                
                {/* Historical 12-Month Comparison Chart */}
                <div className="glass-card glass-card-hover p-6 rounded-xl text-left lg:col-span-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-5">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">12-Month Financial Trend</h3>
                      <p className="text-[9px] text-white/40 mt-0.5">Click any month to load that month's details</p>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-white/50">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#59CFFF]" /> Income</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#D1495B]" /> Expenses</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#34C759]" /> Savings</span>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={historicalChartData} 
                        onClick={handleChartClick}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#59CFFF" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#59CFFF" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D1495B" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#D1495B" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34C759" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#34C759" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(3, 14, 33, 0.85)', 
                            borderColor: 'rgba(255, 255, 255, 0.08)', 
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)'
                          }}
                          labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}
                          itemStyle={{ fontSize: 10 }}
                        />
                        <Area type="monotone" dataKey="Income" stroke="#59CFFF" fillOpacity={1} fill="url(#incomeGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Expenses" stroke="#D1495B" fillOpacity={1} fill="url(#expenseGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Savings" stroke="#34C759" fillOpacity={1} fill="url(#savingsGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly Allocations Card */}
                <div className="glass-card glass-card-hover p-6 rounded-xl text-left lg:col-span-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Monthly Allocations</h3>
                      <p className="text-[9px] text-white/40 mt-0.5">Summary of monthly income allocations</p>
                    </div>
                  </div>

                  {!latestAssessment ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/30 space-y-1">
                      <DollarSign className="h-8 w-8 opacity-25" />
                      <p className="text-xs">No allocations found for this month</p>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-grow overflow-y-auto pr-1 no-scrollbar">
                      {/* Monthly Expenses */}
                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#D1495B]/5 border border-[#D1495B]/10 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#D1495B]/10 flex items-center justify-center text-[#D1495B] shrink-0">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white">Monthly Expenses</div>
                            <div className="text-[9px] text-[#D1495B] font-mono mt-0.5">Expense</div>
                          </div>
                        </div>
                        <div className="text-right font-bold text-white shrink-0">
                          ₹{latestAssessment.monthlyExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      
                      {/* Monthly Savings */}
                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#34C759]/5 border border-[#34C759]/10 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#34C759]/10 flex items-center justify-center text-[#34C759] shrink-0">
                            <Wallet className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white">Monthly Savings</div>
                            <div className="text-[9px] text-[#34C759] font-mono mt-0.5">Saving</div>
                          </div>
                        </div>
                        <div className="text-right font-bold text-white shrink-0">
                          ₹{latestAssessment.monthlySavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* 6. Bottom Row: Breakdown, AI insights, Documents */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="insights-section">
                
                {/* Credit Breakdown Donut/Table */}
                <div className="glass-card glass-card-hover p-6 rounded-xl text-left space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5E6D3]">Credit Score Breakdown</h3>
                    <p className="text-[9px] text-white/40 mt-0.5">Factor weights of alternative scoring</p>
                  </div>
                  
                  {/* Weight Legend Capsules */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {breakdownPieData.map((item, idx) => (
                      <div key={idx} className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: item.color }} />
                        <span className="text-[9px] text-white/60 truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="divide-y divide-white/5 space-y-3 pt-2">
                    {scoreBreakdown.length > 0 ? (
                      scoreBreakdown.map((item, index) => (
                        <div key={index} className="flex items-start justify-between py-2 gap-4 text-xs">
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-white truncate">{item.factor}</div>
                            <div className="text-[9px] text-white/50 leading-normal">{item.description}</div>
                          </div>
                          <span className={`font-bold shrink-0 ${item.points >= 0 ? 'text-[#34C759]' : 'text-[#D1495B]'}`}>
                            {item.points >= 0 ? `+${item.points}` : item.points} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-white/30 italic py-4">No breakdown points loaded.</div>
                    )}
                  </div>
                </div>

                {/* AI Financial Insights Center */}
                <div className="glass-card glass-card-hover p-6 rounded-xl text-left space-y-5 lg:col-span-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#59CFFF]">AI Financial Insights</h3>
                    <p className="text-[9px] text-white/40 mt-0.5">Gemini processed coaching profiles</p>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    
                    {/* Strengths */}
                    {strengths.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">Strengths</div>
                        {strengths.map((str, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[10px] text-white/70 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{str.replace(/^✅\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Weaknesses */}
                    {weaknesses.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-amber-400">Areas to Watch</div>
                        {weaknesses.map((weak, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[10px] text-white/70 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{weak.replace(/^⚠️\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-[#59CFFF]">Recommendations</div>
                        {recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[10px] text-white/70 bg-[#59CFFF]/5 border border-[#59CFFF]/10 p-2 rounded-lg">
                            <Lightbulb className="h-3.5 w-3.5 text-[#59CFFF] shrink-0 mt-0.5 animate-pulse" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expandable Loan Explanation Card */}
                    {loanExplanation && (
                      <div className="border border-white/5 rounded-lg overflow-hidden bg-white/[0.01]">
                        <button
                          onClick={() => setLoanExplanationOpen(!loanExplanationOpen)}
                          className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-white hover:bg-white/5 transition-colors"
                        >
                          <span>Underwriting Explanation</span>
                          <ChevronDown className={`h-4 w-4 text-[#59CFFF] transition-transform ${loanExplanationOpen ? 'transform rotate-180' : ''}`} />
                        </button>
                        {loanExplanationOpen && (
                          <div className="p-3.5 border-t border-white/5 text-[10px] text-white/50 leading-relaxed font-mono">
                            {loanExplanation}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>



              </div>

              {/* Row 7: Goals Planner & Global Ledger Node */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Savings Goals Planner */}
                <div className="glass-card glass-card-hover p-6 rounded-xl text-left space-y-6 lg:col-span-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                        <Target className="h-4.5 w-4.5 text-[#59CFFF]" /> Financial Goals Planner
                      </h3>
                      <p className="text-[9px] text-white/40 mt-0.5">Establish target endpoints and calculate deposits</p>
                    </div>
                    <button
                      onClick={() => setGoalModalOpen(true)}
                      className="px-3.5 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] hover:bg-white/10 flex items-center gap-1 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#59CFFF]" /> Create Goal
                    </button>
                  </div>

                  {goals.length === 0 ? (
                    <div className="text-center py-12 text-white/30 text-xs italic flex flex-col items-center justify-center space-y-2">
                      <Target className="h-8 w-8 opacity-20" />
                      <p>No active goals. Click "Create Goal" to start planning.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {goals.slice(0, 4).map((goal) => {
                        const percent = Math.min(100, Math.round((goal.currentSavings / goal.targetAmount) * 100));
                        return (
                          <div key={goal.id} className="p-4 rounded-lg bg-white/[0.01] border border-white/5 flex flex-col justify-between gap-4 text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-3">
                                <span className="font-bold text-white truncate">{goal.name}</span>
                                <button
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  className="text-white/20 hover:text-red-400 transition-colors shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="text-[9px] text-white/40">Target Date: {goal.targetDate}</div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-semibold">
                                <span>{percent}% Completed</span>
                                <span className="text-[#59CFFF]">₹{goal.currentSavings.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#102C57] to-[#59CFFF] rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-white/5 text-[10px] text-white/50 flex justify-between items-center bg-white/[0.02] px-2.5 py-1.5 rounded">
                              <span>Required Deposit:</span>
                              <span className="font-bold text-[#F5E6D3]">₹{goal.monthlySavingsNeeded}/mo</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Global Ledger Node Card */}
                <div className="glass-card glass-card-hover p-6 rounded-xl text-left flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-4">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#59CFFF] flex items-center gap-1.5">
                        <Globe className="h-4.5 w-4.5 text-[#59CFFF]" /> Global Ledger Node
                      </h3>
                      <p className="text-[9px] text-white/40 mt-0.5">Alternative underwriting mesh link</p>
                    </div>

                    {/* Miniature Globe container */}
                    <div className="flex justify-center items-center py-2 relative h-40">
                      <NetworkGlobe size={180} />
                    </div>

                    {/* Node statistics list */}
                    <div className="space-y-2 text-[10px]">
                      <div className="flex justify-between items-center p-2 rounded bg-white/[0.01] border border-white/5">
                        <span className="text-white/45">Primary Peer Hub</span>
                        <span className="font-mono font-bold text-white">MUMBAI-A3</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-white/[0.01] border border-white/5">
                        <span className="text-white/45">Verification Status</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-white/[0.01] border border-white/5">
                        <span className="text-white/45">Ledger Peer Sync</span>
                        <span className="font-mono text-white/70">Block 849,204</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 text-[9px] text-white/35 flex items-center gap-1.5 mt-4">
                    <Activity className="h-3.5 w-3.5 text-[#59CFFF] animate-pulse" />
                    <span>Scoring Telemetry: Online & Live</span>
                  </div>
                </div>

              </div>

              {/* Secure Footer Banner */}
              <div className="p-4.5 rounded-xl bg-[#030E21]/50 border border-white/5 text-center flex flex-col sm:flex-row items-center justify-center gap-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#34C759]" />
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div className="text-left space-y-0.5">
                  <div className="text-xs font-bold text-white">Your financial data is secure with bank-level encryption.</div>
                  <div className="text-[9px] text-white/40">We never share your transaction profiles or document uploads with any third party.</div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Goal Modal Overlays */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030E21]/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-xl p-6 border-white/10 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-sm">New Savings Goal</h3>
              <button 
                onClick={() => setGoalModalOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {goalError && (
              <div className="p-3 rounded bg-[#D1495B]/10 border border-[#D1495B]/20 text-[#D1495B] text-[10px]">
                {goalError}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-white/50 tracking-wider font-semibold">Goal Name</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Purchase Laptop, Emergency Fund"
                  className="w-full px-3 py-2 rounded glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-white/50 tracking-wider font-semibold">Target (₹)</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 rounded glass-input text-xs"
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-white/50 tracking-wider font-semibold">Current (₹)</label>
                  <input
                    type="number"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 rounded glass-input text-xs"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase text-white/50 tracking-wider font-semibold">Completion Date</label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded glass-input text-xs bg-navy-dark"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <button
                type="submit"
                disabled={goalLoading}
                className="w-full py-2.5 mt-2 rounded btn-glow-sky text-xs font-bold"
              >
                {goalLoading ? 'Calculating Goal...' : 'Calculate & Save'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030E21]/90 backdrop-blur-md">
          <div className="w-full max-w-sm glass-card rounded-2xl p-8 border-white/10 flex flex-col items-center relative text-center">
            <button 
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#59CFFF] to-[#102C57] flex items-center justify-center mb-4 border border-white/10">
              <QrCode className="h-6 w-6 text-[#59CFFF]" />
            </div>
            
            <h3 className="font-bold text-white text-lg mb-1">Profile Access QR</h3>
            <p className="text-[11px] text-white/50 mb-6 px-4">
              Scan this QR code from an authorized bank terminal to securely view your alternative credit profile.
            </p>

            {qrLoading ? (
              <div className="h-48 w-48 border border-white/10 rounded-xl flex items-center justify-center bg-white/5">
                <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-[#59CFFF] animate-spin" />
              </div>
            ) : qrError ? (
              <div className="h-48 w-48 border border-[#D1495B]/30 rounded-xl flex items-center justify-center bg-[#D1495B]/10 text-[#D1495B] text-xs text-center p-4">
                {qrError}
              </div>
            ) : qrData ? (
              <div className="bg-white p-3 rounded-xl shadow-[0_0_30px_rgba(89,207,255,0.2)]">
                <img src={qrData} alt="Profile QR Code" className="h-48 w-48" />
              </div>
            ) : null}

            {!qrLoading && !qrError && qrData && (
              <div className="mt-6 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1.5 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Valid for 5 minutes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
