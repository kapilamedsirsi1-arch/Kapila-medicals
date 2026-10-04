import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Store,
  Package,
  ShoppingBag,
  IndianRupee,
  Receipt,
  MapPin,
  FileSpreadsheet,
  Sparkles,
  Database,
  Users,
  Compass,
  CreditCard,
  Menu,
  X,
  Smartphone,
  HelpCircle,
  Bell,
} from 'lucide-react';
import { User, Party } from './types';
import { db } from './services/db';
import { Header } from './components/common/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { HelpModal } from './components/common/HelpModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { PhotoCaptureModal } from './components/common/PhotoCaptureModal';

// Auth
import { LoginView } from './components/auth/LoginView';

// Staff Views
import { StaffMobileHome } from './components/staff/StaffMobileHome';
import { StaffFirstLoginSetup } from './components/staff/StaffFirstLoginSetup';
import { StaffPartyVisits } from './components/staff/StaffPartyVisits';
import { StaffOrderBooking } from './components/staff/StaffOrderBooking';
import { StaffPaymentCollection } from './components/staff/StaffPaymentCollection';
import { StaffExpenseEntry } from './components/staff/StaffExpenseEntry';
import { StaffTourAndReport } from './components/staff/StaffTourAndReport';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ApprovalCentre } from './components/admin/ApprovalCentre';
import { PartyManagement } from './components/admin/PartyManagement';
import { ProductManagement } from './components/admin/ProductManagement';
import { OrderManagement } from './components/admin/OrderManagement';
import { CollectionManagement } from './components/admin/CollectionManagement';
import { ExpenseManagement } from './components/admin/ExpenseManagement';
import { GpsTrackingAndTours } from './components/admin/GpsTrackingAndTours';
import { ReportsHub } from './components/admin/ReportsHub';
import { DataCentre } from './components/admin/DataCentre';
import { AiAssistantPanel } from './components/admin/AiAssistantPanel';

// Portals
import { PartyPortalView } from './components/portals/PartyPortalView';
import { CompanyRepPortalView } from './components/portals/CompanyRepPortalView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Default to Super Admin for immediate exploration, but easily toggleable
    const users = db.getUsers();
    return users.find((u) => u.role === 'super_admin') || users[0] || null;
  });

  const [adminNav, setAdminNav] = useState<string>('dashboard');
  const [adminNavMeta, setAdminNavMeta] = useState<any>(null);
  const [staffTab, setStaffTab] = useState<string>('home');
  const [selectedPartyForAction, setSelectedPartyForAction] = useState<Party | null>(null);

  // Common Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBillUploadOpen, setIsBillUploadOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Reactive DB subscriptions
  const [, setDbVersion] = useState(0);
  useEffect(() => {
    return db.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
  }, []);

  const notifications = db.getNotifications();
  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const offlineQueue = db.getOfflineQueue();

  const handleSyncOffline = () => {
    if (currentUser) {
      const count = db.syncOfflineQueue(currentUser);
      alert(`Synchronized ${count} offline records with the centralized server!`);
    }
  };

  const handleNavigateAdminTab = (tab: string, meta?: any) => {
    setAdminNav(tab);
    setAdminNavMeta(meta);
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Check if staff needs first-time setup
  const isStaffRole = currentUser.role === 'staff';
  const staffProfile = currentUser.relatedStaffId ? db.getStaffById(currentUser.relatedStaffId) : null;
  const needsProfileSetup = isStaffRole && (!staffProfile || staffProfile.status === 'pending_approval' && !staffProfile.address);

  if (needsProfileSetup) {
    return (
      <StaffFirstLoginSetup
        currentUser={currentUser}
        onComplete={() => {
          setStaffTab('home');
        }}
      />
    );
  }

  // Pending Approvals Count for Admin sidebar badge
  const pendingApprovalsCount =
    db.getExpenses().filter((e) => e.status === 'Pending Approval').length +
    db.getOrders().filter((o) => o.status === 'Submitted' || o.status === 'Admin Review').length +
    db.getStaff().filter((s) => s.status === 'pending_approval').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        currentUser={currentUser}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          setStaffTab('home');
          setAdminNav('dashboard');
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
        unreadNotifCount={unreadNotifCount}
        offlineQueueCount={offlineQueue.length}
        onSyncOffline={handleSyncOffline}
        onLogout={() => setCurrentUser(null)}
      />

      {/* STAFF / TOUR BOY MOBILE ENVIRONMENT */}
      {isStaffRole && (
        <main className="flex-1 pb-16">
          {staffTab === 'home' && (
            <StaffMobileHome
              currentUser={currentUser}
              onNavigateTab={(tab) => setStaffTab(tab)}
              onTriggerBillUpload={() => setIsBillUploadOpen(true)}
            />
          )}

          {staffTab === 'visits' && (
            <StaffPartyVisits
              currentUser={currentUser}
              onSelectBookOrder={(party) => {
                setSelectedPartyForAction(party);
                setStaffTab('book_order');
              }}
              onSelectCollectPayment={(party) => {
                setSelectedPartyForAction(party);
                setStaffTab('collect_payment');
              }}
              onBack={() => setStaffTab('home')}
            />
          )}

          {staffTab === 'book_order' && (
            <StaffOrderBooking
              currentUser={currentUser}
              preSelectedParty={selectedPartyForAction}
              onBack={() => setStaffTab('home')}
            />
          )}

          {staffTab === 'collect_payment' && (
            <StaffPaymentCollection
              currentUser={currentUser}
              preSelectedParty={selectedPartyForAction}
              onBack={() => setStaffTab('home')}
            />
          )}

          {staffTab === 'add_expense' && (
            <StaffExpenseEntry currentUser={currentUser} onBack={() => setStaffTab('home')} />
          )}

          {staffTab === 'tour_report' && (
            <StaffTourAndReport
              currentUser={currentUser}
              onBack={() => setStaffTab('home')}
              onNavigateTab={(tab) => setStaffTab(tab)}
            />
          )}

          {/* Bottom Fixed Navigation Bar for Mobile Field Force */}
          <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 shadow-lg py-1 px-2 flex justify-around items-center">
            <button
              onClick={() => setStaffTab('home')}
              className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-bold transition ${
                staffTab === 'home' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setStaffTab('visits')}
              className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-bold transition ${
                staffTab === 'visits' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Visits</span>
            </button>

            <button
              onClick={() => {
                setSelectedPartyForAction(null);
                setStaffTab('book_order');
              }}
              className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-bold transition ${
                staffTab === 'book_order' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span>Order</span>
            </button>

            <button
              onClick={() => {
                setSelectedPartyForAction(null);
                setStaffTab('collect_payment');
              }}
              className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-bold transition ${
                staffTab === 'collect_payment' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <IndianRupee className="w-5 h-5 mb-0.5" />
              <span>Payment</span>
            </button>

            <button
              onClick={() => setStaffTab('add_expense')}
              className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-bold transition ${
                staffTab === 'add_expense' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span>Expense</span>
            </button>
          </nav>
        </main>
      )}

      {/* PARTY / CUSTOMER PORTAL */}
      {currentUser.role === 'party' && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <PartyPortalView currentUser={currentUser} />
        </main>
      )}

      {/* COMPANY REPRESENTATIVE PORTAL */}
      {currentUser.role === 'company_rep' && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <CompanyRepPortalView currentUser={currentUser} />
        </main>
      )}

      {/* ADMIN ERP DESKTOP & LAPTOP ENVIRONMENT */}
      {(currentUser.role === 'super_admin' ||
        currentUser.role === 'admin' ||
        currentUser.role === 'accounts' ||
        currentUser.role === 'manager') && (
        <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col md:flex-row gap-6">
          {/* Mobile Admin Navigation Toggle */}
          <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-xs uppercase text-slate-700">ERP Navigation Menu</span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded-lg bg-slate-100 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Admin Sidebar Navigation */}
          <aside
            className={`w-full md:w-64 flex-shrink-0 space-y-1 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs h-fit ${
              mobileMenuOpen ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Commercial Operations
            </div>

            <button
              onClick={() => {
                setAdminNav('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>

            <button
              onClick={() => {
                setAdminNav('approval_centre');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'approval_centre'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Approval Centre</span>
              </div>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setAdminNav('parties');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'parties'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Party / Chemist Master</span>
            </button>

            <button
              onClick={() => {
                setAdminNav('products');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'products'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product & Company Master</span>
            </button>

            <button
              onClick={() => {
                setAdminNav('orders');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'orders'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Management</span>
            </button>

            <button
              onClick={() => {
                setAdminNav('collections');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'collections'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <IndianRupee className="w-4 h-4" />
              <span>Cash & Cheque Control</span>
            </button>

            <button
              onClick={() => {
                setAdminNav('expenses');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'expenses'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Staff Expense Claims</span>
            </button>

            <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Field Force & Intelligence
            </div>

            <button
              onClick={() => {
                setAdminNav('gps_tracking');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'gps_tracking'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>GPS Tracking & Tours</span>
            </button>

            <button
              onClick={() => {
                setAdminNav('reports');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'reports'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Commercial Reports</span>
            </button>

            <button
              onClick={() => {
                setAdminNav('ai_assistant');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'ai_assistant'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-indigo-700 hover:bg-indigo-50 font-bold'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Business Assistant</span>
            </button>

            <button
              onClick={() => {
                setAdminNav('data_centre');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                adminNav === 'data_centre'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Database & Security Vault</span>
            </button>
          </aside>

          {/* Admin Main Body */}
          <main className="flex-1 min-w-0">
            {adminNav === 'dashboard' && (
              <AdminDashboard currentUser={currentUser} onNavigateTab={handleNavigateAdminTab} />
            )}

            {adminNav === 'approval_centre' && (
              <ApprovalCentre currentUser={currentUser} initialTab={adminNavMeta?.tab || 'expenses'} />
            )}

            {adminNav === 'parties' && <PartyManagement currentUser={currentUser} />}

            {adminNav === 'products' && <ProductManagement currentUser={currentUser} />}

            {adminNav === 'orders' && <OrderManagement currentUser={currentUser} />}

            {adminNav === 'collections' && <CollectionManagement currentUser={currentUser} />}

            {adminNav === 'expenses' && <ExpenseManagement currentUser={currentUser} />}

            {adminNav === 'gps_tracking' && <GpsTrackingAndTours currentUser={currentUser} />}

            {adminNav === 'reports' && <ReportsHub />}

            {adminNav === 'ai_assistant' && <AiAssistantPanel currentUser={currentUser} />}

            {adminNav === 'data_centre' && <DataCentre currentUser={currentUser} />}
          </main>
        </div>
      )}

      {/* Global Modals & Overlays */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(type, id) => {
          if (type === 'Party') {
            setAdminNav('parties');
          } else if (type === 'Product') {
            setAdminNav('products');
          } else if (type === 'Order') {
            setAdminNav('orders');
          } else if (type === 'Payment') {
            setAdminNav('collections');
          }
        }}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => db.markNotificationRead(id)}
      />

      <PhotoCaptureModal
        isOpen={isBillUploadOpen}
        onClose={() => setIsBillUploadOpen(false)}
        onCapture={(img) => {
          setStaffTab('add_expense');
        }}
        title="Photograph Bill / Voucher"
        subtitle="Receipt text and amount will be read by Gemini AI"
      />
    </div>
  );
}
