

import { Application, User, ScoreCriterion } from './types';

export const POSTCODES = {
  'Blaenavon': ['NP4 9AA', 'NP4 9AB', 'NP4 9AC', 'NP4 9AD', 'NP4 9AE'],
  'Thornhill & Upper Cwmbran': ['NP44 5AA', 'NP44 5AB', 'NP44 5AC', 'NP44 5AD'],
  'Trevethin, Penygarn & St. Cadocs': ['NP4 8AA', 'NP4 8AB', 'NP4 8AC', 'NP4 8AD']
};

export const MARMOT_PRINCIPLES = [
    "Give every child the best start in life",
    "Enable all to maximise capabilities and have control over their lives",
    "Create fair employment and good work for all",
    "Ensure a healthy standard of living for all",
    "Create and develop healthy/sustainable places",
    "Strengthen the role and impact of ill health prevention"
];

export const WFG_GOALS = [
    "A prosperous Wales",
    "A resilient Wales",
    "A healthier Wales",
    "A more equal Wales",
    "A Wales of cohesive communities",
    "A Wales of vibrant culture and thriving Welsh language",
    "A globally responsible Wales"
];

export const ORG_TYPES = [
    "Community Interest Company",
    "Charitable Incorporated Organisation",
    "Registered Charity",
    "Voluntary / Community Group",
    "Informal / Self-Help Group",
    "Private Business / Limited Company",
    "Other"
];

export const ROLE_PERMISSIONS = {
  guest: { 
      canSubmit: false, 
      canScore: false, 
      canManage: false, 
      canExport: false, 
      canVote: true,
      viewRestricted: false 
  },
  applicant: { 
      canSubmit: true, 
      canScore: false, 
      canManage: false, 
      canExport: false, 
      canVote: true,
      viewRestricted: false 
  },
  committee: { 
      canSubmit: false, 
      canScore: true, 
      canManage: false, 
      canExport: false, 
      canVote: false, // Committee members usually abstain from public vote or vote as residents
      viewRestricted: true 
  },
  admin: { 
      canSubmit: true, 
      canScore: true, 
      canManage: true, 
      canExport: true, 
      canVote: true,
      viewRestricted: true 
  }
};

// Seeded Committee Members based on original data
// Password for all is 'demo'
// Login can be done via Email OR Username
export const DEMO_USERS: User[] = [
  // Admins
  { email: 'admin@torfaen.gov.uk', username: 'admin', password: 'demo', role: 'admin', uid: 'admin_01', displayName: 'System Admin', bio: 'Portal Administrator' },
  
  // Applicant
  { email: 'applicant@gmail.com', username: 'applicant', password: 'demo', role: 'applicant', uid: 'app_01', displayName: 'Local Hero' },

  // Blaenavon Committee
  { email: 'louise.white@committee.local', username: 'louise.white', password: 'demo', role: 'committee', uid: 'comm_bln_01', area: 'Blaenavon', displayName: 'Louise White' },
  { email: 'sharon.ford@committee.local', username: 'sharon.ford', password: 'demo', role: 'committee', uid: 'comm_bln_02', area: 'Blaenavon', displayName: 'Sharon Ford' },
  { email: 'boyd.paynter@committee.local', username: 'boyd.paynter', password: 'demo', role: 'committee', uid: 'comm_bln_03', area: 'Blaenavon', displayName: 'Boyd Paynter' },
  { email: 'sarah.charles@committee.local', username: 'sarah.charles', password: 'demo', role: 'committee', uid: 'comm_bln_04', area: 'Blaenavon', displayName: 'Sarah J Charles' },
  { email: 'karen.lang@committee.local', username: 'karen.lang', password: 'demo', role: 'committee', uid: 'comm_bln_05', area: 'Blaenavon', displayName: 'Karen Lang' },
  { email: 'richard.lang@committee.local', username: 'richard.lang', password: 'demo', role: 'committee', uid: 'comm_bln_06', area: 'Blaenavon', displayName: 'Richard Lang' },
  { email: 'pauline.griffiths@committee.local', username: 'pauline.griffiths', password: 'demo', role: 'committee', uid: 'comm_bln_07', area: 'Blaenavon', displayName: 'Pauline Griffiths' },

  // Thornhill & Upper Cwmbran Committee
  { email: 'tracey.daniels@committee.local', username: 'tracey.daniels', password: 'demo', role: 'committee', uid: 'comm_thn_01', area: 'Thornhill & Upper Cwmbran', displayName: 'Tracey Daniels' },
  { email: 'adele.bishop@committee.local', username: 'adele.bishop', password: 'demo', role: 'committee', uid: 'comm_thn_02', area: 'Thornhill & Upper Cwmbran', displayName: 'Adele Bishop' },
  { email: 'clare.roche@committee.local', username: 'clare.roche', password: 'demo', role: 'committee', uid: 'comm_thn_03', area: 'Thornhill & Upper Cwmbran', displayName: 'Clare Roche' },
  { email: 'lara.biggs@committee.local', username: 'lara.biggs', password: 'demo', role: 'committee', uid: 'comm_thn_04', area: 'Thornhill & Upper Cwmbran', displayName: 'Lara Biggs' },
  { email: 'steven.evans@committee.local', username: 'steven.evans', password: 'demo', role: 'committee', uid: 'comm_thn_05', area: 'Thornhill & Upper Cwmbran', displayName: 'Steven Evans' },
  { email: 'leanne.lloyd@committee.local', username: 'leanne.lloyd', password: 'demo', role: 'committee', uid: 'comm_thn_06', area: 'Thornhill & Upper Cwmbran', displayName: 'Leanne Lloyd-Tolman' },

  // Trevethin, Penygarn & St. Cadocs Committee
  { email: 'hannah.davies@committee.local', username: 'hannah.davies', password: 'demo', role: 'committee', uid: 'comm_tre_01', area: 'Trevethin, Penygarn & St. Cadocs', displayName: 'Hannah Davies' },
  { email: 'louise.johnson@committee.local', username: 'louise.johnson', password: 'demo', role: 'committee', uid: 'comm_tre_02', area: 'Trevethin, Penygarn & St. Cadocs', displayName: 'Louise Johnson' },
  { email: 'toniann.phillips@committee.local', username: 'toniann.phillips', password: 'demo', role: 'committee', uid: 'comm_tre_03', area: 'Trevethin, Penygarn & St. Cadocs', displayName: 'Toniann Phillips' },
  { email: 'sue.malson@committee.local', username: 'sue.malson', password: 'demo', role: 'committee', uid: 'comm_tre_04', area: 'Trevethin, Penygarn & St. Cadocs', displayName: 'Sue Malson' },
  { email: 'john.marks@committee.local', username: 'john.marks', password: 'demo', role: 'committee', uid: 'comm_tre_05', area: 'Trevethin, Penygarn & St. Cadocs', displayName: 'John Marks' },
  { email: 'denise.strange@committee.local', username: 'denise.strange', password: 'demo', role: 'committee', uid: 'comm_tre_06', area: 'Trevethin, Penygarn & St. Cadocs', displayName: 'Denise Strange' },
];

export const DEMO_APPS: Application[] = [
  {
    id: 'app_PBBLN001',
    userId: 'app_02',
    applicantName: 'Blaenavon Blues FC',
    orgName: 'Blaenavon Blues FC',
    projectTitle: 'Pitch Improvements',
    area: 'Blaenavon',
    summary: 'Improving the playing surface and drainage to allow for year-round youth football.',
    amountRequested: 4500,
    totalCost: 6000,
    status: 'Submitted-Stage2',
    priority: 'Health & Wellbeing',
    createdAt: Date.now() - 10000000,
    ref: 'PBBLN001',
    submissionMethod: 'upload',
    pdfUrl: 'https://cdn.jsdelivr.net/gh/danwtva-source/applications-test@main/PBBLN001.pdf',
    stage2PdfUrl: 'https://cdn.jsdelivr.net/gh/danwtva-source/applications-test@main/PBBLN001.pdf'
  },
  {
    id: 'app_PBBLN003',
    userId: 'app_03',
    applicantName: 'Blaenavon Community Museum',
    orgName: 'Museum Trust',
    projectTitle: 'Interactive History Display',
    area: 'Blaenavon',
    summary: 'Creating a new digital interactive display for local mining history.',
    amountRequested: 2800,
    totalCost: 3500,
    status: 'Submitted-Stage1',
    priority: 'Heritage & Tourism',
    createdAt: Date.now() - 9000000,
    ref: 'PBBLN003',
    submissionMethod: 'upload',
    pdfUrl: 'https://cdn.jsdelivr.net/gh/danwtva-source/applications-test@main/PBBLN003.pdf'
  },
  {
    id: 'app_PBTUP001',
    userId: 'app_04',
    applicantName: 'Able',
    orgName: 'Able Community',
    projectTitle: 'Accessible Gardening',
    area: 'Thornhill & Upper Cwmbran',
    summary: 'Raised beds and accessible pathways for the community garden.',
    amountRequested: 2000,
    totalCost: 2500,
    status: 'Invited-Stage2',
    priority: 'Health & Wellbeing',
    createdAt: Date.now() - 5000000,
    ref: 'PBTUP001',
    submissionMethod: 'upload',
    pdfUrl: 'https://cdn.jsdelivr.net/gh/danwtva-source/applications-test@main/PBTUP001.pdf'
  },
  {
    id: 'app_PBTPS002',
    userId: 'app_05',
    applicantName: 'CBF - MUGA',
    orgName: 'Community Benefit Fund',
    projectTitle: 'MUGA Floodlights',
    area: 'Trevethin, Penygarn & St. Cadocs',
    summary: 'Installing new LED floodlights for the Multi-Use Games Area.',
    amountRequested: 8500,
    totalCost: 12000,
    status: 'Submitted-Stage2',
    priority: 'Community Safety',
    createdAt: Date.now() - 2000000,
    ref: 'PBTPS002',
    submissionMethod: 'upload',
    pdfUrl: 'https://cdn.jsdelivr.net/gh/danwtva-source/applications-test@main/PBTPS002.pdf',
    stage2PdfUrl: 'https://cdn.jsdelivr.net/gh/danwtva-source/applications-test@main/PBTPS002.pdf'
  }
];

export const COMMITTEE_DOCS = [
    { title: 'PB 1.1 - EOI Form', desc: 'The main Expression of Interest application form (Part 1).', url: 'https://github.com/DanWTVA-Source/pdf-host/raw/main/PB%201.1%20-%20EOI%20Form%20(Part%201).pdf' },
    { title: 'PB 1.2 - Priorities Report', desc: 'A report detailing the funding priorities identified by the community.', url: 'https://github.com/DanWTVA-Source/pdf-host/raw/main/PB%201.2%20-%20Our%20Priorities%20Report.pdf' },
    { title: 'PB 1.3 - Application Guidance', desc: 'Guidance notes for completing the Part 1 EOI application.', url: 'https://github.com/DanWTVA-Source/pdf-host/raw/main/PB%201.3%20-%20Application%20Guidance.pdf' },
    { title: 'PB 2.1 - Full Application', desc: 'The full, detailed application form for shortlisted projects (Part 2).', url: 'https://github.com/DanWTVA-Source/pdf-host/raw/main/PB%202.1%20-%20Full%20Application%20Form%20(Part%202)%20final.pdf' },
    { title: 'PB 2.3 - Advisory Template', desc: 'Advisory template for the People\'s Committee assessment process.', url: 'https://github.com/DanWTVA-Source/pdf-host/raw/main/PB%202.3%20Peoples%20Committee%20Advisory%20Template.pdf' }
];

export const SCORING_CRITERIA: ScoreCriterion[] = [
  {
      id: "overview_objectives",
      name: "Project Overview & SMART Objectives",
      guidance: "Assesses the clarity and quality of the project's overview and objectives.",
      weight: 10,
      details: "<b>0:</b> No clear overview or objectives; lacks purpose or beneficiaries.<br><b>1:</b> Basic overview with vague objectives; generic language.<br><b>2:</b> Clear overview with mostly SMART objectives; minor gaps.<br><b>3:</b> Concise, compelling overview; fully SMART objectives and clear beneficiaries."
  },
  {
      id: "local_priorities",
      name: "Alignment with Local Priorities",
      guidance: "How well does the project connect to the identified needs and priorities of the local area?",
      weight: 10,
      details: "<b>0:</b> No explicit link to local priorities; off-scope.<br><b>1:</b> Mentions a relevant priority but connection is weak or generic.<br><b>2:</b> Good linkage to one or more priorities with some specific examples.<br><b>3:</b> Direct, specific alignment to the top local priorities with strong evidence."
  },
  {
      id: "community_benefit",
      name: "Community Benefit & Outcomes",
      guidance: "Evaluates the project's potential benefits and the clarity of its short and long-term outcomes.",
      weight: 10,
      details: "<b>0:</b> Benefits not described or unclear; no outcomes.<br><b>1:</b> Benefits noted but outcomes vague; little distinction between short/long-term.<br><b>2:</b> Clear benefits and plausible outcomes; some indicators described.<br><b>3:</b> Compelling benefits with specific short and long-term outcomes and simple indicators."
  },
  {
      id: "activities_milestones",
      name: "Activities, Milestones & Delivery Responsibilities",
      guidance: "Assesses the coherence and feasibility of the project's activity plan, milestones, and role allocation.",
      weight: 10,
      details: "<b>0:</b> Activities absent or not credible; no milestones; roles unclear.<br><b>1:</b> Some activities listed; milestones or responsibilities partly defined.<br><b>2:</b> Coherent activities with milestones and named roles; feasible plan.<br><b>3:</b> Comprehensive activity plan with realistic milestones and clear owners; delivery-ready."
  },
  {
      id: "timeline_realism",
      name: "Timeline & Scheduling Realism",
      guidance: "How realistic and well-structured is the project's timeline?",
      weight: 10,
      details: "<b>0:</b> No timeline or dates unrealistic.<br><b>1:</b> Basic dates provided; feasibility uncertain.<br><b>2:</b> Realistic start/end/duration aligned to activities.<br><b>3:</b> Robust timeline with sequencing that clearly supports delivery and review points."
  },
  {
      id: "collaborations_partnerships",
      name: "Collaborations & Partnerships",
      guidance: "Evaluates the strength and clarity of partnerships that enhance the project's reach and delivery.",
      weight: 10,
      details: "<b>0:</b> No partners identified; opportunities not explored.<br><b>1:</b> Potential partners named but roles vague or tentative.<br><b>2:</b> Relevant partners named with defined roles and mutual benefits.<br><b>3:</b> Strong partnership model (centres/groups named) clearly strengthening reach and delivery."
  },
  {
      id: "risk_management",
      name: "Risk Management & Feasibility",
      guidance: "Assesses the identification of key risks and the credibility of the proposed mitigation strategies.",
      weight: 10,
      details: "<b>0:</b> No risks identified; feasibility not addressed.<br><b>1:</b> Some risks listed; mitigations generic or partial.<br><b>2:</b> Key risks identified with credible mitigations.<br><b>3:</b> Comprehensive risk register with proportionate mitigations and clear owners."
  },
  {
      id: "budget_value",
      name: "Budget Transparency & Value for Money",
      guidance: "How transparent, justified, and proportionate is the project's budget?",
      weight: 10,
      details: "<b>0:</b> Insufficient or unclear costs; poor justification.<br><b>1:</b> Headline costs given; some justification but gaps remain.<br><b>2:</b> Transparent line-by-line costs with reasonable assumptions.<br><b>3:</b> Fully justified budget (rates × hours/quotes), lean and proportionate to outcomes."
  },
  {
      id: "cross_area_specificity",
      name: "Cross-Area Specificity & Venues (if applicable)",
      guidance: "For cross-area projects, assesses the clarity of the budget and venue details for each area.",
      weight: 10,
      details: "<b>0:</b> No area split or venues named where cross-area is claimed.<br><b>1:</b> Partial split: venue(s) or local costs unclear.<br><b>2:</b> Clear area split and notes; key local delivery costs included.<br><b>3:</b> Complete area split with named venues/rooms and reconciles to main budget."
  },
  {
      id: "marmot_wfg",
      name: "Alignment with Marmot Principles & WFG Goals",
      guidance: "How well does the project demonstrate practical alignment with these principles and goals?",
      weight: 10,
      details: "<b>0:</b> No justification beyond ticks or irrelevant claims.<br><b>1:</b> Basic justifications; generic statements.<br><b>2:</b> Specific, credible examples for selected principles/goals.<br><b>3:</b> Strong, practical examples tying activities to selected principles/goals and outcomes."
  }
];

export const PRIORITY_DATA = {
    blaenavon: {
        total: 254,
        data: [
            { label: 'Youth Services', value: 120 },
            { label: 'Transport', value: 104 },
            { label: 'Antisocial Behaviour', value: 70 },
            { label: 'Health & Wellbeing', value: 61 },
            { label: 'Environment', value: 56 }
        ]
    },
    thornhill: {
        total: 382,
        data: [
            { label: 'Health & Wellbeing', value: 140 },
            { label: 'Youth Services', value: 129 },
            { label: 'Sustainability', value: 75 },
            { label: 'Community', value: 74 },
            { label: 'Safety', value: 28 }
        ]
    },
    trevethin: {
        total: 426,
        data: [
            { label: 'Environment', value: 140 },
            { label: 'Youth Services', value: 129 },
            { label: 'Health', value: 120 },
            { label: 'Older People', value: 100 },
            { label: 'Crime', value: 75 }
        ]
    }
};
