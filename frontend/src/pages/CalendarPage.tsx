import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card/Card";

export function CalendarPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Editorial Calendar</h2>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Calendar view will be implemented here. Schedule content for publishing across channels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
