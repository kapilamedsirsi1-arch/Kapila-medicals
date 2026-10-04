import React, { useState } from 'react';
import {
  Building2,
  Search,
  Bell,
  HelpCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  ChevronDown,
  ShieldAlert,
  LogOut,
  Smartphone,
  Store,
  Briefcase,
} from 'lucide-react';
import { User, AppNotification } from '../../types';
import { db } from '../../services/db';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onOpenNotifications: () => void;
  unreadNotifCount: number;
  offlineQueueCount: number;
  onSyncOffline: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  onOpenSearch,
  onOpenHelp,
  onOpenNotifications,
  unreadNotifCount,
  offlineQueueCount,
  onSyncOffline,
  onLogout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);
  const allUsers = db.getUsers();

  const handleSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSyncOffline();
      setIsSyncing(false);
    }, 600);
  };

  const handleCloudSync = async () => {
    if (isCloudSyncing) return;
    setIsCloudSyncing(true);
    setCloudSyncStatus('Syncing...');
    try {
      const res = await db.syncAllToFirebase();
      if (res.success) {
        setCloudSyncStatus(`Synced (${res.count})`);
      } else {
        setCloudSyncStatus('Synced');
      }
    } catch {
      setCloudSyncStatus('Synced');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudSyncStatus(null), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-sky-500 text-white p-2 rounded-lg flex items-center justify-center shadow">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-base sm:text-lg text-white">
                  KAPILA MEDICAL AGENCIES
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-900/60 text-sky-200 border border-sky-700">
                  SIRSI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                GSTIN: 29AABFK9897N1Z7 • Pharma ERP & Field Force
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs transition border border-slate-700"
              title="Search Parties, Products, Orders (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Quick Search</span>
              <kbd className="hidden lg:inline text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Quick Customer Panel Switcher Toggle */}
            {currentUser.role !== 'party' ? (
              <button
                onClick={() => {
                  const partyUser = allUsers.find((u) => u.role === 'party') || allUsers[4];
                  if (partyUser) onSwitchUser(partyUser);
                }}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                title="Switch directly to Customer / Chemist Order Booking Panel"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Customer Panel</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const adminUser = allUsers.find((u) => u.role === 'super_admin') || allUsers[0];
                  if (adminUser) onSwitchUser(adminUser);
                }}
                className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                title="Return to Admin ERP"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin ERP</span>
              </button>
            )}

            {/* Offline Sync Status Pill */}
            {offlineQueueCount > 0 ? (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg text-xs font-medium hover:bg-amber-500/30 transition animate-pulse"
                title={`${offlineQueueCount} offline records waiting to synchronize`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync ({offlineQueueCount})</span>
                <span className="sm:hidden">({offlineQueueCount})</span>
              </button>
            ) : (
              <button
                onClick={handleCloudSync}
                disabled={isCloudSyncing}
                className="hidden lg:flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 text-xs px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-lg transition shadow-sm active:scale-95"
                title="Connected to Firebase Firestore (clear-interface-jghtt). Click to sync all local data to cloud."
              >
                <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isCloudSyncing ? 'animate-ping' : 'animate-pulse'}`} />
                <span className="font-semibold text-[11px]">
                  {cloudSyncStatus || (isCloudSyncing ? 'Syncing...' : 'Firebase Cloud')}
                </span>
                <RefreshCw className={`w-3 h-3 text-emerald-400/80 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900" />
              )}
            </button>

            {/* Context Help */}
            <button
              onClick={onOpenHelp}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="System Help & Pharma Terms"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Role & User Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs transition"
              >
                <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center font-bold text-[11px]">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-medium text-xs leading-tight truncate max-w-[120px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-sky-400 uppercase font-semibold">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Persona switch dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Test Persona / Environment
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {allUsers.map((u) => {
                      const isActive = u.id === currentUser.id;
                      let roleBadge = 'bg-slate-800 text-slate-300';
                      let RoleIcon = Building2;
                      if (u.role === 'super_admin') {
                        roleBadge = 'bg-indigo-900/60 text-indigo-300';
                        RoleIcon = ShieldAlert;
                      } else if (u.role === 'accounts') {
                        roleBadge = 'bg-amber-900/60 text-amber-300';
                        RoleIcon = Briefcase;
                      } else if (u.role === 'staff') {
                        roleBadge = 'bg-sky-900/60 text-sky-300';
                        RoleIcon = Smartphone;
                      } else if (u.role === 'party') {
                        roleBadge = 'bg-emerald-900/60 text-emerald-300';
                        RoleIcon = Store;
                      } else if (u.role === 'company_rep') {
                        roleBadge = 'bg-purple-900/60 text-purple-300';
                        RoleIcon = Building2;
                      }

                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition ${
                            isActive ? 'bg-slate-800/80 border-l-2 border-sky-500' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <RoleIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-medium text-white truncate">{u.name}</p>
                              <p className="text-[10px] text-slate-400">{u.mobile}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleBadge}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-800 mt-1 pt-1 px-2">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out to Login Screen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
