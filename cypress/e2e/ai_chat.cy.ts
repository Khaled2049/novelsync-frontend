/// <reference types="cypress" />
export {};

const EMAIL = "ai-chat@e2e.local";
const PASSWORD = "e2e-password-123";

describe("AI chat", () => {
  let uid: string;
  let storyId: string;

  beforeEach(() => {
    cy.seedUser({ email: EMAIL, password: PASSWORD }).then((u) => {
      uid = u;
    });
    cy.login(EMAIL, PASSWORD);
    cy.createStory("Letters to the Tide").then((id) => {
      storyId = id;
    });
  });

  it("sends a message and renders + persists the assistant reply", () => {
    cy.intercept("POST", "**/sendChatMessage").as("sendChat");

    // Already on the editor (createStory navigated here in-app; a cold visit
    // would bounce via PrivateRoute while auth restores).
    cy.get('[data-cy="open-chat"]').click();

    // sendMessage no-ops until the chat session is initialized (chatId set), so
    // wait for the session doc to exist before sending.
    cy.pollDocs(`stories/${storyId}/chats`, (chats) => chats.length >= 1);

    cy.get('[data-cy="chat-input"]').type("Who is the protagonist?");
    cy.get('[data-cy="chat-send"]').click({ force: true });

    cy.wait("@sendChat").its("response.statusCode").should("eq", 200);

    // The user bubble and the deterministic mock reply both render via the
    // realtime listener.
    cy.get('[data-cy="chat-message-user"]').should(
      "contain.text",
      "Who is the protagonist?",
    );
    cy.get('[data-cy="chat-message-assistant"]').should(
      "contain.text",
      "Mock response to:",
    );

    // Both messages are persisted under the chat session subcollection.
    cy.pollDocs(`stories/${storyId}/chats`, (chats) => chats.length >= 1).then(
      (chats) => {
        const chatId = chats[0].id as string;
        cy.pollDocs(
          `stories/${storyId}/chats/${chatId}/messages`,
          (msgs) => msgs.length >= 2,
        ).then((msgs) => {
          const roles = msgs.map((m) => m.role);
          expect(roles).to.include("user");
          expect(roles).to.include("assistant");
        });
      },
    );
  });

  it("returns 429 and does not render a reply when the daily quota is spent", () => {
    const today = new Date().toISOString().slice(0, 10);
    cy.task("setUserFields", {
      uid,
      fields: { aiUsage: 100, lastAiUsageDate: today },
    });

    cy.intercept("POST", "**/sendChatMessage").as("sendChat");

    cy.get('[data-cy="open-chat"]').click();
    cy.pollDocs(`stories/${storyId}/chats`, (chats) => chats.length >= 1);
    cy.get('[data-cy="chat-input"]').type("This should be blocked");
    cy.get('[data-cy="chat-send"]').click({ force: true });

    cy.wait("@sendChat").its("response.statusCode").should("eq", 429);
    cy.get('[data-cy="chat-message-assistant"]').should("not.exist");
  });

  // BYOK bypass (flow.md §5): a BYOK user's chat must succeed without
  // decrementing platform aiUsage. This cannot be exercised against the mock
  // creditProxy: BYOK instantiates the user's *real* provider with their
  // decrypted key, so a seeded fake key fails at the provider call. Running it
  // requires a real provider key + correctly AES-256-GCM-encrypted aiSettings.
  it.skip("BYOK chat bypasses platform quota (requires a real provider key)", () => {
    // Intentionally skipped in the deterministic mock stack — see comment above.
  });
});
