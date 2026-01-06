import { Award, ExternalLink, MessageSquare } from "lucide-react";
import { ISponsor } from "@/types/ICompetition";

interface SponsorSectionProps {
  sponsor: ISponsor;
}

const getTierBadgeColor = (tier?: string) => {
  switch (tier) {
    case "platinum":
      return "bg-gray-600 text-white";
    case "gold":
      return "bg-yellow-500 text-white";
    case "silver":
      return "bg-gray-400 text-white";
    case "bronze":
      return "bg-orange-600 text-white";
    default:
      return "bg-dark-green text-white dark:bg-light-green";
  }
};

const SponsorSection: React.FC<SponsorSectionProps> = ({ sponsor }) => {
  const handleClick = () => {
    if (sponsor.website) {
      window.open(sponsor.website, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-gradient-to-r from-dark-green/5 to-light-green/5 dark:from-dark-green/10 dark:to-light-green/10 rounded-xl border-2 border-dark-green/20 dark:border-light-green/20 p-6">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          {sponsor.logo ? (
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="w-16 h-16 object-contain rounded-lg bg-white dark:bg-neutral-800 p-2 border border-gray-200 dark:border-neutral-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-dark-green/20 dark:bg-light-green/20 flex items-center justify-center border border-dark-green/30 dark:border-light-green/30">
              <Award className="w-8 h-8 text-dark-green dark:text-light-green" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-black dark:text-white">
              Presented by {sponsor.name}
            </h3>
            {sponsor.tier && (
              <span
                className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getTierBadgeColor(
                  sponsor.tier
                )}`}
              >
                {sponsor.tier}
              </span>
            )}
            {sponsor.website && (
              <button
                onClick={handleClick}
                className="ml-auto p-2 hover:bg-dark-green/10 dark:hover:bg-light-green/10 rounded-lg transition-colors"
                aria-label="Visit sponsor website"
              >
                <ExternalLink className="w-5 h-5 text-dark-green dark:text-light-green" />
              </button>
            )}
          </div>

          {/* Pinned Message */}
          {sponsor.message && (
            <div className="mt-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border-l-4 border-dark-green dark:border-light-green">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-5 h-5 text-dark-green dark:text-light-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white mb-1">
                    Message from {sponsor.name}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {sponsor.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Website Link */}
          {sponsor.website && (
            <a
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm text-dark-green dark:text-light-green hover:underline"
            >
              Visit {sponsor.name}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SponsorSection;
