/**
 * LicenceFlow's durable prototype schema.
 *
 * Deliberately excluded: names, identity numbers, contact details, documents,
 * camera frames/signals, question text, and selected answers. The database only
 * keeps synthetic journey milestones needed to demonstrate safe recovery.
 */
export const reliabilitySchema = {
  sessions: 'reliability_sessions',
  checkpoints: 'reliability_checkpoints',
  paymentConfirmations: 'payment_confirmations',
} as const

