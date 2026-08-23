export const applicationSteps = ['category', 'identity', 'personal', 'address', 'vehicles', 'fitness', 'review'] as const
export type ApplicationStep = typeof applicationSteps[number]
export type ApplicantCategory = '' | 'no-licence' | 'holds-driving-licence' | 'holds-learner-licence'
export type IdentityRoute = '' | 'aadhaar-ekyc' | 'documents'
export type FitnessAnswer = '' | 'yes' | 'no'

export type AddressFields = {
  house: string
  street: string
  locality: string
  district: string
  pin: string
}

export type LLApplicationDraft = {
  version: 1
  applicationId: string
  applicantCategory: ApplicantCategory
  existingLicenceNumber: string
  specialCategory: 'none' | 'diplomat' | 'refugee' | 'repatriate' | 'ex-serviceman'
  identityRoute: IdentityRoute
  identityConsent: boolean
  identityOtpSent: boolean
  identityVerified: boolean
  firstName: string
  middleName: string
  lastName: string
  relationType: 'father' | 'mother' | 'spouse' | 'guardian'
  relationName: string
  gender: '' | 'male' | 'female' | 'transgender'
  dateOfBirth: string
  placeOfBirth: string
  education: string
  mobile: string
  email: string
  identificationMark1: string
  identificationMark2: string
  presentAddress: AddressFields
  yearsAtAddress: string
  monthsAtAddress: string
  samePermanentAddress: boolean
  permanentAddress: AddressFields
  vehicleClasses: string[]
  trainedAtDrivingSchool: '' | 'yes' | 'no'
  fitnessAnswers: Record<string, FitnessAnswer>
  declarationAccepted: boolean
  submittedAt: string | null
  photoUploaded: boolean
  signatureUploaded: boolean
  documentsUploaded: boolean
  lastSavedAt: string
}

export const fitnessQuestions = [
  { id: 'consciousness', text: 'Do you suffer from epilepsy, sudden attacks of loss of consciousness or giddiness?' },
  { id: 'eyesight', text: 'Do you have an eyesight defect that may prevent safe driving?' },
  { id: 'colour', text: 'Are you unable to distinguish the commonly used red and green traffic colours?' },
  { id: 'hearing', text: 'Do you have hearing loss that may prevent you from hearing ordinary traffic warning signals?' },
  { id: 'limb', text: 'Do you have loss of a hand or foot, or another limb condition affecting safe control of a vehicle?' },
  { id: 'other', text: 'Do you have any other disease or disability likely to make driving a source of danger to the public?' },
] as const

export const vehicleOptions = [
  { id: 'MCWOG', name: 'Motorcycle without gear', example: 'Scooter/moped category' },
  { id: 'MCWG', name: 'Motorcycle with gear', example: 'Geared motorcycle category' },
  { id: 'LMV', name: 'Light motor vehicle', example: 'Car/jeep category' },
] as const

const emptyAddress = (): AddressFields => ({ house: '', street: '', locality: '', district: '', pin: '' })

export function createEmptyDraft(applicationId = `MP-LL-${String(Date.now()).slice(-8)}`): LLApplicationDraft {
  return {
    version: 1,
    applicationId,
    applicantCategory: '',
    existingLicenceNumber: '',
    specialCategory: 'none',
    identityRoute: '',
    identityConsent: false,
    identityOtpSent: false,
    identityVerified: false,
    firstName: '',
    middleName: '',
    lastName: '',
    relationType: 'father',
    relationName: '',
    gender: '',
    dateOfBirth: '',
    placeOfBirth: '',
    education: '',
    mobile: '',
    email: '',
    identificationMark1: '',
    identificationMark2: '',
    presentAddress: emptyAddress(),
    yearsAtAddress: '',
    monthsAtAddress: '',
    samePermanentAddress: true,
    permanentAddress: emptyAddress(),
    vehicleClasses: [],
    trainedAtDrivingSchool: '',
    fitnessAnswers: Object.fromEntries(fitnessQuestions.map((question) => [question.id, ''])) as Record<string, FitnessAnswer>,
    declarationAccepted: false,
    submittedAt: null,
    photoUploaded: false,
    signatureUploaded: false,
    documentsUploaded: false,
    lastSavedAt: new Date().toISOString(),
  }
}

export function createPreparedDraft(): LLApplicationDraft {
  const draft = createEmptyDraft('MP-LL-DEMO-2408')
  return {
    ...draft,
    applicantCategory: 'no-licence',
    identityRoute: 'aadhaar-ekyc',
    identityConsent: true,
    identityOtpSent: true,
    identityVerified: true,
    firstName: 'Aarav',
    lastName: 'Verma',
    relationName: 'Rakesh Verma',
    gender: 'male',
    dateOfBirth: '2002-06-14',
    placeOfBirth: 'Bhopal',
    education: 'Graduate',
    mobile: '9000000042',
    email: 'aarav.verma@example.invalid',
    identificationMark1: 'Small mark on left forearm',
    presentAddress: { house: '42', street: 'Demo Nagar Road', locality: 'Arera Colony', district: 'Bhopal', pin: '462016' },
    yearsAtAddress: '5',
    monthsAtAddress: '0',
    samePermanentAddress: true,
    vehicleClasses: ['MCWG', 'LMV'],
    trainedAtDrivingSchool: 'no',
    fitnessAnswers: Object.fromEntries(fitnessQuestions.map((question) => [question.id, 'no'])) as Record<string, FitnessAnswer>,
    declarationAccepted: true,
    documentsUploaded: true,
    photoUploaded: true,
    signatureUploaded: true,
  }
}

export type FieldErrors = Record<string, string>

function required(value: string): boolean {
  return value.trim().length > 0
}

export function validateApplicationStep(draft: LLApplicationDraft, step: ApplicationStep): FieldErrors {
  const errors: FieldErrors = {}
  if (step === 'category') {
    if (!draft.applicantCategory) errors.applicantCategory = 'Choose the option that describes the applicant.'
    if (draft.applicantCategory !== 'no-licence' && !required(draft.existingLicenceNumber)) errors.existingLicenceNumber = 'Enter a synthetic existing licence number for this route.'
  }
  if (step === 'identity') {
    if (!draft.identityRoute) errors.identityRoute = 'Choose a synthetic identity route.'
    if (draft.identityRoute && !draft.identityConsent) errors.identityConsent = 'Accept the prototype identity consent to continue.'
    if (draft.identityRoute === 'aadhaar-ekyc' && !draft.identityVerified) errors.identityVerified = 'Verify the demonstration OTP to continue.'
  }
  if (step === 'personal') {
    if (!required(draft.firstName)) errors.firstName = 'Enter the applicant’s first name.'
    if (!required(draft.lastName)) errors.lastName = 'Enter the applicant’s last name.'
    if (!required(draft.relationName)) errors.relationName = 'Enter the selected relation’s name.'
    if (!draft.gender) errors.gender = 'Select a gender option.'
    if (!draft.dateOfBirth) errors.dateOfBirth = 'Enter the date of birth.'
    if (!/^\d{10}$/.test(draft.mobile)) errors.mobile = 'Enter a 10-digit synthetic mobile number.'
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) errors.email = 'Enter a valid synthetic email address or leave it blank.'
    if (!required(draft.identificationMark1)) errors.identificationMark1 = 'Enter at least one identification mark or “None”.'
  }
  if (step === 'address') {
    if (!required(draft.presentAddress.house)) errors['presentAddress.house'] = 'Enter house/flat number or name.'
    if (!required(draft.presentAddress.locality)) errors['presentAddress.locality'] = 'Enter village, town or locality.'
    if (!required(draft.presentAddress.district)) errors['presentAddress.district'] = 'Choose or enter a district.'
    if (!/^\d{6}$/.test(draft.presentAddress.pin)) errors['presentAddress.pin'] = 'Enter a 6-digit PIN code.'
    if (!/^\d+$/.test(draft.yearsAtAddress)) errors.yearsAtAddress = 'Enter complete years at this address.'
    if (!draft.samePermanentAddress) {
      if (!required(draft.permanentAddress.house)) errors['permanentAddress.house'] = 'Enter permanent house/flat number or name.'
      if (!required(draft.permanentAddress.locality)) errors['permanentAddress.locality'] = 'Enter permanent village, town or locality.'
      if (!required(draft.permanentAddress.district)) errors['permanentAddress.district'] = 'Enter permanent district.'
      if (!/^\d{6}$/.test(draft.permanentAddress.pin)) errors['permanentAddress.pin'] = 'Enter a 6-digit permanent PIN code.'
    }
  }
  if (step === 'vehicles') {
    if (draft.vehicleClasses.length === 0) errors.vehicleClasses = 'Select at least one vehicle class.'
    if (!draft.trainedAtDrivingSchool) errors.trainedAtDrivingSchool = 'Choose whether the applicant trained at a driving school.'
  }
  if (step === 'fitness') {
    for (const question of fitnessQuestions) {
      if (!draft.fitnessAnswers[question.id]) errors[`fitness.${question.id}`] = 'Answer Yes or No.'
    }
  }
  if (step === 'review' && !draft.declarationAccepted) errors.declarationAccepted = 'Accept the declaration before submitting.'
  return errors
}

export function validateAllApplicationSteps(draft: LLApplicationDraft): Record<ApplicationStep, FieldErrors> {
  return Object.fromEntries(applicationSteps.map((step) => [step, validateApplicationStep(draft, step)])) as Record<ApplicationStep, FieldErrors>
}

export function completedStepCount(draft: LLApplicationDraft): number {
  return applicationSteps.filter((step) => Object.keys(validateApplicationStep(draft, step)).length === 0).length
}

export const APPLICATION_DRAFT_KEY = 'mp-ll-application-draft-v1'

export function loadApplicationDraft(): LLApplicationDraft | null {
  try {
    const raw = localStorage.getItem(APPLICATION_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LLApplicationDraft
    return parsed.version === 1 ? {
      ...parsed,
      identityOtpSent: parsed.identityOtpSent ?? false,
      identityVerified: parsed.identityVerified ?? false,
      documentsUploaded: parsed.documentsUploaded ?? false,
    } : null
  } catch {
    return null
  }
}

export function saveApplicationDraft(draft: LLApplicationDraft): boolean {
  try {
    localStorage.setItem(APPLICATION_DRAFT_KEY, JSON.stringify({ ...draft, lastSavedAt: new Date().toISOString() }))
    return true
  } catch {
    return false
  }
}
