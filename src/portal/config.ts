export type EvidenceKind =
  | 'OFFICIAL_CURRENT'
  | 'PERSONAL_OBSERVATION'
  | 'REFERENCE_PATTERN'
  | 'SYNTHETIC_PROTOTYPE'
  | 'INNOVATION_PROPOSAL'
  | 'UNVERIFIED'

export type ServiceCategory = 'Learner licence' | 'Application utilities' | 'Other licence services'

export type ServiceDefinition = {
  id: string
  name: string
  nameHi: string
  summary: string
  category: ServiceCategory
  icon: 'learner' | 'status' | 'upload' | 'payment' | 'tutorial' | 'test' | 'print' | 'phone' | 'calendar' | 'document' | 'car'
  route?: string
  delivery: 'working-journey' | 'working-utility' | 'information-only'
  evidence: EvidenceKind
  audience: string
  requirements: string[]
}

export const MP_PORTAL = {
  stateCode: 'mp',
  stateName: 'Madhya Pradesh',
  stateNameHi: 'मध्य प्रदेश',
  department: 'Transport Department, Government of Madhya Pradesh',
  departmentHi: 'परिवहन विभाग, मध्य प्रदेश शासन',
} as const

export const services: ServiceDefinition[] = [
  {
    id: 'apply-learner-licence',
    name: "Apply for Learner's Licence",
    nameHi: 'लर्नर लाइसेंस के लिए आवेदन',
    summary: 'Complete the application, readiness, payment, learning and online-test journey.',
    category: 'Learner licence',
    icon: 'learner',
    route: '/mp/ll/start',
    delivery: 'working-journey',
    evidence: 'OFFICIAL_CURRENT',
    audience: 'New applicants seeking a Learner’s Licence in Madhya Pradesh.',
    requirements: ['Synthetic identity details for this prototype', 'Address and vehicle-class details', 'Camera and microphone for the secure-test demonstration'],
  },
  {
    id: 'continue-application',
    name: 'Continue pending application',
    nameHi: 'लंबित आवेदन जारी रखें',
    summary: 'Return to the last safely saved stage without creating another application.',
    category: 'Learner licence',
    icon: 'status',
    route: '/mp/application/demo-mp-ll',
    delivery: 'working-journey',
    evidence: 'INNOVATION_PROPOSAL',
    audience: 'Applicants with an existing synthetic draft or submitted application.',
    requirements: ['Prototype application number or saved browser session'],
  },
  {
    id: 'application-status',
    name: 'Application status',
    nameHi: 'आवेदन की स्थिति',
    summary: 'See completed, pending, blocked and failed stages with the next required action.',
    category: 'Application utilities',
    icon: 'status',
    route: '/mp/service/application-status',
    delivery: 'working-utility',
    evidence: 'OFFICIAL_CURRENT',
    audience: 'Applicants who need to track an application.',
    requirements: ['Application number', 'Date of birth'],
  },
  {
    id: 'upload-documents',
    name: 'Upload photo, signature or documents',
    nameHi: 'फोटो, हस्ताक्षर या दस्तावेज़ अपलोड करें',
    summary: 'Review file requirements, validate a preview and safely replace an upload.',
    category: 'Application utilities',
    icon: 'upload',
    route: '/mp/service/upload-documents',
    delivery: 'working-utility',
    evidence: 'OFFICIAL_CURRENT',
    audience: 'Applicants whose application requires an upload stage.',
    requirements: ['Application number', 'Date of birth', 'Supported synthetic file'],
  },
  {
    id: 'fee-payment',
    name: 'Fee payment and status',
    nameHi: 'शुल्क भुगतान और स्थिति',
    summary: 'Review itemized synthetic fees, make a mock payment or verify an uncertain status.',
    category: 'Application utilities',
    icon: 'payment',
    route: '/mp/service/fee-payment',
    delivery: 'working-utility',
    evidence: 'SYNTHETIC_PROTOTYPE',
    audience: 'Applicants who have completed all prerequisites for payment.',
    requirements: ['Prototype application number', 'Readiness completion'],
  },
  {
    id: 'road-safety-tutorial',
    name: 'Road-safety tutorial',
    nameHi: 'सड़क सुरक्षा ट्यूटोरियल',
    summary: 'Study signs, road rules and accident duties with captions and knowledge checks.',
    category: 'Learner licence',
    icon: 'tutorial',
    route: '/mp/service/road-safety-tutorial',
    delivery: 'working-journey',
    evidence: 'OFFICIAL_CURRENT',
    audience: 'LL applicants preparing for the knowledge test.',
    requirements: ['Prototype application context'],
  },
  {
    id: 'mock-test',
    name: 'Practice and mock test',
    nameHi: 'अभ्यास और मॉक टेस्ट',
    summary: 'Practise with explanations before entering the protected test session.',
    category: 'Learner licence',
    icon: 'test',
    route: '/mp/service/mock-test',
    delivery: 'working-journey',
    evidence: 'SYNTHETIC_PROTOTYPE',
    audience: 'Applicants who want to prepare and rehearse test behavior.',
    requirements: ['No application number required for practice'],
  },
  {
    id: 'online-ll-test',
    name: "Online Learner's Licence test",
    nameHi: 'ऑनलाइन लर्नर लाइसेंस टेस्ट',
    summary: 'Enter the synthetic secure-test experience after readiness and payment.',
    category: 'Learner licence',
    icon: 'test',
    route: '/mp/service/online-ll-test',
    delivery: 'working-journey',
    evidence: 'INNOVATION_PROPOSAL',
    audience: 'Applicants whose prerequisites are complete.',
    requirements: ['Prototype application number', 'Readiness, payment and tutorial completion'],
  },
  {
    id: 'print-learner-licence',
    name: "Print Learner's Licence",
    nameHi: 'लर्नर लाइसेंस प्रिंट करें',
    summary: 'View and download a clearly invalid synthetic Form 3 after completion.',
    category: 'Learner licence',
    icon: 'print',
    route: '/mp/service/print-learner-licence',
    delivery: 'working-journey',
    evidence: 'SYNTHETIC_PROTOTYPE',
    audience: 'Applicants with a completed synthetic LL result.',
    requirements: ['Prototype application number', 'Date of birth'],
  },
  {
    id: 'update-mobile',
    name: 'Update mobile number',
    nameHi: 'मोबाइल नंबर अपडेट करें',
    summary: 'Understand the recovery path when OTP cannot reach the registered number.',
    category: 'Application utilities',
    icon: 'phone',
    route: '/mp/service/update-mobile',
    delivery: 'working-utility',
    evidence: 'REFERENCE_PATTERN',
    audience: 'Applicants who cannot receive an application or identity OTP.',
    requirements: ['Exact current MP route requires verification before production'],
  },
  {
    id: 'appointments',
    name: 'Appointments',
    nameHi: 'अपॉइंटमेंट',
    summary: 'View when an office or test appointment is required by the configured process.',
    category: 'Application utilities',
    icon: 'calendar',
    route: '/mp/service/appointments',
    delivery: 'information-only',
    evidence: 'UNVERIFIED',
    audience: 'Applicants whose verified MP route requires an in-person stage.',
    requirements: ['Current MP applicability must be verified'],
  },
  {
    id: 'driving-licence',
    name: 'Driving Licence services',
    nameHi: 'ड्राइविंग लाइसेंस सेवाएँ',
    summary: 'Permanent-DL services are intentionally outside this MP LL Round 1 prototype.',
    category: 'Other licence services',
    icon: 'car',
    route: '/mp/service/driving-licence',
    delivery: 'information-only',
    evidence: 'OFFICIAL_CURRENT',
    audience: 'Citizens seeking permanent-DL services.',
    requirements: ['Use the official Sarathi portal; no prototype application is offered here'],
  },
  {
    id: 'other-services',
    name: 'Other licence services',
    nameHi: 'अन्य लाइसेंस सेवाएँ',
    summary: 'Renewal, duplicate, address-change and related workflows are outside Round 1.',
    category: 'Other licence services',
    icon: 'document',
    route: '/mp/service/other-services',
    delivery: 'information-only',
    evidence: 'OFFICIAL_CURRENT',
    audience: 'Citizens looking for an existing licence-related service.',
    requirements: ['Use the official Sarathi portal for real transactions'],
  },
]

export const serviceCategories: ServiceCategory[] = ['Learner licence', 'Application utilities', 'Other licence services']

export function getService(serviceId: string): ServiceDefinition | undefined {
  return services.find((service) => service.id === serviceId)
}
