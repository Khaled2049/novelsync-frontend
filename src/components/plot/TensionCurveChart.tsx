import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { PlotLine } from "@/types/IPlot";
import { narrativeAnalysisService, NarrativeStats } from "@/services/NarrativeAnalysisService";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface TensionCurveChartProps {
  plotLines: PlotLine[];
}

export const TensionCurveChart: React.FC<TensionCurveChartProps> = ({
  plotLines,
}) => {
  const [viewMode, setViewMode] = useState<'combined' | 'separate'>('combined');
  const [showIssues, setShowIssues] = useState(false);

  const combinedData = useMemo(
    () => narrativeAnalysisService.getTensionCurveData(plotLines),
    [plotLines]
  );

  const dataByPlotLine = useMemo(
    () => narrativeAnalysisService.getTensionCurveDataByPlotLine(plotLines),
    [plotLines]
  );

  const stats: NarrativeStats = useMemo(
    () => narrativeAnalysisService.getNarrativeStats(plotLines),
    [plotLines]
  );

  const pacingIssues = useMemo(
    () => narrativeAnalysisService.analyzePacingIssues(plotLines),
    [plotLines]
  );

  const tensionIssues = useMemo(
    () => narrativeAnalysisService.analyzeTensionFlow(plotLines),
    [plotLines]
  );

  const allIssues = [...pacingIssues, ...tensionIssues];

  if (combinedData.length === 0) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400">
        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Add events to see the tension curve</p>
      </div>
    );
  }

  // Prepare data for separate lines view
  const maxEventCount = Math.max(...plotLines.map(pl => pl.events.length));
  const separateLineData = Array.from({ length: maxEventCount }, (_, i) => {
    const point: Record<string, number | string> = { index: i };
    plotLines.forEach((pl) => {
      const eventData = dataByPlotLine[pl.id]?.[i];
      if (eventData) {
        point[pl.id] = eventData.tension;
        point[`${pl.id}_name`] = eventData.eventName;
      }
    });
    return point;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'combined'
                ? 'bg-dark-green dark:bg-light-green text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Combined
          </button>
          <button
            onClick={() => setViewMode('separate')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'separate'
                ? 'bg-dark-green dark:bg-light-green text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            By Plot Line
          </button>
        </div>
        {allIssues.length > 0 && (
          <button
            onClick={() => setShowIssues(!showIssues)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
          >
            <AlertTriangle className="w-4 h-4" />
            {allIssues.length} issue{allIssues.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Issues Panel */}
      {showIssues && allIssues.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Narrative Suggestions</h4>
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
            {allIssues.map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'combined' ? (
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="eventName"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-white">{data.eventName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{data.plotLineName}</p>
                        <p className="text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Tension: </span>
                          <span
                            className="font-bold"
                            style={{ color: narrativeAnalysisService.getTensionColor(data.tension) }}
                          >
                            {data.tension}/10
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {data.storyBeat.replace('_', ' ')} • {data.pacing}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="tension"
                stroke="#22c55e"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const color = narrativeAnalysisService.getTensionColor(payload.tension);
                  return (
                    <circle
                      key={payload.eventId}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          ) : (
            <LineChart data={separateLineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(v) => `Event ${v + 1}`}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Event {Number(label) + 1}</p>
                        {payload.map((p: any, i: number) => (
                          <div key={i} className="text-sm" style={{ color: p.color }}>
                            {plotLines.find(pl => pl.id === p.dataKey)?.name}: {p.value}/10
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="5 5" />
              <Legend />
              {plotLines.map((pl, i) => (
                <Line
                  key={pl.id}
                  type="monotone"
                  dataKey={pl.id}
                  name={pl.name}
                  stroke={narrativeAnalysisService.getPlotLineColor(i)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageTension}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Tension</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-500">{stats.maxTension}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Peak</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-500">{stats.minTension}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Low</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEvents}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Events</div>
        </div>
      </div>

      {/* Pacing Distribution */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Slow: {stats.pacingDistribution.slow}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Moderate: {stats.pacingDistribution.moderate}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Fast: {stats.pacingDistribution.fast}</span>
        </div>
      </div>
    </div>
  );
};
