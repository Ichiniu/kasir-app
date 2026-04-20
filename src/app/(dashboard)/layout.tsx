"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex bg-[#f8fafc] h-screen overflow-hidden">
      {/* Sidebar - Controlled by isOpen */}
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r border-[#e2e8f0] bg-white h-full",
        isOpen ? "w-72" : "w-0 overflow-hidden border-r-0"
      )}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#e2e8f0] bg-white flex items-center px-6 gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#64748b] hover:bg-[#f8fafc] rounded-xl hover:text-[#0f172a]"
          >
            {isOpen ? <Menu size={20} /> : <Menu size={20} />}
          </Button>
          
          <div className="h-4 w-px bg-[#e2e8f0] mx-2"></div>
          
          <h2 className="font-bold text-[#0f172a] text-sm uppercase tracking-widest">
            KASIR DIGITAL v1.0
          </h2>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
