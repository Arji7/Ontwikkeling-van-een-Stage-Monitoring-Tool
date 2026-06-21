const API_BASE_URL = window.location.origin + "/api";
let allStages = [];
let currentFilter = "alle";

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) { window.location.href = "../../inloggen/inloggen.html"; return; }

  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const name = user.name || "Docent";
  document.getElementById("userName").textContent = name;
  document.getElementById("userAvatar").textContent =
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  await laadStages();
  setupFilters();
  setupZoek();
});

function authHeader() {
  return { "Authorization": "Bearer " + sessionStorage.getItem("token") };
}

async function laadStages() {
  try {
    const res = await fetch(API_BASE_URL + "/stages/docent/mijn", { headers: authHeader() });
    if (!res.ok) return;
    allStages = await res.json();
    updateCounts();
    renderList();
  } catch (err) {
    console.error("Stages ophalen fout:", err);
    document.getElementById("emptyState").style.display = "block";
  }
}

function updateCounts() {
  document.getElementById("cntAlle").textContent = allStages.length;
  document.getElementById("cntActief").textContent = allStages.filter(s => s.status === "actief").length;
  document.getElementById("cntWacht").textContent = allStages.filter(s => s.status === "goedgekeurd" || s.status === "wacht_op_overeenkomst").length;
  document.getElementById("cntAfgerond").textContent = allStages.filter(s => s.status === "afgerond").length;
}

function renderList() {
  const tbody = document.getElementById("studentenList");
  const empty = document.getElementById("emptyState");
  const zoek = (document.getElementById("searchInput").value || "").toLowerCase();

  let filtered = allStages;
  if (currentFilter === "actief") {
    filtered = filtered.filter(s => s.status === "actief");
  } else if (currentFilter === "goedgekeurd") {
    filtered = filtered.filter(s => s.status === "goedgekeurd" || s.status === "wacht_op_overeenkomst");
  } else if (currentFilter === "afgerond") {
    filtered = filtered.filter(s => s.status === "afgerond");
  }

  if (zoek) {
    filtered = filtered.filter(s => {
      const naam = ((s.student_voornaam || "") + " " + (s.student_achternaam || "")).toLowerCase();
      const bedrijf = (s.bedrijf_naam || "").toLowerCase();
      return naam.includes(zoek) || bedrijf.includes(zoek);
    });
  }

  if (allStages.length === 0) {
    empty.style.display = "block";
    tbody.innerHTML = "";
    return;
  }

  empty.style.display = "none";
  tbody.innerHTML = "";

  filtered.forEach(s => {
    const naam = ((s.student_voornaam || "") + " " + (s.student_achternaam || "")).trim();
    const initialen = naam.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const v = berekenVoortgang(s.startdatum, s.einddatum);
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td><div class="student-cell">' +
        '<div class="avatar">' + initialen + '</div>' +
        '<div>' +
          '<div class="student-name">' + naam + '</div>' +
          '<div class="student-sub">' + (s.student_email || "") + '</div>' +
        '</div>' +
      '</div></td>' +
      '<td>' + (s.bedrijf_naam || "—") + '</td>' +
      '<td>' +
        '<div class="voortgang-wrap">' +
          '<span class="voortgang-label">' + v.label + '</span>' +
          '<div class="voortgang-bar"><div class="voortgang-fill" style="width:' + v.pct + '%"></div></div>' +
        '</div>' +
      '</td>' +
      '<td><span class="status-tag ' + s.status + '">' + statusText(s.status) + '</span></td>' +
      '<td><a class="btn-bekijk" href="../student-detail/student-detail.html?id=' + s.id + '">Bekijk</a></td>';
    tbody.appendChild(tr);
  });
}

function berekenVoortgang(start, eind) {
  if (!start || !eind) return { label: "—", pct: 0 };
  const totaal = (new Date(eind) - new Date(start)) / (1000*60*60*24*7);
  const verstreken = (new Date() - new Date(start)) / (1000*60*60*24*7);
  const huidig = Math.max(0, Math.min(Math.round(verstreken), Math.round(totaal)));
  const pct = Math.min(100, (huidig / totaal) * 100);
  return { label: "Week " + huidig + " / " + Math.round(totaal), pct };
}

function statusText(s) {
  return { "actief":"Actief", "goedgekeurd":"Wacht op goedkeuring",
           "wacht_op_overeenkomst":"Wacht op goedkeuring", "afgerond":"Afgerond" }[s] || s;
}

function setupFilters() {
  document.querySelectorAll(".filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.getAttribute("data-filter");
      renderList();
    });
  });
}

function setupZoek() {
  document.getElementById("searchInput").addEventListener("input", renderList);
}
