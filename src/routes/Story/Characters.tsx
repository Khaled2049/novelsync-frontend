import React, { useEffect, useState } from "react";
import { Character } from "@/types/ICharacter";
import AddCharacterModal from "@/components/characters/AddCharacterModal";
import { characterService } from "@/services/CharacterService";
import { useParams } from "react-router-dom";
import UpdateCharacterModal from "@/components/characters/UpdateCharacterModal";
import { Users, UserPlus, User, Pencil, Trash2 } from "lucide-react";

const Characters: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [characterToUpdate, setCharacterToUpdate] = useState<Character | null>(null);

  useEffect(() => {
    loadCharacters();
  }, [storyId]);

  const loadCharacters = async () => {
    if (!storyId) return;
    const chars = await characterService.getCharacters(storyId);
    setCharacters(chars);
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleAddCharacter = (newCharacter: Character) => {
    setCharacters((prev) => [...prev, newCharacter]);
    setIsAddModalOpen(false);
  };

  const handleUpdateCharacter = (updatedCharacter: Character) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === updatedCharacter.id ? updatedCharacter : c))
    );
    setIsUpdateModalOpen(false);
    setCharacterToUpdate(null);
    if (selectedCharacter?.id === updatedCharacter.id) {
      setSelectedCharacter(updatedCharacter);
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (!storyId) return;
    try {
      await characterService.deleteCharacter(storyId, characterId);
      setCharacters((prev) => prev.filter((c) => c.id !== characterId));
      if (selectedCharacter?.id === characterId) setSelectedCharacter(null);
    } catch (error) {
      console.error("Error deleting character:", error);
    }
  };

  if (!storyId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-ui text-sm text-ns-ink-muted">
          Story ID not found. Please check the URL and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-ns-bg">

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-ns-border bg-ns-surface">
        <div className="flex items-center gap-2.5">
          <span className="font-heading italic text-lg text-ns-ink">Characters</span>
          {characters.length > 0 && (
            <span className="font-ui text-[10px] font-semibold text-ns-accent bg-ns-accent-subtle px-2 py-0.5 rounded-full">
              {characters.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ns-accent text-white font-ui text-xs font-medium rounded-ns hover:bg-ns-accent-hover active:scale-[0.97] transition-all duration-150"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Character
        </button>
      </div>

      {/* ── Two-Panel Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Roster */}
        <div className="w-64 flex-shrink-0 border-r border-ns-border flex flex-col bg-ns-surface">
          <div className="flex-1 overflow-y-auto py-3 px-3">
            {characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <div className="w-12 h-12 rounded-full bg-ns-accent-subtle flex items-center justify-center">
                  <Users className="w-5 h-5 text-ns-accent opacity-60" />
                </div>
                <p className="font-ui text-xs text-ns-ink-muted text-center leading-relaxed">
                  No characters yet.<br />Add your first character.
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {characters.map((character) => {
                  const isSelected = selectedCharacter?.id === character.id;
                  return (
                    <div
                      key={character.id}
                      onClick={() => handleCharacterClick(character)}
                      className={`flex items-center gap-3 rounded-ns px-3 py-2.5 cursor-pointer transition-all duration-150 group ${
                        isSelected ? "bg-ns-accent-subtle" : "hover:bg-ns-surface-hover"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-ui font-semibold text-sm flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-ns-accent text-white"
                            : "bg-ns-border text-ns-ink-secondary"
                        }`}
                      >
                        {character.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-ui text-xs font-medium truncate transition-colors ${
                            isSelected ? "text-ns-ink" : "text-ns-ink-secondary"
                          }`}
                        >
                          {character.name}
                        </p>
                        {character.age > 0 && (
                          <p className="font-ui text-[10px] text-ns-ink-muted">
                            Age {character.age}
                          </p>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCharacterToUpdate(character);
                            setIsUpdateModalOpen(true);
                          }}
                          className="p-1.5 rounded text-ns-ink-muted hover:text-ns-ink hover:bg-ns-elevated transition-all duration-150"
                          aria-label="Edit character"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCharacter(character.id);
                          }}
                          className="p-1.5 rounded text-ns-ink-muted hover:text-ns-destructive hover:bg-ns-elevated transition-all duration-150"
                          aria-label="Delete character"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="flex-1 overflow-y-auto bg-ns-bg">
          {!selectedCharacter ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center gap-3 px-8 animate-ns-fade-in">
              <div className="w-14 h-14 rounded-full bg-ns-accent-subtle flex items-center justify-center">
                <User className="w-6 h-6 text-ns-accent opacity-60" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-heading italic text-xl text-ns-ink-secondary">
                  Select a character
                </p>
                <p className="font-ui text-xs text-ns-ink-muted">
                  Choose someone from the roster to view their details
                </p>
              </div>
            </div>
          ) : (
            /* Character Detail */
            <div className="max-w-xl mx-auto p-6 space-y-6 animate-ns-fade-in">

              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-ns-accent flex items-center justify-center font-heading text-2xl text-white flex-shrink-0">
                  {selectedCharacter.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="font-heading italic text-2xl text-ns-ink leading-tight">
                    {selectedCharacter.name}
                  </h2>
                  {selectedCharacter.age > 0 && (
                    <span className="inline-block mt-1.5 font-ui text-xs text-ns-ink-muted bg-ns-surface border border-ns-border px-2 py-0.5 rounded-full">
                      Age {selectedCharacter.age}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setCharacterToUpdate(selectedCharacter);
                    setIsUpdateModalOpen(true);
                  }}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns border border-ns-border font-ui text-xs text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink active:scale-[0.97] transition-all duration-150"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <div className="h-px bg-ns-border" />

              {/* Fields */}
              <div className="space-y-5">
                {selectedCharacter.backstory && (
                  <div className="space-y-1.5">
                    <p className="font-ui text-[10px] font-semibold text-ns-ink-muted uppercase tracking-widest">
                      Backstory
                    </p>
                    <p className="font-body text-sm text-ns-ink leading-relaxed">
                      {selectedCharacter.backstory}
                    </p>
                  </div>
                )}

                {selectedCharacter.affiliations && (
                  <div className="space-y-1.5">
                    <p className="font-ui text-[10px] font-semibold text-ns-ink-muted uppercase tracking-widest">
                      Affiliations
                    </p>
                    <p className="font-body text-sm text-ns-ink leading-relaxed">
                      {selectedCharacter.affiliations}
                    </p>
                  </div>
                )}

                {selectedCharacter.notes && (
                  <div className="space-y-1.5">
                    <p className="font-ui text-[10px] font-semibold text-ns-ink-muted uppercase tracking-widest">
                      Notes
                    </p>
                    <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                      {selectedCharacter.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Danger zone */}
              <div className="pt-2 border-t border-ns-border">
                <button
                  onClick={() => handleDeleteCharacter(selectedCharacter.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns font-ui text-xs text-ns-destructive border border-ns-destructive/20 hover:bg-ns-destructive/5 hover:border-ns-destructive/40 active:scale-[0.97] transition-all duration-150"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Character
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* ── Modals ── */}
      {isAddModalOpen && (
        <AddCharacterModal
          storyId={storyId}
          onClose={() => setIsAddModalOpen(false)}
          onAddCharacter={handleAddCharacter}
        />
      )}
      {isUpdateModalOpen && characterToUpdate && (
        <UpdateCharacterModal
          storyId={storyId}
          character={characterToUpdate}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateCharacter={handleUpdateCharacter}
        />
      )}
    </div>
  );
};

export default Characters;
