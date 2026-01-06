import { BookOpen, LogIn, UserPlus, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface SignInPromptProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconSize?: number;
}

const SignInPrompt = ({
  title = "Join the Community",
  description = "Sign in to access all features and connect with others.",
  icon: Icon = BookOpen,
  iconSize = 40,
}: SignInPromptProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="text-center max-w-lg mx-auto w-full">
        <div className="bg-white dark:bg-neutral-800 p-8 md:p-10 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700">
          <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Icon
              size={iconSize}
              className="text-dark-green dark:text-light-green"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mb-8 text-lg leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sign-in"
              className="group inline-flex justify-center items-center gap-2 px-8 py-3 bg-dark-green dark:bg-light-green text-white dark:text-neutral-900 font-semibold rounded-full hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
            >
              <LogIn
                size={20}
                className="group-hover:translate-x-0.5 transition-transform"
              />
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="group inline-flex justify-center items-center gap-2 px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-full hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
            >
              <UserPlus
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPrompt;
