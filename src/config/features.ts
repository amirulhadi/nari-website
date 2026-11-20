/**
 * Feature catalogue: the single source for what the website says NARI Studio can do.
 *
 * Every "available" item is backed by the app's as-built notes
 * (NARI repo: PROJECT_CONTEXT.md §8, §12, §18–31). Do not add an "available" item
 * without checking the app. Use "in-development" or "planned" otherwise.
 */

export type FeatureStatus = "available" | "in-development" | "planned";

export interface Feature {
  title: string;
  detail: string;
  status: FeatureStatus;
}

export interface FeatureGroup {
  id: string;
  title: string;
  summary: string;
  features: Feature[];
}

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  available: "Available",
  "in-development": "In development",
  planned: "Planned",
};

export const featureGroups: FeatureGroup[] = [
  {
    id: "authoring",
    title: "Authoring",
    summary: "A focused slide editor with a real timeline, built for course work.",
    features: [
      { title: "Visual slide canvas", detail: "Select, move, resize, rotate, align, layer, nudge and copy objects; edit text right on the slide.", status: "available" },
      { title: "Timeline", detail: "Set when each object appears and for how long, scrub and play, add bookmarks that trigger actions.", status: "available" },
      { title: "Enter and exit animations", detail: "Fourteen effects including fade, fly, zoom, wipe, morph and page turn, with reduced-motion support.", status: "available" },
      { title: "Undo, autosave and recovery", detail: "Full undo history, autosave every few seconds and safe saves with a backup copy.", status: "available" },
      { title: "Rich text and object grouping", detail: "Per-word styling, lists and grouped objects.", status: "planned" },
    ],
  },
  {
    id: "slides",
    title: "Slides & templates",
    summary: "Start from a working course instead of a blank page.",
    features: [
      { title: "Five starter courses", detail: "Knowledge quiz, Lesson with knowledge check, Branching scenario, Drag-and-drop practice and Blank.", status: "available" },
      { title: "Eleven slide layouts", detail: "Title, key points, two columns, section header, quiz, true/false, drag and drop, results, thank you and more.", status: "available" },
      { title: "Slide management", detail: "Duplicate, reorder, rename and hide slides; colour or image backgrounds.", status: "available" },
      { title: "Themes", detail: "Four colour themes applied to new slides and objects.", status: "available" },
      { title: "Save your own templates", detail: "Reuse your own course structures across projects.", status: "planned" },
    ],
  },
  {
    id: "media",
    title: "Media",
    summary: "Images, audio and video with the controls course authors need.",
    features: [
      { title: "Image tools", detail: "Crop, fit, filters, blend modes, borders, rounded corners and shadows.", status: "available" },
      { title: "Video background removal", detail: "Remove a green-screen background from presenter video, with fine-tuning controls.", status: "available" },
      { title: "Audio and video playback", detail: "Autoplay, loop, controls, poster frames and \"wait until the video ends\" before moving on.", status: "available" },
      { title: "Captions", detail: "Timed captions on the timeline, SRT and VTT import, and a CC switch for learners.", status: "available" },
      { title: "Text-to-speech narration", detail: "Generate narration from your script.", status: "planned" },
    ],
  },
  {
    id: "interactions",
    title: "Interactions & logic",
    summary: "Make courses respond to what the learner does.",
    features: [
      { title: "Click actions", detail: "Go to a slide, show, hide or toggle objects, play or pause media, change an object's state, set variables, exit the course.", status: "available" },
      { title: "Branching", detail: "Send learners down different paths by score, variable or question result.", status: "available" },
      { title: "Conditional content", detail: "Show objects only when a condition holds, such as a passing score.", status: "available" },
      { title: "Live text", detail: "Insert the learner's score, points, pass mark or any variable into text.", status: "available" },
    ],
  },
  {
    id: "assessment",
    title: "Quizzes & assessment",
    summary: "Assessment that is fair, varied and reports properly to your LMS.",
    features: [
      { title: "Question types", detail: "Multiple choice, true/false and drag-and-drop, plus quizzes built from any objects on the slide.", status: "available" },
      { title: "Question pools", detail: "Each learner gets a random selection of questions in a random order.", status: "available" },
      { title: "Results, review and retry", detail: "A results slide with pass/fail, a read-only review of answers and a try-again option.", status: "available" },
      { title: "Attempts, feedback and pass mark", detail: "Limit attempts, give feedback and set the pass mark used for completion.", status: "available" },
    ],
  },
  {
    id: "accessibility",
    title: "Accessibility",
    summary: "Catch common accessibility problems before you publish.",
    features: [
      { title: "Built-in checks", detail: "Warnings for missing alt text, low contrast text and media without captions.", status: "available" },
      { title: "Keyboard-friendly player", detail: "Exported courses work with the keyboard and announce slide changes to screen readers.", status: "available" },
      { title: "Screen-reader verification", detail: "Formal testing with NVDA, JAWS and VoiceOver.", status: "in-development" },
    ],
  },
  {
    id: "publishing",
    title: "Publishing",
    summary: "Package your course for a learning management system or the web.",
    features: [
      { title: "SCORM 1.2 and SCORM 2004", detail: "Completion rules, pass/fail, score, answer records and resume where the learner left off.", status: "available" },
      { title: "HTML5 package", detail: "A standalone course that runs in any modern browser.", status: "available" },
      { title: "Check before export", detail: "A validation step that flags broken links, missing media and quiz problems.", status: "available" },
      { title: "Testing in production LMSs", detail: "Verification in SCORM Cloud and common LMSs.", status: "in-development" },
      { title: "xAPI and cmi5", detail: "Modern tracking standards.", status: "planned" },
    ],
  },
  {
    id: "migration",
    title: "Migration",
    summary: "Bring existing material in as a starting point.",
    features: [
      { title: "PowerPoint import", detail: "Slides with layouts, text, shapes, tables, charts and images (best effort).", status: "available" },
      { title: "Captivate import", detail: "Slides, text and media from .cpt and .cptx files (best effort).", status: "available" },
      { title: "Import report", detail: "Shows what converted, what needs attention and where, slide by slide.", status: "available" },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    summary: "A desktop app that works offline and keeps your files with you.",
    features: [
      { title: "Windows", detail: "Desktop app for Windows, offered through early access.", status: "available" },
      { title: "Works offline, no tracking", detail: "Projects stay on your computer; the app sends no usage data.", status: "available" },
      { title: "macOS", detail: "Desktop app for macOS.", status: "planned" },
    ],
  },
];
