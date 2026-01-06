import { useEffect, useState } from "react";
import { Book, Plus } from "lucide-react";
import BookClubCard from "./BookClubCard";
import { IClub } from "../../types/IClub";
import CreateBookClub from "./CreateBookClub";
import UpdateBookClub from "./UpdateBookClub";

import { useAuthContext } from "../../contexts/AuthContext";
import { bookClubRepo } from "./bookClubRepo";
import SignInPrompt from "../../components/SignInPrompt";

const BookClubs = () => {
  const { user } = useAuthContext();

  const [bookClubs, setBookClubs] = useState<IClub[]>([]);

  useEffect(() => {
    // fetch book clubs
    const fetchBookClubs = async () => {
      const clubs = await bookClubRepo.getBookClubs();
      if (clubs) {
        setBookClubs(clubs);
      }
    };
    fetchBookClubs();
  }, []);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedClub, setSelectedClub] = useState<IClub | null>(null);

  const handleCreateClub = async (newClub: IClub) => {
    if (user) {
      newClub.creatorId = user.uid;
    }
    await bookClubRepo.createBookClub(newClub);
    setBookClubs((prevClubs) => [...prevClubs, newClub]);
    setShowCreateForm(false);
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleCancelCreateClub = () => {
    setShowCreateForm(false);
  };

  const handleUpdateClub = (updatedClub: IClub) => {
    bookClubRepo.updateBookClub(updatedClub.id, updatedClub);
    setShowUpdateForm(false);
    setSelectedClub(null);
  };

  const handleShowUpdateForm = (club: IClub) => {
    if (club.creatorId === user?.uid) {
      setSelectedClub(club);
      setShowUpdateForm(true);
    } else {
      alert("You can only update clubs you created.");
    }
  };

  const handleJoinClub = (clubId: string) => {
    if (user) {
      bookClubRepo.joinBookClub(clubId, user.uid);
    } else {
      alert("You must be logged in to join a club.");
    }
  };

  const handleDeleteClub = (club: IClub) => {
    if (club.creatorId === user?.uid) {
      if (window.confirm("Are you sure you want to delete this club?")) {
        bookClubRepo.deleteBookClub(club.id);
      }

      setBookClubs((prevClubs) => prevClubs.filter((c) => c.id !== club.id));
    } else {
      alert("You can only delete clubs you created.");
    }
  };

  const handleLeaveClub = (clubId: string) => {
    if (user) {
      bookClubRepo.leaveBookClub(clubId, user.uid);
    }
  };

  const handleCancelUpdateClub = () => {
    setShowUpdateForm(false);
    setSelectedClub(null);
  };

  if (!user) {
    return (
      <SignInPrompt
        title="Join the Community"
        description="Discover new books, meet fellow readers, and track your reading journey. Sign in to view and join book clubs."
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 py-8 md:px-8">
      {!showCreateForm && !showUpdateForm ? (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                <Book
                  className="text-dark-green dark:text-light-green"
                  size={32}
                />
                Find Your Club
              </h1>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                Browse active communities and start reading together.
              </p>
            </div>

            <button
              onClick={handleShowCreateForm}
              className="group flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95"
            >
              <Plus
                size={20}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              <span>Start a Club</span>
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {bookClubs.map((club: IClub) => (
              <div key={club.id} className="h-full">
                <BookClubCard
                  joined={user ? club.members.includes(user.uid) : false}
                  club={club}
                  onEdit={() => handleShowUpdateForm(club)}
                  onDelete={() => handleDeleteClub(club)}
                  onJoin={() => handleJoinClub(club.id)}
                  onLeave={() => handleLeaveClub(club.id)}
                />
              </div>
            ))}
          </div>

          {bookClubs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                No book clubs found. Be the first to create one!
              </p>
            </div>
          )}
        </div>
      ) : showCreateForm && user ? (
        <div className="max-w-3xl mx-auto mt-8">
          <CreateBookClub
            user={user}
            onCreate={handleCreateClub}
            onCancel={handleCancelCreateClub}
          />
        </div>
      ) : (
        showUpdateForm &&
        selectedClub && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-1 md:p-8 border border-neutral-100 dark:border-neutral-800">
              <UpdateBookClub
                club={selectedClub}
                onUpdate={handleUpdateClub}
                onCancel={handleCancelUpdateClub}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default BookClubs;
