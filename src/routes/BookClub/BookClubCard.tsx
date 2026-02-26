import { useNavigate } from "react-router-dom";
import { IClub } from "@/types/IClub";
import { Edit, Trash2, ArrowUpRight } from "lucide-react";

interface BookClubCardProps {
  club: IClub;
  joined: boolean;
  index: number;
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
  index,
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
    <article
      onClick={handleCardClick}
      className="group relative cursor-pointer border-b border-neutral-200 dark:border-neutral-800 py-8 md:py-10 transition-colors duration-300 hover:border-dark-green dark:hover:border-light-green"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 h-full w-[2px] bg-dark-green dark:bg-light-green origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />

      <div className="flex items-start gap-5 md:gap-8 pl-5 md:pl-7">
        {/* Index number */}
        <span className="font-mono text-[11px] text-neutral-300 dark:text-neutral-700 pt-2 shrink-0 select-none">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Category overline */}
          <p className="font-ui text-[10px] font-semibold tracking-[0.18em] uppercase text-dark-green dark:text-light-green mb-2">
            {club.category || "General"}
          </p>

          {/* Club name */}
          <h2 className="font-heading text-2xl md:text-[2rem] lg:text-[2.5rem] font-light italic leading-[1.15] text-neutral-900 dark:text-neutral-50 mb-3 group-hover:text-dark-green dark:group-hover:text-light-green transition-colors duration-300">
            {club.name}
          </h2>

          {/* Description */}
          <p className="font-body text-[0.9rem] md:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 max-w-2xl mb-5">
            {club.description}
          </p>

          {/* Metadata row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] font-ui text-neutral-400 dark:text-neutral-600">
            <span>
              {club.members.length}{" "}
              {club.members.length === 1 ? "member" : "members"}
            </span>
            <span className="w-[3px] h-[3px] rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span>{club.activity}</span>
            {club.bookOfTheMonth?.volumeInfo.title && (
              <>
                <span className="w-[3px] h-[3px] rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="italic truncate max-w-[200px]">
                  Reading: {club.bookOfTheMonth.volumeInfo.title}
                </span>
              </>
            )}
            {club.meetUp && (
              <>
                <span className="w-[3px] h-[3px] rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span>{club.meetUp}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="shrink-0 flex flex-col items-end justify-between gap-4 self-stretch py-1">
          {/* Admin actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => handleButtonClick(e, onEdit)}
              className="p-1.5 text-neutral-400 hover:text-dark-green dark:hover:text-light-green transition-colors"
              title="Edit Club"
            >
              <Edit size={13} />
            </button>
            <button
              onClick={(e) => handleButtonClick(e, onDelete)}
              className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
              title="Delete Club"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Join / Member + arrow */}
          <div className="flex items-center gap-3 mt-auto">
            {!joined ? (
              <button
                onClick={(e) => handleButtonClick(e, () => onJoin(club.id))}
                className="text-[11px] font-ui font-semibold tracking-[0.12em] uppercase text-neutral-900 dark:text-white border border-neutral-900 dark:border-white px-4 py-2 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors duration-200"
              >
                Join
              </button>
            ) : (
              <button
                onClick={(e) => handleButtonClick(e, () => onLeave(club.id))}
                className="text-[11px] font-ui font-semibold tracking-[0.12em] uppercase text-dark-green dark:text-light-green border border-dark-green dark:border-light-green px-4 py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-700 transition-colors duration-200"
              >
                Member
              </button>
            )}
            <ArrowUpRight
              size={16}
              className="text-neutral-300 dark:text-neutral-700 group-hover:text-dark-green dark:group-hover:text-light-green transition-colors duration-300"
            />
          </div>
        </div>
      </div>
    </article>
  );
};

export default BookClubCard;
