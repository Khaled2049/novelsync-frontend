import { Link } from "react-router-dom";

interface NavLinksProps {
  className?: string;
  onLinkClick?: () => void;
}

const NavLinks = ({ className = "", onLinkClick }: NavLinksProps) => {
  const links = [{ to: "/explore", label: "Explore" }];

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onLinkClick}
          className={`text-black dark:text-white hover:text-dark-green dark:hover:text-light-green transition-colors duration-300 ${className}`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
};

export default NavLinks;
