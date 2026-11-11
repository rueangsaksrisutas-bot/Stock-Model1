import { LiquorItem, StockTransaction } from '../types/inventory';
import { getAccessToken } from './googleAuth';

const SPREADSHEET_ID_STORAGE_KEY = 'liquor_backup_spreadsheet_id_v1';
const SPREADSHEET_URL_STORAGE_KEY = 'liquor_backup_spreadsheet_url_v1';
const LAST_BACKUP_TIME_KEY = 'liquor_last_backup_time_v1';

export interface BackupResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  timestamp: string;
  message: string;
}

export function getSavedBackupInfo(): { spreadsheetId: string | null; spreadsheetUrl: string | null; lastBackupTime: string | null } {
  return {
    spreadsheetId: localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY),
    spreadsheetUrl: localStorage.getItem(SPREADSHEET_URL_STORAGE_KEY),
    lastBackupTime: localStorage.getItem(LAST_BACKUP_TIME_KEY),
  };
}

export function saveBackupInfo(spreadsheetId: string, spreadsheetUrl: string): void {
  const now = new Date().toISOString();
  localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, spreadsheetId);
  localStorage.setItem(SPREADSHEET_URL_STORAGE_KEY, spreadsheetUrl);
  localStorage.setItem(LAST_BACKUP_TIME_KEY, now);
}

/**
 * Creates or retrieves the Google Spreadsheet for inventory backups
 */
export async function getOrCreateBackupSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  const existingId = localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
  if (existingId) {
    // Verify if still accessible
    try {
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${existingId}?fields=spreadsheetId,spreadsheetUrl`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        return {
          id: data.spreadsheetId,
          url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
        };
      }
    } catch {
      // If error or deleted, create fresh
    }
  }

  // Create new Spreadsheet
  const title = `คลังเหล้า - สำรองข้อมูลรายวัน (${new Date().toLocaleDateString('th-TH')})`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        { properties: { title: 'สรุปยอดคงเหลือ (Stock Balance)' } },
        { properties: { title: 'ประวัติรับเข้า-เบิกจ่าย (Transactions)' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`ไม่สามารถสร้าง Google Sheet ได้: ${errText}`);
  }

  const data = await createRes.json();
  const id = data.spreadsheetId;
  const url = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${id}/edit`;

  saveBackupInfo(id, url);
  return { id, url };
}

/**
 * Performs a daily backup of both Stock Balance and In/Out Transactions
 */
export async function performDailyBackup(
  items: LiquorItem[],
  transactions: StockTransaction[]
): Promise<BackupResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('ยังไม่ได้เข้าสู่ระบบ Google กรุณาเข้าสู่ระบบก่อนทำการสำรองข้อมูล');
  }

  // 1. Get or create spreadsheet
  const { id: spreadsheetId, url: spreadsheetUrl } = await getOrCreateBackupSpreadsheet(token);

  // 2. Prepare Stock Balance Data
  const nowStr = new Date().toLocaleString('th-TH');
  const todayDate = new Date().toISOString().split('T')[0];

  const balanceHeaders = [
    'ลำดับ',
    'รหัสสินค้า (SKU)',
    'ชื่อสุรา/เครื่องดื่ม',
    'แบรนด์',
    'หมวดหมู่',
    'ขนาด (ml)',
    'คงเหลือปัจจุบัน (ขวด)',
    'คิดเป็น (ลัง)',
    'สต็อกขั้นต่ำ (ขวด)',
    'ราคาต้นทุนต่อขวด (บาท)',
    'มูลค่าสต็อกรวม (บาท)',
    'สถานที่จัดเก็บ',
    'สถานะสินค้า',
    'วันที่สำรองข้อมูล',
  ];

  const balanceRows = items.map((item, index) => {
    const cases = (item.currentStock / item.bottlesPerCase).toFixed(1);
    let status = 'ปกติ';
    if (item.currentStock <= 0) status = 'หมดสต็อก';
    else if (item.currentStock <= item.minStockLevel) status = 'สต็อกใกล้หมด';

    return [
      index + 1,
      item.code,
      item.name,
      item.brand,
      item.category,
      item.volumeMl,
      item.currentStock,
      cases,
      item.minStockLevel,
      item.unitCost,
      item.currentStock * item.unitCost,
      item.location || 'คลังหลัก',
      status,
      nowStr,
    ];
  });

  // Calculate totals
  const totalBottles = items.reduce((sum, item) => sum + item.currentStock, 0);
  const totalValue = items.reduce((sum, item) => sum + item.currentStock * item.unitCost, 0);

  const balanceTotals = [
    '',
    'รวมทั้งสิ้น',
    `${items.length} รายการ`,
    '',
    '',
    '',
    totalBottles,
    (totalBottles / 12).toFixed(1),
    '',
    '',
    totalValue,
    '',
    '',
    '',
  ];

  // 3. Prepare Transactions Data
  const txHeaders = [
    'รหัสรายการ',
    'วันที่',
    'เวลา',
    'ประเภท',
    'ชื่อสุรา',
    'หมวดหมู่',
    'จำนวน (ขวด)',
    'ต้นทุนต่อขวด (บาท)',
    'มูลค่ารวม (บาท)',
    'เลขอ้างอิง/บิล',
    'ปลายทาง/จุดเบิก',
    'ผู้ทำรายการ',
    'เหตุผล',
    'หมายเหตุ',
  ];

  const txRows = transactions.map((t) => [
    t.id,
    t.date,
    t.time,
    t.type === 'IN' ? 'รับเข้า' : t.type === 'OUT' ? 'เบิกจ่าย' : 'ปรับยอด',
    t.liquorName,
    t.category,
    t.quantity,
    t.unitCost,
    t.totalValue,
    t.referenceNo || '',
    t.destination || '',
    t.operator,
    t.reason || '',
    t.notes || '',
  ]);

  // 4. Update both sheets using batchUpdate / values.update
  // Write Stock Balance
  const updateBalanceRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/สรุปยอดคงเหลือ (Stock Balance)!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'สรุปยอดคงเหลือ (Stock Balance)!A1',
        majorDimension: 'ROWS',
        values: [balanceHeaders, ...balanceRows, balanceTotals],
      }),
    }
  );

  if (!updateBalanceRes.ok) {
    const err = await updateBalanceRes.text();
    throw new Error(`ไม่สามารถอัปเดตหน้าสรุปยอดคงเหลือ: ${err}`);
  }

  // Write Transactions Log
  const updateTxRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/ประวัติรับเข้า-เบิกจ่าย (Transactions)!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'ประวัติรับเข้า-เบิกจ่าย (Transactions)!A1',
        majorDimension: 'ROWS',
        values: [txHeaders, ...txRows],
      }),
    }
  );

  if (!updateTxRes.ok) {
    const err = await updateTxRes.text();
    throw new Error(`ไม่สามารถอัปเดตหน้าประวัติรับเข้า-เบิกจ่าย: ${err}`);
  }

  // Save successful backup time
  saveBackupInfo(spreadsheetId, spreadsheetUrl);

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    timestamp: nowStr,
    message: `สำรองข้อมูลสำเร็จ! บันทึกข้อมูล ${items.length} รายการ และ ${transactions.length} ธุรกรรม ลงใน Google Sheets เรียบร้อยแล้ว`,
  };
}
