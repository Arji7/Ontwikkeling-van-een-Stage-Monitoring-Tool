const API_BASE_URL = API_BASE;

const SCORE_LABELS = ["", "Onvoldoende", "Zwak", "Voldoende", "Goed", "Uitmuntend"];
const SCORE_COLORS = ["", "score-1", "score-2", "score-3", "score-4", "score-5"];

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  const container = document.getElementById("evalCards");

  try {
    const res = await fetch(API_BASE_URL + "/evaluaties/student/mijn", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) throw new Error("API error " + res.status);
    const evaluaties = await res.json();

    const tussentijds = evaluaties.find(function (e) { return e.type === "tussentijds"; });
    const eind = evaluaties.find(function (e) { return e.type === "eind"; });

    container.innerHTML = renderEvalCard(tussentijds, "tussentijds") +
                          renderEvalCard(eind, "eind");

  } catch (err) {
    // Geen API beschikbaar of geen data: toon placeholder kaarten
    container.innerHTML = renderEvalCard(null, "tussentijds") +
                          renderEvalCard(null, "eind");
  }
});

function renderEvalCard(ev, type) {
  const isTussentijds = type === "tussentijds";
  const icon = isTussentijds ? "📊" : "🏆";
  const iconClass = isTussentijds ? "icon-blue" : "icon-green";
  const title = isTussentijds ? "Tussentijdse bespreking" : "Eindbeoordeling";
  const desc = isTussentijds
    ? "Feedback en competentiescores halverwege je stage"
    : "Definitieve scores en officieel eindcijfer na afronding";

  if (!ev) {
    return '<div class="eval-card disabled">' +
      '<div class="eval-card-header">' +
        '<div class="eval-card-icon ' + iconClass + '">' + icon + '</div>' +
        '<div>' +
          '<div class="eval-card-title">' + title + '</div>' +
          '<div class="eval-card-desc">' + desc + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="eval-card-footer">' +
        '<span class="badge badge-gray">Nog niet beschikbaar</span>' +
        '<span class="eval-card-arrow">›</span>' +
      '</div>' +
    '</div>';
  }

  const statusBadge = badgeVoorStatus(ev.status);
  const href = isTussentijds
    ? "tussentijdse-evaluatie.html?id=" + ev.id
    : "eind-evaluatie.html?id=" + ev.id;
  const meta = ev.datum_bespreking ? "Bespreking: " + formatDatum(ev.datum_bespreking) : "";

  return '<a href="' + href + '" class="eval-card">' +
    '<div class="eval-card-header">' +
      '<div class="eval-card-icon ' + iconClass + '">' + icon + '</div>' +
      '<div>' +
        '<div class="eval-card-title">' + title + '</div>' +
        '<div class="eval-card-desc">' + desc + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="eval-card-footer">' +
      statusBadge +
      (meta ? '<span class="eval-card-meta">' + meta + '</span>' : '') +
      '<span class="eval-card-arrow">›</span>' +
    '</div>' +
  '</a>';
}

function badgeVoorStatus(status) {
  if (status === "afgerond") return '<span class="badge badge-green">✓ Afgerond</span>';
  if (status === "ingediend") return '<span class="badge badge-blue">Ingediend</span>';
  return '<span class="badge badge-orange">Open</span>';
}

function formatDatum(d) {
  if (!d) return "—";
  const date = new Date(d);
  const maanden = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
  return date.getDate() + " " + maanden[date.getMonth()] + " " + date.getFullYear();
}
