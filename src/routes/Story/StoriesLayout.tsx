import { Outlet, useLocation, Link } from "react-router-dom";
import { Trophy, BookOpen, Megaphone, Users, Book } from "lucide-react";

interface Tab {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: "stories",
    label: "Stories",
    icon: <BookOpen className="w-4 h-4" />,
    path: "/explore/stories",
  },
  {
    id: "community",
    label: "Community",
    icon: <Users className="w-4 h-4" />,
    path: "/explore/community",
  },
  {
    id: "competitions",
    label: "Competitions",
    icon: <Trophy className="w-4 h-4" />,
    path: "/explore/competitions",
  },
  {
    id: "book-clubs",
    label: "Book Clubs",
    icon: <Book className="w-4 h-4" />,
    path: "/explore/book-clubs",
  },
  {
    id: "announcements",
    label: "Announcements",
    icon: <Megaphone className="w-4 h-4" />,
    path: "/explore/announcements",
  },
];

const StoriesLayout = () => {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ||
    (location.pathname === "/explore" && path === "/explore/stories");

  return (
    <div className="min-h-full bg-ns-bg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-4">
        <div className="flex gap-6 pt-6 pb-10">
          {/* Desktop left sidebar nav */}
          <aside className="hidden lg:flex w-40 shrink-0">
            <div className="sticky top-20 pt-8">
              <div className="mb-4 px-3">
                <span className="font-ui text-[10px] tracking-[0.2em] uppercase text-ns-ink-muted">
                  Explore
                </span>
                <div className="mt-2 h-px bg-ns-border" />
              </div>
              <nav className="flex flex-col gap-0.5">
                {tabs.map((tab) => {
                  const active = isActive(tab.path);
                  return (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      className={`
                        group flex items-center gap-2.5 px-3 py-2 rounded-ns text-sm font-ui font-medium
                        transition-all duration-150
                        ${
                          active
                            ? "bg-ns-accent text-white shadow-ns-sm"
                            : "text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink"
                        }
                      `}
                    >
                      <span
                        className={`shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`}
                      >
                        {tab.icon}
                      </span>
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile / tablet horizontal scroll strip */}
            <div className="lg:hidden mb-4">
              <nav className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
                {tabs.map((tab) => {
                  const active = isActive(tab.path);
                  return (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full border
                        text-xs font-ui font-medium whitespace-nowrap shrink-0
                        transition-all duration-150 touch-manipulation
                        ${
                          active
                            ? "bg-ns-accent border-ns-accent text-white shadow-ns-sm"
                            : "bg-ns-surface border-ns-border text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink"
                        }
                      `}
                    >
                      <span className={active ? "opacity-90" : "opacity-50"}>
                        {tab.icon}
                      </span>
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoriesLayout;
