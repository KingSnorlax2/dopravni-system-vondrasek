"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
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
      components={{
        iconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
        iconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

interface CustomDatePickerProps extends CalendarProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  showClear?: boolean;
  showToday?: boolean;
  className?: string;
}

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
    <div className={cn("flex flex-col items-center", className)}>
      <DayPicker
        mode="single"
        selected={value}
        onSelect={onChange}
        locale={cs}
        weekStartsOn={1}
        showOutsideDays
        captionLayout="dropdown"
        className="p-3"
        classNames={{
          months: "flex flex-col space-y-2",
          month: "space-y-2",
          caption: "flex justify-between items-center px-2 pt-2 pb-1",
          caption_label: "text-base font-semibold capitalize",
          dropdown: "mx-1 px-1 py-0.5 rounded border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          nav: "flex items-center gap-2",
          nav_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-7 w-7 p-0 text-lg text-gray-700 hover:bg-gray-100"
          ),
          table: "w-full border-collapse",
          head_row: "flex w-full mb-1",
          head_cell: "w-8 text-center text-xs font-semibold text-gray-700 px-0.5 py-0.5",
          row: "flex w-full",
          cell: "w-8 h-8 text-center text-sm p-0 relative",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "w-8 h-8 p-0 font-normal rounded-full aria-selected:opacity-100"
          ),
          day_selected:
            "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white",
          day_today: "border border-blue-600",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_hidden: "invisible",
        }}
        {...props}
      />
      <div className="flex justify-between w-full mt-2 gap-2 px-2">
        {showClear && (
          <button
            type="button"
            className="flex-1 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium text-blue-600 transition"
            onClick={() => onChange(undefined)}
          >
            Vymazat
          </button>
        )}
        {showToday && (
          <button
            type="button"
            className="flex-1 py-1 rounded bg-blue-100 hover:bg-blue-200 text-sm font-medium text-blue-700 transition"
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