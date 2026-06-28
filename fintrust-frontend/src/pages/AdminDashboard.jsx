import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Cpu, Users, Award, ShieldCheck, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Calendar, Search, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PremiumBackground from '../components/PremiumBackground';

export default function AdminDashboard() {
  const { token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const getScoreColor = (score) => {
    if (!score) return '#ffffff';
    if (score >= 750) return '#34C759'; // Success green
    if (score >= 650) return '#34C759';
    if (score >= 550) return '#F4B400'; // Warning yellow
    return '#D1495B'; // Error red
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);

    if (!searchQuery.trim()) {
      setSearchError('Please enter Username or Email.');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/lender/searchBorrower?query=${encodeURIComponent(searchQuery.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        setSearchError('Unable to fetch borrower details.');
        return;
      }

      const data = await response.json();

      if (response.status === 404) {
        setSearchError('Borrower not found.');
      } else if (!response.ok) {
        setSearchError(data.error || 'Unable to fetch borrower details.');
      } else {
        setSearchResult(data);
      }
    } catch (err) {
      setSearchError('Unable to fetch borrower details.');
    } finally {
      setSearchLoading(false);
    }
  };


  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('http://localhost:8080/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.status === 403 || statsRes.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Fetch Users
      const usersRes = await fetch('http://localhost:8080/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      setUsers(usersData);

    } catch (err) {
      setError('Failed to fetch administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [token, isAdmin]);

  // Search Filter
  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(filterText.toLowerCase()) || 
    u.username.toLowerCase().includes(filterText.toLowerCase())
  );

  // Risk chart preparation
  const chartData = stats?.riskBreakdown ? [
    { name: 'Low Risk', count: stats.riskBreakdown.lowRisk, color: '#10B981' },
    { name: 'Medium Risk', count: stats.riskBreakdown.mediumRisk, color: '#F59E0B' },
    { name: 'High Risk', count: stats.riskBreakdown.highRisk, color: '#EF4444' }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010308] text-white flex flex-col justify-center items-center relative">
        <PremiumBackground />
        <RefreshCw className="h-10 w-10 text-[#59CFFF] animate-spin mb-4 relative z-10" />
        <span className="text-sm text-white/50 relative z-10">Fetching underwriting analytics...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010308] text-white flex flex-col relative overflow-hidden">
      <PremiumBackground />
      
      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-[#010308]/60 backdrop-blur-md sticky top-0 z-30 relative">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#59CFFF] to-[#143c75] flex items-center justify-center">
              <Cpu className="h-5 w-5 text-[#010308]" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              FinTrust<span className="text-[#59CFFF] font-light">AI</span> <span className="text-xs px-2 py-0.5 rounded bg-[#59CFFF]/10 border border-[#59CFFF]/20 text-[#59CFFF] font-mono ml-1">ADMIN</span>
            </span>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to User Board
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-8 space-y-8 relative z-10">
        
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Lender Analytics Console</h1>
            <p className="text-white/50 text-xs mt-1">Monitor platform-wide risk aggregates and credit issuance probability</p>
          </div>
          <button 
            onClick={fetchAdminData}
            className="p-2.5 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Users */}
            <div className="glass-card glass-card-hover p-5 rounded-xl border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-white/50 font-bold tracking-wider block mb-1">Total Users</span>
                <span className="text-3xl font-bold font-sans">{stats.totalUsers}</span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#59CFFF]/10 border border-[#59CFFF]/20 flex items-center justify-center text-[#59CFFF]">
                <Users className="h-5 w-5" />
              </div>
            </div>

            {/* Assessed Profiles */}
            <div className="glass-card glass-card-hover p-5 rounded-xl border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-white/50 font-bold tracking-wider block mb-1">Assessed Profiles</span>
                <span className="text-3xl font-bold font-sans">{stats.assessedUsers}</span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#59CFFF]/10 border border-[#59CFFF]/20 flex items-center justify-center text-[#59CFFF]">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            {/* Average Credit Score */}
            <div className="glass-card glass-card-hover p-5 rounded-xl border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-white/50 font-bold tracking-wider block mb-1">Avg FinTrust Score</span>
                <span className="text-3xl font-bold font-sans text-emerald-400">{stats.averageScore}</span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="h-5 w-5" />
              </div>
            </div>

            {/* Loan Approval rate */}
            <div className="glass-card glass-card-hover p-5 rounded-xl border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-white/50 font-bold tracking-wider block mb-1">Inflow Underwriting Approval</span>
                <span className="text-3xl font-bold font-sans text-[#F5E6D3]">{stats.approvalRate}%</span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#F5E6D3]/10 border border-[#F5E6D3]/20 flex items-center justify-center text-[#F5E6D3]">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>

          </div>
        )}

        {/* Borrower Search Section */}
        <div className="glass-card glass-card-hover p-6 rounded-xl border-white/5 text-left space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">
              Borrower Search
            </h3>
            <p className="text-[10px] text-white/40">Query comprehensive alternate risk profiles using Username or Registered Email</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Username or Email"
                className="w-full pl-10 pr-4 py-2.5 rounded glass-input text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-2.5 rounded bg-gradient-to-r from-[#59CFFF] to-[#102C57] text-[#010308] font-bold text-xs hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {searchLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>

          {searchError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {searchResult && (
            <div className="space-y-8 mt-6 pt-6 border-t border-white/5">
              
              {/* Profile Card & Financial Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Borrower Profile */}
                <div className="glass-card p-5 rounded-xl border-white/5 space-y-4 relative overflow-hidden bg-navy-medium/10">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#59CFFF] to-[#102C57] flex items-center justify-center border border-white/10 shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(searchResult.profile.fullName)}`}
                        alt="Avatar"
                        className="h-14 w-14 rounded-lg"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{searchResult.profile.fullName}</h4>
                      <p className="text-white/40 text-[10px] font-mono">@{searchResult.profile.username}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase">
                        {searchResult.profile.verificationStatus}
                      </span>
                    </div>
                  </div>

                  <div className="h-0.5 w-full bg-white/5 my-3" />

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="space-y-0.5 flex flex-col min-w-0">
                      <span className="text-white/30 text-[9px] uppercase tracking-wider block">Registered Email</span>
                      <span className="text-white/70 font-semibold truncate block" title={searchResult.profile.email}>
                        {searchResult.profile.email}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-white/30 text-[9px] uppercase tracking-wider block">Age</span>
                      <span className="text-white/70 font-semibold block">{searchResult.profile.age} Years</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-white/30 text-[9px] uppercase tracking-wider block">Occupation</span>
                      <span className="text-white/70 font-semibold block">{searchResult.profile.occupation}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-white/30 text-[9px] uppercase tracking-wider block">Employment Type</span>
                      <span className="text-white/70 font-semibold block">{searchResult.profile.employmentType}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-white/30 text-[9px] uppercase tracking-wider block">Monthly Income</span>
                      <span className="text-white/70 font-bold block text-[#F5E6D3]">
                        ₹{Number(searchResult.profile.monthlyIncome).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-white/30 text-[9px] uppercase tracking-wider block">Location (City)</span>
                      <span className="text-white/70 font-semibold block">{searchResult.profile.city}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Financial Summary */}
                <div className="glass-card p-5 rounded-xl border-white/5 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-navy-medium/10">
                  <div className="sm:col-span-2 md:col-span-2 flex flex-col justify-between p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                    <div>
                      <span className="text-[10px] uppercase text-white/50 font-bold tracking-wider block mb-1">FinTrust Score</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold" style={{ color: getScoreColor(searchResult.summary?.creditScore) }}>
                          {searchResult.summary ? searchResult.summary.creditScore : 'N/A'}
                        </span>
                        <span className="text-white/30 text-xs">/ 900</span>
                      </div>
                    </div>
                    {searchResult.summary && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs text-white/60">Rating:</span>
                        <span className="text-xs font-bold" style={{ color: getScoreColor(searchResult.summary.creditScore) }}>
                          {searchResult.summary.aiCreditRating}
                        </span>
                        <span className="text-white/20">|</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/15 text-white/70">
                          {searchResult.summary.riskLevel}
                        </span>
                      </div>
                    )}
                  </div>

                  {searchResult.summary && (
                    <>
                      <div className="flex flex-col justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <span className="text-[10px] uppercase text-white/50 font-bold tracking-wider block mb-1">Eligibility Status</span>
                          <span className={`text-base font-bold ${searchResult.summary.loanEligibility === 'Eligible' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {searchResult.summary.loanEligibility}
                          </span>
                        </div>
                        <div className="mt-3">
                          <span className="text-[9px] uppercase text-white/30 block">Suggested Cap</span>
                          <span className="text-xs font-bold text-white/80">
                            ₹{Number(searchResult.summary.recommendedLoanAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <span className="text-[10px] uppercase text-white/50 font-bold tracking-wider block mb-1">Stability Assessment</span>
                          <span className="text-xs font-bold text-white/80 block leading-tight mt-1">
                            {searchResult.summary.incomeStability}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-2">
                          <div>
                            <span className="text-[8px] uppercase text-white/30 block">Fraud Risk</span>
                            <span className={`text-[10px] font-bold ${searchResult.summary.fraudRisk === 'Low' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                              {searchResult.summary.fraudRisk}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase text-white/30 block">Default Prob.</span>
                            <span className="text-[10px] font-bold text-red-400">
                              {searchResult.summary.defaultProbability}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>

              {searchResult.summary && (
                <>
                  {/* 3. Explainable AI & Financial Behaviour */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Explainable AI */}
                    <div className="glass-card p-5 rounded-xl border-white/5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                        Explainable AI (Feature Contribution Weights)
                      </h4>
                      <div className="h-0.5 w-full bg-white/5" />
                      
                      <div className="space-y-3.5">
                        {searchResult.explainableAi.map((factor, index) => (
                          <div key={index} className="p-3 rounded-lg bg-[#01050F]/40 border border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-white/80">{factor.factor}</span>
                              <span className="font-mono text-[10px] text-[#59CFFF] bg-[#59CFFF]/10 px-2 py-0.5 rounded border border-[#59CFFF]/20">
                                Contribution: {factor.finalContribution} pts
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-white/5 pt-2">
                              <div className="text-emerald-400/90 text-left">
                                <span className="text-white/30 block text-[8px] uppercase">Positive Impact Factors</span>
                                <span>{factor.positiveImpact}</span>
                              </div>
                              <div className="text-red-400/90 text-left">
                                <span className="text-white/30 block text-[8px] uppercase">Negative Impact Factors</span>
                                <span>{factor.negativeImpact}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Financial Risk Alert Card */}
                    <div className={`glass-card p-5 rounded-xl text-left space-y-4 relative overflow-hidden transition-all duration-300 ${
                      ['High', 'Critical'].includes(searchResult.overspendingRiskLevel) 
                        ? 'border-rose-500/50 bg-rose-500/5 shadow-[0_0_20px_rgba(209,73,91,0.15)] animate-[pulse_3s_infinite]' 
                        : 'border-white/5'
                    }`}>
                      {['High', 'Critical'].includes(searchResult.overspendingRiskLevel) && (
                        <div className="bg-[#D1495B]/15 border border-[#D1495B]/30 text-[#D1495B] text-[10px] font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
                          <span>WARNING: High Risk of Financial Overspending Detected</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white/85 flex items-center gap-1.5">
                            <AlertTriangle className={`h-4.5 w-4.5 ${
                              ['High', 'Critical'].includes(searchResult.overspendingRiskLevel) ? 'text-rose-400' : 'text-[#59CFFF]'
                            }`} /> AI Financial Risk Alert
                          </h4>
                          <p className="text-[8px] text-white/40 mt-0.5">Automated cash outflow monitoring</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          searchResult.overspendingRiskLevel === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          searchResult.overspendingRiskLevel === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          searchResult.overspendingRiskLevel === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {searchResult.overspendingRiskLevel || 'Low'} Risk
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-baseline gap-2 text-xs">
                          <span className="text-[9px] uppercase font-bold text-white/40">Expense Ratio:</span>
                          <span className={`font-bold ${
                            ['High', 'Critical'].includes(searchResult.overspendingRiskLevel) ? 'text-rose-400' : 'text-white'
                          }`}>
                            {searchResult.expenseRatio}%
                          </span>
                          {searchResult.creditScorePenalty > 0 && (
                            <span className="text-[8px] text-rose-400 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10 font-bold font-mono">
                              -{searchResult.creditScorePenalty} Score Penalty
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-white/40 block">AI Financial Insight</span>
                          <p className="text-xs text-white/60 leading-relaxed font-sans">
                            {searchResult.geminiInsights || 'Outflow parameters are within safe limits.'}
                          </p>
                        </div>

                        {searchResult.recommendations && (
                          <div className="border-t border-white/5 pt-3 mt-1 text-[10px] text-[#59CFFF] font-semibold">
                            <span>💡 Recommendation: {searchResult.recommendations.includes('[') ? JSON.parse(searchResult.recommendations)[0] : searchResult.recommendations}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Behaviour */}
                    <div className="glass-card p-5 rounded-xl border-white/5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                        Financial Behaviour & Ratios
                      </h4>
                      <div className="h-0.5 w-full bg-white/5" />
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-center">
                          <span className="text-[9px] uppercase text-white/40 block mb-1">Monthly Income</span>
                          <span className="text-sm font-bold text-white">₹{Number(searchResult.behaviour.monthlyIncome).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-center">
                          <span className="text-[9px] uppercase text-white/40 block mb-1">Monthly Expenses</span>
                          <span className="text-sm font-bold text-white">₹{Number(searchResult.behaviour.monthlyExpenses).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-center">
                          <span className="text-[9px] uppercase text-white/40 block mb-1">Monthly Savings</span>
                          <span className="text-sm font-bold text-white">₹{Number(searchResult.behaviour.monthlySavings).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-center">
                          <span className="text-[9px] uppercase text-white/40 block mb-1">Savings Ratio</span>
                          <span className="text-sm font-bold text-[#34C759]">{searchResult.behaviour.savingsRatio}</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-center">
                          <span className="text-[9px] uppercase text-white/40 block mb-1">Consumption Ratio</span>
                          <span className="text-sm font-bold text-[#D1495B]">{searchResult.behaviour.expenseDistribution}</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-center">
                          <span className="text-[9px] uppercase text-white/40 block mb-1">Bill Consistency Rate</span>
                          <span className="text-sm font-bold text-[#59CFFF]">{searchResult.behaviour.billPaymentHistory}</span>
                        </div>
                      </div>

                      {/* Visual gauge bar */}
                      <div className="space-y-1.5 pt-3 text-xs">
                        <div className="flex justify-between text-[10px] text-white/50">
                          <span>Expenses ({searchResult.behaviour.expenseDistribution})</span>
                          <span>Savings ({searchResult.behaviour.savingsRatio})</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex">
                          <div 
                            className="bg-[#D1495B] h-full" 
                            style={{ width: `${parseFloat(searchResult.behaviour.expenseDistribution)}%` }} 
                          />
                          <div 
                            className="bg-[#34C759] h-full" 
                            style={{ width: `${parseFloat(searchResult.behaviour.savingsRatio)}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* 4. Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Credit Score Trend Chart */}
                    <div className="glass-card p-5 rounded-xl border-white/5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 text-left">
                        Credit Score Trend History
                      </h4>
                      <div className="h-64 pt-2">
                        {searchResult.chartData && searchResult.chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={searchResult.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                              <YAxis domain={[300, 900]} stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(3, 14, 33, 0.85)', borderColor: 'rgba(255, 255, 255, 0.08)', color: '#fff', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                                cursor={{ fill: 'rgba(89, 207, 255, 0.04)' }}
                              />
                              <Bar dataKey="score" fill="#59CFFF" radius={[4, 4, 0, 0]}>
                                {searchResult.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-white/40 italic">No score trend details.</div>
                        )}
                      </div>
                    </div>

                    {/* Savings vs Expenses Chart */}
                    <div className="glass-card p-5 rounded-xl border-white/5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 text-left">
                        Liquidity Flow Analysis (Savings vs Expenses)
                      </h4>
                      <div className="h-64 pt-2">
                        {searchResult.chartData && searchResult.chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={searchResult.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(3, 14, 33, 0.85)', borderColor: 'rgba(255, 255, 255, 0.08)', color: '#fff', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                                cursor={{ fill: 'rgba(89, 207, 255, 0.04)' }}
                              />
                              <Bar dataKey="savings" fill="#34C759" name="Savings" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="expenses" fill="#D1495B" name="Expenses" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-white/40 italic">No liquidity details.</div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* 5. Loan Recommendation details & AI Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Underwriter Recommendation */}
                    <div className="glass-card p-5 rounded-xl border-white/5 space-y-4 bg-[#F5E6D3]/[0.02]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5E6D3]">
                        Loan Recommendation Policy
                      </h4>
                      <div className="h-0.5 w-full bg-[#F5E6D3]/10" />
                      
                      <div className="space-y-4 text-xs">
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase">Eligible Loan Program</span>
                          <span className="font-bold text-white text-sm">{searchResult.loanRecommendation.eligibleLoanType}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase">Maximum Loan Principal Amount</span>
                          <span className="font-bold text-[#F5E6D3] text-lg">
                            ₹{Number(searchResult.loanRecommendation.recommendedAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase">Suggested Rate Band</span>
                          <span className="font-bold text-white">{searchResult.loanRecommendation.recommendedInterestCategory}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-white/40 block text-[9px] uppercase">Suggested Tenure</span>
                            <span className="font-bold text-white">{searchResult.loanRecommendation.suggestedTenure}</span>
                          </div>
                          <div>
                            <span className="text-white/40 block text-[9px] uppercase">Confidence Score</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {Math.round(searchResult.loanRecommendation.confidenceScore * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gemini AI Coaching Insights */}
                    <div className="glass-card p-5 rounded-xl border-white/5 lg:col-span-2 space-y-4 bg-[#59CFFF]/[0.01]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-[#59CFFF] animate-pulse" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#59CFFF]">
                          AI Financial Insights
                        </h4>
                      </div>
                      <div className="h-0.5 w-full bg-[#59CFFF]/10" />
                      
                      <div className="text-xs text-white/80 leading-relaxed font-sans max-h-72 overflow-y-auto pr-2 scrollbar-thin text-left">
                        {searchResult.geminiInsights.split('\n').map((para, i) => (
                          para.trim() && <p key={i} className="mb-2">{para.trim()}</p>
                        ))}
                      </div>
                    </div>

                  </div>
                </>
              )}

            </div>
          )}
        </div>

        {/* Charts & Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          
          {/* Risk Breakdown Histogram */}
          <div className="glass-card glass-card-hover p-6 rounded-xl border-white/5 lg:col-span-2 flex flex-col justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-4 text-left">
              Alternative Credit Risk Distribution
            </h3>
            <div className="h-64 flex-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(3, 14, 33, 0.85)', borderColor: 'rgba(255, 255, 255, 0.08)', color: '#fff', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                      cursor={{ fill: 'rgba(89, 207, 255, 0.04)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/40 italic">No score distributions calculated.</div>
              )}
            </div>
          </div>

          {/* Underwriting Event Stream */}
          <div className="glass-card glass-card-hover p-6 rounded-xl border-white/5 text-left space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">
              Live Underwriting Logs
            </h3>
            <div className="h-0.5 w-full bg-white/5" />
            
            <div className="space-y-4 overflow-y-auto max-h-64 no-scrollbar">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((act, index) => (
                  <div key={index} className="text-xs p-3 rounded bg-navy-medium/35 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white truncate max-w-[120px]">{act.username}</span>
                      <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" /> {new Date(act.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/60">Calculated Score: <b className="text-white">{act.score}</b></span>
                      <span className={`font-semibold ${act.risk === 'Low Risk' ? 'text-emerald-400' : act.risk === 'Medium Risk' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {act.risk}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-white/40 italic py-4">No recent scoring queries recorded.</div>
              )}
            </div>
          </div>

        </div>

        {/* Users Table */}
        <div className="glass-card glass-card-hover p-6 rounded-xl border-white/5 text-left space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">
                User Telemetry Registry
              </h3>
              <p className="text-[10px] text-white/40">Query individual files and raw risk outputs</p>
            </div>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full sm:w-64 px-3.5 py-1.5 rounded glass-input text-xs"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-navy-medium/55 border-b border-white/5 text-white/50 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="p-4">Borrower Name</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">FinTrust Score</th>
                  <th className="p-4">Risk Profile</th>
                  <th className="p-4">Approved Inflow Loan</th>
                  <th className="p-4">Last Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-navy-medium/20 transition-colors">
                      <td className="p-4 font-bold text-white">{u.fullName}</td>
                      <td className="p-4 text-white/60">{u.username}</td>
                      <td className="p-4 font-mono font-bold text-base">
                        {u.hasAssessment ? (
                          <span style={{ color: getScoreColor(u.latestScore) }}>{u.latestScore}</span>
                        ) : (
                          <span className="text-white/30 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.hasAssessment ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${u.riskCategory === 'Low Risk' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : u.riskCategory === 'Medium Risk' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {u.riskCategory}
                          </span>
                        ) : (
                          <span className="text-white/30">N/A</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-[#F5E6D3]">
                        {u.hasAssessment && u.loanEligible ? (
                          <span>Eligible (₹{u.latestScore ? Math.round(u.latestScore * 300).toLocaleString('en-IN') : '0'})</span>
                        ) : u.hasAssessment ? (
                          <span className="text-red-400/80">Rejected</span>
                        ) : (
                          <span className="text-white/30 font-normal">N/A</span>
                        )}
                      </td>
                      <td className="p-4 text-white/50">
                        {u.hasAssessment ? new Date(u.lastAssessmentDate).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-white/40 italic">
                      No borrowers match the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
