import { useState, useEffect } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  User,
  Bell,
  Shield,
  Globe,
  Mail,
  Trash2,
  Save,
  Edit,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChainId } from "wagmi";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { userService } from "@/services/UserService";
import { useWalletState } from "@/hooks/useWalletState";

const TARGET_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || "31337");
const TARGET_CHAIN_NAME =
  TARGET_CHAIN_ID === 31337
    ? "Anvil"
    : TARGET_CHAIN_ID === 11155111
      ? "Sepolia"
      : TARGET_CHAIN_ID === 1
        ? "Ethereum"
        : `Chain ${TARGET_CHAIN_ID}`;

const Settings = () => {
  const { user, updateBio } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const { address: walletAddress } = useWalletState();
  const chainId = useChainId();

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
  });
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize bio text
  useEffect(() => {
    setEditedBio(user?.bio || "Write an about me section here...");
  }, [user?.bio]);

  // Load existing saved address from Firestore
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (user?.uid) {
        try {
          const address = await userService.getUserWalletAddress(user.uid);
          setSavedAddress(address);
        } catch (error) {
          console.error("Error loading saved wallet address:", error);
          setSavedAddress(null);
        }
      } else {
        setSavedAddress(null);
      }
    };
    loadSavedAddress();
  }, [user?.uid]);

  const handleSaveBio = async () => {
    if (!user) return;
    await updateBio(user.uid, editedBio);
    setIsEditingBio(false);
  };

  const handleCopyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  const handleSaveWalletAddress = async () => {
    if (!user?.uid || !walletAddress) {
      setSaveError("User ID or wallet address is missing");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await userService.updateUserWalletAddress(user.uid, walletAddress);
      setSavedAddress(walletAddress);
      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save wallet address";
      setSaveError(errorMessage);
      console.error("Error saving wallet address:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality for other settings
    alert("Settings saved successfully!");
  };

  const isConnected = !!walletAddress;
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-black dark:text-white py-8 px-4 font-body">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-heading mb-2">Settings</h1>
          <p className="text-black/70 dark:text-white/70">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Account Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-dark-green dark:text-light-green" />
            <h2 className="text-2xl font-semibold font-heading">Account</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-black/50 dark:text-white/50" />
                <span className="text-black dark:text-white">
                  {user?.email || "Not available"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Display Name
              </label>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-black/50 dark:text-white/50" />
                <span className="text-black dark:text-white">
                  {user?.displayName || "Not set"}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Bio</label>
                <button
                  onClick={() => setIsEditingBio(!isEditingBio)}
                  className="text-black/70 dark:text-white/70 hover:text-dark-green dark:hover:text-light-green transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              {isEditingBio ? (
                <div>
                  <Textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-800 border border-black/20 dark:border-white/20 text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green"
                    rows={4}
                  />
                  <Button
                    onClick={handleSaveBio}
                    className="mt-2 bg-dark-green dark:bg-light-green text-white hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <p className="text-black/70 dark:text-white/70">
                  {user?.bio || "Write an about me section here..."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Settings Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-6 h-6 text-dark-green dark:text-light-green" />
            <h2 className="text-2xl font-semibold font-heading">
              Payment Settings
            </h2>
          </div>

          <div className="space-y-4">
            {!isConnected ? (
              <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 dark:bg-yellow-500/5">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                      No Wallet Connected
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                      Connect your wallet to receive tips from readers. You need
                      a wallet connected to receive payments.
                    </p>
                    <div className="flex justify-start">
                      <WalletConnectButton />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Wallet Status */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-black/20 dark:border-white/20 bg-neutral-50 dark:bg-black">
                  <div className="flex items-center space-x-3">
                    {isCorrectNetwork ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">
                        Wallet Connected
                      </p>
                      <p className="text-xs text-black/70 dark:text-white/70">
                        {isCorrectNetwork
                          ? TARGET_CHAIN_NAME
                          : `Wrong Network - Please switch to ${TARGET_CHAIN_NAME}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wallet Address */}
                {walletAddress && (
                  <div className="p-4 rounded-lg border border-black/20 dark:border-white/20 bg-neutral-50 dark:bg-black">
                    <label className="text-sm font-medium text-black dark:text-white mb-2 block">
                      Wallet Address
                    </label>
                    <div className="flex items-center space-x-2 mb-2">
                      <Input
                        value={walletAddress}
                        readOnly
                        className="flex-1 bg-neutral-50 dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white font-mono text-sm"
                      />
                      <Button
                        onClick={handleCopyAddress}
                        variant="outline"
                        className="border border-black/20 dark:border-white/20 bg-neutral-50 dark:bg-black hover:bg-black/10 dark:hover:bg-neutral-50/10 text-black dark:text-white"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Save Wallet Address Button - Only show if address differs or not saved */}
                    {(walletAddress.toLowerCase() !==
                      savedAddress?.toLowerCase() ||
                      !savedAddress) && (
                      <div className="mt-3">
                        <Button
                          onClick={handleSaveWalletAddress}
                          disabled={isSaving}
                          className="w-full bg-dark-green dark:bg-light-green text-white hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Wallet Address
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Success Message */}
                    {saveSuccess && (
                      <div className="mt-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/5">
                        <div className="flex items-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
                          <p className="text-sm text-emerald-700 dark:text-emerald-400">
                            Wallet address saved successfully!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {saveError && (
                      <div className="mt-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10 dark:bg-red-500/5">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                              Failed to save wallet address
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-500">
                              {saveError}
                            </p>
                          </div>
                          <button
                            onClick={() => setSaveError(null)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Saved Address Indicator */}
                    {savedAddress &&
                      walletAddress.toLowerCase() ===
                        savedAddress.toLowerCase() && (
                        <div className="mt-3 p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5">
                          <div className="flex items-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">
                              Address saved in your profile
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Network Warning */}
                {!isCorrectNetwork && (
                  <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 dark:bg-yellow-500/5">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                          Wrong Network
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          Please switch to {TARGET_CHAIN_NAME} to receive tips.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tipping Information */}
            <Card className="border border-black/20 dark:border-white/20 bg-neutral-50 dark:bg-black shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-black dark:text-white">
                  <Info className="w-5 h-5 mr-2 text-dark-green dark:text-light-green" />
                  <span>How Tipping Works</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-black/70 dark:text-white/70">
                    Readers can tip you directly for your stories using ETH or
                    USDC on {TARGET_CHAIN_NAME}. Here's how the tipping system
                    works:
                  </p>

                  <div className="p-4 rounded-lg border border-dark-green/20 dark:border-light-green/20 bg-dark-green/5 dark:bg-light-green/5">
                    <h3 className="font-semibold text-black dark:text-white mb-3">
                      Revenue Split
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-black/70 dark:text-white/70">
                          Author (You)
                        </span>
                        <span className="font-semibold text-dark-green dark:text-light-green">
                          90%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/70 dark:text-white/70">
                          Platform Fee
                        </span>
                        <span className="font-semibold text-black/50 dark:text-white/50">
                          10%
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                        <p className="text-xs text-black/60 dark:text-white/60">
                          Example: If a reader tips 1 ETH, you receive 0.9 ETH
                          and the platform receives 0.1 ETH.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold text-black dark:text-white mb-2">
                      Getting Started
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-black/70 dark:text-white/70">
                      <li>Connect your wallet using the button above</li>
                      <li>Make sure you're on {TARGET_CHAIN_NAME}</li>
                      <li>Share your stories - readers can tip you directly</li>
                      <li>Tips are sent directly to your connected wallet</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-dark-green dark:text-light-green" />
            <h2 className="text-2xl font-semibold font-heading">
              Notifications
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">
                  Email Notifications
                </label>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Receive notifications via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      email: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dark-green dark:peer-focus:ring-light-green rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-green dark:peer-checked:bg-light-green"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">
                  Push Notifications
                </label>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Receive browser push notifications
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      push: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dark-green dark:peer-focus:ring-light-green rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-green dark:peer-checked:bg-light-green"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">
                  Marketing Emails
                </label>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Receive updates about new features
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.marketing}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      marketing: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dark-green dark:peer-focus:ring-light-green rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-green dark:peer-checked:bg-light-green"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-dark-green dark:text-light-green" />
            <h2 className="text-2xl font-semibold font-heading">Privacy</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Profile Visibility
              </label>
              <select
                value={privacy.profileVisibility}
                onChange={(e) =>
                  setPrivacy({ ...privacy, profileVisibility: e.target.value })
                }
                className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-black/20 dark:border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">Show Email</label>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Allow others to see your email address
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.showEmail}
                  onChange={(e) =>
                    setPrivacy({ ...privacy, showEmail: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dark-green dark:peer-focus:ring-light-green rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-green dark:peer-checked:bg-light-green"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-dark-green dark:text-light-green" />
            <h2 className="text-2xl font-semibold font-heading">Appearance</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">Theme</label>
              <p className="text-xs text-black/60 dark:text-white/60">
                Current theme: {theme === "light" ? "Light" : "Dark"}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green text-white rounded-md transition-colors"
            >
              Switch to {theme === "light" ? "Dark" : "Light"}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-red-500/20 dark:border-red-500/20 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-semibold font-heading text-red-500">
              Danger Zone
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Delete Account</h3>
              <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green text-white font-semibold rounded-md transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
