/// <reference types="cypress" />
export {};

const EMAIL = "chapter-gen@e2e.local";
const PASSWORD = "e2e-password-123";

describe("Chapter generation", () => {
  let storyId: string;
  let idToken: string;
  let functionsBase: string;

  beforeEach(() => {
    functionsBase = Cypress.env("functionsBase");
    cy.seedUser({ email: EMAIL, password: PASSWORD });
    cy.login(EMAIL, PASSWORD);
    cy.createStory("The Cartographer's Apprentice").then((id) => {
      storyId = id;
    });
    cy.task<{ idToken: string }>("getIdToken", {
      email: EMAIL,
      password: PASSWORD,
    }).then((r) => {
      idToken = r.idToken;
    });
  });

  it("generates the current chapter from the editor slash command", () => {
    cy.intercept("POST", "**/generateChapter").as("genChapter");

    // Already on the editor (createStory navigated here in-app).
    // Type "/" in the ProseMirror editor to open the slash menu, then pick
    // "Generate Chapter". The fresh chapter is empty, so it generates straight
    // away (no overwrite confirmation).
    cy.get('[data-cy="chapter-editor"] .ProseMirror').click().type("/");
    cy.get('[data-cy="slash-generate-chapter"]').click();

    cy.wait("@genChapter").then((interception) => {
      expect(interception.response?.statusCode).to.eq(202);
      const jobId = interception.response?.body.jobId as string;
      expect(jobId, "jobId").to.be.a("string").and.not.be.empty;

      cy.waitForJob(jobId).then((job) => {
        expect(job.status, "job settled completed").to.eq("completed");
        const result = job.result as { chapterId: string };
        expect(result.chapterId).to.be.a("string");

        cy.task<Record<string, unknown> | null>(
          "getDoc",
          `stories/${storyId}/chapters/${result.chapterId}`,
        ).then((chapter) => {
          expect(chapter, "chapter doc").to.not.be.null;
          expect(chapter!.content, "generated content present").to.be.a(
            "string",
          ).and.not.be.empty;
          expect(chapter!.title).to.be.a("string");
        });
      });
    });
  });

  it("iteratively generates 3 chapters (job lifecycle, ordering, chapterIndex)", () => {
    // Baseline: the freshly created story already has its auto-created Chapter 1.
    cy.task<Record<string, unknown> | null>(
      "getDoc",
      `stories/${storyId}`,
    ).then((story) => {
      const baseline = ((story?.chapterIndex as unknown[]) ?? []).length;

      const generatedTitles: string[] = [];

      const generate = (n: number): Cypress.Chainable => {
        return cy
          .request({
            method: "POST",
            url: `${functionsBase}/generateChapter`,
            headers: { Authorization: `Bearer ${idToken}` },
            body: { storyId, chapterNumber: n, order: n },
          })
          .then((resp) => {
            expect(resp.status, `chapter ${n} accepted`).to.eq(202);
            const jobId = resp.body.jobId as string;
            expect(jobId).to.be.a("string");

            return cy.waitForJob(jobId).then((job) => {
              expect(job.status, `chapter ${n} job`).to.eq("completed");
              const result = job.result as {
                chapterId: string;
                chapterNumber: number;
              };
              expect(result.chapterNumber).to.eq(n);

              return cy
                .task<Record<
                  string,
                  unknown
                > | null>("getDoc", `stories/${storyId}/chapters/${result.chapterId}`)
                .then((chapter) => {
                  expect(chapter!.content).to.be.a("string").and.not.be.empty;
                  expect(chapter!.order).to.eq(n);
                  generatedTitles.push(chapter!.title as string);
                });
            });
          });
      };

      generate(1)
        .then(() => generate(2))
        .then(() => generate(3))
        .then(() => {
          // chapterIndex (rebuilt by onChapterWrite) grew by exactly 3.
          cy.pollDoc(
            `stories/${storyId}`,
            (doc) =>
              ((doc?.chapterIndex as unknown[]) ?? []).length === baseline + 3,
          );

          // Three generated chapters persist with ascending order.
          cy.task<Record<string, unknown>[]>(
            "listDocs",
            `stories/${storyId}/chapters`,
          ).then((chapters) => {
            const generated = chapters
              .filter((c) => typeof c.content === "string" && c.content)
              .sort((a, b) => (a.order as number) - (b.order as number));
            expect(generated.length).to.be.gte(3);
            const orders = generated.map((c) => c.order);
            expect(orders).to.include.members([1, 2, 3]);
          });
        });
    });
  });

  // Negative path: a job transitioning to `failed` with an `error` requires
  // injecting an agent/LLM failure for a single request. There is no clean
  // per-request failure hook in the mock stack (stopping the agent fails ALL
  // requests and breaks the other specs), so this is left as a follow-up — e.g.
  // a creditProxy `force_error` test flag, or a dedicated failure agent.
  it.skip("surfaces a failed job (needs a per-request failure hook)", () => {
    // Intentionally skipped — see comment above.
  });
});
