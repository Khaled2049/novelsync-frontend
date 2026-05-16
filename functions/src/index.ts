import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

setGlobalOptions({
  maxInstances: 5,
  memory: "512MiB",
  timeoutSeconds: 540, // Increased for async operations
});

admin.initializeApp();

// Export new agent endpoints
export { generateStory } from "./generateStory";
export { generateChapter } from "./generateChapter";
export {
  brainstormIdeas,
  brainstormCharacter,
  brainstormPlot,
} from "./brainstormIdeas";
export {
  getStoryContextEndpoint as getStoryContext,
  updateContext,
} from "./contextEndpoints";
export {
  getJobStatus,
  getStoryJobsEndpoint as getStoryJobs,
} from "./jobEndpoints";
export { authenticate } from "./authenticate";
export { generateNextLines } from "./generateNextLines";
export { generateStoryChoices } from "./generateStoryChoices";
export { searchBooks, getBookDetails } from "./booksApi";
export { generateCoverImage } from "./generateCoverImage";
export { sendChatMessage } from "./sendChatMessage";
export { clearChatSession } from "./clearChatSession";
export { enhanceText } from "./enhanceText";
export { enhanceWizardInput } from "./enhanceWizardInput";
export { onInviteApproved } from "./inviteService";
export { joinCompetition } from "./competitionEndpoints";
export { createUserByAdmin, setUserAdmin } from "./adminUserService";
export {
  saveAiSettings,
  deleteAiSettings,
  validateAiKey,
} from "./aiSettingsEndpoints";
