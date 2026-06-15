const API_BASE_URL = API_BASE;

const SCORE_LABELS = ["", "Onvoldoende", "Zwak", "Voldoende", "Goed", "Uitmuntend"];
const SCORE_COLORS = ["", "score-1", "score-2", "score-3", "score-4", "score-5"];
const TREND_ICONS  = { stijgend: "📈", stabiel: "➡️", dalend: "📉" };

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
      // Haal meest recente tussentijdse op
      const res = await fetch(API_BASE_URL + "/evaluaties/mijn", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) throw new Error("API error");
      const lijst = await res.json();
      ev = lijst.find(function (e) { return e.type === "tussentijds"; });
      if (!ev) throw new Error("geen tussentijdse");
    }

    vulPaginaIn(ev);
  } catch (err) {
    vulDemoData();
  }
});

function vulPaginaIn(ev) {
  document.getElementById("pageSubtitle").textContent =
    "Week " + (ev.week_nummer || "—") + " · " + (ev.bedrijf_naam || "Mijn stage");

  document.getElementById("infodatum").textContent = formatDatum(ev.datum_bespreking);
  document.getElementById("infotype").textContent =
    ev.type_bespreking === "online" ? "🖥️ Online" :
    ev.type_bespreking === "fysiek" ? "🏢 Fysiek" : "—";

  const statusEl = document.getElementById("infostatus");
  if (ev.status === "afgerond") {
    statusEl.innerHTML = '<span class="badge badge-green">✓ Afgerond</span>';
  } else if (ev.status === "ingediend") {
    statusEl.innerHTML = '<span class="badge badge-blue">Ingediend</span>';
  } else {
    statusEl.innerHTML = '<span class="badge badge-orange">Open</span>';
  }

  document.getElementById("sterkePunten").textContent = ev.sterke_punten || "Nog niet ingevuld door je docent.";
  document.getElementById("verbeterpunten").textContent = ev.verbeterpunten || "Nog niet ingevuld door je docent.";

  if (ev.algemene_appreciatie) {
    document.getElementById("algApprec").textContent = ev.algemene_appreciatie;
    document.getElementById("algWrap").style.display = "block";
  }

  if (ev.scores && ev.scores.length > 0) {
    renderScores(ev.scores);
  } else {
    document.getElementById("competentiesContainer").innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">📊</div>' +
        '<div class="empty-title">Scores nog niet beschikbaar</div>' +
        '<div class="empty-text">Je docent heeft de competentiescores nog niet ingevoerd. Je ontvangt een melding zodra dit gebeurd is.</div>' +
      '</div>';
  }

  document.getElementById("mainContent").style.visibility = "visible";
}

function renderScores(scores) {
  // Groepeer per competentie
  const groepen = {};
  scores.forEach(function (s) {
    const cId = s.competentie_id || "0";
    if (!groepen[cId]) {
      groepen[cId] = { naam: s.competentie_naam || "Competentie", subcomps: [] };
    }
    groepen[cId].subcomps.push(s);
  });

  let html = "";
  Object.values(groepen).forEach(function (groep) {
    html += '<div class="comp-section">';
    html += '<div class="comp-section-title">📌 ' + escHtml(groep.naam) + '</div>';
    html += '<table class="comp-table">';
    html += '<thead><tr>' +
      '<th style="width:38%">Subcompetentie</th>' +
      '<th class="center" style="width:14%">Score docent</th>' +
      '<th class="center" style="width:14%">Score mentor</th>' +
      '<th style="width:34%">Feedback docent</th>' +
    '</tr></thead><tbody>';

    groep.subcomps.forEach(function (s) {
      const sd = s.score_docent;
      const sm = s.score_mentor;
      html += '<tr>';
      html += '<td>' +
        '<div class="subcomp-code">' + escHtml(s.code || "") + '</div>' +
        '<div class="subcomp-name">' + escHtml(s.naam || "") + '</div>' +
      '</td>';
      html += '<td class="center">' + scoreChip(sd) + '</td>';
      html += '<td class="center">' + scoreChip(sm) + '</td>';
      html += '<td>' + (s.feedback_docent ? '<span style="font-size:13px;color:#374151;">' + escHtml(s.feedback_docent) + '</span>' : '<span style="color:#d1d5db;font-size:13px;">—</span>') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
  });

  document.getElementById("competentiesContainer").innerHTML = html;
}

function scoreChip(score) {
  if (!score || score < 1 || score > 5) {
    return '<span class="score-chip score-none">—</span>';
  }
  return '<span class="score-chip score-' + score + '" title="' + SCORE_LABELS[score] + '">' + score + '</span>';
}

function vulDemoData() {
  // Toont zinvolle lege staat als geen API beschikbaar is
  document.getElementById("pageSubtitle").textContent = "Tussentijdse bespreking";
  document.getElementById("infodatum").textContent = "—";
  document.getElementById("infotype").textContent = "—";
  document.getElementById("infostatus").innerHTML = '<span class="badge badge-gray">Nog niet beschikbaar</span>';
  document.getElementById("sterkePunten").textContent = "Nog niet ingevuld.";
  document.getElementById("verbeterpunten").textContent = "Nog niet ingevuld.";
  document.getElementById("competentiesContainer").innerHTML =
    '<div class="empty-state">' +
      '<div class="empty-icon">📊</div>' +
      '<div class="empty-title">Evaluatie nog niet beschikbaar</div>' +
      '<div class="empty-text">De tussentijdse bespreking is nog niet gepland of nog niet ingevoerd door je docent.</div>' +
    '</div>';
  document.getElementById("mainContent").style.visibility = "visible";
}

function formatDatum(d) {
  if (!d) return "—";
  const date = new Date(d);
  const maanden = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  return date.getDate() + " " + maanden[date.getMonth()] + " " + date.getFullYear();
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
