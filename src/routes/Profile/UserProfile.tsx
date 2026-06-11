import React, { useState, useEffect, lazy, Suspense } from "react";

const AiSettings = lazy(() => import("@/routes/Settings/AiSettings"));
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserWalletAddress } from "@/hooks/useUserWalletAddress";
import { useEarnings } from "@/hooks/useEarnings";
import { useUserStoriesWithEarnings } from "@/hooks/queries/useStoryQueries";
import { useAccount, useChainId } from "wagmi";
import { userService } from "@/services/UserService";
import { EditableField } from "@/components/ui/editable-field";
import { WalletConnectButton } from "@/components/web3/WalletConnectButton";
import { WEB3_ENABLED } from "@/config/featureFlags";
import {
  User,
  DollarSign,
  BookOpen,
  Wallet,
  Loader2,
  AlertCircle,
  Globe,
  Copy,
  CheckCircle2,
  Trash2,
  Sun,
  Moon,
  Bot,
} from "lucide-react";

const TARGET_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || "31337");
const TARGET_CHAIN_NAME =
  TARGET_CHAIN_ID === 31337
    ? "Anvil"
    : TARGET_CHAIN_ID === 11155111
      ? "Sepolia"
      : TARGET_CHAIN_ID === 1
        ? "Ethereum"
        : `Chain ${TARGET_CHAIN_ID}`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "profile" | "wallet" | "ai" | "appearance";

// ─── Sub-components ───────────────────────────────────────────────────────────

const Card = ({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-ns-elevated border border-ns-border rounded-ns-xl p-6 mb-5 ${className}`}
  >
    {title && (
      <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-ns-ink-muted mb-5">
        {title}
      </p>
    )}
    {children}
  </div>
);

const Row = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col items-start gap-3 py-4 border-b border-ns-border last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <div>
      <p className="text-sm font-ui font-medium text-ns-ink">{label}</p>
      {description && (
        <p className="text-xs font-ui text-ns-ink-muted mt-0.5">
          {description}
        </p>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const { address } = useAccount();
  const chainId = useChainId();
  const {
    walletAddress: savedWalletAddress,
    loading: walletLoading,
    setWalletAddress: setSavedWalletAddress,
  } = useUserWalletAddress(user?.uid);
  const {
    lifetimeEarnings,
    fetchLifetimeEarnings,
    loading: earningsLoading,
    error: earningsError,
  } = useEarnings();

  const [activeSection, setActiveSection] = useState<Section>("profile");
  const {
    data: stories = [],
    isLoading: storiesLoading,
    isError: storiesError,
    error: storiesErrorValue,
  } = useUserStoriesWithEarnings(user?.uid);

  // Live wallet state
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setConnectedAddress(address || null);
  }, [address]);

  useEffect(() => {
    if (savedWalletAddress) fetchLifetimeEarnings(savedWalletAddress);
  }, [savedWalletAddress, fetchLifetimeEarnings]);

  const followersCount =
    user?.followers?.filter((f) => f !== "default").length ?? 0;
  const followingCount =
    user?.following?.filter((f) => f !== "default").length ?? 0;

  const handleCopyAddress = async () => {
    if (!connectedAddress) return;
    try {
      await navigator.clipboard.writeText(connectedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSaveWallet = async () => {
    if (!user?.uid || !connectedAddress) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setDeleteSuccess(false);
    try {
      await userService.updateUserWalletAddress(user.uid, connectedAddress);
      setSavedWalletAddress(connectedAddress);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save wallet address.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWallet = async () => {
    if (!user?.uid || !savedWalletAddress) return;
    setIsDeleting(true);
    setSaveError(null);
    setSaveSuccess(false);
    setDeleteSuccess(false);
    try {
      await userService.clearUserWalletAddress(user.uid);
      setSavedWalletAddress(null);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to remove wallet address.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isWalletConnected = !!connectedAddress;
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;
  const addressSaved =
    savedWalletAddress &&
    connectedAddress?.toLowerCase() === savedWalletAddress.toLowerCase();

  const hasLifetimeEarnings =
    parseFloat(lifetimeEarnings.eth) > 0 ||
    parseFloat(lifetimeEarnings.usdc) > 0;

  const totalEthEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings.eth || "0"),
    0,
  );
  const totalUsdcEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings.usdc || "0"),
    0,
  );

  // ── Loading / error states ──────────────────────────────────────────────────

  if (storiesLoading || walletLoading || earningsLoading) {
    return (
      <div className="min-h-screen bg-ns-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ns-accent mx-auto mb-3" />
          <p className="text-sm font-ui text-ns-ink-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (storiesError || earningsError) {
    return (
      <div className="min-h-screen bg-ns-bg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-ns-destructive mx-auto mb-3" />
          <p className="font-ui text-ns-ink mb-4">
            {storiesError
              ? storiesErrorValue instanceof Error
                ? storiesErrorValue.message
                : "Failed to load profile data."
              : earningsError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-ns-accent hover:bg-ns-accent-hover text-white text-sm font-ui rounded-ns transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Nav items ───────────────────────────────────────────────────────────────

  const navItems: { id: Section; label: string; Icon: typeof User }[] = [
    { id: "profile", label: "Profile", Icon: User },
    ...(WEB3_ENABLED
      ? [{ id: "wallet" as Section, label: "Wallet & Earnings", Icon: Wallet }]
      : []),
    { id: "ai", label: "AI Provider", Icon: Bot },
    { id: "appearance", label: "Appearance", Icon: Globe },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-ns-bg">
      {/* ── Profile header ── */}
      <div className="bg-ns-elevated border-b border-ns-border">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-20 h-20 rounded-full border-4 border-ns-bg shadow-ns-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-ns-bg shadow-ns-lg bg-gradient-to-br from-ns-accent/20 via-ns-accent/10 to-ns-surface flex items-center justify-center">
                  <User className="w-8 h-8 text-ns-accent/50" />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-heading text-4xl text-ns-ink leading-none mb-1">
                {user?.displayName || "Author"}
              </h1>
              <p className="font-ui text-sm text-ns-ink-muted mb-3">
                {user?.email}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1.5">
                <span className="text-sm font-ui">
                  <strong className="text-ns-ink">{followersCount}</strong>{" "}
                  <span className="text-ns-ink-muted">followers</span>
                </span>
                <span className="w-px h-3 bg-ns-border" />
                <span className="text-sm font-ui">
                  <strong className="text-ns-ink">{followingCount}</strong>{" "}
                  <span className="text-ns-ink-muted">following</span>
                </span>
                <span className="w-px h-3 bg-ns-border" />
                <span className="text-sm font-ui">
                  <strong className="text-ns-ink">{stories.length}</strong>{" "}
                  <span className="text-ns-ink-muted">
                    {stories.length === 1 ? "story" : "stories"}
                  </span>
                </span>
                {savedWalletAddress && (
                  <>
                    <span className="w-px h-3 bg-ns-border" />
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-ns-ink-muted bg-ns-surface border border-ns-border px-2.5 py-0.5 rounded-full">
                      <Wallet className="w-3 h-3" />
                      {savedWalletAddress.slice(0, 6)}…
                      {savedWalletAddress.slice(-4)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4 sm:px-6 sm:py-8 lg:flex-row lg:gap-8 lg:items-start">
        {/* Sidebar */}
        <aside className="w-full lg:w-48 lg:flex-shrink-0 lg:sticky lg:top-6">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-ns text-sm font-ui text-left transition-colors whitespace-nowrap lg:w-full ${
                  activeSection === id
                    ? "bg-ns-surface-hover text-ns-ink font-medium"
                    : "text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink"
                }`}
              >
                {activeSection === id && (
                  <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-ns-accent rounded-full" />
                )}
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    activeSection === id
                      ? "text-ns-accent"
                      : "text-ns-ink-muted"
                  }`}
                />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* ── Profile ── */}
          {activeSection === "profile" && (
            <>
              <Card title="About">
                <div className="space-y-5">
                  <EditableField
                    label="Bio"
                    value={user?.bio || ""}
                    onSave={(v) => updateProfile({ bio: v })}
                    placeholder="Write something about yourself…"
                    multiline
                    maxLength={300}
                  />
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
                  <EditableField
                    label="What I write about"
                    value={user?.writingInterests || ""}
                    onSave={(v) => updateProfile({ writingInterests: v })}
                    placeholder="What do you want to write about?"
                    multiline
                    maxLength={200}
                  />
                </div>
              </Card>

              <Card title="Your Stories">
                {stories.length === 0 ? (
                  <div className="py-10 text-center">
                    <BookOpen className="w-10 h-10 text-ns-ink-muted/30 mx-auto mb-3" />
                    <p className="font-ui text-sm text-ns-ink-secondary mb-3">
                      No stories yet.
                    </p>
                    <Link
                      to="/create"
                      className="text-sm font-ui text-ns-accent hover:underline"
                    >
                      Write your first story →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-ns-border">
                      {stories.slice(0, 5).map((story) => {
                        const storyEth = parseFloat(story.earnings.eth || "0");
                        const storyUsdc = parseFloat(
                          story.earnings.usdc || "0",
                        );
                        return (
                          <Link
                            key={story.id}
                            to={`/story/${story.id}`}
                            className="flex items-center gap-3 py-3.5 -mx-4 px-4 sm:-mx-6 sm:px-6 hover:bg-ns-surface-hover transition-colors group"
                          >
                            {story.coverImageUrl ? (
                              <img
                                src={story.thumbnailUrl || story.coverImageUrl}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="w-8 h-11 object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-11 bg-ns-surface border border-ns-border rounded flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-3.5 h-3.5 text-ns-ink-muted" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-ui font-medium text-ns-ink line-clamp-1 group-hover:text-ns-accent transition-colors">
                                {story.title}
                              </p>
                              <p className="text-[11px] font-ui text-ns-ink-muted mt-0.5">
                                {story.isPublished ? (
                                  <span className="text-ns-accent">
                                    Published
                                  </span>
                                ) : (
                                  "Draft"
                                )}
                                {" · "}
                                {story.chapterCount}{" "}
                                {story.chapterCount === 1
                                  ? "chapter"
                                  : "chapters"}
                              </p>
                            </div>
                            {(storyEth > 0 || storyUsdc > 0) && (
                              <div className="flex items-center gap-2 flex-shrink-0 text-xs font-ui">
                                {storyEth > 0 && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    {storyEth.toFixed(4)} ETH
                                  </span>
                                )}
                                {storyUsdc > 0 && (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    {storyUsdc.toFixed(2)} USDC
                                  </span>
                                )}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t border-ns-border mt-1">
                      <Link
                        to="/user-stories"
                        className="text-sm font-ui text-ns-accent hover:underline"
                      >
                        {stories.length > 5
                          ? `View all ${stories.length} stories →`
                          : "Manage stories →"}
                      </Link>
                    </div>
                  </>
                )}
              </Card>
            </>
          )}

          {/* ── Wallet & Earnings ── */}
          {WEB3_ENABLED && activeSection === "wallet" && (
            <>
              <Card title="Wallet Connection">
                {!isWalletConnected ? (
                  <div className="space-y-3">
                    <p className="text-sm font-ui text-ns-ink-secondary">
                      Connect your wallet to receive tips from readers on the
                      {TARGET_CHAIN_NAME} network.
                    </p>
                    <WalletConnectButton />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status pill */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isCorrectNetwork ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      <span className="text-sm font-ui text-ns-ink">
                        {isCorrectNetwork
                          ? `Connected · ${TARGET_CHAIN_NAME}`
                          : `Wrong network — please switch to ${TARGET_CHAIN_NAME}`}
                      </span>
                    </div>

                    {/* Address row */}
                    <div>
                      <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-ns-ink-muted mb-2">
                        Address
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 text-xs font-mono bg-ns-surface border border-ns-border rounded-ns text-ns-ink truncate">
                          {connectedAddress}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyAddress}
                          className="p-2 rounded-ns border border-ns-border bg-ns-surface hover:bg-ns-surface-hover text-ns-ink-muted hover:text-ns-ink transition-colors"
                        >
                          {copied ? (
                            <CheckCircle2 className="w-4 h-4 text-ns-accent" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        {savedWalletAddress && (
                          <button
                            onClick={handleDeleteWallet}
                            disabled={isDeleting}
                            className="p-2 rounded-ns border border-ns-border bg-ns-surface hover:bg-red-50 dark:hover:bg-red-500/10 text-ns-ink-muted hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove saved address"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Save to profile */}
                    {!addressSaved && (
                      <button
                        onClick={handleSaveWallet}
                        disabled={isSaving}
                        className="w-full py-2 text-sm font-ui font-medium bg-ns-accent hover:bg-ns-accent-hover text-white rounded-ns transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Saving…" : "Save address to profile"}
                      </button>
                    )}
                    {saveSuccess && (
                      <div className="flex items-center gap-2 text-sm font-ui text-ns-accent">
                        <CheckCircle2 className="w-4 h-4" /> Saved successfully
                      </div>
                    )}
                    {deleteSuccess && (
                      <div className="flex items-center gap-2 text-sm font-ui text-ns-accent">
                        <CheckCircle2 className="w-4 h-4" /> Address removed
                      </div>
                    )}
                    {saveError && (
                      <p className="text-sm font-ui text-ns-destructive">
                        {saveError}
                      </p>
                    )}
                    {addressSaved && (
                      <div className="flex items-center gap-2 text-xs font-ui text-ns-ink-muted">
                        <CheckCircle2 className="w-3.5 h-3.5 text-ns-accent" />
                        Address saved to your profile
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {savedWalletAddress && (
                <Card title="Lifetime Earnings">
                  {!hasLifetimeEarnings ? (
                    <div className="py-8 text-center">
                      <DollarSign className="w-10 h-10 text-ns-ink-muted/30 mx-auto mb-3" />
                      <p className="text-sm font-ui text-ns-ink-secondary">
                        No tips received yet.
                      </p>
                      <p className="text-xs font-ui text-ns-ink-muted mt-1">
                        Share your stories to start earning!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-ns-surface border border-ns-border rounded-ns">
                        <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-ns-ink-muted mb-2">
                          ETH
                        </p>
                        <p className="font-heading text-2xl text-emerald-600 dark:text-emerald-400">
                          {parseFloat(lifetimeEarnings.eth).toFixed(4)}
                        </p>
                        <p className="text-xs font-ui text-ns-ink-muted mt-1">
                          ≈ $
                          {(parseFloat(lifetimeEarnings.eth) * 3000).toFixed(2)}{" "}
                          USD
                        </p>
                      </div>
                      <div className="p-4 bg-ns-surface border border-ns-border rounded-ns">
                        <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-ns-ink-muted mb-2">
                          USDC
                        </p>
                        <p className="font-heading text-2xl text-blue-600 dark:text-blue-400">
                          {parseFloat(lifetimeEarnings.usdc).toFixed(2)}
                        </p>
                        <p className="text-xs font-ui text-ns-ink-muted mt-1">
                          ≈ ${parseFloat(lifetimeEarnings.usdc).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {stories.some(
                (s) =>
                  parseFloat(s.earnings.eth) > 0 ||
                  parseFloat(s.earnings.usdc) > 0,
              ) && (
                <Card title="Per-Story Earnings">
                  <div className="divide-y divide-ns-border">
                    {stories
                      .filter(
                        (s) =>
                          parseFloat(s.earnings.eth) > 0 ||
                          parseFloat(s.earnings.usdc) > 0,
                      )
                      .map((story) => (
                        <div
                          key={story.id}
                          className="flex flex-col items-start py-3.5 gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                        >
                          <Link
                            to={`/story/${story.id}`}
                            className="text-sm font-ui text-ns-ink hover:text-ns-accent transition-colors line-clamp-1"
                          >
                            {story.title}
                          </Link>
                          <div className="flex items-center gap-3 flex-shrink-0 text-xs font-ui">
                            {parseFloat(story.earnings.eth) > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {parseFloat(story.earnings.eth).toFixed(4)} ETH
                              </span>
                            )}
                            {parseFloat(story.earnings.usdc) > 0 && (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {parseFloat(story.earnings.usdc).toFixed(2)}{" "}
                                USDC
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {(totalEthEarnings > 0 || totalUsdcEarnings > 0) && (
                    <div className="mt-4 pt-4 border-t border-ns-border flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[10px] font-ui font-semibold uppercase tracking-widest text-ns-ink-muted">
                        Total
                      </span>
                      <div className="flex items-center gap-3 text-xs font-ui">
                        {totalEthEarnings > 0 && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {totalEthEarnings.toFixed(4)} ETH
                          </span>
                        )}
                        {totalUsdcEarnings > 0 && (
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {totalUsdcEarnings.toFixed(2)} USDC
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              <Card title="How Tipping Works">
                <div className="space-y-3 text-sm font-ui text-ns-ink-secondary">
                  <p>
                    Readers can tip you directly for your stories using ETH or
                    USDC on {TARGET_CHAIN_NAME}.
                  </p>
                  <div className="bg-ns-surface border border-ns-border rounded-ns p-4">
                    <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-ns-ink-muted mb-3">
                      Revenue Split
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-ns-ink-secondary">
                          Author (You)
                        </span>
                        <span className="font-semibold text-ns-accent">
                          90%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ns-ink-secondary">
                          Platform Fee
                        </span>
                        <span className="text-ns-ink-muted">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ── Appearance ── */}
          {activeSection === "appearance" && (
            <Card title="Appearance">
              <Row
                label="Theme"
                description={`Currently using ${theme === "light" ? "light" : "dark"} theme`}
              >
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-ui font-medium bg-ns-surface border border-ns-border hover:bg-ns-surface-hover text-ns-ink rounded-ns transition-colors"
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="w-4 h-4" /> Switch to Dark
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" /> Switch to Light
                    </>
                  )}
                </button>
              </Row>
            </Card>
          )}

          {/* ── AI Provider ── */}
          {activeSection === "ai" && (
            <Suspense
              fallback={
                <div className="h-32 rounded-ns border border-ns-border animate-pulse bg-ns-surface" />
              }
            >
              <AiSettings />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
