const API_BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async function () {

  // 1. Toon naam van ingelogde gebruiker
  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  document.getElementById("userName").textContent = user.name || "Student";

  // 2. Token ophalen
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  // 3. Stages ophalen van backend
  try {
    const response = await fetch(API_BASE_URL + "/stages/mijn", {
      headers: { "Authorization": "Bearer " + token }
    });

    const stages = await response.json();

    if (!Array.isArray(stages) || stages.length === 0) {
      document.getElementById("emptyState").style.display = "block";
      return;
    }

    // Toon meest relevante stage:
    //   1. Met openstaande actie (aanpassingen_vereist / afgekeurd)
    //   2. Anders: de meest recente
    const PRIORITEIT = ["aanpassingen_vereist", "afgekeurd", "goedgekeurd", "ingediend", "in_beoordeling", "concept"];
    const stage = stages.slice().sort(function (a, b) {
      const pa = PRIORITEIT.indexOf(a.status);
      const pb = PRIORITEIT.indexOf(b.status);
      if (pa !== pb) return pa - pb;
      return new Date(b.aangemaakt_op) - new Date(a.aangemaakt_op);
    })[0];
    // Status pagina's worden door inloggen.js afgehandeld voor goedgekeurd/afgekeurd/aanpassingen
    // Hier: dashboard tonen voor "ingediend" of "in_beoordeling"
    document.getElementById("tabelBedrijf").textContent  = stage.bedrijf_naam || "—";
    document.getElementById("tabelOpdracht").textContent = stage.omschrijving || "—";
    document.getElementById("tabelPeriode").textContent  = formatDate(stage.startdatum) + " — " + formatDate(stage.einddatum);
    document.getElementById("tabelIngediend").textContent = formatDateLong(stage.aangemaakt_op);
    document.getElementById("alertText").textContent =
      "Je voorstel bij " + (stage.bedrijf_naam || "—") +
      " werd ingediend op " + formatDateLong(stage.aangemaakt_op) +
      ". De stagecommissie bekijkt het momenteel.";
    document.getElementById("wachtBeoordeling").style.display = "block";

    // Knop "Bekijk mijn voorstel" → stuurt naar het formulier in readonly mode
    var bekijkBtn = document.getElementById("bekijkBtn");
    if (bekijkBtn) bekijkBtn.href = "../stage-aanvraag/stage-aanvraag.html?id=" + stage.id;

  } catch (err) {
    console.error("Fout bij ophalen stages:", err);
    document.getElementById("emptyState").style.display = "block";
  }
});

function formatDate(d) {
  if (!d) return "—";
  var date = new Date(d);
  return String(date.getDate()).padStart(2, "0") + "/" +
    String(date.getMonth() + 1).padStart(2, "0") + "/" +
    date.getFullYear();
}

function formatDateLong(d) {
  if (!d) return "—";
  var date = new Date(d);
  var maanden = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  return date.getDate() + " " + maanden[date.getMonth()] + " " + date.getFullYear();
}

function humanStatus(s) {
  const map = {
    "concept":              "Concept",
    "ingediend":            "Ingediend, wachten op goedkeuring",
    "in_beoordeling":       "In behandeling",
    "goedgekeurd":          "✅ Goedgekeurd",
    "aanpassingen_vereist": "✏️ Aanpassingen vereist",
    "afgekeurd":            "❌ Afgekeurd",
    "wacht_op_overeenkomst":"Wacht op overeenkomst",
    "actief":               "Stage loopt",
    "afgerond":             "Afgerond",
  };
  return map[s] || s;
}
