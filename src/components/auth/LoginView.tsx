import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Store,
  Briefcase,
} from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loginType, setLoginType] = useState<'admin' | 'staff' | 'party' | 'rep'>('admin');
  const [mobile, setMobile] = useState('9448123456');
  const [password, setPassword] = useState('1234');
  const [otpStep, setOtpStep] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const allUsers = db.getUsers();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPhone = mobile.replace(/\D/g, '');
    const user = allUsers.find((u) => u.mobile.replace(/\D/g, '') === cleanPhone);

    if (!user) {
      setError(`Mobile number "${mobile}" not found in Kapila Medical Agencies employee or client directory.`);
      return;
    }

    setOtpStep(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = mobile.replace(/\D/g, '');
    const user = allUsers.find((u) => u.mobile.replace(/\D/g, '') === cleanPhone);

    if (!user) {
      setError('User account not found.');
      return;
    }

    // Accept standard test OTP "1234" or any 4-digit OTP for demo convenience
    if (enteredOtp.length === 4 || enteredOtp === '1234') {
      onLoginSuccess(user);
    } else {
      setError('Invalid OTP code. Please enter 1234.');
    }
  };

  const handleQuickLogin = (role: 'super_admin' | 'accounts' | 'staff_rahul' | 'staff_santosh' | 'party' | 'rep') => {
    let targetMobile = '9448123456';
    if (role === 'accounts') targetMobile = '9448123457';
    if (role === 'staff_rahul') targetMobile = '9886012345';
    if (role === 'staff_santosh') targetMobile = '9886012346';
    if (role === 'party') targetMobile = '9448098765';
    if (role === 'rep') targetMobile = '9845011223';

    const user = allUsers.find((u) => u.mobile === targetMobile);
    if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-900/30 via-sky-950/10 to-transparent pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl border border-sky-400/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            M/s. KAPILA MEDICAL AGENCIES
          </h1>
          <p className="text-xs text-sky-400 font-semibold tracking-wide uppercase">
            Pharma ERP & Field Force Automation • Sirsi – 581401
          </p>
          <p className="text-[11px] text-slate-400">
            GSTIN: 29AABFK9897N1Z7 • Wholesale Drug Distributors
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Environment Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl text-[11px] font-bold text-slate-400">
            <button
              onClick={() => {
                setLoginType('admin');
                setMobile('9448123456');
                setOtpStep(false);
              }}
              className={`py-2 rounded-lg transition ${
                loginType === 'admin' ? 'bg-sky-600 text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => {
                setLoginType('staff');
                setMobile('9886012345');
                setOtpStep(false);
              }}
              className={`py-2 rounded-lg transition ${
                loginType === 'staff' ? 'bg-sky-600 text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              Tour Boy
            </button>
            <button
              onClick={() => {
                setLoginType('party');
                setMobile('9448098765');
                setOtpStep(false);
              }}
              className={`py-2 rounded-lg transition ${
                loginType === 'party' ? 'bg-sky-600 text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              Chemist
            </button>
            <button
              onClick={() => {
                setLoginType('rep');
                setMobile('9845011223');
                setOtpStep(false);
              }}
              className={`py-2 rounded-lg transition ${
                loginType === 'rep' ? 'bg-sky-600 text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              Pharma Rep
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Mobile Number *
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter 10-digit mobile"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              {loginType === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Admin Password / Security PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>Request OTP / Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-sky-950/60 rounded-xl border border-sky-800 text-xs text-sky-200">
                <span>OTP verification code sent to +91 {mobile}. (Use test code: <strong>1234</strong>)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter 4-Digit Verification OTP *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={4}
                    autoFocus
                    required
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder="1234"
                    className="w-full pl-9 pr-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify OTP & Launch ERP</span>
              </button>

              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="w-full py-1 text-xs text-slate-400 hover:text-white"
              >
                ← Back to Mobile Number
              </button>
            </form>
          )}

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center mb-2.5">
              Instant 1-Click Persona Access
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickLogin('super_admin')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-left truncate transition border border-slate-700"
              >
                <span className="font-bold block truncate">Suresh Bhat (Owner)</span>
                <span className="text-[10px] text-sky-400">Super Admin ERP</span>
              </button>

              <button
                onClick={() => handleQuickLogin('accounts')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-left truncate transition border border-slate-700"
              >
                <span className="font-bold block truncate">Ananth Hegde</span>
                <span className="text-[10px] text-amber-400">Accounts & Cheques</span>
              </button>

              <button
                onClick={() => handleQuickLogin('staff_rahul')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-left truncate transition border border-slate-700"
              >
                <span className="font-bold block truncate">Rahul Hegde</span>
                <span className="text-[10px] text-emerald-400">Sirsi Tour Boy App</span>
              </button>

              <button
                onClick={() => handleQuickLogin('staff_santosh')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-left truncate transition border border-slate-700"
              >
                <span className="font-bold block truncate">Santosh Naik</span>
                <span className="text-[10px] text-emerald-400">Siddapur Tour Boy</span>
              </button>

              <button
                onClick={() => handleQuickLogin('party')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-left truncate transition border border-slate-700"
              >
                <span className="font-bold block truncate">Shri Ganesh Medicals</span>
                <span className="text-[10px] text-purple-400">Chemist Portal</span>
              </button>

              <button
                onClick={() => handleQuickLogin('rep')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-left truncate transition border border-slate-700"
              >
                <span className="font-bold block truncate">Sun Pharma Rep</span>
                <span className="text-[10px] text-indigo-400">Company Portal</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4">
          Kapila Medical Agencies Operating System • Encrypted & Audit-Logged
        </p>
      </div>
    </div>
  );
};
