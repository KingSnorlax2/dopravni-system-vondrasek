"use client"

import * as React from "react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { addDays, addMonths, addYears } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar, UNIFIED_CALENDAR_CLASSNAMES } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithPresetsProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  fromYear?: number
  toYear?: number
  disabled?: boolean
  /** If true, renders only the calendar content without Popover wrapper (for use inside existing Popover) */
  inline?: boolean
  /** If false, hides presets sidebar and shows only calendar + Vymazat/Dnes footer (matches reference design) */
  showPresets?: boolean
}

export function DatePickerWithPresets({
  date,
  setDate,
  placeholder = "Vyberte datum",
  className,
  fromYear = 2020,
  toYear = new Date().getFullYear() + 10,
  disabled = false,
  inline = false,
  showPresets = false,
}: DatePickerWithPresetsProps) {
  const [open, setOpen] = React.useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Helper function to apply presets
  const applyPreset = (days: number = 0, months: number = 0, years: number = 0) => {
    let newDate = new Date()
    newDate.setHours(0, 0, 0, 0)
    
    if (days !== 0) {
      newDate = addDays(newDate, days)
    }
    if (months !== 0) {
      newDate = addMonths(newDate, months)
    }
    if (years !== 0) {
      newDate = addYears(newDate, years)
    }
    
    setDate(newDate)
    if (!inline) {
      setOpen(false)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate && !inline) {
      setOpen(false)
    }
  }

  const presets = [
    { label: "Dnes", action: () => { const d = new Date(); d.setHours(0, 0, 0, 0); setDate(d); if (!inline) setOpen(false); } },
    { label: "Zítra", action: () => applyPreset(1, 0, 0) },
    { label: "Za týden", action: () => applyPreset(7, 0, 0) },
    { label: "Za měsíc", action: () => applyPreset(0, 1, 0) },
    { label: "Za rok", action: () => applyPreset(0, 0, 1) },
    { label: "Za 2 roky", action: () => applyPreset(0, 0, 2) },
  ]

  const calendarContent = (
    <>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
        captionLayout="dropdown"
        fromYear={fromYear}
        toYear={toYear}
        showOutsideDays
        className="p-0"
        classNames={{ ...UNIFIED_CALENDAR_CLASSNAMES, caption_label: "hidden" }}
      />
      <div className="flex justify-between gap-2 mt-3 pt-3 border-t">
        <button
          type="button"
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            setDate(undefined)
            if (!inline) setOpen(false)
          }}
        >
          Vymazat
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => {
            const d = new Date()
            d.setHours(0, 0, 0, 0)
            setDate(d)
            if (!inline) setOpen(false)
          }}
        >
          Dnes
        </button>
      </div>
    </>
  )

  if (inline) {
    return (
      <div className="w-auto rounded-lg border bg-card p-3 shadow-sm" onMouseDown={(e) => e.stopPropagation()}>
        {showPresets && (
          <div className="flex flex-col gap-1 border-b pb-3 mb-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Rychlá volba
            </span>
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => (
                <Button key={preset.label} variant="ghost" size="sm" className="h-8 text-xs" onClick={preset.action}>
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        {calendarContent}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !date && "text-muted-foreground",
            date && "font-medium",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "d. M. yyyy", { locale: cs })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-lg border shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-none"
        align="start"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {showPresets ? (
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-row sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r p-3 min-w-[140px] bg-muted/5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Rychlá volba
              </span>
              {presets.map((preset) => (
                <Button key={preset.label} variant="ghost" size="sm" className="justify-start h-8 text-xs" onClick={preset.action}>
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="p-3">{calendarContent}</div>
          </div>
        ) : (
          <div className="p-3">{calendarContent}</div>
        )}
      </PopoverContent>
    </Popover>
  )
}

