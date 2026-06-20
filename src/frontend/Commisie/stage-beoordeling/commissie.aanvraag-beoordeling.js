// ============================================================
//  admin.aanvraag.js  — gekoppeld aan backend
//
//  Verwacht in URL: ?id=<stage_id>
//  Vereist: JWT token in localStorage onder 'token'
//          (gebruiker moet rol 'admin' of 'commissielid' hebben)
// ============================================================

const API_BASE_URL = API_BASE;

// UI-beslissing → backend-enum
const BESLISSING_MAP = {
  goedkeuren:  "goedgekeurd",
  wijzigingen: "aanpassingen_vereist",
  afwijzen:    "afgekeurd",
};

let huidigeStage = null;
let alleMentoren = [];

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
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type":  "application/json",
    "Authorization": "Bearer " + token,
  };
}

function gebruikerIsAdmin() {
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const rollen = Array.isArray(user.rollen) ? user.rollen.slice() : [];
  if (user.role) rollen.push(user.role);
  if (user.rol) rollen.push(user.rol);
  const genormaliseerdeRollen = rollen.map(r => String(r).toLowerCase());
  return genormaliseerdeRollen.includes("admin");
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

  const token = sessionStorage.getItem("token");
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
  huidigeStage = d;
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

  // Overeenkomst-knop tonen wanneer de stage in de onderteken-fase zit
  const btnOvk = document.getElementById('btnOvereenkomst');
  if (btnOvk && ['wacht_op_overeenkomst', 'goedgekeurd', 'actief'].includes(d.status)) {
    btnOvk.href = '../../Student/stageovereenkomst-document/stageovereenkomst-document.html?stage_id=' + d.id;
    btnOvk.style.display = 'inline-flex';
  }

  // Read-only modus: enkel ingediend en aanpassingen_vereist mogen nog beslist worden
  const mogenBeslissen = ['ingediend', 'aanpassingen_vereist'].includes(d.status);
  if (!mogenBeslissen) {
    document.querySelectorAll('.beslissing-option').forEach(el => {
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
    });
    const btn = document.getElementById('btnBeslissing');
    if (btn) { btn.disabled = true; btn.style.display = 'none'; }
    const fbText = document.getElementById('feedbackText');
    if (fbText) fbText.disabled = true;
    const docSel = document.getElementById('docentSelect');
    if (docSel) docSel.disabled = true;
    if (!gebruikerIsAdmin()) {
      const bedrijfSel = document.getElementById('bedrijfSelect');
      if (bedrijfSel) bedrijfSel.disabled = true;
      const mentorSel = document.getElementById('mentorSelect');
      if (mentorSel) mentorSel.disabled = true;
    }
    const sideTitle = document.querySelector('.side-card-title');
    if (sideTitle) sideTitle.textContent = 'Reeds beoordeeld';
  }

  // Voorselecteren huidige docent in dropdown
  if (d.docent_id) {
    setSelectValueWhenReady("docentSelect", d.docent_id);
  }
  if (d.bedrijf_id) {
    setSelectValueWhenReady("bedrijfSelect", d.bedrijf_id);
  }
  if (d.mentor_id) {
    setSelectValueWhenReady("mentorSelect", d.mentor_id);
  }
}

function setSelectValueWhenReady(selectId, value) {
  const select = document.getElementById(selectId);
  if (!select || value == null) return;

  const interval = setInterval(() => {
    if (select.querySelector(`option[value="${value}"]`)) {
      select.value = value;
      clearInterval(interval);
    }
  }, 100);
  setTimeout(() => clearInterval(interval), 5000);
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
    const isAdmin = gebruikerIsAdmin();
    const bedrijfId = isAdmin ? (document.getElementById("bedrijfSelect")?.value || null) : null;
    const mentorId = isAdmin ? (document.getElementById("mentorSelect")?.value || null) : null;
    const beslissing = BESLISSING_MAP[gekozen];

    if (!stageId || !beslissing) { alert("Iets ging mis. Herlaad de pagina."); return; }
    if (gekozen === "goedkeuren" && !docentId) {
      alert("Kies eerst een begeleidende docent bij goedkeuren.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/stages/${stageId}/beslissing`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({
          beslissing,
          opmerking: feedback,
          docent_id: docentId || null,
          bedrijf_id: bedrijfId || null,
          mentor_id: mentorId || null
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Fout: " + (data.error || "onbekende fout"));
        return;
      }

      window.location.href = "commissie.bevestiging.html?type=" + beslissing;

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

async function laadBedrijven() {
  if (!gebruikerIsAdmin()) return;
  try {
    const res = await fetch(`${API_BASE_URL}/bedrijven`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const bedrijven = await res.json();

    const select = document.getElementById("bedrijfSelect");
    if (!select) return;

    bedrijven.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.naam + (b.stad ? ` — ${b.stad}` : "");
      select.appendChild(opt);
    });

    if (huidigeStage && huidigeStage.bedrijf_id) {
      select.value = huidigeStage.bedrijf_id;
    }
  } catch (err) {
    console.error("Bedrijven ophalen fout:", err);
  }
}

async function laadMentoren() {
  if (!gebruikerIsAdmin()) return;
  try {
    const res = await fetch(`${API_BASE_URL}/gebruikers/mentoren`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    alleMentoren = await res.json();

    const select = document.getElementById("mentorSelect");
    if (!select) return;

    alleMentoren.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.mentor_id;
      const naam = `${m.voornaam ?? ""} ${m.achternaam ?? ""}`.trim();
      const bedrijf = m.bedrijf_naam ? ` — ${m.bedrijf_naam}` : "";
      opt.textContent = `${naam} (${m.email})${bedrijf}`;
      select.appendChild(opt);
    });

    if (huidigeStage && huidigeStage.mentor_id) {
      select.value = huidigeStage.mentor_id;
    }
  } catch (err) {
    console.error("Mentoren ophalen fout:", err);
  }
}

function initKoppelingen() {
  if (!gebruikerIsAdmin()) return;

  const bedrijfWrap = document.getElementById("bedrijfKoppelingWrap");
  const mentorWrap = document.getElementById("mentorKoppelingWrap");
  const btnOpslaan = document.getElementById("btnKoppelingOpslaan");
  if (bedrijfWrap) bedrijfWrap.style.display = "";
  if (mentorWrap) mentorWrap.style.display = "";
  if (btnOpslaan) btnOpslaan.style.display = "";

  const mentorSelect = document.getElementById("mentorSelect");
  const bedrijfSelect = document.getElementById("bedrijfSelect");
  if (!mentorSelect || !bedrijfSelect) return;

  mentorSelect.addEventListener("change", function () {
    const mentor = alleMentoren.find(m => String(m.mentor_id) === String(mentorSelect.value));
    if (mentor && mentor.bedrijf_id) {
      bedrijfSelect.value = mentor.bedrijf_id;
    }
  });

  btnOpslaan?.addEventListener("click", async function () {
    const stageId = getStageIdFromUrl();
    const bedrijfId = bedrijfSelect.value || null;
    const mentorId = mentorSelect.value || null;

    if (!stageId) {
      alert("Geen stage gevonden.");
      return;
    }
    if (!bedrijfId && !mentorId) {
      alert("Kies eerst een bedrijf of mentor.");
      return;
    }

    btnOpslaan.disabled = true;
    btnOpslaan.textContent = "Opslaan...";

    try {
      const res = await fetch(`${API_BASE_URL}/stages/${stageId}/koppelingen`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          bedrijf_id: bedrijfId,
          mentor_id: mentorId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Fout: " + (data.error || "Koppeling opslaan mislukt."));
        return;
      }
      alert("Koppeling opgeslagen.");
      laadStage();
    } catch (err) {
      console.error("Koppeling opslaan fout:", err);
      alert("Geen verbinding met server. Staat de backend aan?");
    } finally {
      btnOpslaan.disabled = false;
      btnOpslaan.textContent = "Koppeling opslaan";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  laadStage();
  laadDocenten();
  laadBedrijven();
  laadMentoren();
  initBeslissing();
  initKoppelingen();
});
