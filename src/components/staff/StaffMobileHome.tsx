import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Users,
  ShoppingCart,
  IndianRupee,
  Receipt,
  Camera,
  CalendarCheck,
  TrendingUp,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { User, Staff, AttendanceRecord, GpsLog } from '../../types';
import { db } from '../../services/db';

interface StaffMobileHomeProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onTriggerBillUpload: () => void;
}

export const StaffMobileHome: React.FC<StaffMobileHomeProps> = ({
  currentUser,
  onNavigateTab,
  onTriggerBillUpload,
}) => {
  const staff = db.getStaff().find((s) => s.userId === currentUser.id) || db.getStaff()[0];
  const attendanceList = db.getAttendance();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceList.find((a) => a.staffId === staff.id && a.date === todayStr);

  const [dayStarted, setDayStarted] = useState(Boolean(todayAttendance));
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'active' | 'denied'>('idle');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState<string>('');

  // Orders, payments, expenses, visits for this staff today
  const allOrders = db.getOrders().filter((o) => o.staffId === staff.id && o.date === todayStr);
  const allPayments = db.getPayments().filter((p) => p.staffId === staff.id && p.date === todayStr);
  const allExpenses = db.getExpenses().filter((e) => e.staffId === staff.id && e.date === todayStr);
  const allVisits = db.getVisits().filter((v) => v.staffId === staff.id && v.date === todayStr);

  const totalOrdersAmount = allOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const cashCollected = allPayments.filter((p) => p.mode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const chequeCollected = allPayments.filter((p) => p.mode === 'CHEQUE').reduce((sum, p) => sum + p.amount, 0);
  const upiCollected = allPayments.filter((p) => p.mode === 'UPI' || p.mode === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Check target achievement
  const collectionTarget = staff.monthlyCollectionTarget || 450000;
  const monthPayments = db.getPayments().filter((p) => p.staffId === staff.id).reduce((sum, p) => sum + p.amount, 0);
  const achievementPercent = Math.min(100, Math.round((monthPayments / collectionTarget) * 100));

  const handleStartDay = () => {
    setGpsStatus('locating');
    setLocationMessage('Requesting GPS satellite fix...');

    if (!navigator.geolocation) {
      setGpsStatus('denied');
      setLocationMessage('GPS not supported on device. Manual attendance logged.');
      logStartAttendance(14.6192, 74.8354, 15);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setCurrentCoords({ lat, lng, acc });
        setGpsStatus('active');
        setLocationMessage(`GPS Active (±${acc}m accuracy)`);
        logStartAttendance(lat, lng, acc);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setGpsStatus('active');
        setLocationMessage('GPS permission restricted. Default Sirsi Head Office logged.');
        logStartAttendance(14.6192, 74.8354, 20);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const logStartAttendance = (lat: number, lng: number, acc: number) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      staffId: staff.id,
      staffName: staff.fullName,
      date: todayStr,
      startDayTime: timeStr,
      startDayGps: { lat, lng },
      status: 'Present',
      workingHours: 1,
    };
    db.markAttendance(record);

    const log: GpsLog = {
      id: 'gps-' + Date.now(),
      staffId: staff.id,
      staffName: staff.fullName,
      timestamp: new Date().toISOString(),
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      activity: 'start_day',
      address: 'Field Start Day - Sirsi HQ',
    };
    db.addGpsLog(log);
    setDayStarted(true);
  };

  const handleEndDay = () => {
    if (confirm('Are you sure you want to END your field day? This will stamp your closing time and GPS location.')) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (todayAttendance) {
        todayAttendance.endDayTime = timeStr;
        todayAttendance.workingHours = 8;
        db.markAttendance(todayAttendance);
      }
      setDayStarted(false);
      alert(`Field day ended at ${timeStr}. Great work today!`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-3 sm:p-4 space-y-4 pb-20">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-4 text-white shadow-lg border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={staff.photoUrl}
              alt={staff.fullName}
              className="w-12 h-12 rounded-full border-2 border-sky-400 object-cover"
            />
            <div>
              <span className="text-[11px] text-sky-400 font-semibold uppercase tracking-wider">
                Field Tour Boy • {staff.employeeCode}
              </span>
              <h2 className="text-base font-bold">{staff.fullName}</h2>
              <p className="text-xs text-slate-300 truncate max-w-[200px]">{staff.assignedArea}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-sky-900/80 text-sky-200 px-2 py-0.5 rounded font-mono border border-sky-700">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Start Day / End Day Action Hero */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${dayStarted ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-xs font-medium text-slate-300">
              {dayStarted ? `Day Active (${todayAttendance?.startDayTime || 'Morning'})` : 'Day Not Started'}
            </span>
          </div>

          {!dayStarted ? (
            <button
              onClick={handleStartDay}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md active:scale-95 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>START DAY (GPS)</span>
            </button>
          ) : (
            <button
              onClick={handleEndDay}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1 shadow-md active:scale-95 transition"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>END DAY</span>
            </button>
          )}
        </div>

        {locationMessage && (
          <p className="text-[11px] text-sky-300 mt-2 bg-sky-950/60 p-1.5 rounded-lg border border-sky-800/40">
            📍 {locationMessage}
          </p>
        )}
      </div>

      {/* Primary Big Touch Actions (Section 5 & 36) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigateTab('visits')}
          className="bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white p-4 rounded-2xl shadow-md text-left flex flex-col justify-between transition group h-28"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-sky-700/80 rounded-xl group-hover:scale-105 transition">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-bold bg-sky-500/60 px-2 py-0.5 rounded-full">
              {allVisits.length} Done
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">PARTY VISITS</h3>
            <p className="text-[11px] text-sky-100 mt-0.5">Assigned shops & routes</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('book_order')}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white p-4 rounded-2xl shadow-md text-left flex flex-col justify-between transition group h-28"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-700/80 rounded-xl group-hover:scale-105 transition">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-bold bg-indigo-500/60 px-2 py-0.5 rounded-full">
              {allOrders.length} Booked
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">BOOK ORDER</h3>
            <p className="text-[11px] text-indigo-100 mt-0.5">Pharma items & scheme</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('collect_payment')}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white p-4 rounded-2xl shadow-md text-left flex flex-col justify-between transition group h-28"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-700/80 rounded-xl group-hover:scale-105 transition">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-bold bg-emerald-500/60 px-2 py-0.5 rounded-full">
              ₹{(totalCollected / 1000).toFixed(0)}k
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">COLLECT PAYMENT</h3>
            <p className="text-[11px] text-emerald-100 mt-0.5">Cash / Cheque / UPI</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('add_expense')}
          className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white p-4 rounded-2xl shadow-md text-left flex flex-col justify-between transition group h-28"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-700/80 rounded-xl group-hover:scale-105 transition">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-bold bg-amber-500/60 px-2 py-0.5 rounded-full">
              ₹{totalExpenses}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">ADD EXPENSE</h3>
            <p className="text-[11px] text-amber-100 mt-0.5">Fuel, bus, food tickets</p>
          </div>
        </button>
      </div>

      {/* Secondary Fast Tools: Upload Bill & Tour Report */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onTriggerBillUpload}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl shadow-xs flex items-center space-x-3 transition active:bg-slate-100 text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold">UPLOAD BILL</h4>
            <p className="text-[10px] text-slate-500">AI Bill OCR Reader</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('tour_report')}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl shadow-xs flex items-center space-x-3 transition active:bg-slate-100 text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold">TODAY'S REPORT</h4>
            <p className="text-[10px] text-slate-500">GPS & tour summary</p>
          </div>
        </button>
      </div>

      {/* Today's Live Metric Summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Today's Field Activity</h3>
          <span className="text-xs font-bold text-sky-600">Sirsi Route</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Orders Booked</span>
            <span className="text-sm font-bold text-indigo-700">₹{totalOrdersAmount.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 block">{allOrders.length} orders</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Collections</span>
            <span className="text-sm font-bold text-emerald-700">₹{totalCollected.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 block">{allPayments.length} receipts</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Visits Completed</span>
            <span className="text-sm font-bold text-sky-700">{allVisits.length}</span>
            <span className="text-[10px] text-slate-400 block">Shops / Doctors</span>
          </div>
        </div>

        {/* Collection Breakdown */}
        {totalCollected > 0 && (
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs flex items-center justify-between">
            <div className="text-emerald-900">
              <span className="font-semibold block">Collection Breakdown:</span>
              <span className="text-[11px] text-emerald-700">
                Cash: ₹{cashCollected.toLocaleString('en-IN')} • Cheque: ₹{chequeCollected.toLocaleString('en-IN')} • UPI: ₹{upiCollected.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Target & Performance Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <h4 className="font-bold text-xs text-slate-800">Monthly Target Achievement</h4>
          </div>
          <span className="text-xs font-bold text-sky-600">{achievementPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-sky-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${achievementPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-500 mt-2">
          <span>Collected: ₹{monthPayments.toLocaleString('en-IN')}</span>
          <span>Target: ₹{collectionTarget.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
