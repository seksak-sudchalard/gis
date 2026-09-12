import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle, X, Layers } from 'lucide-react';
import { ExpenseItem } from '../types';

interface GeoJsonUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeoJson: (geoJsonData: any) => void;
  onImportExpenses: (items: ExpenseItem[]) => void;
}

export const GeoJsonUploadModal: React.FC<GeoJsonUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyGeoJson,
  onImportExpenses,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [fileType, setFileType] = useState<'geojson' | 'json' | 'csv' | null>(null);
  const [itemCount, setItemCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setError(null);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();

    if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const json = JSON.parse(content);

          if (json.type === 'FeatureCollection' || json.features) {
            setFileType('geojson');
            setParsedData(json);
            setItemCount(json.features?.length || 0);
          } else if (Array.isArray(json)) {
            setFileType('json');
            setParsedData(json);
            setItemCount(json.length);
          } else {
            setFileType('geojson');
            setParsedData(json);
            setItemCount(1);
          }
        } catch (err: any) {
          setError('ไฟล์ JSON หรือ GeoJSON มีรูปแบบไม่ถูกต้อง: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length <= 1) {
            setError('ไฟล์ CSV ไม่มีแถวข้อมูล');
            return;
          }

          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const items: ExpenseItem[] = [];

          for (let i = 1; i < lines.length; i++) {
            // Simple CSV row parser handling quotes
            const row = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const cleanRow = row.map((c) => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

            if (cleanRow.length >= 3) {
              const lat = parseFloat(cleanRow[9]) || 13.7563;
              const lng = parseFloat(cleanRow[10]) || 100.5018;
              items.push({
                id: cleanRow[0] || `csv-${Date.now()}-${i}`,
                date: cleanRow[1] || new Date().toISOString().slice(0, 10),
                time: cleanRow[2] || '12:00',
                title: cleanRow[3] || 'รายการ',
                type: cleanRow[4] === 'income' ? 'income' : 'expense',
                category: (cleanRow[5] as any) || 'other',
                amount: parseFloat(cleanRow[6]) || 0,
                paymentMethod: (cleanRow[7] as any) || 'cash',
                note: cleanRow[8] || '',
                lat,
                lng,
                locationName: cleanRow[11] || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }

          setFileType('csv');
          setParsedData(items);
          setItemCount(items.length);
        } catch (err: any) {
          setError('ประมวลผลไฟล์ CSV ผิดพลาด: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      setError('รองรับเฉพาะไฟล์ .geojson, .json หรือ .csv');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (!parsedData) return;

    if (fileType === 'geojson') {
      onApplyGeoJson(parsedData);
      // If features have amounts and titles, also convert to expense items
      if (parsedData.features && Array.isArray(parsedData.features)) {
        const convertibleItems: ExpenseItem[] = [];
        parsedData.features.forEach((f: any, idx: number) => {
          if (f.geometry && f.geometry.type === 'Point' && f.geometry.coordinates) {
            const [lng, lat] = f.geometry.coordinates;
            const props = f.properties || {};
            if (props.title || props.name || props.amount) {
              convertibleItems.push({
                id: props.id || `geo-${Date.now()}-${idx}`,
                date: props.date || new Date().toISOString().slice(0, 10),
                time: props.time || '12:00',
                title: props.title || props.name || 'พิกัด GIS',
                type: props.type === 'income' ? 'income' : 'expense',
                category: props.category || 'activity',
                amount: parseFloat(props.amount) || 0,
                paymentMethod: props.paymentMethod || 'cash',
                note: props.note || props.description || '',
                lat,
                lng,
                locationName: props.locationName || props.address || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        });
        if (convertibleItems.length > 0) {
          onImportExpenses(convertibleItems);
        }
      }
    } else if (fileType === 'csv' || fileType === 'json') {
      onImportExpenses(parsedData);
    }

    onClose();
  };

  return (
    <div
      id="upload-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="upload-modal-container"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 id="upload-modal-title" className="text-base font-semibold text-slate-900">
                อัปโหลดไฟล์ข้อมูล GIS / แผนที่
              </h3>
              <p className="text-xs text-slate-500">รองรับ GeoJSON (.geojson), JSON, และ CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drag and Drop Zone */}
          <div
            id="file-drop-zone"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json,.csv,application/geo+json,application/json,text/csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              ลากไฟล์มาวางที่นี่ หรือ <span className="text-indigo-600 underline">คลิกเพื่อเลือกไฟล์</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">GeoJSON, JSON พิกัดท่องเที่ยว, หรือ CSV รายรับรายจ่าย</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {fileName && !error && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{fileName}</p>
                  <p className="text-[11px] text-slate-500">
                    {fileSize} &bull; ประเภท: <span className="uppercase font-mono">{fileType}</span> &bull; พบ {itemCount} รายการ
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            id="btn-apply-uploaded-data"
            type="button"
            disabled={!parsedData}
            onClick={handleApply}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>นำเข้าข้อมูลและแสดงบนแผนที่</span>
          </button>
        </div>
      </div>
    </div>
  );
};
