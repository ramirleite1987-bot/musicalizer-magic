import { X } from "lucide-react";
import { Badge } from "./ui/badge/Badge";

const AVAILABLE_CHANNELS = [
  { id: "youtube", label: "YouTube" },
  { id: "blog", label: "Blog" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
] as const;

interface ChannelSelectorProps {
  selected: string[];
  onChange: (channels: string[]) => void;
  disabled?: boolean;
}

export function ChannelSelector({ selected, onChange, disabled = false }: ChannelSelectorProps) {
  const toggle = (channelId: string) => {
    if (disabled) return;
    if (selected.includes(channelId)) {
      onChange(selected.filter((id) => id !== channelId));
    } else {
      onChange([...selected, channelId]);
    }
  };

  const removeChannel = (channelId: string) => {
    if (disabled) return;
    onChange(selected.filter((id) => id !== channelId));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Channels</label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((channelId) => {
            const channel = AVAILABLE_CHANNELS.find((c) => c.id === channelId);
            return (
              <Badge key={channelId} variant="secondary" className="gap-1 pr-1">
                {channel?.label ?? channelId}
                {!disabled && (
                  <button
                    onClick={() => removeChannel(channelId)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-gray-300"
                    aria-label={`Remove ${channel?.label ?? channelId}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_CHANNELS.map((channel) => {
          const isSelected = selected.includes(channel.id);
          return (
            <button
              key={channel.id}
              onClick={() => toggle(channel.id)}
              disabled={disabled}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {channel.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
