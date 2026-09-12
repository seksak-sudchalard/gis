import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  ExpenseItem,
  FilterState,
  BudgetConfig,
} from './types';
import {
  INITIAL_EXPENSES,
  DEFAULT_BUDGET_CONFIG,
} from './data/sampleData';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  fetchExpensesFromGoogleSheet,
  syncAllExpensesToGoogleSheet,
  SPREADSHEET_ID,
  SHEET_NAME,
} from './services/googleSheets';
import { MapComponent } from './components/MapComponent';
import { ExpenseListSidebar } from './components/ExpenseListSidebar';
import { ExpenseModal } from './components/ExpenseModal';
import { GeoJsonUploadModal } from './components/GeoJsonUploadModal';
import { ChartsView } from './components/ChartsView';
import { GsiButton } from './components/GsiButton';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import {
  Map,
  BarChart3,
  Plus,
  Compass,
  Menu,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';

const STORAGE_KEY_ITEMS = 'gis_travel_expenses_v1';
const STORAGE_KEY_BUDGET = 'gis_travel_budget_v1';

export default function App() {
  // Persistence state
  const [items, setItems] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved items:', e);
    }
    return INITIAL_EXPENSES;
  });

  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGET);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved budget:', e);
    }
    return DEFAULT_BUDGET_CONFIG;
  });

  // Auth & Sync state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // UI state
  const [activeView, setActiveView] = useState<'map' | 'charts' | 'split'>('split');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExpenseItem | null>(null);

  // Filters
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: '',
    paymentMethod: 'all',
  });

  // Modals & Map interactions
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ExpenseItem | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedGeoJson, setUploadedGeoJson] = useState<any | null>(null);

  // Confirmation dialog state (for destructive operations as mandated by skill)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Save to localStorage whenever items or budget change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save items to localStorage:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(budgetConfig));
    } catch (e) {
      console.warn('Failed to save budget to localStorage:', e);
    }
  }, [budgetConfig]);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        if (token) setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setSyncError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);

        // Fetch existing data from Google Sheet if any
        try {
          setIsSyncing(true);
          const sheetItems = await fetchExpensesFromGoogleSheet(res.accessToken);
          if (sheetItems.length > 0) {
            // Ask user or merge
            setItems(sheetItems);
            setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
          } else {
            // Sheet is empty, push initial local items to sheet
            await syncAllExpensesToGoogleSheet(res.accessToken, items);
            setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
          }
        } catch (fetchErr: any) {
          console.warn('Initial sheet fetch/sync:', fetchErr);
          setSyncError(fetchErr.message || 'เชื่อมต่อ Sheet สำเร็จแต่ยังไม่ได้อ่านข้อมูล');
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setSyncError('เข้าสู่ระบบไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSyncError(null);
  };

  // Sync with Google Sheet
  const handleManualSync = async () => {
    if (!accessToken) {
      handleGoogleSignIn();
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      await syncAllExpensesToGoogleSheet(accessToken, items);
      setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncError(err.message || 'การซิงค์ข้อมูลล้มเหลว');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync wrapper: when items are mutated, immediately push to Google Sheet if logged in
  const autoSyncToSheet = useCallback(
    async (updatedItems: ExpenseItem[]) => {
      const token = accessToken || (await getAccessToken());
      if (token) {
        setIsSyncing(true);
        setSyncError(null);
        try {
          await syncAllExpensesToGoogleSheet(token, updatedItems);
          setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
        } catch (err: any) {
          console.error('Auto sync error:', err);
          setSyncError('อัปเดต Google Sheet ไม่สำเร็จ: ' + (err.message || ''));
        } finally {
          setIsSyncing(false);
        }
      }
    },
    [accessToken]
  );

  // Add or Edit item
  const handleSaveExpense = (item: ExpenseItem) => {
    let updated: ExpenseItem[];
    const exists = items.some((i) => i.id === item.id);

    if (exists) {
      // Overwrite in place
      updated = items.map((i) => (i.id === item.id ? item : i));
    } else {
      updated = [item, ...items];
    }

    setItems(updated);
    setSelectedItem(item);
    autoSyncToSheet(updated);
  };

  // Delete item with mandatory confirmation dialog
  const handleDeleteItem = (item: ExpenseItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบรายการ',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${item.title}" ออกจากระบบและ Google Sheet? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      details: `ID: ${item.id} | ยอดเงิน: ฿${item.amount} | วันที่: ${item.date}`,
      confirmLabel: 'ลบรายการ',
      confirmVariant: 'danger',
      onConfirm: () => {
        const updated = items.filter((i) => i.id !== item.id);
        setItems(updated);
        if (selectedItem?.id === item.id) {
          setSelectedItem(null);
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        autoSyncToSheet(updated);
      },
    });
  };

  // Import GeoJSON/CSV items
  const handleImportExpenses = (newItems: ExpenseItem[]) => {
    const updated = [...newItems, ...items];
    setItems(updated);
    autoSyncToSheet(updated);
  };

  // Map coordinate click handler
  const handleMapClickCoordinates = (coords: { lat: number; lng: number }) => {
    setClickedCoords(coords);
    if (isPickingLocation) {
      setIsPickingLocation(false);
      setItemToEdit(null);
      setIsExpenseModalOpen(true);
    }
  };

  return (
    <div id="gis-app-root" className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {/* Top Application Navbar */}
      <header
        id="app-header"
        className="h-14 shrink-0 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between z-30 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          {/* Mobile Sidebar Toggle Button */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="เปิดรายการและตัวกรอง"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                  GIS Travel Tracker
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Leaflet.js
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
                แผนที่โต้ตอบบันทึกรายรับรายจ่ายการเดินทาง &bull; ซิงค์ Google Sheet
              </p>
            </div>
          </div>
        </div>

        {/* Center View Switcher (for tablets/desktops) */}
        <div className="hidden sm:flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-medium border border-slate-200">
          <button
            id="view-tab-split"
            onClick={() => setActiveView('split')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'split'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>แผนที่ & สถิติ</span>
          </button>
          <button
            id="view-tab-map"
            onClick={() => setActiveView('map')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'map'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>แผนที่เต็มจอ</span>
          </button>
          <button
            id="view-tab-charts"
            onClick={() => setActiveView('charts')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'charts'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>สรุปกราฟ & งบ</span>
          </button>
        </div>

        {/* Right Nav Actions: Google Sign-In & Add Record */}
        <div className="flex items-center gap-2">
          {/* GSI Auth & Sheet Sync Button */}
          <GsiButton
            user={user}
            onSignIn={handleGoogleSignIn}
            onSignOut={handleGoogleSignOut}
            isLoading={isAuthLoading}
            isSyncing={isSyncing}
            onSync={handleManualSync}
            lastSyncTime={lastSyncTime}
            syncError={syncError}
          />

          {/* Quick Add Expense Button */}
          <button
            id="nav-add-expense-btn"
            onClick={() => {
              setItemToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">เพิ่มรายการ</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div id="main-workspace-body" className="flex-1 flex overflow-hidden relative">
        {/* Left Filter & Items Sidebar */}
        <ExpenseListSidebar
          items={items}
          filter={filter}
          onFilterChange={setFilter}
          selectedItem={selectedItem}
          onSelectItem={(item) => {
            setSelectedItem(item);
            setIsMobileSidebarOpen(false);
          }}
          onAddNew={() => {
            setItemToEdit(null);
            setIsExpenseModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onEditItem={(item) => {
            setItemToEdit(item);
            setIsExpenseModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onDeleteItem={handleDeleteItem}
          onOpenUploadModal={() => {
            setIsUploadModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Dashboard Area (Map and/or Charts) */}
        <main id="main-content-canvas" className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile View Toggle Bar */}
          <div className="sm:hidden bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-around text-xs">
            <button
              onClick={() => setActiveView('map')}
              className={`flex-1 py-1 text-center font-medium rounded-md ${
                activeView === 'map' || activeView === 'split' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
              }`}
            >
              🗺️ แผนที่ GIS
            </button>
            <button
              onClick={() => setActiveView('charts')}
              className={`flex-1 py-1 text-center font-medium rounded-md ${
                activeView === 'charts' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
              }`}
            >
              📊 กราฟ & งบประมาณ
            </button>
          </div>

          {/* Dynamic View Panels */}
          {activeView === 'map' && (
            <div className="w-full h-full relative">
              <MapComponent
                items={items}
                selectedItem={selectedItem}
                onSelectItem={setSelectedItem}
                onEditItem={(item) => {
                  setItemToEdit(item);
                  setIsExpenseModalOpen(true);
                }}
                onDeleteItem={handleDeleteItem}
                onMapClickCoordinates={handleMapClickCoordinates}
                isPickingLocation={isPickingLocation}
                uploadedGeoJson={uploadedGeoJson}
              />
            </div>
          )}

          {activeView === 'charts' && (
            <div className="w-full h-full overflow-y-auto p-4 lg:p-6 bg-slate-50">
              <div className="max-w-5xl mx-auto">
                <ChartsView
                  items={items}
                  budgetConfig={budgetConfig}
                  onUpdateBudget={(b) => setBudgetConfig({ ...budgetConfig, monthlyBudget: b })}
                />
              </div>
            </div>
          )}

          {activeView === 'split' && (
            <div className="w-full h-full flex flex-col overflow-hidden">
              {/* Top Map Section (55% height) */}
              <div className="h-[55%] relative border-b border-slate-200">
                <MapComponent
                  items={items}
                  selectedItem={selectedItem}
                  onSelectItem={setSelectedItem}
                  onEditItem={(item) => {
                    setItemToEdit(item);
                    setIsExpenseModalOpen(true);
                  }}
                  onDeleteItem={handleDeleteItem}
                  onMapClickCoordinates={handleMapClickCoordinates}
                  isPickingLocation={isPickingLocation}
                  uploadedGeoJson={uploadedGeoJson}
                />
              </div>

              {/* Bottom Analytics & Budget Section (45% height, scrollable) */}
              <div className="h-[45%] overflow-y-auto p-3 sm:p-4 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                  <ChartsView
                    items={items}
                    budgetConfig={budgetConfig}
                    onUpdateBudget={(b) => setBudgetConfig({ ...budgetConfig, monthlyBudget: b })}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveExpense}
        editItem={itemToEdit}
        clickedCoords={clickedCoords}
        onStartPickOnMap={() => {
          setIsPickingLocation(true);
        }}
      />

      {/* GeoJSON & CSV Upload Modal */}
      <GeoJsonUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onApplyGeoJson={(data) => {
          setUploadedGeoJson(data);
          setActiveView('split');
        }}
        onImportExpenses={handleImportExpenses}
      />

      {/* Confirmation Dialog (Mandatory for destructive actions) */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        details={confirmDialog.details}
        confirmLabel={confirmDialog.confirmLabel}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
