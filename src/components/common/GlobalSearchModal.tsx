import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Package, Store, Building, Users, ShoppingBag, CreditCard, Receipt, FileText } from 'lucide-react';
import { db } from '../../services/db';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (type: string, id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // toggle modal
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const parties = db.getParties();
  const products = db.getProducts();
  const companies = db.getCompanies();
  const orders = db.getOrders();
  const payments = db.getPayments();
  const staff = db.getStaff();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list: { type: string; title: string; subtitle: string; id: string; icon: any }[] = [];

    // Products
    products.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.genericName.toLowerCase().includes(q) ||
        p.salt.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      ) {
        list.push({
          type: 'Product',
          title: p.name,
          subtitle: `${p.companyName} • Pack: ${p.packSize} • PTR: ₹${p.ptr} • Stock: ${p.stock}`,
          id: p.id,
          icon: Package,
        });
      }
    });

    // Parties / Medical Shops
    parties.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.contactPerson.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        p.customerCode.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.gstin.toLowerCase().includes(q)
      ) {
        list.push({
          type: 'Party',
          title: p.name,
          subtitle: `${p.customerType} • ${p.area}, ${p.city} • Outstanding: ₹${p.currentOutstanding.toLocaleString('en-IN')}`,
          id: p.id,
          icon: Store,
        });
      }
    });

    // Orders
    orders.forEach((o) => {
      if (
        o.orderNumber.toLowerCase().includes(q) ||
        o.partyName.toLowerCase().includes(q) ||
        o.staffName.toLowerCase().includes(q)
      ) {
        list.push({
          type: 'Order',
          title: `${o.orderNumber} - ${o.partyName}`,
          subtitle: `Date: ${o.date} • Total: ₹${o.grandTotal.toLocaleString('en-IN')} • Status: ${o.status}`,
          id: o.id,
          icon: ShoppingBag,
        });
      }
    });

    // Payments & Cheques
    payments.forEach((p) => {
      if (
        p.receiptNumber.toLowerCase().includes(q) ||
        p.partyName.toLowerCase().includes(q) ||
        p.chequeDetails?.chequeNumber?.includes(q) ||
        p.chequeDetails?.bankName?.toLowerCase().includes(q)
      ) {
        list.push({
          type: 'Payment',
          title: `${p.receiptNumber} (${p.mode}) - ${p.partyName}`,
          subtitle: `Amount: ₹${p.amount.toLocaleString('en-IN')} • ${p.chequeDetails ? 'Cheque #' + p.chequeDetails.chequeNumber : 'Direct'}`,
          id: p.id,
          icon: CreditCard,
        });
      }
    });

    // Companies
    companies.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) {
        list.push({
          type: 'Company',
          title: c.name,
          subtitle: `Code: ${c.code} • Divisions: ${c.divisions.join(', ')}`,
          id: c.id,
          icon: Building,
        });
      }
    });

    // Staff
    staff.forEach((s) => {
      if (s.fullName.toLowerCase().includes(q) || s.mobile.includes(q) || s.employeeCode.toLowerCase().includes(q)) {
        list.push({
          type: 'Staff',
          title: `${s.fullName} (${s.employeeCode})`,
          subtitle: `${s.designation} • ${s.assignedArea} • ${s.mobile}`,
          id: s.id,
          icon: Users,
        });
      }
    });

    return list.slice(0, 20); // Top 20 results
  }, [query, products, parties, orders, payments, companies, staff]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-sky-600 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search party, product, company, order #, cheque #, staff..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-0 outline-none text-slate-800 text-sm sm:text-base placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {query.trim().length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-sky-500" />
              <p className="text-sm font-medium">Type any keyword to search across the entire ERP</p>
              <p className="text-xs text-slate-400 mt-1">
                Try: <span className="font-semibold text-sky-600">proha</span>,{' '}
                <span className="font-semibold text-sky-600">ganesh</span>,{' '}
                <span className="font-semibold text-sky-600">pantocid</span>,{' '}
                <span className="font-semibold text-sky-600">004921</span>
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm font-medium">No records found matching "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Check spelling or try a partial term.</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => {
                    if (onSelectResult) onSelectResult(item.type, item.id);
                    onClose();
                  }}
                  className="p-3 hover:bg-sky-50 rounded-xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-600 group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">{item.title}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-sky-600 opacity-0 group-hover:opacity-100 transition whitespace-nowrap ml-2">
                    View →
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-right text-[11px] text-slate-400 flex justify-between items-center px-4">
          <span>Centralized Database Index</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
