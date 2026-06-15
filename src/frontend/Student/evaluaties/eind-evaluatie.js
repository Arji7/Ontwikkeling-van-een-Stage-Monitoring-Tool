const API_BASE_URL = API_BASE;

const SCORE_LABELS = ["", "Onvoldoende", "Zwak", "Voldoende", "Goed", "Uitmuntend"];
const TREND_ICONS  = { stijgend: "📈", stabiel: "➡️", dalend: "📉" };
const TREND_LABELS = { stijgend: "Stijgend", stabiel: "Stabiel", dalend: "Dalend" };

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
      const res = await fetch(API_BASE_URL + "/evaluaties/mijn", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) throw new Error("API error");
      const lijst = await res.json();
      ev = lijst.find(function (e) { return e.type === "eind"; });
      if (!ev) throw new Error("geen eindevaluatie");
    }

    vulPaginaIn(ev);
  } catch (err) {
    vulDemoData();
  }
});

function vulPaginaIn(ev) {
  document.getElementById("pageSubtitle").textContent =
    ev.bedrijf_naam ? "Stage bij " + ev.bedrijf_naam : "Definitieve scores en officieel eindcijfer";

  // Eindcijfer
  const cijfer = ev.officieel_eindcijfer;
  document.getElementById("eindcijferNum").textContent = cijfer != null ? cijfer : "—";
  if (cijfer != null) {
    const label = cijferLabel(cijfer);
    document.getElementById("eindcijferTitel").textContent = label.titel;
    document.getElementById("eindcijferDesc").textContent = label.desc;
  }

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

  if (ev.globale_feedback) {
    document.getElementById("globaleFeedback").textContent = ev.globale_feedback;
    document.getElementById("feedbackWrap").style.display = "block";
  }

  document.getElementById("sterkePunten").textContent = ev.sterke_punten || "Nog niet ingevuld door je docent.";
  document.getElementById("verbeterpunten").textContent = ev.verbeterpunten || "Nog niet ingevuld door je docent.";

  if (ev.scores && ev.scores.length > 0) {
    renderScores(ev.scores);
  } else {
    document.getElementById("competentiesContainer").innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">🏆</div>' +
        '<div class="empty-title">Scores nog niet beschikbaar</div>' +
        '<div class="empty-text">Je docent heeft de definitieve competentiescores nog niet ingevoerd.</div>' +
      '</div>';
  }

  document.getElementById("mainContent").style.visibility = "visible";
}

function renderScores(scores) {
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
      '<th style="width:35%">Subcompetentie</th>' +
      '<th class="center" style="width:12%">Score docent</th>' +
      '<th class="center" style="width:12%">Score mentor</th>' +
      '<th class="center" style="width:12%">Doelscore</th>' +
      '<th class="center" style="width:10%">Trend</th>' +
      '<th style="width:19%">Feedback docent</th>' +
    '</tr></thead><tbody>';

    groep.subcomps.forEach(function (s) {
      const trend = s.trend;
      const trendHtml = trend
        ? '<span class="trend-icon" title="' + (TREND_LABELS[trend] || "") + '">' + (TREND_ICONS[trend] || "—") + '</span>'
        : '<span style="color:#d1d5db;">—</span>';

      html += '<tr>';
      html += '<td>' +
        '<div class="subcomp-code">' + escHtml(s.code || "") + '</div>' +
        '<div class="subcomp-name">' + escHtml(s.naam || "") + '</div>' +
      '</td>';
      html += '<td class="center">' + scoreChip(s.score_docent) + '</td>';
      html += '<td class="center">' + scoreChip(s.score_mentor) + '</td>';
      html += '<td class="center">' + scoreChip(s.eind_doelscore) + '</td>';
      html += '<td class="center">' + trendHtml + '</td>';
      html += '<td>' + (s.feedback_docent
        ? '<span style="font-size:13px;color:#374151;">' + escHtml(s.feedback_docent) + '</span>'
        : '<span style="color:#d1d5db;font-size:13px;">—</span>') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
  });

  document.getElementById("competentiesContainer").innerHTML = html;
}

function cijferLabel(cijfer) {
  if (cijfer >= 16) return { titel: "Uitstekend resultaat", desc: "Proficiat! Je hebt een uitstekende stage afgerond." };
  if (cijfer >= 14) return { titel: "Goed resultaat", desc: "Je hebt je stage goed afgerond." };
  if (cijfer >= 12) return { titel: "Bevredigend resultaat", desc: "Je hebt je stage bevredigend afgerond." };
  if (cijfer >= 10) return { titel: "Voldoende resultaat", desc: "Je stage is succesvol afgerond." };
  return { titel: "Onvoldoende", desc: "Je stage werd als onvoldoende beoordeeld. Neem contact op met je docent." };
}

function scoreChip(score) {
  if (!score || score < 1 || score > 5) {
    return '<span class="score-chip score-none">—</span>';
  }
  return '<span class="score-chip score-' + score + '" title="' + SCORE_LABELS[score] + '">' + score + '</span>';
}

function vulDemoData() {
  document.getElementById("eindcijferNum").textContent = "—";
  document.getElementById("eindcijferTitel").textContent = "Eindbeoordeling stage";
  document.getElementById("eindcijferDesc").textContent = "Het eindcijfer wordt vastgelegd na de eindbeoordeling door je docent.";
  document.getElementById("infodatum").textContent = "—";
  document.getElementById("infotype").textContent = "—";
  document.getElementById("infostatus").innerHTML = '<span class="badge badge-gray">Nog niet beschikbaar</span>';
  document.getElementById("sterkePunten").textContent = "Nog niet ingevuld.";
  document.getElementById("verbeterpunten").textContent = "Nog niet ingevuld.";
  document.getElementById("competentiesContainer").innerHTML =
    '<div class="empty-state">' +
      '<div class="empty-icon">🏆</div>' +
      '<div class="empty-title">Eindbeoordeling nog niet beschikbaar</div>' +
      '<div class="empty-text">De eindbeoordeling is beschikbaar nadat je stage is afgerond en je docent de scores heeft ingevoerd.</div>' +
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
