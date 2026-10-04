import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { Order, OrderStatus, User } from '../../types';
import { db } from '../../services/db';
import { exportOrdersToExcel, generateOrderSummaryPdf } from '../../services/exportService';

interface OrderManagementProps {
  currentUser: User;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ currentUser }) => {
  const orders = db.getOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const statuses: OrderStatus[] = [
    'Draft',
    'Submitted',
    'Admin Review',
    'Approved',
    'Processing',
    'Packed',
    'Dispatched',
    'Delivered',
    'Cancelled',
    'Partially Supplied',
  ];

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    db.updateOrderStatus(orderId, newStatus, currentUser, `Status moved to ${newStatus}`);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      o.partyName.toLowerCase().includes(q) ||
      o.staffName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Approved':
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Submitted':
      case 'Admin Review':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Processing':
      case 'Packed':
      case 'Dispatched':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Order Fulfillment Pipeline
          </span>
          <h1 className="text-xl font-bold text-slate-900">Order Booking & Dispatch Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track orders from Field Tour Boys, review stock, approve credit, and issue delivery manifests
          </p>
        </div>

        <button
          onClick={() => exportOrdersToExcel(orders)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-300"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Orders Excel</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search order #, chemist name, tour boy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="ALL">All Statuses ({orders.length})</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Chemist / Party</th>
                <th className="p-3.5">Tour Boy</th>
                <th className="p-3.5 text-center">Items</th>
                <th className="p-3.5 text-right">Grand Total (₹)</th>
                <th className="p-3.5 text-center">Pipeline Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold font-mono text-slate-900">{o.orderNumber}</td>
                  <td className="p-3.5 text-slate-500">
                    <p className="font-semibold text-slate-800">{o.date}</p>
                    <p className="text-[10px] text-slate-400">{o.time}</p>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    <p className="text-slate-900">{o.partyName}</p>
                    <p className="text-[10px] text-slate-500 font-normal">{o.partyAddress}</p>
                  </td>
                  <td className="p-3.5 text-slate-600">{o.staffName}</td>
                  <td className="p-3.5 text-center font-bold">{o.items.length}</td>
                  <td className="p-3.5 text-right font-black text-sm text-indigo-700">
                    ₹{o.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-center">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border focus:outline-none cursor-pointer ${getStatusBadge(
                        o.status
                      )}`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                        title="View Order Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => generateOrderSummaryPdf(o)}
                        className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg"
                        title="Download PDF Summary"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 bg-indigo-600 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                  Order Invoice Summary
                </span>
                <h3 className="font-bold text-base sm:text-lg">{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-indigo-100">{selectedOrder.partyName}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white hover:bg-indigo-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Chemist / Customer</span>
                  <span className="font-bold text-slate-900">{selectedOrder.partyName}</span>
                  <span className="text-slate-500 block text-[11px]">{selectedOrder.partyAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Booking Representative</span>
                  <span className="font-bold text-slate-900">{selectedOrder.staffName}</span>
                  <span className="text-slate-500 block text-[11px]">
                    Date: {selectedOrder.date} at {selectedOrder.time}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Pack</th>
                      <th className="p-2.5 text-right">PTR</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-center">Free</th>
                      <th className="p-2.5 text-center">GST%</th>
                      <th className="p-2.5 text-right">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-slate-800">{item.productName}</td>
                        <td className="p-2.5 text-slate-600">{item.packSize}</td>
                        <td className="p-2.5 text-right">₹{item.ptr.toFixed(2)}</td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">
                          {item.freeQuantity || 0}
                        </td>
                        <td className="p-2.5 text-center">{item.gstRate}%</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          ₹{item.netAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Basic Total:</span>
                  <span>₹{selectedOrder.basicTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Total:</span>
                  <span>₹{selectedOrder.gstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-indigo-700">
                    ₹{selectedOrder.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => generateOrderSummaryPdf(selectedOrder)}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
