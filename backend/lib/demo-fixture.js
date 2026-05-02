const DEMO_IDEA = 'mental health journaling app';
const DEMO_SEARCH_DELAY_MS = 5000;
const DEMO_BUILD_DELAY_MS = 700;

function normalizeIdea(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isDemoIdea(value) {
  return normalizeIdea(value).includes(DEMO_IDEA);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const RAW_SOURCES = [
  {
    id: 'src_1',
    title: 'Quiet Pages - Hackathon launch page',
    url: 'https://devpost.com/software/quiet-pages',
    domain: 'devpost.com',
    source_type: 'devpost',
    evidence_kind: 'hackathon',
    year: 2014,
    snippet: 'A weekend prototype that paired a mood score with one guided journal prompt and a weekly recap.',
    relevance: 0.95,
  },
  {
    id: 'src_2',
    title: 'Quiet Pages archived repository',
    url: 'https://github.com/scout-demo/quiet-pages',
    domain: 'github.com',
    source_type: 'github',
    evidence_kind: 'repository',
    year: 2014,
    snippet: 'The repository shows the concept never evolved beyond a prototype and email recap flow.',
    relevance: 0.84,
  },
  {
    id: 'src_3',
    title: 'MirrorLog - Product launch listing',
    url: 'https://www.producthunt.com/products/mirrorlog',
    domain: 'producthunt.com',
    source_type: 'producthunt',
    evidence_kind: 'live_product',
    year: 2017,
    snippet: 'MirrorLog launched as a streak-based mood journal with a calendar heatmap and daily reflection prompts.',
    relevance: 0.9,
  },
  {
    id: 'src_4',
    title: 'Why MirrorLog could not keep daily users',
    url: 'https://medium.com/@mirrorlog/why-mirrorlog-could-not-keep-daily-users',
    domain: 'medium.com',
    source_type: 'article',
    evidence_kind: 'failure_signal',
    year: 2018,
    snippet: 'The team described churn after the streak mechanic began to feel punitive instead of supportive.',
    relevance: 0.87,
  },
  {
    id: 'src_5',
    title: 'Relief Journal pilot notes',
    url: 'https://reliefjournal.app/blog/pilot-notes',
    domain: 'reliefjournal.app',
    source_type: 'company_site',
    evidence_kind: 'live_product',
    year: 2019,
    snippet: 'A pilot combined voice journaling with therapist-facing summaries for between-session support.',
    relevance: 0.92,
  },
  {
    id: 'src_6',
    title: 'Relief Journal iOS prototype repo',
    url: 'https://github.com/scout-demo/relief-journal-ios',
    domain: 'github.com',
    source_type: 'github',
    evidence_kind: 'repository',
    year: 2019,
    snippet: 'Prototype code shows a strong voice capture flow but a heavy onboarding questionnaire.',
    relevance: 0.81,
  },
  {
    id: 'src_7',
    title: 'Anchor Notes clinic case study',
    url: 'https://anchornotes.health/case-study/remote-care',
    domain: 'anchornotes.health',
    source_type: 'company_site',
    evidence_kind: 'live_product',
    year: 2021,
    snippet: 'Anchor Notes linked journaling check-ins to clinician review and care-plan follow-ups.',
    relevance: 0.94,
  },
  {
    id: 'src_8',
    title: 'Anchor Notes on the App Store',
    url: 'https://apps.apple.com/us/app/anchor-notes/id1600000001',
    domain: 'apps.apple.com',
    source_type: 'app_store',
    evidence_kind: 'live_product',
    year: 2022,
    snippet: 'Public reviews praise the safety-plan features but mention setup friction for solo users.',
    relevance: 0.82,
  },
  {
    id: 'src_9',
    title: 'BloomScript launch announcement',
    url: 'https://www.producthunt.com/products/bloomscript',
    domain: 'producthunt.com',
    source_type: 'producthunt',
    evidence_kind: 'live_product',
    year: 2023,
    snippet: 'BloomScript positioned itself as an AI reflection coach that turned entries into nightly summaries.',
    relevance: 0.9,
  },
  {
    id: 'src_10',
    title: 'BloomScript founder memo on retention',
    url: 'https://bloomscript.substack.com/p/retention-lessons',
    domain: 'substack.com',
    source_type: 'newsletter',
    evidence_kind: 'failure_signal',
    year: 2024,
    snippet: 'The founder noted that users liked the summaries but did not trust generic AI advice during hard weeks.',
    relevance: 0.88,
  },
  {
    id: 'src_11',
    title: 'Hearthline product overview',
    url: 'https://www.hearthline.app',
    domain: 'hearthline.app',
    source_type: 'company_site',
    evidence_kind: 'live_product',
    year: 2025,
    snippet: 'Hearthline blends guided journaling, short reset rituals, and a softer recovery flow when users miss days.',
    relevance: 0.93,
  },
  {
    id: 'src_12',
    title: 'Hearthline App Store reviews',
    url: 'https://apps.apple.com/us/app/hearthline/id6500000001',
    domain: 'apps.apple.com',
    source_type: 'app_store',
    evidence_kind: 'review',
    year: 2025,
    snippet: 'Users consistently praise the calm tone and low-pressure reminders, but ask for stronger escalation options.',
    relevance: 0.79,
  },
  {
    id: 'src_13',
    title: 'What keeps wellness journals from becoming habits',
    url: 'https://signalnotes.co/mental-wellness-retention-report',
    domain: 'signalnotes.co',
    source_type: 'web',
    evidence_kind: 'benchmark',
    year: 2025,
    snippet: 'Retention improves when a reflection app gives users a concrete next action instead of ending at insight alone.',
    relevance: 0.85,
  },
  {
    id: 'src_14',
    title: 'Voice journaling trust and privacy survey',
    url: 'https://carepatterns.org/reports/voice-journaling-trust',
    domain: 'carepatterns.org',
    source_type: 'article',
    evidence_kind: 'failure_signal',
    year: 2025,
    snippet: 'Users adopt voice capture quickly when privacy controls are obvious and crisis boundaries are explicit.',
    relevance: 0.83,
  },
];

const SOURCE_INDEX = Object.fromEntries(RAW_SOURCES.map((source) => [source.id, source]));

function pickSources(ids = []) {
  return ids.map((id) => SOURCE_INDEX[id]).filter(Boolean);
}

const RAW_TIMELINE = [
  {
    year: 2014,
    title: 'Quiet Pages',
    what_was_built:
      'A hackathon prototype for daily mood check-ins followed by one guided journal prompt and a weekly email recap.',
    what_made_it_different: 'guided prompts that adapted to the selected mood',
    did_right: [
      'Removed blank-page anxiety by always starting with one concrete prompt.',
      'Made first use feel safe and light instead of therapeutic or clinical.',
    ],
    did_wrong: [
      'Ended each session at reflection without giving users a next step.',
      'Had no ritual for missed days, so the habit broke as soon as life got busy.',
    ],
    lesson:
      'Low-friction journaling gets the first entry; repeat use needs a clear payoff after the entry ends.',
    evolution_timeline: [
      { year: 2014, event: 'Launched at a student hackathon as a guided reflection prototype.' },
      { year: 2015, event: 'Repository was archived after the team moved on without building retention loops.' },
    ],
    did_well:
      'The product understood that emotionally tired users need structure, not an empty text box.',
    did_poorly:
      'It behaved like a journal page, not a habit system, so nothing pulled people back tomorrow.',
    project_lacks:
      'No follow-up action, no gentle reminder logic, and no sense of progress beyond writing once.',
    avoid_mistakes:
      'After every entry, generate one tiny action, reframe, or follow-up check-in so the session closes with momentum.',
    improvement_suggestions:
      "Keep capture under two minutes and let today's note shape tomorrow's prompt automatically.",
    cause_of_death:
      'The prototype stopped after the demo because journaling alone was not sticky enough to justify continued development.',
    source_url: 'https://devpost.com/software/quiet-pages',
    source_ids: ['src_1', 'src_2'],
    how_far: 'abandoned',
    is_alive: false,
    confidence: 'high',
  },
  {
    year: 2017,
    title: 'MirrorLog',
    what_was_built:
      'A shipped mobile journal with streaks, a calendar heatmap, quick mood sliders, and short end-of-day reflection prompts.',
    what_made_it_different: 'visual mood history you could scan in seconds',
    did_right: [
      'Turned journaling into a visual history that made patterns feel tangible.',
      'Made daily logging fast enough for users to do it in under a minute.',
    ],
    did_wrong: [
      'The streak system made missed days feel like failure.',
      'Insights stayed descriptive instead of helping users act differently tomorrow.',
    ],
    lesson:
      'People like seeing their patterns, but they leave when the app starts judging them for inconsistency.',
    evolution_timeline: [
      { year: 2017, event: 'Released publicly with strong early launch attention.' },
      { year: 2018, event: 'Team published a churn memo after daily retention flattened.' },
    ],
    did_well:
      'The heatmap made mood history legible, which is still one of the clearest value moments in the category.',
    did_poorly:
      'Performance mechanics created shame instead of support, especially for users already under stress.',
    project_lacks:
      'No recovery flow for missed days and no bridge from awareness to a useful next move.',
    avoid_mistakes:
      'Design for re-entry after a lapse; the app should greet people gently, not punish them for absence.',
    improvement_suggestions:
      'Keep the visual timeline, but pair it with compassionate recovery copy and next-step prompts.',
    cause_of_death:
      'Churn spiked once the streak mechanic began to feel punitive and the product offered little value beyond pattern tracking.',
    source_url: 'https://www.producthunt.com/products/mirrorlog',
    source_ids: ['src_3', 'src_4'],
    how_far: 'shipped',
    is_alive: false,
    confidence: 'high',
  },
  {
    year: 2019,
    title: 'Relief Journal',
    what_was_built:
      'A voice-first journal that summarized entries for therapists and encouraged between-session reflection.',
    what_made_it_different: 'voice journaling with therapist-facing summaries',
    did_right: [
      'Lowered the energy required to journal on hard days by allowing voice capture.',
      'Created a credible handoff into human care instead of pretending the app could do everything alone.',
    ],
    did_wrong: [
      'Asked for too much personal history before giving first value.',
      'Relied on clinician setup, which slowed adoption outside guided pilots.',
    ],
    lesson:
      'Voice is a major unlock for emotional capture, but onboarding cannot feel like intake paperwork.',
    evolution_timeline: [
      { year: 2019, event: 'Pilot launched with therapy practices and campus counselling teams.' },
      { year: 2020, event: 'The product stalled as privacy review and clinician onboarding expanded the sales cycle.' },
    ],
    did_well:
      'It proved that users will record richer, more honest reflections when speaking is easier than typing.',
    did_poorly:
      'The setup burden was too heavy for a product that needed immediate emotional trust and early momentum.',
    project_lacks:
      'No consumer-first path that worked before a therapist or institution entered the picture.',
    avoid_mistakes:
      'Give solo users value in the first session, then make human support an optional upgrade instead of a prerequisite.',
    improvement_suggestions:
      'Ship voice capture with obvious privacy controls and a lightweight trust-setting screen, not a long assessment.',
    cause_of_death:
      'Pilot users liked the summaries, but clinician-dependent onboarding and privacy review slowed adoption to a crawl.',
    source_url: 'https://reliefjournal.app/blog/pilot-notes',
    source_ids: ['src_5', 'src_6', 'src_14'],
    how_far: 'placed',
    is_alive: false,
    confidence: 'medium',
  },
  {
    year: 2021,
    title: 'Anchor Notes',
    what_was_built:
      'A remote-care companion that combined check-ins, structured journaling, safety plans, and clinician review.',
    what_made_it_different: 'journaling tied directly to a care plan',
    did_right: [
      'Connected emotional reflection to concrete care steps and trusted support.',
      'Handled higher-risk use cases more responsibly than pure consumer wellness apps.',
    ],
    did_wrong: [
      'The product feels heavier for solo users who just want a calm daily ritual.',
      'Procurement and clinician training create friction before users ever see value.',
    ],
    lesson:
      'Human escalation is valuable, but the core daily product still has to stand on its own for ordinary weeks.',
    evolution_timeline: [
      { year: 2021, event: 'Released through remote-care pilots with mental health providers.' },
      { year: 2023, event: 'Expanded with mobile safety plans and asynchronous review workflows.' },
    ],
    did_well:
      'Anchor Notes proves that journaling gets more trustworthy when it can escalate into a real support system.',
    did_poorly:
      'Its institutional posture makes it feel like healthcare software before it feels like a habit people want to keep.',
    project_lacks:
      'A lightweight consumer-first experience that creates attachment before the clinical layer appears.',
    avoid_mistakes:
      'Use care escalation as a safety net, not the entire personality of the product.',
    improvement_suggestions:
      'Start with a ritual users enjoy daily, then layer in support pathways when patterns or preferences demand them.',
    cause_of_death: 'still active in care pilots and clinic partnerships',
    source_url: 'https://anchornotes.health/case-study/remote-care',
    source_ids: ['src_7', 'src_8'],
    how_far: 'shipped',
    is_alive: true,
    confidence: 'high',
  },
  {
    year: 2023,
    title: 'BloomScript',
    what_was_built:
      'An AI journaling companion that generated nightly reflection summaries, mood narratives, and follow-up prompts.',
    what_made_it_different: 'AI-generated weekly mood stories',
    did_right: [
      'Made the product feel instantly intelligent by turning raw notes into readable summaries.',
      'Personalized prompts well enough to create strong first-week activation.',
    ],
    did_wrong: [
      'The advice often felt generic or emotionally overconfident.',
      'Users did not always trust AI interpretation during more vulnerable moments.',
    ],
    lesson:
      'AI can reduce journaling friction, but it cannot sound like a therapist or overstate certainty.',
    evolution_timeline: [
      { year: 2023, event: 'Public launch framed the product as an AI reflection coach.' },
      { year: 2024, event: 'Team shared retention lessons after summary engagement outpaced long-term habit formation.' },
    ],
    did_well:
      'It showed how strong the value moment becomes when users feel seen and summarized without extra effort.',
    did_poorly:
      'Trust eroded when the AI sounded polished but not grounded enough for emotionally sensitive use cases.',
    project_lacks:
      'Clear safety boundaries, humble language, and a stronger bridge into practical next steps.',
    avoid_mistakes:
      'Keep AI assistive and restrained: summarize, suggest, and escalate, but never impersonate care.',
    improvement_suggestions:
      'Use AI to draft themes and next-step cards, then keep tone calm, specific, and explicitly non-clinical.',
    cause_of_death:
      'Users sampled the AI coach, but generic summaries and shaky trust during hard weeks prevented deep retention.',
    source_url: 'https://www.producthunt.com/products/bloomscript',
    source_ids: ['src_9', 'src_10'],
    how_far: 'shipped',
    is_alive: false,
    confidence: 'high',
  },
  {
    year: 2025,
    title: 'Hearthline',
    what_was_built:
      'A polished mental wellness journal that blends short check-ins, guided writing, voice notes, and calming reset rituals.',
    what_made_it_different: 'soft recovery flow instead of streak pressure',
    did_right: [
      'Uses warm, low-pressure rituals that make journaling feel restorative instead of performative.',
      'Handles skipped days gracefully, which preserves the relationship with the product.',
    ],
    did_wrong: [
      'Still stops short of turning insight into a concrete follow-up action.',
      'Support escalation is thin, so the app feels best on ordinary days rather than hard ones.',
    ],
    lesson:
      'The category now understands emotional tone and recovery design; the next leap is a better post-entry loop.',
    evolution_timeline: [
      { year: 2025, event: 'Launched with a ritual-first, low-pressure journaling experience.' },
      { year: 2026, event: 'Expanded with voice notes and weekly reflection digests.' },
    ],
    did_well:
      'Hearthline proves that emotional safety and tasteful ritual design dramatically improve early retention.',
    did_poorly:
      'It still leaves the user alone after the insight lands, which limits the product on tougher weeks.',
    project_lacks:
      'A strong action layer and a trustworthy bridge from self-reflection to support.',
    avoid_mistakes:
      'Keep the gentle tone, but always close the session with one useful move the user can actually take.',
    improvement_suggestions:
      'Preserve the ritual design and add practical follow-up cards, recovery plans, and opt-in support handoffs.',
    cause_of_death: 'still active with strong consumer reviews and expanding features',
    source_url: 'https://www.hearthline.app',
    source_ids: ['src_11', 'src_12', 'src_13'],
    how_far: 'shipped',
    is_alive: true,
    confidence: 'high',
  },
];

const RAW_COMPETITORS = [
  {
    name: 'Hearthline',
    url: 'https://www.hearthline.app',
    weakness:
      'Excellent emotional tone, but it rarely converts a reflection into a practical next step or trusted handoff.',
    signal:
      'Shows that users want a calm, ritual-driven journal that feels supportive instead of productivity-oriented.',
    source_ids: ['src_11', 'src_12'],
  },
  {
    name: 'Anchor Notes',
    url: 'https://anchornotes.health/case-study/remote-care',
    weakness:
      'The care-linked model is strong for clinics, but the product is heavier than most solo users want every day.',
    signal:
      'Validates that journaling becomes more valuable when it can escalate into a real support pathway.',
    source_ids: ['src_7', 'src_8'],
  },
  {
    name: 'Evening State',
    url: 'https://www.eveningstate.app',
    weakness:
      'Beautiful reflection prompts and summaries, but little differentiation once the novelty of AI journaling fades.',
    signal:
      'Confirms the market will try AI-assisted reflection if the tone feels emotionally literate and calm.',
    source_ids: ['src_9', 'src_13'],
  },
  {
    name: 'MindFrame Companion',
    url: 'https://www.mindframecompanion.com',
    weakness:
      'Strong care-plan scaffolding, but onboarding feels clinical and slow for people who just want to start reflecting tonight.',
    signal:
      'Demonstrates ongoing demand for products that connect self-reflection to human support without pretending to replace it.',
    source_ids: ['src_7', 'src_14'],
  },
];

const DEMO_SEARCH_RESULT = {
  idea: DEMO_IDEA,
  timeline: RAW_TIMELINE.map((entry) => ({
    ...entry,
    sources: pickSources(entry.source_ids),
  })),
  turn_sentence:
    'The category wins the first reflection by lowering emotional friction, but it keeps losing the long-term habit when journaling ends at insight instead of helping the user take one believable next step or reach trusted support.',
  competitors: RAW_COMPETITORS.map((competitor) => ({
    ...competitor,
    sources: pickSources(competitor.source_ids),
  })),
  gap:
    'The opening is a mental health journaling app that feels emotionally safe on day one, supports text or voice capture in under two minutes, and closes every entry with a concrete follow-up card: a tiny action, a rescheduled check-in, or an opt-in handoff to human support. Most products choose one of three lanes - beautiful journaling, AI summaries, or clinical structure - but very few blend low-friction capture, trustworthy AI restraint, and a clear support escalation path in one consumer-friendly flow.',
  clock:
    'This is the right moment because speech transcription, gentle AI summarization, and user comfort with guided mental wellness tools are now mature enough to remove blank-page friction without making the experience feel robotic or clinical.',
  sources: RAW_SOURCES,
  research_quality: {
    evidence_count: 14,
    distinct_domains: 10,
    source_types: ['devpost', 'github', 'producthunt', 'company_site', 'app_store', 'article', 'newsletter', 'web'],
    coverage_note:
      'Strong curated demo coverage across early prototypes, shipped products, active competitors, habit-retention signals, and failure memos.',
    missing_categories: [],
  },
  data_quality_note:
    'Curated demo fixture with fully populated fields for the keynote flow and a consistent narrative arc.',
  pattern_confidence: 'high',
  graph_size: 52,
};

const DEMO_BUILD_PLAN = {
  headline: 'Build the journaling app that ends every reflection with a next step',
  positioning:
    'A calm mental health journal for people who want a two-minute daily reset, useful weekly clarity, and a trustworthy path from solo reflection to real support when patterns get heavier.',
  borrow_from_winners: [
    {
      feature: 'Voice-first capture for low-energy days',
      why: 'Relief Journal proved that speaking lowers the energy barrier and produces richer emotional detail than forcing typed entries every time.',
      source: 'Relief Journal',
    },
    {
      feature: 'A fast visual timeline of mood and themes',
      why: 'MirrorLog showed that users love seeing their own pattern history when it becomes scannable in seconds, not buried in text.',
      source: 'MirrorLog',
    },
    {
      feature: 'Gentle recovery design after missed days',
      why: 'Hearthline survives because it protects the relationship with the user even when they disappear for a week.',
      source: 'Hearthline',
    },
    {
      feature: 'A real escalation path into human support',
      why: 'Anchor Notes makes the product more trustworthy by connecting reflection to safety plans and trusted people instead of pretending the app can handle every situation.',
      source: 'Anchor Notes',
    },
  ],
  avoid_from_losers: [
    {
      mistake: 'Do not make missed days feel like failure',
      why: 'Streak mechanics punished inconsistency and made already-stressed users feel worse, which accelerated churn.',
      source: 'MirrorLog',
    },
    {
      mistake: 'Do not ask for a clinical intake before first value',
      why: 'Heavy onboarding killed momentum in products that needed immediate emotional trust and a fast first win.',
      source: 'Relief Journal',
    },
    {
      mistake: 'Do not let AI sound more certain than it is',
      why: 'Generic, therapist-like summaries created trust issues once the novelty wore off and the emotions got more serious.',
      source: 'BloomScript',
    },
    {
      mistake: 'Do not stop at reflection alone',
      why: 'Multiple attempts created awareness but failed to translate insight into the next useful action, so the habit never deepened.',
      source: 'Quiet Pages',
    },
  ],
  mvp: {
    summary:
      'Ship a soothing daily journal that can be completed in under two minutes, accepts text or voice, generates one restrained reflection summary, and ends with a single next-step card the user can actually take today.',
    must_have_features: [
      'A 90-second check-in flow with text or voice entry and one mood selector.',
      'One guided prompt that adapts to the selected feeling and recent history instead of opening to a blank page.',
      "A next-step card after every entry: breathe, text a trusted person, schedule tomorrow's check-in, or choose a tiny coping action.",
      'A weekly timeline showing moods, repeated themes, and a compassionate re-entry state after skipped days.',
      'A lightweight safety layer with emergency resources and an optional trusted-contact preference for users who want support escalation.',
    ],
    explicitly_not_in_mvp: [
      'Open-ended AI chat that behaves like a therapist.',
      'Clinician dashboards, billing, or insurance workflows.',
      'Group journaling or social feed mechanics.',
      'Wearable integrations and passive biometric tracking.',
    ],
    first_user_test:
      'Recruit 8 to 10 users who already attempt some form of reflection, ask them to use the app for 7 days, and measure whether the next-step card materially increases day-two and day-seven return compared with a journal-only version.',
  },
  v1_features: [
    {
      feature: 'Pattern-based weekly review with humble AI summaries',
      why: 'Once trust exists, a weekly narrative can help users connect scattered entries without sounding like diagnosis or advice.',
      inspired_by: 'BloomScript',
    },
    {
      feature: 'Trusted contact and therapist export packs',
      why: 'Users who want help should be able to share a clean summary, recent themes, and agreed safety notes without giving away the whole journal.',
      inspired_by: 'Anchor Notes',
    },
    {
      feature: 'A recovery library triggered by repeated patterns',
      why: 'Repeated anxious or low-energy patterns should unlock specific grounding exercises, routines, and follow-up plans instead of generic encouragement.',
      inspired_by: 'Hearthline',
    },
    {
      feature: 'Smart prompt memory',
      why: 'The app should remember which prompts deepen reflection and which ones users skip, so the product gets more personally useful over time.',
      inspired_by: 'Quiet Pages',
    },
  ],
  moat:
    'The moat is not generic journaling or generic AI. It is the follow-up graph: a system that learns which prompts, next-step cards, recovery flows, and escalation choices actually help each user come back and feel better supported over time.',
  risks: [
    {
      risk: 'Safety overreach',
      mitigation: 'Keep AI language explicitly non-clinical, provide clear crisis boundaries, and route higher-risk moments to human support options fast.',
    },
    {
      risk: 'The app becomes another beautiful diary with weak retention',
      mitigation: 'Instrument whether next-step cards change return behavior and remove any feature that does not improve day-two, day-seven, or re-entry retention.',
    },
    {
      risk: 'Voice capture feels invasive or untrustworthy',
      mitigation: 'Make privacy controls obvious before first use, allow local deletion at any time, and explain exactly how voice is stored and summarized.',
    },
    {
      risk: 'Reminder fatigue',
      mitigation: "Use adaptive reminders tied to the user's preferred reflection window and default to fewer, warmer nudges instead of aggressive notification tactics.",
    },
  ],
  next_three_steps: [
    'Prototype the 90-second entry flow, including text, voice, mood selection, and the post-entry next-step card.',
    'Run a 7-day concierge pilot with real users and manually write the weekly summaries to learn which next-step cards actually create return behavior.',
    'Define the safety policy, escalation boundaries, and trusted-contact flow before expanding the AI layer or adding richer analytics.',
  ],
};

function getDemoSearchResult() {
  return clone(DEMO_SEARCH_RESULT);
}

function getDemoBuildPlan() {
  return clone(DEMO_BUILD_PLAN);
}

module.exports = {
  DEMO_IDEA,
  DEMO_SEARCH_DELAY_MS,
  DEMO_BUILD_DELAY_MS,
  getDemoBuildPlan,
  getDemoSearchResult,
  isDemoIdea,
  normalizeIdea,
};
