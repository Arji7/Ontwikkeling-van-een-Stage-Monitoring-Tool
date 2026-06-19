const API_BASE_URL = API_BASE;

const SCORE_LABELS = ["", "Onvoldoende", "Zwak", "Voldoende", "Goed", "Uitmuntend"];
let currentEval = null;
let currentCompIdx = 0;

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const evalId = params.get("id");

  try {
    let ev;
    if (evalId) {
      const res = await fetch(API_BASE_URL + "/evaluaties/" + evalId, {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) throw new Error("niet gevonden");
      ev = await res.json();
    } else {
      const res = await fetch(API_BASE_URL + "/evaluaties/student/mijn", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) throw new Error("API error");
      const lijst = await res.json();
      const eindEv = lijst.find(function (e) { return e.type === "eind"; });
      if (!eindEv) throw new Error("geen eindevaluatie");
      const detailRes = await fetch(API_BASE_URL + "/evaluaties/" + eindEv.id, {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!detailRes.ok) throw new Error("detail fout");
      ev = await detailRes.json();
    }

    currentEval = ev;
    vulPaginaIn(ev);
  } catch (err) {
    vulLegeStaat();
  }
});

function vulPaginaIn(ev) {
  // Eindscore
  var cijfer = ev.officieel_eindcijfer;
  document.getElementById("eindscoreNum").textContent = cijfer != null ? cijfer : "—";
  document.getElementById("eindscoreMention").textContent = cijfer != null ? cijferMention(cijfer) : "—";

  // Stage info - we halen dit uit de evaluatie of stage data
  document.getElementById("infoStage").textContent = ev.stage_titel
    ? (ev.bedrijf_naam ? ev.bedrijf_naam + " — " + ev.stage_titel : ev.stage_titel)
    : (ev.bedrijf_naam || "—");
  document.getElementById("infoPeriode").textContent =
    ev.startdatum && ev.einddatum
      ? formatKort(ev.startdatum) + " — " + formatKort(ev.einddatum)
      : "—";
  document.getElementById("infoDocent").textContent = ev.docent_naam || "—";
  document.getElementById("infoMentor").textContent = ev.mentor_naam || "—";
  document.getElementById("infoAfgerond").textContent =
    ev.status === "afgerond" ? formatDatum(ev.aangemaakt_op) : "—";

  // Competenties
  if (ev.competenties && ev.competenties.length > 0) {
    renderCompSidebar(ev.competenties);
    selectComp(0);

    // Reflectie button tonen als evaluatie open of ingediend is
    if (ev.status !== "afgerond") {
      document.getElementById("btnReflectie").style.display = "inline-flex";
      document.getElementById("btnReflectie").addEventListener("click", saveReflecties);
    }
  } else {
    document.getElementById("compDetail").innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">🏆</div>' +
        '<div class="empty-title">Scores nog niet beschikbaar</div>' +
        '<div class="empty-text">Je docent heeft de definitieve competentiescores nog niet ingevoerd.</div>' +
      '</div>';
  }

  document.getElementById("mainContent").style.visibility = "visible";
}

function renderCompSidebar(competenties) {
  var html = "";
  competenties.forEach(function (comp, idx) {
    html += '<div class="comp-sidebar-item' + (idx === 0 ? ' active' : '') + '" data-idx="' + idx + '" onclick="selectComp(' + idx + ')">';
    html += (comp.volgorde || idx + 1) + ". " + escHtml(comp.competentie_naam);
    html += '</div>';
  });
  document.getElementById("compSidebarList").innerHTML = html;
}

function verzamelReflectiesNaarMemory() {
  if (!currentEval || currentCompIdx == null) return;
  var huidigeComp = currentEval.competenties[currentCompIdx];
  if (!huidigeComp) return;
  document.querySelectorAll(".gi-reflectie").forEach(function (ta) {
    var subId = parseInt(ta.dataset.subId);
    var sc = (huidigeComp.scores || []).find(function (s) { return s.subcompetentie_id === subId; });
    if (sc) sc.student_reflectie = ta.value;
  });
}

function selectComp(idx) {
  verzamelReflectiesNaarMemory();
  currentCompIdx = idx;
  var items = document.querySelectorAll(".comp-sidebar-item");
  items.forEach(function (el) { el.classList.remove("active"); });
  if (items[idx]) items[idx].classList.add("active");

  var comp = currentEval.competenties[idx];
  renderCompDetail(comp);
}

function renderCompDetail(comp) {
  var html = "";

  comp.scores.forEach(function (s) {
    html += '<div class="gi-item">';
    html += '<div class="gi-header">';
    html += '<strong>' + escHtml(s.code || "") + ':</strong> ' + escHtml(s.subcompetentie_naam || "");
    html += '</div>';

    html += '<div class="gi-scores-row">';

    // Score (Docent)
    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Score (Docent)</div>';
    html += '<div class="gi-field-value">' + (s.score_docent || '<span class="gi-placeholder">Wordt ingevuld door docent</span>') + '</div>';
    html += '<div class="gi-readonly">🔒 Read-only</div>';
    html += '</div>';

    // Feedback (Docent)
    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Feedback (Docent)</div>';
    html += '<div class="gi-field-value">' + (s.feedback_docent ? escHtml(s.feedback_docent) : '<span class="gi-placeholder">Wordt ingevuld door docent</span>') + '</div>';
    html += '<div class="gi-readonly">🔒 Read-only</div>';
    html += '</div>';

    // Jouw reflectie
    html += '<div class="gi-field gi-field-reflectie">';
    html += '<div class="gi-field-label">Jouw reflectie</div>';
    html += '<textarea class="gi-reflectie" data-sub-id="' + s.subcompetentie_id + '" placeholder="Beschrijf hoe je deze competentie hebt ontwikkeld…">' + escHtml(s.student_reflectie || "") + '</textarea>';
    html += '</div>';

    html += '</div>'; // gi-scores-row

    // Score (Mentor) + Feedback (Mentor) - second row
    html += '<div class="gi-scores-row gi-scores-row-secondary">';
    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Score (Mentor)</div>';
    html += '<div class="gi-field-value">' + (s.score_mentor || '<span class="gi-placeholder">Wordt ingevuld door docent</span>') + '</div>';
    html += '<div class="gi-readonly">🔒 Read-only</div>';
    html += '</div>';

    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Feedback (Mentor)</div>';
    html += '<div class="gi-field-value">' + (s.feedback_mentor ? escHtml(s.feedback_mentor) : '<span class="gi-placeholder">Wordt ingevuld door mentor</span>') + '</div>';
    html += '<div class="gi-readonly">🔒 Read-only</div>';
    html += '</div>';

    html += '<div class="gi-field"></div>'; // empty for alignment

    html += '</div>'; // gi-scores-row secondary

    html += '</div>'; // gi-item
  });

  document.getElementById("compDetail").innerHTML = html;
}

async function saveReflecties() {
  var token = sessionStorage.getItem("token");
  if (!token || !currentEval) return;

  // Eerst zichtbare textareas naar memory schrijven, dan ALLE competenties uit memory verzamelen
  verzamelReflectiesNaarMemory();
  var reflecties = [];
  (currentEval.competenties || []).forEach(function (c) {
    (c.scores || []).forEach(function (s) {
      reflecties.push({
        subcompetentie_id: s.subcompetentie_id,
        student_reflectie: (s.student_reflectie || '').trim() || null
      });
    });
  });
  try {
    var res = await fetch(API_BASE_URL + "/evaluaties/" + currentEval.id + "/reflectie", {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reflecties: reflecties })
    });

    if (res.ok) {
      alert("Reflecties opgeslagen!");
    } else {
      var data = await res.json();
      alert("Fout: " + (data.error || "Onbekende fout"));
    }
  } catch (err) {
    alert("Kon reflecties niet opslaan.");
  }
}

function cijferMention(cijfer) {
  if (cijfer >= 16) return "Onderscheiding";
  if (cijfer >= 14) return "Grote voldoening";
  if (cijfer >= 12) return "Voldoening";
  if (cijfer >= 10) return "Voldoende";
  return "Onvoldoende";
}

function vulLegeStaat() {
  document.getElementById("compDetail").innerHTML =
    '<div class="empty-state">' +
      '<div class="empty-icon">🏆</div>' +
      '<div class="empty-title">Eindbeoordeling nog niet beschikbaar</div>' +
      '<div class="empty-text">De eindbeoordeling is beschikbaar nadat je stage is afgerond en je docent de scores heeft ingevoerd.</div>' +
    '</div>';
  document.getElementById("mainContent").style.visibility = "visible";
}

function formatDatum(d) {
  if (!d) return "—";
  var date = new Date(d);
  var maanden = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  return date.getDate() + " " + maanden[date.getMonth()] + " " + date.getFullYear();
}

function formatKort(d) {
  if (!d) return "—";
  var date = new Date(d);
  return ("0" + date.getDate()).slice(-2) + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + date.getFullYear();
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
