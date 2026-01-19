import React, { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEO/SEOHead";
import { APP_NAME } from "@/config/seo";

const CompleteSignup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState<boolean | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const { completeMagicLinkSignup, isMagicLink, error } = useFirebaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we arrived via a valid magic link
    const valid = isMagicLink();
    setIsValidLink(valid);

    if (!valid) {
      setLinkError("Invalid or expired magic link. Please request a new invite.");
    }

    // Try to get email from localStorage (saved when user requested invite)
    const savedEmail = localStorage.getItem("emailForSignIn");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [isMagicLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setLinkError("Please enter your email address.");
      return;
    }

    if (!username.trim()) {
      setLinkError("Please choose a username.");
      return;
    }

    if (!password) {
      setLinkError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setLinkError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setLinkError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setLinkError(null);

    const result = await completeMagicLinkSignup(email, username.trim(), password);

    setIsLoading(false);

    if (result.success) {
      // Clear saved email
      localStorage.removeItem("emailForSignIn");
      navigate("/");
    } else {
      setLinkError(result.message || "Failed to complete signup.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  // Show loading while checking link validity
  if (isValidLink === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-neutral-50 dark:bg-neutral-950">
        <div className="animate-spin h-8 w-8 border-4 border-dark-green dark:border-light-green border-t-transparent rounded-full"></div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Verifying your invite link...</p>
      </div>
    );
  }

  // Show error if link is invalid
  if (!isValidLink) {
    return (
      <>
        <SEOHead
          title={`Invalid Link - ${APP_NAME}`}
          description="The magic link is invalid or has expired."
          url="/auth/complete-signup"
          noindex={true}
          nofollow={true}
        />
        <div className="flex flex-col items-center justify-center h-full w-full bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
          <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-semibold text-neutral-900 dark:text-white mb-2">
                Invalid Link
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                {linkError || "This magic link is invalid or has expired."}
              </p>
              <button
                onClick={() => navigate("/sign-up")}
                className="w-full bg-dark-green dark:bg-light-green text-white dark:text-neutral-900 font-semibold py-3 px-6 rounded-xl shadow-sm transition-all duration-300 hover:opacity-90"
              >
                Request New Invite
              </button>
              <button
                onClick={() => navigate("/sign-in")}
                className="w-full mt-3 text-dark-green dark:text-light-green font-semibold py-3 px-6 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all duration-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Sign In Instead
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={`Complete Registration - ${APP_NAME}`}
        description={`Complete your ${APP_NAME} registration and start your storytelling journey.`}
        url="/auth/complete-signup"
        noindex={true}
        nofollow={true}
      />
      <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
        {/* Logo with animation */}
        <div className="relative z-10 flex items-center text-center mb-8 -ml-6 animate-fade-in-down">
          <h1 className="text-5xl font-serif font-bold text-dark-green dark:text-light-green ml-4 transition-colors duration-300">
            {APP_NAME}
          </h1>
        </div>

        {/* Complete Registration Form */}
        <div className="relative z-10 w-full max-w-md p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all duration-300 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-fade-in">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-serif font-semibold text-neutral-900 dark:text-white mb-2 text-center transition-colors duration-300 animate-fade-in">
            Welcome!
          </h2>
          <p
            className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 text-center animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Complete your registration to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-300"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                placeholder="Enter the email you used to request an invite"
                className="w-full px-4 py-3
                 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white
                 border border-neutral-200 dark:border-neutral-700
                 rounded-xl
                 focus:outline-none focus:border-dark-green dark:focus:border-light-green
                 focus:ring-2 focus:ring-dark-green/20 dark:focus:ring-light-green/20
                 transition-all duration-300
                 placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                 hover:border-neutral-300 dark:hover:border-neutral-600"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Use the same email address where you received the invite link
              </p>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-300"
              >
                Username
              </label>
              <input
                maxLength={20}
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                className="w-full px-4 py-3
                 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white
                 border border-neutral-200 dark:border-neutral-700
                 rounded-xl
                 focus:outline-none focus:border-dark-green dark:focus:border-light-green
                 focus:ring-2 focus:ring-dark-green/20 dark:focus:ring-light-green/20
                 transition-all duration-300
                 placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                 hover:border-neutral-300 dark:hover:border-neutral-600"
                placeholder="Choose a username"
              />
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-300"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                minLength={6}
                className="w-full px-4 py-3
                 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white
                 border border-neutral-200 dark:border-neutral-700
                 rounded-xl
                 focus:outline-none focus:border-dark-green dark:focus:border-light-green
                 focus:ring-2 focus:ring-dark-green/20 dark:focus:ring-light-green/20
                 transition-all duration-300
                 placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                 hover:border-neutral-300 dark:hover:border-neutral-600"
                placeholder="Create a password (min. 6 characters)"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-300"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                minLength={6}
                className="w-full px-4 py-3
                 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white
                 border border-neutral-200 dark:border-neutral-700
                 rounded-xl
                 focus:outline-none focus:border-dark-green dark:focus:border-light-green
                 focus:ring-2 focus:ring-dark-green/20 dark:focus:ring-light-green/20
                 transition-all duration-300
                 placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                 hover:border-neutral-300 dark:hover:border-neutral-600"
                placeholder="Confirm your password"
              />
            </div>

            {(linkError || error) && (
              <div className="text-red-600 dark:text-red-400 text-sm mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/30 animate-shake">
                {linkError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-dark-green dark:bg-light-green text-white dark:text-neutral-900 font-semibold py-3 px-6 rounded-xl shadow-sm transition-all duration-300 animate-fade-in ${
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              }`}
              style={{ animationDelay: "0.6s" }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Complete Registration"
              )}
            </button>
          </form>

          <div
            className="text-center mt-6 animate-fade-in"
            style={{ animationDelay: "0.7s" }}
          >
            <span className="text-neutral-600 dark:text-neutral-400 text-sm">
              Already have an account?{" "}
            </span>
            <button
              onClick={() => navigate("/sign-in")}
              className="text-dark-green dark:text-light-green hover:opacity-80 transition-colors duration-200 font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes shake {
            0%,
            100% {
              transform: translateX(0);
            }
            25% {
              transform: translateX(-5px);
            }
            75% {
              transform: translateX(5px);
            }
          }

          .animate-fade-in-down {
            animation: fade-in-down 0.6s ease-out;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out;
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
            animation-fill-mode: both;
          }

          .animate-shake {
            animation: shake 0.4s ease-in-out;
          }
        `}</style>
      </div>
    </>
  );
};

export default CompleteSignup;
