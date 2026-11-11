import React from 'react';
import { LiquorItem, StockTransaction, TransactionType } from '../types/inventory';
import { X, ArrowDownRight, ArrowUpRight, AlertCircle, Calendar, Clock, User, FileText, MapPin } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LiquorItem[];
  initialType?: TransactionType;
  initialLiquorId?: string;
  onSave: (transactionData: Omit<StockTransaction, 'id' | 'timestamp'>) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  items,
  initialType = 'IN',
  initialLiquorId,
  onSave,
}) => {
  const [type, setType] = React.useState<TransactionType>(initialType);
  const [liquorId, setLiquorId] = React.useState<string>(initialLiquorId || (items[0]?.id || ''));
  const [unitMode, setUnitMode] = React.useState<'bottle' | 'case'>('bottle');
  const [inputQuantity, setInputQuantity] = React.useState<number>(1);
  const [unitCost, setUnitCost] = React.useState<number>(0);
  const [date, setDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = React.useState<string>(
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [referenceNo, setReferenceNo] = React.useState<string>('');
  const [destination, setDestination] = React.useState<string>('');
  const [operator, setOperator] = React.useState<string>('บาร์เทนเดอร์');
  const [reason, setReason] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  // Selected item
  const selectedItem = items.find((i) => i.id === liquorId);

  // Sync unitCost when liquorId changes
  React.useEffect(() => {
    if (selectedItem) {
      setUnitCost(selectedItem.unitCost);
    }
  }, [liquorId, selectedItem]);

  // Update initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      setType(initialType);
      const chosenId = initialLiquorId || (items[0]?.id || '');
      setLiquorId(chosenId);
      const item = items.find((i) => i.id === chosenId);
      if (item) {
        setUnitCost(item.unitCost);
      }
      setInputQuantity(1);
      setUnitMode('bottle');
      setReferenceNo(initialType === 'IN' ? `PO-${Date.now().toString().slice(-4)}` : `REQ-${Date.now().toString().slice(-4)}`);
      setDestination(initialType === 'IN' ? 'คลังหลัก' : 'บาร์หลัก (Main Bar)');
      setReason(initialType === 'IN' ? 'รับสินค้าเข้าล็อตใหม่' : 'เบิกเติมสต็อกหน้าบาร์');
      setNotes('');
      setErrorMessage('');
    }
  }, [isOpen, initialType, initialLiquorId, items]);

  if (!isOpen) return null;

  const bottlesPerCase = selectedItem?.bottlesPerCase || 12;
  const totalBottles = unitMode === 'case' ? inputQuantity * bottlesPerCase : inputQuantity;
  const totalValue = totalBottles * (unitCost || 0);
  const currentAvailableStock = selectedItem ? selectedItem.currentStock : 0;
  const isOverStock = type === 'OUT' && totalBottles > currentAvailableStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setErrorMessage('กรุณาเลือกรายการเหล้า');
      return;
    }
    if (inputQuantity <= 0) {
      setErrorMessage('กรุณาระบุจำนวนที่มากกว่า 0');
      return;
    }
    if (isOverStock) {
      setErrorMessage(`จำนวนที่เบิก (${totalBottles} ขวด) เกินกว่ายอดคงเหลือในคลัง (${currentAvailableStock} ขวด)`);
      return;
    }

    onSave({
      date,
      time,
      type,
      liquorId: selectedItem.id,
      liquorName: selectedItem.name,
      category: selectedItem.category,
      quantity: totalBottles,
      unitCost,
      totalValue,
      referenceNo: referenceNo.trim() || undefined,
      destination: destination.trim() || undefined,
      operator: operator.trim() || 'เจ้าหน้าที่คลัง',
      reason: reason.trim() || (type === 'IN' ? 'รับเข้าคลัง' : 'เบิกจ่าย'),
      notes: notes.trim() || (unitMode === 'case' ? `รับเป็นลัง (${inputQuantity} ลัง = ${totalBottles} ขวด)` : undefined),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                type === 'IN'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {type === 'IN' ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {type === 'IN' ? 'บันทึกรับเข้าคลัง (+ IN)' : 'บันทึกเบิกจ่ายออก (- OUT)'}
              </h2>
              <p className="text-xs text-slate-400">
                {type === 'IN'
                  ? 'เพิ่มยอดสินค้าคงคลังจากซัพพลายเออร์หรือรับโอน'
                  : 'เบิกจ่ายเหล้าไปหน้าบาร์ ห้อง VIP ค็อกเทล หรือเสิร์ฟลูกค้า'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-300 bg-rose-950/50 border border-rose-800/80 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">ประเภทรายการ</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('IN');
                  setDestination('คลังหลัก');
                  setReason('รับสินค้าเข้าล็อตใหม่');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all border ${
                  type === 'IN'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                รับเข้าคลัง (+ IN)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('OUT');
                  setDestination('บาร์หลัก (Main Bar)');
                  setReason('เบิกเติมสต็อกหน้าบาร์');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all border ${
                  type === 'OUT'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-950/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                เบิกจ่ายออก (- OUT)
              </button>
            </div>
          </div>

          {/* Liquor Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              เลือกรายการเหล้า <span className="text-rose-400">*</span>
            </label>
            <select
              value={liquorId}
              onChange={(e) => setLiquorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.category}] {item.name} ({item.volumeMl}ml) — คงเหลือ: {item.currentStock} ขวด
                </option>
              ))}
            </select>

            {/* Selected Item Detail Card */}
            {selectedItem && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">คงเหลือในคลังปัจจุบัน: </span>
                  <span
                    className={`font-semibold ${
                      selectedItem.currentStock <= selectedItem.minStockLevel ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedItem.currentStock} ขวด
                  </span>
                  <span className="text-slate-500 ml-2">
                    (~{(selectedItem.currentStock / selectedItem.bottlesPerCase).toFixed(1)} ลัง)
                  </span>
                </div>
                <div className="text-slate-400">
                  ต้นทุนอ้างอิง: <span className="text-slate-200 font-medium">฿{selectedItem.unitCost.toLocaleString()}</span> / ขวด
                </div>
              </div>
            )}
          </div>

          {/* Quantity & Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  จำนวนที่ต้องการ{type === 'IN' ? 'รับเข้า' : 'เบิกจ่าย'} <span className="text-rose-400">*</span>
                </label>
                {/* Bottle vs Case Toggle */}
                <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setUnitMode('bottle')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      unitMode === 'bottle' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ขวด
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitMode('case')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      unitMode === 'case' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ลัง ({bottlesPerCase} ขวด)
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">
                  {unitMode === 'bottle' ? 'ขวด' : 'ลัง'}
                </span>
              </div>
              {unitMode === 'case' && (
                <p className="mt-1 text-xs text-amber-400/90">
                  = คำนวณเป็นยอดขวดทั้งหมด: <span className="font-semibold">{totalBottles} ขวด</span>
                </p>
              )}
              {isOverStock && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  ยอดเบิกเกินสต็อกคงเหลือ ({currentAvailableStock} ขวด)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                ราคาต้นทุนต่อขวด (บาท)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={unitCost}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">฿ / ขวด</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                มูลค่ารวมรายการนี้: <span className="text-amber-400 font-semibold font-mono">฿{totalValue.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                วันที่ทำรายการ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                เวลา
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Destination & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {type === 'IN' ? 'คลังรับเข้า / จุดเก็บ' : 'ปลายทาง / จุดที่เบิกไปใช้'}
              </label>
              <input
                type="text"
                list="destination-options"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={type === 'IN' ? 'เช่น คลังหลัก, ตู้ไวน์' : 'เช่น บาร์หลัก, สเตชั่นค็อกเทล, โต๊ะ VIP 3'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <datalist id="destination-options">
                <option value="บาร์หลัก (Main Bar)" />
                <option value="สเตชั่นค็อกเทล (Cocktail Station)" />
                <option value="บาร์ริมสระ (Pool Bar)" />
                <option value="รูฟท็อปเลานจ์ (Rooftop Lounge)" />
                <option value="ห้อง VIP 1" />
                <option value="ห้องจัดเลี้ยง (Banquet)" />
                <option value="คลังหลัก (Central Cellar)" />
              </datalist>
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                เลขที่เอกสาร / เลขที่บิลอ้างอิง
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="เช่น PO-1029, REQ-041, Bill 88"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Operator & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                ผู้ทำรายการ / ผู้เบิก
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="ชื่อพนักงาน / บาร์เทนเดอร์"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                เหตุผล / วัตถุประสงค์
              </label>
              <input
                type="text"
                list="reason-options"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={type === 'IN' ? 'รับเข้าล็อตใหม่' : 'เติมหน้าบาร์, เปิดโต๊ะ'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <datalist id="reason-options">
                <option value="รับสินค้าเข้าล็อตใหม่" />
                <option value="เบิกเติมสต็อกหน้าบาร์รอบเย็น" />
                <option value="ลูกค้าเปิดโต๊ะ (Table Order)" />
                <option value="ชงค็อกเทล Signature Menu" />
                <option value="งานเลี้ยงเหมา / สังสรรค์ VIP" />
                <option value="ขวดแตกชำรุด / เสียหาย" />
                <option value="ปรับปรุงยอดดิฟนับจริง" />
              </datalist>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุข้อความบันทึก เช่น กล่องชำรุดเล็กน้อย, เสิร์ฟพร้อมมิกเซอร์ 6 โซดา ฯลฯ"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isOverStock}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center gap-2 ${
                type === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
              } ${isOverStock ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {type === 'IN' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              {type === 'IN' ? 'ยืนยันรับเข้าคลัง' : 'ยืนยันการเบิกจ่าย'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
