import React from 'react';
import { LiquorItem, StockTransaction } from '../types/inventory';
import {
  X,
  FileSpreadsheet,
  CloudUpload,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout, initAuth } from '../services/googleAuth';
import { performDailyBackup, getSavedBackupInfo } from '../services/googleSheets';

interface GoogleSheetBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LiquorItem[];
  transactions: StockTransaction[];
  onBackupSuccess: (msg: string) => void;
}

export const GoogleSheetBackupModal: React.FC<GoogleSheetBackupModalProps> = ({
  isOpen,
  onClose,
  items,
  transactions,
  onBackupSuccess,
}) => {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [backupInfo, setBackupInfo] = React.useState(getSavedBackupInfo());
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<{ url: string; time: string } | null>(null);

  // Initialize Auth state listener
  React.useEffect(() => {
    if (isOpen) {
      setBackupInfo(getSavedBackupInfo());
      setErrorMsg(null);
      setSuccessInfo(null);
      const unsubscribe = initAuth(
        (user) => {
          setCurrentUser(user);
        },
        () => {
          setCurrentUser(null);
        }
      );
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
  };

  const handlePerformBackup = async () => {
    // Confirmation dialog as mandated by Workspace Integration Skill
    const confirmBackup = window.confirm(
      `ยืนยันการสำรองข้อมูลคลังเหล้าไปยัง Google Sheets หรือไม่?\n\n• รายการสินค้าทั้งหมด: ${items.length} รายการ\n• รายการรับเข้า-เบิกจ่าย: ${transactions.length} ธุรกรรม\n\nระบบจะทำการอัปเดตข้อมูลล่าสุดลงใน Google Sheet ของคุณ`
    );
    if (!confirmBackup) return;

    setIsBackingUp(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const result = await performDailyBackup(items, transactions);
      setBackupInfo(getSavedBackupInfo());
      setSuccessInfo({
        url: result.spreadsheetUrl,
        time: result.timestamp,
      });
      onBackupSuccess(result.message);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสำรองข้อมูลไปยัง Google Sheets');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Check if backed up today
  const isBackedUpToday = (() => {
    if (!backupInfo.lastBackupTime) return false;
    const backupDate = new Date(backupInfo.lastBackupTime).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return backupDate === today;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                สำรองข้อมูลใน Google Sheets
              </h2>
              <p className="text-xs text-slate-400">Daily Inventory Backup to Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Auth Status Section */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 mb-2">บัญชี Google ที่เชื่อมต่อ:</div>
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border border-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/40">
                      {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      {currentUser.displayName || 'ผู้ใช้งาน Google'}
                    </div>
                    <div className="text-xs text-slate-400">{currentUser.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออก</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  เข้าสู่ระบบด้วยบัญชี Google เพื่อให้ระบบสร้างและอัปเดตไฟล์สเปรดชีตใน Google Drive ของคุณ
                </p>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs sm:text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {/* Google SVG Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoggingIn ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Backup Status Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">สถานะการสำรองข้อมูล:</span>
              {isBackedUpToday ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  สำรองข้อมูลวันนี้แล้ว
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  ยังไม่ได้สำรองข้อมูลวันนี้
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300">
              <span className="text-slate-400">สำรองล่าสุด: </span>
              {backupInfo.lastBackupTime ? (
                <span className="font-medium text-slate-200">
                  {new Date(backupInfo.lastBackupTime).toLocaleString('th-TH')}
                </span>
              ) : (
                <span className="text-slate-500">ยังไม่เคยทำการสำรองข้อมูล</span>
              )}
            </div>

            {/* Direct Link to Google Sheet if exists */}
            {backupInfo.spreadsheetUrl && (
              <a
                href={backupInfo.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4 pt-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                เปิดดูไฟล์ Google Sheet ที่บันทึกไว้
              </a>
            )}
          </div>

          {/* Success Banner */}
          {successInfo && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-200 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                สำรองข้อมูลรายวันเสร็จสมบูรณ์!
              </div>
              <p className="text-slate-300">
                ระบบได้บันทึกข้อมูล {items.length} รายการ และ {transactions.length} ธุรกรรม ลงใน Google Sheets แล้ว
              </p>
              <a
                href={successInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                เปิด Google Sheet ทันที
              </a>
            </div>
          )}

          {/* Details of what will be backed up */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300">เนื้อหาที่จะถูกสำรองลงใน Google Sheets:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <strong>แผ่นงานที่ 1: สรุปยอดคงเหลือ</strong> (ยอดคงเหลือรายขวด, คิดเป็นลัง, มูลค่ารวม, จุดเตือนขั้นต่ำ, สถานะสต็อก)
              </li>
              <li>
                <strong>แผ่นงานที่ 2: ประวัติรับเข้า-เบิกจ่าย</strong> (ประวัติรายการทั้งหมด, วันที่เวลา, ผู้เบิก, สาขาปลายทาง, เลขบิล)
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              ปิด
            </button>

            <button
              type="button"
              onClick={handlePerformBackup}
              disabled={!currentUser || isBackingUp}
              className={`px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 ${
                !currentUser || isBackingUp ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสำรองข้อมูล...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>สำรองข้อมูลลง Google Sheet ทันที</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
