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
    <div className="mt-10 flex items-center justify-center bg-ns-bg px-4">
      <div className="text-center max-w-lg mx-auto w-full">
        <div className="bg-ns-elevated p-8 md:p-10 rounded-ns-2xl shadow-ns border border-ns-border">
          <div className="bg-ns-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon size={iconSize} className="text-ns-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-medium text-ns-ink mb-4">
            {title}
          </h2>
          <p className="text-ns-ink-secondary mb-8 text-lg leading-relaxed font-body">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sign-in"
              className="group inline-flex justify-center items-center gap-2 px-8 py-3 bg-ns-accent text-white font-ui font-semibold rounded-full hover:bg-ns-accent-hover transition-all duration-300 shadow-ns-sm hover:shadow-ns transform hover:-translate-y-0.5 active:scale-95"
            >
              <LogIn
                size={20}
                className="group-hover:translate-x-0.5 transition-transform"
              />
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="group inline-flex justify-center items-center gap-2 px-8 py-3 bg-ns-ink text-[var(--ns-bg)] font-ui font-semibold rounded-full hover:bg-ns-ink/90 transition-all duration-300 shadow-ns-sm hover:shadow-ns transform hover:-translate-y-0.5 active:scale-95"
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
