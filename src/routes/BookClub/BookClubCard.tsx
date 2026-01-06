import { useNavigate } from "react-router-dom";
import { IClub } from "@/types/IClub";
import { Clock, UserPlus, Users, X, Edit, Trash2 } from "lucide-react";

interface BookClubCardProps {
  club: IClub;
  joined: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onJoin: (clubId: string) => void;
  onLeave: (clubId: string) => void;
}

const BookClubCard = ({
  joined,
  onJoin,
  club,
  onEdit,
  onDelete,
  onLeave,
}: BookClubCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/book-clubs/${club.id}`);
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-2xl shadow-sm hover:shadow-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-300 overflow-hidden group relative cursor-pointer"
    >
      {/* Decorative Top Banner */}
      <div className="h-3 w-full bg-gradient-to-r from-dark-green to-emerald-400 dark:from-light-green dark:to-emerald-600" />

      {/* Admin Actions (Absolute Positioned for cleaner UI) */}
      <div className="absolute top-5 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={(e) => handleButtonClick(e, onEdit)}
          className="p-2 bg-white/90 dark:bg-black/50 backdrop-blur-sm text-neutral-600 dark:text-neutral-300 rounded-full hover:text-dark-green hover:bg-neutral-100 dark:hover:text-light-green border border-transparent hover:border-neutral-200"
          title="Edit Club"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={(e) => handleButtonClick(e, onDelete)}
          className="p-2 bg-white/90 dark:bg-black/50 backdrop-blur-sm text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 border border-transparent hover:border-red-100"
          title="Delete Club"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
            {club.category}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white mb-3 line-clamp-2 group-hover:text-dark-green dark:group-hover:text-light-green transition-colors">
          {club.name}
        </h2>

        {/* Description */}
        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
          {club.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between py-4 border-t border-neutral-100 dark:border-neutral-800 mb-4">
          <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-sm">
            <Users
              size={16}
              className="mr-2 text-dark-green dark:text-light-green"
            />
            <span>
              {club.members.length}{" "}
              {club.members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-sm">
            <Clock
              size={16}
              className="mr-2 text-dark-green dark:text-light-green"
            />
            <span>{club.activity}</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-auto">
          {!joined ? (
            <button
              onClick={(e) => handleButtonClick(e, () => onJoin(club.id))}
              className="w-full py-3 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold flex items-center justify-center hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 shadow-sm"
            >
              <UserPlus size={18} className="mr-2" />
              Join Club
            </button>
          ) : (
            <button
              onClick={(e) => handleButtonClick(e, () => onLeave(club.id))}
              className="w-full py-3 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors duration-200"
            >
              <span className="flex items-center group-hover:hidden">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Member
              </span>
              <span className="hidden group-hover:flex items-center">
                <X size={18} className="mr-2" />
                Leave Club
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookClubCard;
