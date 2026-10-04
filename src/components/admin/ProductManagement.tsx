import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Upload,
  FileSpreadsheet,
  Building,
  CheckCircle,
  AlertTriangle,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product, Company, User } from '../../types';
import { db } from '../../services/db';
import { exportToExcel } from '../../services/exportService';

interface ProductManagementProps {
  currentUser: User;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ currentUser }) => {
  const products = db.getProducts();
  const companies = db.getCompanies();

  const [activeTab, setActiveTab] = useState<'products' | 'companies' | 'import'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');

  // Add Product Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [salt, setSalt] = useState('');
  const [strength, setStrength] = useState('');
  const [dosage, setDosage] = useState('');
  const [packSize, setPackSize] = useState('10 Tablets');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [division, setDivision] = useState(companies[0]?.divisions[0] || 'General');
  const [mrp, setMrp] = useState('150');
  const [ptr, setPtr] = useState('120');
  const [pts, setPts] = useState('110');
  const [gstRate, setGstRate] = useState<number>(12);
  const [scheme, setScheme] = useState('10+1');
  const [stock, setStock] = useState('100');
  const [reorderLevel, setReorderLevel] = useState('20');
  const [productCode, setProductCode] = useState('');
  const [barcode, setBarcode] = useState('');

  // Import preview state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [importReport, setImportReport] = useState<{ newCount: number; updateCount: number } | null>(null);

  const resetForm = () => {
    setName('');
    setGenericName('');
    setSalt('');
    setStrength('');
    setDosage('');
    setPackSize('10 Tablets');
    setMrp('150');
    setPtr('120');
    setPts('110');
    setGstRate(12);
    setScheme('10+1');
    setStock('100');
    setReorderLevel('20');
    setProductCode('PRD-' + Math.floor(100 + Math.random() * 900));
    setBarcode('8901' + Math.floor(100000000 + Math.random() * 900000000));
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find((c) => c.id === companyId);

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      companyId,
      companyName: comp?.name || 'Pharma Co',
      division,
      name,
      genericName,
      salt: salt || genericName,
      strength: strength || 'N/A',
      dosage: dosage || 'As directed',
      packSize,
      mrp: parseFloat(mrp) || 0,
      ptr: parseFloat(ptr) || 0,
      pts: parseFloat(pts) || 0,
      gstRate,
      scheme: scheme || 'None',
      stock: parseInt(stock, 10) || 0,
      reorderLevel: parseInt(reorderLevel, 10) || 20,
      productCode: productCode || 'PRD-' + Date.now(),
      barcode: barcode || '890123456789',
      status: 'active',
    };

    db.addProduct(newProd, currentUser);
    setShowAddModal(false);
    alert(`Product "${newProd.name}" added to master database!`);
  };

  // Excel file upload handler with column mapping & preview (Section 21)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      let newCount = 0;
      let updateCount = 0;

      const parsedProds: Product[] = data.map((row: any, idx: number) => {
        const prodName = row['Product Name'] || row['Product'] || row['Name'] || `Imported Item ${idx + 1}`;
        const compName = row['Company'] || row['Manufacturer'] || 'Sun Pharmaceutical Industries Ltd';
        const pCode = row['Product Code'] || row['Code'] || `IMP-${idx + 100}`;
        const pPtr = parseFloat(row['PTR'] || row['Rate'] || '100');
        const pMrp = parseFloat(row['MRP'] || (pPtr * 1.25).toFixed(2));
        const pPts = parseFloat(row['PTS'] || (pPtr * 0.92).toFixed(2));
        const pGst = parseInt(row['GST'] || row['GST%'] || '12', 10);
        const pStock = parseInt(row['Stock'] || row['Qty'] || '50', 10);

        const exists = products.some(
          (p) => p.productCode.toLowerCase() === pCode.toLowerCase() || p.name.toLowerCase() === prodName.toLowerCase()
        );
        if (exists) updateCount++;
        else newCount++;

        return {
          id: 'imp-prod-' + idx + '-' + Date.now(),
          companyId: companies[0]?.id || 'comp-1',
          companyName: compName,
          division: row['Division'] || 'General',
          name: prodName,
          genericName: row['Generic'] || prodName,
          salt: row['Salt'] || prodName,
          strength: row['Strength'] || 'Standard',
          dosage: 'Oral',
          packSize: row['Pack'] || row['Pack Size'] || '10s',
          mrp: pMrp,
          ptr: pPtr,
          pts: pPts,
          gstRate: pGst,
          scheme: row['Scheme'] || '10+1',
          stock: pStock,
          reorderLevel: 20,
          productCode: pCode,
          barcode: row['Barcode'] || '8901234567000',
          status: 'active',
        };
      });

      setPreviewProducts(parsedProds);
      setImportReport({ newCount, updateCount });
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (previewProducts.length === 0) return;
    db.bulkImportProducts(previewProducts, currentUser);
    alert(`Successfully imported ${previewProducts.length} products into Kapila Medical Agencies master database!`);
    setPreviewProducts([]);
    setImportReport(null);
    setImportFile(null);
    setActiveTab('products');
  };

  const handleExportProducts = () => {
    const rows = products.map((p) => ({
      'Product Code': p.productCode,
      'Product Name': p.name,
      Company: p.companyName,
      Division: p.division,
      Salt: p.salt,
      'Pack Size': p.packSize,
      MRP: p.mrp,
      PTR: p.ptr,
      PTS: p.pts,
      'GST %': p.gstRate,
      Scheme: p.scheme,
      Stock: p.stock,
      'Reorder Level': p.reorderLevel,
      Barcode: p.barcode,
    }));
    exportToExcel(rows, 'Kapila_Product_Master', 'Products');
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.genericName.toLowerCase().includes(q) ||
      p.salt.toLowerCase().includes(q) ||
      p.companyName.toLowerCase().includes(q) ||
      p.productCode.toLowerCase().includes(q);
    const matchesComp = selectedCompanyId === 'ALL' || p.companyId === selectedCompanyId;
    return matchesSearch && matchesComp;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Inventory & Price List Master
          </span>
          <h1 className="text-xl font-bold text-slate-900">Product & Company Database</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            MRP, PTR, PTS, Schemes (10+1), GST% and Stock levels for wholesale distribution
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportProducts}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-indigo-200"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'products'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Master ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'companies'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Companies & Divisions ({companies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'import'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Excel Data Centre</span>
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search product name, generic salt, company, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3.5">Product Name & Salt</th>
                    <th className="p-3.5">Company & Division</th>
                    <th className="p-3.5">Pack</th>
                    <th className="p-3.5 text-right">MRP (₹)</th>
                    <th className="p-3.5 text-right">PTR (₹)</th>
                    <th className="p-3.5 text-right">PTS (₹)</th>
                    <th className="p-3.5 text-center">Scheme</th>
                    <th className="p-3.5 text-center">GST %</th>
                    <th className="p-3.5 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stock <= p.reorderLevel;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</span>
                            <span className="text-[11px] text-slate-500 block font-normal">{p.salt}</span>
                            <span className="font-mono text-[10px] text-slate-400 block">{p.productCode}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 block">{p.companyName}</span>
                          <span className="text-[10px] text-slate-500">{p.division}</span>
                        </td>

                        <td className="p-3.5 text-slate-700">{p.packSize}</td>

                        <td className="p-3.5 text-right font-medium text-slate-500">₹{p.mrp.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-bold text-sky-700">₹{p.ptr.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-medium text-slate-600">₹{p.pts.toFixed(2)}</td>

                        <td className="p-3.5 text-center">
                          {p.scheme && p.scheme !== 'None' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {p.scheme}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-semibold text-slate-600">{p.gstRate}%</td>

                        <td className="p-3.5 text-right">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                              isLowStock
                                ? 'bg-rose-100 text-rose-700 animate-pulse'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {p.stock}
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
      )}

      {/* COMPANIES TAB */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    CODE: {c.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{c.address}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700 border border-slate-100">
                <p><strong>Divisions:</strong> {c.divisions.join(', ')}</p>
                <p><strong>Area Representative:</strong> {c.salesRepresentative} (📞 {c.phone})</p>
                <p><strong>Credit Terms:</strong> {c.creditTerms}</p>
                <p><strong>Catalog:</strong> {products.filter((p) => p.companyId === c.id).length} Products mapped</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXCEL IMPORT TAB (Section 21) */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-base text-slate-900">Bulk Product Excel & CSV Import Engine</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload price lists or stock files from Sun Pharma, Cipla, Abbott, etc. Columns are matched automatically.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-2xl p-8 text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-sky-600" />
            <div>
              <p className="text-sm font-bold text-slate-800">Select Excel or CSV Spreadsheet File</p>
              <p className="text-xs text-slate-500 mt-0.5">Supports .xlsx, .xls, .csv files</p>
            </div>
            <label className="inline-block px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition">
              <span>Choose File</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
            {importFile && (
              <p className="text-xs font-semibold text-emerald-600">Selected: {importFile.name}</p>
            )}
          </div>

          {/* Import Preview changes (Section 21) */}
          {previewProducts.length > 0 && importReport && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-indigo-900 block">Import Preview Ready</span>
                  <span className="text-indigo-700">
                    Found {previewProducts.length} rows ({importReport.newCount} new products, {importReport.updateCount} existing to update)
                  </span>
                </div>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition"
                >
                  Confirm & Update Database
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5 text-right">MRP</th>
                      <th className="p-2.5 text-right">PTR</th>
                      <th className="p-2.5 text-center">GST%</th>
                      <th className="p-2.5 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewProducts.slice(0, 10).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-[11px]">{p.productCode}</td>
                        <td className="p-2.5 font-bold text-slate-800">{p.name}</td>
                        <td className="p-2.5 text-slate-600">{p.companyName}</td>
                        <td className="p-2.5 text-right">₹{p.mrp}</td>
                        <td className="p-2.5 text-right font-bold text-sky-700">₹{p.ptr}</td>
                        <td className="p-2.5 text-center">{p.gstRate}%</td>
                        <td className="p-2.5 text-right">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 bg-sky-600 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base">Add New Pharmaceutical Product</h3>
                <p className="text-xs text-sky-100">MRP, PTR, PTS and trade scheme parameters</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-sky-700 p-1 rounded-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Manufacturer *</label>
                  <select
                    value={companyId}
                    onChange={(e) => {
                      setCompanyId(e.target.value);
                      const comp = companies.find((c) => c.id === e.target.value);
                      if (comp && comp.divisions.length > 0) setDivision(comp.divisions[0]);
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-semibold"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Division</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="e.g. Cardio / Gastro / Nutrition"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pantocid 40mg Tablet"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Salt / Composition *</label>
                  <input
                    type="text"
                    required
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    placeholder="e.g. Pantoprazole Gastro-resistant Tablets IP 40mg"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pack Size *</label>
                  <input
                    type="text"
                    required
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. 10 Tablets (Strip) / 100ml Bottle"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Scheme (Bonus)</label>
                  <input
                    type="text"
                    value={scheme}
                    onChange={(e) => setScheme(e.target.value)}
                    placeholder="e.g. 10+1 / 20+2 / None"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PTR (₹ Price to Retailer) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ptr}
                    onChange={(e) => setPtr(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold text-sky-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PTS (₹ Price to Stockist) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pts}
                    onChange={(e) => setPts(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate % *</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-semibold"
                  >
                    <option value={5}>5% (Life-saving Vaccines/Certain formulations)</option>
                    <option value={12}>12% (Standard Formulations/Medicines IP)</option>
                    <option value={18}>18% (Nutrition / Dialysis Powder / Disinfectants)</option>
                    <option value={28}>28% (Specialized Devices)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level Alert</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
                >
                  Save Product Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
