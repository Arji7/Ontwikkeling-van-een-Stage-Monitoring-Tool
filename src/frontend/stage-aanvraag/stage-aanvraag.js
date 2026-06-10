const form = document.getElementById("voorstelForm");
const successMessage = document.getElementById("successMessage");

// Verplichte velden: id => foutmelding
const requiredFields = {
  bedrijf: "Naam bedrijf is verplicht.",
  sector: "Sector is verplicht.",
  mentor: "Stagementor is verplicht.",
  mentorEmail: "E-mail mentor is verplicht.",
  docent: "Begeleidende docent is verplicht.",
  startDatum: "Startdatum is verplicht.",
  eindDatum: "Einddatum is verplicht.",
  omschrijving: "Omschrijving is verplicht.",
};

form.addEventListener("submit", function (event) {
  event.preventDefault();
  clearErrors();

  let isValid = true;

  // 1. Verplichte velden
  for (const id in requiredFields) {
    const field = document.getElementById(id);
    if (!field.value.trim()) {
      showError(id, requiredFields[id]);
      isValid = false;
    }
  }

  // 2. E-mail mentor geldig?
  const email = document.getElementById("mentorEmail");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.value.trim() && !emailPattern.test(email.value.trim())) {
    showError("mentorEmail", "Vul een geldig e-mailadres in.");
    isValid = false;
  }

  // 3. Einddatum na startdatum?
  const start = document.getElementById("startDatum").value;
  const eind = document.getElementById("eindDatum").value;
  if (start && eind && eind < start) {
    showError("eindDatum", "Einddatum moet na de startdatum liggen.");
    isValid = false;
  }

  if (!isValid) return;

  // 4. Gegevens verzamelen
  const data = {
    bedrijf: document.getElementById("bedrijf").value.trim(),
    sector: document.getElementById("sector").value.trim(),
    mentor: document.getElementById("mentor").value.trim(),
    mentorEmail: email.value.trim(),
    docent: document.getElementById("docent").value.trim(),
    startDatum: start,
    eindDatum: eind,
    omschrijving: document.getElementById("omschrijving").value.trim(),
    status: "Ingediend, wachtend op goedkeuring",
  };

  console.log("Stagevoorstel klaar om te versturen:", data);

  // TODO (backend van Ayoub/Farouk): hier later naar de server sturen, bv.:
  // fetch("/api/stages", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });

  // Voorlopig: formulier verbergen + succesmelding tonen
  form.style.display = "none";
  successMessage.classList.add("is-visible");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function showError(id, message) {
  const errorEl = document.getElementById(id + "Error");
  if (errorEl) errorEl.textContent = message;
  const field = document.getElementById(id);
  if (field) field.classList.add("error");
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(function (el) { el.textContent = ""; });
  document.querySelectorAll("#voorstelForm input, #voorstelForm textarea")
    .forEach(function (el) { el.classList.remove("error"); });
}