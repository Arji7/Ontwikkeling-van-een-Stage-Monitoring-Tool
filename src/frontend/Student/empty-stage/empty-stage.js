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

    // Toon de meest recente stage
    const stage = stages[0];
    document.getElementById("stageBedrijf").textContent      = stage.bedrijf_naam || "—";
    document.getElementById("stageSector").textContent       = stage.sector || "—";
    document.getElementById("stagePeriode").textContent      = formatDate(stage.startdatum) + " → " + formatDate(stage.einddatum);
    document.getElementById("stageStatus").textContent       = stage.status;
    document.getElementById("stageOmschrijving").textContent = stage.omschrijving || "";
    document.getElementById("stageInfo").style.display = "block";

  } catch (err) {
    console.error("Fout bij ophalen stages:", err);
    document.getElementById("emptyState").style.display = "block";
  }
});

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-BE");
}
