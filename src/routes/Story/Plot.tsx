import PlotTimeline from "../../components/plot/PlotTimeline";

const Plot: React.FC = () => {
  return (
    <div className="p-6 min-h-screen bg-neutral-50 dark:bg-black transition-colors duration-200">
      <h1 className="text-3xl font-bold text-black dark:text-white mb-6">
        Plot Timeline
      </h1>
      <PlotTimeline />
    </div>
  );
};

export default Plot;
