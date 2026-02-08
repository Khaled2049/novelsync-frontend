import { PlotEvent, PlotLine, StoryBeatType, PacingType, DEFAULT_PLOT_EVENT_VALUES } from "@/types/IPlot";

export interface TensionDataPoint {
  index: number;
  eventId: string;
  eventName: string;
  plotLineId: string;
  plotLineName: string;
  tension: number;
  storyBeat: StoryBeatType;
  pacing: PacingType;
}

export interface NarrativeStats {
  averageTension: number;
  maxTension: number;
  minTension: number;
  tensionVariance: number;
  pacingDistribution: Record<PacingType, number>;
  storyBeatDistribution: Record<StoryBeatType, number>;
  totalEvents: number;
}

class NarrativeAnalysisService {
  // Ensure event has all required fields with defaults
  private migrateEvent(event: Partial<PlotEvent> & { id: string; name: string; content: string }, orderIndex: number): PlotEvent {
    return {
      ...DEFAULT_PLOT_EVENT_VALUES,
      ...event,
      orderIndex: event.orderIndex ?? orderIndex,
      characterIds: event.characterIds ?? [],
      locationId: event.locationId ?? null,
      dependencies: event.dependencies ?? [],
      dependents: event.dependents ?? [],
      tensionLevel: event.tensionLevel ?? 5,
      pacing: event.pacing ?? 'moderate',
      storyBeat: event.storyBeat ?? 'rising_action',
    };
  }

  // Generate tension curve data for visualization
  getTensionCurveData(plotLines: PlotLine[]): TensionDataPoint[] {
    const dataPoints: TensionDataPoint[] = [];
    let globalIndex = 0;

    for (const plotLine of plotLines) {
      for (let i = 0; i < plotLine.events.length; i++) {
        const event = this.migrateEvent(plotLine.events[i], i);
        dataPoints.push({
          index: globalIndex++,
          eventId: event.id,
          eventName: event.name,
          plotLineId: plotLine.id,
          plotLineName: plotLine.name,
          tension: event.tensionLevel,
          storyBeat: event.storyBeat,
          pacing: event.pacing,
        });
      }
    }

    return dataPoints;
  }

  // Generate tension data per plot line (for multi-line chart)
  getTensionCurveDataByPlotLine(plotLines: PlotLine[]): Record<string, TensionDataPoint[]> {
    const dataByPlotLine: Record<string, TensionDataPoint[]> = {};

    for (const plotLine of plotLines) {
      dataByPlotLine[plotLine.id] = plotLine.events.map((event, i) => {
        const migratedEvent = this.migrateEvent(event, i);
        return {
          index: i,
          eventId: migratedEvent.id,
          eventName: migratedEvent.name,
          plotLineId: plotLine.id,
          plotLineName: plotLine.name,
          tension: migratedEvent.tensionLevel,
          storyBeat: migratedEvent.storyBeat,
          pacing: migratedEvent.pacing,
        };
      });
    }

    return dataByPlotLine;
  }

  // Calculate narrative statistics
  getNarrativeStats(plotLines: PlotLine[]): NarrativeStats {
    const allEvents: PlotEvent[] = [];

    for (const plotLine of plotLines) {
      for (let i = 0; i < plotLine.events.length; i++) {
        allEvents.push(this.migrateEvent(plotLine.events[i], i));
      }
    }

    if (allEvents.length === 0) {
      return {
        averageTension: 0,
        maxTension: 0,
        minTension: 0,
        tensionVariance: 0,
        pacingDistribution: { slow: 0, moderate: 0, fast: 0 },
        storyBeatDistribution: {
          exposition: 0,
          inciting_incident: 0,
          rising_action: 0,
          midpoint: 0,
          climax: 0,
          falling_action: 0,
          resolution: 0,
        },
        totalEvents: 0,
      };
    }

    const tensions = allEvents.map(e => e.tensionLevel);
    const sum = tensions.reduce((a, b) => a + b, 0);
    const avg = sum / tensions.length;
    const variance = tensions.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / tensions.length;

    const pacingDist: Record<PacingType, number> = { slow: 0, moderate: 0, fast: 0 };
    const beatDist: Record<StoryBeatType, number> = {
      exposition: 0,
      inciting_incident: 0,
      rising_action: 0,
      midpoint: 0,
      climax: 0,
      falling_action: 0,
      resolution: 0,
    };

    for (const event of allEvents) {
      pacingDist[event.pacing]++;
      beatDist[event.storyBeat]++;
    }

    return {
      averageTension: Math.round(avg * 10) / 10,
      maxTension: Math.max(...tensions),
      minTension: Math.min(...tensions),
      tensionVariance: Math.round(variance * 10) / 10,
      pacingDistribution: pacingDist,
      storyBeatDistribution: beatDist,
      totalEvents: allEvents.length,
    };
  }

  // Analyze pacing issues (e.g., too many consecutive slow scenes)
  analyzePacingIssues(plotLines: PlotLine[]): string[] {
    const issues: string[] = [];

    for (const plotLine of plotLines) {
      let consecutiveSlow = 0;
      let consecutiveFast = 0;

      for (let i = 0; i < plotLine.events.length; i++) {
        const event = this.migrateEvent(plotLine.events[i], i);

        if (event.pacing === 'slow') {
          consecutiveSlow++;
          consecutiveFast = 0;
          if (consecutiveSlow >= 3) {
            issues.push(`"${plotLine.name}": ${consecutiveSlow} consecutive slow-paced scenes may drag the narrative.`);
          }
        } else if (event.pacing === 'fast') {
          consecutiveFast++;
          consecutiveSlow = 0;
          if (consecutiveFast >= 4) {
            issues.push(`"${plotLine.name}": ${consecutiveFast} consecutive fast-paced scenes may exhaust readers.`);
          }
        } else {
          consecutiveSlow = 0;
          consecutiveFast = 0;
        }
      }
    }

    return issues;
  }

  // Analyze tension flow (e.g., climax not at appropriate tension)
  analyzeTensionFlow(plotLines: PlotLine[]): string[] {
    const issues: string[] = [];

    for (const plotLine of plotLines) {
      const events = plotLine.events.map((e, i) => this.migrateEvent(e, i));

      for (const event of events) {
        if (event.storyBeat === 'climax' && event.tensionLevel < 7) {
          issues.push(`"${plotLine.name}" - "${event.name}": Climax has low tension (${event.tensionLevel}/10). Consider increasing.`);
        }
        if (event.storyBeat === 'exposition' && event.tensionLevel > 5) {
          issues.push(`"${plotLine.name}" - "${event.name}": Exposition has high tension (${event.tensionLevel}/10). May overwhelm readers early.`);
        }
        if (event.storyBeat === 'resolution' && event.tensionLevel > 6) {
          issues.push(`"${plotLine.name}" - "${event.name}": Resolution has high tension (${event.tensionLevel}/10). Consider winding down.`);
        }
      }
    }

    return issues;
  }

  // Get color for tension level
  getTensionColor(level: number): string {
    if (level <= 3) return '#22c55e'; // green
    if (level <= 5) return '#eab308'; // yellow
    if (level <= 7) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  // Get color for plot line (for multi-line charts)
  getPlotLineColor(index: number): string {
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f59e0b', // amber
      '#6366f1', // indigo
    ];
    return colors[index % colors.length];
  }
}

export const narrativeAnalysisService = new NarrativeAnalysisService();
