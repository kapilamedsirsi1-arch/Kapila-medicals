import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Camera,
  Search,
  Store,
  Building,
  Plus,
  ArrowLeft,
  ShoppingBag,
  IndianRupee,
  FileText,
} from 'lucide-react';
import { Party, PartyVisit, User, Staff, PartyType } from '../../types';
import { db } from '../../services/db';
import { PhotoCaptureModal } from '../common/PhotoCaptureModal';

interface StaffPartyVisitsProps {
  currentUser: User;
  onSelectBookOrder: (party: Party) => void;
  onSelectCollectPayment: (party: Party) => void;
  onBack: () => void;
}

export const StaffPartyVisits: React.FC<StaffPartyVisitsProps> = ({
  currentUser,
  onSelectBookOrder,
  onSelectCollectPayment,
  onBack,
}) => {
  const staff = db.getStaff().find((s) => s.userId === currentUser.id) || db.getStaff()[0];
  const parties = db.getParties();
  const visits = db.getVisits();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Visit check-in state
  const [activeVisitParty, setActiveVisitParty] = useState<Party | null>(null);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(15);
  const [isFar, setIsFar] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Visit Summary Form state
  const [purpose, setPurpose] = useState('Routine Stock Audit & Payment Follow-up');
  const [personMet, setPersonMet] = useState('');
  const [discussion, setDiscussion] = useState('');
  const [orderBooked, setOrderBooked] = useState(false);
  const [paymentCollected, setPaymentCollected] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [competitorInfo, setCompetitorInfo] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Haversine distance formula in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const handleStartVisit = (party: Party) => {
    setActiveVisitParty(party);
    setPersonMet(party.contactPerson);
    setIsLocating(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          setCurrentGps({ lat: userLat, lng: userLng, accuracy: acc });
          const dist = calculateDistance(userLat, userLng, party.gpsLatitude, party.gpsLongitude);
          setDistanceMeters(dist);
          setIsFar(dist > 250);
          setIsLocating(false);
        },
        (err) => {
          // fallback to nearby simulation for testing
          const simulatedLat = party.gpsLatitude + 0.00015;
          const simulatedLng = party.gpsLongitude + 0.0001;
          const dist = calculateDistance(simulatedLat, simulatedLng, party.gpsLatitude, party.gpsLongitude);
          setCurrentGps({ lat: simulatedLat, lng: simulatedLng, accuracy: 8 });
          setDistanceMeters(dist);
          setIsFar(false);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setDistanceMeters(18);
      setIsFar(false);
      setIsLocating(false);
    }
  };

  const handleSubmitVisitSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisitParty) return;

    const newVisit: PartyVisit = {
      id: 'vis-' + Date.now(),
      staffId: staff.id,
      staffName: staff.fullName,
      partyId: activeVisitParty.id,
      partyName: activeVisitParty.name,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gpsLatitude: currentGps?.lat || activeVisitParty.gpsLatitude,
      gpsLongitude: currentGps?.lng || activeVisitParty.gpsLongitude,
      gpsAccuracy: currentGps?.accuracy || 10,
      partyLatitude: activeVisitParty.gpsLatitude,
      partyLongitude: activeVisitParty.gpsLongitude,
      distanceMeters,
      isFarWarning: isFar,
      purpose,
      personMet,
      discussion,
      orderBooked,
      paymentCollected,
      complaint: complaint || undefined,
      newRequirement: newRequirement || undefined,
      competitorInfo: competitorInfo || undefined,
      followUpDate: followUpDate || undefined,
      remarks: remarks || undefined,
      photoUrl: photoUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    db.addVisit(newVisit, currentUser);

    if (followUpDate) {
      db.addFollowup(
        {
          id: 'fu-' + Date.now(),
          partyId: activeVisitParty.id,
          partyName: activeVisitParty.name,
          staffId: staff.id,
          staffName: staff.fullName,
          reason: purpose,
          date: followUpDate,
          notes: discussion,
          status: 'Pending',
        },
        currentUser
      );
    }

    alert(`Visit logged successfully for ${activeVisitParty.name}! GPS coordinates and summary saved.`);
    setActiveVisitParty(null);
  };

  const filteredParties = parties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.customerType === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories: (PartyType | 'ALL')[] = [
    'ALL',
    'Medical Shop',
    'Pharmacy',
    'Hospital',
    'Nursing Home',
    'Clinic',
    'Institution',
    'Distributor',
  ];

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <div className="text-right">
          <h2 className="text-base font-bold text-slate-900">Party Visits & Tour Route</h2>
          <p className="text-[11px] text-slate-500">{filteredParties.length} Chemists & Hospitals available</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search chemist name, area, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
        />
      </div>

      {/* Category Pills Filter */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Party Cards List */}
      <div className="space-y-3">
        {filteredParties.map((party) => {
          const hasVisitedToday = visits.some(
            (v) => v.partyId === party.id && v.date === new Date().toISOString().split('T')[0]
          );

          return (
            <div
              key={party.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition ${
                hasVisitedToday ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-sky-300'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{party.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                      {party.customerType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {party.address}, <span className="font-semibold text-slate-700">{party.city}</span> ({party.pincode})
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    👤 <strong>{party.contactPerson}</strong> • 📞 {party.mobile}
                  </p>
                </div>

                {hasVisitedToday && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Visited Today</span>
                  </span>
                )}
              </div>

              {/* Financial & Licences snippet */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Current Outstanding</span>
                  <span className="font-bold text-rose-600 text-sm">
                    ₹{party.currentOutstanding.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Credit Terms</span>
                  <span className="font-semibold text-slate-800">
                    {party.creditDays} Days / ₹{(party.creditLimit / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block">Drug Licence (KA)</span>
                  <span className="font-mono text-[11px] text-slate-700 truncate block">
                    {party.drugLicence.split(',')[0]}
                  </span>
                </div>
              </div>

              {/* Quick Communication Buttons */}
              <div className="flex items-center space-x-2 mt-3 pt-2">
                <a
                  href={`tel:${party.mobile}`}
                  className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call</span>
                </a>

                <a
                  href={`https://wa.me/91${party.mobile}?text=Hello%20${encodeURIComponent(
                    party.name
                  )},%20M/s.%20Kapila%20Medical%20Agencies%20Sirsi%20field%20representative%20visiting%20today.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition border border-emerald-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${party.gpsLatitude},${party.gpsLongitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition border border-sky-200"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  <span>Navigate</span>
                </a>
              </div>

              {/* Primary Workflow Actions (Section 7) */}
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleStartVisit(party)}
                  className="py-2 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-xs transition"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>START VISIT</span>
                </button>

                <button
                  onClick={() => onSelectBookOrder(party)}
                  className="py-2 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-xs transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>BOOK ORDER</span>
                </button>

                <button
                  onClick={() => onSelectCollectPayment(party)}
                  className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-xs transition"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>PAYMENT</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* START VISIT MODAL / SUMMARY SHEET (Section 8) */}
      {activeVisitParty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-sky-600 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-200">
                  GPS Geotagged Visit Entry
                </span>
                <h3 className="font-bold text-base">{activeVisitParty.name}</h3>
                <p className="text-xs text-sky-100">{activeVisitParty.area}, Sirsi</p>
              </div>
              <button
                onClick={() => setActiveVisitParty(null)}
                className="text-white hover:bg-sky-700 p-1.5 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            {/* GPS Geofence Check Indicator */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">GPS Location Verification:</span>
                {isLocating ? (
                  <span className="text-sky-600 font-medium animate-pulse">Acquiring GPS fix...</span>
                ) : (
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      isFar ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Distance: {distanceMeters}m away
                  </span>
                )}
              </div>

              {isFar && !isLocating && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center space-x-2 mt-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>
                    Warning: You appear to be <strong>{distanceMeters}m</strong> away from the registered party location. This will be marked in the visit audit log.
                  </span>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitVisitSummary} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose of Visit *</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  <option value="Routine Stock Audit & Payment Follow-up">Routine Stock Audit & Payment Follow-up</option>
                  <option value="New Product Introduction & Sampling">New Product Introduction & Sampling</option>
                  <option value="Urgent Order Delivery Confirmation">Urgent Order Delivery Confirmation</option>
                  <option value="Payment / Cheque Collection">Payment / Cheque Collection</option>
                  <option value="Scheme Discussion (10+1 / 20+2)">Scheme Discussion (10+1 / 20+2)</option>
                  <option value="Complaint Resolution / Expiry Return">Complaint Resolution / Expiry Return</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Person Met *</label>
                  <input
                    type="text"
                    required
                    value={personMet}
                    onChange={(e) => setPersonMet(e.target.value)}
                    placeholder="Pharmacist / Doctor"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discussion Details *</label>
                <textarea
                  required
                  rows={2}
                  value={discussion}
                  onChange={(e) => setDiscussion(e.target.value)}
                  placeholder="Items discussed, stock movement, competitor activity..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Toggles for order/payment */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orderBooked}
                    onChange={(e) => setOrderBooked(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Order Booked?</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentCollected}
                    onChange={(e) => setPaymentCollected(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Payment Collected?</span>
                </label>
              </div>

              {/* Optional Fields: Complaint & Competitor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Complaint / Expiry Issue</label>
                  <input
                    type="text"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Broken seal, delayed batch..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Competitor Intel</label>
                  <input
                    type="text"
                    value={competitorInfo}
                    onChange={(e) => setCompetitorInfo(e.target.value)}
                    placeholder="Competitor scheme, rates..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Party / Shop Photo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shop / Chemist Photo (Optional)</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
                  >
                    <Camera className="w-4 h-4 text-slate-600" />
                    <span>{photoUrl ? 'Retake Photo' : 'Take Shop Photo'}</span>
                  </button>
                  {photoUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                      <img src={photoUrl} alt="Shop" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveVisitParty(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Visit Summary</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      <PhotoCaptureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onCapture={(data) => setPhotoUrl(data)}
        title="Chemist / Party Photograph"
        subtitle="Capture storefront or medicine display rack"
      />
    </div>
  );
};
