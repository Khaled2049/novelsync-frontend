import React from "react";
import { Link } from "react-router-dom";
import { IUser } from "@/types/IUser";
import { useBookClubs } from "@/hooks/queries/useBookClubQueries";

interface CommunitySidebarProps {
  currentUser: IUser;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ currentUser }) => {
  const { data: bookClubs = [] } = useBookClubs(true);

  const joinedClubs = bookClubs.filter((club) =>
    club.members?.includes(currentUser.uid),
  );

  return (
    <div>
      <h2 className="flex items-center h-9 mb-3 border-b border-ns-border font-ui text-[11px] tracking-[1.5px] uppercase text-ns-ink-muted">
        Your book clubs
      </h2>

      {joinedClubs.length === 0 ? (
        <p className="px-1 py-2 font-ui text-sm text-ns-ink-muted leading-snug">
          You haven&rsquo;t joined any book clubs yet.
        </p>
      ) : (
        <nav className="flex flex-col">
          {joinedClubs.map((club) => (
            <Link
              key={club.id}
              to={`/book-clubs/${club.id}`}
              className="flex items-center gap-2.5 px-1 py-2 font-ui text-sm text-ns-ink no-underline hover:text-ns-accent transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full bg-ns-accent shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{club.name}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};

export default CommunitySidebar;
