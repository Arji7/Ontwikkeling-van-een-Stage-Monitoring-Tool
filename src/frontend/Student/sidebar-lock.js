// ============================================================
// sidebar-lock.js
// Beheert alleen de Logboeken-link in de sidebar:
//  - Geen actieve stage → Logboeken vergrendeld (🔒)
//  - Wel actieve stage  → Logboeken klikbaar
// Evaluaties is altijd klikbaar (rechtstreeks in de HTML).
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

    if (heeftActieveStage) return; // Logboeken blijft klikbaar

    // Geen actieve stage → vergrendel Logboeken
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
