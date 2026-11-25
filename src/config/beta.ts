/**
 * NARI Studio Beta Edition facts.
 *
 * Source of truth: the Studio repo, docs/beta/ (KNOWN_ISSUES.md, TESTER_GUIDE.md, RELEASE_NOTES.md)
 * and src-tauri/edition.json (edition "beta", exportQuota 10). Copy only what those files say.
 * The Captivate import is switched off in the beta (edition.json features.captivateImportEnabled),
 * so nothing on the beta pages mentions it. scripts/test/site-check.mjs fails if that changes.
 */

export const beta = {
  /** Build the beta documents describe. */
  version: "0.9.1",
  platform: "Windows 10 or 11, 64-bit",
  /** Successful exports allowed per installation (edition.json exportQuota). */
  exportLimit: 10,
} as const;

export const betaDiffs = [
  {
    title: `${beta.exportLimit} exports per installation`,
    body: "Each export that finishes successfully uses one. Failed or cancelled exports, and previews, do not count. Preview is unlimited. At zero you can still open, edit, preview and save.",
  },
  {
    title: "Windows only",
    body: `${beta.platform}. There is no macOS build in the beta.`,
  },
  {
    title: "No watermark",
    body: "The beta label shows in the app only. Nothing is added to the courses you export.",
  },
  {
    title: "Nothing is sent automatically",
    body: "NARI Studio works on your computer and sends no projects, media, usage or errors. A feedback report holds only what you write plus the details you choose to include.",
  },
];

export const knownIssues = [
  {
    area: "Install",
    issue: "The installer is not code-signed, so Windows SmartScreen shows “Windows protected your PC” or an unknown publisher.",
    action: "Click More info, then Run anyway. Do this only for an installer you received directly from the NARI team.",
  },
  {
    area: "Install",
    issue: "A PC without the Microsoft Edge WebView2 Runtime (some Windows 10 machines) downloads it during install, which needs an internet connection.",
    action: "Install while online. Windows 11 already has WebView2.",
  },
  {
    area: "Export",
    issue: "The window stops responding while a large course (lots of video) is exported, then recovers when the export finishes.",
    action: "Wait for the Export finished message and do not close the app.",
  },
  {
    area: "Export",
    issue: `The beta allows ${beta.exportLimit} successful exports per installation.`,
    action: "Preview is unlimited. Use it to check a course before you export.",
  },
  {
    area: "Import",
    issue: "PowerPoint import is best-effort. Animations, transitions, audio, video and speaker notes are not imported.",
    action: "Check the Import report after importing. Send the report, not the file, unless the team asks for it.",
  },
  {
    area: "LMS",
    issue: "SCORM packages have not been certified against every LMS.",
    action: "Test in your LMS or in SCORM Cloud, and tell the team the LMS name and what happened.",
  },
  {
    area: "Updates",
    issue: "There is no automatic update.",
    action: "Install a new beta build over the old one. Your projects and remaining exports are kept.",
  },
  {
    area: "Feedback",
    issue: "Feedback is not sent from inside the app.",
    action: "Use Copy report or Save as file, and send it the way the NARI team asked you to.",
  },
  {
    area: "Platform",
    issue: "Windows only in this beta.",
    action: "No macOS build yet.",
  },
];

export const testerSteps = {
  install: [
    "Run the installer, NARI Studio_0.9.1_x64-setup.exe. It installs for your Windows user only and needs no administrator rights.",
    "If Windows shows “Windows protected your PC”, click More info, then Run anyway. The beta installer is not code-signed yet.",
    "Start NARI Studio from the Start menu. You see the start-up screen with BETA EDITION, then the Home screen.",
  ],
  know: [
    `You have ${beta.exportLimit} exports in this beta. Only exports that finish successfully count. The Export menu and About show how many are left.`,
    "Save projects somewhere you can find again, for example Documents\\NARI Courses. A project is a folder ending in .nari.",
    "Nothing you do is sent to the NARI team automatically.",
  ],
  tasks: [
    "Start a course: New project, pick a template, choose where to save.",
    "Edit: change text, add an image, a video or an audio file, move and resize objects, change the theme.",
    "Add interactivity: a button that jumps to another slide, and a quiz question (multiple choice or drag-and-drop).",
    "Use the timeline: change when an object appears and add an animation.",
    "Preview the entire course. Answer the quiz both right and wrong.",
    "Save, close NARI Studio, open it again and open the project from Recent projects.",
    "Optional: import a real .pptx and read the Import report.",
    "Export SCORM 1.2 (or the format your LMS uses). Upload the .zip to your LMS or to SCORM Cloud and check that the course plays and reports completion and score.",
  ],
  feedback: [
    "Open Send feedback on Home, Feedback in the editor, or About, then Send beta feedback.",
    "Pick a type: Bug report, Feature suggestion, Usability, Performance or General comment.",
    "Write a one-line summary and the details. For bugs, say what you did, what happened and what you expected.",
    "Optionally include the app version and system information and the recent error log. Preview exactly what will be shared before you send it.",
    "Copy the report or save it as a file, then send it to the contact the NARI team gave you. Do not send course files or media unless the team asks.",
  ],
  trouble: [
    "“NARI Studio could not start”: restart Windows and try again. If it repeats, send the message text to the team.",
    "“Something went wrong” screen: click Copy details, include it in a bug report, then go to Home. Projects saved on disk keep their last autosave.",
    `“Beta export allowance reached”: you have used your ${beta.exportLimit} exports. You can keep editing and previewing. Contact the NARI team if you need more for your evaluation.`,
  ],
};
