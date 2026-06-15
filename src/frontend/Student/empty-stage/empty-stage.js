const API_BASE_URL = API_BASE;

document.addEventListener("DOMContentLoaded", async function () {

  // 1. Toon naam van ingelogde gebruiker
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  document.getElementById("userName").textContent = user.name || "Student";

  // 2. Token ophalen
  const token = sessionStorage.getItem("token");
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
    const PRIORITEIT = ["actief", "wacht_op_overeenkomst", "goedgekeurd", "aanpassingen_vereist", "afgekeurd", "ingediend", "in_beoordeling", "concept"];
    const stage = stages.slice().sort(function (a, b) {
      const pa = PRIORITEIT.indexOf(a.status);
      const pb = PRIORITEIT.indexOf(b.status);
      if (pa !== pb) return pa - pb;
      return new Date(b.aangemaakt_op) - new Date(a.aangemaakt_op);
    })[0];
    // Info tabel altijd vullen
    document.getElementById("tabelBedrijf").textContent  = stage.bedrijf_naam || "—";
    document.getElementById("tabelOpdracht").textContent = stage.omschrijving || "—";
    document.getElementById("tabelPeriode").textContent  = formatDate(stage.startdatum) + " — " + formatDate(stage.einddatum);
    document.getElementById("tabelIngediend").textContent = formatDateLong(stage.aangemaakt_op);
    document.getElementById("wachtBeoordeling").style.display = "block";

    // Status dynamisch vullen
    var statusEl = document.getElementById("tabelStatus");
    var verwachteRow = document.getElementById("rowVerwachteBeslissing");
    var statusMap = {
      "ingediend":            { tekst: "⏱ Wacht op goedkeuring",    klasse: "info-value status-pending", toonVerwachte: true },
      "in_beoordeling":       { tekst: "⏱ In beoordeling",          klasse: "info-value status-pending", toonVerwachte: true },
      "goedgekeurd":          { tekst: "✓ Goedgekeurd",              klasse: "info-value status-success", toonVerwachte: false },
      "actief":               { tekst: "✓ Stage loopt",              klasse: "info-value status-success", toonVerwachte: false },
      "afgekeurd":            { tekst: "✕ Afgekeurd",                klasse: "info-value status-danger",  toonVerwachte: false },
      "aanpassingen_vereist": { tekst: "✏ Aanpassingen vereist",     klasse: "info-value status-warning", toonVerwachte: false },
      "wacht_op_overeenkomst":{ tekst: "📄 Wacht op overeenkomst",    klasse: "info-value status-success", toonVerwachte: false },
    };
    var s = statusMap[stage.status] || { tekst: stage.status, klasse: "info-value", toonVerwachte: false };
    if (statusEl) {
      statusEl.textContent = s.tekst;
      statusEl.className = s.klasse;
    }
    if (verwachteRow) verwachteRow.style.display = s.toonVerwachte ? "" : "none";

    var bekijkBtn = document.getElementById("bekijkBtn");
    if (bekijkBtn) bekijkBtn.href = "../voorstel-bekijken/voorstel-bekijken.html";

    // Banner per status configureren
    var banner = document.getElementById("statusBanner");
    var icon = document.getElementById("alertIcon");
    var title = document.getElementById("alertTitle");
    var text = document.getElementById("alertText");
    var btn = document.getElementById("statusBtn");
    var bedrijf = stage.bedrijf_naam || "—";

    if (stage.status === "actief") {
      banner.className = "alert-banner alert-success";
      icon.textContent = "🚀";
      title.textContent = "Je stage loopt!";
      text.textContent = "Je stage bij " + bedrijf + " is actief. Vergeet je wekelijkse logboeken niet in te dienen.";
      btn.textContent = "Naar mijn stage →";
      btn.href = "../mijn-stage/mijn-stage.html";
      btn.style.display = "inline-block";
      updateStepper("goedgekeurd");
    } else if (stage.status === "goedgekeurd" || stage.status === "wacht_op_overeenkomst") {
      banner.className = "alert-banner alert-success";
      icon.textContent = "✅";
      title.textContent = "Stagevoorstel goedgekeurd!";
      text.textContent = "Je voorstel bij " + bedrijf + " is goedgekeurd. Bekijk de details en de volgende stappen.";
      btn.textContent = "Stageovereenkomst ondertekenen →";
      btn.href = "../mijn-stage/mijn-stage.html";
      btn.style.display = "inline-block";
      updateStepper("goedgekeurd");
    } else if (stage.status === "afgekeurd") {
      banner.className = "alert-banner alert-danger";
      icon.textContent = "❌";
      title.textContent = "Stagevoorstel afgekeurd";
      text.textContent = "Je voorstel bij " + bedrijf + " is helaas afgekeurd. Bekijk de motivatie en dien een nieuw voorstel in.";
      btn.textContent = "Bekijk details →";
      btn.href = "../stage-beoordeling/stage-afgewezen/stage-afgewezen.html";
      btn.style.display = "inline-block";
      updateStepper("afgekeurd");
    } else if (stage.status === "aanpassingen_vereist") {
      banner.className = "alert-banner alert-warning";
      icon.textContent = "⚠️";
      title.textContent = "Aanpassingen vereist";
      text.textContent = "De stagecommissie vraagt aanpassingen op je voorstel bij " + bedrijf + ".";
      btn.textContent = "Pas aan →";
      btn.href = "../stage-beoordeling/stage-aanpassingen/stage-aanpassingen.html";
      btn.style.display = "inline-block";
      updateStepper("aanpassingen");
    } else {
      // ingediend / in_beoordeling / concept
      banner.className = "alert-banner alert-pending";
      icon.textContent = "⏳";
      title.textContent = "Stagevoorstel in beoordeling";
      text.textContent = "Je voorstel bij " + bedrijf + " werd ingediend op " + formatDateLong(stage.aangemaakt_op) + ". De stagecommissie bekijkt het momenteel.";
      btn.style.display = "none";
      updateStepper("ingediend");
    }

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

function updateStepper(state) {
  var circles = document.querySelectorAll(".step-circle");
  var lines = document.querySelectorAll(".step-line");
  var labels = document.querySelectorAll(".step-label");

  // Reset
  circles.forEach(function (c) { c.className = "step-circle"; });
  lines.forEach(function (l) { l.className = "step-line"; });
  labels.forEach(function (l) { l.className = "step-label"; });

  // Stap 1 altijd done
  circles[0].classList.add("step-done");
  circles[0].textContent = "✓";
  lines[0].classList.add("step-line--done");

  if (state === "ingediend") {
    circles[1].classList.add("step-active");
    circles[1].textContent = "●";
    labels[1].classList.add("step-label--active");
    circles[2].textContent = "3";
  } else if (state === "goedgekeurd") {
    circles[1].classList.add("step-done");
    circles[1].textContent = "✓";
    lines[1].classList.add("step-line--done");
    circles[2].classList.add("step-done");
    circles[2].textContent = "✓";
  } else if (state === "afgekeurd") {
    circles[1].classList.add("step-done");
    circles[1].textContent = "✓";
    lines[1].classList.add("step-line--done");
    circles[2].classList.add("step-danger");
    circles[2].textContent = "✕";
  } else if (state === "aanpassingen") {
    circles[1].classList.add("step-done");
    circles[1].textContent = "✓";
    lines[1].classList.add("step-line--done");
    circles[2].classList.add("step-warning");
    circles[2].textContent = "!";
  }
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
