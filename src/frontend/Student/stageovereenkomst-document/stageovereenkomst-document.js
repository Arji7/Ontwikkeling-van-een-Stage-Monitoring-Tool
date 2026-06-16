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

const API_BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    console.warn("Geen token — scherm blijft leeg tot login werkt.");
    return;
  }

  laadOvereenkomst(token);

  document.getElementById("btnOndertekenen").addEventListener("click", function () {
    ondertekenen(token);
  });
});

async function laadOvereenkomst(token) {
  try {
    const res = await fetch(API_BASE_URL + "/stages/overeenkomst-document", {
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

async function ondertekenen(token) {
  const btn = document.getElementById("btnOndertekenen");
  btn.disabled = true;
  btn.textContent = "Bezig...";

  try {
    const res = await fetch(API_BASE_URL + "/stages/overeenkomst-document/ondertekenen", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) throw new Error("Ondertekenen mislukt.");

    // Doorsturen naar bevestigingsscherm
   window.location.href = "../stageovereenkomst-ondertekend/stageovereenkomst-ondertekend.html";

  } catch (err) {
    console.error("Kon niet ondertekenen:", err);
    btn.disabled = false;
    btn.textContent = "Ondertekenen";
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