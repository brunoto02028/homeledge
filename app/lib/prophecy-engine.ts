// ═══════════════════════════════════════════════════════════════════════════════
// PROPHECY INTELLIGENCE ENGINE — Biblical Cross-Reference Analysis System
// ═══════════════════════════════════════════════════════════════════════════════

export interface Scripture {
  book: string;
  ref: string;      // e.g. "24:6-7"
  text: string;     // KJV/NIV excerpt
}

export interface ProphecyTheme {
  id: string;
  category: 'end_times_signs' | 'nations' | 'economic' | 'natural' | 'spiritual' | 'technology' | 'cosmic';
  theme: string;
  description: string;
  scriptures: Scripture[];
  keywords: string[];
  regions: string[];           // related country codes
  analysisContext: string;     // template for generating analysis
}

export interface ProphecyMatch {
  themeId: string;
  theme: string;
  category: string;
  relevanceScore: number;       // 0-100
  matchedKeywords: string[];
  scriptures: Scripture[];
  analysis: string;             // generated analysis text
  relatedThemes: string[];      // IDs of related prophecy themes
}

// ─── Comprehensive Prophecy Database ─────────────────────────────────────────

export const PROPHECY_THEMES: ProphecyTheme[] = [
  // ═══ END TIMES SIGNS ═══
  {
    id: 'wars_rumors',
    category: 'end_times_signs',
    theme: 'Wars and Rumors of Wars',
    description: 'Jesus warned that the end times would be marked by escalating wars and military conflicts across the world.',
    scriptures: [
      { book: 'Matthew', ref: '24:6-7', text: 'You will hear of wars and rumors of wars... Nation will rise against nation, and kingdom against kingdom.' },
      { book: 'Mark', ref: '13:7-8', text: 'When you hear of wars and rumors of wars, do not be alarmed. Such things must happen, but the end is still to come.' },
      { book: 'Revelation', ref: '6:3-4', text: 'When the Lamb opened the second seal... another horse came out, a fiery red one. Its rider was given power to take peace from the earth.' },
    ],
    keywords: ['war', 'wars', 'military conflict', 'armed conflict', 'invasion', 'airstrike', 'airstrikes', 'missile strike', 'bombing', 'troops deployed', 'military operation', 'combat', 'battlefield', 'frontline', 'offensive', 'counteroffensive', 'ceasefire', 'escalation', 'hostilities', 'shelling', 'artillery', 'drone strike', 'military buildup'],
    regions: [],
    analysisContext: 'This event reflects the prophetic pattern of escalating global conflicts described by Jesus as signs preceding His return. The increasing frequency and intensity of armed conflicts worldwide aligns with the biblical narrative of the end times.',
  },
  {
    id: 'nation_against_nation',
    category: 'end_times_signs',
    theme: 'Nation Against Nation',
    description: 'Rising geopolitical tensions, proxy wars, and international conflicts between major powers.',
    scriptures: [
      { book: 'Matthew', ref: '24:7', text: 'Nation will rise against nation, and kingdom against kingdom.' },
      { book: 'Luke', ref: '21:10', text: 'Nation will rise against nation, and kingdom against kingdom.' },
      { book: 'Isaiah', ref: '19:2', text: 'I will stir up Egyptian against Egyptian — brother will fight against brother, neighbor against neighbor, city against city, kingdom against kingdom.' },
    ],
    keywords: ['trade war', 'sanctions', 'diplomatic crisis', 'cold war', 'proxy war', 'geopolitical', 'superpower', 'nato', 'alliance', 'confrontation', 'rival', 'adversary', 'tensions', 'standoff', 'retaliation', 'embargo', 'blockade', 'threat', 'ultimatum', 'power struggle', 'brink of war'],
    regions: ['us', 'ru', 'cn'],
    analysisContext: 'The rising tensions between nations fulfills the prophetic pattern where kingdoms and nations increasingly oppose one another, creating global instability as described in biblical prophecy.',
  },
  {
    id: 'famines',
    category: 'end_times_signs',
    theme: 'Famines and Food Crisis',
    description: 'Widespread food shortages and famine conditions as prophesied for the last days.',
    scriptures: [
      { book: 'Matthew', ref: '24:7', text: 'There will be famines and earthquakes in various places.' },
      { book: 'Revelation', ref: '6:5-6', text: 'When the Lamb opened the third seal... a black horse! Its rider was holding a pair of scales. "Two pounds of wheat for a day\'s wages."' },
      { book: 'Luke', ref: '21:11', text: 'There will be great earthquakes, famines and pestilences in various places.' },
    ],
    keywords: ['famine', 'food crisis', 'food shortage', 'hunger', 'starvation', 'malnutrition', 'food insecurity', 'crop failure', 'drought', 'food price', 'grain shortage', 'wheat price', 'food supply', 'humanitarian crisis', 'food aid'],
    regions: ['et', 'sd', 'so', 'ye', 'ss'],
    analysisContext: 'This food crisis mirrors the prophetic third seal of Revelation, where famine spreads across the earth with food becoming scarce and expensive — a day\'s wages for basic sustenance.',
  },
  {
    id: 'earthquakes',
    category: 'natural',
    theme: 'Earthquakes in Various Places',
    description: 'Increasing frequency and intensity of earthquakes as prophesied by Jesus.',
    scriptures: [
      { book: 'Matthew', ref: '24:7', text: 'There will be famines and earthquakes in various places.' },
      { book: 'Luke', ref: '21:11', text: 'There will be great earthquakes, famines and pestilences in various places, and fearful events and great signs from heaven.' },
      { book: 'Revelation', ref: '16:18', text: 'Then there came flashes of lightning, rumblings, peals of thunder and a severe earthquake. No earthquake like it has ever occurred since mankind has been on earth.' },
      { book: 'Isaiah', ref: '24:19-20', text: 'The earth is broken up, the earth is split asunder, the earth is violently shaken. The earth reels like a drunkard.' },
    ],
    keywords: ['earthquake', 'seismic', 'tremor', 'aftershock', 'magnitude', 'richter', 'tectonic', 'fault line', 'quake'],
    regions: [],
    analysisContext: 'This seismic event fulfills Jesus\' prophecy of earthquakes occurring "in various places" as signs of the approaching end. The increasing frequency of significant earthquakes aligns with the biblical pattern of intensifying birth pains.',
  },
  {
    id: 'pestilence',
    category: 'end_times_signs',
    theme: 'Pestilences and Plagues',
    description: 'Global disease outbreaks and pandemics as prophesied in Scripture.',
    scriptures: [
      { book: 'Luke', ref: '21:11', text: 'There will be great earthquakes, famines and pestilences in various places.' },
      { book: 'Revelation', ref: '6:7-8', text: 'I looked, and there before me was a pale horse! Its rider was named Death... They were given power over a fourth of the earth to kill by sword, famine and plague.' },
      { book: 'Revelation', ref: '16:2', text: 'The first angel went and poured out his bowl on the land, and ugly, festering sores broke out on the people.' },
    ],
    keywords: ['pandemic', 'plague', 'epidemic', 'outbreak', 'virus', 'disease spread', 'contagion', 'pathogen', 'bird flu', 'mpox', 'ebola', 'cholera', 'tuberculosis', 'antibiotic resistance', 'superbug', 'bioweapon', 'biological weapon', 'lab leak'],
    regions: [],
    analysisContext: 'This disease outbreak aligns with the prophetic warnings of pestilences in the last days. The pale horse of Revelation represents death through plague, and modern pandemics echo this ancient prophecy.',
  },

  // ═══ NATIONS IN PROPHECY ═══
  {
    id: 'israel_restored',
    category: 'nations',
    theme: 'Israel — The Fig Tree Restored',
    description: 'Israel\'s restoration as a nation and its central role in end-times prophecy.',
    scriptures: [
      { book: 'Ezekiel', ref: '37:21-22', text: 'I will take the Israelites out of the nations where they have gone. I will gather them from all around and bring them back into their own land.' },
      { book: 'Isaiah', ref: '66:8', text: 'Who has ever heard of such things? Can a country be born in a day? Can a nation be brought forth in a moment? Yet no sooner is Zion in labor than she gives birth.' },
      { book: 'Matthew', ref: '24:32-34', text: 'Now learn this lesson from the fig tree: As soon as its twigs get tender and its leaves come out, you know that summer is near.' },
      { book: 'Amos', ref: '9:14-15', text: 'I will bring my people Israel back from exile... I will plant Israel in their own land, never again to be uprooted.' },
    ],
    keywords: ['israel', 'israeli', 'idf', 'tel aviv', 'netanyahu', 'knesset', 'iron dome', 'hamas', 'hezbollah', 'west bank', 'gaza', 'zionism', 'jewish state'],
    regions: ['il', 'ps'],
    analysisContext: 'Events involving Israel are prophetically significant. The restoration of Israel as a nation in 1948 fulfilled Ezekiel\'s prophecy, and Jesus indicated that the generation witnessing this would see all end-times events unfold.',
  },
  {
    id: 'jerusalem',
    category: 'nations',
    theme: 'Jerusalem — Immovable Rock',
    description: 'Jerusalem as the center of global conflict and prophetic fulfillment.',
    scriptures: [
      { book: 'Zechariah', ref: '12:2-3', text: 'I am going to make Jerusalem a cup that sends all the surrounding peoples reeling. On that day, when all the nations of the earth are gathered against her, I will make Jerusalem an immovable rock for all the nations.' },
      { book: 'Luke', ref: '21:20', text: 'When you see Jerusalem being surrounded by armies, you will know that its desolation is near.' },
      { book: 'Zechariah', ref: '14:2', text: 'I will gather all the nations to Jerusalem to fight against it.' },
      { book: 'Revelation', ref: '11:2', text: 'They will trample on the holy city for 42 months.' },
    ],
    keywords: ['jerusalem', 'temple mount', 'al-aqsa', 'holy city', 'old city', 'western wall', 'dome of the rock'],
    regions: ['il'],
    analysisContext: 'Jerusalem remains the most contested city on earth, exactly as prophesied. Zechariah foretold that it would become "an immovable rock for all nations," and events surrounding Jerusalem continue to draw global attention and conflict.',
  },
  {
    id: 'gog_magog',
    category: 'nations',
    theme: 'Gog-Magog Coalition',
    description: 'A northern coalition including Russia, Iran, Turkey, and allies moving against Israel.',
    scriptures: [
      { book: 'Ezekiel', ref: '38:2-6', text: 'Son of man, set your face against Gog, of the land of Magog... I will turn you around, put hooks in your jaws and bring you out with your whole army... Persia, Cush and Put will be with them... also Gomer with all its troops, and Beth Togarmah.' },
      { book: 'Ezekiel', ref: '38:14-16', text: 'In that day, when my people Israel are living in safety, will you not take notice of it? You will come from your place in the far north... a great horde, a mighty army.' },
      { book: 'Ezekiel', ref: '39:1-4', text: 'I am against you, Gog, chief prince of Meshek and Tubal. I will turn you around and drag you along.' },
    ],
    keywords: ['russia', 'putin', 'kremlin', 'moscow', 'iran', 'tehran', 'turkey', 'ankara', 'erdogan', 'russian military', 'russian forces', 'iranian', 'turkish forces', 'alliance', 'coalition', 'military pact', 'russia iran', 'russia turkey'],
    regions: ['ru', 'ir', 'tr'],
    analysisContext: 'This event involves nations identified in the Ezekiel 38-39 Gog-Magog prophecy. Biblical scholars identify Magog as Russia (from the far north), Persia as modern Iran, and Gomer/Beth Togarmah as Turkey. Their growing alliance aligns precisely with this prophetic coalition.',
  },
  {
    id: 'damascus',
    category: 'nations',
    theme: 'Damascus Destruction',
    description: 'Isaiah prophesied Damascus would cease to be a city — one of the oldest continuously inhabited cities.',
    scriptures: [
      { book: 'Isaiah', ref: '17:1', text: 'See, Damascus will no longer be a city but will become a heap of ruins.' },
      { book: 'Isaiah', ref: '17:3', text: 'The fortified city will disappear from Ephraim, and royal power from Damascus.' },
      { book: 'Jeremiah', ref: '49:23-27', text: 'Damascus has become feeble, she has turned to flee and panic has gripped her... her young men will fall in the streets; all her soldiers will be silenced in that day.' },
    ],
    keywords: ['damascus', 'syria', 'syrian', 'assad', 'aleppo', 'idlib', 'syrian civil war', 'syrian conflict'],
    regions: ['sy'],
    analysisContext: 'Damascus, one of the oldest continuously inhabited cities in the world, features prominently in Isaiah\'s prophecy of its complete destruction. Events in Syria bring this ancient prophecy closer to potential fulfillment.',
  },
  {
    id: 'kings_east',
    category: 'nations',
    theme: 'Kings of the East',
    description: 'A massive eastern military force of 200 million, often associated with China and Asian powers.',
    scriptures: [
      { book: 'Revelation', ref: '9:16', text: 'The number of the mounted troops was twice ten thousand times ten thousand. I heard their number.' },
      { book: 'Revelation', ref: '16:12', text: 'The sixth angel poured out his bowl on the great river Euphrates, and its water was dried up to prepare the way for the kings from the East.' },
    ],
    keywords: ['china', 'chinese military', 'pla', 'beijing', 'xi jinping', 'south china sea', 'taiwan strait', 'chinese navy', 'china military', 'chinese army', 'asian military', 'east asian'],
    regions: ['cn', 'tw', 'kr', 'jp'],
    analysisContext: 'China\'s military expansion and growing power in Asia aligns with the Revelation prophecy of the "Kings of the East" — a massive eastern force that marches westward. Only in modern times has any eastern nation had the capacity to field an army of 200 million.',
  },
  {
    id: 'egypt_prophecy',
    category: 'nations',
    theme: 'Egypt in Prophecy',
    description: 'Egypt\'s role in end-times events including internal strife and alignment shifts.',
    scriptures: [
      { book: 'Isaiah', ref: '19:2', text: 'I will stir up Egyptian against Egyptian — brother will fight against brother, neighbor against neighbor, city against city, kingdom against kingdom.' },
      { book: 'Isaiah', ref: '19:4', text: 'I will hand the Egyptians over to the power of a cruel master, and a fierce king will rule over them.' },
      { book: 'Daniel', ref: '11:42', text: 'He will extend his power over many countries; Egypt will not escape.' },
    ],
    keywords: ['egypt', 'cairo', 'suez canal', 'sinai', 'egyptian', 'nile'],
    regions: ['eg'],
    analysisContext: 'Egypt plays a significant role in biblical prophecy. Isaiah predicted internal conflicts and the rise of authoritarian rule, while Daniel prophesied Egypt\'s involvement in end-times geopolitical upheaval.',
  },
  {
    id: 'euphrates',
    category: 'nations',
    theme: 'Euphrates River Drying',
    description: 'The drying of the Euphrates River, preparing the way for eastern armies.',
    scriptures: [
      { book: 'Revelation', ref: '16:12', text: 'The sixth angel poured out his bowl on the great river Euphrates, and its water was dried up to prepare the way for the kings from the East.' },
      { book: 'Jeremiah', ref: '50:38', text: 'A drought on her waters! They will dry up.' },
    ],
    keywords: ['euphrates', 'river dried', 'water crisis', 'drought iraq', 'drought turkey', 'dam', 'water level', 'river level'],
    regions: ['iq', 'tr', 'sy'],
    analysisContext: 'The Euphrates River has been significantly receding in recent years due to dams and drought. This directly mirrors the Revelation prophecy about the Euphrates drying up to prepare the way for the Kings of the East.',
  },

  // ═══ ECONOMIC PROPHECY ═══
  {
    id: 'mark_beast',
    category: 'economic',
    theme: 'Mark of the Beast — Economic Control',
    description: 'A global system requiring a mark to buy or sell, controlling all economic activity.',
    scriptures: [
      { book: 'Revelation', ref: '13:16-17', text: 'It also forced all people, great and small, rich and poor, free and slave, to receive a mark on their right hands or on their foreheads, so that they could not buy or sell unless they had the mark.' },
      { book: 'Revelation', ref: '13:18', text: 'Let the person who has insight calculate the number of the beast, for it is the number of a man. That number is 666.' },
      { book: 'Revelation', ref: '14:9-11', text: 'If anyone worships the beast and its image and receives its mark on their forehead or on their hand, they will drink the wine of God\'s fury.' },
    ],
    keywords: ['digital currency', 'cbdc', 'digital id', 'digital identity', 'biometric', 'cashless', 'cashless society', 'microchip', 'chip implant', 'neuralink', 'digital payment', 'digital wallet', 'social credit', 'central bank digital', 'programmable money', 'financial surveillance', 'digital euro', 'digital yuan', 'digital dollar'],
    regions: [],
    analysisContext: 'This development in digital economic control systems echoes the Revelation prophecy of the "mark of the beast" — a system that controls all buying and selling. Modern digital currencies and biometric ID systems create the technological infrastructure that could enable such a system.',
  },
  {
    id: 'babylon_falls',
    category: 'economic',
    theme: 'Fall of Economic Babylon',
    description: 'The sudden collapse of the global economic system described as "Babylon the Great."',
    scriptures: [
      { book: 'Revelation', ref: '18:2-3', text: 'Fallen! Fallen is Babylon the Great! For all the nations have drunk the maddening wine of her adulteries. The kings of the earth committed adultery with her, and the merchants of the earth grew rich from her excessive luxuries.' },
      { book: 'Revelation', ref: '18:10-11', text: 'In one hour your doom has come! The merchants of the earth will weep and mourn over her because no one buys their cargoes anymore.' },
      { book: 'Revelation', ref: '18:17', text: 'In one hour such great wealth has been brought to ruin!' },
      { book: 'James', ref: '5:1-3', text: 'Now listen, you rich people, weep and wail because of the misery that is coming on you. Your wealth has rotted.' },
    ],
    keywords: ['economic collapse', 'market crash', 'financial crisis', 'recession', 'depression', 'hyperinflation', 'bank failure', 'stock crash', 'debt crisis', 'default', 'bankruptcy', 'economic meltdown', 'bubble burst', 'financial meltdown', 'systemic risk', 'bank run'],
    regions: [],
    analysisContext: 'This economic upheaval mirrors the prophetic description of Babylon\'s fall in Revelation 18, where the entire global trading system collapses "in one hour." The interconnected nature of modern finance makes such a sudden collapse increasingly plausible.',
  },
  {
    id: 'one_world_economy',
    category: 'economic',
    theme: 'One World Economic System',
    description: 'Movement toward a unified global economic and monetary system.',
    scriptures: [
      { book: 'Revelation', ref: '13:7', text: 'It was given authority over every tribe, people, language and nation.' },
      { book: 'Daniel', ref: '7:23', text: 'The fourth beast is a fourth kingdom that will appear on earth. It will be different from all the other kingdoms and will devour the whole earth, trampling it down and crushing it.' },
      { book: 'Revelation', ref: '17:12-13', text: 'The ten horns you saw are ten kings... They have one purpose and will give their power and authority to the beast.' },
    ],
    keywords: ['one world', 'world government', 'global governance', 'new world order', 'great reset', 'world economic forum', 'wef', 'davos', 'globalist', 'global currency', 'world bank', 'imf restructuring', 'global tax', 'un reform', 'who treaty', 'pandemic treaty'],
    regions: [],
    analysisContext: 'This movement toward global governance structures aligns with the prophetic vision of a one-world system described in Daniel and Revelation. The consolidation of power into supranational institutions creates the framework for the prophesied global authority.',
  },

  // ═══ TECHNOLOGY & SURVEILLANCE ═══
  {
    id: 'surveillance_state',
    category: 'technology',
    theme: 'Global Surveillance — Total Control',
    description: 'Mass surveillance technology enabling the kind of total control prophesied in Revelation.',
    scriptures: [
      { book: 'Revelation', ref: '13:16-17', text: 'It also forced all people... to receive a mark... so that they could not buy or sell unless they had the mark.' },
      { book: 'Revelation', ref: '13:15', text: 'The second beast was given power to give breath to the image of the first beast, so that the image could speak and cause all who refused to worship the image to be killed.' },
    ],
    keywords: ['surveillance', 'facial recognition', 'mass surveillance', 'tracking', 'privacy', 'spy', 'spying', 'nsa', 'cctv', 'monitoring', 'data collection', 'big brother', 'social credit score', 'surveillance state'],
    regions: ['cn', 'us'],
    analysisContext: 'Modern surveillance technology creates the capability for the total population control described in Revelation. The ability to track every person\'s movements, transactions, and communications was inconceivable in John\'s time but is reality today.',
  },
  {
    id: 'image_beast',
    category: 'technology',
    theme: 'Image of the Beast — AI and Speaking Images',
    description: 'Artificial intelligence that can speak and make decisions, paralleling the "image of the beast" that could speak.',
    scriptures: [
      { book: 'Revelation', ref: '13:15', text: 'The second beast was given power to give breath to the image of the first beast, so that the image could speak and cause all who refused to worship the image to be killed.' },
      { book: 'Daniel', ref: '12:4', text: 'But you, Daniel, roll up and seal the words of the scroll until the time of the end. Many will go here and there to increase knowledge.' },
    ],
    keywords: ['artificial intelligence', 'ai', 'chatgpt', 'deep learning', 'machine learning', 'neural network', 'autonomous', 'robot', 'robotics', 'superintelligence', 'agi', 'ai regulation', 'ai takeover', 'deepfake', 'synthetic media', 'ai generated'],
    regions: [],
    analysisContext: 'Advances in artificial intelligence bring Revelation\'s prophecy of a speaking "image" closer to reality. AI systems that can reason, speak, and make autonomous decisions parallel the prophetic description of an image that was given "breath" to speak and exercise authority.',
  },
  {
    id: 'increase_knowledge',
    category: 'technology',
    theme: 'Increase in Knowledge',
    description: 'Daniel prophesied an explosion of knowledge and travel in the last days.',
    scriptures: [
      { book: 'Daniel', ref: '12:4', text: 'Many will go here and there to increase knowledge.' },
      { book: 'Nahum', ref: '2:4', text: 'The chariots storm through the streets, rushing back and forth through the squares. They look like flaming torches; they dart about like lightning.' },
    ],
    keywords: ['breakthrough', 'discovery', 'innovation', 'quantum computing', 'space travel', 'spacex', 'mars mission', 'technology advance', 'scientific breakthrough', 'genetic engineering', 'crispr', 'nanotechnology', 'fusion energy'],
    regions: [],
    analysisContext: 'This technological advancement fulfills Daniel\'s prophecy that knowledge would dramatically increase in the last days. The exponential growth of human knowledge and capability in our era is unprecedented in history.',
  },

  // ═══ SPIRITUAL SIGNS ═══
  {
    id: 'persecution',
    category: 'spiritual',
    theme: 'Persecution of Believers',
    description: 'Increasing persecution of Christians and people of faith worldwide.',
    scriptures: [
      { book: 'Matthew', ref: '24:9', text: 'Then you will be handed over to be persecuted and put to death, and you will be hated by all nations because of me.' },
      { book: 'Revelation', ref: '6:9-11', text: 'I saw under the altar the souls of those who had been slain because of the word of God and the testimony they had maintained.' },
      { book: '2 Timothy', ref: '3:12', text: 'Everyone who wants to live a godly life in Christ Jesus will be persecuted.' },
      { book: 'John', ref: '15:20', text: 'If they persecuted me, they will persecute you also.' },
    ],
    keywords: ['persecution', 'christian persecution', 'religious persecution', 'church attacked', 'faith under attack', 'blasphemy law', 'religious freedom', 'anti-christian', 'church burned', 'believers killed', 'religious minority'],
    regions: [],
    analysisContext: 'The persecution of believers fulfills Jesus\' direct prophecy that His followers would be "hated by all nations." The increasing hostility toward people of faith worldwide aligns precisely with this end-times sign.',
  },
  {
    id: 'false_prophets',
    category: 'spiritual',
    theme: 'False Prophets and Deception',
    description: 'The rise of false teachers, spiritual deception, and misleading ideologies.',
    scriptures: [
      { book: 'Matthew', ref: '24:11', text: 'Many false prophets will appear and deceive many people.' },
      { book: 'Matthew', ref: '24:24', text: 'For false messiahs and false prophets will appear and perform great signs and wonders to deceive, if possible, even the elect.' },
      { book: '2 Timothy', ref: '4:3-4', text: 'For the time will come when people will not put up with sound doctrine. Instead, they will gather around them teachers who say what their itching ears want to hear.' },
      { book: '2 Peter', ref: '2:1', text: 'There will be false teachers among you. They will secretly introduce destructive heresies.' },
    ],
    keywords: ['false prophet', 'cult', 'deception', 'misinformation', 'disinformation', 'propaganda', 'fake news', 'conspiracy', 'manipulation', 'brainwash', 'indoctrination'],
    regions: [],
    analysisContext: 'This aligns with Jesus\' warning about the proliferation of false prophets and deception in the last days. The unprecedented scale of misinformation and ideological manipulation in the modern era fulfills this prophecy.',
  },
  {
    id: 'apostasy',
    category: 'spiritual',
    theme: 'Great Apostasy — Falling Away',
    description: 'A great falling away from faith and moral standards in the last days.',
    scriptures: [
      { book: '2 Thessalonians', ref: '2:3', text: 'Don\'t let anyone deceive you in any way, for that day will not come until the rebellion occurs and the man of lawlessness is revealed.' },
      { book: '1 Timothy', ref: '4:1', text: 'The Spirit clearly says that in later times some will abandon the faith and follow deceiving spirits and things taught by demons.' },
      { book: 'Matthew', ref: '24:12', text: 'Because of the increase of wickedness, the love of most will grow cold.' },
      { book: '2 Timothy', ref: '3:1-5', text: 'In the last days... People will be lovers of themselves, lovers of money, boastful, proud, abusive... having a form of godliness but denying its power.' },
    ],
    keywords: ['church decline', 'faith decline', 'secularism', 'atheism', 'moral decline', 'godless', 'church closing', 'leaving church', 'post-christian', 'religious decline', 'spiritual decline'],
    regions: [],
    analysisContext: 'This trend of declining faith fulfills Paul\'s prophecy of a "great falling away" before the end. The increasing secularization and abandonment of traditional faith aligns with the prophetic timeline.',
  },
  {
    id: 'gospel_nations',
    category: 'spiritual',
    theme: 'Gospel to All Nations',
    description: 'The gospel reaching every nation, tribe, and language before the end comes.',
    scriptures: [
      { book: 'Matthew', ref: '24:14', text: 'And this gospel of the kingdom will be preached in the whole world as a testimony to all nations, and then the end will come.' },
      { book: 'Revelation', ref: '14:6', text: 'Then I saw another angel flying in midair, and he had the eternal gospel to proclaim to those who live on the earth — to every nation, tribe, language and people.' },
    ],
    keywords: ['missionary', 'evangelism', 'bible translation', 'unreached people', 'gospel', 'christian growth', 'revival', 'church growth'],
    regions: [],
    analysisContext: 'Jesus explicitly stated that the gospel must reach all nations before the end comes. Modern technology and missionary efforts have brought this closer to fulfillment than at any point in history.',
  },

  // ═══ COSMIC SIGNS ═══
  {
    id: 'signs_sky',
    category: 'cosmic',
    theme: 'Signs in the Heavens',
    description: 'Unusual celestial events including blood moons, eclipses, and cosmic phenomena.',
    scriptures: [
      { book: 'Joel', ref: '2:31', text: 'The sun will be turned to darkness and the moon to blood before the coming of the great and dreadful day of the Lord.' },
      { book: 'Luke', ref: '21:25-26', text: 'There will be signs in the sun, moon and stars. On the earth, nations will be in anguish and perplexity at the roaring and tossing of the sea.' },
      { book: 'Revelation', ref: '6:12-13', text: 'The sun turned black like sackcloth, the whole moon turned blood red, and the stars in the sky fell to earth.' },
      { book: 'Acts', ref: '2:20', text: 'The sun will be turned to darkness and the moon to blood before the coming of the great and glorious day of the Lord.' },
    ],
    keywords: ['blood moon', 'eclipse', 'solar eclipse', 'lunar eclipse', 'solar storm', 'solar flare', 'asteroid', 'meteor', 'comet', 'aurora', 'northern lights', 'geomagnetic', 'cosmic', 'supermoon'],
    regions: [],
    analysisContext: 'This celestial event aligns with the prophetic signs described by Joel and reiterated by Jesus — unusual events in the sun, moon, and stars that precede the Day of the Lord.',
  },
  {
    id: 'natural_disasters',
    category: 'natural',
    theme: 'Birth Pains — Natural Catastrophes',
    description: 'Increasing natural disasters described as "birth pains" — growing in frequency and intensity.',
    scriptures: [
      { book: 'Matthew', ref: '24:8', text: 'All these are the beginning of birth pains.' },
      { book: 'Romans', ref: '8:22', text: 'We know that the whole creation has been groaning as in the pains of childbirth right up to the present time.' },
      { book: 'Luke', ref: '21:25', text: 'On the earth, nations will be in anguish and perplexity at the roaring and tossing of the sea.' },
    ],
    keywords: ['hurricane', 'typhoon', 'cyclone', 'tornado', 'tsunami', 'volcano', 'eruption', 'wildfire', 'flood', 'flooding', 'landslide', 'avalanche', 'heat wave', 'extreme weather', 'climate disaster', 'natural disaster', 'catastrophe', 'devastation'],
    regions: [],
    analysisContext: 'Jesus described end-times signs as "birth pains" — increasing in frequency and intensity like labor contractions. The escalating pattern of natural disasters worldwide mirrors this prophetic description precisely.',
  },

  // ═══ PEACE & COVENANT ═══
  {
    id: 'false_peace',
    category: 'end_times_signs',
    theme: 'False Peace — Peace and Security',
    description: 'A false sense of peace and security before sudden destruction comes.',
    scriptures: [
      { book: '1 Thessalonians', ref: '5:3', text: 'While people are saying, "Peace and safety," destruction will come on them suddenly, as labor pains on a pregnant woman, and they will not escape.' },
      { book: 'Daniel', ref: '9:27', text: 'He will confirm a covenant with many for one "seven." In the middle of the "seven" he will put an end to sacrifice and offering.' },
      { book: 'Ezekiel', ref: '13:10', text: 'They lead my people astray, saying "Peace," when there is no peace.' },
    ],
    keywords: ['peace deal', 'peace treaty', 'peace accord', 'peace agreement', 'abraham accords', 'normalization', 'ceasefire agreement', 'peace process', 'two-state solution', 'peace plan', 'diplomatic solution'],
    regions: ['il', 'sa', 'ae'],
    analysisContext: 'Peace agreements in the Middle East carry prophetic significance. Daniel 9:27 describes a pivotal covenant that marks a critical point in the end-times timeline. The pursuit of peace in a region destined for conflict fulfills the prophetic pattern.',
  },
  {
    id: 'days_noah',
    category: 'end_times_signs',
    theme: 'As in the Days of Noah',
    description: 'Moral conditions paralleling the days before the flood — widespread wickedness and indifference.',
    scriptures: [
      { book: 'Matthew', ref: '24:37-39', text: 'As it was in the days of Noah, so it will be at the coming of the Son of Man. For in the days before the flood, people were eating and drinking, marrying and giving in marriage, up to the day Noah entered the ark.' },
      { book: 'Genesis', ref: '6:5', text: 'The Lord saw how great the wickedness of the human race had become on the earth, and that every inclination of the thoughts of the human heart was only evil all the time.' },
      { book: 'Luke', ref: '17:26-27', text: 'Just as it was in the days of Noah, so also will it be in the days of the Son of Man.' },
    ],
    keywords: ['moral decay', 'corruption', 'wickedness', 'lawlessness', 'crime wave', 'violence surge', 'drug crisis', 'opioid', 'human trafficking', 'exploitation', 'genetic modification', 'transhumanism', 'cloning'],
    regions: [],
    analysisContext: 'Jesus specifically compared the last days to the days of Noah — a time of moral corruption, violence, and spiritual indifference. Current societal trends mirror the conditions that preceded God\'s judgment in the flood.',
  },

  // ═══ NUCLEAR/FIRE ═══
  {
    id: 'nuclear_fire',
    category: 'end_times_signs',
    theme: 'Nuclear Fire — Elements Dissolved',
    description: 'Descriptions of devastation consistent with nuclear weapons or catastrophic fire.',
    scriptures: [
      { book: 'Zechariah', ref: '14:12', text: 'Their flesh will rot while they are still standing on their feet, their eyes will rot in their sockets, and their tongues will rot in their mouths.' },
      { book: '2 Peter', ref: '3:10', text: 'The heavens will disappear with a roar; the elements will be destroyed by fire, and the earth and everything done in it will be laid bare.' },
      { book: 'Revelation', ref: '8:7', text: 'The first angel sounded his trumpet, and there came hail and fire mixed with blood, and it was hurled down on the earth. A third of the earth was burned up.' },
    ],
    keywords: ['nuclear', 'atomic', 'nuclear weapon', 'nuclear threat', 'nuclear war', 'nuclear test', 'uranium enrichment', 'nuclear program', 'icbm', 'warhead', 'mushroom cloud', 'radiation', 'nuclear deterrent', 'nuclear arsenal'],
    regions: ['ir', 'ru', 'us', 'cn', 'kr'],
    analysisContext: 'Ancient prophets described scenes of destruction remarkably consistent with nuclear warfare — flesh dissolving instantly (Zechariah) and elements being destroyed by intense heat (2 Peter). Nuclear weapons technology makes these once-mysterious prophecies terrifyingly literal.',
  },
];

// ─── Related Themes Map ──────────────────────────────────────────────────────
const THEME_RELATIONS: Record<string, string[]> = {
  'wars_rumors': ['nation_against_nation', 'gog_magog', 'nuclear_fire', 'false_peace'],
  'nation_against_nation': ['wars_rumors', 'gog_magog', 'kings_east'],
  'famines': ['earthquakes', 'natural_disasters', 'babylon_falls'],
  'earthquakes': ['natural_disasters', 'famines', 'signs_sky'],
  'pestilence': ['famines', 'natural_disasters'],
  'israel_restored': ['jerusalem', 'gog_magog', 'false_peace', 'damascus'],
  'jerusalem': ['israel_restored', 'gog_magog', 'false_peace'],
  'gog_magog': ['israel_restored', 'wars_rumors', 'russia_iran_turkey', 'nuclear_fire'],
  'damascus': ['wars_rumors', 'israel_restored', 'gog_magog'],
  'kings_east': ['euphrates', 'nation_against_nation', 'nuclear_fire'],
  'euphrates': ['kings_east', 'natural_disasters'],
  'mark_beast': ['surveillance_state', 'one_world_economy', 'image_beast'],
  'babylon_falls': ['one_world_economy', 'mark_beast'],
  'one_world_economy': ['mark_beast', 'babylon_falls', 'surveillance_state'],
  'surveillance_state': ['mark_beast', 'image_beast', 'one_world_economy'],
  'image_beast': ['increase_knowledge', 'surveillance_state', 'mark_beast'],
  'increase_knowledge': ['image_beast'],
  'persecution': ['apostasy', 'false_prophets'],
  'false_prophets': ['apostasy', 'persecution'],
  'apostasy': ['false_prophets', 'persecution', 'days_noah'],
  'gospel_nations': [],
  'signs_sky': ['natural_disasters', 'earthquakes'],
  'natural_disasters': ['earthquakes', 'signs_sky', 'famines'],
  'false_peace': ['israel_restored', 'jerusalem', 'wars_rumors'],
  'days_noah': ['apostasy', 'false_prophets'],
  'nuclear_fire': ['wars_rumors', 'gog_magog', 'kings_east'],
  'egypt_prophecy': ['gog_magog', 'israel_restored'],
};

// ─── Analysis Engine ─────────────────────────────────────────────────────────

// Generic single-word keywords that need a SECOND confirming keyword to count
const GENERIC_KEYWORDS = new Set([
  'war', 'wars', 'china', 'ai', 'iran', 'russia', 'turkey', 'egypt', 'syria',
  'church', 'faith', 'flood', 'dam', 'threat', 'alliance', 'sanctions',
  'tracking', 'privacy', 'robot', 'breakthrough', 'discovery', 'innovation',
  'cult', 'propaganda', 'corruption', 'crime wave', 'violence surge',
  'flood', 'flooding', 'hurricane', 'tornado', 'volcano', 'wildfire',
  'drone strike', 'combat', 'offensive', 'troops deployed',
]);

// High-specificity keywords that alone are enough to trigger a match
const HIGH_SPECIFICITY = new Set([
  'armageddon', 'gog', 'magog', 'euphrates', 'temple mount', 'mark of the beast',
  'blood moon', 'abomination', 'antichrist', 'tribulation', 'rapture', 'second coming',
  'jerusalem', 'prophecy', 'prophetic', 'biblical', 'end times', 'last days',
  'peace treaty', 'one world', 'global currency', 'cashless society', 'digital id',
  'social credit', 'cbdc', 'chip implant', 'microchip', 'neuralink',
  'persecution of christians', 'israel', 'israeli', 'idf', 'gaza', 'hamas', 'hezbollah',
  'nuclear weapon', 'nuclear war', 'nuclear threat', 'uranium enrichment',
  'nation against nation', 'false prophet', 'pestilence', 'famine',
  'economic collapse', 'hyperinflation', 'food shortage', 'water crisis',
  'damascus', 'babylon', 'asteroid', 'solar flare',
]);

export function analyzeArticle(title: string, description: string): ProphecyMatch[] {
  const text = `${title} ${description}`.toLowerCase();
  const matches: ProphecyMatch[] = [];

  for (const theme of PROPHECY_THEMES) {
    const matchedKeywords: string[] = [];
    let hasHighSpecificity = false;
    for (const kw of theme.keywords) {
      if (text.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
        if (HIGH_SPECIFICITY.has(kw.toLowerCase())) hasHighSpecificity = true;
      }
    }
    if (matchedKeywords.length === 0) continue;

    // FILTER: require either a high-specificity keyword OR at least 2 keyword matches
    // This prevents generic single-word matches like "china" or "ai" alone
    const allGeneric = matchedKeywords.every(kw => GENERIC_KEYWORDS.has(kw.toLowerCase()));
    if (matchedKeywords.length === 1 && !hasHighSpecificity && allGeneric) continue;

    // Calculate relevance score (0-100)
    const keywordRatio = matchedKeywords.length / theme.keywords.length;
    const uniqueKeywords = matchedKeywords.length;
    const baseScore = hasHighSpecificity
      ? (uniqueKeywords >= 3 ? 90 : uniqueKeywords >= 2 ? 75 : 60)
      : (uniqueKeywords >= 3 ? 75 : uniqueKeywords >= 2 ? 55 : 35);
    const relevanceScore = Math.min(100, Math.round(baseScore + (keywordRatio * 20)));

    // Generate contextual analysis
    const analysis = generateAnalysis(theme, matchedKeywords, title);

    matches.push({
      themeId: theme.id,
      theme: theme.theme,
      category: theme.category,
      relevanceScore,
      matchedKeywords,
      scriptures: theme.scriptures,
      analysis,
      relatedThemes: THEME_RELATIONS[theme.id] || [],
    });
  }

  // Sort by relevance score descending
  matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return matches;
}

function generateAnalysis(theme: ProphecyTheme, matchedKeywords: string[], title: string): string {
  const keywordList = matchedKeywords.slice(0, 3).join(', ');
  const primaryScripture = theme.scriptures[0];
  return `${theme.analysisContext}\n\nKey indicators: ${keywordList}. Primary reference: ${primaryScripture.book} ${primaryScripture.ref}.`;
}

// ─── Batch Analysis for Multiple Articles ────────────────────────────────────

export interface ProphecyIntelReport {
  themeSummaries: Array<{
    theme: ProphecyTheme;
    articleCount: number;
    topArticles: Array<{ title: string; url: string; relevanceScore: number; matchedKeywords: string[] }>;
    averageRelevance: number;
  }>;
  totalProphecyArticles: number;
  highRelevanceCount: number;
  activeThemes: number;
  topScriptures: Array<{ scripture: Scripture; occurrences: number }>;
}

export function generateProphecyReport(
  articles: Array<{ title: string; description: string; url: string }>
): ProphecyIntelReport {
  const themeMap = new Map<string, {
    theme: ProphecyTheme;
    articles: Array<{ title: string; url: string; relevanceScore: number; matchedKeywords: string[] }>;
  }>();
  const scriptureCount = new Map<string, { scripture: Scripture; count: number }>();
  let totalProphecyArticles = 0;
  let highRelevanceCount = 0;

  for (const article of articles) {
    const matches = analyzeArticle(article.title, article.description || '');
    if (matches.length === 0) continue;
    totalProphecyArticles++;

    for (const match of matches) {
      if (match.relevanceScore >= 70) highRelevanceCount++;

      if (!themeMap.has(match.themeId)) {
        const theme = PROPHECY_THEMES.find(t => t.id === match.themeId)!;
        themeMap.set(match.themeId, { theme, articles: [] });
      }
      themeMap.get(match.themeId)!.articles.push({
        title: article.title,
        url: article.url,
        relevanceScore: match.relevanceScore,
        matchedKeywords: match.matchedKeywords,
      });

      for (const s of match.scriptures) {
        const key = `${s.book} ${s.ref}`;
        if (!scriptureCount.has(key)) scriptureCount.set(key, { scripture: s, count: 0 });
        scriptureCount.get(key)!.count++;
      }
    }
  }

  const themeSummaries = Array.from(themeMap.values())
    .map(({ theme, articles }) => ({
      theme,
      articleCount: articles.length,
      topArticles: articles.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5),
      averageRelevance: Math.round(articles.reduce((sum, a) => sum + a.relevanceScore, 0) / articles.length),
    }))
    .sort((a, b) => b.articleCount - a.articleCount);

  const topScriptures = Array.from(scriptureCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ scripture, count }) => ({ scripture, occurrences: count }));

  return {
    themeSummaries,
    totalProphecyArticles,
    highRelevanceCount,
    activeThemes: themeSummaries.length,
    topScriptures,
  };
}
