"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerSingleProps } from "react-day-picker"
import { cs } from 'date-fns/locale'

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

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
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
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
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={undefined}
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
};

export function CustomDatePicker({
  value,
  onChange,
  showClear = true,
  showToday = true,
  className,
  ...props
}: CustomDatePickerProps) {
  const today = new Date();
  return (
    <div className={cn("calendar-box w-[300px] border border-gray-300 p-3 font-sans bg-white rounded-md", className)}>
      <DayPicker
        mode="single"
        selected={value}
        onSelect={onChange}
        locale={cs}
        weekStartsOn={1}
        showOutsideDays
        captionLayout="dropdown"
        className=""
        classNames={{
          months: "",
          month: "",
          caption: "calendar-header flex justify-between items-center mb-2 px-1",
          caption_label: "text-base font-semibold text-gray-800",
          dropdown: "mx-1 px-1 py-0.5 rounded border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          nav: "flex items-center gap-2",
          nav_button: "nav-button bg-none border-none cursor-pointer text-lg px-2 py-1 text-gray-700 hover:text-blue-600",
          table: "w-full border-collapse",
          head_row: "calendar-weekdays grid grid-cols-7 font-bold text-center mb-1 gap-1 text-xs uppercase text-gray-600",
          head_cell: "py-1",
          row: "calendar-days grid grid-cols-7 gap-2 text-center",
          cell: "",
          day: cn(
            "calendar-day p-2 rounded cursor-pointer transition-colors duration-100 text-sm",
            "hover:bg-gray-100"
          ),
          day_selected:
            "bg-blue-600 text-white font-bold rounded",
          day_today: "today bg-blue-500 text-white font-bold rounded-full",
          day_outside:
            "outside-month text-gray-400 text-xs opacity-80",
          day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
          day_hidden: "invisible",
        }}
        {...(props as Partial<DayPickerSingleProps>)}
      />
      <div className="flex justify-between w-full mt-2 gap-2 px-2">
        {showClear && (
          <button
            type="button"
            className="flex-1 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs font-medium text-blue-600 transition"
            onClick={() => onChange(undefined)}
          >
            Vymazat
          </button>
        )}
        {showToday && (
          <button
            type="button"
            className="flex-1 py-1 rounded bg-blue-100 hover:bg-blue-200 text-xs font-medium text-blue-700 transition"
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