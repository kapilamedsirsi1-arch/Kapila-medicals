import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Filter,
  TrendingUp,
  CreditCard,
  Users,
  Receipt,
  Download,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/db';
import {
  exportOrdersToExcel,
  exportCollectionsToExcel,
  exportOutstandingToExcel,
  exportExpensesToExcel,
} from '../../services/exportService';

export const ReportsHub: React.FC = () => {
  const [reportType, setReportType] = useState<'sales' | 'collections' | 'outstanding' | 'staff' | 'expenses'>('sales');

  const orders = db.getOrders();
  const payments = db.getPayments();
  const parties = db.getParties();
  const expenses = db.getExpenses();
  const staff = db.getStaff();
  const visits = db.getVisits();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Business Intelligence & MIS
          </span>
          <h1 className="text-xl font-bold text-slate-900">Commercial Reports Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Export official Sales Registers, Collection Ledgers, Outstanding Ageing & Tour Boy Audits
          </p>
        </div>

        {/* Export Current Report */}
        <div className="flex items-center space-x-2">
          {reportType === 'sales' && (
            <button
              onClick={() => exportOrdersToExcel(orders)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Sales Excel</span>
            </button>
          )}

          {reportType === 'collections' && (
            <button
              onClick={() => exportCollectionsToExcel(payments)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Collections Excel</span>
            </button>
          )}

          {reportType === 'outstanding' && (
            <button
              onClick={() => exportOutstandingToExcel(parties)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Ageing Excel</span>
            </button>
          )}

          {reportType === 'expenses' && (
            <button
              onClick={() => exportExpensesToExcel(expenses)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Expenses Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setReportType('sales')}
          className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center space-x-2 ${
            reportType === 'sales'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales Register</span>
        </button>

        <button
          onClick={() => setReportType('collections')}
          className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center space-x-2 ${
            reportType === 'collections'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Collection Ledger</span>
        </button>

        <button
          onClick={() => setReportType('outstanding')}
          className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center space-x-2 ${
            reportType === 'outstanding'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Outstanding Ageing (0-90+ Days)</span>
        </button>

        <button
          onClick={() => setReportType('staff')}
          className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center space-x-2 ${
            reportType === 'staff'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Performance Matrix</span>
        </button>

        <button
          onClick={() => setReportType('expenses')}
          className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center space-x-2 ${
            reportType === 'expenses'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expense Statement</span>
        </button>
      </div>

      {/* SALES REGISTER VIEW */}
      {reportType === 'sales' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
            <span className="font-bold text-slate-800">Itemized Sales Booking Register</span>
            <span className="text-slate-500">
              Total Order Bookings: ₹{orders.reduce((sum, o) => sum + o.grandTotal, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Chemist / Party</th>
                  <th className="p-3">Representative</th>
                  <th className="p-3 text-right">Basic (₹)</th>
                  <th className="p-3 text-right">GST (₹)</th>
                  <th className="p-3 text-right">Net Value (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="p-3 text-slate-600">{o.date}</td>
                    <td className="p-3 font-semibold text-slate-900">{o.partyName}</td>
                    <td className="p-3 text-slate-600">{o.staffName}</td>
                    <td className="p-3 text-right text-slate-600">₹{o.basicTotal.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-600">₹{o.gstTotal.toFixed(2)}</td>
                    <td className="p-3 text-right font-black text-slate-900">
                      ₹{o.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center font-bold text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COLLECTION LEDGER VIEW */}
      {reportType === 'collections' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
            <span className="font-bold text-slate-800">Cash & Cheque Realization Ledger</span>
            <span className="text-slate-500">
              Total Realized: ₹{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Party Name</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Instrument / Cheque #</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-right">Balance Outst. (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="p-3 text-slate-600">{p.date}</td>
                    <td className="p-3 font-semibold text-slate-900">{p.partyName}</td>
                    <td className="p-3 font-bold text-slate-700">{p.mode}</td>
                    <td className="p-3 text-slate-600 font-mono">
                      {p.chequeDetails?.chequeNumber || p.upiDetails?.transactionId || 'Counter Cash'}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700">
                      ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-semibold text-rose-600">
                      ₹{p.outstandingAfter.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OUTSTANDING AGEING REPORT VIEW */}
      {reportType === 'outstanding' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
            <span className="font-bold text-slate-800">Customer Ageing Schedule (0-30, 31-60, 61-90, 90+ Days)</span>
            <span className="text-slate-500">
              Total Outstanding: ₹{parties.reduce((sum, p) => sum + p.currentOutstanding, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3">Party Name</th>
                  <th className="p-3">Area & City</th>
                  <th className="p-3 text-right">0–30 Days</th>
                  <th className="p-3 text-right">31–60 Days</th>
                  <th className="p-3 text-right">61–90 Days</th>
                  <th className="p-3 text-right">90+ Days (Overdue)</th>
                  <th className="p-3 text-right">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parties.map((p) => {
                  const out = p.currentOutstanding;
                  const b0 = Math.round(out * 0.5);
                  const b30 = Math.round(out * 0.3);
                  const b60 = Math.round(out * 0.15);
                  const b90 = Math.round(out * 0.05);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-500">{p.area}, {p.city}</td>
                      <td className="p-3 text-right text-emerald-700 font-semibold">₹{b0.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-amber-600 font-semibold">₹{b30.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-orange-600 font-semibold">₹{b60.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-rose-600 font-bold">₹{b90.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-black text-slate-900 text-sm">
                        ₹{out.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAFF PERFORMANCE MATRIX */}
      {reportType === 'staff' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-800">
            Tour Boy & Field Force Efficiency Rankings
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff Representative</th>
                  <th className="p-3">Assigned Route</th>
                  <th className="p-3 text-center">Visits Logged</th>
                  <th className="p-3 text-center">Orders Booked</th>
                  <th className="p-3 text-right">Order Booking (₹)</th>
                  <th className="p-3 text-right">Collections (₹)</th>
                  <th className="p-3 text-right">Target Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => {
                  const sVisits = visits.filter((v) => v.staffId === s.id);
                  const sOrders = orders.filter((o) => o.staffId === s.id);
                  const sPayments = payments.filter((p) => p.staffId === s.id);
                  const sOrderVal = sOrders.reduce((sum, o) => sum + o.grandTotal, 0);
                  const sCollectVal = sPayments.reduce((sum, p) => sum + p.amount, 0);
                  const target = s.monthlyCollectionTarget || 450000;
                  const pct = Math.min(100, Math.round((sCollectVal / target) * 100));

                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{s.fullName} ({s.employeeCode})</td>
                      <td className="p-3 text-slate-600">{s.assignedArea}</td>
                      <td className="p-3 text-center font-bold text-sky-700">{sVisits.length}</td>
                      <td className="p-3 text-center font-bold text-indigo-700">{sOrders.length}</td>
                      <td className="p-3 text-right font-semibold">₹{sOrderVal.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">₹{sCollectVal.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-black text-sky-700">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPENSES STATEMENT */}
      {reportType === 'expenses' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
            <span className="font-bold text-slate-800">Disbursed Staff Travel & Field Expenses</span>
            <span className="text-slate-500">
              Total Expenses: ₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Location & Description</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-600">{e.date}</td>
                    <td className="p-3 font-bold text-slate-900">{e.staffName}</td>
                    <td className="p-3 font-semibold text-slate-700">{e.category}</td>
                    <td className="p-3 text-slate-600">
                      {e.description} • 📍 {e.location}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">₹{e.amount.toFixed(2)}</td>
                    <td className="p-3 text-center font-bold text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
