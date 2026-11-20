/**
 * Solution pages. Every "helps" item maps to a capability that exists in NARI Studio
 * (see features.ts). Do not add claims about outcomes, savings or customers.
 */

export interface Solution {
  slug: string;
  title: string;
  /** Short label for cards and the footer. */
  label: string;
  /** One line for cards and meta descriptions. */
  summary: string;
  seoTitle: string;
  metaDescription: string;
  audience: string;
  challenge: { heading: string; body: string[] };
  helps: { title: string; body: string }[];
  /** Starter course in the app that fits this use case. */
  starter: { name: string; body: string };
  /** Showcase demo slug to feature. */
  demo: string;
  /** Honest limits for this scenario. */
  note?: string;
}

export const solutions: Solution[] = [
  {
    slug: "corporate-training",
    title: "Corporate training and professional development",
    label: "Corporate training",
    summary: "Interactive training modules that report completion and scores to your LMS.",
    seoTitle: "Corporate training content creation",
    metaDescription:
      "Create interactive corporate training and professional development courses with NARI Studio, then publish SCORM or HTML5 to your learning management system.",
    audience: "L&D departments, training teams and professional development providers",
    challenge: {
      heading: "Training that people sit through, not learn from",
      body: [
        "Slide decks are quick to make but passive to take. Turning them into interactive modules usually means a heavyweight authoring suite, a long learning curve, or both.",
        "Teams also need the course to work with the LMS they already have: completion, scores and pass marks have to be reported properly.",
      ],
    },
    helps: [
      { title: "Start from slides you already have", body: "Import PowerPoint files as a starting point and read the Import report to see what converted and what needs rework." },
      { title: "Add real interaction", body: "Knowledge checks, drag-and-drop activities and branching scenarios turn a presentation into practice." },
      { title: "Report to your LMS", body: "Export SCORM 1.2 or SCORM 2004 with completion rules, pass marks and resume." },
      { title: "Keep content in-house", body: "Projects live on your computer and the app sends no usage data, which can simplify review by your IT team." },
    ],
    starter: { name: "Lesson with knowledge check", body: "A title slide, three content slides, a true/false check and a closing slide that completes the course." },
    demo: "welcome-first-week",
  },
  {
    slug: "employee-onboarding",
    title: "Employee onboarding",
    label: "Employee onboarding",
    summary: "Welcome new starters with short, clear modules and a check that they landed.",
    seoTitle: "Employee onboarding course creation",
    metaDescription:
      "Build employee onboarding courses with NARI Studio: short lessons, knowledge checks and branching scenarios, published as SCORM or HTML5.",
    audience: "HR and L&D teams, and managers who build onboarding for their own teams",
    challenge: {
      heading: "A first week full of information and no way to check it stuck",
      body: [
        "Onboarding material tends to be long documents and one-off presentations. New starters read it once, and nobody knows what they remembered.",
        "The content also changes often (tools, people, policies), so it has to be easy to update.",
      ],
    },
    helps: [
      { title: "Short lessons in a consistent layout", body: "Key-points, two-column and section slides keep modules readable and consistent." },
      { title: "Quick knowledge checks", body: "True/false and multiple-choice questions with feedback confirm the essentials." },
      { title: "Scenarios for judgement", body: "Branching scenarios let new starters practise a decision before they face it." },
      { title: "Easy to keep current", body: "Open the project, edit the slide, export again. Course files are plain project folders you can keep under your own version control." },
    ],
    starter: { name: "Lesson with knowledge check", body: "The structure used in the Welcome demo: key points, then a check question." },
    demo: "welcome-first-week",
  },
  {
    slug: "compliance-training",
    title: "Compliance training",
    label: "Compliance training",
    summary: "Scored assessments with question pools, pass marks and results your LMS can track.",
    seoTitle: "Compliance training course creation",
    metaDescription:
      "Create scored compliance and safety training with question pools, pass marks and SCORM reporting in NARI Studio.",
    audience: "Compliance, safety and quality teams that need assessed, trackable training",
    challenge: {
      heading: "Assessments need to be fair, varied and recorded",
      body: [
        "When everyone sees the same questions in the same order, answers get shared. Courses also have to record who passed, with what score, in the LMS.",
        "Learners who fail need a clear way to review and try again.",
      ],
    },
    helps: [
      { title: "Question pools", body: "Each learner is dealt a random selection of questions, in a random order." },
      { title: "Pass mark and completion rules", body: "Set the pass mark and choose when the course counts as complete: last slide, all slides, passing score or exit." },
      { title: "Results, review and retry", body: "A results slide shows pass/fail, lets learners review their answers and try again." },
      { title: "Answer records in SCORM", body: "Each question attempt is recorded as a SCORM interaction, alongside score and status." },
    ],
    starter: { name: "Knowledge quiz", body: "Six pooled questions, four dealt per learner, a results page with review and try again, and an 80% pass mark." },
    demo: "workplace-safety-check",
    note: "NARI Studio supplies the assessment mechanics. You remain responsible for the content meeting your regulatory requirements. Verification against specific LMSs is in progress during early access.",
  },
  {
    slug: "education",
    title: "Educational modules and interactive learning",
    label: "Education",
    summary: "Interactive lessons and activities for educators and institutions.",
    seoTitle: "Interactive lessons for educators",
    metaDescription:
      "Build interactive lessons, drag-and-drop activities and quizzes with NARI Studio and publish them as SCORM or HTML5 for your learning platform.",
    audience: "Teachers, lecturers, instructional technologists and institutional learning teams",
    challenge: {
      heading: "Engaging material without a development team",
      body: [
        "Educators often have good content but limited time and tooling. Static slides and PDFs do not give learners a way to practise.",
        "Institutions also care about accessibility and about where the content is hosted.",
      ],
    },
    helps: [
      { title: "Activities, not just slides", body: "Drag-and-drop matching and sorting, multiple choice and branching make a lesson interactive." },
      { title: "Accessibility checks built in", body: "Warnings for missing alt text, low-contrast text and media without captions appear before you publish." },
      { title: "Captions and media", body: "Add timed captions, import SRT or VTT files, and use audio and video." },
      { title: "Publish where you need", body: "Export SCORM for a learning platform, or an HTML5 package you can host yourself." },
    ],
    starter: { name: "Drag and drop practice", body: "An intro, a matching activity and a results page." },
    demo: "hazard-or-safeguard",
    note: "The built-in checks help you find common accessibility problems; formal screen-reader testing of exported courses is still in progress.",
  },
  {
    slug: "freelancers",
    title: "Freelance and independent course creators",
    label: "Freelancers",
    summary: "Build client courses quickly from templates and deliver standard packages.",
    seoTitle: "E-learning authoring software for freelancers",
    metaDescription:
      "NARI Studio is a focused e-learning authoring tool for freelance instructional designers and independent course creators. Offline, SCORM and HTML5 export.",
    audience: "Freelance instructional designers, independent trainers and small studios",
    challenge: {
      heading: "Client-ready courses on your own time and budget",
      body: [
        "Freelancers need to move quickly between clients, formats and LMSs, without carrying a heavy toolchain or depending on a subscription platform's availability.",
        "Clients often hand over PowerPoint or older Captivate projects as the starting material.",
      ],
    },
    helps: [
      { title: "Starter courses", body: "Five starter courses give you a working structure on day one." },
      { title: "Import what clients send", body: "PowerPoint and Captivate import with a report of what needs attention." },
      { title: "Standard deliverables", body: "SCORM 1.2, SCORM 2004 and HTML5 packages that fit most client LMSs." },
      { title: "Works offline", body: "Build on a train or at a client site; your files stay on your computer." },
    ],
    starter: { name: "Branching scenario", body: "A decision with three outcomes and a retry path, ready to adapt to a client's situation." },
    demo: "handling-a-delayed-order",
    note: "Commercial use will require a paid plan once plans launch. See the plan overview on the homepage.",
  },
];

export const getSolution = (slug: string) => solutions.find((s) => s.slug === slug);
