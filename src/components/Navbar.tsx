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
      <nav className="w-full sticky top-0 z-50 bg-white/95 dark:bg-dark-green/95 backdrop-blur-lg transition-colors duration-300 shadow-sm dark:shadow-dark-green/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-between items-center h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center flex-shrink-0 z-10">
              <Link
                to="/"
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-dark-green dark:text-light-green transition-all duration-300 hover:scale-105 hover:drop-shadow-lg"
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
                  <Loader className="w-6 h-6 animate-spin text-dark-green dark:text-light-green" />
                </div>
              ) : user ? (
                <div className="relative" ref={dropdownContainerRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown();
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-light-green/10 dark:focus:ring-offset-dark-green transition-all hover:ring-2 hover:ring-dark-green/50 dark:hover:ring-light-green/50 hover:scale-105"
                    aria-label="User menu"
                    aria-expanded={isDropdownOpen}
                  >
                    {user.photoURL && user.photoURL.trim() !== "" ? (
                      <img
                        src={user.photoURL}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full border-2 border-dark-green dark:border-light-green object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-dark-green dark:bg-light-green flex items-center justify-center">
                        <User className="w-6 h-6 text-white dark:text-black" />
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
                  className="px-4 py-2 bg-dark-green dark:bg-light-green hover:bg-dark-green/90 dark:hover:bg-light-green/90 text-white dark:text-dark-green font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-dark-green dark:text-light-green hover:bg-dark-green/10 dark:hover:bg-light-green/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green active:scale-95"
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
