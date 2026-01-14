import { APP_NAME } from "@/config/seo";

const Announcements: React.FC = () => {
  return (
    <div className="p-6 max-w-screen-md mx-auto space-y-8">
      {/* Announcements Section */}
      <div className="announcements-container bg-gray-100 dark:bg-neutral-900 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
          Announcements
        </h2>
        <div className="announcement-item p-4 border-l-4 border-blue-600 rounded-md shadow-sm bg-white dark:bg-neutral-800">
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            Khaled's Release Party
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            Join us in celebrating the release of {APP_NAME}! Stay tuned for
            more details about the event.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
