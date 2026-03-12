import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { randomInt } from "crypto";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { corsOptions } from "./corsConfig";
import { buildUserProfileDefaults } from "./userProfileDefaults";

const db = admin.firestore();

interface CreateUserByAdminRequest {
  email?: string;
}

interface SetUserAdminRequest {
  email?: string;
  uid?: string;
  isAdmin?: boolean;
}

interface InviteDoc {
  linkSentCount?: number;
}

interface DecodedAdminToken extends admin.auth.DecodedIdToken {
  admin?: boolean;
}

function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split("Bearer ")[1] || null;
}

function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function buildRandomPassword(): string {
  return "password";
}

function buildRandomUsername(): string {
  const baseName = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "_",
    style: "lowerCase",
    length: 2,
  });
  const suffix = randomInt(10, 99);
  return `${baseName}_${suffix}`;
}

async function isUsernameTaken(username: string): Promise<boolean> {
  const snapshot = await db
    .collection("users")
    .where("username", "==", username)
    .limit(1)
    .get();

  return !snapshot.empty;
}

async function generateUniqueUsername(maxAttempts = 20): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const username = buildRandomUsername();
    const taken = await isUsernameTaken(username);

    if (!taken) {
      return username;
    }
  }

  throw Object.assign(new Error("Unable to generate unique username"), {
    statusCode: 409,
  });
}

async function ensureAdmin(
  authHeader: string | undefined,
): Promise<DecodedAdminToken> {
  const token = getBearerToken(authHeader);

  if (!token) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const decoded = (await admin
    .auth()
    .verifyIdToken(token)) as DecodedAdminToken;

  if (!decoded.admin) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return decoded;
}

export const createUserByAdmin = onRequest(
  corsOptions,
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const adminToken = await ensureAdmin(request.headers.authorization);
      const { email } = (request.body || {}) as CreateUserByAdminRequest;
      const normalizedEmail = (email || "").trim().toLowerCase();

      if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        response.status(400).json({ error: "A valid email is required" });
        return;
      }

      try {
        await admin.auth().getUserByEmail(normalizedEmail);
        response
          .status(409)
          .json({ error: "A user with this email already exists" });
        return;
      } catch (error) {
        const authError = error as { code?: string };
        if (authError.code !== "auth/user-not-found") {
          throw error;
        }
      }

      const username = await generateUniqueUsername();
      const password = buildRandomPassword();

      const createdUser = await admin.auth().createUser({
        email: normalizedEmail,
        password,
        displayName: username,
        emailVerified: true,
      });

      try {
        const userDoc = buildUserProfileDefaults({
          username,
          email: normalizedEmail,
        });

        await db.collection("users").doc(createdUser.uid).set(userDoc);

        const inviteRef = db.collection("invites").doc(normalizedEmail);
        const inviteSnapshot = await inviteRef.get();
        const inviteData = inviteSnapshot.data() as InviteDoc | undefined;

        await inviteRef.set(
          {
            email: normalizedEmail,
            status: "completed",
            completedAt: FieldValue.serverTimestamp(),
            approvedAt: FieldValue.serverTimestamp(),
            sentAt: FieldValue.serverTimestamp(),
            approvedBy: adminToken.uid,
            linkSentCount:
              typeof inviteData?.linkSentCount === "number"
                ? inviteData.linkSentCount
                : 0,
          },
          { merge: true },
        );

        response.status(200).json({
          success: true,
          uid: createdUser.uid,
          email: normalizedEmail,
          username,
          password,
        });
      } catch (error) {
        await admin.auth().deleteUser(createdUser.uid);
        throw error;
      }
    } catch (error) {
      const statusCode =
        Number((error as { statusCode?: number })?.statusCode) || 500;
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create user account";

      logger.error("Error creating user by admin", {
        statusCode,
        message,
      });

      response.status(statusCode).json({ error: message });
    }
  },
);

export const setUserAdmin = onRequest(
  corsOptions,
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      await ensureAdmin(request.headers.authorization);

      const {
        email,
        uid,
        isAdmin = true,
      } = (request.body || {}) as SetUserAdminRequest;
      const normalizedEmail = (email || "").trim().toLowerCase();
      const normalizedUid = (uid || "").trim();

      if (!normalizedEmail && !normalizedUid) {
        response.status(400).json({ error: "Either email or uid is required" });
        return;
      }

      const userRecord = normalizedUid
        ? await admin.auth().getUser(normalizedUid)
        : await admin.auth().getUserByEmail(normalizedEmail);

      const currentClaims = userRecord.customClaims || {};
      const updatedClaims = { ...currentClaims };

      if (isAdmin) {
        updatedClaims.admin = true;
      } else {
        delete updatedClaims.admin;
      }

      await admin.auth().setCustomUserClaims(userRecord.uid, updatedClaims);

      response.status(200).json({
        success: true,
        uid: userRecord.uid,
        email: userRecord.email || null,
        isAdmin: Boolean(updatedClaims.admin),
        message:
          "Custom claims updated. User must refresh token (sign out/in) to apply.",
      });
    } catch (error) {
      const authError = error as { code?: string; statusCode?: number };
      let statusCode = Number(authError?.statusCode) || 500;

      if (authError?.code === "auth/user-not-found") {
        statusCode = 404;
      }

      const message =
        error instanceof Error ? error.message : "Failed to update admin claim";

      logger.error("Error setting admin claim", {
        statusCode,
        message,
      });

      response.status(statusCode).json({ error: message });
    }
  },
);
