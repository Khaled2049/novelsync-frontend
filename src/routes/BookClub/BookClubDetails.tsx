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
  Edit,
  Save,
  X,
} from "lucide-react";
import { bookClubRepo } from "./bookClubRepo";
import { useAuthContext } from "@/contexts/AuthContext";
import BookClubChat from "./BookClubChat";
import ReadingScheduleSection from "./components/ReadingScheduleSection";
import DiscussionPromptsSection from "./components/DiscussionPromptsSection";
import PollsSection from "./components/PollsSection";
import ReadingProgressTracker from "./components/ReadingProgressTracker";
import { SEOHead } from "@/components/seo/SEOHead";
import { getAbsoluteUrl, APP_NAME } from "@/config/seo";
import { useBookClub } from "@/hooks/queries/useBookClubQueries";
import { publicProfileService } from "@/services/PublicProfileService";

interface MemberInfo {
  id: string;
  username: string;
}

const BookClubDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuthContext();
  const { data: clubData, isPending: isLoading } = useBookClub(id);
  const club = clubData ?? undefined;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [userCurrentChapter, setUserCurrentChapter] = useState<number>(0);
  const previousMemberIdsRef = useRef<string>("");
  const [isEditingMeetup, setIsEditingMeetup] = useState(false);
  const [meetupDraft, setMeetupDraft] = useState("");
  const [isSavingMeetup, setIsSavingMeetup] = useState(false);
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false);


  // Fetch usernames for member IDs
  useEffect(() => {
    let isMounted = true;

    const fetchMemberUsernames = async () => {
      if (!club?.members || club.members.length === 0) {
        if (previousMemberIdsRef.current !== "") {
          if (isMounted) setMembers([]);
          previousMemberIdsRef.current = "";
        }
        return;
      }

      const memberIdsString = [...club.members].sort().join(",");
      if (memberIdsString === previousMemberIdsRef.current) return;
      previousMemberIdsRef.current = memberIdsString;

      if (isMounted) setLoadingMembers(true);
      try {
        const profileMap = await publicProfileService.getPublicProfiles(club.members);
        const memberInfos = club.members.map((memberId) => {
          const profile = profileMap.get(memberId);
          return {
            id: memberId,
            username: profile?.username || profile?.displayName || "Unknown User",
          };
        });
        if (isMounted) setMembers(memberInfos);
      } catch {
        console.error("Error fetching member usernames");
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    };

    fetchMemberUsernames();
    return () => { isMounted = false; };
  }, [club?.members?.length, club?.members]);

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
  const isMember = user ? club?.members?.includes(user.uid) : false;

  const handleMembershipToggle = async () => {
    if (!club || !user || isUpdatingMembership) return;
    setIsUpdatingMembership(true);
    try {
      if (isMember) {
        await bookClubRepo.leaveBookClub(club.id, user.uid);
      } else {
        await bookClubRepo.joinBookClub(club.id, user.uid);
      }
    } catch (error) {
      console.error("Failed to update membership:", error);
    } finally {
      setIsUpdatingMembership(false);
    }
  };

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
            className="md:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
            onClick={() => setIsSidebarExpanded(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — mobile: fixed drawer (translate only, always in DOM); desktop: relative push */}
        <aside
          className={`
            w-72 fixed md:relative h-full shrink-0
            border-r border-neutral-200 dark:border-neutral-800
            bg-white dark:bg-neutral-900 z-30 md:z-auto
            transition-all duration-300 ease-in-out overflow-hidden
            ${isSidebarExpanded
              ? "translate-x-0 md:w-72"
              : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0"
            }
          `}
        >
          <div className="p-4 md:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-base md:text-lg font-ui font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Users
                className="text-dark-green dark:text-light-green w-4 h-4 md:w-5 md:h-5"
                size={16}
              />
              {isSidebarExpanded && (
                <>
                  <span>Members</span>
                  <span className="text-xs font-normal text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
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
                      className="group flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 rounded-lg"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 font-semibold text-sm rounded-full shrink-0 relative">
                        {member.username.charAt(0).toUpperCase()}
                        {isAdmin && (
                          <div className="absolute -top-1 -right-1 bg-dark-green dark:bg-light-green rounded-full p-0.5">
                            <Crown size={9} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate group-hover:text-dark-green dark:group-hover:text-light-green transition-colors">
                            {member.username}
                          </p>
                          {isAdmin && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-dark-green/10 dark:bg-light-green/10 text-dark-green dark:text-light-green border border-dark-green/20 dark:border-light-green/20 shrink-0">
                              <Crown size={8} />
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
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
        {/* Desktop: expand button when sidebar collapsed */}
        {!isSidebarExpanded && (
          <button
            onClick={() => setIsSidebarExpanded(true)}
            className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 border-l-0 hover:text-dark-green dark:hover:text-light-green transition-all rounded-r-lg shadow-sm"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile sticky header — always below navbar (top-16), replaces the broken top-4 button */}
          <div className="md:hidden sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between gap-3">
            <button
              onClick={() => setIsSidebarExpanded(true)}
              className="flex items-center gap-1.5 text-xs font-ui font-medium text-neutral-600 dark:text-neutral-400 hover:text-dark-green dark:hover:text-light-green transition-colors"
            >
              <Users size={14} />
              <span>Members ({club.members?.length || 0})</span>
            </button>
            <p className="text-xs font-ui font-medium text-neutral-900 dark:text-white truncate flex-1 text-right">
              {club.name}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Chat toggle — desktop only floating button */}
            {!isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="hidden md:flex absolute top-6 right-6 z-10 p-2 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:text-dark-green dark:hover:text-light-green transition-all hover:scale-110 rounded-lg shadow-sm"
                title="Open Discussion"
              >
                <PanelRightOpen size={18} />
              </button>
            )}

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 lg:px-12">
              {/* Club Hero */}
              <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 md:p-8 mb-4 sm:mb-8 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm transition-colors duration-300">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2 sm:mb-3">
                  <h1 className="text-lg sm:text-3xl md:text-4xl font-serif font-bold text-neutral-900 dark:text-white">
                    {club.name}
                  </h1>
                  {user && !isCreator && (
                    <button
                      onClick={handleMembershipToggle}
                      disabled={isUpdatingMembership}
                      className={`text-[11px] font-ui font-semibold tracking-[0.12em] uppercase px-4 py-2 border transition-colors duration-200 disabled:opacity-50 ${
                        isMember
                          ? "text-dark-green dark:text-light-green border-dark-green dark:border-light-green hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-700"
                          : "text-neutral-900 dark:text-white border-neutral-900 dark:border-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900"
                      }`}
                    >
                      {isUpdatingMembership ? "Working..." : isMember ? "Leave" : "Join"}
                    </button>
                  )}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {club.description}
                </p>
              </div>

              {/* Book of the Month */}
              <section className="mb-4 sm:mb-8">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 text-dark-green dark:text-light-green rounded-lg">
                      <Book size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <h2 className="text-base sm:text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white">
                      Reading Now
                    </h2>
                  </div>

                  {club.bookOfTheMonth ? (
                    <div className="flex gap-4 sm:gap-6 md:gap-8 items-start">
                      {/* Book Cover */}
                      {club.bookOfTheMonth.volumeInfo.imageLinks?.thumbnail && (
                        <div className="relative group shrink-0">
                          <div className="absolute inset-0 bg-neutral-900/20 dark:bg-neutral-100/20 translate-y-3 translate-x-3 blur-md rounded-lg"></div>
                          <img
                            src={club.bookOfTheMonth.volumeInfo.imageLinks.thumbnail}
                            alt={club.bookOfTheMonth.volumeInfo.title}
                            className="w-20 h-30 sm:w-32 sm:h-48 md:w-40 md:h-60 object-cover relative z-10 rounded-lg shadow-lg"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                        <h3 className="text-sm sm:text-lg md:text-xl font-bold text-neutral-900 dark:text-white leading-snug">
                          {club.bookOfTheMonth.volumeInfo.title}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-dark-green dark:text-light-green font-medium font-serif italic">
                          by {club.bookOfTheMonth.volumeInfo.authors?.join(", ")}
                        </p>
                        <div className="w-8 sm:w-12 h-0.5 bg-dark-green dark:bg-light-green"></div>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-4 sm:line-clamp-none">
                          {club.bookOfTheMonth.volumeInfo.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-neutral-400 dark:text-neutral-500 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                      <Book size={28} className="mb-2 opacity-50" />
                      <p className="text-sm">No book selected for this month.</p>
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
              <section className="mb-4 sm:mb-8">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 bg-neutral-100 dark:bg-neutral-800 text-dark-green dark:text-light-green rounded-lg shrink-0">
                        <Calendar size={16} className="sm:w-5 sm:h-5" />
                      </div>
                      <h2 className="text-base sm:text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white truncate">
                        Next Meetup
                      </h2>
                    </div>
                    {isCreator && !isEditingMeetup && (
                      <button
                        onClick={() => {
                          setMeetupDraft(club.meetUp ?? "");
                          setIsEditingMeetup(true);
                        }}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-dark-green dark:hover:text-light-green hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                        title="Edit meetup details"
                      >
                        <Edit size={15} />
                      </button>
                    )}
                  </div>

                  {isEditingMeetup ? (
                    <div className="space-y-3">
                      <textarea
                        value={meetupDraft}
                        onChange={(e) => setMeetupDraft(e.target.value)}
                        rows={3}
                        placeholder="e.g. Saturday June 14 at 7pm — Zoom link: ..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green resize-none"
                        disabled={isSavingMeetup}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setIsSavingMeetup(true);
                            try {
                              await bookClubRepo.updateMeetUp(club.id, meetupDraft.trim());
                              setIsEditingMeetup(false);
                            } catch (e) {
                              console.error("Failed to save meetup:", e);
                            } finally {
                              setIsSavingMeetup(false);
                            }
                          }}
                          disabled={isSavingMeetup}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-dark-green dark:bg-light-green text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <Save size={13} />
                          {isSavingMeetup ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setIsEditingMeetup(false)}
                          disabled={isSavingMeetup}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : club.meetUp ? (
                    <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 flex items-start gap-3 rounded-lg">
                      <div className="w-1 bg-dark-green dark:bg-light-green rounded-full self-stretch min-h-[1.5rem] shrink-0"></div>
                      <div>
                        <p className="text-neutral-900 dark:text-white text-sm sm:text-base font-medium whitespace-pre-wrap">
                          {club.meetUp}
                        </p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">
                          Don't forget to bring your notes!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-sm text-neutral-400 dark:text-neutral-500 pl-3 border-l-4 border-neutral-200 dark:border-neutral-800">
                      {isCreator ? "No meetup scheduled yet. Click the edit button to add one." : "No meetup scheduled yet."}
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
                    <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <MessageCircle
                        className="text-dark-green dark:text-light-green w-4 h-4 sm:w-5 sm:h-5"
                        size={16}
                      />
                      Chat Room
                    </h2>
                    {isChatOpen ? (
                      <ChevronUp className="text-dark-green dark:text-light-green w-4 h-4" size={16} />
                    ) : (
                      <ChevronDown className="text-dark-green dark:text-light-green w-4 h-4" size={16} />
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
