import { Music } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-md">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-lg">Musicalizer Magic</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-9 bg-muted/50 rounded-md animate-pulse" />
          <div className="h-8 bg-muted/50 rounded-md animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted/30 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-border flex items-center px-6">
          <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading tracks...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
