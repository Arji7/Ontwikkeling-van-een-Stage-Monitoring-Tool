const API_BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  try {
    // Haal stages op
    const res = await fetch(API_BASE_URL + "/stages/mijn", {
      headers: { "Authorization": "Bearer " + token }
    });
    const stages = await res.json();

    if (!Array.isArray(stages) || stages.length === 0) {
      // Geen stage → terug naar dashboard
      window.location.href = "../empty-stage/empty-stage.html";
      return;
    }

    // Meest relevante stage (zelfde prioriteit als dashboard)
    const PRIORITEIT = ["goedgekeurd", "aanpassingen_vereist", "afgekeurd", "ingediend", "in_beoordeling", "concept"];
    const stage = stages.slice().sort(function (a, b) {
      const pa = PRIORITEIT.indexOf(a.status);
      const pb = PRIORITEIT.indexOf(b.status);
      if (pa !== pb) return pa - pb;
      return new Date(b.aangemaakt_op) - new Date(a.aangemaakt_op);
    })[0];

    // Als niet goedgekeurd: redirect naar passende pagina
    if (stage.status === "aanpassingen_vereist") {
      window.location.href = "../stage-beoordeling/stage-aanpassingen/stage-aanpassingen.html";
      return;
    }
    if (stage.status !== "goedgekeurd" && stage.status !== "actief" && stage.status !== "wacht_op_overeenkomst") {
      window.location.href = "../stage-aanvraag/stage-aanvraag.html?id=" + stage.id;
      return;
    }

    // Volledige detail ophalen voor docent + mentor namen
    let detail = stage;
    try {
      const detailRes = await fetch(API_BASE_URL + "/stages/" + stage.id, {
        headers: { "Authorization": "Bearer " + token }
      });
      if (detailRes.ok) detail = await detailRes.json();
    } catch (e) {}

    vulPaginaIn(detail);

  } catch (err) {
    console.error("Fout bij ophalen stage:", err);
  }
});

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
    statusEl.textContent = "Goedgekeurd — wacht op overeenkomst";
    statusEl.className = "info-value status-success";
  } else {
    statusEl.textContent = "Goedgekeurd — wacht op overeenkomst";
    statusEl.className = "info-value status-success";
  }

  // Stagevoorstel kaart — link + datum
  const voorstelDatum = d.bijgewerkt_op || d.aangemaakt_op;
  document.getElementById("voorstelSub").textContent = "Goedgekeurd op " + formatLong(voorstelDatum);
  document.getElementById("kaartVoorstel").href = "../stage-beoordeling/stage-goedgekeurd/stage-goedgekeurd.html";
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
