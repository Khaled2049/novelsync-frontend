import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { PenLine, Users, Layers, Map } from "lucide-react";
import { DemoModeProvider } from "@/contexts/DemoModeContext";

const tabs = [
  { to: "/try", label: "Editor", Icon: PenLine, end: true },
  { to: "/try/characters", label: "Characters", Icon: Users, end: false },
  { to: "/try/plot", label: "Plot", Icon: Layers, end: false },
  { to: "/try/places", label: "Places", Icon: Map, end: false },
];

const DemoEditorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <DemoModeProvider>
      <div className="flex flex-col h-full bg-ns-bg">
        {/* Banner */}
        <div className="flex-shrink-0 bg-ns-accent/10 border-b border-ns-accent/20 px-4 py-2.5 text-center">
          <p className="font-ui text-sm text-ns-ink">
            You&rsquo;re exploring TheTaleTribe.{" "}
            <button
              onClick={() => navigate("/sign-in")}
              className="font-semibold text-ns-accent hover:text-ns-accent-hover underline underline-offset-2 transition-colors"
            >
              Sign in
            </button>{" "}
            to save, publish, and use AI writing tools.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-ns-border bg-ns-surface">
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns font-ui text-xs transition-colors ${
                  isActive
                    ? "bg-ns-accent-subtle text-ns-accent font-medium"
                    : "text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink"
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Active tab content */}
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
    </DemoModeProvider>
  );
};

export default DemoEditorPage;
