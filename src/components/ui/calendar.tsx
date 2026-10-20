"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type NavProps } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col sm:flex-row gap-6 relative",
        month: "space-y-3",
        month_caption: "flex justify-center items-center h-8 relative font-semibold text-sm",
        caption_label: "text-sm font-semibold text-[#111827]",
        nav: "flex items-center gap-1",
        button_previous:
          "h-7 w-7 rounded-md border border-[#e5e7eb] flex items-center justify-center hover:bg-[#f3f4f6] text-[#4b5563] hover:text-[#111827] absolute left-1 top-0.5 z-10 cursor-pointer bg-white transition-colors",
        button_next:
          "h-7 w-7 rounded-md border border-[#e5e7eb] flex items-center justify-center hover:bg-[#f3f4f6] text-[#4b5563] hover:text-[#111827] absolute right-1 top-0.5 z-10 cursor-pointer bg-white transition-colors",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between mb-1",
        weekday:
          "text-[#6b7280] rounded-md w-9 font-medium text-[0.75rem] text-center uppercase tracking-wider",
        weeks: "flex flex-col gap-1 mt-1",
        week: "flex w-full justify-between",
        day: "h-9 w-9 text-center text-xs p-0 relative flex items-center justify-center",
        day_button:
          "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium text-[#111827] hover:bg-[#f3f4f6] transition-colors cursor-pointer",
        selected:
          "[&>.rdp-day_button]:bg-[#111827] [&>.rdp-day_button]:text-white [&>.rdp-day_button]:hover:bg-black font-semibold",
        range_start:
          "rounded-l-lg [&>.rdp-day_button]:bg-[#111827] [&>.rdp-day_button]:text-white [&>.rdp-day_button]:rounded-l-lg",
        range_end:
          "rounded-r-lg [&>.rdp-day_button]:bg-[#111827] [&>.rdp-day_button]:text-white [&>.rdp-day_button]:rounded-r-lg",
        range_middle:
          "bg-[#f3f4f6] [&>.rdp-day_button]:bg-transparent [&>.rdp-day_button]:text-[#111827] [&>.rdp-day_button]:rounded-none",
        today:
          "font-bold [&>.rdp-day_button]:border [&>.rdp-day_button]:border-[#111827]/40",
        outside: "opacity-30 pointer-events-none",
        disabled: "opacity-30 pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props: NavProps & { orientation?: string }) =>
          props.orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
