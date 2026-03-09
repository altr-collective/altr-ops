// ─── ALTR COLLECTIVE WORK TYPE CATEGORIES ─────────────────────────
// These reflect the actual texture of UX/UI/design/research work
// Used in time logging and analytics

export const WORK_TYPES = [
  {
    id: 'client_research',
    label: 'Research & Discovery',
    short: 'Research',
    color: '#4E8FC7',        // blue
    group: 'client',
    description: 'Interviews, usability testing, field work, journey mapping',
  },
  {
    id: 'client_design',
    label: 'Design & Execution',
    short: 'Design',
    color: '#8B6FBE',        // purple
    group: 'client',
    description: 'Wireframes, UI design, prototyping, visual design, handoff',
  },
  {
    id: 'client_strategy',
    label: 'Strategy & Facilitation',
    short: 'Strategy',
    color: '#52B87A',        // green
    group: 'client',
    description: 'Workshops, presentations, client calls, synthesis',
  },
  {
    id: 'client_revisions',
    label: 'Revisions & Feedback',
    short: 'Revisions',
    color: '#D98C45',        // orange
    group: 'client',
    description: 'Rework based on client feedback',
  },
  {
    id: 'biz_dev',
    label: 'Business Development',
    short: 'Biz Dev',
    color: '#C94F4F',        // red
    group: 'internal',
    description: 'Proposals, pitching, outreach, portfolio, case studies',
  },
  {
    id: 'ops_admin',
    label: 'Ops & Admin',
    short: 'Admin',
    color: '#444444',        // dark grey
    group: 'internal',
    description: 'Invoicing, scheduling, project management overhead',
  },
  {
    id: 'learning',
    label: 'Learning & Capability',
    short: 'Learning',
    color: '#3AAFA9',        // teal
    group: 'internal',
    description: 'Courses, reading, experimenting with new tools',
  },
  {
    id: 'culture',
    label: 'Culture & Collaboration',
    short: 'Culture',
    color: '#C96BA8',        // pink
    group: 'internal',
    description: 'Team rituals, mentoring, peer reviews, collective building',
  },
];

// Default target distribution (% of time) — admins can override per member
export const DEFAULT_TARGETS = {
  client_research:  25,
  client_design:    30,
  client_strategy:  15,
  client_revisions:  5,
  biz_dev:          10,
  ops_admin:         5,
  learning:          7,
  culture:           3,
};

export const getWorkType = id => WORK_TYPES.find(w => w.id === id) || WORK_TYPES[1];
export const clientTypes = WORK_TYPES.filter(w => w.group === 'client').map(w => w.id);
