import { LiquorItem, StockTransaction, InventoryStats } from '../types/inventory';
import { INITIAL_LIQUOR_ITEMS, INITIAL_TRANSACTIONS } from '../data/initialData';

const ITEMS_STORAGE_KEY = 'liquor_inventory_items_v1';
const TRANSACTIONS_STORAGE_KEY = 'liquor_inventory_transactions_v1';

export function loadLiquorItems(): LiquorItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (!raw) {
      saveLiquorItems(INITIAL_LIQUOR_ITEMS);
      return INITIAL_LIQUOR_ITEMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_LIQUOR_ITEMS;
  } catch (err) {
    console.error('Failed to load liquor items:', err);
    return INITIAL_LIQUOR_ITEMS;
  }
}

export function saveLiquorItems(items: LiquorItem[]): void {
  try {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save liquor items:', err);
  }
}

export function loadTransactions(): StockTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TRANSACTIONS;
  } catch (err) {
    console.error('Failed to load transactions:', err);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: StockTransaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

export function resetToDemoData(): { items: LiquorItem[]; transactions: StockTransaction[] } {
  saveLiquorItems(INITIAL_LIQUOR_ITEMS);
  saveTransactions(INITIAL_TRANSACTIONS);
  return {
    items: INITIAL_LIQUOR_ITEMS,
    transactions: INITIAL_TRANSACTIONS,
  };
}

export function calculateStats(items: LiquorItem[], transactions: StockTransaction[]): InventoryStats {
  const totalItems = items.length;
  let totalBottles = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  items.forEach((item) => {
    totalBottles += item.currentStock;
    totalValue += item.currentStock * item.unitCost;
    if (item.currentStock <= 0) {
      outOfStockCount++;
    } else if (item.currentStock <= item.minStockLevel) {
      lowStockCount++;
    }
  });

  // Calculate today's date in local YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  let todayInCount = 0;
  let todayInValue = 0;
  let todayOutCount = 0;
  let todayOutValue = 0;

  transactions.forEach((tx) => {
    // If transaction date is today or recent
    if (tx.date === todayStr || tx.timestamp.startsWith(todayStr)) {
      if (tx.type === 'IN') {
        todayInCount += tx.quantity;
        todayInValue += tx.totalValue;
      } else if (tx.type === 'OUT') {
        todayOutCount += tx.quantity;
        todayOutValue += tx.totalValue;
      }
    }
  });

  return {
    totalItems,
    totalBottles,
    totalValue,
    lowStockCount,
    outOfStockCount,
    todayInCount,
    todayInValue,
    todayOutCount,
    todayOutValue,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('th-TH').format(num);
}

export function formatThaiDate(dateStr: string, timeStr?: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543; // Buddhist Era
    const dateFormatted = `${day} ${month} ${year}`;
    return timeStr ? `${dateFormatted} (${timeStr} น.)` : dateFormatted;
  } catch {
    return dateStr;
  }
}

export function exportTransactionsToCSV(transactions: StockTransaction[]): void {
  const headers = [
    'รหัสรายการ',
    'วันที่',
    'เวลา',
    'ประเภท',
    'ชื่อเหล้า',
    'หมวดหมู่',
    'จำนวน (ขวด)',
    'ราคาต่อหน่วย (บาท)',
    'มูลค่ารวม (บาท)',
    'เลขอ้างอิง/บิล',
    'แผนก/ปลายทาง',
    'ผู้ทำรายการ',
    'เหตุผล',
    'หมายเหตุ',
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.time,
    t.type === 'IN' ? 'รับเข้า' : t.type === 'OUT' ? 'เบิกจ่าย' : 'ปรับยอด',
    `"${(t.liquorName || '').replace(/"/g, '""')}"`,
    t.category,
    t.quantity,
    t.unitCost,
    t.totalValue,
    `"${(t.referenceNo || '').replace(/"/g, '""')}"`,
    `"${(t.destination || '').replace(/"/g, '""')}"`,
    `"${(t.operator || '').replace(/"/g, '""')}"`,
    `"${(t.reason || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `liquor_transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportInventorySummaryToCSV(items: LiquorItem[]): void {
  const headers = [
    'รหัสสินค้า (SKU)',
    'ชื่อเหล้า',
    'แบรนด์',
    'หมวดหมู่',
    'ขนาด (ml)',
    'จำนวนขวด/ลัง',
    'ต้นทุนต่อขวด (บาท)',
    'ราคาขายต่อขวด (บาท)',
    'สต็อกขั้นต่ำ (ขวด)',
    'คงเหลือปัจจุบัน (ขวด)',
    'คิดเป็นลัง',
    'มูลค่าคงเหลือรวม (บาท)',
    'สถานที่เก็บ',
    'สถานะสต็อก',
  ];

  const rows = items.map((i) => {
    const cases = (i.currentStock / i.bottlesPerCase).toFixed(1);
    let status = 'ปกติ';
    if (i.currentStock <= 0) status = 'หมดสต็อก (Out of stock)';
    else if (i.currentStock <= i.minStockLevel) status = 'สต็อกใกล้หมด (Low stock)';

    return [
      `"${i.code}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.brand.replace(/"/g, '""')}"`,
      i.category,
      i.volumeMl,
      i.bottlesPerCase,
      i.unitCost,
      i.sellingPrice || 0,
      i.minStockLevel,
      i.currentStock,
      cases,
      i.currentStock * i.unitCost,
      `"${(i.location || '').replace(/"/g, '""')}"`,
      status,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `liquor_inventory_summary_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
