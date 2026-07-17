import React, { lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { Briefcase, Calendar, MapPin, User, UserX } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePublicProfile } from "@/hooks/queries/useUserQueries";
import { EditableField } from "@/components/ui/editable-field";
import { SEOHead } from "@/components/seo/SEOHead";

const OwnerSettings = lazy(() => import("./OwnerSettings"));

const formatMemberSince = (isoDate?: string): string | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const PublicUserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading, updateProfile } = useAuthContext();
  const isSelf = !!user && user.uid === userId;

  // usePublicProfile no-ops while signed out; the sign-in prompt below covers it.
  const { data: profile, isLoading: profileLoading } = usePublicProfile(userId);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ns-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ns-accent"></div>
      </div>
    );
  }

  // publicProfiles reads require auth, so ask visitors to sign in first.
  if (!user) {
    return (
      <div className="min-h-screen bg-ns-bg flex items-center justify-center px-4">
        <div className="bg-ns-elevated border border-ns-border rounded-ns-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ns-surface border border-ns-border flex items-center justify-center">
            <User className="w-6 h-6 text-ns-ink-muted" />
          </div>
          <h1 className="font-heading text-xl text-ns-ink mb-2">
            Sign in to view profiles
          </h1>
          <p className="font-body text-sm text-ns-ink-secondary mb-6">
            Member profiles are only visible to signed-in members.
          </p>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center px-4 py-2 rounded-ns bg-ns-accent text-white font-ui text-sm hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ns-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ns-accent"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-ns-bg flex items-center justify-center px-4">
        <div className="text-center">
          <UserX className="w-10 h-10 mx-auto mb-4 text-ns-ink-muted opacity-40" />
          <h1 className="font-heading text-xl text-ns-ink mb-2">
            This profile doesn't exist
          </h1>
          <p className="font-body text-sm text-ns-ink-secondary mb-6">
            The member you're looking for may have changed their account.
          </p>
          <Link
            to="/stories"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns border border-ns-border font-ui text-xs text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink transition-all duration-150"
          >
            Browse stories
          </Link>
        </div>
      </div>
    );
  }

  // Public identity is the @username. For the owner, prefer the live auth value
  // so username edits reflect instantly (the mirrored public doc may lag).
  const username = (isSelf && user?.username) || profile.username;
  const memberSince = formatMemberSince(profile.createdAt);
  // Owners edit occupation/location inline below, so only show them as read-only
  // chips for visitors. "Member since" is shown to everyone.
  const metaItems = [
    !isSelf && profile.occupation
      ? { icon: Briefcase, label: profile.occupation }
      : null,
    !isSelf && profile.location
      ? { icon: MapPin, label: profile.location }
      : null,
    memberSince
      ? { icon: Calendar, label: `Member since ${memberSince}` }
      : null,
  ].filter(Boolean) as { icon: React.ElementType; label: string }[];

  return (
    <div className="min-h-screen bg-ns-bg">
      <SEOHead title={`@${username}'s profile`} noindex />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* ── Header ── */}
        <header className="pb-8 border-b border-ns-border animate-ns-fade-in">
          {/* Avatar on top */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-full bg-ns-surface border border-ns-border shadow-ns-sm overflow-hidden flex items-center justify-center">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-ns-ink-muted" />
            )}
          </div>

          {/* Identity */}
          <div className="flex items-baseline gap-3 flex-wrap mt-5">
            <h1 className="font-heading text-3xl sm:text-4xl text-ns-ink leading-none">
              @{username}
            </h1>
          </div>

          {metaItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
              {metaItems.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 font-ui text-[13px] text-ns-ink-secondary"
                >
                  <Icon className="w-3.5 h-3.5 text-ns-ink-muted" />
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Bio / details below */}
          {isSelf ? (
            <div className="mt-6 space-y-4">
              <EditableField
                label="Username"
                value={user?.username || ""}
                onSave={(v) => updateProfile({ username: v })}
                placeholder="your_username"
                maxLength={20}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <EditableField
                  label="First name"
                  value={user?.firstName || ""}
                  onSave={(v) => updateProfile({ firstName: v })}
                  placeholder="First name"
                  maxLength={50}
                />
                <EditableField
                  label="Last name"
                  value={user?.lastName || ""}
                  onSave={(v) => updateProfile({ lastName: v })}
                  placeholder="Last name"
                  maxLength={50}
                />
              </div>
              <EditableField
                label="Bio"
                value={user?.bio || ""}
                onSave={(v) => updateProfile({ bio: v })}
                placeholder="Write something about yourself…"
                multiline
                maxLength={300}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <EditableField
                  label="Occupation"
                  value={user?.occupation || ""}
                  onSave={(v) => updateProfile({ occupation: v })}
                  placeholder="What do you do?"
                  maxLength={50}
                />
                <EditableField
                  label="Location"
                  value={user?.location || ""}
                  onSave={(v) => updateProfile({ location: v })}
                  placeholder="Where are you based?"
                  maxLength={50}
                />
              </div>
              <EditableField
                label="What I write about"
                value={user?.writingInterests || ""}
                onSave={(v) => updateProfile({ writingInterests: v })}
                placeholder="What do you want to write about?"
                multiline
                maxLength={200}
              />
            </div>
          ) : (
            profile.bio && (
              <p className="font-body text-[15px] text-ns-ink-secondary leading-relaxed mt-6 max-w-prose">
                {profile.bio}
              </p>
            )
          )}
        </header>

        {/* Owner-only settings — hidden from other viewers */}
        {isSelf && (
          <Suspense
            fallback={
              <div className="mt-6 h-40 rounded-ns-xl border border-ns-border animate-pulse bg-ns-surface" />
            }
          >
            <OwnerSettings />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default PublicUserProfile;
