document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  try {
    // Haal stages op
    const res = await fetch(API_BASE + "/stages/mijn", {
      headers: { "Authorization": "Bearer " + token }
    });
    const stages = await res.json();

    if (!Array.isArray(stages) || stages.length === 0) {
      // Geen stage → naar het aanvraag formulier
      window.location.href = "../stage-aanvraag/stage-aanvraag.html";
      return;
    }

    // Meest relevante stage (zelfde prioriteit als dashboard)
    const PRIORITEIT = ["actief", "wacht_op_overeenkomst", "goedgekeurd", "aanpassingen_vereist", "afgekeurd", "ingediend", "in_beoordeling", "concept"];
    const stage = stages.slice().sort(function (a, b) {
      const pa = PRIORITEIT.indexOf(a.status);
      const pb = PRIORITEIT.indexOf(b.status);
      if (pa !== pb) return pa - pb;
      return new Date(b.aangemaakt_op) - new Date(a.aangemaakt_op);
    })[0];

    // Als niet goedgekeurd: redirect naar passende pagina
    if (stage.status === "afgerond") {
      window.location.href = "../stage-beoordeling/stage-afgerond/stage-afgerond.html";
      return;
    }
    if (stage.status === "aanpassingen_vereist") {
      window.location.href = "../stage-beoordeling/stage-aanpassingen/stage-aanpassingen.html";
      return;
    }
    if (stage.status === "afgekeurd") {
      window.location.href = "../stage-aanvraag/stage-aanvraag.html";
      return;
    }
    if (stage.status !== "goedgekeurd" && stage.status !== "actief" && stage.status !== "wacht_op_overeenkomst") {
      window.location.href = "../stage-aanvraag/stage-aanvraag.html?id=" + stage.id;
      return;
    }

    // Volledige detail ophalen voor docent + mentor namen
    let detail = stage;
    try {
      const detailRes = await fetch(API_BASE + "/stages/" + stage.id, {
        headers: { "Authorization": "Bearer " + token }
      });
      if (detailRes.ok) detail = await detailRes.json();
    } catch (e) {}

    vulPaginaIn(detail);
    await vulOvereenkomstKaart(token, detail.status);
    // Content pas tonen nu hij ingevuld is — voorkomt flits
    document.getElementById("mainContent").style.visibility = "visible";

  } catch (err) {
    console.error("Fout bij ophalen stage:", err);
  }
});

async function vulOvereenkomstKaart(token, stageStatus) {
  const subEl = document.getElementById("overeenkomstSubtitle");
  const badgeEl = document.getElementById("overeenkomstBadge");
  if (!subEl || !badgeEl) return;

  try {
    const res = await fetch(API_BASE + "/stages/overeenkomst-document", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) return;
    const d = await res.json();
    const tekens = d.ondertekenaars || [];
    const studentGetekend = tekens.some(t => t.rol === "Student" && t.status === "ondertekend");
    const mentorGetekend  = tekens.some(t => t.rol === "Stagementor" && t.status === "ondertekend");

    if (stageStatus === "actief" || (studentGetekend && mentorGetekend)) {
      subEl.textContent = "Ondertekend door alle partijen";
      badgeEl.textContent = "Ondertekend";
      badgeEl.className = "card-badge badge-green";
    } else if (studentGetekend && !mentorGetekend) {
      subEl.textContent = "Wacht op ondertekening van mentor";
      badgeEl.textContent = "In afwachting";
      badgeEl.className = "card-badge badge-orange";
    } else if (!studentGetekend && mentorGetekend) {
      subEl.textContent = "Mentor heeft getekend — jouw handtekening ontbreekt nog";
      badgeEl.textContent = "Actie nodig";
      badgeEl.className = "card-badge badge-orange";
    } else {
      subEl.textContent = "Nog niet ondertekend — vereist voor verzekering";
      badgeEl.textContent = "Actie nodig";
      badgeEl.className = "card-badge badge-orange";
    }
  } catch (e) {}
}

function vulPaginaIn(d) {
  const bedrijf = d.bedrijf_naam || "—";
  document.getElementById("bedrijfNaam").textContent = bedrijf;
  document.getElementById("tabelBedrijf").textContent = bedrijf;
  document.getElementById("tabelMentor").textContent = d.contact_naam || "—";

  const docent = (d.docent_voornaam || d.docent_achternaam)
    ? (d.docent_voornaam || "") + " " + (d.docent_achternaam || "")
    : "Nog niet toegekend";
  document.getElementById("tabelDocent").textContent = docent.trim();

  const start = formatShort(d.startdatum);
  const eind = formatShort(d.einddatum);
  const weken = berekenWeken(d.startdatum, d.einddatum);
  document.getElementById("tabelPeriode").textContent =
    start + " — " + eind + (weken ? " (" + weken + " weken)" : "");

  const statusEl = document.getElementById("tabelStatus");
  if (d.status === "actief") {
    statusEl.textContent = "Stage loopt";
    statusEl.className = "info-value status-success";
  } else if (d.status === "wacht_op_overeenkomst") {
    statusEl.textContent = "Wacht op ondertekening";
    statusEl.className = "info-value status-pending";
  } else {
    statusEl.textContent = "Goedgekeurd";
    statusEl.className = "info-value status-pending";
  }

  // Stagevoorstel kaart — link + datum
  const voorstelDatum = d.bijgewerkt_op || d.aangemaakt_op;
  document.getElementById("voorstelSub").textContent = "Goedgekeurd op " + formatLong(voorstelDatum);
  document.getElementById("kaartVoorstel").href = "../voorstel-bekijken/voorstel-bekijken.html";

  // Logboeken en evaluaties pas klikbaar als stage actief is
  const isActief = d.status === "actief";
  ["kaartLogboeken", "kaartEvaluaties"].forEach(function (id) {
    const kaart = document.getElementById(id);
    if (!kaart) return;
    const badge = kaart.querySelector(".card-badge");
    if (!isActief) {
      kaart.style.opacity = "0.55";
      kaart.style.cursor = "not-allowed";
      kaart.style.pointerEvents = "none";
    } else if (badge) {
      badge.textContent = "Actief";
      badge.classList.remove("badge-gray");
      badge.classList.add("badge-green");
    }
  });
}

function formatShort(d) {
  if (!d) return "—";
  const date = new Date(d);
  return String(date.getDate()).padStart(2, "0") + "/" +
    String(date.getMonth() + 1).padStart(2, "0") + "/" +
    date.getFullYear();
}

function formatLong(d) {
  if (!d) return "—";
  const date = new Date(d);
  const maanden = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  return date.getDate() + " " + maanden[date.getMonth()] + " " + date.getFullYear();
}

function berekenWeken(start, eind) {
  if (!start || !eind) return null;
  const ms = new Date(eind) - new Date(start);
  return Math.round(ms / (1000 * 60 * 60 * 24 * 7));
}
