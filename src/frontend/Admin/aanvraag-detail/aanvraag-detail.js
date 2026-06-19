const API_BASE_URL = API_BASE;

const BESLISSING_MAP = {
  goedkeuren:  "goedgekeurd",
  wijzigingen: "aanpassingen_vereist",
  afwijzen:    "afgekeurd",
};

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + sessionStorage.getItem("token"),
  };
}

function txt(id, waarde) {
  const el = document.getElementById(id);
  if (el) el.textContent = waarde ?? "—";
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
  const weken = Math.round((new Date(eind) - new Date(start)) / (1000 * 60 * 60 * 24 * 7));
  return `± ${weken} weken`;
}

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  if (s === "ingediend")            return `<span class="badge badge-pending">Wachten op goedkeuring</span>`;
  if (s === "goedgekeurd")          return `<span class="badge badge-active">Goedgekeurd</span>`;
  if (s === "afgekeurd")            return `<span class="badge badge-danger">Afgekeurd</span>`;
  if (s === "aanpassingen_vereist") return `<span class="badge badge-changes">Aanpassingen vereist</span>`;
  return `<span class="badge">${status}</span>`;
}

function getStageId() {
  return new URLSearchParams(window.location.search).get("id");
}

document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");
  if (!token) { window.location.href = "../../inloggen/inloggen.html"; return; }

  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const naam = user.name || "Admin";
  document.getElementById("sidebarUserName").textContent = naam;
  document.getElementById("sidebarUserAvatar").textContent =
    naam.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const rollen = (user.rollen || []).join(" + ") || user.rol || "Administratie";
  document.getElementById("sidebarRoles").textContent = rollen;
  document.getElementById("sidebarUserRole").textContent = rollen;

  laadStage();
  laadDocenten();
  initBeslissing();
});

async function laadStage() {
  const id = getStageId();
  if (!id) { txt("studentNaam", "Geen stage ID opgegeven"); return; }

  try {
    const res = await fetch(`${API_BASE_URL}/stages/${id}`, { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html"; return;
    }
    if (res.status === 404) { txt("studentNaam", `Stage #${id} niet gevonden`); return; }
    if (!res.ok) throw new Error("Serverfout");
    vulPaginaIn(await res.json());
  } catch (err) {
    console.error("Stage ophalen fout:", err);
    txt("studentNaam", "Fout bij ophalen — staat de backend aan?");
  }
}

function vulPaginaIn(d) {
  const naam = `${d.student_voornaam ?? ""} ${d.student_achternaam ?? ""}`.trim() || "Onbekend";
  const init = naam.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  document.title = `${naam} – Admin | StageMonitor`;
  txt("studentAvatar", init);
  txt("sideAvatar", init);
  txt("studentNaam", naam);
  txt("studentBedrijf", d.bedrijf_naam || "—");
  txt("studentOpleiding", d.opleiding_naam || "—");
  txt("studentIngediend", "Ingediend op " + formatDate(d.aangemaakt_op));

  txt("bedrijfNaam", d.bedrijf_naam);
  txt("bedrijfSector", d.sector);
  txt("bedrijfMentor", d.contact_naam);
  const emailMentor = document.getElementById("bedrijfEmail");
  if (emailMentor && d.contact_email) {
    emailMentor.textContent = d.contact_email;
    emailMentor.href = "mailto:" + d.contact_email;
  }

  const docentNaam = (d.docent_voornaam || d.docent_achternaam)
    ? `${d.docent_voornaam ?? ""} ${d.docent_achternaam ?? ""}`.trim()
    : "Nog niet toegekend";
  txt("stageDocent", docentNaam);
  txt("stageJaar", d.academiejaar_naam || "—");
  txt("stageStart", formatDate(d.startdatum));
  txt("stageEind", formatDate(d.einddatum));
  txt("stageWeken", berekenWeken(d.startdatum, d.einddatum));

  txt("detailNaam", naam);
  txt("detailLeeftijd", "—");
  txt("detailTel", "—");
  const emailStudent = document.getElementById("detailEmail");
  if (emailStudent && d.student_email) {
    emailStudent.textContent = d.student_email;
    emailStudent.href = "mailto:" + d.student_email;
  }

  txt("opdrachtTekst", d.omschrijving);
  txt("sideNaam", naam);
  const sideStatus = document.getElementById("sideStatus");
  if (sideStatus) sideStatus.innerHTML = statusBadge(d.status);

  txt("histIngediend", `${naam} · ${formatDateTime(d.aangemaakt_op)}`);
  txt("histBehandeling", `Automatisch · ${formatDateTime(d.aangemaakt_op)}`);

  if (d.docent_id) {
    const select = document.getElementById("docentSelect");
    if (select) {
      const interval = setInterval(() => {
        if (select.querySelector(`option[value="${d.docent_id}"]`)) {
          select.value = d.docent_id;
          clearInterval(interval);
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
    }
  }
}

async function laadDocenten() {
  try {
    const res = await fetch(`${API_BASE_URL}/gebruikers/docenten`, { headers: authHeaders() });
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
    console.error("Docenten laden fout:", err);
  }
}

function initBeslissing() {
  const opties = document.querySelectorAll(".beslissing-option[data-value]");
  let gekozen = null;

  opties.forEach(opt => {
    opt.addEventListener("click", () => {
      opties.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      gekozen = opt.dataset.value;
    });
  });

  document.getElementById("btnBeslissing")?.addEventListener("click", async () => {
    if (!gekozen) { alert("Selecteer eerst een beslissing."); return; }

    const id       = getStageId();
    const feedback = document.getElementById("feedbackText")?.value?.trim() || "";
    const docentId = document.getElementById("docentSelect")?.value || null;
    const beslissing = BESLISSING_MAP[gekozen];

    if (gekozen === "wijzigingen" && !feedback) {
      alert("Voeg een opmerking toe bij wijzigingen aanvragen."); return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/stages/${id}/beslissing`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ beslissing, opmerking: feedback, docent_id: docentId || null }),
      });
      const data = await res.json();
      if (!res.ok) { alert("Fout: " + (data.error || "onbekende fout")); return; }
      window.location.href = `../aanvragen/aanvragen.html`;
    } catch (err) {
      console.error("Beslissing versturen fout:", err);
      alert("Geen verbinding met server. Staat de backend aan?");
    }
  });
}