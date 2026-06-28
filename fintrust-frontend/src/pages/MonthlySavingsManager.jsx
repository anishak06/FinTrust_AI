import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, Plus, Trash2, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PremiumBackground from '../components/PremiumBackground';

const CATEGORIES = [
  "Savings Account",
  "FD",
  "RD",
  "SIP",
  "Mutual Funds",
  "Stocks",
  "Gold",
  "PPF",
  "NPS",
  "Emergency Fund",
  "Crypto",
  "Other"
];

export default function MonthlySavingsManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Selected Month, Year, and Expenses passed from Expense Manager
  const [month, setMonth] = useState(location.state?.month || '');
  const [year, setYear] = useState(location.state?.year || '');
  const [monthlyExpenses, setMonthlyExpenses] = useState(location.state?.monthlyExpenses || 0);

  // Dynamic savings list
  const [savings, setSavings] = useState([{ category: 'Savings Account', amount: '' }]);
  const [validationError, setValidationError] = useState('');

  // Auto fallback for date if accessed directly
  useEffect(() => {
    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
    const titleCaseMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1).toLowerCase();
    const currentYearNum = currentDate.getFullYear();

    if (!month) setMonth(titleCaseMonth);
    if (!year) setYear(currentYearNum.toString());

    // If monthlyExpenses was not passed, load it from localStorage
    if (user?.username && !monthlyExpenses) {
      const expKey = `fintrust_total_expenses_${user.username}_${month || titleCaseMonth}_${year || currentYearNum.toString()}`;
      const storedExpenses = localStorage.getItem(expKey);
      if (storedExpenses) {
        setMonthlyExpenses(parseFloat(storedExpenses));
      }
    }
  }, [month, year, user?.username, monthlyExpenses]);

  // Load saved savings from localStorage when user, month, or year changes
  useEffect(() => {
    if (!user?.username || !month || !year) return;
    const key = `fintrust_savings_list_${user.username}_${month}_${year}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavings(parsed);
        } else {
          setSavings([]);
        }
      } catch (e) {
        console.error("Failed to parse stored savings list", e);
        setSavings([]);
      }
    } else {
      setSavings([]);
    }
  }, [month, year, user?.username]);

  // Calculations
  const totalSavings = savings.reduce((acc, curr) => {
    const amt = parseFloat(curr.amount);
    return acc + (isNaN(amt) ? 0 : amt);
  }, 0);

  const handleAddSavings = () => {
    setSavings([...savings, { category: 'Savings Account', amount: '' }]);
  };

  const handleUpdateSavings = (index, field, value) => {
    const updated = [...savings];
    updated[index][field] = value;
    setSavings(updated);
    setValidationError('');

    // Save to localStorage dynamically as they edit
    if (user?.username && month && year) {
      const key = `fintrust_savings_list_${user.username}_${month}_${year}`;
      localStorage.setItem(key, JSON.stringify(updated));
      const totalKey = `fintrust_total_savings_${user.username}_${month}_${year}`;
      const total = updated.reduce((acc, curr) => {
        const amt = parseFloat(curr.amount);
        return acc + (isNaN(amt) ? 0 : amt);
      }, 0);
      localStorage.setItem(totalKey, total.toString());
    }
  };

  const handleDeleteSavings = (index) => {
    const updated = savings.filter((_, idx) => idx !== index);
    setSavings(updated);
    setValidationError('');

    // Save to localStorage dynamically
    if (user?.username && month && year) {
      const key = `fintrust_savings_list_${user.username}_${month}_${year}`;
      localStorage.setItem(key, JSON.stringify(updated));
      const totalKey = `fintrust_total_savings_${user.username}_${month}_${year}`;
      const total = updated.reduce((acc, curr) => {
        const amt = parseFloat(curr.amount);
        return acc + (isNaN(amt) ? 0 : amt);
      }, 0);
      localStorage.setItem(totalKey, total.toString());
    }
  };

  const handleContinue = (e) => {
    e.preventDefault();
    setValidationError('');

    // Validate entries
    for (let i = 0; i < savings.length; i++) {
      const item = savings[i];
      const amt = parseFloat(item.amount);
      if (isNaN(amt) || amt < 0) {
        setValidationError(`Please enter a valid amount for row ${i + 1} (${item.category}).`);
        return;
      }
    }

    // Persist final states
    if (user?.username && month && year) {
      const listKey = `fintrust_savings_list_${user.username}_${month}_${year}`;
      const totalKey = `fintrust_total_savings_${user.username}_${month}_${year}`;
      localStorage.setItem(listKey, JSON.stringify(savings));
      localStorage.setItem(totalKey, totalSavings.toString());
    }

    // Navigate to Credit Assessment Form
    navigate('/check-eligibility', {
      state: {
        month,
        year,
        monthlyExpenses,
        monthlySavings: totalSavings
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#010308] text-white relative">
      <PremiumBackground />

      {/* Navigation Header */}
      <header className="border-b border-white/5 bg-[#030E21]/30 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#59CFFF] to-[#102C57] flex items-center justify-center border border-white/10">
              <ClipboardList className="h-4.5 w-4.5 text-[#59CFFF]" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              FinTrust<span className="text-[#59CFFF] font-light">AI</span>
            </span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Cancel Assessment
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 relative z-10">
        <div className="mb-8 text-left">
          <h1 className="text-2xl font-extrabold text-white mb-2">Monthly Savings Manager</h1>
          <p className="text-white/40 text-xs leading-relaxed">
            Specify your individual monthly savings and investments below. Total Monthly Savings is auto-calculated and will populate your alternative credit evaluation ledger.
          </p>
        </div>

        {validationError && (
          <div className="mb-6 p-3.5 rounded-lg bg-[#D1495B]/10 border border-[#D1495B]/20 text-[#D1495B] text-xs text-left flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-6 glass-card p-6 md:p-8 rounded-2xl border-white/10">
          
          {/* Assessment Period Display (locked based on previous page) */}
          <div className="grid grid-cols-2 gap-5 border-b border-white/5 pb-6 text-left">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Month</span>
              <span className="text-xs font-semibold text-white/80">{month}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Year</span>
              <span className="text-xs font-semibold text-white/80">{year}</span>
            </div>
          </div>

          {/* Savings Rows */}
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
              Savings & Investment Itemization
            </label>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {savings.length === 0 ? (
                <div className="text-center py-6 text-white/30 text-xs border border-dashed border-white/10 rounded-lg">
                  No savings entries yet. Click "Add Savings Item" below or Continue with ₹0.
                </div>
              ) : (
                savings.map((sav, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#030E21]/30 p-2.5 rounded-lg border border-white/5">
                    {/* Category Dropdown */}
                    <div className="flex-1">
                      <select
                        value={sav.category}
                        onChange={(e) => handleUpdateSavings(idx, 'category', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-[#030E21] appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div className="w-1/3 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">₹</span>
                      <input
                        type="number"
                        value={sav.amount}
                        onChange={(e) => handleUpdateSavings(idx, 'amount', e.target.value)}
                        placeholder="e.g. 2000"
                        className="w-full pl-6 pr-3 py-2 rounded-lg glass-input text-xs"
                        min="0"
                        required
                      />
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSavings(idx)}
                      className="p-2 rounded-lg hover:bg-white/5 text-[#D1495B] hover:text-[#e46475] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Row Button */}
            <button
              type="button"
              onClick={handleAddSavings}
              className="btn-outline-premium px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1.5 justify-center w-full mt-2 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Savings Item
            </button>
          </div>

          {/* Dynamic Total Savings */}
          <div className="border-t border-white/5 pt-5 flex justify-between items-center">
            <div className="text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Total Monthly Savings</span>
              <span className="text-xs text-white/50">For {month} {year}</span>
            </div>
            <span className="text-xl font-extrabold text-[#59CFFF] text-glow-sky">
              ₹{totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/monthly-expense', { state: { month, year } })}
              className="btn-outline-premium flex-1 py-3 rounded-xl text-xs font-bold transition-all"
            >
              Back to Expenses
            </button>
            <button
              type="submit"
              className="btn-glow-sky flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
