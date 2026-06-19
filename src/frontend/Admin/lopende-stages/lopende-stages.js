const API_BASE_URL = API_BASE;
let alleStages = [];
let huidigFilter = "alle";
let zoekterm = "";

function authHeaders() {
  return { "Authorization": "Bearer " + sessionStorage.getItem("token") };
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-BE");
}

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  if (s === "actief")                 return `<span class="badge badge-active">Actief</span>`;
  if (s === "wacht_op_ondertekening") return `<span class="badge badge-pending">wacht op ondertekening</span>`;
  if (s === "afgerond")               return `<span class="badge badge-completed">Afgerond</span>`;
  return `<span class="badge">${status}</span>`;
}

document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");
  if (!token) { window.location.href = "../../inloggen/inloggen.html"; return; }

  const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
  const naam = user.name || "Admin";
  document.getElementById("sidebarUserName").textContent = naam;
  document.getElementById("sidebarUserAvatar").textContent =
    naam.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const rollen = (user.rollen || []).join(" + ") || user.rol || "Administratie";
  document.getElementById("sidebarRoles").textContent = rollen;
  document.getElementById("sidebarUserRole").textContent = rollen;

  document.getElementById("searchInput").addEventListener("input", function () {
    zoekterm = this.value.toLowerCase();
    renderTabel();
  });

  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      huidigFilter = btn.dataset.filter;
      renderTabel();
    });
  });

  laadStages();
});

async function laadStages() {
  try {
    const res = await fetch(API_BASE_URL + "/stages", { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html"; return;
    }
    if (!res.ok) throw new Error("Serverfout");

    const stages = await res.json();
    alleStages = stages.filter(s =>
      ["actief", "wacht_op_ondertekening", "afgerond"].includes(s.status)
    );
    updateTabCounts();
    renderTabel();
  } catch (err) {
    console.error("Stages laden fout:", err);
    document.getElementById("stagesBody").innerHTML =
      `<tr><td colspan="6" class="table-empty">Fout bij laden — staat de backend aan?</td></tr>`;
  }
}

function updateTabCounts() {
  document.getElementById("tabAlleCount").textContent = alleStages.length;
  document.getElementById("tabWachtCount").textContent =
    alleStages.filter(s => s.status === "wacht_op_ondertekening").length;
  document.getElementById("tabActiefCount").textContent =
    alleStages.filter(s => s.status === "actief").length;
  document.getElementById("tabAfgerondCount").textContent =
    alleStages.filter(s => s.status === "afgerond").length;
}

function renderTabel() {
  let gefilterd = alleStages;
  if (huidigFilter !== "alle") gefilterd = gefilterd.filter(s => s.status === huidigFilter);
  if (zoekterm) {
    gefilterd = gefilterd.filter(s => {
      const naam   = `${s.student_voornaam ?? ""} ${s.student_achternaam ?? ""}`.toLowerCase();
      const mentor = (s.mentor_naam || s.contact_naam || "").toLowerCase();
      const docent = `${s.docent_voornaam ?? ""} ${s.docent_achternaam ?? ""}`.toLowerCase();
      return naam.includes(zoekterm)
          || (s.bedrijf_naam ?? "").toLowerCase().includes(zoekterm)
          || mentor.includes(zoekterm)
          || docent.includes(zoekterm);
    });
  }

  const tbody = document.getElementById("stagesBody");
  if (gefilterd.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Geen stages gevonden</td></tr>`;
    return;
  }

  tbody.innerHTML = gefilterd
    .sort((a, b) => new Date(b.startdatum) - new Date(a.startdatum))
    .map(s => {
      const naam   = `${s.student_voornaam ?? ""} ${s.student_achternaam ?? ""}`.trim() || "—";
      const mentor = s.mentor_naam || s.contact_naam || "—";
      const docent = (s.docent_voornaam || s.docent_achternaam)
        ? `${s.docent_voornaam ?? ""} ${s.docent_achternaam ?? ""}`.trim() : "—";
      const periode = (s.startdatum && s.einddatum)
        ? `${formatDate(s.startdatum)} — ${formatDate(s.einddatum)}` : "—";
      return `<tr>
        <td>${naam}</td>
        <td>${s.bedrijf_naam ?? "—"}</td>
        <td>${mentor}</td>
        <td>${docent}</td>
        <td>${periode}</td>
        <td>${statusBadge(s.status)}</td>
      </tr>`;
    }).join("");
}