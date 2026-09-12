import { ExpenseItem, TransactionType, ExpenseCategory, PaymentMethod } from '../types';

export const SPREADSHEET_ID = '1dsyMuhOZ6LeEByJmH7Py6AIpGiVW66QN_Zs3YJxpmlo';
export const SHEET_NAME = 'sheet1';

export const SHEET_HEADERS = [
  'ID',
  'Date',
  'Time',
  'Title',
  'Type',
  'Category',
  'Amount',
  'PaymentMethod',
  'Note',
  'Latitude',
  'Longitude',
  'LocationName',
  'UpdatedAt',
];

export const itemToRow = (item: ExpenseItem): (string | number)[] => [
  item.id,
  item.date,
  item.time,
  item.title,
  item.type,
  item.category,
  item.amount,
  item.paymentMethod,
  item.note || '',
  item.lat,
  item.lng,
  item.locationName || '',
  item.updatedAt || new Date().toISOString(),
];

export const rowToItem = (row: any[]): ExpenseItem | null => {
  if (!row || row.length < 7) return null;
  const id = String(row[0] || `item-${Date.now()}`);
  const date = String(row[1] || new Date().toISOString().split('T')[0]);
  const time = String(row[2] || '12:00');
  const title = String(row[3] || 'รายการ');
  const type = (String(row[4]).toLowerCase() === 'income' ? 'income' : 'expense') as TransactionType;
  const category = (String(row[5]).toLowerCase() || (type === 'income' ? 'income' : 'other')) as ExpenseCategory;
  const amount = parseFloat(String(row[6]).replace(/[^0-9.-]/g, '')) || 0;
  const paymentMethod = (String(row[7]).toLowerCase() || 'cash') as PaymentMethod;
  const note = String(row[8] || '');
  const lat = parseFloat(String(row[9])) || 13.7563; // Default Bangkok
  const lng = parseFloat(String(row[10])) || 100.5018;
  const locationName = String(row[11] || '');
  const updatedAt = String(row[12] || new Date().toISOString());

  return {
    id,
    date,
    time,
    title,
    type,
    category,
    amount,
    paymentMethod,
    note,
    lat,
    lng,
    locationName,
    createdAt: date + 'T' + time + ':00Z',
    updatedAt,
  };
};

/**
 * Fetch all expense records from Google Sheet
 */
export const fetchExpensesFromGoogleSheet = async (
  accessToken: string,
  spreadsheetId = SPREADSHEET_ID,
  sheetName = SHEET_NAME
): Promise<ExpenseItem[]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetName
  )}!A1:M1000`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(`Google Sheets API Error: ${message}`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length <= 1) {
    // Empty or header only
    return [];
  }

  // Row 0 is header, parse from Row 1
  const items: ExpenseItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const parsed = rowToItem(rows[i]);
    if (parsed && parsed.title) {
      items.push(parsed);
    }
  }

  return items;
};

/**
 * Overwrite full sheet with items (for update/delete/create sync)
 */
export const syncAllExpensesToGoogleSheet = async (
  accessToken: string,
  items: ExpenseItem[],
  spreadsheetId = SPREADSHEET_ID,
  sheetName = SHEET_NAME
): Promise<void> => {
  // 1. Clear existing range A1:M1000
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetName
  )}!A1:M1000:clear`;

  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }).catch((e) => console.warn('Could not clear sheet:', e));

  // 2. Prepare all values: Header + rows
  const allRows: (string | number)[][] = [
    SHEET_HEADERS,
    ...items.map(itemToRow),
  ];

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetName
  )}!A1?valueInputOption=USER_ENTERED`;

  const res = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: 'ROWS',
      values: allRows,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(`บันทึกลง Google Sheet ล้มเหลว: ${message}`);
  }
};
