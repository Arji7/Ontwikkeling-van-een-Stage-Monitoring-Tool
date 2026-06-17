document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }
  laadOvereenkomstData(token);
});

async function laadOvereenkomstData(token) {
  try {
    const res = await fetch(API_BASE + "/stages/overeenkomst-document", {
      headers: { Authorization: "Bearer " + token }
    });
    if (res.status === 401 || res.status === 403) {
      window.location.href = "../../inloggen/inloggen.html";
      return;
    }
    if (!res.ok) throw new Error("Server gaf een foutstatus terug.");
    const d = await res.json();
    vulOvereenkomstIn(d);
  } catch (err) {
    console.error("Kon overeenkomstgegevens niet laden:", err);
  }
}

function vulOvereenkomstIn(d) {
  const tekens = d.ondertekenaars || [];
  const student = tekens.find(t => t.rol === "Student");
  const mentor  = tekens.find(t => t.rol === "Stagementor");
  const studentGetekend = student && student.status === "ondertekend";
  const mentorGetekend  = mentor  && mentor.status  === "ondertekend";
  const alleGetekend = studentGetekend && mentorGetekend;

  const titleEl = document.querySelector(".confirm-title");
  const statusEl = document.getElementById("statusValue");

  if (alleGetekend) {
    if (titleEl) titleEl.textContent = "Stageovereenkomst volledig ondertekend!";
    statusEl.textContent = "✓ Stage actief";
  } else if (studentGetekend) {
    if (titleEl) titleEl.textContent = "Je handtekening is geregistreerd";
    statusEl.textContent = "🕐 Wacht op handtekening mentor";
  } else if (mentorGetekend) {
    if (titleEl) titleEl.textContent = "Mentor heeft getekend";
    statusEl.textContent = "🕐 Wacht op handtekening student";
  } else {
    statusEl.textContent = "🕐 Nog niet ondertekend";
  }

  const ingediendOnder = student && student.datum ? student.datum : (mentor && mentor.datum ? mentor.datum : "—");
  document.getElementById("ingediendOp").textContent = ingediendOnder;
  document.getElementById("bedrijf").textContent = (d.onderneming && d.onderneming.naam) || "—";

  const start = d.periode && d.periode.startdatum ? formatDatum(d.periode.startdatum) : "—";
  const eind  = d.periode && d.periode.einddatum  ? formatDatum(d.periode.einddatum)  : "—";
  document.getElementById("periode").textContent = start + " — " + eind;
}

function formatDatum(d) {
  if (!d || d === "—") return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return String(date.getDate()).padStart(2, "0") + "/" +
         String(date.getMonth() + 1).padStart(2, "0") + "/" +
         date.getFullYear();
}
