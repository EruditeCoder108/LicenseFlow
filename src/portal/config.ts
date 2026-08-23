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
  summaryHi: string
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
    summary: 'Submit a new application and continue through every required Learner’s Licence stage.',
    summaryHi: 'नया आवेदन जमा करें और लर्नर लाइसेंस की हर आवश्यक प्रक्रिया पूरी करें।',
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
    summary: 'Resume a saved application from the last completed stage.',
    summaryHi: 'अपने सहेजे गए आवेदन को पिछली पूरी हुई प्रक्रिया से आगे बढ़ाएँ।',
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
    summary: 'Check completed and pending stages and see what you need to do next.',
    summaryHi: 'पूरी और लंबित प्रक्रियाएँ देखें तथा अगला जरूरी काम जानें।',
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
    summary: 'Upload or replace the photograph, signature and supporting documents.',
    summaryHi: 'फोटो, हस्ताक्षर और जरूरी दस्तावेज़ अपलोड या बदलें।',
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
    summary: 'Review the applicable fee, make payment and verify its status.',
    summaryHi: 'लागू शुल्क देखें, भुगतान करें और उसकी स्थिति जाँचें।',
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
    summary: 'Learn road signs, traffic rules and driver responsibilities before the test.',
    summaryHi: 'परीक्षा से पहले सड़क संकेत, यातायात नियम और चालक की जिम्मेदारियाँ सीखें।',
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
    summary: 'Practise sample questions and understand how the online test works.',
    summaryHi: 'नमूना प्रश्नों का अभ्यास करें और ऑनलाइन परीक्षा की प्रक्रिया समझें।',
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
    summary: 'Start or resume the online LL test after completing all prerequisites.',
    summaryHi: 'सभी जरूरी प्रक्रियाएँ पूरी करने के बाद ऑनलाइन एलएल परीक्षा शुरू या फिर से जारी करें।',
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
    summary: 'View and print the Learner’s Licence after the application is approved.',
    summaryHi: 'आवेदन स्वीकृत होने के बाद लर्नर लाइसेंस देखें और प्रिंट करें।',
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
    summary: 'See how to update the registered mobile number when OTP cannot be received.',
    summaryHi: 'ओटीपी न मिलने पर पंजीकृत मोबाइल नंबर अपडेट करने की प्रक्रिया देखें।',
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
    summary: 'Check whether an appointment is required and view available details.',
    summaryHi: 'जानें कि अपॉइंटमेंट जरूरी है या नहीं और उपलब्ध जानकारी देखें।',
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
    summary: 'Open information about permanent Driving Licence services.',
    summaryHi: 'स्थायी ड्राइविंग लाइसेंस सेवाओं की जानकारी देखें।',
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
    summary: 'Find renewal, duplicate licence, address change and other services.',
    summaryHi: 'नवीनीकरण, डुप्लीकेट लाइसेंस, पता परिवर्तन और अन्य सेवाएँ खोजें।',
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

export const serviceCategoryLabels: Record<ServiceCategory, { en: string; hi: string }> = {
  'Learner licence': { en: 'Learner’s Licence', hi: 'लर्नर लाइसेंस' },
  'Application utilities': { en: 'Application services', hi: 'आवेदन संबंधी सेवाएँ' },
  'Other licence services': { en: 'Other licence services', hi: 'अन्य लाइसेंस सेवाएँ' },
}

export function getService(serviceId: string): ServiceDefinition | undefined {
  return services.find((service) => service.id === serviceId)
}
