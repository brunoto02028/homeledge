// English Hub — Shared constants and data

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const CEFR_LEVELS: { level: CEFRLevel; name: string; description: string; color: string; iconBg: string; skills: string[]; ukRelevance: string; studyHours: string; examEquivalents: string[]; studyTips: string[] }[] = [
  { level: 'A1', name: 'Beginner', description: 'Can understand and use familiar everyday expressions and very basic phrases.', color: 'from-red-500 to-red-600', iconBg: 'from-red-500 to-rose-600', skills: ['Basic greetings', 'Simple questions', 'Numbers & dates', 'Introduce yourself'], ukRelevance: 'IELTS Life Skills A1 — Required for some family visas', studyHours: '80–100 hours', examEquivalents: ['IELTS Life Skills A1', 'Trinity GESE Grade 2', 'Cambridge Pre-A1 Starters'], studyTips: ['Learn the 100 most common English words', 'Practice introducing yourself every day', 'Use flashcard apps (Anki, Quizlet) for vocabulary', 'Watch children\'s TV shows in English with subtitles'] },
  { level: 'A2', name: 'Elementary', description: 'Can communicate in simple and routine tasks on familiar topics.', color: 'from-orange-500 to-orange-600', iconBg: 'from-orange-500 to-amber-600', skills: ['Shopping & ordering', 'Directions', 'Daily routines', 'Simple past events'], ukRelevance: 'Foundation for ESOL Entry Level 2', studyHours: '180–200 hours', examEquivalents: ['Cambridge A2 Key (KET)', 'Trinity GESE Grades 3–4', 'IELTS 3.0–3.5'], studyTips: ['Start reading simple graded readers (Oxford Bookworms Level 1)', 'Practice ordering food and shopping in English', 'Learn past tense of the 50 most common verbs', 'Listen to slow English podcasts (BBC Learning English)'] },
  { level: 'B1', name: 'Intermediate', description: 'Can deal with most situations likely to arise whilst travelling or living in the UK.', color: 'from-yellow-500 to-yellow-600', iconBg: 'from-amber-500 to-yellow-600', skills: ['Express opinions', 'Describe experiences', 'Write simple texts', 'Understand main points'], ukRelevance: '⭐ Required for ILR (Indefinite Leave to Remain) & British Citizenship', studyHours: '350–400 hours', examEquivalents: ['IELTS Life Skills B1', 'IELTS 4.0–5.0', 'Cambridge B1 Preliminary (PET)', 'Trinity GESE Grades 5–6', 'Trinity ISE I'], studyTips: ['This is the KEY level for UK settlement — focus here', 'Practice the Life in the UK Test alongside English study', 'Read BBC News Simple English articles daily', 'Start writing a daily diary in English (just 5 sentences)', 'Practice phone calls and GP appointments in English'] },
  { level: 'B2', name: 'Upper Intermediate', description: 'Can interact with a degree of fluency and spontaneity with native speakers.', color: 'from-green-500 to-green-600', iconBg: 'from-emerald-500 to-green-600', skills: ['Complex discussions', 'News & articles', 'Workplace English', 'Academic writing'], ukRelevance: 'IELTS 5.5-6.5 — Required for many UK university courses', studyHours: '500–600 hours', examEquivalents: ['IELTS 5.5–6.5', 'Cambridge B2 First (FCE)', 'Trinity GESE Grades 7–9', 'Trinity ISE II', 'PTE Academic 43–58'], studyTips: ['Read The Guardian and BBC News daily', 'Watch UK TV series without subtitles', 'Join English conversation groups (Meetup, library events)', 'Start writing formal emails for real situations', 'Practice IELTS Writing Task 2 essays weekly'] },
  { level: 'C1', name: 'Advanced', description: 'Can express ideas fluently and spontaneously. Can use language flexibly for social, academic and professional purposes.', color: 'from-blue-500 to-blue-600', iconBg: 'from-blue-500 to-indigo-600', skills: ['Professional presentations', 'Academic essays', 'Nuanced expression', 'Implicit meaning'], ukRelevance: 'IELTS 7.0+ — Required for postgraduate study & regulated professions', studyHours: '700–800 hours', examEquivalents: ['IELTS 7.0–8.0', 'Cambridge C1 Advanced (CAE)', 'Trinity GESE Grades 10–11', 'Trinity ISE III', 'PTE Academic 59–75'], studyTips: ['Read academic papers and professional publications', 'Practice giving presentations in English', 'Learn to use hedging language and formal register', 'Listen to podcasts on complex topics (politics, science, philosophy)', 'Write essays arguing both sides of controversial topics'] },
  { level: 'C2', name: 'Proficiency', description: 'Can understand with ease virtually everything heard or read. Near-native fluency.', color: 'from-purple-500 to-purple-600', iconBg: 'from-violet-500 to-purple-600', skills: ['Idiomatic expression', 'Cultural subtlety', 'Academic research', 'Professional mastery'], ukRelevance: 'IELTS 8.0-9.0 — Top-level academic and professional English', studyHours: '1000+ hours', examEquivalents: ['IELTS 8.5–9.0', 'Cambridge C2 Proficiency (CPE)', 'Trinity GESE Grade 12', 'Trinity ISE IV', 'PTE Academic 76–90'], studyTips: ['Immerse yourself completely — think in English', 'Read literature, poetry, and philosophy in English', 'Debate complex topics with native speakers', 'Write professionally — articles, reports, research', 'Master British humour, sarcasm, and cultural nuances'] },
];

export const QUICK_TOPICS = [
  { label: 'GP Appointment', prompt: 'Let\'s practice booking a GP appointment. You be the receptionist.', icon: '🏥' },
  { label: 'Job Interview', prompt: 'Let\'s practice a basic job interview in English. You be the interviewer.', icon: '💼' },
  { label: 'At the Shop', prompt: 'Let\'s practice buying groceries at a supermarket. You be the cashier.', icon: '🛒' },
  { label: 'Renting a Flat', prompt: 'Let\'s practice viewing a flat and asking the landlord questions.', icon: '🏠' },
  { label: 'School Meeting', prompt: 'Let\'s practice a parent-teacher meeting at my child\'s school.', icon: '🎒' },
  { label: 'Council Tax', prompt: 'Let\'s practice calling the council about my council tax bill.', icon: '📋' },
  { label: 'Bank Account', prompt: 'Let\'s practice opening a bank account as a newcomer to the UK.', icon: '🏦' },
  { label: 'At the Hospital', prompt: 'Let\'s practice going to A&E and explaining symptoms to a nurse.', icon: '🏨' },
  { label: 'Bus & Train', prompt: 'Let\'s practice buying a ticket and asking for directions on public transport.', icon: '🚌' },
  { label: 'Post Office', prompt: 'Let\'s practice sending a parcel and buying stamps at the Post Office.', icon: '📮' },
  { label: 'Grammar Help', prompt: 'I want to practice English grammar. Start with articles (a/an/the) — they confuse me.', icon: '📝' },
  { label: 'Pronunciation', prompt: 'Help me with English pronunciation. Give me 5 commonly mispronounced UK English words.', icon: '🗣️' },
  { label: 'Idioms & Slang', prompt: 'Teach me 5 British English idioms that I would hear in everyday life in the UK.', icon: '🇬🇧' },
  { label: 'Formal Writing', prompt: 'Help me write a formal email to my landlord about a repair that\'s needed.', icon: '✉️' },
  { label: 'Phone Call', prompt: 'Let\'s practice making a phone call in English. You call me about a delivery.', icon: '📞' },
  { label: 'Neighbours', prompt: 'Let\'s practice introducing myself to new neighbours and making small talk.', icon: '👋' },
];

export const UK_EXAMS = [
  { name: 'IELTS Life Skills', levels: 'A1 / B1', purpose: 'UK visa & immigration (family, ILR, citizenship)', cost: '£150-170', format: 'Speaking & Listening only, 16-22 mins', link: 'https://www.ielts.org/take-a-test/ielts-life-skills', tips: ['Practice speaking with a partner for 15 mins daily', 'Listen to BBC Radio 4 for natural British English', 'Focus on turn-taking in conversations', 'Learn to give opinions and agree/disagree politely'] },
  { name: 'IELTS Academic', levels: 'B1-C2', purpose: 'University admission, professional registration', cost: '£195-210', format: '4 sections: Listening, Reading, Writing, Speaking — 2h 45m', link: 'https://www.ielts.org', tips: ['Practice under timed conditions', 'Read academic articles daily (The Guardian, BBC)', 'Learn to paraphrase — never copy the question', 'Write essays with clear introduction, body, and conclusion'] },
  { name: 'IELTS General Training', levels: 'B1-C2', purpose: 'Work visa, migration, general English proof', cost: '£195-210', format: '4 sections: Listening, Reading, Writing, Speaking — 2h 45m', link: 'https://www.ielts.org', tips: ['Reading section has everyday English — practice with ads, instructions, notices', 'Writing Task 1 is a letter — practice formal, semi-formal, and informal', 'Speak for the full 2 minutes in Part 2', 'Use a range of vocabulary and grammar structures'] },
  { name: 'Trinity GESE', levels: 'A1-C2', purpose: 'UK visa (SELT approved), general English certification', cost: '£130-180', format: 'Face-to-face speaking exam, 5-25 mins by grade', link: 'https://www.trinitycollege.com/qualifications/SELT', tips: ['This is SPEAKING ONLY — no writing or reading', 'Prepare a topic to discuss at higher grades', 'Practice with the examiner conversation format', 'Focus on fluency over accuracy at lower grades'] },
  { name: 'Trinity ISE', levels: 'A2-C2', purpose: 'Academic English, professional development', cost: '£150-200', format: 'Reading, Writing, Speaking & Listening modules', link: 'https://www.trinitycollege.com/qualifications/english-language/ISE', tips: ['You can take modules separately', 'Reading into Writing requires good note-taking skills', 'Practice integrating information from multiple sources', 'Speaking includes a topic presentation and conversation'] },
  { name: 'PTE Academic', levels: 'B1-C2', purpose: 'University admission, UK visa applications', cost: '£170-190', format: 'Computer-based: Speaking, Writing, Reading, Listening — 2h', link: 'https://www.pearsonpte.com', tips: ['Entirely computer-based — practice typing speed', 'Speak clearly into the microphone', 'Read-aloud and repeat-sentence tasks need good pronunciation', 'Practice with the official PTE practice test online'] },
  { name: 'Cambridge B2 First (FCE)', levels: 'B2', purpose: 'Proof of upper-intermediate English for work and study', cost: '£165-190', format: 'Reading, Writing, Listening, Speaking — 3.5h', link: 'https://www.cambridgeenglish.org/exams-and-tests/first/', tips: ['Use of English section tests grammar knowledge', 'Practice word formation and key word transformations', 'Writing has 2 parts — essay + choice of email/review/report', 'Speaking is in pairs — practice with a partner'] },
  { name: 'Cambridge C1 Advanced (CAE)', levels: 'C1', purpose: 'High-level academic and professional English', cost: '£175-200', format: 'Reading, Writing, Listening, Speaking — 4h', link: 'https://www.cambridgeenglish.org/exams-and-tests/advanced/', tips: ['Advanced grammar is tested implicitly through Use of English', 'Write in an appropriate register (formal vs informal)', 'Practice gist listening and listening for detail', 'Use idiomatic English naturally in speaking'] },
  { name: 'Life in the UK Test', levels: 'N/A', purpose: 'Required for ILR and British Citizenship', cost: '£50', format: '24 multiple-choice questions in 45 minutes, pass mark 75% (18/24)', link: 'https://www.gov.uk/life-in-the-uk-test', tips: ['Read the official handbook cover to cover at least twice', 'Focus on dates, numbers, and specific facts', 'Practice with mock tests until you consistently score 90%+', 'Book your test at least 3 days in advance at a local centre'] },
];

export const ESOL_INFO = [
  { title: 'Free ESOL Courses', description: 'If you\'ve been in the UK for 3+ years (or have refugee/asylum status), you can access FREE ESOL courses at local colleges through the Adult Education Budget.', icon: 'PoundSterling' as const },
  { title: 'Local Colleges', description: 'Search for ESOL courses at your local FE (Further Education) college. Most offer Entry Level 1-3, Level 1 and Level 2 courses aligned to CEFR levels.', icon: 'School' as const },
  { title: 'British Council', description: 'Free online resources, grammar exercises, and listening practice at learnenglish.britishcouncil.org — excellent for all levels.', icon: 'Globe' as const },
  { title: 'Learn My Way', description: 'Free digital skills and English courses at local UK Online Centres. Find your nearest at learnmyway.com.', icon: 'MapPin' as const },
  { title: 'BBC Learning English', description: 'Free courses, videos, and podcasts for all levels at bbc.co.uk/learningenglish. Includes grammar, vocabulary, and pronunciation.', icon: 'Headphones' as const },
  { title: 'GOV.UK ESOL Funding', description: 'Check gov.uk for information on ESOL funding eligibility. Asylum seekers and refugees often qualify for fully-funded courses.', icon: 'FileText' as const },
  { title: 'Duolingo / Babbel', description: 'Mobile apps for daily practice. Duolingo is free; Babbel has UK-focused content. Use alongside formal study.', icon: 'Languages' as const },
  { title: 'English My Way', description: 'Free resources from the British Council for complete beginners, including activities you can do with a volunteer.', icon: 'BookOpen' as const },
];

export const VOCABULARY_SETS = [
  {
    id: 'daily-life',
    title: 'Daily Life in the UK',
    level: 'A1-A2',
    words: [
      { word: 'flat', meaning: 'An apartment', example: 'We rent a flat in Manchester.', audio: 'flat' },
      { word: 'queue', meaning: 'A line of people waiting', example: 'Please join the queue.', audio: 'queue' },
      { word: 'rubbish', meaning: 'Waste/garbage', example: 'Put the rubbish in the bin.', audio: 'rubbish' },
      { word: 'postcode', meaning: 'ZIP code equivalent', example: 'My postcode is NR1 3FG.', audio: 'postcode' },
      { word: 'chemist', meaning: 'Pharmacy/drugstore', example: 'I need to go to the chemist for medicine.', audio: 'chemist' },
      { word: 'lorry', meaning: 'A large truck', example: 'The lorry blocked the road.', audio: 'lorry' },
      { word: 'pavement', meaning: 'Sidewalk', example: 'Walk on the pavement, not the road.', audio: 'pavement' },
      { word: 'fortnight', meaning: 'Two weeks', example: 'I\'ll be back in a fortnight.', audio: 'fortnight' },
      { word: 'brilliant', meaning: 'Excellent/great (informal)', example: 'The weather is brilliant today!', audio: 'brilliant' },
      { word: 'cheeky', meaning: 'Playfully rude or bold', example: 'That was a cheeky comment!', audio: 'cheeky' },
      { word: 'lift', meaning: 'Elevator', example: 'Take the lift to the third floor.', audio: 'lift' },
      { word: 'boot', meaning: 'Car trunk', example: 'Put the bags in the boot.', audio: 'boot' },
    ],
  },
  {
    id: 'work-employment',
    title: 'Work & Employment',
    level: 'B1-B2',
    words: [
      { word: 'P45', meaning: 'Document given when you leave a job', example: 'Ask your employer for your P45.', audio: 'p45' },
      { word: 'P60', meaning: 'Annual tax summary from employer', example: 'Your P60 shows your total earnings for the tax year.', audio: 'p60' },
      { word: 'NI number', meaning: 'National Insurance number for tax/benefits', example: 'You need an NI number to work in the UK.', audio: 'ni-number' },
      { word: 'payslip', meaning: 'Monthly document showing salary and deductions', example: 'Check your payslip for the correct tax code.', audio: 'payslip' },
      { word: 'redundancy', meaning: 'Job loss because the position no longer exists', example: 'She was made redundant when the factory closed.', audio: 'redundancy' },
      { word: 'annual leave', meaning: 'Paid holiday entitlement', example: 'Full-time workers get 28 days annual leave.', audio: 'annual-leave' },
      { word: 'zero-hours contract', meaning: 'Work contract with no guaranteed hours', example: 'Many retail jobs are on zero-hours contracts.', audio: 'zero-hours' },
      { word: 'self-employed', meaning: 'Working for yourself, not an employer', example: 'If you\'re self-employed, you must file a Self Assessment tax return.', audio: 'self-employed' },
      { word: 'appraisal', meaning: 'A formal performance review at work', example: 'My annual appraisal is next month.', audio: 'appraisal' },
      { word: 'notice period', meaning: 'Time between resignation and leaving', example: 'I have a one-month notice period.', audio: 'notice-period' },
    ],
  },
  {
    id: 'health-nhs',
    title: 'Health & NHS',
    level: 'A2-B1',
    words: [
      { word: 'GP', meaning: 'General Practitioner — your local doctor', example: 'Book an appointment with your GP.', audio: 'gp' },
      { word: 'A&E', meaning: 'Accident & Emergency department', example: 'Go to A&E for serious injuries.', audio: 'a-and-e' },
      { word: 'prescription', meaning: 'Doctor\'s note for medicine', example: 'Take the prescription to the chemist.', audio: 'prescription' },
      { word: 'NHS 111', meaning: 'Non-emergency medical helpline', example: 'Call 111 if you need medical advice but it\'s not an emergency.', audio: 'nhs-111' },
      { word: 'surgery', meaning: 'Doctor\'s office (UK term)', example: 'The surgery opens at 8am.', audio: 'surgery' },
      { word: 'referral', meaning: 'When your GP sends you to a specialist', example: 'My GP gave me a referral to a dermatologist.', audio: 'referral' },
      { word: 'walk-in centre', meaning: 'NHS clinic without appointment', example: 'There\'s a walk-in centre on the high street.', audio: 'walk-in' },
      { word: 'sick note', meaning: 'Doctor\'s certificate for time off work', example: 'You need a sick note if you\'re off for more than 7 days.', audio: 'sick-note' },
    ],
  },
  {
    id: 'housing-property',
    title: 'Housing & Property',
    level: 'B1-B2',
    words: [
      { word: 'tenancy agreement', meaning: 'Rental contract', example: 'Read the tenancy agreement before signing.', audio: 'tenancy' },
      { word: 'deposit', meaning: 'Money paid upfront as security', example: 'The deposit is usually 5 weeks\' rent.', audio: 'deposit' },
      { word: 'council housing', meaning: 'Social housing provided by local council', example: 'Apply to the council housing waiting list.', audio: 'council-housing' },
      { word: 'letting agent', meaning: 'Estate agent for rentals', example: 'The letting agent arranged the viewing.', audio: 'letting-agent' },
      { word: 'stamp duty', meaning: 'Tax paid when buying a property', example: 'Stamp duty applies on properties over £250,000.', audio: 'stamp-duty' },
      { word: 'freehold', meaning: 'You own the property and land', example: 'This house is freehold.', audio: 'freehold' },
      { word: 'leasehold', meaning: 'You own the property for a set period but not the land', example: 'Most flats are leasehold.', audio: 'leasehold' },
      { word: 'EPC', meaning: 'Energy Performance Certificate — rates energy efficiency', example: 'Landlords must provide an EPC.', audio: 'epc' },
    ],
  },
  {
    id: 'british-culture',
    title: 'British Culture & Idioms',
    level: 'B2-C1',
    words: [
      { word: 'to take the mickey', meaning: 'To make fun of someone', example: 'Are you taking the mickey?', audio: 'take-the-mickey' },
      { word: 'to be chuffed', meaning: 'To be very pleased', example: 'I\'m well chuffed with my exam results!', audio: 'chuffed' },
      { word: 'to have a lie-in', meaning: 'To stay in bed late', example: 'I always have a lie-in on Sundays.', audio: 'lie-in' },
      { word: 'gobsmacked', meaning: 'Extremely surprised', example: 'I was gobsmacked when I heard the news.', audio: 'gobsmacked' },
      { word: 'knackered', meaning: 'Very tired (informal)', example: 'I\'m absolutely knackered after work.', audio: 'knackered' },
      { word: 'mate', meaning: 'Friend (informal)', example: 'Cheers, mate!', audio: 'mate' },
      { word: 'quid', meaning: 'Pound (informal)', example: 'That costs twenty quid.', audio: 'quid' },
      { word: 'gutted', meaning: 'Very disappointed', example: 'I was gutted when they cancelled the concert.', audio: 'gutted' },
      { word: 'to crack on', meaning: 'To continue/get started', example: 'Right, let\'s crack on with the meeting.', audio: 'crack-on' },
      { word: 'dodgy', meaning: 'Suspicious or unreliable', example: 'That email looks a bit dodgy.', audio: 'dodgy' },
    ],
  },
];

export const IELTS_WRITING_TEMPLATES = [
  {
    task: 'Task 2 — Opinion Essay',
    structure: [
      'Introduction: Paraphrase the question + state your opinion clearly',
      'Body 1: First main argument + example/evidence',
      'Body 2: Second main argument + example/evidence',
      'Body 3 (optional): Counter-argument + rebuttal',
      'Conclusion: Summarise your position (do NOT introduce new ideas)',
    ],
    usefulPhrases: [
      'In my opinion, / I firmly believe that...',
      'One significant advantage is...',
      'Furthermore, / Moreover, / In addition...',
      'On the other hand, some argue that...',
      'However, I would contend that...',
      'In conclusion, the evidence suggests that...',
      'To sum up, while there are valid arguments on both sides...',
    ],
    sampleTopic: 'Some people believe that all children should learn a foreign language from primary school. To what extent do you agree or disagree?',
  },
  {
    task: 'Task 1 General — Formal Letter',
    structure: [
      'Dear Sir/Madam, (if you don\'t know the name)',
      'Paragraph 1: Reason for writing',
      'Paragraph 2: Details/explanation',
      'Paragraph 3: Request/action needed',
      'Yours faithfully, (if "Dear Sir/Madam") / Yours sincerely, (if you used a name)',
    ],
    usefulPhrases: [
      'I am writing to complain about / inquire about / request...',
      'I would be grateful if you could...',
      'I look forward to hearing from you.',
      'Please do not hesitate to contact me if...',
      'I would appreciate a prompt response.',
      'Thank you for your attention to this matter.',
    ],
    sampleTopic: 'Write a letter to your landlord about a problem with your heating system. Describe the problem, explain how it affects you, and request action.',
  },
];

export const CONVERSATION_SCENARIOS = [
  { id: 'gp', title: 'Booking a GP Appointment', level: 'A2-B1', description: 'Practice calling a GP surgery to book an appointment, describe symptoms, and understand instructions.', aiRole: 'GP receptionist', userRole: 'patient' },
  { id: 'job-interview', title: 'Job Interview', level: 'B1-B2', description: 'Practice common interview questions, answering with the STAR method, and asking good questions.', aiRole: 'interviewer', userRole: 'candidate' },
  { id: 'council', title: 'Calling the Council', level: 'B1', description: 'Practice reporting an issue, asking about council tax, or requesting information about local services.', aiRole: 'council officer', userRole: 'resident' },
  { id: 'school', title: 'Parent-Teacher Meeting', level: 'B1-B2', description: 'Practice discussing your child\'s progress, behaviour, and asking about homework and support.', aiRole: 'teacher', userRole: 'parent' },
  { id: 'bank', title: 'Opening a Bank Account', level: 'A2-B1', description: 'Practice asking about account types, required documents, and understanding terms and conditions.', aiRole: 'bank advisor', userRole: 'new customer' },
  { id: 'landlord', title: 'Talking to Your Landlord', level: 'B1', description: 'Practice reporting repairs, negotiating rent, and understanding your tenancy rights.', aiRole: 'landlord', userRole: 'tenant' },
  { id: 'neighbours', title: 'Meeting New Neighbours', level: 'A2', description: 'Practice introductions, small talk about the area, and being friendly.', aiRole: 'neighbour', userRole: 'new resident' },
  { id: 'emergency', title: 'Calling 999', level: 'A2-B1', description: 'Practice giving essential information in an emergency: location, type of emergency, details.', aiRole: '999 operator', userRole: 'caller' },
  { id: 'restaurant', title: 'Ordering at a Restaurant', level: 'A2', description: 'Practice reading a menu, ordering food, asking about ingredients, and paying the bill.', aiRole: 'waiter/waitress', userRole: 'customer' },
  { id: 'shopping', title: 'Returning an Item', level: 'B1', description: 'Practice explaining a problem with a purchase and requesting a refund or exchange.', aiRole: 'shop assistant', userRole: 'customer' },
];

export const PHRASAL_VERBS = [
  { verb: 'look after', meaning: 'To take care of', example: 'Can you look after my cat while I\'m away?', level: 'A2' },
  { verb: 'get on with', meaning: 'To have a good relationship with', example: 'I get on well with my neighbours.', level: 'A2' },
  { verb: 'fill in', meaning: 'To complete a form or document', example: 'Please fill in this application form.', level: 'A2' },
  { verb: 'sort out', meaning: 'To organise or resolve', example: 'I need to sort out my council tax bill.', level: 'B1' },
  { verb: 'put up with', meaning: 'To tolerate something unpleasant', example: 'I can\'t put up with the noise any longer.', level: 'B1' },
  { verb: 'come across', meaning: 'To find by chance / to appear', example: 'She comes across as very confident.', level: 'B1' },
  { verb: 'carry on', meaning: 'To continue doing something', example: 'Carry on walking until you reach the roundabout.', level: 'A2' },
  { verb: 'turn up', meaning: 'To arrive / to appear', example: 'He turned up late for the interview.', level: 'B1' },
  { verb: 'break down', meaning: 'To stop working (machine) / to lose control of emotions', example: 'My car broke down on the motorway.', level: 'B1' },
  { verb: 'set up', meaning: 'To establish or start', example: 'She set up her own business last year.', level: 'B1' },
  { verb: 'take on', meaning: 'To accept responsibility / to hire', example: 'The company is taking on new staff.', level: 'B2' },
  { verb: 'bring up', meaning: 'To raise (children) / to mention a topic', example: 'She was brought up in London.', level: 'B1' },
  { verb: 'figure out', meaning: 'To understand or solve', example: 'I can\'t figure out how to use this app.', level: 'B1' },
  { verb: 'give up', meaning: 'To stop trying', example: 'Don\'t give up — keep practising your English!', level: 'A2' },
  { verb: 'pick up', meaning: 'To learn informally / to collect', example: 'I picked up some Spanish while living in Madrid.', level: 'B1' },
  { verb: 'run out of', meaning: 'To have no more of something', example: 'We\'ve run out of milk — can you pop to the shop?', level: 'B1' },
];

export const PRONUNCIATION_GUIDE = [
  { word: 'Leicester', phonetic: '/ˈlɛstər/', common_mistake: 'Lie-chester', correct: 'LESS-ter', tip: 'Many UK place names have silent letters! Worcester = WUSS-ter, Gloucester = GLOSS-ter.' },
  { word: 'schedule', phonetic: '/ˈʃɛdjuːl/', common_mistake: 'SKED-yool (US)', correct: 'SHED-yool (UK)', tip: 'UK English uses "sh" sound at the start, unlike American English.' },
  { word: 'aluminium', phonetic: '/ˌæljʊˈmɪniəm/', common_mistake: 'a-LOO-mi-num', correct: 'al-yoo-MIN-ee-um', tip: 'UK spelling has an extra "i" — aluminium (5 syllables) vs aluminum (4 syllables).' },
  { word: 'herb', phonetic: '/hɜːb/', common_mistake: 'erb (US — silent h)', correct: 'HERB (UK — h is pronounced)', tip: 'In British English, the "h" is always pronounced.' },
  { word: 'thought', phonetic: '/θɔːt/', common_mistake: 'tought / fought', correct: 'THAWT', tip: 'The "th" sound /θ/ doesn\'t exist in many languages. Place tongue between teeth and blow air.' },
  { word: 'comfortable', phonetic: '/ˈkʌmftəbl/', common_mistake: 'com-FOR-ta-ble (4 syllables)', correct: 'KUMF-tuh-bl (3 syllables)', tip: 'Native speakers drop the "or" — it\'s only 3 syllables in practice.' },
  { word: 'Wednesday', phonetic: '/ˈwɛnzdeɪ/', common_mistake: 'Wed-nes-day', correct: 'WENZ-day', tip: 'The "d" and first "e" are silent. Same pattern: February = FEB-yoo-ree.' },
  { word: 'receipt', phonetic: '/rɪˈsiːt/', common_mistake: 're-SEEP-t', correct: 'ri-SEET', tip: 'The "p" is silent. Like "debt" (silent b) and "doubt" (silent b).' },
  { word: 'queue', phonetic: '/kjuː/', common_mistake: 'kway-way', correct: 'KYOO', tip: 'Only the first letter is pronounced! The "ueue" is silent. Very British word!' },
  { word: 'clothes', phonetic: '/kləʊðz/', common_mistake: 'clo-THES (2 syllables)', correct: 'KLOHZ (1 syllable)', tip: 'In natural speech, it sounds almost like "close" with a "z" sound.' },
];

export const DAILY_CHALLENGES = [
  { type: 'translate', instruction: 'Translate to English:', prompt: 'Excuse me, where is the nearest bus stop?', hint: 'Practice asking for directions politely.' },
  { type: 'correct', instruction: 'Find and correct the mistake:', prompt: 'I have been living in UK for three years.', answer: 'I have been living in THE UK for three years.', hint: 'Articles are tricky! Countries with "Kingdom", "States", or "Republic" need "the".' },
  { type: 'fill', instruction: 'Fill in the blank:', prompt: 'Could you ___ (repeat/tell) that again, please?', answer: 'repeat', hint: 'Polite way to ask someone to say something again.' },
  { type: 'correct', instruction: 'Find and correct the mistake:', prompt: 'She don\'t like coffee.', answer: 'She doesn\'t like coffee.', hint: 'Third person singular (he/she/it) uses "doesn\'t" not "don\'t".' },
  { type: 'idiom', instruction: 'What does this British expression mean?', prompt: '"It\'s not my cup of tea"', answer: 'It means "I don\'t really like it" — a very British way to politely say no!', hint: 'The British love tea references in their idioms.' },
  { type: 'correct', instruction: 'Find and correct the mistake:', prompt: 'I am agree with you.', answer: 'I agree with you.', hint: '"Agree" is already a verb — you don\'t need "am" before it.' },
  { type: 'fill', instruction: 'Fill in the blank:', prompt: 'I ___ (look/am looking) forward to hearing from you.', answer: 'look', hint: 'This is a fixed phrase used in formal emails. Always: "I look forward to..."' },
];

export const LIFE_IN_UK_FACTS = [
  { q: 'How many questions are in the Life in the UK Test?', a: '24 questions', detail: 'You need 18 correct (75%) to pass. Questions are multiple choice.' },
  { q: 'How much does the test cost?', a: '£50', detail: 'You can retake it as many times as needed, but pay each time. Book at gov.uk/life-in-the-uk-test.' },
  { q: 'How long do you have?', a: '45 minutes', detail: 'Most people finish in 15-20 minutes. Don\'t rush — you have plenty of time.' },
  { q: 'Where do you take the test?', a: 'Approved test centres across the UK', detail: 'Book at gov.uk/life-in-the-uk-test. Bring your BRP or valid passport + appointment confirmation.' },
  { q: 'What topics does it cover?', a: 'UK values, history, traditions, government and everyday life', detail: '5 chapters covering values, geography, history, modern society, and government/law.' },
  { q: 'Do I need it for ILR?', a: 'Yes — both ILR and British Citizenship require passing this test', detail: 'Exemptions: under 18, over 65, and certain medical conditions (need medical evidence).' },
  { q: 'What is the official study book?', a: '"Life in the United Kingdom: A Guide for New Residents" (3rd Edition)', detail: 'Published by TSO (The Stationery Office). Available on Amazon and bookshops. All questions are based on this book.' },
  { q: 'Can I take the test in a language other than English?', a: 'No — the test is only available in English', detail: 'This is also part of proving your English language ability alongside the B1 requirement.' },
  { q: 'What happens if I fail?', a: 'You can rebook and retake after 7 days', detail: 'There is no limit on the number of attempts, but you pay £50 each time.' },
  { q: 'Is the test on a computer?', a: 'Yes — it is computer-based at the test centre', detail: 'You select answers by clicking. Results are given immediately after completion.' },
];
