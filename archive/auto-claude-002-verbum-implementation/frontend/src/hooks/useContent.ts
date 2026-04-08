import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { ContentItem, ContentStatus, ContentType, PaginatedResponse } from "../types/content";

interface ContentFilters {
  status?: ContentStatus | "";
  content_type?: ContentType | "";
  page?: number;
  page_size?: number;
}

interface UseContentReturn {
  items: ContentItem[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: ContentFilters;
  setFilters: (filters: ContentFilters) => void;
  refresh: () => Promise<void>;
  getById: (id: string) => Promise<ContentItem>;
  create: (data: Partial<ContentItem>) => Promise<ContentItem>;
  update: (id: string, data: Partial<ContentItem>) => Promise<ContentItem>;
  remove: (id: string) => Promise<void>;
  transition: (id: string, status: ContentStatus) => Promise<ContentItem>;
}

export function useContent(initialFilters: ContentFilters = {}): UseContentReturn {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContentFilters>({
    page: 1,
    page_size: 20,
    ...initialFilters,
  });

  const buildParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.content_type) params.content_type = filters.content_type;
    if (filters.page) params.page = String(filters.page);
    if (filters.page_size) params.page_size = String(filters.page_size);
    return params;
  }, [filters]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PaginatedResponse<ContentItem>>(
        "/content",
        buildParams()
      );
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch content";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const getById = useCallback(async (id: string): Promise<ContentItem> => {
    return api.get<ContentItem>(`/content/${id}`);
  }, []);

  const create = useCallback(async (data: Partial<ContentItem>): Promise<ContentItem> => {
    const item = await api.post<ContentItem>("/content", data);
    void fetchItems();
    return item;
  }, [fetchItems]);

  const update = useCallback(async (id: string, data: Partial<ContentItem>): Promise<ContentItem> => {
    const item = await api.put<ContentItem>(`/content/${id}`, data);
    void fetchItems();
    return item;
  }, [fetchItems]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/content/${id}`);
    void fetchItems();
  }, [fetchItems]);

  const transition = useCallback(async (id: string, status: ContentStatus): Promise<ContentItem> => {
    const item = await api.post<ContentItem>(`/content/${id}/transition`, { status });
    void fetchItems();
    return item;
  }, [fetchItems]);

  return {
    items,
    total,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchItems,
    getById,
    create,
    update,
    remove,
    transition,
  };
}
