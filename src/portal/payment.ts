export type PaymentMethod = 'upi' | 'card' | 'net-banking'

export type PaymentStatus =
  | 'not-started'
  | 'redirecting'
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'cancelled'
  | 'timed-out'
  | 'unknown'

export type PaymentOutcome = Exclude<PaymentStatus, 'not-started' | 'redirecting'>

export interface FeeItem {
  id: string
  labelEn: string
  labelHi: string
  explanationEn: string
  explanationHi: string
  amountPaise: number
}

export interface PaymentActivity {
  id: string
  at: string
  code:
    | 'PAYMENT_STARTED'
    | 'GATEWAY_REDIRECTED'
    | 'AUTHORIZATION_CONFIRMED'
    | 'AUTHORIZATION_DECLINED'
    | 'AUTHORIZATION_CANCELLED'
    | 'AUTHORIZATION_TIMED_OUT'
    | 'STATUS_UNKNOWN'
    | 'STATUS_RECONCILED'
  titleEn: string
  titleHi: string
  detailEn: string
  detailHi: string
}

export interface PaymentState {
  status: PaymentStatus
  amountPaise: number
  currency: 'INR'
  attemptId?: string
  idempotencyKey?: string
  method?: PaymentMethod
  gateway?: 'LicenceFlow Test Gateway'
  reference?: string
  startedAt?: string
  updatedAt?: string
  confirmedAt?: string
  activity: PaymentActivity[]
}

export interface AuthoritativePaymentSnapshot {
  status: PaymentStatus
  reference: string
  updatedAt: string
  resolvedAt?: string
}

export const MP_LL_DEMO_FEE = {
  evidence: 'SYNTHETIC_PROTOTYPE' as const,
  items: [
    {
      id: 'll-application-test-fee',
      labelEn: "Learner's Licence application and test fee",
      labelHi: 'लर्नर लाइसेंस आवेदन और परीक्षा शुल्क',
      explanationEn: 'Configurable prototype amount used to demonstrate the transaction journey.',
      explanationHi: 'लेन-देन यात्रा दिखाने के लिए उपयोग की गई विन्यास योग्य प्रोटोटाइप राशि।',
      amountPaise: 25000,
    },
  ] satisfies FeeItem[],
}

export function feeTotal(items: FeeItem[] = MP_LL_DEMO_FEE.items): number {
  return items.reduce((sum, item) => sum + item.amountPaise, 0)
}

export function createPaymentState(): PaymentState {
  return {
    status: 'not-started',
    amountPaise: feeTotal(),
    currency: 'INR',
    activity: [],
  }
}

export function isPaymentConfirmed(payment: PaymentState): boolean {
  return payment.status === 'confirmed'
}

export function paymentNeedsReconciliation(payment: PaymentState): boolean {
  return payment.status === 'pending' || payment.status === 'unknown' || payment.status === 'timed-out'
}

export function paymentBlocksNewAttempt(payment: PaymentState): boolean {
  return payment.status === 'redirecting' || paymentNeedsReconciliation(payment) || isPaymentConfirmed(payment)
}

function activity(
  code: PaymentActivity['code'],
  at: string,
  titleEn: string,
  titleHi: string,
  detailEn: string,
  detailHi: string,
): PaymentActivity {
  return { id: `${code}-${at}`, at, code, titleEn, titleHi, detailEn, detailHi }
}

export function beginPayment(
  payment: PaymentState,
  options: { applicationId: string; method: PaymentMethod; attemptId: string; now: string },
): PaymentState {
  if (paymentBlocksNewAttempt(payment)) return payment
  const idempotencyKey = `MP-LL-${options.applicationId}-${options.attemptId}`
  return {
    ...payment,
    status: 'redirecting',
    method: options.method,
    gateway: 'LicenceFlow Test Gateway',
    attemptId: options.attemptId,
    idempotencyKey,
    startedAt: options.now,
    updatedAt: options.now,
    reference: undefined,
    confirmedAt: undefined,
    activity: [
      ...payment.activity,
      activity(
        'PAYMENT_STARTED',
        options.now,
        'Payment attempt started',
        'भुगतान प्रयास शुरू हुआ',
        `A ${options.method} test-gateway attempt was created.`,
        `${options.method} परीक्षण-गेटवे प्रयास बनाया गया।`,
      ),
    ],
  }
}

export function markGatewayRedirected(payment: PaymentState, now: string): PaymentState {
  if (payment.status !== 'redirecting') return payment
  if (payment.activity.some((item) => item.code === 'GATEWAY_REDIRECTED')) return payment
  return {
    ...payment,
    updatedAt: now,
    activity: [
      ...payment.activity,
      activity(
        'GATEWAY_REDIRECTED',
        now,
        'Secure gateway opened',
        'सुरक्षित गेटवे खुला',
        'The portal handed the test transaction to the separate sandbox gateway.',
        'पोर्टल ने परीक्षण लेन-देन अलग सैंडबॉक्स गेटवे को सौंपा।',
      ),
    ],
  }
}

function referenceFor(payment: PaymentState): string | undefined {
  if (!payment.attemptId) return undefined
  return `MP-SBX-${payment.attemptId.replace(/[^A-Z0-9]/gi, '').slice(-12).toUpperCase()}`
}

export function resolvePayment(payment: PaymentState, outcome: PaymentOutcome, now: string): PaymentState {
  if (payment.status === 'confirmed') return payment
  if (!payment.attemptId || !payment.idempotencyKey) return payment

  const metadata: Record<PaymentOutcome, Omit<PaymentActivity, 'id' | 'at' | 'code'> & { code: PaymentActivity['code'] }> = {
    confirmed: {
      code: 'AUTHORIZATION_CONFIRMED',
      titleEn: 'Payment confirmed',
      titleHi: 'भुगतान पुष्ट हुआ',
      detailEn: 'The sandbox authorization was returned and linked to this application.',
      detailHi: 'सैंडबॉक्स प्राधिकरण लौट आया और इस आवेदन से जुड़ गया।',
    },
    pending: {
      code: 'STATUS_UNKNOWN',
      titleEn: 'Confirmation is still pending',
      titleHi: 'पुष्टि अभी लंबित है',
      detailEn: 'Do not pay again until this attempt is checked.',
      detailHi: 'इस प्रयास की जाँच होने तक दोबारा भुगतान न करें।',
    },
    unknown: {
      code: 'STATUS_UNKNOWN',
      titleEn: 'Gateway return was not confirmed',
      titleHi: 'गेटवे वापसी पुष्ट नहीं हुई',
      detailEn: 'The existing attempt must be reconciled before another payment.',
      detailHi: 'दूसरे भुगतान से पहले मौजूदा प्रयास का मिलान करना होगा।',
    },
    declined: {
      code: 'AUTHORIZATION_DECLINED',
      titleEn: 'Authorization declined',
      titleHi: 'प्राधिकरण अस्वीकृत हुआ',
      detailEn: 'No payment was confirmed. A new attempt may be started.',
      detailHi: 'कोई भुगतान पुष्ट नहीं हुआ। नया प्रयास शुरू किया जा सकता है।',
    },
    cancelled: {
      code: 'AUTHORIZATION_CANCELLED',
      titleEn: 'Payment cancelled',
      titleHi: 'भुगतान रद्द हुआ',
      detailEn: 'The gateway closed without confirmation. The application remains saved.',
      detailHi: 'गेटवे बिना पुष्टि बंद हुआ। आवेदन सहेजा हुआ है।',
    },
    'timed-out': {
      code: 'AUTHORIZATION_TIMED_OUT',
      titleEn: 'Gateway response timed out',
      titleHi: 'गेटवे उत्तर का समय समाप्त हुआ',
      detailEn: 'The prior attempt must be checked before trying again.',
      detailHi: 'दोबारा प्रयास से पहले पिछले प्रयास की जाँच करनी होगी।',
    },
  }
  const selected = metadata[outcome]
  return {
    ...payment,
    status: outcome,
    updatedAt: now,
    confirmedAt: outcome === 'confirmed' ? now : undefined,
    reference: outcome === 'confirmed' ? referenceFor(payment) : undefined,
    activity: [
      ...payment.activity,
      activity(selected.code, now, selected.titleEn, selected.titleHi, selected.detailEn, selected.detailHi),
    ],
  }
}

export function reconcilePayment(payment: PaymentState, outcome: 'confirmed' | 'declined', now: string): PaymentState {
  if (!paymentNeedsReconciliation(payment)) return payment
  const resolved = resolvePayment(payment, outcome, now)
  return {
    ...resolved,
    activity: [
      ...resolved.activity,
      activity(
        'STATUS_RECONCILED',
        now,
        'Payment status checked',
        'भुगतान स्थिति जाँची गई',
        outcome === 'confirmed' ? 'The earlier attempt is confirmed. No new payment is required.' : 'The earlier attempt was not charged. A new attempt is available.',
        outcome === 'confirmed' ? 'पहला प्रयास पुष्ट है। नया भुगतान आवश्यक नहीं है।' : 'पहले प्रयास में शुल्क नहीं लगा। नया प्रयास उपलब्ध है।',
      ),
    ],
  }
}

export function applyAuthoritativePayment(
  payment: PaymentState,
  snapshot: AuthoritativePaymentSnapshot,
  reconciled = false,
): PaymentState {
  if (!payment.attemptId || !payment.idempotencyKey) return payment
  const changed = payment.status !== snapshot.status || payment.reference !== snapshot.reference
  if (!changed && !reconciled) return { ...payment, updatedAt: snapshot.updatedAt }

  if (snapshot.status === 'not-started' || snapshot.status === 'redirecting') {
    return {
      ...payment,
      status: snapshot.status,
      reference: snapshot.reference,
      updatedAt: snapshot.updatedAt,
    }
  }

  const resolved = resolvePayment(payment, snapshot.status as PaymentOutcome, snapshot.updatedAt)
  const withServerReference = {
    ...resolved,
    status: snapshot.status,
    reference: snapshot.reference,
    updatedAt: snapshot.updatedAt,
    confirmedAt: snapshot.status === 'confirmed' ? (snapshot.resolvedAt ?? snapshot.updatedAt) : undefined,
  }
  if (!reconciled) return withServerReference
  return {
    ...withServerReference,
    activity: [
      ...withServerReference.activity,
      activity(
        'STATUS_RECONCILED',
        snapshot.updatedAt,
        'Payment status checked with the sandbox service',
        'सैंडबॉक्स सेवा से भुगतान स्थिति जाँची गई',
        snapshot.status === 'confirmed'
          ? 'The earlier attempt is confirmed. No new payment is required.'
          : 'The earlier attempt was not charged. A new attempt is available.',
        snapshot.status === 'confirmed'
          ? 'पहला प्रयास पुष्ट है। नया भुगतान आवश्यक नहीं है।'
          : 'पहले प्रयास में शुल्क नहीं लगा। नया प्रयास उपलब्ध है।',
      ),
    ],
  }
}

export function resetPaymentForRetry(payment: PaymentState): PaymentState {
  if (payment.status !== 'declined' && payment.status !== 'cancelled') return payment
  return {
    ...createPaymentState(),
    activity: payment.activity,
  }
}
