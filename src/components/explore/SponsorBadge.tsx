import { Award, ExternalLink } from "lucide-react";
import { ISponsor } from "@/types/ICompetition";

interface SponsorBadgeProps {
  sponsor: ISponsor;
  variant?: "compact" | "full";
  showMessage?: boolean;
}

const getTierColor = (tier?: string) => {
  switch (tier) {
    case "platinum":
      return "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-gray-300 dark:border-gray-600";
    case "gold":
      return "bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 border-yellow-300 dark:border-yellow-600";
    case "silver":
      return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-gray-200 dark:border-gray-600";
    case "bronze":
      return "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-600";
    default:
      return "bg-gradient-to-r from-dark-green/10 to-light-green/10 dark:from-dark-green/20 dark:to-light-green/20 border-dark-green/20 dark:border-light-green/20";
  }
};

const SponsorBadge: React.FC<SponsorBadgeProps> = ({
  sponsor,
  variant = "compact",
  showMessage = false,
}) => {
  const handleClick = () => {
    if (sponsor.website) {
      window.open(sponsor.website, "_blank", "noopener,noreferrer");
    }
  };

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all duration-200 ${getTierColor(
          sponsor.tier
        )} ${sponsor.website ? "hover:scale-105" : ""}`}
        onClick={sponsor.website ? handleClick : undefined}
      >
        <Award className="w-4 h-4 text-dark-green dark:text-light-green" />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Sponsored by {sponsor.name}
        </span>
        {sponsor.website && (
          <ExternalLink className="w-3 h-3 text-gray-500 dark:text-gray-400" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border-2 ${getTierColor(sponsor.tier)} ${
        sponsor.website
          ? "cursor-pointer hover:shadow-lg transition-all duration-200"
          : ""
      }`}
      onClick={sponsor.website ? handleClick : undefined}
    >
      <div className="flex items-center gap-3 mb-2">
        {sponsor.logo ? (
          <img
            src={sponsor.logo}
            alt={sponsor.name}
            className="w-10 h-10 object-contain rounded"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-dark-green/20 dark:bg-light-green/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-dark-green dark:text-light-green" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Presented by {sponsor.name}
            </span>
            {sponsor.website && (
              <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          {sponsor.tier && (
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {sponsor.tier} Sponsor
            </span>
          )}
        </div>
      </div>
      {showMessage && sponsor.message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
          "{sponsor.message}"
        </p>
      )}
    </div>
  );
};

export default SponsorBadge;
