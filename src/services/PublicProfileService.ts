import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";

export interface PublicProfile {
  username: string;
  photoURL?: string;
  bio?: string;
  occupation?: string;
  location?: string;
  createdAt?: string;
  updatedAt: string;
}

class PublicProfileService {
  async upsertPublicProfile(
    userId: string,
    data: {
      username: string;
      photoURL?: string;
      bio?: string;
      occupation?: string;
      location?: string;
      createdAt?: string;
    },
  ): Promise<void> {
    const profileRef = doc(firestore, "publicProfiles", userId);
    await setDoc(
      profileRef,
      {
        username: data.username,
        ...(data.photoURL ? { photoURL: data.photoURL } : {}),
        // !== undefined (not truthiness) so fields can be cleared to ""
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.occupation !== undefined ? { occupation: data.occupation } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.createdAt ? { createdAt: data.createdAt } : {}),
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
