document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }
  laadOvereenkomstData(token);
});

async function laadOvereenkomstData(token) {
  try {
    const stageId = new URLSearchParams(window.location.search).get("stage_id");
    const endpoint = stageId
      ? API_BASE + "/stages/overeenkomst-document?stage_id=" + encodeURIComponent(stageId)
      : API_BASE + "/stages/overeenkomst-document";

    const res = await fetch(endpoint, {
      headers: { Authorization: "Bearer " + token }
    });
    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html";
      return;
    }
    if (!res.ok) throw new Error("Server gaf een foutstatus terug.");
    const d = await res.json();
    vulOvereenkomstIn(d);
  } catch (err) {
    console.error("Kon overeenkomstgegevens niet laden:", err);
  }
}

function vulOvereenkomstIn(d) {
  const tekens = d.ondertekenaars || [];
  const student = tekens.find(t => t.rol === "Student");
  const mentor  = tekens.find(t => t.rol === "Stagementor");
  const commissie = tekens.find(t => t.rol === "Stagecommissie");
  const studentGetekend = student && student.status === "ondertekend";
  const mentorGetekend  = mentor  && mentor.status  === "ondertekend";
  const commissieGetekend = commissie && commissie.status === "ondertekend";
  const huidigeGebruikerGetekend = tekens.some(t => t.isHuidigeGebruiker && t.status === "ondertekend");
  const alleGetekend = studentGetekend && mentorGetekend && commissieGetekend;

  const titleEl = document.querySelector(".confirm-title");
  const statusEl = document.getElementById("statusValue");

  if (alleGetekend) {
    if (titleEl) titleEl.textContent = "Stageovereenkomst volledig ondertekend!";
    statusEl.textContent = "✓ Stage actief";
  } else if (huidigeGebruikerGetekend) {
    if (titleEl) titleEl.textContent = "Je handtekening is geregistreerd";
    statusEl.textContent = "🕐 Wacht op " + ontbrekendeHandtekeningen(studentGetekend, mentorGetekend, commissieGetekend);
  } else if (studentGetekend) {
    if (titleEl) titleEl.textContent = "Je handtekening is geregistreerd";
    statusEl.textContent = "🕐 Wacht op " + ontbrekendeHandtekeningen(studentGetekend, mentorGetekend, commissieGetekend);
  } else if (mentorGetekend) {
    if (titleEl) titleEl.textContent = "Mentor heeft getekend";
    statusEl.textContent = "🕐 Wacht op " + ontbrekendeHandtekeningen(studentGetekend, mentorGetekend, commissieGetekend);
  } else if (commissieGetekend) {
    if (titleEl) titleEl.textContent = "Stagecommissie heeft getekend";
    statusEl.textContent = "🕐 Wacht op " + ontbrekendeHandtekeningen(studentGetekend, mentorGetekend, commissieGetekend);
  } else {
    statusEl.textContent = "🕐 Nog niet ondertekend";
  }

  const huidigeOndertekening = tekens.find(t => t.isHuidigeGebruiker && t.datum);
  const laatsteOndertekening = tekens.find(t => t.datum);
  const ingediendOnder = huidigeOndertekening
    ? huidigeOndertekening.datum
    : (laatsteOndertekening ? laatsteOndertekening.datum : "—");
  document.getElementById("ingediendOp").textContent = ingediendOnder;
  document.getElementById("bedrijf").textContent = (d.onderneming && d.onderneming.naam) || "—";

  const start = d.periode && d.periode.startdatum ? formatDatum(d.periode.startdatum) : "—";
  const eind  = d.periode && d.periode.einddatum  ? formatDatum(d.periode.einddatum)  : "—";
  document.getElementById("periode").textContent = start + " — " + eind;
}

function formatDatum(d) {
  if (!d || d === "—") return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return String(date.getDate()).padStart(2, "0") + "/" +
         String(date.getMonth() + 1).padStart(2, "0") + "/" +
         date.getFullYear();
}

function ontbrekendeHandtekeningen(studentGetekend, mentorGetekend, commissieGetekend) {
  const ontbrekend = [];
  if (!studentGetekend) ontbrekend.push("student");
  if (!mentorGetekend) ontbrekend.push("mentor");
  if (!commissieGetekend) ontbrekend.push("stagecommissie");

  if (ontbrekend.length === 0) return "geen handtekeningen";
  if (ontbrekend.length === 1) return "handtekening " + ontbrekend[0];

  const laatste = ontbrekend.pop();
  return "handtekening " + ontbrekend.join(", ") + " en " + laatste;
}
