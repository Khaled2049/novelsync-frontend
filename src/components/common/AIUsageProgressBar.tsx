import { useAiUsage } from "@/contexts/AiUsageContext";

export const AIUsageProgressBar = () => {
  const { getRemainingAiUsage } = useAiUsage();

  const remaining = getRemainingAiUsage();
  const used = 10 - remaining;
  const percentage = (used / 10) * 100;

  // Determine color based on usage
  const getColorClasses = () => {
    if (remaining === 0) {
      return "bg-red-500 dark:bg-red-600";
    } else if (remaining <= 3) {
      return "bg-yellow-500 dark:bg-yellow-600";
    } else {
      return "bg-dark-green dark:bg-light-green";
    }
  };

  const getTextColor = () => {
    if (remaining === 0) {
      return "text-red-600 dark:text-red-400";
    } else if (remaining <= 3) {
      return "text-yellow-600 dark:text-yellow-400";
    } else {
      return "text-dark-green dark:text-light-green";
    }
  };

  return (
    <div className="">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <span className={`text-sm font-medium ${getTextColor()}`}>
                AI Usage: {used} / 10
              </span>
            </div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getColorClasses()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex-shrink-0">
              <span className={`text-xs ${getTextColor()}`}>
                {remaining} remaining
              </span>
            </div>
          </div>
          {remaining === 0 && (
            <div className="flex-shrink-0">
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                Limit reached - resets at midnight UTC
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
