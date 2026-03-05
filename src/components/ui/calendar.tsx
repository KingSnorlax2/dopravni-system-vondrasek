"use client"

import * as React from "react"
import { DayPicker, type DayPickerSingleProps } from "react-day-picker"
import { cs } from 'date-fns/locale'

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * Unified calendar styles matching the design (react-day-picker v9 API):
 * - Czech locale (březen, po/út/st/čt/pá/so/ne)
 * - Selected date: blue fill with dark border
 * - Outside month dates: grey, subdued
 * - Header: month/year dropdown + chevron + nav arrows
 * - Footer: Vymazat, Dnes
 *
 * v9 key mapping: head_row->weekdays, head_cell->weekday, table->month_grid,
 * row->week, cell->day, day->day_button, nav_button_*->button_*,
 * caption->month_caption, caption_dropdowns->dropdowns
 */
export const UNIFIED_CALENDAR_CLASSNAMES = {
  // Layout containers
  months: "flex flex-col space-y-4",
  month: "space-y-3",
  month_grid: "w-full border-collapse space-y-1",
  month_caption: "flex justify-between items-center w-full px-1 pt-1 pb-3",
  weeks: "flex flex-col space-y-0",
  week: "flex w-full mt-1",
  // Weekday header (v9: weekdays + weekday replace head_row + head_cell)
  weekdays: "flex w-full",
  weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
  // Caption & dropdowns
  caption_label: "text-sm font-medium text-foreground",
  dropdowns: "flex items-center gap-1",
  dropdown: cn(
    "inline-flex items-center gap-1 px-2 py-1 text-sm font-medium",
    "border border-input rounded-md bg-background",
    "hover:bg-accent hover:text-accent-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  ),
  months_dropdown: cn(
    "px-2 py-1 text-sm font-medium rounded-md",
    "border border-input bg-background",
    "hover:bg-accent hover:text-accent-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring"
  ),
  years_dropdown: cn(
    "px-2 py-1 text-sm font-medium rounded-md",
    "border border-input bg-background",
    "hover:bg-accent hover:text-accent-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring"
  ),
  // Navigation
  nav: "flex items-center gap-1",
  button_previous: cn(
    "absolute left-1 inline-flex h-7 w-7 items-center justify-center rounded-md",
    "text-muted-foreground hover:text-foreground hover:bg-accent",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  ),
  button_next: cn(
    "absolute right-1 inline-flex h-7 w-7 items-center justify-center rounded-md",
    "text-muted-foreground hover:text-foreground hover:bg-accent",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  ),
  // Day cell and button (v9: day=cell, day_button=inner button)
  day: "h-9 w-9 p-0 relative flex items-center justify-center focus-within:relative focus-within:z-20",
  day_button: cn(
    "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50"
  ),
  // Modifiers (v9: selected, outside, today, disabled, hidden - no day_ prefix)
  selected: cn(
    "bg-blue-600 text-white hover:bg-blue-600 hover:text-white",
    "focus:bg-blue-600 focus:text-white ring-2 ring-gray-900 ring-offset-2"
  ),
  today: "bg-accent/50 text-accent-foreground font-medium",
  outside: "text-muted-foreground opacity-50",
  disabled: "text-muted-foreground opacity-50",
  hidden: "invisible",
  range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
  range_start: "aria-selected:bg-accent aria-selected:text-accent-foreground",
  range_end: "aria-selected:bg-accent aria-selected:text-accent-foreground",
} as const

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fromYear,
  toYear,
  captionLayout,
  ...props
}: CalendarProps & { fromYear?: number; toYear?: number; captionLayout?: string }) {
  const isDropdownLayout = captionLayout === "dropdown" || (captionLayout as string) === "dropdown-buttons"

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      fromYear={fromYear}
      toYear={toYear}
      {...(captionLayout && { captionLayout: captionLayout as any })}
      locale={cs}
      weekStartsOn={1}
      classNames={{
        ...UNIFIED_CALENDAR_CLASSNAMES,
        caption_label: isDropdownLayout ? "hidden" : UNIFIED_CALENDAR_CLASSNAMES.caption_label,
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

type CustomDatePickerProps = Omit<CalendarProps, 'selected' | 'onSelect'> & {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  showClear?: boolean;
  showToday?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  captionLayout?: "dropdown" | "dropdown-buttons" | "dropdown-months" | "dropdown-years" | "buttons";
};

export function CustomDatePicker({
  value,
  onChange,
  showClear = true,
  showToday = true,
  className,
  fromYear = 2020,
  toYear = new Date().getFullYear() + 10,
  captionLayout = "dropdown",
  ...props
}: CustomDatePickerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleSelect = (date: Date | undefined) => onChange(date)
  
  return (
    <div
      className={cn(
        "w-[280px] rounded-lg border bg-card p-3 shadow-sm",
        className
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <DayPicker
        mode="single"
        selected={value}
        onSelect={handleSelect}
        locale={cs}
        weekStartsOn={1}
        showOutsideDays
        captionLayout={captionLayout}
        fromYear={fromYear}
        toYear={toYear}
        classNames={{
          ...UNIFIED_CALENDAR_CLASSNAMES,
          caption_label: (captionLayout === "dropdown" || (captionLayout as string) === "dropdown-buttons") ? "hidden" : UNIFIED_CALENDAR_CLASSNAMES.caption_label,
        }}
        {...(props as Partial<DayPickerSingleProps>)}
      />
      <div className="flex justify-between gap-2 mt-3 pt-3 border-t">
        {showClear && (
          <button
            type="button"
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            onClick={() => onChange(undefined)}
          >
            Vymazat
          </button>
        )}
        {showToday && (
          <button
            type="button"
            className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => onChange(today)}
          >
            Dnes
          </button>
        )}
      </div>
    </div>
  );
}

export { Calendar }
export { DatePickerWithPresets } from "./date-picker-with-presets" 