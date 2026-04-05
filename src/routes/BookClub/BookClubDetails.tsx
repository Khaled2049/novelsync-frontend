import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Book,
  Calendar,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight,
  Crown,
} from "lucide-react";
import { IClub } from "../../types/IClub";
import { bookClubRepo } from "./bookClubRepo";
import { useAuthContext } from "@/contexts/AuthContext";
import BookClubChat from "./BookClubChat";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import ReadingScheduleSection from "./components/ReadingScheduleSection";
import DiscussionPromptsSection from "./components/DiscussionPromptsSection";
import PollsSection from "./components/PollsSection";
import ReadingProgressTracker from "./components/ReadingProgressTracker";
import { SEOHead } from "@/components/seo/SEOHead";
import { getAbsoluteUrl, APP_NAME } from "@/config/seo";

interface MemberInfo {
  id: string;
  username: string;
}

const BookClubDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuthContext();
  const [club, setClub] = useState<IClub | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [userCurrentChapter, setUserCurrentChapter] = useState<number>(0);
  const previousMemberIdsRef = useRef<string>("");

  // Real-time subscription to club data
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = bookClubRepo.subscribeToBookClub(id, (clubData) => {
      if (clubData) {
        setClub(clubData);
      } else {
        setClub(undefined);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Fetch usernames for member IDs
  useEffect(() => {
    const fetchMemberUsernames = async () => {
      if (!club?.members || club.members.length === 0) {
        if (previousMemberIdsRef.current !== "") {
          setMembers([]);
          previousMemberIdsRef.current = "";
        }
        return;
      }

      // Create a stable string representation of member IDs for comparison
      const memberIdsString = [...club.members].sort().join(",");

      // Check if member IDs have actually changed
      if (memberIdsString === previousMemberIdsRef.current) {
        return; // Members haven't changed, skip fetching
      }

      // Update ref before fetching to prevent duplicate calls
      previousMemberIdsRef.current = memberIdsString;

      setLoadingMembers(true);
      try {
        const memberPromises = club.members.map(async (memberId) => {
          try {
            const userRef = doc(firestore, "users", memberId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              return {
                id: memberId,
                username:
                  userData.username || userData.displayName || "Unknown User",
              };
            }
            return {
              id: memberId,
              username: "Unknown User",
            };
          } catch (error) {
            console.error(`Error fetching user ${memberId}:`, error);
            return {
              id: memberId,
              username: "Unknown User",
            };
          }
        });

        const memberInfos = await Promise.all(memberPromises);
        setMembers(memberInfos);
      } catch (error) {
        console.error("Error fetching member usernames:", error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMemberUsernames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club?.members?.length, club?.members]); // Only re-fetch if member IDs actually change

  // Fetch user's reading progress
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!id || !user) {
        setUserCurrentChapter(0);
        return;
      }

      try {
        const progress = await bookClubRepo.getMemberProgress(id, user.uid);
        if (progress) {
          setUserCurrentChapter(progress.currentChapter);
        } else {
          setUserCurrentChapter(0);
        }
      } catch (error) {
        console.error("Error fetching user progress:", error);
      }
    };

    fetchUserProgress();
  }, [id, user, club?.id]); // Update when club changes

  const isCreator = user ? club?.creatorId === user.uid : false;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dark-green dark:border-light-green border-t-transparent animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-serif text-neutral-900 dark:text-white">
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-neutral-900 dark:text-white">
            Club not found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${club.name} Book Club`}
        description={club.description}
        keywords={[club.category, club.activity, "book club", "reading group"]}
        image={club.image}
        url={`/book-clubs/${club.id}`}
        type="website"
        canonical={`/book-clubs/${club.id}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: club.name,
          description: club.description,
          image: club.image
            ? getAbsoluteUrl(club.image)
            : getAbsoluteUrl("/book.svg"),
          url: getAbsoluteUrl(`/book-clubs/${club.id}`),
          memberOf: {
            "@type": "Organization",
            name: APP_NAME,
          },
        }}
      />
      <div className="flex w-full h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
        {/* Mobile Overlay */}
        {isSidebarExpanded && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-10 transition-opacity duration-300"
            onClick={() => setIsSidebarExpanded(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Toggle Button (Mobile) */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:text-dark-green dark:hover:text-light-green transition-all rounded-lg shadow-sm"
          aria-label="Toggle sidebar"
        >
          {isSidebarExpanded ? (
            <ChevronLeft size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>

        {/* Sidebar */}
        <aside
          className={`${
            isSidebarExpanded
              ? "w-[280px] sm:w-80 md:w-80 translate-x-0"
              : "-translate-x-full w-0"
          } fixed md:relative h-full border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-20 transition-all duration-300 ease-in-out overflow-hidden ${
            isSidebarExpanded ? "block" : "hidden md:block"
          }`}
        >
          <div className="p-3 sm:p-4 md:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white flex items-center gap-2 sm:gap-3">
              <Users
                className="text-dark-green dark:text-light-green w-5 h-5 sm:w-6 sm:h-6"
                size={20}
              />
              {isSidebarExpanded && (
                <>
                  <span className="hidden sm:inline">Members</span>
                  <span className="sm:hidden">Members</span>
                  <span className="text-xs sm:text-sm font-sans font-normal text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 sm:px-2 py-0.5 rounded">
                    {club.members?.length || 0}
                  </span>
                </>
              )}
            </h2>
            {/* Desktop Toggle Button */}
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="hidden md:flex p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
              aria-label="Toggle sidebar"
            >
              {isSidebarExpanded ? (
                <ChevronLeft
                  size={20}
                  className="text-neutral-600 dark:text-neutral-400"
                />
              ) : (
                <ChevronRight
                  size={20}
                  className="text-neutral-600 dark:text-neutral-400"
                />
              )}
            </button>
          </div>

          {isSidebarExpanded && (
            <div className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
              {loadingMembers ? (
                <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-neutral-400 dark:text-neutral-500">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-dark-green dark:border-light-green border-t-transparent animate-spin rounded-full mb-2"></div>
                  <p className="text-xs sm:text-sm">Loading members...</p>
                </div>
              ) : members && members.length > 0 ? (
                members.map((member) => {
                  const isAdmin = member.id === club.creatorId;
                  return (
                    <div
                      key={member.id}
                      className="group flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 rounded-lg"
                    >
                      {/* Avatar Placeholder */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 font-bold text-base sm:text-lg rounded-full shrink-0 relative">
                        {member.username.charAt(0).toUpperCase()}
                        {isAdmin && (
                          <div className="absolute -top-1 -right-1 bg-dark-green dark:bg-light-green rounded-full p-0.5">
                            <Crown
                              size={12}
                              className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5"
                            />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white truncate group-hover:text-dark-green dark:group-hover:text-light-green transition-colors">
                            {member.username}
                          </p>
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-dark-green/10 dark:bg-light-green/10 text-dark-green dark:text-light-green border border-dark-green/20 dark:border-light-green/20">
                              <Crown size={10} className="w-2.5 h-2.5" />
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {isAdmin ? "Creator" : "Member"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-neutral-400 dark:text-neutral-500">
                  <User size={32} className="sm:w-12 sm:h-12 mb-2 opacity-20" />
                  <p className="text-sm sm:text-base italic">No members yet</p>
                </div>
              )}

              {/* Reading Progress Tracker */}
              {club && (
                <ReadingProgressTracker
                  clubId={club.id}
                  members={members}
                  currentUserChapter={userCurrentChapter}
                />
              )}
            </div>
          )}
        </aside>

        {/* Sidebar Expand Button (when collapsed) */}
        {!isSidebarExpanded && (
          <button
            onClick={() => setIsSidebarExpanded(true)}
            className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:text-dark-green dark:hover:text-light-green transition-all rounded-lg shadow-sm"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <main className="flex-1 flex flex-col overflow-hidden md:ml-0">
          <div className="flex-1 overflow-y-auto">
            {/* Chat Toggle Button (Visible when chat is closed) */}
            {!isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="fixed md:absolute top-20 md:top-6 right-4 md:right-6 z-30 p-2 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:text-dark-green dark:hover:text-light-green transition-all hover:scale-110 rounded-lg shadow-sm"
                title="Open Discussion"
              >
                <PanelRightOpen size={20} />
              </button>
            )}

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:px-12">
              {/* Club Hero */}
              <div className="bg-white dark:bg-neutral-900 p-4 sm:p-8 md:p-10 mb-6 sm:mb-10 relative overflow-hidden group border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm transition-colors duration-300">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold mb-3 sm:mb-4 text-neutral-900 dark:text-white">
                  {club.name}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed max-w-2xl font-medium">
                  {club.description}
                </p>
              </div>

              {/* Book of the Month */}
              <section className="mb-6 sm:mb-10">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
                    <div className="p-2 sm:p-3 bg-neutral-100 dark:bg-neutral-800 text-dark-green dark:text-light-green rounded-lg">
                      <Book size={20} className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-neutral-900 dark:text-white">
                      Reading Now
                    </h2>
                  </div>

                  {club.bookOfTheMonth ? (
                    <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-start">
                      {/* Book Cover with 3D effect */}
                      {club.bookOfTheMonth.volumeInfo.imageLinks?.thumbnail && (
                        <div className="relative group mx-auto md:mx-0 shrink-0 perspective-1000">
                          <div className="absolute inset-0 bg-neutral-900/20 dark:bg-neutral-100/20 translate-y-4 translate-x-4 blur-md rounded-lg"></div>
                          <img
                            src={
                              club.bookOfTheMonth.volumeInfo.imageLinks
                                .thumbnail
                            }
                            alt={club.bookOfTheMonth.volumeInfo.title}
                            className="w-32 h-48 sm:w-40 sm:h-60 md:w-48 md:h-72 object-cover relative z-10 transform group-hover:-rotate-y-6 transition-transform duration-500 rounded-lg shadow-lg"
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 sm:space-y-3 md:space-y-4 pt-0 sm:pt-2">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white leading-tight">
                          {club.bookOfTheMonth.volumeInfo.title}
                        </h3>
                        <p className="text-base sm:text-lg md:text-xl text-dark-green dark:text-light-green font-medium font-serif italic">
                          by{" "}
                          {club.bookOfTheMonth.volumeInfo.authors?.join(", ")}
                        </p>
                        <div className="w-12 sm:w-16 h-1 bg-dark-green dark:bg-light-green my-2 sm:my-3 md:my-4"></div>
                        <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {club.bookOfTheMonth.volumeInfo.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-neutral-400 dark:text-neutral-500 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                      <Book
                        size={32}
                        className="sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-50"
                      />
                      <p className="text-base sm:text-lg">
                        No book selected for this month.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Reading Schedule */}
              <ReadingScheduleSection club={club} isCreator={isCreator} />

              {/* Discussion Prompts */}
              <DiscussionPromptsSection
                club={club}
                isCreator={isCreator}
                userCurrentChapter={userCurrentChapter}
              />

              {/* Polls */}
              <PollsSection club={club} isCreator={isCreator} />

              {/* Meetup Schedule */}
              <section className="mb-6 sm:mb-10">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-neutral-100 dark:bg-neutral-800 text-dark-green dark:text-light-green rounded-lg">
                      <Calendar size={20} className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-neutral-900 dark:text-white">
                      Next Meetup
                    </h2>
                  </div>

                  {club.meetUp ? (
                    <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 rounded-lg">
                      <div className="h-full w-1 bg-dark-green dark:bg-light-green rounded-full"></div>
                      <div>
                        <p className="text-neutral-900 dark:text-white text-base sm:text-lg font-medium">
                          {club.meetUp}
                        </p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-1">
                          Don't forget to bring your notes!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-sm sm:text-base text-neutral-400 dark:text-neutral-500 pl-3 sm:pl-4 border-l-4 border-neutral-200 dark:border-neutral-800">
                      No meetup scheduled yet.
                    </p>
                  )}
                </div>
              </section>
              {user && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-6 rounded-2xl shadow-sm">
                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
                  >
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-neutral-900 dark:text-white flex items-center">
                      <MessageCircle
                        className="mr-2 sm:mr-3 text-dark-green dark:text-light-green w-5 h-5 sm:w-7 sm:h-7"
                        size={20}
                      />
                      Chat Room
                    </h2>
                    {isChatOpen ? (
                      <ChevronUp
                        className="text-dark-green dark:text-light-green w-5 h-5 sm:w-7 sm:h-7"
                        size={20}
                      />
                    ) : (
                      <ChevronDown
                        className="text-dark-green dark:text-light-green w-5 h-5 sm:w-7 sm:h-7"
                        size={20}
                      />
                    )}
                  </button>
                  {isChatOpen && (
                    <div className="p-4 sm:p-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                      <BookClubChat
                        clubId={club.id}
                        user={user}
                        userCurrentChapter={userCurrentChapter}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BookClubDetails;
