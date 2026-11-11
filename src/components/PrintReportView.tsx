import React from 'react';
import { LiquorItem, InventoryStats } from '../types/inventory';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatNumber, formatThaiDate } from '../utils/storage';

interface PrintReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  items: LiquorItem[];
  stats: InventoryStats;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  isOpen,
  onClose,
  items,
  stats,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 print:border-none print:shadow-none print:my-0 print:bg-white print:text-black">
        {/* Print Toolbar - Hidden in Print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">พิมพ์รายงานสรุปยอดคงเหลือคลังเหล้า</h2>
              <p className="text-xs text-slate-400">แบบฟอร์มรายงานตรวจนับและสรุปมูลค่าคลังสินค้า</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-semibold text-xs transition-all shadow-lg flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              สั่งพิมพ์รายงาน (Print / Save PDF)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="p-8 max-h-[85vh] overflow-y-auto print:max-h-none print:p-6 bg-slate-900 text-slate-100 print:bg-white print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-amber-500/40 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-100 print:text-black">
                  ใบสรุปรายงานยอดคงเหลือคลังสุราและเครื่องดื่มแอลกอฮอล์
                </h1>
                <p className="text-sm text-slate-400 print:text-gray-600 mt-1">
                  Liquor Bar & Cellar Inventory Valuation Summary Report
                </p>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-400 print:text-gray-600 space-y-1">
                <div>
                  <span className="font-semibold text-slate-300 print:text-black">วันที่จัดทำ:</span>{' '}
                  {formatThaiDate(currentDate, currentTime)}
                </div>
                <div>
                  <span className="font-semibold text-slate-300 print:text-black">หน่วยงาน:</span> แผนกคลังสินค้าและเครื่องดื่ม (Beverage & Bar Ops)
                </div>
                <div>
                  <span className="font-semibold text-slate-300 print:text-black">สถานะ:</span> ตรวจนับเสร็จสมบูรณ์
                </div>
              </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 p-4 rounded-xl bg-slate-950/60 print:bg-gray-100 print:text-black border border-slate-800 print:border-gray-300">
              <div>
                <div className="text-xs text-slate-400 print:text-gray-600">รายการเหล้าทั้งหมด</div>
                <div className="text-lg font-bold font-mono text-amber-400 print:text-black">
                  {stats.totalItems} <span className="text-xs font-normal">รายการ</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 print:text-gray-600">ยอดคงเหลือรวมทั้งหมด</div>
                <div className="text-lg font-bold font-mono text-emerald-400 print:text-black">
                  {formatNumber(stats.totalBottles)} <span className="text-xs font-normal">ขวด</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 print:text-gray-600">มูลค่าสต็อกคงเหลือรวม</div>
                <div className="text-lg font-bold font-mono text-amber-300 print:text-black">
                  {formatCurrency(stats.totalValue)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 print:text-gray-600">สินค้าต้องสั่งเพิ่มด่วน</div>
                <div className="text-lg font-bold font-mono text-rose-400 print:text-black">
                  {stats.lowStockCount + stats.outOfStockCount} <span className="text-xs font-normal">รายการ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-700 print:border-gray-400 text-slate-400 print:text-gray-700 bg-slate-950/40 print:bg-gray-200">
                  <th className="py-2.5 px-2">ลำดับ</th>
                  <th className="py-2.5 px-2">รหัสสินค้า</th>
                  <th className="py-2.5 px-3">รายการเหล้า / แบรนด์</th>
                  <th className="py-2.5 px-2">หมวดหมู่</th>
                  <th className="py-2.5 px-2 text-right">ขนาด (ml)</th>
                  <th className="py-2.5 px-2 text-right">สต็อกขั้นต่ำ</th>
                  <th className="py-2.5 px-3 text-right font-semibold">คงเหลือ (ขวด)</th>
                  <th className="py-2.5 px-2 text-right">คิดเป็น (ลัง)</th>
                  <th className="py-2.5 px-2 text-right">ต้นทุน/ขวด</th>
                  <th className="py-2.5 px-3 text-right font-semibold">มูลค่ารวม (บาท)</th>
                  <th className="py-2.5 px-2 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {items.map((item, index) => {
                  const cases = (item.currentStock / item.bottlesPerCase).toFixed(1);
                  const isLow = item.currentStock <= item.minStockLevel && item.currentStock > 0;
                  const isOut = item.currentStock <= 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 print:hover:bg-transparent"
                    >
                      <td className="py-2 px-2 text-slate-400 print:text-gray-600 font-mono">{index + 1}</td>
                      <td className="py-2 px-2 font-mono text-slate-300 print:text-black">{item.code}</td>
                      <td className="py-2 px-3 font-medium text-slate-100 print:text-black">
                        <div>{item.name}</div>
                        <div className="text-[10px] text-slate-400 print:text-gray-500">{item.brand}</div>
                      </td>
                      <td className="py-2 px-2 text-slate-300 print:text-black">{item.category}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-300 print:text-black">{item.volumeMl}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-400 print:text-gray-600">{item.minStockLevel}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-100 print:text-black">
                        {item.currentStock}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-400 print:text-gray-600">{cases}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-300 print:text-black">
                        ฿{item.unitCost.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 print:text-black">
                        ฿{(item.currentStock * item.unitCost).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {isOut ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800 print:bg-red-100 print:text-red-700">
                            หมด
                          </span>
                        ) : isLow ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800 print:bg-yellow-100 print:text-yellow-800">
                            ใกล้หมด
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 print:bg-green-100 print:text-green-800">
                            ปกติ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-amber-500 font-bold bg-slate-950/70 print:bg-gray-200">
                  <td colSpan={6} className="py-3 px-3 text-right text-slate-200 print:text-black">
                    รวมทั้งสิ้น ({items.length} รายการ):
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400 print:text-black">
                    {formatNumber(stats.totalBottles)} ขวด
                  </td>
                  <td colSpan={2} className="py-3 px-2 text-right text-slate-400 print:text-black">
                    มูลค่าสุทธิ:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-400 print:text-black">
                    {formatCurrency(stats.totalValue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures for Official Audit Verification */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-12 mt-12 border-t border-slate-800 print:border-gray-400 text-center text-xs">
            <div>
              <div className="border-b border-dashed border-slate-600 print:border-gray-500 h-10 w-44 mx-auto mb-2"></div>
              <p className="font-semibold text-slate-200 print:text-black">(...................................................)</p>
              <p className="text-slate-400 print:text-gray-600 mt-0.5">ผู้จัดทำรายงาน / ตรวจนับสต็อก</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">วันที่: ..... / ..... / ..........</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-600 print:border-gray-500 h-10 w-44 mx-auto mb-2"></div>
              <p className="font-semibold text-slate-200 print:text-black">(...................................................)</p>
              <p className="text-slate-400 print:text-gray-600 mt-0.5">หัวหน้าบาร์เทนเดอร์ (Head Bartender)</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">วันที่: ..... / ..... / ..........</p>
            </div>
            <div className="sm:col-span-1 col-span-2">
              <div className="border-b border-dashed border-slate-600 print:border-gray-500 h-10 w-44 mx-auto mb-2"></div>
              <p className="font-semibold text-slate-200 print:text-black">(...................................................)</p>
              <p className="text-slate-400 print:text-gray-600 mt-0.5">ผู้จัดการฝ่ายปฏิบัติการ / เจ้าของร้าน</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">วันที่: ..... / ..... / ..........</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
