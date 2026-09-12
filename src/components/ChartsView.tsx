import React from 'react';
import { ExpenseItem, BudgetConfig, CATEGORIES, ExpenseCategory } from '../types';
import { formatCurrency } from '../data/sampleData';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Calendar, Clock, CheckCircle } from 'lucide-react';

interface ChartsViewProps {
  items: ExpenseItem[];
  budgetConfig: BudgetConfig;
  onUpdateBudget: (budget: number) => void;
}

export const ChartsView: React.FC<ChartsViewProps> = ({
  items,
  budgetConfig,
  onUpdateBudget,
}) => {
  const [isEditingBudget, setIsEditingBudget] = React.useState(false);
  const [newBudgetVal, setNewBudgetVal] = React.useState(String(budgetConfig.monthlyBudget));

  // Compute stats
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Weekly calculation (last 7 days)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekStartStr = oneWeekAgo.toISOString().slice(0, 10);

  let totalIncome = 0;
  let totalExpense = 0;
  let monthlyExpense = 0;
  let dailyExpense = 0;
  let weeklyExpense = 0;

  const categoryTotals: Record<ExpenseCategory, number> = {
    food: 0,
    transport: 0,
    lodging: 0,
    activity: 0,
    shopping: 0,
    emergency: 0,
    other: 0,
    income: 0,
  };

  // Daily map for bar chart (last 7 days or recorded dates)
  const dailyMap: Record<string, { date: string; expense: number; income: number }> = {};

  items.forEach((item) => {
    if (item.type === 'income') {
      totalIncome += item.amount;
    } else {
      totalExpense += item.amount;
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;

      if (item.date.startsWith(currentMonthStr)) {
        monthlyExpense += item.amount;
      }
      if (item.date === todayStr) {
        dailyExpense += item.amount;
      }
      if (item.date >= weekStartStr && item.date <= todayStr) {
        weeklyExpense += item.amount;
      }
    }

    // Daily bucket
    const shortDate = item.date.slice(5); // MM-DD
    if (!dailyMap[shortDate]) {
      dailyMap[shortDate] = { date: shortDate, expense: 0, income: 0 };
    }
    if (item.type === 'income') {
      dailyMap[shortDate].income += item.amount;
    } else {
      dailyMap[shortDate].expense += item.amount;
    }
  });

  const remainingBalance = totalIncome - totalExpense;
  const budgetUsagePercent = budgetConfig.monthlyBudget > 0
    ? Math.round((monthlyExpense / budgetConfig.monthlyBudget) * 100)
    : 0;

  const isNearBudget = budgetUsagePercent >= budgetConfig.alertThresholdPercent;
  const isOverBudget = budgetUsagePercent >= 100;

  // Pie chart data
  const pieData = Object.entries(categoryTotals)
    .filter(([cat, amt]) => cat !== 'income' && amt > 0)
    .map(([cat, amt]) => {
      const meta = CATEGORIES[cat as ExpenseCategory] || CATEGORIES.other;
      return {
        name: meta.label,
        value: amt,
        color: meta.color,
      };
    });

  // Daily bar chart data sorted by date
  const barData = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBudgetVal);
    if (!isNaN(val) && val > 0) {
      onUpdateBudget(val);
      setIsEditingBudget(false);
    }
  };

  return (
    <div id="charts-summary-section" className="space-y-4">
      {/* Monthly Budget Alert Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isOverBudget
            ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
            : isNearBudget
            ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
            : 'bg-indigo-50/70 border-indigo-100 text-indigo-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isOverBudget
                  ? 'bg-rose-100 text-rose-600'
                  : isNearBudget
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              {isOverBudget || isNearBudget ? (
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">
                  {isOverBudget
                    ? '⚠️ แจ้งเตือน: ใช้จ่ายเกินงบประมาณรายเดือนแล้ว!'
                    : isNearBudget
                    ? `⚠️ แจ้งเตือน: ยอดใช้จ่ายใกล้ถึงงบประมาณแล้ว (${budgetUsagePercent}%)`
                    : 'สถานะงบประมาณรายเดือนปกติ'}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-white/80 border border-current/20">
                  {budgetUsagePercent}%
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-80">
                ใช้จ่ายในเดือนนี้: <strong>{formatCurrency(monthlyExpense)}</strong> จากงบที่ตั้งไว้{' '}
                <strong>{formatCurrency(budgetConfig.monthlyBudget)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isEditingBudget ? (
              <form onSubmit={handleSaveBudget} className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={newBudgetVal}
                  onChange={(e) => setNewBudgetVal(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  placeholder="งบประมาณ"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-lg"
                >
                  ยกเลิก
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setNewBudgetVal(String(budgetConfig.monthlyBudget));
                  setIsEditingBudget(true);
                }}
                className="text-xs font-medium underline hover:opacity-80 transition-opacity"
              >
                ตั้งงบใหม่
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-2.5 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-rose-600' : isNearBudget ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Daily & Weekly Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Remaining */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>ยอดคงเหลือสุทธิ</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p
            className={`text-lg font-bold font-mono ${
              remainingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(remainingBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            รับ {formatCurrency(totalIncome)} / จ่าย {formatCurrency(totalExpense)}
          </p>
        </div>

        {/* Daily Spent */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>ใช้จ่ายวันนี้</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-lg font-bold font-mono text-slate-900">
            {formatCurrency(dailyExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            เป้าหมายรายวัน: ~{formatCurrency(budgetConfig.dailyTarget)}
          </p>
        </div>

        {/* Weekly Spent */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>ใช้จ่ายรอบ 7 วัน</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg font-bold font-mono text-slate-900">
            {formatCurrency(weeklyExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            เฉลี่ยวันละ {formatCurrency(weeklyExpense / 7)}
          </p>
        </div>

        {/* Total Expense */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>รวมค่าใช้จ่ายทั้งทริป</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-lg font-bold font-mono text-rose-600">
            {formatCurrency(totalExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ทั้งหมด {items.filter((i) => i.type === 'expense').length} รายการ
          </p>
        </div>
      </div>

      {/* Real-time Charts: Pie + Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Pie Chart */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>📊 สัดส่วนรายจ่ายตามหมวดหมู่ (Pie Chart)</span>
          </h4>
          {pieData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'ยอดเงิน']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              ยังไม่มีข้อมูลค่าใช้จ่าย
            </div>
          )}
        </div>

        {/* Daily Trend Bar Chart */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>📈 ค่าใช้จ่ายรายวัน (Bar Chart)</span>
          </h4>
          {barData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'บาท']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="expense" name="รายจ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              ยังไม่มีข้อมูลบันทึกรายวัน
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
