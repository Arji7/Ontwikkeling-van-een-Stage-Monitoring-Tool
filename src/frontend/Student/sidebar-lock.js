// ============================================================
// sidebar-lock.js
// Vergrendelt Logboeken én Evaluaties als de student geen
// actieve stage heeft. Beide worden klikbaar zodra de stage
// op status 'actief' staat.
// ============================================================

(async function () {
  var token = sessionStorage.getItem("token");
  if (!token) return;

  try {
    var res = await fetch(API_BASE + "/logboeken/mijn/overzicht", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) return;
    var data = await res.json();

    var heeftActieveStage = !!(data && data.stage_id);
    if (heeftActieveStage) return;

    var teLocken = ["Logboeken", "Evaluaties"];
    var links = document.querySelectorAll(".sidebar-nav a.nav-item");
    links.forEach(function (link) {
      var label = link.textContent.trim();
      if (teLocken.indexOf(label) === -1) return;
      var locked = document.createElement("span");
      locked.className = "nav-item locked";
      locked.innerHTML = label + ' <span class="lock">🔒</span>';
      link.parentNode.replaceChild(locked, link);
    });
  } catch (err) {
    console.error("Sidebar lock check fout:", err);
  }
})();
