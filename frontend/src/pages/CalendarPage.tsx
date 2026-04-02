import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarView } from "../components/CalendarView";
import { ContentType } from "../types/content";
import type { ScheduledItem } from "../types/content";
import { api } from "../services/api";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Types" },
  { value: ContentType.SHORT_VIDEO, label: "Short Video" },
  { value: ContentType.LONG_VIDEO, label: "Long Video" },
  { value: ContentType.BLOG_POST, label: "Blog Post" },
];

const CHANNEL_OPTIONS = ["youtube", "blog", "instagram", "tiktok"];

export function CalendarPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");

  const fetchScheduled = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.content_type = typeFilter;
      if (channelFilter) params.channel = channelFilter;
      const data = await api.get<ScheduledItem[]>("/content/scheduled", params);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scheduled items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, channelFilter]);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (typeFilter) {
      result = result.filter((item) => item.content_type === typeFilter);
    }
    if (channelFilter) {
      result = result.filter((item) => item.channels.includes(channelFilter));
    }
    return result;
  }, [items, typeFilter, channelFilter]);

  const handleItemClick = useCallback(
    (item: ScheduledItem) => {
      navigate(`/content/${item.content_id}`);
    },
    [navigate]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Editorial Calendar</h2>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Channels</option>
            {CHANNEL_OPTIONS.map((ch) => (
              <option key={ch} value={ch}>
                {ch.charAt(0).toUpperCase() + ch.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          Loading calendar…
        </div>
      ) : (
        <CalendarView items={filteredItems} onItemClick={handleItemClick} />
      )}
    </div>
  );
}
