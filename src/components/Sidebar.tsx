"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  Wallet,
  Lock,
  Unlock,
  ClipboardList,
  BarChart3,
  LogOut,
  Settings,
  Store,
  ClipboardCheck,
} from "lucide-react";
import { signIn, signOut, useSession } from "@/lib/auth-client";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SUPERADMIN"],
  },
  {
    section: "PRODUK & INVENTORI",
    roles: ["ADMIN"],
    items: [
      { title: "Produk & Inventori", href: "/produk", icon: Package },
    ],
  },
  {
    section: "OPERASIONAL DAPUR",
    roles: ["ADMIN", "CASHIER"],
    items: [
      { title: "Stock Opname", href: "/stock-opname", icon: ClipboardCheck },
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
    ],
  },
  {
    section: "LAPORAN",
    roles: ["ADMIN"],
    items: [
      { title: "Laporan Mingguan", href: "/laporan/mingguan", icon: BarChart3 },
      { title: "Laporan Bulanan", href: "/laporan/bulanan", icon: BarChart3 },
    ],
  },
  {
    section: "PENGATURAN",
    roles: ["SUPERADMIN"],
    items: [
      { title: "Kelola Cabang", href: "/cabang", icon: Store },
      { title: "Pengaturan Akun", href: "/settings", icon: Settings },
    ],
  },
  {
    section: "LAPORAN SUPERADMIN",
    roles: ["SUPERADMIN"],
    items: [
      { title: "Laporan Penjualan", href: "/laporan-penjualan", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userRole = mounted ? (((session?.user as any)?.role as string) || "CASHIER") : "";

  // Belum mounted: render kosong agar tidak flash menu yang salah
  if (!mounted) return null;

  const filteredItems = sidebarItems.filter(item => {
    if (item.roles && !item.roles.includes(userRole)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans">
      <div className="h-16 flex items-center px-4 border-b border-[#e2e8f0]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="Casir+"
            width={110}
            height={60}
            className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {filteredItems.map((item, index) => (
          <div key={index} className="space-y-1.5">
            {item.section ? (
              <div>
                <h2 className="px-2.5 text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.12em] mb-2 whitespace-nowrap">
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

      <div className="p-3 border-t border-[#f3f4f6]">
        <button 
          onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login" } } })}
          className="flex items-center gap-2.5 px-2.5 py-2 w-full rounded-xl text-[#6b7280] hover:text-[#ef4444] hover:bg-red-50 transition-all duration-200 group whitespace-nowrap"
        >
          <LogOut size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold whitespace-nowrap">Keluar Sistem</span>
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
        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
        active
          ? "text-slate-950 font-bold bg-[#FFB800] shadow-md shadow-[#FFB800]/25"
          : "text-[#6b7280] hover:text-slate-900 hover:bg-[#FFB800]/10"
      )}
    >
      <Icon
        size={18}
        className={cn("shrink-0 transition-colors", active ? "text-slate-950" : "group-hover:text-slate-900")}
      />
      <span className="whitespace-nowrap tracking-tight">{title}</span>
    </Link>
  );
}

