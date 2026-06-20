/// <reference types="cypress" />
export {};

const EMAIL = "story-lifecycle@e2e.local";
const PASSWORD = "e2e-password-123";

describe("Story lifecycle", () => {
  let uid: string;

  beforeEach(() => {
    cy.seedUser({ email: EMAIL, password: PASSWORD }).then((u) => {
      uid = u;
    });
    cy.login(EMAIL, PASSWORD);
  });

  it("creates a story and increments the owner's storyCount", () => {
    cy.visit("/user-stories");
    cy.get('[data-cy="new-story"]').click();

    cy.get('[data-cy="wizard-title"]').type("The Glass Cartographer");
    cy.get('[data-cy="wizard-create"]').click();

    // On success the wizard navigates to the editor at /create/<storyId>.
    cy.location("pathname", { timeout: 20000 }).should("include", "/create/");
    cy.location("pathname")
      .then((p) => p.split("/")[2])
      .then((storyId) => {
        expect(storyId, "storyId from URL").to.be.a("string").and.not.be.empty;

        cy.task<Record<string, unknown> | null>(
          "getDoc",
          `stories/${storyId}`,
        ).then((story) => {
          expect(story, "story doc exists").to.not.be.null;
          expect(story!.userId, "story.userId").to.eq(uid);
          expect(story!.title).to.eq("The Glass Cartographer");
        });
      });

    // onStoryWrite increments the denormalized counter (eventually consistent).
    cy.pollDoc(`users/${uid}`, (doc) => doc?.storyCount === 1);
  });

  it("rejects story creation once the per-user cap (100) is reached", () => {
    // The cap is enforced in firestore.rules via the denormalized counter.
    cy.task("setUserFields", { uid, fields: { storyCount: 100 } });

    cy.visit("/user-stories");
    cy.get('[data-cy="new-story"]').click();
    cy.get('[data-cy="wizard-title"]').type("One Story Too Many");
    cy.get('[data-cy="wizard-create"]').click();

    // The client-SDK write is denied → no navigation to the editor, no doc.
    cy.wait(2000);
    cy.location("pathname").should("not.include", "/create/");
    cy.task<Record<string, unknown>[]>("listDocs", "stories").then(
      (stories) => {
        expect(stories, "no story should be created").to.have.length(0);
      },
    );
  });
});
