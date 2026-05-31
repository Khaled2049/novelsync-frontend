import { firestore } from "@/config/firebase";
import {
  IClub,
  IReadingSchedule,
  IDiscussionPrompt,
  IPoll,
  IReadingProgress,
  IPromptResponse,
} from "@/types/IClub";
import { IMessage } from "@/types/IMessage";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { RATE_LIMITS } from "@/config/rateLimits";

class BookClubRepo {
  createBookClub = async (club: IClub): Promise<string> => {
    const clubRef: DocumentReference = doc(collection(firestore, "bookClubs"));
    await setDoc(clubRef, { ...club, id: clubRef.id });
    return clubRef.id;
  };

  getBookClubs = async () => {
    try {
      const bookClubsSnapshot = await getDocs(
        collection(firestore, "bookClubs"),
      );
      const bookClubsData = bookClubsSnapshot.docs.map(
        (doc) => doc.data() as IClub,
      );
      return bookClubsData;
    } catch (error) {
      console.error("Error getting book clubs:", error);
    }
  };

  getBookClub = async (id: string): Promise<IClub | undefined> => {
    try {
      const clubDoc = await getDoc(doc(firestore, "bookClubs", id));
      if (clubDoc.exists()) {
        return clubDoc.data() as IClub;
      }
    } catch (error) {
      console.error("Error getting book club:", error);
    }
    return undefined;
  };

  subscribeToBookClub = (
    id: string,
    callback: (club: IClub | null) => void,
  ) => {
    const clubRef = doc(firestore, "bookClubs", id);
    return onSnapshot(
      clubRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as IClub);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error subscribing to book club:", error);
        callback(null);
      },
    );
  };

  updateBookClub = async (id: string, updatedClub: IClub) => {
    try {
      const clubRef = doc(firestore, "bookClubs", id);
      const clubDoc = await getDoc(clubRef);

      const clubDocData = clubDoc.data();

      if (!clubDoc.exists() || !clubDocData) {
        throw new Error("Club does not exist");
      }

      const newClub = { ...clubDocData, ...updatedClub };

      await updateDoc(clubRef, newClub);
    } catch (error) {
      console.error("Error updating book club:", error);
    }
  };

  updateMeetUp = async (clubId: string, meetUp: string): Promise<void> => {
    const clubRef = doc(firestore, "bookClubs", clubId);
    await updateDoc(clubRef, { meetUp });
  };

  deleteBookClub = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "bookClubs", id));
    } catch (error) {
      console.error("Error deleting book club:", error);
    }
  };

  joinBookClub = async (clubId: string, userId: string) => {
    try {
      const clubRef = doc(firestore, "bookClubs", clubId);
      const clubDoc = await getDoc(clubRef);

      if (!clubDoc.exists()) {
        throw new Error("Club not found");
      }

      const currentMembers = clubDoc.data().members || [];

      if (currentMembers.length >= 10) {
        throw new Error("This book club is full (maximum 10 members)");
      }

      await updateDoc(clubRef, {
        members: arrayUnion(userId),
      });
    } catch (error) {
      console.error("Error joining book club:", error);
      throw error;
    }
  };

  leaveBookClub = async (clubId: string, userId: string) => {
    try {
      const clubRef = doc(firestore, "bookClubs", clubId);
      await updateDoc(clubRef, {
        members: arrayRemove(userId),
      });
    } catch (error) {
      console.error("Error leaving book club:", error);
    }
  };

  sendMessage = async (clubId: string, message: IMessage): Promise<string> => {
    try {
      // Validate message size
      if (message.content.length > RATE_LIMITS.MAX_MESSAGE_SIZE_CHARS) {
        throw new Error(
          `Message is too long. Maximum ${RATE_LIMITS.MAX_MESSAGE_SIZE_CHARS} characters allowed.`,
        );
      }

      const messagesRef = collection(firestore, `bookClubs/${clubId}/messages`);

      // Get current message count
      const messageCount = (await getDocs(messagesRef)).size;

      if (messageCount >= 100) {
        throw new Error("Message limit reached");
      }

      // Add new message
      const messageRef = doc(messagesRef);

      // Clean undefined values from message (Firestore doesn't accept undefined)
      const cleanMessage = { ...message };
      if (cleanMessage.spoilerChapterRange) {
        cleanMessage.spoilerChapterRange = {
          ...cleanMessage.spoilerChapterRange,
        };
        if (cleanMessage.spoilerChapterRange.end === undefined) {
          delete cleanMessage.spoilerChapterRange.end;
        }
      }

      await setDoc(messageRef, {
        ...cleanMessage,
        id: messageRef.id,
        timestamp: serverTimestamp(),
      });
      return messageRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  getMessages = (clubId: string, callback: (messages: IMessage[]) => void) => {
    const messagesRef = collection(firestore, `bookClubs/${clubId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(50));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => doc.data() as IMessage);
      callback(messages);
    });
  };

  checkMembership = async (clubId: string, userId: string) => {
    const clubRef = doc(firestore, "bookClubs", clubId);
    const clubDoc = await getDoc(clubRef);
    if (clubDoc.exists()) {
      const clubData = clubDoc.data() as IClub;
      return clubData.members.includes(userId);
    }
    return false;
  };

  // Reading Schedule Methods
  createReadingSchedule = async (
    clubId: string,
    schedule: IReadingSchedule,
  ) => {
    try {
      const clubRef = doc(firestore, "bookClubs", clubId);
      await updateDoc(clubRef, {
        readingSchedule: schedule,
      });
    } catch (error) {
      console.error("Error creating reading schedule:", error);
      throw error;
    }
  };

  updateReadingSchedule = async (
    clubId: string,
    schedule: IReadingSchedule,
  ) => {
    try {
      const clubRef = doc(firestore, "bookClubs", clubId);
      await updateDoc(clubRef, {
        readingSchedule: schedule,
      });
    } catch (error) {
      console.error("Error updating reading schedule:", error);
      throw error;
    }
  };

  // Discussion Prompt Methods
  createDiscussionPrompt = async (
    clubId: string,
    prompt: Omit<IDiscussionPrompt, "id">,
  ) => {
    try {
      // Validate prompt question length
      if (prompt.question.length > RATE_LIMITS.MAX_PROMPT_QUESTION_LENGTH) {
        throw new Error(
          `Prompt question is too long. Maximum ${RATE_LIMITS.MAX_PROMPT_QUESTION_LENGTH} characters allowed.`,
        );
      }

      // Validate prompt description length
      if (
        prompt.description &&
        prompt.description.length > RATE_LIMITS.MAX_PROMPT_DESCRIPTION_LENGTH
      ) {
        throw new Error(
          `Prompt description is too long. Maximum ${RATE_LIMITS.MAX_PROMPT_DESCRIPTION_LENGTH} characters allowed.`,
        );
      }

      const clubRef = doc(firestore, "bookClubs", clubId);
      const clubDoc = await getDoc(clubRef);

      if (!clubDoc.exists()) {
        throw new Error("Club not found");
      }

      const clubData = clubDoc.data() as IClub;
      const prompts = clubData.discussionPrompts || [];
      const newPrompt: IDiscussionPrompt = {
        ...prompt,
        id: `prompt-${Date.now()}`,
        responses: [],
        unlockedFor: [],
      };

      await updateDoc(clubRef, {
        discussionPrompts: [...prompts, newPrompt],
      });

      return newPrompt.id;
    } catch (error) {
      console.error("Error creating discussion prompt:", error);
      throw error;
    }
  };

  updateDiscussionPrompt = async (
    clubId: string,
    promptId: string,
    updates: Partial<IDiscussionPrompt>,
  ) => {
    try {
      const clubRef = doc(firestore, "bookClubs", clubId);
      const clubDoc = await getDoc(clubRef);

      if (!clubDoc.exists()) {
        throw new Error("Club not found");
      }

      const clubData = clubDoc.data() as IClub;
      const prompts = clubData.discussionPrompts || [];
      const updatedPrompts = prompts.map((p) =>
        p.id === promptId ? { ...p, ...updates } : p,
      );

      await updateDoc(clubRef, {
        discussionPrompts: updatedPrompts,
      });
    } catch (error) {
      console.error("Error updating discussion prompt:", error);
      throw error;
    }
  };

  unlockPromptForUser = async (
    clubId: string,
    promptId: string,
    userId: string,
  ) => {
    try {
      const clubRef = doc(firestore, "bookClubs", clubId);
      const clubDoc = await getDoc(clubRef);

      if (!clubDoc.exists()) {
        throw new Error("Club not found");
      }

      const clubData = clubDoc.data() as IClub;
      const prompts = clubData.discussionPrompts || [];
      const updatedPrompts = prompts.map((p) => {
        if (p.id === promptId) {
          const unlockedFor = p.unlockedFor || [];
          if (!unlockedFor.includes(userId)) {
            return { ...p, unlockedFor: [...unlockedFor, userId] };
          }
        }
        return p;
      });

      await updateDoc(clubRef, {
        discussionPrompts: updatedPrompts,
      });
    } catch (error) {
      console.error("Error unlocking prompt:", error);
      throw error;
    }
  };

  addPromptResponse = async (
    clubId: string,
    promptId: string,
    response: Omit<IPromptResponse, "id">,
  ) => {
    try {
      // Validate response length
      if (response.content.length > RATE_LIMITS.MAX_PROMPT_RESPONSE_LENGTH) {
        throw new Error(
          `Response is too long. Maximum ${RATE_LIMITS.MAX_PROMPT_RESPONSE_LENGTH} characters allowed.`,
        );
      }

      const clubRef = doc(firestore, "bookClubs", clubId);
      const clubDoc = await getDoc(clubRef);

      if (!clubDoc.exists()) {
        throw new Error("Club not found");
      }

      const clubData = clubDoc.data() as IClub;
      const prompts = clubData.discussionPrompts || [];
      const newResponse: IPromptResponse = {
        ...response,
        id: `response-${Date.now()}`,
      };

      const updatedPrompts = prompts.map((p) => {
        if (p.id === promptId) {
          const responses = p.responses || [];
          return { ...p, responses: [...responses, newResponse] };
        }
        return p;
      });

      await updateDoc(clubRef, {
        discussionPrompts: updatedPrompts,
      });

      return newResponse.id;
    } catch (error) {
      console.error("Error adding prompt response:", error);
      throw error;
    }
  };

  // Poll Methods
  createPoll = async (clubId: string, poll: Omit<IPoll, "id">) => {
    try {
      // Validate poll question length
      if (poll.question.length > RATE_LIMITS.MAX_POLL_QUESTION_LENGTH) {
        throw new Error(
          `Poll question is too long. Maximum ${RATE_LIMITS.MAX_POLL_QUESTION_LENGTH} characters allowed.`,
        );
      }

      // Validate number of options
      if (poll.options.length > RATE_LIMITS.MAX_POLL_OPTIONS) {
        throw new Error(
          `Too many options. Maximum ${RATE_LIMITS.MAX_POLL_OPTIONS} options allowed.`,
        );
      }

      if (poll.options.length < 2) {
        throw new Error("At least 2 options are required");
      }

      // Validate each option length
      for (const option of poll.options) {
        if (option.text.length > RATE_LIMITS.MAX_POLL_OPTION_LENGTH) {
          throw new Error(
            `Option text is too long. Maximum ${RATE_LIMITS.MAX_POLL_OPTION_LENGTH} characters allowed.`,
          );
        }
      }

      const clubRef = doc(firestore, "bookClubs", clubId);
      const clubDoc = await getDoc(clubRef);

      if (!clubDoc.exists()) {
        throw new Error("Club not found");
      }

      const clubData = clubDoc.data() as IClub;
      const polls = clubData.polls || [];
      const newPoll: IPoll = {
        ...poll,
        id: `poll-${Date.now()}`,
        votes: {},
      };

      await updateDoc(clubRef, {
        polls: [...polls, newPoll],
      });

      return newPoll.id;
    } catch (error) {
      console.error("Error creating poll:", error);
      throw error;
    }
  };

  voteOnPoll = async (
    clubId: string,
    pollId: string,
    userId: string,
    optionIndex: number,
  ) => {
    try {
      const clubRef = doc(firestore, "bookClubs", clubId);
      const clubDoc = await getDoc(clubRef);

      if (!clubDoc.exists()) {
        throw new Error("Club not found");
      }

      const clubData = clubDoc.data() as IClub;
      const polls = clubData.polls || [];
      const updatedPolls = polls.map((p) => {
        if (p.id === pollId) {
          const votes = { ...p.votes };
          votes[userId] = optionIndex;
          return { ...p, votes };
        }
        return p;
      });

      await updateDoc(clubRef, {
        polls: updatedPolls,
      });
    } catch (error) {
      console.error("Error voting on poll:", error);
      throw error;
    }
  };

  // Reading Progress Methods
  updateReadingProgress = async (
    clubId: string,
    userId: string,
    chapter: number,
    notes?: string,
  ) => {
    try {
      const progressRef = doc(
        firestore,
        `bookClubs/${clubId}/memberProgress`,
        userId,
      );

      await setDoc(
        progressRef,
        {
          userId,
          currentChapter: chapter,
          lastUpdated: new Date().toISOString(),
          notes: notes || null,
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error updating reading progress:", error);
      throw error;
    }
  };

  getMemberProgress = async (
    clubId: string,
    userId: string,
  ): Promise<IReadingProgress | null> => {
    try {
      const progressRef = doc(
        firestore,
        `bookClubs/${clubId}/memberProgress`,
        userId,
      );
      const progressDoc = await getDoc(progressRef);

      if (progressDoc.exists()) {
        return progressDoc.data() as IReadingProgress;
      }
      return null;
    } catch (error) {
      console.error("Error getting member progress:", error);
      throw error;
    }
  };

  getAllMemberProgress = (
    clubId: string,
    callback: (progress: IReadingProgress[]) => void,
  ) => {
    const progressRef = collection(
      firestore,
      `bookClubs/${clubId}/memberProgress`,
    );
    const q = query(progressRef, orderBy("currentChapter", "desc"));

    return onSnapshot(q, (snapshot) => {
      const progress = snapshot.docs.map(
        (doc) => doc.data() as IReadingProgress,
      );
      callback(progress);
    });
  };

  // Spoiler Tag Methods (for messages)
  addSpoilerToMessage = async (
    clubId: string,
    messageId: string,
    spoilerData: { chapterRange: { start: number; end?: number } },
  ) => {
    try {
      const messageRef = doc(
        firestore,
        `bookClubs/${clubId}/messages`,
        messageId,
      );
      await updateDoc(messageRef, {
        hasSpoiler: true,
        spoilerChapterRange: spoilerData.chapterRange,
      });
    } catch (error) {
      console.error("Error adding spoiler to message:", error);
      throw error;
    }
  };
}

export const bookClubRepo = new BookClubRepo();
