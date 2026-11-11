import React from 'react';
import { LiquorItem, StockTransaction, TransactionType, LiquorCategory } from '../types/inventory';
import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  MapPin,
  Tag,
  Trash2,
  PlusCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatThaiDate, exportTransactionsToCSV } from '../utils/storage';

interface TransactionPageProps {
  items: LiquorItem[];
  transactions: StockTransaction[];
  onOpenTransactionModal: (type: TransactionType, liquorId?: string) => void;
  onOpenItemModal?: () => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionPage: React.FC<TransactionPageProps> = ({
  items,
  transactions,
  onOpenTransactionModal,
  onOpenItemModal,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('ALL');
  const [filterCategory, setFilterCategory] = React.useState<string>('ALL');
  const [filterDateRange, setFilterDateRange] = React.useState<string>('ALL');

  // Calculate top highlight metrics
  const todayStr = new Date().toISOString().split('T')[0];

  let todayInCount = 0;
  let todayInValue = 0;
  let todayOutCount = 0;
  let todayOutValue = 0;

  transactions.forEach((tx) => {
    if (tx.date === todayStr || tx.timestamp?.startsWith(todayStr)) {
      if (tx.type === 'IN') {
        todayInCount += tx.quantity;
        todayInValue += tx.totalValue;
      } else if (tx.type === 'OUT') {
        todayOutCount += tx.quantity;
        todayOutValue += tx.totalValue;
      }
    }
  });

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Type filter
    if (filterType !== 'ALL' && tx.type !== filterType) return false;

    // Category filter
    if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;

    // Date range filter
    if (filterDateRange === 'TODAY') {
      if (tx.date !== todayStr && !tx.timestamp?.startsWith(todayStr)) return false;
    } else if (filterDateRange === '7DAYS') {
      const txTime = new Date(tx.date || tx.timestamp).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (txTime < sevenDaysAgo) return false;
    } else if (filterDateRange === 'THIS_MONTH') {
      const currentMonth = todayStr.slice(0, 7);
      if (!tx.date?.startsWith(currentMonth) && !tx.timestamp?.startsWith(currentMonth)) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tx.liquorName.toLowerCase().includes(q);
      const matchOp = tx.operator.toLowerCase().includes(q);
      const matchDest = (tx.destination || '').toLowerCase().includes(q);
      const matchRef = (tx.referenceNo || '').toLowerCase().includes(q);
      const matchReason = (tx.reason || '').toLowerCase().includes(q);
      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchOp && !matchDest && !matchRef && !matchReason && !matchNotes) {
        return false;
      }
    }

    return true;
  });

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today IN */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400/90 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              รับเข้าคลังวันนี้ (Today IN)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-300">
              +{formatNumber(todayInCount)}{' '}
              <span className="text-xs font-normal text-emerald-400/80">ขวด</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              มูลค่ารับเข้า:{' '}
              <span className="font-mono text-slate-200 font-semibold">{formatCurrency(todayInValue)}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Today OUT */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400/90 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              เบิกจ่ายออกวันนี้ (Today OUT)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-300">
              -{formatNumber(todayOutCount)}{' '}
              <span className="text-xs font-normal text-amber-400/80">ขวด</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              มูลค่าเบิกจ่าย:{' '}
              <span className="font-mono text-slate-200 font-semibold">{formatCurrency(todayOutValue)}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Net Movement */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">ยอดสุทธิวันนี้ (Net Flow)</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono ${
                todayInCount - todayOutCount >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {todayInCount - todayOutCount >= 0 ? '+' : ''}
              {formatNumber(todayInCount - todayOutCount)}{' '}
              <span className="text-xs font-normal text-slate-400">ขวด</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              ผลต่างมูลค่า: {formatCurrency(todayInValue - todayOutValue)}
            </div>
          </div>
        </div>

        {/* Metric 4: Quick Actions */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-center gap-2.5 shadow-xl">
          <button
            onClick={() => onOpenTransactionModal('IN')}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2"
          >
            <ArrowDownRight className="w-4 h-4" />
            + บันทึกรับเข้าคลัง (Stock In)
          </button>
          <button
            onClick={() => onOpenTransactionModal('OUT')}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-md shadow-amber-950/40 flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            - บันทึกเบิกจ่ายออก (Stock Out)
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเหล้า, ผู้เบิก, จุดหมาย (บาร์/โต๊ะ), เลขที่บิล, หมายเหตุ..."
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

          {/* Actions: Add New Liquor & Export CSV */}
          <div className="flex items-center gap-2">
            {onOpenItemModal && (
              <button
                onClick={onOpenItemModal}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
                title="เพิ่มรายการเหล้าใหม่ (ใช้แค่ชื่อเครื่องดื่ม และราคาต้นทุน)"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ เพิ่มเหล้าใหม่</span>
              </button>
            )}
            <button
              onClick={() => exportTransactionsToCSV(filteredTransactions)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
              title="ส่งออกรายการเคลื่อนไหวเป็นไฟล์ CSV สำหรับ Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ส่งออก CSV ({filteredTransactions.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> ตัวกรอง:
          </span>

          {/* Type Filter */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilterType('IN')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filterType === 'IN'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-emerald-400/90 hover:text-emerald-300'
              }`}
            >
              <ArrowDownRight className="w-3 h-3" />
              รับเข้า
            </button>
            <button
              onClick={() => setFilterType('OUT')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filterType === 'OUT'
                  ? 'bg-amber-600 text-white font-medium'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              เบิกจ่าย
            </button>
            <button
              onClick={() => setFilterType('ADJUST')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filterType === 'ADJUST'
                  ? 'bg-purple-600 text-white font-medium'
                  : 'text-purple-400/90 hover:text-purple-300'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              ปรับยอด
            </button>
          </div>

          {/* Category Filter */}
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

          {/* Date Range Filter */}
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">ทุกช่วงเวลา</option>
            <option value="TODAY">เฉพาะวันนี้</option>
            <option value="7DAYS">7 วันล่าสุด</option>
            <option value="THIS_MONTH">เดือนนี้</option>
          </select>

          <span className="ml-auto text-slate-500 text-[11px]">
            พบ {filteredTransactions.length} รายการ
          </span>
        </div>
      </div>

      {/* Transactions List / Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              ประวัติรายการรับเข้า - เบิกจ่าย
              <span className="text-xs font-normal text-slate-400 font-mono">
                ({filteredTransactions.length} รายการ)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              บันทึกทุกความเคลื่อนไหวเพื่อตรวจสอบความถูกต้องของยอดคลัง
            </p>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-slate-300 font-medium text-sm">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูข้อมูลทั้งหมด
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('ALL');
                  setFilterCategory('ALL');
                  setFilterDateRange('ALL');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium transition-colors"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">วันที่ / เวลา</th>
                  <th className="py-3 px-3">ประเภท</th>
                  <th className="py-3 px-4">รายการเหล้า</th>
                  <th className="py-3 px-3">หมวดหมู่</th>
                  <th className="py-3 px-3 text-right">จำนวน</th>
                  <th className="py-3 px-3 text-right">ราคาต่อขวด</th>
                  <th className="py-3 px-4 text-right">มูลค่ารวม</th>
                  <th className="py-3 px-4">จุดหมาย / ผู้ทำรายการ</th>
                  <th className="py-3 px-4">เหตุผล & หมายเหตุ</th>
                  <th className="py-3 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTransactions.map((tx) => {
                  const isIn = tx.type === 'IN';
                  const isOut = tx.type === 'OUT';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {formatThaiDate(tx.date)}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {tx.time} น.
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isIn
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isOut
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}
                        >
                          {isIn ? (
                            <ArrowDownRight className="w-3 h-3 shrink-0" />
                          ) : isOut ? (
                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                          ) : (
                            <RefreshCw className="w-3 h-3 shrink-0" />
                          )}
                          {isIn ? 'รับเข้า' : isOut ? 'เบิกจ่าย' : 'ปรับยอด'}
                        </span>
                      </td>

                      {/* Liquor Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 text-sm">
                          {tx.liquorName}
                        </div>
                        {tx.referenceNo && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                            <Tag className="w-3 h-3 text-slate-500" />
                            {tx.referenceNo}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700/60">
                          {tx.category}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div
                          className={`text-sm font-bold font-mono ${
                            isIn ? 'text-emerald-400' : isOut ? 'text-amber-400' : 'text-purple-400'
                          }`}
                        >
                          {isIn ? '+' : isOut ? '-' : ''}
                          {tx.quantity} <span className="text-xs font-normal text-slate-400">ขวด</span>
                        </div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                        ฿{tx.unitCost.toLocaleString()}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-100 text-sm">
                          ฿{tx.totalValue.toLocaleString()}
                        </div>
                      </td>

                      {/* Destination & Operator */}
                      <td className="py-3.5 px-4">
                        {tx.destination && (
                          <div className="text-slate-200 flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{tx.destination}</span>
                          </div>
                        )}
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{tx.operator}</span>
                        </div>
                      </td>

                      {/* Reason & Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-300 font-medium truncate">
                          {tx.reason || '-'}
                        </div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5" title={tx.notes}>
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (window.confirm(`ยืนยันการลบรายการ "${tx.liquorName}" (${tx.type === 'IN' ? 'รับเข้า' : 'เบิกจ่าย'} ${tx.quantity} ขวด)?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="ลบรายการบันทึกนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
