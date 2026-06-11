// ============================================================
//  admin.aanvraag.js  — gekoppeld aan backend
//
//  Verwacht in URL: ?id=<stage_id>
//  Vereist: JWT token in localStorage onder 'token'
//          (gebruiker moet rol 'admin' of 'commissielid' hebben)
// ============================================================

const API_BASE_URL = "http://localhost:3000/api";

// UI-beslissing → backend-enum
const BESLISSING_MAP = {
  goedkeuren:  "goedgekeurd",
  wijzigingen: "aanpassingen_vereist",
  afwijzen:    "afgekeurd",
};

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
function txt(id, waarde) {
  const el = document.getElementById(id);
  if (el) el.textContent = waarde ?? "—";
}

function initialen(naam) {
  if (!naam) return "??";
  return naam.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-BE");
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("nl-BE");
}

function berekenWeken(start, eind) {
  if (!start || !eind) return "—";
  const ms = new Date(eind) - new Date(start);
  const weken = Math.round(ms / (1000 * 60 * 60 * 24 * 7));
  return `± ${weken} weken`;
}

function statusBadge(status) {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "ingediend")            return `<span class="badge badge-pending">Wachten op goedkeuring</span>`;
  if (s === "goedgekeurd")          return `<span class="badge badge-active">Goedgekeurd</span>`;
  if (s === "afgekeurd")            return `<span class="badge badge-danger">Afgekeurd</span>`;
  if (s === "aanpassingen_vereist") return `<span class="badge badge-changes">Aanpassingen vereist</span>`;
  return `<span class="badge">${status}</span>`;
}

function getStageIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type":  "application/json",
    "Authorization": "Bearer " + token,
  };
}

// ────────────────────────────────────────────────────────────
// DATA LADEN
// ────────────────────────────────────────────────────────────
async function laadStage() {
  const stageId = getStageIdFromUrl();

  if (!stageId) {
    txt("studentNaam", "Geen stage ID opgegeven (?id=...)");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Niet ingelogd. Je wordt doorgestuurd.");
    window.location.href = "../inloggen/inloggen.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/stages/${stageId}`, {
      headers: authHeaders(),
    });

    if (res.status === 401 || res.status === 403) {
      alert("Geen toegang. Log opnieuw in als admin of commissielid.");
      window.location.href = "../inloggen/inloggen.html";
      return;
    }
    if (res.status === 404) {
      txt("studentNaam", `Stage #${stageId} niet gevonden`);
      return;
    }

    const d = await res.json();
    vulPaginaIn(d);

  } catch (err) {
    console.error("Stage ophalen fout:", err);
    txt("studentNaam", "Fout bij ophalen — staat de backend aan?");
  }
}

function vulPaginaIn(d) {
  const naam = `${d.student_voornaam ?? ""} ${d.student_achternaam ?? ""}`.trim() || "Onbekend";
  const init = initialen(naam);

  document.title = `${naam} – Admin | StageMonitor`;

  // Avatar + kop
  txt("studentAvatar",    init);
  txt("sideAvatar",       init);
  txt("studentNaam",      naam);
  txt("studentBedrijf",   d.bedrijf_naam || "—");
  txt("studentOpleiding", d.opleiding_naam || "—");
  txt("studentIngediend", "Ingediend op " + formatDate(d.aangemaakt_op));

  // Bedrijfsgegevens
  txt("bedrijfNaam",   d.bedrijf_naam);
  txt("bedrijfSector", d.sector);
  txt("bedrijfMentor", d.contact_naam);
  const emailMentor = document.getElementById("bedrijfEmail");
  if (emailMentor && d.contact_email) {
    emailMentor.textContent = d.contact_email;
    emailMentor.href = "mailto:" + d.contact_email;
  }

  // Stagegegevens
  const docentNaam = (d.docent_voornaam || d.docent_achternaam)
    ? `${d.docent_voornaam ?? ""} ${d.docent_achternaam ?? ""}`.trim()
    : "Nog niet toegekend";
  txt("stageDocent", docentNaam);
  txt("stageJaar",   d.academiejaar_naam || "—");
  txt("stageStart",  formatDate(d.startdatum));
  txt("stageEind",   formatDate(d.einddatum));
  txt("stageWeken",  berekenWeken(d.startdatum, d.einddatum));

  // Studentgegevens
  txt("detailNaam",     naam);
  txt("detailLeeftijd", "—");
  txt("detailTel",      "—");
  const emailStudent = document.getElementById("detailEmail");
  if (emailStudent && d.student_email) {
    emailStudent.textContent = d.student_email;
    emailStudent.href = "mailto:" + d.student_email;
  }

  // Opdracht
  txt("opdrachtTekst", d.omschrijving);
  txt("opdrachtSub",   "");

  // Rechterkolom — status badge
  txt("sideNaam", naam);
  const sideStatus = document.getElementById("sideStatus");
  if (sideStatus) sideStatus.innerHTML = statusBadge(d.status);

  // Geschiedenis
  txt("histIngediend",   `${naam} · ${formatDateTime(d.aangemaakt_op)}`);
  txt("histBehandeling", `Automatisch · ${formatDateTime(d.aangemaakt_op)}`);

  // Voorselecteren huidige docent in dropdown
  if (d.docent_id) {
    const select = document.getElementById("docentSelect");
    if (select) {
      const tryen = setInterval(() => {
        if (select.querySelector(`option[value="${d.docent_id}"]`)) {
          select.value = d.docent_id;
          clearInterval(tryen);
        }
      }, 100);
      setTimeout(() => clearInterval(tryen), 5000);
    }
  }
}

// ────────────────────────────────────────────────────────────
// BESLISSING VERSTUREN
// ────────────────────────────────────────────────────────────
function initBeslissing() {
  const opties      = document.querySelectorAll(".beslissing-option[data-value]");
  const feedbackEl  = document.querySelector(".feedback-wrap");
  let gekozen       = null;

  opties.forEach(opt => {
    opt.addEventListener("click", () => {
      opties.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      gekozen = opt.dataset.value;

      // Schuif feedback-blok onder de gekozen optie
      if (feedbackEl) opt.insertAdjacentElement("afterend", feedbackEl);
    });
  });

  document.getElementById("btnBeslissing")?.addEventListener("click", async () => {
    if (!gekozen) { alert("Selecteer eerst een beslissing."); return; }

    const stageId  = getStageIdFromUrl();
    const feedback = document.getElementById("feedbackText")?.value?.trim() || "";
    const docentId = document.getElementById("docentSelect")?.value || null;
    const beslissing = BESLISSING_MAP[gekozen];

    if (!stageId || !beslissing) { alert("Iets ging mis. Herlaad de pagina."); return; }

    try {
      const res = await fetch(`${API_BASE_URL}/stages/${stageId}/beslissing`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ beslissing, opmerking: feedback, docent_id: docentId || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Fout: " + (data.error || "onbekende fout"));
        return;
      }

      alert(`✅ Beslissing "${beslissing}" succesvol opgeslagen.`);
      laadStage(); // ververs gegevens

    } catch (err) {
      console.error("Beslissing versturen fout:", err);
      alert("Geen verbinding met server. Staat de backend aan?");
    }
  });
}

// ────────────────────────────────────────────────────────────
// START
// ────────────────────────────────────────────────────────────
async function laadDocenten() {
  try {
    const res = await fetch(`${API_BASE_URL}/gebruikers/docenten`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const docenten = await res.json();

    const select = document.getElementById("docentSelect");
    if (!select) return;

    docenten.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.docent_id;
      opt.textContent = `${d.voornaam} ${d.achternaam}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Docenten ophalen fout:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  laadStage();
  laadDocenten();
  initBeslissing();
});
