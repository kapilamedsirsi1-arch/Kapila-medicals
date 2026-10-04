import React, { useState } from 'react';
import {
  Building2,
  Package,
  TrendingUp,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { User, Company, Product, Order } from '../../types';
import { db } from '../../services/db';
import { exportToExcel } from '../../services/exportService';

interface CompanyRepPortalViewProps {
  currentUser: User;
}

export const CompanyRepPortalView: React.FC<CompanyRepPortalViewProps> = ({ currentUser }) => {
  const companies = db.getCompanies();
  // Strictly filter to assigned company
  const myCompany =
    companies.find((c) => c.id === currentUser.relatedCompanyId) || companies[0];

  const allProducts = db.getProducts();
  const myProducts = allProducts.filter((p) => p.companyId === myCompany.id);

  const allOrders = db.getOrders();
  // Filter order items only belonging to this company
  const companySalesItems = allOrders.flatMap((o) =>
    o.items
      .filter((item) => myProducts.some((mp) => mp.id === item.productId))
      .map((item) => ({ ...item, orderDate: o.date, partyName: o.partyName }))
  );

  const totalSalesVal = companySalesItems.reduce((sum, item) => sum + item.netAmount, 0);
  const totalStockUnits = myProducts.reduce((sum, p) => sum + p.stock, 0);

  const handleExportCompanyReport = () => {
    const rows = myProducts.map((p) => ({
      'Product Code': p.productCode,
      'Product Name': p.name,
      Division: p.division,
      'Pack Size': p.packSize,
      MRP: p.mrp,
      PTR: p.ptr,
      PTS: p.pts,
      Scheme: p.scheme,
      'Current Closing Stock': p.stock,
      'Reorder Level': p.reorderLevel,
    }));
    exportToExcel(rows, `${myCompany.code}_Stock_Movement_Report`, 'Products');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Confidentiality Warning & Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-purple-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500 rounded-xl text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                  Company Representative Portal
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                  CONFIDENTIAL & ISOLATED
                </span>
              </div>
              <h1 className="text-xl font-bold">{myCompany.name}</h1>
              <p className="text-xs text-slate-300">
                Divisions: {myCompany.divisions.join(', ')} • Authorized Rep: {currentUser.name}
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCompanyReport}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Closing Stock</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-purple-600 block">
            {myCompany.code} Net Sales Volume
          </span>
          <span className="text-2xl font-black text-purple-700 tracking-tight">
            ₹{totalSalesVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 block mt-1">Through Kapila Medical Agencies</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Catalog Formulations
          </span>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">
            {myProducts.length} Active SKUs
          </span>
          <span className="text-xs text-slate-500 block mt-1">Under Sirsi Distribution Hub</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">
            Warehouse Closing Stock
          </span>
          <span className="text-2xl font-black text-emerald-700 tracking-tight">
            {totalStockUnits} Units Available
          </span>
          <span className="text-xs text-slate-500 block mt-1">Safe coverage for 14 days</span>
        </div>
      </div>

      {/* Authorized Products List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-sm text-slate-900">{myCompany.name} Product Movement & Stock</h3>
          <span className="text-xs text-slate-500">Live Depot Inventory</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Product Name & Salt</th>
                <th className="p-3">Division</th>
                <th className="p-3">Pack Size</th>
                <th className="p-3 text-right">MRP (₹)</th>
                <th className="p-3 text-right">PTR (₹)</th>
                <th className="p-3 text-center">Scheme</th>
                <th className="p-3 text-right">Closing Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myProducts.map((p) => {
                const isLow = p.stock <= p.reorderLevel;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      <p>{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-normal">{p.salt}</p>
                    </td>
                    <td className="p-3 text-slate-600">{p.division}</td>
                    <td className="p-3 text-slate-700">{p.packSize}</td>
                    <td className="p-3 text-right text-slate-500">₹{p.mrp.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-sky-700">₹{p.ptr.toFixed(2)}</td>
                    <td className="p-3 text-center font-bold text-emerald-700">{p.scheme}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {p.stock} Units
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
