// ============================================================
// stageovereenkomst-ondertekend.js
// StageMonitorage
//
// Verwacht endpoint:
// GET /api/stages/overeenkomst
// -> { statusTekst, ingediendOp, bedrijf, startDatum, eindDatum }
// ============================================================

const API_BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    console.warn("Geen token — scherm blijft leeg tot login werkt.");
    return;
  }

  laadOvereenkomstData(token);
});

async function laadOvereenkomstData(token) {
  try {
    const res = await fetch(API_BASE_URL + "/stages/overeenkomst", {
      headers: { Authorization: "Bearer " + token },
    });

    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html";
      return;
    }
    if (!res.ok) throw new Error("Server gaf een foutstatus terug.");

    const overeenkomst = await res.json();
    vulOvereenkomstIn(overeenkomst);
  } catch (err) {
    console.error("Kon overeenkomstgegevens niet laden:", err);
  }
}

function vulOvereenkomstIn(overeenkomst) {
  document.getElementById("statusValue").textContent = "🕐 " + overeenkomst.statusTekst;
  document.getElementById("ingediendOp").textContent = overeenkomst.ingediendOp;
  document.getElementById("bedrijf").textContent = overeenkomst.bedrijf;
  document.getElementById("periode").textContent = `${overeenkomst.startDatum} — ${overeenkomst.eindDatum}`;
}