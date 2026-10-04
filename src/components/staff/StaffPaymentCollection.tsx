import React, { useState } from 'react';
import {
  IndianRupee,
  CreditCard,
  Camera,
  CheckCircle,
  FileText,
  Printer,
  Share2,
  ArrowLeft,
  Building,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { Party, Payment, PaymentMode, User, Staff } from '../../types';
import { db } from '../../services/db';
import { generatePaymentReceiptPdf } from '../../services/exportService';
import { PhotoCaptureModal } from '../common/PhotoCaptureModal';

interface StaffPaymentCollectionProps {
  currentUser: User;
  preSelectedParty?: Party | null;
  onBack: () => void;
}

export const StaffPaymentCollection: React.FC<StaffPaymentCollectionProps> = ({
  currentUser,
  preSelectedParty,
  onBack,
}) => {
  const staff = db.getStaff().find((s) => s.userId === currentUser.id) || db.getStaff()[0];
  const parties = db.getParties();

  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    preSelectedParty ? preSelectedParty.id : parties[0]?.id || ''
  );
  const [mode, setMode] = useState<PaymentMode>('CASH');
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  // Cheque Fields
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('Karnataka Bank Ltd, Sirsi');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequePhotoUrl, setChequePhotoUrl] = useState('');

  // UPI Fields
  const [transactionId, setTransactionId] = useState('');

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<Payment | null>(null);

  const selectedParty = parties.find((p) => p.id === selectedPartyId);
  const numericAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;

    if (numericAmount <= 0) {
      alert('Payment could not be saved because the amount is missing or invalid.');
      return;
    }

    if (mode === 'CHEQUE' && !chequeNumber.trim()) {
      alert('Please enter the 6-digit cheque number.');
      return;
    }

    const receiptNumber = `KMA-RCP-${Math.floor(1000 + Math.random() * 9000)}`;
    const outstandingBefore = selectedParty.currentOutstanding;
    const outstandingAfter = Math.max(0, outstandingBefore - numericAmount);

    const newPayment: Payment = {
      id: 'pay-' + Date.now(),
      receiptNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      staffId: staff.id,
      staffName: staff.fullName,
      amount: numericAmount,
      mode,
      outstandingBefore,
      outstandingAfter,
      remarks: remarks || undefined,
      status: 'verified',
      chequeDetails:
        mode === 'CHEQUE'
          ? {
              chequeNumber,
              bankName,
              chequeDate,
              chequePhotoUrl: chequePhotoUrl || undefined,
              status: 'Received',
            }
          : undefined,
      upiDetails:
        mode === 'UPI' || mode === 'BANK_TRANSFER'
          ? {
              transactionId: transactionId || 'UPI-' + Date.now(),
            }
          : undefined,
      createdAt: new Date().toISOString(),
    };

    db.addPayment(newPayment, currentUser);
    setGeneratedReceipt(newPayment);
  };

  if (generatedReceipt) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4 text-center">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-9 h-9" />
          </div>
          <span className="text-xs uppercase font-bold text-emerald-600 tracking-wider">Payment Received</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{generatedReceipt.receiptNumber}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Received from <strong className="text-slate-800">{generatedReceipt.partyName}</strong>
          </p>

          <div className="mt-4 p-4 bg-slate-50 rounded-xl text-left text-xs space-y-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-900">{generatedReceipt.mode}</span>
            </div>
            {generatedReceipt.chequeDetails && (
              <div className="flex justify-between">
                <span className="text-slate-500">Cheque Info:</span>
                <span className="font-semibold">
                  #{generatedReceipt.chequeDetails.chequeNumber} ({generatedReceipt.chequeDetails.bankName})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-emerald-700 text-sm">
                ₹{generatedReceipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="text-slate-500">Previous Outstanding:</span>
              <span>₹{generatedReceipt.outstandingBefore.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>New Balance Outstanding:</span>
              <span className="text-rose-600">₹{generatedReceipt.outstandingAfter.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions: Download PDF, Print, Share */}
          <div className="mt-6 flex flex-col space-y-2">
            <button
              onClick={() => generatePaymentReceiptPdf(generatedReceipt)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow"
            >
              <FileText className="w-4 h-4" />
              <span>Download Official Receipt PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Payment Slip</span>
            </button>

            <button
              onClick={() => {
                setGeneratedReceipt(null);
                setAmount('');
                setChequeNumber('');
                setRemarks('');
              }}
              className="w-full py-2 text-xs font-semibold text-sky-600 hover:text-sky-800"
            >
              Collect Another Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-right">
          <h2 className="text-base font-bold text-slate-900">Collect Payment</h2>
          <p className="text-[11px] text-slate-500">Cash • Cheque • UPI / Transfer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Party Selector Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Chemist / Party *
          </label>
          <select
            value={selectedPartyId}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            className="w-full px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50"
          >
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.area}, {p.city})
              </option>
            ))}
          </select>

          {selectedParty && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between mt-2">
              <div>
                <span className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider block">
                  Current Balance Outstanding
                </span>
                <span className="text-base font-bold text-rose-700">
                  ₹{selectedParty.currentOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(selectedParty.currentOutstanding))}
                className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-300 shadow-xs"
              >
                Clear Full
              </button>
            </div>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Payment Mode *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['CASH', 'CHEQUE', 'UPI'] as PaymentMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  mode === m
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{m}</span>
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Collected (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in Rupees"
                className="w-full pl-8 pr-4 py-2.5 text-base font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cheque Specific Fields */}
          {mode === 'CHEQUE' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cheque Number *</label>
                  <input
                    type="text"
                    required
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="6-digit cheque #"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cheque Date *</label>
                  <input
                    type="date"
                    required
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name & Branch</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Karnataka Bank Sirsi / SBI Sirsi"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Take Cheque Photo Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Photo of Cheque *</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
                  >
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>{chequePhotoUrl ? 'Retake Cheque Photo' : 'Take Cheque Photo'}</span>
                  </button>
                  {chequePhotoUrl && (
                    <div className="w-12 h-8 rounded-lg overflow-hidden border border-slate-300 shadow-xs">
                      <img src={chequePhotoUrl} alt="Cheque" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* UPI Specific Fields */}
          {(mode === 'UPI' || mode === 'BANK_TRANSFER') && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UPI / UTR Transaction ID</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI/123456789012 or NEFT ref"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. On-account payment / Against invoice INV-102"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>GENERATE PAYMENT RECEIPT (₹{numericAmount.toLocaleString('en-IN')})</span>
        </button>
      </form>

      <PhotoCaptureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onCapture={(data) => setChequePhotoUrl(data)}
        title="Photograph Cheque"
        subtitle="Capture clear image of the front of the signed cheque"
      />
    </div>
  );
};
