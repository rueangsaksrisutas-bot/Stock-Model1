import React from 'react';
import { LiquorItem, StockTransaction, LiquorCategory } from '../types/inventory';
import {
  Boxes,
  Wine,
  AlertTriangle,
  Coins,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Printer,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardCheck,
  History,
  Edit2,
  CheckCircle2,
  AlertCircle,
  PackageX,
  Layers,
  Sparkles,
  CloudUpload,
} from 'lucide-react';
import { formatCurrency, formatNumber, exportInventorySummaryToCSV } from '../utils/storage';

interface SummaryPageProps {
  items: LiquorItem[];
  transactions: StockTransaction[];
  onOpenItemModal: (item?: LiquorItem) => void;
  onOpenTransactionModal: (type: 'IN' | 'OUT', liquorId?: string) => void;
  onOpenAuditModal: (liquor: LiquorItem) => void;
  onOpenHistoryModal: (liquor: LiquorItem) => void;
  onOpenPrintReport: () => void;
  onOpenBackupModal?: () => void;
}

export const SummaryPage: React.FC<SummaryPageProps> = ({
  items,
  transactions,
  onOpenItemModal,
  onOpenTransactionModal,
  onOpenAuditModal,
  onOpenHistoryModal,
  onOpenPrintReport,
  onOpenBackupModal,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('ALL');
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL'); // ALL, NORMAL, LOW, OUT

  // Calculate cumulative stats
  const totalBottles = items.reduce((sum, item) => sum + item.currentStock, 0);
  const totalValue = items.reduce((sum, item) => sum + item.currentStock * item.unitCost, 0);
  const lowStockItems = items.filter((item) => item.currentStock > 0 && item.currentStock <= item.minStockLevel);
  const outOfStockItems = items.filter((item) => item.currentStock <= 0);

  // Group by category for visual distribution
  const categoryStats = React.useMemo(() => {
    const map: Record<string, { bottles: number; value: number; count: number }> = {};
    items.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = { bottles: 0, value: 0, count: 0 };
      }
      map[item.category].bottles += item.currentStock;
      map[item.category].value += item.currentStock * item.unitCost;
      map[item.category].count += 1;
    });
    return Object.entries(map).map(([category, data]) => ({
      category,
      bottles: data.bottles,
      value: data.value,
      count: data.count,
      percent: totalBottles > 0 ? (data.bottles / totalBottles) * 100 : 0,
    })).sort((a, b) => b.bottles - a.bottles);
  }, [items, totalBottles]);

  // Compute Cumulative In and Out per item from transactions
  const cumulativeFlowMap = React.useMemo(() => {
    const map: Record<string, { in: number; out: number }> = {};
    transactions.forEach((tx) => {
      if (!map[tx.liquorId]) {
        map[tx.liquorId] = { in: 0, out: 0 };
      }
      if (tx.type === 'IN') {
        map[tx.liquorId].in += tx.quantity;
      } else if (tx.type === 'OUT') {
        map[tx.liquorId].out += tx.quantity;
      }
    });
    return map;
  }, [transactions]);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Category filter
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;

    // Status filter
    if (filterStatus === 'LOW') {
      if (!(item.currentStock > 0 && item.currentStock <= item.minStockLevel)) return false;
    } else if (filterStatus === 'OUT') {
      if (item.currentStock > 0) return false;
    } else if (filterStatus === 'NORMAL') {
      if (item.currentStock <= item.minStockLevel) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchCode = item.code.toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchCode && !matchLoc) return false;
    }

    return true;
  });

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="space-y-6">
      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total SKUs */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">รายการเหล้าในระบบ (SKUs)</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-slate-100">
              {items.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ครอบคลุม {categories.length} หมวดหมู่เครื่องดื่ม
            </p>
          </div>
        </div>

        {/* Card 2: Total Bottles */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400/90">ยอดคงเหลือรวมในคลัง (Bottles)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-emerald-300">
              {formatNumber(totalBottles)}{' '}
              <span className="text-xs font-normal text-emerald-400/80">ขวด</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              คิดเป็นประมาณ {(totalBottles / 12).toFixed(1)} ลัง (มาตรฐาน 12 ขวด/ลัง)
            </p>
          </div>
        </div>

        {/* Card 3: Total Stock Valuation */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400/90">มูลค่าสต็อกคงเหลือรวม (Valuation)</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              คำนวณจากราคาต้นทุนเฉลี่ยต่อขวด
            </p>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div
          className={`p-5 rounded-2xl border shadow-xl transition-all ${
            lowStockItems.length + outOfStockItems.length > 0
              ? 'bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-900 border-rose-500/40'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                lowStockItems.length + outOfStockItems.length > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'
              }`}
            >
              สินค้าใกล้หมด / ต้องสั่งซื้อ
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                lowStockItems.length + outOfStockItems.length > 0
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-3xl font-bold font-mono ${
                lowStockItems.length + outOfStockItems.length > 0 ? 'text-rose-300' : 'text-slate-300'
              }`}
            >
              {lowStockItems.length + outOfStockItems.length}{' '}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {outOfStockItems.length > 0 && (
                <span className="text-rose-400 font-medium mr-2">หมดสต็อก {outOfStockItems.length}</span>
              )}
              {lowStockItems.length > 0 && (
                <span className="text-amber-400 font-medium">ต่ำกว่าเกณฑ์ {lowStockItems.length}</span>
              )}
              {lowStockItems.length + outOfStockItems.length === 0 && 'สต็อกสินค้าทุกรายการอยู่ในเกณฑ์ปกติ'}
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Urgent Banner (if any) */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-slate-900 border border-rose-800/60 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  แจ้งเตือนสินค้าต้องสั่งซื้อเพิ่มเติมด่วน
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  พบ {outOfStockItems.length > 0 ? `สินค้าหมดสต็อก ${outOfStockItems.length} รายการ และ` : ''}{' '}
                  สินค้าใกล้หมดสต็อกขั้นต่ำ {lowStockItems.length} รายการ แนะนำให้เปิดใบสั่งซื้อ (PO)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[...outOfStockItems, ...lowStockItems].slice(0, 4).map((it) => (
                <button
                  key={it.id}
                  onClick={() => onOpenTransactionModal('IN', it.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-rose-700/60 hover:border-amber-500 text-xs text-slate-200 hover:text-white transition-colors shrink-0 flex items-center gap-1.5"
                  title="คลิกเพื่อบันทึกรับเข้าเหล้านี้"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span className="font-medium">{it.name}</span>
                  <span className="font-mono text-amber-400 font-bold">({it.currentStock} ขวด)</span>
                  <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Stock Distribution Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            สัดส่วนปริมาณสุราในคลังตามหมวดหมู่ (Category Share)
          </h3>
          <span className="text-xs text-slate-400">
            รวม {formatNumber(totalBottles)} ขวด ({formatCurrency(totalValue)})
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
          {categoryStats.map((cat, idx) => {
            const colors = [
              'bg-amber-500',
              'bg-emerald-500',
              'bg-sky-500',
              'bg-purple-500',
              'bg-rose-500',
              'bg-indigo-500',
              'bg-teal-500',
              'bg-yellow-500',
              'bg-orange-500',
            ];
            const color = colors[idx % colors.length];
            return (
              <div
                key={cat.category}
                style={{ width: `${cat.percent}%` }}
                className={`${color} h-full transition-all duration-500 relative group cursor-pointer first:rounded-l-full last:rounded-r-full`}
                title={`${cat.category}: ${cat.bottles} ขวด (${cat.percent.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs">
          {categoryStats.map((cat, idx) => {
            const dotColors = [
              'bg-amber-500',
              'bg-emerald-500',
              'bg-sky-500',
              'bg-purple-500',
              'bg-rose-500',
              'bg-indigo-500',
              'bg-teal-500',
              'bg-yellow-500',
              'bg-orange-500',
            ];
            const dot = dotColors[idx % dotColors.length];
            return (
              <button
                key={cat.category}
                onClick={() => setFilterCategory(cat.category === filterCategory ? 'ALL' : cat.category)}
                className={`flex items-center gap-1.5 transition-opacity ${
                  filterCategory === 'ALL' || filterCategory === cat.category ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`}></span>
                <span className="text-slate-300 font-medium">{cat.category}:</span>
                <span className="text-slate-400 font-mono">
                  {cat.bottles} ขวด ({cat.percent.toFixed(0)}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control & Filter Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส SKU, ชื่อเหล้า, แบรนด์, ตำแหน่งจัดเก็บ..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenItemModal()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการเหล้าใหม่</span>
            </button>
            <button
              onClick={onOpenPrintReport}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="พิมพ์รายงานสรุปสต็อกคงเหลือ"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>พิมพ์รายงาน A4</span>
            </button>
            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                title="สำรองข้อมูลคลังเหล้าลง Google Sheet รายวัน"
              >
                <CloudUpload className="w-4 h-4 text-emerald-400" />
                <span>สำรอง Google Sheet</span>
              </button>
            )}
            <button
              onClick={() => exportInventorySummaryToCSV(filteredItems)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="ส่งออกสรุปคงเหลือเป็นไฟล์ CSV สำหรับ Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> กรองสถานะ:
          </span>

          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด ({items.length})
            </button>
            <button
              onClick={() => setFilterStatus('NORMAL')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filterStatus === 'NORMAL' ? 'bg-emerald-700 text-white font-medium' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              สต็อกปกติ
            </button>
            <button
              onClick={() => setFilterStatus('LOW')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filterStatus === 'LOW' ? 'bg-amber-600 text-white font-medium' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              ใกล้หมด ({lowStockItems.length})
            </button>
            <button
              onClick={() => setFilterStatus('OUT')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filterStatus === 'OUT' ? 'bg-rose-700 text-white font-medium' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <PackageX className="w-3 h-3" />
              หมดแล้ว ({outOfStockItems.length})
            </button>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">ทุกหมวดหมู่ ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span className="ml-auto text-slate-500 text-[11px]">
            แสดง {filteredItems.length} จาก {items.length} รายการ
          </span>
        </div>
      </div>

      {/* Main Stock Balance Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              ตารางสรุปยอดคงเหลือสุรา & เครื่องดื่มในคลัง
              <span className="text-xs font-normal text-slate-400 font-mono">
                ({filteredItems.length} รายการ)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              ตรวจเช็คยอดคงเหลือจริง มูลค่าสินค้า และดำเนินการรับเข้า-เบิกจ่ายแบบด่วน
            </p>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
              <Wine className="w-6 h-6" />
            </div>
            <p className="text-slate-300 font-medium text-sm">ไม่พบรายการเหล้าตามเงื่อนไขที่เลือก</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('ALL');
                setFilterStatus('ALL');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium transition-colors"
            >
              ล้างเงื่อนไขทั้งหมด
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">รหัส / สินค้า</th>
                  <th className="py-3 px-3">หมวดหมู่</th>
                  <th className="py-3 px-3 text-right">ขนาด (ml)</th>
                  <th className="py-3 px-3 text-right">เกณฑ์ขั้นต่ำ</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-200">คงเหลือ (ขวด / ลัง)</th>
                  <th className="py-3 px-3 text-right">รับเข้าสะสม</th>
                  <th className="py-3 px-3 text-right">เบิกจ่ายสะสม</th>
                  <th className="py-3 px-3 text-right">ต้นทุน/ขวด</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-400">มูลค่ารวม (บาท)</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-center">การจัดการด่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredItems.map((item) => {
                  const flow = cumulativeFlowMap[item.id] || { in: 0, out: 0 };
                  const isOut = item.currentStock <= 0;
                  const isLow = item.currentStock <= item.minStockLevel && !isOut;
                  const cases = (item.currentStock / item.bottlesPerCase).toFixed(1);
                  const totalVal = item.currentStock * item.unitCost;

                  // Health bar percent
                  const healthPercent = Math.min(100, (item.currentStock / (item.minStockLevel * 2 || 10)) * 100);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono mt-0.5">
                          <span className="text-amber-400/90">{item.code}</span>
                          <span>•</span>
                          <span>{item.brand}</span>
                          {item.location && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">{item.location}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700/60">
                          {item.category}
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                        {item.volumeMl} ml
                      </td>

                      {/* Min Level */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                        {item.minStockLevel} ขวด
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div
                          className={`text-base font-bold font-mono ${
                            isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatNumber(item.currentStock)}{' '}
                          <span className="text-xs font-normal text-slate-400">ขวด</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ~{cases} ลัง ({item.bottlesPerCase} ข./ลัง)
                        </div>

                        {/* Health progress bar */}
                        <div className="w-20 ml-auto h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
                          <div
                            style={{ width: `${healthPercent}%` }}
                            className={`h-full ${
                              isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* In & Out Flows */}
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-400 whitespace-nowrap">
                        +{flow.in}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-rose-400 whitespace-nowrap">
                        -{flow.out}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        ฿{item.unitCost.toLocaleString()}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-amber-400 text-sm">
                          ฿{totalVal.toLocaleString()}
                        </div>
                        {item.sellingPrice && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            ขาย: ฿{(item.currentStock * item.sellingPrice).toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <PackageX className="w-3 h-3" />
                            หมดสต็อก
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            ใกล้หมด
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            ปกติ
                          </span>
                        )}
                      </td>

                      {/* Quick Action buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick In */}
                          <button
                            onClick={() => onOpenTransactionModal('IN', item.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                            title="รับเข้าเพิ่ม"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Out */}
                          <button
                            onClick={() => onOpenTransactionModal('OUT', item.id)}
                            disabled={item.currentStock <= 0}
                            className={`p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors ${
                              item.currentStock <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                            title="เบิกจ่ายออก"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Physical Audit */}
                          <button
                            onClick={() => onOpenAuditModal(item)}
                            className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 transition-colors"
                            title="ตรวจนับสต็อกจริง (Physical Count)"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Timeline History */}
                          <button
                            onClick={() => onOpenHistoryModal(item)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                            title="ดูประวัติการเคลื่อนไหว"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Item Details */}
                          <button
                            onClick={() => onOpenItemModal(item)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                            title="แก้ไขข้อมูลสินค้า"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-slate-950/80 font-bold">
                  <td colSpan={4} className="py-3 px-4 text-right text-slate-300">
                    รวมยอดคงเหลือคลัง ({filteredItems.length} รายการ):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400 text-base">
                    {formatNumber(filteredItems.reduce((acc, cur) => acc + cur.currentStock, 0))} ขวด
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right text-slate-400">
                    มูลค่าสุทธิ:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-400 text-base">
                    {formatCurrency(filteredItems.reduce((acc, cur) => acc + cur.currentStock * cur.unitCost, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
