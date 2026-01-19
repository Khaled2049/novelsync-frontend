import React, { useState } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEO/SEOHead";
import { APP_NAME } from "@/config/seo";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { requestInvite } = useFirebaseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const result = await requestInvite(email);

    setIsLoading(false);

    if (result.success) {
      // Save email to localStorage for use when completing signup
      localStorage.setItem("emailForSignIn", email);
      setIsSuccess(true);
    } else {
      setErrorMessage(result.message || "Failed to request invite.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  // Success state - invite request submitted
  if (isSuccess) {
    return (
      <>
        <SEOHead
          title={`Invite Requested - ${APP_NAME}`}
          description="Your invite request has been submitted."
          url="/sign-up"
          noindex={true}
          nofollow={true}
        />
        <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
          <div className="relative z-10 flex items-center text-center mb-8 -ml-6 animate-fade-in-down">
            <h1 className="text-5xl font-serif font-bold text-dark-green dark:text-light-green ml-4 transition-colors duration-300">
              {APP_NAME}
            </h1>
          </div>

          <div className="relative z-10 w-full max-w-md p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all duration-300 animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-fade-in">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-serif font-semibold text-neutral-900 dark:text-white mb-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Request Submitted
              </h2>

              <p className="text-neutral-600 dark:text-neutral-400 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                We've received your invite request for <span className="font-semibold text-dark-green dark:text-light-green">{email}</span>.
              </p>

              <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                When your invite is approved, you'll receive an email with a magic link to complete your registration. Keep an eye on your inbox!
              </p>

              <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  Request Another Invite
                </button>

                <button
                  onClick={() => navigate("/sign-in")}
                  className="w-full text-dark-green dark:text-light-green font-semibold py-3 px-6 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all duration-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fade-in-down {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
            .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
            .animate-fade-in { animation: fade-in 0.6s ease-out; animation-fill-mode: both; }
          `}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={`Request Invite - ${APP_NAME}`}
        description={`Request an invite to join ${APP_NAME} and start writing stories with AI assistance.`}
        url="/sign-up"
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

        {/* Invite Request Form Container */}
        <div className="relative z-10 w-full max-w-md p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all duration-300 animate-fade-in-up">
          <h2 className="text-3xl font-serif font-semibold text-neutral-900 dark:text-white mb-2 transition-colors duration-300 animate-fade-in">
            Request an Invite
          </h2>
          <p
            className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Join the {APP_NAME} community
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-300"
              >
                Email Address
              </label>
              <input
                maxLength={100}
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="your@email.com"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                You'll receive a magic link to this email when your invite is approved.
              </p>
            </div>

            {errorMessage && (
              <div className="text-red-600 dark:text-red-400 text-sm mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/30 animate-shake">
                {errorMessage}
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
              style={{ animationDelay: "0.3s" }}
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
                  Submitting...
                </span>
              ) : (
                "Request Invite"
              )}
            </button>
          </form>

          {/* Info box */}
          <div
            className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              How it works
            </h3>
            <ol className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 list-decimal list-inside">
              <li>Submit your email address above</li>
              <li>Wait for your invite to be approved</li>
              <li>Click the magic link in your email</li>
              <li>Choose a username and start writing!</li>
            </ol>
          </div>

          <div
            className="text-center mt-6 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
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

        {/* Subtle writing-themed decoration */}
        <div
          className="relative z-10 mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <p className="italic">
            "Every great story begins with a single word"
          </p>
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

export default Signup;
