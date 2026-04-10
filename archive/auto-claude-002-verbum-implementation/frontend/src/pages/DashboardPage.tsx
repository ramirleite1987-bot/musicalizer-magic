import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, Clock, Send, Plus, ChevronLeft, ChevronRight, Video, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card/Card";
import { Badge } from "../components/ui/badge/Badge";
import { Button } from "../components/ui/button/Button";
import { StatusBadge } from "../components/StatusBadge";
import { ContentStatus, ContentType } from "../types/content";
import type { DashboardSummary, ScheduledItem } from "../types/content";

const API_BASE = "http://localhost:8000";

const STATUS_CONFIG: Record<ContentStatus, { label: string; icon: React.ElementType; color: string }> = {
  [ContentStatus.DRAFT]: { label: "Drafts", icon: FileText, color: "bg-yellow-100 text-yellow-800" },
  [ContentStatus.VALIDATED]: { label: "Validated", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  [ContentStatus.SCHEDULED]: { label: "Scheduled", icon: Clock, color: "bg-blue-100 text-blue-800" },
  [ContentStatus.PUBLISHED]: { label: "Published", icon: Send, color: "bg-purple-100 text-purple-800" },
};

const CONTENT_TYPE_ICONS: Record<ContentType, React.ElementType> = {
  [ContentType.SHORT_VIDEO]: Video,
  [ContentType.LONG_VIDEO]: Video,
  [ContentType.BLOG_POST]: Globe,
};

function StatCard({ status, count }: { status: ContentStatus; count: number }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{config.label}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{count}</span>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDayOfWeek, daysInMonth]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Calendar</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[130px] text-center">{monthName}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="font-medium text-gray-500 py-1">{d}</div>
          ))}
          {days.map((day, i) => (
            <div
              key={i}
              className={`py-1 rounded-md ${
                day === null
                  ? ""
                  : isToday(day)
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day ?? ""}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingContentItem({ item }: { item: ScheduledItem }) {
  const TypeIcon = CONTENT_TYPE_ICONS[item.content_type] ?? FileText;
  const scheduledDate = new Date(item.scheduled_date);
  const formattedDate = scheduledDate.toLocaleDateString("default", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <TypeIcon className="h-4 w-4 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>
      <StatusBadge status={item.status} />
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/summary`);
        if (!res.ok) throw new Error(`Failed to load dashboard: ${res.status}`);
        const data: DashboardSummary = await res.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
        setSummary({
          total_content: 0,
          by_status: {
            [ContentStatus.DRAFT]: 0,
            [ContentStatus.VALIDATED]: 0,
            [ContentStatus.SCHEDULED]: 0,
            [ContentStatus.PUBLISHED]: 0,
          },
          by_type: {
            [ContentType.SHORT_VIDEO]: 0,
            [ContentType.LONG_VIDEO]: 0,
            [ContentType.BLOG_POST]: 0,
          },
          upcoming_scheduled: [],
          recent_validations: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  const byStatus = summary!.by_status;
  const upcoming = summary!.upcoming_scheduled;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <Button onClick={() => navigate("/content/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Content
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm text-yellow-800">Could not connect to server. Showing empty state.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.values(ContentStatus).map((status) => (
          <StatCard key={status} status={status} count={byStatus[status] ?? 0} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upcoming Content (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming content scheduled.</p>
            ) : (
              <div className="divide-y">
                {upcoming.map((item) => (
                  <UpcomingContentItem key={item.content_id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <MiniCalendar />
      </div>
    </div>
  );
}
