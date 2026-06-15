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

  } catch (err) {
    console.error("Logboek ophalen fout:", err);
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
