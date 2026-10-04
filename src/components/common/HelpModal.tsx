import React from 'react';
import { X, HelpCircle, BookOpen, MapPin, Calculator, ShieldCheck, FileCheck } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Kapila ERP Knowledge Base</h3>
              <p className="text-xs text-slate-500">Pharma Distribution Standards & System Guide</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 divide-y divide-slate-100">
          {/* Section 1: Pharmaceutical Pricing Terms */}
          <div>
            <div className="flex items-center space-x-2 text-sky-700 font-bold mb-2">
              <Calculator className="w-4 h-4" />
              <span>Pharmaceutical Pricing & Margins</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-sm">PTR (Price to Retailer)</span>
                Wholesale billing rate at which Kapila Medical Agencies supplies medicines to Retail Chemists & Hospitals. Retailer margin is (MRP - PTR).
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-sm">PTS (Price to Stockist)</span>
                Net landing purchase rate from Pharma Companies (Sun Pharma, Cipla, Abbott) to Kapila Medical Agencies. Distributor margin is (PTR - PTS).
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-sm">Trade Schemes (e.g. 10+1)</span>
                Bonus quantity offered by companies. In "10+1", every 10 units ordered automatically adds 1 free unit without increasing bill PTR.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-sm">GST Rates in Pharma</span>
                Lifesaving/Essential formulations (12% or 5%), Nutrition & Dialysis Powders (18%). Basic, GST, and Net are auto-calculated.
              </div>
            </div>
          </div>

          {/* Section 2: GPS Geotagging & Field Tracking */}
          <div className="pt-4">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold mb-2">
              <MapPin className="w-4 h-4" />
              <span>GPS Geofencing & Visit Verification</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a Tour Boy visits a customer in Sirsi, Siddapur, or Yellapur, the system compares their current GPS coordinates with the registered Party location:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-slate-600">
              <li>
                <span className="font-semibold text-emerald-600">Within 150m:</span> Verified on-site visit.
              </li>
              <li>
                <span className="font-semibold text-amber-600">Over 200m:</span> Warning flag displayed. Visit log records distance for Admin audit.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Start / End Day:</span> Records morning departure time and GPS coordinates for attendance.
              </li>
            </ul>
          </div>

          {/* Section 3: Cash & Cheque Management */}
          <div className="pt-4">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Cheque & Outstanding Life Cycle</span>
            </div>
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-2">
              <p>
                <strong>1. Collection:</strong> Tour boy enters Cheque #, Bank, Amount, and snaps cheque photo.
              </p>
              <p>
                <strong>2. Realization:</strong> Accounts Admin moves cheque status from <em>Received → Deposited → Cleared</em> upon bank realization.
              </p>
              <p>
                <strong>3. Overdue Ageing:</strong> Categorized into 0–30 days, 31–60 days, 61–90 days, and 90+ days.
              </p>
            </div>
          </div>

          {/* Section 4: Karnataka Drug Licensing Compliance */}
          <div className="pt-4">
            <div className="flex items-center space-x-2 text-purple-700 font-bold mb-2">
              <FileCheck className="w-4 h-4" />
              <span>Regulatory Drug Licences (D.L. 20B & 21B)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under the Drugs & Cosmetics Act 1940:
              <br />
              • <strong>Form 20B:</strong> Wholesale licence for drugs other than those specified in Schedule C, C(1), and X.
              <br />
              • <strong>Form 21B:</strong> Wholesale licence for Schedule C and C(1) biological products.
              <br />
              Kapila Medical Agencies checks customer D.L. validity before supplying.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
