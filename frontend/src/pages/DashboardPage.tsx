import { FileText, CheckCircle, Clock, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card/Card";

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Drafts" value={0} icon={FileText} />
        <StatCard label="Validated" value={0} icon={CheckCircle} />
        <StatCard label="Scheduled" value={0} icon={Clock} />
        <StatCard label="Published" value={0} icon={Send} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No upcoming content scheduled.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Validations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent validations.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
