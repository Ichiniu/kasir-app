import Link from "next/link"
import { Package, Tags, ArrowDownToLine, Barcode } from "lucide-react"

const tabs = [
  { id: "produk", label: "Produk", icon: Package },
  { id: "kategori", label: "Kategori", icon: Tags },
  { id: "stok-masuk", label: "Stok Masuk", icon: ArrowDownToLine },
  { id: "sku", label: "SKU", icon: Barcode },
]

export function ProductWorkspace({ activeTab, children }: { activeTab: string; children: React.ReactNode }) {
  const selectedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : "produk"

  return (
    <div className="space-y-5">
      <nav aria-label="Menu produk dan inventori" className="flex gap-1 overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={`/produk?tab=${id}`}
            aria-current={selectedTab === id ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${selectedTab === id ? "bg-[#FFB800] text-slate-950" : "text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#111827]"}`}
          >
            <Icon size={16} />{label}
          </Link>
        ))}
      </nav>
      <section>{children}</section>
    </div>
  )
}
