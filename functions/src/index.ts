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
export { getData } from "./getData";
export { generateNextLines } from "./generateNextLines";
export { searchBooks, getBookDetails } from "./booksApi";
export { generateCoverImage } from "./generateCoverImage";
export { sendChatMessage } from "./sendChatMessage";
export { enhanceText } from "./enhanceText";
