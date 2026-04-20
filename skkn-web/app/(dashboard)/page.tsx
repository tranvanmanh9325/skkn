"use client";

import { RefreshCw, ChevronRight, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UnitRow {
  name: string;
  detail: string;
}

interface PieSlice {
  name: string;
  value: number;
  color: string;
  percent: string;
}

interface BarEntry {
  month: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const UNITS: UnitRow[] = [
  { name: "Tất cả", detail: "(12 đơn vị - 55 HS)" },
  { name: "UBND Phường", detail: "(4 đơn vị - 20 HS)" },
  { name: "Trại giam Long Hòa", detail: "(2 đơn vị - 15 HS)" },
  { name: "Cơ quan Thi hành án", detail: "(3 đơn vị - 12 HS)" },
  { name: "Phòng Cảnh sát", detail: "(3 đơn vị - 8 HS)" },
];

const PIE_DATA: PieSlice[] = [
  { name: "Chưa phân loại", value: 20, color: "#f59e0b", percent: "36%" },
  { name: "Hồ sơ cá nhân", value: 15, color: "#3b82f6", percent: "27%" },
  { name: "Hồ sơ tổ chức", value: 12, color: "#10b981", percent: "22%" },
  { name: "Đã lưu trữ", value: 8, color: "#8b5cf6", percent: "15%" },
];

const BAR_DATA: BarEntry[] = [
  { month: "T1", count: 4 },
  { month: "T2", count: 7 },
  { month: "T3", count: 12 },
  { month: "T4", count: 9 },
  { month: "T5", count: 15 },
  { month: "T6", count: 6 },
  { month: "T7", count: 11 },
  { month: "T8", count: 8 },
  { month: "T9", count: 13 },
  { month: "T10", count: 5 },
  { month: "T11", count: 10 },
  { month: "T12", count: 14 },
];

const DATE_RANGE = "29/03/2026 - 18/04/2026";

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-sm border border-gray-200 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function DatePickerButton() {
  return (
    <button className="flex items-center gap-1.5 border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
      <Calendar size={12} className="text-gray-400" />
      {DATE_RANGE}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 1. Top stat card
// ---------------------------------------------------------------------------
function TotalRecordsCard() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Tổng số hồ sơ</span>
        <button
          aria-label="Tải lại"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="text-3xl font-bold text-black">55</div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Unit list card
// ---------------------------------------------------------------------------
function UnitListCard() {
  return (
    <Card>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-bold text-blue-600">
          Số lượng HS theo đơn vị
        </h2>
      </div>
      <ul>
        {UNITS.map((unit, idx) => (
          <li
            key={unit.name}
            className={`flex items-center justify-between px-4 py-2 ${
              idx < UNITS.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm text-gray-800">
              <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
              {unit.name}
            </span>
            <span className="text-xs text-gray-500">{unit.detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Pie chart card
// ---------------------------------------------------------------------------
function PieChartCard() {
  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800">
          Phân loại hồ sơ
        </h2>
        <DatePickerButton />
      </div>

      {/* Body: legend (left) + chart (right) */}
      <div className="flex items-center gap-4">
        {/* Custom legend */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          {PIE_DATA.map((slice) => (
            <div key={slice.name} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: slice.color }}
                />
                <span className="text-xs text-gray-700 leading-tight">
                  {slice.name}
                </span>
              </div>
              <span className="text-xs text-gray-400 pl-[18px]">
                {slice.percent}
              </span>
            </div>
          ))}
        </div>

        {/* Recharts Pie */}
        <div className="flex-1 h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {PIE_DATA.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Bar chart card
// ---------------------------------------------------------------------------
function BarChartCard() {
  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-gray-800">
          Hồ sơ theo tháng
        </h2>
        <DatePickerButton />
      </div>

      {/* Custom legend */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-3 h-3 rounded-sm bg-[#75e2a2] flex-shrink-0" />
        <span className="text-xs text-gray-600">Số lượng hồ sơ</span>
      </div>

      {/* Recharts Bar */}
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={BAR_DATA}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#f0f0f0"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
              }}
            />
            <Bar dataKey="count" fill="#75e2a2" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb / page title */}
      <div>
        <h1 className="text-sm font-semibold text-gray-700">Trang chủ</h1>
        <p className="text-xs text-gray-400">Tổng quan hệ thống</p>
      </div>

      {/* Top stat card */}
      <TotalRecordsCard />

      {/* Middle unit list */}
      <UnitListCard />

      {/* Bottom charts row */}
      <div className="grid grid-cols-2 gap-4">
        <PieChartCard />
        <BarChartCard />
      </div>
    </div>
  );
}
