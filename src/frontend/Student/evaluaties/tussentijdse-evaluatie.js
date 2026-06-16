const API_BASE_URL = API_BASE;

const SCORE_LABELS = ["", "Onvoldoende", "Zwak", "Voldoende", "Goed", "Uitmuntend"];
const SCORE_COLORS = ["", "score-1", "score-2", "score-3", "score-4", "score-5"];

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
      ev = lijst.find(function (e) { return e.type === "tussentijds"; });
      if (!ev) throw new Error("geen tussentijdse");
      // Haal detail op voor competenties
      const detailRes = await fetch(API_BASE_URL + "/evaluaties/" + ev.id, {
        headers: { "Authorization": "Bearer " + token }
      });
      if (detailRes.ok) ev = await detailRes.json();
    }

    vulPaginaIn(ev);
  } catch (err) {
    vulLegeStaat();
  }
});

function vulPaginaIn(ev) {
  document.getElementById("infoDatum").textContent = formatDatum(ev.datum_bespreking);
  document.getElementById("infoType").textContent =
    ev.type_bespreking === "online" ? "Online" :
    ev.type_bespreking === "fysiek" ? "Fysiek bij bedrijf" : "—";
  document.getElementById("infoWeek").textContent =
    ev.week_nummer ? "Week " + ev.week_nummer + " van 12" : "—";

  var statusEl = document.getElementById("infoStatus");
  if (ev.status === "afgerond") {
    statusEl.innerHTML = '<span class="badge badge-green">Afgerond</span>';
  } else if (ev.status === "ingediend") {
    statusEl.innerHTML = '<span class="badge badge-blue">Ingediend</span>';
  } else {
    statusEl.innerHTML = '<span class="badge badge-orange">Open</span>';
  }

  document.getElementById("sterkePunten").textContent = ev.sterke_punten || "Nog niet ingevuld door je docent.";
  document.getElementById("verbeterpunten").textContent = ev.verbeterpunten || "Nog niet ingevuld door je docent.";

  if (ev.algemene_appreciatie) {
    document.getElementById("algApprec").textContent = '"' + ev.algemene_appreciatie + '"';
    document.getElementById("algWrap").style.display = "block";
  }

  if (ev.competenties && ev.competenties.length > 0) {
    renderScoringTabel(ev.competenties);
  } else {
    document.getElementById("competentiesContainer").innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">📊</div>' +
        '<div class="empty-title">Scores nog niet beschikbaar</div>' +
        '<div class="empty-text">Je docent heeft de competentiescores nog niet ingevoerd.</div>' +
      '</div>';
  }

  document.getElementById("mainContent").style.visibility = "visible";
}

function renderScoringTabel(competenties) {
  var html = '<table class="scoring-table">';
  html += '<thead><tr>' +
    '<th>Competentie</th>' +
    '<th class="center">Score</th>' +
    '<th class="center">Eind-doelscore</th>' +
    '<th class="center">Trend</th>' +
  '</tr></thead><tbody>';

  competenties.forEach(function (comp) {
    // Bereken gemiddelde score voor de competentie
    var totalScore = 0, totalDoel = 0, countScore = 0, countDoel = 0;
    var trend = null;
    comp.scores.forEach(function (s) {
      if (s.score_docent) { totalScore += s.score_docent; countScore++; }
      if (s.eind_doelscore) { totalDoel += s.eind_doelscore; countDoel++; }
      if (s.trend) trend = s.trend;
    });
    var avgScore = countScore > 0 ? Math.round(totalScore / countScore) : null;
    var avgDoel = countDoel > 0 ? Math.round(totalDoel / countDoel) : null;

    html += '<tr>';
    html += '<td>' + escHtml(comp.competentie_naam) + '</td>';
    html += '<td class="center">' + scoreBadge(avgScore) + '</td>';
    html += '<td class="center">' + scoreBadge(avgDoel) + '</td>';
    html += '<td class="center">' + trendPijl(trend) + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById("competentiesContainer").innerHTML = html;
}

function scoreBadge(score) {
  if (!score || score < 1 || score > 5) return '<span class="score-badge score-badge-none">—</span>';
  return '<span class="score-badge score-badge-' + score + '">' + score + ' — ' + SCORE_LABELS[score] + '</span>';
}

function trendPijl(trend) {
  if (trend === "stijgend") return '<span class="trend-arrow trend-up">↗</span>';
  if (trend === "dalend") return '<span class="trend-arrow trend-down">↘</span>';
  if (trend === "stabiel") return '<span class="trend-arrow trend-stable">→</span>';
  return '<span style="color:#d1d5db;">—</span>';
}

function vulLegeStaat() {
  document.getElementById("infoDatum").textContent = "—";
  document.getElementById("infoType").textContent = "—";
  document.getElementById("infoWeek").textContent = "—";
  document.getElementById("infoStatus").innerHTML = '<span class="badge badge-gray">Nog niet beschikbaar</span>';
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
  var date = new Date(d);
  var maanden = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  return date.getDate() + " " + maanden[date.getMonth()] + " " + date.getFullYear();
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
