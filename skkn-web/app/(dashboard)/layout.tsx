"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  FileText,
  Building2,
  Briefcase,
  MapPin,
  List,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChildNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  // Leaf nodes have href; parent nodes have children
  href?: string;
  children?: ChildNavItem[];
}

// ---------------------------------------------------------------------------
// Static nav config
// ---------------------------------------------------------------------------
const NAV_ITEMS: NavItem[] = [
  {
    label: "Trang chủ",
    href: "/",
    icon: <Home size={16} />,
  },
  {
    label: "Quản lý hồ sơ",
    href: "/quan-ly-ho-so",
    icon: <FolderOpen size={16} />,
  },
  {
    label: "Báo cáo",
    href: "/bao-cao",
    icon: <BarChart2 size={16} />,
  },
  {
    label: "Quản lý Người CHA",
    href: "/quan-ly-nguoi-cha",
    icon: <Users size={16} />,
  },
  {
    label: "Quản lý danh mục",
    icon: <BookOpen size={16} />,
    children: [
      { label: "Loại nơi THA",  href: "/quan-ly-danh-muc/loai-noi-tha",  icon: <Building2 size={14} /> },
      { label: "Nơi THA",       href: "/quan-ly-danh-muc/noi-tha",        icon: <MapPin size={14} /> },
      { label: "Đội THA",       href: "/quan-ly-danh-muc/doi-tha",        icon: <Briefcase size={14} /> },
      { label: "Loại hồ sơ",   href: "/quan-ly-danh-muc/loai-ho-so",    icon: <FileText size={14} /> },
      { label: "Loại Đơn vị",  href: "/quan-ly-danh-muc/loai-don-vi",   icon: <List size={14} /> },
      { label: "Đơn vị",        href: "/quan-ly-danh-muc/don-vi",         icon: <ShieldCheck size={14} /> },
    ],
  },
  {
    label: "Quản lý hệ thống",
    icon: <Settings size={16} />,
    children: [
      { label: "Chức vụ",                   href: "/quan-ly-he-thong/chuc-vu",                    icon: <Briefcase size={14} /> },
      { label: "Tỉnh/Thành phố",            href: "/quan-ly-he-thong/tinh-thanh-pho",             icon: <MapPin size={14} /> },
      { label: "Quận/Huyện",                href: "/quan-ly-he-thong/quan-huyen",                 icon: <MapPin size={14} /> },
      { label: "Phường/Xã",                 href: "/quan-ly-he-thong/phuong-xa",                  icon: <MapPin size={14} /> },
      { label: "Quản lý người dùng",        href: "/quan-ly-he-thong/nguoi-dung",                 icon: <UserCog size={14} /> },
      { label: "Quản lý nhóm người dùng",   href: "/quan-ly-he-thong/nhom-nguoi-dung",            icon: <UsersRound size={14} /> },
    ],
  },
  {
    label: "Tài khoản",
    href: "/tai-khoan",
    icon: <UserCircle size={16} />,
  },
];

// ---------------------------------------------------------------------------
// Header sub-component (unchanged from before)
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
            <ChevronDown size={14} className={`transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
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

// ---------------------------------------------------------------------------
// Sidebar sub-component
// ---------------------------------------------------------------------------
function Sidebar() {
  const pathname = usePathname();

  // Derive the set of parent labels whose children contain the current path.
  // Computed once so we can use it for initial state.
  const initialExpanded = NAV_ITEMS.reduce<Record<string, boolean>>(
    (acc, item) => {
      if (item.children?.some((child) => pathname.startsWith(child.href))) {
        acc[item.label] = true;
      }
      return acc;
    },
    {}
  );

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(initialExpanded);

  // Re-expand the correct parent whenever navigation changes (e.g. browser back/forward).
  useEffect(() => {
    setExpandedMenus((prev) => {
      const next = { ...prev };
      NAV_ITEMS.forEach((item) => {
        if (item.children?.some((child) => pathname.startsWith(child.href))) {
          next[item.label] = true;
        }
      });
      return next;
    });
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="w-56 bg-[#fdf4cc] flex-shrink-0 border-r border-[#e0d090] overflow-y-auto">
      <nav className="py-2">
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            // ── Parent (accordion) ──────────────────────────────────────────
            const isOpen = !!expandedMenus[item.label];
            const hasActiveChild = item.children.some((child) =>
              pathname.startsWith(child.href)
            );

            return (
              <div key={item.label} className="mx-3 mb-0.5">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-colors ${
                    hasActiveChild
                      ? "bg-[#a61c1c] text-white font-semibold"
                      : "text-gray-800 hover:bg-black/5"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={hasActiveChild ? "text-white" : "text-gray-500"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ease-in-out flex-shrink-0 ${
                      hasActiveChild ? "text-white" : "text-gray-400"
                    } ${isOpen ? "rotate-180" : "rotate-0"}`}
                  />
                </button>

                {/* Animated child container — negative mx-3 then re-apply so children can use their own mx-3 */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {item.children.map((child) => {
                    const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        prefetch={false}
                        className={`flex items-center gap-2.5 pl-10 pr-3 py-2 mt-0.5 text-[13px] rounded-md transition-colors ${
                          isActive
                            ? "bg-[#a61c1c] text-white font-medium"
                            : "text-gray-800 hover:bg-black/5"
                        }`}
                      >
                        <span className={isActive ? "text-white" : "text-gray-400"}>
                          {child.icon}
                        </span>
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          // ── Leaf node ───────────────────────────────────────────────────────
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href!}
              prefetch={false}
              className={`mx-3 mb-0.5 flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-[#a61c1c] text-white"
                  : "text-gray-800 hover:bg-black/5"
              }`}
            >
              <span className={isActive ? "text-white" : "text-gray-500"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
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
