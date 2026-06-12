var API_BASE_URL = "http://localhost:3000/api";
var DAGEN_NAMEN = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
var VERWACHTE_UREN = 38;

// State
var activeDag = 0;
var dagenData = [
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false },
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false },
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false },
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false },
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false }
];
var geselecteerdeComps = []; // array van competentie-id's
var alleCompetenties = [];   // [{ id, naam, ... }]
var isReadonly = false;
var bestaandLogboekId = null;
var weekNummer = 1;
var datumVan = null;
var datumTot = null;
var aantalDagenDezeWeek = 5;   // standaard 5; minder bij laatste week van stage

document.addEventListener("DOMContentLoaded", function () {
  var token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  var params = new URLSearchParams(window.location.search);
  isReadonly = params.get("readonly") === "1";
  bestaandLogboekId = params.get("id");
  weekNummer = parseInt(params.get("week")) || 1;

  laadCompetenties().then(function () {
    if (bestaandLogboekId) {
      laadBestaandLogboek(bestaandLogboekId);
    } else {
      initNieuwLogboek(weekNummer);
    }
  });

  setupDayTabs();
  setupDagOpslaan();
  setupIndienen();
});

async function laadCompetenties() {
  try {
    var res = await fetch(API_BASE_URL + "/competenties", { headers: authHeaders() });
    if (!res.ok) return;
    alleCompetenties = await res.json();
    renderCompetenties();
  } catch (err) {
    console.error("Competenties ophalen fout:", err);
  }
}

function renderCompetenties() {
  var wrap = document.getElementById("competentiesWrap");
  wrap.innerHTML = "";
  alleCompetenties.forEach(function (comp) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "comp-toggle";
    btn.setAttribute("data-id", comp.id);
    btn.textContent = comp.naam;
    btn.addEventListener("click", function () {
      if (isReadonly) return;
      var idx = geselecteerdeComps.indexOf(comp.id);
      if (idx === -1) {
        geselecteerdeComps.push(comp.id);
        btn.classList.add("selected");
        btn.textContent = "✓ " + comp.naam;
      } else {
        geselecteerdeComps.splice(idx, 1);
        btn.classList.remove("selected");
        btn.textContent = comp.naam;
      }
    });
    wrap.appendChild(btn);
  });
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem("token")
  };
}

// ── Nieuw logboek setup ──
async function initNieuwLogboek(week) {
  weekNummer = week;
  document.getElementById("formTitle").textContent = "Logboek week " + week;
  document.getElementById("breadcrumbText").textContent = "Nieuw logboek";

  // Stage info ophalen om week-datums correct te berekenen
  try {
    var res = await fetch(API_BASE_URL + "/logboeken/mijn/overzicht", { headers: authHeaders() });
    if (!res.ok) throw new Error("kon overzicht niet ophalen");
    var overzicht = await res.json();

    if (!overzicht.startdatum) {
      alert("Geen goedgekeurde stage gevonden.");
      window.location.href = "logboeken.html";
      return;
    }

    // Week N start op stage_startdatum + (week - 1) * 7 dagen
    var maandag = new Date(overzicht.startdatum);
    maandag.setDate(maandag.getDate() + (week - 1) * 7);
    var vrijdag = new Date(maandag);
    vrijdag.setDate(vrijdag.getDate() + 4);

    // Als de einddatum van de stage vóór vrijdag valt → laatste week, minder dagen
    var einddatum = new Date(overzicht.einddatum);
    if (vrijdag > einddatum) {
      vrijdag = new Date(einddatum);
    }

    datumVan = formatISO(maandag);
    datumTot = formatISO(vrijdag);

    // Aantal werkdagen deze week berekenen
    var verschilMs = vrijdag - maandag;
    aantalDagenDezeWeek = Math.floor(verschilMs / (1000 * 60 * 60 * 24)) + 1;
    if (aantalDagenDezeWeek < 1) aantalDagenDezeWeek = 1;
    if (aantalDagenDezeWeek > 5) aantalDagenDezeWeek = 5;

    document.getElementById("formSubtitle").textContent =
      "Week van " + formatDateLong(maandag) + " t.e.m. " + formatDateLong(vrijdag);

    // Verberg dag-tabs die buiten deze week vallen
    verbergExtraDagen();

  } catch (err) {
    console.error("Stage info ophalen fout:", err);
    document.getElementById("formSubtitle").textContent = "Kon stage info niet laden.";
  }

  updateUI();
}

// Verberg dag-tabs voorbij `aantalDagenDezeWeek`
function verbergExtraDagen() {
  for (var i = 0; i < 5; i++) {
    var tab = document.querySelector('.day-tab[data-dag="' + i + '"]');
    if (!tab) continue;
    tab.style.display = i < aantalDagenDezeWeek ? "" : "none";
  }
  // Als active tab nu verborgen is → reset naar eerste dag
  if (activeDag >= aantalDagenDezeWeek) activeDag = 0;
}

// ── Bestaand logboek laden ──
async function laadBestaandLogboek(id) {
  try {
    var res = await fetch(API_BASE_URL + "/logboeken/" + id, {
      headers: authHeaders()
    });
    if (!res.ok) {
      alert("Logboek niet gevonden.");
      window.location.href = "logboeken.html";
      return;
    }
    var data = await res.json();

    weekNummer = data.week_nummer;
    datumVan = data.datum_van;
    datumTot = data.datum_tot;

    document.getElementById("formTitle").textContent = "Logboek week " + weekNummer;
    document.getElementById("breadcrumbText").textContent = "Logboek";
    document.getElementById("formSubtitle").textContent =
      "Week van " + formatDateLong(new Date(datumVan)) + " t.e.m. " + formatDateLong(new Date(datumTot));

    // Dagen invullen
    if (data.dagen && data.dagen.length > 0) {
      data.dagen.forEach(function (dag) {
        var d = new Date(dag.datum);
        var dagIndex = d.getDay() - 1; // 0=ma, 1=di, ...
        if (dagIndex >= 0 && dagIndex < 5) {
          dagenData[dagIndex] = {
            uren: parseFloat(dag.uren_gewerkt) || 0,
            taken: dag.uitgevoerde_taken || "",
            afwezig: dag.is_afwezig || false,
            reden: dag.afwezig_reden || null,
            saved: true
          };
        }
      });
    }

    // Week velden invullen
    document.getElementById("weekTaken").value = data.uitgevoerde_taken || "";
    document.getElementById("weekReflectie").value = data.leerpunten || "";

    // Geselecteerde competenties markeren
    if (Array.isArray(data.competenties)) {
      data.competenties.forEach(function (comp) {
        geselecteerdeComps.push(comp.id);
        var btn = document.querySelector('.comp-toggle[data-id="' + comp.id + '"]');
        if (btn) {
          btn.classList.add("selected");
          btn.textContent = "✓ " + comp.naam;
        }
      });
    }

    // Readonly mode
    if (isReadonly) {
      document.getElementById("dayForm").querySelectorAll("input, textarea, button").forEach(function (el) {
        el.disabled = true;
      });
      document.getElementById("weekTaken").disabled = true;
      document.getElementById("weekReflectie").disabled = true;
      document.getElementById("btnDagOpslaan").style.display = "none";
      document.getElementById("btnIndienen").style.display = "none";
      document.getElementById("breadcrumbText").textContent = "Logboek";
      var label = document.querySelector(".section-label");
      if (label) label.textContent = "Dagelijkse overzicht";
    }

    updateUI();
  } catch (err) {
    console.error("Logboek laden fout:", err);
    alert("Fout bij laden van logboek.");
  }
}

// ── Day tabs ──
function setupDayTabs() {
  var tabs = document.querySelectorAll(".day-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      // Sla huidige dag op in memory
      saveDagToMemory();
      activeDag = parseInt(tab.getAttribute("data-dag"));
      updateUI();
    });
  });
}

function saveDagToMemory() {
  var uren = parseFloat(document.getElementById("dagUren").value) || 0;
  var taken = document.getElementById("dagTaken").value || "";
  var afwezig = document.getElementById("dagAfwezig").checked;
  dagenData[activeDag].uren = uren;
  dagenData[activeDag].taken = taken;
  dagenData[activeDag].afwezig = afwezig;
}

function setupDagOpslaan() {
  document.getElementById("btnDagOpslaan").addEventListener("click", function () {
    saveDagToMemory();
    dagenData[activeDag].saved = true;
    updateUI();

    // Ga naar volgende dag als die er is
    if (activeDag < 4) {
      activeDag++;
      updateUI();
    }
  });
}

// ── Indienen ──
function setupIndienen() {
  document.getElementById("btnIndienen").addEventListener("click", async function () {
    saveDagToMemory();

    // Mag pas indienen vanaf de laatste werkdag van deze week
    if (datumTot) {
      var vandaag = new Date();
      vandaag.setHours(0, 0, 0, 0);
      var laatsteWerkdag = new Date(datumTot);
      laatsteWerkdag.setHours(0, 0, 0, 0);
      if (vandaag < laatsteWerkdag) {
        alert("Je kan dit logboek pas indienen vanaf " + formatDateLong(laatsteWerkdag) + " (einde werkweek).");
        return;
      }
    }

    var weekTaken = document.getElementById("weekTaken").value.trim();
    if (!weekTaken) {
      alert("Vul de uitgevoerde taken (weekoverzicht) in.");
      return;
    }
    if (geselecteerdeComps.length === 0) {
      alert("Selecteer minstens 1 competentie.");
      return;
    }

    // Bouw dagen array — alleen de werkdagen van deze week
    var dagen = [];
    var startDate = datumVan ? new Date(datumVan) : new Date();
    for (var i = 0; i < aantalDagenDezeWeek; i++) {
      var dagDate = new Date(startDate);
      dagDate.setDate(dagDate.getDate() + i);
      dagen.push({
        datum: formatISO(dagDate),
        uren_gewerkt: dagenData[i].uren,
        uitgevoerde_taken: dagenData[i].taken,
        is_afwezig: dagenData[i].afwezig,
        afwezig_reden: dagenData[i].afwezig ? "verlof" : null
      });
    }

    var body = {
      week_nummer: weekNummer,
      titel: document.getElementById("weekTaken").value.trim().substring(0, 80),
      datum_van: datumVan,
      datum_tot: datumTot,
      uitgevoerde_taken: weekTaken,
      leerpunten: document.getElementById("weekReflectie").value.trim(),
      dagen: dagen,
      competenties: geselecteerdeComps
    };

    try {
      var url, method;
      if (bestaandLogboekId) {
        url = API_BASE_URL + "/logboeken/" + bestaandLogboekId;
        method = "PUT";
      } else {
        url = API_BASE_URL + "/logboeken";
        method = "POST";
      }

      var res = await fetch(url, {
        method: method,
        headers: authHeaders(),
        body: JSON.stringify(body)
      });

      var data = await res.json();
      if (!res.ok) {
        alert("Fout: " + (data.error || "Onbekende fout"));
        return;
      }

      var logboekId = bestaandLogboekId || data.id;

      // Nu indienen
      var res2 = await fetch(API_BASE_URL + "/logboeken/" + logboekId + "/indienen", {
        method: "POST",
        headers: authHeaders()
      });

      if (!res2.ok) {
        var err2 = await res2.json();
        alert("Fout bij indienen: " + (err2.error || "Onbekende fout"));
        return;
      }

      // Vertaal id's naar namen voor het bevestigingsscherm
      var compNamen = geselecteerdeComps.map(function (id) {
        var c = alleCompetenties.find(function (x) { return x.id === id; });
        return c ? c.naam : "";
      }).filter(function (n) { return n; }).join(", ");

      window.location.href = "logboek-bevestiging.html?week=" + weekNummer +
        "&uren=" + berekenTotaalUren() +
        "&comps=" + encodeURIComponent(compNamen);

    } catch (err) {
      console.error("Indienen fout:", err);
      alert("Geen verbinding met server. Staat de backend aan?");
    }
  });
}

// ── UI updaten ──
function updateUI() {
  // Tabs updaten
  var tabs = document.querySelectorAll(".day-tab");
  tabs.forEach(function (tab, i) {
    tab.classList.remove("active");
    if (i === activeDag) tab.classList.add("active");

    var hoursSpan = tab.querySelector(".day-tab-hours");
    if (dagenData[i].saved && dagenData[i].uren > 0) {
      hoursSpan.textContent = dagenData[i].uren + "u";
      tab.classList.add("filled");
    } else if (dagenData[i].saved && dagenData[i].afwezig) {
      hoursSpan.textContent = "Afwezig";
      tab.classList.add("filled");
    } else {
      hoursSpan.textContent = "—";
      tab.classList.remove("filled");
    }
  });

  // Dag formulier vullen — expliciet resetten
  document.getElementById("dayFormTitle").textContent = DAGEN_NAMEN[activeDag];
  var urenInput = document.getElementById("dagUren");
  var takenInput = document.getElementById("dagTaken");
  var afwezigInput = document.getElementById("dagAfwezig");
  if (dagenData[activeDag].saved) {
    urenInput.value = dagenData[activeDag].uren;
    takenInput.value = dagenData[activeDag].taken;
    afwezigInput.checked = dagenData[activeDag].afwezig;
  } else {
    urenInput.value = "";
    takenInput.value = "";
    afwezigInput.checked = false;
  }

  // Datum bij dag titel
  if (datumVan) {
    var dagDatum = new Date(datumVan);
    dagDatum.setDate(dagDatum.getDate() + activeDag);
    document.getElementById("dayFormTitle").textContent =
      DAGEN_NAMEN[activeDag] + " " + dagDatum.getDate() + " " +
      ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"][dagDatum.getMonth()];
  }

  // Week uren
  var totaal = berekenTotaalUren();
  document.getElementById("weekUren").value = totaal + " uur";

  // Progress bar — verwachte uren proportioneel met aantal werkdagen
  var verwachtDezeWeek = Math.round((VERWACHTE_UREN / 5) * aantalDagenDezeWeek);
  var pct = Math.min(100, Math.round((totaal / verwachtDezeWeek) * 100));
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressText").textContent = totaal + "u / ~" + verwachtDezeWeek + "u verwacht";

  // Indienen knop tonen als minstens 1 dag opgeslagen en niet readonly
  var dagenOpgeslagen = dagenData.filter(function (d) { return d.saved; }).length;
  if (dagenOpgeslagen > 0 && !isReadonly) {
    document.getElementById("btnIndienen").style.display = "inline-flex";
  }
}

function berekenTotaalUren() {
  var totaal = 0;
  // Alleen opgeslagen dagen tellen mee in het totaal.
  // Tab-click slaat tijdelijk op in memory, maar `saved` wordt pas true
  // na klikken op "Opslaan dag".
  dagenData.forEach(function (d) {
    if (d.saved) totaal += d.uren || 0;
  });
  return totaal;
}

// ── Formatters ──
function formatISO(date) {
  var d = new Date(date);
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function formatDateLong(date) {
  var d = new Date(date);
  var dag = d.getDate();
  var maanden = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  return dag + " " + maanden[d.getMonth()] + " " + d.getFullYear();
}
