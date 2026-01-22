import { Outlet, useLocation, Link } from "react-router-dom";

import { ListTodo, Trophy, BookOpen, Megaphone, Users } from "lucide-react";
import AllStories from "./AllStories";
import Home from "../Home";

import BookLists from "@/components/explore/BookLists";
import Announcements from "@/components/explore/Announcements";
import Competitions from "@/components/explore/Competitions";

interface Tab {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: "stories",
    label: "Stories",
    icon: <BookOpen className="w-5 h-5" />,
    component: <AllStories />,
    path: "/explore/stories",
  },
  {
    id: "community",
    label: "Community",
    icon: <Users className="w-5 h-5" />,
    component: <Home />,
    path: "/explore/community",
  },
  {
    id: "book-lists",
    label: "Book Lists",
    icon: <ListTodo className="w-5 h-5" />,
    component: <BookLists />,
    path: "/explore/book-lists",
  },
  {
    id: "Announcements",
    label: "Announcements",
    icon: <Megaphone className="w-5 h-5" />,
    component: <Announcements />,
    path: "/explore/announcements",
  },
  {
    id: "competitions",
    label: "Competitions",
    icon: <Trophy className="w-5 h-5" />,
    component: <Competitions />,
    path: "/explore/competitions",
  },
];

const StoriesLayout = () => {
  const location = useLocation();

  return (
    <div className="h-full bg-neutral-50 dark:bg-black ">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="w-full mb-4 sm:mb-8">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex flex-col space-y-2 sm:space-y-4 py-2 sm:py-4">
              {/* Main navigation */}
              <nav className="flex justify-start sm:justify-center space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-2 sm:mx-0 px-2 sm:px-0 touch-pan-x">
                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`
                      flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2 sm:py-2 rounded-md text-xs sm:text-sm font-medium
                      transition-colors duration-200 ease-in-out min-w-fit whitespace-nowrap snap-start
                      touch-manipulation
                      ${
                        tab.path === location.pathname ||
                        (location.pathname === "/stories" &&
                          tab.path === "/stories")
                          ? "bg-dark-green dark:bg-light-green text-white"
                          : "text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-neutral-50/10 active:bg-black/20 dark:active:bg-neutral-50/20"
                      }
                    `}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default StoriesLayout;
