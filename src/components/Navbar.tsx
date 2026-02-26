import { Link } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { useState, useRef } from "react";
import { Loader, Menu, User } from "lucide-react";
import { WalletConnectButton } from "./WalletConnectButton";
import UserDropdown from "./navbar/UserDropdown";
import MobileMenu from "./navbar/MobileMenu";
import { APP_NAME } from "../config/seo";

const Navbar = () => {
  const { user, loading } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="w-full sticky top-0 z-50 ns-glass border-b border-ns-border transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-between items-center h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center flex-shrink-0 z-10">
              <Link
                to="/"
                className="text-2xl sm:text-3xl md:text-4xl font-heading font-semibold text-ns-ink transition-all duration-300 hover:text-ns-accent hover:drop-shadow-lg tracking-tight"
                aria-label={`${APP_NAME} Home`}
              >
                {APP_NAME}
              </Link>
            </div>

            {/* Right Section - Desktop */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 z-10">
              {/* Wallet Connect Button */}
              <div className="flex items-center">
                <WalletConnectButton />
              </div>

              {/* User Dropdown */}
              {loading ? (
                <div className="flex items-center justify-center w-10 h-10">
                  <Loader className="w-6 h-6 animate-spin text-ns-accent" />
                </div>
              ) : user ? (
                <div className="relative" ref={dropdownContainerRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown();
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--ns-ring)] focus:ring-offset-2 focus:ring-offset-[var(--ns-ring-offset)] transition-all hover:ring-2 hover:ring-ns-accent/30 hover:scale-105"
                    aria-label="User menu"
                    aria-expanded={isDropdownOpen}
                  >
                    {user.photoURL && user.photoURL.trim() !== "" ? (
                      <img
                        src={user.photoURL}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full border-2 border-ns-border hover:border-ns-accent transition-colors object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-ns-accent flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                  <UserDropdown
                    isOpen={isDropdownOpen}
                    onClose={closeDropdown}
                    user={user}
                    containerRef={dropdownContainerRef}
                  />
                </div>
              ) : (
                <Link
                  to="/sign-in"
                  className="px-5 py-2 bg-ns-accent hover:bg-ns-accent-hover text-white font-ui font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-ns-sm hover:shadow-ns text-sm"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-ns-ink-secondary hover:text-ns-ink hover:bg-ns-surface rounded-ns transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ns-ring)] active:scale-95"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
};

export default Navbar;
