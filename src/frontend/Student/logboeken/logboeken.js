var API_BASE_URL = "http://localhost:3000/api";
var allLogboeken = [];
var currentFilter = "alle";
var TOTAAL_WEKEN = 14;

document.addEventListener("DOMContentLoaded", function () {
  var token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  var user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  laadLogboeken();
  setupFilters();
});

function authHeaders() {
  return { "Authorization": "Bearer " + localStorage.getItem("token") };
}

async function laadLogboeken() {
  try {
    var res = await fetch(API_BASE_URL + "/logboeken/mijn", { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html";
      return;
    }
    allLogboeken = await res.json();
    updateStats();
    renderList();
  } catch (err) {
    console.error("Logboeken ophalen fout:", err);
    document.getElementById("emptyState").style.display = "block";
  }
}

function updateStats() {
  var ingediend = allLogboeken.filter(function (l) { return l.status !== "concept"; }).length;
  var goedgekeurd = allLogboeken.filter(function (l) { return l.status === "goedgekeurd"; }).length;
  var wacht = allLogboeken.filter(function (l) { return l.status === "ingediend" || l.status === "wacht_op_mentor"; }).length;
  var nog = TOTAAL_WEKEN - ingediend;

  document.getElementById("statIngediend").textContent = ingediend + "/" + TOTAAL_WEKEN;
  document.getElementById("statGoedgekeurd").textContent = goedgekeurd;
  document.getElementById("statWacht").textContent = wacht;
  document.getElementById("statNog").textContent = nog;

  // Filter counts
  document.getElementById("filterAlle").textContent = allLogboeken.length;
  document.getElementById("filterGoedgekeurd").textContent = goedgekeurd;
  document.getElementById("filterWacht").textContent = wacht;

  // Volgende week berekenen
  var volgendeWeek = allLogboeken.length > 0
    ? Math.max.apply(null, allLogboeken.map(function (l) { return l.week_nummer; })) + 1
    : 1;

  // Deadline banner
  if (volgendeWeek <= TOTAAL_WEKEN) {
    var banner = document.getElementById("deadlineBanner");
    var btn = document.getElementById("deadlineBtn");
    btn.textContent = "+ Logboek week " + volgendeWeek;
    btn.href = "logboek-form.html?week=" + volgendeWeek;
    document.getElementById("deadlineText").textContent =
      "Volgende logboek (week " + volgendeWeek + ") staat klaar om in te vullen.";
    banner.style.display = "flex";
  }

  // Empty state button
  var emptyBtn = document.getElementById("emptyBtn");
  emptyBtn.textContent = "+ Logboek week " + volgendeWeek + " invullen";
  emptyBtn.href = "logboek-form.html?week=" + volgendeWeek;
}

function renderList() {
  var container = document.getElementById("logboekList");
  var emptyState = document.getElementById("emptyState");
  var filterTabs = document.getElementById("filterTabs");

  var filtered = allLogboeken;
  if (currentFilter === "goedgekeurd") {
    filtered = allLogboeken.filter(function (l) { return l.status === "goedgekeurd"; });
  } else if (currentFilter === "wacht") {
    filtered = allLogboeken.filter(function (l) { return l.status === "ingediend" || l.status === "wacht_op_mentor"; });
  }

  if (allLogboeken.length === 0) {
    emptyState.style.display = "block";
    filterTabs.style.display = "none";
    container.innerHTML = "";
    return;
  }

  emptyState.style.display = "none";
  filterTabs.style.display = "flex";

  // Sorteer op week_nummer DESC
  filtered.sort(function (a, b) { return b.week_nummer - a.week_nummer; });

  container.innerHTML = "";
  filtered.forEach(function (logboek) {
    var card = document.createElement("div");
    card.className = "logboek-card";
    card.onclick = function () {
      if (logboek.status === "concept") {
        window.location.href = "logboek-form.html?id=" + logboek.id;
      } else {
        window.location.href = "logboek-form.html?id=" + logboek.id + "&readonly=1";
      }
    };

    var statusText = getStatusText(logboek.status);
    var statusClass = logboek.status;
    var dagenInfo = logboek.aantal_dagen ? logboek.aantal_dagen + " dagen ingevuld" : "";
    var urenInfo = logboek.totaal_dag_uren ? logboek.totaal_dag_uren + "u" : "";
    var datumRange = formatDate(logboek.datum_van) + " — " + formatDate(logboek.datum_tot);

    card.innerHTML =
      '<div class="week-badge">' +
        '<span class="week-badge-num">' + logboek.week_nummer + '</span>' +
        '<span class="week-badge-label">Week</span>' +
      '</div>' +
      '<div class="logboek-info">' +
        '<div class="logboek-title">' + (logboek.titel || ("Week " + logboek.week_nummer)) + '</div>' +
        '<div class="logboek-desc">' + (logboek.uitgevoerde_taken || "").substring(0, 80) + '</div>' +
        '<div class="logboek-meta">' +
          '<span>' + datumRange + '</span>' +
          (urenInfo ? ' · <span>' + urenInfo + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="logboek-status">' +
        (dagenInfo ? '<span class="status-badge dagen-invullen">' + dagenInfo + '</span>' : '') +
        '<span class="status-badge ' + statusClass + '">' + statusText + '</span>' +
      '</div>' +
      '<span class="logboek-arrow">›</span>';

    container.appendChild(card);
  });
}

function setupFilters() {
  var tabs = document.querySelectorAll(".filter-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      currentFilter = tab.getAttribute("data-filter");
      renderList();
    });
  });
}

function getStatusText(status) {
  var map = {
    "concept": "Concept",
    "ingediend": "Wacht op mentor",
    "wacht_op_mentor": "Wacht op mentor",
    "goedgekeurd": "Goedgekeurd"
  };
  return map[status] || status;
}

function formatDate(d) {
  if (!d) return "—";
  var date = new Date(d);
  var dag = date.getDate();
  var maanden = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return dag + " " + maanden[date.getMonth()];
}
