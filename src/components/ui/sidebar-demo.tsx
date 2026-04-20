"use client"

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

/**
 * Modern Minimalist Sidebar Demo
 * 
 * Design Features:
 * - Clean white background
 * - Dark text (#111827) for all items
 * - Light gray hover state (#f3f4f6)
 * - No colored backgrounds
 * - Simple and minimal
 * - Rounded corners (lg)
 * - Subtle border
 */
export function AppSidebar() {
  const [activeItem, setActiveItem] = useState("Home")

  return (
    <div className="w-64 h-screen bg-white border-r border-[#e5e7eb] p-3">
      <div className="space-y-6">
        <div>
          <h2 className="px-3 text-xs font-semibold text-[#6b7280] tracking-wide mb-2">
            Application
          </h2>
          <div className="space-y-0.5">
            {items.map((item) => (
              <Link
                key={item.title}
                href={item.url}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveItem(item.title)
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  activeItem === item.title
                    ? "text-[#111827] bg-[#f3f4f6]"
                    : "text-[#111827] hover:bg-[#f3f4f6]"
                )}
              >
                <item.icon size={20} className="text-[#111827]" />
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="font-bold text-sm mb-2">Design Features:</h3>
        <ul className="text-xs space-y-1 text-slate-600">
          <li>✅ Clean white background</li>
          <li>✅ Dark text (#111827) - no color variations</li>
          <li>✅ Light gray hover (#f3f4f6)</li>
          <li>✅ No colored active states</li>
          <li>✅ Minimal and clean design</li>
          <li>✅ Rounded corners (lg)</li>
          <li>✅ Subtle border (#e5e7eb)</li>
        </ul>
      </div>
    </div>
  )
}
