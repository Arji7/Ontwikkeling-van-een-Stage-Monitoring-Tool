const API_BASE_URL = API_BASE;

function authHeaders() {
  return { "Authorization": "Bearer " + sessionStorage.getItem("token") };
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-BE");
}

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  if (s === "ingediend")              return `<span class="badge badge-pending">wachten op goedkeuring</span>`;
  if (s === "aanpassingen_vereist")   return `<span class="badge badge-changes">Veranderingen Vereist</span>`;
  if (s === "goedgekeurd")            return `<span class="badge badge-active">Goedgekeurd</span>`;
  if (s === "afgekeurd")              return `<span class="badge badge-danger">Afgewezen</span>`;
  if (s === "actief")                 return `<span class="badge badge-active">Actief</span>`;
  if (s === "wacht_op_ondertekening") return `<span class="badge badge-signing">Wacht op ondertekening</span>`;
  if (s === "afgerond")               return `<span class="badge badge-completed">Afgerond</span>`;
  return `<span class="badge">${status}</span>`;
}

function progressBar(pct) {
  const p = pct ?? 0;
  return `<div class="progress-wrap">
    <div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div>
    <span class="progress-label">${p}%</span>
  </div>`;
}

function berekenProgress(start, eind) {
  if (!start || !eind) return 0;
  const nu = Date.now(), s = new Date(start).getTime(), e = new Date(eind).getTime();
  if (nu <= s) return 0;
  if (nu >= e) return 100;
  return Math.round(((nu - s) / (e - s)) * 100);
}

document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");
  if (!token) { window.location.href = "../../inloggen/inloggen.html"; return; }

  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const naam = user.name || "Admin";
  document.getElementById("adminVoornaam").textContent = naam.split(" ")[0];
  document.getElementById("sidebarUserName").textContent = naam;
  document.getElementById("sidebarUserAvatar").textContent =
    naam.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const rollen = (user.rollen || []).join(" + ") || user.rol || "Administratie";
  document.getElementById("sidebarRoles").textContent = rollen;
  document.getElementById("sidebarUserRole").textContent = rollen;

  laadDashboard(token);
});

async function laadDashboard() {
  try {
    const res = await fetch(API_BASE_URL + "/stages", { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html"; return;
    }
    if (!res.ok) throw new Error("Serverfout");
    verwerkData(await res.json());
  } catch (err) {
    console.error("Dashboard laden fout:", err);
  }
}

function verwerkData(stages) {
  document.getElementById("statAanvragen").textContent =
    stages.filter(s => s.status === "ingediend").length;
  document.getElementById("statActief").textContent =
    stages.filter(s => s.status === "actief").length;
  document.getElementById("statLogboeken").textContent = "—";
  document.getElementById("statAfgerond").textContent =
    stages.filter(s => s.status === "afgerond").length;

  // Recente aanvragen
  const recente = stages
    .filter(s => ["ingediend", "aanpassingen_vereist"].includes(s.status))
    .sort((a, b) => new Date(b.aangemaakt_op) - new Date(a.aangemaakt_op))
    .slice(0, 5);

  const aanvragenBody = document.getElementById("recenteAanvragenBody");
  aanvragenBody.innerHTML = recente.length === 0
    ? `<tr><td colspan="5" class="table-empty">Geen openstaande aanvragen</td></tr>`
    : recente.map(s => {
        const naam   = `${s.student_voornaam ?? ""} ${s.student_achternaam ?? ""}`.trim() || "—";
        const docent = (s.docent_voornaam || s.docent_achternaam)
          ? `${s.docent_voornaam ?? ""} ${s.docent_achternaam ?? ""}`.trim() : "—";
        return `<tr onclick="window.location.href='../aanvraag-detail/aanvraag-detail.html?id=${s.id}'">
          <td>${naam}</td>
          <td>${s.bedrijf_naam ?? "—"}</td>
          <td>${docent}</td>
          <td>${formatDate(s.aangemaakt_op)}</td>
          <td>${statusBadge(s.status)}</td>
        </tr>`;
      }).join("");

  // Stages overzicht
  const overzicht = stages
    .filter(s => ["actief", "wacht_op_ondertekening", "afgerond"].includes(s.status))
    .sort((a, b) => new Date(b.startdatum) - new Date(a.startdatum))
    .slice(0, 5);

  const overzichtBody = document.getElementById("stagesOverzichtBody");
  overzichtBody.innerHTML = overzicht.length === 0
    ? `<tr><td colspan="6" class="table-empty">Geen actieve stages</td></tr>`
    : overzicht.map(s => {
        const naam = `${s.student_voornaam ?? ""} ${s.student_achternaam ?? ""}`.trim() || "—";
        return `<tr>
          <td>${naam}</td>
          <td>${s.bedrijf_naam ?? "—"}</td>
          <td>${statusBadge(s.status)}</td>
          <td>${progressBar(berekenProgress(s.startdatum, s.einddatum))}</td>
          <td>${formatDate(s.startdatum)}</td>
          <td>${formatDate(s.einddatum)}</td>
        </tr>`;
      }).join("");
}