import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button/Button";

export function ContentListPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Content</h2>
        <Button asChild>
          <Link to="/content/new">
            <Plus className="h-4 w-4 mr-2" />
            New Content
          </Link>
        </Button>
      </div>

      <div className="text-sm text-gray-500">
        No content items yet. Create your first piece of content to get started.
      </div>
    </div>
  );
}
