/**
 * Showcase entries. Each demo is a REAL NARI Studio export (npm run demos →
 * public/demos/<slug>/), built from a starter course with neutral demo content.
 * Things NARI Studio can do but these demos do not show (video, captions, images)
 * are listed in `notShown` on the Showcase page instead of being faked.
 */

export interface Demo {
  slug: string;
  title: string;
  kind: string;
  template: string;
  summary: string;
  /** Plain-language steps for visitors trying the demo. */
  tryThis: string[];
  /** Product capabilities this demo exercises (must exist in features.ts). */
  uses: string[];
  disclaimer?: string;
}

export const demos: Demo[] = [
  {
    slug: "workplace-safety-check",
    title: "Workplace safety check",
    kind: "Scored assessment",
    template: "Knowledge quiz",
    summary: "Six safety questions, four dealt at random, with a results slide, review and retry.",
    tryThis: [
      "Press Start, then answer the questions.",
      "Open the course again with Restart and notice the questions change.",
      "On the results slide, use Review answers, then Try again.",
    ],
    uses: ["Question pools", "Pass mark", "Results and review", "Randomised answer order"],
    disclaimer: "Demonstration content only. It is not a safety training course.",
  },
  {
    slug: "handling-a-delayed-order",
    title: "Handling a delayed order",
    kind: "Branching scenario",
    template: "Branching scenario",
    summary: "A customer-service decision with three responses, three outcomes and a retry path.",
    tryThis: [
      "Press Start, read the situation and pick a response.",
      "Read the outcome. The third choice lets you try again.",
      "Go back and take a different path.",
    ],
    uses: ["Branching by learner choice", "Go-to-slide actions", "Interactive buttons"],
    disclaimer: "Demonstration content only.",
  },
  {
    slug: "welcome-first-week",
    title: "Welcome: your first week",
    kind: "Lesson with knowledge check",
    template: "Lesson with knowledge check",
    summary: "A short onboarding lesson with three key-point slides and a true/false check.",
    tryThis: [
      "Step through the three key-point slides with Continue.",
      "Answer the true/false check and read the feedback.",
      "Finish the course on the last slide.",
    ],
    uses: ["Slide layouts", "True/false question", "Feedback", "Course completion"],
    disclaimer: "Demonstration content only.",
  },
  {
    slug: "hazard-or-safeguard",
    title: "Hazard or safeguard?",
    kind: "Drag-and-drop activity",
    template: "Drag and drop practice",
    summary: "Sort six items into two zones, with partial credit and a results slide.",
    tryThis: [
      "Drag each item into a zone, then press Submit.",
      "Try a wrong placement to see the feedback and the retry.",
      "Finish on the results slide.",
    ],
    uses: ["Drag-and-drop question", "Partial-credit scoring", "Attempts and feedback"],
    disclaimer: "Demonstration content only.",
  },
];

export const notShown = [
  "Video with background removal, audio narration and timed captions: the starter courses use no media, so these demos can't show them yet.",
  "PowerPoint import: the Import report is shown in the app, but is not part of an exported course.",
  "SCORM reporting: these demos are the HTML5 export. SCORM packages report to your LMS.",
];

export const getDemo = (slug: string) => demos.find((d) => d.slug === slug);
