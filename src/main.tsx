import "./index.css";
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { NavbarWrapper } from "./NavbarWrapper";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AiUsageProvider } from "./contexts/AiUsageContext";
import { Web3Provider } from "./contexts/Web3Provider";
import { ThemeToaster } from "./components/ThemeToaster";
import { SEOProvider } from "./contexts/HelmetProvider";

const Root = lazy(() => import("./routes/root"));
const Signin = lazy(() => import("./routes/Auth/sign-in"));
const Signup = lazy(() => import("./routes/Auth/sign-up"));
const StoryDetail = lazy(() => import("./routes/Story/StoryDetail"));
const BookClubs = lazy(() => import("./routes/BookClub"));
const Home = lazy(() => import("./routes/Home"));
const UserStories = lazy(() => import("./routes/Story/UserStories"));
const AllStories = lazy(() => import("./routes/Story/AllStories"));
const BookClubDetails = lazy(() => import("./routes/BookClub/BookClubDetails"));
const Library = lazy(() => import("./routes/Library"));
const BookDetails = lazy(() => import("./routes/Library/BookDetails"));
const Characters = lazy(() => import("./routes/Story/Characters"));
const Plot = lazy(() => import("./routes/Story/Plot"));
const Places = lazy(() => import("./routes/Story/Places"));
const CreateStory = lazy(() => import("./routes/Story/CreateStory"));
const PrivateRoute = lazy(() => import("./routes/PrivateRoute"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./components/TermsOfUse"));
const ForgotPassword = lazy(() => import("./routes/Auth/forgot-password"));
const StoriesLayout = lazy(() => import("./routes/Story/StoriesLayout"));
const BookLists = lazy(() => import("./components/explore/BookLists"));
const Competitions = lazy(() => import("./components/explore/Competitions"));

const Announcements = lazy(() => import("./components/explore/Announcements"));
const Settings = lazy(() => import("./routes/Settings/Settings"));
const HelpSupport = lazy(() => import("./routes/Help/HelpSupport"));
const UserProfile = lazy(() => import("./routes/Profile/UserProfile"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <NavbarWrapper />,
    children: [
      {
        path: "/",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Root />
          </Suspense>
        ),
      },
      {
        path: "/privacy-policy",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PrivacyPolicy />
          </Suspense>
        ),
      },
      {
        path: "/terms-of-use",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <TermsOfUse />
          </Suspense>
        ),
      },
      {
        path: "/stories",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AllStories />
          </Suspense>
        ),
      },
      {
        path: "/explore",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <StoriesLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <AllStories />
              </Suspense>
            ),
          },
          {
            path: "book-lists",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <BookLists />
              </Suspense>
            ),
          },
          {
            path: "announcements",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Announcements />
              </Suspense>
            ),
          },
          {
            path: "competitions",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Competitions />
              </Suspense>
            ),
          },
          {
            path: "events",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Announcements />
              </Suspense>
            ),
          },
          {
            path: "stories",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <AllStories />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "/library",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Library />
          </Suspense>
        ),
      },
      {
        path: "/library/book/:id",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BookDetails />
          </Suspense>
        ),
      },
      {
        path: "/book-clubs",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BookClubs />
          </Suspense>
        ),
      },
      {
        path: "/book-clubs/:id",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BookClubDetails />
          </Suspense>
        ),
      },
      {
        path: "/Home",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "/sign-in",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Signin />
          </Suspense>
        ),
      },
      {
        path: "/sign-up",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Signup />
          </Suspense>
        ),
      },
      {
        path: "/settings",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        ),
      },
      {
        path: "/profile",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UserProfile />
          </Suspense>
        ),
      },
      {
        path: "/help",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <HelpSupport />
          </Suspense>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ForgotPassword />
          </Suspense>
        ),
      },
      {
        path: "/create/:storyId",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PrivateRoute />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <CreateStory />
              </Suspense>
            ),
          },
          {
            path: "characters",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Characters />
              </Suspense>
            ),
          },
          {
            path: "plot",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Plot />
              </Suspense>
            ),
          },
          {
            path: "places",
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <Places />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "/user-stories",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UserStories />
          </Suspense>
        ),
      },
      {
        path: "/story/:id",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <StoryDetail />
          </Suspense>
        ),
      },
    ],
  },
]);

// Suppress Thirdweb ConnectWallet DialogTitle accessibility warning
// This is a known issue in the Thirdweb library where their ConnectWallet component
// uses Radix UI Dialog internally without properly including a DialogTitle.
// The modalTitle prop is passed but doesn't satisfy Radix UI's accessibility requirements.
// This is a third-party library limitation that we cannot fix directly.
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || "";
    // Only suppress the specific Thirdweb DialogTitle warning
    if (
      typeof message === "string" &&
      message.includes("DialogContent") &&
      message.includes("DialogTitle") &&
      message.includes("screen reader") &&
      message.includes("radix-ui")
    ) {
      // Suppress this specific Thirdweb accessibility warning
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <SEOProvider>
    <Web3Provider>
      <ThemeProvider>
        <AuthProvider>
          <AiUsageProvider>
            <RouterProvider router={router} />
            <ThemeToaster />
          </AiUsageProvider>
        </AuthProvider>
      </ThemeProvider>
    </Web3Provider>
  </SEOProvider>
);
