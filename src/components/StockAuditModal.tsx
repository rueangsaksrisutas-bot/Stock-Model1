import React from 'react';
import { LiquorItem, StockTransaction } from '../types/inventory';
import { X, ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StockAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquor: LiquorItem | null;
  onConfirmAudit: (transaction: Omit<StockTransaction, 'id' | 'timestamp'>, newStock: number) => void;
}

export const StockAuditModal: React.FC<StockAuditModalProps> = ({
  isOpen,
  onClose,
  liquor,
  onConfirmAudit,
}) => {
  const [actualCount, setActualCount] = React.useState<number>(0);
  const [operator, setOperator] = React.useState<string>('ผู้จัดการบาร์');
  const [notes, setNotes] = React.useState<string>('');

  React.useEffect(() => {
    if (liquor && isOpen) {
      setActualCount(liquor.currentStock);
      setNotes('ตรวจนับสต็อกจริงตามรอบ');
    }
  }, [liquor, isOpen]);

  if (!isOpen || !liquor) return null;

  const currentSystemStock = liquor.currentStock;
  const difference = actualCount - currentSystemStock; // positive = over, negative = shortage

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });

    const diffAbs = Math.abs(difference);
    const reasonText =
      difference === 0
        ? 'ตรวจนับสต็อกตรงกับระบบ'
        : difference > 0
        ? `ปรับยอดสต็อกเกิน (+${diffAbs} ขวด)`
        : `ปรับยอดสต็อกขาด (${difference} ขวด)`;

    onConfirmAudit(
      {
        date,
        time,
        type: 'ADJUST',
        liquorId: liquor.id,
        liquorName: liquor.name,
        category: liquor.category,
        quantity: diffAbs,
        unitCost: liquor.unitCost,
        totalValue: diffAbs * liquor.unitCost,
        referenceNo: `AUDIT-${Date.now().toString().slice(-4)}`,
        destination: liquor.location || 'คลังหลัก',
        operator: operator.trim() || 'ผู้ตรวจนับ',
        reason: reasonText,
        notes: `นับจริงได้ ${actualCount} ขวด (ระบบเดิม ${currentSystemStock} ขวด, ผลต่าง ${difference > 0 ? '+' : ''}${difference} ขวด). ${notes}`.trim(),
      },
      actualCount
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">ตรวจนับสต็อกจริง & ปรับยอด</h2>
              <p className="text-xs text-slate-400">Physical Stock Count & Discrepancy Adjustment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400">รายการเหล้าที่ตรวจนับ:</div>
            <div className="text-base font-bold text-slate-100">{liquor.name}</div>
            <div className="text-xs text-slate-400 flex items-center gap-3 pt-1">
              <span>รหัส: <span className="font-mono text-slate-200">{liquor.code}</span></span>
              <span>หมวด: <span className="text-amber-400">{liquor.category}</span></span>
              <span>สถานที่: <span className="text-slate-300">{liquor.location || 'คลังหลัก'}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
              <div className="text-xs text-slate-400 mb-1">ยอดในระบบปัจจุบัน</div>
              <div className="text-2xl font-bold font-mono text-slate-200">{currentSystemStock} <span className="text-xs font-normal text-slate-400">ขวด</span></div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
              <div className="text-xs text-slate-400 mb-1">ยอดนับได้จริง (ขวด) *</div>
              <input
                type="number"
                min="0"
                value={actualCount}
                onChange={(e) => setActualCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 mx-auto text-center bg-slate-950 border border-amber-500/50 rounded-lg py-1 px-2 text-xl font-bold font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Variance result card */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${
              difference === 0
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : difference > 0
                ? 'bg-blue-950/30 border-blue-800/50 text-blue-300'
                : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {difference === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span className="font-medium">
                {difference === 0
                  ? 'ยอดสต็อกตรงเป๊ะ (ไม่มีส่วนต่าง)'
                  : difference > 0
                  ? `สต็อกเกินจากระบบ: +${difference} ขวด`
                  : `สต็อกขาดจากระบบ: ${difference} ขวด`}
              </span>
            </div>
            {difference !== 0 && (
              <span className="text-xs font-mono font-semibold">
                มูลค่าส่วนต่าง: ฿{Math.abs(difference * liquor.unitCost).toLocaleString()}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              ผู้ตรวจนับ / บันทึกปรับยอด <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              สาเหตุ / หมายเหตุการปรับยอด
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ตรวจนับสต็อกประจำสัปดาห์, แตกชำรุด 1 ขวด, คืนจากงานเลี้ยง"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-950/50 flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              ยืนยันปรับยอดนับจริง ({actualCount} ขวด)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
