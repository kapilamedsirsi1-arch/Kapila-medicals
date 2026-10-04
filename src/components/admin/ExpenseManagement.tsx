import React, { useState } from 'react';
import {
  Receipt,
  FileSpreadsheet,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Camera,
  Filter,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Expense, ExpenseCategory, User } from '../../types';
import { db } from '../../services/db';
import { exportExpensesToExcel } from '../../services/exportService';

interface ExpenseManagementProps {
  currentUser: User;
}

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ currentUser }) => {
  const expenses = db.getExpenses();
  const staffList = db.getStaff();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedTotal = expenses.filter((e) => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);
  const pendingTotal = expenses.filter((e) => e.status === 'Pending Approval').reduce((sum, e) => sum + e.amount, 0);

  const handleApprove = (id: string) => {
    db.updateExpenseStatus(id, 'Approved', currentUser, 'Authorized by Admin');
  };

  const handleReject = (id: string) => {
    const reason = prompt('Please enter reason for expense rejection:') || 'Receipt missing / invalid claim';
    db.updateExpenseStatus(id, 'Rejected', currentUser, reason);
  };

  const filteredExpenses = expenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.staffName.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      (e.billNumber && e.billNumber.toLowerCase().includes(q));

    const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const categories: ExpenseCategory[] = [
    'Bus',
    'Train',
    'Auto',
    'Taxi',
    'Fuel',
    'Food',
    'Hotel',
    'Parking',
    'Toll',
    'Courier',
    'Printing',
    'Other',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Tour Allowances & Claims
          </span>
          <h1 className="text-xl font-bold text-slate-900">Staff Expense Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit fuel bills, transport tickets, meals, and hotel claims submitted by field representatives
          </p>
        </div>

        <button
          onClick={() => exportExpensesToExcel(expenses)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-300"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Expense Excel</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Claims Submitted</span>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            ₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 block mt-1">{expenses.length} Total Claims</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Approved & Disbursed</span>
          <span className="text-xl font-black text-emerald-700 tracking-tight">
            ₹{approvedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 block mt-1">Credited to staff ledger</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-amber-600 block">Pending Admin Review</span>
          <span className="text-xl font-black text-amber-700 tracking-tight">
            ₹{pendingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 block mt-1">Awaiting verification</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search staff name, description, location, bill #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3.5">Staff & Date</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Description & Location</th>
                <th className="p-3.5">Bill Photo</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{exp.staffName}</p>
                    <p className="text-[10px] text-slate-400">{exp.date}</p>
                  </td>

                  <td className="p-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {exp.category}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <p className="font-semibold text-slate-800">{exp.description}</p>
                    <p className="text-[10px] text-slate-500">
                      📍 {exp.location} {exp.billNumber && `• Bill: ${exp.billNumber}`}
                    </p>
                  </td>

                  <td className="p-3.5">
                    {exp.billPhotoUrl ? (
                      <div
                        onClick={() => setSelectedPhoto(exp.billPhotoUrl || null)}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 cursor-pointer hover:opacity-80 transition relative group"
                        title="Click to zoom bill"
                      >
                        <img src={exp.billPhotoUrl} alt="Bill" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No Photo</span>
                    )}
                  </td>

                  <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                    ₹{exp.amount.toFixed(2)}
                  </td>

                  <td className="p-3.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        exp.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : exp.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    {exp.status === 'Pending Approval' ? (
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleApprove(exp.id)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs"
                          title="Approve Expense"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReject(exp.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg"
                          title="Reject Expense"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Photo Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 p-2">
            <img src={selectedPhoto} alt="Bill" className="max-w-full max-h-[80vh] object-contain mx-auto" />
            <p className="p-2 text-center text-xs text-white">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
};
