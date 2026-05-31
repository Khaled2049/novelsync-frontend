#!/usr/bin/env node

/**
 * Backfill public profile documents from users collection.
 *
 * Usage:
 *   node functions/scripts/backfill-public-profiles.js
 *   node functions/scripts/backfill-public-profiles.js --prod
 *
 * Defaults to Firestore emulator unless --prod is provided.
 */

const admin = require('firebase-admin')

function parseArgs(argv) {
  const args = argv.slice(2)
  const flags = new Set(args.filter((a) => a.startsWith('--')))
  const projectId =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'story-6f89f'

  return {
    prod: flags.has('--prod'),
    help: flags.has('--help') || flags.has('-h'),
    projectId,
  }
}

async function main() {
  const { prod, help, projectId } = parseArgs(process.argv)

  if (help) {
    console.log(`Usage:
  node functions/scripts/backfill-public-profiles.js [--prod]

Options:
  --prod   Use production Firestore instead of emulator
  --help   Show this message`)
    return
  }

  if (!prod) {
    process.env.FIRESTORE_EMULATOR_HOST =
      process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
  }

  admin.initializeApp({ projectId })

  const db = admin.firestore()
  const usersSnap = await db.collection('users').get()

  let processed = 0
  let written = 0
  let skipped = 0

  const writes = usersSnap.docs.map(async (userDoc) => {
    processed += 1
    const userData = userDoc.data() || {}
    const username =
      typeof userData.username === 'string' ? userData.username.trim() : ''

    if (!username) {
      skipped += 1
      return
    }

    const payload = {
      username,
      ...(typeof userData.displayName === 'string' && userData.displayName.trim()
        ? { displayName: userData.displayName.trim() }
        : {}),
      ...(typeof userData.photoURL === 'string' && userData.photoURL.trim()
        ? { photoURL: userData.photoURL.trim() }
        : {}),
      updatedAt: new Date().toISOString(),
    }

    await db.collection('publicProfiles').doc(userDoc.id).set(payload, { merge: true })
    written += 1
  })

  await Promise.all(writes)

  console.log(
    JSON.stringify(
      {
        success: true,
        target: prod ? 'production' : 'emulator',
        processed,
        written,
        skipped,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.exit(1)
})
