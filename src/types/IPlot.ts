// Story beat types for narrative structure
export type StoryBeatType =
  | 'exposition'
  | 'inciting_incident'
  | 'rising_action'
  | 'midpoint'
  | 'climax'
  | 'falling_action'
  | 'resolution';

// Pacing types for scene rhythm
export type PacingType = 'slow' | 'moderate' | 'fast';

// Time constraint for chronological ordering
export interface TimeConstraint {
  type: 'absolute' | 'relative';
  absoluteDate?: string;              // ISO date or partial ("1985", "1985-06")
  relativeToEventId?: string;
  relativePosition?: 'before' | 'after' | 'same_time';
  timeGap?: string;                   // "2 days later", "moments before"
}

// Event dependency for cause-effect relationships
export interface EventDependency {
  eventId: string;
  plotLineId: string;
  relationshipType: 'causes' | 'requires' | 'blocks' | 'enables' | 'contradicts';
  description?: string;
}

export interface PlotEvent {
  id: string;
  name: string;
  content: string;
  userId?: string;                    // Owner/creator of the event

  // Character & Location mapping (IDs, not embedded)
  characterIds: string[];
  locationId: string | null;

  // Dependencies (bidirectional for fast lookups)
  dependencies: EventDependency[];
  dependents: EventDependency[];

  // Tension & Pacing
  tensionLevel: number;               // 1-10 scale
  pacing: PacingType;
  storyBeat: StoryBeatType;
  emotionalTone?: string;

  // Chronological constraints
  timeConstraint?: TimeConstraint;
  orderIndex: number;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

// Default values for migrating old events
export const DEFAULT_PLOT_EVENT_VALUES: Omit<PlotEvent, 'id' | 'name' | 'content'> = {
  characterIds: [],
  locationId: null,
  dependencies: [],
  dependents: [],
  tensionLevel: 5,
  pacing: 'moderate',
  storyBeat: 'rising_action',
  orderIndex: 0,
};

// Helper to migrate legacy events
export function migrateEvent(legacyEvent: { id: string; name: string; content: string }, orderIndex: number): PlotEvent {
  return {
    ...legacyEvent,
    ...DEFAULT_PLOT_EVENT_VALUES,
    orderIndex,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface PlotLine {
  id: string;
  name: string;
  description: string;
  events: PlotEvent[];
}

export interface TemplateItem {
  id: number;
  name: string;
  content: string;
}

export interface TemplateData {
  id: number;
  name: string;
  events: TemplateItem[];
}

export const PLOT_TEMPLATES: TemplateData[] = [
  {
    id: 1,
    name: "Overcoming the Monster",
    events: [
      {
        id: 1,
        name: "Anticipation Stage",
        content:
          "The hero exists in a peaceful state but becomes aware of a deadly threat (the Monster) usually from a great distance.",
      },
      {
        id: 2,
        name: "Dream Stage",
        content:
          "The hero commits to the quest. Things go well for a while, and the hero travels toward the threat comfortably.",
      },
      {
        id: 3,
        name: "Frustration Stage",
        content:
          "The hero comes face to face with the Monster's power. They feel small and weak; the battle seems impossible.",
      },
      {
        id: 4,
        name: "Nightmare Stage",
        content:
          "The final ordeal. The hero is trapped, alone, and facing imminent death at the hands of the Monster.",
      },
      {
        id: 5,
        name: "The Thrilling Escape",
        content:
          "Against all odds, the hero strikes the fatal blow, kills the monster, and escapes death, gaining a great prize (treasure, kingdom, etc.).",
      },
    ],
  },
  {
    id: 2,
    name: "Rags to Riches",
    events: [
      {
        id: 1,
        name: "Initial Wretchedness",
        content:
          "The young hero is in a lowly, unhappy state, usually overshadowed by 'dark' figures (wicked stepparents, etc.).",
      },
      {
        id: 2,
        name: "The Call & Success",
        content:
          "The hero is called out into the wider world and has a rapid rise to success/happiness.",
      },
      {
        id: 3,
        name: "The Central Crisis",
        content:
          "Everything goes wrong. The hero is separated from their success/love interest and falls into despair.",
      },
      {
        id: 4,
        name: "Independence & The Ordeal",
        content:
          "The hero discovers a new inner strength and faces a final test without the help of magic or mentors.",
      },
      {
        id: 5,
        name: "Union & Completion",
        content:
          "The hero succeeds, achieving permanent status (often marriage or a kingdom).",
      },
    ],
  },
  {
    id: 3,
    name: "The Quest",
    events: [
      {
        id: 1,
        name: "The Call",
        content:
          "Life in the hero's home is stagnating or under threat. They must find an Object or Location to save it.",
      },
      {
        id: 2,
        name: "The Journey",
        content:
          "The hero and companions travel across hostile terrain, facing monsters and temptations.",
      },
      {
        id: 3,
        name: "Arrival & Frustration",
        content:
          "The hero arrives within sight of the goal but encounters a new, overwhelming obstacle.",
      },
      {
        id: 4,
        name: "The Final Ordeal",
        content:
          "The hero must face a final test (often involving the 'Guardian' of the goal) to prove their worth.",
      },
      {
        id: 5,
        name: "The Goal",
        content:
          "The hero achieves the goal and returns home to restore order.",
      },
    ],
  },
  {
    id: 4,
    name: "Voyage and Return",
    events: [
      {
        id: 1,
        name: "Anticipation",
        content:
          "The hero, often bored or curious, falls or is transported into a strange, new world.",
      },
      {
        id: 2,
        name: "Dream Stage",
        content:
          "The new world is puzzling but fascinating. The hero explores it with wonder.",
      },
      {
        id: 3,
        name: "Frustration Stage",
        content:
          "The mood shifts. The new world becomes threatening or oppressive. The hero wants to leave but can't.",
      },
      {
        id: 4,
        name: "Nightmare Stage",
        content:
          "The threat closes in. The hero's life is in danger, and there seems to be no way out.",
      },
      {
        id: 5,
        name: "Thrilling Escape",
        content:
          "The hero escapes back to their own world, changed forever by the experience.",
      },
    ],
  },
  {
    id: 5,
    name: "Tragedy",
    events: [
      {
        id: 1,
        name: "Anticipation",
        content:
          " The hero wants something (power, forbidden love) but is incomplete or unsatisfied.",
      },
      {
        id: 2,
        name: "The Dream",
        content:
          "The hero commits to a course of action (often immoral) and things go surprisingly well.",
      },
      {
        id: 3,
        name: "Frustration",
        content:
          "Things start to go wrong. The hero feels threatened and commits further dark acts to secure their position.",
      },
      {
        id: 4,
        name: "Nightmare",
        content:
          "The forces of opposition close in. The hero loses control of their destiny.",
      },
      {
        id: 5,
        name: "Destruction",
        content:
          "The hero is destroyed (death or ruin) as a consequence of their actions.",
      },
    ],
  },
  {
    id: 6,
    name: "Comedy",
    events: [
      {
        id: 1,
        name: "Shadow of Confusion",
        content:
          "Relationships are blocked by authority figures or misunderstandings. Everyone is at cross-purposes.",
      },
      {
        id: 2,
        name: "Pressure Mounts",
        content:
          "The confusion worsens. Characters try to solve problems but only make the web of lies/mistakes more complex.",
      },
      {
        id: 3,
        name: "The Night of Confusion",
        content:
          "The chaos reaches a peak. Identies are mistaken, and the characters are at their lowest point.",
      },
      {
        id: 4,
        name: "Resolution",
        content:
          "A key truth is revealed (often the recognition of a true identity).",
      },
      {
        id: 5,
        name: "Happy Ending",
        content:
          "Order is restored, couples are united, and everyone (except perhaps the villain) is forgiven.",
      },
    ],
  },
  {
    id: 7,
    name: "Rebirth",
    events: [
      {
        id: 1,
        name: "Under the Shadow",
        content:
          "The hero falls under the spell of a dark power (or is the villain themselves) and is isolated.",
      },
      {
        id: 2,
        name: "The Threat Recedes",
        content:
          "For a while, it seems like things might be okay. The hero has a glimpse of a better life.",
      },
      {
        id: 3,
        name: "The Threat Returns",
        content:
          "The dark power returns with a vengeance, imprisoning the hero in a state of living death.",
      },
      {
        id: 4,
        name: "The Dark Night",
        content:
          "All seems lost. The hero must be redeemed by someone else (often a child or innocent).",
      },
      {
        id: 5,
        name: "Completion",
        content:
          "The hero is redeemed and 'reborn' into a new, corrected life.",
      },
    ],
  },
];
