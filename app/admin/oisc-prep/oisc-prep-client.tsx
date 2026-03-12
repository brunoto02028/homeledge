'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, GraduationCap, ClipboardList, CheckCircle2, XCircle,
  ChevronRight, ChevronLeft, RotateCcw, Trophy, Target, Clock,
  AlertCircle, Lightbulb, BookMarked, ArrowLeft, Timer, Flag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  topic: string;
  question: string;
  options: string[];
  correct: number; // 0-indexed
  explanation: string;
  reference?: string;
}

interface StudyTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  keyPoints: string[];
  questions: Question[];
}

// ─── OISC Level 1 Question Bank ───────────────────────────────────────────────
const QUESTION_BANK: Question[] = [
  // OISC Regulation
  {
    id: 1, topic: 'oisc-regulation',
    question: 'Which legislation makes it a criminal offence to provide immigration advice without authorisation?',
    options: [
      'Immigration Act 1971',
      'Immigration and Asylum Act 1999',
      'Nationality, Immigration and Asylum Act 2002',
      'Immigration Rules HC 395',
    ],
    correct: 1,
    explanation: 'The Immigration and Asylum Act 1999 Part V created the OISC and made it a criminal offence to provide immigration advice or services without being authorised.',
    reference: 'Immigration and Asylum Act 1999, s.84',
  },
  {
    id: 2, topic: 'oisc-regulation',
    question: 'What is the maximum penalty for providing immigration advice without authorisation?',
    options: ['6 months imprisonment or unlimited fine', '1 year imprisonment or unlimited fine', '2 years imprisonment or unlimited fine', '5 years imprisonment or unlimited fine'],
    correct: 2,
    explanation: 'Under s.91 of the Immigration and Asylum Act 1999, the maximum penalty is 2 years imprisonment or an unlimited fine (or both).',
    reference: 'Immigration and Asylum Act 1999, s.91',
  },
  {
    id: 3, topic: 'oisc-regulation',
    question: 'How many levels of OISC accreditation are there?',
    options: ['2', '3', '4', '5'],
    correct: 1,
    explanation: 'There are 3 levels of OISC accreditation. Level 1 covers straightforward applications, Level 2 covers more complex cases, and Level 3 covers the most complex cases including asylum and appeals.',
  },
  {
    id: 4, topic: 'oisc-regulation',
    question: 'Which of the following is EXEMPT from needing OISC registration to give immigration advice?',
    options: ['A community worker who charges for immigration help', 'A qualified solicitor regulated by the SRA', 'A charity that provides paid immigration services', 'A retired Home Office official advising friends commercially'],
    correct: 1,
    explanation: 'Solicitors regulated by the SRA (Solicitors Regulation Authority) are exempt from OISC registration as they are regulated by their own professional body.',
  },
  {
    id: 5, topic: 'oisc-regulation',
    question: 'An OISC Level 1 adviser can assist with which type of case?',
    options: ['Complex asylum claims', 'Appeal hearings before the Upper Tribunal', 'Straightforward leave to remain applications', 'Judicial review proceedings'],
    correct: 2,
    explanation: 'OISC Level 1 covers straightforward immigration applications such as extensions of leave, naturalisation, and entry clearance where the facts are not complex.',
  },
  // Leave & Visas
  {
    id: 6, topic: 'leave-visas',
    question: 'What is "Leave to Remain"?',
    options: [
      'Permission to enter the UK at the border',
      'Permission granted by the Home Office to stay in the UK for a period',
      'The right of abode in the UK',
      'A document issued at a British Embassy abroad',
    ],
    correct: 1,
    explanation: 'Leave to Remain (LTR) is permission granted by the Home Office (via UKVI) for a person already in the UK to remain for a specified period or indefinitely.',
  },
  {
    id: 7, topic: 'leave-visas',
    question: 'What does "ILR" stand for?',
    options: ['Indefinite Leave to Remain', 'Initial Leave Request', 'Immigration Leave Review', 'Indefinite Legal Residence'],
    correct: 0,
    explanation: 'ILR stands for Indefinite Leave to Remain. It grants permission to live and work in the UK without any time restriction and is a step towards British citizenship.',
  },
  {
    id: 8, topic: 'leave-visas',
    question: 'How long does a Standard Visitor Visa normally last?',
    options: ['3 months', '6 months', '12 months', '2 years'],
    correct: 1,
    explanation: 'A Standard Visitor Visa is typically granted for up to 6 months per visit. The visa itself may be valid for multiple entries over 2, 5 or 10 years, but each stay is limited to 6 months.',
  },
  {
    id: 9, topic: 'leave-visas',
    question: 'What is "Section 3C leave"?',
    options: [
      'Leave granted automatically to all EU citizens',
      'Automatic extension of leave while a valid in-time application is pending',
      'A form of emergency humanitarian leave',
      'Leave granted after a successful appeal',
    ],
    correct: 1,
    explanation: 'Section 3C of the Immigration Act 1971 provides that a person\'s leave is automatically extended while they have an in-time application pending and any subsequent appeal.',
    reference: 'Immigration Act 1971, s.3C',
  },
  {
    id: 10, topic: 'leave-visas',
    question: 'What is the current fee for applying for ILR (SET(O) route) from inside the UK?',
    options: ['£1,033', '£2,389', '£2,885', '£3,250'],
    correct: 1,
    explanation: 'As of 2024, the ILR application fee is £2,389. Fees change regularly so always check the UKVI fee schedule before advising clients.',
  },
  // Naturalisation / Citizenship
  {
    id: 11, topic: 'citizenship',
    question: 'Which form is used to apply for naturalisation as a British citizen?',
    options: ['SET(O)', 'MN1', 'AN', 'BN(O)'],
    correct: 2,
    explanation: 'Form AN is the application form for naturalisation as a British citizen for adults. MN1 is for children.',
    reference: 'British Nationality Act 1981',
  },
  {
    id: 12, topic: 'citizenship',
    question: 'How long must a person normally hold ILR before applying for naturalisation?',
    options: ['6 months', '1 year', '2 years', '5 years'],
    correct: 1,
    explanation: 'An applicant must normally have held ILR (or another qualifying status) for at least 1 year before applying for naturalisation. The spouse/civil partner of a British citizen may apply immediately upon obtaining ILR.',
    reference: 'British Nationality Act 1981, Schedule 1',
  },
  {
    id: 13, topic: 'citizenship',
    question: 'What is the standard residential requirement for naturalisation (not as spouse of British citizen)?',
    options: ['3 years lawful residence', '5 years lawful residence', '6 years lawful residence', '10 years lawful residence'],
    correct: 1,
    explanation: 'The standard requirement is 5 years of lawful residence in the UK immediately before the application date, with no more than 450 days absent in those 5 years.',
    reference: 'British Nationality Act 1981, Schedule 1, para 1',
  },
  {
    id: 14, topic: 'citizenship',
    question: 'What is the maximum number of days a naturalisation applicant can be absent from the UK in the qualifying 5-year period?',
    options: ['270 days', '365 days', '450 days', '540 days'],
    correct: 2,
    explanation: 'No more than 450 days absence in total over the 5-year period, and no more than 90 days in the final 12 months before the application.',
    reference: 'British Nationality Act 1981, Schedule 1',
  },
  {
    id: 15, topic: 'citizenship',
    question: 'What does "Life in the UK" test requirement apply to?',
    options: [
      'All visa applications',
      'ILR applications and naturalisation applications',
      'Only citizenship applications',
      'EU Settlement Scheme applications',
    ],
    correct: 1,
    explanation: 'The Life in the UK test is required for most ILR applications and for naturalisation applications. Certain exemptions apply (e.g. age under 18, over 65, or long-term physical/mental condition).',
  },
  // Family Immigration
  {
    id: 16, topic: 'family',
    question: 'What is the minimum income threshold for a British citizen to sponsor a non-EEA spouse under Appendix FM?',
    options: ['£16,000', '£18,600', '£22,400', '£25,000'],
    correct: 1,
    explanation: 'The minimum income requirement under Appendix FM is £18,600 per year (increasing to £29,000 from April 2024 for new applications). Always check current thresholds as they are subject to change.',
    reference: 'Immigration Rules, Appendix FM',
  },
  {
    id: 17, topic: 'family',
    question: 'A child born in the UK on or after 1 January 1983 is automatically a British citizen if:',
    options: [
      'Both parents are resident in the UK',
      'At least one parent is a British citizen or settled in the UK at the time of birth',
      'The child is registered within 3 months of birth',
      'The child\'s mother is a British citizen',
    ],
    correct: 1,
    explanation: 'Under the British Nationality Act 1981, a child born in the UK acquires British citizenship by birth if at least one parent is a British citizen or is settled (has ILR) in the UK at the time of birth.',
    reference: 'British Nationality Act 1981, s.1(1)',
  },
  {
    id: 18, topic: 'family',
    question: 'What is the initial period of leave granted to a spouse of a British citizen under Appendix FM?',
    options: ['12 months', '24 months', '30 months', '36 months'],
    correct: 2,
    explanation: 'A spouse or partner is initially granted 30 months (2.5 years) leave to remain. After completing 5 years in the UK on this route, they can apply for ILR.',
    reference: 'Immigration Rules, Appendix FM',
  },
  // Work & Points-Based System
  {
    id: 19, topic: 'work',
    question: 'Which route replaced the old Tier 2 (General) work visa?',
    options: ['Global Talent visa', 'Skilled Worker visa', 'High Potential Individual visa', 'Scale-up visa'],
    correct: 1,
    explanation: 'The Skilled Worker visa replaced the Tier 2 (General) visa from 1 December 2020 following the end of free movement.',
  },
  {
    id: 20, topic: 'work',
    question: 'What is a "Certificate of Sponsorship" (CoS)?',
    options: [
      'A letter from HMRC confirming employment',
      'A reference number assigned by a licensed sponsor to a worker for a specific job',
      'A document proving English language ability',
      'A Home Office work permit',
    ],
    correct: 1,
    explanation: 'A Certificate of Sponsorship (CoS) is an electronic record created by a licensed employer (sponsor) and assigned to a worker. It is not a physical document.',
  },
  {
    id: 21, topic: 'work',
    question: 'What is the minimum salary threshold for a Skilled Worker visa (general threshold from April 2024)?',
    options: ['£20,480', '£26,200', '£38,700', '£45,000'],
    correct: 2,
    explanation: 'From April 2024, the general minimum salary threshold for the Skilled Worker route increased to £38,700 per year (or the going rate for the occupation if higher). This was a significant increase from the previous £26,200.',
  },
  // Right to Work
  {
    id: 22, topic: 'right-to-work',
    question: 'An employer must carry out a right to work check:',
    options: [
      'Within 28 days of the employee starting work',
      'Before the employment begins',
      'Within 7 days of the employee starting work',
      'At annual review',
    ],
    correct: 1,
    explanation: 'Right to work checks must be carried out BEFORE employment begins. Checks after starting work do not provide the statutory excuse against a civil penalty.',
    reference: 'Immigration, Asylum and Nationality Act 2006, s.15',
  },
  {
    id: 23, topic: 'right-to-work',
    question: 'What is the maximum civil penalty for employing an illegal worker (as at 2024)?',
    options: ['£15,000 per worker', '£20,000 per worker', '£45,000 per worker (first offence)', '£60,000 per worker (repeat offence)'],
    correct: 3,
    explanation: 'From January 2024, the civil penalty increased to up to £45,000 per illegal worker for a first breach, and up to £60,000 per worker for repeat breaches.',
  },
  // EU Settlement Scheme
  {
    id: 24, topic: 'eu-settled',
    question: 'What is the difference between "Settled Status" and "Pre-Settled Status" under the EU Settlement Scheme?',
    options: [
      'No practical difference — both give indefinite right to live in UK',
      'Settled Status = ILR equivalent (5+ years residence); Pre-Settled Status = limited leave (under 5 years)',
      'Pre-Settled Status is for EU citizens only; Settled Status for EEA',
      'Settled Status requires English language test; Pre-Settled does not',
    ],
    correct: 1,
    explanation: 'Settled Status is equivalent to ILR and is granted to EU/EEA/Swiss citizens with 5+ continuous years of residence. Pre-Settled Status gives 5 years limited leave and is for those with under 5 years residence.',
  },
  {
    id: 25, topic: 'eu-settled',
    question: 'What was the deadline for applying to the EU Settlement Scheme for EU citizens already in the UK before 31 December 2020?',
    options: ['30 June 2021', '31 December 2021', '30 June 2022', '31 December 2022'],
    correct: 0,
    explanation: 'The deadline to apply to the EU Settlement Scheme was 30 June 2021 for EU/EEA/Swiss citizens who were resident in the UK by 31 December 2020.',
  },
  // Asylum
  {
    id: 26, topic: 'asylum',
    question: 'Under the 1951 Refugee Convention, a refugee is someone who has a well-founded fear of persecution based on which grounds?',
    options: [
      'Race, religion, nationality, political opinion, or membership of a particular social group',
      'Race, religion, gender, sexuality, or poverty',
      'War, famine, natural disaster, or political unrest',
      'Any serious human rights violation',
    ],
    correct: 0,
    explanation: 'The 1951 Refugee Convention defines a refugee as someone with a well-founded fear of persecution based on race, religion, nationality, political opinion, or membership of a particular social group.',
    reference: '1951 Refugee Convention, Article 1A(2)',
  },
  {
    id: 27, topic: 'asylum',
    question: 'OISC Level 1 advisers can assist with asylum claims.',
    options: ['True', 'False — asylum is Level 2 only', 'False — asylum is Level 3 only', 'True, but only for initial claims'],
    correct: 2,
    explanation: 'Asylum work is restricted to OISC Level 3 (or Level 2 for some specific aspects). A Level 1 adviser cannot handle asylum claims.',
  },
  // Appeals & Enforcement
  {
    id: 28, topic: 'appeals',
    question: 'Where are most immigration appeals heard at first instance?',
    options: ['High Court', 'First-tier Tribunal (Immigration and Asylum Chamber)', 'Upper Tribunal', 'Court of Appeal'],
    correct: 1,
    explanation: 'Most immigration appeals are heard by the First-tier Tribunal (Immigration and Asylum Chamber) — FtT(IAC). Appeals on a point of law go to the Upper Tribunal.',
  },
  {
    id: 29, topic: 'appeals',
    question: 'What is the time limit to appeal a refusal of leave to remain (in-country right of appeal)?',
    options: ['5 working days', '14 calendar days', '28 calendar days', '3 months'],
    correct: 1,
    explanation: 'For most in-country refusals with a right of appeal, the time limit is 14 calendar days from receiving the refusal notice.',
  },
  // Client Care & Ethics
  {
    id: 30, topic: 'ethics',
    question: 'Under the OISC Code of Standards, what must an adviser give a client before starting work?',
    options: [
      'A verbal quote only',
      'Written client care information including fees, complaints procedure, and scope of work',
      'A signed disclaimer form',
      'Evidence of their OISC registration only',
    ],
    correct: 1,
    explanation: 'The OISC Code of Standards requires advisers to provide clients with written client care information before commencing work, including: fees, scope of work, complaints procedure, and OISC registration details.',
    reference: 'OISC Code of Standards',
  },
  {
    id: 31, topic: 'ethics',
    question: 'An OISC adviser must keep client records for a minimum of:',
    options: ['1 year', '3 years', '6 years', '10 years'],
    correct: 2,
    explanation: 'The OISC Code of Standards requires advisers to keep client files and records for at least 6 years after the matter has concluded.',
    reference: 'OISC Code of Standards',
  },
  {
    id: 32, topic: 'ethics',
    question: 'A client complains about your service. As an OISC registered adviser, what must you have in place?',
    options: [
      'A verbal complaints policy',
      'A written complaints procedure and the ability to refer clients to the OISC',
      'Professional indemnity insurance only',
      'A qualified supervisor who handles all complaints',
    ],
    correct: 1,
    explanation: 'All OISC registered advisers must have a written complaints procedure and must inform clients of their right to complain to the OISC if unsatisfied with the internal complaints process.',
    reference: 'OISC Code of Standards',
  },
  // Points-Based System
  {
    id: 33, topic: 'work',
    question: 'Under the Student visa (formerly Tier 4), how many hours per week can a student normally work during term time?',
    options: ['10 hours', '15 hours', '20 hours', '30 hours'],
    correct: 2,
    explanation: 'Students on a Student visa can work up to 20 hours per week during term time. They can work full-time during official vacation periods.',
  },
  {
    id: 34, topic: 'work',
    question: 'What is the "Global Talent" visa designed for?',
    options: [
      'All skilled workers from outside the UK',
      'Leaders or potential leaders in academia, research, arts, culture, or digital technology',
      'Entrepreneurs investing £2 million or more',
      'Graduates from top global universities',
    ],
    correct: 1,
    explanation: 'The Global Talent visa is for recognised leaders or those with exceptional promise in academia/research, arts & culture, or digital technology. It requires endorsement from a designated body.',
  },
  // Overstaying & Illegal Entry
  {
    id: 35, topic: 'enforcement',
    question: 'A person who remains in the UK beyond their leave expiry without making an in-time application is:',
    options: ['Lawfully present under Section 3C leave', 'An overstayer and has no lawful immigration status', 'Automatically granted a 28-day grace period', 'Subject to automatic removal only if they have a criminal record'],
    correct: 1,
    explanation: 'A person who overstays their leave without making an in-time application becomes an overstayer with no lawful status. This can affect future visa applications, potentially triggering bans of 1 or 10 years.',
  },
  // Biometric Residence Permits
  {
    id: 36, topic: 'leave-visas',
    question: 'What is a Biometric Residence Permit (BRP)?',
    options: [
      'A passport issued to settled persons',
      'A card issued to non-EEA nationals with more than 6 months leave, confirming their immigration status',
      'A document replacing the need for a visa',
      'Proof of right to work for EU citizens',
    ],
    correct: 1,
    explanation: 'A BRP is a card issued to non-EEA nationals granted more than 6 months leave. It contains biometric information and confirms the holder\'s name, date of birth, immigration status, and any conditions of leave.',
  },
  // English Language
  {
    id: 37, topic: 'citizenship',
    question: 'Which English language test is approved for naturalisation applications?',
    options: ['Only IELTS', 'Only TOEFL', 'Any Secure English Language Test (SELT) approved by the Home Office', 'A degree from a UK university suffices automatically'],
    correct: 2,
    explanation: 'Applicants must demonstrate English language ability through a Secure English Language Test (SELT) approved by the Home Office, or by holding a degree taught in English, or being a national of a majority English-speaking country.',
  },
  // Data Protection
  {
    id: 38, topic: 'ethics',
    question: 'Under UK GDPR, an OISC adviser who holds client personal data must:',
    options: [
      'Register with the ICO and handle data lawfully, fairly and transparently',
      'Only store data in paper format for security',
      'Share all data with the Home Office on request without client consent',
      'Delete all client data immediately after a case concludes',
    ],
    correct: 0,
    explanation: 'Under UK GDPR (retained after Brexit), advisers must comply with data protection principles including lawfulness, fairness, transparency, and purpose limitation. Most organisations processing personal data must register with the ICO.',
  },
  // Immigration Rules Structure
  {
    id: 39, topic: 'leave-visas',
    question: 'The Immigration Rules are contained in:',
    options: ['The Immigration Act 1971', 'HC 395 and subsequent Statement of Changes', 'The Nationality, Immigration and Asylum Act 2002', 'The UK Borders Act 2007'],
    correct: 1,
    explanation: 'The Immigration Rules are contained in HC 395 (House of Commons Paper 395), as amended by subsequent Statements of Changes. They are not an Act of Parliament but are laid before Parliament.',
    reference: 'Immigration Rules HC 395',
  },
  {
    id: 40, topic: 'leave-visas',
    question: 'What does "No Recourse to Public Funds" (NRPF) condition mean?',
    options: [
      'The person cannot open a bank account',
      'The person cannot claim most welfare benefits, tax credits, or housing assistance',
      'The person must pay for NHS treatment',
      'The person cannot be employed in the public sector',
    ],
    correct: 1,
    explanation: 'NRPF means the person is prohibited from claiming most public funds including Universal Credit, Housing Benefit, Child Benefit, and Council Tax support. It is a condition attached to most limited leave to remain.',
    reference: 'Immigration Rules, Part 1',
  },
];

// ─── Study Topics ──────────────────────────────────────────────────────────────
const STUDY_TOPICS: StudyTopic[] = [
  {
    id: 'oisc-regulation',
    title: 'OISC Regulation & Registration',
    icon: '⚖️',
    description: 'The legal framework governing immigration advisers and OISC registration levels.',
    keyPoints: [
      'Immigration and Asylum Act 1999 Part V created the OISC',
      'Unauthorised advice = criminal offence — up to 2 years imprisonment',
      '3 levels of registration: L1 (straightforward), L2 (complex), L3 (asylum/appeals)',
      'Exempt: Solicitors (SRA), Barristers (BSB), CILEx members, CILEX practitioners',
      'OISC Code of Standards governs adviser conduct',
      'Advisers must have written client care info, complaints procedure, PII insurance',
    ],
    questions: QUESTION_BANK.filter(q => q.topic === 'oisc-regulation'),
  },
  {
    id: 'leave-visas',
    title: 'Leave to Enter, Remain & Visas',
    icon: '🛂',
    description: 'Types of leave, visa categories, conditions and the Immigration Rules.',
    keyPoints: [
      'Leave to Enter (LTE) — granted at the border or via entry clearance',
      'Leave to Remain (LTR) — granted by UKVI from inside the UK',
      'ILR (Indefinite Leave to Remain) — no time limit, settled status',
      'Section 3C leave — automatic extension while in-time application pending',
      'BRP issued to non-EEA nationals with 6+ months leave',
      'NRPF (No Recourse to Public Funds) — most limited leave carries this condition',
      'Immigration Rules = HC 395 + Statements of Changes (not primary legislation)',
    ],
    questions: QUESTION_BANK.filter(q => q.topic === 'leave-visas'),
  },
  {
    id: 'citizenship',
    title: 'British Citizenship & Naturalisation',
    icon: '🇬🇧',
    description: 'Routes to British citizenship, naturalisation requirements and registration.',
    keyPoints: [
      'British Nationality Act 1981 is the primary legislation',
      'Naturalisation form = AN (adults), MN1 (children)',
      'Standard residential requirement: 5 years lawful residence',
      'Max absences: 450 days in 5 years, 90 days in final year',
      'Must hold ILR for 1 year before applying (except spouse of British citizen)',
      'Requirements: good character, English language (SELT or equivalent), Life in the UK test',
      'Life in the UK test: 24 questions, 45 minutes, must score 75% (18/24)',
    ],
    questions: QUESTION_BANK.filter(q => q.topic === 'citizenship'),
  },
  {
    id: 'family',
    title: 'Family Immigration (Appendix FM)',
    icon: '👨‍👩‍👧',
    description: 'Spouse/partner visas, children, and family reunification routes.',
    keyPoints: [
      'Appendix FM governs family immigration for non-EEA nationals',
      'Sponsor must be British citizen or settled person',
      'Minimum income: £18,600 (rising to £29,000 from April 2024)',
      'Initial leave granted: 30 months (2.5 years), then further 30 months → ILR at 5 years',
      'Relationship: genuine and subsisting, intend to live together',
      'Child born in UK = British citizen if one parent is BC or settled',
      'British Nationality Act 1981 s.1(1) — citizenship by birth',
    ],
    questions: QUESTION_BANK.filter(q => q.topic === 'family'),
  },
  {
    id: 'work',
    title: 'Work Immigration & Points-Based System',
    icon: '💼',
    description: 'Skilled Worker, Student visa, Global Talent and other work routes.',
    keyPoints: [
      'Points-Based System (PBS) introduced 2008, reformed December 2020',
      'Skilled Worker replaced Tier 2 (General) from 1 Dec 2020',
      'Certificate of Sponsorship (CoS) = electronic record from licensed sponsor',
      'Skilled Worker minimum salary: £38,700 (from April 2024)',
      'Student visa: 20 hrs/week during term, full-time in official vacations',
      'Global Talent: for leaders in academia, research, arts, digital tech',
      'Sponsor must hold a Sponsor Licence from the Home Office',
    ],
    questions: QUESTION_BANK.filter(q => q.topic === 'work'),
  },
  {
    id: 'eu-settled',
    title: 'EU Settlement Scheme (EUSS)',
    icon: '🇪🇺',
    description: 'Rights of EU/EEA/Swiss citizens post-Brexit under the Withdrawal Agreement.',
    keyPoints: [
      'EUSS created under EU (Withdrawal Agreement) Act 2020',
      'Deadline to apply: 30 June 2021 (for those resident by 31 Dec 2020)',
      'Settled Status = 5+ years continuous residence → ILR equivalent',
      'Pre-Settled Status = under 5 years → 5 years limited leave',
      'No physical card — status held digitally (share code system)',
      'Late applications still accepted with "reasonable grounds"',
      'Family members of EU citizens may also apply',
    ],
    questions: QUESTION_BANK.filter(q => q.topic === 'eu-settled'),
  },
  {
    id: 'ethics',
    title: 'Client Care, Ethics & GDPR',
    icon: '🤝',
    description: 'OISC Code of Standards, professional conduct and data protection obligations.',
    keyPoints: [
      'Must provide written client care info BEFORE starting work',
      'Client care letter: fees, scope, complaints procedure, OISC registration',
      'Written complaints procedure required — clients can escalate to OISC',
      'Keep client files for minimum 6 years after matter concludes',
      'UK GDPR applies — must process data lawfully, fairly, transparently',
      'Register with ICO if processing personal data',
      'Professional Indemnity Insurance (PII) required',
      'Cannot mislead clients or the Home Office',
    ],
    questions: QUESTION_BANK.filter(q => q.topic === 'ethics'),
  },
  {
    id: 'appeals',
    title: 'Appeals & Enforcement',
    icon: '🏛️',
    description: 'Immigration tribunal system, appeal rights and enforcement powers.',
    keyPoints: [
      'First-tier Tribunal IAC (FtT) hears most immigration appeals',
      'Upper Tribunal IAC hears appeals on points of law from FtT',
      'Court of Appeal — further appeal from Upper Tribunal',
      'In-country appeal time limit: usually 14 calendar days',
      'Out-of-country appeal time limit: 28 days',
      'Not all decisions carry a right of appeal',
      'Administrative Review available for some decisions without appeal rights',
      'Level 1 advisers CANNOT represent clients in tribunal hearings',
    ],
    questions: QUESTION_BANK.filter(q => q.topic === 'appeals'),
  },
];

type ViewMode = 'home' | 'study' | 'topic' | 'exam' | 'results';

export function OISCPrepClient() {
  const [view, setView] = useState<ViewMode>('home');
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [topicProgress, setTopicProgress] = useState<Record<string, number>>({});

  // Timer
  useEffect(() => {
    if (view !== 'exam' || !examStartTime) return;
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - examStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [view, examStartTime]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startExam = useCallback((questions: Question[], topicId?: string) => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(20, questions.length));
    setExamQuestions(shuffled);
    setCurrentQ(0);
    setAnswers({});
    setShowExplanation(false);
    setExamStartTime(new Date());
    setTimeElapsed(0);
    setView('exam');
  }, []);

  const startFullExam = useCallback(() => {
    startExam(QUESTION_BANK);
  }, [startExam]);

  const startTopicExam = useCallback((topic: StudyTopic) => {
    startExam(topic.questions);
  }, [startExam]);

  const selectAnswer = (optionIndex: number) => {
    if (answers[currentQ] !== undefined) return;
    setAnswers(prev => ({ ...prev, [currentQ]: optionIndex }));
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (currentQ < examQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      // Calculate score and save progress
      const score = examQuestions.filter((q, i) => answers[i] === q.correct).length;
      const pct = Math.round((score / examQuestions.length) * 100);
      if (selectedTopic) {
        setTopicProgress(prev => ({ ...prev, [selectedTopic.id]: pct }));
      }
      setView('results');
    }
  };

  const getScore = () => {
    const correct = examQuestions.filter((q, i) => answers[i] === q.correct).length;
    return { correct, total: examQuestions.length, pct: Math.round((correct / examQuestions.length) * 100) };
  };

  const topicQuestionCount = (topicId: string) => QUESTION_BANK.filter(q => q.topic === topicId).length;

  // ─── HOME ──────────────────────────────────────────────────────────────────
  if (view === 'home') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="text-3xl font-bold">OISC Level 1 Exam Preparation</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Prepare for the Immigration Adviser Authority (IAA/OISC) Level 1 accreditation exam.
            Study by topic or simulate the full exam with timed multiple-choice questions.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <Badge variant="outline" className="text-sm py-1 px-3"><BookOpen className="h-3.5 w-3.5 mr-1.5" />{QUESTION_BANK.length} Questions</Badge>
            <Badge variant="outline" className="text-sm py-1 px-3"><ClipboardList className="h-3.5 w-3.5 mr-1.5" />{STUDY_TOPICS.length} Topics</Badge>
            <Badge variant="outline" className="text-sm py-1 px-3"><Clock className="h-3.5 w-3.5 mr-1.5" />2h 30min Exam</Badge>
            <Badge className="text-sm py-1 px-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Pass Mark: 75%</Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={startFullExam}>
            <CardContent className="pt-6 text-center space-y-3">
              <GraduationCap className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-xl font-bold">Simulate Full Exam</h2>
              <p className="text-sm text-muted-foreground">20 random questions across all topics — timed like the real exam</p>
              <Button className="w-full" size="lg">
                <Timer className="h-4 w-4 mr-2" /> Start Exam Simulation
              </Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setView('study')}>
            <CardContent className="pt-6 text-center space-y-3">
              <BookMarked className="h-12 w-12 mx-auto text-blue-500" />
              <h2 className="text-xl font-bold">Study by Topic</h2>
              <p className="text-sm text-muted-foreground">Revise each topic with key points and targeted practice questions</p>
              <Button variant="outline" className="w-full" size="lg">
                <BookOpen className="h-4 w-4 mr-2" /> Browse Topics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Exam Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-500" />About the OISC Level 1 Exam</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2"><span className="text-muted-foreground w-32 shrink-0">Format:</span><span>Open-book, 2h 30min, multiple-choice + short answer</span></div>
              <div className="flex items-start gap-2"><span className="text-muted-foreground w-32 shrink-0">Pass mark:</span><span className="font-medium text-green-600">75%</span></div>
              <div className="flex items-start gap-2"><span className="text-muted-foreground w-32 shrink-0">Venue:</span><span>Presencial — Pearson VUE centres across the UK</span></div>
              <div className="flex items-start gap-2"><span className="text-muted-foreground w-32 shrink-0">Fee:</span><span>£390 (individual) / £820 (organisation)</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2"><span className="text-muted-foreground w-32 shrink-0">Key resources:</span><span>OISC Exam Resource Book (allowed in exam), Immigration Rules (HC 395)</span></div>
              <div className="flex items-start gap-2"><span className="text-muted-foreground w-32 shrink-0">Register:</span><span>oisc.gov.uk → Apply for registration</span></div>
              <div className="flex items-start gap-2"><span className="text-muted-foreground w-32 shrink-0">Regulator:</span><span>Office of the Immigration Services Commissioner (OISC)</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── STUDY TOPICS LIST ─────────────────────────────────────────────────────
  if (view === 'study') {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('home')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          <h1 className="text-2xl font-bold">Study Topics</h1>
        </div>
        <div className="grid gap-4">
          {STUDY_TOPICS.map(topic => (
            <Card key={topic.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSelectedTopic(topic); setView('topic'); }}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{topic.icon}</span>
                    <div>
                      <h3 className="font-semibold text-base">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline">{topicQuestionCount(topic.id)} Qs</Badge>
                    {topicProgress[topic.id] !== undefined && (
                      <Badge className={topicProgress[topic.id] >= 75 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                        {topicProgress[topic.id]}%
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ─── TOPIC DETAIL ──────────────────────────────────────────────────────────
  if (view === 'topic' && selectedTopic) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('study')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          <span className="text-2xl">{selectedTopic.icon}</span>
          <h1 className="text-xl font-bold">{selectedTopic.title}</h1>
        </div>

        {/* Key Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4 text-amber-500" />Key Points to Remember</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedTopic.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Practice Button */}
        <Button className="w-full" size="lg" onClick={() => startTopicExam(selectedTopic)}>
          <Target className="h-4 w-4 mr-2" />
          Practice {selectedTopic.questions.length} Questions on this Topic
        </Button>
      </div>
    );
  }

  // ─── EXAM VIEW ─────────────────────────────────────────────────────────────
  if (view === 'exam' && examQuestions.length > 0) {
    const q = examQuestions[currentQ];
    const selected = answers[currentQ];
    const answered = selected !== undefined;
    const progress = ((currentQ + (answered ? 1 : 0)) / examQuestions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        {/* Exam Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium">{formatTime(timeElapsed)}</span>
          </div>
          <span className="text-sm text-muted-foreground font-medium">Question {currentQ + 1} / {examQuestions.length}</span>
          <Badge variant="outline" className="text-xs">{q.topic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Question Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="font-semibold text-base leading-relaxed">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((option, i) => {
                let variant = 'outline';
                let className = 'w-full justify-start text-left h-auto py-3 px-4 font-normal';
                if (answered) {
                  if (i === q.correct) className += ' border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200';
                  else if (i === selected) className += ' border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
                  else className += ' opacity-50';
                } else {
                  className += ' hover:bg-muted/70';
                }
                return (
                  <Button key={i} variant="outline" className={className} onClick={() => selectAnswer(i)} disabled={answered}>
                    <span className="shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold mr-3">
                      {answered && i === q.correct ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                       answered && i === selected ? <XCircle className="h-4 w-4 text-red-500" /> :
                       String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </Button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className={`rounded-lg p-4 text-sm border ${selected === q.correct ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'}`}>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <div className="space-y-1">
                    <p className="font-medium">{selected === q.correct ? '✓ Correct!' : '✗ Incorrect'}</p>
                    <p>{q.explanation}</p>
                    {q.reference && <p className="text-xs text-muted-foreground italic">Reference: {q.reference}</p>}
                  </div>
                </div>
              </div>
            )}

            {answered && (
              <Button className="w-full" onClick={nextQuestion}>
                {currentQ < examQuestions.length - 1 ? <><ChevronRight className="h-4 w-4 mr-1" />Next Question</> : <><Flag className="h-4 w-4 mr-1" />Finish Exam</>}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── RESULTS ───────────────────────────────────────────────────────────────
  if (view === 'results') {
    const { correct, total, pct } = getScore();
    const passed = pct >= 75;

    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <Card className={`border-2 ${passed ? 'border-green-400' : 'border-amber-400'}`}>
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="text-6xl">{passed ? '🏆' : '📚'}</div>
            <h2 className="text-2xl font-bold">{passed ? 'Passed!' : 'Keep Studying'}</h2>
            <div className="text-5xl font-bold" style={{ color: passed ? '#16a34a' : '#d97706' }}>{pct}%</div>
            <p className="text-muted-foreground">{correct} correct out of {total} questions · {formatTime(timeElapsed)}</p>
            <Progress value={pct} className="h-3" />
            <Badge className={`text-sm px-4 py-1 ${passed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {passed ? '✓ Above 75% pass mark' : `Need ${75 - pct}% more to pass`}
            </Badge>
          </CardContent>
        </Card>

        {/* Review wrong answers */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Review Your Answers</h3>
          {examQuestions.map((q, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === q.correct;
            return (
              <Card key={q.id} className={`border ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-2">
                    {isCorrect
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                      : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />}
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{q.question}</p>
                      {!isCorrect && (
                        <>
                          <p className="text-red-600 dark:text-red-400">Your answer: {q.options[userAnswer] ?? 'Not answered'}</p>
                          <p className="text-green-600 dark:text-green-400">Correct: {q.options[q.correct]}</p>
                        </>
                      )}
                      <p className="text-muted-foreground">{q.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setView('home')}><ArrowLeft className="h-4 w-4 mr-2" />Home</Button>
          <Button className="flex-1" onClick={startFullExam}><RotateCcw className="h-4 w-4 mr-2" />Try Again</Button>
        </div>
      </div>
    );
  }

  return null;
}
