"use client"

import * as React from "react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { addDays, addMonths, addYears } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

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

  // If inline mode, render only the calendar content
  if (inline) {
    return (
      <div className="w-auto p-0 rounded-xl">
        {/* Global Header */}
        {date && (
          <div className="border-b px-4 py-3 bg-muted/30">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Vybrané datum
            </div>
            <div className="text-sm font-medium mt-1 text-foreground">
              {format(date, "EEEE, d. MMMM yyyy", { locale: cs })}
            </div>
          </div>
        )}

        {/* Main Layout - Flex Container */}
        <div className="flex flex-row items-stretch">
          {/* LEFT: Sidebar with Presets */}
          <div className="flex flex-col gap-1 border-r border-border/50 p-3 min-w-[150px] bg-muted/5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 pt-1">
              Rychlá volba
            </span>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className={cn(
                  "justify-start h-8 px-2 text-sm font-normal",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-primary/10 hover:border-l-2 hover:border-l-primary",
                  "transition-all duration-200 rounded-md",
                  "active:bg-primary/15"
                )}
                onClick={preset.action}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* RIGHT: Calendar */}
          <div className="p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              fromYear={fromYear}
              toYear={toYear}
              className="p-0"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-sm font-medium hidden",
                caption_dropdowns: "flex justify-center gap-2 items-center",
                dropdown: cn(
                  "px-3 py-1.5 text-sm font-medium",
                  "border border-input bg-background rounded-md",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-colors duration-200"
                ),
                dropdown_month: cn(
                  "px-3 py-1.5 text-sm font-medium",
                  "border border-input bg-background rounded-md",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-colors duration-200"
                ),
                dropdown_year: cn(
                  "px-3 py-1.5 text-sm font-medium",
                  "border border-input bg-background rounded-md",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-colors duration-200"
                ),
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium",
                  "ring-offset-background transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                  "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium",
                  "ring-offset-background transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "hover:bg-accent hover:text-accent-foreground",
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                day_range_end: "day-range-end",
                day_selected: cn(
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary hover:text-primary-foreground",
                  "focus:bg-primary focus:text-primary-foreground",
                  "font-semibold shadow-md",
                  "rounded-full"
                ),
                day_today: cn(
                  "bg-accent text-accent-foreground",
                  "font-semibold",
                  "border-2 border-primary",
                  "rounded-full"
                ),
                day_outside:
                  "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  const presets = [
    {
      label: "Dnes",
      action: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setDate(today)
        if (!inline) {
          setOpen(false)
        }
      },
    },
    {
      label: "Zítra",
      action: () => applyPreset(1, 0, 0),
    },
    {
      label: "Za týden",
      action: () => applyPreset(7, 0, 0),
    },
    {
      label: "Za měsíc",
      action: () => applyPreset(0, 1, 0),
    },
    {
      label: "Za rok",
      action: () => applyPreset(0, 0, 1),
    },
    {
      label: "Za 2 roky",
      action: () => applyPreset(0, 0, 2),
    },
  ]

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
        className="w-auto p-0 rounded-xl border shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-none" 
        align="start"
      >
        {/* Global Header */}
        {date && (
          <div className="border-b px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/30">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Vybrané datum
            </div>
            <div className="text-xs sm:text-sm font-medium mt-1 text-foreground leading-tight">
              {format(date, "EEEE, d. MMMM yyyy", { locale: cs })}
            </div>
          </div>
        )}

        {/* Main Layout - Responsive Flex Container */}
        <div className="flex flex-col sm:flex-row items-stretch">
          {/* LEFT: Sidebar with Presets */}
          <div className="flex flex-row sm:flex-col gap-1 sm:gap-1 border-b sm:border-b-0 sm:border-r border-border/50 p-2.5 sm:p-3 min-w-0 sm:min-w-[150px] bg-muted/5 overflow-x-auto sm:overflow-x-visible">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0 sm:mb-2 px-2 pt-1 whitespace-nowrap sm:whitespace-normal">
              Rychlá volba
            </span>
            <div className="flex sm:flex-col gap-1 flex-1 sm:flex-none">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className={cn(
                    "justify-start h-8 px-2 sm:px-2 text-xs sm:text-sm font-normal whitespace-nowrap",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-primary/10 hover:border-l-2 hover:border-l-primary",
                    "transition-all duration-200 rounded-md",
                    "active:bg-primary/15",
                    "flex-shrink-0"
                  )}
                  onClick={preset.action}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* RIGHT: Calendar */}
          <div className="p-2.5 sm:p-3 flex-1 min-w-0 overflow-x-auto sm:overflow-x-visible">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              fromYear={fromYear}
              toYear={toYear}
              className="p-0"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-sm font-medium hidden",
                caption_dropdowns: "flex justify-center gap-2 items-center",
                dropdown: cn(
                  "px-3 py-1.5 text-sm font-medium",
                  "border border-input bg-background rounded-md",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-colors duration-200"
                ),
                dropdown_month: cn(
                  "px-3 py-1.5 text-sm font-medium",
                  "border border-input bg-background rounded-md",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-colors duration-200"
                ),
                dropdown_year: cn(
                  "px-3 py-1.5 text-sm font-medium",
                  "border border-input bg-background rounded-md",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-colors duration-200"
                ),
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium",
                  "ring-offset-background transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                  "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium",
                  "ring-offset-background transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "hover:bg-accent hover:text-accent-foreground",
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                day_range_end: "day-range-end",
                day_selected: cn(
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary hover:text-primary-foreground",
                  "focus:bg-primary focus:text-primary-foreground",
                  "font-semibold shadow-md",
                  "rounded-full"
                ),
                day_today: cn(
                  "bg-accent text-accent-foreground",
                  "font-semibold",
                  "border-2 border-primary",
                  "rounded-full"
                ),
                day_outside:
                  "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

