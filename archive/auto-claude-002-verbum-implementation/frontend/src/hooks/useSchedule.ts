import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { ScheduledItem, ScheduleRequest } from "../types/content";

interface UseScheduleReturn {
  items: ScheduledItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  schedule: (request: ScheduleRequest) => Promise<ScheduledItem>;
  unschedule: (contentId: string) => Promise<void>;
  reschedule: (contentId: string, scheduledDate: string) => Promise<ScheduledItem>;
  getItemsForDateRange: (start: string, end: string) => ScheduledItem[];
  exportIcal: () => Promise<Blob>;
}

export function useSchedule(): UseScheduleReturn {
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ScheduledItem[]>("/schedule");
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch schedule";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const schedule = useCallback(async (request: ScheduleRequest): Promise<ScheduledItem> => {
    const item = await api.post<ScheduledItem>("/schedule", request);
    void fetchItems();
    return item;
  }, [fetchItems]);

  const unschedule = useCallback(async (contentId: string): Promise<void> => {
    await api.delete(`/schedule/${contentId}`);
    void fetchItems();
  }, [fetchItems]);

  const reschedule = useCallback(async (contentId: string, scheduledDate: string): Promise<ScheduledItem> => {
    const item = await api.put<ScheduledItem>(`/schedule/${contentId}`, { scheduled_date: scheduledDate });
    void fetchItems();
    return item;
  }, [fetchItems]);

  const getItemsForDateRange = useCallback((start: string, end: string): ScheduledItem[] => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return items.filter((item) => {
      const date = new Date(item.scheduled_date);
      return date >= startDate && date <= endDate;
    });
  }, [items]);

  const exportIcal = useCallback(async (): Promise<Blob> => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "/api"}/schedule/export/ical`);
    if (!response.ok) {
      throw new Error("Failed to export calendar");
    }
    return response.blob();
  }, []);

  return {
    items,
    loading,
    error,
    refresh: fetchItems,
    schedule,
    unschedule,
    reschedule,
    getItemsForDateRange,
    exportIcal,
  };
}
