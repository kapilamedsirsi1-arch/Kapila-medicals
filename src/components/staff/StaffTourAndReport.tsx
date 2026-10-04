import React from 'react';
import {
  Compass,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  ShoppingBag,
  IndianRupee,
  Receipt,
  Navigation,
  ArrowLeft,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { User, Staff, TourPlan, Party } from '../../types';
import { db } from '../../services/db';

interface StaffTourAndReportProps {
  currentUser: User;
  onBack: () => void;
  onNavigateTab: (tab: string) => void;
}

export const StaffTourAndReport: React.FC<StaffTourAndReportProps> = ({
  currentUser,
  onBack,
  onNavigateTab,
}) => {
  const staff = db.getStaff().find((s) => s.userId === currentUser.id) || db.getStaff()[0];
  const parties = db.getParties();
  const tours = db.getTours().filter((t) => t.staffId === staff.id);
  const activeTour = tours[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const attendance = db.getAttendance().find((a) => a.staffId === staff.id && a.date === todayStr);

  const todayOrders = db.getOrders().filter((o) => o.staffId === staff.id && o.date === todayStr);
  const todayPayments = db.getPayments().filter((p) => p.staffId === staff.id && p.date === todayStr);
  const todayExpenses = db.getExpenses().filter((e) => e.staffId === staff.id && e.date === todayStr);
  const todayVisits = db.getVisits().filter((v) => v.staffId === staff.id && v.date === todayStr);

  const offlineQueue = db.getOfflineQueue();

  const handleSync = () => {
    const syncedCount = db.syncOfflineQueue(currentUser);
    alert(`Successfully synchronized ${syncedCount} offline record(s) to centralized database!`);
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
          <h2 className="text-base font-bold text-slate-900">Today's Tour & Performance</h2>
          <p className="text-[11px] text-slate-500">{staff.fullName} ({staff.employeeCode})</p>
        </div>
      </div>

      {/* Offline Queue Notice */}
      {offlineQueue.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-amber-900 block">Offline Queue Active</span>
            <span className="text-xs text-amber-700">
              {offlineQueue.length} records saved locally awaiting sync.
            </span>
          </div>
          <button
            onClick={handleSync}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Cloud</span>
          </button>
        </div>
      )}

      {/* Assigned Tour Route Card */}
      {activeTour && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                  Assigned Route Tour
                </span>
                <h3 className="font-bold text-sm text-slate-900">{activeTour.routeName}</h3>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              {activeTour.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Target Booking</span>
              <span className="font-bold text-slate-800 text-sm">
                ₹{activeTour.targetAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Achieved Booking</span>
              <span className="font-bold text-emerald-700 text-sm">
                ₹{activeTour.achievedAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Assigned Parties Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Today's Tour Chemist Stops ({activeTour.partyIds.length})
            </h4>
            <div className="space-y-2">
              {activeTour.partyIds.map((pId, idx) => {
                const party = parties.find((p) => p.id === pId);
                const visited = todayVisits.some((v) => v.partyId === pId);
                if (!party) return null;

                return (
                  <div
                    key={pId}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                      visited ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{party.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {party.area}, Sirsi • Outst: ₹{party.currentOutstanding.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {visited ? (
                        <span className="flex items-center space-x-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${party.gpsLatitude},${party.gpsLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-sky-700 rounded-lg border border-slate-200 font-semibold flex items-center space-x-1 shadow-2xs"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Nav</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Attendance & Shift Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Attendance & Shift Time</span>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {attendance ? attendance.status : 'Not Started'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <span className="text-slate-400 block text-[10px]">Start Day Punch</span>
            <span className="font-semibold text-slate-800">{attendance?.startDayTime || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">End Day Punch</span>
            <span className="font-semibold text-slate-800">{attendance?.endDayTime || 'Ongoing'}</span>
          </div>
        </div>
      </div>

      {/* Today's Chronological Ledger */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
          Today's Field Activity Feed
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {todayVisits.map((v) => (
            <div key={v.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Visit: {v.partyName}</p>
                  <p className="text-[11px] text-slate-500">{v.purpose} • {v.time}</p>
                </div>
              </div>
              <span className="text-[11px] text-sky-600 font-semibold">{v.distanceMeters}m away</span>
            </div>
          ))}

          {todayOrders.map((o) => (
            <div key={o.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Order: {o.partyName}</p>
                  <p className="text-[11px] text-slate-500">{o.orderNumber} • {o.items.length} items</p>
                </div>
              </div>
              <span className="font-bold text-indigo-700">₹{o.grandTotal.toLocaleString('en-IN')}</span>
            </div>
          ))}

          {todayPayments.map((p) => (
            <div key={p.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Payment: {p.partyName}</p>
                  <p className="text-[11px] text-slate-500">{p.mode} • #{p.receiptNumber}</p>
                </div>
              </div>
              <span className="font-bold text-emerald-700">₹{p.amount.toLocaleString('en-IN')}</span>
            </div>
          ))}

          {todayExpenses.map((e) => (
            <div key={e.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Expense: {e.category}</p>
                  <p className="text-[11px] text-slate-500">{e.location}</p>
                </div>
              </div>
              <span className="font-bold text-amber-700">₹{e.amount}</span>
            </div>
          ))}

          {todayVisits.length === 0 && todayOrders.length === 0 && todayPayments.length === 0 && (
            <p className="py-4 text-center text-slate-400 text-xs">No entries recorded yet today.</p>
          )}
        </div>
      </div>
    </div>
  );
};
