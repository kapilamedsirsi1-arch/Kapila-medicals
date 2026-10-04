import React, { useState } from 'react';
import {
  Check,
  X,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Receipt,
  ShoppingBag,
  Users,
  Store,
  DollarSign,
  FileText,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { db } from '../../services/db';
import { User, Expense, Order, Staff, Party } from '../../types';

interface ApprovalCentreProps {
  currentUser: User;
  initialTab?: string;
}

export const ApprovalCentre: React.FC<ApprovalCentreProps> = ({ currentUser, initialTab = 'expenses' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const expenses = db.getExpenses();
  const orders = db.getOrders();
  const staffList = db.getStaff();
  const parties = db.getParties();

  const pendingExpenses = expenses.filter((e) => e.status === 'Pending Approval');
  const pendingOrders = orders.filter((o) => o.status === 'Submitted' || o.status === 'Admin Review');
  const pendingStaff = staffList.filter((s) => s.status === 'pending_approval');
  const pendingParties = parties.filter((p) => p.status === 'pending_approval');

  const handleExpenseAction = (expenseId: string, status: 'Approved' | 'Rejected', remarks?: string) => {
    db.updateExpenseStatus(expenseId, status, currentUser, remarks);
    setSelectedItemId(null);
    setActionType(null);
    setCommentText('');
  };

  const handleOrderAction = (orderId: string, status: Order['status'], note?: string) => {
    db.updateOrderStatus(orderId, status, currentUser, note);
    setSelectedItemId(null);
    setActionType(null);
    setCommentText('');
  };

  const handleStaffAction = (staffId: string, status: 'approved' | 'rejected') => {
    db.updateStaffStatus(staffId, status, currentUser);
    setSelectedItemId(null);
    setActionType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Control & Governance
          </span>
          <h1 className="text-xl font-bold text-slate-900">Admin Approval Centre</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and authorize field force claims, orders, customer registrations, and KYC documents
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Expenses ({pendingExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders ({pendingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'staff'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff KYC ({pendingStaff.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('parties')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'parties'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Parties ({pendingParties.length})</span>
          </button>
        </div>
      </div>

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">Pending Field Staff Expense Claims</h3>
            <span className="text-xs text-slate-500">Requires Admin Sign-off for Ledger Entry</span>
          </div>

          {pendingExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-sm font-semibold text-slate-700">All Expenses Processed</p>
              <p className="text-xs text-slate-400 mt-1">There are no pending staff claims requiring approval.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingExpenses.map((exp) => (
                <div key={exp.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start space-x-4">
                    {/* Bill Photo Thumbnail */}
                    {exp.billPhotoUrl ? (
                      <div
                        onClick={() => setSelectedPhoto(exp.billPhotoUrl || null)}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-slate-300 flex-shrink-0 cursor-pointer relative group"
                        title="Click to view full receipt"
                      >
                        <img src={exp.billPhotoUrl} alt="Bill" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 text-xs">
                        No Bill
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{exp.staffName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          {exp.category}
                        </span>
                        {exp.isAiExtracted && (
                          <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                            ✨ AI Read
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                      <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400">
                        <span>Date: {exp.date}</span>
                        <span>•</span>
                        <span>Location: {exp.location}</span>
                        <span>•</span>
                        <span>Bill #: {exp.billNumber || 'N/A'}</span>
                        <span>•</span>
                        <span>Mode: {exp.paymentMode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Claim Amount</span>
                      <span className="text-lg font-black text-slate-900">₹{exp.amount.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExpenseAction(exp.id, 'Approved')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedItemId(exp.id);
                          setActionType('reject');
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">Orders Requiring Review & Credit Authorization</h3>
            <span className="text-xs text-slate-500">Check Stock & Customer Outstanding</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-indigo-500 opacity-60" />
              <p className="text-sm font-semibold text-slate-700">All Orders Approved</p>
              <p className="text-xs text-slate-400 mt-1">No orders pending administrative review.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingOrders.map((ord) => (
                <div key={ord.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{ord.orderNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{ord.partyName}</p>
                    <p className="text-xs text-slate-500">{ord.partyAddress}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Booked by: <strong>{ord.staffName}</strong> on {ord.date} {ord.time} • {ord.items.length} Product Lines
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Grand Total</span>
                      <span className="text-lg font-black text-indigo-700">
                        ₹{ord.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOrderAction(ord.id, 'Approved', 'Approved by Admin for billing & dispatch')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Authorize</span>
                      </button>

                      <button
                        onClick={() => handleOrderAction(ord.id, 'Cancelled', 'Cancelled due to credit limit')}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Hold / Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STAFF KYC TAB */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">New Staff Profiles Pending Activation</h3>
            <span className="text-xs text-slate-500">Verify Bank & Driving Licence</span>
          </div>

          {pendingStaff.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-sky-500 opacity-60" />
              <p className="text-sm font-semibold text-slate-700">No Pending Staff Applications</p>
              <p className="text-xs text-slate-400 mt-1">All tour boys and representatives are activated.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingStaff.map((s) => (
                <div key={s.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-center space-x-4">
                    <img src={s.photoUrl} alt={s.fullName} className="w-14 h-14 rounded-full object-cover border-2 border-sky-400" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{s.fullName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                          {s.employeeCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{s.address}</p>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                        <span>📞 {s.mobile}</span>
                        <span>•</span>
                        <span>Bank A/C: {s.bankAccount} ({s.ifsc})</span>
                        <span>•</span>
                        <span>DL: {s.drivingLicence || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStaffAction(s.id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Activate</span>
                    </button>
                    <button
                      onClick={() => handleStaffAction(s.id, 'rejected')}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PARTIES TAB */}
      {activeTab === 'parties' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-400">
          <Store className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No New Party Registrations Pending</p>
          <p className="text-xs text-slate-400 mt-1">All customer accounts in Sirsi & Siddapur are fully active.</p>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 relative p-2">
            <img src={selectedPhoto} alt="Document" className="max-w-full max-h-[80vh] object-contain mx-auto" />
            <div className="p-2 text-center text-xs text-white">Click anywhere to close</div>
          </div>
        </div>
      )}

      {/* Confirmation & Comment Modal */}
      {selectedItemId && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Confirm Rejection / Correction Request</span>
            </div>
            <p className="text-xs text-slate-600">
              Please enter an explanation for the staff member so they can correct the record or provide adequate bill receipts.
            </p>
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="e.g. Receipt photo is blurry / Petrol bill amount mismatch..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setSelectedItemId(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExpenseAction(selectedItemId, 'Rejected', commentText)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
