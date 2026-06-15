// ============================================================
// sidebar-lock.js
// Beheert Logboeken en Evaluaties links in de sidebar:
//  - Geen actieve stage → beide gelocked (🔒)
//  - Wel actieve stage → beide klikbaar
//    (Evaluaties toont 'binnenkort beschikbaar' tot het scherm bestaat)
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

    if (heeftActieveStage) {
      // Stage is actief → Evaluaties ontgrendelen
      var lockedItems = document.querySelectorAll(".sidebar-nav span.nav-item.locked");
      lockedItems.forEach(function (item) {
        if (item.textContent.trim().startsWith("Evaluaties")) {
          var link = document.createElement("a");
          link.href = "#";
          link.className = "nav-item";
          link.textContent = "Evaluaties";
          link.onclick = function (e) {
            e.preventDefault();
            alert("De evaluaties pagina is binnenkort beschikbaar.");
          };
          item.parentNode.replaceChild(link, item);
        }
      });
      return;
    }

    // Geen actieve stage → vergrendel Logboeken (Evaluaties is al locked in HTML)
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
