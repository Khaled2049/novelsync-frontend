import { Link } from "react-router-dom";
import { useRef, useEffect, RefObject } from "react";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";
import { useNavigate } from "react-router-dom";

import {
  User,
  Settings,
  Shield,
  HelpCircle,
  BookOpen,
  LogOut,
} from "lucide-react";
import { IUser } from "../../types/IUser";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUser | null;
  containerRef?: RefObject<HTMLDivElement | null>;
}

const UserDropdown = ({
  isOpen,
  onClose,
  user,
  containerRef,
}: UserDropdownProps) => {
  const { signout } = useFirebaseAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signout();
    navigate("/sign-in");
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside both the dropdown and its container (which includes the button)
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        containerRef?.current &&
        !containerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose, containerRef]);

  if (!isOpen || !user) return null;

  const menuItems = [
    {
      icon: Settings,
      label: "Settings",
      to: "/settings",
      onClick: onClose,
    },
    {
      icon: Shield,
      label: "Privacy Policy",
      to: "/privacy-policy",
      onClick: onClose,
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      to: "/help",
      onClick: onClose,
    },
    {
      icon: BookOpen,
      label: "My Stories",
      to: "/user-stories",
      onClick: onClose,
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 text-black dark:text-white rounded-lg shadow-xl z-50 overflow-hidden border border-black/10 dark:border-white/10 backdrop-blur-sm"
    >
      {/* User Info */}
      <Link
        to="/profile"
        onClick={onClose}
        className="block p-4 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/10 dark:border-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {user.photoURL && user.photoURL.trim() !== "" ? (
            <img
              src={user.photoURL}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-dark-green dark:border-light-green"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-dark-green dark:bg-light-green flex items-center justify-center">
              <User className="w-6 h-6 text-white dark:text-black" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-black dark:text-white">
              {user.displayName || "User"}
            </p>
            <p className="text-xs text-black/60 dark:text-white/60 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </Link>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={item.onClick}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
            >
              <Icon className="w-5 h-5 text-black/60 dark:text-white/60 group-hover:text-dark-green dark:group-hover:text-light-green transition-colors" />
              <span className="text-black dark:text-white group-hover:text-dark-green dark:group-hover:text-light-green transition-colors">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Sign Out */}
      <div className="border-t border-black/10 dark:border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
