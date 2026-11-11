import React from 'react';
import { LiquorItem, StockTransaction } from '../types/inventory';
import { X, History, ArrowDownRight, ArrowUpRight, RefreshCw, Calendar, Tag, MapPin, User } from 'lucide-react';
import { formatThaiDate } from '../utils/storage';

interface ItemHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquor: LiquorItem | null;
  transactions: StockTransaction[];
  onOpenTransactionModal: (type: 'IN' | 'OUT', liquorId: string) => void;
}

export const ItemHistoryModal: React.FC<ItemHistoryModalProps> = ({
  isOpen,
  onClose,
  liquor,
  transactions,
  onOpenTransactionModal,
}) => {
  if (!isOpen || !liquor) return null;

  // Filter transactions for this specific liquor
  const history = transactions
    .filter((t) => t.liquorId === liquor.id)
    .sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());

  const totalIn = history.filter((t) => t.type === 'IN').reduce((acc, cur) => acc + cur.quantity, 0);
  const totalOut = history.filter((t) => t.type === 'OUT').reduce((acc, cur) => acc + cur.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">ประวัติความเคลื่อนไหวสต็อก (Movement History)</h2>
              <p className="text-xs text-slate-400">{liquor.name} ({liquor.code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Summary Status */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">คงเหลือปัจจุบัน</div>
              <div className="text-xl font-bold font-mono text-amber-400">
                {liquor.currentStock} <span className="text-xs font-normal text-slate-400">ขวด</span>
              </div>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">รับเข้าสะสม</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                +{totalIn} <span className="text-xs font-normal text-slate-400">ขวด</span>
              </div>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">เบิกจ่ายสะสม</div>
              <div className="text-xl font-bold font-mono text-rose-400">
                -{totalOut} <span className="text-xs font-normal text-slate-400">ขวด</span>
              </div>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">มูลค่าคงเหลือ</div>
              <div className="text-xl font-bold font-mono text-slate-200">
                ฿{(liquor.currentStock * liquor.unitCost).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Action in modal */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/60">
            <button
              onClick={() => {
                onClose();
                onOpenTransactionModal('IN', liquor.id);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              + บันทึกรับเข้าเหล้านี้
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenTransactionModal('OUT', liquor.id);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              - บันทึกเบิกจ่ายเหล้านี้
            </button>
          </div>
        </div>

        {/* Timeline List */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              ยังไม่มีประวัติการรับเข้าหรือเบิกจ่ายสำหรับรายการนี้
            </div>
          ) : (
            history.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      tx.type === 'IN'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : tx.type === 'OUT'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {tx.type === 'IN' ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : tx.type === 'OUT' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                          tx.type === 'IN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.type === 'OUT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {tx.type === 'IN' ? 'รับเข้าคลัง' : tx.type === 'OUT' ? 'เบิกจ่าย' : 'ปรับยอดสต็อก'}
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}
                        {tx.quantity} ขวด
                      </span>
                      <span className="text-slate-400">
                        (฿{tx.totalValue.toLocaleString()})
                      </span>
                    </div>

                    <div className="text-slate-300 font-medium mt-1">
                      {tx.reason || (tx.type === 'IN' ? 'รับเข้า' : 'เบิกจ่าย')}
                    </div>

                    {tx.notes && <div className="text-slate-400 text-[11px] mt-0.5">{tx.notes}</div>}

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] mt-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatThaiDate(tx.date, tx.time)}
                      </span>
                      {tx.destination && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {tx.destination}
                        </span>
                      )}
                      {tx.operator && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {tx.operator}
                        </span>
                      )}
                      {tx.referenceNo && (
                        <span className="flex items-center gap-1 font-mono text-slate-400">
                          <Tag className="w-3 h-3" />
                          {tx.referenceNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
