"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Menu } from "lucide-react";
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
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r border-[#e2e8f0] bg-white h-full",
        isOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
      )}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#e2e8f0] bg-white flex items-center px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#64748b] hover:bg-[#f8fafc] rounded-xl hover:text-[#0f172a]"
          >
            <Menu size={20} />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
