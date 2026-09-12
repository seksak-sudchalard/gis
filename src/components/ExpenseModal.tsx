import React, { useState, useEffect } from 'react';
import { ExpenseItem, TransactionType, ExpenseCategory, PaymentMethod, CATEGORIES } from '../types';
import { X, MapPin, Navigation, DollarSign, Calendar, Clock, CreditCard, FileText } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ExpenseItem) => void;
  editItem?: ExpenseItem | null;
  clickedCoords?: { lat: number; lng: number } | null;
  onStartPickOnMap?: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  clickedCoords,
  onStartPickOnMap,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr');
  const [note, setNote] = useState('');
  const [lat, setLat] = useState<number>(13.7563);
  const [lng, setLng] = useState<number>(100.5018);
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState('');

  // Pre-fill or reset form
  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setType(editItem.type);
      setCategory(editItem.category);
      setAmount(String(editItem.amount));
      setDate(editItem.date);
      setTime(editItem.time);
      setPaymentMethod(editItem.paymentMethod);
      setNote(editItem.note || '');
      setLat(editItem.lat);
      setLng(editItem.lng);
      setLocationName(editItem.locationName || '');
    } else {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5);

      setTitle('');
      setType('expense');
      setCategory('food');
      setAmount('');
      setDate(todayStr);
      setTime(timeStr);
      setPaymentMethod('qr');
      setNote('');
      if (clickedCoords) {
        setLat(clickedCoords.lat);
        setLng(clickedCoords.lng);
      } else {
        setLat(13.7563);
        setLng(100.5018);
      }
      setLocationName('');
    }
    setError('');
  }, [editItem, isOpen]);

  // Update coords if clicked on map
  useEffect(() => {
    if (clickedCoords && isOpen) {
      setLat(clickedCoords.lat);
      setLng(clickedCoords.lng);
    }
  }, [clickedCoords, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณาระบุชื่อรายการ');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }

    const item: ExpenseItem = {
      id: editItem ? editItem.id : `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      type,
      category: type === 'income' ? 'income' : category,
      amount: numAmount,
      date: date || new Date().toISOString().slice(0, 10),
      time: time || '12:00',
      paymentMethod,
      note: note.trim(),
      lat: Number(lat),
      lng: Number(lng),
      locationName: locationName.trim() || undefined,
      createdAt: editItem ? editItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(item);
    onClose();
  };

  const handleGetCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
      },
      (err) => {
        console.warn(err);
        alert('ไม่สามารถดึงตำแหน่ง GPS ได้');
      }
    );
  };

  return (
    <div
      id="expense-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div
        id="expense-modal-container"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 id="expense-modal-title" className="text-base font-semibold text-slate-900">
              {editItem ? 'แก้ไขรายการท่องเที่ยว' : 'บันทึกรายการท่องเที่ยวใหม่'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">ระบุค่าใช้จ่ายและพิกัดแผนที่ GIS</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'income') setCategory('food');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💸 รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('income');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💰 รายรับ / เติมงบ (Income)
            </button>
          </div>

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อรายการ <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-expense-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ข้าวซอย, ตั๋วรถไฟ, โรงแรม"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                จำนวนเงิน (บาท) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-expense-amount"
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono font-semibold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">฿</span>
              </div>
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {type === 'expense' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมวดหมู่</label>
                <select
                  id="select-expense-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="food">🍜 อาหารและเครื่องดื่ม</option>
                  <option value="transport">🚆 เดินทาง / ยานพาหนะ</option>
                  <option value="lodging">🏨 ที่พัก / โรงแรม</option>
                  <option value="activity">🎟️ เที่ยว / บัตรเข้าชม</option>
                  <option value="shopping">🛍️ ช้อปปิ้ง / ซื้อของ</option>
                  <option value="emergency">🚨 ฉุกเฉิน / พยาบาล</option>
                  <option value="other">🏷️ อื่นๆ</option>
                </select>
              </div>
            )}

            <div className={type === 'income' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-medium text-slate-700 mb-1">วิธีชำระเงิน</label>
              <select
                id="select-expense-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="qr">📱 สแกน QR / PromptPay</option>
                <option value="cash">💵 เงินสด (Cash)</option>
                <option value="card">💳 บัตรเครดิต/เดบิต</option>
                <option value="transfer">🏦 โอนเงินผ่านธนาคาร</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">วันที่</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">เวลา</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* GIS Location coordinates */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                ตำแหน่งพิกัด GIS บนแผนที่
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleGetCurrentGPS}
                  className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors flex items-center gap-1 shadow-2xs"
                  title="ใช้พิกัดปัจจุบันจาก GPS"
                >
                  <Navigation className="w-3 h-3 text-blue-600" />
                  <span>GPS ปัจจุบัน</span>
                </button>
                {onStartPickOnMap && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartPickOnMap();
                    }}
                    className="px-2 py-1 text-[11px] bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded text-indigo-700 transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <span>จิ้มเลือกบนแผนที่</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Latitude (ละติจูด)</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Longitude (ลองจิจูด)</label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="ชื่อสถานที่ หรือ จุดสังเกต (เช่น ประตูท่าแพ, ถนนนิมมาน)"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">บันทึกเพิ่มเติม / โน้ต</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดการเดินทาง รายการของที่ซื้อ หรือคำแนะนำ..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              id="submit-expense-btn"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              {editItem ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
