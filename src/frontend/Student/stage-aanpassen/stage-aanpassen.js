const API_BASE_URL = "http://localhost:3000/api";
let stageId = null;

document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  try {
    const res = await fetch(API_BASE_URL + "/stages/mijn", {
      headers: { "Authorization": "Bearer " + token }
    });
    const stages = await res.json();

    if (!Array.isArray(stages) || stages.length === 0) {
      window.location.href = "../empty-stage/empty-stage.html";
      return;
    }

    // Zoek stage met aanpassingen_vereist of meest recente
    const stage = stages.find(function (s) { return s.status === "aanpassingen_vereist"; }) || stages[0];
    stageId = stage.id;

    vulFormIn(stage);
    vulFeedbackIn(stage);

  } catch (err) {
    console.error("Fout bij ophalen stage:", err);
  }

  document.getElementById("aanpassenForm").addEventListener("submit", indienen);
});

function vulFormIn(s) {
  document.getElementById("bedrijf").value = s.bedrijf_naam || "";
  document.getElementById("sector").value = s.sector || "";
  document.getElementById("mentor").value = s.contact_naam || "";
  document.getElementById("mentorEmail").value = s.contact_email || "";
  document.getElementById("startDatum").value = formatISO(s.startdatum);
  document.getElementById("eindDatum").value = formatISO(s.einddatum);
  document.getElementById("omschrijving").value = s.omschrijving || "";
}

function vulFeedbackIn(s) {
  const feedback = s.feedback || s.laatste_opmerking || "Geen feedback beschikbaar.";
  const auteur = s.beoordeeld_door || "Stagecommissie";
  const datum = formatLong(s.beoordeeld_op || s.bijgewerkt_op);

  document.getElementById("feedbackTekst").textContent = '"' + feedback + '"';
  document.getElementById("feedbackAuteur").textContent = auteur;
  document.getElementById("feedbackDatum").textContent = datum;
}

async function indienen(e) {
  e.preventDefault();
  if (!stageId) { alert("Geen stage gevonden."); return; }

  const token = localStorage.getItem("token");
  const body = {
    bedrijf:      document.getElementById("bedrijf").value.trim(),
    sector:       document.getElementById("sector").value.trim(),
    mentor:       document.getElementById("mentor").value.trim(),
    mentorEmail:  document.getElementById("mentorEmail").value.trim(),
    startDatum:   document.getElementById("startDatum").value,
    eindDatum:    document.getElementById("eindDatum").value,
    omschrijving: document.getElementById("omschrijving").value.trim(),
  };

  if (!body.bedrijf || !body.mentor || !body.mentorEmail || !body.startDatum || !body.eindDatum || !body.omschrijving) {
    alert("Vul alle verplichte velden in.");
    return;
  }

  try {
    const res = await fetch(API_BASE_URL + "/stages/" + stageId, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      alert("Fout: " + (data.error || "onbekende fout"));
      return;
    }

    alert("Je voorstel is opnieuw ingediend!");
    window.location.href = "../empty-stage/empty-stage.html";

  } catch (err) {
    console.error("Indienen fout:", err);
    alert("Geen verbinding met server. Staat de backend aan?");
  }
}

function formatISO(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");
}

function formatLong(d) {
  if (!d) return "—";
  const date = new Date(d);
  const maanden = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
  return date.getDate() + " " + maanden[date.getMonth()] + " " + date.getFullYear();
}
