import React, { useState } from 'react';
import { Camera, Check, AlertCircle, Building2, UserCheck, ShieldCheck } from 'lucide-react';
import { User, Staff } from '../../types';
import { db } from '../../services/db';
import { PhotoCaptureModal } from '../common/PhotoCaptureModal';

interface StaffFirstLoginSetupProps {
  currentUser: User;
  onComplete: () => void;
}

export const StaffFirstLoginSetup: React.FC<StaffFirstLoginSetupProps> = ({ currentUser, onComplete }) => {
  const [fullName, setFullName] = useState(currentUser.name || '');
  const [dob, setDob] = useState('1998-06-15');
  const [mobile, setMobile] = useState(currentUser.mobile || '');
  const [altMobile, setAltMobile] = useState('');
  const [email, setEmail] = useState(currentUser.email || '');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [drivingLicence, setDrivingLicence] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Auto calculate age from DOB
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  const age = calculateAge(dob);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !mobile.trim() || !address.trim() || !bankAccount.trim() || !ifsc.trim()) {
      setError('Please fill in all mandatory profile details (Name, Mobile, Address, Bank Account, IFSC).');
      return;
    }

    const staffId = 'st-' + Date.now();
    const newStaff: Staff = {
      id: staffId,
      userId: currentUser.id,
      employeeCode: 'KMA-TB-' + Math.floor(10 + Math.random() * 90),
      fullName,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&fit=crop&crop=face',
      dob,
      age,
      mobile,
      altMobile,
      email,
      address,
      joiningDate,
      designation: 'Tour Boy / Field Representative',
      salary: 18000,
      bankAccount,
      ifsc: ifsc.toUpperCase(),
      upiId,
      emergencyContact,
      bloodGroup,
      vehicleNumber,
      drivingLicence,
      assignedArea: 'Sirsi & Surrounding Routes',
      assignedPartyIds: [],
      status: 'pending_approval',
      monthlySalesTarget: 300000,
      monthlyCollectionTarget: 250000,
      createdAt: new Date().toISOString(),
    };

    currentUser.relatedStaffId = staffId;
    db.addStaff(newStaff, currentUser);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Profile Submitted for Verification</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Thank you, <span className="font-semibold">{fullName}</span>! Your profile details have been securely recorded and sent to the Kapila Medical Agencies Admin office for activation.
          </p>
          <div className="mt-6 p-4 bg-slate-50 rounded-xl text-left text-xs space-y-1 text-slate-600 border border-slate-200">
            <p><strong>Status:</strong> Pending Admin Approval</p>
            <p><strong>Mobile:</strong> {mobile}</p>
            <p><strong>Assigned Role:</strong> Field Tour Boy</p>
          </div>
          <button
            onClick={onComplete}
            className="mt-6 w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition shadow"
          >
            Continue to App Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-sky-500 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Kapila Medical Agencies, Sirsi</h2>
              <p className="text-xs text-sky-400 font-semibold tracking-wide">FIELD STAFF FIRST LOGIN SETUP</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Please complete your official employment profile. This information is verified by Admin for Tour Planning, Fuel Allowances & Salary transfers.
          </p>
        </div>

        {error && (
          <div className="m-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Section */}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 border-2 border-sky-500 flex items-center justify-center flex-shrink-0 relative">
              {photoUrl ? (
                <img src={photoUrl} alt="Staff" className="w-full h-full object-cover" />
              ) : (
                <UserCheck className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h4 className="font-semibold text-sm text-slate-800">Official Staff Photo</h4>
              <p className="text-xs text-slate-500 mb-2">Take a photo using your phone camera or upload a clear passport photo</p>
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 mx-auto sm:mx-0 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{photoUrl ? 'Change Photo' : 'Take / Upload Photo'}</span>
              </button>
            </div>
          </div>

          {/* Personal Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Ganapati Hegde"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth * (Age: <span className="text-sky-600 font-bold">{age} Years</span>)
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate / WhatsApp Number</label>
                <input
                  type="tel"
                  value={altMobile}
                  onChange={(e) => setAltMobile(e.target.value)}
                  placeholder="Alternate phone"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Person & Phone *</label>
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Ganapati Hegde (Father) - 9448112233"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address in Sirsi / Uttara Kannada *</label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House name, Cross, Area, Landmark, Pincode"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Vehicle & Travel Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Vehicle & Field Travel</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Two-Wheeler Vehicle Reg. No</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. KA-31-EA-4521"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driving Licence Number</label>
                <input
                  type="text"
                  value={drivingLicence}
                  onChange={(e) => setDrivingLicence(e.target.value)}
                  placeholder="e.g. DL-KA3120180004921"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bank & Salary Account */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Bank Account for Salary & Allowances</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number *</label>
                <input
                  type="text"
                  required
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Account Number"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank IFSC Code *</label>
                <input
                  type="text"
                  required
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  placeholder="e.g. KARB0000720 / SBIN0040082"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID (Google Pay / PhonePe)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okhdfcbank"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Submit Profile to Admin</span>
            </button>
          </div>
        </form>

        <PhotoCaptureModal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onCapture={(data) => setPhotoUrl(data)}
          title="Staff Profile Photograph"
          subtitle="Position face clearly in the camera frame"
        />
      </div>
    </div>
  );
};
