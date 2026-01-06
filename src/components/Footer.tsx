import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-6 dark:bg-black transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
        <div className="flex space-x-6 mb-4">
          <p className="text-sm text-white dark:text-white/70">
            By your continued use of this site, you accept such use. See our{" "}
            <Link
              to="/privacy-policy"
              className="text-light-green dark:text-dark-green hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              to="/terms-of-use"
              className="text-light-green dark:text-dark-green hover:underline"
            >
              Terms of Use
            </Link>
            .
          </p>
        </div>
        <p className="text-center text-sm text-white/70 dark:text-white/70">
          {new Date().getFullYear()} Khaled Hossain
        </p>
      </div>
    </footer>
  );
};

export default Footer;
