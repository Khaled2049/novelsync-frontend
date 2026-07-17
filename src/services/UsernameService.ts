import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";

/**
 * Username uniqueness index: `usernames/{key} -> { uid }`.
 *
 * Uniqueness is tracked in a dedicated collection so it can be checked with a
 * single get() — the security rules forbid listing users/publicProfiles.
 * Every writer of a username (signup, profile edit, login backfill) must go
 * through this service, otherwise names it never sees stay claimable by others.
 */

/**
 * Usernames collide case-insensitively: the index doc id is the lowercased
 * name, so `Alice` cannot be claimed while `alice` is held. Display casing is
 * kept on the user doc, not here.
 */
export const usernameKey = (username: string): string =>
  username.trim().toLowerCase();

/**
 * `claimed` — the mapping was created by this call, so a caller that later
 * fails to commit its profile write is responsible for releasing it.
 * `already-owned` — this uid already held the name; nothing was written.
 * `taken` — another uid holds it, or the create lost a race.
 */
export type ClaimResult = "claimed" | "already-owned" | "taken";

class UsernameService {
  private ref(username: string) {
    return doc(firestore, "usernames", usernameKey(username));
  }

  async claim(username: string, uid: string): Promise<ClaimResult> {
    const ref = this.ref(username);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      return existing.data()?.uid === uid ? "already-owned" : "taken";
    }
    try {
      await setDoc(ref, { uid });
      return "claimed";
    } catch {
      // Rules allow create but not update, so a concurrent claimant surfaces
      // here as a write failure rather than a silent overwrite.
      return "taken";
    }
  }

  /** Best-effort: the mapping may not exist (accounts predating the index). */
  async release(username: string): Promise<void> {
    try {
      await deleteDoc(this.ref(username));
    } catch {
      /* nothing to release */
    }
  }
}

export const usernameService = new UsernameService();
