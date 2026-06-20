/// <reference types="cypress" />
export {};

// Spec B — Phase 2 of flow.md: world-building (characters) and the indexing
// lifecycle. Entity writes are client-SDK writes that fire onCharacterWrite,
// which debounces a re-index task.
//
// EMULATOR CAVEAT (flow.md §7): vector indexing is DISABLED under the emulator
// (VECTOR_INDEX_DISABLED) and find_nearest doesn't exist, so chapter_chunks is
// never populated and re-index is out-of-band. We therefore assert on the
// entity doc lifecycle (create → delete), not on chunk recall. True vector
// assertions require a real-GCP profile.

const EMAIL = "worldbuilding@e2e.local";
const PASSWORD = "e2e-password-123";

describe("World-building & indexing", () => {
  let storyId: string;

  beforeEach(() => {
    cy.seedUser({ email: EMAIL, password: PASSWORD });
    cy.login(EMAIL, PASSWORD);
    cy.createStory("Atlas of Hollow Names").then((id) => {
      storyId = id;
    });
  });

  it("creates a character (onCharacterWrite) and then deletes it", () => {
    // Navigate in-app (the cold-load PrivateRoute bounces to /user-stories
    // while Firebase auth restores). createStory leaves us on the editor. The
    // tab bar is lg:hidden on desktop, but the NavLink still routes client-side
    // when force-clicked (no reload → auth preserved).
    cy.get('[data-cy="tab-characters"]').click({ force: true });
    cy.location("pathname").should("include", "/characters");

    // Create via the Add Character modal.
    cy.get('[data-cy="add-character"]').click();
    cy.get('[data-cy="character-name"]').type("Marlowe Quint");
    cy.get('[data-cy="character-save"]').click();

    // The client-SDK write persists the entity doc (and fires onCharacterWrite).
    cy.pollDocs(
      `stories/${storyId}/characters`,
      (chars) => chars.length === 1
    ).then((chars) => {
      expect(chars[0].name).to.eq("Marlowe Quint");
    });

    // The character appears in the roster; delete it via the row action
    // (hover actions are opacity-0 until hover, so force the click).
    cy.contains("Marlowe Quint").should("be.visible");
    cy.get('[aria-label="Delete character"]').first().click({ force: true });

    // deleteEntityChunks path: the entity doc is removed (chunk deletes no-op
    // under the emulator).
    cy.pollDocs(
      `stories/${storyId}/characters`,
      (chars) => chars.length === 0
    );
  });
});
