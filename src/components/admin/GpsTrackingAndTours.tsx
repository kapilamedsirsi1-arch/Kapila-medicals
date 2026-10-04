import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Plus,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Calendar,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { TourPlan, GpsLog, User, Staff } from '../../types';
import { db } from '../../services/db';
import { FieldStaffRouteMap } from './FieldStaffRouteMap';

interface GpsTrackingAndToursProps {
  currentUser: User;
}

export const GpsTrackingAndTours: React.FC<GpsTrackingAndToursProps> = ({ currentUser }) => {
  const staffList = db.getStaff();
  const parties = db.getParties();
  const tours = db.getTours();
  const visits = db.getVisits();
  const gpsLogs = db.getGpsLogs();
  const attendance = db.getAttendance();

  const [activeTab, setActiveTab] = useState<'map' | 'tours' | 'attendance'>('map');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [showAddTourModal, setShowAddTourModal] = useState(false);

  // New Tour Form state
  const [tourStaffId, setTourStaffId] = useState(staffList[0]?.id || '');
  const [tourDate, setTourDate] = useState(new Date().toISOString().split('T')[0]);
  const [area, setArea] = useState('Sirsi Town & Hubli Road');
  const [routeName, setRouteName] = useState('Route 1: Court Road -> Marikamba Temple -> APMC');
  const [targetAmount, setTargetAmount] = useState('50000');
  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>(['p-1', 'p-2', 'p-3']);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
  const staffVisits = visits.filter((v) => v.staffId === selectedStaffId);

  const handleCreateTour = (e: React.FormEvent) => {
    e.preventDefault();
    const st = staffList.find((s) => s.id === tourStaffId);
    const newTour: TourPlan = {
      id: 'tour-' + Date.now(),
      staffId: tourStaffId,
      staffName: st?.fullName || 'Field Rep',
      date: tourDate,
      area,
      routeName,
      partyIds: selectedPartyIds,
      targetAmount: parseFloat(targetAmount) || 30000,
      achievedAmount: 0,
      visitedPartyIds: [],
      status: 'Planned',
    };

    db.addTour(newTour, currentUser);
    setShowAddTourModal(false);
    alert(`Tour plan "${routeName}" created and dispatched to ${newTour.staffName}!`);
  };

  const togglePartySelection = (pId: string) => {
    setSelectedPartyIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Field Force Automation (FFA)
          </span>
          <h1 className="text-xl font-bold text-slate-900">GPS Live Tracking & Tour Planning</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geofenced visit verification, route plans, and tour boy movement across Sirsi, Siddapur & Yellapur
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddTourModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Tour</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'map'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Live Field Coordinates & Visits</span>
        </button>

        <button
          onClick={() => setActiveTab('tours')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'tours'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Tour Plans ({tours.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'attendance'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Daily Punch & Shift Hours</span>
        </button>
      </div>

      {/* MAP & BREADCRUMBS TAB */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {/* Real Visual Leaflet Route Map Component */}
          <FieldStaffRouteMap
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            onSelectStaffId={setSelectedStaffId}
          />

          {/* Visits & Distance Audit Table (Section 6 & 8) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">
                GPS Geotagged Visit Logs & Geofence Verification
              </h3>
              <span className="text-xs text-slate-500">{staffVisits.length} Visits Logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Party Name</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Person Met</th>
                    <th className="p-3 text-center">Distance from Registered GPS</th>
                    <th className="p-3 text-center">Geofence Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{v.time}</td>
                      <td className="p-3 font-bold text-slate-900">{v.partyName}</td>
                      <td className="p-3 text-slate-600">{v.purpose}</td>
                      <td className="p-3 text-slate-700">{v.personMet}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {v.distanceMeters} meters
                      </td>
                      <td className="p-3 text-center">
                        {v.isFarWarning ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            ⚠️ Over 200m
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✔ Verified On-Site
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TOURS TAB (Section 26) */}
      {activeTab === 'tours' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tours.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                    {t.status}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1">{t.routeName}</h3>
                  <p className="text-xs text-slate-500">{t.area} • Date: {t.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Assigned Tour Boy</span>
                  <span className="font-bold text-slate-800 text-xs">{t.staffName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Target Amount</span>
                  <span className="font-bold text-slate-900">₹{t.targetAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Achieved Booking</span>
                  <span className="font-bold text-emerald-700">₹{t.achievedAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  Scheduled Chemist Stops ({t.partyIds.length}):
                </span>
                <div className="space-y-1 text-xs text-slate-700">
                  {t.partyIds.map((pId) => {
                    const party = parties.find((p) => p.id === pId);
                    return (
                      <p key={pId} className="flex items-center space-x-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        <span className="truncate">{party?.name || pId}</span>
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ATTENDANCE TAB (Section 25) */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">Field Force Shift Attendance Records</h3>
            <span className="text-xs text-slate-500">Punch in via GPS Start Day</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Start Day Punch</th>
                  <th className="p-3">End Day Punch</th>
                  <th className="p-3 text-center">Working Hours</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{att.date}</td>
                    <td className="p-3 font-bold text-slate-900">{att.staffName}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{att.startDayTime}</td>
                    <td className="p-3 text-slate-600">{att.endDayTime || 'Ongoing'}</td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      {att.workingHours || 6} hrs
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSIGN TOUR MODAL */}
      {showAddTourModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 bg-sky-600 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base">Assign Daily Field Tour</h3>
                <p className="text-xs text-sky-100">Route, Chemist stops, and sales targets</p>
              </div>
              <button onClick={() => setShowAddTourModal(false)} className="text-white hover:bg-sky-700 p-1 rounded-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTour} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Tour Boy *</label>
                <select
                  value={tourStaffId}
                  onChange={(e) => setTourStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-semibold"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.assignedArea})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tour Date *</label>
                  <input
                    type="date"
                    required
                    value={tourDate}
                    onChange={(e) => setTourDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Booking (₹) *</label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Route Name & Area *</label>
                <input
                  type="text"
                  required
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g. Sirsi Town -> Siddapur Bazaar Route"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Chemist stops selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Customer Stops ({selectedPartyIds.length} chosen)
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {parties.map((p) => {
                    const isSelected = selectedPartyIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center space-x-2 p-1.5 rounded-lg cursor-pointer ${
                          isSelected ? 'bg-sky-100/70 font-semibold text-sky-900' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePartySelection(p.id)}
                          className="rounded text-sky-600"
                        />
                        <span className="truncate">{p.name} ({p.area})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddTourModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Dispatch Tour Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
