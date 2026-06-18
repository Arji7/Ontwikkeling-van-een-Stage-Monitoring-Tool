const API_BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const fullName = user.name || "Docent";
  const voornaam = fullName.split(" ")[0];
  document.getElementById("welkomNaam").textContent = voornaam;
  document.getElementById("userName").textContent = fullName;
  document.getElementById("userAvatar").textContent =
    fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  await Promise.all([laadStages(), laadTaken()]);
});

function authHeader() {
  return { "Authorization": "Bearer " + sessionStorage.getItem("token") };
}

async function laadStages() {
  try {
    const res = await fetch(API_BASE_URL + "/stages/docent/mijn", { headers: authHeader() });
    if (!res.ok) return;
    const stages = await res.json();

    const actief = stages.filter(s => s.status === "actief").length;
    const afgerond = stages.filter(s => s.status === "afgerond").length;
    const totaalStudenten = stages.length;

    document.getElementById("aantalStudenten").textContent = totaalStudenten;
    document.getElementById("statActief").textContent = actief;
    document.getElementById("statAfgerondSub").textContent = afgerond + " afgerond";
  } catch (err) {
    console.error("Stages ophalen fout:", err);
  }
}

async function laadTaken() {
  try {
    const res = await fetch(API_BASE_URL + "/logboeken/docent/te-beoordelen", { headers: authHeader() });
    if (!res.ok) return;
    const taken = await res.json();

    // Tellingen
    const aantal = taken.length;
    const uniekeStudenten = new Set(taken.map(t => t.student_voornaam + " " + t.student_achternaam)).size;
    document.getElementById("statLogboeken").textContent = aantal;
    document.getElementById("statLogboekenSub").textContent = "van " + uniekeStudenten + " studenten";

    // Lijst
    const lijst = document.getElementById("takenList");
    const empty = document.getElementById("emptyState");
    if (taken.length === 0) {
      empty.style.display = "block";
      return;
    }

    lijst.innerHTML = "";
    taken.forEach(t => {
      const naam = ((t.student_voornaam || "") + " " + (t.student_achternaam || "")).trim();
      const datum = t.ingediend_op ? formatDate(t.ingediend_op) : "—";
      const item = document.createElement("a");
      item.className = "taak-item";
      item.href = "../logboek-inkijken/logboek-inkijken.html?id=" + t.id;
      item.innerHTML =
        '<div class="taak-icon">📄</div>' +
        '<div class="taak-info">' +
          '<div class="taak-titel">Logboek week ' + t.week_nummer + ' — ' + naam + '</div>' +
          '<div class="taak-meta">Ingediend op ' + datum + '</div>' +
        '</div>' +
        '<button class="btn btn-primary">Bekijken</button>';
      lijst.appendChild(item);
    });
  } catch (err) {
    console.error("Taken ophalen fout:", err);
  }
}

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  const maanden = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
  return date.getDate() + " " + maanden[date.getMonth()];
}
