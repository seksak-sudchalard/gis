import { ExpenseItem, BudgetConfig } from '../types';

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  monthlyBudget: 20000,
  dailyTarget: 1000,
  alertThresholdPercent: 80,
};

export const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    date: '2026-09-10',
    time: '08:30',
    title: 'งบเดินทางท่องเที่ยวตั้งต้น',
    type: 'income',
    category: 'income',
    amount: 25000,
    paymentMethod: 'transfer',
    note: 'โอนเงินเข้าบัญชีท่องเที่ยวสำหรับทริปนี้',
    lat: 13.7469,
    lng: 100.5349,
    locationName: 'สยามสแควร์ กรุงเทพฯ',
    createdAt: '2026-09-10T08:30:00Z',
    updatedAt: '2026-09-10T08:30:00Z',
  },
  {
    id: 'exp-2',
    date: '2026-09-10',
    time: '11:45',
    title: 'ตั๋วรถไฟด่วนพิเศษ CNR',
    type: 'expense',
    category: 'transport',
    amount: 1041,
    paymentMethod: 'qr',
    note: 'สถานีกลางกรุงเทพอภิวัฒน์ ไป เชียงใหม่',
    lat: 13.8037,
    lng: 100.5401,
    locationName: 'สถานีกลางกรุงเทพอภิวัฒน์',
    createdAt: '2026-09-10T11:45:00Z',
    updatedAt: '2026-09-10T11:45:00Z',
  },
  {
    id: 'exp-3',
    date: '2026-09-11',
    time: '08:15',
    title: 'ข้าวซอยเนื้อน่องลาย & น้ำสมุนไพร',
    type: 'expense',
    category: 'food',
    amount: 140,
    paymentMethod: 'qr',
    note: 'ข้าวซอยแม่สาย ชามใหญ่พิเศษ',
    lat: 18.8028,
    lng: 98.9715,
    locationName: 'ร้านข้าวซอยแม่สาย ซอยราชพฤกษ์ เชียงใหม่',
    createdAt: '2026-09-11T08:15:00Z',
    updatedAt: '2026-09-11T08:15:00Z',
  },
  {
    id: 'exp-4',
    date: '2026-09-11',
    time: '13:00',
    title: 'ค่าที่พัก 2 คืน (นิมมาน)',
    type: 'expense',
    category: 'lodging',
    amount: 2400,
    paymentMethod: 'card',
    note: 'ห้อง Deluxe King รวมอาหารเช้า',
    lat: 18.7963,
    lng: 98.9665,
    locationName: 'โรงแรมย่านนิมมานเหมินท์',
    createdAt: '2026-09-11T13:00:00Z',
    updatedAt: '2026-09-11T13:00:00Z',
  },
  {
    id: 'exp-5',
    date: '2026-09-11',
    time: '15:30',
    title: 'บัตรเข้าชมหอศิลปวัฒนธรรมเมือง',
    type: 'expense',
    category: 'activity',
    amount: 90,
    paymentMethod: 'cash',
    note: 'ชมนิทรรศการประวัติศาสตร์ล้านนา',
    lat: 18.7898,
    lng: 98.9875,
    locationName: 'หอศิลปวัฒนธรรมเมืองเชียงใหม่',
    createdAt: '2026-09-11T15:30:00Z',
    updatedAt: '2026-09-11T15:30:00Z',
  },
  {
    id: 'exp-6',
    date: '2026-09-11',
    time: '18:40',
    title: 'ซื้อของฝากและงานคราฟต์',
    type: 'expense',
    category: 'shopping',
    amount: 650,
    paymentMethod: 'qr',
    note: 'กางเกงช้าง สมุดทำมือ และกระเป๋าผ้า',
    lat: 18.7877,
    lng: 98.9931,
    locationName: 'ประตูท่าแพ เชียงใหม่',
    createdAt: '2026-09-11T18:40:00Z',
    updatedAt: '2026-09-11T18:40:00Z',
  },
];

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
};

export const exportToCSV = (items: ExpenseItem[]): void => {
  const headers = ['ID', 'วันที่', 'เวลา', 'รายการ', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน(บาท)', 'วิธีชำระ', 'หมายเหตุ', 'ละติจูด', 'ลองจิจูด', 'สถานที่'];
  const rows = items.map((i) => [
    `"${i.id}"`,
    `"${i.date}"`,
    `"${i.time}"`,
    `"${(i.title || '').replace(/"/g, '""')}"`,
    `"${i.type}"`,
    `"${i.category}"`,
    i.amount,
    `"${i.paymentMethod}"`,
    `"${(i.note || '').replace(/"/g, '""')}"`,
    i.lat,
    i.lng,
    `"${(i.locationName || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `gis_travel_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToJSON = (items: ExpenseItem[]): void => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `gis_travel_expenses_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToGeoJSON = (items: ExpenseItem[]): void => {
  const geojson = {
    type: 'FeatureCollection',
    features: items.map((i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [i.lng, i.lat],
      },
      properties: {
        id: i.id,
        title: i.title,
        amount: i.amount,
        type: i.type,
        category: i.category,
        date: i.date,
        time: i.time,
        paymentMethod: i.paymentMethod,
        note: i.note,
        locationName: i.locationName,
      },
    })),
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojson, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `gis_travel_routes_${new Date().toISOString().slice(0, 10)}.geojson`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
