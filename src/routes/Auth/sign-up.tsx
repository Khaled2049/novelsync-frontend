import React, { useState } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { SEOHead } from "@/components/SEO/SEOHead";
import { APP_NAME } from "@/config/seo";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAnonymousLoading, setIsAnonymousLoading] = useState(false);

  const {
    handleAnonymousSignUp,
    handleEmailSignUp,
    handleGoogleSignUp,
    error,
  } = useFirebaseAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await handleEmailSignUp(
      formData.email,
      formData.password,
      formData.userName
    );
    setIsLoading(false);
    if (!error) {
      navigate("/");
    }
  };

  const googleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      await handleGoogleSignUp();
      setIsGoogleLoading(false);
      if (!error) {
        navigate("/");
      }
    } catch (err) {
      setIsGoogleLoading(false);
    }
  };

  const anonymousSignUp = async () => {
    try {
      setIsAnonymousLoading(true);
      await handleAnonymousSignUp();
      setIsAnonymousLoading(false);
      if (!error) {
        navigate("/");
      }
    } catch (err) {
      setIsAnonymousLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <>
      <SEOHead
        title={`Sign Up - ${APP_NAME}`}
        description={`Create your free ${APP_NAME} account and start writing stories with AI assistance, join book clubs, and connect with writers.`}
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

        {/* Sign Up Form Container */}
        <div className="relative z-10 w-full max-w-md p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all duration-300 animate-fade-in-up">
          <h2 className="text-3xl font-serif font-semibold text-neutral-900 dark:text-white mb-2 transition-colors duration-300 animate-fade-in">
            Sign Up
          </h2>
          <p
            className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Start your storytelling journey
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-300"
              >
                Username
              </label>
              <input
                maxLength={20}
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
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

            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-300"
              >
                Email
              </label>
              <input
                maxLength={50}
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-300"
              >
                Password
              </label>
              <input
                maxLength={20}
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/30 animate-shake">
                {error}
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
              style={{ animationDelay: "0.5s" }}
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
                  Signing Up...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Simple separator */}
          <div
            className="relative my-6 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
                Or
              </span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <button
            onClick={googleSignUp}
            disabled={isGoogleLoading}
            className={`w-full flex items-center justify-center gap-2 text-neutral-700 dark:text-neutral-300 py-3 px-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-dark-green/20 dark:focus:ring-light-green/20 transition-all duration-300 mb-4 animate-fade-in ${
              isGoogleLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{ animationDelay: "0.7s" }}
          >
            {isGoogleLoading ? (
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
            ) : (
              <FaGoogle size={20} />
            )}
            <span>
              {isGoogleLoading ? "Signing up..." : "Continue with Google"}
            </span>
          </button>

          {/* Anonymous Sign Up Button */}
          <button
            onClick={anonymousSignUp}
            disabled={isAnonymousLoading}
            className={`w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold py-3 px-6 rounded-xl shadow-sm transition-all duration-300 animate-fade-in ${
              isAnonymousLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            }`}
            style={{ animationDelay: "0.8s" }}
          >
            {isAnonymousLoading ? (
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
                Signing up...
              </span>
            ) : (
              "Continue Anonymously"
            )}
          </button>

          <div
            className="text-center mt-6 animate-fade-in"
            style={{ animationDelay: "0.9s" }}
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
          style={{ animationDelay: "1s" }}
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
