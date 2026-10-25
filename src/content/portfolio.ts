/**
 * ============================================================================
 *  THE DOSSIER: all site content lives here.
 * ============================================================================
 *  Edit this file to change any text on the site. Nothing else needs to change.
 *  Shape is enforced by ./schema.ts; `npm test` will tell you if something is
 *  malformed (bad URL, severity out of range, unknown skill in a project, etc).
 *
 *  Values marked PLACEHOLDER are guesses that still need your review.
 *
 *  Lore mapping (real -> in-universe):
 *    university    -> home planet, courses -> its moons
 *    internships   -> criminal charges (each at a planet = real city)
 *    leadership    -> "inciting organized rebellion" charges
 *    projects      -> rebel propaganda
 *    skills        -> known associates
 * ============================================================================
 */
import type { Portfolio } from './schema';
import { withGitHub } from './github';

export const portfolio: Portfolio = {
  identity: {
    name: 'Lihi Ancikovsky',
    alias: 'The Hokie Ghost',
    tagline: 'Full-stack engineer. AI researcher. Hardest target in the Outer Rim.',
    portrait: null, // e.g. '/images/portrait.jpg' (shown in the wanted poster photo slot)
    scanModel: null, // e.g. '/models/me.glb' (a 3D scan, shown as the jittery blue wanted hologram)
    bio: [
      'Computer Science senior at Virginia Tech specializing in Data-Centric Computing, with a minor in Mathematics.',
      'I build full-stack software and AI systems: mission-planning tools for the Navy, multi-agent reinforcement learning for missile defense, and statistical analysis that tripled a production yield.',
      'I also lead HackViolet and Girls Who Code at Virginia Tech. Off-duty: guitar, hackathons, and far too many Star Wars rewatches.',
    ],
    traits: [
      { label: 'Homeworld', value: 'Virginia Tech, Blacksburg' },
      { label: 'Specialty', value: 'Full-stack systems, machine learning, data analysis' },
      { label: 'Clearance', value: 'Active Secret' },
      { label: 'Known weakness', value: 'Cannot resist a hackathon' },
      { label: 'Off-duty', value: 'Guitar, cantina sessions, Star Wars marathons' },
      { label: 'Status', value: 'Seeking roles for Summer 2027' },
    ],
    reward: { amount: 1_000_000, terms: 'Wanted alive. Preferably employed.' },
    wantedFor: 'Building impressive software across multiple star systems',
    lastSeen: 'Blacksburg Sector, Virginia System',
  },

  education: {
    school: 'Virginia Tech',
    degree: 'B.S. in Computer Science',
    specialization: 'Data-Centric Computing',
    minor: 'Mathematics',
    start: 'Aug 2023',
    end: 'May 2027', // PLACEHOLDER: confirm graduation date
    gpa: '3.74 in major',
    honors: ["Dean's List: Spring 2024, Spring 2025, Fall 2025, Spring 2026"],
    planet: {
      name: 'Virginia Tech',
      realLocation: 'Blacksburg, VA',
      coords: 'Blacksburg Sector, Virginia System, Outer Rim',
      color: '#c0573a',
      position: [-0.55, 0.15],
      lore: 'A hilly world of limestone citadels and maroon-and-orange dusk skies on the edge of the Blue Ridge Expanse. Its academy trains the galaxy’s most stubborn engineers, forged in long winters and longer problem sets.',
    },
    // PLACEHOLDER: swap in the courses you actually took.
    courses: [
      {
        code: 'CS 3114',
        title: 'Data Structures & Algorithms',
        moonName: 'Data Structures & Algorithms',
        blurb: 'Trees, graphs, hashing, and the art of making things fast.',
      },
      {
        code: 'CS 3214',
        title: 'Computer Systems',
        moonName: 'Computer Systems',
        blurb: 'Processes, threads, memory, and building a shell from scratch.',
      },
      {
        code: 'CS 4604',
        title: 'Database Management Systems',
        moonName: 'Database Management Systems',
        blurb: 'Relational design, SQL, indexing, and query optimization.',
      },
      {
        code: 'CS 3654',
        title: 'Data Analytics & Visualization',
        moonName: 'Data Analytics & Visualization',
        blurb: 'From raw data to insight: pipelines, stats, and visual storytelling.',
      },
      {
        code: 'CS 4824',
        title: 'Machine Learning',
        moonName: 'Machine Learning',
        blurb: 'Supervised and unsupervised learning, from linear models to neural nets.',
      },
      {
        code: 'MATH 2114',
        title: 'Linear Algebra',
        moonName: 'Linear Algebra',
        blurb: 'Vector spaces, transformations, and the math under every model.',
      },
    ],
  },

  charges: [
    {
      id: 'nswc',
      kind: 'internship',
      org: 'Naval Surface Warfare Center Dahlgren Division',
      shortOrg: 'NSWC Dahlgren',
      role: 'Software Engineering Intern',
      start: 'Jun 2026',
      end: 'Aug 2026',
      realLocation: 'Dahlgren, VA',
      planet: {
        name: 'NSWC Dahlgren',
        coords: 'Potomac Reach, Virginia System',
        color: '#3fa7d6',
        position: [0.15, 0.55],
        lore: 'A fortified naval world on the banks of the Potomac Reach, where the fleet plans its missions.',
      },
      chargeTitle: 'Unauthorized modernization of fleet mission-planning systems',
      evidence: [
        'Owned a full-stack feature end to end, turning a hidden multi-step manual process into a one-click, near-instant workflow (Angular/TypeScript frontend; controller, business, and repository layers in a RabbitMQ-based microservices architecture)',
        'Engineered Angular interfaces backed by SQL and Elasticsearch, with RxJS async data pipelines, lazy loading, and secure routing',
        'Expanded the feature beyond its original scope with the product owner, and presented progress to the department and engineering leadership',
        'Shipped with 100% unit test coverage and rigorous code review, deployed on Kubernetes/Docker',
      ],
      severity: 5,
    },
    {
      id: 'hume',
      kind: 'internship',
      org: 'Hume Center for National Security and Technology, Virginia Tech',
      shortOrg: 'Hume Center',
      role: 'Artificial Intelligence Researcher',
      start: 'Sep 2025',
      end: 'Present',
      realLocation: 'Blacksburg, VA',
      planet: {
        name: 'Hume Center',
        coords: 'Blacksburg Sector, orbiting Virginia Tech',
        color: '#7bd389',
        position: [-0.3, -0.4],
        lore: 'A research outpost where the academy develops the galaxy’s planetary-defense systems.',
      },
      chargeTitle: 'Training autonomous droid squadrons in planetary defense',
      evidence: [
        'Build and train AI models for missile defense, using JaxMARL for multi-agent reinforcement learning across distributed defense scenarios',
        'Design interpretable metrics for accuracy, resource efficiency, and stability; produce leaderboards, plots, and tables for sponsor reporting',
        'Presented the poster “Multi-Agent Reinforcement Learning for Distributed Missile Defense” at the Hume Center Colloquium (April 2026)',
      ],
      severity: 5,
    },
    {
      id: 'neocis',
      kind: 'internship',
      org: 'Neocis',
      role: 'Data Science Intern, Manufacturing',
      start: 'Jul 2025',
      end: 'Aug 2025',
      realLocation: 'Miami, FL',
      planet: {
        name: 'Neocis',
        coords: 'Biscayne Expanse, Florida System',
        color: '#e0b04a',
        position: [0.6, -0.15],
        lore: 'A humid coastal world famous for its surgical-droid foundries.',
      },
      chargeTitle: 'Sabotaging inefficiency on a surgical-droid assembly line',
      evidence: [
        'Led an investigation into low component-pairing yield for a robotic dental surgery system, where only 15% of drill head/body parts paired successfully',
        'Worked with manufacturing, QA, software, and systems teams on statistical testing in Python and JMP, tracing the shortfall to a misinterpreted threshold parameter',
        'Presented the root cause to engineering leadership and won approval for a corrected value, raising valid pairing from 15% to 50% and cutting inventory waste',
      ],
      severity: 4,
    },
    {
      id: 'hackviolet',
      kind: 'leadership',
      org: 'HackViolet, Virginia Tech',
      role: 'Executive Director',
      start: 'Feb 2025',
      end: 'Present',
      realLocation: 'Blacksburg, VA',
      planet: {
        name: 'HackViolet',
        coords: 'Blacksburg Sector, Virginia System',
        color: '#c0573a',
        position: [-0.55, 0.15],
        lore: 'Home base of the cell.',
      },
      chargeTitle: 'Inciting organized rebellion: a 500-strong hacker uprising',
      evidence: [
        'Executive Director (May 2026–present), previously Judging Chair, Peer Mentor, and hackathon winner',
        'Lead hackathon operations on a $15K+ budget, projecting 30% higher sponsorship revenue and growth to 500+ participants',
        'Build the executive board and cultivate sponsor, university, and partner relationships',
        'Overhauled the judging platform and introduced new prize categories for efficiency and fairness',
      ],
      severity: 5,
    },
    {
      id: 'gwc',
      kind: 'leadership',
      org: 'Girls Who Code, Virginia Tech',
      role: 'President',
      start: 'Aug 2023',
      end: 'Present',
      realLocation: 'Blacksburg, VA',
      planet: {
        name: 'Girls Who Code',
        coords: 'Blacksburg Sector, Virginia System',
        color: '#c0573a',
        position: [-0.55, 0.15],
        lore: 'Home base of the cell.',
      },
      chargeTitle: 'Recruiting and training a new generation of insurgents',
      evidence: [
        'President (May 2026–present), previously Vice President, Treasurer, and Mentor',
        'Run weekly meetings and workshops for 30+ regular members; maintain the club website and email list',
        'Managed the club budget and sponsorships as Treasurer; mentored peers on coding and careers',
      ],
      severity: 4,
    },
  ],

  // PLACEHOLDER: `level` (1-5) and `years` are estimates; tune them.
  associates: [
    // 501st Language Battalion: languages
    {
      skill: 'Java',
      callsign: 'General Java',
      archetype: 'jedi',
      rank: 'Jedi General',
      unit: '501st Language Battalion',
      level: 5,
      years: 3,
      note: 'Commands the battalion. Strict, verbose, unbeatable in a long campaign.',
      accent: '#f2c14e',
    },
    {
      skill: 'Python',
      callsign: 'CT-PY “Python”',
      archetype: 'trooper',
      rank: 'Clone Commander',
      unit: '501st Language Battalion',
      level: 5,
      years: 3,
      note: 'The target’s most trusted soldier. Handles everything from scripting to deep learning.',
      accent: '#3fa7d6',
    },
    {
      skill: 'TypeScript',
      callsign: 'ARC-TS “Types”',
      archetype: 'trooper',
      rank: 'ARC Trooper',
      unit: '501st Language Battalion',
      level: 4,
      years: 2,
      note: 'Elite recon. Catches ambushes before they happen.',
      accent: '#4d7cfe',
    },
    {
      skill: 'JavaScript',
      callsign: 'CT-JS “Script”',
      archetype: 'trooper',
      rank: 'Trooper',
      unit: '501st Language Battalion',
      level: 4,
      years: 3,
      note: 'Gets deployed everywhere. Occasionally coerces orders into strings.',
      accent: '#f0db4f',
    },
    {
      skill: 'C',
      callsign: 'CT-C99 “Pointer”',
      archetype: 'trooper',
      rank: 'Heavy Trooper',
      unit: '501st Language Battalion',
      level: 4,
      years: 2,
      note: 'Close-quarters specialist. Handles memory by hand.',
      accent: '#a0a0a0',
    },
    {
      skill: 'C++',
      callsign: 'CT-CPP “Templar”',
      archetype: 'trooper',
      rank: 'Sergeant',
      unit: '501st Language Battalion',
      level: 3,
      years: 2,
      note: 'Powerful, unpredictable, occasionally takes 40 minutes to compile.',
      accent: '#d9534f',
    },
    {
      skill: 'C#',
      callsign: 'CT-CS “Sharp”',
      archetype: 'trooper',
      rank: 'Marksman',
      unit: '501st Language Battalion',
      level: 3,
      years: 1,
      note: 'Precise and disciplined. Trained in a different academy.',
      accent: '#9b4f96',
    },
    {
      skill: 'Rust',
      callsign: 'CT-RS “Oxide”',
      archetype: 'trooper',
      rank: 'Recruit',
      unit: '501st Language Battalion',
      level: 2,
      years: 1,
      note: 'Borrow-checks every order before following it.',
      accent: '#ce422b',
    },
    // Droid Pool: data stores and messaging
    {
      skill: 'SQL',
      callsign: 'R-SQL',
      archetype: 'droid',
      rank: 'Astromech',
      unit: 'Droid Pool',
      level: 4,
      years: 3,
      note: 'Slices into any data vault. Speaks fluent JOIN.',
      accent: '#3fa7d6',
    },
    {
      skill: 'Elasticsearch',
      callsign: 'ES-9 “Seeker”',
      archetype: 'droid',
      rank: 'Probe Droid',
      unit: 'Droid Pool',
      level: 3,
      years: 1,
      note: 'Finds anything, anywhere in the galaxy, in milliseconds.',
      accent: '#00bfb3',
    },
    {
      skill: 'RabbitMQ',
      callsign: 'MQ-7 “Courier”',
      archetype: 'droid',
      rank: 'Courier Droid',
      unit: 'Droid Pool',
      level: 3,
      years: 1,
      note: 'Delivers every message. Exactly once, if you ask nicely.',
      accent: '#ff6600',
    },
    {
      skill: 'MongoDB',
      callsign: 'MG-DB',
      archetype: 'droid',
      rank: 'Archive Droid',
      unit: 'Droid Pool',
      level: 3,
      years: 1,
      note: 'Keeps records in whatever shape they arrive.',
      accent: '#47a248',
    },
    // Smugglers & Mercs: frameworks and tools
    {
      skill: 'React',
      callsign: '“Hooks” Varro',
      archetype: 'smuggler',
      rank: 'Smuggler Captain',
      unit: 'Smugglers & Mercs',
      level: 4,
      years: 2,
      note: 'Fast ship, faster renders. Re-renders only when necessary.',
      accent: '#61dafb',
    },
    {
      skill: 'Angular',
      callsign: 'Commander Ng',
      archetype: 'merc',
      rank: 'Mercenary Officer',
      unit: 'Smugglers & Mercs',
      level: 4,
      years: 1,
      note: 'Runs a disciplined outfit. Everything injected, nothing left to chance.',
      accent: '#dd0031',
    },
    {
      skill: 'RxJS',
      callsign: 'Streamer Oss',
      archetype: 'alien',
      rank: 'Signal Smuggler',
      unit: 'Smugglers & Mercs',
      level: 3,
      years: 1,
      note: 'Moves cargo in observable streams. Never forgets to unsubscribe.',
      accent: '#b7178c',
    },
    {
      skill: 'Flask',
      callsign: '“Flask” Dorrin',
      archetype: 'smuggler',
      rank: 'Runner',
      unit: 'Smugglers & Mercs',
      level: 4,
      years: 2,
      note: 'Light, quick, and gets an API off the ground in minutes.',
      accent: '#cccccc',
    },
    {
      skill: 'Git',
      callsign: '“Branch” Korro',
      archetype: 'smuggler',
      rank: 'Smuggler',
      unit: 'Smugglers & Mercs',
      level: 5,
      years: 3,
      note: 'Can rewrite history. Usually chooses not to.',
      accent: '#f05033',
    },
    {
      skill: 'Docker',
      callsign: 'Kael the Container',
      archetype: 'merc',
      rank: 'Mercenary',
      unit: 'Smugglers & Mercs',
      level: 3,
      years: 1,
      note: 'Armored, portable, works the same on every planet.',
      accent: '#2496ed',
    },
    {
      skill: 'Kubernetes',
      callsign: 'Helmsman Kubo',
      archetype: 'merc',
      rank: 'Fleet Helmsman',
      unit: 'Smugglers & Mercs',
      level: 2,
      years: 1,
      note: 'Steers a fleet of containers. Restarts anyone who falls.',
      accent: '#326ce5',
    },
    {
      skill: 'AWS',
      callsign: 'Cloud Broker Sorn',
      archetype: 'alien',
      rank: 'Information Broker',
      unit: 'Smugglers & Mercs',
      level: 3,
      years: 1,
      note: 'Controls a vast network. Charges by the hour.',
      accent: '#ff9900',
    },
    // Data Division: data science and ML
    {
      skill: 'PyTorch',
      callsign: 'Torch-Mage Pyra',
      archetype: 'alien',
      rank: 'Neural Adept',
      unit: 'Data Division',
      level: 4,
      years: 2,
      note: 'Bends gradients at will. Backpropagates on instinct.',
      accent: '#ee4c2c',
    },
    {
      skill: 'NumPy',
      callsign: 'Vexa of the Arrays',
      archetype: 'alien',
      rank: 'Mathematician',
      unit: 'Data Division',
      level: 4,
      years: 3,
      note: 'Thinks in n dimensions. Vectorizes everything.',
      accent: '#4dabcf',
    },
    {
      skill: 'pandas',
      callsign: 'PD-4 “Panda”',
      archetype: 'droid',
      rank: 'Protocol Droid',
      unit: 'Data Division',
      level: 4,
      years: 3,
      note: 'Fluent in over six million data formats.',
      accent: '#e0b04a',
    },
    {
      skill: 'scikit-learn',
      callsign: 'Oracle Sk’lern',
      archetype: 'alien',
      rank: 'Seer',
      unit: 'Data Division',
      level: 4,
      years: 2,
      note: 'Predicts the future, within a confidence interval.',
      accent: '#f7931e',
    },
    {
      skill: 'OpenCV',
      callsign: 'Optic Scout Vey',
      archetype: 'merc',
      rank: 'Recon Sniper',
      unit: 'Data Division',
      level: 3,
      years: 1,
      note: 'Sees every gesture, every landmark, every frame.',
      accent: '#5c3ee8',
    },
  ],

  propaganda: [
    {
      id: 'cookie-crumblr',
      title: 'Cookie Crumblr',
      slogan: 'THEY TRACK. WE SCRAMBLE.',
      oneLiner:
        'Firefox extension that classifies tracking cookies in real time and scrambles the harmful ones. Hackathon winner, 2nd overall.',
      description: [
        'Classifies cookies in real time with a trained K-Nearest Neighbors model (k=11) and automatically scrambles harmful tracking cookies while preserving their size and encoding.',
        'A full-stack pipeline connects the extension to an AWS-hosted classification backend, with a React dashboard for cookie status, safety metrics, and user controls.',
      ],
      stack: ['Python', 'JavaScript', 'React', 'AWS', 'scikit-learn'],
      role: 'Hackathon team, Mar 2026',
      links: [{ label: 'Source', href: 'https://github.com/dsahero/cookie_crumblr' }],
      media: [],
      bountyValue: 250_000,
      posterStyle: 'starburst',
      posterPalette: 'rust',
      classified: false,
    },
    {
      id: 'speakeasy',
      title: 'SpeakEasy',
      slogan: 'EVERY REBEL NEEDS A VOICE.',
      oneLiner:
        'AI public-speaking coach that analyzes video for pacing, clarity, gestures, and tone. Hackathon winner among 115+ teams.',
      description: [
        'A multi-modal deep learning pipeline fuses audio (prosody, MFCCs, filler-word detection) and video (facial landmarks, gesture tracking) to give feedback on delivery.',
        'REST API with a React front end for upload, live recording, and an interactive results dashboard, using Whisper, Gemini, and YouTube APIs for transcripts and reference retrieval.',
      ],
      stack: ['Python', 'PyTorch', 'Flask', 'React', 'OpenCV', 'NumPy'],
      role: 'Hackathon team, Sep 2025',
      links: [{ label: 'Source', href: 'https://github.com/dsahero/speak_easy' }],
      media: [],
      bountyValue: 220_000,
      posterStyle: 'diagonal',
      posterPalette: 'navy',
      classified: false,
    },
    {
      id: 'cockpit',
      title: 'Bounty Hunter Cockpit',
      slogan: 'YOU ARE HERE.',
      oneLiner: 'This site: a cinematic WebGL portfolio built with React Three Fiber.',
      description: [
        'A first-person cockpit experience with procedural 3D models, synthesized audio, and a fully accessible plain-text fallback.',
        'Every section is driven by one typed content file.',
      ],
      stack: ['TypeScript', 'React', 'Git'],
      role: 'Solo project',
      links: [{ label: 'Source', href: 'https://github.com/dsahero/bountyhunter' }],
      media: [],
      bountyValue: 300_000,
      posterStyle: 'silhouette',
      posterPalette: 'parchment',
      classified: false,
    },
    {
      id: 'dietre',
      title: 'DietRe',
      slogan: 'NO GUEST LEFT HUNGRY.',
      oneLiner:
        'Catering-decision tool: ranks nearby restaurants whose actual menus can safely feed every guest at an event.',
      description: [
        'A Gemini-powered intake concierge collects allergies, religious restrictions, and preferences in plain language, catches contradictions, and resolves everything down to the ingredient level ("no whey" and "lactose intolerant" are the same signal).',
        'Menus are ingested automatically through progressively heavier strategies (Cheerio, a headless Puppeteer browser, Firecrawl, then PDF extraction), parsed into dishes and ingredients, and ranked by coverage with a Bayesian preference model and an explicit confidence score.',
        'Host dashboard with ranked cards and per-guest reasons, a Leaflet map, shortlists, co-organizer sharing, and a QR link for guest intake.',
      ],
      stack: ['TypeScript', 'React', 'MongoDB', 'JavaScript'],
      role: 'Team project, 2026', // PLACEHOLDER: confirm role and date
      links: [
        { label: 'Live site', href: 'https://dietre.us' },
        { label: 'Source', href: 'https://github.com/dsahero/dietre' },
      ],
      media: [
        {
          src: '/media/dietre.mp4',
          still: '/media/dietre.jpg',
          alt: 'The DietRe site: “a smarter way to cater”, scrolling through its features.',
        },
      ],
      bountyValue: 280_000,
      posterStyle: 'planet',
      posterPalette: 'jungle',
      classified: false,
    },
    {
      id: 'simplystocked',
      title: 'SimplyStocked',
      slogan: 'EVERY CRATE ACCOUNTED FOR.',
      oneLiner: 'Inventory management system for The Market of Virginia Tech.',
      description: [
        'A React + TypeScript front end (Vite, charts, Google sign-in, Gemini-assisted features) over a FastAPI backend with SQLAlchemy and MySQL.',
        'Tracks stock for the campus market, with an interactive API and invoice handling.',
      ],
      stack: ['TypeScript', 'React', 'Python', 'SQL', 'Docker'],
      role: 'Team project, 2026', // PLACEHOLDER: confirm role and date
      links: [{ label: 'Source', href: 'https://github.com/dsahero/simplystocked' }],
      media: [],
      bountyValue: 200_000,
      posterStyle: 'halftone',
      posterPalette: 'sand',
      classified: false,
    },
    {
      id: 'studyscout',
      title: 'StudyScout @ VT',
      slogan: 'NO REBEL STUDIES ALONE.',
      oneLiner:
        'HackViolet project that connects study partners: create a study session, others join.',
      description: [
        'Students post study sessions that others can browse and join; sessions are stored in MongoDB.',
        'Built at HackViolet with Sriram Pasupunuti and Mitchell Gallehr.',
      ],
      stack: ['Python', 'MongoDB'],
      role: 'HackViolet team, 2025',
      links: [{ label: 'Source', href: 'https://github.com/dsahero/studyscout' }],
      media: [],
      bountyValue: 120_000,
      posterStyle: 'emblem',
      posterPalette: 'violet',
      classified: false,
    },
    {
      id: 'hokies-way-home',
      title: "Hokies' Way Home",
      slogan: 'FIND YOUR HOME AWAY FROM HOME.',
      oneLiner:
        'A student-housing finder for Blacksburg: listings with prices, amenities, and distance to campus.',
      description: [
        'A Flask web app for comparing off-campus housing: bed/bath counts, prices, utilities, amenities, and bus-stop and campus distances, with accounts and saved places.',
        'Hackathon team project with Ivanna, Delara, and Carter.',
      ],
      stack: ['Python', 'Flask'],
      role: 'Hackathon team, Sep 2024',
      links: [{ label: 'Source', href: 'https://github.com/dsahero/hokiesWayHome' }],
      media: [],
      bountyValue: 90_000,
      posterStyle: 'ship',
      posterPalette: 'crimson',
      classified: false,
    },
    {
      id: 'classified',
      title: 'Defense Terminal',
      slogan: 'HOLD THE LINE. CLEAR THE HOLD.',
      oneLiner: 'Three minigames hidden inside this portfolio, and you just beat them.',
      description: [
        'The easter egg you just survived: a firewall code-match puzzle, a typing defense against incoming torpedoes, and a falling-block cargo stacker, all running on the cockpit console.',
        'Each game is plain TypeScript logic (unit-tested, no browser needed) drawn into a canvas texture on the 3D screen, with full keyboard play and a skip option for accessibility.',
      ],
      stack: ['TypeScript', 'React', 'Git'],
      role: 'Solo: design and code',
      links: [],
      media: [],
      bountyValue: 999_999,
      posterStyle: 'target',
      posterPalette: 'neon',
      classified: true,
    },
  ],

  contact: {
    email: 'lihia@vt.edu',
    github: 'https://github.com/dsahero',
    linkedin: 'https://www.linkedin.com/in/lihi-ancikovsky',
    other: [],
  },

  resume: { pdf: '/resume.pdf', updated: 'Oct 2026' },

  /**
   * The recruiter briefing (/recruiter): a fast, no-intro page built for a
   * 60-second scan. Every number below comes from a line on the resume.
   */
  recruiter: {
    headline: 'Software engineer: full-stack systems and applied machine learning',
    status: 'Seeking Summer 2027 software engineering roles', // PLACEHOLDER: confirm
    availability: 'Available Summer 2027 · B.S. expected May 2027', // PLACEHOLDER: confirm
    location: 'Blacksburg, VA · open to relocation', // PLACEHOLDER: confirm relocation
    authorization: 'Active Secret clearance',
    pitch: [
      'Computer Science senior at Virginia Tech (Data-Centric Computing, Math minor) who ships production software and research-grade ML.',
      'At NSWC Dahlgren I owned a full-stack feature end to end; at Neocis I traced a manufacturing yield problem to its root cause; at the Hume Center I train multi-agent RL models for missile defense.',
      'I also run HackViolet, Virginia Tech’s 500+ person hackathon.',
    ],
    highlights: [
      {
        value: '15%→50%',
        label: 'Production yield',
        detail:
          'Found the misread threshold behind a robotic-surgery part shortfall at Neocis; the fix more than tripled valid pairing.',
      },
      {
        value: '1 click',
        label: 'Manual process, automated',
        detail:
          'Turned a hidden multi-step process into a near-instant workflow at NSWC Dahlgren, with 100% unit test coverage.',
      },
      {
        value: '500+',
        label: 'Hackers led',
        detail:
          'Executive Director of HackViolet: $15K+ budget, sponsors, judging, and a growing board.',
      },
      {
        value: '115+',
        label: 'Teams beaten',
        detail: 'SpeakEasy, an AI public-speaking coach, won among 115+ teams.',
      },
      {
        value: '3.74',
        label: 'Major GPA',
        detail: 'Dean’s List four semesters running.',
      },
      {
        value: 'Secret',
        label: 'Active clearance',
        detail: 'Ready for defense and national-security work.',
      },
    ],
    focusAreas: [
      {
        id: 'fullstack',
        label: 'Full-stack',
        skills: [
          'TypeScript',
          'JavaScript',
          'React',
          'Angular',
          'RxJS',
          'Java',
          'SQL',
          'Flask',
          'MongoDB',
          'Elasticsearch',
        ],
        keywords: ['full-stack', 'frontend', 'microservices', 'interfaces', 'web', 'extension'],
      },
      {
        id: 'ml',
        label: 'ML / AI',
        skills: ['Python', 'PyTorch', 'scikit-learn', 'NumPy', 'pandas', 'OpenCV'],
        keywords: [
          'machine learning',
          'reinforcement learning',
          'AI',
          'model',
          'deep learning',
          'K-Nearest',
          'Gemini',
          'Whisper',
        ],
      },
      {
        id: 'data',
        label: 'Data',
        skills: ['Python', 'SQL', 'pandas', 'NumPy', 'Elasticsearch', 'MongoDB'],
        keywords: ['statistical', 'analysis', 'metrics', 'yield', 'data', 'JMP', 'leaderboards'],
      },
      {
        id: 'platform',
        label: 'Systems & DevOps',
        skills: ['C', 'C++', 'C#', 'Rust', 'Docker', 'Kubernetes', 'AWS', 'RabbitMQ', 'Git'],
        keywords: ['Kubernetes', 'Docker', 'deployed', 'architecture', 'backend', 'distributed'],
      },
    ],
    awards: [
      'SpeakEasy: hackathon winner among 115+ teams (Sep 2025)',
      'Cookie Crumblr: 2nd overall (Mar 2026)',
      'Poster, “Multi-Agent Reinforcement Learning for Distributed Missile Defense”, Hume Center Colloquium (Apr 2026)',
      'Dean’s List: Spring 2024, Spring 2025, Fall 2025, Spring 2026',
    ],
    lookingFor: [
      'Software engineering roles where I own features end to end, from data model to UI.', // PLACEHOLDER: in your words
      'Teams working on ML systems, defense, or data-heavy products.',
      'Mentorship, code review, and a high bar for shipping.',
    ],
    scheduleUrl: '', // optional: e.g. a Calendly link
  },

  /**
   * ============================================================================
   *  SITE COPY: every word the site shows that isn't about you lives here
   *  (the crawl, screen text, labels, captions, contacts, the easter egg...).
   *  It's part of `portfolio` (see portfolio.ts: `site`), so all text on the
   *  site comes from one place. Edit freely.
   *
   *  Tokens filled in automatically from your content:
   *    {NAME}     your name (uppercased in the crawl)
   *    {ALIAS}    your alias
   *    {WORLDS}   how many planets your experience happened on, in words
   *    {REWARD}   your bounty, formatted
   *    {CHARGES}  how many charges are on your warrant
   *    {YEARS}    years (skills panel)
   * ============================================================================
   */
  site: {
    gate: {
      kicker: 'Bounty Guild // Secure Contract Terminal',
      title: 'Incoming Contract',
      subtitle: 'Priority: Extreme · Target: Classified · Reward: {REWARD} credits',
      enterWithSound: 'Enter with sound',
      enterSilently: 'Enter silently',
      reducedMotionOn: 'Reduced motion is on.',
      reducedMotionOff: 'Prefer less motion?',
      useReducedMotion: 'Use reduced motion',
      useFullMotion: 'Use full motion',
    },

    titleCard: 'A not so long time ago, in a galaxy not so far away....',

    // ---------------- THE YELLOW CRAWL ----------------
    crawl: {
      /** The big title that shrinks into the stars first. */
      logo: ['PORTFOLIO', 'WARS'],
      episode: 'EPISODE CS',
      title: 'A NEW HIRE',
      paragraphs: [
        'It is a period of fierce competition. Across the Outer Rim, corporate guilds wage a silent war for the galaxy’s rarest resource: talent.',
        'The Bounty Guild has posted its richest contract in a generation. The target, a rogue engineer known only as “{NAME}”, has been spotted shipping production code on {WORLDS} separate worlds.',
        'Aboard a battered hunter-class ship, YOU have accepted the contract. Study the dossier. Learn the target’s associates. And whatever you do, bring them in alive....',
      ],
      continue: 'Continue ▸',
    },

    /** Typed over the arrival shot, one line at a time. */
    contract: [
      'You’re a bounty hunter working the Outer Rim.',
      'The best contracts go to the best talent.',
      'Here is your next target.',
    ],

    /** Each station's in-universe name and its real name (both are shown). */
    sections: {
      about: { real: 'About', lore: 'Wanted Poster' },
      education: { real: 'Education', lore: 'Homeworld' },
      experience: { real: 'Experience', lore: 'Charges' },
      leadership: { real: 'Leadership', lore: 'Rebel Cells' },
      projects: { real: 'Projects', lore: 'Rebel Propaganda' },
      skills: { real: 'Skills', lore: 'Known Associates' },
      resume: { real: 'Resume', lore: 'Intelligence File' },
      contact: { real: 'Contact', lore: 'Report a Sighting' },
    },

    hud: {
      kicker: 'Bounty Guild // Target',
      sound: 'Sound',
      on: 'on',
      off: 'off',
      volume: 'Volume',
      motion: 'Motion',
      motionFull: 'full',
      motionReduced: 'reduced',
      captions: 'Captions',
      settings: 'Settings',
      recruiter: 'Recruiter briefing',
      replay: 'Replay intro',
      plainDossier: 'Plain dossier',
      skipIntro: 'Skip intro ⏭',
      lowPower: 'Low-power mode: 3D systems offline.',
    },

    console: {
      header: 'Bounty Guild // Contract Terminal',
      status: '● Secure link',
      incoming: 'Incoming contract…',
      files: 'Dossier files',
      wanted: 'WANTED',
      call: 'Call',
      holoOff: 'Holo off',
      holoOn: 'Holo on',
      objects: 'Things in the cockpit',
      achievements: 'Achievements',
      guestbook: "Hunter's log",
      guestbookSub: 'Guestbook',
      prevPage: '◂',
      nextPage: '▸',
      page: 'Page',
      share: 'Share link',
      shared: 'Link copied',
      contactsTitle: 'Contacts',
      hangUp: 'Hang up',
      fireBlaster: 'Fire main blaster',
      fireTorpedo: 'Fire torpedo',
      footer: 'Arrow keys + Enter · Drag to look · Scroll to zoom · Backspace back · Esc console',
    },

    panel: { back: '◂ Back', console: 'Console' },

    labels: {
      knownTraits: 'Known traits',
      wantedFor: 'Wanted for',
      lastSeen: 'Last seen',
      academyRecord: 'Academy record',
      school: 'School',
      degree: 'Degree',
      dates: 'Dates',
      gpa: 'GPA',
      honors: 'Honors',
      moons: 'Moons (key coursework)',
      next: 'Next',
      evidence: 'Evidence',
      severity: 'Severity',
      internshipKind: 'Internship / Research',
      leadershipKind: 'Leadership',
      experienceHint:
        'The overhead star map traces each charge in order; select one to follow the lane.',
      association: 'Association',
      associationLevels: ['', 'Acquaintance', 'Contact', 'Ally', 'Trusted ally', 'Right hand'],
      proficiencyLevels: ['', 'Familiar', 'Working', 'Proficient', 'Advanced', 'Expert'],
      servedWith: 'Served with the target for {YEARS}.',
      jointOperations: 'Joint operations',
      postersIntro:
        'Propaganda pasted up around the ship. Select a poster to play its transmission.',
      allPosters: '◂ All posters',
      transmission: 'Intercepted transmission · Rebel propaganda',
      encrypted: 'Intercepted transmission · Encrypted',
      encryptedTitle: '█████ ███████',
      encryptedBody: 'This transmission is encrypted. Something on this ship might crack it.',
      classified: 'CLASSIFIED',
      associatesInvolved: 'Associates involved',
      role: 'Role',
      bountyValue: 'Bounty value',
      credits: 'credits',
      contactTag: 'Incoming transmission · Open frequency',
      contactLead: 'Spotted {NAME}? Report it directly:',
      email: 'Email',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      yourName: 'Your name / guild',
      message: 'Message',
      transmit: 'Transmit',
      transmitNote: 'Opens your email app with the message ready to send.',
      bountyClaimed: 'Bounty claimed',
      downloadPdf: 'Download PDF',
      plainText: 'Plain-text dossier',
      updated: 'Updated',
      resumeSections: {
        education: 'Education',
        experience: 'Experience',
        leadership: 'Leadership',
        projects: 'Projects',
        skills: 'Technical skills',
      },
    },

    /** Text on the small cockpit screens. */
    screens: {
      warrant: ['WARRANT // BOUNTY GUILD', 'CHARGES ON FILE: {CHARGES}', 'STATUS: AT LARGE'],
      comms: ['COMMS // STANDBY', 'FREQ 121.5', 'REPORT SIGHTINGS'],
      datapad: ['INTEL FILE', '{NAME}', 'RESUME // PDF'],
    },

    holograms: { wanted: 'WANTED', currency: 'CR' },

    droidHints: [
      'K-0D3: Bweep! Drag to look around. Arrow keys and Enter work the console.',
      'K-0D3: Scroll to zoom in and out.',
      'K-0D3: Rebel propaganda is pasted up around the ship.',
      'K-0D3: Click any hologram, screen, or switch.',
      'K-0D3: Is that a guitar back there?',
    ],

    /** The deployed site (from the repo's homepage on GitHub); used for link previews. */
    siteUrl: 'https://bountyhunter-lilac.vercel.app',
    achievements: [
      {
        id: 'arrived',
        icon: '🛬',
        title: 'Touchdown',
        description: 'Watch the whole arrival, from the crawl to the pilot’s seat.',
      },
      {
        id: 'all-stations',
        icon: '🗂',
        title: 'Full Dossier',
        description: 'Open every file on the main computer.',
      },
      {
        id: 'all-posters',
        icon: '📜',
        title: 'Propaganda Collector',
        description: 'Read every poster in the cargo hold.',
      },
      {
        id: 'six',
        icon: '👀',
        title: 'Check Your Six',
        description: 'Turn around and look into the cargo hold.',
      },
      { id: 'cat', icon: '🐱', title: 'Purr-sonal Call', description: 'Call Sniffles.' },
      {
        id: 'voicemail',
        icon: '📟',
        title: 'Leave a Message',
        description: 'Get sent to someone’s voicemail.',
      },
      {
        id: 'all-voicemails',
        icon: '📞',
        title: 'Phone Tree',
        description: 'Hear every voicemail greeting in your contacts.',
      },
      { id: 'blaster', icon: '🔴', title: 'Warning Shot', description: 'Fire the main blaster.' },
      { id: 'torpedo', icon: '🔵', title: 'Torpedo Away', description: 'Launch a torpedo.' },
      {
        id: 'helmet',
        icon: '⛑',
        title: 'Your Bucket',
        description: 'Take a good look at your helmet.',
      },
      {
        id: 'tchotchkes',
        icon: '🎲',
        title: 'Hoarder',
        description: 'Inspect every tchotchke in the cockpit.',
      },
      {
        id: 'buttons',
        icon: '🔘',
        title: 'What Does This Button Do?',
        description: 'Press 10 of the mystery buttons.',
      },
      { id: 'holo-off', icon: '🌑', title: 'Lights Out', description: 'Switch the holograms off.' },
      {
        id: 'defender',
        icon: '🛡',
        title: 'Ship Defender',
        description: 'Beat the defense terminal.',
      },
      { id: 'resume', icon: '📄', title: 'Paper Trail', description: 'Open the resume.' },
      {
        id: 'guestbook',
        icon: '✍',
        title: 'Signed the Log',
        description: 'Leave a message in the hunter’s log.',
      },
      {
        id: 'completionist',
        icon: '🏆',
        title: 'Most Wanted',
        description: 'Unlock every other achievement.',
      },
    ],
    achievementsText: {
      intro:
        'Bounty Guild commendations, earned by snooping around this cockpit. Progress is saved on this device.',
      toast: '[Achievement unlocked]',
      progress: 'Unlocked',
      locked: 'Locked',
      reset: 'Reset progress',
    },
    guestbook: {
      intro:
        'Every hunter who boards this ship leaves a line in the log. Leave yours (public, so be kind).',
      name: 'Your name or call sign',
      message: 'Message',
      sign: 'Sign the log',
      signing: 'Transmitting…',
      thanks: 'Logged. Thanks for stopping by, hunter.',
      empty: 'No entries yet. Be the first.',
      offline: 'The comm relay is offline right now, so the log can’t be reached. Try again later.',
      tooFast: 'Easy, hunter. One entry every 30 seconds.',
      invalid: 'Add a name and a message (no links, please).',
    },
    a11y: {
      timeline: 'Timeline',
      introControls: 'Intro controls',
      openingCrawl: 'Opening crawl',
      contactLinks: 'Contact and resume',
      sections: 'Sections',
      typeCodes: 'Type the guidance codes',
      cargoControls: 'Cargo controls',
    },
    terminalUi: {
      intruder: 'INTRUDER SIGNATURE',
      hold: 'HOLD [C]',
      next: 'NEXT',
      cargoHelp: ['←/→ MOVE', '↑ ROTATE', '↓ DROP', 'SPACE SLAM'],
      typePlaceholder: 'Type the codes…',
      touch: {
        hold: 'HOLD',
        slam: 'SLAM',
        holdAria: 'Hold piece',
        leftAria: 'Move left',
        rotateAria: 'Rotate',
        rightAria: 'Move right',
        dropAria: 'Drop',
        slamAria: 'Slam down',
      },
    },
    githubPosters: {
      slogans: [
        'BUILT IN THE SHADOWS.',
        'ONE COMMIT AT A TIME.',
        'THE REBELLION SHIPS.',
        'FROM THE OUTER RIM.',
        'CODE IS RESISTANCE.',
      ],
      live: 'Live',
      source: 'Source',
      role: 'Personal project, updated {DATE}',
    },
    posterStamps: [
      'APPROVED BY THE CELL',
      'BANNED IN 7 SYSTEMS',
      'REBEL ISSUE',
      'SEEN ON CORUSCANT',
      'DO NOT REMOVE',
    ],
    buttonQuips: [
      'What does this button do?',
      'What does this button do? (Nothing. Probably.)',
      'What does this button do? The ship hums back, unhelpfully.',
    ],
    props: {
      levers: {
        label: 'Throttle levers',
        blurb:
          'Three throttles, one for each engine. The middle one sticks. You have learned to kick it.',
      },
      switches: {
        label: 'Flip switches',
        blurb: 'Nobody remembers what the fourth switch does. It stays down. Always down.',
      },
      dice: {
        label: 'Fuzzy dice',
        blurb:
          'Won in a sabacc game on a moon you swore you would never go back to. You went back.',
      },
      mug: {
        label: 'Caf mug',
        blurb: 'Cold caf, third cup of the shift. The mug says "World\'s Okayest Hunter."',
      },
      plant: {
        label: 'Cockpit plant',
        blurb:
          'A hardy succulent from the homeworld. It has survived two hyperspace jumps and one blaster fire. Water weekly.',
      },
      bobble: {
        label: 'Bobble droid',
        blurb:
          'A souvenir astromech. It nods yes to everything, which makes it the best co-pilot you have had.',
      },
      picture: {
        label: 'Photo: you and Sniffles',
        blurb:
          'The only picture on the ship. Sniffles refused to look at the camera. You refused to take it again.',
      },
    },
    helmet: {
      label: 'Your helmet',
      blurb: 'Battered, patched, and still the best armor in the Outer Rim. Every dent is a story.',
    },

    /** The Call button's contact list. `kind: 'cat'` starts a holocall; anything else goes to voicemail. */
    contacts: [
      { name: 'Sniffles (your cat)', icon: '🐱', kind: 'cat' },
      {
        name: 'Darth Vader',
        icon: '⚫',
        kind: 'voicemail',
        voice: 'deep',
        greeting: [
          'This is Lord Vader. I am… unavailable.',
          'I find your lack of a message disturbing. Do not make that mistake twice.',
        ],
      },
      {
        name: 'Purge Trooper Cody',
        icon: '⛑',
        kind: 'voicemail',
        voice: 'human',
        greeting: [
          'Commander Cody. Execute Order… no. Wrong recording.',
          'State your clearance and your business. It will be done, my lord.',
        ],
      },
      {
        name: 'Boba Fett',
        icon: '🚀',
        kind: 'voicemail',
        voice: 'deep',
        greeting: ['Fett. Busy.', 'Leave a name, a location, and a price. In that order.'],
      },
      {
        name: 'Mom',
        icon: '💗',
        kind: 'voicemail',
        voice: 'high',
        greeting: [
          'Hi sweetie, it’s Mom! Are you eating? Is that ship clean?',
          'Call me back. And update your resume, a nice company called.',
        ],
      },
      {
        name: 'Bounty Guild Recruiting',
        icon: '📇',
        kind: 'voicemail',
        voice: 'human',
        greeting: [
          'You’ve reached Bounty Guild recruiting. For open contracts, press one.',
          'To hire Lihi Ancikovsky, skip the menu: lihia@vt.edu.',
        ],
      },
      {
        name: 'Han Solo',
        icon: '🎲',
        kind: 'voicemail',
        voice: 'human',
        greeting: [
          'Han here. Whatever it is, I didn’t do it.',
          'And if I did, I had a good reason.',
        ],
      },
      {
        name: 'Lando Calrissian',
        icon: '🃏',
        kind: 'voicemail',
        voice: 'human',
        greeting: [
          'You’ve reached Lando. I’m at the sabacc table, and I’m winning.',
          'Leave a message. Charmingly.',
        ],
      },
      {
        name: 'Jabba’s Palace',
        icon: '🐸',
        kind: 'voicemail',
        voice: 'alien',
        greeting: [
          'De wanna wanga? The Mighty One is not taking calls.',
          'Leave your tribute after the tone. Hoo hoo hoo.',
        ],
      },
      {
        name: 'Astromech Repair Shop',
        icon: '🔧',
        kind: 'voicemail',
        voice: 'droid',
        greeting: ['[Cheerful beeping]', '[A long, judgmental whistle]'],
      },
      {
        name: 'Grogu',
        icon: '🟢',
        kind: 'voicemail',
        voice: 'high',
        greeting: ['[Happy gurgling]', '[The unmistakable sound of a frog being eaten]'],
      },
      {
        name: 'VT 4Help',
        icon: '🦃',
        kind: 'voicemail',
        voice: 'human',
        greeting: [
          'Thank you for calling 4Help. Your call is important to us.',
          'Have you tried turning the hyperdrive off and on again?',
        ],
      },
    ],
    voicemail:
      'The contact you are trying to reach is unavailable. Please leave a message after the tone.',

    /** The guitar easter egg. */
    attack: {
      guitarTitle: 'Cantina guitar',
      guitarBlurb:
        'A battered six-string from a cantina gig in Blacksburg. Loading tuning profile... restoring string tension... scanning set list... syncing with the ship’s audio bus... applying reverb from the Mos Espa cantina preset...',
      caller: 'Hunter Kessa Vane',
      alert: 'We’re being attacked!!',
      terminalTitle: 'DEFENSE TERMINAL // MANUAL OVERRIDE',
      skipStage: 'Skip stage ▸',
      shields: 'SHIELDS',
      progress: 'PROGRESS',
      games: {
        firewall: {
          title: 'STAGE 1 // FIREWALL',
          help: 'Match the intruder signature. Arrow keys to choose, Enter to lock.',
        },
        typing: {
          title: 'STAGE 2 // TORPEDO JAMMER',
          help: 'Type each torpedo’s guidance code before it hits the shields.',
          words: [
            'ion',
            'flux',
            'kyber',
            'vector',
            'deflect',
            'parsec',
            'hyperdrive',
            'carbonite',
            'astromech',
            'thermal',
          ],
        },
        cargo: {
          title: 'STAGE 3 // CARGO STABILIZER',
          help: 'Pack the loose cargo: clear 3 rows. Hold ←/→ to slide, ↑ rotate, ↓ drop, Space slam, C hold.',
        },
      },
      won: 'Threat neutralized. A new transmission has been decrypted in the cargo hold.',
    },

    /** Captions for every sound (shown while sound is on). */
    captions: {
      roar: '[Engines roar overhead]',
      ventOpen: '[Vent hatch opens]',
      grateOpen: '[Ceiling grate opens]',
      boot: '[Hologram powers up]',
      blaster: '[Main blaster fires]',
      torpedo: '[Torpedo launches]',
      ring: '[Comm ringing]',
      voicemail: '[Beep. Leave your message after the tone]',
      meow: '[Meow]',
      hangUp: '[Holocall disconnected]',
      alarm: '[Alarms blaring]',
      lightsOut: '[Power fails]',
      lightsOn: '[Power restored]',
      win: '[Terminal chime]',
      helmet: '[Helmet clanks]',
      holoOff: '[Holograms power down]',
      holoOn: '[Holograms flicker back on]',
      pickUp: '[Sniffles picks up. A hologram flickers on overhead]',
      rumble: '[The hull rumbles]',
      screech: '[Metal screeches]',
    },

    /**
     * Optional audio files (put them in /public/audio and set the path, e.g.
     * '/audio/crawl.mp3'). Leave empty to use the built-in synthesized sound.
     * Only use music you have the rights to.
     */
    /**
     * Music. Leave empty for the placeholder synth tracks, or put your own
     * files in /public and name them here, e.g. crawl: '/music/crawl.mp3'.
     *   crawl    after the title card, during the opening crawl
     *   arrival  from "Continue" on (fades in as the crawl theme fades out)
     *   cockpit  optional: replaces the arrival track once aboard
     *   alarm    optional: replaces the synth klaxon during the attack
     */
    audio: {
      crawl: '/music/invasion-march.mp3',
      arrival: '',
      cockpit: '/music/monda-space.mp3',
      alarm: '/music/march-of-the-troopers.mp3',
    },

    picture: { caption: 'Me and Sniffles · Outer Rim, last spring' },

    recruiterUi: {
      kicker: 'Recruiter briefing',
      metaTitle: 'Recruiter Briefing',
      tailorTitle: 'Tailor this briefing',
      tailorHint:
        'Pick the role you’re hiring for: everything below reorders by relevance, and the link updates so you can forward it to your hiring manager.',
      allRoles: 'Everything',
      strongMatch: 'Strong match',
      goodMatch: 'Relevant',
      glance: 'At a glance',
      experience: 'Experience',
      projects: 'Projects',
      skills: 'Skills',
      education: 'Education',
      leadership: 'Leadership',
      awards: 'Awards & recognition',
      lookingFor: 'What I’m looking for',
      email: 'Email me',
      copyEmail: 'Copy email',
      copied: 'Copied',
      resume: 'Resume (PDF)',
      saveContact: 'Save contact',
      schedule: 'Book a call',
      copySummary: 'Copy candidate summary',
      summaryCopied: 'Summary copied: paste it into your ATS or notes',
      print: 'Print / save as PDF',
      share: 'Share this briefing',
      shareCopied: 'Link copied',
      cockpit: 'See the interactive portfolio →',
      years: 'yrs',
      updated: 'Updated',
      entry: 'Recruiter? Skip to the 60-second briefing →',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      gpa: 'GPA',
      minor: 'minor in',
    },
    plain: {
      kicker: 'Bounty Guild · Intelligence File · Declassified',
      skipToContent: 'Skip to content',
      enterCockpit: 'Enter the cockpit →',
      downloadResume: 'Download resume (PDF)',
      internships: 'Internships & Research',
      rebelCell: 'Rebel cell',
      charge: 'Charge',
      homeworld: 'Homeworld',
    },

    quips: {
      resumeDownload: 'I have a good feeling about this.',
      gpa: 'Never tell me the odds.',
      contactSent: 'Bounty claimed. The target has been notified.',
    },

    disclaimer:
      'Unofficial fan project. Not affiliated with or endorsed by Lucasfilm Ltd. or The Walt Disney Company. Star Wars and related terms are trademarks of their respective owners. All artwork, models, and audio on this site are original.',
  },
};

// Fold in public GitHub repos (src/content/github.data.ts; `npm run sync:github`):
// links for posters that point at a repo, and basic posters for new repos.
portfolio.propaganda = withGitHub(portfolio.propaganda, {
  skills: portfolio.associates.map((a) => a.skill),
  maxPosters: 12,
  text: portfolio.site.githubPosters,
});
