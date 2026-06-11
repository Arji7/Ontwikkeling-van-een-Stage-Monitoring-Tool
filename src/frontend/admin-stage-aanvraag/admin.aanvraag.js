// ============================================================
//  admin.aanvraag-detail.js
//
//  Leest ?student=Naam+Achternaam uit de URL.
//  In productie vervang je de "database" hieronder door een
//  echte fetch() naar je backend API:
//
//    const res = await fetch(`/api/studenten/${encodeURIComponent(naam)}`);
//    const d   = await res.json();
//
// ============================================================

// ─── SIMULATIE DATABASE ──────────────────────────────────────
// Vervang dit object door een fetch() naar je echte backend.
const DB = {
  "Emma Johnson": {
    naam:         "Emma Johnson",
    bedrijf:      "Tech Solutions Inc.",
    opleiding:    "Bachelor 2de jaar · Toegepaste Informatica",
    ingediend:    "28 jan 2026",
    status:       "wachten op goedkeuring",
    bedrijfNaam:  "TechCorp BV",
    bedrijfSector:"Software ontwikkeling",
    mentor:       "Karen Wouters",
    mentorEmail:  "k.wouters@techcorp.be",
    docent:       "J. Martens",
    jaar:         "2025 – 2026",
    startDatum:   "03/02/2026",
    eindDatum:    "30/05/2026",
    weken:        "+ 17 weken",
    leeftijd:     "19",
    telefoon:     "+32 456 789 012",
    email:        "emma.johnson@ehb.be",
    opdracht:     "Ontwikkeling van een interne API voor het klantportaal. Focus op authenticatie, integratie met bestaande systemen en documentatie.",
    opdrachtSub:  "De student werkt binnen het development team en rapporteert wekelijks aan de stagementor. Er wordt gebruik gemaakt van agile methodes (Scrum) met tweewekelijkse sprints.",
  },
  "Michael Chen": {
    naam:         "Michael Chen",
    bedrijf:      "Digital Innovations",
    opleiding:    "Bachelor 3de jaar · Toegepaste Informatica",
    ingediend:    "01 jun 2026",
    status:       "wachten op goedkeuring",
    bedrijfNaam:  "Digital Innovations BV",
    bedrijfSector:"Data & AI",
    mentor:       "Tom Hendricks",
    mentorEmail:  "t.hendricks@digitalinno.be",
    docent:       "Prof. Davis",
    jaar:         "2025 – 2026",
    startDatum:   "15/02/2026",
    eindDatum:    "15/06/2026",
    weken:        "+ 17 weken",
    leeftijd:     "21",
    telefoon:     "+32 478 123 456",
    email:        "michael.chen@ehb.be",
    opdracht:     "Bouwen van een machine learning pipeline voor klantdata-analyse. Focus op data preprocessing, modeltraining en deployment.",
    opdrachtSub:  "De student werkt nauw samen met het data science team en presenteert tweewekelijks de voortgang aan de product owner.",
  },
  "Sarah Williams": {
    naam:         "Sarah Williams",
    bedrijf:      "Global Systems",
    opleiding:    "Bachelor 2de jaar · Toegepaste Informatica",
    ingediend:    "30 mei 2026",
    status:       "wachten op goedkeuring",
    bedrijfNaam:  "Global Systems NV",
    bedrijfSector:"Cloud & Infrastructuur",
    mentor:       "Pieter De Smet",
    mentorEmail:  "p.desmet@globalsystems.be",
    docent:       "Dr. Brown",
    jaar:         "2025 – 2026",
    startDatum:   "01/03/2026",
    eindDatum:    "31/05/2026",
    weken:        "+ 13 weken",
    leeftijd:     "20",
    telefoon:     "+32 491 654 321",
    email:        "sarah.williams@ehb.be",
    opdracht:     "Migratie van on-premise servers naar Azure cloud. Focus op security, kostenoptimalisatie en automatisering via CI/CD.",
    opdrachtSub:  "De student rapporteert aan de IT-manager en werkt samen met het infrastructuurteam.",
  },
  "James Miller": {
    naam:         "James Miller",
    bedrijf:      "Cloud Corp",
    opleiding:    "Bachelor 3de jaar · Toegepaste Informatica",
    ingediend:    "29 mei 2026",
    status:       "wachten op goedkeuring",
    bedrijfNaam:  "Cloud Corp BVBA",
    bedrijfSector:"SaaS & Cloud",
    mentor:       "An Claes",
    mentorEmail:  "a.claes@cloudcorp.be",
    docent:       "Prof. Wilson",
    jaar:         "2025 – 2026",
    startDatum:   "10/02/2026",
    eindDatum:    "10/06/2026",
    weken:        "+ 17 weken",
    leeftijd:     "22",
    telefoon:     "+32 469 987 654",
    email:        "james.miller@ehb.be",
    opdracht:     "Ontwikkeling van een multi-tenant SaaS dashboard voor klantbeheer. Gebruik van React en Node.js.",
    opdrachtSub:  "De student is onderdeel van het productteam en neemt deel aan dagelijkse stand-ups.",
  },
  "Lisa Anderson": {
    naam:         "Lisa Anderson",
    bedrijf:      "Data Analytics Ltd",
    opleiding:    "Bachelor 2de jaar · Toegepaste Informatica",
    ingediend:    "28 mei 2026",
    status:       "Veranderingen Vereist",
    bedrijfNaam:  "Data Analytics Ltd",
    bedrijfSector:"Business Intelligence",
    mentor:       "Marc Leclercq",
    mentorEmail:  "m.leclercq@dataanalytics.be",
    docent:       "Dr. Martinez",
    jaar:         "2025 – 2026",
    startDatum:   "01/04/2026",
    eindDatum:    "30/06/2026",
    weken:        "+ 13 weken",
    leeftijd:     "19",
    telefoon:     "+32 477 321 987",
    email:        "lisa.anderson@ehb.be",
    opdracht:     "Opzetten van een BI-dashboard in Power BI gekoppeld aan een SQL-datawarehouse.",
    opdrachtSub:  "De student werkt zelfstandig onder begeleiding van de data-analist en presenteert wekelijks resultaten.",
  },
  "Achraf Ramdani": {
    naam:         "Achraf Ramdani",
    bedrijf:      "Microsoft",
    opleiding:    "Bachelor 3de jaar · Toegepaste Informatica",
    ingediend:    "01 feb 2026",
    status:       "Active",
    bedrijfNaam:  "Microsoft Belgium",
    bedrijfSector:"Software ontwikkeling",
    mentor:       "Sophie Verstraeten",
    mentorEmail:  "s.verstraeten@microsoft.com",
    docent:       "J. Martens",
    jaar:         "2025 – 2026",
    startDatum:   "01/02/2026",
    eindDatum:    "30/05/2026",
    weken:        "+ 17 weken",
    leeftijd:     "19",
    telefoon:     "+32 499 111 222",
    email:        "achraf.ramdani@ehb.be",
    opdracht:     "Bijdrage aan de ontwikkeling van interne tooling voor het Azure-platform. Focus op performantie en testautomatisering.",
    opdrachtSub:  "De student werkt in een internationaal team en volgt de Agile werkwijze van Microsoft.",
  },
};
// ─────────────────────────────────────────────────────────────

// Hulpfuncties
function initialen(naam) {
  return naam.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function txt(id, waarde) {
  const el = document.getElementById(id);
  if (el) el.textContent = waarde ?? "—";
}

function statusBadge(status) {
  const n = status.toLowerCase();
  if (n === "wachten op goedkeuring")      return `<span class="badge badge-pending">${status}</span>`;
  if (n.includes("verandering"))           return `<span class="badge badge-changes">${status}</span>`;
  if (n === "active")                      return `<span class="badge badge-active">Active</span>`;
  if (n === "completed")                   return `<span class="badge badge-completed">Completed</span>`;
  return `<span class="badge">${status}</span>`;
}

// Hoofdfunctie: haal student op en vul pagina
async function laadStudent() {
  const params = new URLSearchParams(window.location.search);
  const naam   = params.get("student");

  if (!naam) {
    txt("studentNaam", "Geen student opgegeven");
    return;
  }

  // ── Hier wissel je de DB-lookup uit voor een echte API-call: ──
  // const res = await fetch(`/api/studenten/${encodeURIComponent(naam)}`);
  // const d   = await res.json();
  const d = DB[naam];
  // ──────────────────────────────────────────────────────────────

  if (!d) {
    txt("studentNaam", naam + " – niet gevonden in database");
    return;
  }

  // Paginatitel in browser-tab
  document.title = `${d.naam} – Admin | StageMonitor`;

  // Avatar initialen
  const init = initialen(d.naam);
  txt("studentAvatar", init);
  txt("sideAvatar",    init);

  // Student kop
  txt("studentNaam",      d.naam);
  txt("studentBedrijf",   d.bedrijf);
  txt("studentOpleiding", d.opleiding);
  txt("studentIngediend", "Ingediend op " + d.ingediend);

  // Bedrijfsgegevens
  txt("bedrijfNaam",   d.bedrijfNaam);
  txt("bedrijfSector", d.bedrijfSector);
  txt("bedrijfMentor", d.mentor);
  const emailMentor = document.getElementById("bedrijfEmail");
  if (emailMentor) { emailMentor.textContent = d.mentorEmail; emailMentor.href = "mailto:" + d.mentorEmail; }

  // Stagegegevens
  txt("stageDocent", d.docent);
  txt("stageJaar",   d.jaar);
  txt("stageStart",  d.startDatum);
  txt("stageEind",   d.eindDatum);
  txt("stageWeken",  d.weken);

  // Studentgegevens
  txt("detailNaam",     d.naam);
  txt("detailLeeftijd", d.leeftijd);
  txt("detailTel",      d.telefoon);
  const emailStudent = document.getElementById("detailEmail");
  if (emailStudent) { emailStudent.textContent = d.email; emailStudent.href = "mailto:" + d.email; }

  // Beschrijving
  txt("opdrachtTekst", d.opdracht);
  txt("opdrachtSub",   d.opdrachtSub);

  // Rechterkolom
  txt("sideNaam", d.naam);
  const sideStatus = document.getElementById("sideStatus");
  if (sideStatus) sideStatus.innerHTML = statusBadge(d.status);

  // Geschiedenis timestamps
  txt("histIngediend",   `${d.naam} · ${d.ingediend}, 14:32`);
  txt("histBehandeling", `Automatisch · ${d.ingediend}, 14:32`);
}

// Beslissing knoppen
function initBeslissing() {
  const opties = document.querySelectorAll(".beslissing-option[data-value]");
  let gekozen  = null;

  opties.forEach(opt => {
    opt.addEventListener("click", () => {
      opties.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      gekozen = opt.dataset.value;
    });
  });

  document.getElementById("btnBeslissing")?.addEventListener("click", () => {
    if (!gekozen) { alert("Selecteer eerst een beslissing."); return; }
    const feedback = document.getElementById("feedbackText")?.value?.trim();
    const bericht  = `Beslissing verstuurd: ${gekozen}` + (feedback ? `\nFeedback: ${feedback}` : "");
    alert(bericht);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  laadStudent();
  initBeslissing();
});