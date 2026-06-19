// ============================================================
// stageovereenkomst-document.js
// StageMonitorage
//
// Verwacht endpoint:
// GET /api/stages/overeenkomst-document
// -> {
//   academiejaar, referentie,
//   student: { naam, studentnummer, opleiding, hogeschool },
//   onderneming: { naam, ondernemingsnr, adres, stagementor, begeleiderSchool },
//   periode: { startdatum, einddatum, totaalUren, werkdagen, werkuren, locatie },
//   artikels: { taken, rechtenPlichten, verplichtingen, verzekering,
//               evaluatie, beeindiging, toepasselijkRecht },
//   ondertekenaars: [
//     { naam, rol, status: "ondertekend" | "in_afwachting", datum, isHuidigeGebruiker }
//   ]
// }
//
// Onderteken-actie:
// POST /api/stages/overeenkomst-document/ondertekenen
// ============================================================

let huidigeStageId = null;

document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  laadOvereenkomst(token);
  initCanvas(token);

  document.getElementById("btnOndertekenen").addEventListener("click", openModal);
  document.getElementById("btnAnnuleer").addEventListener("click", sluitModal);
  document.getElementById("btnWissen").addEventListener("click", wisCanvas);
  document.getElementById("btnBevestig").addEventListener("click", function () {
    bevestigOndertekening(token);
  });
});

async function laadOvereenkomst(token) {
  try {
    const urlStageId = new URLSearchParams(window.location.search).get("stage_id");
    const endpoint = urlStageId
      ? API_BASE + "/stages/overeenkomst-document?stage_id=" + encodeURIComponent(urlStageId)
      : API_BASE + "/stages/overeenkomst-document";
    const res = await fetch(endpoint, {
      headers: { Authorization: "Bearer " + token },
    });

    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html";
      return;
    }
    if (!res.ok) throw new Error("Server gaf een foutstatus terug.");

    const d = await res.json();
    vulDocumentIn(d);
  } catch (err) {
    console.error("Kon overeenkomst niet laden:", err);
  }
}

function vulDocumentIn(d) {
  huidigeStageId = d.stage_id;
  document.getElementById("academiejaar").textContent = d.academiejaar;
  document.getElementById("academiejaarSub").textContent = d.academiejaar;
  document.getElementById("referentie").textContent = d.referentie;
  document.getElementById("docRef").textContent = d.referentie;

  document.getElementById("studentNaam").textContent = d.student.naam;
  document.getElementById("studentNummer").textContent = d.student.studentnummer;
  document.getElementById("opleiding").textContent = d.student.opleiding;
  document.getElementById("hogeschool").textContent = d.student.hogeschool;
  document.getElementById("onderneming").textContent = d.onderneming.naam;
  document.getElementById("ondernemingsnr").textContent = d.onderneming.ondernemingsnr;
  document.getElementById("adresOnderneming").textContent = d.onderneming.adres;
  document.getElementById("stagementor").textContent = d.onderneming.stagementor;
  document.getElementById("begeleiderSchool").textContent = d.onderneming.begeleiderSchool;

  document.getElementById("startdatum").textContent = d.periode.startdatum;
  document.getElementById("einddatum").textContent = d.periode.einddatum;
  document.getElementById("totaalUren").textContent = d.periode.totaalUren;
  document.getElementById("werkdagen").textContent = d.periode.werkdagen;
  document.getElementById("werkuren").textContent = d.periode.werkuren;
  document.getElementById("locatie").textContent = d.periode.locatie;

  document.getElementById("takenTekst").textContent = d.artikels.taken;
  document.getElementById("rechtenPlichtenTekst").textContent = d.artikels.rechtenPlichten;
  document.getElementById("verplichtingenTekst").textContent = d.artikels.verplichtingen;
  document.getElementById("verzekeringTekst").textContent = d.artikels.verzekering;
  document.getElementById("evaluatieTekst").textContent = d.artikels.evaluatie;
  document.getElementById("beeindigingTekst").textContent = d.artikels.beeindiging;
  document.getElementById("toepasselijkRechtTekst").textContent = d.artikels.toepasselijkRecht;

  vulOndertekenaarsIn(d.ondertekenaars);
}

function vulOndertekenaarsIn(ondertekenaars) {
  const lijst = document.getElementById("signerList");
  lijst.innerHTML = "";

  let huidigeGebruikerHeeftGetekend = false;

  ondertekenaars.forEach(function (s) {
    const row = document.createElement("div");
    row.className = "signer-row";

    const statusClass = s.status === "ondertekend" ? "ondertekend" : "in-afwachting";
    const statusTekst = s.status === "ondertekend"
      ? "Ondertekend op " + s.datum
      : "In afwachting";

    row.innerHTML =
      '<div class="signer-left">' +
        '<div class="signer-avatar" style="background:' + kleurVoorInitialen(s.naam) + '">' + initialen(s.naam) + '</div>' +
        '<div class="signer-info">' +
          '<strong>' + s.naam + '</strong>' +
          '<span>' + s.rol + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="signer-status ' + statusClass + '">' + statusTekst + '</span>';

    lijst.appendChild(row);

    if (s.isHuidigeGebruiker && s.status === "ondertekend") {
      huidigeGebruikerHeeftGetekend = true;
    }
  });

  const btn = document.getElementById("btnOndertekenen");
  if (huidigeGebruikerHeeftGetekend) {
    btn.disabled = true;
    btn.textContent = "Reeds ondertekend";
  }
}

let canvasCtx = null;
let canvasHeeftTekening = false;

function initCanvas(token) {
  const canvas = document.getElementById("signCanvas");
  canvasCtx = canvas.getContext("2d");
  canvasCtx.lineWidth = 2;
  canvasCtx.lineCap = "round";
  canvasCtx.strokeStyle = "#0f172a";

  let tekenen = false;

  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return {
      x: x * (canvas.width / rect.width),
      y: y * (canvas.height / rect.height)
    };
  }

  function start(e) {
    e.preventDefault();
    tekenen = true;
    canvasHeeftTekening = true;
    const p = pos(e);
    canvasCtx.beginPath();
    canvasCtx.moveTo(p.x, p.y);
  }
  function beweeg(e) {
    if (!tekenen) return;
    e.preventDefault();
    const p = pos(e);
    canvasCtx.lineTo(p.x, p.y);
    canvasCtx.stroke();
  }
  function stop() { tekenen = false; }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", beweeg);
  canvas.addEventListener("mouseup", stop);
  canvas.addEventListener("mouseleave", stop);
  canvas.addEventListener("touchstart", start);
  canvas.addEventListener("touchmove", beweeg);
  canvas.addEventListener("touchend", stop);
}

function openModal() {
  document.getElementById("signError").hidden = true;
  document.getElementById("signModal").hidden = false;
  wisCanvas();
}

function sluitModal() {
  document.getElementById("signModal").hidden = true;
}

function wisCanvas() {
  const canvas = document.getElementById("signCanvas");
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasHeeftTekening = false;
}

async function bevestigOndertekening(token) {
  const errEl = document.getElementById("signError");
  errEl.hidden = true;

  if (!canvasHeeftTekening) {
    errEl.textContent = "Plaats eerst een handtekening.";
    errEl.hidden = false;
    return;
  }
  if (!huidigeStageId) {
    errEl.textContent = "Geen stage gevonden.";
    errEl.hidden = false;
    return;
  }

  const bevestigBtn = document.getElementById("btnBevestig");
  bevestigBtn.disabled = true;
  bevestigBtn.textContent = "Bezig...";

  try {
    const png = document.getElementById("signCanvas").toDataURL("image/png");
    const res = await fetch(API_BASE + "/stages/" + huidigeStageId + "/onderteken", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ handtekening: png })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ondertekenen mislukt.");

    window.location.href = "../stageovereenkomst-ondertekend/stageovereenkomst-ondertekend.html";
  } catch (err) {
    console.error("Kon niet ondertekenen:", err);
    errEl.textContent = err.message || "Er ging iets mis.";
    errEl.hidden = false;
    bevestigBtn.disabled = false;
    bevestigBtn.textContent = "Bevestigen";
  }
}

function initialen(naam) {
  if (!naam) return "??";
  return naam.split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
}

function kleurVoorInitialen(naam) {
  const kleuren = ["#3b5bdb", "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];
  let som = 0;
  for (let i = 0; i < naam.length; i++) som += naam.charCodeAt(i);
  return kleuren[som % kleuren.length];
}