import React, { useState } from 'react';
import {
  Camera,
  Sparkles,
  CheckCircle,
  Receipt,
  ArrowLeft,
  MapPin,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Expense, ExpenseCategory, User, Staff } from '../../types';
import { db } from '../../services/db';
import { scanBillOcr } from '../../services/geminiClient';
import { PhotoCaptureModal } from '../common/PhotoCaptureModal';

interface StaffExpenseEntryProps {
  currentUser: User;
  onBack: () => void;
}

export const StaffExpenseEntry: React.FC<StaffExpenseEntryProps> = ({ currentUser, onBack }) => {
  const staff = db.getStaff().find((s) => s.userId === currentUser.id) || db.getStaff()[0];

  const [category, setCategory] = useState<ExpenseCategory>('Fuel');
  const [amount, setAmount] = useState<string>('');
  const [gstAmount, setGstAmount] = useState<string>('0');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Sirsi Town Area');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [billNumber, setBillNumber] = useState('');
  const [billPhotoUrl, setBillPhotoUrl] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [isAiExtracted, setIsAiExtracted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handlePhotoCaptured = async (base64Image: string) => {
    setBillPhotoUrl(base64Image);
    // Run AI OCR
    setIsScanningOcr(true);
    try {
      const result = await scanBillOcr(base64Image);
      if (result) {
        if (result.amount) setAmount(String(result.amount));
        if (result.gst) setGstAmount(String(result.gst));
        if (result.date) setDate(result.date);
        if (result.billNumber) setBillNumber(result.billNumber);
        if (result.category && categories.includes(result.category as any)) {
          setCategory(result.category as ExpenseCategory);
        }
        if (result.vendorName) {
          setDescription(`${result.vendorName}${result.notes ? ' - ' + result.notes : ''}`);
        }
        setIsAiExtracted(true);
      }
    } catch (e) {
      console.warn('AI OCR error:', e);
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const newExpense: Expense = {
      id: 'exp-' + Date.now(),
      staffId: staff.id,
      staffName: staff.fullName,
      date,
      category,
      amount: numericAmount,
      gstAmount: parseFloat(gstAmount) || 0,
      location,
      description: description || `${category} during field tour`,
      paymentMode,
      billNumber: billNumber || undefined,
      billPhotoUrl: billPhotoUrl || undefined,
      isAiExtracted,
      status: 'Pending Approval',
      createdAt: new Date().toISOString(),
    };

    db.addExpense(newExpense, currentUser);
    setSuccessMessage(`Expense of ₹${numericAmount} for ${category} submitted to Admin Approval queue!`);
  };

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
          <h2 className="text-base font-bold text-slate-900">Add Staff Expense</h2>
          <p className="text-[11px] text-slate-500">Camera Bill Photo • AI OCR Autofill</p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => {
              setSuccessMessage(null);
              setAmount('');
              setDescription('');
              setBillPhotoUrl('');
              setIsAiExtracted(false);
            }}
            className="text-xs bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded-lg"
          >
            Add Another
          </button>
        </div>
      )}

      {/* Hero Bill Camera Card with AI OCR */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-4 text-white shadow-md border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-500 rounded-xl text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Photograph Expense Bill</h3>
              <p className="text-[11px] text-slate-300">Fuel slip, bus ticket, hotel receipt or restaurant bill</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPhotoModal(true)}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow active:scale-95 transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{billPhotoUrl ? 'Change' : 'Snap Photo'}</span>
          </button>
        </div>

        {/* OCR Scanning Status Banner */}
        {isScanningOcr && (
          <div className="mt-3 p-2.5 bg-sky-900/60 rounded-xl border border-sky-700/60 flex items-center space-x-2 text-xs text-sky-200 animate-pulse">
            <Sparkles className="w-4 h-4 text-sky-300" />
            <span>Gemini AI is reading receipt text, amount, date & vendor...</span>
          </div>
        )}

        {isAiExtracted && !isScanningOcr && (
          <div className="mt-3 p-2 bg-emerald-950/60 rounded-xl border border-emerald-700/60 flex items-center justify-between text-xs text-emerald-200">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Extracted Details Applied! Review values below.</span>
            </span>
            <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded font-mono">Verified OCR</span>
          </div>
        )}

        {/* Thumbnail Preview */}
        {billPhotoUrl && (
          <div className="mt-3 flex items-center space-x-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-black flex-shrink-0">
              <img src={billPhotoUrl} alt="Bill" className="w-full h-full object-cover" />
            </div>
            <div className="text-xs text-slate-300">
              <p className="font-semibold text-white">Bill Image Attached</p>
              <p className="text-[11px] text-slate-400">Attached to claim for Admin approval</p>
            </div>
          </div>
        )}
      </div>

      {/* Expense Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
        {/* Category Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Expense Category *
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition text-center ${
                  category === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 text-base font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bill Number & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bill / Ticket Number</label>
            <input
              type="text"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              placeholder="e.g. IOC-98124 or Ticket #"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Route Area</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sirsi Town / Siddapur Route"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Vendor Name</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Hero Splendor petrol at Indian Oil, Hubli Road Sirsi"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Payment mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Via</label>
          <div className="flex space-x-3 text-xs">
            {(['Cash', 'UPI', 'Card'] as const).map((m) => (
              <label key={m} className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="payMode"
                  checked={paymentMode === m}
                  onChange={() => setPaymentMode(m)}
                  className="text-sky-600"
                />
                <span className="font-semibold text-slate-700">{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>SUBMIT EXPENSE CLAIM (₹{parseFloat(amount || '0').toFixed(2)})</span>
        </button>
      </form>

      <PhotoCaptureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onCapture={handlePhotoCaptured}
        title="Photograph Expense Bill"
        subtitle="Ensure bill amount, date, and vendor name are legible"
      />
    </div>
  );
};
