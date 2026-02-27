// Grammar Lessons organised by CEFR level

export interface GrammarLesson {
  id: string;
  level: string;
  title: string;
  summary: string;
  explanation: string;
  examples: { sentence: string; translation?: string; note?: string }[];
  practiceQuestions: { question: string; options: string[]; correct: number; explanation: string }[];
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  // ═══ A1 — Beginner ═══════════════════════════════════════════
  {
    id: 'a1-verb-to-be',
    level: 'A1',
    title: 'Verb "to be" (am / is / are)',
    summary: 'The most important verb in English — used for identity, descriptions, and states.',
    explanation: 'Use "am" with I, "is" with he/she/it, and "are" with you/we/they.\n\nPositive: I am / You are / He is\nNegative: I am not / You are not (aren\'t) / He is not (isn\'t)\nQuestion: Am I? / Are you? / Is he?',
    examples: [
      { sentence: 'I am a student.', note: 'Identity' },
      { sentence: 'She is from Brazil.', note: 'Origin' },
      { sentence: 'They are happy.', note: 'Feeling' },
      { sentence: 'Is he your brother?', note: 'Question form' },
      { sentence: 'We aren\'t late.', note: 'Negative contraction' },
    ],
    practiceQuestions: [
      { question: '"She ___ a teacher." Choose the correct form:', options: ['am', 'is', 'are', 'be'], correct: 1, explanation: 'Use "is" with she/he/it.' },
      { question: '"They ___ from London." Choose:', options: ['is', 'am', 'are', 'be'], correct: 2, explanation: 'Use "are" with they/we/you.' },
      { question: '"___ you hungry?" Choose:', options: ['Am', 'Is', 'Are', 'Do'], correct: 2, explanation: 'Questions with "you" use "are".' },
    ],
  },
  {
    id: 'a1-articles',
    level: 'A1',
    title: 'Articles: a, an, the',
    summary: 'When to use "a", "an", and "the" — one of the trickiest parts of English!',
    explanation: '"A" is used before consonant sounds: a book, a car.\n"An" is used before vowel sounds: an apple, an hour.\n"The" is used when we talk about something specific or already mentioned.\n\nNo article: general statements with plural/uncountable nouns (I like music).',
    examples: [
      { sentence: 'I have a dog.', note: 'First mention, consonant sound' },
      { sentence: 'She ate an orange.', note: 'Vowel sound' },
      { sentence: 'The shop on the corner is closed.', note: 'Specific shop' },
      { sentence: 'I need an umbrella.', note: 'Vowel sound (u = "uh")' },
      { sentence: 'Water is important for life.', note: 'No article — general uncountable' },
    ],
    practiceQuestions: [
      { question: '"I saw ___ elephant at the zoo." Choose:', options: ['a', 'an', 'the', 'no article'], correct: 1, explanation: '"Elephant" starts with a vowel sound, so use "an".' },
      { question: '"She works at ___ hospital." Choose:', options: ['a', 'an', 'the', 'no article'], correct: 0, explanation: '"Hospital" starts with a consonant sound "h", so use "a".' },
      { question: '"Can you close ___ door?" Choose:', options: ['a', 'an', 'the', 'no article'], correct: 2, explanation: 'We know which door — the specific door — so use "the".' },
    ],
  },
  {
    id: 'a1-present-simple',
    level: 'A1',
    title: 'Present Simple Tense',
    summary: 'For habits, routines, facts, and things that are always/generally true.',
    explanation: 'Structure: Subject + base verb (add -s/-es for he/she/it)\nNegative: Subject + do/does not + base verb\nQuestion: Do/Does + subject + base verb?\n\nTime expressions: always, usually, often, sometimes, never, every day.',
    examples: [
      { sentence: 'I work in an office.', note: 'Routine/habit' },
      { sentence: 'She speaks English well.', note: 'Add -s for she' },
      { sentence: 'They don\'t eat meat.', note: 'Negative with "don\'t"' },
      { sentence: 'Does he play football?', note: 'Question with "does"' },
      { sentence: 'The sun rises in the east.', note: 'Fact/always true' },
    ],
    practiceQuestions: [
      { question: '"He ___ to work by bus." Choose:', options: ['go', 'goes', 'going', 'gone'], correct: 1, explanation: 'With he/she/it in present simple, add -s or -es: "goes".' },
      { question: '"They ___ coffee." (negative) Choose:', options: ['doesn\'t drink', 'don\'t drink', 'not drink', 'aren\'t drink'], correct: 1, explanation: 'With they/we/you/I, use "don\'t" + base verb.' },
      { question: '"___ she like chocolate?" Choose:', options: ['Do', 'Does', 'Is', 'Has'], correct: 1, explanation: 'Questions with he/she/it use "Does".' },
    ],
  },
  {
    id: 'a1-possessives',
    level: 'A1',
    title: 'Possessive Adjectives & Pronouns',
    summary: 'my/your/his/her/its/our/their — showing who owns what.',
    explanation: 'Possessive adjectives come before a noun: my book, her car.\nPossessive pronouns replace the noun: mine, yours, his, hers, ours, theirs.\n\nI → my/mine | You → your/yours | He → his/his | She → her/hers\nWe → our/ours | They → their/theirs | It → its (no apostrophe!)',
    examples: [
      { sentence: 'This is my house.', note: 'Possessive adjective' },
      { sentence: 'That car is hers.', note: 'Possessive pronoun' },
      { sentence: 'Their children go to the local school.', note: 'their = belonging to them' },
      { sentence: 'Is this yours?', note: 'yours = belonging to you' },
    ],
    practiceQuestions: [
      { question: '"This is ___ book." (I) Choose:', options: ['me', 'my', 'mine', 'I'], correct: 1, explanation: 'Before a noun, use the possessive adjective "my".' },
      { question: '"That phone is ___." (she) Choose:', options: ['she', 'her', 'hers', 'she\'s'], correct: 2, explanation: 'Without a noun after it, use the possessive pronoun "hers".' },
    ],
  },

  // ═══ A2 — Elementary ═════════════════════════════════════════
  {
    id: 'a2-past-simple',
    level: 'A2',
    title: 'Past Simple Tense',
    summary: 'For completed actions in the past — regular (-ed) and irregular verbs.',
    explanation: 'Regular verbs: add -ed (worked, played, lived)\nIrregular verbs: learn each one (go→went, eat→ate, see→saw)\nNegative: didn\'t + base verb\nQuestion: Did + subject + base verb?\n\nTime expressions: yesterday, last week, in 2020, ago.',
    examples: [
      { sentence: 'I visited London last year.', note: 'Regular: visit → visited' },
      { sentence: 'She went to the shop.', note: 'Irregular: go → went' },
      { sentence: 'They didn\'t come to the party.', note: 'Negative' },
      { sentence: 'Did you see the film?', note: 'Question' },
      { sentence: 'We ate fish and chips.', note: 'Irregular: eat → ate' },
    ],
    practiceQuestions: [
      { question: '"I ___ to the park yesterday." Choose:', options: ['go', 'went', 'gone', 'going'], correct: 1, explanation: '"Go" is irregular: go → went → gone. Past simple = "went".' },
      { question: '"She ___ the email last night." Choose:', options: ['send', 'sent', 'sended', 'sending'], correct: 1, explanation: '"Send" is irregular: send → sent. There is no "sended".' },
      { question: '"___ they arrive on time?" Choose:', options: ['Do', 'Does', 'Did', 'Were'], correct: 2, explanation: 'Past simple questions use "Did" + base verb.' },
    ],
  },
  {
    id: 'a2-comparatives-superlatives',
    level: 'A2',
    title: 'Comparatives & Superlatives',
    summary: 'Comparing things: bigger, smaller, the most expensive, the cheapest.',
    explanation: 'Short adjectives (1 syllable): add -er / -est (tall → taller → tallest)\nLong adjectives (2+ syllables): use more / most (expensive → more expensive → most expensive)\nIrregular: good → better → best | bad → worse → worst\n\nComparative = comparing 2 things (+ than)\nSuperlative = the extreme of 3+ things (+ the)',
    examples: [
      { sentence: 'London is bigger than Manchester.', note: 'Comparative + than' },
      { sentence: 'This is the cheapest restaurant in town.', note: 'Superlative + the' },
      { sentence: 'English is more difficult than I expected.', note: 'Long adjective' },
      { sentence: 'She is the best student in the class.', note: 'Irregular: good → best' },
    ],
    practiceQuestions: [
      { question: '"My house is ___ than yours." (big) Choose:', options: ['big', 'bigger', 'biggest', 'more big'], correct: 1, explanation: 'Short adjective: big → bigger (double the consonant + er).' },
      { question: '"This is the ___ film I\'ve ever seen." (good) Choose:', options: ['good', 'better', 'best', 'most good'], correct: 2, explanation: 'Irregular superlative: good → better → best.' },
    ],
  },
  {
    id: 'a2-present-continuous',
    level: 'A2',
    title: 'Present Continuous (am/is/are + -ing)',
    summary: 'For actions happening right now or temporary situations.',
    explanation: 'Structure: Subject + am/is/are + verb-ing\nNegative: Subject + am/is/are + not + verb-ing\nQuestion: Am/Is/Are + subject + verb-ing?\n\nUse for: right now, temporary, changing/developing, future arrangements.',
    examples: [
      { sentence: 'I am reading a book right now.', note: 'Happening now' },
      { sentence: 'She is working from home this week.', note: 'Temporary' },
      { sentence: 'They aren\'t watching TV.', note: 'Negative' },
      { sentence: 'Are you coming to the party tonight?', note: 'Future arrangement' },
    ],
    practiceQuestions: [
      { question: '"Look! It ___ outside." Choose:', options: ['rains', 'is raining', 'rained', 'rain'], correct: 1, explanation: '"Look!" signals something happening right now → present continuous.' },
      { question: '"She ___ English at the moment." (study) Choose:', options: ['studies', 'is studying', 'studied', 'study'], correct: 1, explanation: '"At the moment" → happening now → present continuous.' },
    ],
  },

  // ═══ B1 — Intermediate ═══════════════════════════════════════
  {
    id: 'b1-present-perfect',
    level: 'B1',
    title: 'Present Perfect (have/has + past participle)',
    summary: 'Connecting past actions to the present — experiences, recent events, unfinished time.',
    explanation: 'Structure: Subject + have/has + past participle\nUse for:\n1. Life experiences: I have visited Paris.\n2. Recent events: She has just arrived.\n3. Unfinished time: I have worked here for 5 years.\n\nKey words: ever, never, just, already, yet, since, for.',
    examples: [
      { sentence: 'I have lived in the UK since 2022.', note: 'since = point in time' },
      { sentence: 'She has never been to Scotland.', note: 'Life experience' },
      { sentence: 'Have you ever tried haggis?', note: 'Experience question' },
      { sentence: 'They have just finished dinner.', note: '"Just" = very recently' },
      { sentence: 'I haven\'t seen that film yet.', note: '"Yet" in negative' },
    ],
    practiceQuestions: [
      { question: '"I ___ in London for 3 years." Choose:', options: ['live', 'lived', 'have lived', 'am living'], correct: 2, explanation: '"For 3 years" (unfinished) → present perfect: "have lived".' },
      { question: '"___ you ever ___ sushi?" Choose:', options: ['Did / eat', 'Have / eaten', 'Do / eat', 'Are / eating'], correct: 1, explanation: '"Ever" (life experience) → present perfect: "Have you ever eaten?"' },
      { question: '"She has worked here ___ 2019." Choose:', options: ['for', 'since', 'from', 'during'], correct: 1, explanation: '"Since" is used with a point in time (2019). "For" is for durations.' },
    ],
  },
  {
    id: 'b1-conditionals-first',
    level: 'B1',
    title: 'First Conditional (If + present, will + base verb)',
    summary: 'For real and likely future possibilities.',
    explanation: 'Structure: If + present simple, will + base verb\n\nUsed when something is likely or possible in the future.\n"If it rains, I will take an umbrella."\n\nYou can also use: might, can, should instead of will.\nThe if-clause can come second: "I will stay home if it rains."',
    examples: [
      { sentence: 'If you study hard, you will pass the exam.', note: 'Likely result' },
      { sentence: 'If it snows, we\'ll stay at home.', note: 'Contraction: will → \'ll' },
      { sentence: 'I\'ll help you if you ask me.', note: 'If-clause second' },
      { sentence: 'If she doesn\'t hurry, she\'ll miss the bus.', note: 'Negative if-clause' },
    ],
    practiceQuestions: [
      { question: '"If you ___ late, the shop will be closed." Choose:', options: ['arrive', 'arrived', 'will arrive', 'arriving'], correct: 0, explanation: 'First conditional: If + present simple. "If you arrive late..."' },
      { question: '"If it ___ nice tomorrow, we\'ll go to the park." Choose:', options: ['is', 'will be', 'was', 'were'], correct: 0, explanation: 'After "if" in first conditional, use present simple, not "will".' },
    ],
  },
  {
    id: 'b1-modal-verbs',
    level: 'B1',
    title: 'Modal Verbs (can, could, must, should, might, may)',
    summary: 'Express ability, possibility, obligation, advice, and permission.',
    explanation: 'can = ability, permission: I can swim. Can I sit here?\ncould = past ability, polite request: I could swim. Could you help me?\nmust = strong obligation: You must wear a seatbelt.\nshould = advice: You should see a doctor.\nmight/may = possibility: It might rain tomorrow.\n\nModals are followed by the base verb (no "to", no -s).',
    examples: [
      { sentence: 'You must not park here.', note: 'Prohibition' },
      { sentence: 'You should register with a GP.', note: 'Advice' },
      { sentence: 'Could you repeat that, please?', note: 'Polite request' },
      { sentence: 'She might be late today.', note: 'Possibility' },
      { sentence: 'May I use your phone?', note: 'Formal permission' },
    ],
    practiceQuestions: [
      { question: '"You ___ drive without insurance in the UK." Choose:', options: ['mustn\'t', 'shouldn\'t', 'don\'t have to', 'mightn\'t'], correct: 0, explanation: '"Mustn\'t" = it is prohibited/illegal. Driving without insurance is illegal.' },
      { question: '"You ___ register with a GP when you move." Choose:', options: ['might', 'should', 'can', 'would'], correct: 1, explanation: '"Should" = advice/recommendation. It\'s advisable to register.' },
    ],
  },
  {
    id: 'b1-relative-clauses',
    level: 'B1',
    title: 'Relative Clauses (who, which, that, where)',
    summary: 'Give extra information about a person, thing, or place.',
    explanation: 'who = people: The man who lives next door is a teacher.\nwhich = things/animals: The book which I bought is great.\nthat = people or things (informal): The car that I drive is old.\nwhere = places: The town where I grew up is small.\n\nDefining clauses = essential info (no commas)\nNon-defining clauses = extra info (with commas)',
    examples: [
      { sentence: 'The woman who called is my boss.', note: 'Defining — who for people' },
      { sentence: 'London, which is the capital, is very diverse.', note: 'Non-defining — extra info' },
      { sentence: 'The shop where I buy groceries is closing.', note: 'where for places' },
      { sentence: 'The test that I took was difficult.', note: 'that for things (informal)' },
    ],
    practiceQuestions: [
      { question: '"The teacher ___ taught me English was excellent." Choose:', options: ['which', 'who', 'where', 'what'], correct: 1, explanation: '"Who" is used for people. The teacher is a person.' },
      { question: '"The house ___ we lived was near the school." Choose:', options: ['who', 'which', 'where', 'that'], correct: 2, explanation: '"Where" is used for places.' },
    ],
  },

  // ═══ B2 — Upper Intermediate ═════════════════════════════════
  {
    id: 'b2-conditionals-second',
    level: 'B2',
    title: 'Second Conditional (If + past simple, would + base verb)',
    summary: 'For unreal, imaginary, or unlikely present/future situations.',
    explanation: 'Structure: If + past simple, would + base verb\n\nUsed for hypothetical situations that are unlikely or imaginary.\n"If I won the lottery, I would buy a house."\n\nSpecial: "If I were you, I would..." (advice — "were" for all persons)\nCan also use: could, might instead of would.',
    examples: [
      { sentence: 'If I spoke perfect English, I would apply for that job.', note: 'Hypothetical' },
      { sentence: 'If I were you, I\'d study harder.', note: 'Advice with "were"' },
      { sentence: 'She would travel the world if she had more money.', note: 'Result first' },
      { sentence: 'If we lived in London, we could visit museums every weekend.', note: 'could = hypothetical ability' },
    ],
    practiceQuestions: [
      { question: '"If I ___ rich, I would donate to charity." Choose:', options: ['am', 'was/were', 'will be', 'would be'], correct: 1, explanation: 'Second conditional: If + past simple. "If I were rich..." (subjunctive).' },
      { question: '"If she ___ here, she would help us." Choose:', options: ['is', 'were', 'will be', 'has been'], correct: 1, explanation: 'Unreal present → past simple/subjunctive: "If she were here..."' },
    ],
  },
  {
    id: 'b2-passive-voice',
    level: 'B2',
    title: 'Passive Voice',
    summary: 'When the action is more important than who does it.',
    explanation: 'Active: The chef cooked the meal.\nPassive: The meal was cooked (by the chef).\n\nStructure: Subject + be + past participle (+ by agent)\n\nPresent: is/are + past participle\nPast: was/were + past participle\nFuture: will be + past participle\nPerfect: has/have been + past participle\n\nUsed in formal writing, news, and when the doer is unknown or unimportant.',
    examples: [
      { sentence: 'English is spoken all over the world.', note: 'Present passive — doer unimportant' },
      { sentence: 'The letter was sent yesterday.', note: 'Past passive' },
      { sentence: 'The new hospital will be built next year.', note: 'Future passive' },
      { sentence: 'The suspect has been arrested.', note: 'Present perfect passive' },
    ],
    practiceQuestions: [
      { question: '"The cake ___ by my mother." Choose:', options: ['baked', 'was baked', 'is baking', 'has baking'], correct: 1, explanation: 'Passive voice: subject + was + past participle. "was baked".' },
      { question: '"English ___ in many countries." Choose:', options: ['speaks', 'is spoken', 'is speaking', 'has speaking'], correct: 1, explanation: 'Present passive: "is spoken" — the language is spoken (by people).' },
    ],
  },
  {
    id: 'b2-reported-speech',
    level: 'B2',
    title: 'Reported Speech (Indirect Speech)',
    summary: 'Telling someone what another person said, without quoting directly.',
    explanation: 'Direct: "I am tired," she said.\nReported: She said (that) she was tired.\n\nTense changes (backshift):\nPresent simple → Past simple\nPresent continuous → Past continuous\nPast simple → Past perfect\nWill → Would\nCan → Could\n\nPronoun and time changes: I→she, today→that day, tomorrow→the next day.',
    examples: [
      { sentence: 'He said he was going to the meeting.', note: '"I am going" → "he was going"' },
      { sentence: 'She told me she had passed the exam.', note: '"I passed" → "she had passed"' },
      { sentence: 'They said they would help us.', note: '"We will help" → "they would help"' },
      { sentence: 'He asked if I could come early.', note: 'Reported question with "if"' },
    ],
    practiceQuestions: [
      { question: 'She said, "I like tea." → She said she ___ tea.', options: ['likes', 'liked', 'is liking', 'had liked'], correct: 1, explanation: 'Backshift: present simple "like" → past simple "liked".' },
      { question: 'He said, "I will call you." → He said he ___ call me.', options: ['will', 'would', 'could', 'should'], correct: 1, explanation: 'Backshift: "will" → "would".' },
    ],
  },

  // ═══ C1 — Advanced ═══════════════════════════════════════════
  {
    id: 'c1-conditionals-third',
    level: 'C1',
    title: 'Third Conditional (If + past perfect, would have + past participle)',
    summary: 'For imaginary past situations — things that did NOT happen.',
    explanation: 'Structure: If + past perfect, would have + past participle\n\nUsed to talk about unreal past situations and their imaginary results.\n"If I had studied harder, I would have passed the exam."\n(= I didn\'t study hard → I didn\'t pass)\n\nInversion: Had I known... = If I had known...\nMixed conditionals: If I had taken that job (past), I would be in London now (present).',
    examples: [
      { sentence: 'If I had left earlier, I wouldn\'t have missed the train.', note: 'Unreal past' },
      { sentence: 'Had she known, she would have helped.', note: 'Formal inversion' },
      { sentence: 'If they had saved more money, they could have bought a house.', note: 'Could have = ability' },
    ],
    practiceQuestions: [
      { question: '"If I ___ about the meeting, I would have attended." Choose:', options: ['know', 'knew', 'had known', 'would know'], correct: 2, explanation: 'Third conditional: If + past perfect. "If I had known..."' },
      { question: '"She ___ the exam if she had studied more." Choose:', options: ['passes', 'passed', 'would have passed', 'will pass'], correct: 2, explanation: 'Result clause: would have + past participle.' },
    ],
  },
  {
    id: 'c1-inversion',
    level: 'C1',
    title: 'Inversion for Emphasis',
    summary: 'Changing word order for formal or dramatic emphasis.',
    explanation: 'Normal: I have never seen such beauty.\nInversion: Never have I seen such beauty.\n\nCommon triggers:\n- Never / Rarely / Seldom + auxiliary + subject\n- Not only... but also\n- Had I known... (= If I had known)\n- No sooner... than\n- Only when / Only after + inversion in main clause',
    examples: [
      { sentence: 'Never have I been so impressed.', note: 'Never + have + I' },
      { sentence: 'Not only did she win, but she broke the record.', note: 'Not only + did' },
      { sentence: 'Rarely does one see such talent.', note: 'Rarely + does' },
      { sentence: 'Had I known the truth, I would have acted differently.', note: 'Conditional inversion' },
    ],
    practiceQuestions: [
      { question: '"___ had I arrived when the phone rang." Choose:', options: ['Barely', 'Only', 'Just', 'No sooner'], correct: 3, explanation: '"No sooner had I arrived... than..." is the standard inversion pattern.' },
    ],
  },
  {
    id: 'c1-phrasal-verbs-advanced',
    level: 'C1',
    title: 'Advanced Phrasal Verbs',
    summary: 'Multi-word verbs essential for natural-sounding English.',
    explanation: 'Phrasal verbs = verb + particle(s). The meaning often changes completely.\n\nSeparable: turn off the light / turn the light off\nInseparable: look after the children (NOT look the children after)\nThree-part: put up with = tolerate, come up with = think of an idea',
    examples: [
      { sentence: 'I need to brush up on my English.', note: 'brush up on = refresh/improve skills' },
      { sentence: 'She came across an old letter.', note: 'come across = find by chance' },
      { sentence: 'We must cut down on expenses.', note: 'cut down on = reduce' },
      { sentence: 'They called off the meeting.', note: 'call off = cancel' },
      { sentence: 'I can\'t put up with this noise.', note: 'put up with = tolerate' },
      { sentence: 'He turned down the job offer.', note: 'turn down = reject/refuse' },
    ],
    practiceQuestions: [
      { question: '"The match was ___ due to rain." Choose:', options: ['called off', 'called up', 'called on', 'called in'], correct: 0, explanation: '"Called off" = cancelled.' },
      { question: '"She ___ a brilliant idea." Choose:', options: ['came up with', 'came across', 'came down with', 'came over'], correct: 0, explanation: '"Came up with" = thought of/invented an idea.' },
    ],
  },

  // ═══ C2 — Proficiency ════════════════════════════════════════
  {
    id: 'c2-subjunctive',
    level: 'C2',
    title: 'The Subjunctive Mood',
    summary: 'Formal English for wishes, demands, suggestions, and hypothetical situations.',
    explanation: 'The subjunctive uses the base form of the verb (no -s for he/she/it).\n\nAfter verbs of demand/suggestion: insist, suggest, recommend, demand, propose\n"I suggest that he attend the meeting." (NOT attends)\n\nFixed expressions:\n"If I were you..." / "If need be..." / "God save the King!" / "Be that as it may..."',
    examples: [
      { sentence: 'The manager insisted that she be present at the meeting.', note: '"be" not "is" — subjunctive' },
      { sentence: 'It is essential that every student submit the form.', note: '"submit" not "submits"' },
      { sentence: 'I recommend that he take the B1 exam first.', note: '"take" not "takes"' },
      { sentence: 'Be that as it may, we must proceed.', note: 'Fixed subjunctive expression' },
    ],
    practiceQuestions: [
      { question: '"The teacher recommended that he ___ more." Choose:', options: ['practises', 'practise', 'practised', 'is practising'], correct: 1, explanation: 'After "recommend that", use the base verb (subjunctive): "practise".' },
    ],
  },
  {
    id: 'c2-collocations',
    level: 'C2',
    title: 'Advanced Collocations & Fixed Expressions',
    summary: 'Natural word combinations that native speakers use automatically.',
    explanation: 'Collocations are words that naturally go together in English.\nLearning them makes your English sound more natural and fluent.\n\nTypes:\nVerb + Noun: make a decision (NOT do a decision)\nAdverb + Adjective: deeply concerned (NOT very concerned)\nAdjective + Noun: heavy traffic (NOT strong traffic)\nVerb + Preposition: depend on (NOT depend of)',
    examples: [
      { sentence: 'She made a strong impression at the interview.', note: 'make + impression' },
      { sentence: 'The company went bankrupt during the recession.', note: 'go + bankrupt' },
      { sentence: 'He took great pride in his work.', note: 'take + pride' },
      { sentence: 'We need to pay close attention to the details.', note: 'pay + attention' },
      { sentence: 'The weather is bitterly cold today.', note: 'bitterly + cold' },
    ],
    practiceQuestions: [
      { question: '"He ___ a terrible mistake." Choose:', options: ['did', 'made', 'had', 'took'], correct: 1, explanation: 'Collocation: "make a mistake" (NOT "do a mistake").' },
      { question: '"There is ___ traffic on the motorway." Choose:', options: ['strong', 'heavy', 'big', 'hard'], correct: 1, explanation: 'Collocation: "heavy traffic" is the natural combination.' },
    ],
  },
];
