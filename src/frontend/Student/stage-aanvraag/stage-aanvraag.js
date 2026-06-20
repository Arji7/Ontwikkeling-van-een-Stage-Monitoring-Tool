const API_BASE_URL = API_BASE;
const form = document.getElementById("voorstelForm");

// Edit-mode? → ?id=<stage_id> in URL
const urlParams = new URLSearchParams(window.location.search);
const stageId   = urlParams.get("id");
const isEditMode = !!stageId;

// Verplichte velden: id => foutmelding
const requiredFields = {
  mentor:       "Stagementor is verplicht.",
  mentorEmail:  "E-mail mentor is verplicht.",
  startDatum:   "Startdatum is verplicht.",
  eindDatum:    "Einddatum is verplicht.",
  omschrijving: "Omschrijving is verplicht.",
};

// ── Datum-restrictie: enkel toekomstige datums ──
document.addEventListener("DOMContentLoaded", function () {
  var vandaag = new Date().toISOString().split("T")[0];
  var startInput = document.getElementById("startDatum");
  var eindInput  = document.getElementById("eindDatum");
  if (startInput) startInput.min = vandaag;
  if (eindInput)  eindInput.min  = vandaag;
  if (startInput) startInput.addEventListener("change", function () {
    if (eindInput && startInput.value) eindInput.min = startInput.value;
  });
});

// ── Bedrijven-select: kies bestaand bedrijf of "Nieuw bedrijf" ──
let bedrijvenCache = [];

function isNieuwBedrijfModus() {
  const sel = document.getElementById("bedrijfSelect");
  return sel && sel.value === "__nieuw__";
}

function getGekozenBedrijfNaam() {
  const sel = document.getElementById("bedrijfSelect");
  if (!sel) return "";
  if (sel.value === "__nieuw__") return document.getElementById("bedrijf").value.trim();
  if (!sel.value) return "";
  return sel.options[sel.selectedIndex].textContent;
}

function toggleNieuwBedrijfVelden(zichtbaar) {
  const wrap = document.getElementById("nieuwBedrijfWrap");
  if (wrap) wrap.style.display = zichtbaar ? "block" : "none";
  document.querySelectorAll(".nieuw-bedrijf-veld").forEach(function (el) {
    el.style.display = zichtbaar ? "" : "none";
  });
  const nieuwInput = document.getElementById("bedrijf");
  if (nieuwInput) nieuwInput.style.display = zichtbaar ? "" : "none";
}

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch(API_BASE + "/bedrijven", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) return;
    bedrijvenCache = await res.json();

    const sel = document.getElementById("bedrijfSelect");
    if (!sel) return;

    const nieuwOptie = sel.querySelector('option[value="__nieuw__"]');
    bedrijvenCache.forEach(function (b) {
      const opt = document.createElement("option");
      opt.value = String(b.id);
      opt.textContent = b.naam;
      opt.dataset.sector = b.sector || "";
      sel.insertBefore(opt, nieuwOptie);
    });

    sel.addEventListener("change", function () {
      if (sel.value === "__nieuw__") {
        document.getElementById("sector").value = "";
        toggleNieuwBedrijfVelden(true);
      } else {
        const opt = sel.options[sel.selectedIndex];
        document.getElementById("sector").value = (opt && opt.dataset.sector) || "";
        toggleNieuwBedrijfVelden(false);
      }
    });
  } catch (e) { console.error("Kon bedrijven niet laden:", e); }
});

// ── EDIT MODE: bestaande gegevens vooraf invullen ──
if (isEditMode) {
  document.addEventListener("DOMContentLoaded", laadStage);
}

async function laadStage() {
  const token = sessionStorage.getItem("token");
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

  const bedrijfNaam = getGekozenBedrijfNaam();
  if (!bedrijfNaam) {
    showError("bedrijf", "Naam bedrijf is verplicht.");
    isValid = false;
  }

  const email = document.getElementById("mentorEmail");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.value.trim() && !emailPattern.test(email.value.trim())) {
    showError("mentorEmail", "Vul een geldig e-mailadres in.");
    isValid = false;
  }

  const start = document.getElementById("startDatum").value;
  const eind  = document.getElementById("eindDatum").value;
  const vandaag = new Date().toISOString().split("T")[0];
  if (start && start < vandaag) {
    showError("startDatum", "Startdatum mag niet in het verleden liggen.");
    isValid = false;
  }
  if (eind && eind < vandaag) {
    showError("eindDatum", "Einddatum mag niet in het verleden liggen.");
    isValid = false;
  }
  if (start && eind && eind < start) {
    showError("eindDatum", "Einddatum moet na de startdatum liggen.");
    isValid = false;
  }

  if (!isValid) return;

  const isNieuw = isNieuwBedrijfModus();

  if (isNieuw) {
    const verplichteNieuw = {
      bedrijfAdres: "Adres bedrijf is verplicht.",
      bedrijfBtw:   "BTW-nummer is verplicht.",
      bedrijfEmail: "E-mail bedrijf is verplicht.",
    };
    for (const id in verplichteNieuw) {
      const f = document.getElementById(id);
      if (!f.value.trim()) {
        showError(id, verplichteNieuw[id]);
        isValid = false;
      }
    }
    const bEmail = document.getElementById("bedrijfEmail");
    if (bEmail.value.trim() && !emailPattern.test(bEmail.value.trim())) {
      showError("bedrijfEmail", "Vul een geldig e-mailadres in.");
      isValid = false;
    }
    if (!isValid) return;
  }

  const data = {
    bedrijf:      bedrijfNaam,
    sector:       document.getElementById("sector").value.trim(),
    mentor:       document.getElementById("mentor").value.trim(),
    mentorEmail:  email.value.trim(),
    startDatum:   start,
    eindDatum:    eind,
    omschrijving: document.getElementById("omschrijving").value.trim(),
  };

  if (isNieuw) {
    data.bedrijfNieuw = {
      adres:    document.getElementById("bedrijfAdres").value.trim(),
      postcode: document.getElementById("bedrijfPostcode").value.trim(),
      stad:     document.getElementById("bedrijfStad").value.trim(),
      btw:      document.getElementById("bedrijfBtw").value.trim(),
      email:    document.getElementById("bedrijfEmail").value.trim(),
      website:  document.getElementById("bedrijfWebsite").value.trim(),
    };
  }

  const token  = sessionStorage.getItem("token");
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
