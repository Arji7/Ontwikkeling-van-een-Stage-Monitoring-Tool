const API_BASE_URL = API_BASE;

let allComps = [];
let currentIdx = 0;

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");

  // Student info invullen
  var u = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  document.getElementById("rsbStudent").textContent = u.name || "—";

  // Rubriek ophalen
  let competenties = null;
  if (token) {
    try {
      const res = await fetch(API_BASE_URL + "/evaluaties/competenties/rubriek", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.ok) competenties = await res.json();
    } catch (e) {}

    // Stage info ophalen voor bedrijf/opleiding
    try {
      const stageRes = await fetch(API_BASE_URL + "/stages/mijn", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (stageRes.ok) {
        var stages = await stageRes.json();
        var actief = stages.find(function (s) { return s.status === "actief" || s.status === "goedgekeurd"; }) || stages[0];
        if (actief) {
          document.getElementById("rsbBedrijf").textContent = actief.bedrijf_naam || "—";
          document.getElementById("rsbOpleiding").textContent = actief.opleiding_naam || "Graduaat Informatica";
          document.getElementById("rsbJaar").textContent = actief.academiejaar_naam || "2025–2026";
        }
      }
    } catch (e) {}
  }

  if (!competenties || !competenties.length) {
    document.getElementById("compDetail").innerHTML =
      '<div class="empty-state"><div class="empty-icon">📐</div>' +
      '<div class="empty-title">Rubriek niet beschikbaar</div>' +
      '<div class="empty-text">Kon de competenties niet laden. Probeer later opnieuw.</div></div>';
    return;
  }

  allComps = competenties;
  renderSidebar(competenties);
  selectComp(0);
});

function renderSidebar(competenties) {
  var html = "";
  competenties.forEach(function (comp, idx) {
    html += '<div class="comp-sidebar-item' + (idx === 0 ? ' active' : '') + '" data-idx="' + idx + '" onclick="selectComp(' + idx + ')">';
    html += (comp.volgorde || idx + 1) + ". " + escHtml(comp.naam);
    html += '</div>';
  });
  document.getElementById("compSidebarList").innerHTML = html;
}

function selectComp(idx) {
  currentIdx = idx;
  var items = document.querySelectorAll(".comp-sidebar-item");
  items.forEach(function (el) { el.classList.remove("active"); });
  if (items[idx]) items[idx].classList.add("active");

  var comp = allComps[idx];
  renderCompDetail(comp);
}

function renderCompDetail(comp) {
  var html = '<h2 class="rubriek-detail-title">' + (comp.volgorde || "") + ". " + escHtml(comp.naam) + '</h2>';
  if (comp.beschrijving) {
    html += '<p class="rubriek-detail-desc">' + escHtml(comp.beschrijving) + '</p>';
  }

  var subs = comp.subcompetenties || comp.subcomps || [];
  subs.forEach(function (sub) {
    html += '<div class="rubriek-sub">';
    html += '<div class="rubriek-sub-header">';
    if (sub.code) html += '<span class="rubriek-sub-code">' + escHtml(sub.code) + '</span>';
    html += '<span class="rubriek-sub-name">' + escHtml(sub.naam) + '</span>';
    html += '</div>';

    // Niveaus
    var niveauMap = {};
    if (sub.niveaus) {
      sub.niveaus.forEach(function (n) { niveauMap[n.niveau] = n; });
    }

    for (var n = 1; n <= 5; n++) {
      var niv = niveauMap[n] || {};
      html += '<div class="rubriek-niveau-row">';
      html += '<div class="rubriek-niveau-badge niveau-badge-' + n + '">' + n + '</div>';
      html += '<div class="rubriek-niveau-info">';
      html += '<div class="rubriek-niveau-label">' + escHtml(niv.label || labelVoorNiveau(n)) + '</div>';
      if (niv.sublabel) html += '<div class="rubriek-niveau-sublabel">' + escHtml(niv.sublabel) + '</div>';
      html += '</div>';
      html += '<div class="rubriek-niveau-desc">' + formatBeschrijving(niv.beschrijving || "") + '</div>';
      html += '</div>';
    }

    html += '</div>';
  });

  document.getElementById("compDetail").innerHTML = html;
}

function formatBeschrijving(tekst) {
  if (!tekst) return '<span style="color:#d1d5db;">—</span>';
  return escHtml(tekst).replace(/\\n/g, "<br>").replace(/\n/g, "<br>").replace(/• /g, "• ");
}

function labelVoorNiveau(n) {
  return ["", "Onvoldoende", "Zwak", "Voldoende", "Goed", "Uitmuntend"][n] || "";
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
