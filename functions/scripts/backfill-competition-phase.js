#!/usr/bin/env node

/**
 * Backfill the phase model onto competitions created before it existed.
 *
 * Sets `phase`, `escrowState` and `nextTransitionAt` from each document's
 * dates, and converts the old decorative prizeAmount/prizeCurrency into a
 * `legacyPrizeLabel`.
 *
 * It deliberately does NOT create a `prizePool`. Those competitions were never
 * funded — no tokens were ever escrowed for them — so presenting them as real
 * TALE pools would misrepresent what a winner would receive. They keep a label
 * and an `escrowState` of "unfunded".
 *
 * Idempotent: a document that already has `phase` is skipped, so it is safe to
 * re-run.
 *
 * Usage:
 *   node functions/scripts/backfill-competition-phase.js            # emulator
 *   node functions/scripts/backfill-competition-phase.js --prod
 *   node functions/scripts/backfill-competition-phase.js --dry-run
 */

const admin = require('firebase-admin')

function parseArgs(argv) {
  const args = argv.slice(2)
  const flags = new Set(args.filter((a) => a.startsWith('--')))
  const projectId =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'story-6f89f'

  return {
    prod: flags.has('--prod'),
    dryRun: flags.has('--dry-run'),
    help: flags.has('--help') || flags.has('-h'),
    projectId,
  }
}

/** Mirrors dueTimePhase/nextTransitionAt in functions/src/competitionPhase.ts. */
function derivePhase(startDate, deadline, now) {
  if (now < startDate.getTime()) return 'draft'
  if (now > deadline.getTime()) return 'settled'
  return 'open'
}

async function main() {
  const { prod, dryRun, help, projectId } = parseArgs(process.argv)

  if (help) {
    console.log(
      'Usage: node functions/scripts/backfill-competition-phase.js [--prod] [--dry-run]',
    )
    process.exit(0)
  }

  if (!prod && !process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
  }

  admin.initializeApp({ projectId })
  const db = admin.firestore()

  console.log(
    `Backfilling competitions in ${prod ? 'PRODUCTION' : 'the emulator'} (${projectId})${
      dryRun ? ' [dry run]' : ''
    }`,
  )

  const snapshot = await db.collection('competitions').get()
  const now = Date.now()
  let updated = 0
  let skipped = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()

    if (data.phase) {
      skipped++
      continue
    }

    const startDate = data.startDate?.toDate?.() ?? new Date(0)
    const deadline = data.deadline?.toDate?.() ?? new Date(0)
    const phase = derivePhase(startDate, deadline, now)

    // Old competitions have no voting window; give them three days after the
    // deadline so the phase machine has something coherent to work with.
    const votingDeadline =
      data.votingDeadline?.toDate?.() ??
      new Date(deadline.getTime() + 3 * 24 * 60 * 60 * 1000)

    const legacyAmount =
      typeof data.prizeAmount === 'number' ? data.prizeAmount : 0
    const legacyPrizeLabel =
      legacyAmount > 0
        ? `${legacyAmount.toLocaleString()} ${data.prizeCurrency || 'USD'}`
        : null

    const update = {
      phase,
      escrowState: 'unfunded',
      legacyPrizeLabel,
      votingDeadline: admin.firestore.Timestamp.fromDate(votingDeadline),
      payoutSplitBps: data.payoutSplitBps ?? [10000],
      submissionCount: data.submissionCount ?? 0,
      ballotCount: data.ballotCount ?? 0,
      nextTransitionAt:
        phase === 'draft'
          ? admin.firestore.Timestamp.fromDate(startDate)
          : phase === 'open'
            ? admin.firestore.Timestamp.fromDate(deadline)
            : null,
    }

    console.log(
      `  ${doc.id}: phase=${phase} prize=${legacyPrizeLabel ?? 'none'}`,
    )

    if (!dryRun) {
      await doc.ref.update(update)
    }
    updated++
  }

  console.log(
    `\nDone. ${updated} updated, ${skipped} already had a phase.${
      dryRun ? ' (nothing was written)' : ''
    }`,
  )
  process.exit(0)
}

main().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
