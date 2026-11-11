import { Wine, ArrowLeftRight, Boxes, Plus, RotateCcw, ShieldCheck, Flame, ArrowDownRight, ArrowUpRight, FileSpreadsheet, CloudUpload } from 'lucide-react';
import { InventoryStats } from '../types/inventory';

interface HeaderProps {
  activeTab: 'transactions' | 'summary';
  setActiveTab: (tab: 'transactions' | 'summary') => void;
  stats: InventoryStats;
  onOpenTransactionModal: (type: 'IN' | 'OUT') => void;
  onOpenItemModal: () => void;
  onOpenBackupModal: () => void;
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenTransactionModal,
  onOpenItemModal,
  onOpenBackupModal,
  onResetDemo,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-950/40 shrink-0">
              <Wine className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                  ระบบคำนวนยอดคลังเหล้า
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Bar & Cellar Inventory
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
                ควบคุมการรับเข้า-เบิกจ่าย และคำนวณยอดคงเหลือสินค้า
              </p>
            </div>
          </div>

          {/* 2 Primary Tabs requested by user */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {/* Tab 1: หน้าแรก รับเข้าและเบิกจ่าย */}
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'transactions'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>หน้า 1: รับเข้า - เบิกจ่าย</span>
            </button>

            {/* Tab 2: หน้าสอง สรุปยอดคงเหลือ */}
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
                activeTab === 'summary'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>หน้า 2: สรุปยอดคงเหลือ</span>
              {stats.lowStockCount > 0 && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeTab === 'summary' ? 'bg-rose-900' : 'bg-rose-500 animate-pulse'
                  }`}
                  title={`มีสินค้าใกล้หมด ${stats.lowStockCount} รายการ`}
                />
              )}
            </button>
          </div>

          {/* Quick Actions (Right side) */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Google Sheets Backup Button */}
            <button
              onClick={onOpenBackupModal}
              className="px-3 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
              title="สำรองข้อมูลคลังเหล้าลงใน Google Sheet รายวัน"
            >
              <CloudUpload className="w-4 h-4 text-emerald-400" />
              <span>สำรอง Google Sheet</span>
            </button>

            <button
              onClick={onOpenItemModal}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              title="เพิ่มรายการเหล้าใหม่ (ใช้แค่ชื่อเครื่องดื่ม และราคาต้นทุน)"
            >
              <Plus className="w-4 h-4" />
              + เพิ่มเหล้าใหม่
            </button>

            <button
              onClick={() => onOpenTransactionModal('IN')}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
              title="บันทึกรับสุราเข้าคลัง"
            >
              <ArrowDownRight className="w-4 h-4" />
              + รับเข้า
            </button>

            <button
              onClick={() => onOpenTransactionModal('OUT')}
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40"
              title="บันทึกเบิกสุราออกไปใช้"
            >
              <ArrowUpRight className="w-4 h-4" />
              - เบิกจ่าย
            </button>

            <button
              onClick={onResetDemo}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น (Reset Demo Data)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
