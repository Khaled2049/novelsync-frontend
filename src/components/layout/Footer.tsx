import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-ns-surface border-t border-ns-border py-6 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
        <div className="flex space-x-6 mb-4">
          <p className="text-sm text-ns-ink-secondary font-ui">
            By your continued use of this site, you accept such use. See our{" "}
            <Link
              to="/privacy-policy"
              className="text-ns-accent hover:text-ns-accent-hover hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              to="/terms-of-use"
              className="text-ns-accent hover:text-ns-accent-hover hover:underline"
            >
              Terms of Use
            </Link>
            .
          </p>
        </div>
        <p className="text-center text-sm text-ns-ink-muted font-ui">
          <a
            href="https://khaled.codexn.com"
            target="_blank"
            rel="noreferrer"
            className="text-ns-accent hover:text-ns-accent-hover hover:underline"
          >
            {new Date().getFullYear()} Khaled Hossain
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
