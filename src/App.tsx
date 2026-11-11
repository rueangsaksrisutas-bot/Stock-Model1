/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LiquorItem, StockTransaction, TransactionType } from './types/inventory';
import {
  loadLiquorItems,
  saveLiquorItems,
  loadTransactions,
  saveTransactions,
  resetToDemoData,
  calculateStats,
} from './utils/storage';
import { Header } from './components/Header';
import { TransactionPage } from './components/TransactionPage';
import { SummaryPage } from './components/SummaryPage';
import { TransactionModal } from './components/TransactionModal';
import { LiquorItemModal } from './components/LiquorItemModal';
import { StockAuditModal } from './components/StockAuditModal';
import { ItemHistoryModal } from './components/ItemHistoryModal';
import { PrintReportView } from './components/PrintReportView';
import { GoogleSheetBackupModal } from './components/GoogleSheetBackupModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [items, setItems] = React.useState<LiquorItem[]>(() => loadLiquorItems());
  const [transactions, setTransactions] = React.useState<StockTransaction[]>(() => loadTransactions());
  const [activeTab, setActiveTab] = React.useState<'transactions' | 'summary'>('transactions');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false);
  const [transactionModalType, setTransactionModalType] = React.useState<TransactionType>('IN');
  const [transactionModalLiquorId, setTransactionModalLiquorId] = React.useState<string | undefined>(undefined);

  const [isItemModalOpen, setIsItemModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<LiquorItem | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = React.useState(false);
  const [auditLiquor, setAuditLiquor] = React.useState<LiquorItem | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const [historyLiquor, setHistoryLiquor] = React.useState<LiquorItem | null>(null);

  const [isPrintReportOpen, setIsPrintReportOpen] = React.useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = React.useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Re-save whenever items or transactions update
  React.useEffect(() => {
    saveLiquorItems(items);
  }, [items]);

  React.useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // Overall Stats
  const stats = React.useMemo(() => calculateStats(items, transactions), [items, transactions]);

  // Handler: Save Transaction (In / Out)
  const handleSaveTransaction = (txData: Omit<StockTransaction, 'id' | 'timestamp'>) => {
    const newTx: StockTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Update item stock
    const updatedItems = items.map((item) => {
      if (item.id === txData.liquorId) {
        let newStock = item.currentStock;
        if (txData.type === 'IN') {
          newStock += txData.quantity;
        } else if (txData.type === 'OUT') {
          newStock = Math.max(0, newStock - txData.quantity);
        }
        return { ...item, currentStock: newStock };
      }
      return item;
    });

    setItems(updatedItems);
    setTransactions((prev) => [newTx, ...prev]);

    showToast(
      txData.type === 'IN'
        ? `บันทึกรับเข้า "${txData.liquorName}" จำนวน ${txData.quantity} ขวด เรียบร้อยแล้ว`
        : `บันทึกเบิกจ่าย "${txData.liquorName}" จำนวน ${txData.quantity} ขวด เรียบร้อยแล้ว`
    );
  };

  // Handler: Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return;

    // Rollback stock change
    const updatedItems = items.map((item) => {
      if (item.id === targetTx.liquorId) {
        let restoredStock = item.currentStock;
        if (targetTx.type === 'IN') {
          restoredStock = Math.max(0, restoredStock - targetTx.quantity);
        } else if (targetTx.type === 'OUT') {
          restoredStock += targetTx.quantity;
        }
        return { ...item, currentStock: restoredStock };
      }
      return item;
    });

    setItems(updatedItems);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast(`ลบรายการบันทึก "${targetTx.liquorName}" เรียบร้อยแล้ว`);
  };

  // Handler: Save or Edit Liquor Item SKU
  const handleSaveLiquorItem = (
    itemData: Omit<LiquorItem, 'id' | 'currentStock'> & { id?: string; currentStock?: number }
  ) => {
    if (itemData.id) {
      // Edit existing
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemData.id
            ? {
                ...i,
                ...itemData,
                id: itemData.id as string,
                currentStock: itemData.currentStock ?? i.currentStock,
              }
            : i
        )
      );
      showToast(`อัปเดตข้อมูล "${itemData.name}" สำเร็จ`);
    } else {
      // Add new
      const newItem: LiquorItem = {
        ...itemData,
        id: `liq-${Date.now()}`,
        currentStock: itemData.initialStock ?? 0,
      };

      // Also log an initial IN transaction if initialStock > 0
      const initialTx: StockTransaction = {
        id: `tx-init-${Date.now()}`,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
        type: 'IN',
        liquorId: newItem.id,
        liquorName: newItem.name,
        category: newItem.category,
        quantity: newItem.initialStock,
        unitCost: newItem.unitCost,
        totalValue: newItem.initialStock * newItem.unitCost,
        referenceNo: 'INIT-STOCK',
        destination: newItem.location || 'คลังหลัก',
        operator: 'ผู้จัดการระบบ',
        reason: 'บันทึกยอดยกมาเริ่มต้นแรกเข้า',
        notes: 'ยอดตั้งต้นในการเพิ่มรายการสินค้าใหม่',
      };

      setItems((prev) => [newItem, ...prev]);
      if (newItem.initialStock > 0) {
        setTransactions((prev) => [initialTx, ...prev]);
      }
      showToast(`เพิ่มรายการเหล้าใหม่ "${newItem.name}" สำเร็จ`);
    }
  };

  // Handler: Confirm Physical Stock Audit
  const handleConfirmAudit = (
    auditTxData: Omit<StockTransaction, 'id' | 'timestamp'>,
    newPhysicalStock: number
  ) => {
    const newTx: StockTransaction = {
      ...auditTxData,
      id: `tx-audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setItems((prev) =>
      prev.map((item) =>
        item.id === auditTxData.liquorId ? { ...item, currentStock: newPhysicalStock } : item
      )
    );

    setTransactions((prev) => [newTx, ...prev]);
    showToast(`ปรับยอดคงเหลือ "${auditTxData.liquorName}" เป็น ${newPhysicalStock} ขวด สำเร็จ`);
  };

  // Handler: Reset Demo Data
  const handleResetDemo = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลเป็นชุดตัวอย่างเริ่มต้น (Johnnie Walker, Chivas, Regency, Gin, Wine ฯลฯ) หรือไม่?')) {
      const demo = resetToDemoData();
      setItems(demo.items);
      setTransactions(demo.transactions);
      showToast('รีเซ็ตข้อมูลตัวอย่างคลังเหล้าเรียบร้อยแล้ว');
    }
  };

  // Quick Open Modal Helpers
  const handleOpenTransactionModal = (type: TransactionType, liquorId?: string) => {
    setTransactionModalType(type);
    setTransactionModalLiquorId(liquorId);
    setIsTransactionModalOpen(true);
  };

  const handleOpenItemModal = (item?: LiquorItem) => {
    setEditingItem(item || null);
    setIsItemModalOpen(true);
  };

  const handleOpenAuditModal = (liquor: LiquorItem) => {
    setAuditLiquor(liquor);
    setIsAuditModalOpen(true);
  };

  const handleOpenHistoryModal = (liquor: LiquorItem) => {
    setHistoryLiquor(liquor);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenTransactionModal={(type) => handleOpenTransactionModal(type)}
        onOpenItemModal={() => handleOpenItemModal()}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onResetDemo={handleResetDemo}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Tab 1: รับเข้าและเบิกจ่าย */}
        {activeTab === 'transactions' && (
          <TransactionPage
            items={items}
            transactions={transactions}
            onOpenTransactionModal={handleOpenTransactionModal}
            onOpenItemModal={() => handleOpenItemModal()}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* Page Tab 2: สรุปยอดคงเหลือ */}
        {activeTab === 'summary' && (
          <SummaryPage
            items={items}
            transactions={transactions}
            onOpenItemModal={handleOpenItemModal}
            onOpenTransactionModal={handleOpenTransactionModal}
            onOpenAuditModal={handleOpenAuditModal}
            onOpenHistoryModal={handleOpenHistoryModal}
            onOpenPrintReport={() => setIsPrintReportOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            ระบบคำนวนยอดคลังเหล้า & จัดการสต็อกบาร์ (Liquor Bar Stock & Inventory System)
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>สต็อกคงคลัง: <strong className="text-emerald-400">{stats.totalBottles}</strong> ขวด</span>
            <span>•</span>
            <span>มูลค่ารวม: <strong className="text-amber-400 font-mono">฿{stats.totalValue.toLocaleString()}</strong></span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/50 text-slate-100 text-xs sm:text-sm shadow-2xl shadow-black/80 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        items={items}
        initialType={transactionModalType}
        initialLiquorId={transactionModalLiquorId}
        onSave={handleSaveTransaction}
      />

      <LiquorItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemToEdit={editingItem}
        onSave={handleSaveLiquorItem}
      />

      <StockAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        liquor={auditLiquor}
        onConfirmAudit={handleConfirmAudit}
      />

      <ItemHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        liquor={historyLiquor}
        transactions={transactions}
        onOpenTransactionModal={(type, id) => handleOpenTransactionModal(type, id)}
      />

      <PrintReportView
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        items={items}
        stats={stats}
      />

      <GoogleSheetBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        items={items}
        transactions={transactions}
        onBackupSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
}
