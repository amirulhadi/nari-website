(() => {
  const docEl = document.getElementById("nari-document");
  if (!docEl) throw new Error("Missing #nari-document");
  const documentModel = JSON.parse(docEl.textContent || "{}");
  // Respect the learner's OS setting: no entrance/exit animations.
  const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Drag-and-drop rules shared with the editor preview (injected from
  // src/domain/quiz/dragDrop.ts so both players grade identically).
  const gradeDragDrop = (function gradeDragDrop(question, placements) {
  const acceptedBy = /* @__PURE__ */ new Map();
  for (const zone of question.zones || []) {
    for (const itemId of zone.correctItemIds || []) {
      let zones = acceptedBy.get(itemId);
      if (!zones) {
        zones = /* @__PURE__ */ new Set();
        acceptedBy.set(itemId, zones);
      };
      zones.add(zone.id);
    }
  };
  const requiredPairs = acceptedBy.size;
  const seenItems = /* @__PURE__ */ new Set();
  let correctPlaced = 0;
  let wrongPlaced = 0;
  for (const placement of placements || []) {
    if (seenItems.has(placement.itemId)) continue;
    seenItems.add(placement.itemId);
    const zones = acceptedBy.get(placement.itemId);
    if (zones && zones.has(placement.zoneId)) correctPlaced += 1;
    else wrongPlaced += 1;
  };
  const correct = requiredPairs > 0 && correctPlaced === requiredPairs && wrongPlaced === 0;
  let fraction = correct ? 1 : 0;
  if (!correct && question.scoringMode === "partial" && requiredPairs > 0) {
    fraction = Math.max(
      0,
      Math.min(1, (correctPlaced - wrongPlaced) / requiredPairs)
    );
  };
  return { correct, fraction, correctPlaced, wrongPlaced, requiredPairs };
});
  const applyDragDropPlacement = (function applyDragDropPlacement(question, placements, itemId, zoneId) {
  const current = placements || [];
  if (!(question.items || []).some((item) => item.id === itemId)) return null;
  const from = current.find((p) => p.itemId === itemId) || null;
  const rest = current.filter((p) => p.itemId !== itemId);
  if (zoneId === null) return rest;
  const zone = (question.zones || []).find((z) => z.id === zoneId);
  if (!zone) return null;
  if (from && from.zoneId === zoneId) return current;
  const occupants = rest.filter((p) => p.zoneId === zoneId);
  const capacity = zone.capacity > 0 ? zone.capacity : Infinity;
  if (occupants.length >= capacity) {
    if (capacity !== 1) return null;
    const occupant = occupants[0];
    const withoutOccupant = rest.filter((p) => p !== occupant);
    const swapped = from ? withoutOccupant.concat([{ itemId: occupant.itemId, zoneId: from.zoneId }]) : withoutOccupant;
    return swapped.concat([{ itemId, zoneId }]);
  };
  return rest.concat([{ itemId, zoneId }]);
});
  const orderDragDropItems = (function orderDragDropItems(question) {
  const items = (question.items || []).slice();
  if (!question.shuffleItems) return items;
  let h = 0;
  for (let i = 0; i < question.id.length; i++) {
    h = h * 31 + question.id.charCodeAt(i) >>> 0;
  };
  for (let i = items.length - 1; i > 0; i--) {
    h = Math.imul(h, 1664525) + 1013904223 >>> 0;
    const j = h % (i + 1);
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  };
  return items;
});
  const layoutPlacedObject = (function layoutPlacedObject(target, item, index, count) {
  const slots = Math.max(1, count);
  const slotWidth = target.width / slots;
  const centerX = target.x + slotWidth * (index + 0.5);
  const centerY = target.y + target.height / 2;
  return { x: centerX - item.width / 2, y: centerY - item.height / 2 };
});
  const NO_ATTEMPTS_LEFT_NOTE = " No attempts left — you can continue.";
  // Completion / pass-fail / resume rules (src/domain/scorm/completion.ts).
  const evaluateScormProgress = (function evaluateScormProgress(input) {
  let rule = input.rule;
  if (rule !== "lastSlide" && rule !== "allSlides" && rule !== "passScore" && rule !== "exitOnly") {
    rule = "lastSlide";
  };
  const passMark = typeof input.passMark === "number" && isFinite(input.passMark) ? Math.max(0, Math.min(100, input.passMark)) : 80;
  if (rule === "passScore" && !input.hasScore) rule = "lastSlide";
  const passed = input.hasScore ? input.scorePercent >= passMark : null;
  const playlist = input.playlist || [];
  const visited = input.visited || [];
  let met = false;
  if (rule === "lastSlide") {
    met = playlist.length > 0 && visited.indexOf(playlist[playlist.length - 1]) >= 0;
  } else if (rule === "allSlides") {
    met = playlist.length > 0 && playlist.every((id) => visited.indexOf(id) >= 0);
  } else if (rule === "passScore") {
    met = passed === true;
  } else {
    met = input.exited;
  };
  const complete = rule === "passScore" ? met : met || input.exited;
  return { report: complete || input.exited, complete, passed };
});
  const buildSuspendData = (function buildSuspendData(input, limit) {
  const index = (id) => input.playlist.indexOf(id);
  const v = input.visited.map(index).filter((i) => i >= 0);
  const a = {};
  for (const id of Object.keys(input.answers || {})) {
    const answer = input.answers[id];
    if (!answer || !answer.graded) continue;
    const entry = [answer.correct ? 1 : 0, answer.attempts || 0];
    if (typeof answer.earnedFraction === "number") {
      entry.push(Math.round(answer.earnedFraction * 100));
    };
    a[id] = entry;
  };
  const x = {};
  for (const id of Object.keys(input.variables || {})) {
    const value = input.variables[id];
    if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
      x[id] = value;
    }
  };
  const s = typeof input.seed === "number" ? input.seed : void 0;
  const full = { v, l: index(input.currentId), a, x, s };
  let text = JSON.stringify(full);
  if (text.length <= limit) return text;
  text = JSON.stringify({ v, l: full.l, a, s });
  if (text.length <= limit) return text;
  return JSON.stringify({ v, l: full.l, s });
});
  const readSuspendData = (function readSuspendData(text, playlist) {
  if (!text) return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return null;
  };
  if (!data || typeof data !== "object") return null;
  const d = data;
  const visited = [];
  if (Array.isArray(d.v)) {
    for (const i of d.v) {
      if (typeof i === "number" && playlist[i] !== void 0 && visited.indexOf(playlist[i]) < 0) {
        visited.push(playlist[i]);
      }
    }
  };
  const currentId = typeof d.l === "number" && playlist[d.l] !== void 0 ? playlist[d.l] : null;
  const answers = {};
  if (d.a && typeof d.a === "object") {
    const source = d.a;
    for (const id of Object.keys(source)) {
      const entry = source[id];
      if (!Array.isArray(entry) || entry.length < 2) continue;
      const restored = {
        graded: true,
        correct: entry[0] === 1,
        attempts: Number(entry[1]) || 0
      };
      if (typeof entry[2] === "number") restored.earnedFraction = entry[2] / 100;
      answers[id] = restored;
    }
  };
  const variables = {};
  if (d.x && typeof d.x === "object") {
    const source = d.x;
    for (const id of Object.keys(source)) {
      const value = source[id];
      if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
        variables[id] = value;
      }
    }
  };
  const seed = typeof d.s === "number" && isFinite(d.s) ? d.s : null;
  return { seed, visited, currentId, answers, variables };
});
  // Question pools and per-session shuffling (src/domain/quiz/pools.ts).
  const selectPlaylist = (function selectPlaylist(slides, pools, seed) {
  let a = seed >>> 0;
  const random = () => {
    a = a + 1831565813 >>> 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const poolById = {};
  (pools || []).forEach((pool) => {
    poolById[pool.id] = pool;
  });
  const members = {};
  const order = {};
  slides.forEach((slide, index) => {
    order[slide.id] = index;
    if (slide.poolId && poolById[slide.poolId]) {
      (members[slide.poolId] = members[slide.poolId] || []).push(slide.id);
    }
  });
  const drawn = {};
  Object.keys(members).forEach((poolId) => {
    const pool = poolById[poolId];
    let ids = members[poolId].slice();
    const wanted = Math.floor(pool.drawCount);
    const count = wanted > 0 && wanted < ids.length ? wanted : ids.length;
    const randomOrder = pool.shuffle !== false || count < ids.length;
    if (randomOrder) {
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const tmp = ids[i];
        ids[i] = ids[j];
        ids[j] = tmp;
      }
    };
    ids = ids.slice(0, count);
    if (pool.shuffle === false) ids.sort((x, y) => order[x] - order[y]);
    drawn[poolId] = ids;
  });
  const result = [];
  const placed = {};
  slides.forEach((slide) => {
    const poolId = slide.poolId;
    if (poolId && drawn[poolId]) {
      if (!placed[poolId]) {
        placed[poolId] = true;
        drawn[poolId].forEach((id) => result.push(id));
      }
    } else {
      result.push(slide.id);
    }
  });
  return result;
});
  const seededOrder = (function seededOrder(items, key, seed) {
  const arr = items.slice();
  let h = 0;
  for (let i = 0; i < key.length; i++) h = h * 31 + key.charCodeAt(i) >>> 0;
  if (typeof seed === "number") h = (h ^ seed >>> 0) >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    h = Math.imul(h, 1664525) + 1013904223 >>> 0;
    const j = h % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  };
  return arr;
});
  // Results slide score summary (src/domain/quiz/results.ts).
  const buildResultsSummary = (function buildResultsSummary(items, answers, passMark) {
  let max = 0;
  let earned = 0;
  const rows = [];
  items.forEach((item) => {
    const points = Math.max(0, item.points || 0);
    max += points;
    const answer = answers[item.id];
    let fraction = 0;
    if (answer && answer.graded) {
      fraction = answer.correct ? 1 : typeof answer.earnedFraction === "number" ? Math.max(0, Math.min(1, answer.earnedFraction)) : 0;
    };
    earned += points * fraction;
    rows.push({
      id: item.id,
      label: item.label,
      answered: !!(answer && answer.graded),
      correct: !!(answer && answer.graded && answer.correct),
      points,
      earned: points * fraction
    });
  });
  const mark = Math.max(0, Math.min(100, isFinite(passMark) ? passMark : 80));
  const hasScore = max > 0;
  const percent = hasScore ? Math.round(100 * earned / max) : 0;
  return {
    percent,
    earned: Math.round(earned * 100) / 100,
    max,
    hasScore,
    passed: hasScore ? percent >= mark : null,
    passMark: mark,
    rows
  };
});
  // Branching conditions and {{placeholders}} (src/domain/logic/conditions.ts).
  const evaluateCondition = (function evaluateCondition(condition, context) {
  if (!condition) return true;
  const toNumber = (value) => {
    if (typeof value === "number") return isFinite(value) ? value : null;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      return isFinite(n) ? n : null;
    };
    return null;
  };
  const compare = (left, op, right) => {
    const a = toNumber(left);
    const b = toNumber(right);
    if (a !== null && b !== null) {
      if (op === "==") return a === b;
      if (op === "!=") return a !== b;
      if (op === ">") return a > b;
      if (op === ">=") return a >= b;
      if (op === "<") return a < b;
      if (op === "<=") return a <= b;
      return false;
    };
    const sa = String(left === void 0 ? "" : left).toLowerCase();
    const sb = String(right === void 0 ? "" : right).toLowerCase();
    if (op === "==") return sa === sb;
    if (op === "!=") return sa !== sb;
    return false;
  };
  if (condition.source === "question") {
    const answer = condition.elementId ? context.answers[condition.elementId] : void 0;
    const answered = !!(answer && answer.graded);
    const wanted = String(condition.value);
    if (wanted === "correct") return answered && !!answer.correct;
    if (wanted === "incorrect") return answered && !answer.correct;
    if (wanted === "answered") return answered;
    if (wanted === "unanswered") return !answered;
    return false;
  };
  if (condition.source === "score") {
    return compare(context.scorePercent, condition.op, condition.value);
  };
  if (condition.source === "variable") {
    const value = condition.variableId ? context.variables[condition.variableId] : void 0;
    return compare(value, condition.op, condition.value);
  };
  return false;
});
  const fillPlaceholders = (function fillPlaceholders(text, values) {
  if (typeof text !== "string" || text.indexOf("{{") < 0) return text;
  return text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (whole, name) => {
    const key = name.toLowerCase();
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole;
  });
});

  const playable = () => documentModel.slides.filter((s) => !s.hidden);
  const byId = (id) => documentModel.slides.find((s) => s.id === id) || null;
  const assetUrl = (assetId) => {
    const assets = documentModel.assets || [];
    let asset = null;
    for (let i = 0; i < assets.length; i++) {
      if (assets[i].id === assetId) asset = assets[i];
    }
    return asset ? asset.relativePath.replace(/^\/+/, "") : "";
  };

  function parseHexColor(hex) {
    const raw = String(hex || "#000000").trim().replace(/^#/, "");
    if (raw.length === 3) {
      return {
        r: parseInt(raw[0] + raw[0], 16),
        g: parseInt(raw[1] + raw[1], 16),
        b: parseInt(raw[2] + raw[2], 16),
      };
    }
    if (raw.length >= 6) {
      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16),
      };
    }
    return { r: 0, g: 0, b: 0 };
  }

  function clampPercent(value, fallback) {
    if (value == null || !isFinite(value)) return fallback;
    return Math.max(0, Math.min(100, value));
  }

  function resolveChromaKey(el) {
    const stored = el && el.backgroundRemoval;
    if (stored) {
      if (!stored.enabled || (stored.method && stored.method !== "chromaKey")) {
        return null;
      }
      const ck = stored.chromaKey || {};
      return {
        keyColor: ck.keyColor || el.backgroundKeyColor || "#00FF00",
        similarity: clampPercent(ck.similarity, 40),
        smoothness: clampPercent(ck.smoothness, 25) / 100,
        spill: clampPercent(ck.spillReduction, 30) / 100,
        feather: clampPercent(ck.edgeFeather, 22),
      };
    }
    if (!el || !el.blendBlackBackground) return null;
    return {
      keyColor: el.backgroundKeyColor || "#000000",
      similarity: clampPercent(el.backgroundKeyTolerance, 44),
      smoothness: 0.2,
      spill: 0,
      feather: clampPercent(el.backgroundKeySoftness, 22),
    };
  }

  function normalizeVideoKey(el) {
    const chroma = resolveChromaKey(el);
    if (!chroma) return null;
    const similarity = chroma.similarity * 2.55;
    const feather = Math.max(1, chroma.feather * 2.55);
    return {
      color: parseHexColor(chroma.keyColor),
      similarity: similarity,
      feather: feather,
      smoothness: chroma.smoothness,
      spill: chroma.spill,
      tolerance: similarity,
      softness: feather,
    };
  }

  function computeVideoDrawRect(fit, boxWidth, boxHeight, videoWidth, videoHeight) {
    if (boxWidth <= 0 || boxHeight <= 0 || videoWidth <= 0 || videoHeight <= 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    if (fit === "fill") return { x: 0, y: 0, width: boxWidth, height: boxHeight };
    const scale =
      fit === "cover"
        ? Math.max(boxWidth / videoWidth, boxHeight / videoHeight)
        : Math.min(boxWidth / videoWidth, boxHeight / videoHeight);
    const width = videoWidth * scale;
    const height = videoHeight * scale;
    return {
      x: (boxWidth - width) / 2,
      y: (boxHeight - height) / 2,
      width,
      height,
    };
  }

  function applyVideoChromaKey(imageData, key) {
    const data = imageData.data;
    const kr = key.color.r;
    const kg = key.color.g;
    const kb = key.color.b;
    const inner = key.similarity != null ? key.similarity : key.tolerance;
    const feather = key.feather != null ? key.feather : key.softness;
    const outer = inner + Math.max(1, feather);
    const spillRange = outer * 1.5;
    const smoothness = key.smoothness || 0;
    const spill = key.spill || 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (!alpha) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dr = r - kr;
      const dg = g - kg;
      const db = b - kb;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);
      let nextAlpha = alpha;
      if (distance <= inner) {
        nextAlpha = 0;
      } else if (distance < outer) {
        let t = (distance - inner) / (outer - inner);
        if (smoothness > 0) {
          const x = Math.max(0, Math.min(1, t));
          const eased = x * x * (3 - 2 * x);
          t = t * (1 - smoothness) + eased * smoothness;
        }
        nextAlpha = Math.round(alpha * t);
      }
      if (nextAlpha > 0 && spill > 0) {
        const proximity = 1 - Math.min(1, distance / spillRange);
        if (proximity > 0) {
          const amount = spill * proximity;
          if (kg >= kr && kg >= kb) {
            const replace = Math.max(r, b);
            data[i + 1] = g + (replace - g) * amount;
          } else if (kb >= kr && kb >= kg) {
            const replace = Math.max(r, g);
            data[i + 2] = b + (replace - b) * amount;
          } else {
            const replace = Math.max(g, b);
            data[i] = r + (replace - r) * amount;
          }
        }
      }
      data[i + 3] = nextAlpha;
    }
  }

  function drawKeyedVideoFrame(video, canvas, el) {
    const key = normalizeVideoKey(el);
    if (!key || !canvas) return;
    const boxWidth = canvas.clientWidth;
    const boxHeight = canvas.clientHeight;
    if (boxWidth <= 0 || boxHeight <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.round(boxWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(boxHeight * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = boxWidth + "px";
      canvas.style.height = boxHeight + "px";
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, boxWidth, boxHeight);
    const rect = computeVideoDrawRect(
      el.fit || "contain",
      boxWidth,
      boxHeight,
      video.videoWidth,
      video.videoHeight
    );
    if (rect.width <= 0 || rect.height <= 0) return;
    ctx.drawImage(video, rect.x, rect.y, rect.width, rect.height);
    const imageData = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
    applyVideoChromaKey(imageData, key);
    ctx.putImageData(imageData, 0, 0);
  }

  function slideTimelineStartTime(slide) {
    if (!slide) return 0;
    const times = (slide.bookmarks || [])
      .filter(function (bookmark) {
        return (bookmark.actions || []).some(function (action) {
          return action.type === "startTimeline";
        });
      })
      .map(function (bookmark) {
        return bookmark.time;
      });
    if (!times.length) return 0;
    const start = Math.min.apply(null, times);
    return Math.max(0, Math.min(slide.duration, start));
  }

  function clampPlayheadToSlideStart(slide, playhead) {
    const start = slideTimelineStartTime(slide);
    return playhead < start - 0.0001 ? start : playhead;
  }

  /** A pool slide the learner was not dealt does not count towards the score. */
  function slideInPlay(slide) {
    if (!slide.poolId) return true;
    const pools = documentModel.pools || [];
    if (!pools.some(function (p) { return p.id === slide.poolId; })) return true;
    return state.playlist.indexOf(slide.id) >= 0;
  }

  function collectQuestions() {
    const list = [];
    for (const slide of documentModel.slides || []) {
      if (slide.hidden || !slideInPlay(slide)) continue;
      for (const el of slide.elements || []) {
        if (el.type === "question") list.push(el);
      }
    }
    return list;
  }

  function courseScorePercent() {
    // Questions plus slide drag-and-drop exercises (same answer map, by id).
    const qs = collectQuestions().concat(oddCourseGroups());
    const max = qs.reduce((sum, q) => sum + Math.max(0, q.points || 0), 0);
    if (max <= 0) return 0;
    let earned = 0;
    for (const q of qs) {
      const a = state.quizAnswers[q.id];
      if (!a || !a.graded) continue;
      // earnedFraction is only set for drag-and-drop; MCQ keeps all-or-nothing.
      const fraction = a.correct ? 1 : typeof a.earnedFraction === "number" ? a.earnedFraction : 0;
      earned += Math.max(0, q.points || 0) * Math.max(0, Math.min(1, fraction));
    }
    return Math.round((100 * earned) / max);
  }

  function syncScoreVariable() {
    const vars = documentModel.variables || [];
    const scoreVar = vars.find((v) => {
      const n = String(v.name).toLowerCase();
      return n === "score" || n === "nari_score";
    });
    if (!scoreVar) return;
    state.variables[scoreVar.id] = courseScorePercent();
  }

  function orderChoices(question) {
    const choices = [...(question.choices || [])];
    if (!question.shuffleChoices) return choices;
    return seededOrder(choices, question.id, state.shuffleSeed);
  }

  function canAttempt(question, answer) {
    if (state.reviewMode) return false; // review is read-only
    if (answer && answer.graded && answer.correct) return false;
    // Max attempts always applies; once used up the question closes (B8).
    if (question.maxAttempts > 0 && answer && answer.attempts >= question.maxAttempts) return false;
    return true;
  }

  function questionRequiresCorrect(el) {
    return el && el.type === "question" && el.requireCorrectToContinue !== false;
  }

  function slideChoiceGroupIds(slide) {
    const ids = [];
    const seen = {};
    (slide.elements || []).forEach(function (el) {
      const groupId = el.states && el.states.choiceGroupId;
      if (!groupId || el.states.isChoiceOption === false) return;
      if (el.states.isCorrectOption === true && !seen[groupId]) {
        seen[groupId] = true;
        ids.push(groupId);
      }
    });
    return ids;
  }

  function slideHasQuizGate(slide) {
    if (!slide) return false;
    if ((slide.elements || []).some(questionRequiresCorrect)) return true;
    if (oddGateGroups(slide).length > 0) return true;
    return slideChoiceGroupIds(slide).length > 0;
  }

  function slideQuizPassed(slide) {
    if (state.reviewMode) return true;
    if (!slideHasQuizGate(slide)) return true;
    for (const el of slide.elements || []) {
      if (!questionRequiresCorrect(el)) continue;
      const answer = state.quizAnswers[el.id];
      if (!answer || !answer.graded) return false;
    }
    const groups = slideChoiceGroupIds(slide);
    for (const groupId of groups) {
      if (!state.objectChoiceGroups[groupId] || !state.objectChoiceGroups[groupId].correct) {
        return false;
      }
    }
    for (const group of oddGateGroups(slide)) {
      const answer = state.quizAnswers[group.id];
      if (!answer || !answer.graded) return false;
    }
    return true;
  }

  function slideVideoElements(slide) {
    return (slide && slide.elements ? slide.elements : []).filter(function (el) {
      return el.type === "video" && el.visible !== false;
    });
  }

  function slideVideosCompleted(slide) {
    const videos = slideVideoElements(slide);
    if (!videos.length) return true;
    return videos.every(function (el) {
      return state.playhead >= el.timeline.startTime + el.timeline.duration - 0.001;
    });
  }

  function slidePlaybackCompleted(slide) {
    if (state.reviewMode) return true; // reviewing: no need to wait for the slide to play out
    const end = state.timelineStopAt != null ? state.timelineStopAt : slide.duration;
    return state.playhead >= end - 0.001;
  }

  var SLIDE_NOT_COMPLETE_MESSAGE =
    "Wait until this slide finishes playing before continuing.";

  function canGoNext() {
    const idx = state.playlist.indexOf(state.currentSlideId);
    if (idx < 0 || idx >= state.playlist.length - 1) return false;
    const slide = byId(state.currentSlideId);
    if (!slide) return false;
    return slideQuizPassed(slide) && slidePlaybackCompleted(slide);
  }

  function shouldAutoPlayNext() {
    const slide = byId(state.currentSlideId);
    return !!(slide && slideVideoElements(slide).length && slideVideosCompleted(slide));
  }

  function setQuizMessage(message, tone) {
    if (!message) window.clearTimeout(correctAdvanceTimer);
    state.quizGateMessage = message || "";
    state.quizGateTone = tone || "";
    const node = document.getElementById("nari-quiz-msg");
    if (!node) return;
    node.classList.remove("success");
    if (state.quizGateMessage) {
      node.textContent = state.quizGateMessage;
      node.classList.add("show");
      if (tone === "success") node.classList.add("success");
    } else {
      node.textContent = "";
      node.classList.remove("show");
    }
  }

  var correctAdvanceTimer = 0;
  function continueIfQuizComplete() {
    const slide = byId(state.currentSlideId);
    if (!slide || !slideQuizPassed(slide)) return false;
    window.clearTimeout(correctAdvanceTimer);
    setQuizMessage("");
    nextSlide(true, true);
    return true;
  }

  function scheduleCorrectAdvance() {
    window.clearTimeout(correctAdvanceTimer);
    if (state.quizFeedbackHold) return;
    const slide = byId(state.currentSlideId);
    if (!slide || !slideQuizPassed(slide)) return;
    const slideId = state.currentSlideId;
    const attempt = function () {
      if (state.currentSlideId !== slideId || state.quizGateTone !== "success" || state.quizFeedbackHold) return;
      const current = byId(slideId);
      if (!current || !slideQuizPassed(current)) return;
      if (!slidePlaybackCompleted(current)) {
        // Let the rest of the slide play first, then continue.
        correctAdvanceTimer = window.setTimeout(attempt, 400);
        return;
      }
      continueIfQuizComplete();
      if (!deferPlayerRender) render();
    };
    correctAdvanceTimer = window.setTimeout(attempt, 1800);
  }

  function submitDragDropQuestion(question) {
    const previous = state.quizAnswers[question.id];
    if (!canAttempt(question, previous)) return;
    const placements = (previous && previous.placements) || [];
    if (!placements.length) return;
    const attempts = ((previous && previous.attempts) || 0) + 1;
    const grade = gradeDragDrop(question, placements);
    const partialText = String(question.feedbackPartial || "").trim();
    let feedback = grade.correct
      ? question.feedbackCorrect || "Correct!"
      : grade.fraction > 0 && partialText
        ? partialText
        : question.feedbackIncorrect || "Incorrect.";
    const exhausted = question.maxAttempts > 0 && attempts >= question.maxAttempts;
    if (exhausted && !grade.correct) feedback += NO_ATTEMPTS_LEFT_NOTE;
    // Wrong answers keep placements so the learner can rearrange them.
    state.quizAnswers[question.id] = {
      selectedIds: [],
      placements: placements,
      attempts: attempts,
      graded: grade.correct || exhausted,
      correct: grade.correct,
      feedback: feedback,
      earnedFraction: grade.fraction,
    };
    syncScoreVariable();
    recordQuizInteraction(question, state.quizAnswers[question.id]);
    presentQuizFeedback(
      feedback,
      grade.correct ? "success" : "error",
      grade.correct ? question.feedbackCorrectSlideId : question.feedbackIncorrectSlideId,
    );
    if (!deferPlayerRender) render();
  }

  function submitQuestion(question) {
    if (question.kind === "dragDrop") {
      submitDragDropQuestion(question);
      return;
    }
    const previous = state.quizAnswers[question.id];
    if (!canAttempt(question, previous)) return;
    if (!previous || !previous.selectedIds || !previous.selectedIds.length) return;
    const attempts = (previous.attempts || 0) + 1;
    const correctIds = new Set((question.choices || []).filter((c) => c.correct).map((c) => c.id));
    const selected = new Set(previous.selectedIds);
    const correct =
      correctIds.size > 0 &&
      correctIds.size === selected.size &&
      [...correctIds].every((id) => selected.has(id));
    let feedback = correct
      ? question.feedbackCorrect || "Correct!"
      : question.feedbackIncorrect || "Incorrect. Try again.";
    const exhausted = question.maxAttempts > 0 && attempts >= question.maxAttempts;
    if (!correct && exhausted) feedback += NO_ATTEMPTS_LEFT_NOTE;
    if (!correct && !exhausted && question.requireCorrectToContinue !== false) {
      state.quizAnswers[question.id] = {
        selectedIds: [],
        attempts,
        graded: false,
        correct: false,
        feedback,
      };
      syncScoreVariable();
      recordQuizInteraction(question, state.quizAnswers[question.id], previous.selectedIds);
      presentQuizFeedback(
        feedback,
        "error",
        question.feedbackIncorrectSlideId,
      );
      if (!deferPlayerRender) render();
      return;
    }
    state.quizAnswers[question.id] = {
      selectedIds: previous.selectedIds,
      attempts,
      graded: correct || exhausted,
      correct,
      feedback,
    };
    syncScoreVariable();
    recordQuizInteraction(question, state.quizAnswers[question.id]);
    presentQuizFeedback(
      feedback,
      correct ? "success" : "error",
      correct ? question.feedbackCorrectSlideId : question.feedbackIncorrectSlideId,
    );
    if (!deferPlayerRender) render();
  }

  // Each session deals its own selection from the question pools.
  const initialSeed = Math.floor(Math.random() * 4294967296) >>> 0;
  const initialPlaylist = selectPlaylist(
    playable().map((s) => ({ id: s.id, poolId: s.poolId })),
    documentModel.pools,
    initialSeed,
  );
  const initialSlide = byId(initialPlaylist[0]) || playable()[0] || documentModel.slides[0] || null;
  const state = {
    reviewMode: false,
    shuffleSeed: initialSeed,
    currentSlideId: (initialSlide && initialSlide.id) || "",
    playhead: slideTimelineStartTime(initialSlide),
    isPlaying: false,
    variables: Object.fromEntries(
      (documentModel.variables || []).map((v) => [v.id, v.defaultValue])
    ),
    visibilityOverrides: {},
    stateOverrides: {},
    mediaPlaying: {},
    quizAnswers: {},
    objectChoiceGroups: {},
    finished: false,
    visitedSlideIds: [],
    firedBookmarkIds: [],
    timelineStopAt: null,
    playlist: initialPlaylist,
    quizGateMessage: "",
    quizGateTone: "",
    quizFeedbackHold: false,
    captionsOn: true,
  };
  if (state.currentSlideId) state.visitedSlideIds = [state.currentSlideId];

  const root = document.getElementById("nari-root");
  const settings = documentModel.settings || {};
  const allowFullscreen = settings.allowFullscreen !== false;
  const startInFullscreen = settings.startInFullscreen === true;
  const showPlaybar = settings.showPlaybar !== false;
  const hasCaptions = (documentModel.slides || []).some(function (sl) {
    return (sl.elements || []).some(function (e) { return e.type === "caption"; });
  });
  let didAutoFullscreen = false;
  root.innerHTML = `
    <div id="nari-app">
      <header id="nari-chrome">
        <strong id="nari-title"></strong>
        <span id="nari-meta"></span>
        <span style="flex:1"></span>
        <button type="button" id="btn-prev">Prev</button>
        <button type="button" id="btn-play" class="primary">Play</button>
        <button type="button" id="btn-restart">Restart</button>
        <button type="button" id="btn-next">Next</button>
      </header>
      <div id="nari-quiz-msg" role="status" aria-live="polite" aria-atomic="true"></div>
      <div id="nari-review-bar" hidden><span>Reviewing your answers</span><button type="button" id="btn-exit-review">Back to results</button></div>
      <div id="nari-sr-status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
      <div id="nari-body">
        <nav id="nari-slides" aria-label="Slides"></nav>
        <main id="nari-stage-wrap"><div id="nari-stage" role="region" aria-label="Slide"></div><div id="nari-done" hidden></div></main>
      </div>
      <div id="nari-playbar"${showPlaybar || allowFullscreen || hasCaptions ? ' class="show"' : ""}>
        <button type="button" id="btn-playbar-play"${showPlaybar ? "" : ' hidden'}>Play</button>
        <span id="nari-play-time"${showPlaybar ? "" : ' hidden'}>0:00.0</span>
        <input type="range" id="nari-scrub" min="0" max="10" step="0.05" value="0" aria-label="Playback position"${showPlaybar ? "" : ' hidden'} />
        <span id="nari-play-duration"${showPlaybar ? "" : ' hidden'}>0:00.0</span>
        ${hasCaptions ? '<button type="button" class="ghost" id="btn-cc" title="Turn captions off" aria-label="Turn captions off" aria-pressed="true">CC</button>' : ""}
        ${allowFullscreen ? '<button type="button" class="ghost" id="btn-fullscreen" title="Enter fullscreen" aria-label="Enter fullscreen"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : ""}
      </div>
      <div id="nari-preload" aria-hidden="true"></div>
      <footer id="nari-footer"></footer>
    </div>`;

  const app = document.getElementById("nari-app");
  const stage = document.getElementById("nari-stage");
  const slidesNav = document.getElementById("nari-slides");
  const meta = document.getElementById("nari-meta");
  const title = document.getElementById("nari-title");
  const footer = document.getElementById("nari-footer");
  const done = document.getElementById("nari-done");
  const btnPlay = document.getElementById("btn-play");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnFullscreen = document.getElementById("btn-fullscreen");
  const btnCc = document.getElementById("btn-cc");
  const srStatus = document.getElementById("nari-sr-status");
  const reviewBar = document.getElementById("nari-review-bar");
  document.getElementById("btn-exit-review").addEventListener("click", function () {
    exitReview();
    render();
  });
  const playbar = document.getElementById("nari-playbar");
  const btnPlaybarPlay = document.getElementById("btn-playbar-play");
  const playTimeEl = document.getElementById("nari-play-time");
  const playDurationEl = document.getElementById("nari-play-duration");
  const scrubEl = document.getElementById("nari-scrub");

  title.textContent = documentModel.name || "NARI Course";

  function formatPlayTime(seconds) {
    const total = Math.max(0, seconds || 0);
    const m = Math.floor(total / 60);
    const s = total - m * 60;
    return m + ":" + s.toFixed(1).padStart(4, "0");
  }

  function fullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function isAppFullscreen() {
    return fullscreenElement() === app;
  }

  var ICON_MAX =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_MIN =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 0-2-2H3M16 21v-3a2 2 0 0 1 2-2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function updateFullscreenLabel() {
    if (!btnFullscreen) return;
    const on = isAppFullscreen();
    btnFullscreen.innerHTML = on ? ICON_MIN : ICON_MAX;
    btnFullscreen.title = on ? "Exit fullscreen" : "Enter fullscreen";
    btnFullscreen.setAttribute(
      "aria-label",
      on ? "Exit fullscreen" : "Enter fullscreen",
    );
  }

  function stageFitScale(slide) {
    if (!slide) return 1;
    if (isAppFullscreen()) {
      const wrap = document.getElementById("nari-stage-wrap");
      const playbarEl = document.getElementById("nari-playbar");
      const availW = wrap ? wrap.clientWidth : window.innerWidth;
      const playbarH =
        playbarEl && playbarEl.classList.contains("show")
          ? playbarEl.offsetHeight
          : 0;
      const availH = Math.max(
        1,
        (wrap ? wrap.clientHeight : window.innerHeight) - playbarH,
      );
      if (availW > 0 && availH > 0) {
        return Math.min(availW / slide.width, availH / slide.height);
      }
    }
    return Math.min(1, 960 / slide.width, 620 / slide.height);
  }

  function requestAppFullscreen() {
    if (!app) return Promise.resolve();
    if (app.requestFullscreen) return app.requestFullscreen();
    if (app.webkitRequestFullscreen) return app.webkitRequestFullscreen();
    if (app.mozRequestFullScreen) return app.mozRequestFullScreen();
    if (app.msRequestFullscreen) return app.msRequestFullscreen();
    return Promise.resolve();
  }

  function exitAppFullscreen() {
    if (document.exitFullscreen && document.fullscreenElement) {
      return document.exitFullscreen();
    }
    if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
      return document.webkitExitFullscreen();
    }
    if (document.mozCancelFullScreen && document.mozFullScreenElement) {
      return document.mozCancelFullScreen();
    }
    if (document.msExitFullscreen && document.msFullscreenElement) {
      return document.msExitFullscreen();
    }
    return Promise.resolve();
  }

  function toggleFullscreen() {
    const task = isAppFullscreen() ? exitAppFullscreen() : requestAppFullscreen();
    Promise.resolve(task)
      .then(function () {
        updateFullscreenLabel();
        render();
      })
      .catch(function () {
        updateFullscreenLabel();
        render();
      });
  }

  function maybeStartFullscreen() {
    if (!allowFullscreen || !startInFullscreen || didAutoFullscreen) return;
    didAutoFullscreen = true;
    toggleFullscreen();
  }

  document.addEventListener("fullscreenchange", function () {
    updateFullscreenLabel();
    render();
  });
  document.addEventListener("webkitfullscreenchange", function () {
    updateFullscreenLabel();
    render();
  });
  window.addEventListener("resize", function () {
    if (isAppFullscreen()) render();
  });
  if (btnCc) {
    btnCc.addEventListener("click", function () {
      state.captionsOn = !state.captionsOn;
      btnCc.setAttribute("aria-pressed", state.captionsOn ? "true" : "false");
      btnCc.title = state.captionsOn ? "Turn captions off" : "Turn captions on";
      btnCc.setAttribute("aria-label", btnCc.title);
      btnCc.style.opacity = state.captionsOn ? "1" : ".5";
      render();
    });
  }
  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", toggleFullscreen);
  }

  function isActive(tl, t) {
    const end = tl.startTime + tl.duration;
    return t >= tl.startTime && t <= end + 0.05;
  }

  function getActiveCaptionCue(el, playhead) {
    if (!el || el.type !== "caption" || !Array.isArray(el.cues)) return null;
    if (!isActive(el.timeline, playhead)) return null;
    const t = playhead - (el.timeline.startTime || 0);
    for (let i = 0; i < el.cues.length; i++) {
      const cue = el.cues[i];
      if (cue.startTime <= t + 0.000001 && t < cue.endTime - 0.000001) {
        return cue;
      }
    }
    return null;
  }

  function applyCaptionStyle(node, el, scale) {
    const appearance = resolveElementAppearance(el);
    Object.assign(node.style, {
      color: appearance.color,
      background: el.showBackground ? el.backgroundColor : "transparent",
      fontFamily: el.style.fontFamily,
      fontSize: el.style.fontSize * scale + "px",
      fontWeight: String(el.style.fontWeight),
      textAlign: el.style.align,
      whiteSpace: "pre-wrap",
      lineHeight: "1.3",
      display: "grid",
      placeItems: "center",
      padding: 8 * scale + "px " + 12 * scale + "px",
      borderRadius: 4 * scale + "px",
      overflow: "hidden",
    });
  }

  function timelineVisualTime(tl, t) {
    const end = tl.startTime + tl.duration;
    if (t >= end) return Math.max(tl.startTime, end - 0.001);
    return t;
  }

  function isFullImageCrop(crop) {
    if (!crop) return true;
    return crop.x <= 0.001 && crop.y <= 0.001 && crop.width >= 0.999 && crop.height >= 0.999;
  }

  function normalizeImageStyle(style) {
    return {
      borderRadius: style?.borderRadius ?? 0,
      borderWidth: style?.borderWidth ?? 0,
      borderColor: style?.borderColor ?? "#FFFFFF",
      blendMode: style?.blendMode ?? "normal",
      brightness: style?.brightness ?? 100,
      contrast: style?.contrast ?? 100,
      saturate: style?.saturate ?? 100,
      shadowBlur: style?.shadowBlur ?? 0,
      shadowColor: style?.shadowColor ?? "#000000",
      shadowOpacity: style?.shadowOpacity ?? 0,
    };
  }

  function hexToRgba(hex, alpha) {
    const raw = String(hex || "#000000").replace("#", "").trim();
    const full = raw.length === 3 ? raw.split("").map(function (c) { return c + c; }).join("") : raw.slice(0, 6);
    const value = parseInt(full, 16);
    if (!isFinite(value)) return "rgba(0,0,0," + alpha + ")";
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  function imageContainerStyles(style, scale) {
    const radius = style.borderRadius * scale;
    const borderWidth = style.borderWidth * scale;
    const shadow =
      style.shadowBlur > 0 && style.shadowOpacity > 0
        ? "0 " + Math.round(style.shadowBlur * 0.2 * scale) + "px " + (style.shadowBlur * scale) + "px " + hexToRgba(style.shadowColor, style.shadowOpacity)
        : "";
    return {
      overflow: "hidden",
      borderRadius: radius > 0 ? radius + "px" : "",
      border: borderWidth > 0 ? borderWidth + "px solid " + style.borderColor : "",
      boxShadow: shadow,
    };
  }

  function imageContentStyles(style) {
    const parts = [];
    if (style.brightness !== 100) parts.push("brightness(" + style.brightness + "%)");
    if (style.contrast !== 100) parts.push("contrast(" + style.contrast + "%)");
    if (style.saturate !== 100) parts.push("saturate(" + style.saturate + "%)");
    const filter = parts.join(" ");
    return {
      mixBlendMode: style.blendMode === "normal" ? "" : style.blendMode,
      filter: filter,
      WebkitFilter: filter,
    };
  }

  function applyImageCrop(img, crop, fit) {
    if (!crop || isFullImageCrop(crop)) {
      Object.assign(img.style, {
        width: "100%",
        height: "100%",
        objectFit: fit === "none" ? "none" : fit,
        position: "",
        left: "",
        top: "",
        maxWidth: "",
        maxHeight: "",
        pointerEvents: "none",
      });
      return;
    }
    const scaleX = 1 / crop.width;
    const scaleY = 1 / crop.height;
    Object.assign(img.style, {
      position: "absolute",
      width: scaleX * 100 + "%",
      height: scaleY * 100 + "%",
      left: -crop.x * scaleX * 100 + "%",
      top: -crop.y * scaleY * 100 + "%",
      maxWidth: "none",
      maxHeight: "none",
      objectFit: "fill",
      pointerEvents: "none",
    });
  }

  function normalizeEffect(effect) {
    if (REDUCED_MOTION) return "none";
    if (!effect || effect === "none") return "none";
    if (effect === "fade" || effect === "fadeIn" || effect === "fadeOut") return "fade";
    if (
      effect === "flyLeft" ||
      effect === "flyRight" ||
      effect === "flyUp" ||
      effect === "flyDown" ||
      effect === "zoom" ||
      effect === "wipe" ||
      effect === "morph" ||
      effect === "pageTurnLeft" ||
      effect === "pageTurnRight" ||
      effect === "pageTurnTop" ||
      effect === "pageTurnBottom"
    ) {
      return effect;
    }
    return "none";
  }

  function easeMorph(progress) {
    const p = Math.max(0, Math.min(1, progress));
    return p * p * (3 - 2 * p);
  }

  function morphMotion(progress) {
    const eased = easeMorph(progress);
    const inset = (1 - eased) * 42;
    const radius = (1 - eased) * 50;
    return {
      opacity: progress <= 0 ? 0 : Math.min(1, 0.25 + 0.75 * eased),
      translateX: 0,
      translateY: 0,
      scale: 0.82 + 0.18 * eased,
      clipPath:
        "inset(" +
        inset.toFixed(2) +
        "% " +
        inset.toFixed(2) +
        "% round " +
        radius.toFixed(2) +
        "%)",
      rotateX: 0,
      rotateY: 0,
      transformOrigin: "center center",
      perspective: undefined,
    };
  }

  function easePageTurn(progress) {
    const p = Math.max(0, Math.min(1, progress));
    return 1 - Math.pow(1 - p, 3);
  }

  function pageTurnMotion(edge, progress) {
    const eased = easePageTurn(progress);
    const angle = (1 - eased) * 88;
    const base = {
      opacity: progress <= 0 ? 0 : Math.min(1, 0.6 + 0.4 * eased),
      translateX: 0,
      translateY: 0,
      scale: 1,
      clipPath: undefined,
      perspective: 1200,
      transformOrigin:
        edge === "left"
          ? "left center"
          : edge === "right"
            ? "right center"
            : edge === "top"
              ? "center top"
              : "center bottom",
      rotateX: 0,
      rotateY: 0,
    };
    if (edge === "left") return Object.assign({}, base, { rotateY: -angle });
    if (edge === "right") return Object.assign({}, base, { rotateY: angle });
    if (edge === "top") return Object.assign({}, base, { rotateX: -angle });
    return Object.assign({}, base, { rotateX: angle });
  }

  function motionStyleParts(motion, scale, rotation) {
    const parts = [];
    if (motion.perspective) parts.push("perspective(" + motion.perspective + "px)");
    if (motion.translateX || motion.translateY) {
      parts.push(
        "translate(" + motion.translateX * scale + "px, " + motion.translateY * scale + "px)"
      );
    }
    if (motion.rotateX) parts.push("rotateX(" + motion.rotateX + "deg)");
    if (motion.rotateY) parts.push("rotateY(" + motion.rotateY + "deg)");
    if (motion.scale !== 1) parts.push("scale(" + motion.scale + ")");
    if (rotation) parts.push("rotate(" + rotation + "deg)");
    return parts;
  }

  /** Fixed outline of a shape (same polygons as the editor and Preview). */
  function shapeClipPath(el) {
    if (!el || el.type !== "shape") return "";
    if (el.shape === "triangle") return "polygon(50% 0%, 0% 100%, 100% 100%)";
    if (el.shape === "diamond") return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    if (el.shape === "ellipse") return "ellipse(50% 50% at 50% 50%)";
    return "";
  }

  function applyMotionStyle(node, motion, scale, rotation, baseClip) {
    const parts = motionStyleParts(motion, scale, rotation || 0);
    node.style.transform = parts.length ? parts.join(" ") : "";
    node.style.transformOrigin = motion.transformOrigin || "center center";
    node.style.backfaceVisibility =
      motion.rotateX || motion.rotateY || motion.perspective ? "hidden" : "";
    // A shape's own outline wins over a wipe animation's clip (B17: this used
    // to be cleared every frame, turning triangles and diamonds into squares).
    node.style.clipPath = baseClip || motion.clipPath || "";
  }

  function isActiveEffect(effect) {
    return normalizeEffect(effect) !== "none";
  }

  function motionFromEffect(effect, progress, width, height) {
    const kind = normalizeEffect(effect);
    const p = Math.max(0, Math.min(1, progress));
    const distX = Math.max(48, width * 0.4);
    const distY = Math.max(48, height * 0.4);
    const base = {
      opacity: 1,
      translateX: 0,
      translateY: 0,
      scale: 1,
      clipPath: undefined,
      rotateX: 0,
      rotateY: 0,
      transformOrigin: undefined,
      perspective: undefined,
    };
    switch (kind) {
      case "fade":
        return Object.assign({}, base, { opacity: p });
      case "flyLeft":
        return Object.assign({}, base, { opacity: p <= 0 ? 0 : 1, translateX: (1 - p) * -distX });
      case "flyRight":
        return Object.assign({}, base, { opacity: p <= 0 ? 0 : 1, translateX: (1 - p) * distX });
      case "flyUp":
        return Object.assign({}, base, { opacity: p <= 0 ? 0 : 1, translateY: (1 - p) * -distY });
      case "flyDown":
        return Object.assign({}, base, { opacity: p <= 0 ? 0 : 1, translateY: (1 - p) * distY });
      case "zoom":
        return Object.assign({}, base, { opacity: p, scale: 0.55 + 0.45 * p });
      case "wipe":
        return Object.assign({}, base, {
          opacity: p <= 0 ? 0 : 1,
          clipPath: "inset(" + ((1 - p) * 100).toFixed(2) + "% 0 0 0)",
        });
      case "morph":
        return morphMotion(p);
      case "pageTurnLeft":
        return pageTurnMotion("left", p);
      case "pageTurnRight":
        return pageTurnMotion("right", p);
      case "pageTurnTop":
        return pageTurnMotion("top", p);
      case "pageTurnBottom":
        return pageTurnMotion("bottom", p);
      default:
        return base;
    }
  }

  function composeMotion(a, b) {
    return {
      opacity: Math.min(a.opacity, b.opacity),
      translateX: a.translateX + b.translateX,
      translateY: a.translateY + b.translateY,
      scale: a.scale * b.scale,
      clipPath: b.clipPath || a.clipPath,
      rotateX: b.rotateX != null ? b.rotateX : a.rotateX,
      rotateY: b.rotateY != null ? b.rotateY : a.rotateY,
      transformOrigin: b.transformOrigin || a.transformOrigin,
      perspective: b.perspective || a.perspective,
    };
  }

  function timelineMotion(el, t) {
    if (!isActive(el.timeline, t)) {
      return {
        opacity: 0,
        translateX: 0,
        translateY: 0,
        scale: 1,
        clipPath: undefined,
        rotateX: 0,
        rotateY: 0,
        transformOrigin: undefined,
        perspective: undefined,
      };
    }
    const sample = timelineVisualTime(el.timeline, t);
    const end = el.timeline.startTime + el.timeline.duration;
    let motion = {
      opacity: 1,
      translateX: 0,
      translateY: 0,
      scale: 1,
      clipPath: undefined,
      rotateX: 0,
      rotateY: 0,
      transformOrigin: undefined,
      perspective: undefined,
    };
    const enter = (el.animations || []).find(
      (a) => a.trigger === "enter" && isActiveEffect(a.effect)
    );
    if (enter && enter.duration > 0) {
      const t0 = el.timeline.startTime + Math.max(0, enter.delay || 0);
      let p = 1;
      if (sample < t0) p = 0;
      else if (sample < t0 + enter.duration) p = (sample - t0) / enter.duration;
      motion = composeMotion(motion, motionFromEffect(enter.effect, p, el.width, el.height));
    }
    const exit = (el.animations || []).find(
      (a) => a.trigger === "exit" && isActiveEffect(a.effect)
    );
    if (exit && exit.duration > 0) {
      const t1 = end - Math.max(0, exit.delay || 0) - exit.duration;
      let p = 1;
      if (sample >= t1 + exit.duration) p = 0;
      else if (sample >= t1) p = 1 - (sample - t1) / exit.duration;
      motion = composeMotion(motion, motionFromEffect(exit.effect, p, el.width, el.height));
    }
    return motion;
  }

  function getActiveStateId(el) {
    if (!el.states || !el.states.states || !el.states.states.length) return null;
    if (el.id in state.stateOverrides) return state.stateOverrides[el.id];
    return el.states.initialStateId;
  }

  function resolveElementAppearance(el) {
    const config = el.states;
    const stateId = getActiveStateId(el);
    const found =
      config && stateId
        ? config.states.find(function (item) {
            return item.id === stateId;
          })
        : null;
    const style = (found && found.style) || {};
    const base = {
      opacity: style.opacity != null ? style.opacity : el.opacity ?? 1,
      visible: style.visible != null ? style.visible : el.visible !== false,
    };
    if (el.type === "shape") {
      return Object.assign({}, base, {
        fill: style.fill != null ? style.fill : el.fill,
        stroke: style.stroke != null ? style.stroke : el.stroke,
        strokeWidth:
          style.strokeWidth != null ? style.strokeWidth : el.strokeWidth,
      });
    }
    if (el.type === "text") {
      return Object.assign({}, base, {
        color: style.color != null ? style.color : el.style.color,
      });
    }
    if (el.type === "caption") {
      return Object.assign({}, base, {
        color: style.color != null ? style.color : el.style.color,
      });
    }
    if (el.type === "button") {
      return Object.assign({}, base, {
        backgroundColor:
          style.backgroundColor != null
            ? style.backgroundColor
            : el.style.backgroundColor,
        textColor:
          style.textColor != null ? style.textColor : el.style.textColor,
      });
    }
    return base;
  }

  function applyChoiceGroupSelection(el) {
    const config = el.states;
    if (
      !config ||
      !config.choiceGroupId ||
      !config.selectedStateId ||
      config.isChoiceOption === false
    ) {
      return;
    }
    const slide = byId(state.currentSlideId);
    if (!slide) return;
    const prev = state.objectChoiceGroups[config.choiceGroupId] || {
      selectedElementIds: [],
      attempts: 0,
      submitted: false,
      correct: false,
    };
    const members = slide.elements.filter(function (item) {
      return (
        item.states &&
        item.states.choiceGroupId === config.choiceGroupId &&
        item.states.isChoiceOption !== false
      );
    });
    const mode = config.choiceMode || "single";
    if (mode === "single") {
      var alreadySelected = (prev.selectedElementIds || []).indexOf(el.id) >= 0;
      members.forEach(function (member) {
        if (!member.states) return;
        state.stateOverrides[member.id] = member.states.initialStateId;
      });
      if (!alreadySelected) {
        state.stateOverrides[el.id] = config.selectedStateId;
      }
      state.objectChoiceGroups[config.choiceGroupId] = {
        selectedElementIds: alreadySelected ? [] : [el.id],
        attempts: prev.attempts || 0,
        submitted: false,
        correct: false,
      };
      return;
    }
    const current = state.stateOverrides[el.id] || config.initialStateId;
    const nextStateId =
      current === config.selectedStateId
        ? config.initialStateId
        : config.selectedStateId;
    state.stateOverrides[el.id] = nextStateId;
    const selected = new Set(prev.selectedElementIds || []);
    if (nextStateId === config.selectedStateId) selected.add(el.id);
    else selected.delete(el.id);
    state.objectChoiceGroups[config.choiceGroupId] = {
      selectedElementIds: Array.from(selected),
      attempts: prev.attempts || 0,
      submitted: false,
      correct: false,
    };
  }

  function submitChoiceGroup(groupId) {
    const slide = byId(state.currentSlideId);
    if (!slide || !groupId) return;
    const options = slide.elements.filter(function (item) {
      return (
        item.states &&
        item.states.choiceGroupId === groupId &&
        item.states.isChoiceOption !== false
      );
    });
    if (!options.length) return;
    const prev = state.objectChoiceGroups[groupId] || {
      selectedElementIds: [],
      attempts: 0,
      submitted: false,
      correct: false,
    };
    const selected = new Set(prev.selectedElementIds || []);
    if (!selected.size) return;
    const correct = new Set(
      options
        .filter(function (item) {
          return item.states && item.states.isCorrectOption === true;
        })
        .map(function (item) {
          return item.id;
        }),
    );
    const isCorrect =
      correct.size > 0 &&
      correct.size === selected.size &&
      Array.from(correct).every(function (id) {
        return selected.has(id);
      });
    const attempts = (prev.attempts || 0) + 1;
    if (!isCorrect) {
      options.forEach(function (item) {
        if (item.states && item.states.initialStateId) {
          state.stateOverrides[item.id] = item.states.initialStateId;
        }
      });
      var incorrectMessage = "Incorrect. Try again.";
      options.forEach(function (item) {
        if (item.states && item.states.incorrectFeedback && String(item.states.incorrectFeedback).trim()) {
          incorrectMessage = String(item.states.incorrectFeedback).trim();
        }
      });
      state.objectChoiceGroups[groupId] = {
        selectedElementIds: [],
        attempts: attempts,
        submitted: false,
        correct: false,
        feedback: incorrectMessage,
      };
      return;
    }
    var correctMessage = "Correct!";
    options.forEach(function (item) {
      if (item.states && item.states.correctFeedback && String(item.states.correctFeedback).trim()) {
        correctMessage = String(item.states.correctFeedback).trim();
      }
    });
    state.objectChoiceGroups[groupId] = {
      selectedElementIds: Array.from(selected),
      attempts: attempts,
      submitted: true,
      correct: true,
      feedback: correctMessage,
    };
  }

  function groupFeedbackSlide(options, field) {
    for (var i = 0; i < options.length; i++) {
      var item = options[i];
      if (item.states && item.states[field]) return item.states[field];
    }
    return "";
  }

  function applyGoToQuizFeedback(action) {
    const slide = byId(state.currentSlideId);
    if (!slide) return;
    const groupId =
      (action.groupId && String(action.groupId).trim()) ||
      (slideChoiceGroupIds(slide)[0] || "");
    if (!groupId) return;
    const group = state.objectChoiceGroups[groupId];
    const alreadyGraded = !!(group && group.submitted);
    const hadSelection =
      alreadyGraded ||
      (group && group.selectedElementIds && group.selectedElementIds.length) ||
      (group && group.attempts > 0 && !group.correct);
    if (!hadSelection) return;
    if (!alreadyGraded) submitChoiceGroup(groupId);
    const options = slide.elements.filter(function (item) {
      return (
        item.states &&
        item.states.choiceGroupId === groupId &&
        item.states.isChoiceOption !== false
      );
    });
    const passed = !!(
      state.objectChoiceGroups[groupId] &&
      state.objectChoiceGroups[groupId].correct
    );
    if (passed) {
      var correctMessage = "Correct!";
      options.forEach(function (item) {
        if (item.states && item.states.correctFeedback && String(item.states.correctFeedback).trim()) {
          correctMessage = String(item.states.correctFeedback).trim();
        }
      });
      presentQuizFeedback(
        correctMessage,
        "success",
        action.correctSlideId || groupFeedbackSlide(options, "correctFeedbackSlideId"),
      );
      return;
    }
    var incorrectMessage = "Incorrect. Try again.";
    options.forEach(function (item) {
      if (item.states && item.states.incorrectFeedback && String(item.states.incorrectFeedback).trim()) {
        incorrectMessage = String(item.states.incorrectFeedback).trim();
      }
    });
    presentQuizFeedback(
      incorrectMessage,
      "error",
      action.incorrectSlideId || groupFeedbackSlide(options, "incorrectFeedbackSlideId"),
    );
  }

  function applyElementAppearanceStyle(node, el, scale) {
    const appearance = resolveElementAppearance(el);
    if (el.type === "text") {
      node.style.color = appearance.color;
      node.style.background = appearance.backgroundColor || "";
    } else if (el.type === "shape") {
      node.style.background = appearance.fill;
      if ((appearance.strokeWidth || 0) > 0) {
        node.style.border =
          Math.max(1, appearance.strokeWidth * scale) +
          "px solid " +
          appearance.stroke;
      } else {
        node.style.border = "";
      }
    } else if (el.type === "button") {
      node.style.background = appearance.backgroundColor;
      node.style.color = appearance.textColor;
    }
  }

  function isChoiceSelected(el) {
    const groupId = el.states?.choiceGroupId;
    if (!groupId || el.states?.isChoiceOption === false) return false;
    const selected = state.objectChoiceGroups[groupId]?.selectedElementIds || [];
    return selected.includes(el.id);
  }

  function applyChoiceSelectionStyle(node, el, scale) {
    // Clear previous selection chrome.
    node.style.outline = "";
    node.style.outlineOffset = "";
    node.querySelectorAll("[data-nari-choice-fill]").forEach(function (overlay) {
      overlay.remove();
    });
    if (!isChoiceSelected(el)) {
      return;
    }
    var look = (el.states && el.states.selectionLook) || "fill";
    var color = (el.states && el.states.selectionColor) || "#22D3EE";
    if (look === "background") {
      // Soft halo follows border-radius (unlike outline).
      node.style.boxShadow =
        "0 0 0 " + Math.max(6, scale * 8) + "px " + hexToRgba(color, 0.35);
      return;
    }
    // Fill inside the object only — never a square outline/box.
    if (el.type === "shape" || el.type === "button" || el.type === "text") {
      node.style.background = color;
      if (el.type === "shape" && el.shape === "ellipse") {
        node.style.borderRadius = "50%";
        node.style.clipPath = "ellipse(50% 50% at 50% 50%)";
        node.style.overflow = "hidden";
      }
      return;
    }
    if (el.type === "image") {
      node.style.position = node.style.position || "absolute";
      node.style.overflow = "hidden";
      var nearCircle = Math.abs(el.width - el.height) < 1;
      var radius =
        nearCircle
          ? "50%"
          : ((el.style && el.style.borderRadius ? el.style.borderRadius : 0) * scale) + "px";
      if (nearCircle) node.style.borderRadius = "50%";
      var overlay = document.createElement("div");
      overlay.setAttribute("data-nari-choice-fill", "1");
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.pointerEvents = "none";
      overlay.style.background = hexToRgba(color, 0.45);
      overlay.style.borderRadius = radius;
      node.appendChild(overlay);
    }
  }

  function effectivelyVisible(el) {
    if (el.id in state.visibilityOverrides) return !!state.visibilityOverrides[el.id];
    if (el.visibleWhen && !conditionHolds(el.visibleWhen)) return false;
    if (!el.visible) return false;
    const appearance = resolveElementAppearance(el);
    if (!appearance.visible) return false;
    return isActive(el.timeline, state.playhead);
  }

  function elementOpacity(el) {
    if (!effectivelyVisible(el)) return 0;
    if (el.type === "caption" && (!state.captionsOn || !getActiveCaptionCue(el, state.playhead))) return 0;
    const inTl = isActive(el.timeline, state.playhead);
    const fade = inTl ? timelineMotion(el, state.playhead).opacity : 1;
    return resolveElementAppearance(el).opacity * fade;
  }

  function shouldIncludeElementInDom(el) {
    if (el.id in state.visibilityOverrides) return true;
    if (!el.visible) return false;
    return resolveElementAppearance(el).visible;
  }

  function elementDisplayMode(el, opacity) {
    if (el.type === "video") return "";
    if (el.type === "audio") return "none";
    if (opacity <= 0.001) return "none";
    if (el.type === "button") return "grid";
    if (el.type === "question") return "flex";
    if (el.type === "results") return "flex";
    if (el.type === "caption") return "grid";
    return "";
  }

  function elementPointerEvents(el, opacity) {
    const resolvedOpacity = opacity ?? elementOpacity(el);
    if (resolvedOpacity <= 0.001) return "none";
    if (isElementClickable(el)) return "auto";
    // Drag items (and targets while an item is picked) take pointer input.
    if (oddIsInteractive(el)) return "auto";
    // Questions (choices, Submit, drag-and-drop) need pointer input, as in
    // the preview runtime (playerElementIsClickTarget). Fixes B16.
    if (el.type === "question") return "auto";
    if (el.type === "results") return "auto"; // scrollable breakdown
    if (el.type === "video" && el.controls && timelineAllowsMedia(el)) {
      return "auto";
    }
    return "none";
  }

  function applyElementFrame(node, el, scale, opacity, motion) {
    const resolvedOpacity = opacity ?? elementOpacity(el);
    const resolvedMotion = motion ?? timelineMotion(el, state.playhead);
    node.style.opacity = String(resolvedOpacity);
    node.style.display = elementDisplayMode(el, resolvedOpacity);
    node.style.pointerEvents = elementPointerEvents(el, resolvedOpacity);
    applyMotionStyle(node, resolvedMotion, scale, el.rotation, shapeClipPath(el));
    if (el.type === "text" || el.type === "shape" || el.type === "button") {
      applyElementAppearanceStyle(node, el, scale);
    }
    if (el.type === "caption") {
      applyCaptionStyle(node, el, scale);
      const cue = getActiveCaptionCue(el, state.playhead);
      node.textContent = cue ? fillText(cue.text) : "";
    }
    applyChoiceSelectionStyle(node, el, scale);
  }

  function syncScormLocation() {
    try {
      if (window.NariScorm) window.NariScorm.setLocation(state.currentSlideId);
    } catch (e) {}
  }

  function reportScormScore() {
    try {
      if (!window.NariScorm) return;
      syncScoreVariable();
      const vars = documentModel.variables || [];
      const scoreVar =
        vars.find((v) => String(v.name).toLowerCase() === "score") ||
        vars.find((v) => String(v.name).toLowerCase() === "nari_score");
      if (!scoreVar) return;
      const raw = state.variables[scoreVar.id];
      window.NariScorm.setScore(raw, 0, 100);
    } catch (e) {}
  }

  let lastScormSignature = "";
  let scormComplete = false;

  /**
   * Tell the LMS the current outcome (completed / passed / failed) once the
   * completion rule is met. exited = the learner reached the end or ran an
   * Exit course action.
   */
  function scormProgress(exited) {
    try {
      if (!window.NariScorm) return;
      syncScoreVariable();
      const settings = documentModel.settings || {};
      const scorables = collectQuestions().concat(oddCourseGroups());
      const hasScore = scorables.some((q) => (q.points || 0) > 0);
      const result = evaluateScormProgress({
        rule: settings.completionRule,
        passMark: settings.passMark,
        playlist: state.playlist,
        visited: state.visitedSlideIds,
        scorePercent: courseScorePercent(),
        hasScore: hasScore,
        exited: !!exited,
      });
      if (!result.report) return;
      scormComplete = result.complete;
      const signature = [result.complete, result.passed, courseScorePercent()].join("|");
      if (signature === lastScormSignature) return;
      lastScormSignature = signature;
      reportScormScore();
      window.NariScorm.setResult(result);
      window.NariScorm.commit();
    } catch (e) {}
  }

  function markScormComplete() {
    scormProgress(true);
  }

  /** Save where the learner is so the LMS can resume them. */
  function saveSuspend() {
    try {
      if (!window.NariScorm || !window.NariScorm.available) return;
      window.NariScorm.setSuspendData(
        buildSuspendData(
          {
            playlist: state.playlist,
            visited: state.visitedSlideIds,
            currentId: state.currentSlideId,
            answers: state.quizAnswers,
            variables: state.variables,
            seed: state.shuffleSeed,
          },
          window.NariScorm.suspendLimit(),
        ),
      );
    } catch (e) {}
  }

  /** Restore a suspended attempt (position, visited slides, graded answers, score). */
  function restoreSuspended() {
    try {
      const scorm = window.NariScorm;
      if (!scorm || !scorm.available || !scorm.isResuming()) return;
      const suspended = scorm.getSuspendData();
      // Re-deal the same pool selection the learner had.
      let savedSeed = null;
      try { savedSeed = JSON.parse(suspended).s; } catch (e) {}
      if (typeof savedSeed === "number" && savedSeed !== state.shuffleSeed) {
        state.shuffleSeed = savedSeed;
        state.playlist = selectPlaylist(
          playable().map((s) => ({ id: s.id, poolId: s.poolId })),
          documentModel.pools,
          savedSeed,
        );
      }
      const data = readSuspendData(suspended, state.playlist);
      let target = null;
      if (data) {
        data.visited.forEach(markVisited);
        Object.keys(data.answers).forEach(function (id) {
          const a = data.answers[id];
          state.quizAnswers[id] = {
            selectedIds: [],
            placements: [],
            attempts: a.attempts,
            graded: true,
            correct: a.correct,
            feedback: "",
            earnedFraction: a.earnedFraction,
          };
        });
        Object.keys(data.variables).forEach(function (id) {
          state.variables[id] = data.variables[id];
        });
        target = data.currentId;
      }
      if (!target) {
        const loc = scorm.getLocation();
        if (loc && state.playlist.indexOf(loc) >= 0) target = loc;
      }
      if (!target && state.playlist.indexOf(state.currentSlideId) < 0) target = state.playlist[0];
      if (target && target !== state.currentSlideId) resetSlide(target, false, false);
      else if (target) syncScormLocation();
    } catch (e) {}
  }

  const salvagedMedia = new Map();
  const keptMedia = new Map();
  const preloadVideos = new Map();
  const preloadBox = document.getElementById("nari-preload");
  /** id -> last shouldPlay for free-run sync */
  const mediaWasPlaying = new Map();
  const mediaSeeking = new Set();
  /** Skip nested render during bookmark navigation inside the playback loop. */
  let deferPlayerRender = false;
  let lastRenderedSlideId = "";

  function ensurePreload(url) {
    if (!url || !preloadBox || preloadVideos.has(url)) return;
    const video = document.createElement("video");
    video.src = url;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    preloadBox.appendChild(video);
    try {
      video.currentTime = 0.001;
    } catch (e) {}
    preloadVideos.set(url, video);
  }

  function takePreloadedVideo(url) {
    const video = preloadVideos.get(url);
    if (!video) return null;
    preloadVideos.delete(url);
    if (video.parentNode) video.parentNode.removeChild(video);
    return video;
  }

  function preloadUpcomingVideos() {
    const idx = state.playlist.indexOf(state.currentSlideId);
    const next = byId(state.playlist[idx + 1]);
    if (!next) return;
    slideVideoElements(next).forEach(function (el) {
      ensurePreload(assetUrl(el.assetId));
    });
  }

  const VEIL_MS = 220;
  let veilStartedAt = -1e9;

  /** Load and decode pictures of the previous/next slides so they paint instantly. */
  const warmedImages = {};
  function warmNeighbourImages() {
    const idx = state.playlist.indexOf(state.currentSlideId);
    [idx + 1, idx - 1].forEach(function (i) {
      const slide = byId(state.playlist[i]);
      if (!slide) return;
      const ids = [];
      if (slide.background && slide.background.type === "image") ids.push(slide.background.assetId);
      (slide.elements || []).forEach(function (el) {
        if (el.type === "image") ids.push(el.assetId);
      });
      ids.forEach(function (id) {
        const url = assetUrl(id);
        if (!url || warmedImages[url]) return;
        const img = new Image();
        img.src = url;
        if (img.decode) img.decode().catch(function () {});
        warmedImages[url] = img;
      });
    });
  }

  function timelineAllowsMedia(el) {
    return state.isPlaying || !!state.mediaPlaying[el.id];
  }

  function attachTimelineMediaGuard(media, el) {
    if (media.dataset.nariGuard === "1") return;
    media.dataset.nariGuard = "1";
    media.addEventListener("play", () => {
      const slide = byId(state.currentSlideId);
      const live = slide?.elements.find((item) => item.id === el.id);
      if (!live) return;
      const active = isActive(live.timeline, state.playhead);
      const allowed = active && timelineAllowsMedia(live);
      if (!allowed) {
        media.pause();
        const mediaTime = Math.max(0, state.playhead - live.timeline.startTime);
        try {
          media.currentTime = mediaTime;
        } catch (e) {}
      }
    });
  }

  function applyVideoSourceMute(video, el) {
    const muted = !!(el && el.muted);
    video.muted = muted;
    video.volume = muted ? 0 : 1;
    if (muted) video.dataset.nariAuthorMuted = "1";
    else delete video.dataset.nariAuthorMuted;
  }

  function applyVideoChrome(video, el, allowPointer) {
    const showControls = !!el.controls && timelineAllowsMedia(el);
    video.controls = showControls;
    video.style.pointerEvents = showControls && allowPointer ? "auto" : "none";
    applyVideoSourceMute(video, el);
  }

  function markVisited(slideId) {
    if (!slideId) return;
    if (state.visitedSlideIds.indexOf(slideId) >= 0) return;
    state.visitedSlideIds.push(slideId);
  }

  /** What a branching condition is tested against right now. */
  function conditionContext() {
    return { variables: state.variables, scorePercent: courseScorePercent(), answers: state.quizAnswers };
  }
  function conditionHolds(condition) {
    return evaluateCondition(condition, conditionContext());
  }
  /** {{score}}, {{points}}, {{total}}, {{passmark}} and {{variable name}} in on-slide text. */
  function fillText(text) {
    if (typeof text !== "string" || text.indexOf("{{") < 0) return text;
    const mark = Number((documentModel.settings || {}).passMark);
    const summary = buildResultsSummary(resultsItemList(), state.quizAnswers, isFinite(mark) ? mark : 80);
    const values = { score: summary.percent, points: summary.earned, total: summary.max, passmark: summary.passMark };
    (documentModel.variables || []).forEach(function (v) {
      const current = state.variables[v.id];
      values[String(v.name).toLowerCase()] = current === undefined ? v.defaultValue : current;
    });
    return fillPlaceholders(text, values);
  }

  /** Scored questions and exercises the learner was dealt, for the Results slide. */
  function resultsItemList() {
    const items = [];
    collectQuestions().forEach(function (q) {
      items.push({ id: q.id, label: String(q.prompt || q.name || "Question").trim(), points: q.points || 0 });
    });
    oddCourseGroups().forEach(function (g) {
      items.push({ id: g.id, label: g.name || "Exercise", points: g.points || 0 });
    });
    return items;
  }
  function firstReviewSlideId() {
    for (const id of state.playlist) {
      const slide = byId(id);
      if (!slide) continue;
      const hasQuestion = (slide.elements || []).some(function (e) { return e.type === "question"; });
      const hasExercise = oddGroups(slide).some(function (g) { return oddMembers(slide, g.id).items.length > 0; });
      if (hasQuestion || hasExercise) return slide.id;
    }
    return "";
  }
  function resultsSlideId() {
    for (const id of state.playlist) {
      const slide = byId(id);
      if (slide && (slide.elements || []).some(function (e) { return e.type === "results"; })) return slide.id;
    }
    return "";
  }
  /** A new attempt: answers, score and pool selection start over. */
  function restartCourse() {
    window.clearTimeout(correctAdvanceTimer);
    state.reviewMode = false;
    state.quizAnswers = {};
    state.objectChoiceGroups = {};
    state.variables = Object.fromEntries(
      (documentModel.variables || []).map((v) => [v.id, v.defaultValue])
    );
    state.visitedSlideIds = [];
    state.finished = false;
    state.shuffleSeed = Math.floor(Math.random() * 4294967296) >>> 0;
    state.playlist = selectPlaylist(
      playable().map((s) => ({ id: s.id, poolId: s.poolId })),
      documentModel.pools,
      state.shuffleSeed,
    );
    Object.keys(announcedFeedback).forEach(function (k) { delete announcedFeedback[k]; });
    setQuizMessage("");
    resetSlide(state.playlist[0], false);
    syncScoreVariable();
  }
  function startReview() {
    const first = firstReviewSlideId();
    state.reviewMode = true;
    state.finished = false;
    setQuizMessage("");
    if (first) resetSlide(first, false);
  }
  function exitReview() {
    state.reviewMode = false;
    const results = resultsSlideId();
    if (results) resetSlide(results, false);
  }

  function exitCourse() {
    markVisited(state.currentSlideId);
    state.isPlaying = false;
    state.finished = true;
    syncScoreVariable();
    markScormComplete();
    if (!deferPlayerRender) render();
  }

  function resetSlide(id, keepPlaying, keepQuiz) {
    const slide = byId(id);
    state.currentSlideId = id;
    markVisited(id);
    state.playhead = slideTimelineStartTime(slide);
    state.isPlaying = !!keepPlaying;
    state.visibilityOverrides = {};
    state.stateOverrides = {};
    state.mediaPlaying = {};
    if (!keepQuiz) {
      state.objectChoiceGroups = {};
      setQuizMessage("");
    }
    state.firedBookmarkIds = [];
    state.timelineStopAt = null;
    state.finished = false;
    state.quizFeedbackHold = !!keepQuiz;
    oddPicked = null;
    mediaWasPlaying.clear();
    mediaSeeking.clear();
    syncScormLocation();
    scormProgress(false);
    saveSuspend();
  }

  function finishPlayerRender(keepPlaying) {
    render();
    tickPlayback();
    if (keepPlaying) startLoop();
  }

  function canLeaveForward(targetId, bypassVideoGate) {
    const slide = byId(state.currentSlideId);
    if (targetId) {
      const from = state.playlist.indexOf(state.currentSlideId);
      const to = state.playlist.indexOf(targetId);
      if (to > -1 && to <= from) return true;
    }
    if (slide && !slideQuizPassed(slide)) {
      setQuizMessage(state.quizGateMessage || oddBlockedMessage(slide));
      return false;
    }
    if (!bypassVideoGate && slide && !slidePlaybackCompleted(slide)) {
      return false;
    }
    return true;
  }

  function goTo(id, keepPlaying, bypassVideoGate, bypassQuizGate, keepQuiz) {
    if (!bypassQuizGate && !canLeaveForward(id, bypassVideoGate)) {
      if (!deferPlayerRender) render();
      return;
    }
    const slide = byId(id);
    if (!slide || slide.hidden) return;
    const playing =
      keepPlaying !== undefined ? !!keepPlaying : shouldAutoPlayNext();
    resetSlide(id, playing, keepQuiz);
    if (deferPlayerRender) return;
    finishPlayerRender(playing);
  }

  function presentQuizFeedback(message, tone, targetId) {
    const dest = targetId ? byId(targetId) : null;
    if (!dest || dest.hidden) {
      state.quizFeedbackHold = false;
      if (tone === "success") {
        // Confirm on this slide; move on once it has finished playing (B9).
        setQuizMessage(message, tone);
        scheduleCorrectAdvance();
        return;
      }
      setQuizMessage("");
      return;
    }
    if (dest.id === state.currentSlideId) {
      state.quizFeedbackHold = false;
      setQuizMessage(message, tone);
      if (tone === "success") scheduleCorrectAdvance();
      return;
    }
    setQuizMessage(message, tone);
    goTo(dest.id, true, true, true, true);
  }

  function nextPlayableId() {
    const i = state.playlist.indexOf(state.currentSlideId);
    if (i >= 0 && i < state.playlist.length - 1) return state.playlist[i + 1];
    const list = playable();
    const di = list.findIndex(function (slide) {
      return slide.id === state.currentSlideId;
    });
    if (di >= 0 && di < list.length - 1) return list[di + 1].id;
    return "";
  }

  function nextSlide(keepPlaying, bypassVideoGate) {
    if (!canLeaveForward(undefined, bypassVideoGate)) {
      if (!deferPlayerRender) render();
      return;
    }
    const nextId = nextPlayableId();
    if (!nextId) {
      state.isPlaying = false;
      state.finished = true;
      syncScoreVariable();
      markScormComplete();
      if (!deferPlayerRender) render();
      return;
    }
    const playing = !!keepPlaying || shouldAutoPlayNext();
    resetSlide(nextId, playing);
    if (deferPlayerRender) return;
    finishPlayerRender(playing);
  }

  function prevSlide() {
    const i = state.playlist.indexOf(state.currentSlideId);
    if (i <= 0) return;
    resetSlide(state.playlist[i - 1], false);
    if (deferPlayerRender) return;
    render();
  }

  function applyAction(action, bookmarkTime, fromInteraction) {
    const fromBookmark = bookmarkTime != null;
    const bypassVideoGate = fromBookmark || fromInteraction === true;
    switch (action.type) {
      case "goToSlide": {
        const before = state.currentSlideId;
        goTo(action.slideId, true, bypassVideoGate);
        return state.currentSlideId !== before;
      }
      case "goToNextSlide": {
        const before = state.currentSlideId;
        nextSlide(true, bypassVideoGate);
        return state.currentSlideId !== before;
      }
      case "exitCourse":
        exitCourse();
        return "finished";
      case "goToSlideIf": {
        const target = conditionHolds(action.condition) ? action.slideId : action.elseSlideId;
        if (!target) return false;
        const before = state.currentSlideId;
        goTo(target, true, bypassVideoGate);
        return state.currentSlideId !== before;
      }
      case "restartCourse":
        restartCourse();
        return true;
      case "reviewAnswers":
        startReview();
        return true;
      case "exitReview":
        exitReview();
        return true;
      case "stopTimeline":
        state.isPlaying = false;
        state.playhead = bookmarkTime != null ? bookmarkTime : state.playhead;
        state.timelineStopAt = bookmarkTime != null ? bookmarkTime : state.playhead;
        return "stopped";
      case "startTimeline":
        break;
      case "showElement":
        state.visibilityOverrides[action.elementId] = true;
        break;
      case "hideElement":
        state.visibilityOverrides[action.elementId] = false;
        break;
      case "toggleElement": {
        const slide = byId(state.currentSlideId);
        const el = slide?.elements.find((e) => e.id === action.elementId);
        if (!el) break;
        const cur = effectivelyVisible(el);
        state.visibilityOverrides[action.elementId] = !cur;
        break;
      }
      case "setElementState": {
        const slide = byId(state.currentSlideId);
        const el = slide?.elements.find((e) => e.id === action.elementId);
        if (
          !el ||
          !el.states ||
          !el.states.states.some(function (item) {
            return item.id === action.stateId;
          })
        ) {
          break;
        }
        state.stateOverrides[action.elementId] = action.stateId;
        break;
      }
      case "submitChoiceGroup":
        submitChoiceGroup(action.groupId);
        break;
      case "submitDragDropGroup": {
        const before = state.currentSlideId;
        oddSubmit(action.groupId);
        return state.currentSlideId !== before;
      }
      case "resetDragDropGroup":
        oddReset(action.groupId);
        break;
      case "goToQuizFeedback": {
        const before = state.currentSlideId;
        applyGoToQuizFeedback(action);
        return state.currentSlideId !== before;
      }
      case "playAudio":
        state.mediaPlaying[action.elementId] = true;
        break;
      case "pauseMedia":
        state.mediaPlaying[action.elementId] = false;
        break;
      case "setVariable":
        if (action.variableId in state.variables) {
          state.variables[action.variableId] = action.value;
        }
        break;
    }
    return false;
  }

  function hasLaterNavigationAction(actions, fromIndex) {
    for (let i = fromIndex + 1; i < actions.length; i++) {
      const type = actions[i]?.type;
      if (
        type === "goToSlide" ||
        type === "goToNextSlide" ||
        type === "goToQuizFeedback" ||
        type === "exitCourse"
      ) {
        return true;
      }
    }
    return false;
  }

  function applyActions(actions, bookmarkTime, fromInteraction) {
    for (let index = 0; index < (actions || []).length; index++) {
      const action = actions[index];
      const result = applyAction(action, bookmarkTime, fromInteraction);
      if (result === true || result === "finished") return result;
      if (result === "stopped" && !hasLaterNavigationAction(actions, index)) {
        return "stopped";
      }
    }
    return false;
  }

  function sortedBookmarks(slide) {
    return [...(slide.bookmarks || [])].sort(function (a, b) {
      return a.time - b.time;
    });
  }

  function processBookmarks(fromTime, toTime) {
    if (toTime <= fromTime + 0.0001) return false;
    const slide = byId(state.currentSlideId);
    if (!slide) return false;
    const fired = new Set(state.firedBookmarkIds || []);
    let navigated = false;
    for (const bookmark of sortedBookmarks(slide)) {
      if (bookmark.time <= fromTime + 0.0001) continue;
      if (bookmark.time > toTime + 0.0001) break;
      if (fired.has(bookmark.id)) continue;
      fired.add(bookmark.id);
      state.firedBookmarkIds = Array.from(fired);
      state.playhead = bookmark.time;
      const beforeSlide = state.currentSlideId;
      const result = applyActions(bookmark.actions, bookmark.time);
      if (result === "finished" || state.finished) {
        return "finished";
      }
      if (result === true || state.currentSlideId !== beforeSlide) {
        navigated = true;
        break;
      }
      if (result === "stopped") {
        return "stopped";
      }
    }
    return navigated ? true : false;
  }

  function isChoiceOptionElement(el) {
    const config = el.states;
    return Boolean(
      config &&
        config.choiceGroupId &&
        config.selectedStateId &&
        config.isChoiceOption !== false,
    );
  }

  function isElementClickable(el) {
    if ((el.interactions || []).some((ix) => ix.trigger?.type === "click")) {
      return true;
    }
    return isChoiceOptionElement(el);
  }

  function onClickElement(el) {
    if (!effectivelyVisible(el)) return;
    if (!state.reviewMode) applyChoiceGroupSelection(el);
    const actions = [];
    for (const ix of el.interactions || []) {
      if (!ix.trigger || ix.trigger.type !== "click") continue;
      if (ix.condition && !conditionHolds(ix.condition)) continue;
      for (const action of ix.actions || []) actions.push(action);
    }
    const result = applyActions(actions, undefined, true);
    if (result === true || result === "finished") {
      finishPlayerRender(state.isPlaying);
      return;
    }
    render();
  }

  // ---- Object-based drag and drop (slide exercises) -----------------------
  /** Picked item for click/keyboard placement: { groupId, itemId }. */
  let oddPicked = null;
  let oddDrag = null;
  let oddSuppressClick = false;

  function oddGroups(slide) {
    return (slide && slide.dragDropGroups) || [];
  }
  function oddMembers(slide, groupId) {
    const items = [];
    const targets = [];
    (slide.elements || []).forEach(function (el) {
      if (!el.dragDrop || el.dragDrop.groupId !== groupId) return;
      if (el.dragDrop.role === "item") items.push(el);
      else targets.push(el);
    });
    return { items: items, targets: targets };
  }
  /** True when an item counts as correct on this target (any, a list, or the legacy single id). */
  function oddAccepts(role, targetId) {
    if (role.belongsToNothing === true) return false;
    if (role.acceptAnyTarget === true) return true;
    const ids = role.correctTargetIds || (role.correctTargetId ? [role.correctTargetId] : []);
    return ids.indexOf(targetId) >= 0;
  }
  /** Same shape as domain dragDropGroupRules: items/zones keyed by element id. */
  function oddRules(slide, group) {
    const m = oddMembers(slide, group.id);
    const targetIds = {};
    m.targets.forEach(function (t) { targetIds[t.id] = true; });
    return {
      id: group.id,
      scoringMode: group.scoringMode,
      items: m.items.map(function (el) { return { id: el.id, label: el.name }; }),
      zones: m.targets.map(function (t) {
        return {
          id: t.id,
          label: t.name,
          capacity: t.dragDrop.capacity == null ? 1 : t.dragDrop.capacity,
          correctItemIds: m.items
            .filter(function (el) {
              return targetIds[t.id] && oddAccepts(el.dragDrop, t.id);
            })
            .map(function (el) { return el.id; }),
        };
      }),
    };
  }
  function oddCourseGroups() {
    const list = [];
    (documentModel.slides || []).forEach(function (slide) {
      if (slide.hidden || !slideInPlay(slide)) return;
      oddGroups(slide).forEach(function (group) {
        if (oddMembers(slide, group.id).items.length) list.push(group);
      });
    });
    return list;
  }
  function oddGateGroups(slide) {
    return oddGroups(slide).filter(function (group) {
      return group.requireCorrectToContinue !== false && oddMembers(slide, group.id).items.length > 0;
    });
  }
  /** Why Next is blocked: names the exercise when it is the cause. */
  function oddBlockedMessage(slide) {
    const questionOpen = (slide.elements || []).some(function (el) {
      if (!questionRequiresCorrect(el)) return false;
      const a = state.quizAnswers[el.id];
      return !a || !a.graded;
    });
    const open = oddGateGroups(slide).filter(function (group) {
      const a = state.quizAnswers[group.id];
      return !a || !a.graded;
    });
    if (questionOpen || !open.length) return "Answer correctly to continue.";
    return open.every(function (group) { return group.autoCheck !== false; })
      ? "Place every item on its correct target to continue."
      : "Place the items, then press Submit to continue.";
  }
  function oddPlacements(groupId) {
    const a = state.quizAnswers[groupId];
    return (a && a.placements) || [];
  }
  function oddFindGroup(slide, groupId) {
    return oddGroups(slide).find(function (g) { return g.id === groupId; }) || null;
  }
  function oddGroupOpen(slide, groupId) {
    const group = oddFindGroup(slide, groupId);
    return !!group && canAttempt(group, state.quizAnswers[groupId]);
  }
  /** Placed position of an item (slide units), or null when at its start. */
  function oddPositionOf(slide, el) {
    if (!slide || !el.dragDrop || el.dragDrop.role !== "item") return null;
    const groupId = el.dragDrop.groupId;
    const placements = oddPlacements(groupId);
    const mine = placements.find(function (p) { return p.itemId === el.id; });
    if (!mine) return null;
    const target = (slide.elements || []).find(function (t) { return t.id === mine.zoneId; });
    if (!target || !target.dragDrop || target.dragDrop.groupId !== groupId) return null;
    const sharing = placements.filter(function (p) { return p.zoneId === mine.zoneId; });
    const index = sharing.findIndex(function (p) { return p.itemId === el.id; });
    return layoutPlacedObject(target, el, index, sharing.length);
  }
  function oddIsInteractive(el) {
    const slide = byId(state.currentSlideId);
    if (!slide || !el.dragDrop || !slide.elements.some(function (x) { return x.id === el.id; })) return false;
    if (!oddGroupOpen(slide, el.dragDrop.groupId)) return false;
    if (el.dragDrop.role === "item") return true;
    return !!oddPicked && oddPicked.groupId === el.dragDrop.groupId;
  }
  function oddLabel(slide, id) {
    const el = (slide.elements || []).find(function (x) { return x.id === id; });
    return (el && el.name) || "object";
  }

  /** Commit a placement (targetId null = back to start). Returns true when state changed. */
  function oddPlace(slide, groupId, itemId, targetId) {
    const group = oddFindGroup(slide, groupId);
    if (!group) return false;
    const previous = state.quizAnswers[groupId];
    if (!canAttempt(group, previous)) return false;
    const placements = oddPlacements(groupId);
    const current = placements.find(function (p) { return p.itemId === itemId; });
    if (targetId === null && !current) return false;
    const next = applyDragDropPlacement(oddRules(slide, group), placements, itemId, targetId);
    if (!next) {
      if (targetId) oddFlash(targetId);
      return false;
    }
    if (next === placements) return false;
    state.quizAnswers[groupId] = {
      selectedIds: [],
      placements: next,
      attempts: previous ? previous.attempts : 0,
      graded: false,
      correct: false,
      feedback: previous ? previous.feedback : "",
      earnedFraction: previous ? previous.earnedFraction : undefined,
    };
    setQuizMessage("");
    // Check automatically once everything is placed correctly (no Submit needed).
    const movedEl = (slide.elements || []).find(function (x) { return x.id === itemId; });
    const nothingDropped = targetId !== null && !!movedEl && !!movedEl.dragDrop && movedEl.dragDrop.belongsToNothing === true;
    if (group.autoCheck !== false && (nothingDropped || gradeDragDrop(oddRules(slide, group), next).correct)) {
      oddSubmit(groupId);
    }
    return true;
  }

  function oddSubmit(groupId) {
    const slide = byId(state.currentSlideId);
    const group = slide ? oddFindGroup(slide, groupId) : null;
    if (!group) return;
    const previous = state.quizAnswers[groupId];
    if (!canAttempt(group, previous)) return;
    const placements = oddPlacements(groupId);
    if (!placements.length) {
      state.quizFeedbackHold = false;
      setQuizMessage("Place at least one item before you submit.", "error");
      return;
    }
    const rules = oddRules(slide, group);
    const attempts = ((previous && previous.attempts) || 0) + 1;
    const grade = gradeDragDrop(rules, placements);
    const partialText = String(group.feedbackPartial || "").trim();
    let feedback = grade.correct
      ? group.feedbackCorrect || "Correct!"
      : grade.fraction > 0 && partialText
        ? partialText
        : group.feedbackIncorrect || "Incorrect.";
    const exhausted = group.maxAttempts > 0 && attempts >= group.maxAttempts;
    if (exhausted && !grade.correct) feedback += NO_ATTEMPTS_LEFT_NOTE;
    state.quizAnswers[groupId] = {
      selectedIds: [],
      placements: placements,
      attempts: attempts,
      graded: grade.correct || exhausted,
      correct: grade.correct,
      feedback: feedback,
      earnedFraction: grade.fraction,
    };
    oddPicked = null;
    syncScoreVariable();
    recordQuizInteraction(
      { id: group.id, kind: "dragDrop", items: rules.items, zones: rules.zones, points: group.points },
      state.quizAnswers[groupId],
    );
    presentQuizFeedback(
      feedback,
      grade.correct ? "success" : "error",
      (grade.correct ? group.feedbackCorrectSlideId : group.feedbackIncorrectSlideId) || slide.id,
    );
  }

  function oddReset(groupId) {
    const slide = byId(state.currentSlideId);
    const group = slide ? oddFindGroup(slide, groupId) : null;
    const previous = state.quizAnswers[groupId];
    if (!group || !previous || !previous.placements || !previous.placements.length) return;
    if (!canAttempt(group, previous)) return;
    state.quizAnswers[groupId] = Object.assign({}, previous, { placements: [], graded: false, correct: false });
    oddPicked = null;
  }

  function oddFlash(targetId) {
    const node = stage.querySelector('[data-el-id="' + targetId + '"]');
    if (!node) return;
    const previous = node.style.outline;
    node.style.outline = "3px solid " + DND.error;
    window.setTimeout(function () { node.style.outline = previous; }, 650);
  }

  function oddToSlide(clientX, clientY, scale) {
    const rect = stage.getBoundingClientRect();
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }
  function oddInside(box, x, y) {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
  }
  /** Target id under the point, "home" for the item's start, or null. */
  function oddHitTest(slide, groupId, item, x, y) {
    const targets = oddMembers(slide, groupId).targets.slice().reverse();
    for (let i = 0; i < targets.length; i++) {
      if (effectivelyVisible(targets[i]) && oddInside(targets[i], x, y)) return targets[i].id;
    }
    return oddInside(item, x, y) ? "home" : null;
  }
  function oddRerender(focusId) {
    render();
    if (!focusId) return;
    const node = stage.querySelector('[data-el-id="' + focusId + '"]');
    if (node && node.focus) node.focus();
  }
  function oddCommitTarget(slide, groupId, itemId, hit) {
    if (hit === null) return false;
    return oddPlace(slide, groupId, itemId, hit === "home" ? null : hit);
  }
  function oddKeyGuard(ev) {
    if (DND_KEYS.indexOf(ev.key) >= 0) ev.stopPropagation();
  }

  /** Wire drag, click and keyboard behaviour onto a slide object node. */
  function oddDecorate(node, el, scale) {
    if (!oddIsInteractive(el)) return;
    const slide = byId(state.currentSlideId);
    const groupId = el.dragDrop.groupId;
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    if (el.dragDrop.role === "target") {
      node.setAttribute("data-odd-target", el.id);
      node.setAttribute("aria-label", "Place " + oddLabel(slide, oddPicked.itemId) + " on " + (el.name || "target"));
      node.style.outline = "2px dashed " + DND.accent;
      node.style.outlineOffset = "2px";
      node.style.cursor = "pointer";
      const placeHere = function () {
        if (!oddPicked) return;
        const itemId = oddPicked.itemId;
        oddPicked = null;
        if (oddPlace(slide, groupId, itemId, el.id)) oddRerender(itemId);
        else render();
      };
      node.addEventListener("click", function (ev) { ev.stopPropagation(); placeHere(); });
      node.addEventListener("keydown", function (ev) {
        oddKeyGuard(ev);
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); placeHere(); }
        if (ev.key === "Escape" && oddPicked) { ev.stopPropagation(); oddPicked = null; render(); }
      });
      return;
    }
    // Drag item
    const placedOn = (oddPlacements(groupId).find(function (p) { return p.itemId === el.id; }) || {}).zoneId;
    node.setAttribute("data-odd-item", el.id);
    node.setAttribute("aria-pressed", oddPicked && oddPicked.itemId === el.id ? "true" : "false");
    node.setAttribute("aria-label", (el.name || "Item") + (placedOn ? ", on " + oddLabel(slide, placedOn) : ", drag item"));
    node.style.touchAction = "none";
    node.style.cursor = "grab";
    if (oddPicked && oddPicked.itemId === el.id) {
      node.style.outline = "3px solid " + DND.accent;
      node.style.outlineOffset = "2px";
    }
    node.addEventListener("pointerdown", function (ev) {
      if (ev.button !== 0) return;
      const pos = oddPositionOf(slide, el) || { x: el.x, y: el.y };
      const point = oddToSlide(ev.clientX, ev.clientY, scale);
      oddDrag = {
        itemId: el.id, pointerId: ev.pointerId, node: node,
        startX: ev.clientX, startY: ev.clientY,
        offsetX: point.x - pos.x, offsetY: point.y - pos.y, dragging: false,
      };
      if (node.setPointerCapture) node.setPointerCapture(ev.pointerId);
    });
    node.addEventListener("pointermove", function (ev) {
      const d = oddDrag;
      if (!d || d.pointerId !== ev.pointerId || d.node !== node) return;
      if (!d.dragging) {
        if (Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) < 5) return;
        d.dragging = true;
        oddPicked = null;
        node.style.zIndex = "1000";
        node.style.cursor = "grabbing";
      }
      const point = oddToSlide(ev.clientX, ev.clientY, scale);
      node.style.left = (point.x - d.offsetX) * scale + "px";
      node.style.top = (point.y - d.offsetY) * scale + "px";
      const hit = oddHitTest(slide, groupId, el, point.x, point.y);
      oddMembers(slide, groupId).targets.forEach(function (t) {
        const tn = stage.querySelector('[data-el-id="' + t.id + '"]');
        if (tn) tn.style.outline = hit === t.id ? "3px solid " + DND.accent : "2px dashed " + DND.accent;
      });
    });
    const finish = function (ev, commit) {
      const d = oddDrag;
      if (!d || d.pointerId !== ev.pointerId || d.node !== node) return;
      oddDrag = null;
      if (!d.dragging) return; // a press: the click handler picks it up
      oddSuppressClick = true;
      if (commit) {
        const point = oddToSlide(ev.clientX, ev.clientY, scale);
        oddCommitTarget(slide, groupId, el.id, oddHitTest(slide, groupId, el, point.x, point.y));
      }
      // Re-render either way: placed objects move, misses snap back.
      render();
    };
    node.addEventListener("pointerup", function (ev) { finish(ev, true); });
    node.addEventListener("pointercancel", function (ev) { finish(ev, false); });
    const togglePick = function () {
      oddPicked = oddPicked && oddPicked.itemId === el.id ? null : { groupId: groupId, itemId: el.id };
      oddRerender(el.id);
    };
    node.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (oddSuppressClick) { oddSuppressClick = false; return; }
      togglePick();
    });
    node.addEventListener("keydown", function (ev) {
      oddKeyGuard(ev);
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); togglePick(); }
      if (ev.key === "Escape" && oddPicked) { ev.stopPropagation(); oddPicked = null; oddRerender(el.id); }
    });
  }

  /** While a placed item is picked, show its start position as a return spot. */
  function oddRenderHome(slide, scale) {
    if (!oddPicked) return;
    const item = (slide.elements || []).find(function (x) { return x.id === oddPicked.itemId; });
    if (!item || !oddPositionOf(slide, item)) return;
    const home = document.createElement("div");
    home.setAttribute("role", "button");
    home.setAttribute("tabindex", "0");
    home.setAttribute("data-odd-home", item.id);
    home.setAttribute("aria-label", "Return " + (item.name || "item") + " to its start");
    Object.assign(home.style, {
      position: "absolute",
      left: item.x * scale + "px", top: item.y * scale + "px",
      width: item.width * scale + "px", height: item.height * scale + "px",
      border: "2px dashed " + DND.muted, borderRadius: "4px", cursor: "pointer", zIndex: "999",
    });
    const back = function () {
      const groupId = oddPicked.groupId;
      oddPicked = null;
      oddPlace(slide, groupId, item.id, null);
      oddRerender(item.id);
    };
    home.addEventListener("click", function (ev) { ev.stopPropagation(); back(); });
    home.addEventListener("keydown", function (ev) {
      oddKeyGuard(ev);
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); back(); }
    });
    stage.appendChild(home);
  }

  // ---- SCORM per-question interactions (no-op outside an LMS) ------------
  function interactionLetter(index) {
    return index < 26 ? String.fromCharCode(97 + index) : String(index + 1);
  }

  function recordQuizInteraction(question, answer, responseIds) {
    scormProgress(false);
    saveSuspend();
    try {
      if (!window.NariScorm || !window.NariScorm.recordInteraction || !answer) return;
      if (question.kind === "dragDrop") {
        const itemIndex = {};
        (question.items || []).forEach(function (item, i) { itemIndex[item.id] = i + 1; });
        const zoneIndex = {};
        (question.zones || []).forEach(function (zone, i) { zoneIndex[zone.id] = i + 1; });
        const response = (answer.placements || [])
          .filter(function (p) { return itemIndex[p.itemId] && zoneIndex[p.zoneId]; })
          .map(function (p) { return [itemIndex[p.itemId], zoneIndex[p.zoneId]]; });
        // One valid answer per item. An item may be correct on several zones,
        // so keep the learner's zone when it is accepted, else the first accepted one.
        const placedZone = {};
        (answer.placements || []).forEach(function (p) { placedZone[p.itemId] = p.zoneId; });
        const accepted = {};
        (question.zones || []).forEach(function (zone) {
          (zone.correctItemIds || []).forEach(function (itemId) {
            (accepted[itemId] = accepted[itemId] || []).push(zone.id);
          });
        });
        const correct = [];
        (question.items || []).forEach(function (item) {
          const zones = accepted[item.id];
          if (!zones || !zones.length) return;
          const zoneId = zones.indexOf(placedZone[item.id]) >= 0 ? placedZone[item.id] : zones[0];
          correct.push([itemIndex[item.id], zoneIndex[zoneId]]);
        });
        window.NariScorm.recordInteraction({
          id: question.id,
          type: "matching",
          response: response,
          correctResponse: correct,
          correct: !!answer.correct,
          weighting: question.points || 0,
        });
        return;
      }
      const choices = question.choices || [];
      const selected = responseIds || answer.selectedIds || [];
      const letterFor = function (id) {
        const i = choices.findIndex(function (c) { return c.id === id; });
        return i >= 0 ? interactionLetter(i) : null;
      };
      window.NariScorm.recordInteraction({
        id: question.id,
        type: "choice",
        response: selected.map(letterFor).filter(Boolean),
        correctResponse: choices
          .map(function (c, i) { return c.correct ? interactionLetter(i) : null; })
          .filter(Boolean),
        correct: !!answer.correct,
        weighting: question.points || 0,
      });
    } catch (e) {}
  }

  // ---- Drag-and-drop question ---------------------------------------------
  const DND = {
    card: "#0F172A", border: "#334155", text: "#E2E8F0", muted: "#94A3B8",
    chip: "#1E293B", zoneBg: "rgba(15, 23, 42, 0.6)", accent: "#14B8A6",
    accentSoft: "rgba(20, 184, 166, 0.14)", accentText: "#042F2E",
    placed: "#0F766E", error: "#FCA5A5", success: "#5EEAD4",
  };
  const DND_KEYS = [" ", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  /** Picked item for click/keyboard placement: { questionId, itemId }. */
  let dndPicked = null;
  /** Active pointer drag. */
  let dndDrag = null;
  let dndSuppressClick = false;
  const dndAnnouncements = {};

  function dndPlacements(el) {
    const a = state.quizAnswers[el.id];
    return (a && a.placements) || [];
  }
  function dndItemLabel(el, itemId) {
    const item = (el.items || []).find(function (i) { return i.id === itemId; });
    return (item && item.label) || "Item";
  }
  function dndZoneLabel(el, zoneId) {
    const zone = (el.zones || []).find(function (z) { return z.id === zoneId; });
    return (zone && zone.label) || "zone";
  }
  function dndZoneOf(el, itemId) {
    const p = dndPlacements(el).find(function (x) { return x.itemId === itemId; });
    return p ? p.zoneId : null;
  }
  function dndRerender(el, selector) {
    render();
    if (!selector) return;
    const host = stage.querySelector('[data-el-id="' + el.id + '"]');
    const target = host && host.querySelector(selector);
    if (target) target.focus();
  }
  function dndFlashZone(el, zoneId) {
    const host = stage.querySelector('[data-el-id="' + el.id + '"]');
    const zone = host && host.querySelector('[data-dnd-zone="' + zoneId + '"]');
    if (!zone) return;
    const previous = zone.style.borderColor;
    zone.style.borderColor = DND.error;
    window.setTimeout(function () { zone.style.borderColor = previous; }, 650);
  }

  /** Commit a placement (zoneId null = back to the bank). Returns true if state changed. */
  function dndPlace(el, itemId, zoneId) {
    const previous = state.quizAnswers[el.id];
    if (!canAttempt(el, previous)) return false;
    const placements = dndPlacements(el);
    if (zoneId === null && dndZoneOf(el, itemId) === null) return false;
    const next = applyDragDropPlacement(el, placements, itemId, zoneId);
    if (!next) {
      if (zoneId) {
        dndAnnouncements[el.id] = dndZoneLabel(el, zoneId) + " is full.";
        dndFlashZone(el, zoneId);
        const host = stage.querySelector('[data-el-id="' + el.id + '"] [aria-live]');
        if (host) host.textContent = dndAnnouncements[el.id];
      }
      return false;
    }
    if (next === placements) return false;
    state.quizAnswers[el.id] = {
      selectedIds: [],
      placements: next,
      attempts: previous ? previous.attempts : 0,
      graded: false,
      correct: false,
      feedback: previous ? previous.feedback : "",
      earnedFraction: previous ? previous.earnedFraction : undefined,
    };
    dndAnnouncements[el.id] = zoneId
      ? dndItemLabel(el, itemId) + " placed in " + dndZoneLabel(el, zoneId) + "."
      : dndItemLabel(el, itemId) + " returned to the items.";
    setQuizMessage("");
    return true;
  }

  function dndHitTest(host, x, y) {
    const inside = function (node) {
      if (!node) return false;
      const r = node.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const zones = host.querySelectorAll("[data-dnd-zone]");
    for (let i = 0; i < zones.length; i++) {
      if (inside(zones[i])) return { zoneId: zones[i].getAttribute("data-dnd-zone") };
    }
    return inside(host.querySelector("[data-dnd-bank]")) ? { zoneId: null } : null;
  }

  function dndHighlight(host, target) {
    host.querySelectorAll("[data-dnd-zone]").forEach(function (zone) {
      const on = !!target && target.zoneId === zone.getAttribute("data-dnd-zone");
      zone.style.background = on ? DND.accentSoft : DND.zoneBg;
      zone.style.borderColor = on ? DND.accent : zone.getAttribute("data-border");
    });
    const bank = host.querySelector("[data-dnd-bank]");
    if (bank) {
      const on = !!target && target.zoneId === null;
      bank.style.background = on ? DND.accentSoft : "transparent";
      bank.style.borderColor = on ? DND.accent : "transparent";
    }
  }

  function dndEndDrag() {
    if (!dndDrag) return;
    if (dndDrag.ghost && dndDrag.ghost.parentNode) dndDrag.ghost.parentNode.removeChild(dndDrag.ghost);
    dndDrag = null;
  }
  // A render during a drag removes the chip; drop the orphaned ghost.
  window.addEventListener("pointerup", function () {
    if (dndDrag && !document.body.contains(dndDrag.chip)) dndEndDrag();
  });

  function renderDragDropQuestion(node, el, scale) {
    const answer = state.quizAnswers[el.id];
    const open = canAttempt(el, answer);
    const placements = dndPlacements(el);
    const picked = dndPicked && dndPicked.questionId === el.id ? dndPicked.itemId : null;
    const px = function (n) { return n * scale + "px"; };
    Object.assign(node.style, {
      background: DND.card,
      border: "1px solid " + DND.border,
      borderRadius: px(10),
      color: DND.text,
      padding: px(12),
      fontSize: px(13),
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      gap: px(8),
      cursor: "default",
    });
    node.setAttribute("data-dnd-question", el.id);
    node.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        if (dndPicked && dndPicked.questionId === el.id) {
          ev.stopPropagation();
          const itemId = dndPicked.itemId;
          dndPicked = null;
          dndAnnouncements[el.id] = "Move cancelled.";
          dndRerender(el, '[data-dnd-chip="' + itemId + '"]');
        }
        return;
      }
      if (DND_KEYS.indexOf(ev.key) >= 0) ev.stopPropagation();
    });

    const prompt = document.createElement("div");
    prompt.style.fontWeight = "600";
    prompt.style.lineHeight = "1.3";
    prompt.textContent = el.prompt;
    node.appendChild(prompt);
    if (el.instructions) {
      const instructions = document.createElement("div");
      instructions.style.fontSize = px(11);
      instructions.style.color = DND.muted;
      instructions.textContent = el.instructions;
      node.appendChild(instructions);
    }

    const placeAndRender = function (itemId, zoneId) {
      dndPicked = null;
      const changed = dndPlace(el, itemId, zoneId);
      if (changed) dndRerender(el, '[data-dnd-chip="' + itemId + '"]');
    };

    const makeChip = function (itemId, placed) {
      const wrap = document.createElement("span");
      Object.assign(wrap.style, {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: px(6),
        background: placed ? DND.placed : DND.chip,
        color: DND.text,
        fontSize: px(12),
        outline: picked === itemId ? Math.max(2, 2 * scale) + "px solid " + DND.accent : "none",
        outlineOffset: px(1),
        opacity: open ? "1" : "0.85",
        touchAction: "none",
        userSelect: "none",
        maxWidth: "100%",
      });
      const btn = document.createElement("button");
      btn.type = "button";
      btn.disabled = !open;
      btn.textContent = dndItemLabel(el, itemId);
      btn.setAttribute("data-dnd-chip", itemId);
      btn.setAttribute("aria-pressed", picked === itemId ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        placed ? dndItemLabel(el, itemId) + ", in " + dndZoneLabel(el, dndZoneOf(el, itemId)) : dndItemLabel(el, itemId),
      );
      Object.assign(btn.style, {
        background: "transparent",
        border: "none",
        color: "inherit",
        font: "inherit",
        padding: px(5) + " " + px(9),
        cursor: open ? "grab" : "default",
        textAlign: "left",
        touchAction: "none",
        overflowWrap: "anywhere",
      });
      btn.addEventListener("pointerdown", function (ev) {
        if (!open || ev.button !== 0) return;
        const r = btn.getBoundingClientRect();
        dndDrag = {
          questionId: el.id, itemId: itemId, pointerId: ev.pointerId, chip: btn,
          startX: ev.clientX, startY: ev.clientY,
          offsetX: ev.clientX - r.left, offsetY: ev.clientY - r.top,
          width: r.width, dragging: false, ghost: null,
        };
        if (btn.setPointerCapture) btn.setPointerCapture(ev.pointerId);
      });
      btn.addEventListener("pointermove", function (ev) {
        const d = dndDrag;
        if (!d || d.pointerId !== ev.pointerId || d.chip !== btn) return;
        if (!d.dragging) {
          if (Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) < 5) return;
          d.dragging = true;
          dndPicked = null;
          const ghost = document.createElement("div");
          ghost.className = "nari-dd-ghost";
          ghost.setAttribute("aria-hidden", "true");
          ghost.textContent = dndItemLabel(el, itemId);
          Object.assign(ghost.style, {
            position: "fixed", pointerEvents: "none", zIndex: "10000",
            width: d.width + "px", background: DND.placed, color: DND.text,
            borderRadius: px(6), padding: px(5) + " " + px(9), fontSize: px(12),
            fontFamily: "system-ui, sans-serif", boxShadow: "0 8px 20px rgba(0,0,0,.45)",
          });
          document.body.appendChild(ghost);
          d.ghost = ghost;
          wrap.style.opacity = "0.35";
        }
        d.ghost.style.left = ev.clientX - d.offsetX + "px";
        d.ghost.style.top = ev.clientY - d.offsetY + "px";
        dndHighlight(node, dndHitTest(node, ev.clientX, ev.clientY));
      });
      const finish = function (ev, commit) {
        const d = dndDrag;
        if (!d || d.pointerId !== ev.pointerId || d.chip !== btn) return;
        const wasDragging = d.dragging;
        dndEndDrag();
        if (!wasDragging) return;
        dndSuppressClick = true;
        const target = commit ? dndHitTest(node, ev.clientX, ev.clientY) : null;
        if (target && dndPlace(el, itemId, target.zoneId)) {
          dndRerender(el, null);
          return;
        }
        // Dropped outside / rejected: restore visuals without changing state.
        wrap.style.opacity = "1";
        dndHighlight(node, null);
      };
      btn.addEventListener("pointerup", function (ev) { finish(ev, true); });
      btn.addEventListener("pointercancel", function (ev) { finish(ev, false); });
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (dndSuppressClick) { dndSuppressClick = false; return; }
        if (!open) return;
        if (picked === itemId) {
          dndPicked = null;
          dndAnnouncements[el.id] = dndItemLabel(el, itemId) + " put down.";
        } else {
          dndPicked = { questionId: el.id, itemId: itemId };
          dndAnnouncements[el.id] =
            dndItemLabel(el, itemId) + " picked up. Choose a zone, or the items area to return it.";
        }
        dndRerender(el, '[data-dnd-chip="' + itemId + '"]');
      });
      wrap.appendChild(btn);
      if (placed && open) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.title = "Return to items";
        remove.setAttribute("aria-label", "Return " + dndItemLabel(el, itemId) + " to the items");
        Object.assign(remove.style, {
          background: "transparent", border: "none", color: DND.muted, font: "inherit",
          padding: px(5) + " " + px(7) + " " + px(5) + " 0", cursor: "pointer",
        });
        remove.addEventListener("click", function (ev) {
          ev.stopPropagation();
          placeAndRender(itemId, null);
        });
        wrap.appendChild(remove);
      }
      return wrap;
    };

    const grid = document.createElement("div");
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "Drop zones");
    Object.assign(grid.style, {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(" + px(120) + ", 1fr))",
      gap: px(6),
    });
    (el.zones || []).forEach(function (zone) {
      const contents = placements.filter(function (p) { return p.zoneId === zone.id; });
      const borderColor = picked && open ? DND.accent : DND.border;
      const box = document.createElement("div");
      box.setAttribute("data-dnd-zone", zone.id);
      box.setAttribute("data-border", borderColor);
      Object.assign(box.style, {
        border: Math.max(1, 1.5 * scale) + "px " + (contents.length ? "solid" : "dashed") + " " + borderColor,
        background: DND.zoneBg,
        borderRadius: px(6),
        padding: px(6),
        minHeight: px(56),
        display: "flex",
        flexDirection: "column",
        gap: px(4),
        cursor: picked && open ? "pointer" : "default",
      });
      box.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (picked && open) placeAndRender(picked, zone.id);
      });
      const label = document.createElement("button");
      label.type = "button";
      label.textContent = zone.label || "Zone";
      label.disabled = !picked || !open;
      label.setAttribute("data-dnd-zone-btn", zone.id);
      label.setAttribute(
        "aria-label",
        picked
          ? "Place " + dndItemLabel(el, picked) + " in " + (zone.label || "this zone")
          : (zone.label || "Zone") + ": " + contents.length + (contents.length === 1 ? " item" : " items"),
      );
      Object.assign(label.style, {
        background: "transparent", border: "none", padding: "0", color: DND.text,
        font: "inherit", fontSize: px(11), fontWeight: "600", textAlign: "left",
        cursor: picked && open ? "pointer" : "default",
      });
      label.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (picked && open) placeAndRender(picked, zone.id);
      });
      box.appendChild(label);
      const list = document.createElement("div");
      Object.assign(list.style, { display: "flex", flexWrap: "wrap", gap: px(4) });
      if (!contents.length) {
        const empty = document.createElement("span");
        empty.style.fontSize = px(10);
        empty.style.color = DND.muted;
        empty.textContent = open ? "Drop here" : "Empty";
        list.appendChild(empty);
      } else {
        contents.forEach(function (p) { list.appendChild(makeChip(p.itemId, true)); });
      }
      box.appendChild(list);
      grid.appendChild(box);
    });
    node.appendChild(grid);

    const bank = document.createElement("div");
    bank.setAttribute("data-dnd-bank", "");
    bank.setAttribute("role", "group");
    bank.setAttribute("aria-label", "Items to place");
    const bankHighlight = picked && dndZoneOf(el, picked);
    Object.assign(bank.style, {
      border: Math.max(1, scale) + "px dashed " + (bankHighlight ? DND.accent : "transparent"),
      borderRadius: px(6),
      padding: px(4),
      minHeight: px(34),
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: px(4),
    });
    bank.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (picked && open) placeAndRender(picked, null);
    });
    const bankLabel = document.createElement("span");
    bankLabel.style.fontSize = px(10);
    bankLabel.style.color = DND.muted;
    bankLabel.textContent = "Items:";
    bank.appendChild(bankLabel);
    const bankItems = orderDragDropItems(el).filter(function (item) {
      return !placements.some(function (p) { return p.itemId === item.id; });
    });
    if (!bankItems.length) {
      const none = document.createElement("span");
      none.style.fontSize = px(10);
      none.style.color = DND.muted;
      none.textContent = "All items placed";
      bank.appendChild(none);
    } else {
      bankItems.forEach(function (item) { bank.appendChild(makeChip(item.id, false)); });
    }
    node.appendChild(bank);

    if (open) {
      const controls = document.createElement("div");
      Object.assign(controls.style, { display: "flex", alignItems: "center", gap: px(6), flexWrap: "wrap" });
      const submit = document.createElement("button");
      submit.type = "button";
      submit.textContent = "Submit";
      submit.disabled = placements.length === 0;
      Object.assign(submit.style, {
        background: DND.accent, color: DND.accentText, border: "none", borderRadius: px(6),
        padding: px(6) + " " + px(12), fontSize: px(12), fontWeight: "600",
        cursor: placements.length ? "pointer" : "default", opacity: placements.length ? "1" : "0.5",
      });
      submit.addEventListener("click", function (ev) {
        ev.stopPropagation();
        dndPicked = null;
        submitQuestion(el);
      });
      const reset = document.createElement("button");
      reset.type = "button";
      reset.textContent = "Reset";
      reset.disabled = placements.length === 0;
      Object.assign(reset.style, {
        background: DND.chip, color: DND.text, border: "none", borderRadius: px(6),
        padding: px(6) + " " + px(12), fontSize: px(12),
        cursor: placements.length ? "pointer" : "default", opacity: placements.length ? "1" : "0.5",
      });
      reset.addEventListener("click", function (ev) {
        ev.stopPropagation();
        dndPicked = null;
        const prev = state.quizAnswers[el.id];
        if (!prev || !canAttempt(el, prev)) return;
        state.quizAnswers[el.id] = Object.assign({}, prev, { placements: [], graded: false, correct: false });
        dndAnnouncements[el.id] = "All items returned.";
        render();
      });
      const count = document.createElement("span");
      count.style.fontSize = px(10);
      count.style.color = DND.muted;
      count.textContent = placements.length + " of " + (el.items || []).length + " placed";
      controls.appendChild(submit);
      controls.appendChild(reset);
      controls.appendChild(count);
      node.appendChild(controls);
    }

    if (answer && answer.feedback) {
      const fb = document.createElement("div");
      fb.style.fontSize = px(11);
      fb.style.color = answer.correct ? DND.success : DND.error;
      let text = answer.feedback;
      if (answer.attempts) {
        text += " · attempt " + answer.attempts + (el.maxAttempts > 0 ? "/" + el.maxAttempts : "");
      }
      if (el.scoringMode === "partial" && answer.attempts > 0 && !answer.correct && typeof answer.earnedFraction === "number") {
        text += " · " + Math.round(answer.earnedFraction * 100) + "% credit";
      }
      fb.textContent = text;
      node.appendChild(fb);
    }

    const live = document.createElement("div");
    live.setAttribute("aria-live", "polite");
    Object.assign(live.style, {
      position: "absolute", width: "1px", height: "1px", overflow: "hidden",
      clip: "rect(0 0 0 0)", whiteSpace: "nowrap",
    });
    live.textContent = dndAnnouncements[el.id] || "";
    node.appendChild(live);
  }

  /** Results card: score, pass/fail message and the per-question list (mirrors canvas/ResultsView.tsx). */
  function renderResults(node, el, scale) {
    const mark = Number((documentModel.settings || {}).passMark);
    const summary = buildResultsSummary(resultsItemList(), state.quizAnswers, isFinite(mark) ? mark : 80);
    const px = function (n) { return n * scale + "px"; };
    const accent = summary.passed === false ? el.failColor : el.passColor;
    Object.assign(node.style, {
      boxSizing: "border-box",
      background: el.backgroundColor,
      color: el.style.color,
      fontFamily: el.style.fontFamily,
      fontWeight: String(el.style.fontWeight),
      textAlign: el.style.align,
      borderRadius: px(16),
      padding: px(28),
      display: "flex",
      flexDirection: "column",
      gap: px(10),
      overflow: "hidden",
    });
    const add = function (text, size, extra) {
      const d = document.createElement("div");
      d.textContent = text;
      d.style.fontSize = px(size);
      if (extra) Object.assign(d.style, extra);
      node.appendChild(d);
      return d;
    };
    add(el.heading, el.style.fontSize, { fontWeight: "700", lineHeight: "1.15" });
    if (summary.hasScore) {
      add(summary.percent + "%", el.style.fontSize * 2.4, { fontWeight: "700", color: accent, lineHeight: "1" });
      if (el.showPoints) {
        add(summary.earned + " of " + summary.max + " points · pass mark " + summary.passMark + "%", el.style.fontSize * 0.6, { opacity: "0.85" });
      }
      const message = summary.passed === null ? "" : summary.passed ? el.passMessage : el.failMessage;
      if (message) add(message, el.style.fontSize * 0.7, { color: accent, lineHeight: "1.3" });
    } else {
      add("This course has no scored questions yet.", el.style.fontSize * 0.6, { opacity: "0.8" });
    }
    if (el.showBreakdown && summary.rows.length) {
      const list = document.createElement("ul");
      Object.assign(list.style, {
        listStyle: "none", margin: "0", padding: "0", marginTop: px(6), display: "flex",
        flexDirection: "column", gap: px(6), textAlign: "left", fontSize: px(el.style.fontSize * 0.5),
        overflow: "auto", minHeight: "0",
      });
      summary.rows.forEach(function (row) {
        const li = document.createElement("li");
        Object.assign(li.style, { display: "flex", gap: px(10), alignItems: "baseline" });
        const mark2 = document.createElement("span");
        mark2.textContent = !row.answered ? "–" : row.correct ? "✓" : "✗";
        mark2.setAttribute("aria-label", !row.answered ? "not answered" : row.correct ? "correct" : "incorrect");
        Object.assign(mark2.style, { width: px(22), flex: "0 0 auto", fontWeight: "700", color: !row.answered ? "#94A3B8" : row.correct ? el.passColor : el.failColor });
        const label = document.createElement("span");
        label.textContent = row.label;
        Object.assign(label.style, { flex: "1", minWidth: "0" });
        const pts = document.createElement("span");
        pts.textContent = Math.round(row.earned * 10) / 10 + "/" + row.points;
        Object.assign(pts.style, { opacity: "0.7", flex: "0 0 auto" });
        li.appendChild(mark2); li.appendChild(label); li.appendChild(pts);
        list.appendChild(li);
      });
      node.appendChild(list);
    }
  }

  function renderElement(el, scale) {
    if (!shouldIncludeElementInDom(el)) return null;
    const opacity = elementOpacity(el);
    const motion = timelineMotion(el, state.playhead);
    const clickable = isElementClickable(el);
    // Drag-and-drop items are drawn where the learner placed them.
    const placedAt = oddPositionOf(byId(state.currentSlideId), el);
    const common = {
      className: "el" + (clickable ? " clickable" : ""),
      style: {
        left: (placedAt ? placedAt.x : el.x) * scale + "px",
        top: (placedAt ? placedAt.y : el.y) * scale + "px",
        width: el.width * scale + "px",
        height: el.height * scale + "px",
      },
    };

    const node = document.createElement("div");
    node.className = common.className;
    node.dataset.elId = el.id;
    Object.assign(node.style, common.style);
    node.style.pointerEvents = elementPointerEvents(el, opacity);
    if (clickable) {
      node.addEventListener("click", () => onClickElement(el));
      // Keyboard access: focusable, announced as a button, Enter/Space activate.
      node.setAttribute("role", "button");
      node.tabIndex = 0;
      node.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onClickElement(el);
        }
      });
      if (isChoiceOptionElement(el)) {
        node.setAttribute("aria-pressed", isChoiceSelected(el) ? "true" : "false");
      }
    }

    if (el.type === "text") {
      Object.assign(node.style, {
        color: resolveElementAppearance(el).color,
        background: resolveElementAppearance(el).backgroundColor || "",
        fontFamily: el.style.fontFamily,
        fontSize: el.style.fontSize * scale + "px",
        fontWeight: String(el.style.fontWeight),
        textAlign: el.style.align,
        whiteSpace: "pre-wrap",
      });
      node.textContent = fillText(el.text);
    } else if (el.type === "caption") {
      applyCaptionStyle(node, el, scale);
      const cue = getActiveCaptionCue(el, state.playhead);
      node.textContent = cue ? fillText(cue.text) : "";
    } else if (el.type === "shape") {
      applyElementAppearanceStyle(node, el, scale);
      node.style.overflow = "hidden";
      if (el.shape === "ellipse") {
        node.style.borderRadius = "50%";
        node.style.clipPath = "ellipse(50% 50% at 50% 50%)";
      } else if (el.cornerRadius) {
        node.style.borderRadius = el.cornerRadius * scale + "px";
      }
      if (el.shape === "triangle") node.style.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
      if (el.shape === "diamond") node.style.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    } else if (el.type === "button") {
      Object.assign(node.style, {
        borderRadius: el.style.borderRadius * scale + "px",
        fontSize: el.style.fontSize * scale + "px",
        fontWeight: "600",
        display: "grid",
        placeItems: "center",
      });
      applyElementAppearanceStyle(node, el, scale);
      node.textContent = fillText(el.label);
    } else if (el.type === "image") {
      const imageStyle = normalizeImageStyle(el.style);
      Object.assign(node.style, imageContainerStyles(imageStyle, scale));
      const url = assetUrl(el.assetId);
      if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = el.decorative ? "" : (el.altText || el.name);
        img.draggable = false;
        applyImageCrop(img, el.crop, el.fit);
        Object.assign(img.style, imageContentStyles(imageStyle));
        node.appendChild(img);
      }
    } else if (el.type === "video") {
      node.style.overflow = "hidden";
      const videoKey = normalizeVideoKey(el);
      if (videoKey) {
        node.style.background = "transparent";
      }
      node.dataset.mediaId = el.id;
      const url = assetUrl(el.assetId);
      if (url) {
        let video = salvagedMedia.get(el.id);
        if (!video || video.tagName !== "VIDEO") {
          video = takePreloadedVideo(url);
        }
        if (!video || video.tagName !== "VIDEO") {
          video = document.createElement("video");
          video.src = url;
          video.playsInline = true;
          video.preload = "auto";
        }
        video.dataset.nariMediaId = el.id;
        video.dataset.nariTlStart = String(el.timeline.startTime);
        video.dataset.nariTlDuration = String(el.timeline.duration);
        applyVideoSourceMute(video, el);
        attachTimelineMediaGuard(video, el);
        Object.assign(video.style, {
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: "0",
          pointerEvents: "none",
        });
        const active = isActive(el.timeline, state.playhead);
        const shouldPlay = active && timelineAllowsMedia(el);
        syncMediaClock(video, el, shouldPlay);
        applyVideoChrome(video, el, !videoKey);
        node.appendChild(video);
        keptMedia.set(el.id, video);

        if (videoKey) {
          node.dataset.keyedVideo = "1";
          let canvas = salvagedMedia.get(el.id + ":canvas");
          if (!canvas || canvas.tagName !== "CANVAS") {
            canvas = document.createElement("canvas");
            canvas.dataset.nariMediaCanvas = el.id;
          }
          Object.assign(canvas.style, {
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents:
              el.controls && timelineAllowsMedia(el) ? "auto" : "none",
          });
          node.appendChild(canvas);
          keptMedia.set(el.id + ":canvas", canvas);
          drawKeyedVideoFrame(video, canvas, el);
        } else {
          Object.assign(video.style, {
            position: "",
            width: "100%",
            height: "100%",
            opacity: "1",
            objectFit: el.fit,
          });
          applyVideoChrome(video, el, true);
        }
      }
    } else if (el.type === "audio") {
      Object.assign(node.style, {
        width: "0",
        height: "0",
        overflow: "hidden",
        opacity: "0",
        pointerEvents: "none",
      });
      node.textContent = "";
      node.dataset.mediaId = el.id;
      const url = assetUrl(el.assetId);
      if (url) {
        let audio = salvagedMedia.get(el.id);
        if (!audio || audio.tagName !== "AUDIO") {
          audio = document.createElement("audio");
          audio.src = url;
          audio.preload = "auto";
        }
        audio.dataset.nariMediaId = el.id;
        audio.dataset.nariTlStart = String(el.timeline.startTime);
        audio.dataset.nariTlDuration = String(el.timeline.duration);
        attachTimelineMediaGuard(audio, el);
        const active = isActive(el.timeline, state.playhead);
        const shouldPlay = active && timelineAllowsMedia(el);
        syncMediaClock(audio, el, shouldPlay);
        node.appendChild(audio);
        keptMedia.set(el.id, audio);
      }
    } else if (el.type === "results") {
      renderResults(node, el, scale);
    } else if (el.type === "question" && el.kind === "dragDrop") {
      renderDragDropQuestion(node, el, scale);
    } else if (el.type === "question") {
      const answer = state.quizAnswers[el.id];
      const open = canAttempt(el, answer);
      const selected = new Set((answer && answer.selectedIds) || []);
      Object.assign(node.style, {
        background: "#0F172A",
        border: "1px solid #334155",
        borderRadius: 10 * scale + "px",
        color: "#E2E8F0",
        padding: 12 * scale + "px",
        fontSize: 13 * scale + "px",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8 * scale + "px",
        cursor: "default",
      });
      const prompt = document.createElement("div");
      prompt.style.fontWeight = "600";
      prompt.style.lineHeight = "1.3";
      prompt.textContent = el.prompt;
      node.appendChild(prompt);
      const list = document.createElement("div");
      list.style.display = "flex";
      list.style.flexDirection = "column";
      list.style.gap = 4 * scale + "px";
      for (const choice of orderChoices(el)) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = choice.label;
        btn.disabled = !open;
        Object.assign(btn.style, {
          textAlign: "left",
          background: selected.has(choice.id) ? "#0F766E" : "#1E293B",
          color: "#E2E8F0",
          border: "none",
          borderRadius: 6 * scale + "px",
          padding: 6 * scale + "px " + 8 * scale + "px",
          fontSize: 12 * scale + "px",
          cursor: open ? "pointer" : "default",
        });
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (!canAttempt(el, state.quizAnswers[el.id])) return;
          state.quizAnswers[el.id] = {
            selectedIds: [choice.id],
            attempts: (state.quizAnswers[el.id] && state.quizAnswers[el.id].attempts) || 0,
            graded: false,
            correct: false,
            feedback: (state.quizAnswers[el.id] && state.quizAnswers[el.id].feedback) || "",
          };
          setQuizMessage("");
          render();
        });
        if (state.reviewMode) {
          const chosen = selected.has(choice.id);
          if (choice.correct) {
            btn.style.background = "#166534";
            btn.textContent = "✓ " + choice.label + (chosen ? " (your answer)" : "");
          } else if (chosen) {
            btn.style.background = "#7F1D1D";
            btn.textContent = "✗ " + choice.label + " (your answer)";
          }
          btn.style.opacity = "1";
        }
        list.appendChild(btn);
      }
      node.appendChild(list);
      if (state.reviewMode && !(answer && answer.graded) && selected.size === 0) {
        const note = document.createElement("div");
        note.style.fontSize = 11 * scale + "px";
        note.style.color = "#94A3B8";
        note.textContent = "Not answered";
        node.appendChild(note);
      }
      if (open) {
        const submit = document.createElement("button");
        submit.type = "button";
        submit.textContent = "Submit";
        submit.disabled = selected.size === 0;
        Object.assign(submit.style, {
          alignSelf: "flex-start",
          background: "#14B8A6",
          color: "#042F2E",
          border: "none",
          borderRadius: 6 * scale + "px",
          padding: 6 * scale + "px " + 12 * scale + "px",
          fontSize: 12 * scale + "px",
          fontWeight: "600",
          cursor: selected.size === 0 ? "default" : "pointer",
          opacity: selected.size === 0 ? 0.5 : 1,
        });
        submit.addEventListener("click", (ev) => {
          ev.stopPropagation();
          submitQuestion(el);
        });
        node.appendChild(submit);
      }
      if (answer && answer.feedback) {
        const fb = document.createElement("div");
        fb.style.fontSize = 11 * scale + "px";
        fb.style.color = answer.correct ? "#5EEAD4" : "#FCA5A5";
        fb.textContent =
          answer.feedback +
          (answer.attempts
            ? " · attempt " +
              answer.attempts +
              (el.maxAttempts > 0 ? "/" + el.maxAttempts : "")
            : "");
        node.appendChild(fb);
      }
    } else {
      return null;
    }
    if (el.type === "image" && el.decorative) {
      node.setAttribute("aria-hidden", "true");
    } else if (clickable && !node.textContent.trim()) {
      node.setAttribute("aria-label", el.altText || el.name || "Button");
    } else if (el.type === "shape" && !clickable) {
      node.setAttribute("aria-hidden", "true");
    }
    applyElementFrame(node, el, scale, opacity, motion);
    oddDecorate(node, el, scale);
    return node;
  }

  function videoPlay(media) {
    media.play().catch(() => {});
  }

  var mediaPlayGen = {};

  function bumpMediaPlayGen(id) {
    mediaPlayGen[id] = (mediaPlayGen[id] || 0) + 1;
    return mediaPlayGen[id];
  }

  function primeMediaElement(media) {
    const id = media.dataset.nariMediaId || media.src || "";
    const gen = mediaPlayGen[id] || 0;
    const authorMute = media.dataset.nariAuthorMuted === "1";
    media.muted = true;
    const finish = function () {
      if ((mediaPlayGen[id] || 0) !== gen) return;
      if (!media.paused) media.pause();
      if (!authorMute) {
        media.muted = false;
        media.volume = 1;
      }
    };
    const play = media.play();
    if (play && typeof play.then === "function") {
      play.then(finish, finish);
    } else {
      finish();
    }
  }

  function resumeMediaElement(media, mediaTime) {
    const id = media.dataset.nariMediaId || media.src || "";
    if (mediaSeeking.has(id)) return;
    const gen = bumpMediaPlayGen(id);
    if (media.dataset.nariAuthorMuted === "1") {
      media.muted = true;
      media.volume = 0;
    } else {
      media.muted = false;
    }
    const needsSeek =
      mediaTime != null &&
      isFinite(mediaTime) &&
      Math.abs(media.currentTime - mediaTime) > 0.05;
    const start = function () {
      if ((mediaPlayGen[id] || 0) !== gen) return;
      if (media.readyState < 3) {
        const onReady = function () {
          media.removeEventListener("canplay", onReady);
          if ((mediaPlayGen[id] || 0) !== gen) return;
          videoPlay(media);
        };
        media.addEventListener("canplay", onReady);
        window.setTimeout(function () {
          media.removeEventListener("canplay", onReady);
          if ((mediaPlayGen[id] || 0) !== gen) return;
          videoPlay(media);
        }, 1500);
        return;
      }
      videoPlay(media);
    };
    if (!needsSeek) {
      start();
      return;
    }
    mediaSeeking.add(id);
    const finishSeek = function () {
      media.removeEventListener("seeked", finishSeek);
      mediaSeeking.delete(id);
      start();
    };
    media.addEventListener("seeked", finishSeek);
    try {
      media.currentTime = mediaTime;
    } catch (e) {
      mediaSeeking.delete(id);
      start();
      return;
    }
    window.setTimeout(function () {
      if (!mediaSeeking.has(id)) return;
      finishSeek();
    }, 800);
  }

  function loopedMediaTime(media, elapsed, loop) {
    var t = Math.max(0, elapsed);
    if (!loop) return t;
    var duration = media.duration;
    if (!isFinite(duration) || duration <= 0) return t;
    return t % duration;
  }

  function syncMediaClock(media, el, shouldPlay) {
    const loop = !!el.loop;
    const elapsed = Math.max(0, state.playhead - el.timeline.startTime);
    media.loop = loop && shouldPlay;
    syncMediaElement(
      media,
      shouldPlay,
      loopedMediaTime(media, elapsed, loop),
    );
  }

  function syncMediaElement(media, shouldPlay, mediaTime) {
    const id = media.dataset.nariMediaId || "";
    const wasPlaying = mediaWasPlaying.get(id) === true;
    if (!shouldPlay) {
      media.loop = false;
      bumpMediaPlayGen(id);
      mediaSeeking.delete(id);
      if (!media.paused) media.pause();
      if (Math.abs(media.currentTime - mediaTime) > 0.08) {
        try {
          media.currentTime = mediaTime;
        } catch (e) {}
      }
      mediaWasPlaying.set(id, false);
      return;
    }
    if (mediaSeeking.has(id)) {
      mediaWasPlaying.set(id, true);
      return;
    }
    if (!wasPlaying) {
      resumeMediaElement(media, mediaTime);
      mediaWasPlaying.set(id, true);
      return;
    }
    if (Math.abs(media.currentTime - mediaTime) > 1.25) {
      resumeMediaElement(media, mediaTime);
      mediaWasPlaying.set(id, true);
      return;
    }
    if (media.paused) resumeMediaElement(media, mediaTime);
    mediaWasPlaying.set(id, true);
  }

  function updateChrome() {
    const slide = byId(state.currentSlideId);
    const idx = state.playlist.indexOf(state.currentSlideId);
    meta.textContent = slide
      ? slide.name +
        " · " +
        state.playhead.toFixed(1) +
        "s / " +
        slide.duration.toFixed(1) +
        "s · " +
        (idx + 1) +
        "/" +
        state.playlist.length
      : "No slide";
    btnPlay.textContent = state.isPlaying ? "Pause" : "Play";
    if (btnPlaybarPlay) {
      btnPlaybarPlay.textContent = state.isPlaying ? "Pause" : "Play";
    }
    btnPrev.disabled = idx <= 0;
    btnNext.disabled = !canGoNext();
    btnNext.title = canGoNext() ? "" : SLIDE_NOT_COMPLETE_MESSAGE;
    if (showPlaybar || allowFullscreen || hasCaptions) {
      if (playbar) playbar.classList.add("show");
      const duration = slide ? Math.max(0.1, slide.duration) : 0.1;
      const playhead = Math.max(0, Math.min(duration, state.playhead));
      if (showPlaybar) {
        if (playTimeEl) playTimeEl.textContent = formatPlayTime(playhead);
        if (playDurationEl) playDurationEl.textContent = formatPlayTime(duration);
        if (scrubEl && document.activeElement !== scrubEl) {
          scrubEl.max = String(duration);
          scrubEl.value = String(playhead);
        }
      }
    } else if (playbar) {
      playbar.classList.remove("show");
    }
  }

  /** Lightweight tick: sync media + chrome without rebuilding the stage DOM. */
  function tickPlayback() {
    updateChrome();
    const slide = byId(state.currentSlideId);
    if (!slide) return;
    const scale = stageFitScale(slide);
    stage.querySelectorAll("[data-media-id]").forEach((wrap) => {
      const id = wrap.getAttribute("data-media-id");
      const media = wrap.querySelector("video,audio");
      if (!id || !media) return;
      const el = slide.elements.find((e) => e.id === id);
      if (!el) return;
      const active = isActive(el.timeline, state.playhead);
      const shouldPlay = active && timelineAllowsMedia(el);
      syncMediaClock(media, el, shouldPlay);
      if (el.type === "video") {
        applyVideoChrome(media, el, !wrap.hasAttribute("data-keyed-video"));
        const canvas = wrap.querySelector("canvas");
        if (canvas) {
          canvas.style.pointerEvents =
            el.controls && timelineAllowsMedia(el) ? "auto" : "none";
        }
      }
    });
    stage.querySelectorAll("[data-keyed-video]").forEach((wrap) => {
      const id = wrap.getAttribute("data-media-id");
      const video = wrap.querySelector("video");
      const canvas = wrap.querySelector("canvas");
      const el = slide.elements.find((e) => e.id === id);
      if (!id || !video || !canvas || !el) return;
      if (video.readyState < 2) return;
      drawKeyedVideoFrame(video, canvas, el);
    });
    preloadUpcomingVideos();
    // Mount/update elements as timeline windows open and close.
    const els = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of els) {
      if (!shouldIncludeElementInDom(el)) continue;
      const opacity = elementOpacity(el);
      let node = stage.querySelector('[data-el-id="' + el.id + '"]');
      if (!node) {
        if (opacity <= 0.001 && el.type !== "video" && el.type !== "audio") continue;
        node = renderElement(el, scale);
        if (node) stage.appendChild(node);
        continue;
      }
      applyElementFrame(node, el, scale, opacity, timelineMotion(el, state.playhead));
    }
  }

  /** Re-render without losing the keyboard learner's place. */
  function captureFocus() {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const host = a.closest ? a.closest("[data-el-id]") : null;
    if (host && stage.contains(host)) {
      const buttons = [...host.querySelectorAll("button")];
      return { kind: "stage", elId: host.dataset.elId, self: a === host, index: buttons.indexOf(a), text: a.textContent };
    }
    if (slidesNav.contains(a)) return { kind: "nav", text: a.textContent };
    return null;
  }
  function restoreFocus(key) {
    if (!key) return;
    let target = null;
    if (key.kind === "stage") {
      const host = stage.querySelector('[data-el-id="' + key.elId + '"]');
      if (host) {
        if (key.self) target = host;
        else {
          const candidates = [...host.querySelectorAll("button,[tabindex]")];
          target = candidates.find((c) => c.textContent === key.text && !c.disabled) || candidates[Math.max(0, key.index)] || host;
        }
      }
    } else if (key.kind === "nav") {
      target = [...slidesNav.querySelectorAll("button")].find((b) => b.textContent === key.text && !b.disabled) || null;
    }
    if (target && typeof target.focus === "function" && !target.disabled) {
      try { target.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  /** Say new quiz feedback to screen readers (answers change, then this runs). */
  const announcedFeedback = {};
  function announceFeedback() {
    if (!srStatus) return;
    const slide = byId(state.currentSlideId);
    if (!slide) return;
    const ids = {};
    (slide.elements || []).forEach(function (e) { if (e.type === "question") ids[e.id] = true; });
    oddGroups(slide).forEach(function (g) { ids[g.id] = true; });
    Object.keys(ids).forEach(function (id) {
      const a = state.quizAnswers[id];
      if (!a || !a.feedback) return;
      const sig = (a.attempts || 0) + "|" + a.feedback;
      if (announcedFeedback[id] === sig) return;
      announcedFeedback[id] = sig;
      srStatus.textContent = (a.correct ? "Correct. " : "Incorrect. ") + a.feedback;
    });
  }

  function render() {
    const focusKey = captureFocus();
    renderStage();
    restoreFocus(focusKey);
    announceFeedback();
  }

  function renderStage() {
    keptMedia.clear();
    salvagedMedia.clear();
    stage.querySelectorAll("[data-media-id]").forEach((wrap) => {
      const id = wrap.getAttribute("data-media-id");
      const media = wrap.querySelector("video,audio");
      if (id && media) salvagedMedia.set(id, media);
      const canvas = wrap.querySelector("canvas");
      if (id && canvas) salvagedMedia.set(id + ":canvas", canvas);
    });

    const slide = byId(state.currentSlideId);
    const idx = state.playlist.indexOf(state.currentSlideId);
    meta.textContent = slide
      ? slide.name + " · " + state.playhead.toFixed(1) + "s / " + slide.duration.toFixed(1) + "s · " + (idx + 1) + "/" + state.playlist.length
      : "No slide";
    btnPlay.textContent = state.isPlaying ? "Pause" : "Play";
    btnPrev.disabled = idx <= 0;
    btnNext.disabled = !canGoNext();
    btnNext.title = canGoNext() ? "" : SLIDE_NOT_COMPLETE_MESSAGE;

    slidesNav.innerHTML = "";
    state.playlist.forEach((id, i) => {
      const s = byId(id);
      if (!s) return;
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = i + 1 + ". " + s.name;
      if (id === state.currentSlideId) {
        b.className = "active";
        b.setAttribute("aria-current", "step");
      }
      if (i > idx && !canGoNext()) {
        b.disabled = true;
        b.title = SLIDE_NOT_COMPLETE_MESSAGE;
      } else {
        b.addEventListener("click", () => goTo(id));
      }
      slidesNav.appendChild(b);
    });

    // No debug footer for learners (B12).
    footer.textContent = "";

    const slideChanged = lastRenderedSlideId !== state.currentSlideId;
    lastRenderedSlideId = state.currentSlideId;
    if (reviewBar) reviewBar.hidden = !state.reviewMode;
    if (slide) {
      stage.setAttribute("aria-label", slide.name);
      if (slideChanged && srStatus) {
        srStatus.textContent = "Slide " + (idx + 1) + " of " + state.playlist.length + ": " + slide.name;
      }
    }
    stage.innerHTML = "";
    if (!slide) return;

    const scale = stageFitScale(slide);
    stage.style.width = slide.width * scale + "px";
    stage.style.height = slide.height * scale + "px";
    stage.style.background =
      slide.background?.type === "color" ? slide.background.color : "#111827";
    stage.style.position = "relative";
    stage.style.overflow = "hidden";

    if (slide.background?.type === "image" && slide.background.assetId) {
      const bgSrc = assetUrl(slide.background.assetId);
      if (bgSrc) {
        const bg = document.createElement("img");
        bg.src = bgSrc;
        bg.alt = "";
        bg.draggable = false;
        const fit = slide.background.fit || "cover";
        Object.assign(bg.style, {
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
          objectFit: fit === "fill" ? "fill" : fit,
          pointerEvents: "none",
        });
        stage.appendChild(bg);
      }
    }

    const els = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of els) {
      const node = renderElement(el, scale);
      if (node) stage.appendChild(node);
    }
    oddRenderHome(slide, scale);
    preloadUpcomingVideos();
    warmNeighbourImages();
    // Fade the new slide in from its own background colour (no dimming dip).
    // A slide change can render more than once; every render inside the fade
    // re-adds the veil, resumed at the right point, so it is never cut short.
    if (slideChanged) veilStartedAt = performance.now();
    const veilElapsed = performance.now() - veilStartedAt;
    if (veilElapsed < VEIL_MS) {
      const veil = document.createElement("div");
      veil.className = "nari-veil";
      veil.setAttribute("aria-hidden", "true");
      veil.style.background = stage.style.background || "#111827";
      veil.style.animationDelay = "-" + Math.round(veilElapsed) + "ms";
      const removeVeil = function () {
        if (veil.parentNode) veil.parentNode.removeChild(veil);
      };
      veil.addEventListener("animationend", removeVeil);
      // Safety net: never leave a veil over the slide if animations are throttled.
      window.setTimeout(removeVeil, VEIL_MS - veilElapsed + 120);
      stage.appendChild(veil);
    }

    if (state.finished) {
      done.hidden = false;
      done.innerHTML =
        '<div><div>Course complete</div><button type="button" id="btn-again" class="primary" style="margin-top:.5rem">Play again</button></div>';
      document.getElementById("btn-again")?.addEventListener("click", () => {
        state.variables = Object.fromEntries(
          (documentModel.variables || []).map((v) => [v.id, v.defaultValue])
        );
        state.quizAnswers = {};
        resetSlide(state.playlist[0], true);
        finishPlayerRender(true);
      });
    } else {
      done.hidden = true;
      done.innerHTML = "";
    }
  }

  let raf = 0;
  let last = 0;
  function loop(now) {
    if (!state.isPlaying) return;
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    const slide = byId(state.currentSlideId);
    if (!slide) {
      state.isPlaying = false;
      render();
      return;
    }
    const from = state.playhead;
    const stopCap =
      state.timelineStopAt != null ? state.timelineStopAt : slide.duration;
    if (from >= stopCap - 0.0001) {
      state.isPlaying = false;
      state.playhead = stopCap;
      tickPlayback();
      return;
    }
    const target = Math.min(slide.duration, stopCap, from + dt);
    deferPlayerRender = true;
    const bookmarkResult = processBookmarks(from, target);
    deferPlayerRender = false;
    if (bookmarkResult === "finished" || state.finished) {
      tickPlayback();
      render();
      return;
    }
    if (bookmarkResult === true) {
      finishPlayerRender(state.isPlaying);
      return;
    }
    if (bookmarkResult === "stopped") {
      state.playhead = state.timelineStopAt != null ? state.timelineStopAt : target;
      state.isPlaying = false;
      tickPlayback();
      return;
    }
    state.playhead = target;
    if (target >= slide.duration) {
      state.isPlaying = false;
      tickPlayback();
      return;
    }
    if (target >= stopCap - 0.0001) {
      state.isPlaying = false;
      state.playhead = stopCap;
      tickPlayback();
      return;
    }
    tickPlayback();
    raf = requestAnimationFrame(loop);
  }

  function startLoop() {
    cancelAnimationFrame(raf);
    if (!state.isPlaying) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function pauseForBackground() {
    if (!state.isPlaying) return;
    state.isPlaying = false;
    cancelAnimationFrame(raf);
    document.querySelectorAll("video,audio").forEach(function (media) {
      const id = media.dataset.nariMediaId || media.src || "";
      if (id) bumpMediaPlayGen(id);
      mediaSeeking.delete(id);
      if (!media.paused) media.pause();
    });
    mediaWasPlaying.clear();
    tickPlayback();
  }

  btnPlay.addEventListener("click", () => {
    if (state.isPlaying) {
      state.isPlaying = false;
      tickPlayback();
      return;
    }
    mediaWasPlaying.clear();
    maybeStartFullscreen();
    if (state.finished) {
      state.variables = Object.fromEntries(
        (documentModel.variables || []).map((v) => [v.id, v.defaultValue])
      );
      state.quizAnswers = {};
      state.objectChoiceGroups = {};
      state.visitedSlideIds = [];
      state.finished = false;
      resetSlide(state.playlist[0], true);
    } else {
      const slide = byId(state.currentSlideId);
      if (slide && state.playhead >= slide.duration) {
        state.playhead = slideTimelineStartTime(slide);
      }
      if (slide) {
        state.playhead = clampPlayheadToSlideStart(slide, state.playhead);
      }
      state.isPlaying = true;
      state.finished = false;
    }
    finishPlayerRender(true);
    const playSlide = byId(state.currentSlideId);
    document.querySelectorAll("video,audio").forEach(function (media) {
      if (media.closest && media.closest("#nari-preload")) return;
      const el =
        playSlide &&
        playSlide.elements.find(function (item) {
          return item.id === media.dataset.nariMediaId;
        });
      if (el && !isActive(el.timeline, state.playhead)) {
        primeMediaElement(media);
      }
    });
  });
  if (btnPlaybarPlay) {
    btnPlaybarPlay.addEventListener("click", function () {
      btnPlay.click();
    });
  }
  if (scrubEl) {
    scrubEl.addEventListener("input", function () {
      const slide = byId(state.currentSlideId);
      if (!slide) return;
      const duration = Math.max(0.1, slide.duration);
      const next = Math.max(0, Math.min(duration, Number(scrubEl.value) || 0));
      state.playhead = next;
      if (state.timelineStopAt != null && next < state.timelineStopAt - 0.001) {
        state.timelineStopAt = null;
      }
      state.firedBookmarkIds = (state.firedBookmarkIds || []).filter(function (id) {
        const bookmark = (slide.bookmarks || []).find(function (item) {
          return item.id === id;
        });
        return bookmark && bookmark.time <= next + 0.0001;
      });
      tickPlayback();
    });
  }
  btnPrev.addEventListener("click", () => prevSlide());
  btnNext.addEventListener("click", () => nextSlide(false));
  document.getElementById("btn-restart").addEventListener("click", () => {
    resetSlide(state.currentSlideId, false);
    render();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      e.preventDefault();
      btnPlay.click();
    } else if (e.key === "ArrowRight") {
      if (canGoNext()) nextSlide(false);
    } else if (e.key === "ArrowLeft") prevSlide();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pauseForBackground();
  });
  window.addEventListener("blur", function () {
    if (document.hidden || !document.hasFocus()) pauseForBackground();
  });
  window.addEventListener("pagehide", pauseForBackground);

  // Some LMSs unload the SCO without firing beforeunload, so end the session
  // from pagehide/unload too (NariScorm.finish only runs once).
  const endScormSession = () => {
    try {
      if (window.NariScorm) {
        scormProgress(false);
        saveSuspend();
        window.NariScorm.commit();
        window.NariScorm.finish(!scormComplete);
      }
    } catch (e) {}
  };
  window.addEventListener("beforeunload", endScormSession);
  window.addEventListener("pagehide", endScormSession);
  window.addEventListener("unload", endScormSession);

  try {
    if (window.NariScorm) window.NariScorm.initialize();
  } catch (e) {}
  restoreSuspended();
  syncScormLocation();
  scormProgress(false);
  render();
})();