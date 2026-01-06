import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { corsOptions } from "./corsConfig";

export const authenticate = onRequest(
  corsOptions,
  async (request, response) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        response.status(400).json({ error: "Email and password required" });
        return;
      }

      // For emulator, you need to use the REST API
      const apiKey = "fake-api-key"; // Emulator accepts any key
      const authUrl = process.env.FUNCTIONS_EMULATOR
        ? `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
        : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

      const authResponse = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      const authData = await authResponse.json();

      if (authData.idToken) {
        response.status(200).json({
          idToken: authData.idToken,
          refreshToken: authData.refreshToken,
          expiresIn: authData.expiresIn,
        });
      } else {
        response
          .status(401)
          .json({ error: authData.error || "Authentication failed" });
      }
    } catch (error) {
      logger.error("Auth error:", error);
      response.status(500).json({ error: "Internal server error" });
    }
  }
);
