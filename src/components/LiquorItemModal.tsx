import React from 'react';
import { LiquorCategory, LiquorItem } from '../types/inventory';
import { X, Wine, Save, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface LiquorItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: LiquorItem | null;
  onSave: (itemData: Omit<LiquorItem, 'id' | 'currentStock'> & { id?: string; currentStock?: number }) => void;
}

const CATEGORIES: LiquorCategory[] = [
  'Whisky',
  'Thai Spirits',
  'Brandy/Cognac',
  'Vodka',
  'Gin',
  'Rum',
  'Tequila',
  'Wine',
  'Beer',
  'Liqueur',
  'Other',
];

export const LiquorItemModal: React.FC<LiquorItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  onSave,
}) => {
  // 2 Core Required Fields requested by the user
  const [name, setName] = React.useState('');
  const [unitCost, setUnitCost] = React.useState<number | ''>('');

  // Additional optional settings (with smart auto-defaults)
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [category, setCategory] = React.useState<LiquorCategory>('Whisky');
  const [initialStock, setInitialStock] = React.useState<number>(0);
  const [minStockLevel, setMinStockLevel] = React.useState<number>(5);
  const [volumeMl, setVolumeMl] = React.useState<number>(750);
  const [code, setCode] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [location, setLocation] = React.useState('คลังหลัก (Central Cellar)');

  React.useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setName(itemToEdit.name);
        setUnitCost(itemToEdit.unitCost);
        setCategory(itemToEdit.category);
        setInitialStock(itemToEdit.initialStock);
        setMinStockLevel(itemToEdit.minStockLevel);
        setVolumeMl(itemToEdit.volumeMl);
        setCode(itemToEdit.code);
        setBrand(itemToEdit.brand);
        setLocation(itemToEdit.location || 'คลังหลัก');
        setShowAdvanced(false);
      } else {
        // Reset for brand new item
        setName('');
        setUnitCost('');
        setCategory('Whisky');
        setInitialStock(0);
        setMinStockLevel(5);
        setVolumeMl(750);
        setCode('');
        setBrand('');
        setLocation('คลังหลัก (Central Cellar)');
        setShowAdvanced(false);
      }
    }
  }, [isOpen, itemToEdit]);

  if (!isOpen) return null;

  // Auto-detect category from drink name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!itemToEdit) {
      const lower = val.toLowerCase();
      if (lower.includes('whisky') || lower.includes('whiskey') || lower.includes('walker') || lower.includes('chivas') || lower.includes('jameson') || lower.includes('scotch')) {
        setCategory('Whisky');
      } else if (lower.includes('regency') || lower.includes('แสงโสม') || lower.includes('หงส์ทอง') || lower.includes('285') || lower.includes('รีเจนซี่') || lower.includes('เหล้าขาว') || lower.includes('แม่โขง')) {
        setCategory('Thai Spirits');
      } else if (lower.includes('gin') || lower.includes('จิน') || lower.includes('hendrick') || lower.includes('bombay') || lower.includes('tanqueray') || lower.includes('roku')) {
        setCategory('Gin');
      } else if (lower.includes('vodka') || lower.includes('วอดก้า') || lower.includes('goose') || lower.includes('absolut') || lower.includes('smirnoff')) {
        setCategory('Vodka');
      } else if (lower.includes('rum') || lower.includes('รัม') || lower.includes('bacardi') || lower.includes('captain')) {
        setCategory('Rum');
      } else if (lower.includes('tequila') || lower.includes('เตกีล่า') || lower.includes('cuervo') || lower.includes('don julio') || lower.includes('patron')) {
        setCategory('Tequila');
      } else if (lower.includes('wine') || lower.includes('ไวน์') || lower.includes('penfolds') || lower.includes('shiraz') || lower.includes('cabernet')) {
        setCategory('Wine');
      } else if (lower.includes('beer') || lower.includes('เบียร์') || lower.includes('singha') || lower.includes('chang') || lower.includes('heineken') || lower.includes('asahi')) {
        setCategory('Beer');
      } else if (lower.includes('jäger') || lower.includes('baileys') || lower.includes('kahlua') || lower.includes('liqueur')) {
        setCategory('Liqueur');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate clean SKU code if empty
    const cleanCode =
      code.trim() ||
      name
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 6)
        .toUpperCase() +
        '-' +
        Math.floor(100 + Math.random() * 900);

    const numericCost = typeof unitCost === 'number' ? unitCost : parseFloat(unitCost) || 0;

    onSave({
      ...(itemToEdit ? { id: itemToEdit.id, currentStock: itemToEdit.currentStock } : {}),
      code: cleanCode,
      name: name.trim(),
      brand: brand.trim() || name.trim(),
      category,
      volumeMl: Number(volumeMl) || 750,
      bottlesPerCase: 12,
      unitCost: numericCost,
      sellingPrice: Math.round(numericCost * 1.8), // Auto estimate retail price
      minStockLevel: Number(minStockLevel) || 5,
      initialStock: Number(initialStock) || 0,
      location: location.trim(),
      notes: '',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {itemToEdit ? 'แก้ไขรายการเหล้า' : 'เพิ่มรายการเหล้าใหม่'}
              </h2>
              <p className="text-xs text-slate-400">
                กรอกเฉพาะชื่อเครื่องดื่มและราคาต้นทุน
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

        {/* Minimalist Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Field 1: ชื่อเครื่องดื่ม */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              1. ชื่อเครื่องดื่ม <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="เช่น Johnnie Walker Black Label, รีเจนซี่, แสงโสม..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder:text-slate-500 outline-none transition-all font-medium"
              required
            />
          </div>

          {/* Field 2: ราคาต้นทุน */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2. ราคาต้นทุนต่อขวด (บาท) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                placeholder="เช่น 1150, 450, 890..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder:text-slate-500 outline-none transition-all font-mono font-semibold"
                required
              />
              <span className="absolute right-4 top-3 text-xs font-medium text-slate-400">
                ฿ บาท / ขวด
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              ใช้สำหรับคำนวณมูลค่าคงคลังและรายงานยอดรับเข้า-เบิกจ่าย
            </p>
          </div>

          {/* Optional Advanced Settings Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-xs text-slate-400 hover:text-slate-300 flex items-center justify-between transition-colors"
            >
              <span>ตัวเลือกเพิ่มเติม (หมวดหมู่, สต็อกเริ่มต้น)</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs animate-in fade-in duration-150">
                <div>
                  <label className="block text-slate-400 mb-1">หมวดหมู่เครื่องดื่ม</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LiquorCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">สต็อกแรกเข้า (ขวด)</label>
                    <input
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">จุดเตือนสต็อกต่ำ (ขวด)</label>
                    <input
                      type="number"
                      min="1"
                      value={minStockLevel}
                      onChange={(e) => setMinStockLevel(Math.max(1, parseInt(e.target.value) || 5))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">สถานที่จัดเก็บ</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="เช่น คลังหลัก, สเตชั่นบาร์"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!name.trim() || unitCost === ''}
              className={`px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 ${
                !name.trim() || unitCost === '' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Save className="w-4 h-4" />
              {itemToEdit ? 'บันทึกการแก้ไข' : 'บันทึกเพิ่มเหล้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
