"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { id } from "date-fns/locale"
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
            className="w-full justify-start px-3 font-normal h-9 bg-white border-[#e5e7eb] hover:bg-[#f9fafb] text-xs text-[#111827] shadow-2xs cursor-pointer"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-[#6b7280] shrink-0" />
            {date?.from ? (
              date.to ? (
                <span>
                  {format(date.from, "dd MMM yyyy", { locale: id })} -{" "}
                  {format(date.to, "dd MMM yyyy", { locale: id })}
                </span>
              ) : (
                <span>{format(date.from, "dd MMM yyyy", { locale: id })}</span>
              )
            ) : (
              <span className="text-[#9ca3af]">Pilih rentang tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 rounded-2xl shadow-2xl border border-[#e5e7eb] bg-white overflow-hidden" 
          align="start"
        >
          <Calendar
            mode="range"
            locale={id}
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

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  try {
    return format(date, "dd MMMM yyyy", { locale: id })
  } catch {
    return ""
  }
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
    <Field className={cn("w-auto min-w-[200px]", className)}>
      {label && <FieldLabel htmlFor="date-required">{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <InputGroup className="bg-white border-[#e5e7eb] h-9 shadow-2xs hover:border-[#d1d5db] transition-colors cursor-pointer">
          <PopoverTrigger asChild>
            <div className="flex items-center w-full px-1">
              <InputGroupInput
                id="date-required"
                value={value}
                placeholder={placeholder}
                readOnly
                onClick={() => setOpen(true)}
                className="cursor-pointer text-xs font-medium text-[#111827]"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  id="date-picker"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Select date"
                  className="cursor-pointer text-[#6b7280] hover:text-[#111827]"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="sr-only">Pilih tanggal</span>
                </InputGroupButton>
              </InputGroupAddon>
            </div>
          </PopoverTrigger>
        </InputGroup>
        <PopoverContent
          className="w-auto p-0 rounded-2xl shadow-2xl border border-[#e5e7eb] bg-white overflow-hidden"
          align="end"
          alignOffset={-4}
          sideOffset={8}
        >
          <Calendar
            mode="single"
            locale={id}
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
    </Field>
  )
}

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
          {date ? format(date, "dd MMMM yyyy", { locale: id }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border border-[#e5e7eb] bg-white overflow-hidden" align="start">
        <Calendar
          mode="single"
          locale={id}
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
