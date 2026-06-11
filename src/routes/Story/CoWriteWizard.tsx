import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  X,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  MapPin,
  Swords,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { storiesRepo } from "@/services/StoriesRepo";
import { characterService } from "@/services/CharacterService";
import { placeService } from "@/services/PlaceService";
import { plotService } from "@/services/PlotService";
import { DEFAULT_PLOT_EVENT_VALUES, StoryBeatType } from "@/types/IPlot";
import {
  enhanceWizardInput,
  WizardEnhanceType,
  BlueprintResult,
} from "@/api/ai";
import { ApiError } from "@/api";
import { STORY_CATEGORIES as CATEGORIES } from "@/constants/storyOptions";

// ── Types ────────────────────────────────────────────────────────────────────

interface CoWriteWizardProps {
  userId: string;
  onClose: () => void;
  onSuccess: (storyId: string) => void;
}

type DraftCharacter = { name: string; description: string; expanded: boolean };
type DraftPlace = { name: string; description: string; expanded: boolean };
type DraftEvent = { name: string; storyBeat: StoryBeatType };

// ── Constants ────────────────────────────────────────────────────────────────

const STORY_BEATS: { value: StoryBeatType; label: string }[] = [
  { value: "exposition", label: "Exposition" },
  { value: "inciting_incident", label: "Inciting Incident" },
  { value: "rising_action", label: "Rising Action" },
  { value: "midpoint", label: "Midpoint" },
  { value: "climax", label: "Climax" },
  { value: "falling_action", label: "Falling Action" },
  { value: "resolution", label: "Resolution" },
];

const STEPS = [
  { icon: BookOpen, label: "Concept" },
  { icon: Users, label: "Characters" },
  { icon: MapPin, label: "Places" },
  { icon: Swords, label: "Conflict" },
  { icon: Sparkles, label: "Blueprint" },
  { icon: FileCheck, label: "Review" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const splitTags = (tags: string) =>
  tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const now = () => new Date().toISOString();

// ── Component ────────────────────────────────────────────────────────────────

const CoWriteWizard: React.FC<CoWriteWizardProps> = ({
  userId,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlueprintLoading, setIsBlueprintLoading] = useState(false);
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [blueprintData, setBlueprintData] = useState<BlueprintResult | null>(
    null,
  );
  const [previousBlueprintData, setPreviousBlueprintData] =
    useState<BlueprintResult | null>(null);
  const [blueprintError, setBlueprintError] = useState<string | null>(null);

  // Step 0 — Concept
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  // Step 1 — Characters
  const [characters, setCharacters] = useState<DraftCharacter[]>([]);

  // Step 2 — Places
  const [places, setPlaces] = useState<DraftPlace[]>([]);

  // Step 3 — Conflict / Plot
  const [plotLineName, setPlotLineName] = useState("Main Plot");
  const [conflict, setConflict] = useState("");
  const [events, setEvents] = useState<DraftEvent[]>([]);

  // ── AI enhancement ────────────────────────────────────────────────────────

  const handleEnhance = async (
    key: string,
    type: WizardEnhanceType,
    data: Record<string, unknown>,
    onResult: (result: string) => void,
  ) => {
    setEnhancing(key);
    try {
      const res = await enhanceWizardInput({ type, data });
      if (res.success && res.data?.enhanced) {
        onResult(res.data.enhanced);
        toast.success("Enhanced!");
      } else {
        toast.error(res.error ?? "Enhancement failed. Please try again.");
      }
    } catch {
      toast.error("Could not reach AI. Check your connection.");
    } finally {
      setEnhancing(null);
    }
  };

  // ── Blueprint generation ──────────────────────────────────────────────────

  const generateBlueprint = useCallback(async () => {
    if (blueprintData) {
      setPreviousBlueprintData(blueprintData);
    }
    setBlueprintData(null);
    setBlueprintError(null);
    setIsBlueprintLoading(true);

    try {
      const res = await enhanceWizardInput({
        type: "blueprint",
        data: {
          title,
          premise: description,
          genre: category,
          characters: characters
            .filter((c) => c.name.trim())
            .map(({ name, description: desc }) => ({
              name,
              description: desc,
            })),
          places: places
            .filter((p) => p.name.trim())
            .map(({ name, description: desc }) => ({
              name,
              description: desc,
            })),
          conflict,
          events: events
            .filter((e) => e.name.trim())
            .map(({ name, storyBeat }) => ({ name, storyBeat })),
        },
      });

      if (res.success && res.data?.blueprint) {
        setBlueprintData(res.data.blueprint);
      } else {
        setBlueprintError(
          res.error ?? "Blueprint generation failed. Try regenerating.",
        );
      }
    } catch (err) {
      let msg = "Could not reach AI. Check your connection.";
      if (err instanceof ApiError) {
        const serverMsg = (err.response.data as { error?: string }).error;
        if (serverMsg) msg = serverMsg;
      }
      setBlueprintError(msg);
    } finally {
      setIsBlueprintLoading(false);
    }
  }, [
    title,
    description,
    category,
    characters,
    places,
    conflict,
    events,
    blueprintData,
  ]);

  useEffect(() => {
    if (step === 4) {
      setBlueprintData(null);
      generateBlueprint();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  // generateBlueprint is intentionally excluded — we only want to trigger once on step entry

  // ── Navigation ────────────────────────────────────────────────────────────

  const canAdvance = step === 0 ? title.trim().length > 0 : true;

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleUndo = () => {
    setBlueprintData(previousBlueprintData);
    setPreviousBlueprintData(null);
    setBlueprintError(null);
  };

  // ── Character helpers ─────────────────────────────────────────────────────

  const addCharacter = () =>
    setCharacters((prev) => [
      ...prev,
      { name: "", description: "", expanded: true },
    ]);

  const removeCharacter = (i: number) =>
    setCharacters((prev) => prev.filter((_, idx) => idx !== i));

  const updateCharacter = (
    i: number,
    field: keyof DraftCharacter,
    value: string | boolean,
  ) =>
    setCharacters((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );

  // ── Place helpers ─────────────────────────────────────────────────────────

  const addPlace = () =>
    setPlaces((prev) => [
      ...prev,
      { name: "", description: "", expanded: true },
    ]);

  const removePlace = (i: number) =>
    setPlaces((prev) => prev.filter((_, idx) => idx !== i));

  const updatePlace = (
    i: number,
    field: keyof DraftPlace,
    value: string | boolean,
  ) =>
    setPlaces((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)),
    );

  // ── Event helpers ─────────────────────────────────────────────────────────

  const addEvent = () =>
    setEvents((prev) => [
      ...prev,
      { name: "", storyBeat: "rising_action" as StoryBeatType },
    ]);

  const removeEvent = (i: number) =>
    setEvents((prev) => prev.filter((_, idx) => idx !== i));

  const updateEvent = (i: number, field: keyof DraftEvent, value: string) =>
    setEvents((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    );

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleLaunch = async () => {
    setIsSubmitting(true);
    try {
      // Apply blueprint enrichments to the saved data where available
      const finalDescription = blueprintData?.premise ?? description;
      const finalConflict = blueprintData?.conflict ?? conflict;

      // 1. Create story
      const storyId = await storiesRepo.createStory(
        title,
        finalDescription,
        userId,
        {
          category,
          tags: splitTags(tags),
          targetAudience: "",
          language: "",
          copyright: "",
          coverImageUrl: "",
        },
      );

      // 2. Create plot (if any content)
      const hasPlot = finalConflict.trim() || events.some((e) => e.name.trim());
      if (hasPlot) {
        const plotLineId = await plotService.addPlot(storyId, plotLineName);
        let orderIndex = 0;

        if (finalConflict.trim()) {
          await plotService.addEvent(storyId, plotLineId, {
            ...DEFAULT_PLOT_EVENT_VALUES,
            id: crypto.randomUUID(),
            name: "Central Conflict",
            content: finalConflict,
            storyBeat: "inciting_incident",
            orderIndex: orderIndex++,
            userId,
            createdAt: now(),
            updatedAt: now(),
          });
        }

        for (const ev of events.filter((e) => e.name.trim())) {
          await plotService.addEvent(storyId, plotLineId, {
            ...DEFAULT_PLOT_EVENT_VALUES,
            id: crypto.randomUUID(),
            name: ev.name,
            content: "",
            storyBeat: ev.storyBeat,
            orderIndex: orderIndex++,
            userId,
            createdAt: now(),
            updatedAt: now(),
          });
        }
      }

      // 3. Create characters — prefer AI-enriched versions from blueprintData
      const enrichedChars =
        blueprintData?.characters ??
        characters
          .filter((c) => c.name.trim())
          .map(({ name, description: desc }) => ({ name, description: desc }));

      await Promise.all(
        enrichedChars
          .filter((c) => c.name.trim())
          .map((c) =>
            characterService.addCharacter(storyId, {
              name: c.name,
              age: undefined,
              soul: "",
              personality:
                "personality" in c
                  ? ((c as { personality?: string }).personality ?? "")
                  : "",
              voice: "",
              backstory:
                "backstory" in c
                  ? ((c as { backstory?: string }).backstory ?? c.description)
                  : c.description,
              affiliations: "",
              notes: "",
              relationships: [],
              userId,
              artUrl: "",
            }),
          ),
      );

      // 4. Create places — prefer AI-enriched versions from blueprintData
      const enrichedPlaces =
        blueprintData?.places ??
        places
          .filter((p) => p.name.trim())
          .map(({ name, description: desc }) => ({ name, description: desc }));

      await Promise.all(
        enrichedPlaces
          .filter((p) => p.name.trim())
          .map((p) =>
            placeService.addPlace(storyId, {
              name: p.name,
              description: p.description,
              atmosphere:
                "atmosphere" in p
                  ? ((p as { atmosphere?: string }).atmosphere ?? "")
                  : "",
              geography: "",
              history:
                "history" in p
                  ? ((p as { history?: string }).history ?? "")
                  : "",
              significance: "",
              notes: "",
              userId,
              storyId,
              imageUrl: "",
            }),
          ),
      );

      toast.success("Your story blueprint is ready — time to write!");
      onSuccess(storyId);
    } catch (err) {
      console.error("Error launching co-written story:", err);
      toast.error("Failed to create story. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── EnhanceBtn — call-aware inline component ──────────────────────────────

  const EnhanceBtn = ({
    enhanceKey,
    label = "Enhance with AI",
    type,
    data,
    onResult,
    disabled: extraDisabled = false,
  }: {
    enhanceKey: string;
    label?: string;
    type: WizardEnhanceType;
    data: Record<string, unknown>;
    onResult: (result: string) => void;
    disabled?: boolean;
  }) => {
    const isActive = enhancing === enhanceKey;
    const isDisabled = extraDisabled || (enhancing !== null && !isActive);

    return (
      <button
        type="button"
        onClick={() => handleEnhance(enhanceKey, type, data, onResult)}
        disabled={isActive || isDisabled}
        className="inline-flex items-center gap-1.5 text-xs font-ui transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
      >
        {isActive ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {isActive ? "Enhancing…" : label}
      </button>
    );
  };

  // ── Step renderers ────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-ns-ink mb-1">
          What is your story about?
        </h2>
        <p className="font-body text-ns-ink-secondary text-sm">
          Start with the core idea — you can always refine it later.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your story a working title…"
          className="h-12 text-base bg-ns-surface border-ns-border text-ns-ink focus:ring-ns-accent"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
            Premise
          </Label>
          <EnhanceBtn
            enhanceKey="premise"
            type="premise"
            data={{ title, premise: description, genre: category }}
            onResult={setDescription}
            disabled={!title.trim()}
          />
        </div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the core idea, tone, and what makes your story unique…"
          rows={5}
          className="bg-ns-surface border-ns-border text-ns-ink resize-none focus:ring-ns-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
            Genre
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 bg-ns-surface border-ns-border text-ns-ink">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent className="bg-ns-surface border-ns-border">
              {CATEGORIES.map(({ value, label }) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-ns-ink focus:bg-ns-surface-hover"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
            Tags
          </Label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. magic, heist, redemption"
            className="h-11 bg-ns-surface border-ns-border text-ns-ink focus:ring-ns-accent"
          />
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-ns-ink mb-1">
          Who are the main characters?
        </h2>
        <p className="font-body text-ns-ink-secondary text-sm">
          Add your key characters — a name and a brief description is enough to
          start.
        </p>
      </div>

      <div className="space-y-3">
        {characters.map((char, i) => (
          <div
            key={i}
            className="border border-ns-border rounded-lg bg-ns-surface overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Input
                value={char.name}
                onChange={(e) => updateCharacter(i, "name", e.target.value)}
                placeholder="Character name…"
                className="flex-1 h-9 bg-ns-elevated border-ns-border text-ns-ink text-sm focus:ring-ns-accent"
              />
              <button
                type="button"
                onClick={() => updateCharacter(i, "expanded", !char.expanded)}
                className="text-ns-ink-muted hover:text-ns-ink transition-colors p-1"
                aria-label={char.expanded ? "Collapse" : "Expand"}
              >
                {char.expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => removeCharacter(i)}
                className="text-ns-ink-muted hover:text-ns-destructive transition-colors p-1"
                aria-label="Remove character"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {char.expanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-ns-border pt-3">
                <div className="flex items-center justify-between">
                  <Label className="font-ui text-xs text-ns-ink-secondary">
                    Brief description
                  </Label>
                  <EnhanceBtn
                    enhanceKey={`character-${i}`}
                    label="Suggest traits"
                    type="character"
                    data={{
                      characterName: char.name,
                      characterDescription: char.description,
                    }}
                    onResult={(v) => updateCharacter(i, "description", v)}
                    disabled={!char.name.trim()}
                  />
                </div>
                <Textarea
                  value={char.description}
                  onChange={(e) =>
                    updateCharacter(i, "description", e.target.value)
                  }
                  placeholder="Who are they? What drives them? What makes them compelling?"
                  rows={3}
                  className="bg-ns-elevated border-ns-border text-ns-ink text-sm resize-none focus:ring-ns-accent"
                />
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addCharacter}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-ns-border rounded-lg text-sm font-ui text-ns-ink-secondary hover:border-ns-accent hover:text-ns-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Character
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-ns-ink mb-1">
          Where does it take place?
        </h2>
        <p className="font-body text-ns-ink-secondary text-sm">
          Describe the world or settings your story inhabits.
        </p>
      </div>

      <div className="space-y-3">
        {places.map((place, i) => (
          <div
            key={i}
            className="border border-ns-border rounded-lg bg-ns-surface overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Input
                value={place.name}
                onChange={(e) => updatePlace(i, "name", e.target.value)}
                placeholder="Place name…"
                className="flex-1 h-9 bg-ns-elevated border-ns-border text-ns-ink text-sm focus:ring-ns-accent"
              />
              <button
                type="button"
                onClick={() => updatePlace(i, "expanded", !place.expanded)}
                className="text-ns-ink-muted hover:text-ns-ink transition-colors p-1"
                aria-label={place.expanded ? "Collapse" : "Expand"}
              >
                {place.expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => removePlace(i)}
                className="text-ns-ink-muted hover:text-ns-destructive transition-colors p-1"
                aria-label="Remove place"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {place.expanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-ns-border pt-3">
                <div className="flex items-center justify-between">
                  <Label className="font-ui text-xs text-ns-ink-secondary">
                    Description & atmosphere
                  </Label>
                  <EnhanceBtn
                    enhanceKey={`place-${i}`}
                    label="Enrich world"
                    type="place"
                    data={{
                      placeName: place.name,
                      placeDescription: place.description,
                    }}
                    onResult={(v) => updatePlace(i, "description", v)}
                    disabled={!place.name.trim()}
                  />
                </div>
                <Textarea
                  value={place.description}
                  onChange={(e) =>
                    updatePlace(i, "description", e.target.value)
                  }
                  placeholder="What does it look like, feel like? What's its history or significance?"
                  rows={3}
                  className="bg-ns-elevated border-ns-border text-ns-ink text-sm resize-none focus:ring-ns-accent"
                />
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addPlace}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-ns-border rounded-lg text-sm font-ui text-ns-ink-secondary hover:border-ns-accent hover:text-ns-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Place
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-ns-ink mb-1">
          What is the central conflict?
        </h2>
        <p className="font-body text-ns-ink-secondary text-sm">
          Every great story has a driving tension. What does your protagonist
          want — and what stands in the way?
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
            Central conflict
          </Label>
          <EnhanceBtn
            enhanceKey="conflict"
            label="Sharpen conflict"
            type="conflict"
            data={{ conflict, plotLineName }}
            onResult={setConflict}
          />
        </div>
        <Textarea
          value={conflict}
          onChange={(e) => setConflict(e.target.value)}
          placeholder="Describe the main tension, stakes, and what your protagonist must overcome…"
          rows={4}
          className="bg-ns-surface border-ns-border text-ns-ink resize-none focus:ring-ns-accent"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
            Key plot events{" "}
            <span className="text-ns-ink-muted font-normal normal-case">
              (optional)
            </span>
          </Label>
        </div>

        <div className="space-y-3">
          {events.map((ev, i) => (
            <div
              key={i}
              className="flex gap-3 items-start border border-ns-border rounded-lg p-3 bg-ns-surface"
            >
              <div className="flex-1 space-y-2">
                <Input
                  value={ev.name}
                  onChange={(e) => updateEvent(i, "name", e.target.value)}
                  placeholder="Event name…"
                  className="h-9 bg-ns-elevated border-ns-border text-ns-ink text-sm focus:ring-ns-accent"
                />
                <Select
                  value={ev.storyBeat}
                  onValueChange={(v) => updateEvent(i, "storyBeat", v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-ns-elevated border-ns-border text-ns-ink">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-ns-surface border-ns-border">
                    {STORY_BEATS.map(({ value, label }) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="text-xs text-ns-ink focus:bg-ns-surface-hover"
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => removeEvent(i)}
                className="text-ns-ink-muted hover:text-ns-destructive transition-colors p-1 mt-0.5"
                aria-label="Remove event"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addEvent}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-ns-border rounded-lg text-sm font-ui text-ns-ink-secondary hover:border-ns-accent hover:text-ns-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Plot Event
          </button>
        </div>

        <div className="space-y-2">
          <Label className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
            Plot line name
          </Label>
          <Input
            value={plotLineName}
            onChange={(e) => setPlotLineName(e.target.value)}
            className="h-9 bg-ns-surface border-ns-border text-ns-ink text-sm focus:ring-ns-accent"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (isBlueprintLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <Loader2 className="w-20 h-20 absolute -top-2 -left-2 text-purple-400 dark:text-purple-600 animate-spin opacity-60" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-heading text-xl text-ns-ink">
              Crafting your story blueprint…
            </p>
            <p className="font-body text-ns-ink-secondary text-sm">
              Organising and enriching your ideas into a coherent foundation.
            </p>
          </div>
        </div>
      );
    }

    // Resolved data: prefer AI-enriched, fall back to raw user inputs
    const displayPremise = blueprintData?.premise ?? description;
    const displayConflict = blueprintData?.conflict ?? conflict;
    const displayCharacters =
      blueprintData?.characters ??
      characters
        .filter((c) => c.name.trim())
        .map(({ name, description: desc }) => ({ name, description: desc }));
    const displayPlaces =
      blueprintData?.places ??
      places
        .filter((p) => p.name.trim())
        .map(({ name, description: desc }) => ({ name, description: desc }));

    const categoryLabel =
      CATEGORIES.find((c) => c.value === category)?.label ?? category;

    const RegenerateBtn = () => (
      <button
        type="button"
        onClick={generateBlueprint}
        disabled={isBlueprintLoading || enhancing !== null}
        className="inline-flex items-center gap-1 text-xs font-ui text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isBlueprintLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3" />
        )}
        Regenerate
      </button>
    );

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl text-ns-ink mb-1">
              Your story blueprint
            </h2>
            <p className="font-body text-ns-ink-secondary text-sm">
              {blueprintData
                ? "AI has enriched your inputs. Review and adjust before launching."
                : blueprintError
                  ? "Generation failed. Try again or use your raw inputs."
                  : "Review your foundation before launching into the editor."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {previousBlueprintData && !isBlueprintLoading && (
              <button
                type="button"
                onClick={handleUndo}
                className="inline-flex items-center gap-1 text-xs font-ui text-ns-ink-muted hover:text-ns-ink transition-colors"
              >
                ← Undo
              </button>
            )}
            {blueprintData && (
              <span className="text-xs font-ui px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                AI enriched
              </span>
            )}
          </div>
        </div>

        {/* Error state */}
        {blueprintError && !blueprintData && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20 p-4 space-y-3">
            <p className="text-sm font-ui text-amber-800 dark:text-amber-300">
              {blueprintError}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateBlueprint}
                disabled={isBlueprintLoading}
                className="inline-flex items-center gap-1.5 text-xs font-ui text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Try again
              </button>
              {previousBlueprintData && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="text-xs font-ui text-ns-ink-secondary hover:text-ns-ink transition-colors"
                >
                  ← Restore previous
                </button>
              )}
              <button
                type="button"
                onClick={() => setBlueprintError(null)}
                className="text-xs font-ui text-ns-ink-muted hover:text-ns-ink transition-colors"
              >
                Use my inputs →
              </button>
            </div>
          </div>
        )}

        {/* Concept card */}
        <div className="rounded-lg border border-ns-border bg-ns-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
              Story Concept
            </h3>
            <RegenerateBtn />
          </div>
          <p className="font-heading text-lg text-ns-ink">{title}</p>
          {displayPremise && (
            <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
              {displayPremise}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            {categoryLabel && (
              <span className="px-2 py-0.5 rounded-full text-xs font-ui bg-ns-accent/10 text-ns-accent border border-ns-accent/20">
                {categoryLabel}
              </span>
            )}
            {splitTags(tags).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs font-ui bg-ns-surface-hover text-ns-ink-secondary border border-ns-border"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Characters */}
        {displayCharacters.length > 0 && (
          <div className="rounded-lg border border-ns-border bg-ns-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
                Characters
              </h3>
              <RegenerateBtn />
            </div>
            <div className="space-y-3">
              {displayCharacters.map((c, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-ns-accent/10 border border-ns-accent/20 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs font-ui font-semibold text-ns-accent">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-ui font-medium text-ns-ink">
                      {c.name}
                    </p>
                    {c.description && (
                      <p className="text-xs font-body text-ns-ink-secondary mt-0.5">
                        {c.description}
                      </p>
                    )}
                    {"personality" in c &&
                      (c as { personality?: string }).personality && (
                        <p className="text-xs font-body text-ns-ink-muted mt-1 italic">
                          {(c as { personality?: string }).personality}
                        </p>
                      )}
                    {"backstory" in c &&
                      (c as { backstory?: string }).backstory && (
                        <p className="text-xs font-body text-ns-ink-secondary mt-1">
                          {(c as { backstory?: string }).backstory}
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Places */}
        {displayPlaces.length > 0 && (
          <div className="rounded-lg border border-ns-border bg-ns-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
                Places
              </h3>
              <RegenerateBtn />
            </div>
            <div className="space-y-3">
              {displayPlaces.map((p, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <MapPin className="w-4 h-4 text-ns-accent flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-ui font-medium text-ns-ink">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="text-xs font-body text-ns-ink-secondary mt-0.5">
                        {p.description}
                      </p>
                    )}
                    {"atmosphere" in p &&
                      (p as { atmosphere?: string }).atmosphere && (
                        <p className="text-xs font-body text-ns-ink-muted mt-1 italic">
                          {(p as { atmosphere?: string }).atmosphere}
                        </p>
                      )}
                    {"history" in p && (p as { history?: string }).history && (
                      <p className="text-xs font-body text-ns-ink-secondary mt-1">
                        {(p as { history?: string }).history}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conflict & Plot */}
        {(displayConflict.trim() || events.some((e) => e.name.trim())) && (
          <div className="rounded-lg border border-ns-border bg-ns-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-ui text-xs font-semibold text-ns-ink-secondary uppercase tracking-wide">
                Plot — {plotLineName}
              </h3>
              <RegenerateBtn />
            </div>
            {displayConflict.trim() && (
              <p className="text-sm font-body text-ns-ink-secondary leading-relaxed">
                {displayConflict}
              </p>
            )}
            {events.filter((e) => e.name.trim()).length > 0 && (
              <div className="space-y-1">
                {events
                  .filter((e) => e.name.trim())
                  .map((e, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-ns-surface-hover border border-ns-border flex items-center justify-center text-xs font-ui text-ns-ink-muted flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-ui text-ns-ink">
                        {e.name}
                      </span>
                      <span className="text-xs font-ui text-ns-ink-muted">
                        (
                        {
                          STORY_BEATS.find((b) => b.value === e.storyBeat)
                            ?.label
                        }
                        )
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-ns-ink mb-1">
          Ready to write?
        </h2>
        <p className="font-body text-ns-ink-secondary text-sm">
          Your story blueprint will be saved and you'll be taken to the editor.
          Everything can be refined from there.
        </p>
      </div>

      <div className="rounded-lg border border-ns-border bg-ns-surface p-5 space-y-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-ns-accent mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-ui text-sm font-semibold text-ns-ink">{title}</p>
            {(blueprintData?.premise ?? description) && (
              <p className="font-body text-xs text-ns-ink-secondary mt-0.5 line-clamp-2">
                {blueprintData?.premise ?? description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md bg-ns-surface-hover p-3">
            <p className="font-heading text-xl text-ns-ink">
              {
                (
                  blueprintData?.characters ??
                  characters.filter((c) => c.name.trim())
                ).length
              }
            </p>
            <p className="font-ui text-xs text-ns-ink-secondary mt-0.5">
              Characters
            </p>
          </div>
          <div className="rounded-md bg-ns-surface-hover p-3">
            <p className="font-heading text-xl text-ns-ink">
              {
                (blueprintData?.places ?? places.filter((p) => p.name.trim()))
                  .length
              }
            </p>
            <p className="font-ui text-xs text-ns-ink-secondary mt-0.5">
              Places
            </p>
          </div>
          <div className="rounded-md bg-ns-surface-hover p-3">
            <p className="font-heading text-xl text-ns-ink">
              {((blueprintData?.conflict ?? conflict).trim() ? 1 : 0) +
                events.filter((e) => e.name.trim()).length}
            </p>
            <p className="font-ui text-xs text-ns-ink-secondary mt-0.5">
              Plot events
            </p>
          </div>
        </div>

        {blueprintData && (
          <div className="flex items-center gap-2 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <p className="text-xs font-ui text-purple-600 dark:text-purple-400">
              AI-enriched content will be saved to your story's database.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs font-body text-ns-ink-muted">
        Characters, places, and plot events are saved immediately. Continue
        building them from the editor's sidebar.
      </p>
    </div>
  );

  const steps = [
    renderStep0,
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
  ];

  const progressPct = ((step + 1) / STEPS.length) * 100;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Step indicator */}
      <div className="px-6 pt-2 pb-4">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < step;
            const isActive = i === step;
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-ns-accent text-white"
                        : isActive
                          ? "bg-ns-accent text-white ring-2 ring-ns-accent ring-offset-2 ring-offset-ns-bg"
                          : "bg-ns-surface border border-ns-border text-ns-ink-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-xs font-ui hidden sm:block ${
                      isActive ? "text-ns-ink font-medium" : "text-ns-ink-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-1 mb-4 transition-colors ${
                      i < step ? "bg-ns-accent" : "bg-ns-border"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="h-0.5 rounded-full bg-ns-border overflow-hidden">
          <div
            className="h-full bg-ns-accent transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-2">{steps[step]()}</div>

      {/* Footer navigation */}
      <div className="px-6 py-4 border-t border-ns-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="font-ui text-ns-ink-secondary"
          >
            Cancel
          </Button>
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={step === 4 ? () => setStep(3) : goBack}
              disabled={isSubmitting}
              className="font-ui border-ns-border text-ns-ink"
            >
              ← {step === 4 ? "Refine answers" : "Back"}
            </Button>
          )}

          {step < 4 && (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canAdvance}
              className="font-ui bg-ns-accent hover:bg-ns-accent-hover text-white disabled:opacity-50"
            >
              Next →
            </Button>
          )}

          {step === 4 && !isBlueprintLoading && (
            <Button
              type="button"
              onClick={goNext}
              className="font-ui bg-ns-accent hover:bg-ns-accent-hover text-white"
            >
              This looks good →
            </Button>
          )}

          {step === 5 && (
            <Button
              type="button"
              onClick={handleLaunch}
              disabled={isSubmitting}
              className="font-ui bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 shadow-md px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Launching…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Launch Story
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoWriteWizard;
