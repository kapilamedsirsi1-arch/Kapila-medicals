import React, { useState } from 'react';
import {
  IndianRupee,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle,
  Eye,
  Camera,
  AlertCircle,
  RefreshCw,
  Printer,
} from 'lucide-react';
import { Payment, ChequeStatus, User } from '../../types';
import { db } from '../../services/db';
import { exportCollectionsToExcel, generatePaymentReceiptPdf } from '../../services/exportService';

interface CollectionManagementProps {
  currentUser: User;
}

export const CollectionManagement: React.FC<CollectionManagementProps> = ({ currentUser }) => {
  const payments = db.getPayments();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'cheques' | 'cash' | 'upi'>('all');
  const [selectedChequePhoto, setSelectedChequePhoto] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter((p) => p.date === todayStr);

  const cashTotal = payments.filter((p) => p.mode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const chequeTotal = payments.filter((p) => p.mode === 'CHEQUE').reduce((sum, p) => sum + p.amount, 0);
  const upiTotal = payments.filter((p) => p.mode === 'UPI').reduce((sum, p) => sum + p.amount, 0);
  const bankTotal = payments.filter((p) => p.mode === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0);
  const totalCollections = cashTotal + chequeTotal + upiTotal + bankTotal;

  const chequeStatuses: ChequeStatus[] = [
    'Received',
    'Deposited',
    'Cleared',
    'Returned',
    'Replaced',
    'Cancelled',
  ];

  const handleChequeStatusChange = (paymentId: string, status: ChequeStatus) => {
    db.updateChequeStatus(paymentId, status, currentUser);
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(q) ||
      p.partyName.toLowerCase().includes(q) ||
      p.staffName.toLowerCase().includes(q) ||
      p.chequeDetails?.chequeNumber?.includes(q) ||
      p.chequeDetails?.bankName?.toLowerCase().includes(q);

    if (activeTab === 'cheques') return matchesSearch && p.mode === 'CHEQUE';
    if (activeTab === 'cash') return matchesSearch && p.mode === 'CASH';
    if (activeTab === 'upi') return matchesSearch && (p.mode === 'UPI' || p.mode === 'BANK_TRANSFER');
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Treasury & Banking Desk
          </span>
          <h1 className="text-xl font-bold text-slate-900">Cash & Cheque Control Centre</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor tour boy collections, cheque deposits, clearance status, and receipts
          </p>
        </div>

        <button
          onClick={() => exportCollectionsToExcel(payments)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-300"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Collections Excel</span>
        </button>
      </div>

      {/* 5-Metric Collection Breakdown (Section 13) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Collections</span>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            ₹{totalCollections.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">{payments.length} Receipts Issued</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Cash at Counter/Field</span>
          <span className="text-xl font-black text-emerald-700 tracking-tight">
            ₹{cashTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Verified against tour logs</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-sky-600 block">Cheques in Transit</span>
          <span className="text-xl font-black text-sky-700 tracking-tight">
            ₹{chequeTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Subject to realization</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-indigo-600 block">UPI Direct</span>
          <span className="text-xl font-black text-indigo-700 tracking-tight">
            ₹{upiTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Instant QR Settlement</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold uppercase text-purple-600 block">Bank Transfers (NEFT)</span>
          <span className="text-xl font-black text-purple-700 tracking-tight">
            ₹{bankTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Direct Bank Credits</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
          {(['all', 'cheques', 'cash', 'upi'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition capitalize ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'cheques' ? 'Cheques' : tab === 'upi' ? 'UPI / Bank' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search receipt #, party, cheque #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Payments & Cheques Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3.5">Receipt # & Date</th>
                <th className="p-3.5">Chemist / Party</th>
                <th className="p-3.5">Collected By</th>
                <th className="p-3.5">Mode & Details</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Status / Cheque Life Cycle</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold font-mono text-slate-900">
                    <p>{p.receiptNumber}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{p.date} {p.time}</p>
                  </td>

                  <td className="p-3.5 font-semibold text-slate-900">
                    <p>{p.partyName}</p>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Outstanding After: ₹{p.outstandingAfter.toLocaleString('en-IN')}
                    </p>
                  </td>

                  <td className="p-3.5 text-slate-600">{p.staffName}</td>

                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block">{p.mode}</span>
                    {p.chequeDetails ? (
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <span>#{p.chequeDetails.chequeNumber} ({p.chequeDetails.bankName})</span>
                        {p.chequeDetails.chequePhotoUrl && (
                          <button
                            onClick={() => setSelectedChequePhoto(p.chequeDetails?.chequePhotoUrl || null)}
                            className="text-sky-600 hover:text-sky-800"
                            title="Inspect Cheque Photo"
                          >
                            <Camera className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </div>
                    ) : p.upiDetails ? (
                      <span className="font-mono text-[10px] text-slate-400 block">{p.upiDetails.transactionId}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-700">Cash Received at Counter</span>
                    )}
                  </td>

                  <td className="p-3.5 text-right font-black text-sm text-emerald-700">
                    ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="p-3.5 text-center">
                    {p.mode === 'CHEQUE' && p.chequeDetails ? (
                      <select
                        value={p.chequeDetails.status}
                        onChange={(e) => handleChequeStatusChange(p.id, e.target.value as ChequeStatus)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${
                          p.chequeDetails.status === 'Cleared'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : p.chequeDetails.status === 'Returned'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {chequeStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => generatePaymentReceiptPdf(p)}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold flex items-center space-x-1 mx-auto border border-sky-200 transition"
                      title="Download Official PDF Receipt"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cheque Photo Modal */}
      {selectedChequePhoto && (
        <div
          onClick={() => setSelectedChequePhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 p-2">
            <img src={selectedChequePhoto} alt="Cheque" className="max-w-full max-h-[80vh] object-contain mx-auto" />
            <p className="p-2 text-center text-xs text-white">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
};
