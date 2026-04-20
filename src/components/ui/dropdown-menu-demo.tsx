"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  ChevronDown,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Modern Dropdown Menu Demo
 * 
 * Features:
 * - Solid white background (no transparency)
 * - Smooth animations
 * - Rounded corners (2xl)
 * - Better shadows
 * - Modern hover effects
 * - Active state with solid color background
 */
export function ModernDropdownDemo() {
  const [selected, setSelected] = useState("profile")

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold text-[#0f172a]">Modern Dropdown Menu</h2>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline"
            className="h-12 px-4 rounded-2xl border-[#e2e8f0] bg-[#f8fafc] hover:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          >
            <UserIcon size={18} className="text-[#94a3b8] mr-2" />
            <span className="text-sm font-bold text-[#0f172a]">
              {selected === "profile" ? "Profile" : selected === "billing" ? "Billing" : "Settings"}
            </span>
            <ChevronDown size={16} className="ml-2 text-[#94a3b8]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setSelected("profile")}
            className={cn(
              selected === "profile" && "bg-blue-600 text-white hover:bg-blue-700 [&_svg]:text-white"
            )}
          >
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelected("billing")}
            className={cn(
              selected === "billing" && "bg-blue-600 text-white hover:bg-blue-700 [&_svg]:text-white"
            )}
          >
            <CreditCardIcon />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSelected("settings")}
            className={cn(
              selected === "settings" && "bg-blue-600 text-white hover:bg-blue-700 [&_svg]:text-white"
            )}
          >
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 hover:bg-red-50 [&_svg]:text-red-600">
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="font-bold text-sm mb-2">Styling Features:</h3>
        <ul className="text-sm space-y-1 text-slate-600">
          <li>✅ Solid white background (no transparency)</li>
          <li>✅ Rounded corners (2xl = 1rem)</li>
          <li>✅ Modern shadow (shadow-2xl)</li>
          <li>✅ Smooth animations (fade + zoom + slide)</li>
          <li>✅ Better padding and spacing</li>
          <li>✅ Active state with solid color</li>
          <li>✅ Icon color changes with state</li>
        </ul>
      </div>
    </div>
  )
}
