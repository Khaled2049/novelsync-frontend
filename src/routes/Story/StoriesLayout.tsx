import { Outlet, useLocation, Link } from "react-router-dom";

import { ListTodo, Trophy, BookOpen, Megaphone } from "lucide-react";
import AllStories from "./AllStories";

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
  // {
  //   id: "categories",
  //   label: "Categories",
  //   path: "/explore/categories",
  //   icon: <Book className="w-5 h-5" />,
  //   component: <Categories />,
  // },
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
      <div className="container mx-auto px-4">
        <div className="w-full mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col space-y-4 py-4">
              {/* Main navigation */}
              <nav className="flex justify-center space-x-4 overflow-x-auto ">
                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`
                  flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                  transition-colors duration-200 ease-in-out min-w-fit
                  ${
                    tab.path === location.pathname ||
                    (location.pathname === "/stories" &&
                      tab.path === "/stories")
                      ? "bg-dark-green dark:bg-light-green text-white"
                      : "text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-neutral-50/10"
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
