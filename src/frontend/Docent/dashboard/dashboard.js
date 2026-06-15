const API_BASE_URL = "http://localhost:3000/api";
let allStages = [];
let currentFilter = "alle";

document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  // Sidebar user info
  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const name = user.name || "Docent";
  document.getElementById("userName").textContent = name;
  document.getElementById("userAvatar").textContent =
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  await laadStages();
  setupFilters();
});

async function laadStages() {
  try {
    const res = await fetch(API_BASE_URL + "/stages/docent/mijn", {
      headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    });
    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html";
      return;
    }
    allStages = await res.json();
    updateStats();
    renderList();
  } catch (err) {
    console.error("Stages ophalen fout:", err);
    document.getElementById("emptyState").style.display = "block";
  }
}

function updateStats() {
  const totaal = allStages.length;
  const actief = allStages.filter(s => s.status === "actief").length;
  const opstart = allStages.filter(s => s.status === "goedgekeurd" || s.status === "wacht_op_overeenkomst").length;
  const afgerond = allStages.filter(s => s.status === "afgerond").length;

  document.getElementById("statTotaal").textContent = totaal;
  document.getElementById("statActief").textContent = actief;
  document.getElementById("statOpstart").textContent = opstart;
  document.getElementById("statAfgerond").textContent = afgerond;
}

function renderList() {
  const container = document.getElementById("stagesList");
  const emptyState = document.getElementById("emptyState");

  let filtered = allStages;
  if (currentFilter === "actief") {
    filtered = allStages.filter(s => s.status === "actief");
  } else if (currentFilter === "goedgekeurd") {
    filtered = allStages.filter(s => s.status === "goedgekeurd" || s.status === "wacht_op_overeenkomst");
  } else if (currentFilter === "afgerond") {
    filtered = allStages.filter(s => s.status === "afgerond");
  }

  if (allStages.length === 0) {
    emptyState.style.display = "block";
    container.innerHTML = "";
    return;
  }

  emptyState.style.display = "none";
  container.innerHTML = "";

  filtered.forEach(s => {
    const naam = ((s.student_voornaam || "") + " " + (s.student_achternaam || "")).trim() || "Onbekend";
    const initialen = naam.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const card = document.createElement("a");
    card.href = "../../Commisie/stage-beoordeling/commissie.aanvraag-beoordeling.html?id=" + s.id;
    card.className = "stage-card";
    card.innerHTML =
      '<div class="student-avatar">' + initialen + '</div>' +
      '<div class="stage-info">' +
        '<div class="stage-student">' + naam + '</div>' +
        '<div class="stage-bedrijf">' + (s.bedrijf_naam || "—") + '</div>' +
        '<div class="stage-meta">' + formatDate(s.startdatum) + " — " + formatDate(s.einddatum) + '</div>' +
      '</div>' +
      '<div class="stage-status">' +
        '<span class="status-badge ' + s.status + '">' + getStatusText(s.status) + '</span>' +
      '</div>' +
      '<span class="stage-arrow">›</span>';
    container.appendChild(card);
  });
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

function getStatusText(status) {
  const map = {
    "goedgekeurd": "Goedgekeurd",
    "wacht_op_overeenkomst": "Wacht op overeenkomst",
    "actief": "Stage loopt",
    "afgerond": "Afgerond"
  };
  return map[status] || status;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-BE");
}
