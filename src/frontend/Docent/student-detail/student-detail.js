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

    const v = berekenVoortgang(stage.startdatum, stage.einddatum);
    document.getElementById("weekNum").textContent = "Week " + v.huidig + " / " + v.totaal;
    document.getElementById("weekPct").textContent = v.pct.toFixed(0) + "% voltooid";
    document.getElementById("stageMetaRow").textContent =
      formatLong(stage.startdatum) + " — " + formatLong(stage.einddatum) + " · " + v.totaal + " weken";
  } catch (err) {
    console.error("Stage detail fout:", err);
  }
}

async function laadLogboeken() {
  try {
    const res = await fetch(API_BASE_URL + "/logboeken/stage/" + stageId, { headers: authHeader() });
    if (!res.ok) return;
    const logboeken = await res.json();

    const list = document.getElementById("logboekenList");
    const empty = document.getElementById("logboekenEmpty");
    if (logboeken.length === 0) {
      empty.style.display = "block";
      list.innerHTML = "";
      return;
    }
    empty.style.display = "none";
    list.innerHTML = "";
    logboeken.sort((a, b) => b.week_nummer - a.week_nummer);
    logboeken.forEach(l => {
      const badge = badgeFor(l.status);
      const card = document.createElement("a");
      card.className = "logboek-card";
      card.href = "../logboek-inkijken/logboek-inkijken.html?id=" + l.id;
      card.innerHTML =
        '<div class="week-badge">' +
          '<span class="week-badge-num">' + l.week_nummer + '</span>' +
          '<span class="week-badge-label">Week</span>' +
        '</div>' +
        '<div class="logboek-info">' +
          '<div class="logboek-titel">Week ' + l.week_nummer + ' · ' + (l.titel || "—") + '</div>' +
          '<div class="logboek-meta">' + formatLong(l.datum_van) + " — " + formatLong(l.datum_tot) +
          (l.totaal_dag_uren ? " · " + l.totaal_dag_uren + "u" : "") + '</div>' +
        '</div>' +
        '<span class="logboek-badge ' + badge.cls + '">' + badge.tekst + '</span>';
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Logboeken fout:", err);
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
    });
  });
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
