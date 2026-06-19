const API_BASE_URL = "http://localhost:3000/api";
let stageId = null;
let stage = null;

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) { window.location.href = "../../inloggen/inloggen.html"; return; }

  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const name = user.name || "Docent";
  document.getElementById("userName").textContent = name;
  document.getElementById("userAvatar").textContent =
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const params = new URLSearchParams(window.location.search);
  stageId = params.get("id");
  if (!stageId) { window.location.href = "../mijn-studenten/mijn-studenten.html"; return; }

  setupTabs();
  await laadStage();
});

function authHeader() {
  return { "Authorization": "Bearer " + sessionStorage.getItem("token") };
}

async function laadStage() {
  try {
    const res = await fetch(API_BASE_URL + "/stages/" + stageId, { headers: authHeader() });
    if (!res.ok) return;
    stage = await res.json();

    const naam = ((stage.student_voornaam || "") + " " + (stage.student_achternaam || "")).trim();
    const initialen = naam.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    document.getElementById("bcrNaam").textContent = naam;
    document.getElementById("profileNaam").textContent = naam;
    document.getElementById("profileAvatar").textContent = initialen;
    document.getElementById("profileEmail").textContent = stage.student_email || "—";
    document.getElementById("profileOpleiding").textContent =
      (stage.opleiding_naam || "—") + " · " + (stage.academiejaar_naam || "—");

    // Stage card
    document.getElementById("stageBedrijf").textContent = stage.bedrijf_naam || "—";
    document.getElementById("stageTitel").textContent = stage.titel || stage.omschrijving || "";
    document.getElementById("stageOpdracht").textContent = stage.omschrijving || "—";
    document.getElementById("stageMentor").textContent = stage.contact_naam || "—";
    document.getElementById("stageMentorEmail").textContent = stage.contact_email || "";
    document.getElementById("stageStatus").textContent = statusText(stage.status);

    const bedrijfEl = document.getElementById("profileBedrijf");
    if (bedrijfEl) bedrijfEl.textContent = stage.bedrijf_naam ? "Stage bij " + stage.bedrijf_naam : "";

    const v = berekenVoortgang(stage.startdatum, stage.einddatum);
    const weekEl = document.getElementById("profileWeek");
    if (weekEl) weekEl.textContent = "Week " + v.huidig + " / " + v.totaal;
    document.getElementById("weekNum").textContent = "Week " + v.huidig + " / " + v.totaal;
    document.getElementById("weekPct").textContent = v.pct.toFixed(0) + "% voltooid";
    document.getElementById("stageMetaRow").textContent =
      formatLong(stage.startdatum) + " — " + formatLong(stage.einddatum) + " · " + v.totaal + " weken";
  } catch (err) {
    console.error("Stage detail fout:", err);
  }
}

let alleLogboeken = [];
let logboekenFilter = "alle";
let logboekenShowAll = false;

async function laadLogboeken() {
  try {
    const res = await fetch(API_BASE_URL + "/logboeken/stage/" + stageId, { headers: authHeader() });
    if (!res.ok) return;
    alleLogboeken = await res.json();

    const list = document.getElementById("logboekenList");
    const empty = document.getElementById("logboekenEmpty");
    const stats = document.getElementById("logboekenStats");
    const filters = document.getElementById("logboekenFilters");
    const toonAlle = document.getElementById("lbToonAlle");

    if (alleLogboeken.length === 0) {
      empty.style.display = "block";
      stats.style.display = "none";
      filters.style.display = "none";
      toonAlle.style.display = "none";
      list.innerHTML = "";
      return;
    }
    empty.style.display = "none";
    stats.style.display = "";
    filters.style.display = "";

    // Calculate stats
    const totaalWeken = stage ? (stage.totaal_weken || berekenVoortgang(stage.startdatum, stage.einddatum).totaal) : 0;
    const ingediend = alleLogboeken.length;
    const bekeken = alleLogboeken.filter(l => l.status === "goedgekeurd").length;
    const wacht = alleLogboeken.filter(l => l.status === "ingediend" || l.status === "wacht_op_mentor").length;
    const totaalUren = alleLogboeken.reduce((s, l) => s + (parseFloat(l.totaal_dag_uren) || 0), 0);

    document.getElementById("lbStatIngediend").textContent = ingediend + " / " + totaalWeken;
    document.getElementById("lbStatBekeken").textContent = bekeken;
    document.getElementById("lbStatWacht").textContent = wacht;
    document.getElementById("lbStatUren").textContent = Math.round(totaalUren) + "u";

    // Filter counts
    const nietBekeken = alleLogboeken.filter(l => l.status !== "goedgekeurd").length;
    document.getElementById("filterAlleCount").textContent = ingediend;
    document.getElementById("filterBekekenCount").textContent = bekeken;
    document.getElementById("filterNietBekekenCount").textContent = nietBekeken;

    // Setup filter buttons
    document.querySelectorAll(".lb-filter").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(".lb-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        logboekenFilter = btn.getAttribute("data-filter");
        logboekenShowAll = false;
        renderLogboeken();
      };
    });

    renderLogboeken();
  } catch (err) {
    console.error("Logboeken fout:", err);
  }
}

function renderLogboeken() {
  let filtered = alleLogboeken;
  if (logboekenFilter === "bekeken") {
    filtered = alleLogboeken.filter(l => l.status === "goedgekeurd");
  } else if (logboekenFilter === "niet-bekeken") {
    filtered = alleLogboeken.filter(l => l.status !== "goedgekeurd");
  }
  filtered.sort((a, b) => b.week_nummer - a.week_nummer);

  const list = document.getElementById("logboekenList");
  const toonAlle = document.getElementById("lbToonAlle");
  const MAX_VISIBLE = 5;
  const visible = logboekenShowAll ? filtered : filtered.slice(0, MAX_VISIBLE);

  list.innerHTML = "";
  visible.forEach(l => {
    const badge = badgeFor(l.status);
    const isWacht = l.status === "ingediend" || l.status === "wacht_op_mentor";
    const card = document.createElement("a");
    card.className = "logboek-card" + (isWacht ? " logboek-card--wacht" : "");
    card.href = "../logboek-inkijken/logboek-inkijken.html?id=" + l.id;

    const uren = l.totaal_dag_uren ? Math.round(parseFloat(l.totaal_dag_uren)) + "u" : "—";
    const dagen = l.aantal_dagen ? l.aantal_dagen + " dagen" : "";
    const beschrijving = l.uitgevoerde_taken || l.titel || "—";

    card.innerHTML =
      '<div class="week-badge">' +
        '<span class="week-badge-num">' + l.week_nummer + '</span>' +
        '<span class="week-badge-label">Week</span>' +
      '</div>' +
      '<div class="logboek-info">' +
        '<div class="logboek-titel">Week ' + l.week_nummer + ' · ' + formatLong(l.datum_van) + " – " + formatLong(l.datum_tot) + '</div>' +
        '<div class="logboek-beschrijving">' + beschrijving + '</div>' +
      '</div>' +
      '<div class="logboek-right">' +
        '<span class="logboek-uren">' + uren + '</span>' +
        (dagen ? '<span class="logboek-dagen">' + dagen + '</span>' : '') +
        '<span class="logboek-badge ' + badge.cls + '">' + badge.tekst + '</span>' +
      '</div>';
    list.appendChild(card);
  });

  if (filtered.length > MAX_VISIBLE && !logboekenShowAll) {
    toonAlle.style.display = "block";
    toonAlle.querySelector("a").onclick = (e) => {
      e.preventDefault();
      logboekenShowAll = true;
      renderLogboeken();
    };
  } else {
    toonAlle.style.display = "none";
  }
}

function badgeFor(status) {
  if (status === "goedgekeurd") return { cls: "bekeken", tekst: "✓ Bekeken" };
  if (status === "ingediend" || status === "wacht_op_mentor") return { cls: "wacht", tekst: "Nog te bekijken" };
  return { cls: "concept", tekst: "Concept" };
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      const id = "tab-" + tab.getAttribute("data-tab");
      document.getElementById(id).classList.add("active");
      if (tab.getAttribute("data-tab") === "logboeken") laadLogboeken();
      if (tab.getAttribute("data-tab") === "evaluaties") laadEvaluaties();
      if (tab.getAttribute("data-tab") === "documenten") laadDocumenten();
    });
  });
}

// ═══════════════════════════════════════════
// EVALUATIES
// ═══════════════════════════════════════════
let evalData = [];
let currentEvalType = "tussentijds";
let currentEval = null;
let evalCompetentiesData = [];
let activeCompId = null;

async function laadEvaluaties() {
  console.log("laadEvaluaties() called, stageId:", stageId);
  if (!stageId) { console.warn("Geen stageId!"); return; }
  evalCompetentiesData = [];
  try {
    const res = await fetch(API_BASE_URL + "/evaluaties/stage/" + stageId, { headers: authHeader() });
    console.log("Evaluaties response status:", res.status);
    if (!res.ok) { console.error("Evaluaties fetch mislukt:", res.status); return; }
    evalData = await res.json();
    console.log("evalData geladen:", evalData.length, "evaluaties");

    setupEvalSubtabs();
    await selectEvalType(currentEvalType);
  } catch (err) {
    console.error("Evaluaties fout:", err);
  }
}

function setupEvalSubtabs() {
  document.querySelectorAll(".eval-subtab").forEach(btn => {
    btn.onclick = async () => {
      document.querySelectorAll(".eval-subtab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentEvalType = btn.getAttribute("data-eval-type");
      await selectEvalType(currentEvalType);
    };
  });
}

async function selectEvalType(type) {
  console.log("selectEvalType:", type, "evalData:", evalData);
  currentEval = evalData.find(e => e.type === type) || null;
  console.log("currentEval:", currentEval ? "id=" + currentEval.id : "null");
  const empty = document.getElementById("evalEmpty");
  const scores = document.getElementById("evalScores");
  const main = document.getElementById("evalMain");
  const eindCard = document.getElementById("evalEindcijferCard");
  const fbCard = document.getElementById("evalFeedbackCard");
  const actions = document.getElementById("evalActions");
  const banner = document.getElementById("evalBanner");

  if (!currentEval) {
    console.log("Geen evaluatie gevonden voor type:", type);
    empty.style.display = "block";
    scores.style.display = "none";
    main.style.display = "none";
    eindCard.style.display = "none";
    fbCard.style.display = "none";
    actions.style.display = "none";
    banner.style.display = "none";
    return;
  }

  empty.style.display = "none";
  scores.style.display = "";
  main.style.display = "";
  eindCard.style.display = "";
  fbCard.style.display = "";
  actions.style.display = "";

  // Banner
  if (currentEval.status === "ingediend" || currentEval.status === "afgerond") {
    banner.style.display = "block";
    banner.className = "eval-banner success";
    banner.textContent = "Definitief — niet meer wijzigbaar na indienen";
  } else {
    banner.style.display = "none";
  }

  // Labels
  const isTussen = type === "tussentijds";
  document.getElementById("evalMentorLabel").textContent = isTussen ? "Mentor — tussentijds" : "Score mentor";
  document.getElementById("evalDocentLabel").textContent = isTussen ? "Jouw tussentijdse score" : "Jouw eindscore";
  document.getElementById("evalEindcijferTitle").textContent = isTussen ? "Officieel tussentijdse cijfer" : "Officieel eindcijfer";
  document.getElementById("btnEvalIndienen").textContent = isTussen ? "Tussentijdse indienen" : "Eindbeoordeling definitief indienen";
  document.getElementById("btnEvalIndienen").className = isTussen ? "btn btn-primary" : "btn btn-danger";

  // Load detail then render scores
  await laadEvalDetail();
  renderEvalScores();
}

function renderEvalScores() {
  if (!currentEval) return;
  const comps = evalCompetentiesData.length > 0 ? evalCompetentiesData : [];
  let mentorTotal = 0, docentTotal = 0, mentorCount = 0, docentCount = 0;

  comps.forEach(comp => {
    (comp.scores || []).forEach(sc => {
      if (sc.score_mentor) { mentorTotal += sc.score_mentor; mentorCount++; }
      if (sc.score_docent) { docentTotal += sc.score_docent; docentCount++; }
    });
  });

  const mentorAvg = mentorCount > 0 ? ((mentorTotal / mentorCount) * 4).toFixed(1) : "—";
  const docentAvg = docentCount > 0 ? ((docentTotal / docentCount) * 4).toFixed(1) : "—";

  document.getElementById("evalMentorScore").textContent = mentorAvg + "/20";
  document.getElementById("evalDocentScore").textContent = docentAvg + "/20";
  document.getElementById("evalDocentSub").textContent = docentCount > 0 ? docentCount + " ingevuld" : "berekend uit competenties";

  if (currentEval.officieel_eindcijfer) {
    document.getElementById("evalEindcijferInput").value = currentEval.officieel_eindcijfer;
  } else {
    document.getElementById("evalEindcijferInput").value = docentAvg !== "—" ? docentAvg : "";
  }

  if (currentEval.globale_feedback) {
    document.getElementById("evalFeedbackTextarea").value = currentEval.globale_feedback;
  } else {
    document.getElementById("evalFeedbackTextarea").value = "";
  }
}

async function laadEvalDetail() {
  if (!currentEval) { evalCompetentiesData = []; return; }
  try {
    console.log("laadEvalDetail voor evaluatie id:", currentEval.id);
    const res = await fetch(API_BASE_URL + "/evaluaties/" + currentEval.id, { headers: authHeader() });
    console.log("Eval detail response status:", res.status);
    if (!res.ok) { console.error("Eval detail fetch mislukt:", res.status); return; }
    const detail = await res.json();
    evalCompetentiesData = detail.competenties || [];
    console.log("evalCompetentiesData geladen:", evalCompetentiesData.length, "competenties");
    renderCompSidebar();
    if (evalCompetentiesData.length > 0) {
      selectComp(evalCompetentiesData[0].competentie_id);
    }
  } catch (err) {
    console.error("Eval detail fout:", err);
  }
}

function renderCompSidebar() {
  const list = document.getElementById("evalCompList");
  list.innerHTML = "";
  evalCompetentiesData.forEach((comp, i) => {
    const el = document.createElement("div");
    el.className = "eval-comp-item";
    el.textContent = (i + 1) + ". " + comp.competentie_naam;
    el.onclick = () => selectComp(comp.competentie_id);
    el.setAttribute("data-comp-id", comp.competentie_id);
    list.appendChild(el);
  });
}

function verzamelInputsNaarMemory() {
  if (!activeCompId || !currentEval) return;
  const detail = document.getElementById("evalDetail");
  if (!detail) return;
  const comp = evalCompetentiesData.find(c => c.competentie_id == activeCompId);
  if (!comp) return;
  detail.querySelectorAll(".eval-score-input").forEach(inp => {
    const subId = parseInt(inp.getAttribute("data-sub-id"));
    const sc = (comp.scores || []).find(s => s.subcompetentie_id === subId);
    if (sc) sc.score_docent = parseInt(inp.value) || null;
  });
  detail.querySelectorAll(".eval-feedback-input").forEach(inp => {
    const subId = parseInt(inp.getAttribute("data-sub-id"));
    const sc = (comp.scores || []).find(s => s.subcompetentie_id === subId);
    if (sc) sc.feedback_docent = inp.value;
  });
}

function selectComp(compId) {
  // Bewaar huidige inputs in memory + persisteer voor we wisselen
  verzamelInputsNaarMemory();
  saveScores();

  activeCompId = compId;
  document.querySelectorAll(".eval-comp-item").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-comp-id") == compId);
  });

  const comp = evalCompetentiesData.find(c => c.competentie_id == compId);
  if (!comp) return;

  const detail = document.getElementById("evalDetail");
  const isReadonly = currentEval.status === "ingediend" || currentEval.status === "afgerond";
  let html = "";

  (comp.scores || []).forEach(sc => {
    html += '<div class="eval-gi">';
    html += '<div class="eval-gi-header">';
    html += '<span class="eval-gi-code">' + (sc.code || "GI") + '</span>';
    html += '<span class="eval-gi-naam">' + (sc.subcompetentie_naam || "") + '</span>';
    html += '</div>';

    html += '<div class="eval-score-row">';
    // Score (docent)
    html += '<div class="eval-field"><span class="eval-field-label">Score (jouw beoordeling)</span>';
    if (isReadonly) {
      html += '<div class="eval-field-readonly">' + (sc.score_docent || "—") + '</div>';
    } else {
      html += '<input type="number" min="1" max="5" value="' + (sc.score_docent || "") + '" data-sub-id="' + sc.subcompetentie_id + '" class="eval-score-input" placeholder="1-5" />';
    }
    html += '</div>';
    // Score (mentor) — read-only
    html += '<div class="eval-field"><span class="eval-field-label">Score (mentor)</span>';
    html += '<div class="eval-field-readonly">' + (sc.score_mentor || "—") + '</div>';
    html += '</div>';
    // Student reflectie
    html += '<div class="eval-field"><span class="eval-field-label">Student reflectie</span>';
    html += '<div class="eval-field-student">' + (sc.student_reflectie || "Nog geen reflectie") + '</div></div>';
    // Feedback (docent)
    html += '<div class="eval-field"><span class="eval-field-label">Feedback</span>';
    if (isReadonly) {
      html += '<div class="eval-field-readonly">' + (sc.feedback_docent || "—") + '</div>';
    } else {
      html += '<textarea data-sub-id="' + sc.subcompetentie_id + '" class="eval-feedback-input" placeholder="Feedback...">' + (sc.feedback_docent || "") + '</textarea>';
    }
    html += '</div>';
    // Feedback (mentor) — read-only
    html += '<div class="eval-field"><span class="eval-field-label">Feedback (mentor)</span>';
    html += '<div class="eval-field-readonly">' + (sc.feedback_mentor || "—") + '</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>';
  });

  detail.innerHTML = html;

  // Auto-save on change
  if (!isReadonly) {
    detail.querySelectorAll(".eval-score-input, .eval-feedback-input").forEach(el => {
      el.addEventListener("change", () => saveScores());
    });
  }
}

async function saveScores() {
  const detail = document.getElementById("evalDetail");
  const scoreInputs = detail.querySelectorAll(".eval-score-input");
  const feedbackInputs = detail.querySelectorAll(".eval-feedback-input");

  const scoresMap = {};
  scoreInputs.forEach(inp => {
    const subId = inp.getAttribute("data-sub-id");
    if (!scoresMap[subId]) scoresMap[subId] = {};
    scoresMap[subId].score_docent = parseInt(inp.value) || null;
  });
  feedbackInputs.forEach(inp => {
    const subId = inp.getAttribute("data-sub-id");
    if (!scoresMap[subId]) scoresMap[subId] = {};
    scoresMap[subId].feedback_docent = inp.value;
  });

  const scores = Object.entries(scoresMap).map(([subId, data]) => ({
    subcompetentie_id: parseInt(subId),
    score_docent: data.score_docent,
    feedback_docent: data.feedback_docent || ""
  }));

  const eindcijfer = document.getElementById("evalEindcijferInput").value;
  const feedback = document.getElementById("evalFeedbackTextarea").value;

  try {
    await fetch(API_BASE_URL + "/evaluaties/" + currentEval.id + "/scores", {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        scores,
        officieel_eindcijfer: eindcijfer ? parseFloat(eindcijfer) : null,
        globale_feedback: feedback || null
      })
    });
  } catch (err) {
    console.error("Scores opslaan fout:", err);
  }
}

async function evalIndienen() {
  if (!currentEval) return;
  const feedback = document.getElementById("evalFeedbackTextarea").value.trim();
  if (!feedback) return alert("Globale feedback is verplicht.");

  await saveScores();

  if (!confirm("Weet je zeker? Na indienen is de evaluatie niet meer wijzigbaar.")) return;

  try {
    const res = await fetch(API_BASE_URL + "/evaluaties/" + currentEval.id + "/indienen", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" }
    });
    if (!res.ok) { const d = await res.json(); return alert(d.error || "Fout"); }
    alert("Evaluatie ingediend!");
    await laadEvaluaties();
  } catch (err) {
    console.error("Indienen fout:", err);
  }
}

async function maakEvaluatie(type) {
  try {
    const res = await fetch(API_BASE_URL + "/evaluaties", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ stage_id: parseInt(stageId), type })
    });
    if (!res.ok) { const d = await res.json(); return alert(d.error || "Fout"); }
    currentEvalType = type;
    await laadEvaluaties();
  } catch (err) {
    console.error("Evaluatie aanmaken fout:", err);
  }
}

// ═══════════════════════════════════════════
// DOCUMENTEN
// ═══════════════════════════════════════════
let docData = { documenten: [], overeenkomst: null };
let docFilter = "alle";

async function laadDocumenten() {
  try {
    const res = await fetch(API_BASE_URL + "/documenten/stage/" + stageId, { headers: authHeader() });
    if (!res.ok) return;
    docData = await res.json();
    renderOvereenkomst();
    setupDocFilters();
    renderDocumenten();
  } catch (err) {
    console.error("Documenten fout:", err);
  }
}

function renderOvereenkomst() {
  const ovk = docData.overeenkomst;
  const card = document.getElementById("docOvereenkomstCard");
  const empty = document.getElementById("docOvkEmpty");

  if (!ovk) {
    card.style.display = "none";
    empty.style.display = "block";
    return;
  }
  card.style.display = "";
  empty.style.display = "none";

  document.getElementById("docOvkNaam").textContent = ovk.bestandsnaam || "Stageovereenkomst";
  const grootte = ovk.bestandsgrootte ? (ovk.bestandsgrootte / 1024).toFixed(0) + " KB" : "";
  const datum = ovk.geupload_op ? formatLong(ovk.geupload_op) : "";
  document.getElementById("docOvkMeta").textContent = [grootte, datum].filter(Boolean).join(" · ");

  const statusEl = document.getElementById("docOvkStatus");
  const statusMap = {
    "niet_opgeladen": { tekst: "Niet opgeladen", cls: "doc-status-niet" },
    "wacht_op_ondertekening": { tekst: "Wacht op ondertekening", cls: "doc-status-wacht" },
    "ondertekend": { tekst: "Ondertekend", cls: "doc-status-ondertekend" },
    "goedgekeurd": { tekst: "Goedgekeurd", cls: "doc-status-goedgekeurd" }
  };
  const s = statusMap[ovk.status] || { tekst: ovk.status, cls: "doc-status-niet" };
  statusEl.textContent = s.tekst;
  statusEl.className = "doc-overeenkomst-status " + s.cls;

  const htContainer = document.getElementById("docOvkHandtekeningen");
  htContainer.innerHTML = "";
  if (ovk.handtekeningen && ovk.handtekeningen.length > 0) {
    ovk.handtekeningen.forEach(h => {
      htContainer.innerHTML +=
        '<div class="doc-handtekening">' +
        '<span class="doc-handtekening-check">✓</span>' +
        '<span class="doc-handtekening-naam">' + h.voornaam + ' ' + h.achternaam + '</span>' +
        '<span class="doc-handtekening-rol">(' + h.rol + ')</span>' +
        '<span class="doc-handtekening-datum">' + formatLong(h.ondertekend_op) + '</span>' +
        '</div>';
    });
  }

  const actionsEl = document.getElementById("docOvkActions");
  actionsEl.innerHTML = "";
  if (ovk.bestandspad) {
    actionsEl.innerHTML += '<a href="' + API_BASE_URL.replace('/api', '') + ovk.bestandspad + '" target="_blank" class="doc-action-btn download">Downloaden</a>';
  }
}

function setupDocFilters() {
  document.querySelectorAll(".doc-filter").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".doc-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      docFilter = btn.getAttribute("data-filter");
      renderDocumenten();
    };
  });
}

function renderDocumenten() {
  let docs = docData.documenten || [];
  if (docFilter !== "alle") {
    docs = docs.filter(d => d.type === docFilter);
  }

  const list = document.getElementById("docList");
  const empty = document.getElementById("docEmpty");

  if (docs.length === 0) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = "";
  docs.forEach(d => {
    const icon = docIcon(d.bestandsnaam);
    const grootte = d.bestandsgrootte ? (d.bestandsgrootte / 1024).toFixed(0) + " KB" : "";
    const uploader = [d.voornaam, d.achternaam].filter(Boolean).join(" ") || "—";
    const datum = formatLong(d.geupload_op);
    const statusBadge = '<span class="doc-status-badge ' + d.status + '">' + docStatusTekst(d.status) + '</span>';

    const card = document.createElement("div");
    card.className = "doc-card";
    card.innerHTML =
      '<span class="doc-icon">' + icon + '</span>' +
      '<div class="doc-info">' +
        '<div class="doc-naam">' + (d.bestandsnaam || "Document") + '</div>' +
        '<div class="doc-meta">' + uploader + ' · ' + datum + ' · ' + grootte + '</div>' +
      '</div>' +
      '<span class="doc-type-badge">' + d.type + '</span>' +
      statusBadge +
      '<div class="doc-actions">' +
        (d.bestandspad ? '<a href="' + API_BASE_URL.replace('/api', '') + d.bestandspad + '" target="_blank" class="doc-action-btn download">↓</a>' : '') +
        (d.status === 'ingediend' ?
          '<button class="doc-action-btn approve" onclick="docStatus(' + d.id + ',\'goedgekeurd\')">✓</button>' +
          '<button class="doc-action-btn reject" onclick="docStatus(' + d.id + ',\'afgekeurd\')">✗</button>'
          : '') +
      '</div>';
    list.appendChild(card);
  });
}

function docIcon(naam) {
  if (!naam) return '📄';
  const ext = naam.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return '📕';
  if (['doc', 'docx'].includes(ext)) return '📘';
  if (['xls', 'xlsx'].includes(ext)) return '📗';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
  if (['zip', 'rar'].includes(ext)) return '📦';
  return '📄';
}

function docStatusTekst(s) {
  return { ingediend: "Ingediend", goedgekeurd: "Goedgekeurd", afgekeurd: "Afgekeurd" }[s] || s;
}

async function uploadDocument() {
  const input = document.getElementById("docFileInput");
  if (!input.files.length) return;

  const formData = new FormData();
  formData.append("bestand", input.files[0]);
  formData.append("stage_id", stageId);
  formData.append("type", "andere");

  try {
    const res = await fetch(API_BASE_URL + "/documenten", {
      method: "POST",
      headers: { "Authorization": "Bearer " + sessionStorage.getItem("token") },
      body: formData
    });
    if (!res.ok) { const d = await res.json(); return alert(d.error || "Upload mislukt"); }
    input.value = "";
    await laadDocumenten();
  } catch (err) {
    console.error("Upload fout:", err);
  }
}

async function docStatus(docId, status) {
  try {
    const res = await fetch(API_BASE_URL + "/documenten/" + docId + "/status", {
      method: "PUT",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) { const d = await res.json(); return alert(d.error || "Fout"); }
    await laadDocumenten();
  } catch (err) {
    console.error("Doc status fout:", err);
  }
}

function openRubriek() {
  window.open("../rubriek/rubriek.html?stage_id=" + stageId, "_blank");
}

function statusText(s) {
  return { "actief":"Stage loopt", "goedgekeurd":"Goedgekeurd",
           "wacht_op_overeenkomst":"Wacht op overeenkomst",
           "afgerond":"Afgerond" }[s] || s;
}

function berekenVoortgang(start, eind) {
  if (!start || !eind) return { huidig: 0, totaal: 0, pct: 0 };
  const totaal = Math.round((new Date(eind) - new Date(start)) / (1000*60*60*24*7));
  const verstreken = (new Date() - new Date(start)) / (1000*60*60*24*7);
  const huidig = Math.max(0, Math.min(Math.round(verstreken), totaal));
  const pct = (huidig / totaal) * 100;
  return { huidig, totaal, pct };
}

function formatLong(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" });
}
