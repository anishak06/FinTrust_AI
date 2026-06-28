import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, Plus, Trash2, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PremiumBackground from '../components/PremiumBackground';

const CATEGORIES = [
  "Electricity",
  "Water",
  "Gas",
  "Internet",
  "Mobile Recharge",
  "Rent",
  "Groceries",
  "Transportation",
  "Fuel",
  "Insurance",
  "EMI",
  "Healthcare",
  "Education",
  "Entertainment",
  "Shopping",
  "Dining",
  "Investments",
  "Miscellaneous",
  "Other"
];

export default function MonthlyExpenseManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to get current Month (Title case) and Year
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const titleCaseMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1).toLowerCase();
  const currentYearNum = currentDate.getFullYear();

  // Selected Month and Year (prefill from location state if user returned from DataCollection)
  const [month, setMonth] = useState(location.state?.month || titleCaseMonth);
  const [year, setYear] = useState(location.state?.year || currentYearNum.toString());

  // Dynamic expenses list
  const [expenses, setExpenses] = useState([{ category: 'Electricity', amount: '' }]);
  const [validationError, setValidationError] = useState('');

  // Load saved expenses from localStorage when user, month, or year changes
  useEffect(() => {
    if (!user?.username) return;
    const key = `fintrust_expenses_list_${user.username}_${month}_${year}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExpenses(parsed);
        } else {
          setExpenses([{ category: 'Electricity', amount: '' }]);
        }
      } catch (e) {
        console.error("Failed to parse stored expenses list", e);
        setExpenses([{ category: 'Electricity', amount: '' }]);
      }
    } else {
      setExpenses([{ category: 'Electricity', amount: '' }]);
    }
  }, [month, year, user?.username]);

  // Calculations
  const totalExpenses = expenses.reduce((acc, curr) => {
    const amt = parseFloat(curr.amount);
    return acc + (isNaN(amt) ? 0 : amt);
  }, 0);

  const handleAddExpense = () => {
    setExpenses([...expenses, { category: 'Electricity', amount: '' }]);
  };

  const handleUpdateExpense = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
    setValidationError('');

    // Save to localStorage dynamically as they edit
    if (user?.username) {
      const key = `fintrust_expenses_list_${user.username}_${month}_${year}`;
      localStorage.setItem(key, JSON.stringify(updated));
      const totalKey = `fintrust_total_expenses_${user.username}_${month}_${year}`;
      const total = updated.reduce((acc, curr) => {
        const amt = parseFloat(curr.amount);
        return acc + (isNaN(amt) ? 0 : amt);
      }, 0);
      localStorage.setItem(totalKey, total.toString());
    }
  };

  const handleDeleteExpense = (index) => {
    const updated = expenses.filter((_, idx) => idx !== index);
    const finalExpenses = updated.length > 0 ? updated : [{ category: 'Electricity', amount: '' }];
    setExpenses(finalExpenses);
    setValidationError('');

    // Save to localStorage dynamically
    if (user?.username) {
      const key = `fintrust_expenses_list_${user.username}_${month}_${year}`;
      localStorage.setItem(key, JSON.stringify(finalExpenses));
      const totalKey = `fintrust_total_expenses_${user.username}_${month}_${year}`;
      const total = finalExpenses.reduce((acc, curr) => {
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
    for (let i = 0; i < expenses.length; i++) {
      const exp = expenses[i];
      const amt = parseFloat(exp.amount);
      if (isNaN(amt) || amt < 0) {
        setValidationError(`Please enter a valid amount for row ${i + 1} (${exp.category}).`);
        return;
      }
    }

    if (expenses.length === 0 || totalExpenses === 0) {
      setValidationError("Please add at least one expense with a valid amount.");
      return;
    }

    // Persist final states
    if (user?.username) {
      const listKey = `fintrust_expenses_list_${user.username}_${month}_${year}`;
      const totalKey = `fintrust_total_expenses_${user.username}_${month}_${year}`;
      localStorage.setItem(listKey, JSON.stringify(expenses));
      localStorage.setItem(totalKey, totalExpenses.toString());
    }

    // Navigate to Savings Manager
    navigate('/monthly-savings', {
      state: {
        month,
        year,
        monthlyExpenses: totalExpenses
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
          <h1 className="text-2xl font-extrabold text-white mb-2">Monthly Expense Manager</h1>
          <p className="text-white/40 text-xs leading-relaxed">
            Specify your individual monthly expenses below. Total Monthly Outflow is auto-calculated and will populate your alternative credit evaluation ledger.
          </p>
        </div>

        {validationError && (
          <div className="mb-6 p-3.5 rounded-lg bg-[#D1495B]/10 border border-[#D1495B]/20 text-[#D1495B] text-xs text-left flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-6 glass-card p-6 md:p-8 rounded-2xl border-white/10">
          
          {/* Assessment Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-white/5 pb-6">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Assessment Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-4 py-3 rounded-lg glass-input text-xs bg-[#030E21] appearance-none cursor-pointer"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Assessment Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 rounded-lg glass-input text-xs bg-[#030E21] appearance-none cursor-pointer"
              >
                {["2024", "2025", "2026", "2027"].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses Rows */}
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
              Expense Itemization
            </label>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {expenses.map((exp, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#030E21]/30 p-2.5 rounded-lg border border-white/5">
                  {/* Category Dropdown */}
                  <div className="flex-1">
                    <select
                      value={exp.category}
                      onChange={(e) => handleUpdateExpense(idx, 'category', e.target.value)}
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
                      value={exp.amount}
                      onChange={(e) => handleUpdateExpense(idx, 'amount', e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full pl-6 pr-3 py-2 rounded-lg glass-input text-xs"
                      min="0"
                      required
                    />
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(idx)}
                    className="p-2 rounded-lg hover:bg-white/5 text-[#D1495B] hover:text-[#e46475] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <button
              type="button"
              onClick={handleAddExpense}
              className="btn-outline-premium px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1.5 justify-center w-full mt-2 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Expense Item
            </button>
          </div>

          {/* Dynamic Total Outflow */}
          <div className="border-t border-white/5 pt-5 flex justify-between items-center">
            <div className="text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">Total Outflow</span>
              <span className="text-xs text-white/50">For {month} {year}</span>
            </div>
            <span className="text-xl font-extrabold text-[#59CFFF] text-glow-sky">
              ₹{totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-outline-premium flex-1 py-3 rounded-xl text-xs font-bold transition-all"
            >
              Back to Dashboard
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
