import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Receipt,
  Users,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Store,
  Building,
  Package,
  Calendar,
  Filter,
  CreditCard,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../../services/db';
import { fetchAiInsights, BusinessInsight } from '../../services/geminiClient';
import { User } from '../../types';

interface AdminDashboardProps {
  currentUser: User;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigateTab }) => {
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'fy'>('today');
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const parties = db.getParties();
  const products = db.getProducts();
  const orders = db.getOrders();
  const payments = db.getPayments();
  const expenses = db.getExpenses();
  const visits = db.getVisits();
  const staff = db.getStaff();

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's metrics
  const todayOrders = orders.filter((o) => o.date === todayStr);
  const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const todayPayments = payments.filter((p) => p.date === todayStr);
  const todayCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  const todayCash = todayPayments.filter((p) => p.mode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const todayCheque = todayPayments.filter((p) => p.mode === 'CHEQUE').reduce((sum, p) => sum + p.amount, 0);
  const todayUpi = todayPayments.filter((p) => p.mode === 'UPI' || p.mode === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0);

  const todayExpenses = expenses.filter((e) => e.date === todayStr);
  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayVisits = visits.filter((v) => v.date === todayStr);

  // Critical Alerts
  const overdueParties = parties.filter((p) => p.currentOutstanding > 50000);
  const lowStockProducts = products.filter((p) => p.stock <= p.reorderLevel);
  const pendingExpenses = expenses.filter((e) => e.status === 'Pending Approval');
  const pendingOrders = orders.filter((o) => o.status === 'Submitted' || o.status === 'Admin Review');
  const pendingStaff = staff.filter((s) => s.status === 'pending_approval');
  const chequesPendingClearance = payments.filter(
    (p) => p.mode === 'CHEQUE' && p.chequeDetails && p.chequeDetails.status !== 'Cleared'
  );

  // Month Metrics
  const totalOutstanding = parties.reduce((sum, p) => sum + p.currentOutstanding, 0);
  const monthSales = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const monthCollection = payments.reduce((sum, p) => sum + p.amount, 0);

  // Fetch AI Insights on mount
  useEffect(() => {
    let isMounted = true;
    const loadInsights = async () => {
      setLoadingInsights(true);
      const res = await fetchAiInsights({
        totalSales: monthSales,
        totalCollection: monthCollection,
        totalOutstanding,
        overdueCount: overdueParties.length,
        lowStockCount: lowStockProducts.length,
        pendingExpenseCount: pendingExpenses.length,
      });
      if (isMounted) {
        setInsights(res);
        setLoadingInsights(false);
      }
    };
    loadInsights();
    return () => {
      isMounted = false;
    };
  }, [monthSales, monthCollection, totalOutstanding]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Financial Year & Quick Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Operational Dashboard • Sirsi Head Office
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kapila Medical Agencies ERP
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Court Road, Sirsi – 581401 • Wholesale Pharma & Hospital Distribution
          </p>
        </div>

        {/* Financial Year & Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Indian FY Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">FY:</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="2026-2027">2026–2027 (1 Apr - 31 Mar)</option>
              <option value="2025-2026">2025–2026</option>
            </select>
          </div>

          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {(['today', 'this_week', 'this_month', 'fy'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1 rounded-lg transition capitalize ${
                  dateFilter === period
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {period.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Morning Business Insights (Section 32) */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-sky-800/40 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/30 flex items-center justify-center border border-sky-400/40">
              <Sparkles className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Automated AI Business Insights</h3>
              <p className="text-[11px] text-sky-200">Daily Morning Operations & Cashflow Summary</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('ai_assistant')}
            className="text-xs bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition"
          >
            <span>Ask AI Assistant</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 transition text-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white text-xs">{item.title}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-200 border border-sky-400/30">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Primary KPI Cards (Section 23 & 53) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sales */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 hover:border-sky-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sales</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ₹{todaySales.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-indigo-700">{todayOrders.length} Orders Booked</span>
              <span>• Avg: ₹{todayOrders.length ? Math.round(todaySales / todayOrders.length) : 0}</span>
            </div>
          </div>
        </div>

        {/* Collection */}
        <div
          onClick={() => onNavigateTab('collections')}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Collection</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
              ₹{todayCollection.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500 truncate">
              <span>Cash: ₹{todayCash}</span>
              <span>• Cheque: ₹{todayCheque}</span>
              <span>• UPI: ₹{todayUpi}</span>
            </div>
          </div>
        </div>

        {/* Total Outstanding */}
        <div
          onClick={() => onNavigateTab('parties')}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Outstanding</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
              ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <div className="flex items-center space-x-2 mt-1 text-xs text-rose-600">
              <span className="font-semibold">{overdueParties.length} Overdue Accounts</span>
              <span>• 30d Limit</span>
            </div>
          </div>
        </div>

        {/* Field Visits */}
        <div
          onClick={() => onNavigateTab('gps_tracking')}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 hover:border-sky-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Field Visits</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {todayVisits.length} Visits
            </span>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">2 Active Tour Boys</span>
              <span>• Sirsi & Siddapur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Approval & System Action Center (Section 33 & 53) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Approvals Action Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Pending Approvals</span>
            </h3>
            <button
              onClick={() => onNavigateTab('approval_centre')}
              className="text-xs text-sky-600 hover:text-sky-800 font-bold"
            >
              Open Centre →
            </button>
          </div>

          <div className="space-y-2.5">
            <div
              onClick={() => onNavigateTab('approval_centre', { tab: 'expenses' })}
              className="p-3 bg-amber-50/60 hover:bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between cursor-pointer transition text-xs"
            >
              <div>
                <span className="font-bold text-amber-900 block">Staff Expense Claims</span>
                <span className="text-slate-500">Fuel & bus tickets waiting approval</span>
              </div>
              <span className="px-2.5 py-1 bg-amber-500 text-white font-bold rounded-lg text-xs shadow-2xs">
                {pendingExpenses.length} Pending
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('approval_centre', { tab: 'orders' })}
              className="p-3 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center justify-between cursor-pointer transition text-xs"
            >
              <div>
                <span className="font-bold text-indigo-900 block">Orders Awaiting Review</span>
                <span className="text-slate-500">Verify stock & credit release</span>
              </div>
              <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-xs shadow-2xs">
                {pendingOrders.length} Pending
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('approval_centre', { tab: 'staff' })}
              className="p-3 bg-sky-50/60 hover:bg-sky-50 border border-sky-200/80 rounded-xl flex items-center justify-between cursor-pointer transition text-xs"
            >
              <div>
                <span className="font-bold text-sky-900 block">New Staff KYC Profiles</span>
                <span className="text-slate-500">Employee activation verification</span>
              </div>
              <span className="px-2.5 py-1 bg-sky-600 text-white font-bold rounded-lg text-xs shadow-2xs">
                {pendingStaff.length} New
              </span>
            </div>
          </div>
        </div>

        {/* Operational Alerts Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Operational Alerts</span>
            </h3>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Attention Required
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigateTab('products')}
                className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-rose-50 transition"
              >
                <div>
                  <span className="font-bold text-rose-900 block">{p.name}</span>
                  <span className="text-slate-500">{p.companyName} • Pack: {p.packSize}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-700 block">{p.stock} Units Left</span>
                  <span className="text-[10px] text-slate-400">Reorder: {p.reorderLevel}</span>
                </div>
              </div>
            ))}

            {chequesPendingClearance.map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigateTab('collections')}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
              >
                <div>
                  <span className="font-bold text-slate-800 block">
                    Cheque #{c.chequeDetails?.chequeNumber} ({c.chequeDetails?.bankName})
                  </span>
                  <span className="text-slate-500">{c.partyName}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">₹{c.amount.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-semibold text-amber-600">Pending Clearance</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance Ranking (Section 24) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Tour Boy Leaderboard</span>
            </h3>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-sky-600 hover:text-sky-800 font-bold"
            >
              Full Report →
            </button>
          </div>

          <div className="space-y-3">
            {staff.map((s, idx) => {
              const staffOrders = orders.filter((o) => o.staffId === s.id);
              const staffPayments = payments.filter((p) => p.staffId === s.id);
              const totalVal = staffPayments.reduce((sum, p) => sum + p.amount, 0);
              const target = s.monthlyCollectionTarget || 400000;
              const pct = Math.min(100, Math.round((totalVal / target) * 100));

              return (
                <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <img src={s.photoUrl} alt={s.fullName} className="w-8 h-8 rounded-full object-cover border border-sky-300" />
                      <div>
                        <span className="font-bold text-slate-900 block">{s.fullName}</span>
                        <span className="text-[10px] text-slate-500">{s.assignedArea}</span>
                      </div>
                    </div>
                    <span className="font-bold text-sky-700">{pct}%</span>
                  </div>

                  {/* Progress */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Collected: ₹{totalVal.toLocaleString('en-IN')}</span>
                    <span>Target: ₹{target.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
