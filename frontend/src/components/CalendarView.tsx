import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, FileText, Video, Film } from "lucide-react";
import { Badge } from "./ui/badge/Badge";
import type { ContentStatus, ContentType, ScheduledItem } from "../types/content";

type ViewMode = "week" | "month";

interface CalendarViewProps {
  items: ScheduledItem[];
  onItemClick?: (item: ScheduledItem) => void;
}

const TYPE_ICONS: Record<ContentType, React.ElementType> = {
  short_video: Film,
  long_video: Video,
  blog_post: FileText,
};

const STATUS_VARIANT: Record<ContentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  validated: "secondary",
  scheduled: "default",
  published: "default",
};

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const start = new Date(firstDay);
  start.setDate(start.getDate() - startOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ items, onItemClick }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ScheduledItem[]>();
    for (const item of items) {
      const key = item.scheduled_date.split("T")[0];
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [items]);

  const days = useMemo(() => {
    return viewMode === "week" ? getWeekDays(currentDate) : getMonthDays(currentDate);
  }, [viewMode, currentDate]);

  const navigate = (direction: -1 | 1) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else {
        next.setMonth(next.getMonth() + direction);
      }
      return next;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const title = viewMode === "week"
    ? `Week of ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const todayKey = formatDateKey(new Date());
  const currentMonth = currentDate.getMonth();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Today
          </button>
          <div className="flex items-center rounded-md border">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-50"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 hover:bg-gray-50"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex rounded-md border text-sm">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 ${viewMode === "week" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 ${viewMode === "month" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES.map((name) => (
            <div key={name} className="px-2 py-2 text-center text-xs font-medium text-gray-500">
              {name}
            </div>
          ))}
        </div>
        <div className={`grid grid-cols-7 ${viewMode === "week" ? "" : "auto-rows-[120px]"}`}>
          {days.map((day) => {
            const key = formatDateKey(day);
            const dayItems = itemsByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isCurrentMonth = day.getMonth() === currentMonth;

            return (
              <div
                key={key}
                className={`border-b border-r p-1.5 ${
                  viewMode === "week" ? "min-h-[140px]" : ""
                } ${isCurrentMonth ? "" : "bg-gray-50"}`}
              >
                <div
                  className={`mb-1 text-xs font-medium ${
                    isToday
                      ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : isCurrentMonth
                        ? "text-gray-900"
                        : "text-gray-400"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayItems.map((item) => {
                    const Icon = TYPE_ICONS[item.content_type];
                    return (
                      <button
                        key={item.content_id}
                        onClick={() => onItemClick?.(item)}
                        className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-xs hover:bg-gray-100"
                      >
                        <Icon className="h-3 w-3 flex-shrink-0 text-gray-500" />
                        <span className="truncate">{item.title}</span>
                        <Badge
                          variant={STATUS_VARIANT[item.status]}
                          className="ml-auto scale-75"
                        >
                          {item.status}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
