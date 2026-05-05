// Course catalog, prereq graph, and pathway plans for the Pathway prototype.

export const COURSE_CATALOG = {
  // Year 1 core
  COMP1511: { code: 'COMP1511', title: 'Programming Fundamentals', uoc: 6 },
  COMP1521: { code: 'COMP1521', title: 'Computer Systems Fundamentals', uoc: 6 },
  COMP1531: { code: 'COMP1531', title: 'Software Engineering Fundamentals', uoc: 6 },
  COMP2511: { code: 'COMP2511', title: 'Object-Oriented Design & Programming', uoc: 6 },
  COMP2521: { code: 'COMP2521', title: 'Data Structures & Algorithms', uoc: 6 },
  MATH1081: { code: 'MATH1081', title: 'Discrete Mathematics', uoc: 6 },
  MATH1131: { code: 'MATH1131', title: 'Mathematics 1A', uoc: 6 },
  MATH1241: { code: 'MATH1241', title: 'Mathematics 1B', uoc: 6 },
  MATH2521: { code: 'MATH2521', title: 'Complex Analysis', uoc: 6 },

  // AI / ML
  COMP3411: { code: 'COMP3411', title: 'Artificial Intelligence', uoc: 6 },
  COMP3821: { code: 'COMP3821', title: 'Extended Algorithms & Programming Techniques', uoc: 6 },
  COMP9417: { code: 'COMP9417', title: 'Machine Learning & Data Mining', uoc: 6 },
  COMP9444: { code: 'COMP9444', title: 'Neural Networks & Deep Learning', uoc: 6 },
  COMP9418: { code: 'COMP9418', title: 'Advanced Topics in Statistical ML', uoc: 6 },
  COMP6713: { code: 'COMP6713', title: 'Natural Language Processing', uoc: 6 },
  COMP9517: { code: 'COMP9517', title: 'Computer Vision', uoc: 6 },

  // Cybersecurity
  COMP3331: { code: 'COMP3331', title: 'Computer Networks & Applications', uoc: 6 },
  COMP6441: { code: 'COMP6441', title: 'Security Engineering', uoc: 6 },
  COMP6841: { code: 'COMP6841', title: 'Extended Security Engineering', uoc: 6 },
  COMP6843: { code: 'COMP6843', title: 'Extended Web App Security & Testing', uoc: 6 },
  COMP6447: { code: 'COMP6447', title: 'System & Software Security Assessment', uoc: 6 },
  COMP3151: { code: 'COMP3151', title: 'Foundations of Concurrency', uoc: 6 },
  COMP3231: { code: 'COMP3231', title: 'Operating Systems', uoc: 6 },

  // Capstone
  COMP3900: { code: 'COMP3900', title: 'Computer Science Project', uoc: 6 },
  COMP4920: { code: 'COMP4920', title: 'Professional Issues & Ethics in IT', uoc: 6 },

  // Generic electives (placeholders)
  GENL2021: { code: 'GENL2021', title: 'Intro to Business & Tech Law', uoc: 6 },
  ARTS1690: { code: 'ARTS1690', title: 'Effective Writing', uoc: 6 },
  PHIL2627: { code: 'PHIL2627', title: 'Philosophy of AI', uoc: 6 },
  COMM1180: { code: 'COMM1180', title: 'Value Creation', uoc: 6 },
};

export const PREREQS = {
  COMP1521: ['COMP1511'],
  COMP1531: ['COMP1511'],
  COMP2521: ['COMP1511'],
  COMP2511: ['COMP1531', 'COMP2521'],
  MATH1241: ['MATH1131'],
  MATH2521: ['MATH1241'],

  COMP3411: ['COMP2521'],
  COMP3821: ['COMP2521', 'MATH1081'],
  COMP9417: ['COMP2521', 'MATH1241'],
  COMP9444: ['COMP9417'],
  COMP9418: ['COMP9417'],
  COMP6713: ['COMP9417'],
  COMP9517: ['COMP9417'],

  COMP3331: ['COMP1521', 'COMP2521'],
  COMP6441: ['COMP1521'],
  COMP6841: ['COMP6441'],
  COMP6843: ['COMP6441'],
  COMP6447: ['COMP6841'],
  COMP3151: ['COMP2521'],
  COMP3231: ['COMP1521', 'COMP2521'],

  COMP3900: ['COMP2511', 'COMP1531'],
  COMP4920: ['COMP1531'],
};

// Year 1 history — same for every pathway
export const YEAR1_HISTORY = {
  Y1T1: [
    { code: 'COMP1511', status: 'completed' },
    { code: 'MATH1081', status: 'completed' },
    { code: 'MATH1131', status: 'completed' },
  ],
  Y1T2: [
    { code: 'COMP1521', status: 'completed' },
    { code: 'MATH1241', status: 'completed' },
    { code: 'COMP1531', status: 'completed' },
  ],
  Y1T3: [{ code: 'COMP2511', status: 'in-progress' }],
};

// Pathway plans — courses placed into Y2–Y4. Status set to 'ai-recommended' on apply.
export const PATHWAYS = {
  'ai-ml': {
    label: 'AI/ML researcher',
    blurb: 'Strong theory base, deep learning specialisation, and a research-flavoured capstone.',
    plan: {
      Y2T1: ['COMP2521', 'MATH2521'],
      Y2T2: ['COMP3821', 'COMP3411'],
      Y2T3: ['COMP9417', 'PHIL2627'],
      Y3T1: ['COMP9444', 'COMP9517'],
      Y3T2: ['COMP9418', 'COMP6713'],
      Y3T3: ['COMP3900', 'ARTS1690'],
      Y4T1: ['COMP4920'],
      Y4T2: [],
      Y4T3: [],
    },
  },
  cyber: {
    label: 'Cybersecurity',
    blurb: 'Networks, systems, and offensive security electives feeding into the capstone.',
    plan: {
      Y2T1: ['COMP2521'],
      Y2T2: ['COMP3331', 'COMP6441'],
      Y2T3: ['COMP3231', 'GENL2021'],
      Y3T1: ['COMP6841', 'COMP3151'],
      Y3T2: ['COMP6843', 'COMP6447'],
      Y3T3: ['COMP3900', 'COMM1180'],
      Y4T1: ['COMP4920'],
      Y4T2: [],
      Y4T3: [],
    },
  },
  swe: {
    label: 'Software engineer',
    blurb: 'Systems fundamentals, web/networks, and a project-heavy capstone year.',
    plan: {
      Y2T1: ['COMP2521'],
      Y2T2: ['COMP3331', 'COMP3231'],
      Y2T3: ['COMP3151', 'COMM1180'],
      Y3T1: ['COMP3821', 'COMP6441'],
      Y3T2: ['COMP9417', 'GENL2021'],
      Y3T3: ['COMP3900', 'ARTS1690'],
      Y4T1: ['COMP4920'],
      Y4T2: [],
      Y4T3: [],
    },
  },
  data: {
    label: 'Data scientist',
    blurb: 'Statistical ML and data-mining heavy, with applied vision/NLP electives.',
    plan: {
      Y2T1: ['COMP2521', 'MATH2521'],
      Y2T2: ['COMP3821'],
      Y2T3: ['COMP9417'],
      Y3T1: ['COMP9418', 'COMP9517'],
      Y3T2: ['COMP6713', 'COMP3411'],
      Y3T3: ['COMP3900', 'COMM1180'],
      Y4T1: ['COMP4920'],
      Y4T2: [],
      Y4T3: [],
    },
  },
};

export const YEARS = [
  { id: 1, label: 'Year 1', year: 2026 },
  { id: 2, label: 'Year 2', year: 2027 },
  { id: 3, label: 'Year 3', year: 2028 },
  { id: 4, label: 'Year 4 Honours', year: 2029 },
];
export const TERMS = [1, 2, 3];

export function termId(year, term) {
  return `Y${year}T${term}`;
}
export function termOrdinal(year, term) {
  return year * 10 + term; // earlier = smaller
}
