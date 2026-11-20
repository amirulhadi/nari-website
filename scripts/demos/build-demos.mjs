// Builds the Showcase demo courses with NARI Studio itself.
//
// It loads the app's real TypeScript modules (starter templates + HTML5 exporter)
// through the app's own Vite config, fills the starter courses with neutral demo
// content, and writes the exported HTML5 packages to public/demos/<slug>/.
// The output is what NARI Studio's "Export → HTML5" produces for these documents.
// Nothing in the app repo is modified.
//
// Usage: npm run demos        (NARI_APP_DIR overrides the app repo path)

import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const APP_DIR = path.resolve(process.env.NARI_APP_DIR ?? "D:/Projects NARI/NARI");
const OUT = path.resolve(fileURLToPath(new URL("../../public/demos/", import.meta.url)));

const requireFromApp = createRequire(path.join(APP_DIR, "package.json"));
const viteEntry = requireFromApp.resolve("vite");
const { createServer } = await import(pathToFileURL(viteEntry).href);

const server = await createServer({
  root: APP_DIR,
  logLevel: "silent",
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const { createProjectFromTemplate } = await server.ssrLoadModule("/src/domain/templates/courses.ts");
  const { planHtmlExport } = await server.ssrLoadModule("/src/export/index.ts");
  const { validateDocument } = await server.ssrLoadModule("/src/domain/validation/validateDocument.ts");
  const appVersion = JSON.parse(await readFile(path.join(APP_DIR, "package.json"), "utf8")).version;

  // ---- helpers -----------------------------------------------------------
  const byName = (slide, name) => slide.elements.find((el) => el.name === name);
  const setChoices = (question, prompt, labels, feedback) => {
    question.prompt = prompt;
    question.choices = question.choices.map((choice, i) => ({ ...choice, label: labels[i], correct: i === 0 }));
    if (feedback) {
      question.feedbackCorrect = feedback.correct;
      question.feedbackIncorrect = feedback.incorrect;
    }
  };
  const questionOf = (slide) => slide.elements.find((el) => el.type === "question");

  // ---- 1. Compliance quiz (Knowledge quiz template) ------------------------
  function workplaceSafety() {
    const doc = createProjectFromTemplate("quiz", "Workplace safety check");
    const intro = doc.slides[0];
    intro.name = "Introduction";
    intro.elements[0].text = "Workplace safety check";
    intro.elements[1].text = "Six short questions on everyday workplace safety. You are dealt four at random and need 80% to pass.";

    const questions = [
      ["Fire in the work area", "You notice a small fire in your work area. What do you do first?",
        ["Raise the alarm and follow the evacuation procedure", "Look for what caused it", "Finish your task, then report it"],
        { correct: "Right. Raising the alarm protects everyone.", incorrect: "Not quite. Raise the alarm first." }],
      ["Spill in a corridor", "You find a liquid spill in a busy corridor. What is the best action?",
        ["Mark the area and report it so it is cleaned up", "Walk around it", "Leave it, someone will see it"],
        { correct: "Correct. Mark it and report it.", incorrect: "Not quite. Mark the spill and report it." }],
      ["Lifting a heavy box", "How should you lift a heavy box from the floor?",
        ["Bend your knees and keep the load close to your body", "Bend from the waist and twist as you lift", "Lift quickly with a jerk"],
        { correct: "Correct. Use your legs and keep the load close.", incorrect: "Not quite. Bend your knees and keep the load close." }],
      ["A near miss", "A tool nearly falls from a shelf but nobody is hurt. What should you do?",
        ["Report it so the cause can be fixed", "Do nothing, no one was hurt", "Mention it only if it happens again"],
        { correct: "Correct. Near misses are early warnings.", incorrect: "Not quite. Report near misses too." }],
      ["Emergency exits", "Where is it acceptable to store boxes?",
        ["Anywhere except in front of exits and fire equipment", "In front of an emergency exit, just for today", "Next to the fire extinguisher"],
        { correct: "Correct. Exits and equipment stay clear.", incorrect: "Not quite. Keep exits and fire equipment clear." }],
      ["Working at a screen", "Which habit helps when you work at a screen all day?",
        ["Take short breaks and change position regularly", "Stay in one position until you finish", "Work with the screen as bright as possible"],
        { correct: "Correct. Regular breaks help.", incorrect: "Not quite. Take short breaks and change position." }],
    ];
    questions.forEach(([title, prompt, labels, feedback], i) => {
      const slide = doc.slides[i + 1];
      slide.name = title;
      byName(slide, "Heading").text = title;
      const question = questionOf(slide);
      setChoices(question, prompt, labels, feedback);
    });
    return doc;
  }

  // ---- 2. Branching scenario ------------------------------------------------
  function customerScenario() {
    const doc = createProjectFromTemplate("scenario", "Handling a delayed order");
    const [intro, decision, good, ok, bad, summary] = doc.slides;
    intro.name = "Introduction";
    decision.name = "The customer is waiting";
    summary.name = "Summary";
    intro.elements[0].text = "Handling a delayed order";
    intro.elements[1].text = "A customer is upset about a late delivery. Choose how you respond and see what happens.";
    byName(decision, "Heading").text = "The customer is waiting";
    byName(decision, "Situation").text = "A customer writes: \"My order was due yesterday and I have heard nothing. I need it for Friday.\" You can see the parcel is delayed at the depot.";
    const buttons = decision.elements.filter((el) => el.type === "button");
    buttons[0].label = "Apologise and give a clear update";
    buttons[1].label = "Explain that the courier is to blame";
    buttons[2].label = "Promise delivery tomorrow";
    good.name = "Outcome: clear update";
    byName(good, "Outcome").text = "The customer feels informed";
    byName(good, "Explanation").text = "You apologised, said what you know and what you will check, and promised an update by a set time. The customer replies that they appreciate the honesty.";
    ok.name = "Outcome: blame";
    byName(ok, "Outcome").text = "The customer is not reassured";
    byName(ok, "Explanation").text = "The explanation may be true, but it does not help the customer with Friday. They ask what you are going to do about it.";
    bad.name = "Outcome: unsure promise";
    byName(bad, "Outcome").text = "The promise is broken";
    byName(bad, "Explanation").text = "You could not confirm the new date, and the parcel does not arrive. The customer is now more frustrated. Go back and try a different response.";
    byName(summary, "Message").text = "In a delay, an apology, honest facts and a next step matter most.";
    return doc;
  }

  // ---- 3. Onboarding lesson (Lesson template) -------------------------------
  function onboardingLesson() {
    const doc = createProjectFromTemplate("lesson", "Welcome: your first week");
    const [title, k1, k2, k3, check] = doc.slides;
    title.name = "Welcome";
    check.name = "Knowledge check";
    title.elements[0].text = "Welcome: your first week";
    title.elements[1].text = "Three things to do, and one question to check you have them.";
    const keyPoints = [
      ["Meet your team", "• Your manager will introduce you on day one\n• Ask each person what they work on\n• Find your onboarding buddy"],
      ["Set up your tools", "• Sign in to your email and chat\n• Join your team's channels\n• Book your first training sessions"],
      ["Know where to get help", "• Your buddy is your first contact\n• The help desk handles equipment and access\n• HR answers questions about your contract"],
    ];
    [k1, k2, k3].forEach((slide, i) => {
      slide.name = keyPoints[i][0];
      byName(slide, "Title").text = keyPoints[i][0];
      byName(slide, "Points").text = keyPoints[i][1];
    });
    const question = questionOf(check);
    question.prompt = "True or false: it is fine to wait until the end of the week to ask your buddy a question.";
    question.choices = question.choices.map((choice) => ({ ...choice, correct: choice.label === "False" }));
    question.feedbackCorrect = "Right. Ask early. Your buddy expects questions from day one.";
    question.feedbackIncorrect = "Not quite. Ask early; your buddy expects questions from day one.";
    return doc;
  }

  // ---- 4. Drag-and-drop practice --------------------------------------------
  function hazardsAndSafeguards() {
    const doc = createProjectFromTemplate("dragdrop", "Hazard or safeguard?");
    const [intro, exercise] = doc.slides;
    intro.name = "Introduction";
    intro.elements[0].text = "Hazard or safeguard?";
    intro.elements[1].text = "Drag each item to the zone where it belongs.";
    exercise.name = "Sort the items";
    byName(exercise, "Heading").text = "Sort the items";
    const question = questionOf(exercise);
    question.prompt = "Is each item a hazard, or something that keeps people safe?";
    const items = [
      ["hz1", "Wet floor"], ["hz2", "Frayed cable"], ["hz3", "Blocked exit"],
      ["sg1", "Warning sign"], ["sg2", "Machine guard"], ["sg3", "Clear walkway"],
    ];
    question.items = items.map(([id, label]) => ({ id, label }));
    question.zones = [
      { id: "zone_hazard", label: "Hazard", capacity: 0, correctItemIds: ["hz1", "hz2", "hz3"] },
      { id: "zone_safeguard", label: "Safeguard", capacity: 0, correctItemIds: ["sg1", "sg2", "sg3"] },
    ];
    question.scoringMode = "partial";
    question.shuffleItems = true;
    question.feedbackCorrect = "All six are in the right place.";
    question.feedbackIncorrect = "Not quite. Move items and try again.";
    return doc;
  }

  const demos = [
    { slug: "workplace-safety-check", build: workplaceSafety },
    { slug: "handling-a-delayed-order", build: customerScenario },
    { slug: "welcome-first-week", build: onboardingLesson },
    { slug: "hazard-or-safeguard", build: hazardsAndSafeguards },
  ];

  await rm(OUT, { recursive: true, force: true });
  const manifest = { app: "NARI Studio", appVersion, generatedAt: new Date().toISOString(), demos: [] };

  for (const { slug, build } of demos) {
    const doc = build();
    const issues = validateDocument(doc).filter((issue) => issue.severity === "error");
    if (issues.length) throw new Error(`${slug}: validation errors: ${issues.map((i) => i.message).join("; ")}`);
    const plan = planHtmlExport(doc);
    const dir = path.join(OUT, slug);
    await mkdir(dir, { recursive: true });
    for (const file of plan.files) {
      if (file.kind !== "text") throw new Error(`${slug}: unexpected non-text file ${file.relativePath}`);
      await writeFile(path.join(dir, file.relativePath), file.content, "utf8");
    }
    manifest.demos.push({ slug, name: doc.name, slides: doc.slides.length });
    console.log(`  ✓ ${slug} (${doc.slides.length} slides, ${plan.files.length} files)`);
  }

  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Done: ${manifest.demos.length} demo courses exported by NARI Studio v${appVersion}`);
} finally {
  await server.close();
}
