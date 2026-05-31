import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";

export interface PublicProfile {
  username: string;
  displayName?: string;
  photoURL?: string;
  updatedAt: string;
}

class PublicProfileService {
  async upsertPublicProfile(
    userId: string,
    data: { username: string; displayName?: string; photoURL?: string },
  ): Promise<void> {
    const profileRef = doc(firestore, "publicProfiles", userId);
    await setDoc(
      profileRef,
      {
        username: data.username,
        ...(data.displayName ? { displayName: data.displayName } : {}),
        ...(data.photoURL ? { photoURL: data.photoURL } : {}),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    const profileRef = doc(firestore, "publicProfiles", userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return null;
    }

    return profileSnap.data() as PublicProfile;
  }

  async getPublicProfiles(userIds: string[]): Promise<Map<string, PublicProfile>> {
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    const profileMap = new Map<string, PublicProfile>();

    await Promise.all(
      uniqueIds.map(async (userId) => {
        const profile = await this.getPublicProfile(userId);
        if (profile) {
          profileMap.set(userId, profile);
        }
      }),
    );

    return profileMap;
  }
}

export const publicProfileService = new PublicProfileService();
