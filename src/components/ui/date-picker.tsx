"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// --- DATE PICKER WITH RANGE (Untuk Laporan Mingguan) ---
interface DatePickerWithRangeProps {
  date?: DateRange | undefined
  onDateChange?: (range: DateRange | undefined) => void
  label?: string
  className?: string
}

export function DatePickerWithRange({
  date: controlledDate,
  onDateChange,
  label = "Rentang Tanggal",
  className,
}: DatePickerWithRangeProps = {}) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  })

  const date = controlledDate !== undefined ? controlledDate : internalDate

  const handleSelect = (selectedRange: DateRange | undefined) => {
    if (controlledDate === undefined) {
      setInternalDate(selectedRange)
    }
    onDateChange?.(selectedRange)
  }

  return (
    <Field className={cn("w-auto min-w-[240px]", className)}>
      {label && <FieldLabel htmlFor="date-picker-range">{label}</FieldLabel>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-range"
            className="w-full justify-start px-2.5 font-normal h-9 bg-white border-[#e5e7eb] hover:bg-[#f9fafb] text-xs text-[#111827]"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-[#6b7280]" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd MMM yyyy")} -{" "}
                  {format(date.to, "dd MMM yyyy")}
                </>
              ) : (
                format(date.from, "dd MMM yyyy")
              )
            ) : (
              <span className="text-muted-foreground">Pilih rentang tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-[#e5e7eb]" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}

// --- DATE PICKER INPUT (Untuk Harian / Dashboard) ---
function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

interface DatePickerInputProps {
  date?: Date | undefined
  onDateChange?: (date: Date | undefined) => void
  label?: string
  className?: string
  placeholder?: string
}

export function DatePickerInput({
  date: controlledDate,
  onDateChange,
  label,
  className,
  placeholder = "Pilih tanggal...",
}: DatePickerInputProps = {}) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    new Date()
  )
  const activeDate = controlledDate !== undefined ? controlledDate : internalDate
  const [month, setMonth] = React.useState<Date | undefined>(activeDate)
  const [value, setValue] = React.useState(formatDate(activeDate))

  React.useEffect(() => {
    if (controlledDate !== undefined) {
      setValue(formatDate(controlledDate))
      setMonth(controlledDate)
    }
  }, [controlledDate])

  const handleDateChange = (newDate: Date | undefined) => {
    if (controlledDate === undefined) {
      setInternalDate(newDate)
    }
    setValue(formatDate(newDate))
    onDateChange?.(newDate)
  }

  return (
    <Field className={cn("w-auto min-w-[190px]", className)}>
      {label && <FieldLabel htmlFor="date-required">{label}</FieldLabel>}
      <InputGroup className="bg-white border-[#e5e7eb] h-9">
        <InputGroupInput
          id="date-required"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value
            setValue(raw)
            const d = new Date(raw)
            if (isValidDate(d)) {
              handleDateChange(d)
              setMonth(d)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id="date-picker"
                variant="ghost"
                size="icon-xs"
                aria-label="Select date"
                className="cursor-pointer"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0 rounded-xl shadow-xl border-[#e5e7eb]"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={activeDate}
                month={month}
                onMonthChange={setMonth}
                onSelect={(d) => {
                  handleDateChange(d)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

// --- STANDARD DATE PICKER (Legacy Compatibility) ---
interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pilih tanggal",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 bg-white text-xs",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#6b7280]" />
          {date ? format(date, "dd MMMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-[#e5e7eb]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate)
            setOpen(false)
          }}
          className="rounded-md border shadow-sm"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
