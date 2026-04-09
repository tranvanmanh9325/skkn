"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/axios";

interface Role {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  email: string;
  fullName: string;
  roles: Role[];
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Assume basic fetching without pagination inputs for simple table first or default
        const res = await apiClient.get('/users');
        if (isMounted) {
          setUsers(res.data.data || []);
        }
      } catch (err) {
        if (isMounted) {
          const error = err as Error & { response?: { data?: { message?: string } } };
          setError(error.response?.data?.message || error.message || "Lỗi tải dữ liệu");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const getRoleBadge = (roles: Role[]) => {
    if (!roles || roles.length === 0) return <span className="text-[11px] text-gray-500 font-medium">No Role</span>;
    return roles.map(role => {
      const isAdmin = role.name === 'ADMIN';
      return (
        <span
          key={role._id}
          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] rounded-none mr-1 mb-1 ${
            isAdmin ? 'bg-[#1E3A8A] text-white' : 'bg-[#F1F5F9] text-[#0F766E]'
          }`}
        >
          {role.name}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1
          className="text-[22px] font-bold tracking-tight text-[#0A1F44] leading-none mb-2"
          style={{ letterSpacing: "-0.02em" }}
        >
          QUẢN LÝ NGƯỜI DÙNG (RBAC)
        </h1>
        <p className="text-[13px] text-[#6B7A90] font-normal leading-snug">
          Quản lý tài khoản hệ thống và phân quyền truy cập. 
          <br/>Lưu ý: Chỉ tài khoản nhóm ADMIN mới có quyền truy cập chức năng này.
        </p>
      </div>

      {/* ── Table Area ── */}
      <div className="bg-white ring-1 ring-[#CBD5E0] rounded-none flex-1 flex flex-col min-h-[500px] mb-[2px]">
        {/* Table Header Container */}
        <div className="px-6 py-5 border-b border-[#CBD5E0] bg-[#FAFAFA] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-[13.5px] font-bold tracking-[0.02em] text-[#0A1F44] uppercase flex-shrink-0">
            Danh Sách Tài Khoản
          </h2>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="text-[11px] font-bold tracking-[0.05em] uppercase text-[#2B5CE6] border border-[#2B5CE6] px-4 py-2 hover:bg-[#2B5CE6] hover:text-white transition-colors rounded-none whitespace-nowrap">
              Bộ Lọc
            </button>
            <button className="text-[11px] font-bold tracking-[0.05em] uppercase text-white bg-[#2B5CE6] border border-[#2B5CE6] px-4 py-2 hover:bg-[#2049BA] hover:border-[#2049BA] transition-colors rounded-none whitespace-nowrap">
              + Tạo tài khoản
            </button>
          </div>
        </div>

        {/* Table Data */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center h-full min-h-[300px] flex-col gap-4">
              <div className="w-7 h-7 border-2 border-[#CBD5E0] border-t-[#0A1F44] animate-spin rounded-full"></div>
              <p className="text-[13px] text-[#6B7A90] font-medium tracking-tight">Đang tải dữ liệu người dùng...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8 min-h-[300px] flex-col">
               <div className="w-12 h-12 border border-red-200 bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-[14px] text-red-600 font-bold mb-1">Truy cập thất bại</p>
              <p className="text-[13px] text-[#6B7A90]">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col text-center p-8 bg-white min-h-[300px]">
              <div className="w-16 h-16 border border-[#CBD5E0] bg-[#F0F2F5] flex items-center justify-center mb-5 rounded-none">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[#A0AEC0]">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
                </svg>
              </div>
              <p className="text-[13.5px] font-semibold text-[#0A1F44] mb-1.5 tracking-tight">
                Không tìm thấy người dùng
              </p>
              <p className="text-[12.5px] text-[#6B7A90] max-w-sm leading-relaxed">
                Hệ thống chưa có tài khoản hoặc dữ liệu rỗng.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CBD5E0] bg-[#F7F9FC]">
                    <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Trạng Thái</th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Email</th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Họ Tên</th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Vai Trò (RBAC)</th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase">Ngày Tạo</th>
                    <th className="px-6 py-4 text-[11px] font-bold tracking-[0.05em] text-[#4A5568] uppercase text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-[#E2E8F0] hover:bg-[#F7F9FC] transition-colors last:border-b-0 group">
                      <td className="px-6 py-4">
                         {user.isActive ? (
                            <span className="inline-flex w-2.5 h-2.5 bg-green-500"></span>
                         ) : (
                            <span className="inline-flex w-2.5 h-2.5 bg-red-500"></span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-[13px] font-bold text-[#0A1F44]">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-[#4A5568]">{user.fullName || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                         {getRoleBadge(user.roles)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-[#4A5568]">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[11px] font-bold bg-[#F8FAFC] text-[#4A5568] border border-[#CBD5E0] px-3 py-1.5 hover:bg-[#E2E8F0] transition-colors uppercase">
                            Chi tiết
                          </button>
                          <button className="text-[11px] font-bold bg-white text-[#2B5CE6] border border-[#2B5CE6] px-3 py-1.5 hover:bg-[#2B5CE6] hover:text-white transition-colors uppercase">
                            Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
