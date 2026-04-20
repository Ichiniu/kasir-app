"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ShoppingCart,
  History,
  Wallet,
  Lock,
  Unlock,
  ClipboardList,
  BarChart3,
  LogOut,
  Settings,
} from "lucide-react";
import { signIn, signOut, useSession } from "@/lib/auth-client";

const sidebarItems = [
  {
    title: "Dasbor",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    section: "PRODUK & INVENTORI",
    roles: ["ADMIN"],
    items: [
      { title: "Produk", href: "/produk", icon: Package },
      { title: "Stok Masuk", href: "/stok-masuk", icon: ArrowDownToLine },
    ],
  },
  {
    section: "TRANSAKSI",
    roles: ["ADMIN", "CASHIER"],
    items: [
      { title: "Kasir", href: "/kasir", icon: ShoppingCart },
      { title: "Riwayat Penjualan", href: "/riwayat-penjualan", icon: History },
    ],
  },
  {
    section: "KAS",
    roles: ["ADMIN", "CASHIER"],
    items: [
      { title: "Buka Kas (Modal)", href: "/buka-kas", icon: Unlock },
      { title: "Tutup Kas", href: "/tutup-kas", icon: Lock },
    ],
  },
  {
    section: "ADMIN",
    roles: ["ADMIN"],
    items: [
      { title: "Riwayat Buka/Tutup Kas", href: "/riwayat-kas", icon: History },
      { title: "Audit Aktivitas", href: "/audit", icon: ClipboardList },
      { title: "Pengaturan Akun", href: "/settings", icon: Settings },
    ],
  },
  {
    section: "LAPORAN",
    roles: ["ADMIN"],
    items: [
      { title: "Laporan Harian", href: "/laporan/harian", icon: BarChart3 },
      { title: "Laporan Mingguan", href: "/laporan/mingguan", icon: BarChart3 },
      { title: "Laporan Bulanan", href: "/laporan/bulanan", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "CASHIER";

  const filteredItems = sidebarItems.filter(item => {
    if (item.roles && !item.roles.includes(userRole)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
        {filteredItems.map((item, index) => (
          <div key={index} className="space-y-2">
            {item.section ? (
              <div>
                <h2 className="px-3 text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.15em] mb-3">
                  {item.section}
                </h2>
                <div className="space-y-1">
                  {item.items.map((subItem) => (
                    <SidebarLink
                      key={subItem.href}
                      href={subItem.href}
                      icon={subItem.icon}
                      title={subItem.title}
                      active={pathname === subItem.href}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <SidebarLink
                href={item.href!}
                icon={item.icon!}
                title={item.title!}
                active={pathname === item.href}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Action Area */}
      <div className="p-4 border-t border-[#f3f4f6]">
        <button 
          onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.href = "/login" } })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[#6b7280] hover:text-[#ef4444] hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold">Keluar Sistem</span>
        </button>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  title,
  active,
}: {
  href: string;
  icon: any;
  title: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
        active
          ? "text-white bg-[#5E54F7] shadow-lg shadow-[#5E54F7]/20"
          : "text-[#6b7280] hover:text-[#5E54F7] hover:bg-[#5E54F7]/5"
      )}
    >
      <Icon
        size={18}
        className={cn("transition-colors", active ? "text-white" : "group-hover:text-[#5E54F7]")}
      />
      <span>{title}</span>
    </Link>
  );
}

