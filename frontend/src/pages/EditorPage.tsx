import { useParams } from "react-router-dom";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Main Editor */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {id === "new" ? "New Content" : "Edit Content"}
        </h2>
        <p className="text-sm text-gray-500">
          Content editor will be implemented here.
        </p>
      </div>
      {/* Validation Panel - Fixed Right */}
      <div className="w-96 border-l bg-gray-50 overflow-y-auto p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation</h3>
        <p className="text-sm text-gray-500">
          Validation panel will appear here after content is generated.
        </p>
      </div>
    </div>
  );
}
