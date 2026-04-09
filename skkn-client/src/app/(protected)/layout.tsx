"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import AuthHydrator from "@/components/auth/AuthHydrator";

// ---------------------------------------------------------------------------
// THA Monogram (Từ trang Login)
// ---------------------------------------------------------------------------
const THAMonogram = ({ className }: { className?: string }) => (
  <svg
    width="28"
    height="19"
    viewBox="0 0 32 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="THA Monogram"
  >
    <line x1="1" y1="3" x2="9" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    <line x1="5" y1="3" x2="5" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    <line x1="11" y1="3" x2="11" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    <line x1="19" y1="3" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    <line x1="11" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    <path d="M21 19 L26 3 L31 19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    <line x1="23" y1="13" x2="29" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    <rect x="15" y="1" width="2" height="2" fill="#2B5CE6" />
  </svg>
);

// ---------------------------------------------------------------------------
// Custom Line-Art Icons (1.2px stroke, neo-geometric)
// ---------------------------------------------------------------------------
const GridIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="11" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="3" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="11" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M2 5 L7 5 L9 8 L18 8 L18 16 L2 16 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    {/* User 1 */}
    <path d="M7 4 A3 3 0 0 1 10 7 A3 3 0 0 1 4 7 A3 3 0 0 1 7 4" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2 16 C2 12 5 11 7 11 C9 11 12 12 12 16" stroke="currentColor" strokeWidth="1.2" />
    <line x1="7" y1="11" x2="7" y2="14" stroke="currentColor" strokeWidth="1.2" />
    {/* User 2 */}
    <path d="M14 6 A2.5 2.5 0 0 1 16.5 8.5 A2.5 2.5 0 0 1 11.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M12 12.5 C13 12 15.5 12 18 14.5 L18 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M10 2 L16.928 6 L16.928 14 L10 18 L3.072 14 L3.072 6 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="10" cy="10" r="1" fill="currentColor" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M8 4 L4 4 L4 16 L8 16" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <line x1="9" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M14 7 L17 10 L14 13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Shell Layout
// ---------------------------------------------------------------------------
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    { name: "Bảng điều khiển", path: "/dashboard", icon: GridIcon },
    { name: "Hồ sơ thi hành án", path: "/dossiers", icon: FolderIcon },
    { name: "Người dùng", path: "/users", icon: UsersIcon },
    { name: "Cấu hình hệ thống", path: "/settings", icon: SettingsIcon },
  ];

  return (
    <AuthHydrator>
      <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">
      {/* ── Left Sidebar: Deep Navy #0D2B5E ── */}
      <aside className="w-[260px] bg-[#0D2B5E] flex flex-col border-r border-[#0A1F44] shrink-0 text-[#9BA8B8]">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-[#1A3A6E] shrink-0 bg-[#0A1F44]">
          <div className="text-white mr-3">
            <THAMonogram />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.1em] text-white uppercase leading-none">
              Quản lý hồ sơ
            </span>
            <span className="text-[9px] font-medium tracking-[0.1em] text-[#9BA8B8] uppercase mt-1">
              Thi hành án
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#4A5E81] uppercase mb-4 px-2">
            Điều hướng
          </div>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={[
                  "flex items-center px-3 py-2.5 transition-colors duration-150 rounded-none",
                  isActive
                    ? "bg-[#1A3A6E] text-white border-l-2 border-[#2B5CE6]"
                    : "text-[#9BA8B8] hover:bg-[#15315E] hover:text-[#D8DEE9] border-l-2 border-transparent",
                ].join(" ")}
              >
                <item.icon className="w-4 h-4 mr-3 shrink-0" />
                <span className="text-[12.5px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1A3A6E] text-[10px] text-[#4A5E81] text-center">
          v1.0.0-beta
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Header ── */}
        <header className="h-16 bg-white border-b border-[#CBD5E0] flex items-center justify-between px-8 shrink-0">
          {/* Breadcrumb / Title */}
          <div className="flex items-center text-[12.5px] font-medium text-[#4A5568]">
            <span className="text-[#A0AEC0]">Hệ thống quản trị</span>
            <span className="mx-2 text-[#CBD5E0]">/</span>
            <span className="text-[#0D2B5E] font-semibold">
              {navItems.find((i) => pathname.startsWith(i.path))?.name || "Chi tiết"}
            </span>
          </div>

          {/* Right Header (User Info + Logout) */}
          <div className="flex items-center space-x-6">
            {/* User Info */}
            <div className="flex flex-col items-end">
              <span className="text-[12px] font-semibold text-[#0A1F44]">
                {user?.email || "Đang tải..."}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#6B7A90] font-bold mt-0.5">
                {user?.role || "GUEST"}
              </span>
            </div>

            {/* Logout Button (Sharp, no border radius) */}
            <button
              onClick={handleLogout}
              className="group flex items-center h-9 px-4 bg-white border border-[#CBD5E0] hover:border-[#E53E3E] hover:bg-[#FFF5F5] transition-colors rounded-none"
              title="Đăng xuất"
            >
              <LogoutIcon className="w-4 h-4 text-[#A0AEC0] group-hover:text-[#E53E3E] mr-2" />
              <span className="text-[11.5px] font-bold uppercase tracking-wide text-[#4A5568] group-hover:text-[#C53030]">
                Đăng xuất
              </span>
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
    </AuthHydrator>
  );
}
