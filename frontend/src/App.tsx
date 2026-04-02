import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Home, FileText, Calendar } from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { ContentListPage } from "./pages/ContentListPage";
import { EditorPage } from "./pages/EditorPage";
import { CalendarPage } from "./pages/CalendarPage";

function NavLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  const location = useLocation();
  const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center gap-8">
        <Link to="/" className="text-xl font-semibold text-gray-900">
          Verbum
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" icon={Home} label="Dashboard" />
          <NavLink to="/content" icon={FileText} label="Content" />
          <NavLink to="/calendar" icon={Calendar} label="Calendar" />
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/content" element={<ContentListPage />} />
          <Route path="/content/:id" element={<EditorPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
