const API_BASE_URL = "http://localhost:3000/api";
let rubriekData = [];
let activeCompId = null;

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) { window.location.href = "../../inloggen/inloggen.html"; return; }

  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const name = user.name || "Docent";
  document.getElementById("userName").textContent = name;
  document.getElementById("userAvatar").textContent =
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const params = new URLSearchParams(window.location.search);
  const stageId = params.get("stage_id");
  if (stageId) await laadStageInfo(stageId);

  await laadRubriek();
});

function authHeader() {
  return { "Authorization": "Bearer " + sessionStorage.getItem("token") };
}

async function laadStageInfo(stageId) {
  try {
    const res = await fetch(API_BASE_URL + "/stages/" + stageId, { headers: authHeader() });
    if (!res.ok) return;
    const s = await res.json();
    const naam = ((s.student_voornaam || "") + " " + (s.student_achternaam || "")).trim();
    document.getElementById("rubriekStudent").textContent = naam || "—";
    document.getElementById("rubriekBedrijf").textContent = s.bedrijf_naam || "—";
    document.getElementById("rubriekOpleiding").textContent = s.opleiding_naam || "—";
    document.getElementById("rubriekJaar").textContent = s.academiejaar_naam || "2025-2026";
  } catch (err) {
    console.error("Stage info fout:", err);
  }
}

async function laadRubriek() {
  try {
    const res = await fetch(API_BASE_URL + "/evaluaties/competenties/rubriek", { headers: authHeader() });
    if (!res.ok) return;
    rubriekData = await res.json();
    renderSidebar();
    if (rubriekData.length > 0) selectComp(rubriekData[0].id);
  } catch (err) {
    console.error("Rubriek fout:", err);
  }
}

function renderSidebar() {
  const list = document.getElementById("rubriekCompList");
  list.innerHTML = "";
  rubriekData.forEach((comp, i) => {
    const el = document.createElement("div");
    el.className = "rubriek-comp-item";
    el.textContent = (i + 1) + ". " + comp.naam;
    el.onclick = () => selectComp(comp.id);
    el.setAttribute("data-id", comp.id);
    list.appendChild(el);
  });
}

function selectComp(compId) {
  activeCompId = compId;
  document.querySelectorAll(".rubriek-comp-item").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-id") == compId);
  });

  const comp = rubriekData.find(c => c.id == compId);
  if (!comp) return;

  const detail = document.getElementById("rubriekDetail");
  let html = '<h2 class="rubriek-comp-naam">' + comp.volgorde + '. ' + comp.naam + '</h2>';
  html += '<p class="rubriek-comp-beschrijving">' + (comp.beschrijving || "") + '</p>';

  (comp.subcompetenties || []).forEach(sub => {
    html += '<div class="rubriek-gi">';
    html += '<div class="rubriek-gi-header">';
    html += '<span class="rubriek-gi-code">' + (sub.code || "GI") + '</span>';
    html += '<span class="rubriek-gi-naam">' + sub.naam + '</span>';
    html += '</div>';

    (sub.niveaus || []).forEach(n => {
      html += '<div class="rubriek-niveau">';
      html += '<div class="niveau-badge niveau-' + n.niveau + '">' + n.niveau + '</div>';
      html += '<div class="niveau-info">';
      html += '<div class="niveau-label">' + (n.label || "") + '</div>';
      html += '<div class="niveau-sublabel">' + (n.sublabel || "") + '</div>';
      html += '<div class="niveau-beschrijving">' + (n.beschrijving || "").replace(/\\n/g, '<br>').replace(/\n/g, '<br>') + '</div>';
      html += '</div></div>';
    });

    html += '</div>';
  });

  detail.innerHTML = html;
}
