// ============================================================
// sidebar-lock.js
// Vergrendelt de "Logboeken" link in de sidebar als de student
// geen actieve/goedgekeurde stage heeft. Wordt door alle student
// pagina's geïnclude.
// ============================================================

(async function () {
  var token = localStorage.getItem("token");
  if (!token) return;

  try {
    var res = await fetch("http://localhost:3000/api/logboeken/mijn/overzicht", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) return;
    var data = await res.json();

    // Wel actieve stage → niets te doen
    if (data && data.stage_id) return;

    // Geen actieve stage → vervang Logboeken link door locked span
    var links = document.querySelectorAll(".sidebar-nav a.nav-item");
    links.forEach(function (link) {
      if (link.textContent.trim() === "Logboeken") {
        var locked = document.createElement("span");
        locked.className = "nav-item locked";
        locked.innerHTML = 'Logboeken <span class="lock">🔒</span>';
        link.parentNode.replaceChild(locked, link);
      }
    });
  } catch (err) {
    console.error("Sidebar lock check fout:", err);
  }
})();
