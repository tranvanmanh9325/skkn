"use client";

import Image from "next/image";

import { useState } from "react";
import {
  Home,
  FolderOpen,
  BarChart2,
  Users,
  BookOpen,
  Settings,
  UserCircle,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  icon: React.ReactNode;
  hasChevron?: boolean;
  active?: boolean;
}

// ---------------------------------------------------------------------------
// Static nav config
// ---------------------------------------------------------------------------
const NAV_ITEMS: NavItem[] = [
  { label: "Trang chủ", icon: <Home size={16} />, active: true },
  { label: "Quản lý hồ sơ", icon: <FolderOpen size={16} /> },
  { label: "Báo cáo", icon: <BarChart2 size={16} /> },
  { label: "Quản lý Người CHĐ", icon: <Users size={16} /> },
  { label: "Quản lý danh mục", icon: <BookOpen size={16} />, hasChevron: true },
  { label: "Quản lý hệ thống", icon: <Settings size={16} />, hasChevron: true },
  { label: "Tài khoản", icon: <UserCircle size={16} /> },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Header() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-14 bg-[#a61c1c] flex items-center justify-between px-4 flex-shrink-0 z-30">
      {/* Left: Logo + title block */}
      <div className="flex items-center gap-3">
        <Image
          src="/logo.webp"
          alt="Logo Công an nhân dân Việt Nam"
          width={40}
          height={40}
          priority
          className="object-contain flex-shrink-0"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-white font-bold uppercase text-[13px] tracking-wide">
            PHẦN MỀM SỐ HÓA HỒ SƠ THI HÀNH ÁN
          </span>
          <span className="text-blue-200 uppercase text-[10px] tracking-widest font-light">
            CÔNG AN NHÂN DÂN VIỆT NAM
          </span>
        </div>
      </div>

      {/* Right: Bell + Profile */}
      <div className="flex items-center gap-4">
        <button
          aria-label="Thông báo"
          className="text-white hover:text-yellow-300 transition-colors"
        >
          <Bell size={20} />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            id="profile-dropdown-trigger"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-1.5 text-white hover:text-yellow-300 transition-colors"
          >
            <UserCircle size={20} />
            <span className="text-sm font-medium">Admin</span>
            <ChevronDown size={14} className={`transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden z-50">
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <UserCircle size={15} className="text-gray-400" />
                Thông tin tài khoản
              </button>
              <div className="border-t border-gray-100" />
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={15} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="w-52 bg-[#edda8b] flex-shrink-0 border-r border-[#d4c070] overflow-y-auto">
      <nav className="py-2">
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarItem({ item }: { item: NavItem }) {
  return (
    <button
      className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
        item.active
          ? "bg-[#a61c1c] text-white"
          : "text-gray-700 hover:bg-amber-100"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span className={item.active ? "text-white" : "text-gray-500"}>
          {item.icon}
        </span>
        {item.label}
      </span>
      {item.hasChevron && (
        <ChevronDown
          size={13}
          className={item.active ? "text-white" : "text-gray-400"}
        />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-gray-100 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
