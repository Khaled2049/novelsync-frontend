import { Link } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { useState, useRef } from "react";
import { Loader, Menu, User } from "lucide-react";
import { WalletConnectButton } from "./WalletConnectButton";
import NavLinks from "./navbar/NavLinks";
import UserDropdown from "./navbar/UserDropdown";
import MobileMenu from "./navbar/MobileMenu";

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
      <nav className="w-full sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 transition-colors duration-300 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-between items-center h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center flex-shrink-0 z-10">
              <Link
                to="/"
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-dark-green to-light-green dark:from-light-green dark:to-dark-green transition-all duration-300 hover:scale-105 hover:drop-shadow-lg"
                aria-label="NovelSync Home"
              >
                NovelSync
              </Link>
            </div>

            {/* Center Section - Navigation Links (Desktop) */}
            <nav
              className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-4 xl:gap-6"
              aria-label="Main navigation"
            >
              <NavLinks />
            </nav>

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
                    className="flex items-center justify-center w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black transition-all hover:ring-2 hover:ring-dark-green/50 dark:hover:ring-light-green/50"
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
                  className="px-4 py-2 bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green"
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
