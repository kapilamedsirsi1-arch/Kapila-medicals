import React, { useState } from 'react';
import {
  Store,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Navigation,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  CreditCard,
  Building,
  Upload,
  Camera,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';
import { Party, PartyType, User, Staff } from '../../types';
import { db } from '../../services/db';
import { exportOutstandingToExcel } from '../../services/exportService';
import { PhotoCaptureModal } from '../common/PhotoCaptureModal';

interface PartyManagementProps {
  currentUser: User;
}

export const PartyManagement: React.FC<PartyManagementProps> = ({ currentUser }) => {
  const parties = db.getParties();
  const staffList = db.getStaff();
  const orders = db.getOrders();
  const payments = db.getPayments();
  const visits = db.getVisits();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Court Road');
  const [city, setCity] = useState('Sirsi');
  const [pincode, setPincode] = useState('581401');
  const [gstin, setGstin] = useState('');
  const [drugLicence, setDrugLicence] = useState('');
  const [pan, setPan] = useState('');
  const [creditLimit, setCreditLimit] = useState('200000');
  const [creditDays, setCreditDays] = useState('30');
  const [openingOutstanding, setOpeningOutstanding] = useState('0');
  const [assignedStaffId, setAssignedStaffId] = useState(staffList[0]?.id || '');
  const [customerType, setCustomerType] = useState<PartyType>('Medical Shop');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<Party[] | null>(null);

  const resetForm = () => {
    setName('');
    setCustomerCode('CUST-SR-' + Math.floor(100 + Math.random() * 900));
    setContactPerson('');
    setMobile('');
    setAltMobile('');
    setAddress('');
    setArea('Court Road');
    setCity('Sirsi');
    setPincode('581401');
    setGstin('');
    setDrugLicence('');
    setPan('');
    setCreditLimit('200000');
    setCreditDays('30');
    setOpeningOutstanding('0');
    setPhotoUrl('');
    setDuplicateWarning(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const checkDuplicates = () => {
    if (!name && !mobile && !gstin) return;
    const check = db.checkPartyDuplicate(name, mobile, gstin);
    if (check.isDuplicate) {
      setDuplicateWarning(check.matches);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSaveParty = (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!force) {
      const check = db.checkPartyDuplicate(name, mobile, gstin);
      if (check.isDuplicate) {
        setDuplicateWarning(check.matches);
        return;
      }
    }

    const newParty: Party = {
      id: 'p-' + Date.now(),
      name,
      customerCode: customerCode || 'CUST-' + Math.floor(100 + Math.random() * 900),
      contactPerson,
      mobile,
      altMobile: altMobile || undefined,
      address,
      area,
      city,
      pincode,
      gpsLatitude: 14.6192 + (Math.random() - 0.5) * 0.01,
      gpsLongitude: 74.8354 + (Math.random() - 0.5) * 0.01,
      gstin: gstin.toUpperCase(),
      drugLicence: drugLicence || 'KA-UK-20B-XXXXX, KA-UK-21B-XXXXX',
      pan: pan ? pan.toUpperCase() : undefined,
      creditLimit: parseFloat(creditLimit) || 100000,
      creditDays: parseInt(creditDays, 10) || 30,
      openingOutstanding: parseFloat(openingOutstanding) || 0,
      currentOutstanding: parseFloat(openingOutstanding) || 0,
      assignedStaffId,
      customerType,
      status: 'active',
      photoUrl: photoUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    db.addParty(newParty, currentUser);
    setShowAddModal(false);
    alert(`Party "${newParty.name}" created successfully!`);
  };

  const filteredParties = parties.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.contactPerson.toLowerCase().includes(q) ||
      p.mobile.includes(q) ||
      p.gstin.toLowerCase().includes(q);
    const matchesFilter = filterType === 'ALL' || p.customerType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Customer Directory
          </span>
          <h1 className="text-xl font-bold text-slate-900">Party Master Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered Chemists, Hospitals, Nursing Homes & Distributors across Uttara Kannada
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportOutstandingToExcel(parties)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-300"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Export Ageing Excel</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Party</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search party name, contact person, mobile, area, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Categories ({parties.length})</option>
            <option value="Medical Shop">Medical Shops</option>
            <option value="Pharmacy">Pharmacies</option>
            <option value="Hospital">Hospitals</option>
            <option value="Nursing Home">Nursing Homes</option>
            <option value="Distributor">Distributors</option>
          </select>
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3.5">Party / Chemist Name</th>
                <th className="p-3.5">Type & Area</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">GSTIN / Drug Licence</th>
                <th className="p-3.5 text-right">Outstanding (₹)</th>
                <th className="p-3.5 text-center">Credit Term</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParties.map((p) => {
                const isOverdue = p.currentOutstanding > 50000;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold flex-shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.customerCode}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 block w-max">
                        {p.customerType}
                      </span>
                      <span className="text-slate-500 mt-0.5 block">{p.area}, {p.city}</span>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{p.contactPerson}</p>
                      <p className="text-slate-500">{p.mobile}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-mono text-[11px] text-slate-800 font-semibold">{p.gstin}</p>
                      <p className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">{p.drugLicence}</p>
                    </td>

                    <td className="p-3.5 text-right">
                      <span className={`font-bold text-sm ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                        ₹{p.currentOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="p-3.5 text-center text-slate-600">
                      {p.creditDays} Days / ₹{(p.creditLimit / 1000).toFixed(0)}k
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedParty(p)}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-bold text-xs transition"
                      >
                        Dashboard
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PARTY DASHBOARD MODAL (Section 18) */}
      {selectedParty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-sky-500 text-white rounded-xl">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base sm:text-lg">{selectedParty.name}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-900 text-sky-200 border border-sky-700">
                      {selectedParty.customerType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedParty.address}, {selectedParty.city} • Code: {selectedParty.customerCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedParty(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] text-rose-500 font-bold uppercase block">Current Outstanding</span>
                  <span className="text-base font-black text-rose-700">
                    ₹{selectedParty.currentOutstanding.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Credit Limit</span>
                  <span className="text-base font-bold text-slate-800">
                    ₹{selectedParty.creditLimit.toLocaleString('en-IN')} ({selectedParty.creditDays}d)
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">Orders Placed</span>
                  <span className="text-base font-bold text-emerald-800">
                    {orders.filter((o) => o.partyId === selectedParty.id).length} Orders
                  </span>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                  <span className="text-[10px] text-sky-600 font-bold uppercase block">Field Visits</span>
                  <span className="text-base font-bold text-sky-800">
                    {visits.filter((v) => v.partyId === selectedParty.id).length} Visits
                  </span>
                </div>
              </div>

              {/* Ageing Breakdown (0-30, 31-60, 61-90, 90+) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Outstanding Ageing Breakdown
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">0–30 Days</span>
                    <span className="font-bold text-emerald-600">
                      ₹{Math.round(selectedParty.currentOutstanding * 0.5).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">31–60 Days</span>
                    <span className="font-bold text-amber-600">
                      ₹{Math.round(selectedParty.currentOutstanding * 0.3).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">61–90 Days</span>
                    <span className="font-bold text-orange-600">
                      ₹{Math.round(selectedParty.currentOutstanding * 0.15).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">90+ Days (Overdue)</span>
                    <span className="font-bold text-rose-600">
                      ₹{Math.round(selectedParty.currentOutstanding * 0.05).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Licences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block mb-1">Contact & Address</span>
                  <p><strong>Contact Person:</strong> {selectedParty.contactPerson}</p>
                  <p><strong>Phone:</strong> {selectedParty.mobile}</p>
                  <p><strong>Address:</strong> {selectedParty.address}, {selectedParty.city} – {selectedParty.pincode}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block mb-1">Regulatory Credentials</span>
                  <p><strong>GSTIN:</strong> {selectedParty.gstin}</p>
                  <p><strong>Drug Licences:</strong> {selectedParty.drugLicence}</p>
                  <p><strong>PAN:</strong> {selectedParty.pan || 'N/A'}</p>
                </div>
              </div>

              {/* Quick Communication Buttons */}
              <div className="flex space-x-2 pt-2 border-t border-slate-100">
                <a
                  href={`tel:${selectedParty.mobile}`}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Party</span>
                </a>
                <a
                  href={`https://wa.me/91${selectedParty.mobile}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-emerald-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedParty.gpsLatitude},${selectedParty.gpsLongitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-sky-200"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  <span>Navigate</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PARTY MODAL WITH DUPLICATE DETECTION (Sections 17 & 47) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-sky-600 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base">Add New Customer Party</h3>
                <p className="text-xs text-sky-100">Medical Shop, Pharmacy or Hospital Supplier</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-sky-700 p-1 rounded-lg">
                ✕
              </button>
            </div>

            {/* Duplicate Detection Warning Banner (Section 47) */}
            {duplicateWarning && duplicateWarning.length > 0 && (
              <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>POSSIBLE DUPLICATE PARTY FOUND</span>
                </div>
                <p>
                  A party with similar details already exists in the Kapila Medical Agencies master database:
                </p>
                {duplicateWarning.map((m) => (
                  <div key={m.id} className="p-2 bg-white rounded-lg border border-amber-300 font-semibold space-y-0.5">
                    <p>• {m.name} ({m.area}, {m.city})</p>
                    <p className="text-[11px] text-slate-500">Phone: {m.mobile} • GSTIN: {m.gstin}</p>
                  </div>
                ))}
                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParty(duplicateWarning[0]);
                      setShowAddModal(false);
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                  >
                    Use Existing Party
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSaveParty(e as any, true)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-semibold border border-slate-300"
                  >
                    Create New Anyway
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveParty} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Party / Medical Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onBlur={checkDuplicates}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mahalakshmi Medicals"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Type *</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as PartyType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    <option value="Medical Shop">Medical Shop</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Nursing Home">Nursing Home</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Institution">Institution</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Proprietor / Chemist Name"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onBlur={checkDuplicates}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={gstin}
                    onBlur={checkDuplicates}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Drug Licences (20B & 21B) *</label>
                  <input
                    type="text"
                    required
                    value={drugLicence}
                    onChange={(e) => setDrugLicence(e.target.value)}
                    placeholder="KA-UK-20B-XXXXX, KA-UK-21B-XXXXX"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="200000"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Terms (Days)</label>
                  <input
                    type="number"
                    value={creditDays}
                    onChange={(e) => setCreditDays(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Locality *</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Court Road / Hubli Road / Banavasi"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Sirsi"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Shop Address *</label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building name, landmark, near bus stand/temple"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Photo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Storefront / Chemist Photo</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
                  >
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>{photoUrl ? 'Change Photo' : 'Take / Upload Photo'}</span>
                  </button>
                  {photoUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                      <img src={photoUrl} alt="Store" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
                >
                  Save Party Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PhotoCaptureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onCapture={(data) => setPhotoUrl(data)}
        title="Chemist Storefront Photo"
        subtitle="Capture storefront board with Drug Licence"
      />
    </div>
  );
};
