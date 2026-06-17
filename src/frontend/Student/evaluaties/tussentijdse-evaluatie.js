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
      const tussentijdseEv = lijst.find(function (e) { return e.type === "tussentijds"; });
      if (!tussentijdseEv) throw new Error("geen tussentijdse evaluatie");
      const detailRes = await fetch(API_BASE_URL + "/evaluaties/" + tussentijdseEv.id, {
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
  var gemiddelde = berekenGemiddeldeScore(ev.competenties || []);
  document.getElementById("tussenscoreNum").textContent = gemiddelde != null ? gemiddelde : "—";
  document.getElementById("tussenscoreMention").textContent = gemiddelde != null ? scoreMentionOpTwintig(gemiddelde) : "—";

  document.getElementById("infoStage").textContent = ev.stage_titel
    ? (ev.bedrijf_naam ? ev.bedrijf_naam + " — " + ev.stage_titel : ev.stage_titel)
    : (ev.bedrijf_naam || "—");
  document.getElementById("infoPeriode").textContent =
    ev.startdatum && ev.einddatum
      ? formatKort(ev.startdatum) + " — " + formatKort(ev.einddatum)
      : "—";
  document.getElementById("infoDocent").textContent = ev.docent_naam || "—";
  document.getElementById("infoMentor").textContent = ev.mentor_naam || "—";
  document.getElementById("infoBespreking").textContent = formatBespreking(ev);
  document.getElementById("infoStatus").innerHTML = statusBadge(ev.status);

  if (ev.competenties && ev.competenties.length > 0) {
    renderCompSidebar(ev.competenties);
    selectComp(0);

    if (ev.status !== "afgerond") {
      document.getElementById("btnReflectie").style.display = "inline-flex";
      document.getElementById("btnReflectie").addEventListener("click", saveReflecties);
    }
  } else {
    document.getElementById("compDetail").innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">📊</div>' +
        '<div class="empty-title">Scores nog niet beschikbaar</div>' +
        '<div class="empty-text">Je docent heeft de tussentijdse competentiescores nog niet ingevoerd.</div>' +
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

function selectComp(idx) {
  bewaarZichtbareReflecties();

  currentCompIdx = idx;
  var items = document.querySelectorAll(".comp-sidebar-item");
  items.forEach(function (el) { el.classList.remove("active"); });
  if (items[idx]) items[idx].classList.add("active");

  var comp = currentEval.competenties[idx];
  renderCompDetail(comp);
}

function renderCompDetail(comp) {
  var html = "";

  if (!comp.scores || comp.scores.length === 0) {
    document.getElementById("compDetail").innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">📊</div>' +
        '<div class="empty-title">Geen scores voor deze competentie</div>' +
        '<div class="empty-text">Voor deze competentie is nog geen tussentijdse feedback ingevoerd.</div>' +
      '</div>';
    return;
  }

  comp.scores.forEach(function (s) {
    html += '<div class="gi-item">';
    html += '<div class="gi-header">';
    html += '<strong>' + escHtml(s.code || "") + ':</strong> ' + escHtml(s.subcompetentie_naam || "");
    html += '</div>';

    html += '<div class="gi-scores-row">';

    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Tussentijdse score (Docent)</div>';
    html += '<div class="gi-field-value">' + scoreWaarde(s.score_docent) + '</div>';
    html += '<div class="gi-readonly">🔒 Read-only</div>';
    html += '</div>';

    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Feedback (Docent)</div>';
    html += '<div class="gi-field-value">' + tekstOfPlaceholder(s.feedback_docent, "Wordt ingevuld door docent") + '</div>';
    html += '<div class="gi-readonly">🔒 Read-only</div>';
    html += '</div>';

    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Jouw reflectie</div>';
    if (currentEval.status === "afgerond") {
      html += '<div class="gi-field-value">' + tekstOfPlaceholder(s.student_reflectie, "Nog geen reflectie toegevoegd") + '</div>';
      html += '<div class="gi-readonly">🔒 Read-only</div>';
    } else {
      html += '<textarea class="gi-reflectie" data-sub-id="' + s.subcompetentie_id + '" placeholder="Schrijf hier je zelfreflectie…">' + escHtml(s.student_reflectie || "") + '</textarea>';
    }
    html += '</div>';

    html += '</div>';

    html += '<div class="gi-scores-row gi-scores-row-secondary">';

    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Tussentijdse score (Mentor)</div>';
    html += '<div class="gi-field-value">' + scoreWaarde(s.score_mentor) + '</div>';
    html += '<div class="gi-readonly">🔒 Read-only</div>';
    html += '</div>';

    html += '<div class="gi-field">';
    html += '<div class="gi-field-label">Feedback (Mentor)</div>';
    html += '<div class="gi-field-value">' + tekstOfPlaceholder(s.feedback_mentor, "Wordt ingevuld door mentor") + '</div>';
    html += '<div class="gi-readonly">🔒 Read-only</div>';
    html += '</div>';

    html += '<div class="gi-field"></div>';

    html += '</div>';
    html += '</div>';
  });

  document.getElementById("compDetail").innerHTML = html;
}

async function saveReflecties() {
  var token = sessionStorage.getItem("token");
  if (!token || !currentEval) return;

  bewaarZichtbareReflecties();

  var reflecties = [];
  (currentEval.competenties || []).forEach(function (comp) {
    (comp.scores || []).forEach(function (score) {
      reflecties.push({
        subcompetentie_id: score.subcompetentie_id,
        student_reflectie: score.student_reflectie || null
      });
    });
  });

  if (reflecties.length === 0) return;

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
      alert("Zelfreflectie opgeslagen.");
    } else {
      var data = await res.json();
      alert("Fout: " + (data.error || "Onbekende fout"));
    }
  } catch (err) {
    alert("Kon zelfreflectie niet opslaan.");
  }
}

function bewaarZichtbareReflecties() {
  if (!currentEval || !currentEval.competenties || !currentEval.competenties[currentCompIdx]) return;

  var zichtbareComp = currentEval.competenties[currentCompIdx];
  var textareas = document.querySelectorAll(".gi-reflectie");

  textareas.forEach(function (ta) {
    var subId = parseInt(ta.dataset.subId);
    var score = (zichtbareComp.scores || []).find(function (s) {
      return s.subcompetentie_id === subId;
    });
    if (score) {
      score.student_reflectie = ta.value.trim();
    }
  });
}

function berekenGemiddeldeScore(competenties) {
  var totaal = 0;
  var aantal = 0;

  competenties.forEach(function (comp) {
    (comp.scores || []).forEach(function (s) {
      if (s.score_docent) {
        totaal += Number(s.score_docent);
        aantal++;
      }
    });
  });

  if (aantal === 0) return null;
  return Math.round((totaal / aantal) * 4 * 10) / 10;
}

function scoreMentionOpTwintig(score) {
  if (score >= 16) return "Uitmuntend";
  if (score >= 14) return "Goed";
  if (score >= 12) return "Voldoende";
  if (score >= 8) return "Zwak";
  return "Onvoldoende";
}

function scoreWaarde(score) {
  if (!score || score < 1 || score > 5) {
    return '<span class="gi-placeholder">Nog niet ingevuld</span>';
  }
  return '<span class="score-badge score-badge-' + score + '">' + score + ' — ' + SCORE_LABELS[score] + '</span>';
}

function tekstOfPlaceholder(tekst, placeholder) {
  if (!tekst) return '<span class="gi-placeholder">' + placeholder + '</span>';
  return escHtml(tekst);
}

function statusBadge(status) {
  if (status === "afgerond") return '<span class="badge badge-green">Afgerond</span>';
  if (status === "ingediend") return '<span class="badge badge-blue">Ingediend</span>';
  if (status === "open") return '<span class="badge badge-orange">Open</span>';
  return '<span class="badge badge-gray">Nog niet beschikbaar</span>';
}

function formatBespreking(ev) {
  var delen = [];
  if (ev.datum_bespreking) delen.push(formatDatum(ev.datum_bespreking));
  if (ev.week_nummer) delen.push("week " + ev.week_nummer);
  if (ev.type_bespreking === "online") delen.push("online");
  if (ev.type_bespreking === "fysiek") delen.push("fysiek");
  return delen.length ? delen.join(" · ") : "—";
}

function vulLegeStaat() {
  document.getElementById("tussenscoreNum").textContent = "—";
  document.getElementById("tussenscoreMention").textContent = "—";
  document.getElementById("infoStage").textContent = "—";
  document.getElementById("infoPeriode").textContent = "—";
  document.getElementById("infoDocent").textContent = "—";
  document.getElementById("infoMentor").textContent = "—";
  document.getElementById("infoBespreking").textContent = "—";
  document.getElementById("infoStatus").innerHTML = '<span class="badge badge-gray">Nog niet beschikbaar</span>';
  document.getElementById("compDetail").innerHTML =
    '<div class="empty-state">' +
      '<div class="empty-icon">📊</div>' +
      '<div class="empty-title">Tussentijdse evaluatie nog niet beschikbaar</div>' +
      '<div class="empty-text">De tussentijdse evaluatie is nog niet gepland of nog niet ingevoerd door je docent.</div>' +
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
  return new Date(d).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
