/// <reference types="cypress" />
import "./commands";

// Each spec starts from a clean emulator. Specs seed their own user(s) in their
// own beforeEach so they remain independently runnable.
beforeEach(() => {
  cy.task("resetEmulators");
});

// The app logs benign cross-origin / ResizeObserver noise; don't fail tests on
// unrelated uncaught exceptions from the app under test.
Cypress.on("uncaught:exception", () => false);
