import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";

// Define configuration parameters
const smtpHost = "email-smtp.us-east-1.amazonaws.com"
const smtpPort = "587"
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");
const emailFrom = defineSecret("EMAIL_FROM");
const magicLinkRedirectUrl = defineSecret("MAGIC_LINK_REDIRECT_URL");

interface InviteData {
  email: string;
  status: "pending" | "approved" | "sent" | "completed" | "rejected";
  requestedAt: admin.firestore.Timestamp;
  approvedAt?: admin.firestore.Timestamp;
  sentAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  approvedBy?: string;
  linkSentCount: number;
}

/**
 * Firestore trigger that fires when an invite document is updated.
 * When status changes to "approved", sends a magic link email.
 */
export const onInviteApproved = onDocumentUpdated(
  {
    document: "invites/{email}",
    secrets: [smtpPass],
  },
  async (event) => {
    const beforeData = event.data?.before.data() as InviteData | undefined;
    const afterData = event.data?.after.data() as InviteData | undefined;

    if (!beforeData || !afterData) {
      logger.error("Missing document data");
      return;
    }

    // Only trigger when status changes to "approved"
    if (beforeData.status === "approved" || afterData.status !== "approved") {
      return;
    }

    const email = afterData.email;
    const documentRef = event.data?.after.ref;

    if (!documentRef) {
      logger.error("Missing document reference");
      return;
    }

    logger.info(`Processing approved invite for: ${email}`);

    try {
      // Generate the magic link
      const actionCodeSettings: admin.auth.ActionCodeSettings = {
        url: magicLinkRedirectUrl.value(),
        handleCodeInApp: true,
      };

      const magicLink = await admin.auth().generateSignInWithEmailLink(
        email,
        actionCodeSettings
      );

      logger.info(`Generated magic link for: ${email}`);
      
      // In emulator mode, log the magic link prominently for easy testing
      const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
      if (isEmulator) {
        logger.info("=".repeat(80));
        logger.info(`[EMULATOR MODE] Magic link for ${email}:`);
        logger.info(magicLink);
        logger.info("=".repeat(80));
        logger.info(`Copy the link above to test the signup flow in your browser.`);
      }

      // Send email (skip in emulator if SMTP not configured)
      if (!isEmulator || (smtpUser.value() && smtpPass.value())) {
        try {
          // Create email transporter
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort, 10), 
            secure: false, 
            auth: {
              user: smtpUser.value(), 
              pass: smtpPass.value(), 
            },
            tls: {
              ciphers: 'SSLv3',
              rejectUnauthorized: true,
            }
          });

          // Send email
          await transporter.sendMail({
            from: emailFrom.value(),
            to: email,
            subject: "Your NovelSync Invite",
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #15284f; font-size: 28px; margin-bottom: 20px;">Welcome to NovelSync!</h1>

                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Your invite request has been approved. Click the button below to complete your registration
                  and start your storytelling journey.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLink}"
                     style="display: inline-block; background-color: #15284f; color: white;
                            padding: 14px 28px; text-decoration: none; border-radius: 8px;
                            font-size: 16px; font-weight: bold;">
                    Complete Registration
                  </a>
                </div>

                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  This link will expire in 24 hours. If the button doesn't work, copy and paste this URL
                  into your browser:
                </p>
                <p style="color: #24b8a5; font-size: 12px; word-break: break-all;">
                  ${magicLink}
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                <p style="color: #999; font-size: 12px;">
                  If you didn't request this invite, you can safely ignore this email.
                </p>
              </div>
            `,
            text: `
Welcome to NovelSync!

Your invite request has been approved. Click the link below to complete your registration:

${magicLink}

This link will expire in 24 hours.

If you didn't request this invite, you can safely ignore this email.
            `,
          });

          logger.info(`Magic link email sent to: ${email}`);
        } catch (emailError) {
          logger.warn(`Failed to send email (this is OK in emulator mode):`, emailError);
          if (!isEmulator) {
            throw emailError; // Re-throw in production
          }
        }
      } else {
        logger.info(`[EMULATOR] Skipping email send (SMTP not configured). Magic link logged above.`);
      }

      // Update the invite document
      const updateData: any = {
        status: "sent",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        linkSentCount: admin.firestore.FieldValue.increment(1),
      };
      
      // In emulator mode, store magic link in document for easy access
      if (isEmulator) {
        updateData.magicLink = magicLink;
        logger.info(`[EMULATOR] Magic link also stored in Firestore document for easy access`);
      }
      
      await documentRef.update(updateData);

      logger.info(`Invite document updated to "sent" for: ${email}`);
    } catch (error) {
      logger.error(`Failed to process invite for ${email}:`, error);

      // Update document with error status (optional - keeps it at approved for retry)
      // await documentRef.update({
      //   lastError: (error as Error).message,
      //   lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
      // });
    }
  }
);
