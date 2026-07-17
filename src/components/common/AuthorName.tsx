import React from "react";
import { useAuthorUsername } from "@/hooks/queries/useUserQueries";

interface AuthorNameProps {
  /** Author uid; the live username is resolved from their public profile. */
  userId?: string;
  /** Stored copy shown while the profile loads or if it has no username. */
  fallback?: string;
  /** Optional prefix rendered before the name, e.g. "@". */
  prefix?: string;
}

/**
 * Renders an author's current username, resolved live from their public profile
 * by uid, as bare text (no wrapper element) so it can sit inside any
 * link/span/heading. Use this for inline list rows where a per-row hook call
 * isn't possible; components that also need the username as a string (e.g. for
 * avatar initials) should call `useAuthorUsername` directly instead.
 */
export const AuthorName: React.FC<AuthorNameProps> = ({
  userId,
  fallback = "",
  prefix = "",
}) => {
  const name = useAuthorUsername(userId, fallback);
  return (
    <>
      {prefix}
      {name}
    </>
  );
};
