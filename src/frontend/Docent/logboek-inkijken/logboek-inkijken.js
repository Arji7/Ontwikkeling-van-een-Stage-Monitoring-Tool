const API_BASE_URL = "http://localhost:3000/api";
const DAGEN_NAMEN = ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"];

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) { window.location.href = "../../inloggen/inloggen.html"; return; }

  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const name = user.name || "Docent";
  document.getElementById("userName").textContent = name;
  document.getElementById("userAvatar").textContent =
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const params = new URLSearchParams(window.location.search);
  const logboekId = params.get("id");
  if (!logboekId) { window.location.href = "../mijn-studenten/mijn-studenten.html"; return; }

  await laadLogboek(logboekId);
});

function authHeader() {
  return { "Authorization": "Bearer " + sessionStorage.getItem("token") };
}

async function laadLogboek(id) {
  try {
    const res = await fetch(API_BASE_URL + "/logboeken/" + id, { headers: authHeader() });
    if (!res.ok) {
      alert("Kan logboek niet ophalen");
      return;
    }
    const lb = await res.json();

    // Stage info ophalen voor student naam + bedrijf + mentor
    const stageRes = await fetch(API_BASE_URL + "/stages/" + lb.stage_id, { headers: authHeader() });
    const stage = stageRes.ok ? await stageRes.json() : {};

    const studentNaam = ((stage.student_voornaam || "") + " " + (stage.student_achternaam || "")).trim() || "student";
    const studentVoornaam = stage.student_voornaam || "student";

    // Header
    document.getElementById("bcrStudent").textContent = studentNaam;
    document.getElementById("bcrStudent").href = "../student-detail/student-detail.html?id=" + lb.stage_id;
    document.getElementById("bcrLogboeken").href = "../student-detail/student-detail.html?id=" + lb.stage_id + "#logboeken";
    document.getElementById("bcrWeek").textContent = "Week " + lb.week_nummer;
    document.getElementById("logboekTitel").textContent = "Logboek week " + lb.week_nummer;
    document.getElementById("logboekSubtitle").textContent =
      formatLong(lb.datum_van) + " — " + formatLong(lb.datum_tot) +
      " · ingediend door " + studentVoornaam + " op " + formatLong(lb.ingediend_op);

    // Meta bar
    document.getElementById("metaPeriode").textContent = formatKort(lb.datum_van) + "-" + formatKort(lb.datum_tot);
    document.getElementById("metaUren").textContent = (lb.totaal_dag_uren || 0);
    document.getElementById("metaDagen").textContent = (lb.dagen ? lb.dagen.filter(d => !d.is_afwezig).length : 0) + "/" + (lb.dagen ? lb.dagen.length : 5);
    document.getElementById("metaBedrijf").textContent = stage.bedrijf_naam || "—";
    document.getElementById("metaMentor").textContent = stage.contact_naam || "—";

    // Mentor banner
    if (lb.status === "goedgekeurd" && lb.mentor_feedback) {
      document.getElementById("mentorNaam").textContent = stage.contact_naam || "mentor";
      document.getElementById("mentorDatum").textContent = formatLong(lb.bijgewerkt_op || lb.ingediend_op);
      document.getElementById("mentorOpmerking").textContent = lb.mentor_feedback;
      document.getElementById("mentorBanner").style.display = "block";
    }

    // Dagen
    renderDagen(lb.dagen || [], lb.competenties || []);

    // Reflectie
    if (lb.uitgevoerde_taken || lb.leerpunten) {
      document.getElementById("reflectieStudent").textContent = studentVoornaam;
      document.getElementById("reflectieTekst").textContent = lb.uitgevoerde_taken || "—";
      if (lb.leerpunten) {
        document.getElementById("leerpuntenTekst").textContent = lb.leerpunten;
        document.getElementById("leerpuntenSection").style.display = "block";
      }
      document.getElementById("reflectieCard").style.display = "block";
    }

    // Opmerking mentor
    if (lb.mentor_feedback) {
      document.getElementById("opmerkingTekst").textContent = lb.mentor_feedback;
      document.getElementById("opmerkingCard").style.display = "block";
    }

    // Bestanden
    renderBestanden(lb.bestanden || []);

    // Reacties
    renderReacties(lb.reacties || []);

    // Docent acties tonen als logboek nog niet goedgekeurd is
    if (lb.status !== "goedgekeurd") {
      document.getElementById("docentActies").style.display = "block";
    }

    window._logboekId = id;

  } catch (err) {
    console.error("Logboek ophalen fout:", err);
  }
}

function renderBestanden(bestanden) {
  if (bestanden.length === 0) return;
  document.getElementById("bestandenCard").style.display = "block";
  const lijst = document.getElementById("bestandenList");
  lijst.innerHTML = "";
  bestanden.forEach(b => {
    const el = document.createElement("a");
    el.className = "bestand-item";
    el.href = API_BASE_URL.replace("/api", "") + "/uploads/logboeken/" + b.bestandsnaam;
    el.target = "_blank";
    const grootte = b.bestandsgrootte < 1024 * 1024
      ? Math.round(b.bestandsgrootte / 1024) + " KB"
      : (b.bestandsgrootte / (1024 * 1024)).toFixed(1) + " MB";
    el.innerHTML =
      '<span class="bestand-icon">📄</span>' +
      '<span class="bestand-naam">' + (b.origineel_naam || b.bestandsnaam) + '</span>' +
      '<span class="bestand-grootte">' + grootte + '</span>';
    lijst.appendChild(el);
  });
}

function renderReacties(reacties) {
  const lijst = document.getElementById("reactiesList");
  const empty = document.getElementById("reactieEmpty");
  lijst.innerHTML = "";
  if (reacties.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  reacties.forEach(r => {
    const naam = ((r.voornaam || "") + " " + (r.achternaam || "")).trim();
    const datum = formatLong(r.aangemaakt_op);
    const el = document.createElement("div");
    el.className = "reactie-item";
    el.innerHTML =
      '<div class="reactie-header">' +
        '<strong>' + naam + '</strong>' +
        '<span class="reactie-datum">' + datum + '</span>' +
      '</div>' +
      '<p class="reactie-tekst">' + r.reactie + '</p>';
    lijst.appendChild(el);
  });
}

async function plaatsReactie() {
  const tekst = document.getElementById("feedbackTekst").value.trim();
  if (!tekst) return alert("Schrijf eerst een reactie.");
  try {
    const res = await fetch(API_BASE_URL + "/logboeken/" + window._logboekId + "/reactie", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ reactie: tekst })
    });
    if (!res.ok) { const d = await res.json(); return alert(d.error || "Fout"); }
    document.getElementById("feedbackTekst").value = "";
    await laadLogboek(window._logboekId);
  } catch (err) {
    console.error("Reactie fout:", err);
    alert("Er ging iets mis.");
  }
}

async function keurGoed() {
  const feedback = document.getElementById("feedbackTekst").value.trim();
  if (!confirm("Weet je zeker dat je dit logboek wilt goedkeuren?")) return;
  try {
    const res = await fetch(API_BASE_URL + "/logboeken/" + window._logboekId + "/goedkeuren", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ mentor_feedback: feedback || null })
    });
    if (!res.ok) { const d = await res.json(); return alert(d.error || "Fout"); }
    alert("Logboek goedgekeurd!");
    await laadLogboek(window._logboekId);
  } catch (err) {
    console.error("Goedkeuren fout:", err);
    alert("Er ging iets mis.");
  }
}

function renderDagen(dagen, competenties) {
  const lijst = document.getElementById("dagenList");
  lijst.innerHTML = "";
  dagen.forEach(d => {
    const datum = new Date(d.datum);
    const dagNaam = DAGEN_NAMEN[datum.getDay()];
    const dagDatum = datum.getDate() + " " + ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"][datum.getMonth()];

    const card = document.createElement("div");
    card.className = "dag-card";

    if (d.is_afwezig) {
      card.innerHTML =
        '<div><div class="dag-naam">' + dagNaam + '</div><div class="dag-datum">' + dagDatum + '</div></div>' +
        '<div class="dag-uren">—</div>' +
        '<div class="dag-content"><span class="dag-afwezig">Afwezig (' + (d.afwezig_reden || "—") + ')</span></div>' +
        '<div></div>';
    } else {
      const compsHtml = competenties.slice(0, 2).map(c =>
        '<span class="comp-chip">' + c.naam + '</span>').join("");
      card.innerHTML =
        '<div><div class="dag-naam">' + dagNaam + '</div><div class="dag-datum">' + dagDatum + '</div></div>' +
        '<div class="dag-uren">' + (d.uren_gewerkt || 0) + 'u</div>' +
        '<div class="dag-content">' +
          '<div class="dag-taken">' + (d.uitgevoerde_taken || "—") + '</div>' +
          (compsHtml ? '<div class="dag-comps">' + compsHtml + '</div>' : "") +
        '</div>' +
        '<div class="dag-locatie">Op kantoor</div>';
    }
    lijst.appendChild(card);
  });
}

function formatKort(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.getDate() + "-" + (date.getMonth() + 1);
}

function formatLong(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" });
}
