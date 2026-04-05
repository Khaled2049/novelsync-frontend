import { AIUsageProgressBar } from "@/components/common/AIUsageProgressBar";
import { Outlet, NavLink } from "react-router-dom";
import { BookOpen, Layers, Users, MapPin } from "lucide-react";

const NAV_ITEMS = [
  { label: "Editor",     path: "",           icon: BookOpen, end: true  },
  { label: "Plot",       path: "plot",        icon: Layers,   end: false },
  { label: "Characters", path: "characters",  icon: Users,    end: false },
  { label: "Places",     path: "places",      icon: MapPin,   end: false },
] as const;

const Story = () => {
  return (
    <div className="flex h-full bg-ns-bg overflow-hidden">

      {/* ── Left Nav Sidebar ── */}
      <nav className="flex-shrink-0 w-44 bg-ns-surface border-r border-ns-border flex flex-col pt-4 pb-4 px-2 gap-0.5">
        {NAV_ITEMS.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={path}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-ns font-ui text-sm transition-all duration-150 ${
                isActive
                  ? "bg-ns-accent-subtle text-ns-accent font-medium"
                  : "text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink"
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Main Content + AI Usage Bar ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        <AIUsageProgressBar />
      </div>

    </div>
  );
};

export default Story;
