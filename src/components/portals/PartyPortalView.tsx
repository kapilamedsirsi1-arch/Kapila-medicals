import React, { useState, useMemo } from 'react';
import {
  Store,
  CreditCard,
  ShoppingBag,
  FileText,
  Clock,
  CheckCircle,
  Phone,
  Plus,
  Minus,
  Trash2,
  Package,
  Search,
  Building,
  Tag,
  AlertCircle,
  TrendingUp,
  Receipt,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  Send,
  Sparkles,
  Zap,
  RotateCcw,
  Share2,
  QrCode,
  Truck,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { User, Party, Order, Payment, Product, OrderItem } from '../../types';
import { db } from '../../services/db';
import { generateOrderSummaryPdf } from '../../services/exportService';

interface PartyPortalViewProps {
  currentUser: User;
}

export const PartyPortalView: React.FC<PartyPortalViewProps> = ({ currentUser }) => {
  const parties = db.getParties();
  const currentParty =
    parties.find((p) => p.id === currentUser.relatedPartyId) || parties[0];

  const products = db.getProducts();
  const companies = db.getCompanies();
  const allOrders = db.getOrders();
  const orders = allOrders.filter((o) => o.partyId === currentParty.id);
  const payments = db.getPayments().filter((p) => p.partyId === currentParty.id);

  // Portal tabs
  const [activeTab, setActiveTab] = useState<'book_order' | 'orders' | 'ledger'>('book_order');

  // Order Booking States
  const [productSearch, setProductSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [selectedTherapeutic, setSelectedTherapeutic] = useState<string>('ALL');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [deliveryRemarks, setDeliveryRemarks] = useState('');
  const [deliverySlot, setDeliverySlot] = useState<string>('Regular Evening Dispatch (3–6 PM)');
  const [orderPriority, setOrderPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [showQuickPad, setShowQuickPad] = useState(false);
  const [quickPadText, setQuickPadText] = useState('');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Scheme calculation: e.g. 10+1 gives Math.floor(qty / 10) * 1 free units
  const calculateFreeQuantity = (scheme: string, qty: number): number => {
    if (!scheme || scheme === 'None') return 0;
    const match = scheme.match(/(\d+)\+(\d+)/);
    if (match) {
      const buy = parseInt(match[1], 10);
      const free = parseInt(match[2], 10);
      if (buy > 0 && free > 0) {
        return Math.floor(qty / buy) * free;
      }
    }
    return 0;
  };

  // Add / Adjust Cart
  const handleAddToCart = (product: Product, qtyToAdd = 10) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const newQty = existing ? existing.quantity + qtyToAdd : qtyToAdd;
      const freeQty = calculateFreeQuantity(product.scheme, newQty);
      const basicAmount = Number((newQty * product.ptr).toFixed(2));
      const gstAmount = Number(((basicAmount * product.gstRate) / 100).toFixed(2));
      const netAmount = Number((basicAmount + gstAmount).toFixed(2));

      const updated: OrderItem = {
        productId: product.id,
        productName: product.name,
        companyName: product.companyName,
        packSize: product.packSize,
        mrp: product.mrp,
        ptr: product.ptr,
        quantity: newQty,
        freeQuantity: freeQty,
        basicAmount,
        discountPercent: 0,
        gstRate: product.gstRate,
        gstAmount,
        netAmount,
      };

      if (existing) {
        return prev.map((item) => (item.productId === product.id ? updated : item));
      } else {
        return [...prev, updated];
      }
    });
  };

  // Batch Fast Order parse & add to cart
  const handleBatchQuickOrder = () => {
    if (!quickPadText.trim()) return;
    const lines = quickPadText.split('\n');
    let matchedCount = 0;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      // Format: "Dolo 650 20" or "Pantocid - 30"
      const match = trimmed.match(/(.+?)\s*[-:]?\s*(\d+)$/);
      let term = trimmed;
      let qty = 10;
      if (match) {
        term = match[1].trim();
        qty = parseInt(match[2], 10);
      }
      const found = products.find(
        (p) =>
          p.name.toLowerCase().includes(term.toLowerCase()) ||
          p.genericName.toLowerCase().includes(term.toLowerCase()) ||
          p.salt.toLowerCase().includes(term.toLowerCase())
      );
      if (found && qty > 0) {
        handleAddToCart(found, qty);
        matchedCount++;
      }
    });
    setQuickPadText('');
    setShowQuickPad(false);
  };

  // 1-Click Re-Order from past invoices
  const handleReorderPastOrder = (pastOrder: Order) => {
    let count = 0;
    pastOrder.items.forEach((item) => {
      const product =
        products.find((p) => p.id === item.productId) ||
        products.find((p) => p.name.toLowerCase() === item.productName.toLowerCase());
      if (product) {
        handleAddToCart(product, item.quantity);
        count++;
      }
    });
    setActiveTab('book_order');
    if (selectedOrderDetails) setSelectedOrderDetails(null);
  };

  // WhatsApp formatted share
  const handleShareWhatsApp = (order: Order) => {
    const lines = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.productName}* (${it.packSize}): ${it.quantity} units ${
            it.freeQuantity > 0 ? `(+${it.freeQuantity} Free)` : ''
          } = ₹${it.netAmount.toFixed(2)}`
      )
      .join('%0A');

    const text =
      `*NEW CHEMIST ORDER - M/s. KAPILA MEDICAL AGENCIES*%0A` +
      `----------------------------------------%0A` +
      `*Order No:* ${order.orderNumber}%0A` +
      `*Date:* ${order.date} (${order.time})%0A` +
      `*Chemist:* ${order.partyName}%0A` +
      `*Customer Code:* ${currentParty.customerCode}%0A` +
      `*Priority:* ${orderPriority}%0A` +
      `*Slot:* ${deliverySlot}%0A` +
      `*Instructions:* ${order.remarks}%0A` +
      `----------------------------------------%0A` +
      `*ITEMS BOOKED:*%0A${lines}%0A` +
      `----------------------------------------%0A` +
      `*Basic Total:* ₹${order.basicTotal.toFixed(2)}%0A` +
      `*GST Total:* ₹${order.gstTotal.toFixed(2)}%0A` +
      `*GRAND TOTAL:* ₹${order.grandTotal.toFixed(2)}%0A%0A` +
      `_Dispatched via Kapila Medical Agencies Chemist Cloud._`;

    const url = `https://wa.me/919448123456?text=${text}`;
    window.open(url, '_blank');
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const product = products.find((p) => p.id === productId);
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const freeQty = product ? calculateFreeQuantity(product.scheme, newQty) : 0;
            const basicAmount = Number((newQty * item.ptr).toFixed(2));
            const gstAmount = Number(((basicAmount * item.gstRate) / 100).toFixed(2));
            const netAmount = Number((basicAmount + gstAmount).toFixed(2));

            return {
              ...item,
              quantity: newQty,
              freeQuantity: freeQty,
              basicAmount,
              gstAmount,
              netAmount,
            };
          }
          return item;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Cart Totals
  const basicTotal = cart.reduce((sum, i) => sum + i.basicAmount, 0);
  const gstTotal = cart.reduce((sum, i) => sum + i.gstAmount, 0);
  const grandTotal = basicTotal + gstTotal;
  const totalFreeUnits = cart.reduce((sum, i) => sum + i.freeQuantity, 0);

  // Credit check
  const availableCredit = Math.max(0, currentParty.creditLimit - currentParty.currentOutstanding);
  const isExceedingCredit = grandTotal > availableCredit;

  // Submit Order directly to Kapila Medical Agencies
  const handleSubmitCustomerOrder = () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please select products to place an order.');
      return;
    }

    setIsSubmitting(true);
    const orderNumber = `KMA-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staffId: currentParty.assignedStaffId || 'st-1',
      staffName: 'Direct Chemist Portal Booking',
      partyId: currentParty.id,
      partyName: currentParty.name,
      partyAddress: `${currentParty.address}, ${currentParty.city}`,
      items: cart,
      basicTotal,
      discountTotal: 0,
      gstTotal,
      grandTotal,
      gpsLatitude: currentParty.gpsLatitude,
      gpsLongitude: currentParty.gpsLongitude,
      status: 'Submitted',
      remarks: `${orderPriority !== 'Normal' ? `[${orderPriority.toUpperCase()} PRIORITY] ` : ''}${deliverySlot}. ${deliveryRemarks}`.trim(),
      adminNote: 'Booked via Chemist Portal (Synced with Firebase Firestore)',
      createdAt: new Date().toISOString(),
    };

    db.addOrder(newOrder, currentUser);
    setOrderSuccess(newOrder);
    setCart([]);
    setDeliveryRemarks('');
    setIsSubmitting(false);
  };

  // Filtered Products for Catalog
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.genericName.toLowerCase().includes(q) ||
        p.salt.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q);

      const matchesCompany = selectedCompany === 'ALL' || p.companyId === selectedCompany;

      let matchesTherapeutic = true;
      if (selectedTherapeutic !== 'ALL') {
        const text = (p.name + ' ' + p.salt + ' ' + p.genericName).toLowerCase();
        if (selectedTherapeutic === 'Pain & Fever') {
          matchesTherapeutic = text.includes('paracetamol') || text.includes('dolo') || text.includes('aceclo') || text.includes('pain');
        } else if (selectedTherapeutic === 'Gastro & Antacid') {
          matchesTherapeutic = text.includes('panto') || text.includes('omep') || text.includes('rabe') || text.includes('antacid');
        } else if (selectedTherapeutic === 'Antibiotics') {
          matchesTherapeutic = text.includes('amoxi') || text.includes('azith') || text.includes('clav') || text.includes('cefix');
        } else if (selectedTherapeutic === 'Respiratory') {
          matchesTherapeutic = text.includes('salbut') || text.includes('asthalin') || text.includes('montair') || text.includes('inhaler');
        } else if (selectedTherapeutic === 'Cardiac & Diabetic') {
          matchesTherapeutic = text.includes('cardio') || text.includes('telmi') || text.includes('atorv') || text.includes('metformin');
        } else if (selectedTherapeutic === 'Nutritional & Calcium') {
          matchesTherapeutic = text.includes('calcium') || text.includes('shelcal') || text.includes('protein') || text.includes('prohance');
        }
      }

      return matchesQuery && matchesCompany && matchesTherapeutic;
    });
  }, [productSearch, selectedCompany, selectedTherapeutic, products]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">
      {/* Top Welcome Chemist Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg border border-sky-400/40">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider bg-sky-900/60 px-2 py-0.5 rounded border border-sky-700">
                  {currentParty.customerType} Portal
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  CODE: {currentParty.customerCode}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">{currentParty.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentParty.address}, {currentParty.city} • Contact: {currentParty.contactPerson} ({currentParty.mobile})
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 flex flex-col sm:items-end justify-center">
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Firebase Cloud Active
              </span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Wholesale Supplier</span>
            <span className="text-xs font-bold text-sky-400 block">M/s. Kapila Medical Agencies</span>
            <span className="text-[10px] text-slate-400">Court Road, Sirsi • GSTIN: 29AABFK9897N1Z7</span>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Current Outstanding</span>
            <span className="text-base font-bold text-rose-400">
              ₹{currentParty.currentOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">Credit Limit</span>
            <span className="text-base font-bold text-slate-200">
              ₹{currentParty.creditLimit.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">Available Credit</span>
            <span className="text-base font-bold text-emerald-400">
              ₹{availableCredit.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">Payment Term</span>
            <span className="text-base font-bold text-sky-300">{currentParty.creditDays} Days Net</span>
          </div>

          <div className="flex items-center col-span-2 sm:col-span-1 justify-end">
            <button
              onClick={() => setShowUpiModal(true)}
              className="w-full sm:w-auto px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow transition"
              title="Pay outstanding via PhonePe, Google Pay, Paytm UPI QR"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Pay via UPI QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs space-x-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('book_order')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl transition flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === 'book_order'
              ? 'bg-sky-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Book New Order</span>
          {cart.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
              {cart.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl transition flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-sky-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders & Invoices ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl transition flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'bg-sky-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Account Ledger & Receipts</span>
        </button>
      </div>

      {/* SUCCESS MODAL AFTER PLACING ORDER */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <span className="text-[11px] uppercase font-bold text-emerald-600 tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Order Dispatched to Warehouse
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{orderSuccess.orderNumber}</h2>
            <p className="text-xs text-slate-600 mt-1">
              Your pharmaceutical order has been received by <strong>Kapila Medical Agencies, Sirsi</strong>. Our warehouse team is picking and packing your items.
            </p>

            <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-left text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Item Count:</span>
                <span className="font-semibold text-slate-800">{orderSuccess.items.length} Product Lines</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Basic Value:</span>
                <span className="font-semibold text-slate-800">₹{orderSuccess.basicTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST Value:</span>
                <span className="font-semibold text-slate-800">₹{orderSuccess.gstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-sky-700">
                <span>Grand Total:</span>
                <span>₹{orderSuccess.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Firebase Confirmation Badge */}
            <div className="mt-3 py-1.5 px-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-800">
              <span className="flex items-center space-x-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Saved & Synced to Firebase Firestore</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-600">orders/{orderSuccess.id}</span>
            </div>

            <div className="mt-5 flex flex-col space-y-2">
              <button
                onClick={() => handleShareWhatsApp(orderSuccess)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Order on WhatsApp to KMA Desk</span>
              </button>

              <button
                onClick={() => generateOrderSummaryPdf(orderSuccess)}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Order Copy (PDF)</span>
              </button>

              <button
                onClick={() => {
                  setOrderSuccess(null);
                  setActiveTab('orders');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                View in Order History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ORDER BOOKING SYSTEM */}
      {activeTab === 'book_order' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Product Search & Catalog (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Input & Fast Order Entry */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search medicine brand, generic salt, company (e.g. Prohance, Pantocid, Asthalin, Montair)..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <button
                  onClick={() => setShowQuickPad(true)}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition whitespace-nowrap"
                  title="Paste or quickly enter daily short-book prescription order"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">⚡ Fast Order Pad</span>
                  <span className="sm:hidden">⚡ Fast</span>
                </button>
              </div>

              {/* Therapeutic Category Filter Chips */}
              <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  'ALL',
                  'Pain & Fever',
                  'Gastro & Antacid',
                  'Antibiotics',
                  'Respiratory',
                  'Cardiac & Diabetic',
                  'Nutritional & Calcium',
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedTherapeutic(cat)}
                    className={`px-3 py-1 rounded-lg whitespace-nowrap transition font-semibold text-[11px] ${
                      selectedTherapeutic === cat
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Therapies' : cat}
                  </button>
                ))}
              </div>

              {/* Company Filter Chips */}
              <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs pt-1 border-t border-slate-100">
                <button
                  onClick={() => setSelectedCompany('ALL')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-semibold ${
                    selectedCompany === 'ALL'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Manufacturers
                </button>
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompany(c.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-semibold ${
                      selectedCompany === c.id
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-sky-500" />
                  <p className="text-sm font-semibold text-slate-700">No matching medicines found</p>
                  <p className="text-xs text-slate-400 mt-1">Try another brand name, active salt, or manufacturer.</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const inCart = cart.find((item) => item.productId === p.id);
                  const isLowStock = p.stock <= p.reorderLevel;

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-sky-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">{p.name}</h3>
                          {p.scheme && p.scheme !== 'None' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0 animate-pulse">
                              🎁 Scheme: {p.scheme}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                          <span className="font-semibold text-slate-700">{p.companyName}</span> • {p.salt}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          <span className="text-slate-400">
                            Pack: <strong className="text-slate-700">{p.packSize}</strong>
                          </span>
                          <span className="text-slate-400">
                            MRP: <del className="text-slate-400">₹{p.mrp.toFixed(2)}</del>
                          </span>
                          <span className="font-black text-sky-700 text-sm">
                            PTR: ₹{p.ptr.toFixed(2)}
                          </span>
                          <span className="text-slate-500 text-[11px]">GST: {p.gstRate}%</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isLowStock ? 'Low Stock' : 'Ready Stock'}
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Add to Cart Controls */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        {inCart ? (
                          <div className="flex items-center space-x-2 bg-sky-50 border border-sky-300 rounded-xl p-1.5 shadow-2xs">
                            <button
                              onClick={() => handleUpdateCartQty(p.id, -5)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-sky-700 flex items-center justify-center font-bold text-xs shadow-2xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="text-center px-2">
                              <span className="text-xs font-black text-sky-900 block">{inCart.quantity}</span>
                              {inCart.freeQuantity > 0 && (
                                <span className="text-[9px] font-bold text-emerald-600 block leading-none">
                                  +{inCart.freeQuantity} Free
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleUpdateCartQty(p.id, 5)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-sky-700 flex items-center justify-center font-bold text-xs shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => handleAddToCart(p, 10)}
                              className="px-3 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Order 10</span>
                            </button>

                            <button
                              onClick={() => handleAddToCart(p, 20)}
                              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition border border-slate-200"
                            >
                              +20
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Order Cart Summary (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 sticky top-20 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-sm text-slate-900">Your Procurement Cart</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto opacity-30 text-sky-500" />
                  <p className="text-xs font-semibold text-slate-600">Your cart is currently empty</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Select medicines from the catalog to book your wholesale supply. Schemes like 10+1 are applied automatically!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Cart Items list */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                    {cart.map((item) => (
                      <div key={item.productId} className="py-2.5 flex items-start justify-between text-xs">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-slate-900 leading-tight">{item.productName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {item.quantity} units @ ₹{item.ptr.toFixed(2)} • GST {item.gstRate}%
                          </p>
                          {item.freeQuantity > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 block">
                              🎁 +{item.freeQuantity} Free Units under scheme
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">₹{item.netAmount.toFixed(2)}</span>
                          <button
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculations Breakdown */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Basic Order Total:</span>
                      <span>₹{basicTotal.toFixed(2)}</span>
                    </div>

                    {totalFreeUnits > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Total Free Scheme Bonus:</span>
                        <span>{totalFreeUnits} Free Units</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Applicable GST:</span>
                      <span>₹{gstTotal.toFixed(2)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-base text-slate-900">
                      <span>Grand Order Total:</span>
                      <span className="text-sky-700">
                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Credit warning if exceeding */}
                  {isExceedingCredit && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                      <span>
                        Note: Order value (₹{grandTotal.toFixed(0)}) exceeds your current available credit (₹{availableCredit.toFixed(0)}). Admin credit review will apply.
                      </span>
                    </div>
                  )}

                  {/* Delivery Route Slot & Priority */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Preferred Dispatch Timing
                      </label>
                      <select
                        value={deliverySlot}
                        onChange={(e) => setDeliverySlot(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 font-medium text-slate-800"
                      >
                        <option value="Regular Evening Dispatch (3–6 PM)">Regular Evening Dispatch (3–6 PM)</option>
                        <option value="Morning Route Dispatch (10 AM–1 PM)">Morning Route Dispatch (10 AM–1 PM)</option>
                        <option value="Urgent Counter Delivery (Immediate)">Urgent Counter Delivery (Immediate)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Order Priority
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Normal', 'Urgent', 'Emergency'] as const).map((prio) => (
                          <button
                            key={prio}
                            type="button"
                            onClick={() => setOrderPriority(prio)}
                            className={`py-1.5 text-center rounded-lg text-[11px] font-bold transition border ${
                              orderPriority === prio
                                ? prio === 'Normal'
                                  ? 'bg-sky-600 text-white border-sky-600'
                                  : prio === 'Urgent'
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-rose-600 text-white border-rose-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {prio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Special Instructions / Patient Note
                      </label>
                      <input
                        type="text"
                        value={deliveryRemarks}
                        onChange={(e) => setDeliveryRemarks(e.target.value)}
                        placeholder="e.g. Include invoice copy / Send via Banavasi route tempo"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Firebase Cloud status notice */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 py-0.5">
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Firebase Real-time Cloud Active</span>
                    </span>
                    <span className="font-mono text-slate-400">Direct DB Sync</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitCustomerOrder}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>CONFIRM & PLACE ORDER (₹{grandTotal.toFixed(0)})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY ORDERS & INVOICES */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">Your Placed Orders with Kapila Medical Agencies</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status updates from warehouse dispatch</p>
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                {orders.length} Total Orders
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30 text-sky-500" />
                <p className="text-sm font-semibold text-slate-700">No orders placed yet</p>
                <p className="text-xs text-slate-400 mt-1">Switch to the "Book New Order" tab to place your first order.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Order Number</th>
                      <th className="p-3.5">Date & Time</th>
                      <th className="p-3.5 text-center">Items</th>
                      <th className="p-3.5 text-right">Basic (₹)</th>
                      <th className="p-3.5 text-right">GST (₹)</th>
                      <th className="p-3.5 text-right">Total Value (₹)</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold font-mono text-slate-900">{o.orderNumber}</td>
                        <td className="p-3.5 text-slate-600">
                          {o.date} <span className="text-[10px] text-slate-400">({o.time})</span>
                        </td>
                        <td className="p-3.5 text-center font-bold">{o.items.length} Lines</td>
                        <td className="p-3.5 text-right text-slate-600">₹{o.basicTotal.toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600">₹{o.gstTotal.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-black text-sm text-sky-700">
                          ₹{o.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              o.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : o.status === 'Approved' || o.status === 'Processing'
                                ? 'bg-sky-100 text-sky-800 border-sky-300'
                                : o.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleReorderPastOrder(o)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1"
                              title="Re-order these items into cart"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span className="hidden sm:inline">Re-Order</span>
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(o)}
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200"
                              title="Share on WhatsApp to KMA Wholesale Desk"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedOrderDetails(o)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => generateOrderSummaryPdf(o)}
                              className="p-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-200"
                              title="Download PDF Invoice Summary"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNT LEDGER & RECEIPTS */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Outstanding Ageing Breakdown */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Account Outstanding Ageing Schedule</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">0–30 Days</span>
                <span className="text-base font-bold text-emerald-600">
                  ₹{Math.round(currentParty.currentOutstanding * 0.5).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Within Credit Term</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">31–60 Days</span>
                <span className="text-base font-bold text-amber-600">
                  ₹{Math.round(currentParty.currentOutstanding * 0.3).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Payment Due</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">61–90 Days</span>
                <span className="text-base font-bold text-orange-600">
                  ₹{Math.round(currentParty.currentOutstanding * 0.15).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Critical Overdue</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Outstanding</span>
                <span className="text-base font-black text-rose-700">
                  ₹{currentParty.currentOutstanding.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-rose-500 font-semibold block">Net Payable</span>
              </div>
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Official Payment & Cheque Realization Receipts</h3>
              <span className="text-xs text-slate-500">{payments.length} Receipts Logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Mode</th>
                    <th className="p-3.5">Cheque / Reference Details</th>
                    <th className="p-3.5 text-right">Amount Credited (₹)</th>
                    <th className="p-3.5 text-right">Balance Outstanding (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                      <td className="p-3.5 text-slate-600">{p.date} {p.time}</td>
                      <td className="p-3.5 font-bold text-slate-800">{p.mode}</td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                        {p.chequeDetails?.chequeNumber
                          ? `Cheque #${p.chequeDetails.chequeNumber} (${p.chequeDetails.bankName})`
                          : p.upiDetails?.transactionId || 'Counter Cash'}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-700 text-sm">
                        ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-700">
                        ₹{p.outstandingAfter.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS INSPECTION MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-slate-200">
            <div className="p-5 bg-sky-600 text-white rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-200 tracking-wider">
                  Order Details
                </span>
                <h3 className="font-bold text-base sm:text-lg">{selectedOrderDetails.orderNumber}</h3>
                <p className="text-xs text-sky-100">Date: {selectedOrderDetails.date} at {selectedOrderDetails.time}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-white hover:bg-sky-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Pack</th>
                      <th className="p-2.5 text-right">PTR</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-center">Free</th>
                      <th className="p-2.5 text-right">Net Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrderDetails.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{item.productName}</td>
                        <td className="p-2.5 text-slate-500">{item.packSize}</td>
                        <td className="p-2.5 text-right">₹{item.ptr.toFixed(2)}</td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">
                          {item.freeQuantity || 0}
                        </td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          ₹{item.netAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Basic Total:</span>
                  <span>₹{selectedOrderDetails.basicTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Total:</span>
                  <span>₹{selectedOrderDetails.gstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Order Grand Total:</span>
                  <span className="text-sky-700">
                    ₹{selectedOrderDetails.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleReorderPastOrder(selectedOrderDetails)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔁 Re-Order These Items</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(selectedOrderDetails)}
                  className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Share on WhatsApp</span>
                </button>
              </div>

              <button
                onClick={() => generateOrderSummaryPdf(selectedOrderDetails)}
                className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Order Summary PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAST ORDER PAD MODAL */}
      {showQuickPad && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">⚡ Fast Order Pad / Short-Book Entry</h3>
                  <p className="text-xs text-slate-500">Paste or type medicine lines with quantities</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickPad(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Format: <code>Medicine Name [Qty]</code> (one item per line)
              </label>
              <textarea
                rows={6}
                value={quickPadText}
                onChange={(e) => setQuickPadText(e.target.value)}
                placeholder="Example:&#10;Dolo 650 20&#10;Pantocid 40 30&#10;Asthalin Inhaler 10&#10;Shelcal 500 15&#10;Prohance Renal 10"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-500">
                💡 Automatically searches M/s. Kapila Medical Agencies stock, applies 10+1 / 20+2 schemes, and adds directly to your procurement cart.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleBatchQuickOrder}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Parse & Add All to Cart</span>
              </button>
              <button
                onClick={() => setShowQuickPad(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI QR PAYMENT MODAL */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Instant Wholesale Settlement
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">UPI Instant Payment QR</h3>
              </div>
              <button
                onClick={() => setShowUpiModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `upi://pay?pa=kapila.agencies@icici&pn=KapilaMedicalAgencies&am=${currentParty.currentOutstanding}&cu=INR`
                  )}`}
                  alt="Kapila Medical Agencies UPI QR"
                  className="w-48 h-48 rounded-lg"
                />
              </div>

              <div className="mt-3 text-center space-y-1">
                <span className="text-xs text-slate-500">Payee Account:</span>
                <p className="font-bold text-sm text-slate-900">M/s. Kapila Medical Agencies</p>
                <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-600 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200">
                  <span>kapila.agencies@icici</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('kapila.agencies@icici');
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="text-sky-600 hover:text-sky-800"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Total Net Outstanding:</span>
                <span className="text-emerald-700">₹{currentParty.currentOutstanding.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-emerald-700 text-left">
                Scan using Google Pay, PhonePe, Paytm, or BHIM. Receipts are automatically booked into your ledger upon counter confirmation.
              </p>
            </div>

            <button
              onClick={() => setShowUpiModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
