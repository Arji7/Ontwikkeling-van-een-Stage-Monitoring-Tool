const API_BASE_URL = "http://localhost:3000/api";
const form = document.getElementById("voorstelForm");

// Edit-mode? → ?id=<stage_id> in URL
const urlParams = new URLSearchParams(window.location.search);
const stageId   = urlParams.get("id");
const isEditMode = !!stageId;

// Verplichte velden: id => foutmelding
const requiredFields = {
  bedrijf:      "Naam bedrijf is verplicht.",
  sector:       "Sector is verplicht.",
  mentor:       "Stagementor is verplicht.",
  mentorEmail:  "E-mail mentor is verplicht.",
  startDatum:   "Startdatum is verplicht.",
  eindDatum:    "Einddatum is verplicht.",
  omschrijving: "Omschrijving is verplicht.",
};

// ── EDIT MODE: bestaande gegevens vooraf invullen ──
if (isEditMode) {
  document.addEventListener("DOMContentLoaded", laadStage);
}

async function laadStage() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/stages/${stageId}`, {
      headers: { "Authorization": "Bearer " + token },
    });
    if (!res.ok) {
      alert("Kan stage niet ophalen om aan te passen.");
      return;
    }
    const d = await res.json();

    document.getElementById("bedrijf").value      = d.bedrijf_naam || "";
    document.getElementById("sector").value       = d.sector       || "";
    document.getElementById("mentor").value       = d.contact_naam || "";
    document.getElementById("mentorEmail").value  = d.contact_email|| "";
    document.getElementById("startDatum").value   = (d.startdatum || "").substring(0,10);
    document.getElementById("eindDatum").value    = (d.einddatum  || "").substring(0,10);
    document.getElementById("omschrijving").value = d.omschrijving || "";

    const h1 = document.querySelector(".form-head h1");
    const submitBtn = form.querySelector("button[type=submit]");

    // Status bepaalt of het bewerkbaar is
    const editable = ["concept", "aanpassingen_vereist"].includes(d.status);

    if (editable) {
      if (h1) h1.textContent = "Stagevoorstel aanpassen";
      if (submitBtn) submitBtn.textContent = "Opnieuw indienen";
    } else {
      // Readonly modus — alleen bekijken
      if (h1) h1.textContent = "Mijn stagevoorstel";
      if (submitBtn) submitBtn.style.display = "none";
      // Velden vergrendelen
      form.querySelectorAll("input, textarea").forEach(function (el) {
        el.disabled = true;
      });
      // Subtitle aanpassen
      const sub = document.querySelector(".form-head p");
      if (sub) sub.textContent = "Je voorstel is ingediend en kan niet meer worden aangepast tot de stagecommissie een beslissing heeft genomen.";
    }

  } catch (err) {
    console.error("Stage laden fout:", err);
  }
}

// ── SUBMIT ──
form.addEventListener("submit", function (event) {
  event.preventDefault();
  clearErrors();

  let isValid = true;

  for (const id in requiredFields) {
    const field = document.getElementById(id);
    if (!field.value.trim()) {
      showError(id, requiredFields[id]);
      isValid = false;
    }
  }

  const email = document.getElementById("mentorEmail");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.value.trim() && !emailPattern.test(email.value.trim())) {
    showError("mentorEmail", "Vul een geldig e-mailadres in.");
    isValid = false;
  }

  const start = document.getElementById("startDatum").value;
  const eind  = document.getElementById("eindDatum").value;
  if (start && eind && eind < start) {
    showError("eindDatum", "Einddatum moet na de startdatum liggen.");
    isValid = false;
  }

  if (!isValid) return;

  const data = {
    bedrijf:      document.getElementById("bedrijf").value.trim(),
    sector:       document.getElementById("sector").value.trim(),
    mentor:       document.getElementById("mentor").value.trim(),
    mentorEmail:  email.value.trim(),
    startDatum:   start,
    eindDatum:    eind,
    omschrijving: document.getElementById("omschrijving").value.trim(),
  };

  const token  = localStorage.getItem("token");
  const url    = isEditMode ? `${API_BASE_URL}/stages/${stageId}` : `${API_BASE_URL}/stages`;
  const method = isEditMode ? "PUT" : "POST";

  fetch(url, {
    method,
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Bearer " + token,
    },
    body: JSON.stringify(data),
  })
  .then(res => res.json())
  .then(result => {
    if (result.error) {
      alert(result.error);
    } else {
      window.location.href = "../voorstel.ingediend/voorstel.ingediend.html";
    }
  })
  .catch(() => alert("Geen verbinding met de server. Staat de backend aan?"));
});

function showError(id, message) {
  const errorEl = document.getElementById(id + "Error");
  if (errorEl) errorEl.textContent = message;
  const field = document.getElementById(id);
  if (field) field.classList.add("error");
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(el => { el.textContent = ""; });
  document.querySelectorAll("#voorstelForm input, #voorstelForm textarea")
    .forEach(el => el.classList.remove("error"));
}
