import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  FileText,
  AlertCircle,
  ArrowLeft,
  Building,
  Tag,
  Package,
} from 'lucide-react';
import { Party, Product, Order, OrderItem, User, Staff } from '../../types';
import { db } from '../../services/db';
import { generateOrderSummaryPdf } from '../../services/exportService';

interface StaffOrderBookingProps {
  currentUser: User;
  preSelectedParty?: Party | null;
  onBack: () => void;
}

export const StaffOrderBooking: React.FC<StaffOrderBookingProps> = ({
  currentUser,
  preSelectedParty,
  onBack,
}) => {
  const staff = db.getStaff().find((s) => s.userId === currentUser.id) || db.getStaff()[0];
  const parties = db.getParties();
  const products = db.getProducts();

  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    preSelectedParty ? preSelectedParty.id : parties[0]?.id || ''
  );
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 10);
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.genericName.toLowerCase().includes(q) ||
        p.salt.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.barcode.includes(q)
    );
  }, [productSearch, products]);

  // Calculate scheme bonus quantity
  const calculateFreeQuantity = (scheme: string, quantity: number): number => {
    if (!scheme || scheme === 'None') return 0;
    const match = scheme.match(/(\d+)\+(\d+)/);
    if (match) {
      const buy = parseInt(match[1], 10);
      const free = parseInt(match[2], 10);
      if (buy > 0 && free > 0) {
        return Math.floor(quantity / buy) * free;
      }
    }
    return 0;
  };

  const handleAddToCart = (product: Product, qty = 10) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const newQty = existing ? existing.quantity + qty : qty;
      const freeQty = calculateFreeQuantity(product.scheme, newQty);
      const basicAmount = Number((newQty * product.ptr).toFixed(2));
      const gstAmount = Number(((basicAmount * product.gstRate) / 100).toFixed(2));
      const netAmount = Number((basicAmount + gstAmount).toFixed(2));

      const updatedItem: OrderItem = {
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
        return prev.map((item) => (item.productId === product.id ? updatedItem : item));
      } else {
        return [...prev, updatedItem];
      }
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
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

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const basicTotal = cart.reduce((sum, item) => sum + item.basicAmount, 0);
  const gstTotal = cart.reduce((sum, item) => sum + item.gstAmount, 0);
  const grandTotal = basicTotal + gstTotal;

  const handleSubmitOrder = () => {
    if (!selectedParty) {
      alert('Please select a customer party');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty. Add products before booking order.');
      return;
    }

    setIsSubmitting(true);
    const orderNumber = `KMA-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staffId: staff.id,
      staffName: staff.fullName,
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      partyAddress: `${selectedParty.address}, ${selectedParty.city}`,
      items: cart,
      basicTotal,
      discountTotal: 0,
      gstTotal,
      grandTotal,
      gpsLatitude: selectedParty.gpsLatitude,
      gpsLongitude: selectedParty.gpsLongitude,
      status: 'Submitted',
      remarks: remarks || undefined,
      createdAt: new Date().toISOString(),
    };

    db.addOrder(newOrder, currentUser);
    setSubmittedOrder(newOrder);
    setIsSubmitting(false);
  };

  if (submittedOrder) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4 text-center">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-9 h-9" />
          </div>
          <span className="text-xs uppercase font-bold text-emerald-600 tracking-wider">Order Booked</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{submittedOrder.orderNumber}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Party: <strong className="text-slate-800">{submittedOrder.partyName}</strong>
          </p>

          <div className="mt-4 p-4 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Items Ordered:</span>
              <span className="font-semibold">{submittedOrder.items.length} Lines</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Basic Value:</span>
              <span className="font-semibold">₹{submittedOrder.basicTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST Amount:</span>
              <span className="font-semibold">₹{submittedOrder.gstTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-sky-700">
              <span>Grand Total:</span>
              <span>₹{submittedOrder.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col space-y-2">
            <button
              onClick={() => generateOrderSummaryPdf(submittedOrder)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow"
            >
              <FileText className="w-4 h-4" />
              <span>Download Order PDF / Summary</span>
            </button>

            <button
              onClick={() => {
                setSubmittedOrder(null);
                setCart([]);
                setRemarks('');
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
            >
              Book Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-right">
          <h2 className="text-base font-bold text-slate-900">Order Booking</h2>
          <p className="text-[11px] text-slate-500">Less Typing • Auto Scheme & Calculations</p>
        </div>
      </div>

      {/* Party Selector Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Select Chemist / Party *
        </label>
        <select
          value={selectedPartyId}
          onChange={(e) => setSelectedPartyId(e.target.value)}
          className="w-full px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50"
        >
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.area}, {p.city} (Outst: ₹{p.currentOutstanding.toLocaleString('en-IN')})
            </option>
          ))}
        </select>

        {selectedParty && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-slate-500">
              Outstanding: <strong className="text-rose-600">₹{selectedParty.currentOutstanding.toLocaleString('en-IN')}</strong>
            </span>
            <span className="text-slate-500">
              Credit Limit: <strong>₹{(selectedParty.creditLimit / 1000).toFixed(0)}k</strong> ({selectedParty.creditDays}d)
            </span>
          </div>
        )}
      </div>

      {/* Product Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search product, salt, brand, company (e.g. proha, pantocid, cipla)..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
        />
      </div>

      {/* Product Search Results */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto">
        {filteredProducts.map((p) => {
          const inCart = cart.find((i) => i.productId === p.id);
          const isLowStock = p.stock <= p.reorderLevel;

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex items-center justify-between hover:border-sky-300 transition"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{p.name}</h4>
                  {p.scheme && p.scheme !== 'None' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
                      🎁 {p.scheme}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">{p.salt}</p>
                <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-600">
                  <span>
                    MRP: <del className="text-slate-400">₹{p.mrp}</del>
                  </span>
                  <span className="font-bold text-sky-700">PTR: ₹{p.ptr.toFixed(2)}</span>
                  <span>GST: {p.gstRate}%</span>
                  <span className={`font-semibold ${isLowStock ? 'text-rose-600' : 'text-slate-500'}`}>
                    Stock: {p.stock}
                  </span>
                </div>
              </div>

              <div>
                {inCart ? (
                  <div className="flex items-center space-x-1.5 bg-sky-50 border border-sky-300 rounded-lg p-1">
                    <button
                      onClick={() => updateCartQty(p.id, -5)}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-sky-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-sky-900 px-1">{inCart.quantity}</span>
                    <button
                      onClick={() => updateCartQty(p.id, 5)}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-sky-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(p, 10)}
                    disabled={p.stock <= 0}
                    className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+10</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary Section */}
      {cart.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Order Cart ({cart.length} Products)
              </h3>
            </div>
            <button
              onClick={() => setCart([])}
              className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold"
            >
              Clear Cart
            </button>
          </div>

          {/* Cart Items list */}
          <div className="divide-y divide-slate-100 space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{item.productName}</p>
                  <p className="text-[11px] text-slate-500">
                    {item.quantity} units {item.freeQuantity > 0 && `(+${item.freeQuantity} free)`} @ PTR ₹{item.ptr} • GST {item.gstRate}%
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-900">₹{item.netAmount.toFixed(2)}</span>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Basic Value:</span>
              <span>₹{basicTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total GST:</span>
              <span>₹{gstTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Net Order Value:</span>
              <span className="text-sky-700">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Order Delivery Remarks */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Delivery Remarks / Urgent Dispatch Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Send via afternoon tempo batch / urgent hospital batch"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>SUBMIT ORDER (₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })})</span>
          </button>
        </div>
      )}
    </div>
  );
};
