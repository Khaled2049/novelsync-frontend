// Define a type for a Leaderboard entry
type LeaderboardEntry = {
  rank: number;
  username: string;
  score: number;
};

// Mock Data for Leaderboard entries
const mockLeaderboardData: LeaderboardEntry[] = [
  { rank: 1, username: "WriterPro", score: 1500 },
  { rank: 2, username: "StoryMaster", score: 1450 },
  { rank: 3, username: "EpicScribe", score: 1400 },
  { rank: 4, username: "FictionFanatic", score: 1300 },
  { rank: 5, username: "NovelNovice", score: 1250 },
  // Add more entries as needed
];

const Leaderboards: React.FC = () => {
  return (
    <div className="leaderboards-container p-6 max-w-screen-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Top Writers Leaderboard</h2>

      <div className="bg-gray-100 rounded-lg shadow-md p-4">
        <ul>
          {mockLeaderboardData.map((entry) => (
            <li
              key={entry.rank}
              className={`p-3 flex justify-between items-center rounded-md ${
                entry.rank <= 3 ? "bg-yellow-100" : ""
              } mb-2`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-xl font-semibold">{entry.rank}</span>
                <span
                  className={`font-medium ${
                    entry.rank <= 3 ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {entry.username}
                </span>
              </div>
              <span className="text-gray-700 font-semibold">
                {entry.score} pts
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Leaderboards;
