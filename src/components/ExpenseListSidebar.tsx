import React, { useState } from 'react';
import {
  ExpenseItem,
  FilterState,
  CATEGORIES,
  ExpenseCategory,
  TransactionType,
  PaymentMethod,
} from '../types';
import { formatCurrency, exportToCSV, exportToJSON, exportToGeoJSON } from '../data/sampleData';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  X,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface ExpenseListSidebarProps {
  items: ExpenseItem[];
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  selectedItem: ExpenseItem | null;
  onSelectItem: (item: ExpenseItem) => void;
  onAddNew: () => void;
  onEditItem: (item: ExpenseItem) => void;
  onDeleteItem: (item: ExpenseItem) => void;
  onOpenUploadModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const ExpenseListSidebar: React.FC<ExpenseListSidebarProps> = ({
  items,
  filter,
  onFilterChange,
  selectedItem,
  onSelectItem,
  onAddNew,
  onEditItem,
  onDeleteItem,
  onOpenUploadModal,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchNote = item.note?.toLowerCase().includes(q);
      const matchLoc = item.locationName?.toLowerCase().includes(q);
      if (!matchTitle && !matchNote && !matchLoc) return false;
    }

    // Type
    if (filter.type !== 'all' && item.type !== filter.type) return false;

    // Category
    if (filter.category !== 'all' && item.category !== filter.category) return false;

    // Payment method
    if (filter.paymentMethod !== 'all' && item.paymentMethod !== filter.paymentMethod) return false;

    // Dates
    if (filter.startDate && item.date < filter.startDate) return false;
    if (filter.endDate && item.date > filter.endDate) return false;

    return true;
  });

  const resetFilters = () => {
    onFilterChange({
      search: '',
      type: 'all',
      category: 'all',
      startDate: '',
      endDate: '',
      paymentMethod: 'all',
    });
  };

  const hasActiveFilters =
    filter.search ||
    filter.type !== 'all' ||
    filter.category !== 'all' ||
    filter.startDate ||
    filter.endDate ||
    filter.paymentMethod !== 'all';

  return (
    <aside
      id="expense-sidebar-container"
      className={`fixed lg:static inset-y-0 left-0 z-40 w-full sm:w-96 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out shadow-lg lg:shadow-none ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">รายการบันทึกทั้งหมด</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
            {filteredItems.length} / {items.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="sidebar-add-new-btn"
            onClick={onAddNew}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มรายการ</span>
          </button>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="p-3 border-b border-slate-100 bg-white space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              id="sidebar-search-input"
              type="text"
              value={filter.search}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
              placeholder="ค้นหาชื่อ, สถานที่, หมายเหตุ..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
            {filter.search && (
              <button
                onClick={() => onFilterChange({ ...filter, search: '' })}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            id="sidebar-toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="ตัวกรองขั้นสูง"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Type Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => onFilterChange({ ...filter, type: 'all' })}
            className={`flex-1 py-1 text-center font-medium rounded-md transition-all ${
              filter.type === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => onFilterChange({ ...filter, type: 'expense' })}
            className={`flex-1 py-1 text-center font-medium rounded-md transition-all ${
              filter.type === 'expense'
                ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            รายจ่าย
          </button>
          <button
            onClick={() => onFilterChange({ ...filter, type: 'income' })}
            className={`flex-1 py-1 text-center font-medium rounded-md transition-all ${
              filter.type === 'income'
                ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            รายรับ
          </button>
        </div>

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">หมวดหมู่</label>
              <select
                value={filter.category}
                onChange={(e) =>
                  onFilterChange({ ...filter, category: e.target.value as any })
                }
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="all">ทุกหมวดหมู่</option>
                <option value="food">🍜 อาหารและเครื่องดื่ม</option>
                <option value="transport">🚆 เดินทาง / ยานพาหนะ</option>
                <option value="lodging">🏨 ที่พัก / โรงแรม</option>
                <option value="activity">🎟️ เที่ยว / บัตรเข้าชม</option>
                <option value="shopping">🛍️ ช้อปปิ้ง / ซื้อของ</option>
                <option value="emergency">🚨 ฉุกเฉิน / พยาบาล</option>
                <option value="other">🏷️ อื่นๆ</option>
                <option value="income">💰 รายรับ</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">วิธีชำระเงิน</label>
              <select
                value={filter.paymentMethod}
                onChange={(e) =>
                  onFilterChange({ ...filter, paymentMethod: e.target.value as any })
                }
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="all">ทุกวิธีชำระ</option>
                <option value="qr">📱 สแกน QR / PromptPay</option>
                <option value="cash">💵 เงินสด (Cash)</option>
                <option value="card">💳 บัตรเครดิต/เดบิต</option>
                <option value="transfer">🏦 โอนเงินผ่านธนาคาร</option>
              </select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => onFilterChange({ ...filter, startDate: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">ถึงวันที่</label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => onFilterChange({ ...filter, endDate: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px]"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline block pt-1"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>

      {/* Items List */}
      <div id="sidebar-items-scroll" className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const catMeta = CATEGORIES[item.category] || CATEGORIES.other;
            const isIncome = item.type === 'income';
            const isSelected = selectedItem?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`p-3 transition-colors cursor-pointer group flex items-start gap-2.5 ${
                  isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                }`}
              >
                {/* Category Indicator Badge */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs"
                  style={{
                    backgroundColor: isIncome ? '#dcfce7' : catMeta.bgColor,
                    color: isIncome ? '#16a34a' : catMeta.color,
                    border: `1px solid ${isIncome ? '#86efac' : catMeta.borderColor}`,
                  }}
                >
                  {isIncome ? '💰' : catMeta.id === 'food' ? '🍜' : catMeta.id === 'transport' ? '🚆' : catMeta.id === 'lodging' ? '🏨' : catMeta.id === 'activity' ? '🎟️' : catMeta.id === 'shopping' ? '🛍️' : '🏷️'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    <span
                      className={`text-xs font-bold font-mono shrink-0 ${
                        isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{item.date}</span>
                    <span>&bull;</span>
                    <span className="uppercase text-[10px] bg-slate-100 px-1 py-0.2 rounded font-mono">
                      {item.paymentMethod}
                    </span>
                  </div>

                  {item.locationName && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.locationName}</span>
                    </p>
                  )}
                </div>

                {/* Edit & Delete Action Hover Buttons */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditItem(item);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                    title="แก้ไขรายการ"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="ลบรายการ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions: Upload & Export Data */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
        <div className="flex items-center gap-2">
          <button
            id="btn-open-upload-modal"
            onClick={onOpenUploadModal}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            title="อัปโหลดไฟล์ GeoJSON หรือ CSV"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>อัปโหลด GeoJSON/CSV</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium px-1">ส่งออก:</span>
          <button
            id="btn-export-csv"
            onClick={() => exportToCSV(items)}
            className="flex-1 py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-mono font-medium transition-colors"
          >
            CSV
          </button>
          <button
            id="btn-export-json"
            onClick={() => exportToJSON(items)}
            className="flex-1 py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-mono font-medium transition-colors"
          >
            JSON
          </button>
          <button
            id="btn-export-geojson"
            onClick={() => exportToGeoJSON(items)}
            className="flex-1 py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-mono font-medium transition-colors"
          >
            GeoJSON
          </button>
        </div>
      </div>
    </aside>
  );
};
