import type { Language } from '../judgeTour'
import { translate } from '../i18n'

export interface LocalGuideContext {
  pathname: string
  language: Language
  applicationStage?: string
}

interface GuideTopic {
  phrases: string[]
  answer: (context: LocalGuideContext) => string
}

const say = (context: LocalGuideContext, en: string, hi: string) => translate(context.language, en, hi)

const normalize = (value: string) => value
  .toLocaleLowerCase()
  .normalize('NFKC')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export function containsSensitiveDetails(value: string) {
  const compactDigits = value.replace(/[\s-]/g, '')
  return /\b[A-Z]{5}\d{4}[A-Z]\b/i.test(value)
    || /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(value)
    || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)
    || /(?:\+?91[\s-]?)?[6-9]\d{9}\b/.test(compactDigits)
    || /\b(?:\d[ -]*?){13,19}\b/.test(value)
}

function nextStep(context: LocalGuideContext) {
  const { pathname } = context
  if (pathname === '/') {
    return say(context, 'Choose “Driving licence services”, then select Madhya Pradesh to begin the Learner’s Licence journey.', '“ड्राइविंग लाइसेंस सेवाएँ” चुनें, फिर लर्नर लाइसेंस की प्रक्रिया शुरू करने के लिए मध्य प्रदेश चुनें।')
  }
  if (pathname.includes('/mp/services')) {
    return say(context, 'Choose “Apply for Learner’s Licence”. You can start a fresh demonstration or continue saved progress from this browser.', '“लर्नर लाइसेंस के लिए आवेदन करें” चुनें। आप नया डेमो शुरू कर सकते हैं या इस ब्राउज़र में सहेजी गई प्रगति जारी रख सकते हैं।')
  }
  if (pathname.includes('/ll/start')) {
    return say(context, 'Select the situation that applies to you. For the judge demonstration, use the clearly labelled demo controls; they use fictional data only.', 'अपनी स्थिति चुनें। जज डेमो के लिए साफ़ तौर पर चिन्हित डेमो बटन इस्तेमाल करें; उसमें केवल काल्पनिक जानकारी है।')
  }
  if (pathname.includes('/ll/application')) {
    const stage = context.applicationStage && context.applicationStage !== 'Not started' ? ` Your saved stage is “${context.applicationStage}”.` : ''
    return say(context, `Complete the current section, then use “Save and continue”. Your progress is saved in this browser so a refresh does not send you back to the beginning.${stage}`, 'मौजूदा भाग पूरा करें, फिर “सहेजें और आगे बढ़ें” दबाएँ। प्रगति इसी ब्राउज़र में सहेजी जाती है, इसलिए रिफ्रेश होने पर शुरुआत से नहीं भरना पड़ेगा।')
  }
  if (pathname.includes('/uploads')) {
    return say(context, 'Attach the required demonstration files, check their previews, then confirm the upload step. All files shown in this prototype are synthetic.', 'ज़रूरी डेमो फ़ाइलें जोड़ें, उनका प्रीव्यू जाँचें, फिर अपलोड की पुष्टि करें। इस प्रोटोटाइप की सभी फ़ाइलें काल्पनिक हैं।')
  }
  if (pathname.includes('/readiness')) {
    return say(context, 'Run the device check before payment. The normal route checks camera, microphone, connection and lighting; the judge simulation is clearly labelled and does not turn on the camera.', 'भुगतान से पहले डिवाइस जाँच चलाएँ। सामान्य प्रक्रिया कैमरा, माइक्रोफ़ोन, इंटरनेट और रोशनी जाँचती है; जज डेमो साफ़ चिन्हित है और कैमरा चालू नहीं करता।')
  }
  if (pathname.includes('/rehearsal')) {
    return say(context, 'Choose one option and save it. This single demo question only confirms that this device can show a question and preserve your choice; it does not count as a test attempt.', 'एक विकल्प चुनकर सहेजें। यह एक डेमो सवाल केवल जाँचता है कि डिवाइस सवाल दिखा और आपका उत्तर सहेज सकता है; इसे टेस्ट प्रयास नहीं माना जाता।')
  }
  if (pathname.includes('/payment')) {
    return say(context, 'Review the displayed fee and consent, then use the simulated payment gateway. No real money moves in LicenceFlow.', 'दिखाया गया शुल्क और सहमति देखें, फिर नकली भुगतान गेटवे चलाएँ। LicenceFlow में असली पैसे का लेन-देन नहीं होता।')
  }
  if (pathname.includes('/tutorial')) {
    return say(context, 'Complete the road-safety learning step. Progress is saved, and the judge-only shortcut is only there to avoid waiting during the hackathon demo.', 'सड़क-सुरक्षा सीखने का चरण पूरा करें। प्रगति सहेजी जाती है, और जज शॉर्टकट केवल हैकाथॉन डेमो में समय बचाने के लिए है।')
  }
  if (pathname.includes('/test-entry')) {
    return say(context, 'Read the test summary and declaration, then start when you are ready. The real test view is focused and does not reveal whether an answer is correct until submission.', 'टेस्ट सारांश और घोषणा पढ़ें, फिर तैयार होने पर शुरू करें। टेस्ट के दौरान सही या गलत उत्तर नहीं बताया जाता; परिणाम जमा करने के बाद दिखता है।')
  }
  if (pathname.includes('/result/review')) {
    return say(context, 'Review each selected answer, the correct answer and its explanation. When finished, return to the result dashboard.', 'हर चुना गया उत्तर, सही उत्तर और उसका कारण देखें। पूरा होने पर परिणाम डैशबोर्ड पर लौटें।')
  }
  if (pathname.includes('/result')) {
    return say(context, 'Open “Review answers” to learn from the attempt. You can also inspect the journey record, download fictional demo documents, retest, or reset the prototype.', 'प्रयास से सीखने के लिए “उत्तर देखें” खोलें। आप यात्रा रिकॉर्ड देख सकते हैं, काल्पनिक डेमो दस्तावेज़ डाउनलोड कर सकते हैं, दोबारा टेस्ट दे सकते हैं या प्रोटोटाइप रीसेट कर सकते हैं।')
  }
  return say(context, 'Use the main action on this page. If you ask about payment, the camera check, saved progress, the tutorial, the test or results, I can explain that part.', 'इस पेज का मुख्य बटन इस्तेमाल करें। आप भुगतान, कैमरा जाँच, सहेजी गई प्रगति, ट्यूटोरियल, टेस्ट या परिणाम के बारे में पूछ सकते हैं।')
}

const topics: GuideTopic[] = [
  {
    phrases: ['right answer', 'correct answer', 'which option', 'solve question', 'answer this question', 'option a', 'option b', 'option c', 'सही उत्तर', 'कौन सा विकल्प', 'सवाल हल', 'उत्तर बताओ'],
    answer: (context) => say(context, 'I can explain how the test works, but I cannot solve or hint at a test question. Choose the answer you believe is safest; after submission, the review explains every answer.', 'मैं टेस्ट का तरीका समझा सकता हूँ, लेकिन किसी सवाल का उत्तर या संकेत नहीं दे सकता। जो विकल्प सबसे सुरक्षित लगे उसे चुनें; जमा करने के बाद समीक्षा में हर उत्तर का कारण मिलेगा।'),
  },
  {
    phrases: ['what next', 'do next', 'next step', 'continue from here', 'what do i do', 'अब क्या', 'आगे क्या', 'क्या करना', 'अगला कदम'],
    answer: nextStep,
  },
  {
    phrases: ['official site', 'government site', 'official licence', 'real licence', 'valid licence', 'prototype', 'mock website', 'सरकारी वेबसाइट', 'असली लाइसेंस', 'मान्य लाइसेंस', 'प्रोटोटाइप'],
    answer: (context) => say(context, 'LicenceFlow is an independent hackathon prototype, not an official government service. Its applications, identity checks, payments and licences are synthetic demonstrations and create no real government record.', 'LicenceFlow एक स्वतंत्र हैकाथॉन प्रोटोटाइप है, आधिकारिक सरकारी सेवा नहीं। इसके आवेदन, पहचान जाँच, भुगतान और लाइसेंस केवल काल्पनिक डेमो हैं; कोई असली सरकारी रिकॉर्ड नहीं बनता।'),
  },
  {
    phrases: ['get a learner', 'get learner', 'get learning', 'apply for learner', 'apply for learning', 'learner s licence', 'learners licence', 'learning licence', 'learner license', 'learning license', 'how to apply', 'लर्नर लाइसेंस कैसे', 'लर्निंग लाइसेंस कैसे', 'आवेदन कैसे'],
    answer: (context) => say(
      context,
      'In this LicenceFlow prototype, the journey is:\n1. Open Driving licence services and start a Learner’s Licence application.\n2. Choose your licence situation and identity route.\n3. Complete personal, address, vehicle and fitness details.\n4. Attach the required documents.\n5. Check the device and try one demo question before payment.\n6. Complete the simulated payment and road-safety learning.\n7. Take the test, then review the result and fictional demo licence.\n\nYour progress is saved in this browser. For a real application, use the official Sarathi/Parivahan service.',
      'इस LicenceFlow प्रोटोटाइप में प्रक्रिया यह है:\n1. ड्राइविंग लाइसेंस सेवाएँ खोलकर लर्नर लाइसेंस आवेदन शुरू करें।\n2. अपनी लाइसेंस स्थिति और पहचान का तरीका चुनें।\n3. निजी जानकारी, पता, वाहन और स्वास्थ्य विवरण भरें।\n4. ज़रूरी दस्तावेज़ जोड़ें।\n5. भुगतान से पहले डिवाइस जाँच और एक डेमो सवाल पूरा करें।\n6. नकली भुगतान और सड़क-सुरक्षा सीखने का चरण पूरा करें।\n7. टेस्ट दें, फिर परिणाम और काल्पनिक डेमो लाइसेंस देखें।\n\nप्रगति इसी ब्राउज़र में सहेजी जाती है। असली आवेदन के लिए आधिकारिक Sarathi/Parivahan सेवा इस्तेमाल करें।',
    ),
  },
  {
    phrases: ['saved', 'save progress', 'refresh', 'reload', 'start again', 'local storage', 'browser storage', 'सहेज', 'रिफ्रेश', 'दोबारा भर', 'प्रगति'],
    answer: (context) => say(context, 'Prototype progress is checkpointed in this browser, so a refresh or interruption should not make you refill the journey. Clearing browser data or using “Reset demo” removes it.', 'प्रोटोटाइप की प्रगति इसी ब्राउज़र में चरण-दर-चरण सहेजी जाती है, इसलिए रिफ्रेश या रुकावट पर फिर से फॉर्म नहीं भरना पड़ता। ब्राउज़र डेटा मिटाने या “डेमो रीसेट” से यह हट जाएगी।'),
  },
  {
    phrases: ['aadhaar', 'identity', 'document', 'upload', 'photo', 'signature', 'address', 'application form', 'quick fill', 'आधार', 'पहचान', 'दस्तावेज', 'अपलोड', 'फोटो', 'हस्ताक्षर', 'पता', 'फॉर्म'],
    answer: (context) => say(context, 'The application separates identity, personal details, address, vehicle class, fitness/accessibility and review into clear steps. Judge quick-fill and attached files use fictional demo data. Please do not paste real identity details into this chat.', 'आवेदन में पहचान, निजी जानकारी, पता, वाहन श्रेणी, स्वास्थ्य/सुलभता और समीक्षा अलग चरणों में हैं। जज क्विक-फिल और फ़ाइलें काल्पनिक डेमो डेटा इस्तेमाल करती हैं। असली पहचान की जानकारी चैट में न भेजें।'),
  },
  {
    phrases: ['camera', 'camera video', 'microphone', 'video uploaded', 'record video', 'face', 'mediapipe', 'lighting', 'device check', 'permission', 'privacy', 'कैमरा', 'माइक्रोफोन', 'वीडियो', 'चेहरा', 'रोशनी', 'डिवाइस जाँच', 'अनुमति', 'गोपनीयता'],
    answer: (context) => say(context, 'The readiness step checks whether this device can support the test before payment. Camera analysis runs on the device with MediaPipe; the prototype does not record video, upload it or identify a person. The labelled judge simulation skips camera permission.', 'डिवाइस जाँच भुगतान से पहले बताती है कि यह डिवाइस टेस्ट चला पाएगा या नहीं। कैमरा विश्लेषण MediaPipe से डिवाइस पर ही होता है; प्रोटोटाइप वीडियो रिकॉर्ड/अपलोड या व्यक्ति की पहचान नहीं करता। साफ़ चिन्हित जज डेमो कैमरा अनुमति छोड़ देता है।'),
  },
  {
    phrases: ['payment', 'charged twice', 'double charge', 'uncertain', 'failed payment', 'refund', 'money', 'fee', 'receipt', 'भुगतान', 'दो बार', 'पैसा', 'शुल्क', 'रसीद', 'रिफंड', 'स्थिति साफ'],
    answer: (context) => say(context, 'LicenceFlow shows payment as not started, processing, successful, failed or uncertain, and keeps the application safe in every case. Duplicate-payment protection and receipt/status recovery are demonstrated, but no real fee is charged in this prototype.', 'LicenceFlow भुगतान को शुरू नहीं हुआ, चल रहा है, सफल, असफल या अनिश्चित रूप में दिखाता है और हर स्थिति में आवेदन सुरक्षित रखता है। दोहरे भुगतान से सुरक्षा और रसीद/स्थिति वापसी का डेमो है, लेकिन इस प्रोटोटाइप में असली शुल्क नहीं लगता।'),
  },
  {
    phrases: ['tutorial', 'learning video', 'watch video', 'skip video', 'road safety', 'ट्यूटोरियल', 'सीखने', 'वीडियो देखें', 'वीडियो छोड़', 'सड़क सुरक्षा'],
    answer: (context) => say(context, 'The learning step prepares the applicant before assessment and saves progress. Normal users must complete it; the clearly labelled judge shortcut only shortens the hackathon demonstration.', 'सीखने का चरण टेस्ट से पहले तैयारी कराता है और प्रगति सहेजता है। सामान्य उपयोगकर्ता इसे पूरा करते हैं; साफ़ चिन्हित जज शॉर्टकट केवल हैकाथॉन डेमो छोटा करता है।'),
  },
  {
    phrases: ['test', 'questions', 'pass mark', 'retest', 'difficulty', 'read aloud', 'speaker', 'timer', 'review answer', 'परीक्षा', 'सवाल', 'पास', 'दोबारा टेस्ट', 'कठिनाई', 'सुन', 'टाइमर', 'उत्तर समीक्षा'],
    answer: (context) => say(context, 'Each attempt uses 15 seeded questions from a reviewed bank while keeping the easy/medium/harder balance stable; the prototype pass mark is 9 of 15. Answers are saved before moving on, questions can be read aloud, and correctness appears only after submission.', 'हर प्रयास में समीक्षा किए गए बैंक से 15 नए सवाल आते हैं, लेकिन आसान/मध्यम/कठिन संतुलन समान रहता है; प्रोटोटाइप में पास अंक 15 में 9 है। आगे बढ़ने से पहले उत्तर सहेजता है, सवाल सुनाए जा सकते हैं, और सही/गलत केवल जमा करने के बाद दिखता है।'),
  },
  {
    phrases: ['interruption', 'network drops', 'connection lost', 'technical failure', 'paused', 'resume test', 'monitoring note', 'cheating', 'रुकावट', 'इंटरनेट बंद', 'तकनीकी खराबी', 'रुका', 'फिर शुरू', 'निगरानी', 'नकल'],
    answer: (context) => say(context, 'A sustained technical problem pauses the test safely instead of erasing it. The same attempt resumes from its checkpoint. Monitoring notes provide context; a camera or network anomaly is not automatically treated as cheating.', 'लंबी तकनीकी समस्या होने पर टेस्ट मिटता नहीं, सुरक्षित रूप से रुकता है। वही प्रयास सहेजे हुए स्थान से फिर शुरू होता है। निगरानी नोट केवल संदर्भ देते हैं; कैमरा या इंटरनेट की समस्या को अपने-आप नकल नहीं माना जाता।'),
  },
  {
    phrases: ['result', 'score', 'review', 'download', 'licence generated', 'reset demo', 'clear data', 'परिणाम', 'अंक', 'समीक्षा', 'डाउनलोड', 'लाइसेंस बना', 'रीसेट', 'डेटा मिट'],
    answer: (context) => say(context, 'The result separates score, technical events and monitoring notes. “Review answers” explains every choice. Downloads are fictional demonstration documents, and “Reset demo” clears LicenceFlow progress from this browser.', 'परिणाम में अंक, तकनीकी घटनाएँ और निगरानी नोट अलग दिखते हैं। “उत्तर देखें” हर विकल्प का कारण बताता है। डाउनलोड काल्पनिक डेमो दस्तावेज़ हैं, और “डेमो रीसेट” इस ब्राउज़र से LicenceFlow की प्रगति मिटाता है।'),
  },
  {
    phrases: ['judge demo', 'judge tour', 'guided tour', 'demo mode', 'quick demo', 'जज डेमो', 'डेमो टूर', 'गाइडेड टूर'],
    answer: (context) => say(context, 'The judge walkthrough highlights the complete journey with fictional quick-fill, simulated device approval, mock payment and time-saving test controls. These shortcuts are visibly labelled and are not citizen-facing production behaviour.', 'जज वॉकथ्रू काल्पनिक क्विक-फिल, नकली डिवाइस मंज़ूरी, मॉक भुगतान और समय बचाने वाले टेस्ट बटन से पूरी यात्रा दिखाता है। ये शॉर्टकट साफ़ चिन्हित हैं और सामान्य नागरिकों के लिए उत्पादन सुविधा नहीं हैं।'),
  },
  {
    phrases: ['hindi', 'language', 'accessibility', 'keyboard', 'screen reader', 'read question', 'हिंदी', 'भाषा', 'सुलभता', 'कीबोर्ड', 'स्क्रीन रीडर', 'सवाल सुन'],
    answer: (context) => say(context, 'LicenceFlow supports Hindi and English, keyboard navigation, visible focus states and spoken test questions. The flow uses plain-language explanations so citizens know what happened and what to do next.', 'LicenceFlow हिंदी और अंग्रेज़ी, कीबोर्ड नेविगेशन, साफ़ फोकस और सवाल सुनने की सुविधा देता है। सरल भाषा बताती है कि क्या हुआ और आगे क्या करना है।'),
  },
]

function topicScore(question: string, phrase: string) {
  if (!question.includes(phrase)) return 0
  return phrase.includes(' ') ? 4 + phrase.split(' ').length : 2
}

export function getLocalRaahiReply(question: string, context: LocalGuideContext) {
  const normalizedQuestion = normalize(question)
  if (!normalizedQuestion) return nextStep(context)

  let bestTopic: GuideTopic | undefined
  let bestScore = 0
  for (const topic of topics) {
    const score = topic.phrases.reduce((total, phrase) => total + topicScore(normalizedQuestion, normalize(phrase)), 0)
    if (score > bestScore) {
      bestTopic = topic
      bestScore = score
    }
  }

  if (bestTopic) return bestTopic.answer(context)
  return say(
    context,
    `I’m the built-in LicenceFlow guide, so I’m best at questions about this journey rather than general topics. You can ask what to do next, how progress is saved, why the device check comes before payment, how interruptions recover, or how results work. ${nextStep(context)}`,
    `मैं LicenceFlow की अंतर्निहित गाइड हूँ, इसलिए सामान्य विषयों की जगह इस प्रक्रिया के सवालों में सबसे उपयोगी हूँ। आप पूछ सकते हैं कि आगे क्या करना है, प्रगति कैसे सहेजती है, भुगतान से पहले डिवाइस जाँच क्यों है, रुकावट के बाद वापसी कैसे होती है, या परिणाम कैसे काम करता है। ${nextStep(context)}`,
  )
}
